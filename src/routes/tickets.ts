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
        u1.first_name as reporter_name, u1.email as reporter_email,
        u2.first_name as assignee_name, u2.email as assignee_email,
        (SELECT COUNT(*) FROM media WHERE media.ticket_id = t.id) as media_count
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
        u1.first_name as reporter_name, u1.email as reporter_email,
        u2.first_name as assignee_name, u2.email as assignee_email
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
        u.first_name as user_name, u.email as user_email
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

// POST /api/tickets - Créer un nouveau ticket (avec retry logic pour race conditions)
tickets.post('/', async (c) => {
  try {
    const user = c.get('user') as any;
    const body: CreateTicketRequest = await c.req.json();
    const { title, description, reporter_name, machine_id, priority, assigned_to, scheduled_date, created_at } = body;

    // Validation des champs requis
    if (!title || !description || !reporter_name || !machine_id || !priority) {
      return c.json({ error: 'Tous les champs sont requis' }, 400);
    }

    // Validation du titre
    if (title.trim().length < 3 || title.length > 200) {
      return c.json({ error: 'Titre invalide (3-200 caractères)' }, 400);
    }

    // Validation de la description
    if (description.trim().length < 5 || description.length > 2000) {
      return c.json({ error: 'Description invalide (5-2000 caractères)' }, 400);
    }

    // Validation de la priorité
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(priority)) {
      return c.json({ error: 'Priorité invalide (low, medium, high, critical)' }, 400);
    }

    // Validation de l'ID machine
    const machineIdNum = parseInt(machine_id);
    if (isNaN(machineIdNum) || machineIdNum <= 0) {
      return c.json({ error: 'ID machine invalide' }, 400);
    }

    // Récupérer les infos de la machine
    const machine = await c.env.DB.prepare(
      'SELECT machine_type, model FROM machines WHERE id = ?'
    ).bind(machine_id).first() as any;

    if (!machine) {
      return c.json({ error: 'Machine non trouvée' }, 404);
    }

    // Utiliser le timestamp envoyé par le client (heure locale de son appareil)
    // Si non fourni, utiliser l'heure actuelle du serveur
    const timestamp = created_at || new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Fonction interne de création avec retry logic pour gérer les race conditions
    const createTicketWithRetry = async (attempt = 0): Promise<any> => {
      try {
        // Générer l'ID du ticket (format: TYPE-MMYY-NNNN, ex: CNC-1125-0001)
        const ticket_id = await generateTicketId(c.env.DB, machine.machine_type);

        // Créer le ticket avec le timestamp de l'appareil de l'utilisateur
        const result = await c.env.DB.prepare(`
          INSERT INTO tickets (ticket_id, title, description, reporter_name, machine_id, priority, reported_by, assigned_to, scheduled_date, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ?, ?)
        `).bind(ticket_id, title, description, reporter_name, machine_id, priority, user.userId, assigned_to || null, scheduled_date || null, timestamp, timestamp).run();

        if (!result.success) {
          throw new Error('Insert failed');
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

        // Envoyer notification push si ticket assigné à un technicien dès la création
        if (assigned_to) {
          try {
            // Récupérer le nom de l'utilisateur assigné
            const assignedUser = await c.env.DB.prepare(
              'SELECT first_name FROM users WHERE id = ?'
            ).bind(assigned_to).first() as { first_name: string } | null;
            
            const userName = assignedUser?.first_name || 'Technicien';
            
            const { sendPushNotification } = await import('./push');
            const pushResult = await sendPushNotification(c.env, assigned_to, {
              title: `🔧 ${userName}, nouveau ticket`,
              body: `${ticket_id}: ${title}`,
              icon: '/icon-192.png',
              data: { 
                ticketId: (newTicket as any).id,
                ticket_id: ticket_id,
                action: 'view_ticket',
                url: `/?ticket=${(newTicket as any).id}` 
              }
            });

            // Logger le résultat
            await c.env.DB.prepare(`
              INSERT INTO push_logs (user_id, ticket_id, status, error_message)
              VALUES (?, ?, ?, ?)
            `).bind(
              assigned_to,
              (newTicket as any).id,
              pushResult.success ? 'success' : 'failed',
              pushResult.success ? null : JSON.stringify(pushResult)
            ).run();

            if (pushResult.success) {
              console.log(`✅ Push notification sent for new ticket ${ticket_id} to user ${assigned_to}`);
            } else {
              console.log(`⚠️ Push notification failed for ticket ${ticket_id}:`, pushResult);
            }
          } catch (pushError) {
            // Logger l'erreur
            await c.env.DB.prepare(`
              INSERT INTO push_logs (user_id, ticket_id, status, error_message)
              VALUES (?, ?, 'failed', ?)
            `).bind(
              assigned_to,
              (newTicket as any).id,
              (pushError as Error).message || String(pushError)
            ).run();

            // Push échoue? Pas grave, le ticket est créé, le webhook Pabbly prendra le relais
            console.error('⚠️ Push notification failed (non-critical):', pushError);
          }
        }

        return newTicket;

      } catch (error: any) {
        // Détecter erreur UNIQUE constraint (collision d'ID)
        const isUniqueConstraint = 
          error.message?.includes('UNIQUE') || 
          error.message?.includes('constraint') ||
          error.code === 'SQLITE_CONSTRAINT';

        // Si collision ET pas encore max retries
        if (isUniqueConstraint && attempt < 2) {
          // Attendre un peu avec backoff exponentiel (50ms, 100ms)
          await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
          
          // Log pour debugging
          console.log(`⚠️ Ticket ID collision detected, retrying (attempt ${attempt + 1}/3)...`);
          
          // Retenter
          return createTicketWithRetry(attempt + 1);
        }

        // Sinon, propager l'erreur
        throw error;
      }
    };

    // Tenter création avec retry
    const newTicket = await createTicketWithRetry();
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

    // Vérifier les permissions: opérateur ne peut modifier que ses propres tickets
    if (user.role === 'operator' && currentTicket.reported_by !== user.userId) {
      return c.json({ error: 'Vous ne pouvez modifier que vos propres tickets' }, 403);
    }

    // Opérateur ne peut pas changer le statut (déplacer les tickets)
    if (user.role === 'operator' && body.status && body.status !== currentTicket.status) {
      return c.json({ error: 'Les opérateurs ne peuvent pas changer le statut des tickets' }, 403);
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

    if (body.scheduled_date !== undefined) {
      updates.push('scheduled_date = ?');
      params.push(body.scheduled_date);
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

    // Envoyer notification push si ticket assigné à un technicien (fail-safe)
    if (body.assigned_to && body.assigned_to !== currentTicket.assigned_to) {
      try {
        const { sendPushNotification } = await import('./push');
        
        // NOUVEAU: Notifier l'ancien assigné que le ticket lui a été retiré
        if (currentTicket.assigned_to && currentTicket.assigned_to !== 0) {
          try {
            // Récupérer le nom de l'ancien assigné
            const oldAssignedUser = await c.env.DB.prepare(
              'SELECT first_name FROM users WHERE id = ?'
            ).bind(currentTicket.assigned_to).first() as { first_name: string } | null;
            
            const oldUserName = oldAssignedUser?.first_name || 'Technicien';
            
            const oldAssigneePush = await sendPushNotification(c.env, currentTicket.assigned_to, {
              title: `📤 ${oldUserName}, ticket retiré`,
              body: `${currentTicket.ticket_id} réassigné à quelqu'un d'autre`,
              icon: '/icon-192.png',
              data: { 
                ticketId: id,
                ticket_id: currentTicket.ticket_id,
                action: 'unassigned',
                url: `/?ticket=${id}` 
              }
            });

            // Logger
            await c.env.DB.prepare(`
              INSERT INTO push_logs (user_id, ticket_id, status, error_message)
              VALUES (?, ?, ?, ?)
            `).bind(
              currentTicket.assigned_to,
              id,
              oldAssigneePush.success ? 'success' : 'failed',
              oldAssigneePush.success ? null : JSON.stringify(oldAssigneePush)
            ).run();

            if (oldAssigneePush.success) {
              console.log(`✅ Push notification sent to old assignee ${currentTicket.assigned_to} for ticket ${id}`);
            }
          } catch (oldPushError) {
            console.error(`⚠️ Failed to notify old assignee (non-critical):`, oldPushError);
          }
        }

        // Notifier le nouvel assigné
        // Récupérer le nom du nouvel assigné
        const newAssignedUser = await c.env.DB.prepare(
          'SELECT first_name FROM users WHERE id = ?'
        ).bind(body.assigned_to).first() as { first_name: string } | null;
        
        const newUserName = newAssignedUser?.first_name || 'Technicien';
        
        const pushResult = await sendPushNotification(c.env, body.assigned_to, {
          title: `🔧 ${newUserName}, ticket réassigné`,
          body: `${currentTicket.ticket_id}: ${currentTicket.title}`,
          icon: '/icon-192.png',
          data: { 
            ticketId: id,
            ticket_id: currentTicket.ticket_id,
            action: 'view_ticket',
            url: `/?ticket=${id}` 
          }
        });

        // Logger le résultat dans push_logs
        await c.env.DB.prepare(`
          INSERT INTO push_logs (user_id, ticket_id, status, error_message)
          VALUES (?, ?, ?, ?)
        `).bind(
          body.assigned_to,
          id,
          pushResult.success ? 'success' : 'failed',
          pushResult.success ? null : JSON.stringify(pushResult)
        ).run();

        if (pushResult.success) {
          console.log(`✅ Push notification sent for ticket ${id} to user ${body.assigned_to}`);
        } else {
          console.log(`⚠️ Push notification failed for ticket ${id}:`, pushResult);
        }
      } catch (pushError) {
        // Logger l'erreur
        try {
          await c.env.DB.prepare(`
            INSERT INTO push_logs (user_id, ticket_id, status, error_message)
            VALUES (?, ?, ?, ?)
          `).bind(
            body.assigned_to,
            id,
            'error',
            (pushError as Error).message || String(pushError)
          ).run();
        } catch (logError) {
          console.error('Failed to log push error:', logError);
        }
        // Push échoue? Pas grave, l'assignation a réussi, le webhook Pabbly prendra le relais
        console.error('⚠️ Push notification failed (non-critical):', pushError);
      }
    }

    return c.json({ ticket: updatedTicket });
  } catch (error) {
    console.error('Update ticket error:', error);
    return c.json({ error: 'Erreur lors de la mise à jour du ticket' }, 500);
  }
});

// DELETE /api/tickets/:id - Supprimer un ticket
tickets.delete('/:id', async (c) => {
  try {
    const user = c.get('user') as any;
    const id = c.req.param('id');

    // Récupérer le ticket pour vérifier les permissions
    const ticket = await c.env.DB.prepare(
      'SELECT * FROM tickets WHERE id = ?'
    ).bind(id).first() as any;

    if (!ticket) {
      return c.json({ error: 'Ticket non trouvé' }, 404);
    }

    // Vérifier les permissions: opérateur ne peut supprimer que ses propres tickets
    if (user.role === 'operator' && ticket.reported_by !== user.userId) {
      return c.json({ error: 'Vous ne pouvez supprimer que vos propres tickets' }, 403);
    }

    // Récupérer tous les fichiers media associés au ticket AVANT la suppression
    const { results: mediaFiles } = await c.env.DB.prepare(
      'SELECT file_key FROM media WHERE ticket_id = ?'
    ).bind(id).all() as any;

    // Supprimer les fichiers du bucket R2
    if (mediaFiles && mediaFiles.length > 0) {
      for (const media of mediaFiles) {
        try {
          await c.env.MEDIA_BUCKET.delete(media.file_key);
          console.log(`Fichier supprimé du R2: ${media.file_key}`);
        } catch (deleteError) {
          console.error(`Erreur lors de la suppression du fichier R2 ${media.file_key}:`, deleteError);
          // Continue même si la suppression d'un fichier échoue
        }
      }
    }

    // Supprimer le ticket (CASCADE supprimera automatiquement les enregistrements media)
    const result = await c.env.DB.prepare(
      'DELETE FROM tickets WHERE id = ?'
    ).bind(id).run();

    if (!result.success) {
      return c.json({ error: 'Erreur lors de la suppression du ticket' }, 500);
    }

    return c.json({
      message: 'Ticket supprimé avec succès',
      deletedFiles: mediaFiles?.length || 0
    });
  } catch (error) {
    console.error('Delete ticket error:', error);
    return c.json({ error: 'Erreur lors de la suppression du ticket' }, 500);
  }
});

export default tickets;
