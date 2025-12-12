
import type { Bindings } from '../types';

// URL du webhook Pabbly (Routeur Global)
// Trouvée dans les anciens fichiers de config cron
const PABBLY_WEBHOOK_URL = 'https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY0MDYzMDA0M2Q1MjY5NTUzYzUxM2Ei_pc';

export type PabblyEventType = 'ticket_created' | 'ticket_updated' | 'ticket_deleted' | 'ticket_overdue';

export async function sendToPabbly(
  env: Bindings, 
  eventType: PabblyEventType, 
  data: any
): Promise<void> {
  // Mode "Shadow Logging" - Ne jamais bloquer l'application principale
  // On utilise un try/catch silencieux
  try {
    const payload = {
      event_type: eventType,
      timestamp: new Date().toISOString(),
      ...data
    };

    console.log(`📡 [Pabbly] Envoi webhook: ${eventType}`, payload.ticket_id || 'No ID');

    // On lance la requête sans attendre la réponse (fire and forget)
    // Note: Dans un Cloudflare Worker, il faut idéalement utiliser ctx.waitUntil
    // mais ici on est dans une fonction helper. L'appelant doit wrapper ça si possible,
    // ou on assume que fetch est assez rapide.
    
    // Si on a accès à PABBLY_WEBHOOK_URL via env (si l'utilisateur veut le changer), on l'utilise
    // Sinon on fallback sur la constante
    const url = (env as any).PABBLY_WEBHOOK_URL || PABBLY_WEBHOOK_URL;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.warn(`⚠️ [Pabbly] Erreur HTTP ${response.status}: ${await response.text()}`);
    } else {
      console.log(`✅ [Pabbly] Succès`);
    }

  } catch (e) {
    console.error(`❌ [Pabbly] Exception:`, e);
  }
}
