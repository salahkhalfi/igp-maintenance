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

    // Mapper mots-clés vers valeurs DB
    const queryLower = query.trim().toLowerCase();
    let statusFilter = null;
    let priorityFilter = null;
    
    // Détection status
    if (queryLower.includes('retard') || queryLower.includes('overdue')) {
      // On cherchera les tickets en retard après
    } else if (queryLower.includes('nouveau') || queryLower.includes('new')) {
      statusFilter = 'new';
    } else if (queryLower.includes('progress') || queryLower.includes('cours')) {
      statusFilter = 'in_progress';
    } else if (queryLower.includes('complet') || queryLower.includes('complete')) {
      statusFilter = 'completed';
    }
    
    // Détection priorité
    if (queryLower.includes('urgent') || queryLower.includes('critique') || queryLower.includes('critical')) {
      priorityFilter = 'critical';
    } else if (queryLower.includes('haute') || queryLower.includes('high')) {
      priorityFilter = 'high';
    } else if (queryLower.includes('moyenne') || queryLower.includes('medium')) {
      priorityFilter = 'medium';
    } else if (queryLower.includes('basse') || queryLower.includes('low')) {
      priorityFilter = 'low';
    }

    // Recherche dans tickets avec infos machine ET commentaires
    let sqlQuery = `
      SELECT DISTINCT
        t.*,
        m.machine_type, m.model, m.serial_number, m.location,
        u1.first_name as reporter_name,
        u2.first_name as assignee_name,
        (SELECT COUNT(*) FROM ticket_comments tc WHERE tc.ticket_id = t.id) as comments_count
      FROM tickets t
      LEFT JOIN machines m ON t.machine_id = m.id
      LEFT JOIN users u1 ON t.reported_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      LEFT JOIN ticket_comments c ON t.id = c.ticket_id
      WHERE 
        t.status != 'archived' AND (
          t.ticket_id LIKE ? OR
          t.title LIKE ? OR
          t.description LIKE ? OR
          m.machine_type LIKE ? OR
          m.model LIKE ? OR
          m.serial_number LIKE ? OR
          m.location LIKE ? OR
          u2.first_name LIKE ? OR
          c.comment LIKE ? OR
          c.user_name LIKE ?
    `;
    
    const params: string[] = [
      searchTerm, searchTerm, searchTerm,
      searchTerm, searchTerm, searchTerm,
      searchTerm, searchTerm, searchTerm, searchTerm
    ];
    
    // Ajouter filtre status si détecté
    if (statusFilter) {
      sqlQuery += ' OR t.status = ?';
      params.push(statusFilter);
    }
    
    // Ajouter filtre priorité si détecté
    if (priorityFilter) {
      sqlQuery += ' OR t.priority = ?';
      params.push(priorityFilter);
    }
    
    sqlQuery += `) ORDER BY t.created_at DESC LIMIT 20`;

    let { results } = await c.env.DB.prepare(sqlQuery).bind(...params).all();
    
    // Si recherche "retard", filtrer tickets en retard
    if (queryLower.includes('retard') || queryLower.includes('overdue')) {
      const now = new Date();
      results = results.filter((ticket: any) => {
        if (ticket.status === 'completed' || ticket.status === 'cancelled' || ticket.status === 'archived') {
          return false;
        }
        if (!ticket.scheduled_date || ticket.scheduled_date === 'null') {
          return false;
        }
        const isoDate = ticket.scheduled_date.replace(' ', 'T') + 'Z';
        const scheduledDate = new Date(isoDate);
        return scheduledDate < now;
      });
    }

    return c.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return c.json({ error: 'Erreur lors de la recherche' }, 500);
  }
});

export default search;
