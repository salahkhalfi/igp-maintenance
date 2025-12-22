// Cloudflare Workers Scheduled Handler - CRON Triggers
// Appelé automatiquement par Cloudflare selon le schedule dans wrangler.jsonc
// Schedule: "0 2 * * *" = Quotidien à 2h du matin UTC

import type { Bindings } from './types';
import { sendPushNotification } from './routes/push';

/**
 * Get webhook URL from database (SaaS-ready, zero hardcoding)
 * Returns null if not configured (webhooks disabled)
 */
async function getWebhookUrl(db: D1Database): Promise<string | null> {
  try {
    const result = await db.prepare(
      'SELECT setting_value FROM system_settings WHERE setting_key = ?'
    ).bind('webhook_url').first<{ setting_value: string }>();
    return result?.setting_value || null;
  } catch (e) {
    console.error('[Scheduled] Failed to get webhook URL from DB:', e);
    return null;
  }
}

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

      // TÂCHE #3: Nettoyage des vieux messages et médias (Hygiène)
      await cleanupOldMessages(env);

      console.log('✅ Cloudflare CRON terminé avec succès');
    } catch (error) {
      console.error('❌ Erreur Cloudflare CRON:', error);
      // Note: Ne pas throw l'erreur pour ne pas faire échouer le CRON
    }
  },
};

/**
 * Nettoyage des vieux messages et médias (Rétention)
 * - Médias (Images/Audio) > 30 jours -> Supprimés
 * - Textes > 365 jours -> Supprimés
 */
async function cleanupOldMessages(env: Bindings): Promise<void> {
    console.log('🧹 CRON cleanup-old-messages démarré (Mode Hybride 30 jours)');

    try {
        // 1. SUPPRESSION DES MÉDIAS (> 30 jours)
        // Règle : Rétention mensuelle pour les fichiers lourds (Images/Audio)
        
        // Récupérer les clés R2 à supprimer
        const { results: mediaToDelete } = await env.DB.prepare(`
            SELECT media_key 
            FROM chat_messages 
            WHERE type IN ('image', 'audio') 
            AND datetime(created_at) < datetime('now', '-30 days')
            AND media_key IS NOT NULL
        `).all();

        if (mediaToDelete && mediaToDelete.length > 0) {
            console.log(`🗑️ CRON: Suppression de ${mediaToDelete.length} média(s) obsolète(s) (>30j)`);
            
            // Suppression R2 (Best effort)
            for (const item of mediaToDelete as any[]) {
                try {
                    await env.MEDIA_BUCKET.delete(item.media_key);
                } catch (e) {
                    console.error(`❌ Erreur suppression R2 ${item.media_key}:`, e);
                }
            }
        }

        // Suppression DB des messages Média (le contenu du message devient "Média expiré")
        // Au lieu de supprimer la ligne, on peut marquer comme expiré si on veut garder une trace, 
        // mais pour l'instant on supprime pour nettoyer la DB comme demandé.
        const mediaResult = await env.DB.prepare(`
            DELETE FROM chat_messages 
            WHERE type IN ('image', 'audio') 
            AND datetime(created_at) < datetime('now', '-30 days')
        `).run();
        
        console.log(`✅ CRON: ${mediaResult.meta.changes} message(s) média supprimé(s) de la DB (>30 jours)`);

        // 2. SUPPRESSION DES TEXTES (DÉSACTIVÉ / 1 AN)
        // Règle : On garde le texte pour l'historique de maintenance (Traceabilité)
        // On supprime seulement l'extrême vieux (> 1 an) pour l'hygiène DB
        const textResult = await env.DB.prepare(`
            DELETE FROM chat_messages 
            WHERE type = 'text' 
            AND datetime(created_at) < datetime('now', '-365 days')
        `).run();

        if (textResult.meta.changes > 0) {
            console.log(`✅ CRON: ${textResult.meta.changes} message(s) texte très anciens (>1 an) supprimé(s)`);
        } else {
             console.log(`ℹ️ CRON: Aucun message texte >1 an à supprimer.`);
        }

    } catch (error) {
        console.error('❌ CRON: Erreur cleanup-old-messages:', error);
    }
}

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
        u.first_name as assignee_name,
        reporter.first_name as reporter_name
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

    // Get webhook URL from DB (SaaS-ready, zero hardcoding)
    const WEBHOOK_URL = await getWebhookUrl(env.DB);
    if (!WEBHOOK_URL) {
      console.log('ℹ️ CRON: No webhook_url configured, webhook notifications disabled');
    }
    let notificationsSent = 0;

    // Envoyer webhook pour chaque ticket expiré
    for (const ticket of overdueTickets.results as any[]) {
      try {
        const scheduledDate = new Date(ticket.scheduled_date);
        const delay = now.getTime() - scheduledDate.getTime();
        const delayHours = Math.floor(delay / (1000 * 60 * 60));
        const delayMinutes = Math.floor((delay % (1000 * 60 * 60)) / (1000 * 60));
        const overdueText = delayHours > 0 ? `${delayHours}h ${delayMinutes}min` : `${delayMinutes}min`;

        // VÉRIFICATION: Webhook déjà envoyé pour cette date planifiée?
        const existingWebhook = await env.DB.prepare(`
          SELECT id FROM webhook_notifications
          WHERE ticket_id = ?
            AND scheduled_date_notified = ?
            AND notification_type = 'overdue_scheduled'
          ORDER BY sent_at DESC
          LIMIT 1
        `).bind(ticket.id, ticket.scheduled_date).first();

        // Envoyer webhook SEULEMENT si pas déjà envoyé
        if (!existingWebhook) {
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

          // Envoyer webhook (only if configured)
          let responseStatus = 0;
          let responseBody = 'Webhook not configured';
          
          if (WEBHOOK_URL) {
            const response = await fetch(WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(webhookData)
            });
            responseStatus = response.status;
            responseBody = await response.text();
          }

          // Enregistrer notification dans DB
          const sentAt = now.toISOString();
          await env.DB.prepare(`
            INSERT INTO webhook_notifications 
            (ticket_id, notification_type, webhook_url, sent_at, response_status, response_body, scheduled_date_notified)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            ticket.id,
            'overdue_scheduled',
            WEBHOOK_URL || 'NOT_CONFIGURED',
            sentAt,
            responseStatus,
            responseBody.substring(0, 1000),
            ticket.scheduled_date
          ).run();

          notificationsSent++;
          console.log(`✅ CRON: Webhook envoyé pour ${ticket.ticket_id} (status: ${responseStatus})`);
        } else {
          console.log(`⏭️ CRON: Webhook déjà envoyé pour ${ticket.ticket_id}, skip webhook`);
        }

        // ENVOYER PUSH NOTIFICATION AU TECHNICIEN ASSIGNÉ
        // Vérifier si push déjà envoyé pour ce ticket + user (dans les dernières 24h)
        const existingTechnicianPush = await env.DB.prepare(`
          SELECT id FROM push_logs
          WHERE user_id = ? AND ticket_id = ?
            AND datetime(created_at) > datetime('now', '-24 hours')
          LIMIT 1
        `).bind(ticket.assigned_to, ticket.id).first();

        if (!existingTechnicianPush) {
          try {
            const pushResult = await sendPushNotification(env, ticket.assigned_to, {
              title: `🔴 Ticket Expiré`,
              body: `${ticket.title} - En retard de ${overdueText}`,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              actions: [
                { action: 'view', title: 'Voir' },
                { action: 'acknowledge', title: "J'y vais !" }
              ],
              data: { 
                ticketId: ticket.id, 
                ticket_id: ticket.ticket_id,
                action: 'view_ticket',
                type: 'overdue',
                url: `/?ticket=${ticket.id}` 
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
              console.log(`✅ CRON: Push notification envoyée au technicien ${ticket.assigned_to} pour ${ticket.ticket_id} (${pushResult.sentCount} appareil(s))`);
            }
          } catch (pushError) {
            console.error(`⚠️ CRON: Erreur push notification technicien pour ${ticket.ticket_id}:`, pushError);
          }
        } else {
          console.log(`⏭️ CRON: Push déjà envoyé au technicien ${ticket.assigned_to} pour ${ticket.ticket_id}`);
        }
        
        // ENVOYER PUSH NOTIFICATION À TOUS LES ADMINS (fail-safe, non-bloquant)
        try {
          // Récupérer tous les administrateurs
          const { results: admins } = await env.DB.prepare(`
            SELECT id, first_name FROM users WHERE role = 'admin'
          `).all();
          
          if (admins && admins.length > 0) {
            console.log(`🔔 CRON: Envoi push aux ${admins.length} admin(s) pour ticket expiré ${ticket.ticket_id}`);
            
            // Envoyer à chaque admin
            for (const admin of admins as any[]) {
              // Vérifier si push déjà envoyé à cet admin pour ce ticket (dans les dernières 24h)
              const existingAdminPush = await env.DB.prepare(`
                SELECT id FROM push_logs
                WHERE user_id = ? AND ticket_id = ?
                  AND datetime(created_at) > datetime('now', '-24 hours')
                LIMIT 1
              `).bind(admin.id, ticket.id).first();

              if (existingAdminPush) {
                console.log(`⏭️ CRON: Push déjà envoyé à admin ${admin.id} pour ${ticket.ticket_id}`);
                continue;
              }

              try {
                const adminPushResult = await sendPushNotification(env, admin.id as number, {
                  title: `⚠️ TICKET EXPIRÉ`,
                  body: `${ticket.ticket_id}: ${ticket.title} - En retard de ${overdueText}`,
                  icon: '/icon-192.png',
                  badge: '/badge-72.png',
                  actions: [
                    { action: 'view', title: 'Voir' },
                    { action: 'acknowledge', title: "J'y vais !" }
                  ],
                  data: {
                    url: `/?ticket=${ticket.id}`,
                    action: 'view_ticket',
                    ticketId: ticket.id,
                    ticket_id: ticket.ticket_id,
                    priority: ticket.priority,
                    assignedTo: ticket.assigned_to
                  }
                });
                
                // Logger le résultat dans push_logs
                await env.DB.prepare(`
                  INSERT INTO push_logs (user_id, ticket_id, status, error_message)
                  VALUES (?, ?, ?, ?)
                `).bind(
                  admin.id,
                  ticket.id,
                  adminPushResult.success ? 'success' : 'failed',
                  adminPushResult.success ? null : JSON.stringify(adminPushResult)
                ).run();
                
                if (adminPushResult.success) {
                  console.log(`✅ CRON: Push notification envoyée à admin ${admin.id} (${admin.first_name})`);
                } else {
                  console.log(`⚠️ CRON: Push notification failed pour admin ${admin.id}: ${JSON.stringify(adminPushResult)}`);
                }
              } catch (adminPushError) {
                // Logger l'erreur mais continuer avec les autres admins
                try {
                  await env.DB.prepare(`
                    INSERT INTO push_logs (user_id, ticket_id, status, error_message)
                    VALUES (?, ?, ?, ?)
                  `).bind(
                    admin.id,
                    ticket.id,
                    'error',
                    (adminPushError as Error).message || String(adminPushError)
                  ).run();
                } catch (logError) {
                  console.error('Failed to log admin push error:', logError);
                }
                console.error(`⚠️ CRON: Erreur push admin ${admin.id}:`, adminPushError);
              }
            }
          } else {
            console.log(`⚠️ CRON: Aucun admin trouvé pour notifier du ticket ${ticket.ticket_id}`);
          }
        } catch (adminsError) {
          // Fail-safe: si récupération admins échoue, le webhook fonctionne quand même
          console.error(`⚠️ CRON: Erreur récupération admins pour ${ticket.ticket_id}:`, adminsError);
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
