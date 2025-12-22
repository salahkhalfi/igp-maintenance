/**
 * Universal Webhook Service
 * 
 * SaaS-ready: Works with ANY webhook provider (Pabbly, Make, Zapier, n8n, custom)
 * Zero hardcoding: URL configured via DB (system_settings.webhook_url)
 * 
 * @example
 * await sendWebhook(db, env, 'ticket_created', { ticket_id: 123, title: 'New ticket' });
 */

import type { Bindings } from '../types';

export type WebhookEventType = 
  | 'ticket_created' 
  | 'ticket_updated' 
  | 'ticket_deleted' 
  | 'ticket_overdue'
  | 'machine_down'
  | 'user_created';

/**
 * Get webhook URL from database (cached in memory for performance)
 */
let cachedWebhookUrl: string | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 60000; // 1 minute

async function getWebhookUrl(db: D1Database): Promise<string | null> {
  // Check cache
  if (cachedWebhookUrl !== null && Date.now() < cacheExpiry) {
    return cachedWebhookUrl;
  }

  try {
    const result = await db.prepare(
      'SELECT setting_value FROM system_settings WHERE setting_key = ?'
    ).bind('webhook_url').first<{ setting_value: string }>();

    cachedWebhookUrl = result?.setting_value || null;
    cacheExpiry = Date.now() + CACHE_TTL;
    return cachedWebhookUrl;
  } catch (e) {
    console.error('[Webhook] Failed to get URL from DB:', e);
    return null;
  }
}

/**
 * Clear webhook URL cache (call after settings update)
 */
export function clearWebhookCache(): void {
  cachedWebhookUrl = null;
  cacheExpiry = 0;
}

/**
 * Send webhook to configured URL
 * 
 * @param db - D1 Database instance
 * @param env - Worker bindings (for future ENV fallback if needed)
 * @param eventType - Type of event
 * @param data - Event payload
 * @returns Promise<boolean> - true if sent successfully, false otherwise
 */
export async function sendWebhook(
  db: D1Database, 
  env: Bindings, 
  eventType: WebhookEventType, 
  data: Record<string, any>
): Promise<boolean> {
  try {
    // Get URL from DB
    const webhookUrl = await getWebhookUrl(db);
    
    // If no webhook configured, skip silently (not an error)
    if (!webhookUrl || webhookUrl.trim() === '') {
      // Only log in development, not spam production
      if ((env as any).ENVIRONMENT !== 'production') {
        console.log(`[Webhook] No webhook_url configured, skipping ${eventType}`);
      }
      return false;
    }

    const payload = {
      event_type: eventType,
      timestamp: new Date().toISOString(),
      source: 'MaintenanceOS',
      ...data
    };

    console.log(`📡 [Webhook] Sending ${eventType} to configured URL`);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.warn(`⚠️ [Webhook] HTTP ${response.status}: ${await response.text()}`);
      return false;
    }

    console.log(`✅ [Webhook] Success`);
    return true;

  } catch (e) {
    console.error(`❌ [Webhook] Exception:`, e);
    return false;
  }
}

// Legacy alias for backward compatibility
export const sendToPabbly = sendWebhook;
