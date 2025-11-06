// Routes pour la gestion des commentaires sur les tickets

import { Hono } from 'hono';
import type { Bindings } from '../types';
import { authMiddleware } from '../middlewares/auth';
import { LIMITS } from '../utils/validation';

const comments = new Hono<{ Bindings: Bindings }>();

// POST /api/comments - Ajouter un commentaire à un ticket
comments.post('/', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { ticket_id, user_name, user_role, comment, created_at } = body;
    
    // Validation des champs requis
    if (!ticket_id || !user_name || !comment) {
      return c.json({ error: 'Ticket ID, nom et commentaire requis' }, 400);
    }

    // Validation de l'ID du ticket
    const ticketIdNum = parseInt(ticket_id);
    if (isNaN(ticketIdNum) || ticketIdNum <= 0) {
      return c.json({ error: 'ID de ticket invalide' }, 400);
    }

    // Validation du nom d'utilisateur
    const trimmedUserName = user_name.trim();
    if (trimmedUserName.length < LIMITS.NAME_MIN) {
      return c.json({ error: `Nom d'utilisateur trop court (min ${LIMITS.NAME_MIN} caractères)` }, 400);
    }
    if (user_name.length > LIMITS.NAME_MAX) {
      return c.json({ error: `Nom d'utilisateur trop long (max ${LIMITS.NAME_MAX} caractères)` }, 400);
    }

    // Validation du commentaire
    const trimmedComment = comment.trim();
    if (trimmedComment.length < 1) {
      return c.json({ error: 'Commentaire ne peut pas être vide' }, 400);
    }
    if (comment.length > LIMITS.COMMENT_MAX) {
      return c.json({ error: `Commentaire trop long (max ${LIMITS.COMMENT_MAX} caractères)` }, 400);
    }
    
    // Vérifier que le ticket existe
    const ticket = await c.env.DB.prepare(
      'SELECT id FROM tickets WHERE id = ?'
    ).bind(ticket_id).first();
    
    if (!ticket) {
      return c.json({ error: 'Ticket non trouvé' }, 404);
    }
    
    // Utiliser le timestamp de l'appareil de l'utilisateur si fourni
    const timestamp = created_at || new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    // Insérer le commentaire avec timestamp de l'appareil et données nettoyées
    const result = await c.env.DB.prepare(`
      INSERT INTO ticket_comments (ticket_id, user_name, user_role, comment, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(ticketIdNum, trimmedUserName, user_role || null, trimmedComment, timestamp).run();
    
    if (!result.success) {
      return c.json({ error: 'Erreur lors de l\'ajout du commentaire' }, 500);
    }
    
    // Récupérer le commentaire créé
    const newComment = await c.env.DB.prepare(
      'SELECT * FROM ticket_comments WHERE id = ?'
    ).bind(result.meta.last_row_id).first();
    
    return c.json({ comment: newComment }, 201);
  } catch (error) {
    console.error('Add comment error:', error);
    return c.json({ error: 'Erreur lors de l\'ajout du commentaire' }, 500);
  }
});

// GET /api/comments/ticket/:ticketId - Liste les commentaires d'un ticket
comments.get('/ticket/:ticketId', authMiddleware, async (c) => {
  try {
    const ticketId = c.req.param('ticketId');
    
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM ticket_comments WHERE ticket_id = ? ORDER BY created_at ASC'
    ).bind(ticketId).all();
    
    return c.json({ comments: results });
  } catch (error) {
    console.error('Get comments error:', error);
    return c.json({ error: 'Erreur lors de la récupération des commentaires' }, 500);
  }
});

export default comments;
