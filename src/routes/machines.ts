// Routes pour la gestion des machines

import { Hono } from 'hono';
import type { Bindings, Machine } from '../types';

const machines = new Hono<{ Bindings: Bindings }>();

// GET /api/machines - Liste toutes les machines
machines.get('/', async (c) => {
  try {
    const status = c.req.query('status');
    
    let query = 'SELECT * FROM machines WHERE 1=1';
    const params: any[] = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY location, machine_type';
    
    const stmt = params.length > 0 
      ? c.env.DB.prepare(query).bind(...params)
      : c.env.DB.prepare(query);
    
    const { results } = await stmt.all();
    
    return c.json({ machines: results });
  } catch (error) {
    console.error('Get machines error:', error);
    return c.json({ error: 'Erreur lors de la récupération des machines' }, 500);
  }
});

// GET /api/machines/:id - Détails d'une machine
machines.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const machine = await c.env.DB.prepare(
      'SELECT * FROM machines WHERE id = ?'
    ).bind(id).first() as Machine;
    
    if (!machine) {
      return c.json({ error: 'Machine non trouvée' }, 404);
    }
    
    // Récupérer les tickets associés
    const { results: tickets } = await c.env.DB.prepare(
      'SELECT * FROM tickets WHERE machine_id = ? ORDER BY created_at DESC'
    ).bind(id).all();
    
    return c.json({ 
      machine: {
        ...machine,
        tickets
      }
    });
  } catch (error) {
    console.error('Get machine error:', error);
    return c.json({ error: 'Erreur lors de la récupération de la machine' }, 500);
  }
});

// POST /api/machines - Créer une nouvelle machine (admin seulement)
machines.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { machine_type, model, serial_number, location } = body;
    
    // Validation basique
    if (!machine_type || !model || !serial_number) {
      return c.json({ error: 'Type, modèle et numéro de série requis' }, 400);
    }
    
    // Validation de longueur et contenu
    if (machine_type.trim().length < 2 || machine_type.length > 100) {
      return c.json({ error: 'Type de machine invalide (2-100 caractères)' }, 400);
    }
    
    if (model.trim().length < 1 || model.length > 100) {
      return c.json({ error: 'Modèle invalide (1-100 caractères)' }, 400);
    }
    
    if (serial_number.trim().length < 1 || serial_number.length > 50) {
      return c.json({ error: 'Numéro de série invalide (1-50 caractères)' }, 400);
    }
    
    if (location && location.length > 100) {
      return c.json({ error: 'Localisation trop longue (max 100 caractères)' }, 400);
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO machines (machine_type, model, serial_number, location, status)
      VALUES (?, ?, ?, ?, 'operational')
    `).bind(
      machine_type.trim(), 
      model.trim(), 
      serial_number.trim(), 
      location ? location.trim() : null
    ).run();
    
    if (!result.success) {
      return c.json({ error: 'Erreur lors de la création de la machine' }, 500);
    }
    
    const newMachine = await c.env.DB.prepare(
      'SELECT * FROM machines WHERE serial_number = ?'
    ).bind(serial_number).first();
    
    return c.json({ machine: newMachine }, 201);
  } catch (error) {
    console.error('Create machine error:', error);
    return c.json({ error: 'Erreur lors de la création de la machine' }, 500);
  }
});

// PATCH /api/machines/:id - Mettre à jour une machine (admin seulement)
machines.patch('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const updates: string[] = [];
    const params: any[] = [];
    
    if (body.machine_type) {
      updates.push('machine_type = ?');
      params.push(body.machine_type);
    }
    
    if (body.model) {
      updates.push('model = ?');
      params.push(body.model);
    }
    
    if (body.serial_number) {
      updates.push('serial_number = ?');
      params.push(body.serial_number);
    }
    
    if (body.location !== undefined) {
      updates.push('location = ?');
      params.push(body.location);
    }
    
    if (body.status) {
      updates.push('status = ?');
      params.push(body.status);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    await c.env.DB.prepare(
      `UPDATE machines SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();
    
    const updatedMachine = await c.env.DB.prepare(
      'SELECT * FROM machines WHERE id = ?'
    ).bind(id).first();
    
    return c.json({ machine: updatedMachine });
  } catch (error) {
    console.error('Update machine error:', error);
    return c.json({ error: 'Erreur lors de la mise à jour de la machine' }, 500);
  }
});

// DELETE /api/machines/:id - Supprimer une machine (admin seulement)
machines.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    // Vérifier qu'il n'y a pas de tickets associés
    const { results } = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM tickets WHERE machine_id = ?'
    ).bind(id).all();
    
    if (results[0] && (results[0] as any).count > 0) {
      return c.json({ 
        error: 'Impossible de supprimer une machine avec des tickets associés' 
      }, 400);
    }
    
    await c.env.DB.prepare(
      'DELETE FROM machines WHERE id = ?'
    ).bind(id).run();
    
    return c.json({ message: 'Machine supprimée avec succès' });
  } catch (error) {
    console.error('Delete machine error:', error);
    return c.json({ error: 'Erreur lors de la suppression de la machine' }, 500);
  }
});

export default machines;
