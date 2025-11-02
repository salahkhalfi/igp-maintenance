// Routes pour la gestion des tickets

import { Hono } from 'hono';
import { generateTicketId } from '../utils/ticket-id';
import type { Bindings, CreateTicketRequest, UpdateTicketRequest, Ticket } from '../types';

const tickets = new Hono<{ Bindings: Bindings }>();

// GET /api/tickets - Liste tous les tickets
tickets.get('/', async (c) => {
  try {
    const status = c.req.query('status');
    const priority = c.req.query('priority');
    
    let query = `
      SELECT 
        t.*,
        m.machine_type, m.model, m.serial_number, m.location,
        u1.full_name as reporter_name, u1.email as reporter_email,
        u2.full_name as assignee_name, u2.email as assignee_email
      FROM tickets t
      LEFT JOIN machines m ON t.machine_id = m.id
      LEFT JOIN users u1 ON t.reported_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    
    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }
    
    query += ' ORDER BY t.created_at DESC';
    
    const stmt = params.length > 0 
      ? c.env.DB.prepare(query).bind(...params)
      : c.env.DB.prepare(query);
    
    const { results } = await stmt.all();
    
    return c.json({ tickets: results });
  } catch (error) {
    console.error('Get tickets error:', error);
    return c.json({ error: 'Erreur lors de la récupération des tickets' }, 500);
  }
});

// GET /api/tickets/:id - Détails d'un ticket
tickets.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    // Récupérer le ticket
    const ticket = await c.env.DB.prepare(`
      SELECT 
        t.*,
        m.machine_type, m.model, m.serial_number, m.location,
        u1.full_name as reporter_name, u1.email as reporter_email,
        u2.full_name as assignee_name, u2.email as assignee_email
      FROM tickets t
      LEFT JOIN machines m ON t.machine_id = m.id
      LEFT JOIN users u1 ON t.reported_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      WHERE t.id = ?
    `).bind(id).first();
    
    if (!ticket) {
      return c.json({ error: 'Ticket non trouvé' }, 404);
    }
    
    // Récupérer les médias
    const { results: media } = await c.env.DB.prepare(
      'SELECT * FROM media WHERE ticket_id = ? ORDER BY created_at DESC'
    ).bind(id).all();
    
    // Récupérer la timeline
    const { results: timeline } = await c.env.DB.prepare(`
      SELECT 
        tl.*,
        u.full_name as user_name, u.email as user_email
      FROM ticket_timeline tl
      LEFT JOIN users u ON tl.user_id = u.id
      WHERE tl.ticket_id = ?
      ORDER BY tl.created_at DESC
    `).bind(id).all();
    
    return c.json({ 
      ticket: {
        ...ticket,
        media,
        timeline
      }
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    return c.json({ error: 'Erreur lors de la récupération du ticket' }, 500);
  }
});

// POST /api/tickets - Créer un nouveau ticket
tickets.post('/', async (c) => {
  try {
    const user = c.get('user') as any;
    const body: CreateTicketRequest = await c.req.json();
    const { title, description, machine_id, priority } = body;
    
    // Validation
    if (!title || !description || !machine_id || !priority) {
      return c.json({ error: 'Tous les champs sont requis' }, 400);
    }
    
    // Récupérer les infos de la machine
    const machine = await c.env.DB.prepare(
      'SELECT machine_type, model FROM machines WHERE id = ?'
    ).bind(machine_id).first() as any;
    
    if (!machine) {
      return c.json({ error: 'Machine non trouvée' }, 404);
    }
    
    // Générer l'ID du ticket
    const ticket_id = generateTicketId(machine.machine_type, machine.model);
    
    // Créer le ticket
    const result = await c.env.DB.prepare(`
      INSERT INTO tickets (ticket_id, title, description, machine_id, priority, reported_by, status)
      VALUES (?, ?, ?, ?, ?, ?, 'received')
    `).bind(ticket_id, title, description, machine_id, priority, user.userId).run();
    
    if (!result.success) {
      return c.json({ error: 'Erreur lors de la création du ticket' }, 500);
    }
    
    // Récupérer le ticket créé
    const newTicket = await c.env.DB.prepare(
      'SELECT * FROM tickets WHERE ticket_id = ?'
    ).bind(ticket_id).first();
    
    // Ajouter l'entrée dans la timeline
    await c.env.DB.prepare(`
      INSERT INTO ticket_timeline (ticket_id, user_id, action, new_status, comment)
      VALUES (?, ?, 'Ticket créé', 'received', ?)
    `).bind((newTicket as any).id, user.userId, description).run();
    
    return c.json({ ticket: newTicket }, 201);
  } catch (error) {
    console.error('Create ticket error:', error);
    return c.json({ error: 'Erreur lors de la création du ticket' }, 500);
  }
});

// PATCH /api/tickets/:id - Mettre à jour un ticket
tickets.patch('/:id', async (c) => {
  try {
    const user = c.get('user') as any;
    const id = c.req.param('id');
    const body: UpdateTicketRequest = await c.req.json();
    
    // Récupérer le ticket actuel
    const currentTicket = await c.env.DB.prepare(
      'SELECT * FROM tickets WHERE id = ?'
    ).bind(id).first() as any;
    
    if (!currentTicket) {
      return c.json({ error: 'Ticket non trouvé' }, 404);
    }
    
    // Construire la requête de mise à jour
    const updates: string[] = [];
    const params: any[] = [];
    
    if (body.title) {
      updates.push('title = ?');
      params.push(body.title);
    }
    
    if (body.description) {
      updates.push('description = ?');
      params.push(body.description);
    }
    
    if (body.status) {
      updates.push('status = ?');
      params.push(body.status);
      
      if (body.status === 'completed') {
        updates.push('completed_at = CURRENT_TIMESTAMP');
      }
    }
    
    if (body.priority) {
      updates.push('priority = ?');
      params.push(body.priority);
    }
    
    if (body.assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      params.push(body.assigned_to);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    // Mettre à jour le ticket
    await c.env.DB.prepare(
      `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();
    
    // Ajouter l'entrée dans la timeline
    await c.env.DB.prepare(`
      INSERT INTO ticket_timeline (ticket_id, user_id, action, old_status, new_status, comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      user.userId,
      body.status ? 'Changement de statut' : 'Mise à jour',
      body.status ? currentTicket.status : null,
      body.status || null,
      body.comment || null
    ).run();
    
    // Récupérer le ticket mis à jour
    const updatedTicket = await c.env.DB.prepare(
      'SELECT * FROM tickets WHERE id = ?'
    ).bind(id).first();
    
    return c.json({ ticket: updatedTicket });
  } catch (error) {
    console.error('Update ticket error:', error);
    return c.json({ error: 'Erreur lors de la mise à jour du ticket' }, 500);
  }
});

// DELETE /api/tickets/:id - Supprimer un ticket (admin seulement)
tickets.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const result = await c.env.DB.prepare(
      'DELETE FROM tickets WHERE id = ?'
    ).bind(id).run();
    
    if (!result.success) {
      return c.json({ error: 'Erreur lors de la suppression du ticket' }, 500);
    }
    
    return c.json({ message: 'Ticket supprimé avec succès' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    return c.json({ error: 'Erreur lors de la suppression du ticket' }, 500);
  }
});

export default tickets;
