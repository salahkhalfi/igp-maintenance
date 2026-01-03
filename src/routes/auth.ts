// Routes d'authentification
// Refactored to use Drizzle ORM + Zod Validation

import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import { eq, sql } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { getDb } from '../db';
import { users, chatGuests } from '../db/schema';
import { hashPassword, verifyPassword, isLegacyHash, upgradeLegacyHash } from '../utils/password';
import { signToken } from '../utils/jwt';
import { loginSchema, registerSchema } from '../schemas/auth';
import type { Bindings } from '../types';

import { validateFileUpload } from '../utils/validation';

const auth = new Hono<{ Bindings: Bindings }>();

// POST /api/auth/avatar - Upload user avatar (Protected)
// Note: authMiddleware must be imported if not globally applied, checking imports...
import { authMiddleware } from '../middlewares/auth';
import { strictRateLimit } from '../middlewares/rateLimit';
import { audit, getClientInfo } from '../utils/audit';

auth.post('/avatar', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ error: 'Aucun fichier fourni' }, 400);
    }

    // Validation simple
    if (!file.type.startsWith('image/')) {
      return c.json({ error: 'Seules les images sont autorisées' }, 400);
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return c.json({ error: 'Image trop volumineuse (max 5MB)' }, 400);
    }

    // Generate unique key with random component to prevent caching issues
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileExt = file.name.split('.').pop() || 'jpg';
    // Use a clean filename
    const fileKey = `avatars/${user.userId}/${timestamp}-${randomStr}.${fileExt}`;

    const db = getDb(c.env);

    // 1. Récupérer l'ancienne clé d'avatar pour le nettoyage
    const currentUser = await db.select({ avatar_key: users.avatar_key })
        .from(users)
        .where(eq(users.id, user.userId))
        .get();

    // Upload to R2
    try {
        await c.env.MEDIA_BUCKET.put(fileKey, await file.arrayBuffer(), {
          httpMetadata: {
            contentType: file.type,
            cacheControl: 'public, max-age=31536000', // Cache aggressively, we use unique names
          },
        });
    } catch (r2Error) {
        console.error('R2 Upload Error:', r2Error);
        return c.json({ error: 'Erreur de stockage (R2)' }, 500);
    }

    // Update DB
    await db.update(users)
      .set({ avatar_key: fileKey, updated_at: sql`CURRENT_TIMESTAMP` })
      .where(eq(users.id, user.userId));

    // 🧹 CLEANUP: Supprimer l'ancien fichier de R2 (Désactivé temporairement pour éviter les 404 côté client si le cache n'est pas à jour)
    /*
    if (currentUser?.avatar_key) {
        console.log(`Cleaning up old avatar: ${currentUser.avatar_key}`);
        c.executionCtx.waitUntil(
            c.env.MEDIA_BUCKET.delete(currentUser.avatar_key)
                .catch(err => console.error('Failed to delete old avatar:', err))
        );
    }
    */

    return c.json({ success: true, avatar_key: fileKey });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return c.json({ error: 'Erreur serveur lors de l\'upload' }, 500);
  }
});

// DELETE /api/auth/avatar - Supprimer l'avatar (et le fichier R2)
auth.delete('/avatar', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;
    const db = getDb(c.env);

    // 1. Récupérer la clé actuelle
    const currentUser = await db.select({ avatar_key: users.avatar_key })
      .from(users)
      .where(eq(users.id, user.userId))
      .get();

    if (currentUser?.avatar_key) {
      // 2. Supprimer de R2
      console.log(`Deleting avatar for user ${user.userId}: ${currentUser.avatar_key}`);
      await c.env.MEDIA_BUCKET.delete(currentUser.avatar_key);
    }

    // 3. Mettre à jour la DB (avatar_key -> null)
    await db.update(users)
      .set({ avatar_key: null, updated_at: sql`CURRENT_TIMESTAMP` })
      .where(eq(users.id, user.userId));

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete avatar error:', error);
    return c.json({ error: 'Erreur serveur lors de la suppression' }, 500);
  }
});

// Helper pour générer un SVG d'avatar par défaut
function generateAvatarSvg(name: string) {
  const initials = (name || '?').trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase();
  // Palette de couleurs "Premium" (inspirée du frontend)
  const colors = ['#e11d48', '#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const color = colors[Math.abs(hash) % colors.length];
  
  return `
  <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1f2937;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="200" height="200" fill="url(#grad)" />
    <text x="50%" y="50%" dy=".35em" text-anchor="middle" fill="white" font-family="'Inter', sans-serif" font-weight="bold" font-size="80">${initials}</text>
  </svg>`.trim();
}

// GET /api/auth/avatar/:userId - Serve avatar (Public/Protected depends on need, keeping it simple)
auth.get('/avatar/:userId', async (c) => {
  try {
    const userIdStr = c.req.param('userId');
    const userId = parseInt(userIdStr);
    
    // Cache strategy: short cache + must-revalidate to prevent stale images
    const CACHE_HEADERS_SVG = { 
      'Content-Type': 'image/svg+xml', 
      'Cache-Control': 'public, max-age=300, must-revalidate',  // 5 min cache, revalidate after
      'Vary': 'Accept'
    };
    
    // If invalid ID, return generic SVG immediately (200 OK)
    if (isNaN(userId)) {
        return new Response(generateAvatarSvg('?'), { headers: CACHE_HEADERS_SVG });
    }

    const db = getDb(c.env);
    let user;
    
    try {
        user = await db.select({ 
          full_name: users.full_name,
          avatar_key: users.avatar_key 
        }).from(users).where(eq(users.id, userId)).get();
    } catch (dbError) {
        console.error('DB Error fetching user avatar:', dbError);
        return new Response(generateAvatarSvg('?'), { 
            headers: { ...CACHE_HEADERS_SVG, 'Cache-Control': 'no-store' } 
        });
    }

    // Si utilisateur introuvable or no avatar key
    if (!user || !user.avatar_key) {
        const name = user ? user.full_name : '?';
        const svg = generateAvatarSvg(name);
        // Generate ETag from SVG content for proper caching
        const etag = `"svg-${userId}-${name?.charAt(0) || 'x'}"`;
        return new Response(svg, {
            headers: { 
              ...CACHE_HEADERS_SVG, 
              'ETag': etag
            }
        });
    }

    // Si avatar_key existe, essayer de le charger depuis R2
    try {
        const object = await c.env.MEDIA_BUCKET.get(user.avatar_key);
        
        if (object) {
            const headers = new Headers();
            object.writeHttpMetadata(headers);
            headers.set('ETag', object.httpEtag);
            // Cache with avatar_key as version - if key changes, URL changes = cache bust
            headers.set('Cache-Control', 'public, max-age=86400, must-revalidate'); // 1 day + revalidate
            headers.set('Vary', 'Accept');
            
            return new Response(object.body, { headers });
        } else {
            console.warn(`Avatar file missing in R2 for user ${userId} (key: ${user.avatar_key}), serving fallback.`);
        }
    } catch (r2Error) {
        console.error('R2 Fetch Error:', r2Error);
    }

    // Fallback final: Retourner un SVG généré (200 OK, no-store to prevent caching bad state)
    const svg = generateAvatarSvg(user.full_name);
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-store',  // Don't cache fallback - might be temporary R2 issue
      }
    });

  } catch (error) {
    console.error('Avatar fetch critical error:', error);
    // En cas d'erreur grave, retourner quand même le SVG générique
    return new Response(generateAvatarSvg('?'), { 
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' } 
    });
  }
});

// POST /api/auth/register - Inscription (Rate limited: 5 attempts/minute)
auth.post('/register', strictRateLimit, zValidator('json', registerSchema), async (c) => {
  try {
    const { email, password, first_name, last_name, role } = c.req.valid('json');
    const db = getDb(c.env);

    console.log('[REGISTER] Received:', { email, has_password: !!password, first_name, last_name, role });

    // Prevent "Undefined" string
    if (first_name === 'Undefined' || first_name === 'undefined') {
      return c.json({ error: 'Prénom invalide' }, 400);
    }

    // Construire full_name pour compatibilité
    const full_name = last_name ? `${first_name} ${last_name}` : first_name;

    // Vérifier si l'email existe déjà
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (existing) {
      return c.json({ error: 'Cet email est déjà utilisé' }, 409);
    }

    // Hasher le mot de passe
    const password_hash = await hashPassword(password);

    // Créer l'utilisateur
    const result = await db.insert(users).values({
      email,
      password_hash,
      full_name,
      first_name,
      last_name: last_name || null,
      role,
      created_at: sql`CURRENT_TIMESTAMP`,
      updated_at: sql`CURRENT_TIMESTAMP`
    }).returning();

    const newUser = result[0];

    if (!newUser) {
      return c.json({ error: 'Erreur lors de la création du compte' }, 500);
    }

    // Générer le token JWT
    const token = await signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      full_name: newUser.full_name,
      first_name: newUser.first_name || newUser.full_name,
      last_name: newUser.last_name || '',
      isSuperAdmin: newUser.is_super_admin === 1
    });

    return c.json({ token, user: newUser }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// POST /api/auth/login - Connexion (Rate limited: 5 attempts/minute)
auth.post('/login', strictRateLimit, zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password, rememberMe } = c.req.valid('json');
    const db = getDb(c.env);

    // Récupérer l'utilisateur (Standard User) - exclure les soft-deleted
    const user = await db
      .select()
      .from(users)
      .where(sql`${users.email} = ${email} AND ${users.deleted_at} IS NULL`)
      .get();

    // 1. Try Standard User
    if (user) {
        // Vérifier le mot de passe
        const isValid = await verifyPassword(password, user.password_hash);
        if (!isValid) {
          return c.json({ error: 'Email ou mot de passe incorrect' }, 401);
        }

        // 🔒 MIGRATION AUTOMATIQUE: Mettre à jour l'ancien hash vers PBKDF2
        if (isLegacyHash(user.password_hash)) {
          try {
            const newHash = await upgradeLegacyHash(password);
            await db
              .update(users)
              .set({ password_hash: newHash, updated_at: sql`CURRENT_TIMESTAMP` })
              .where(eq(users.id, user.id));
            console.log(`Password upgraded for user ${user.email} (SHA-256 → PBKDF2)`);
          } catch (error) {
            console.error('Failed to upgrade password hash:', error);
          }
        }

        // 📅 MISE À JOUR LAST_LOGIN
        try {
          await db
            .update(users)
            .set({ last_login: sql`CURRENT_TIMESTAMP` })
            .where(eq(users.id, user.id));
        } catch (error) {
          console.error("Failed to update last_login:", error);
        }

        // Retirer le hash du mot de passe
        const { password_hash, ...userWithoutPassword } = user;

        // Expiration dynamique selon Remember Me
        const expiresInDays = rememberMe ? 30 : 7;
        const expiresInSeconds = expiresInDays * 24 * 60 * 60;

        // Générer le token JWT
        const token = await signToken({
          userId: user.id,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
          first_name: user.first_name || user.full_name,
          last_name: user.last_name || '',
          isSuperAdmin: user.is_super_admin === 1
        }, expiresInSeconds);

        // Définir le cookie HttpOnly sécurisé
        setCookie(c, 'auth_token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'Lax',
          maxAge: expiresInSeconds,
          path: '/'
        });

        // 🔔 LOGIN SUMMARY NOTIFICATION
        if (c.executionCtx?.waitUntil) {
          c.executionCtx.waitUntil(
            (async () => {
              try {
                await new Promise(resolve => setTimeout(resolve, 10000));
                const { sendLoginSummaryNotification } = await import('./messages');
                await sendLoginSummaryNotification(c.env, user.id);
              } catch (error) {
                console.error('[LOGIN] Summary notification failed (non-blocking):', error);
              }
            })()
          );
        }

        // Audit login success
        c.executionCtx?.waitUntil?.(
          audit.login(c.env.DB, { userId: user.id, email: user.email, role: user.role }, getClientInfo(c))
        );

        return c.json({ token, user: userWithoutPassword });
    }

    // 2. Try Guest User (If not found in Users)
    const guest = await db
        .select()
        .from(chatGuests)
        .where(eq(chatGuests.email, email))
        .get();

    if (guest) {
        if (!guest.is_active) {
            return c.json({ error: 'Compte invité désactivé' }, 403);
        }

        const isValid = await verifyPassword(password, guest.password_hash);
        if (!isValid) {
            return c.json({ error: 'Email ou mot de passe incorrect' }, 401);
        }

        // IMPORTANT: Guest IDs are NEGATIVE to avoid collision in chat_participants
        const guestId = -Math.abs(guest.id);

        const expiresInDays = rememberMe ? 30 : 7;
        const expiresInSeconds = expiresInDays * 24 * 60 * 60;

        const token = await signToken({
            userId: guestId,
            email: guest.email,
            role: 'guest',
            full_name: guest.full_name,
            first_name: guest.full_name.split(' ')[0],
            last_name: guest.full_name.split(' ').slice(1).join(' '),
            isGuest: true,
            company: guest.company
        }, expiresInSeconds);

        setCookie(c, 'auth_token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'Lax',
            maxAge: expiresInSeconds,
            path: '/'
        });

        const { password_hash, ...guestWithoutPassword } = guest;
        return c.json({ token, user: { ...guestWithoutPassword, id: guestId } });
    }

    return c.json({ error: 'Email ou mot de passe incorrect' }, 401);

  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// GET /api/auth/me - Obtenir l'utilisateur connecté
auth.get('/me', async (c) => {
  try {
    const userPayload = c.get('user') as any;
    const db = getDb(c.env);

    if (!userPayload) {
      return c.json({ error: 'Non authentifié' }, 401);
    }

    // Gérer les invités (Guests)
    if (userPayload.isGuest || userPayload.userId < 0) {
        const guestId = Math.abs(userPayload.userId); // ID stocké positif en base
        const guest = await db
            .select()
            .from(chatGuests)
            .where(eq(chatGuests.id, guestId))
            .get();

        if (!guest) {
            return c.json({ error: 'Invité non trouvé' }, 404);
        }

        // Formater comme un objet user standard pour le frontend
        return c.json({
            user: {
                id: userPayload.userId, // Garder l'ID négatif pour la session
                email: guest.email,
                full_name: guest.full_name,
                first_name: guest.full_name.split(' ')[0],
                last_name: guest.full_name.split(' ').slice(1).join(' '),
                role: 'guest',
                company: guest.company,
                avatar_key: null, // Pas d'avatar pour les guests pour l'instant
                created_at: guest.created_at,
                updated_at: guest.updated_at,
                last_login: guest.last_login,
                isGuest: true
            }
        });
    }

    // Gérer les utilisateurs standards
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        full_name: users.full_name,
        first_name: users.first_name,
        last_name: users.last_name,
        role: users.role,
        avatar_key: users.avatar_key,
        created_at: users.created_at,
        updated_at: users.updated_at,
        last_login: users.last_login,
        is_super_admin: users.is_super_admin,
        can_create_admins: users.can_create_admins
      })
      .from(users)
      .where(sql`${users.id} = ${userPayload.userId} AND ${users.deleted_at} IS NULL`)
      .get();

    if (!user) {
      return c.json({ error: 'Utilisateur non trouvé' }, 404);
    }

    // Ajouter flags pour le frontend
    const userWithPermissions = {
      ...user,
      isSuperAdmin: user.is_super_admin === 1,
      canCreateAdmins: user.is_super_admin === 1 || user.can_create_admins === 1
    };

    c.header('Cache-Control', 'no-store, no-cache, must-revalidate');
    return c.json({ user: userWithPermissions });
  } catch (error) {
    console.error('Me error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// POST /api/auth/logout - Déconnexion (clear cookie)
auth.post('/logout', async (c) => {
  try {
    // Effacer le cookie
    setCookie(c, 'auth_token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 0,
      path: '/'
    });

    // Note: We don't have user context in logout (cookie cleared)
    // But we can still log the action
    return c.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// POST /api/auth/heartbeat - Met à jour last_seen (auth optionnelle via cookie)
auth.post('/heartbeat', async (c) => {
  try {
    // Essayer d'extraire l'utilisateur du cookie
    const cookieToken = getCookie(c, 'auth_token');
    if (!cookieToken) {
      return c.json({ ok: true }); // Pas de cookie = ignorer silencieusement
    }
    
    const payload = await verifyToken(cookieToken);
    if (!payload?.userId) {
      return c.json({ ok: true }); // Token invalide = ignorer silencieusement
    }
    
    await c.env.DB.prepare(`
      UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(payload.userId).run();
    
    return c.json({ ok: true });
  } catch (error) {
    return c.json({ ok: true }); // Erreur = ignorer silencieusement
  }
});

export default auth;