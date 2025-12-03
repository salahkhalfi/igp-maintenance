// Routes pour la gestion des commentaires sur les tickets
// Version ULTRA-SIMPLIFIÉE et ROBUSTE (Raw SQL)

import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyToken } from '../utils/jwt';
import type { Bindings } from '../types';

const comments = new Hono<{ Bindings: Bindings }>();

// OPTIONS handler for CORS preflight
comments.options('/', (c) => {
  return c.text('', 204);
});

// POST /api/comments - Ajouter un commentaire
comments.post('/', async (c) => {
  const start = Date.now();
  console.log(`[COMMENTS] Request received at ${new Date().toISOString()}`);

  try {
    // 1. AUTHENTICATION (Manual)
    let user: any = null;
    try {
        const cookieToken = getCookie(c, 'auth_token');
        const authHeader = c.req.header('Authorization');
        const token = cookieToken || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null);
        
        if (token) {
            user = await verifyToken(token, c.env.JWT_SECRET);
        }
    } catch (e) {
        console.warn('[COMMENTS] Auth check failed:', e);
    }
    
    const userName = user?.full_name || user?.email || 'Anonyme';
    const userRole = user?.role || 'anonymous';
    
    console.log(`[COMMENTS] User: ${userName} (${userRole})`);

    // 2. BODY PARSING (Manual & Safe)
    let body: any = {};
    try {
        const text = await c.req.text();
        if (text) {
            body = JSON.parse(text);
        }
    } catch (e) {
        console.error('[COMMENTS] JSON parse error:', e);
        return c.json({ error: 'Invalid JSON' }, 400);
    }

    console.log('[COMMENTS] Body:', JSON.stringify(body));

    // 3. VALIDATION
    const ticketId = Number(body.ticket_id);
    const commentText = String(body.comment || '').trim();
    const submittedUserName = String(body.user_name || userName);

    if (!ticketId || isNaN(ticketId)) {
        return c.json({ error: 'Invalid ticket_id' }, 400);
    }
    if (!commentText) {
        return c.json({ error: 'Empty comment' }, 400);
    }

    // 4. DATABASE INSERT (Raw SQL)
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    // Ensure DB exists
    if (!c.env.DB) {
        throw new Error('Database binding (DB) is missing');
    }

    console.log(`[COMMENTS] Inserting for Ticket ${ticketId}...`);

    try {
        const result = await c.env.DB.prepare(`
            INSERT INTO ticket_comments (ticket_id, user_name, user_role, comment, created_at)
            VALUES (?, ?, ?, ?, ?)
            RETURNING *
        `).bind(ticketId, submittedUserName, userRole, commentText, timestamp).first();

        console.log('[COMMENTS] Insert success:', JSON.stringify(result));
        
        return c.json({ comment: result }, 201);

    } catch (dbError: any) {
        console.error('[COMMENTS] SQL Error:', dbError);
        
        if (dbError.message && (dbError.message.includes('FOREIGN') || dbError.message.includes('constraint'))) {
            return c.json({ error: `Ticket ${ticketId} introuvable (Erreur intégrité)` }, 404);
        }
        throw dbError;
    }

  } catch (error: any) {
    console.error('[COMMENTS] Critical Error:', error);
    return c.json({ 
        error: 'Erreur serveur interne', 
        details: error.message,
        stack: error.stack 
    }, 500);
  } finally {
    console.log(`[COMMENTS] Request processed in ${Date.now() - start}ms`);
  }
});

// GET /api/comments/ticket/:ticketId
comments.get('/ticket/:ticketId', async (c) => {
    const ticketId = c.req.param('ticketId');
    console.log(`[COMMENTS] Fetching for ticket ${ticketId}`);
    
    try {
        const { results } = await c.env.DB.prepare(`
            SELECT * FROM ticket_comments 
            WHERE ticket_id = ? 
            ORDER BY created_at ASC
        `).bind(ticketId).all();
        
        return c.json({ comments: results });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// DELETE /api/comments/:id
comments.delete('/:id', async (c) => {
    const id = c.req.param('id');
    try {
        // Simple auth check for delete
        const authHeader = c.req.header('Authorization');
        if (!authHeader && !getCookie(c, 'auth_token')) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        
        await c.env.DB.prepare('DELETE FROM ticket_comments WHERE id = ?').bind(id).run();
        return c.json({ success: true });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

export default comments;
