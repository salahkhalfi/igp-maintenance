// Routes pour la gestion des techniciens et équipes

import { Hono } from 'hono';
import { authMiddleware, internalUserOnly, technicianSupervisorOrAdmin } from '../middlewares/auth';
import type { Bindings } from '../types';

const technicians = new Hono<{ Bindings: Bindings }>();

// GET /api/technicians - Liste des techniciens
technicians.get('/', authMiddleware, internalUserOnly, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, first_name, email
      FROM users
      WHERE role = 'technician' AND id != 0
      ORDER BY first_name ASC
    `).all();

    return c.json({ technicians: results });
  } catch (error) {
    console.error('Get technicians error:', error);
    return c.json({ error: 'Erreur lors de la récupération des techniciens' }, 500);
  }
});

// GET /api/users/team - Liste de tous les utilisateurs pour les techniciens/superviseurs/admins
// IMPORTANT: Cette route doit être montée AVANT /api/users/* pour ne pas être bloquée
// NOTE: Exclut les superadmins (vendeur SaaS) - ils sont invisibles aux clients
technicians.get('/team', authMiddleware, technicianSupervisorOrAdmin, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, email, first_name, last_name, full_name, role, created_at, updated_at, last_login
      FROM users
      WHERE id != 0 
        AND deleted_at IS NULL
        AND (is_super_admin = 0 OR is_super_admin IS NULL)
      ORDER BY role DESC, first_name ASC
    `).all();

    return c.json({ users: results });
  } catch (error) {
    console.error('Get team users error:', error);
    return c.json({ error: 'Erreur lors de la récupération de l equipe' }, 500);
  }
});

export default technicians;
