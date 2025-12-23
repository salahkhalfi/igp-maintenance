// Routes pour la gestion des machines
// Refactored to use Drizzle ORM for type safety

import { Hono } from 'hono';
import { eq, and, desc, sql } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { getDb } from '../db';
import { machines, tickets } from '../db/schema';
import { adminOnly } from '../middlewares/auth';
import { machineIdParamSchema, getMachinesQuerySchema, createMachineSchema, updateMachineSchema } from '../schemas/machines';
import type { Bindings } from '../types';

const machinesRoute = new Hono<{ Bindings: Bindings }>();

// GET /api/machines - Liste toutes les machines
machinesRoute.get('/', zValidator('query', getMachinesQuerySchema), async (c) => {
  try {
    const { status } = c.req.valid('query');
    const db = getDb(c.env);

    const conditions = [];
    if (status) {
      conditions.push(eq(machines.status, status));
    }

    // AUDIT FIX: Exclure les machines soft-deleted
    const results = await db
      .select()
      .from(machines)
      .where(and(...conditions, sql`${machines.deleted_at} IS NULL`))
      .orderBy(machines.location, machines.machine_type);

    return c.json({ machines: results });
  } catch (error) {
    console.error('Get machines error:', error);
    return c.json({ error: 'Erreur lors de la récupération des machines' }, 500);
  }
});

// GET /api/machines/:id - Détails d'une machine
machinesRoute.get('/:id', zValidator('param', machineIdParamSchema), async (c) => {
  try {
    const { id } = c.req.valid('param');
    
    const db = getDb(c.env);

    // AUDIT FIX: Exclure les machines soft-deleted
    const machine = await db
      .select()
      .from(machines)
      .where(and(eq(machines.id, id), sql`${machines.deleted_at} IS NULL`))
      .get();

    if (!machine) {
      return c.json({ error: 'Machine non trouvée' }, 404);
    }

    // Récupérer les tickets associés
    const machineTickets = await db
      .select()
      .from(tickets)
      .where(eq(tickets.machine_id, id))
      .orderBy(desc(tickets.created_at));

    return c.json({
      machine: {
        ...machine,
        tickets: machineTickets
      }
    });
  } catch (error) {
    console.error('Get machine error:', error);
    return c.json({ error: 'Erreur lors de la récupération de la machine' }, 500);
  }
});

// POST /api/machines - Créer une nouvelle machine (admin seulement)
machinesRoute.post('/', adminOnly, zValidator('json', createMachineSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    const { machine_type, model, serial_number, location, manufacturer, year, technical_specs } = body;

    const db = getDb(c.env);
    
    const result = await db.insert(machines).values({
      machine_type: machine_type.trim(),
      model: model ? model.trim() : null,
      serial_number: serial_number ? serial_number.trim() : null,
      location: location ? location.trim() : null,
      manufacturer: manufacturer ? manufacturer.trim() : null,
      year: year || null,
      technical_specs: technical_specs ? technical_specs.trim() : null,
      status: 'operational'
    }).returning();

    return c.json({ machine: result[0] }, 201);
  } catch (error) {
    console.error('Create machine error:', error);
    return c.json({ error: 'Erreur lors de la création de la machine' }, 500);
  }
});

// PATCH /api/machines/:id - Mettre à jour une machine (admin seulement)
machinesRoute.patch('/:id', adminOnly, zValidator('param', machineIdParamSchema), zValidator('json', updateMachineSchema), async (c) => {
  try {
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const db = getDb(c.env);

    const updates: any = {
      updated_at: sql`CURRENT_TIMESTAMP`
    };

    if (body.machine_type !== undefined) updates.machine_type = body.machine_type;
    if (body.model !== undefined) updates.model = body.model ? body.model.trim() : null;
    if (body.serial_number !== undefined) updates.serial_number = body.serial_number ? body.serial_number.trim() : null;
    if (body.location !== undefined) updates.location = body.location ? body.location.trim() : null;
    if (body.manufacturer !== undefined) updates.manufacturer = body.manufacturer ? body.manufacturer.trim() : null;
    if (body.year !== undefined) updates.year = body.year;
    if (body.technical_specs !== undefined) updates.technical_specs = body.technical_specs ? body.technical_specs.trim() : null;
    if (body.status !== undefined) updates.status = body.status;

    const result = await db.update(machines)
      .set(updates)
      .where(eq(machines.id, id))
      .returning();

    if (!result.length) {
      return c.json({ error: 'Machine non trouvée' }, 404);
    }

    // === SYNC: Machine status → Tickets is_machine_down ===
    // When machine status changes from Machine Management, sync to all active tickets
    if (body.status !== undefined) {
      const isMachineDown = body.status === 'out_of_service';
      const machineName = `${result[0].machine_type || 'Machine'} ${result[0].model || ''}`.trim();
      
      // Update all non-closed tickets for this machine
      await db.update(tickets)
        .set({ 
          is_machine_down: isMachineDown,
          updated_at: sql`CURRENT_TIMESTAMP`
        })
        .where(
          and(
            eq(tickets.machine_id, id),
            sql`tickets.status NOT IN ('resolved', 'closed', 'completed', 'cancelled', 'archived')`,
            sql`tickets.deleted_at IS NULL`
          )
        );
      
      console.log(`[Machine Sync] Machine #${id} (${machineName}) status=${body.status} → Updated tickets is_machine_down=${isMachineDown}`);

      // === AUTO TV BROADCAST ===
      try {
        if (isMachineDown) {
          // Check if alert already exists for this machine
          const existingAlert = await c.env.DB.prepare(`
            SELECT id FROM broadcast_messages WHERE is_auto_generated = 1 AND source_machine_id = ?
          `).bind(id).first();

          if (!existingAlert) {
            // Create urgent TV broadcast
            await c.env.DB.prepare(`
              INSERT INTO broadcast_messages (type, title, content, display_duration, priority, is_active, is_auto_generated, source_machine_id)
              VALUES ('alert', ?, ?, 30, 100, 1, 1, ?)
            `).bind(
              `🚨 MACHINE À L'ARRÊT`,
              `${machineName} - Mise hors service`,
              id
            ).run();
            console.log(`[TV Broadcast] Auto-created alert for machine ${machineName} (from Machine Management)`);
          }
        } else {
          // Remove auto-generated alert when machine is back operational
          await c.env.DB.prepare(`
            DELETE FROM broadcast_messages WHERE is_auto_generated = 1 AND source_machine_id = ?
          `).bind(id).run();
          console.log(`[TV Broadcast] Removed auto-alert for machine #${id}`);
        }
      } catch (broadcastError) {
        console.error('[TV Broadcast] Error managing auto-alert:', broadcastError);
      }
    }

    return c.json({ machine: result[0] });
  } catch (error) {
    console.error('Update machine error:', error);
    return c.json({ error: 'Erreur lors de la mise à jour de la machine' }, 500);
  }
});

// DELETE /api/machines/:id - Supprimer une machine (admin seulement)
machinesRoute.delete('/:id', adminOnly, zValidator('param', machineIdParamSchema), async (c) => {
  try {
    const { id } = c.req.valid('param');
    
    const db = getDb(c.env);

    // Vérifier qu'il n'y a pas de tickets associés
    // Using Drizzle to count
    const ticketCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(tickets)
      .where(eq(tickets.machine_id, id))
      .get();

    if (ticketCount && ticketCount.count > 0) {
      return c.json({
        error: 'Impossible de supprimer une machine avec des tickets associés'
      }, 400);
    }

    await db.delete(machines).where(eq(machines.id, id));

    return c.json({ message: 'Machine supprimée avec succès' });
  } catch (error) {
    console.error('Delete machine error:', error);
    return c.json({ error: 'Erreur lors de la suppression de la machine' }, 500);
  }
});

export default machinesRoute;
