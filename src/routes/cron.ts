// Routes CRON - Tâches planifiées (sécurisées par CRON_SECRET token)

import { Hono } from 'hono';
import type { Bindings } from '../types';

const cron = new Hono<{ Bindings: Bindings }>();

// POST /api/cron/check-overdue - Vérification tickets expirés + webhooks Pabbly Connect
// Route publique CRON sécurisée par CRON_SECRET token
cron.post('/check-overdue', async (c) => {
  try {
    // Vérifier le token secret dans l'en-tête
    const authHeader = c.req.header('Authorization');
    const expectedToken = c.env.CRON_SECRET;

    if (authHeader !== expectedToken) {
      return c.json({ error: 'Unauthorized - Invalid CRON token' }, 401);
    }

    console.log('🔔 CRON externe démarré:', new Date().toISOString());

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Récupérer tous les tickets planifiés expirés
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
      console.log('✅ CRON: Aucun ticket expiré trouvé');
      return c.json({
        message: 'Aucun ticket planifié expiré trouvé',
        checked_at: now.toISOString()
      });
    }

    console.log(`⚠️ CRON: ${overdueTickets.results.length} ticket(s) expiré(s) trouvé(s)`);

    // URL du webhook Pabbly Connect (même URL que dans webhooks.ts)
    const WEBHOOK_URL = 'https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY0MDYzMDA0M2Q1MjY5NTUzYzUxM2Ei_pc';

    let notificationsSent = 0;
    const notifications = [];
    const errors = [];

    // Envoyer webhook pour chaque ticket expiré
    for (const ticket of overdueTickets.results as any[]) {
      try {
        const scheduledDate = new Date(ticket.scheduled_date);
        const delay = now.getTime() - scheduledDate.getTime();
        const delayHours = Math.floor(delay / (1000 * 60 * 60));
        const delayMinutes = Math.floor((delay % (1000 * 60 * 60)) / (1000 * 60));

        const overdueText = delayHours > 0
          ? `${delayHours}h ${delayMinutes}min`
          : `${delayMinutes}min`;

        const assigneeInfo = ticket.assigned_to === 0
          ? 'Toute l\'équipe'
          : ticket.assignee_name || 'Non assigné';

        // Préparer données webhook
        const webhookData = {
          ticket_id: ticket.ticket_id,
          title: ticket.title,
          description: ticket.description || '',
          priority: ticket.priority,
          status: ticket.status,
          machine_type: ticket.machine_type,
          model: ticket.model,
          scheduled_date: ticket.scheduled_date,
          assigned_to: assigneeInfo,
          reporter: ticket.reporter_name || 'Inconnu',
          overdue_text: overdueText,
          created_at: ticket.created_at,
          notification_time: now.toISOString()
        };

        // Envoyer webhook
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        });

        const responseStatus = response.status;
        const responseBody = await response.text();

        // Enregistrer notification dans DB
        const sentAt = now.toISOString();
        await c.env.DB.prepare(`
          INSERT INTO webhook_notifications (ticket_id, event_type, webhook_url, sent_at, response_status, response_body)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          ticket.id,
          'overdue_scheduled',
          WEBHOOK_URL,
          sentAt,
          responseStatus,
          responseBody.substring(0, 1000)
        ).run();

        notificationsSent++;
        console.log(`✅ CRON: Webhook envoyé pour ${ticket.ticket_id} (status: ${responseStatus})`);

        notifications.push({
          ticket_id: ticket.ticket_id,
          title: ticket.title,
          overdue_text: webhookData.overdue_text,
          webhook_status: responseStatus,
          sent_at: sentAt
        });

        // Délai de 200ms entre chaque webhook
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`❌ CRON: Erreur pour ${ticket.ticket_id}:`, error);
        errors.push({
          ticket_id: ticket.ticket_id,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }

    console.log(`🎉 CRON terminé: ${notificationsSent}/${overdueTickets.results.length} notification(s) envoyée(s)`);

    return c.json({
      message: 'Vérification terminée',
      total_overdue: overdueTickets.results.length,
      notifications_sent: notificationsSent,
      notifications: notifications,
      errors: errors.length > 0 ? errors : undefined,
      checked_at: now.toISOString()
    });

  } catch (error) {
    console.error('❌ CRON: Erreur globale:', error);
    return c.json({
      error: 'Erreur serveur lors de la vérification',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, 500);
  }
});

// POST /api/cron/cleanup-push-tokens - Nettoyage tokens push expirés
// Route publique CRON sécurisée par CRON_SECRET token
cron.post('/cleanup-push-tokens', async (c) => {
  try {
    // Verifier le token secret
    const authHeader = c.req.header('Authorization');
    const expectedToken = c.env.CRON_SECRET;

    if (authHeader !== expectedToken) {
      return c.json({ error: 'Unauthorized - Invalid CRON token' }, 401);
    }

    console.log('CRON cleanup push tokens started:', new Date().toISOString());

    // Supprimer tokens non utilises depuis 90 jours
    const result = await c.env.DB.prepare(`
      DELETE FROM push_subscriptions
      WHERE last_used < datetime('now', '-90 days')
    `).run();

    const deletedCount = result.meta.changes || 0;
    console.log(`Deleted ${deletedCount} expired push tokens`);

    return c.json({
      success: true,
      deletedCount: deletedCount,
      message: `Cleaned up ${deletedCount} expired push tokens`
    });

  } catch (error) {
    console.error('Cleanup push tokens error:', error);
    return c.json({ error: 'Erreur lors du nettoyage des tokens' }, 500);
  }
});

export default cron;
