// Routes pour la gestion des tickets
// Refactored to use Drizzle ORM + Zod Validation

import { Hono } from 'hono';
import { eq, and, desc, sql, getTableColumns, aliasedTable } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { getDb } from '../db';
import { tickets, machines, users, media, ticketTimeline, pushLogs } from '../db/schema';
import { generateTicketId } from '../utils/ticket-id';
import { formatUserName } from '../utils/userFormatter';
import { sendToPabbly } from '../utils/pabbly';
import { createTicketSchema, updateTicketSchema, ticketIdParamSchema, getTicketsQuerySchema } from '../schemas/tickets';
import type { Bindings } from '../types';

const ticketsRoute = new Hono<{ Bindings: Bindings }>();

// GET /api/tickets - Liste tous les tickets
ticketsRoute.get('/', zValidator('query', getTicketsQuerySchema), async (c) => {
  try {
    const { status, priority } = c.req.valid('query');
    
    const db = getDb(c.env);
    const reporter = aliasedTable(users, 'reporter');
    const assignee = aliasedTable(users, 'assignee');

    const conditions = [];
    if (status) {
      conditions.push(eq(tickets.status, status));
    }
    if (priority) {
      conditions.push(eq(tickets.priority, priority));
    }

    const results = await db
      .select({
        ...getTableColumns(tickets),
        machine_type: machines.machine_type,
        model: machines.model,
        serial_number: machines.serial_number,
        location: machines.location,
        manufacturer: machines.manufacturer,
        year: machines.year,
        technical_specs: machines.technical_specs,
        reporter_name: reporter.first_name,
        reporter_email: reporter.email,
        assignee_name: assignee.first_name,
        assignee_email: assignee.email,
        media_count: sql<number>`(SELECT COUNT(*) FROM media WHERE media.ticket_id = ${tickets.id})`,
        machine_name: sql<string>`${machines.machine_type} || ' ' || COALESCE(${machines.model}, '')`,
        machine_status: machines.status,
        is_machine_down: tickets.is_machine_down,
        created_by_name: reporter.first_name
      })
      .from(tickets)
      .leftJoin(machines, eq(tickets.machine_id, machines.id))
      .leftJoin(reporter, eq(tickets.reported_by, reporter.id))
      .leftJoin(assignee, eq(tickets.assigned_to, assignee.id))
      .where(and(...conditions, sql`${tickets.deleted_at} IS NULL`))
      .orderBy(desc(tickets.created_at));

    return c.json({ tickets: results });
  } catch (error) {
    console.error('Get tickets error:', error);
    return c.json({ error: 'Erreur lors de la récupération des tickets' }, 500);
  }
});

// GET /api/tickets/:id - Détails d'un ticket
ticketsRoute.get('/:id', zValidator('param', ticketIdParamSchema), async (c) => {
  try {
    const { id } = c.req.valid('param');
    // isNaN check handled by Zod

    const db = getDb(c.env);
    const reporter = aliasedTable(users, 'reporter');
    const assignee = aliasedTable(users, 'assignee');

    // Récupérer le ticket
    const ticket = await db
      .select({
        ...getTableColumns(tickets),
        machine_type: machines.machine_type,
        model: machines.model,
        serial_number: machines.serial_number,
        location: machines.location,
        manufacturer: machines.manufacturer,
        year: machines.year,
        technical_specs: machines.technical_specs,
        reporter_name: reporter.first_name,
        reporter_email: reporter.email,
        assignee_name: assignee.first_name,
        assignee_email: assignee.email,
        machine_name: sql<string>`${machines.machine_type} || ' ' || COALESCE(${machines.model}, '')`,
        machine_status: machines.status,
        is_machine_down: tickets.is_machine_down,
        created_by_name: reporter.first_name
      })
      .from(tickets)
      .leftJoin(machines, eq(tickets.machine_id, machines.id))
      .leftJoin(reporter, eq(tickets.reported_by, reporter.id))
      .leftJoin(assignee, eq(tickets.assigned_to, assignee.id))
      .where(and(eq(tickets.id, id), sql`${tickets.deleted_at} IS NULL`))
      .get();

    if (!ticket) {
      return c.json({ error: 'Ticket non trouvé' }, 404);
    }

    // Récupérer les médias
    const mediaFiles = await db
      .select()
      .from(media)
      .where(eq(media.ticket_id, id))
      .orderBy(desc(media.created_at));

    // Récupérer la timeline
    const timelineEntries = await db
      .select({
        ...getTableColumns(ticketTimeline),
        user_name: users.first_name,
        user_email: users.email
      })
      .from(ticketTimeline)
      .leftJoin(users, eq(ticketTimeline.user_id, users.id))
      .where(eq(ticketTimeline.ticket_id, id))
      .orderBy(desc(ticketTimeline.created_at));

    return c.json({
      ticket: {
        ...ticket,
        media: mediaFiles,
        timeline: timelineEntries
      }
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    return c.json({ error: 'Erreur lors de la récupération du ticket' }, 500);
  }
});

// POST /api/tickets - Créer un nouveau ticket
ticketsRoute.post('/', zValidator('json', createTicketSchema), async (c) => {
  try {
    const user = c.get('user') as any;
    const body = c.req.valid('json');
    const { title, description, reporter_name, machine_id, priority, assigned_to, scheduled_date, created_at, is_machine_down } = body;

    const db = getDb(c.env);

    // Récupérer les infos de la machine
    const machine = await db
      .select({
        machine_type: machines.machine_type,
        model: machines.model,
        location: machines.location
      })
      .from(machines)
      .where(eq(machines.id, machine_id))
      .get();

    if (!machine) {
      return c.json({ error: 'Machine non trouvée' }, 404);
    }

    // 🛡️ PROTECTION INDUSTRIELLE : Anti-Doublon (Debounce Backend)
    // Vérifie si un ticket identique a été créé par cet utilisateur pour cette machine dans les 60 dernières secondes
    try {
      const recentDuplicate = await db
        .select({ id: tickets.id, ticket_id: tickets.ticket_id })
        .from(tickets)
        .where(and(
          eq(tickets.reported_by, user.userId),
          eq(tickets.machine_id, machine_id),
          eq(tickets.title, title),
          sql`${tickets.created_at} > datetime('now', '-60 seconds')`
        ))
        .get();

      if (recentDuplicate) {
        console.log(`🛡️ Doublon évité : Ticket #${recentDuplicate.ticket_id} existe déjà (créé < 60s).`);
        // On retourne le ticket existant comme si c'était le nouveau (Idempotence)
        const fullDuplicate = await db.select().from(tickets).where(eq(tickets.id, recentDuplicate.id)).get();
        return c.json({ ticket: fullDuplicate }, 201); // 201 Created (virtuellement)
      }
    } catch (debounceError) {
      console.error('Erreur lors de la vérification anti-doublon (ignoré):', debounceError);
    }

    const timestamp = created_at || new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Retry logic pour l'ID unique
    const createTicketWithRetry = async (attempt = 0): Promise<any> => {
      try {
        const ticket_id = await generateTicketId(c.env.DB, machine.machine_type);

        const result = await db.insert(tickets).values({
          ticket_id,
          title,
          description, // Déjà safe grâce à Zod (.default(""))
          reporter_name,
          reported_by: user.userId, 
          machine_id,
          priority,
          assigned_to: assigned_to || null,
          scheduled_date: scheduled_date || null,
          is_machine_down: is_machine_down || false,
          status: 'received',
          created_at: timestamp,
          updated_at: timestamp
        }).returning();

        const newTicket = result[0];

        // CRITICAL FIX: Ensure ID is present (D1 returning() consistency check)
        if (!newTicket.id) {
          console.log('⚠️ Inserted ticket returned no ID, fetching by unique ticket_id:', ticket_id);
          const savedTicket = await db
            .select()
            .from(tickets)
            .where(eq(tickets.ticket_id, ticket_id))
            .get();
            
          if (savedTicket) {
            newTicket.id = savedTicket.id;
            console.log('✅ Recovered ticket ID:', newTicket.id);
          } else {
            console.error('❌ FAILED to recover ticket ID for:', ticket_id);
          }
        }

        // Timeline
        await db.insert(ticketTimeline).values({
          ticket_id: newTicket.id,
          user_id: user.userId,
          action: 'Ticket créé',
          new_status: 'received',
          comment: description
        });

        // Push notification logic
        if (assigned_to) {
          try {
            const assignedUser = await db
              .select()
              .from(users)
              .where(eq(users.id, assigned_to))
              .get();

            if (assignedUser) {
              const { sendPushNotification } = await import('./push');
              const safeTitle = title.length > 60 ? title.substring(0, 60) + '...' : title;
              
              // Ensure ID is valid number
              if (!newTicket.id) {
                console.error('CRITICAL: New ticket created but ID is undefined/null', newTicket);
              }

              const pushResult = await sendPushNotification(c.env, assigned_to, {
                title: `🔴 Nouveau : ${machine.machine_type} ${machine.model}`,
                body: `[${priority.toUpperCase()}] ${safeTitle}`,
                icon: '/icon-192.png',
                actions: [
                  { action: 'view', title: 'Voir' },
                  { action: 'acknowledge', title: "J'y vais !" }
                ],
                data: { 
                  ticketId: newTicket.id,
                  ticket_id: ticket_id,
                  action: 'view_ticket',
                  url: `/?ticket=${newTicket.id}` 
                }
              });

              await db.insert(pushLogs).values({
                user_id: assigned_to,
                ticket_id: newTicket.id,
                status: pushResult.success ? 'success' : 'failed',
                error_message: pushResult.success ? null : JSON.stringify(pushResult)
              });
            }
          } catch (pushError) {
            console.error('Push notification failed (non-critical):', pushError);
          }
        }

        return newTicket;

      } catch (error: any) {
        // Check for UNIQUE constraint violation on ticket_id
        if ((error.message?.includes('UNIQUE') || error.message?.includes('constraint')) && attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
          return createTicketWithRetry(attempt + 1);
        }
        throw error;
      }
    };

    // AUTOMATIC MACHINE STATUS UPDATE (Prudence logic)
    if (is_machine_down) {
      await db.update(machines)
        .set({ status: 'out_of_service', updated_at: sql`CURRENT_TIMESTAMP` })
        .where(eq(machines.id, machine_id))
        .run();
      
      console.log(`[Ticket Created] Machine #${machine_id} status set to out_of_service.`);
    }

    const newTicket = await createTicketWithRetry();

    // WEBHOOK: Send to Pabbly (Shadow Logging)
    c.executionCtx.waitUntil(sendToPabbly(c.env, 'ticket_created', {
      ...newTicket,
      machine_info: machine,
      creator_info: user
    }));

    return c.json({ ticket: newTicket }, 201);

  } catch (error) {
    console.error('Create ticket error:', error);
    return c.json({ error: 'Erreur lors de la création du ticket' }, 500);
  }
});

// PATCH /api/tickets/:id - Mettre à jour un ticket
ticketsRoute.patch('/:id', zValidator('param', ticketIdParamSchema), zValidator('json', updateTicketSchema), async (c) => {
  try {
    const user = c.get('user') as any;
    const { id } = c.req.valid('param');
    // isNaN check handled by Zod

    const body = c.req.valid('json');
    const db = getDb(c.env);

    // Récupérer le ticket actuel
    const currentTicket = await db
      .select({
        ...getTableColumns(tickets),
        machine_type: machines.machine_type,
        model: machines.model
      })
      .from(tickets)
      .leftJoin(machines, eq(tickets.machine_id, machines.id))
      .where(eq(tickets.id, id))
      .get();

    if (!currentTicket) {
      return c.json({ error: 'Ticket non trouvé' }, 404);
    }

    // Permissions checks
    if (user.role === 'operator' && currentTicket.reported_by !== user.userId) {
      return c.json({ error: 'Vous ne pouvez modifier que vos propres tickets' }, 403);
    }
    if (user.role === 'operator' && body.status && body.status !== currentTicket.status) {
      return c.json({ error: 'Les opérateurs ne peuvent pas changer le statut des tickets' }, 403);
    }

    const updates: any = {
      updated_at: sql`CURRENT_TIMESTAMP`
    };

    if (body.title) updates.title = body.title;
    if (body.description) updates.description = body.description;
    if (body.status) {
      updates.status = body.status;
      if (body.status === 'completed') {
        updates.completed_at = sql`CURRENT_TIMESTAMP`;
      }
    }
    if (body.priority) updates.priority = body.priority;
    if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to;
    if (body.scheduled_date !== undefined) updates.scheduled_date = body.scheduled_date;
    if (body.is_machine_down !== undefined) updates.is_machine_down = body.is_machine_down;

    // Update ticket
    const result = await db.update(tickets)
      .set(updates)
      .where(eq(tickets.id, id))
      .returning();

    // AUTOMATIC MACHINE STATUS UPDATE (Prudence logic)
    if (body.is_machine_down !== undefined) {
      // User explicitly signaled machine status via ticket
      const newStatus = body.is_machine_down ? 'out_of_service' : 'operational';
      
      // Get machine info for broadcast
      const machineInfo = await db.select()
        .from(machines)
        .where(eq(machines.id, currentTicket.machine_id))
        .limit(1);
      
      const machine = machineInfo[0];
      const machineName = machine ? `${machine.machine_type || 'Machine'} ${machine.model || ''}`.trim() : 'Machine';
      
      // Update machine
      await db.update(machines)
        .set({ status: newStatus, updated_at: sql`CURRENT_TIMESTAMP` })
        .where(eq(machines.id, currentTicket.machine_id))
        .run();

      console.log(`[Ticket Updated] Machine #${currentTicket.machine_id} status set to ${newStatus}.`);
      
      // ⚠️ AUTO TV BROADCAST: Critical machine status change bypasses admin
      // When machine goes DOWN -> Create urgent broadcast alert
      // When machine goes UP -> Remove the alert
      try {
        if (body.is_machine_down) {
          // CREATE URGENT TV BROADCAST
          await c.env.DB.prepare(`
            INSERT INTO broadcast_messages (type, title, content, display_duration, priority, is_active, is_auto_generated, source_ticket_id, source_machine_id)
            VALUES ('alert', ?, ?, 30, 100, 1, 1, ?, ?)
          `).bind(
            `🚨 MACHINE À L'ARRÊT`,
            `${machineName} - ${currentTicket.title || 'Intervention requise'}`,
            id,
            currentTicket.machine_id
          ).run();
          console.log(`[TV Broadcast] Auto-created alert for machine ${machineName} (ticket #${id})`);
        } else {
          // REMOVE AUTO-GENERATED ALERT when machine is back up
          await c.env.DB.prepare(`
            DELETE FROM broadcast_messages 
            WHERE is_auto_generated = 1 AND source_machine_id = ?
          `).bind(currentTicket.machine_id).run();
          console.log(`[TV Broadcast] Removed auto-alert for machine #${currentTicket.machine_id}`);
        }
      } catch (broadcastError) {
        // Non-blocking: log error but don't fail the ticket update
        console.error('[TV Broadcast] Error managing auto-alert:', broadcastError);
      }
      
      // Add to timeline
      await db.insert(ticketTimeline).values({
        ticket_id: id,
        user_id: user.userId,
        action: body.is_machine_down ? 'Machine mise à l\'arrêt' : 'Machine remise en service',
        comment: body.is_machine_down ? 'Via case à cocher ticket' : 'Via résolution ticket'
      });
    }
    
    const updatedTicket = result[0];

    // WEBHOOK: Send to Pabbly (Shadow Logging)
    c.executionCtx.waitUntil(sendToPabbly(c.env, 'ticket_updated', {
      ticket_id: updatedTicket.ticket_id,
      id: updatedTicket.id,
      changes: body,
      new_state: updatedTicket,
      updater_info: user
    }));

    // Timeline
    await db.insert(ticketTimeline).values({
      ticket_id: id,
      user_id: user.userId,
      action: body.status ? 'Changement de statut' : 'Mise à jour',
      old_status: body.status ? currentTicket.status : null,
      new_status: body.status || null,
      comment: body.comment || null
    });

    // Push notifications logic
    const { sendPushNotification } = await import('./push');

    // 1. Assignment changed
    if (body.assigned_to && body.assigned_to !== currentTicket.assigned_to) {
      // Notify old assignee
      if (currentTicket.assigned_to && currentTicket.assigned_to !== 0) {
        try {
          const oldAssigneePush = await sendPushNotification(c.env, currentTicket.assigned_to, {
            title: `📤 Affectation Annulée : ${currentTicket.machine_type}`,
            body: `Ticket #${currentTicket.ticket_id} ne vous est plus assigné`,
            icon: '/icon-192.png',
            actions: [{ action: 'view', title: 'Voir' }],
            data: { 
              ticketId: id,
              ticket_id: currentTicket.ticket_id,
              action: 'view_ticket',
              url: `/?ticket=${id}` 
            }
          });
        } catch (e) { console.error(e); }
      }

      // Notify new assignee
      try {
        const pushResult = await sendPushNotification(c.env, body.assigned_to, {
          title: `🔄 Affectation : ${currentTicket.machine_type} ${currentTicket.model || ''}`,
          body: `Ticket #${currentTicket.ticket_id} vous a été transféré`,
          icon: '/icon-192.png',
          actions: [
            { action: 'view', title: 'Voir' },
            { action: 'acknowledge', title: "J'y vais !" }
          ],
          data: { 
            ticketId: id,
            ticket_id: currentTicket.ticket_id,
            action: 'view_ticket',
            url: `/?ticket=${id}` 
          }
        });

        await db.insert(pushLogs).values({
          user_id: body.assigned_to,
          ticket_id: id,
          status: pushResult.success ? 'success' : 'failed',
          error_message: pushResult.success ? null : JSON.stringify(pushResult)
        });
      } catch (e) { console.error(e); }
    }

    // 2. Status changed - Notify reporter
    if (body.status && body.status !== currentTicket.status && currentTicket.reported_by && currentTicket.reported_by !== user.userId) {
      try {
        const techName = formatUserName(user, 'Un technicien');
        const statusLabels: Record<string, string> = {
          'received': 'Reçu', 'diagnostic': 'Diagnostic', 'in_progress': 'En cours',
          'waiting_parts': 'En attente pièces', 'completed': 'Terminé', 'archived': 'Archivé'
        };
        const newStatusLabel = statusLabels[body.status] || body.status;
        let notifTitle = `ℹ️ Statut : ${newStatusLabel} - ${currentTicket.machine_type}`;
        let notifBody = `Votre ticket #${currentTicket.ticket_id} est maintenant ${newStatusLabel}.`;

        if (body.status === 'in_progress') {
          notifTitle = `✅ Pris en charge : ${currentTicket.machine_type}`;
          notifBody = `${techName} travaille sur votre ticket #${currentTicket.ticket_id}.`;
        } else if (body.status === 'completed') {
          notifTitle = `✅ Terminé : ${currentTicket.machine_type}`;
          notifBody = `Votre ticket #${currentTicket.ticket_id} a été résolu par ${techName}.`;
        }

        await sendPushNotification(c.env, currentTicket.reported_by, {
          title: notifTitle,
          body: notifBody,
          icon: '/icon-192.png',
          actions: [{ action: 'view', title: 'Voir' }],
          data: { 
            ticketId: id,
            ticket_id: currentTicket.ticket_id,
            action: 'view_ticket',
            url: `/?ticket=${id}` 
          }
        });
      } catch (e) { console.error(e); }
    }

    return c.json({ ticket: updatedTicket });
  } catch (error: any) {
    console.error('Update ticket error detailed:', error);
    // Return explicit error message for debugging
    const errorMessage = error.message || 'Erreur inconnue lors de la mise à jour';
    const errorDetails = error.cause ? String(error.cause) : undefined;
    return c.json({ error: `Erreur MAJ: ${errorMessage}`, details: errorDetails }, 500);
  }
});

// DELETE /api/tickets/:id - Supprimer un ticket
ticketsRoute.delete('/:id', zValidator('param', ticketIdParamSchema), async (c) => {
  try {
    const user = c.get('user') as any;
    const { id } = c.req.valid('param');
    // isNaN check handled by Zod

    const db = getDb(c.env);

    const ticket = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, id))
      .get();

    if (!ticket) {
      return c.json({ error: 'Ticket non trouvé' }, 404);
    }

    if (user.role === 'operator' && ticket.reported_by !== user.userId) {
      return c.json({ error: 'Vous ne pouvez supprimer que vos propres tickets' }, 403);
    }

    // SOFT DELETE: On marque juste le ticket comme supprimé
    // On garde les fichiers R2 et les métadonnées pour historique
    
    await db.update(tickets)
      .set({ deleted_at: sql`CURRENT_TIMESTAMP`, updated_at: sql`CURRENT_TIMESTAMP` })
      .where(eq(tickets.id, id));

    // WEBHOOK: Send to Pabbly (Shadow Logging)
    c.executionCtx.waitUntil(sendToPabbly(c.env, 'ticket_deleted', {
      ticket_id: ticket.ticket_id,
      id: ticket.id,
      deleted_title: ticket.title,
      deleter_info: user
    }));

    return c.json({
      message: 'Ticket supprimé avec succès (Soft Delete)',
      deletedFiles: 0 // No files deleted
    });
  } catch (error) {
    console.error('Delete ticket error:', error);
    return c.json({ error: 'Erreur lors de la suppression du ticket' }, 500);
  }
});

export default ticketsRoute;
