/**
 * Routes Push Notifications
 * Gestion des abonnements push et envoi de notifications
 */

import { Hono } from 'hono';
import type { Bindings } from '../types';
import webpush from 'web-push';

const push = new Hono<{ Bindings: Bindings }>();

/**
 * POST /api/push/subscribe
 * Abonner un utilisateur aux notifications push
 */
push.post('/subscribe', async (c) => {
  try {
    // Vérifier que push est activé
    if (c.env.PUSH_ENABLED === 'false') {
      return c.json({ success: false, error: 'Push notifications désactivées' }, 503);
    }

    const session = c.get('session') as any;
    if (!session || !session.userId) {
      return c.json({ error: 'Non authentifié' }, 401);
    }

    const body = await c.req.json();
    const { subscription, deviceType, deviceName } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return c.json({ error: 'Subscription invalide' }, 400);
    }

    // Insérer ou mettre à jour la subscription
    await c.env.DB.prepare(`
      INSERT INTO push_subscriptions 
      (user_id, endpoint, p256dh, auth, device_type, device_name, last_used)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(endpoint) DO UPDATE SET
        last_used = datetime('now'),
        device_type = excluded.device_type,
        device_name = excluded.device_name
    `).bind(
      session.userId,
      subscription.endpoint,
      subscription.keys.p256dh,
      subscription.keys.auth,
      deviceType || 'unknown',
      deviceName || 'Unknown Device'
    ).run();

    console.log(`✅ Push subscription added for user ${session.userId}`);

    return c.json({ success: true });
  } catch (error) {
    console.error('❌ Push subscribe error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * POST /api/push/unsubscribe
 * Désabonner un utilisateur des notifications push
 */
push.post('/unsubscribe', async (c) => {
  try {
    const session = c.get('session') as any;
    if (!session || !session.userId) {
      return c.json({ error: 'Non authentifié' }, 401);
    }

    const body = await c.req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return c.json({ error: 'Endpoint requis' }, 400);
    }

    await c.env.DB.prepare(`
      DELETE FROM push_subscriptions 
      WHERE user_id = ? AND endpoint = ?
    `).bind(session.userId, endpoint).run();

    console.log(`✅ Push subscription removed for user ${session.userId}`);

    return c.json({ success: true });
  } catch (error) {
    console.error('❌ Push unsubscribe error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/push/vapid-public-key
 * Récupérer la clé publique VAPID (nécessaire pour le frontend)
 */
push.get('/vapid-public-key', async (c) => {
  try {
    const publicKey = c.env.VAPID_PUBLIC_KEY;
    
    if (!publicKey) {
      return c.json({ error: 'Clé VAPID non configurée' }, 500);
    }

    return c.json({ publicKey });
  } catch (error) {
    console.error('❌ VAPID key error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * Fonction helper: Envoyer notification push à un utilisateur
 * Cette fonction est fail-safe: si push échoue, l'app continue
 */
export async function sendPushNotification(
  env: Bindings,
  userId: number,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: any;
  }
): Promise<{ success: boolean; sentCount: number; failedCount: number }> {
  let sentCount = 0;
  let failedCount = 0;

  try {
    // Vérifier que push est activé
    if (env.PUSH_ENABLED === 'false') {
      console.log('Push notifications disabled, skipping');
      return { success: false, sentCount: 0, failedCount: 0 };
    }

    // Vérifier que les clés VAPID sont configurées
    if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
      console.error('❌ VAPID keys not configured');
      return { success: false, sentCount: 0, failedCount: 0 };
    }

    // Configurer web-push avec les clés VAPID
    webpush.setVapidDetails(
      'mailto:support@igpglass.ca',
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY
    );

    // Récupérer toutes les subscriptions actives de l'utilisateur
    const subscriptions = await env.DB.prepare(`
      SELECT endpoint, p256dh, auth
      FROM push_subscriptions
      WHERE user_id = ? AND last_used > datetime('now', '-90 days')
    `).bind(userId).all();

    if (!subscriptions.results || subscriptions.results.length === 0) {
      console.log(`No active push subscriptions for user ${userId}`);
      return { success: false, sentCount: 0, failedCount: 0 };
    }

    // Envoyer notification à chaque appareil
    for (const sub of subscriptions.results) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint as string,
          keys: {
            p256dh: sub.p256dh as string,
            auth: sub.auth as string
          }
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload)
        );

        // Mettre à jour last_used
        await env.DB.prepare(`
          UPDATE push_subscriptions
          SET last_used = datetime('now')
          WHERE endpoint = ?
        `).bind(sub.endpoint).run();

        sentCount++;
        console.log(`✅ Push sent to user ${userId}`);

      } catch (error: any) {
        failedCount++;
        console.error(`❌ Push failed for subscription:`, error);

        // Si 410 Gone, le token a expiré, le supprimer
        if (error.statusCode === 410) {
          console.log(`Removing expired subscription for user ${userId}`);
          await env.DB.prepare(`
            DELETE FROM push_subscriptions WHERE endpoint = ?
          `).bind(sub.endpoint).run();
        }
      }
    }

    return {
      success: sentCount > 0,
      sentCount,
      failedCount
    };

  } catch (error) {
    console.error('❌ sendPushNotification global error:', error);
    return { success: false, sentCount, failedCount };
  }
}

export default push;
