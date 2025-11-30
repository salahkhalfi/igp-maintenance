// Routes pour la gestion des commentaires sur les tickets
// Refactored to use Drizzle ORM + Zod Validation

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, asc } from 'drizzle-orm';
import { getDb } from '../db';
import { ticketComments, tickets, media } from '../db/schema';
import { createCommentSchema, ticketIdParamSchema, commentIdParamSchema } from '../schemas/comments';
import { authMiddleware } from '../middlewares/auth';
import type { Bindings } from '../types';

const comments = new Hono<{ Bindings: Bindings }>();

// POST /api/comments - Ajouter un commentaire à un ticket
comments.post('/', authMiddleware, zValidator('json', createCommentSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    const { ticket_id, user_name, user_role, comment, created_at } = body;
    const db = getDb(c.env);

    // Vérifier que le ticket existe
    const ticket = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticket_id))
      .get();

    if (!ticket) {
      return c.json({ error: 'Ticket non trouvé' }, 404);
    }

    // Utiliser le timestamp de l'appareil de l'utilisateur si fourni
    const timestamp = created_at || new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Insérer le commentaire
    const result = await db.insert(ticketComments).values({
      ticket_id,
      user_name,
      user_role: user_role || null,
      comment,
      created_at: timestamp
    }).returning();

    return c.json({ comment: result[0] }, 201);
  } catch (error) {
    console.error('Add comment error:', error);
    return c.json({ error: 'Erreur lors de l\'ajout du commentaire' }, 500);
  }
});

// GET /api/comments/ticket/:ticketId - Liste les commentaires d'un ticket
comments.get('/ticket/:ticketId', authMiddleware, zValidator('param', ticketIdParamSchema), async (c) => {
  try {
    const { ticketId } = c.req.valid('param');
    // isNaN check handled by Zod

    const db = getDb(c.env);
    const results = await db
      .select()
      .from(ticketComments)
      .where(eq(ticketComments.ticket_id, ticketId))
      .orderBy(asc(ticketComments.created_at)); // Ordre chronologique pour les conversations

    return c.json({ comments: results });
  } catch (error) {
    console.error('Get comments error:', error);
    return c.json({ error: 'Erreur lors de la récupération des commentaires' }, 500);
  }
});

// DELETE /api/comments/:id - Supprimer un commentaire (protégé)
comments.delete('/:id', authMiddleware, zValidator('param', commentIdParamSchema), async (c) => {
  try {
    const user = c.get('user') as any;
    const { id } = c.req.valid('param');
    // isNaN check handled by Zod

    const db = getDb(c.env);

    // Récupérer le commentaire
    const comment = await db
      .select()
      .from(ticketComments)
      .where(eq(ticketComments.id, id))
      .get();

    if (!comment) {
      return c.json({ error: 'Commentaire non trouvé' }, 404);
    }

    // Permissions
    const canDelete = 
      user.role === 'admin' || 
      user.role === 'supervisor' ||
      (user.first_name && comment.user_name === user.first_name);

    if (!canDelete) {
      return c.json({ error: 'Permission refusée' }, 403);
    }

    // Suppression en cascade : Vérifier si c'est un message vocal [audio:ID]
    const audioMatch = comment.comment.match(/\[audio:(\d+)\]/);
    if (audioMatch) {
      const mediaId = Number(audioMatch[1]);
      
      // Récupérer les infos du média
      const mediaInfo = await db
        .select()
        .from(media)
        .where(eq(media.id, mediaId))
        .get();

      if (mediaInfo) {
        try {
          // Supprimer de R2
          await c.env.MEDIA_BUCKET.delete(mediaInfo.file_key);
          console.log(`Média audio associé supprimé de R2: ${mediaInfo.file_key}`);
          
          // Supprimer de la table media
          await db.delete(media).where(eq(media.id, mediaId));
        } catch (mediaError) {
          console.error('Erreur lors de la suppression du média audio associé', mediaError);
        }
      }
    }

    // Supprimer le commentaire
    await db.delete(ticketComments).where(eq(ticketComments.id, id));

    return c.json({ success: true, message: 'Commentaire supprimé' });
  } catch (error) {
    console.error('Delete comment error:', error);
    return c.json({ error: 'Erreur lors de la suppression du commentaire' }, 500);
  }
});

export default comments;
