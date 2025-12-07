
import { Hono } from 'hono';
import { Bindings } from '../types';
import { getDb } from '../db';
import { tickets, machines, users } from '../db/schema';
import { eq, and, or, gte, lte, desc, asc, sql } from 'drizzle-orm';
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
      activeTickets = await db
        .select({
          id: tickets.id,
          ticket_id: tickets.ticket_id,
          title: tickets.title,
          description: tickets.description,
          status: tickets.status,
          priority: tickets.priority,
          scheduled_date: tickets.scheduled_date,
          created_at: tickets.created_at,
          machine_name: sql`${machines.machine_type} || ' ' || ${machines.model}`,
          assignee_name: users.first_name
        })
        .from(tickets)
        .leftJoin(machines, eq(tickets.machine_id, machines.id))
        .leftJoin(users, eq(tickets.assigned_to, users.id))
        .where(
          or(
            and(eq(tickets.status, 'in_progress')),
            and(gte(tickets.scheduled_date, startOfPast), lte(tickets.scheduled_date, endOfFuture)),
            and(eq(tickets.priority, 'critical'), or(eq(tickets.status, 'received'), eq(tickets.status, 'diagnostic')))
          )
        )
        .orderBy(
          sql`CASE WHEN ${tickets.priority} = 'critical' THEN 0 ELSE 1 END`,
          sql`CASE WHEN ${tickets.status} = 'in_progress' THEN 0 ELSE 1 END`,
          asc(tickets.scheduled_date)
        );
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

    return c.json({
      meta: {
        generated_at: new Date().toISOString(),
        version: "2.8.0"
      },
      stats,
      events: eventsResults,
      tickets: activeTickets,
      categories,
      message: dashboardMessage, // Legacy support
      broadcast_notes: dashboardNotes // New array support
    });

  } catch (error) {
    console.error('TV Data Error:', error);
    return c.json({ error: 'Erreur chargement données TV' }, 500);
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
