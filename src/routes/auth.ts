// Routes d'authentification

import { Hono } from 'hono';
import { hashPassword, verifyPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import type { Bindings, LoginRequest, RegisterRequest, User } from '../types';

const auth = new Hono<{ Bindings: Bindings }>();

// POST /api/auth/register - Inscription
auth.post('/register', async (c) => {
  try {
    const body: RegisterRequest = await c.req.json();
    const { email, password, full_name, role } = body;

    // Validation
    if (!email || !password || !full_name || !role) {
      return c.json({ error: 'Tous les champs sont requis' }, 400);
    }

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
      'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)'
    ).bind(email, password_hash, full_name, role).run();

    if (!result.success) {
      return c.json({ error: 'Erreur lors de la création du compte' }, 500);
    }

    // Récupérer l'utilisateur créé
    const user = await c.env.DB.prepare(
      'SELECT id, email, full_name, role, created_at, updated_at FROM users WHERE email = ?'
    ).bind(email).first() as User;

    // Générer le token JWT
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role
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
    const body: LoginRequest = await c.req.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return c.json({ error: 'Email et mot de passe requis' }, 400);
    }

    // Récupérer l'utilisateur
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first() as any;

    if (!user) {
      return c.json({ error: 'Email ou mot de passe incorrect' }, 401);
    }

    // Vérifier le mot de passe
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return c.json({ error: 'Email ou mot de passe incorrect' }, 401);
    }

    // Retirer le hash du mot de passe
    const { password_hash, ...userWithoutPassword } = user;

    // Générer le token JWT
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

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
      'SELECT id, email, full_name, role, created_at, updated_at FROM users WHERE id = ?'
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

export default auth;
