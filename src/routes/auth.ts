// Routes d'authentification

import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import { hashPassword, verifyPassword, isLegacyHash, upgradeLegacyHash } from '../utils/password';
import { signToken } from '../utils/jwt';
import type { Bindings, LoginRequest, RegisterRequest, User } from '../types';

const auth = new Hono<{ Bindings: Bindings }>();

// POST /api/auth/register - Inscription
auth.post('/register', async (c) => {
  try {
    const body: RegisterRequest = await c.req.json();
    const { email, password, first_name, last_name, role } = body;

    console.log('[REGISTER] Received:', { email, has_password: !!password, first_name, last_name, role });

    // Validation
    if (!email || !password || !first_name || !role) {
      console.log('[REGISTER] Validation failed:', { email: !!email, password: !!password, first_name: !!first_name, role: !!role });
      return c.json({ error: 'Email, mot de passe, prénom et rôle requis' }, 400);
    }

    // Construire full_name pour compatibilité
    const full_name = last_name ? `${first_name} ${last_name}` : first_name;

    // Vérifier si l'email existe déjà
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existing) {
      return c.json({ error: 'Cet email est déjà utilisé' }, 409);
    }

    // Hasher le mot de passe
    const password_hash = await hashPassword(password);

    // Créer l'utilisateur
    const result = await c.env.DB.prepare(
      'INSERT INTO users (email, password_hash, full_name, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(email, password_hash, full_name, first_name, last_name, role).run();

    if (!result.success) {
      return c.json({ error: 'Erreur lors de la création du compte' }, 500);
    }

    // Récupérer l'utilisateur créé
    const user = await c.env.DB.prepare(
      'SELECT id, email, full_name, first_name, last_name, role, is_super_admin, created_at, updated_at FROM users WHERE email = ?'
    ).bind(email).first() as any;

    // Générer le token JWT
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      first_name: user.first_name,
      last_name: user.last_name,
      isSuperAdmin: user.is_super_admin === 1
    });

    return c.json({ token, user }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// POST /api/auth/login - Connexion
auth.post('/login', async (c) => {
  try {
    const body: LoginRequest & { rememberMe?: boolean } = await c.req.json();
    const { email, password, rememberMe = false } = body;

    // Validation
    if (!email || !password) {
      return c.json({ error: 'Email et mot de passe requis' }, 400);
    }

    // Récupérer l'utilisateur
    const user = await c.env.DB.prepare(
      'SELECT id, email, password_hash, full_name, first_name, last_name, role, is_super_admin, created_at, updated_at FROM users WHERE email = ?'
    ).bind(email).first() as any;

    if (!user) {
      return c.json({ error: 'Email ou mot de passe incorrect' }, 401);
    }

    // Vérifier le mot de passe
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return c.json({ error: 'Email ou mot de passe incorrect' }, 401);
    }

    // 🔒 MIGRATION AUTOMATIQUE: Mettre à jour l'ancien hash vers PBKDF2
    // Ceci se produit de manière transparente lors de la connexion
    if (isLegacyHash(user.password_hash)) {
      try {
        const newHash = await upgradeLegacyHash(password);
        await c.env.DB.prepare(
          'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(newHash, user.id).run();

        console.log(`Password upgraded for user ${user.email} (SHA-256 → PBKDF2)`);
      } catch (error) {
        // En cas d'erreur, on continue quand même (l'utilisateur peut se connecter)
        console.error('Failed to upgrade password hash:', error);
      }
    }

    // 📅 MISE À JOUR LAST_LOGIN: Enregistrer la date/heure de connexion
    try {
      await c.env.DB.prepare(
        "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(user.id).run();
    } catch (error) {
      // En cas d'erreur, on continue (non critique)
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
      first_name: user.first_name,
      last_name: user.last_name,
      isSuperAdmin: user.is_super_admin === 1
    }, expiresInSeconds);

    // Définir le cookie HttpOnly sécurisé
    setCookie(c, 'auth_token', token, {
      httpOnly: true,                    // Pas accessible JavaScript (protection XSS)
      secure: true,                      // HTTPS seulement
      sameSite: 'Lax',                   // Protection CSRF (Lax pour compatibilité OAuth)
      maxAge: expiresInSeconds,          // Expiration (7j ou 30j)
      path: '/'                          // Accessible sur toutes les routes
    });

    // 🔔 LOGIN SUMMARY NOTIFICATION (LAW #12)
    // Fire-and-forget: Ne bloque pas la réponse de connexion
    // Délai de 5 secondes pour laisser le temps au client de s'abonner aux push
    // Vérification de sécurité: executionCtx existe en production Cloudflare Workers
    if (c.executionCtx?.waitUntil) {
      c.executionCtx.waitUntil(
        (async () => {
          try {
            // Attendre 10 secondes pour laisser le client initialiser les push
            // Augmenté de 5s à 10s pour couvrir cas connexion lente + popup permission
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            const { sendLoginSummaryNotification } = await import('./messages');
            await sendLoginSummaryNotification(c.env, user.id);
          } catch (error) {
            // Silent failure - ne doit jamais impacter le login
            console.error('[LOGIN] Summary notification failed (non-blocking):', error);
          }
        })()
      );
    } else {
      // Fallback si executionCtx non disponible (dev local)
      console.log('[LOGIN] executionCtx.waitUntil not available, skipping summary notification');
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

    if (!userPayload) {
      return c.json({ error: 'Non authentifié' }, 401);
    }

    const user = await c.env.DB.prepare(
      'SELECT id, email, full_name, role, created_at, updated_at, last_login FROM users WHERE id = ?'
    ).bind(userPayload.userId).first() as User;

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
    // Effacer le cookie en le définissant avec maxAge=0
    setCookie(c, 'auth_token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 0,  // Expire immédiatement
      path: '/'
    });

    return c.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

export default auth;
