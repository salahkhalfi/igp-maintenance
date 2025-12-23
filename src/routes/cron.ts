/**
 * ==================================================================================
 * CRON.TS - NOTIFICATIONS AUTOMATIQUES (Déclenchement Cron 1/min)
 * ==================================================================================
 * 
 * Ce fichier gère les notifications AUTOMATIQUES déclenchées par cron (toutes les 1 minute).
 * 
 * DIFFÉRENCE AVEC WEBHOOKS.TS:
 * - cron.ts = Déclenchement AUTOMATIQUE (toutes les 1 minute)
 * - webhooks.ts = Déclenchement MANUEL (bouton frontend, API call)
 * 
 * NOTIFICATIONS ENVOYÉES PAR CE FICHIER:
 * ✅ Webhook Email (Pabbly Connect)
 * ✅ Push Notification Assigné (avec déduplication 5 minutes)
 * ✅ Push Notification Admins (avec déduplication 24 heures)
 * 
 * DÉDUPLICATION:
 * - Webhook: Basée sur scheduled_date (permet re-notification si date changée)
 * - Push Assigné: Fenêtre 5 minutes (évite doublons création + cron)
 * - Push Admins: Fenêtre 24 heures (évite spam admins)
 * 
 * SÉCURITÉ:
 * - Route sécurisée par CRON_SECRET token dans Authorization header
 * 
 * ==================================================================================
 */

import { Hono } from 'hono';
import { formatUserName } from '../utils/userFormatter';
import type { Bindings } from '../types';
import { getTimezoneOffset, convertToLocalTime } from '../utils/timezone';

const cron = new Hono<{ Bindings: Bindings }>();

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
    console.error('[Cron] Failed to get webhook URL from DB:', e);
    return null;
  }
}

/**
 * POST /api/cron/check-overdue - Vérification automatique tickets expirés
 * 
 * Appelée AUTOMATIQUEMENT par Cloudflare Cron Triggers (toutes les 1 minute)
 * Envoie: Webhook email + Push assigné + Push admins
 * 
 * Sécurisée par CRON_SECRET token dans Authorization header
 */
cron.post('/check-overdue', async (c) => {
  try {
    // Vérifier le token secret dans l'en-tête
    const authHeader = c.req.header('Authorization');
    const expectedToken = c.env.CRON_SECRET;

    if (authHeader !== expectedToken) {
      return c.json({ error: 'Unauthorized - Invalid CRON token' }, 401);
    }

    console.log('🔔 CRON externe démarré:', new Date().toISOString());

    // Récupérer le décalage horaire configuré
    const timezoneOffset = await getTimezoneOffset(c.env.DB);
    
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
        u.first_name as assignee_first_name,
        u.last_name as assignee_last_name,
        u.full_name as assignee_full_name,
        reporter.first_name as reporter_first_name,
        reporter.last_name as reporter_last_name,
        reporter.full_name as reporter_full_name
      FROM tickets t
      LEFT JOIN machines m ON t.machine_id = m.id
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users reporter ON t.reported_by = reporter.id
      WHERE t.assigned_to IS NOT NULL
        AND t.scheduled_date IS NOT NULL
        AND t.scheduled_date != 'null'
        AND t.scheduled_date != ''
        AND t.status NOT IN ('completed', 'archived')
        AND t.deleted_at IS NULL
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

    // Get webhook URL from DB (SaaS-ready, zero hardcoding)
    const WEBHOOK_URL = await getWebhookUrl(c.env.DB);
    
    // Log if no webhook configured (not an error, just info)
    if (!WEBHOOK_URL) {
      console.log('ℹ️ CRON: No webhook_url configured, webhook notifications disabled');
    }

    let notificationsSent = 0;
    const notifications = [];
    const errors = [];

    // Envoyer webhook pour chaque ticket expiré
    for (const ticket of overdueTickets.results as any[]) {
      try {
        // VÉRIFICATION: Une notification a-t-elle déjà été envoyée pour cette date planifiée?
        // Important: On vérifie scheduled_date_notified, pas juste le temps écoulé
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
          console.log(`⏭️ CRON: Skip ${ticket.ticket_id} - notification déjà envoyée pour cette date (${ticket.scheduled_date})`);
          continue;
        }

        const scheduledDate = new Date(ticket.scheduled_date);
        const delay = now.getTime() - scheduledDate.getTime();
        const delayHours = Math.floor(delay / (1000 * 60 * 60));
        const delayMinutes = Math.floor((delay % (1000 * 60 * 60)) / (1000 * 60));

        const overdueText = delayHours > 0
          ? `${delayHours}h ${delayMinutes}min`
          : `${delayMinutes}min`;

        // Logique de nom d'assigné robuste
        const assigneeName = formatUserName({
          first_name: ticket.assignee_first_name,
          last_name: ticket.assignee_last_name,
          full_name: ticket.assignee_full_name
        }, null);

        // Logique de nom de rapporteur robuste
        const reporterName = formatUserName({
          first_name: ticket.reporter_first_name,
          last_name: ticket.reporter_last_name,
          full_name: ticket.reporter_full_name
        }, 'Inconnu');

        const assigneeInfo = ticket.assigned_to === 0
          ? 'Toute l\'équipe'
          : assigneeName
            ? `👤 ${assigneeName}`
            : 'Non assigné';

        // Préparer données webhook
        // CORRECTION 2025-11-23: Les dates dans la DB sont stockées en UTC (via localDateTimeToUTC() frontend).
        // On convertit en heure locale pour affichage lisible dans les emails Pabbly.
        // NOTE: La déduplication utilise ticket.scheduled_date (UTC brut) donc pas d'impact.
        const webhookData = {
          ticket_id: ticket.ticket_id,
          title: ticket.title,
          description: ticket.description || '',
          priority: ticket.priority,
          status: ticket.status,
          machine_type: ticket.machine_type,
          model: ticket.model,
          scheduled_date: convertToLocalTime(ticket.scheduled_date, timezoneOffset),
          assigned_to: assigneeInfo,
          reporter: reporterName,
          overdue_text: overdueText,
          created_at: convertToLocalTime(ticket.created_at, timezoneOffset),
          notification_time: convertToLocalTime(now, timezoneOffset)
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

        // Enregistrer notification dans DB avec la date planifiée
        const sentAt = now.toISOString();
        await c.env.DB.prepare(`
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

        // ENVOYER PUSH NOTIFICATION au technicien assigné
        // ⚠️ DÉDUPLICATION: Vérifier si un push a déjà été envoyé récemment (fenêtre de 5 minutes)
        // pour éviter les doublons quand un ticket est créé déjà expiré
        try {
          const existingAssigneePush = await c.env.DB.prepare(`
            SELECT id FROM push_logs
            WHERE user_id = ? AND ticket_id = ?
              AND datetime(created_at) >= datetime('now', '-5 minutes')
            LIMIT 1
          `).bind(ticket.assigned_to, ticket.id).first();

          if (existingAssigneePush) {
            console.log(`⏭️ CRON: Push déjà envoyé récemment pour ${ticket.ticket_id} (assigné: ${ticket.assigned_to}), skip pour éviter doublon`);
          } else {
            // Aucun push récent, on envoie
            // Récupérer le nom de l'utilisateur assigné
            const assignedUser = await c.env.DB.prepare(
              'SELECT first_name, last_name, full_name, email FROM users WHERE id = ?'
            ).bind(ticket.assigned_to).first() as any;
            
            const userName = formatUserName(assignedUser, 'Technicien');
            
            const { sendPushNotification } = await import('./push');
            const pushResult = await sendPushNotification(c.env, ticket.assigned_to, {
            title: `🔴 ${userName}, ticket expiré`,
            body: `${ticket.ticket_id}: ${ticket.title} - Retard ${overdueText}`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            data: { 
              ticketId: ticket.id, 
              ticket_id: ticket.ticket_id,
              type: 'overdue',
              action: 'view_ticket',
              url: `/?ticket=${ticket.id}` 
            }
          });

          // Logger push result
          await c.env.DB.prepare(`
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
          } else {
            console.log(`⚠️ CRON: Push notification échouée pour ${ticket.ticket_id}`);
          }
          } // Fin du else (déduplication)
        } catch (pushError) {
          console.error(`⚠️ CRON: Erreur push notification pour ${ticket.ticket_id} (non-critique):`, pushError);
        }

        // ENVOYER PUSH NOTIFICATION À TOUS LES ADMINS
        try {
          const { sendPushNotification } = await import('./push');
          
          // Récupérer tous les administrateurs
          const { results: admins } = await c.env.DB.prepare(`
            SELECT id, first_name FROM users WHERE role = 'admin'
          `).all();
          
          if (admins && admins.length > 0) {
            console.log(`🔔 CRON: Envoi push aux ${admins.length} admin(s) pour ticket expiré ${ticket.ticket_id}`);
            
            // Envoyer à chaque admin
            for (const admin of admins as any[]) {
              // Vérifier si push déjà envoyé à cet admin pour ce ticket (dans les dernières 24h)
              const existingAdminPush = await c.env.DB.prepare(`
                SELECT id FROM push_logs
                WHERE user_id = ? AND ticket_id = ?
                  AND datetime(created_at) >= datetime('now', '-24 hours')
                LIMIT 1
              `).bind(admin.id, ticket.id).first();

              if (existingAdminPush) {
                console.log(`⏭️ CRON: Push déjà envoyé à admin ${admin.id} pour ${ticket.ticket_id}`);
                continue;
              }

              try {
                const adminName = formatUserName(admin, 'Admin');
                
                const adminPushResult = await sendPushNotification(c.env, admin.id as number, {
                  title: `⚠️ ${adminName}, ticket expiré`,
                  body: `${ticket.ticket_id}: ${ticket.title} - Retard ${overdueText}`,
                  icon: '/icon-192.png',
                  badge: '/badge-72.png',
                  data: {
                    ticketId: ticket.id,
                    ticket_id: ticket.ticket_id,
                    action: 'view_ticket',
                    url: `/?ticket=${ticket.id}`,
                    overdue_cron: true,
                    priority: ticket.priority,
                    assignedTo: ticket.assigned_to
                  }
                });
                
                // Logger le résultat dans push_logs
                await c.env.DB.prepare(`
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
                  await c.env.DB.prepare(`
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
          console.error(`⚠️ CRON: Erreur récupération admins pour ${ticket.ticket_id}:`, adminsError);
        }

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

// POST /api/cron/cleanup-push-tokens - Nettoyage subscriptions inactives >30 jours
// Route publique CRON sécurisée par CRON_SECRET token
// Recommandation #2 de l'audit: Cleanup automatique des subscriptions inactives
cron.post('/cleanup-push-tokens', async (c) => {
  try {
    // Vérifier le token secret
    const authHeader = c.req.header('Authorization');
    const expectedToken = c.env.CRON_SECRET;

    if (authHeader !== expectedToken) {
      return c.json({ error: 'Unauthorized - Invalid CRON token' }, 401);
    }

    const now = new Date();
    console.log('🧹 CRON cleanup-push-tokens démarré:', now.toISOString());

    // ÉTAPE 1: Identifier les subscriptions inactives >30 jours AVANT suppression
    const { results: inactiveSubscriptions } = await c.env.DB.prepare(`
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
      return c.json({
        success: true,
        deletedCount: 0,
        message: 'Aucune subscription inactive à nettoyer',
        checked_at: now.toISOString()
      });
    }

    console.log(`⚠️ CRON: ${inactiveSubscriptions.length} subscription(s) inactive(s) >30 jours trouvée(s)`);

    // ÉTAPE 2: Logger les détails AVANT suppression
    const deletedDevices: any[] = [];
    for (const sub of inactiveSubscriptions as any[]) {
      console.log(`🗑️ CRON: Suppression device "${sub.device_name}" (user_id:${sub.user_id}, ${Math.floor(sub.days_inactive)} jours inactif)`);
      deletedDevices.push({
        user_id: sub.user_id,
        device_name: sub.device_name,
        last_used: sub.last_used,
        days_inactive: Math.floor(sub.days_inactive)
      });
    }

    // ÉTAPE 3: Suppression réelle des subscriptions inactives
    const result = await c.env.DB.prepare(`
      DELETE FROM push_subscriptions
      WHERE julianday('now') - julianday(last_used) > 30
    `).run();

    const deletedCount = result.meta.changes || 0;
    console.log(`✅ CRON: ${deletedCount} subscription(s) inactive(s) supprimée(s)`);

    // ÉTAPE 4: Vérifier l'état post-cleanup
    const { results: remainingSubscriptions } = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM push_subscriptions
    `).all();
    const remainingCount = (remainingSubscriptions[0] as any)?.count || 0;

    console.log(`📊 CRON: ${remainingCount} subscription(s) active(s) restante(s)`);
    console.log(`🎉 CRON cleanup-push-tokens terminé: ${deletedCount} suppression(s)`);

    return c.json({
      success: true,
      deletedCount: deletedCount,
      remainingCount: remainingCount,
      deletedDevices: deletedDevices,
      message: `Nettoyage terminé: ${deletedCount} subscription(s) inactive(s) >30 jours supprimée(s)`,
      checked_at: now.toISOString()
    });

  } catch (error) {
    console.error('❌ CRON: Erreur cleanup-push-tokens:', error);
    return c.json({ 
      error: 'Erreur lors du nettoyage des subscriptions', 
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, 500);
  }
});

export default cron;
