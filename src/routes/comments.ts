// Routes pour la gestion des commentaires sur les tickets
// Refactored to use Drizzle ORM + Zod Validation

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, asc } from 'drizzle-orm';
import { getDb } from '../db';
import { ticketComments, tickets, media } from '../db/schema';
import { createCommentSchema, ticketIdParamSchema, commentIdParamSchema } from '../schemas/comments';
import { authMiddleware, requirePermission } from '../middlewares/auth';
import type { Bindings } from '../types';

const comments = new Hono<{ Bindings: Bindings }>();

// POST /api/comments - Ajouter un commentaire à un ticket
comments.post('/', authMiddleware, async (c) => {
  try {
    // 🔍 DIAGNOSTIC MODE: Log everything
    const user = c.get('user') as any;
    console.log(`[COMMENTS] POST / received from ${user?.email}`);

    // 🧹 MANUAL BODY PARSING
    let body;
    try {
      body = await c.req.json();
      console.log('[COMMENTS] Raw body:', JSON.stringify(body));
    } catch (e) {
      console.error('[COMMENTS] JSON parse failed:', e);
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    // 🛡️ ROBUST EXTRACTION & CASTING
    // Force cast ticket_id to number
    const ticket_id = Number(body.ticket_id);
    const user_name = String(body.user_name || 'Anonyme');
    const comment = String(body.comment || '');
    const user_role = body.user_role ? String(body.user_role) : (user?.role || null);
    
    console.log(`[COMMENTS] Parsed: Ticket=${ticket_id}, User=${user_name}, Comment="${comment.substring(0, 10)}..."`);

    // 🔍 BASIC VALIDATION
    if (isNaN(ticket_id) || ticket_id <= 0) {
      console.error(`[COMMENTS] Invalid ticket_id: ${body.ticket_id}`);
      return c.json({ error: `Invalid ticket_id: ${body.ticket_id}` }, 400);
    }
    if (!comment.trim()) {
      console.error('[COMMENTS] Empty comment');
      return c.json({ error: 'Comment cannot be empty' }, 400);
    }

    const db = getDb(c.env);

    // ⚡ DIRECT INSERT with detailed error handling
    try {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        
        console.log('[COMMENTS] Executing INSERT query...');
        const result = await db.insert(ticketComments).values({
          ticket_id,
          user_name,
          user_role,
          comment,
          created_at: timestamp
        }).returning();

        console.log('[COMMENTS] Insert SUCCESS:', JSON.stringify(result[0]));
        return c.json({ comment: result[0] }, 201);

    } catch (dbError: any) {
        console.error('[COMMENTS] Database Insert Failed:', dbError);
        
        // Check for FK constraint failure
        if (dbError.message && (dbError.message.includes('FOREIGN KEY') || dbError.message.includes('constraint'))) {
             return c.json({ 
                 error: `TICKET INTROUVABLE (ID: ${ticket_id}) - Échec contrainte intégrité`,
                 details: dbError.message 
             }, 404);
        }

        return c.json({ 
            error: 'ERREUR BASE DE DONNÉES',
            details: dbError.message || String(dbError)
        }, 500);
    }

  } catch (error: any) {
    console.error('Add comment critical error:', error);
    return c.json({ 
      error: 'ERREUR CRITIQUE DU SERVEUR',
      details: error.message,
      stack: error.stack
    }, 500);
  }
});

// GET /api/comments/ticket/:ticketId - Liste les commentaires d'un ticket
comments.get('/ticket/:ticketId', authMiddleware, zValidator('param', ticketIdParamSchema), async (c) => {
  try {
    const user = c.get('user') as any;
    
    // 🛡️ SECURITY HOTFIX
    const canRead = 
      user.role === 'admin' || 
      user.role === 'technician' || 
      user.role === 'supervisor' ||
      await hasPermission(c.env.DB, user.role, 'tickets', 'read', 'all', user.isSuperAdmin);

    if (!canRead) {
       return c.json({ error: 'Permission refusée' }, 403);
    }

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
comments.delete('/:id', authMiddleware, requirePermission('tickets', 'read'), zValidator('param', commentIdParamSchema), async (c) => {
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
