// Route pour la recherche globale de tickets

import { Hono } from 'hono';
import type { Bindings } from '../types';
import { authMiddleware } from '../middlewares/auth';

const search = new Hono<{ Bindings: Bindings }>();

// GET /api/search - Recherche globale
search.get('/', authMiddleware, async (c) => {
  try {
    const query = c.req.query('q');

    if (!query || query.trim().length < 2) {
      return c.json({ results: [] });
    }

    const searchTerm = '%' + query.trim() + '%';

    // Recherche dans tickets avec infos machine
    const { results } = await c.env.DB.prepare(`
      SELECT
        t.*,
        m.machine_type, m.model, m.serial_number, m.location,
        u1.first_name as reporter_name,
        u2.first_name as assignee_name
      FROM tickets t
      LEFT JOIN machines m ON t.machine_id = m.id
      LEFT JOIN users u1 ON t.reported_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      WHERE 
        t.status != 'archived' AND (
          t.ticket_id LIKE ? OR
          t.title LIKE ? OR
          t.description LIKE ? OR
          m.machine_type LIKE ? OR
          m.model LIKE ? OR
          m.serial_number LIKE ? OR
          m.location LIKE ? OR
          u2.first_name LIKE ?
        )
      ORDER BY t.created_at DESC
      LIMIT 20
    `).bind(
      searchTerm, searchTerm, searchTerm,
      searchTerm, searchTerm, searchTerm,
      searchTerm, searchTerm
    ).all();

    return c.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return c.json({ error: 'Erreur lors de la recherche' }, 500);
  }
});

export default search;
