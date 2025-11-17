# 🔧 Plan d'Action - Corrections Système Webhook

## 📋 Résumé Exécutif

Ce document présente le plan d'action pour corriger les **8 problèmes identifiés** lors de l'audit du système de notifications webhook.

**Temps estimé total** : 3-4 heures  
**Complexité** : Moyenne  
**Impact** : Élevé (amélioration significative de la fiabilité)

---

## 🚨 Phase 1 : Corrections URGENTES (1h)

### ✅ Tâche 1.1 : Externaliser l'URL Webhook
**Temps estimé** : 20 minutes  
**Priorité** : CRITIQUE 🔴

**Fichiers à modifier :**
1. `/src/types.ts` - Ajouter binding
2. `/src/routes/webhooks.ts` - Utiliser variable d'environnement
3. `.dev.vars` - Créer (dev local)
4. Cloudflare Dashboard - Ajouter secret (production)

**Code à implémenter :**

```typescript
// 1. /src/types.ts
export interface Bindings {
  DB: D1Database;
  PABBLY_WEBHOOK_URL: string; // NOUVEAU
}

// 2. /src/routes/webhooks.ts (ligne 8)
// AVANT:
// const WEBHOOK_URL = 'https://connect.pabbly.com/workflow/sendwebhookdata/...';

// APRÈS:
webhooks.post('/check-overdue-tickets', async (c) => {
  const WEBHOOK_URL = c.env.PABBLY_WEBHOOK_URL;
  
  if (!WEBHOOK_URL) {
    return c.json({ 
      error: 'Configuration manquante: PABBLY_WEBHOOK_URL non défini' 
    }, 500);
  }
  
  // ... reste du code
});

// 3. Créer /.dev.vars
PABBLY_WEBHOOK_URL=https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY0MDYzMDA0M2Q1MjY5NTUzYzUxM2Ei_pc
```

**Commandes à exécuter :**
```bash
# Créer .dev.vars
echo 'PABBLY_WEBHOOK_URL=https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY0MDYzMDA0M2Q1MjY5NTUzYzUxM2Ei_pc' > .dev.vars

# Ajouter au .gitignore
echo '.dev.vars' >> .gitignore

# Pour production (après déploiement)
npx wrangler secret put PABBLY_WEBHOOK_URL
```

**Test de validation :**
```bash
# Démarrer local
npm run dev

# Tester
curl -X POST http://localhost:3000/api/webhooks/check-overdue-tickets \
  -H "Authorization: Bearer YOUR_TOKEN"
  
# Doit fonctionner sans erreur "PABBLY_WEBHOOK_URL non défini"
```

---

### ✅ Tâche 1.2 : Ajouter Timeout sur Fetch
**Temps estimé** : 15 minutes  
**Priorité** : CRITIQUE 🔴

**Fichiers à modifier :**
1. `/src/routes/webhooks.ts` - Ajouter AbortSignal

**Code à implémenter :**

```typescript
// /src/routes/webhooks.ts (ligne 107)

// AVANT:
const webhookResponse = await fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(webhookData)
});

// APRÈS:
const webhookResponse = await fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(webhookData),
  signal: AbortSignal.timeout(10000) // Timeout de 10 secondes
});
```

**Test de validation :**
```javascript
// Console navigateur - Simuler timeout
// Modifier temporairement l'URL pour tester
axios.post('/api/webhooks/check-overdue-tickets')
  .catch(err => console.log('Erreur attendue:', err));
```

---

### ✅ Tâche 1.3 : Ajouter .dev.vars au .gitignore
**Temps estimé** : 5 minutes  
**Priorité** : CRITIQUE 🔴

**Commandes :**
```bash
# Vérifier que .dev.vars n'est pas déjà commité
git status

# Ajouter au .gitignore si pas déjà présent
echo ".dev.vars" >> .gitignore

# Commit
git add .gitignore
git commit -m "chore: Add .dev.vars to gitignore for security"
```

---

### ✅ Tâche 1.4 : Update Types Bindings
**Temps estimé** : 10 minutes  
**Priorité** : URGENTE 🔴

**Fichier à vérifier :**
`/src/types.ts`

**Code attendu :**
```typescript
export interface Bindings {
  DB: D1Database;
  PABBLY_WEBHOOK_URL: string;
  // Autres bindings existants...
}
```

---

### ✅ Tâche 1.5 : Mettre à Jour wrangler.jsonc
**Temps estimé** : 10 minutes  
**Priorité** : URGENTE 🔴

**Fichier :** `/wrangler.jsonc`

**Ajouter (pour documentation) :**
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "webapp",
  // ... config existante
  
  // Documentation des variables d'environnement requises
  // IMPORTANT: Ces variables doivent être configurées via:
  // - Développement: .dev.vars (non commité)
  // - Production: wrangler secret put VARIABLE_NAME
  "vars": {
    // Liste des variables REQUISES (pour référence):
    // - PABBLY_WEBHOOK_URL: URL du webhook Pabbly Connect
  }
}
```

---

## 🟠 Phase 2 : Corrections HAUTES (1.5h)

### ✅ Tâche 2.1 : Créer Utilitaire Retry
**Temps estimé** : 45 minutes  
**Priorité** : HAUTE 🟠

**Nouveau fichier :** `/src/utils/webhook.ts`

```typescript
/**
 * Envoie un webhook avec retry automatique en cas d'échec
 * @param url - URL du webhook
 * @param data - Données à envoyer
 * @param maxRetries - Nombre maximum de tentatives (défaut: 3)
 * @returns Response de fetch
 */
export async function sendWebhookWithRetry(
  url: string,
  data: any,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Tentative ${attempt}/${maxRetries} d'envoi webhook...`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'IGP-Maintenance-System/1.0'
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(10000) // 10 secondes
      });
      
      // Succès (2xx)
      if (response.ok) {
        console.log(`Webhook envoyé avec succès (tentative ${attempt})`);
        return response;
      }
      
      // Erreur client (4xx) - Ne pas retry
      if (response.status >= 400 && response.status < 500) {
        console.error(`Erreur client ${response.status} - Pas de retry`);
        return response;
      }
      
      // Erreur serveur (5xx) - Retry avec backoff
      if (response.status >= 500 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.warn(`Erreur serveur ${response.status} - Retry dans ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Dernière tentative échouée
      return response;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Erreur tentative ${attempt}:`, lastError.message);
      
      // Dernière tentative
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Attendre avant retry (backoff exponentiel)
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(`Retry dans ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Max retries atteint sans succès');
}

/**
 * Sanitize text pour webhook (retire caractères problématiques)
 */
export function sanitizeForWebhook(text: string | null | undefined): string {
  if (!text) return '';
  
  return text
    // Garder ASCII + accents français
    .replace(/[^\x20-\x7E\u00C0-\u017F]/g, '')
    // Limiter la taille
    .substring(0, 5000)
    // Trim whitespace
    .trim();
}
```

**Mise à jour de `/src/routes/webhooks.ts` :**

```typescript
import { sendWebhookWithRetry, sanitizeForWebhook } from '../utils/webhook';

// Remplacer lignes 85-113
const webhookData = {
  ticket_id: ticket.ticket_id,
  title: sanitizeForWebhook(ticket.title),
  description: sanitizeForWebhook(ticket.description),
  priority: ticket.priority,
  status: ticket.status,
  machine: sanitizeForWebhook(`${ticket.machine_type} ${ticket.model}`),
  scheduled_date: ticket.scheduled_date,
  assigned_to: ticket.assigned_to === 0 
    ? 'Équipe complète' 
    : sanitizeForWebhook(ticket.assignee_name || `Technicien #${ticket.assigned_to}`),
  reporter: sanitizeForWebhook(ticket.reporter_name || 'N/A'),
  created_at: ticket.created_at,
  overdue_days: overdueDays,
  overdue_hours: overdueHours,
  overdue_minutes: overdueMinutes,
  overdue_text: overdueDays > 0 
    ? `${overdueDays} jour(s) ${overdueHours}h ${overdueMinutes}min`
    : `${overdueHours}h ${overdueMinutes}min`,
  notification_sent_at: now.toISOString()
};

// Envoyer avec retry
const webhookResponse = await sendWebhookWithRetry(WEBHOOK_URL, webhookData);
```

**Test de validation :**
```bash
# Tester avec un ticket expiré
# Vérifier les logs console pour voir les tentatives
pm2 logs maintenance-app --nostream --lines 20
```

---

### ✅ Tâche 2.2 : Ajouter Endpoint Health
**Temps estimé** : 30 minutes  
**Priorité** : HAUTE 🟠

**Fichier :** `/src/routes/webhooks.ts`

**Ajouter à la fin (avant export) :**

```typescript
/**
 * GET /api/webhooks/health - État de santé du système de notifications
 */
webhooks.get('/health', async (c) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Stats 24h
    const stats24h = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN response_status >= 400 AND response_status < 500 THEN 1 ELSE 0 END) as client_errors,
        SUM(CASE WHEN response_status >= 500 THEN 1 ELSE 0 END) as server_errors,
        MAX(sent_at) as last_sent
      FROM webhook_notifications
      WHERE datetime(sent_at) > datetime(?)
    `).bind(last24h.toISOString()).first();
    
    // Stats 7 jours
    const stats7d = await c.env.DB.prepare(`
      SELECT COUNT(*) as total
      FROM webhook_notifications
      WHERE datetime(sent_at) > datetime(?)
    `).bind(last7days.toISOString()).first();
    
    // Calculer taux de succès
    const total = stats24h?.total || 0;
    const success = stats24h?.success || 0;
    const successRate = total > 0 ? ((success / total) * 100).toFixed(2) : '100.00';
    
    // Déterminer l'état
    let status = 'healthy';
    if (parseFloat(successRate) < 95) status = 'degraded';
    if (parseFloat(successRate) < 80) status = 'unhealthy';
    
    return c.json({
      status: status,
      timestamp: now.toISOString(),
      last_24_hours: {
        total: total,
        success: success,
        client_errors: stats24h?.client_errors || 0,
        server_errors: stats24h?.server_errors || 0,
        success_rate: successRate + '%',
        last_notification: stats24h?.last_sent || null
      },
      last_7_days: {
        total: stats7d?.total || 0
      }
    });
    
  } catch (error) {
    console.error('Erreur health check:', error);
    return c.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, 500);
  }
});
```

**Test de validation :**
```bash
# Tester l'endpoint health
curl http://localhost:3000/api/webhooks/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Réponse attendue :**
```json
{
  "status": "healthy",
  "timestamp": "2024-11-12T20:30:00.000Z",
  "last_24_hours": {
    "total": 5,
    "success": 5,
    "client_errors": 0,
    "server_errors": 0,
    "success_rate": "100.00%",
    "last_notification": "2024-11-12 20:15:00"
  },
  "last_7_days": {
    "total": 28
  }
}
```

---

### ✅ Tâche 2.3 : Documentation des Variables
**Temps estimé** : 15 minutes  
**Priorité** : HAUTE 🟠

**Créer :** `/ENVIRONMENT_VARIABLES.md`

```markdown
# Variables d'Environnement Requises

## Production (Cloudflare Secrets)

### PABBLY_WEBHOOK_URL
- **Type** : String (URL)
- **Requis** : Oui
- **Description** : URL du webhook Pabbly Connect pour les notifications de tickets expirés
- **Exemple** : `https://connect.pabbly.com/workflow/sendwebhookdata/...`
- **Configuration** :
  ```bash
  npx wrangler secret put PABBLY_WEBHOOK_URL
  ```

## Développement Local (.dev.vars)

Créer un fichier `.dev.vars` à la racine :

```bash
PABBLY_WEBHOOK_URL=https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY0MDYzMDA0M2Q1MjY5NTUzYzUxM2Ei_pc
```

⚠️ **IMPORTANT** : Ce fichier est dans `.gitignore` et ne doit JAMAIS être commité.
```

---

## 🟡 Phase 3 : Améliorations MOYENNES (Optionnel - 1h)

### ✅ Tâche 3.1 : Migration vers Cron Jobs
**Temps estimé** : 45 minutes  
**Priorité** : MOYENNE 🟡

**Fichier :** `/wrangler.jsonc`

```jsonc
{
  "triggers": {
    "crons": ["*/5 * * * *"]  // Toutes les 5 minutes
  }
}
```

**Nouveau endpoint :** `/src/routes/webhooks.ts`

```typescript
/**
 * Endpoint appelé par Cloudflare Cron (toutes les 5 minutes)
 */
webhooks.get('/cron/check-overdue', async (c) => {
  // Vérifier que la requête vient bien du cron Cloudflare
  const cfRay = c.req.header('cf-ray');
  const userAgent = c.req.header('user-agent');
  
  if (!cfRay || !userAgent?.includes('Cloudflare')) {
    return c.json({ error: 'Accès non autorisé - Cron uniquement' }, 403);
  }
  
  // Exécuter la même logique que check-overdue-tickets
  // ... (copier le code)
});
```

**Retirer interval frontend :** `/src/index.tsx`

```typescript
// RETIRER ces lignes:
// const overdueInterval = setInterval(() => {
//   checkOverdueTickets();
// }, 5 * 60 * 1000);
```

---

## 📊 Checklist de Validation Complète

### Phase 1 - URGENTE ✅
- [ ] URL webhook externalisée
- [ ] .dev.vars créé et ignoré par git
- [ ] Timeout de 10s ajouté
- [ ] Types Bindings mis à jour
- [ ] Tests locaux passent

### Phase 2 - HAUTE ✅
- [ ] Fonction sendWebhookWithRetry créée
- [ ] Fonction sanitizeForWebhook créée
- [ ] Endpoint /webhooks/health fonctionnel
- [ ] Documentation ENVIRONMENT_VARIABLES.md créée
- [ ] Logs de retry visibles

### Phase 3 - MOYENNE (Optionnel) ✅
- [ ] Cron job configuré dans wrangler.jsonc
- [ ] Endpoint /cron/check-overdue créé
- [ ] Interval frontend retiré
- [ ] Tests cron en production

---

## 🚀 Ordre d'Exécution Recommandé

1. ✅ **Jour 1 (2h)** : Phase 1 complète
2. ✅ **Jour 2 (1.5h)** : Phase 2 complète
3. ✅ **Jour 3 (1h)** : Phase 3 (optionnel)
4. ✅ **Jour 4** : Tests en production et monitoring

---

## 📝 Notes Finales

- Toujours tester en local avant déploiement
- Vérifier les logs PM2 après chaque changement
- Monitorer l'endpoint /health après déploiement
- Documenter tout changement dans le README

**Temps total estimé** : 3-4 heures (phases 1+2)  
**Impact attendu** : +15 points au score d'audit (85 → 100)
