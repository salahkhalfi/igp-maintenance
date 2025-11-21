// Cloudflare Workers Scheduled Handler - CRON Triggers
// Appelé automatiquement par Cloudflare selon le schedule dans wrangler.jsonc
// Schedule: "0 2 * * *" = Quotidien à 2h du matin UTC

import type { Bindings } from './types';

/**
 * Scheduled event handler (Cloudflare Workers CRON)
 * Exécuté automatiquement selon le schedule dans wrangler.jsonc
 */
export default {
  async scheduled(
    controller: ScheduledController,
    env: Bindings,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('🔔 Cloudflare CRON démarré:', new Date().toISOString());
    console.log('⏰ Schedule:', controller.cron, '| Scheduled Time:', new Date(controller.scheduledTime).toISOString());

    try {
      // TÂCHE #1: Cleanup des subscriptions push inactives >30 jours
      await cleanupInactivePushSubscriptions(env);

      // TÂCHE #2: Vérification des tickets expirés (existant)
      await checkOverdueTickets(env);

      console.log('✅ Cloudflare CRON terminé avec succès');
    } catch (error) {
      console.error('❌ Erreur Cloudflare CRON:', error);
      // Note: Ne pas throw l'erreur pour ne pas faire échouer le CRON
    }
  },
};

/**
 * Cleanup des subscriptions push inactives >30 jours
 * Identique à la logique de /api/cron/cleanup-push-tokens
 */
async function cleanupInactivePushSubscriptions(env: Bindings): Promise<void> {
  const now = new Date();
  console.log('🧹 CRON cleanup-push-subscriptions démarré:', now.toISOString());

  try {
    // ÉTAPE 1: Identifier les subscriptions inactives >30 jours AVANT suppression
    const { results: inactiveSubscriptions } = await env.DB.prepare(`
      SELECT 
        id, 
        user_id, 
        device_name, 
        created_at, 
        last_used,
        julianday('now') - julianday(last_used) as days_inactive
      FROM push_subscriptions
      WHERE julianday('now') - julianday(last_used) > 30
      ORDER BY last_used ASC
    `).all();

    if (!inactiveSubscriptions || inactiveSubscriptions.length === 0) {
      console.log('✅ CRON: Aucune subscription inactive >30 jours trouvée');
      return;
    }

    console.log(`⚠️ CRON: ${inactiveSubscriptions.length} subscription(s) inactive(s) >30 jours trouvée(s)`);

    // ÉTAPE 2: Logger les détails AVANT suppression
    for (const sub of inactiveSubscriptions as any[]) {
      console.log(`🗑️ CRON: Suppression device "${sub.device_name}" (user_id:${sub.user_id}, ${Math.floor(sub.days_inactive)} jours inactif)`);
    }

    // ÉTAPE 3: Suppression réelle des subscriptions inactives
    const result = await env.DB.prepare(`
      DELETE FROM push_subscriptions
      WHERE julianday('now') - julianday(last_used) > 30
    `).run();

    const deletedCount = result.meta.changes || 0;
    console.log(`✅ CRON: ${deletedCount} subscription(s) inactive(s) supprimée(s)`);

    // ÉTAPE 4: Vérifier l'état post-cleanup
    const { results: remainingSubscriptions } = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM push_subscriptions
    `).all();
    const remainingCount = (remainingSubscriptions[0] as any)?.count || 0;

    console.log(`📊 CRON: ${remainingCount} subscription(s) active(s) restante(s)`);
    console.log(`🎉 CRON cleanup-push-subscriptions terminé: ${deletedCount} suppression(s)`);
  } catch (error) {
    console.error('❌ CRON: Erreur cleanup-push-subscriptions:', error);
    throw error;
  }
}

/**
 * Vérification des tickets expirés (scheduled_date dépassée)
 * Logique existante de /api/cron/check-overdue
 */
async function checkOverdueTickets(env: Bindings): Promise<void> {
  const now = new Date();
  console.log('🔔 CRON check-overdue-tickets démarré:', now.toISOString());

  try {
    // Récupérer tous les tickets planifiés expirés
    const overdueTickets = await env.DB.prepare(`
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
      return;
    }

    console.log(`⚠️ CRON: ${overdueTickets.results.length} ticket(s) expiré(s) trouvé(s)`);

    const WEBHOOK_URL = 'https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY0MDYzMDA0M2Q1MjY5NTUzYzUxM2Ei_pc';
    let notificationsSent = 0;

    // Envoyer webhook pour chaque ticket expiré
    for (const ticket of overdueTickets.results as any[]) {
      try {
        // VÉRIFICATION: Notification déjà envoyée pour cette date planifiée?
        const existingNotification = await env.DB.prepare(`
          SELECT id FROM webhook_notifications
          WHERE ticket_id = ?
            AND scheduled_date_notified = ?
            AND notification_type = 'overdue_scheduled'
          ORDER BY sent_at DESC
          LIMIT 1
        `).bind(ticket.id, ticket.scheduled_date).first();

        if (existingNotification) {
          console.log(`⏭️ CRON: Skip ${ticket.ticket_id} - notification déjà envoyée`);
          continue;
        }

        const scheduledDate = new Date(ticket.scheduled_date);
        const delay = now.getTime() - scheduledDate.getTime();
        const delayHours = Math.floor(delay / (1000 * 60 * 60));
        const delayMinutes = Math.floor((delay % (1000 * 60 * 60)) / (1000 * 60));
        const overdueText = delayHours > 0 ? `${delayHours}h ${delayMinutes}min` : `${delayMinutes}min`;

        const assigneeInfo = ticket.assigned_to === 0 ? 'Toute l\'équipe' : ticket.assignee_name || 'Non assigné';

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
        await env.DB.prepare(`
          INSERT INTO webhook_notifications 
          (ticket_id, notification_type, webhook_url, sent_at, response_status, response_body, scheduled_date_notified)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          ticket.id,
          'overdue_scheduled',
          WEBHOOK_URL,
          sentAt,
          responseStatus,
          responseBody.substring(0, 1000),
          ticket.scheduled_date
        ).run();

        notificationsSent++;
        console.log(`✅ CRON: Webhook envoyé pour ${ticket.ticket_id} (status: ${responseStatus})`);

        // ENVOYER PUSH NOTIFICATION
        try {
          const { sendPushNotification } = await import('./routes/push');
          const pushResult = await sendPushNotification(env, ticket.assigned_to, {
            title: `🔴 Ticket Expiré`,
            body: `${ticket.title} - En retard de ${overdueText}`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            data: { 
              ticketId: ticket.id, 
              ticket_id: ticket.ticket_id,
              type: 'overdue',
              url: '/' 
            }
          });

          // Logger push result
          await env.DB.prepare(`
            INSERT INTO push_logs (user_id, ticket_id, status, error_message)
            VALUES (?, ?, ?, ?)
          `).bind(
            ticket.assigned_to,
            ticket.id,
            pushResult.success ? 'success' : 'failed',
            pushResult.success ? null : JSON.stringify(pushResult)
          ).run();

          if (pushResult.success) {
            console.log(`✅ CRON: Push notification envoyée pour ${ticket.ticket_id} (${pushResult.sentCount} appareil(s))`);
          }
        } catch (pushError) {
          console.error(`⚠️ CRON: Erreur push notification pour ${ticket.ticket_id}:`, pushError);
        }

        // Délai entre webhooks
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`❌ CRON: Erreur pour ${ticket.ticket_id}:`, error);
      }
    }

    console.log(`🎉 CRON check-overdue-tickets terminé: ${notificationsSent}/${overdueTickets.results.length} notification(s) envoyée(s)`);
  } catch (error) {
    console.error('❌ CRON: Erreur check-overdue-tickets:', error);
    throw error;
  }
}
