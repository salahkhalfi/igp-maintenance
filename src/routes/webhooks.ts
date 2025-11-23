// Routes pour les notifications webhook des tickets expirés

import { Hono } from 'hono';
import type { Bindings } from '../types';
import { getTimezoneOffset, convertToLocalTime } from '../utils/timezone';

const webhooks = new Hono<{ Bindings: Bindings }>();

const WEBHOOK_URL = 'https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY0MDYzMDA0M2Q1MjY5NTUzYzUxM2Ei_pc';

/**
 * POST /api/webhooks/check-overdue-tickets - Vérifier et notifier les tickets planifiés expirés
 * Cette route est appelée périodiquement par le frontend
 * Envoie un webhook à Pabbly Connect pour chaque ticket expiré (max 1x/24h par ticket)
 */
webhooks.post('/check-overdue-tickets', async (c) => {
  try {
    // Récupérer le décalage horaire configuré
    const timezoneOffset = await getTimezoneOffset(c.env.DB);
    
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Récupérer tous les tickets planifiés (avec assigned_to ET scheduled_date) qui ne sont pas encore en cours/terminés
    // CRITICAL: Check assigned_to !== NULL (not falsy) because 0 is valid (team assignment)
    const overdueTickets = await c.env.DB.prepare(`
      SELECT
        t.id,
        t.ticket_id,
        t.title,
        t.description,
        t.priority,
        t.status,
        m.machine_type,
        m.model,
        t.scheduled_date,
        t.assigned_to,
        t.created_at,
        u.full_name as assignee_name,
        reporter.full_name as reporter_name
      FROM tickets t
      LEFT JOIN machines m ON t.machine_id = m.id
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users reporter ON t.reported_by = reporter.id
      WHERE t.assigned_to IS NOT NULL
        AND t.scheduled_date IS NOT NULL
        AND t.scheduled_date != 'null'
        AND t.scheduled_date != ''
        AND t.status IN ('received', 'diagnostic')
        AND datetime(t.scheduled_date) < datetime('now')
      ORDER BY t.scheduled_date ASC
    `).all();

    if (!overdueTickets.results || overdueTickets.results.length === 0) {
      return c.json({
        message: 'Aucun ticket planifié expiré trouvé',
        checked_at: now.toISOString()
      });
    }

    const notifications = [];
    const errors = [];

    // Pour chaque ticket expiré, vérifier si notification déjà envoyée dans les 24h
    for (const ticket of overdueTickets.results) {
      try {
        // Vérifier si une notification a déjà été envoyée POUR CETTE DATE PLANIFIÉE spécifique
        // Important: On ne vérifie plus juste les 24h, mais la date planifiée exacte
        // Cela permet de re-notifier si l'utilisateur change la scheduled_date
        const existingNotification = await c.env.DB.prepare(`
          SELECT id, sent_at, scheduled_date_notified
          FROM webhook_notifications
          WHERE ticket_id = ?
            AND scheduled_date_notified = ?
            AND notification_type = 'overdue_scheduled'
          ORDER BY sent_at DESC
          LIMIT 1
        `).bind(ticket.id, ticket.scheduled_date).first();

        if (existingNotification) {
          // Notification déjà envoyée pour cette date planifiée - skip
          continue;
        }

        // Calculer le retard
        const scheduledDate = new Date(ticket.scheduled_date.replace(' ', 'T') + 'Z');
        const overdueMs = now.getTime() - scheduledDate.getTime();
        const overdueDays = Math.floor(overdueMs / (1000 * 60 * 60 * 24));
        const overdueHours = Math.floor((overdueMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const overdueMinutes = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));

        // Préparer les données pour Pabbly Connect
        // CORRECTION 2025-11-23: Les dates dans la DB sont stockées en UTC (via localDateTimeToUTC() frontend).
        // On convertit en heure locale pour affichage lisible dans les emails Pabbly.
        const webhookData = {
          ticket_id: ticket.ticket_id,
          title: ticket.title,
          description: ticket.description,
          priority: ticket.priority,
          status: ticket.status,
          machine: `${ticket.machine_type} ${ticket.model}`,
          scheduled_date: convertToLocalTime(ticket.scheduled_date, timezoneOffset),
          assigned_to: ticket.assigned_to === 0 ? 'Équipe complète' : (ticket.assignee_name || `Technicien #${ticket.assigned_to}`),
          reporter: ticket.reporter_name || 'N/A',
          created_at: convertToLocalTime(ticket.created_at, timezoneOffset),
          overdue_days: overdueDays,
          overdue_hours: overdueHours,
          overdue_minutes: overdueMinutes,
          overdue_text: overdueDays > 0
            ? `${overdueDays} jour(s) ${overdueHours}h ${overdueMinutes}min`
            : `${overdueHours}h ${overdueMinutes}min`,
          notification_sent_at: convertToLocalTime(now, timezoneOffset)
        };

        // Envoyer le webhook à Pabbly Connect
        const webhookResponse = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(webhookData)
        });

        const responseStatus = webhookResponse.status;
        let responseBody = '';
        try {
          responseBody = await webhookResponse.text();
        } catch (e) {
          responseBody = 'Could not read response body';
        }

        // Enregistrer la notification dans la base de données avec la date planifiée
        await c.env.DB.prepare(`
          INSERT INTO webhook_notifications
          (ticket_id, notification_type, webhook_url, sent_at, response_status, response_body, scheduled_date_notified)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          ticket.id,
          'overdue_scheduled',
          WEBHOOK_URL,
          now.toISOString(),
          responseStatus,
          responseBody.substring(0, 1000), // Limiter à 1000 caractères
          ticket.scheduled_date
        ).run();

        notifications.push({
          ticket_id: ticket.ticket_id,
          title: ticket.title,
          overdue_text: webhookData.overdue_text,
          webhook_status: responseStatus,
          sent_at: now.toISOString()
        });

      } catch (error) {
        console.error(`Erreur notification webhook ticket ${ticket.ticket_id}:`, error);
        errors.push({
          ticket_id: ticket.ticket_id,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }

    return c.json({
      message: 'Vérification terminée',
      total_overdue: overdueTickets.results.length,
      notifications_sent: notifications.length,
      notifications: notifications,
      errors: errors.length > 0 ? errors : undefined,
      checked_at: now.toISOString()
    });

  } catch (error) {
    console.error('Erreur vérification tickets expirés:', error);
    return c.json({
      error: 'Erreur serveur lors de la vérification',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, 500);
  }
});

/**
 * GET /api/webhooks/notification-history/:ticketId - Historique des notifications pour un ticket
 */
webhooks.get('/notification-history/:ticketId', async (c) => {
  try {
    const ticketId = c.req.param('ticketId');

    const notifications = await c.env.DB.prepare(`
      SELECT
        wn.id,
        wn.notification_type,
        wn.sent_at,
        wn.response_status,
        wn.response_body,
        t.ticket_id,
        t.title
      FROM webhook_notifications wn
      INNER JOIN tickets t ON wn.ticket_id = t.id
      WHERE t.ticket_id = ?
      ORDER BY wn.sent_at DESC
    `).bind(ticketId).all();

    return c.json({
      ticket_id: ticketId,
      notifications: notifications.results || []
    });

  } catch (error) {
    console.error('Erreur récupération historique notifications:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

export default webhooks;
