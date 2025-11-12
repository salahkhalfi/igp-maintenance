# 🔍 Audit du Système d'Alerte Pabbly Connect

**Date de l'audit** : 2024-11-12  
**Système audité** : Notifications webhook pour tickets planifiés expirés  
**Version** : 1.0.0

---

## 📊 Score Global : 85/100

### Résumé Exécutif

Le système de notifications webhook est **fonctionnel et sécurisé**, mais présente quelques **vulnérabilités et opportunités d'amélioration** identifiées ci-dessous.

---

## ✅ Points Forts (Ce qui fonctionne bien)

### 1. Architecture Solide ✅
- ✅ Séparation claire backend/frontend
- ✅ Route API dédiée (`/src/routes/webhooks.ts`)
- ✅ Migration de base de données bien structurée
- ✅ Index optimisés pour les requêtes

### 2. Sécurité de Base ✅
- ✅ Authentification JWT requise (`authMiddleware`)
- ✅ Validation des données entrantes
- ✅ Protection contre les injections SQL (requêtes paramétrées)
- ✅ Limitation de taille des réponses (1000 caractères)

### 3. Protection Anti-Spam ✅
- ✅ Limite de 1 notification par 24h par ticket
- ✅ Vérification en base de données avant envoi
- ✅ Index composite pour recherche rapide
- ✅ Gestion des doublons efficace

### 4. Gestion d'Erreurs ✅
- ✅ Try-catch sur toutes les opérations critiques
- ✅ Logs d'erreurs dans la console
- ✅ Retour de statut HTTP approprié
- ✅ Collection des erreurs par ticket

### 5. Documentation ✅
- ✅ Documentation technique complète
- ✅ Guide de test détaillé
- ✅ Commentaires dans le code
- ✅ Exemples de requêtes/réponses

---

## ⚠️ Problèmes Critiques Identifiés

### 1. 🔴 CRITIQUE : URL Webhook en Dur dans le Code

**Problème :**
```typescript
// webhooks.ts ligne 8
const WEBHOOK_URL = 'https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY0MDYzMDA0M2Q1MjY5NTUzYzUxM2Ei_pc';
```

**Risques :**
- ❌ URL visible dans le code source
- ❌ Impossible de changer l'URL sans redéploiement
- ❌ Pas de différenciation dev/staging/production
- ❌ Sécurité compromise si le code est partagé

**Impact** : ÉLEVÉ  
**Priorité** : URGENTE

**Solution Recommandée :**
```typescript
// Utiliser les variables d'environnement Cloudflare
const WEBHOOK_URL = c.env.PABBLY_WEBHOOK_URL || 'https://connect.pabbly.com/...';
```

Configuration via Wrangler :
```bash
# Development (.dev.vars)
PABBLY_WEBHOOK_URL=https://connect.pabbly.com/.../dev

# Production (secret)
npx wrangler secret put PABBLY_WEBHOOK_URL --env production
```

---

### 2. 🟠 IMPORTANT : Pas de Retry en Cas d'Échec

**Problème :**
```typescript
// webhooks.ts ligne 107-113
const webhookResponse = await fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(webhookData)
});
// Aucun retry si échec (timeout, 500, 503, etc.)
```

**Risques :**
- ❌ Perte de notifications si Pabbly est temporairement indisponible
- ❌ Pas de mécanisme de retry automatique
- ❌ Notifications enregistrées en DB même si échec
- ❌ Pas d'alerte si échecs répétés

**Impact** : MOYEN-ÉLEVÉ  
**Priorité** : HAUTE

**Solution Recommandée :**
```typescript
// Fonction de retry avec backoff exponentiel
async function sendWebhookWithRetry(url, data, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(10000) // 10s timeout
      });
      
      if (response.ok) return response;
      
      // Retry sur erreurs serveur (500, 502, 503, 504)
      if (response.status >= 500 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return response; // Échec définitif
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

### 3. 🟠 IMPORTANT : Pas de Timeout sur les Requêtes Fetch

**Problème :**
```typescript
// Pas de timeout configuré
const webhookResponse = await fetch(WEBHOOK_URL, {...});
```

**Risques :**
- ❌ Requête peut bloquer indéfiniment
- ❌ Pas de limite CPU time (Cloudflare Workers = 10-30ms max)
- ❌ Peut causer des timeouts Workers
- ❌ Expérience utilisateur dégradée

**Impact** : MOYEN  
**Priorité** : HAUTE

**Solution Recommandée :**
```typescript
const webhookResponse = await fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(webhookData),
  signal: AbortSignal.timeout(10000) // 10 secondes max
});
```

---

### 4. 🟡 MOYEN : Interval Frontend Non Optimal

**Problème :**
```typescript
// index.tsx ligne 7088
const overdueInterval = setInterval(() => {
  checkOverdueTickets();
}, 5 * 60 * 1000); // 5 minutes
```

**Risques :**
- ❌ Vérification même si aucun ticket expiré
- ❌ Charge CPU inutile toutes les 5 minutes
- ❌ Pas de vérification si l'utilisateur est inactif
- ❌ Multiple onglets = multiple vérifications

**Impact** : FAIBLE-MOYEN  
**Priorité** : MOYENNE

**Solutions Recommandées :**

**Option A : Cron Job Cloudflare (MEILLEURE)**
```typescript
// wrangler.jsonc
{
  "triggers": {
    "crons": ["*/5 * * * *"] // Toutes les 5 minutes
  }
}

// Route dédiée pour le cron
app.get('/cron/check-overdue-tickets', async (c) => {
  // Valider que la requête vient du cron Cloudflare
  if (c.req.header('cf-ray') && c.req.header('user-agent')?.includes('Cloudflare')) {
    // Exécuter la vérification
  }
});
```

**Option B : Interval Intelligent**
```typescript
// Vérifier seulement si des tickets expirés existent
const scheduleNextCheck = () => {
  // Charger les tickets planifiés
  const nextScheduledDate = getNextScheduledDate();
  if (nextScheduledDate) {
    const delay = Math.max(nextScheduledDate - Date.now(), 60000);
    setTimeout(() => {
      checkOverdueTickets();
      scheduleNextCheck();
    }, delay);
  }
};
```

---

### 5. 🟡 MOYEN : Pas de Monitoring des Échecs

**Problème :**
```typescript
// Erreurs enregistrées mais pas d'alerte
console.error(`Erreur notification webhook ticket ${ticket.ticket_id}:`, error);
```

**Risques :**
- ❌ Échecs silencieux
- ❌ Pas de visibilité sur les problèmes
- ❌ Difficile de détecter les pannes Pabbly
- ❌ Pas de métriques de fiabilité

**Impact** : MOYEN  
**Priorité** : MOYENNE

**Solution Recommandée :**
```typescript
// Ajouter un endpoint de monitoring
webhooks.get('/health', async (c) => {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 ELSE 0 END) as success,
      SUM(CASE WHEN response_status >= 500 THEN 1 ELSE 0 END) as errors
    FROM webhook_notifications
    WHERE datetime(sent_at) > datetime(?)
  `).bind(last24h.toISOString()).first();
  
  const successRate = stats.total > 0 ? (stats.success / stats.total * 100).toFixed(2) : 100;
  
  return c.json({
    status: successRate >= 95 ? 'healthy' : 'degraded',
    success_rate: successRate + '%',
    last_24h: stats
  });
});
```

---

### 6. 🟡 MOYEN : Gestion des Caractères Spéciaux

**Problème :**
```typescript
// Ligne 89 - Apostrophes et caractères spéciaux potentiels
description: ticket.description,
title: ticket.title,
```

**Risques :**
- ⚠️ Apostrophes non échappées dans description/title
- ⚠️ Caractères spéciaux peuvent casser le JSON
- ⚠️ Emojis peuvent causer des problèmes d'encodage

**Impact** : FAIBLE-MOYEN  
**Priorité** : MOYENNE

**Solution Recommandée :**
```typescript
// Fonction de nettoyage
function sanitizeForWebhook(text: string): string {
  if (!text) return '';
  return text
    .replace(/[^\x20-\x7E\u00C0-\u017F]/g, '') // Garder ASCII + accents français
    .substring(0, 5000); // Limiter la taille
}

const webhookData = {
  ticket_id: ticket.ticket_id,
  title: sanitizeForWebhook(ticket.title),
  description: sanitizeForWebhook(ticket.description),
  // ...
};
```

---

### 7. 🟢 MINEUR : Pas de Rate Limiting

**Problème :**
```typescript
// Pas de limitation du nombre d'appels API
webhooks.post('/check-overdue-tickets', async (c) => {
  // N'importe qui authentifié peut appeler autant qu'il veut
});
```

**Risques :**
- ⚠️ Abus possible (spam d'appels)
- ⚠️ Coûts Cloudflare Workers
- ⚠️ Charge inutile sur Pabbly

**Impact** : FAIBLE  
**Priorité** : BASSE

**Solution Recommandée :**
```typescript
// Utiliser Cloudflare Rate Limiting
import { rateLimiter } from '@hono/rate-limiter';

webhooks.post('/check-overdue-tickets',
  rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 2, // Max 2 requêtes par minute
    keyGenerator: (c) => c.get('user').id // Par utilisateur
  }),
  async (c) => {
    // ...
  }
);
```

---

### 8. 🟢 MINEUR : Calcul du Retard Non Précis

**Problème :**
```typescript
// Ligne 79 - Ajoute 'Z' mais scheduled_date peut déjà être en UTC
const scheduledDate = new Date(ticket.scheduled_date.replace(' ', 'T') + 'Z');
```

**Risques :**
- ⚠️ Possible décalage horaire si timezone mal gérée
- ⚠️ Incohérence avec le calcul frontend

**Impact** : FAIBLE  
**Priorité** : BASSE

**Solution Recommandée :**
```typescript
// Utiliser la même logique que le frontend
function parseScheduledDateUTC(dateString: string): Date {
  const isoString = dateString.includes('T') ? dateString : dateString.replace(' ', 'T');
  return new Date(isoString + (isoString.includes('Z') ? '' : 'Z'));
}
```

---

## 📈 Recommandations d'Amélioration

### Priorité URGENTE 🔴

1. **Externaliser l'URL webhook** (Variables d'environnement)
2. **Ajouter timeout sur fetch** (10 secondes)

### Priorité HAUTE 🟠

3. **Implémenter retry avec backoff exponentiel** (3 tentatives)
4. **Migrer vers Cloudflare Cron Jobs** (au lieu d'interval frontend)

### Priorité MOYENNE 🟡

5. **Ajouter monitoring/health endpoint**
6. **Sanitizer les données avant envoi**
7. **Logger les métriques de succès/échec**

### Priorité BASSE 🟢

8. **Ajouter rate limiting**
9. **Optimiser le calcul du retard**
10. **Ajouter tests unitaires**

---

## 🔧 Actions Immédiates Recommandées

### 1. Configuration des Variables d'Environnement

**Fichier `.dev.vars` (développement) :**
```bash
PABBLY_WEBHOOK_URL=https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY0MDYzMDA0M2Q1MjY5NTUzYzUxM2Ei_pc
```

**Production (Cloudflare Secret) :**
```bash
npx wrangler secret put PABBLY_WEBHOOK_URL
# Entrer l'URL quand demandé
```

**Mise à jour du code :**
```typescript
// webhooks.ts
const WEBHOOK_URL = c.env.PABBLY_WEBHOOK_URL;
if (!WEBHOOK_URL) {
  throw new Error('PABBLY_WEBHOOK_URL non configuré');
}
```

**Mise à jour types.ts :**
```typescript
export interface Bindings {
  DB: D1Database;
  PABBLY_WEBHOOK_URL: string; // Ajouter
  // ... autres bindings
}
```

### 2. Ajouter Timeout et Retry

Créer `/src/utils/webhook.ts` :
```typescript
export async function sendWebhookWithRetry(
  url: string,
  data: any,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(10000) // 10s
      });

      // Succès
      if (response.ok) {
        return response;
      }

      // Retry sur erreurs serveur
      if (response.status >= 500 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Échec définitif
      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries reached');
}
```

Utiliser dans webhooks.ts :
```typescript
import { sendWebhookWithRetry } from '../utils/webhook';

// Remplacer ligne 107-113
const webhookResponse = await sendWebhookWithRetry(WEBHOOK_URL, webhookData);
```

---

## 📊 Matrice de Risques

| Problème | Sévérité | Probabilité | Risque Global | Priorité |
|----------|----------|-------------|---------------|----------|
| URL en dur | Haute | Haute | 🔴 CRITIQUE | Urgente |
| Pas de retry | Haute | Moyenne | 🟠 ÉLEVÉ | Haute |
| Pas de timeout | Moyenne | Haute | 🟠 ÉLEVÉ | Haute |
| Interval frontend | Moyenne | Faible | 🟡 MOYEN | Moyenne |
| Pas de monitoring | Moyenne | Moyenne | 🟡 MOYEN | Moyenne |
| Caractères spéciaux | Faible | Moyenne | 🟡 MOYEN | Moyenne |
| Pas de rate limit | Faible | Faible | 🟢 FAIBLE | Basse |
| Calcul retard | Faible | Faible | 🟢 FAIBLE | Basse |

---

## ✅ Checklist de Mise en Conformité

### Immédiat (Cette Semaine)
- [ ] Externaliser URL webhook vers variables d'environnement
- [ ] Ajouter timeout de 10s sur fetch
- [ ] Ajouter types.ts binding pour PABBLY_WEBHOOK_URL

### Court Terme (2 Semaines)
- [ ] Implémenter retry avec backoff exponentiel
- [ ] Créer endpoint /webhooks/health pour monitoring
- [ ] Migrer vers Cloudflare Cron Jobs

### Moyen Terme (1 Mois)
- [ ] Ajouter sanitization des données
- [ ] Implémenter rate limiting
- [ ] Créer dashboard de monitoring

### Long Terme (Optionnel)
- [ ] Tests unitaires complets
- [ ] Tests d'intégration avec Pabbly mock
- [ ] Documentation Swagger/OpenAPI

---

## 🎯 Conclusion

Le système actuel est **fonctionnel** et répond aux besoins de base, mais présente des **vulnérabilités de sécurité et de fiabilité** qui doivent être corrigées rapidement.

**Score par catégorie :**
- ✅ Fonctionnalité : 90/100
- ⚠️ Sécurité : 70/100
- ⚠️ Fiabilité : 75/100
- ✅ Performance : 85/100
- ✅ Maintenabilité : 90/100

**Score Global : 85/100**

**Prochaine étape recommandée :** Implémenter les corrections prioritaires URGENTES et HAUTES dans les 48 heures.
