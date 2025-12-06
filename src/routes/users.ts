// Routes de gestion des utilisateurs (Admin et Superviseur)
// Refactored to use Drizzle ORM + Zod Validation

import { Hono } from 'hono';
import { eq, ne, and, or, desc, sql, getTableColumns, like } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { getDb } from '../db';
import { users, tickets, media, ticketTimeline } from '../db/schema';
import { hashPassword } from '../utils/password';
import { supervisorOrAdmin, technicianSupervisorOrAdmin } from '../middlewares/auth';
import { createUserSchema, updateUserSchema, resetPasswordSchema, userIdParamSchema } from '../schemas/users';
import type { Bindings, User } from '../types';

const usersRoute = new Hono<{ Bindings: Bindings }>();

/**
 * GET /api/users/team - Liste toute l'équipe (pour tous les rôles)
 * Accès: Technicien, Superviseur, Admin
 */
usersRoute.get('/team', technicianSupervisorOrAdmin, async (c) => {
  try {
    const db = getDb(c.env);
    const results = await db
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
      .where(ne(users.id, 0))
      .orderBy(desc(users.role), users.full_name);

    return c.json({ users: results });
  } catch (error) {
    console.error('Get team users error:', error);
    return c.json({ error: 'Erreur lors de la récupération de l equipe' }, 500);
  }
});

// Toutes les AUTRES routes nécessitent les droits admin ou superviseur
usersRoute.use('/*', supervisorOrAdmin);

/**
 * GET /api/users - Liste tous les utilisateurs
 * Accès: Admin uniquement
 */
usersRoute.get('/', async (c) => {
  try {
    const db = getDb(c.env);
    // Filtrer le super admin ET l'utilisateur système team (id=0)
    const results = await db
      .select({
        ...getTableColumns(users),
        hash_type: sql<string>`CASE WHEN ${users.password_hash} LIKE 'v2:%' THEN 'PBKDF2' ELSE 'SHA-256 (Legacy)' END`
      })
      .from(users)
      .where(
        and(
          or(eq(users.is_super_admin, 0), sql`${users.is_super_admin} IS NULL`),
          ne(users.id, 0)
        )
      )
      .orderBy(users.full_name);

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
usersRoute.get('/:id', zValidator('param', userIdParamSchema), async (c) => {
  try {
    const { id } = c.req.valid('param');
    // isNaN check removed (handled by Zod)

    const db = getDb(c.env);
    const user = await db
      .select({
        ...getTableColumns(users),
        hash_type: sql<string>`CASE WHEN ${users.password_hash} LIKE 'v2:%' THEN 'PBKDF2' ELSE 'SHA-256 (Legacy)' END`
      })
      .from(users)
      .where(eq(users.id, id))
      .get();

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
usersRoute.post('/', zValidator('json', createUserSchema), async (c) => {
  try {
    const currentUser = c.get('user') as any;
    const body = c.req.valid('json');
    const { email, password, first_name, last_name, role } = body;

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedFirstName = first_name.trim();
    const trimmedLastName = last_name ? last_name.trim() : '';
    const full_name = trimmedLastName ? `${trimmedFirstName} ${trimmedLastName}` : trimmedFirstName;

    // RESTRICTION: Superviseur ne peut pas créer d'admin
    if (currentUser.role === 'supervisor' && role === 'admin') {
      return c.json({ error: 'Les superviseurs ne peuvent pas créer d\'administrateurs' }, 403);
    }

    const db = getDb(c.env);

    // Vérifier si l'email existe déjà
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, trimmedEmail))
      .get();

    if (existing) {
      return c.json({ error: 'Cet email est déjà utilisé' }, 409);
    }

    // Hasher le mot de passe avec PBKDF2
    const password_hash = await hashPassword(password);

    // Créer l'utilisateur
    const result = await db.insert(users).values({
      email: trimmedEmail,
      password_hash,
      full_name,
      first_name: trimmedFirstName,
      last_name: trimmedLastName,
      role
    }).returning();

    const newUser = result[0];
    console.log(`Admin ${currentUser.email} created user ${trimmedEmail} with role ${role}`);

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
usersRoute.put('/:id', zValidator('param', userIdParamSchema), zValidator('json', updateUserSchema), async (c) => {
  try {
    const currentUser = c.get('user') as any;
    const { id } = c.req.valid('param');
    // isNaN check removed

    const body = c.req.valid('json');
    const { email, first_name, last_name, role, password } = body;

    const db = getDb(c.env);

    // Vérifier que l'utilisateur existe
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .get();

    if (!existingUser) {
      return c.json({ error: 'Utilisateur non trouvé' }, 404);
    }

    // PROTECTION: Bloquer toute modification du super admin
    if (existingUser.is_super_admin === 1) {
      return c.json({ error: 'Action non autorisée' }, 403);
    }

    // RESTRICTION: Superviseur ne peut pas modifier un admin
    if (currentUser.role === 'supervisor' && existingUser.role === 'admin') {
      return c.json({ error: 'Les superviseurs ne peuvent pas modifier les administrateurs' }, 403);
    }

    // RESTRICTION: Superviseur ne peut pas promouvoir quelqu'un en admin
    if (currentUser.role === 'supervisor' && role === 'admin') {
      return c.json({ error: 'Les superviseurs ne peuvent pas créer d\'administrateurs' }, 403);
    }

    // Empêcher un admin de se retirer ses propres droits admin
    if (currentUser.userId === id && role && role !== 'admin' && currentUser.role === 'admin') {
      return c.json({ error: 'Vous ne pouvez pas retirer vos propres droits administrateur' }, 403);
    }

    // Empêcher un superviseur de se retirer ses propres droits superviseur
    if (currentUser.userId === id && role && role !== 'supervisor' && currentUser.role === 'supervisor') {
      return c.json({ error: 'Vous ne pouvez pas retirer vos propres droits de superviseur' }, 403);
    }

    const updates: any = {
      updated_at: sql`CURRENT_TIMESTAMP`
    };

    if (email) {
      const trimmedEmail = email.trim().toLowerCase();
      // Vérifier unicité
      const emailExists = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, trimmedEmail), ne(users.id, id)))
        .get();

      if (emailExists) {
        return c.json({ error: 'Cet email est déjà utilisé par un autre utilisateur' }, 409);
      }
      updates.email = trimmedEmail;
    }

    if (first_name !== undefined && first_name !== null) {
      const trimmedFirstName = first_name.trim();
      const trimmedLastName = last_name !== undefined && last_name !== null ? last_name.trim() : (existingUser.last_name || '');
      
      if (trimmedFirstName.length > 0) {
        const full_name = trimmedLastName ? `${trimmedFirstName} ${trimmedLastName}` : trimmedFirstName;
        updates.first_name = trimmedFirstName;
        updates.last_name = trimmedLastName;
        updates.full_name = full_name;
      }
    }

    if (role) updates.role = role;
    if (password) {
      updates.password_hash = await hashPassword(password);
    }

    const result = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();

    if (!result.length) {
      return c.json({ error: 'Erreur lors de la mise à jour' }, 500);
    }

    const updatedUser = result[0];
    console.log(`Admin ${currentUser.email} updated user ${existingUser.email}`);

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
usersRoute.delete('/:id', zValidator('param', userIdParamSchema), async (c) => {
  try {
    const currentUser = c.get('user') as any;
    const { id } = c.req.valid('param');
    // isNaN check removed

    const db = getDb(c.env);
    const existingUser = await db.select().from(users).where(eq(users.id, id)).get();

    if (!existingUser) {
      return c.json({ error: 'Utilisateur non trouvé' }, 404);
    }

    if (existingUser.is_super_admin === 1) return c.json({ error: 'Action non autorisée' }, 403);
    if (currentUser.role === 'supervisor' && existingUser.role === 'admin') return c.json({ error: 'Non autorisé' }, 403);
    if (currentUser.userId === id) return c.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, 403);

    // Vérifier si dernier admin
    const adminCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, 'admin'))
      .get();

    if (existingUser.role === 'admin' && adminCount && adminCount.count <= 1) {
      return c.json({ error: 'Impossible de supprimer le dernier administrateur' }, 403);
    }

    // Vérifier tickets
    const ticketCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(tickets)
      .where(eq(tickets.reported_by, id))
      .get();

    if (ticketCount && ticketCount.count > 0) {
      return c.json({ error: `Impossible: l'utilisateur a ${ticketCount.count} tickets` }, 400);
    }

    // Nettoyage
    await db.update(tickets).set({ assigned_to: null, updated_at: sql`CURRENT_TIMESTAMP` }).where(eq(tickets.assigned_to, id));
    
    // Re-assign media to System User (0) to satisfy NOT NULL constraint
    await db.update(media).set({ uploaded_by: 0 }).where(eq(media.uploaded_by, id));
    
    // Re-assign timeline to System User (0) to satisfy NOT NULL constraint
    await db.update(ticketTimeline).set({ user_id: 0 }).where(eq(ticketTimeline.user_id, id));

    // Re-assign chat messages to System User (0) to prevent FK violation and preserve history
    // Note: chat_participants is handled automatically by ON DELETE CASCADE in the database schema
    await c.env.DB.prepare('UPDATE chat_messages SET sender_id = 0 WHERE sender_id = ?').bind(id).run();

    await db.delete(users).where(eq(users.id, id));

    return c.json({
      message: 'Utilisateur supprimé avec succès',
      deleted_user: existingUser
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ error: 'Erreur lors de la suppression de l\'utilisateur' }, 500);
  }
});

/**
 * POST /api/users/:id/reset-password
 */
usersRoute.post('/:id/reset-password', zValidator('param', userIdParamSchema), zValidator('json', resetPasswordSchema), async (c) => {
  try {
    const currentUser = c.get('user') as any;
    const { id } = c.req.valid('param');
    
    const body = c.req.valid('json');
    const { new_password } = body;

    const db = getDb(c.env);
    const existingUser = await db.select().from(users).where(eq(users.id, id)).get();

    if (!existingUser) return c.json({ error: 'Utilisateur non trouvé' }, 404);
    if (existingUser.is_super_admin === 1) return c.json({ error: 'Action non autorisée' }, 403);

    const password_hash = await hashPassword(new_password);

    await db.update(users)
      .set({ password_hash, updated_at: sql`CURRENT_TIMESTAMP` })
      .where(eq(users.id, id));

    console.log(`Admin ${currentUser.email} reset password for user ${existingUser.email}`);
    return c.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({ error: 'Erreur lors de la réinitialisation du mot de passe' }, 500);
  }
});

export default usersRoute;
