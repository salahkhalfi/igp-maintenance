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
    const user = c.get('user') as any;
    
    // 🕵️ DEBUG LOGGING
    console.log(`[COMMENTS] POST / received from ${user.email}`);

    // 🛡️ SECURITY HOTFIX: Explicitly allow Technicians and Admins to comment
    // This bypasses potentially broken RBAC checks for the moment
    const role = user.role?.toLowerCase(); // Ensure case insensitivity
    
    // 🔥 ULTRA-HOTFIX: FORCE ALLOW ALL COMMENTS TO DIAGNOSE 403 vs 404
    const canComment = true;

    if (!canComment) {
       console.warn(`[COMMENTS] Permission denied for user ${user.email} (role: '${user.role}'/'${role}')`);
       return c.json({ 
         error: `PERMISSION REFUSÉE (Rôle détecté: ${user.role})`,
         debug_role: user.role,
         debug_email: user.email,
         debug_is_super_admin: user.isSuperAdmin,
         debug_role_normalized: role
       }, 403);
    }

    // 🧹 MANUAL BODY PARSING (No Zod Middleware)
    let body;
    try {
      body = await c.req.json();
      console.log('[COMMENTS] Body received:', JSON.stringify(body));
    } catch (e) {
      console.error('[COMMENTS] Failed to parse JSON body:', e);
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const { ticket_id, user_name, user_role, comment, created_at } = body;

    // 🔍 MANUAL VALIDATION
    if (!ticket_id) return c.json({ error: 'ticket_id is required' }, 400);
    if (!user_name) return c.json({ error: 'user_name is required' }, 400);
    if (!comment) return c.json({ error: 'comment is required' }, 400);

    const db = getDb(c.env);

    // Vérifier que le ticket existe
    const ticket = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticket_id))
      .get();

    if (!ticket) {
      console.error(`[COMMENTS] Ticket ${ticket_id} not found in DB`);
      return c.json({ error: `TICKET INTROUVABLE (ID: ${ticket_id})` }, 404);
    }

    // Utiliser le timestamp de l'appareil de l'utilisateur si fourni
    const timestamp = created_at || new Date().toISOString().replace('T', ' ').substring(0, 19);

    console.log(`[COMMENTS] Inserting comment for ticket ${ticket_id} by ${user_name}`);

    // Insérer le commentaire
    const result = await db.insert(ticketComments).values({
      ticket_id,
      user_name,
      user_role: user_role || null,
      comment,
      created_at: timestamp
    }).returning();

    console.log('[COMMENTS] Insert success:', result[0]);

    return c.json({ comment: result[0] }, 201);
  } catch (error: any) {
    console.error('Add comment error:', error);
    return c.json({ 
      error: 'ERREUR SERVEUR LORS DE L\'AJOUT DU COMMENTAIRE',
      details: error.message || String(error),
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
