// Routes pour la gestion des techniciens et équipes

import { Hono } from 'hono';
import { authMiddleware, technicianSupervisorOrAdmin } from '../middlewares/auth';
import type { Bindings } from '../types';

const technicians = new Hono<{ Bindings: Bindings }>();

// GET /api/technicians - Liste des techniciens
technicians.get('/', authMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, full_name, email
      FROM users
      WHERE role = 'technician' AND id != 0
      ORDER BY full_name ASC
    `).all();

    return c.json({ technicians: results });
  } catch (error) {
    console.error('Get technicians error:', error);
    return c.json({ error: 'Erreur lors de la récupération des techniciens' }, 500);
  }
});

// GET /api/users/team - Liste de tous les utilisateurs pour les techniciens/superviseurs/admins
// IMPORTANT: Cette route doit être montée AVANT /api/users/* pour ne pas être bloquée
technicians.get('/team', authMiddleware, technicianSupervisorOrAdmin, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, email, full_name, role, created_at, updated_at, last_login
      FROM users
      WHERE id != 0
      ORDER BY role DESC, full_name ASC
    `).all();

    return c.json({ users: results });
  } catch (error) {
    console.error('Get team users error:', error);
    return c.json({ error: 'Erreur lors de la récupération de l equipe' }, 500);
  }
});

export default technicians;
