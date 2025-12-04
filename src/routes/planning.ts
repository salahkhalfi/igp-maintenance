
import { Hono } from 'hono';
import { Bindings } from '../types';
import { authMiddleware, requirePermission, adminOnly } from '../middlewares/auth';
import { getDb } from '../db';
import { messages } from '../db/schema';
import { sendPushNotification } from './push';
import { formatUserName } from '../utils/userFormatter';

const app = new Hono<{ Bindings: Bindings }>();

// Middleware d'authentification pour toutes les routes planning
app.use('*', authMiddleware);

/**
 * POST /api/planning/share
 * Partager le planning avec un utilisateur spécifique (envoie une notification/message)
 */
app.post('/share', adminOnly, async (c) => {
  try {
    const user = c.get('user') as any;
    const body = await c.req.json();
    const { targetUserId, message } = body;

    if (!targetUserId) {
      return c.json({ error: 'Utilisateur cible requis' }, 400);
    }

    const db = getDb(c.env);
    const senderName = formatUserName(user, 'L\'administrateur');

    // 1. Créer le contenu du message
    const defaultMessage = "📅 Je vous invite à consulter le planning de production.";
    const content = message || defaultMessage;
    const fullContent = `${content} [Voir le Planning](/planning)`;

    // 2. Insérer dans la messagerie interne
    const result = await db.insert(messages).values({
      sender_id: Number(user.userId),
      recipient_id: Number(targetUserId),
      message_type: 'private',
      content: fullContent,
      is_read: 0
    }).returning();
    
    // 3. Envoyer la notification Push
    const pushResult = await sendPushNotification(c.env, Number(targetUserId), {
      title: '📅 Planning Partagé',
      body: `${senderName} vous a partagé le planning de production.`,
      icon: '/icon-192.png',
      data: {
        url: '/planning',
        action: 'share_planning',
        senderId: user.userId
      }
    });

    return c.json({ 
      success: true, 
      message: 'Invitation envoyée avec succès',
      pushSent: pushResult.success
    });

  } catch (error) {
    console.error('Share planning error:', error);
    return c.json({ error: 'Erreur lors du partage du planning' }, 500);
  }
});

/**
 * GET /api/planning
 * Récupère toutes les données du planning (événements, catégories, notes)
 */
app.get('/', async (c) => {
  try {
    const user = c.get('user') as any;

    // 1. Récupérer les catégories
    const categories = await c.env.DB.prepare(
      'SELECT * FROM planning_categories ORDER BY label ASC'
    ).all();

    // 2. Récupérer les événements (optionnel: filtrer par date si nécessaire, ici on prend tout pour simplifier)
    const events = await c.env.DB.prepare(
      'SELECT * FROM planning_events ORDER BY date ASC'
    ).all();

    // 3. Récupérer les notes
    // Idéalement filtrer par user_id si on veut des notes privées, mais le schéma actuel est partagé ou manque user_id sur certains environnements
    // On va vérifier si la colonne user_id existe dans une version future, pour l'instant on prend tout
    // Note: planner_notes a user_id ajouté dans la migration 0033, on va essayer de l'utiliser si possible
    let notes;
    try {
      notes = await c.env.DB.prepare(
        'SELECT * FROM planner_notes WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC'
      ).bind(user.id).all();
    } catch (e) {
      // Fallback si la colonne user_id n'existe pas encore
      notes = await c.env.DB.prepare(
        'SELECT * FROM planner_notes ORDER BY created_at DESC'
      ).all();
    }

    return c.json({
      categories: categories.results,
      events: events.results,
      notes: notes.results
    });

  } catch (error) {
    console.error('Error fetching planning data:', error);
    return c.json({ error: 'Erreur lors du chargement du planning' }, 500);
  }
});

// ==========================================
// ÉVÉNEMENTS (EVENTS)
// ==========================================

app.post('/events', requirePermission('planning', 'manage'), async (c) => {
  try {
    const body = await c.req.json();
    const { date, type, title, details, status } = body;

    const result = await c.env.DB.prepare(
      `INSERT INTO planning_events (date, type, title, details, status) 
       VALUES (?, ?, ?, ?, ?)`
    ).bind(date, type, title, details || '', status || 'confirmed').run();

    return c.json({
      id: result.meta.last_row_id,
      date, type, title, details, status
    }, 201);
  } catch (error) {
    return c.json({ error: 'Erreur création événement' }, 500);
  }
});

app.put('/events/:id', requirePermission('planning', 'manage'), async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Construction dynamique de la requête UPDATE
    const updates: string[] = [];
    const values: any[] = [];

    if (body.date !== undefined) { updates.push('date = ?'); values.push(body.date); }
    if (body.type !== undefined) { updates.push('type = ?'); values.push(body.type); }
    if (body.title !== undefined) { updates.push('title = ?'); values.push(body.title); }
    if (body.details !== undefined) { updates.push('details = ?'); values.push(body.details); }
    if (body.status !== undefined) { updates.push('status = ?'); values.push(body.status); }

    if (updates.length === 0) return c.json({ message: 'Rien à modifier' });

    values.push(id);

    await c.env.DB.prepare(
      `UPDATE planning_events SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Erreur modification événement' }, 500);
  }
});

app.delete('/events/:id', requirePermission('planning', 'manage'), async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM planning_events WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Erreur suppression événement' }, 500);
  }
});

// ==========================================
// CATÉGORIES
// ==========================================

app.post('/categories', requirePermission('planning', 'manage'), async (c) => {
  try {
    const body = await c.req.json();
    const { id, label, icon, color } = body;
    // Si id pas fourni, on en génère un (le frontend envoie souvent 'cat_' + timestamp)
    const catId = id || `cat_${Date.now()}`;

    await c.env.DB.prepare(
      `INSERT INTO planning_categories (id, label, icon, color) VALUES (?, ?, ?, ?)`
    ).bind(catId, label, icon, color).run();

    return c.json({ id: catId, label, icon, color }, 201);
  } catch (error) {
    return c.json({ error: 'Erreur création catégorie' }, 500);
  }
});

app.put('/categories/:id', requirePermission('planning', 'manage'), async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    await c.env.DB.prepare(
      `UPDATE planning_categories SET label = ?, icon = ?, color = ? WHERE id = ?`
    ).bind(body.label, body.icon, body.color, id).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Erreur modification catégorie' }, 500);
  }
});

app.delete('/categories/:id', requirePermission('planning', 'manage'), async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM planning_categories WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Erreur suppression catégorie' }, 500);
  }
});

// ==========================================
// NOTES
// ==========================================

app.post('/notes', async (c) => {
  try {
    const user = c.get('user') as any;
    const body = await c.req.json();
    const { text, time, date, priority } = body;

    // Essayer d'insérer avec user_id
    try {
      const result = await c.env.DB.prepare(
        `INSERT INTO planner_notes (text, time, date, priority, done, user_id) VALUES (?, ?, ?, ?, 0, ?)`
      ).bind(text, time, date || null, priority || 'medium', user.id).run();
      
      return c.json({
        id: result.meta.last_row_id,
        text, time, date, priority, done: false, user_id: user.id
      }, 201);
    } catch (e) {
      // Fallback sans user_id (si migration pas appliquée)
      const result = await c.env.DB.prepare(
        `INSERT INTO planner_notes (text, time, date, priority, done) VALUES (?, ?, ?, ?, 0)`
      ).bind(text, time, date || null, priority || 'medium').run();
      
      return c.json({
        id: result.meta.last_row_id,
        text, time, date, priority, done: false
      }, 201);
    }
  } catch (error) {
    return c.json({ error: 'Erreur création note' }, 500);
  }
});

app.put('/notes/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    // Construction dynamique de la requête UPDATE
    const updates: string[] = [];
    const values: any[] = [];

    if (body.done !== undefined) {
      updates.push('done = ?');
      values.push(body.done ? 1 : 0);
    }
    if (body.text !== undefined) {
      updates.push('text = ?');
      values.push(body.text);
    }
    if (body.time !== undefined) {
      updates.push('time = ?');
      values.push(body.time);
    }
    if (body.date !== undefined) {
      updates.push('date = ?');
      values.push(body.date);
    }
    if (body.priority !== undefined) {
      updates.push('priority = ?');
      values.push(body.priority);
    }

    if (updates.length === 0) return c.json({ message: 'Rien à modifier' });

    values.push(id);

    await c.env.DB.prepare(
      `UPDATE planner_notes SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Erreur modification note' }, 500);
  }
});

app.delete('/notes/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM planner_notes WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Erreur suppression note' }, 500);
  }
});

export default app;
