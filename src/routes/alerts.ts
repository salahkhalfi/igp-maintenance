// Routes Alerts - Alertes automatiques pour tickets en retard

import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth';
import { formatUserName } from '../utils/userFormatter';
import type { Bindings } from '../types';

const alerts = new Hono<{ Bindings: Bindings }>();

// POST /api/alerts/check-overdue - Envoyer des alertes automatiques pour tickets en retard
// Route authentifiée (admin/superviseur uniquement)
alerts.post('/check-overdue', authMiddleware, async (c) => {
  try {
    const user = c.get('user');

    // Seuls admin et superviseur peuvent déclencher cette vérification
    if (user.role !== 'admin' && user.role !== 'supervisor') {
      return c.json({ error: 'Permission refusée' }, 403);
    }

    // Obtenir le decalage horaire depuis les parametres systeme
    const { results: settingResults } = await c.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'timezone_offset_hours'
    `).all();

    const timezoneOffset = settingResults.length > 0 ? parseInt(settingResults[0].setting_value) : -5;

    // Appliquer le decalage horaire (ex: -5 pour EST, -4 pour EDT)
    const nowUTC = new Date();
    const nowLocal = new Date(nowUTC.getTime() + (timezoneOffset * 60 * 60 * 1000));
    const now = nowLocal.toISOString().replace('T', ' ').substring(0, 19); // Format: YYYY-MM-DD HH:MM:SS

    // Trouver tous les tickets planifiés en retard (received ou diagnostic uniquement)
    const { results: overdueTickets } = await c.env.DB.prepare(`
      SELECT
        t.id,
        t.ticket_id,
        t.title,
        t.description,
        t.machine_type,
        t.model,
        t.priority,
        t.status,
        t.scheduled_date,
        t.assigned_to,
        u.first_name as assigned_first_name,
        u.last_name as assigned_last_name,
        u.full_name as assigned_full_name,
        r.first_name as reporter_first_name,
        r.last_name as reporter_last_name,
        r.full_name as reporter_full_name
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users r ON t.reported_by = r.id
      WHERE t.scheduled_date IS NOT NULL
        AND t.scheduled_date < ?
        AND (t.status = 'received' OR t.status = 'diagnostic')
        AND t.deleted_at IS NULL
      ORDER BY t.scheduled_date ASC
    `).bind(now).all();

    if (overdueTickets.length === 0) {
      return c.json({ message: 'Aucun ticket en retard', count: 0 });
    }

    // Trouver tous les administrateurs
    const { results: admins } = await c.env.DB.prepare(`
      SELECT id, first_name
      FROM users
      WHERE role = 'admin'
    `).all();

    if (admins.length === 0) {
      return c.json({ error: 'Aucun administrateur trouvé' }, 404);
    }

    let sentCount = 0;

    // Pour chaque ticket en retard, envoyer une notification à tous les admins
    for (const ticket of overdueTickets) {
      // Vérifier si une alerte a déjà été envoyée pour ce ticket (éviter les doublons)
      const { results: existingAlerts } = await c.env.DB.prepare(`
        SELECT id FROM messages
        WHERE content LIKE ?
          AND message_type = 'private'
          AND created_at > datetime('now', '-24 hours')
      `).bind(`%${ticket.ticket_id}%RETARD%`).all();

      // Si alerte déjà envoyée dans les 24h, passer au suivant
      if (existingAlerts.length > 0) {
        continue;
      }

      // Calculer le retard
      const scheduledDate = new Date(ticket.scheduled_date);
      const nowDate = new Date();
      const delayMs = nowDate.getTime() - scheduledDate.getTime();
      const delayHours = Math.floor(delayMs / (1000 * 60 * 60));
      const delayMinutes = Math.floor((delayMs % (1000 * 60 * 60)) / (1000 * 60));

      // Créer le message d'alerte
      const priorityEmoji =
        ticket.priority === 'critical' ? '🔴 CRITIQUE' :
        ticket.priority === 'high' ? '🟠 HAUTE' :
        ticket.priority === 'medium' ? '🟡 MOYENNE' :
        '🟢 FAIBLE';

      // Logique de nom d'assigné robuste
      const assignedName = formatUserName({
        first_name: ticket.assigned_first_name,
        last_name: ticket.assigned_last_name,
        full_name: ticket.assigned_full_name
      }, null);

      // Logique de nom de rapporteur robuste
      const reporterName = formatUserName({
        first_name: ticket.reporter_first_name,
        last_name: ticket.reporter_last_name,
        full_name: ticket.reporter_full_name
      }, 'N/A');

      const assignedInfo = ticket.assigned_to === 0
        ? '👥 Toute l\'équipe'
        : assignedName
          ? `👤 ${assignedName}`
          : '❌ Non assigné';

      const messageContent = `
⚠️ ALERTE RETARD ⚠️

Ticket: ${ticket.ticket_id}
Titre: ${ticket.title}
Machine: ${ticket.machine_type} ${ticket.model}
Priorité: ${priorityEmoji}
Statut: ${ticket.status === 'received' ? 'Requête' : 'Diagnostic'}

📅 Date planifiée: ${new Date(ticket.scheduled_date).toLocaleString('fr-FR')}
⏰ Retard: ${delayHours}h ${delayMinutes}min

Assigné à: ${assignedInfo}
Rapporté par: ${reporterName}

${ticket.description ? `Description: ${ticket.description.substring(0, 100)}${ticket.description.length > 100 ? '...' : ''}` : ''}

Action requise immédiatement !
      `.trim();

      // 🔔 NOUVEAU: Envoyer push notification au technicien assigné (si existe)
      if (ticket.assigned_to && ticket.assigned_to !== 0) {
        try {
          // Vérifier si push déjà envoyé récemment au technicien (fenêtre 5 min anti-spam)
          const existingTechPush = await c.env.DB.prepare(`
            SELECT id FROM push_logs
            WHERE user_id = ? AND ticket_id = ?
              AND datetime(created_at) >= datetime('now', '-5 minutes')
            LIMIT 1
          `).bind(ticket.assigned_to, ticket.id).first();

          if (!existingTechPush) {
            const { sendPushNotification } = await import('./push');
            const delayText = delayHours > 0 
              ? `${delayHours}h ${delayMinutes}min` 
              : `${delayMinutes}min`;

            const techName = assignedName || 'Technicien';
            
            const techPushResult = await sendPushNotification(c.env, ticket.assigned_to as number, {
              title: `🔴 ${techName}, ticket expiré`,
              body: `${ticket.ticket_id}: ${ticket.title} - Retard ${delayText}`,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              actions: [
                { action: 'view', title: 'Voir' },
                { action: 'acknowledge', title: "J'y vais !" }
              ],
              data: {
                ticketId: ticket.id,
                ticket_id: ticket.ticket_id,
                type: 'overdue',
                action: 'view_ticket',
                url: `/?ticket=${ticket.id}`
              }
            });

            // Logger le résultat
            await c.env.DB.prepare(`
              INSERT INTO push_logs (user_id, ticket_id, status, error_message)
              VALUES (?, ?, ?, ?)
            `).bind(
              ticket.assigned_to,
              ticket.id,
              techPushResult.success ? 'success' : 'failed',
              techPushResult.success ? null : JSON.stringify(techPushResult)
            ).run();

            if (techPushResult.success) {
              console.log(`✅ Push notification envoyée au technicien ${ticket.assigned_to} pour ${ticket.ticket_id}`);
            }
          }
        } catch (techPushError) {
          console.error(`⚠️ Push technicien échouée pour ${ticket.ticket_id}:`, techPushError);
        }
      }

      // Envoyer à tous les administrateurs
      for (const admin of admins) {
        // Insert message dans DB
        const result = await c.env.DB.prepare(`
          INSERT INTO messages (sender_id, recipient_id, message_type, content)
          VALUES (?, ?, 'private', ?)
        `).bind(1, admin.id, messageContent).run(); // sender_id = 1 (système)

        sentCount++;

        // 🔔 Envoyer push notification (fail-safe, non-bloquant)
        try {
          const { sendPushNotification } = await import('./push');
          
          // Formatter le retard pour la notification
          const delayText = delayHours > 0 
            ? `${delayHours}h ${delayMinutes}min` 
            : `${delayMinutes}min`;

          const adminName = formatUserName(admin, 'Admin');
          
          const pushResult = await sendPushNotification(c.env, admin.id as number, {
            title: `⚠️ ALERTE RETARD (${adminName})`,
            body: `${ticket.ticket_id}: ${ticket.title} - En retard de ${delayText}`,
            icon: '/icon-192.png',
            badge: '/badge-72.png',
            data: {
              url: '/',
              action: 'overdue_alert_manual',
              ticketId: ticket.id,
              ticket_id: ticket.ticket_id,
              priority: ticket.priority,
              delayHours: delayHours
            }
          });
          
          // Logger le résultat dans push_logs
          await c.env.DB.prepare(`
            INSERT INTO push_logs (user_id, ticket_id, status, error_message)
            VALUES (?, ?, ?, ?)
          `).bind(
            admin.id,
            ticket.id,
            pushResult.success ? 'success' : 'failed',
            pushResult.success ? null : JSON.stringify(pushResult)
          ).run();
          
          if (pushResult.success) {
            console.log(`✅ Push notification sent for overdue alert to admin ${admin.id} (${admin.first_name})`);
          } else {
            console.log(`⚠️ Push notification failed for admin ${admin.id}:`, pushResult);
          }
        } catch (pushError) {
          // Logger l'erreur
          try {
            await c.env.DB.prepare(`
              INSERT INTO push_logs (user_id, ticket_id, status, error_message)
              VALUES (?, ?, ?, ?)
            `).bind(
              admin.id,
              ticket.id,
              'error',
              (pushError as Error).message || String(pushError)
            ).run();
          } catch (logError) {
            console.error('Failed to log push error:', logError);
          }
          // Fail-safe: si push échoue, le message privé est quand même envoyé
          console.error('⚠️ Push notification failed (non-blocking):', pushError);
        }
      }
    }

    return c.json({
      message: `${sentCount} alerte(s) envoyée(s) pour ${overdueTickets.length} ticket(s) en retard`,
      overdueCount: overdueTickets.length,
      alertsSent: sentCount
    });

  } catch (error) {
    console.error('Check overdue error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return c.json({ error: 'Erreur lors de la vérification des retards', details: errorMessage }, 500);
  }
});

export default alerts;
