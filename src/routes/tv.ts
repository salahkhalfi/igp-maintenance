
import { Hono } from 'hono';
import { Bindings } from '../types';
import { getDb } from '../db';
import { tickets, machines, users } from '../db/schema';
import { eq, and, or, gte, lte, desc, asc, sql, not, inArray } from 'drizzle-orm';
import { authMiddleware, adminOnly } from '../middlewares/auth';

const app = new Hono<{ Bindings: Bindings }>();

/**
 * Helper: Get current TV Key
 * Priority: DB > Env
 */
async function getTvKey(c: any): Promise<string | null> {
  try {
    // Try DB first
    const result = await c.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'tv_access_key'
    `).first();
    
    if (result && result.setting_value) {
      return result.setting_value as string;
    }
  } catch (e) {
    // Ignore DB error, fallback to env
  }
  
  // Fallback to env
  return c.env.TV_ACCESS_KEY || null;
}

/**
 * Middleware: Vérification de la clé d'accès TV
 */
const checkTvKey = async (c: any, next: any) => {
  const key = c.req.query('key');
  const currentKey = await getTvKey(c);

  // Si pas de clé configurée ou clé incorrecte
  if (!currentKey || key !== currentKey) {
    // Petit délai pour éviter brute-force
    await new Promise(resolve => setTimeout(resolve, 1000));
    return c.html(`
      <!DOCTYPE html>
      <html class="bg-gray-900 text-white h-full">
      <head><meta charset="UTF-8"><title>Accès Refusé</title><script src="https://cdn.tailwindcss.com"></script></head>
      <body class="h-full flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-red-500 mb-4">🔒 Accès Refusé</h1>
          <p class="text-gray-400">Clé d'accès invalide ou manquante.</p>
        </div>
      </body>
      </html>
    `, 403);
  }
  await next();
};

/**
 * GET /api/tv/data
 * Récupère toutes les données pour l'affichage TV
 */
app.get('/data', checkTvKey, async (c) => {
  try {
    const db = getDb(c.env);
    
    // Dates pour le filtrage (Aujourd'hui - 90 jours -> +180 jours pour supporter navigation)
    const now = new Date();
    // Go back 90 days
    const past = new Date(now);
    past.setDate(past.getDate() - 90);
    const startOfPast = new Date(past.getFullYear(), past.getMonth(), past.getDate()).toISOString();
    
    const future = new Date(now);
    future.setDate(future.getDate() + 180); // 6 mois
    const endOfFuture = new Date(future.getFullYear(), future.getMonth(), future.getDate(), 23, 59, 59).toISOString();
    
    // Start of today for stats
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // 1. Récupérer les Événements du Planning
    let eventsResults = [];
    try {
      const events = await c.env.DB.prepare(`
        SELECT 
          e.*,
          c.label as category_label,
          c.color as category_color,
          c.icon as category_icon
        FROM planning_events e
        LEFT JOIN planning_categories c ON e.type = c.id
        WHERE e.date >= ? AND e.date <= ? AND (e.show_on_tv IS NULL OR e.show_on_tv = 1)
        ORDER BY e.date ASC
      `).bind(startOfPast, endOfFuture).all();
      eventsResults = events.results || [];
    } catch (e) {
      console.error('TV: Error fetching events, skipping:', e);
      // Ignore error, return empty events
    }

    // 2. Récupérer les Tickets
    let activeTickets = [];
    try {
      // Use raw SQL for multiple joins to same table (assignee + reporter)
      const ticketsQuery = await c.env.DB.prepare(`
        SELECT 
          t.id,
          t.ticket_id,
          t.title,
          t.description,
          t.status,
          t.priority,
          t.scheduled_date,
          t.created_at,
          COALESCE(m.machine_type, 'Machine') || ' ' || COALESCE(m.model, '') as machine_name,
          assignee.id as assignee_id,
          assignee.first_name as assignee_name,
          assignee.avatar_key as assignee_avatar,
          UPPER(SUBSTR(COALESCE(assignee.first_name, '?'), 1, 1)) as assignee_initial,
          reporter.id as reporter_id,
          reporter.first_name as reporter_name,
          reporter.avatar_key as reporter_avatar,
          UPPER(SUBSTR(COALESCE(reporter.first_name, '?'), 1, 1)) as reporter_initial
        FROM tickets t
        LEFT JOIN machines m ON t.machine_id = m.id
        LEFT JOIN users assignee ON t.assigned_to = assignee.id
        LEFT JOIN users reporter ON t.reported_by = reporter.id
        WHERE t.deleted_at IS NULL
          AND t.status NOT IN ('resolved', 'closed', 'completed', 'cancelled', 'archived')
          AND (
            t.status = 'in_progress'
            OR (t.scheduled_date >= ? AND t.scheduled_date <= ?)
            OR (t.priority = 'critical' AND t.status IN ('received', 'diagnostic'))
          )
        ORDER BY 
          CASE WHEN t.priority = 'critical' THEN 0 ELSE 1 END,
          CASE WHEN t.status = 'in_progress' THEN 0 ELSE 1 END,
          t.scheduled_date ASC
      `).bind(startOfPast, endOfFuture).all();
      
      activeTickets = ticketsQuery.results || [];
      
      /* Original Drizzle query (replaced for double join):
      activeTickets = await db
        .select({
          id: tickets.id,
          ticket_id: tickets.ticket_id,
          title: tickets.title,
          description: tickets.description,
      */
    } catch (e) {
      console.error('TV: Error fetching tickets:', e);
      throw e; // Critical error
    }

    // 3. Récupérer les définitions des catégories pour la légende
    let categories = [];
    try {
      const cats = await c.env.DB.prepare('SELECT * FROM planning_categories ORDER BY id ASC').all();
      categories = cats.results || [];
    } catch (e) {
      console.error('TV: Error fetching categories:', e);
    }


    // 4. Stats rapides pour le header
    // Note: On garde les stats focalisées sur "Aujourd'hui" pour les KPI, même si on retourne plus de données
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const todayEndIso = todayEnd.toISOString();

    const stats = {
      urgent: activeTickets.filter(t => t.priority === 'critical').length,
      in_progress: activeTickets.filter(t => t.status === 'in_progress').length,
      today_count: activeTickets.filter(t => t.scheduled_date && t.scheduled_date >= startOfDay && t.scheduled_date <= todayEndIso).length + 
                   eventsResults.filter(e => e.date >= startOfDay && e.date <= todayEndIso).length
    };

    // 5. Récupérer TOUS les messages du dashboard (Array pour rotation)
    let dashboardNotes = [];
    try {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      
      // On récupère toutes les notes actives pour le dashboard
      // On inclut celles qui sont "futures" pour la logique de priorité
      const notes = await c.env.DB.prepare(`
        SELECT id, text, time, end_time, date 
        FROM planner_notes 
        WHERE is_dashboard = 1 
        AND done = 0
        ORDER BY date ASC, time ASC
      `).all();
      
      if (notes && notes.results) {
        dashboardNotes = notes.results;
      }
    } catch (e) {
      console.error('TV: Error fetching dashboard notes:', e);
    }

    // 6. Compatibilité ascendante : Message unique (le plus pertinent)
    // On garde la logique "legacy" pour les vieux clients TV qui n'auraient pas reloadé
    let dashboardMessage = null;
    if (dashboardNotes.length > 0) {
        // Simple fallback: take the first one or the "most current" one
        dashboardMessage = dashboardNotes[0].text;
    }

    // 7. Récupérer les Messages de Diffusion (Nouveau système - Images/Galeries)
    let broadcastMessages = [];
    try {
        // Fix Timezone Issue: Use Local Date (Eastern Time - UTC-5)
        // Cloudflare Workers uses UTC. We need to match user's day in Quebec.
        const now = new Date();
        const localDate = new Date(now.getTime() - (5 * 60 * 60 * 1000)); // UTC-5
        const localDateStr = localDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const localNowIso = localDate.toISOString();

        const msgs = await c.env.DB.prepare(`
            SELECT * FROM broadcast_messages 
            WHERE is_active = 1 
            AND (start_date IS NULL OR start_date <= ?)
            AND (end_date IS NULL OR end_date >= ?)
            ORDER BY priority DESC, created_at DESC
        `).bind(localDateStr, localDateStr).all();
        broadcastMessages = msgs.results || [];
        
        // Parse media_urls JSON
        broadcastMessages = broadcastMessages.map((msg: any) => ({
            ...msg,
            media_urls: msg.media_urls ? JSON.parse(msg.media_urls) : [],
            is_active: Boolean(msg.is_active)
        }));

        // 8. NOTE: Planning Events are NO LONGER merged into Broadcasts
        // They are handled by the frontend DetailsManager for simultaneous display
        // as requested by user (Photo + Details together on hover).

    } catch (e) {
        console.error('TV: Error fetching broadcast messages:', e);
    }

    // Get location settings for weather (from DB, no hardcoding)
    let location = { latitude: '45.5017', longitude: '-73.5673', timezone: 'America/Toronto' };
    try {
      const locSettings = await c.env.DB.prepare(`
        SELECT setting_key, setting_value FROM system_settings 
        WHERE setting_key IN ('location_latitude', 'location_longitude', 'location_timezone')
      `).all();
      for (const s of locSettings.results || []) {
        if (s.setting_key === 'location_latitude') location.latitude = s.setting_value as string;
        if (s.setting_key === 'location_longitude') location.longitude = s.setting_value as string;
        if (s.setting_key === 'location_timezone') location.timezone = s.setting_value as string;
      }
    } catch (e) { /* use defaults */ }

    return c.json({
      meta: {
        generated_at: new Date().toISOString(),
        version: "2.9.0"
      },
      stats,
      events: eventsResults,
      tickets: activeTickets,
      categories,
      message: dashboardMessage, // Legacy support
      broadcast_notes: dashboardNotes, // Notes textuelles
      broadcast_messages: broadcastMessages, // Riche contenu (Images/Galeries)
      location // Weather location from config
    });

  } catch (error) {
    console.error('TV Data Error:', error);
    return c.json({ error: 'Erreur chargement données TV' }, 500);
  }
});


/**
 * GET /api/tv/admin/messages
 * Récupère tous les messages de diffusion (admin)
 */
app.get('/admin/messages', authMiddleware, adminOnly, async (c) => {
    try {
        const result = await c.env.DB.prepare(`
            SELECT * FROM broadcast_messages ORDER BY created_at DESC
        `).all();
        
        const messages = (result.results || []).map((msg: any) => ({
            ...msg,
            media_urls: msg.media_urls ? JSON.parse(msg.media_urls) : [],
            is_active: Boolean(msg.is_active)
        }));

        return c.json({ messages });
    } catch (error) {
        console.error('TV Admin Get Messages Error:', error);
        return c.json({ error: 'Erreur chargement messages' }, 500);
    }
});

/**
 * POST /api/tv/admin/messages
 * Créer un nouveau message de diffusion
 */
app.post('/admin/messages', authMiddleware, adminOnly, async (c) => {
    try {
        const body = await c.req.json();
        const { type, title, content, media_urls, display_duration, start_date, end_date, priority, is_active } = body;
        
        const user = c.get('user') as any;

        const result = await c.env.DB.prepare(`
            INSERT INTO broadcast_messages (type, title, content, media_urls, display_duration, start_date, end_date, priority, is_active, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            type || 'text',
            title || null,
            content || null,
            JSON.stringify(media_urls || []),
            display_duration || 15,
            start_date || null,
            end_date || null,
            priority || 0,
            is_active !== undefined ? (is_active ? 1 : 0) : 1,
            user.userId || user.id
        ).run();

        return c.json({ success: true, id: result.meta.last_row_id });
    } catch (error) {
        console.error('TV Admin Create Message Error:', error);
        return c.json({ error: 'Erreur création message' }, 500);
    }
});

/**
 * PUT /api/tv/admin/messages/:id
 * Modifier un message de diffusion
 */
app.put('/admin/messages/:id', authMiddleware, adminOnly, async (c) => {
    try {
        const id = c.req.param('id');
        const body = await c.req.json();
        
        const updates: string[] = [];
        const values: any[] = [];

        if (body.type !== undefined) { updates.push('type = ?'); values.push(body.type); }
        if (body.title !== undefined) { updates.push('title = ?'); values.push(body.title); }
        if (body.content !== undefined) { updates.push('content = ?'); values.push(body.content); }
        if (body.media_urls !== undefined) { updates.push('media_urls = ?'); values.push(JSON.stringify(body.media_urls)); }
        if (body.display_duration !== undefined) { updates.push('display_duration = ?'); values.push(body.display_duration); }
        if (body.start_date !== undefined) { updates.push('start_date = ?'); values.push(body.start_date); }
        if (body.end_date !== undefined) { updates.push('end_date = ?'); values.push(body.end_date); }
        if (body.priority !== undefined) { updates.push('priority = ?'); values.push(body.priority); }
        if (body.is_active !== undefined) { updates.push('is_active = ?'); values.push(body.is_active ? 1 : 0); }

        if (updates.length === 0) return c.json({ message: 'Rien à modifier' });

        values.push(id);

        await c.env.DB.prepare(`
            UPDATE broadcast_messages SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).bind(...values).run();

        return c.json({ success: true });
    } catch (error) {
        console.error('TV Admin Update Message Error:', error);
        return c.json({ error: 'Erreur modification message' }, 500);
    }
});

/**
 * DELETE /api/tv/admin/messages/:id
 * Supprimer un message de diffusion
 */
app.delete('/admin/messages/:id', authMiddleware, adminOnly, async (c) => {
    try {
        const id = c.req.param('id');
        await c.env.DB.prepare('DELETE FROM broadcast_messages WHERE id = ?').bind(id).run();
        return c.json({ success: true });
    } catch (error) {
        console.error('TV Admin Delete Message Error:', error);
        return c.json({ error: 'Erreur suppression message' }, 500);
    }
});

/**
 * GET /api/tv/admin/config
 * Récupère le lien sécurisé pour l'admin (authentification requise)
 */
app.get('/admin/config', authMiddleware, adminOnly, async (c) => {
  try {
    const currentKey = await getTvKey(c);
    const url = new URL(c.req.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const fullUrl = `${baseUrl}/tv.html?key=${currentKey}`;
    
    return c.json({
      key: currentKey,
      url: fullUrl
    });
  } catch (error) {
    console.error('TV Admin Config Error:', error);
    return c.json({ error: 'Erreur configuration TV' }, 500);
  }
});

/**
 * POST /api/tv/admin/regenerate
 * Génère une nouvelle clé d'accès aléatoire
 */
app.post('/admin/regenerate', authMiddleware, adminOnly, async (c) => {
  try {
    // Generate random key (32 chars hex)
    const newKey = 'igp_' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
      
    // Save to DB
    await c.env.DB.prepare(`
      INSERT INTO system_settings (setting_key, setting_value) 
      VALUES ('tv_access_key', ?)
      ON CONFLICT(setting_key) DO UPDATE SET 
        setting_value = excluded.setting_value,
        updated_at = CURRENT_TIMESTAMP
    `).bind(newKey).run();
    
    const url = new URL(c.req.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const fullUrl = `${baseUrl}/tv.html?key=${newKey}`;

    return c.json({
      key: newKey,
      url: fullUrl,
      message: 'Nouvelle clé générée avec succès'
    });
  } catch (error) {
    console.error('TV Admin Regenerate Error:', error);
    return c.json({ error: 'Erreur génération clé' }, 500);
  }
});

export default app;
