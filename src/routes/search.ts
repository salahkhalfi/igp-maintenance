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
    let onlyWithComments = false;
    let onlyOverdue = false;
    let isKeywordSearch = false; // Nouvelle variable pour détecter recherche par mot-clé pur
    
    // Détection recherche commentaires (mot-clé exact)
    if (queryLower === 'commentaire' || queryLower === 'commentaires' || 
        queryLower === 'note' || queryLower === 'notes' ||
        queryLower === 'comment' || queryLower === 'comments') {
      onlyWithComments = true;
      isKeywordSearch = true;
    }
    
    // Détection retard (mot-clé exact ou contenu)
    if (queryLower === 'retard' || queryLower === 'retards' || queryLower === 'overdue') {
      onlyOverdue = true;
      isKeywordSearch = true;
    }
    
    // Détection status (seulement si mot-clé exact)
    if (queryLower === 'nouveau' || queryLower === 'new') {
      statusFilter = 'new';
      isKeywordSearch = true;
    } else if (queryLower === 'progress' || queryLower === 'cours' || queryLower === 'en cours') {
      statusFilter = 'in_progress';
      isKeywordSearch = true;
    } else if (queryLower === 'complet' || queryLower === 'complete' || queryLower === 'terminé') {
      statusFilter = 'completed';
      isKeywordSearch = true;
    }
    
    // Détection priorité (seulement si mot-clé exact)
    if (queryLower === 'urgent' || queryLower === 'critique' || queryLower === 'critical') {
      priorityFilter = 'critical';
      isKeywordSearch = true;
    } else if (queryLower === 'haute' || queryLower === 'high') {
      priorityFilter = 'high';
      isKeywordSearch = true;
    } else if (queryLower === 'moyenne' || queryLower === 'medium') {
      priorityFilter = 'medium';
      isKeywordSearch = true;
    } else if (queryLower === 'basse' || queryLower === 'low' || queryLower === 'faible') {
      priorityFilter = 'low';
      isKeywordSearch = true;
    }

    // Construction de la requête selon le type de recherche
    let sqlQuery: string;
    let params: any[];
    
    if (onlyWithComments) {
      // Requête optimisée: tickets avec commentaires uniquement
      sqlQuery = `
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
        WHERE 
          t.status != 'archived' AND
          EXISTS (SELECT 1 FROM ticket_comments tc WHERE tc.ticket_id = t.id)
        ORDER BY t.created_at DESC
        LIMIT 50
      `;
      params = [];
    } else if (onlyOverdue) {
      // Requête spéciale: tickets en retard (scheduled_date < now AND status != completed/cancelled/archived)
      sqlQuery = `
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
        WHERE 
          t.status NOT IN ('completed', 'cancelled', 'archived') AND
          t.scheduled_date IS NOT NULL AND
          t.scheduled_date != 'null' AND
          t.scheduled_date < datetime('now')
        ORDER BY t.scheduled_date ASC
        LIMIT 50
      `;
      params = [];
    } else if (isKeywordSearch && (statusFilter || priorityFilter)) {
      // Recherche par mot-clé pur (status ou priorité)
      sqlQuery = `
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
        WHERE t.status != 'archived'
      `;
      
      params = [];
      
      if (statusFilter) {
        sqlQuery += ' AND t.status = ?';
        params.push(statusFilter);
      }
      
      if (priorityFilter) {
        sqlQuery += ' AND t.priority = ?';
        params.push(priorityFilter);
      }
      
      sqlQuery += ' ORDER BY t.created_at DESC LIMIT 50';
    } else {
      // Recherche textuelle normale
      sqlQuery = `
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
          )
        ORDER BY t.created_at DESC
        LIMIT 50
      `;
      
      params = [
        searchTerm, searchTerm, searchTerm,
        searchTerm, searchTerm, searchTerm,
        searchTerm, searchTerm, searchTerm, searchTerm
      ];
    }

    const { results } = await c.env.DB.prepare(sqlQuery).bind(...params).all();

    return c.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return c.json({ error: 'Erreur lors de la recherche' }, 500);
  }
});

export default search;
