// Routes d'authentification
// Refactored to use Drizzle ORM + Zod Validation

import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import { eq, sql } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { getDb } from '../db';
import { users } from '../db/schema';
import { hashPassword, verifyPassword, isLegacyHash, upgradeLegacyHash } from '../utils/password';
import { signToken } from '../utils/jwt';
import { loginSchema, registerSchema } from '../schemas/auth';
import type { Bindings } from '../types';

const auth = new Hono<{ Bindings: Bindings }>();

// POST /api/auth/register - Inscription
auth.post('/register', zValidator('json', registerSchema), async (c) => {
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

// POST /api/auth/login - Connexion
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password, rememberMe } = c.req.valid('json');
    const db = getDb(c.env);

    // Récupérer l'utilisateur
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (!user) {
      return c.json({ error: 'Email ou mot de passe incorrect' }, 401);
    }

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

    // Générer le token JWT avec expiration dynamique
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

    // 🔔 LOGIN SUMMARY NOTIFICATION (LAW #12)
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

    return c.json({ token, user: userWithoutPassword });
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

    const user = await db
      .select({
        id: users.id,
        email: users.email,
        full_name: users.full_name,
        first_name: users.first_name,
        last_name: users.last_name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
        last_login: users.last_login
      })
      .from(users)
      .where(eq(users.id, userPayload.userId))
      .get();

    if (!user) {
      return c.json({ error: 'Utilisateur non trouvé' }, 404);
    }

    return c.json({ user });
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

    return c.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

export default auth;
