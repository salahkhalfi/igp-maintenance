// Routes de gestion des utilisateurs (Admin uniquement)

import { Hono } from 'hono';
import { hashPassword, isLegacyHash } from '../utils/password';
import { adminOnly } from '../middlewares/auth';
import type { Bindings, User } from '../types';

const users = new Hono<{ Bindings: Bindings }>();

// Toutes les routes nécessitent les droits admin
users.use('/*', adminOnly);

/**
 * GET /api/users - Liste tous les utilisateurs
 * Accès: Admin uniquement
 */
users.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        id, 
        email, 
        full_name, 
        role, 
        created_at, 
        updated_at,
        CASE 
          WHEN password_hash LIKE 'v2:%' THEN 'PBKDF2'
          ELSE 'SHA-256 (Legacy)'
        END as hash_type
      FROM users
      ORDER BY created_at DESC
    `).all();

    return c.json({ users: results });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: 'Erreur lors de la récupération des utilisateurs' }, 500);
  }
});

/**
 * GET /api/users/:id - Détails d'un utilisateur
 * Accès: Admin uniquement
 */
users.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const user = await c.env.DB.prepare(`
      SELECT 
        id, 
        email, 
        full_name, 
        role, 
        created_at, 
        updated_at,
        CASE 
          WHEN password_hash LIKE 'v2:%' THEN 'PBKDF2'
          ELSE 'SHA-256 (Legacy)'
        END as hash_type
      FROM users 
      WHERE id = ?
    `).bind(id).first();

    if (!user) {
      return c.json({ error: 'Utilisateur non trouvé' }, 404);
    }

    return c.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Erreur lors de la récupération de l\'utilisateur' }, 500);
  }
});

/**
 * POST /api/users - Créer un nouvel utilisateur
 * Accès: Admin uniquement
 */
users.post('/', async (c) => {
  try {
    const currentUser = c.get('user') as any;
    const body = await c.req.json();
    const { email, password, full_name, role } = body;

    // Validation
    if (!email || !password || !full_name || !role) {
      return c.json({ error: 'Tous les champs sont requis' }, 400);
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Email invalide' }, 400);
    }

    // Validation du rôle
    const validRoles = ['admin', 'technician', 'operator'];
    if (!validRoles.includes(role)) {
      return c.json({ error: 'Rôle invalide. Rôles valides: admin, technician, operator' }, 400);
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return c.json({ error: 'Le mot de passe doit contenir au moins 6 caractères' }, 400);
    }

    // Vérifier si l'email existe déjà
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existing) {
      return c.json({ error: 'Cet email est déjà utilisé' }, 409);
    }

    // Hasher le mot de passe avec PBKDF2
    const password_hash = await hashPassword(password);

    // Créer l'utilisateur
    const result = await c.env.DB.prepare(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)'
    ).bind(email, password_hash, full_name, role).run();

    if (!result.success) {
      return c.json({ error: 'Erreur lors de la création de l\'utilisateur' }, 500);
    }

    // Récupérer l'utilisateur créé
    const newUser = await c.env.DB.prepare(
      'SELECT id, email, full_name, role, created_at, updated_at FROM users WHERE email = ?'
    ).bind(email).first() as User;

    // Logger l'action
    console.log(`Admin ${currentUser.email} created user ${email} with role ${role}`);

    return c.json({ 
      message: 'Utilisateur créé avec succès',
      user: newUser 
    }, 201);
  } catch (error) {
    console.error('Create user error:', error);
    return c.json({ error: 'Erreur lors de la création de l\'utilisateur' }, 500);
  }
});

/**
 * PUT /api/users/:id - Modifier un utilisateur
 * Accès: Admin uniquement
 */
users.put('/:id', async (c) => {
  try {
    const currentUser = c.get('user') as any;
    const id = c.req.param('id');
    const body = await c.req.json();
    const { email, full_name, role, password } = body;

    // Vérifier que l'utilisateur existe
    const existingUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(id).first() as any;

    if (!existingUser) {
      return c.json({ error: 'Utilisateur non trouvé' }, 404);
    }

    // Empêcher un admin de se retirer ses propres droits admin
    if (currentUser.userId === parseInt(id) && role && role !== 'admin') {
      return c.json({ 
        error: 'Vous ne pouvez pas retirer vos propres droits administrateur' 
      }, 403);
    }

    // Validation de l'email si fourni
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return c.json({ error: 'Email invalide' }, 400);
      }

      // Vérifier si l'email est déjà utilisé par un autre utilisateur
      const emailExists = await c.env.DB.prepare(
        'SELECT id FROM users WHERE email = ? AND id != ?'
      ).bind(email, id).first();

      if (emailExists) {
        return c.json({ error: 'Cet email est déjà utilisé par un autre utilisateur' }, 409);
      }
    }

    // Validation du rôle si fourni
    if (role) {
      const validRoles = ['admin', 'technician', 'operator'];
      if (!validRoles.includes(role)) {
        return c.json({ error: 'Rôle invalide. Rôles valides: admin, technician, operator' }, 400);
      }
    }

    // Validation du mot de passe si fourni
    if (password && password.length < 6) {
      return c.json({ error: 'Le mot de passe doit contenir au moins 6 caractères' }, 400);
    }

    // Construire la requête de mise à jour
    const updates: string[] = [];
    const params: any[] = [];

    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (full_name) {
      updates.push('full_name = ?');
      params.push(full_name);
    }
    if (role) {
      updates.push('role = ?');
      params.push(role);
    }
    if (password) {
      const password_hash = await hashPassword(password);
      updates.push('password_hash = ?');
      params.push(password_hash);
    }

    if (updates.length === 0) {
      return c.json({ error: 'Aucune modification fournie' }, 400);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    // Exécuter la mise à jour
    const result = await c.env.DB.prepare(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    if (!result.success) {
      return c.json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' }, 500);
    }

    // Récupérer l'utilisateur mis à jour
    const updatedUser = await c.env.DB.prepare(
      'SELECT id, email, full_name, role, created_at, updated_at FROM users WHERE id = ?'
    ).bind(id).first() as User;

    // Logger l'action
    const changes = [];
    if (email) changes.push(`email: ${existingUser.email} → ${email}`);
    if (full_name) changes.push(`name: ${existingUser.full_name} → ${full_name}`);
    if (role) changes.push(`role: ${existingUser.role} → ${role}`);
    if (password) changes.push('password changed');
    
    console.log(`Admin ${currentUser.email} updated user ${existingUser.email}: ${changes.join(', ')}`);

    return c.json({ 
      message: 'Utilisateur mis à jour avec succès',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Update user error:', error);
    return c.json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' }, 500);
  }
});

/**
 * DELETE /api/users/:id - Supprimer un utilisateur
 * Accès: Admin uniquement
 */
users.delete('/:id', async (c) => {
  try {
    const currentUser = c.get('user') as any;
    const id = c.req.param('id');

    // Vérifier que l'utilisateur existe
    const existingUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(id).first() as any;

    if (!existingUser) {
      return c.json({ error: 'Utilisateur non trouvé' }, 404);
    }

    // Empêcher un admin de se supprimer lui-même
    if (currentUser.userId === parseInt(id)) {
      return c.json({ 
        error: 'Vous ne pouvez pas supprimer votre propre compte' 
      }, 403);
    }

    // Vérifier s'il reste au moins un autre admin
    const adminCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM users WHERE role = ?'
    ).bind('admin').first() as any;

    if (existingUser.role === 'admin' && adminCount.count <= 1) {
      return c.json({ 
        error: 'Impossible de supprimer le dernier administrateur du système' 
      }, 403);
    }

    // Supprimer l'utilisateur
    const result = await c.env.DB.prepare(
      'DELETE FROM users WHERE id = ?'
    ).bind(id).run();

    if (!result.success) {
      return c.json({ error: 'Erreur lors de la suppression de l\'utilisateur' }, 500);
    }

    // Logger l'action
    console.log(`Admin ${currentUser.email} deleted user ${existingUser.email} (role: ${existingUser.role})`);

    return c.json({ 
      message: 'Utilisateur supprimé avec succès',
      deleted_user: {
        id: existingUser.id,
        email: existingUser.email,
        full_name: existingUser.full_name,
        role: existingUser.role
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ error: 'Erreur lors de la suppression de l\'utilisateur' }, 500);
  }
});

/**
 * POST /api/users/:id/reset-password - Réinitialiser le mot de passe
 * Accès: Admin uniquement
 */
users.post('/:id/reset-password', async (c) => {
  try {
    const currentUser = c.get('user') as any;
    const id = c.req.param('id');
    const body = await c.req.json();
    const { new_password } = body;

    if (!new_password) {
      return c.json({ error: 'Le nouveau mot de passe est requis' }, 400);
    }

    if (new_password.length < 6) {
      return c.json({ error: 'Le mot de passe doit contenir au moins 6 caractères' }, 400);
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await c.env.DB.prepare(
      'SELECT email FROM users WHERE id = ?'
    ).bind(id).first() as any;

    if (!existingUser) {
      return c.json({ error: 'Utilisateur non trouvé' }, 404);
    }

    // Hasher le nouveau mot de passe
    const password_hash = await hashPassword(new_password);

    // Mettre à jour le mot de passe
    const result = await c.env.DB.prepare(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(password_hash, id).run();

    if (!result.success) {
      return c.json({ error: 'Erreur lors de la réinitialisation du mot de passe' }, 500);
    }

    // Logger l'action (sans inclure le mot de passe)
    console.log(`Admin ${currentUser.email} reset password for user ${existingUser.email}`);

    return c.json({ 
      message: 'Mot de passe réinitialisé avec succès'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({ error: 'Erreur lors de la réinitialisation du mot de passe' }, 500);
  }
});

export default users;
