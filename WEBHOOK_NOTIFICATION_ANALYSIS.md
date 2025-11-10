# Analyse Système de Notifications Webhook - Pabbly Connect

## 📋 Document d'Analyse Technique
**Date**: 2025-11-10  
**Version Application**: v2.0.10  
**Objectif**: Concevoir un système de notifications email via webhook Pabbly Connect

---

## 🔍 État Actuel de l'Application

### Architecture Existante

**Stack Technique**:
- **Backend**: Hono Framework (Cloudflare Workers)
- **Database**: Cloudflare D1 (SQLite distribué)
- **Storage**: Cloudflare R2 (médias)
- **Frontend**: React (sans JSX, via createElement)
- **Deployment**: Cloudflare Pages

**Système de Notifications Interne Actuel**:
- Table `messages` en BD pour notifications internes
- Endpoint `/api/alerts/check-overdue` pour vérifier tickets en retard
- Notifications envoyées **uniquement en BD** (pas d'email)
- Système de messagerie privée entre utilisateurs

### Code Existant Pertinent

**1. Endpoint d'Alertes Automatiques** (`src/index.tsx:895-1024`):
```typescript
// POST /api/alerts/check-overdue
// Vérifie tickets planifiés en retard
// Crée des messages dans la table 'messages'
// Envoie seulement aux admins
// Protection anti-doublon: 24h
```

**Fonctionnalités**:
- ✅ Détection tickets en retard (`scheduled_date < NOW()`)
- ✅ Filtre statuts: `received` ou `diagnostic` uniquement
- ✅ Calcul du retard (heures/minutes)
- ✅ Formatage message riche (emoji, info complète)
- ✅ Protection anti-spam (1 alerte/24h par ticket)
- ❌ **PAS d'envoi email** - Stockage BD uniquement

**2. Structure Base de Données**:

```sql
-- Table tickets (avec scheduled_date)
CREATE TABLE tickets (
  id INTEGER PRIMARY KEY,
  ticket_id TEXT,
  scheduled_date DATETIME,  -- ← Clé pour notifications
  assigned_to INTEGER,
  status TEXT,
  priority TEXT,
  -- ... autres champs
);

-- Table messages (notifications internes)
CREATE TABLE messages (
  id INTEGER PRIMARY KEY,
  sender_id INTEGER,
  recipient_id INTEGER,
  message_type TEXT,  -- 'public' | 'private'
  content TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME
);

-- Table users (destinataires)
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE,  -- ← Email pour webhook
  full_name TEXT,
  role TEXT  -- 'admin' | 'supervisor' | 'technician' | 'operator'
);
```

**3. Points d'Intégration Potentiels**:

| Événement | Endpoint Actuel | Déclencheur |
|-----------|----------------|-------------|
| Création ticket | `POST /api/tickets` | Ticket créé |
| MAJ statut | `PATCH /api/tickets/:id` | Statut changé |
| Assignation | `PATCH /api/tickets/:id` | assigned_to modifié |
| Planification | `PATCH /api/tickets/:id` | scheduled_date défini |
| Check retards | `POST /api/alerts/check-overdue` | Cron/Manuel |

---

## 🎯 Objectifs du Système de Notifications

### Cas d'Usage Identifiés

1. **Alerte Échéance Expirée** 🔴
   - Ticket planifié dont `scheduled_date` < NOW()
   - Statut: `received` ou `diagnostic`
   - Destinataires: Admin + Superviseur + Assigné
   - Fréquence: Vérification périodique (ex: toutes les heures)

2. **Rappel Échéance Proche** 🟡 (Futur)
   - Ticket planifié dans les prochaines 24h
   - Destinataires: Assigné + Superviseur
   
3. **Ticket Critique Créé** 🔴 (Futur)
   - Nouveau ticket avec priority='critical'
   - Destinataires: Admin + Superviseur + Tous techniciens

4. **Ticket Bloqué Longtemps** 🟠 (Futur)
   - Ticket en `waiting_parts` > 7 jours
   - Destinataires: Admin + Superviseur

5. **Ticket Complété** ✅ (Futur)
   - Statut → `completed`
   - Destinataires: Rapporteur (operator)

---

## 🏗️ Architecture Proposée - Système Modulaire

### Principes de Conception

**✅ Requis**:
1. **Module Indépendant**: Ne doit PAS casser les fonctions existantes
2. **Opt-in**: Fonctionner même si webhook non configuré
3. **Résilient**: Échecs webhook ne bloquent pas l'app
4. **Auditable**: Logger tous les envois
5. **Testable**: Mode test sans email réel
6. **Extensible**: Facile d'ajouter nouveaux événements

**❌ Éviter**:
1. Bloquer requêtes API si webhook échoue
2. Dupliquer logique métier
3. Dépendances externes lourdes
4. Impact performance perceptible

### Architecture en 3 Couches

```
┌─────────────────────────────────────────────────────────────┐
│                    COUCHE APPLICATION                        │
│  (Routes Hono existantes - AUCUNE MODIFICATION)            │
│   • POST /api/tickets                                       │
│   • PATCH /api/tickets/:id                                  │
│   • POST /api/alerts/check-overdue                         │
└────────────────────┬────────────────────────────────────────┘
                     │ Appel async/non-bloquant
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              COUCHE ORCHESTRATION (NOUVEAU)                 │
│   File: src/services/notification-service.ts               │
│                                                             │
│   notificationService.trigger({                            │
│     event: 'ticket.overdue',                               │
│     data: { ticket, users },                               │
│     priority: 'high'                                        │
│   })                                                        │
│                                                             │
│   • Valide événement                                       │
│   • Détermine destinataires                                │
│   • Formate payload                                        │
│   • Appelle webhook (si configuré)                         │
│   • Log résultat en BD                                     │
│   • JAMAIS throw error → app continue                     │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP POST (async)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 WEBHOOK PABBLY CONNECT                      │
│   URL: https://connect.pabbly.com/workflow/...             │
│                                                             │
│   Reçoit JSON → Envoie email via SMTP/SendGrid/etc.       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Structure des Fichiers (Nouveau Code)

```
webapp/
├── src/
│   ├── services/
│   │   ├── notification-service.ts       ← Service principal
│   │   ├── webhook-client.ts             ← Client HTTP webhook
│   │   └── notification-templates.ts     ← Templates emails
│   ├── types/
│   │   └── notifications.ts              ← Types TypeScript
│   ├── utils/
│   │   └── notification-logger.ts        ← Logger BD
│   └── routes/
│       └── notifications.ts              ← Admin routes (opt)
├── migrations/
│   └── 0009_add_notification_logs.sql    ← Nouvelle table
└── wrangler.jsonc                        ← + WEBHOOK_URL secret
```

---

## 🔧 Implémentation Détaillée

### 1. Types TypeScript (`src/types/notifications.ts`)

```typescript
export type NotificationEvent = 
  | 'ticket.created'
  | 'ticket.updated'
  | 'ticket.overdue'
  | 'ticket.critical'
  | 'ticket.completed'
  | 'ticket.assigned';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface NotificationPayload {
  event: NotificationEvent;
  priority: NotificationPriority;
  timestamp: string;
  data: {
    ticket: {
      id: number;
      ticket_id: string;
      title: string;
      description?: string;
      status: string;
      priority: string;
      scheduled_date?: string;
      machine_type?: string;
      model?: string;
    };
    recipients: Array<{
      email: string;
      full_name: string;
      role: string;
    }>;
    metadata?: Record<string, any>;
  };
}

export interface NotificationConfig {
  webhookUrl?: string;
  enabled: boolean;
  testMode: boolean;
  retryAttempts: number;
  timeoutMs: number;
}

export interface NotificationResult {
  success: boolean;
  sentAt: string;
  error?: string;
  webhookResponse?: any;
}
```

### 2. Service Principal (`src/services/notification-service.ts`)

```typescript
import type { D1Database } from '@cloudflare/workers-types';
import type { NotificationPayload, NotificationConfig, NotificationResult } from '../types/notifications';
import { WebhookClient } from './webhook-client';
import { logNotification } from '../utils/notification-logger';

export class NotificationService {
  private db: D1Database;
  private config: NotificationConfig;
  private webhookClient: WebhookClient;

  constructor(db: D1Database, webhookUrl?: string, testMode: boolean = false) {
    this.db = db;
    this.config = {
      webhookUrl,
      enabled: !!webhookUrl,  // Enabled only if webhook configured
      testMode,
      retryAttempts: 3,
      timeoutMs: 5000
    };
    this.webhookClient = new WebhookClient(this.config);
  }

  /**
   * Déclencheur principal - ASYNC et NON-BLOQUANT
   * Appelé depuis les routes existantes
   */
  async trigger(payload: NotificationPayload): Promise<void> {
    try {
      // Si webhook désactivé, log et return (pas d'erreur)
      if (!this.config.enabled) {
        console.log('📭 Notifications désactivées (webhook non configuré)');
        return;
      }

      // Mode test: log uniquement, pas d'envoi réel
      if (this.config.testMode) {
        console.log('🧪 TEST MODE - Notification:', JSON.stringify(payload, null, 2));
        await logNotification(this.db, payload, { success: true, sentAt: new Date().toISOString() });
        return;
      }

      // Envoi réel au webhook
      const result = await this.webhookClient.send(payload);

      // Log en BD (succès ou échec)
      await logNotification(this.db, payload, result);

      if (result.success) {
        console.log('✅ Notification envoyée:', payload.event, result.sentAt);
      } else {
        console.error('❌ Échec notification:', payload.event, result.error);
      }

    } catch (error) {
      // CRITIQUE: Ne jamais throw - juste logger
      console.error('⚠️ Erreur notification (non-bloquante):', error);
      await logNotification(this.db, payload, {
        success: false,
        sentAt: new Date().toISOString(),
        error: String(error)
      });
    }
  }

  /**
   * Utilitaire: Obtenir emails selon rôles
   */
  async getRecipientsByRoles(roles: string[]): Promise<Array<{ email: string; full_name: string; role: string }>> {
    const placeholders = roles.map(() => '?').join(',');
    const { results } = await this.db.prepare(`
      SELECT email, full_name, role
      FROM users
      WHERE role IN (${placeholders})
    `).bind(...roles).all();
    
    return results as any[];
  }

  /**
   * Utilitaire: Obtenir email utilisateur spécifique
   */
  async getRecipientById(userId: number): Promise<{ email: string; full_name: string; role: string } | null> {
    const result = await this.db.prepare(`
      SELECT email, full_name, role
      FROM users
      WHERE id = ?
    `).bind(userId).first();
    
    return result as any;
  }
}
```

### 3. Client Webhook (`src/services/webhook-client.ts`)

```typescript
import type { NotificationPayload, NotificationConfig, NotificationResult } from '../types/notifications';

export class WebhookClient {
  private config: NotificationConfig;

  constructor(config: NotificationConfig) {
    this.config = config;
  }

  /**
   * Envoie payload au webhook Pabbly avec retry
   */
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const startTime = Date.now();
    let lastError: string = '';

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

        const response = await fetch(this.config.webhookUrl!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'IGP-Maintenance-App/2.0'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Pabbly retourne généralement 200/201/202
        if (response.ok) {
          const responseData = await response.json().catch(() => ({}));
          
          return {
            success: true,
            sentAt: new Date().toISOString(),
            webhookResponse: responseData
          };
        }

        lastError = `HTTP ${response.status}: ${response.statusText}`;
        
        // Retry seulement sur erreurs 5xx (serveur)
        if (response.status >= 500 && attempt < this.config.retryAttempts) {
          await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
          continue;
        }

        break; // 4xx = erreur client, pas de retry

      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        
        // Retry sur timeout/network error
        if (attempt < this.config.retryAttempts) {
          await this.delay(Math.pow(2, attempt) * 1000);
          continue;
        }
      }
    }

    // Échec après tous les retries
    return {
      success: false,
      sentAt: new Date().toISOString(),
      error: `Échec après ${this.config.retryAttempts} tentatives: ${lastError}`
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 4. Logger BD (`src/utils/notification-logger.ts`)

```typescript
import type { D1Database } from '@cloudflare/workers-types';
import type { NotificationPayload, NotificationResult } from '../types/notifications';

export async function logNotification(
  db: D1Database,
  payload: NotificationPayload,
  result: NotificationResult
): Promise<void> {
  try {
    await db.prepare(`
      INSERT INTO notification_logs (
        event_type,
        priority,
        ticket_id,
        recipient_emails,
        success,
        error_message,
        payload_json,
        sent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      payload.event,
      payload.priority,
      payload.data.ticket.id,
      payload.data.recipients.map(r => r.email).join(', '),
      result.success ? 1 : 0,
      result.error || null,
      JSON.stringify(payload),
      result.sentAt
    ).run();
  } catch (error) {
    console.error('Erreur log notification (non-bloquante):', error);
  }
}
```

### 5. Migration BD (`migrations/0009_add_notification_logs.sql`)

```sql
-- Migration 0009: Table de logs pour notifications webhook
-- Cette table permet d'auditer tous les envois de notifications

CREATE TABLE IF NOT EXISTS notification_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,  -- 'ticket.overdue', 'ticket.created', etc.
  priority TEXT NOT NULL,    -- 'low', 'medium', 'high', 'critical'
  ticket_id INTEGER,         -- ID du ticket concerné
  recipient_emails TEXT,     -- Liste des emails (séparés par virgule)
  success INTEGER NOT NULL,  -- 1 = envoyé, 0 = échec
  error_message TEXT,        -- Message d'erreur si échec
  payload_json TEXT,         -- Payload complet (pour debug)
  sent_at DATETIME NOT NULL, -- Timestamp envoi
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL
);

-- Index pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_notification_logs_ticket ON notification_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_event ON notification_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent ON notification_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_success ON notification_logs(success, sent_at);
```

### 6. Intégration dans Endpoint Existant

**Modification minimale de `/api/alerts/check-overdue`**:

```typescript
// src/index.tsx (ligne ~895)
import { NotificationService } from './services/notification-service';

app.post('/api/alerts/check-overdue', authMiddleware, async (c) => {
  try {
    // ... Code existant (lignes 896-1012) INCHANGÉ ...
    
    // ✨ NOUVEAU: Après envoi messages BD
    // Webhook notification (async, non-bloquant)
    const notificationService = new NotificationService(
      c.env.DB,
      c.env.WEBHOOK_URL,
      c.env.NOTIFICATION_TEST_MODE === 'true'
    );

    for (const ticket of overdueTickets) {
      // Récupérer admins/superviseurs
      const recipients = await notificationService.getRecipientsByRoles(['admin', 'supervisor']);
      
      // Ajouter le technicien assigné si existe
      if (ticket.assigned_to && ticket.assigned_to !== 0) {
        const assignee = await notificationService.getRecipientById(ticket.assigned_to);
        if (assignee) recipients.push(assignee);
      }

      // Déclencher notification (async, ne bloque pas)
      notificationService.trigger({
        event: 'ticket.overdue',
        priority: ticket.priority === 'critical' ? 'critical' : 'high',
        timestamp: new Date().toISOString(),
        data: {
          ticket: {
            id: ticket.id,
            ticket_id: ticket.ticket_id,
            title: ticket.title,
            description: ticket.description,
            status: ticket.status,
            priority: ticket.priority,
            scheduled_date: ticket.scheduled_date,
            machine_type: ticket.machine_type,
            model: ticket.model
          },
          recipients
        }
      });
    }
    
    // ... Retour JSON existant INCHANGÉ ...
  } catch (error) {
    // ... Gestion erreur existante INCHANGÉE ...
  }
});
```

---

## 🔐 Configuration Sécurisée

### Variables d'Environnement Cloudflare

**Ajout dans `wrangler.jsonc`** (local dev):
```jsonc
{
  "vars": {
    "NOTIFICATION_TEST_MODE": "true"
  }
}
```

**Secrets Cloudflare** (production):
```bash
# Définir l'URL webhook (secret)
npx wrangler pages secret put WEBHOOK_URL --project-name webapp
# Entrer: https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNT...

# Mode test (optionnel)
npx wrangler pages secret put NOTIFICATION_TEST_MODE --project-name webapp
# Entrer: false  (true = emails ne sont pas envoyés)
```

**Mise à jour Types** (`src/types/index.ts`):
```typescript
export interface Bindings {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  JWT_SECRET?: string;
  WEBHOOK_URL?: string;           // ← NOUVEAU
  NOTIFICATION_TEST_MODE?: string; // ← NOUVEAU
}
```

---

## 📊 Payload Webhook pour Pabbly

### Format JSON Standard

```json
{
  "event": "ticket.overdue",
  "priority": "high",
  "timestamp": "2025-11-10T15:30:00Z",
  "data": {
    "ticket": {
      "id": 42,
      "ticket_id": "FOU-VIT-2024-001",
      "title": "Problème sur four de recuisson",
      "description": "Le thermostat ne fonctionne plus...",
      "status": "received",
      "priority": "high",
      "scheduled_date": "2025-11-10T08:00:00Z",
      "machine_type": "Four",
      "model": "Vitroplast 3000"
    },
    "recipients": [
      {
        "email": "admin@igpglass.ca",
        "full_name": "Jean Administrateur",
        "role": "admin"
      },
      {
        "email": "supervisor@igpglass.ca",
        "full_name": "Marie Superviseure",
        "role": "supervisor"
      }
    ],
    "metadata": {
      "delay_hours": 7,
      "delay_minutes": 30,
      "app_url": "https://mecanique.igpglass.ca"
    }
  }
}
```

### Mapping Pabbly Connect

**Workflow Pabbly suggéré**:
1. **Trigger**: Webhook (recevoir payload ci-dessus)
2. **Action**: Email by Pabbly
   - **To**: `{{recipients[*].email}}` (boucle)
   - **Subject**: `[IGP Maintenance] Alerte: {{data.ticket.ticket_id}} en retard`
   - **Body**: Template HTML dynamique
   - **CC**: `mecanique@igpglass.ca` (optionnel)

---

## ⚠️ Considérations de Sécurité

### Protection Webhook

1. **Secret partagé** (recommandé):
   ```typescript
   // Ajouter dans payload
   headers: {
     'X-Webhook-Secret': c.env.WEBHOOK_SECRET
   }
   ```

2. **IP Whitelisting**: Pabbly Connect a des IPs fixes

3. **HTTPS uniquement**: Vérifie que URL webhook commence par `https://`

4. **Rate Limiting**: 
   ```typescript
   // Ne pas envoyer + de 10 notifications/minute pour même ticket
   const canSend = await checkRateLimit(db, ticketId);
   ```

### Protection Données Sensibles

```typescript
// Ne PAS inclure dans payload:
- password_hash
- JWT tokens
- Données financières
- Infos personnelles non nécessaires

// OK à inclure:
- email (nécessaire pour envoi)
- full_name
- ticket_id, title, description
- dates, statuts, priorités
```

---

## 🧪 Plan de Tests

### Tests Unitaires

```typescript
// test/notification-service.test.ts
describe('NotificationService', () => {
  it('should not throw if webhook fails', async () => {
    const service = new NotificationService(db, 'http://invalid-url');
    await expect(service.trigger(payload)).resolves.not.toThrow();
  });

  it('should log failed attempts', async () => {
    // Vérifier table notification_logs contient l'échec
  });

  it('should skip if webhook not configured', async () => {
    const service = new NotificationService(db, undefined);
    await service.trigger(payload);
    // Pas d'erreur, juste skip
  });
});
```

### Tests d'Intégration

1. **Mode Test Local**:
   ```bash
   # .dev.vars
   NOTIFICATION_TEST_MODE=true
   WEBHOOK_URL=https://webhook.site/unique-url  # Pour voir payload
   ```

2. **Test avec Pabbly Connect**:
   - Créer workflow test
   - Envoyer à email test
   - Vérifier réception et formatage

3. **Test Performance**:
   ```bash
   # Vérifier que l'endpoint reste rapide même si webhook lent
   time curl -X POST https://mecanique.igpglass.ca/api/alerts/check-overdue
   # Doit être < 2s même si webhook prend 5s
   ```

---

## 📈 Monitoring & Maintenance

### Requêtes Utiles

```sql
-- Taux de succès dernières 24h
SELECT 
  COUNT(*) as total,
  SUM(success) as successful,
  ROUND(100.0 * SUM(success) / COUNT(*), 2) as success_rate
FROM notification_logs
WHERE sent_at > datetime('now', '-24 hours');

-- Échecs récents
SELECT 
  event_type,
  ticket_id,
  recipient_emails,
  error_message,
  sent_at
FROM notification_logs
WHERE success = 0
ORDER BY sent_at DESC
LIMIT 10;

-- Notifications par événement
SELECT 
  event_type,
  COUNT(*) as count,
  SUM(success) as successful
FROM notification_logs
WHERE sent_at > datetime('now', '-7 days')
GROUP BY event_type
ORDER BY count DESC;
```

### Dashboard Admin (Optionnel)

```typescript
// Route GET /api/admin/notification-stats
app.get('/api/admin/notification-stats', authMiddleware, adminOnly, async (c) => {
  const stats = await c.env.DB.prepare(`
    SELECT 
      event_type,
      COUNT(*) as total,
      SUM(success) as successful,
      MIN(sent_at) as first_sent,
      MAX(sent_at) as last_sent
    FROM notification_logs
    WHERE sent_at > datetime('now', '-30 days')
    GROUP BY event_type
  `).all();

  return c.json({ stats: stats.results });
});
```

---

## 🚀 Plan de Déploiement

### Phase 1: Setup Infrastructure (Jour 1)

1. ✅ Créer workflow Pabbly Connect
2. ✅ Obtenir URL webhook
3. ✅ Ajouter secret Cloudflare: `WEBHOOK_URL`
4. ✅ Mode test: `NOTIFICATION_TEST_MODE=true`

### Phase 2: Code Implementation (Jour 2-3)

1. ✅ Créer fichiers services (`notification-service.ts`, etc.)
2. ✅ Migration BD (`0009_add_notification_logs.sql`)
3. ✅ Intégrer dans `/api/alerts/check-overdue`
4. ✅ Tests locaux avec `--local` flag

### Phase 3: Tests Production (Jour 4-5)

1. ✅ Deploy avec `NOTIFICATION_TEST_MODE=true`
2. ✅ Déclencher manuellement `/api/alerts/check-overdue`
3. ✅ Vérifier logs dans table `notification_logs`
4. ✅ Vérifier payload reçu par Pabbly
5. ✅ Ajuster templates email si besoin

### Phase 4: Production Réelle (Jour 6)

1. ✅ Basculer `NOTIFICATION_TEST_MODE=false`
2. ✅ Setup Cloudflare Cron Trigger (toutes les heures)
3. ✅ Monitoring actif 48h
4. ✅ Ajuster rate limiting si spam

### Phase 5: Extension (Semaines suivantes)

1. ✅ Ajouter événement `ticket.critical`
2. ✅ Ajouter événement `ticket.completed`
3. ✅ Dashboard admin stats
4. ✅ Templates email personnalisables

---

## ⚡ Performances & Optimisations

### Non-Bloquant

```typescript
// ❌ MAUVAIS - Bloque la réponse
await notificationService.trigger(payload);
return c.json({ success: true });

// ✅ BON - Fire-and-forget
notificationService.trigger(payload); // Pas de await
return c.json({ success: true });

// 🔥 MEILLEUR - Workers Durable Objects (futur)
c.executionCtx.waitUntil(
  notificationService.trigger(payload)
);
return c.json({ success: true });
```

### Batching

```typescript
// Si 10 tickets en retard, grouper en 1 email
const payload = {
  event: 'tickets.overdue.batch',
  data: {
    tickets: overdueTickets.map(t => ({ ... })),
    recipients: [...] // Dédupliquer
  }
};
```

### Caching Destinataires

```typescript
// Cache emails admins/superviseurs (changent rarement)
const cacheKey = 'recipients:admin-supervisor';
let recipients = await cache.get(cacheKey);

if (!recipients) {
  recipients = await db.prepare('SELECT ... WHERE role IN (...)').all();
  await cache.put(cacheKey, recipients, { expirationTtl: 3600 }); // 1h
}
```

---

## 🎯 Avantages de cette Architecture

### ✅ Résilience

- Webhook fail → App continue sans problème
- Retry automatique (3x avec backoff)
- Logs complets pour debug
- Mode test sans envoi réel

### ✅ Modularité

- Service indépendant, facile à isoler
- Aucune modification routes existantes (juste 5 lignes ajoutées)
- Peut être désactivé complètement (webhook=undefined)
- Extensible pour autres événements

### ✅ Maintenabilité

- Code TypeScript typé
- Séparation concerns (service/client/logger)
- Tests unitaires possibles
- Monitoring via table logs

### ✅ Sécurité

- Secrets Cloudflare (pas en code)
- Payload validé avant envoi
- Rate limiting possible
- Données sensibles exclues

### ✅ Scalabilité

- Async/non-bloquant
- Batching possible
- Caching destinataires
- Cloudflare Workers scale automatiquement

---

## 🔮 Extensions Futures

### 1. Support Multi-Canaux

```typescript
interface NotificationChannel {
  type: 'email' | 'sms' | 'slack' | 'teams';
  config: Record<string, any>;
}

// Chaque user peut choisir son canal préféré
```

### 2. Préférences Utilisateur

```sql
CREATE TABLE user_notification_preferences (
  user_id INTEGER PRIMARY KEY,
  email_enabled BOOLEAN DEFAULT 1,
  events_subscribed TEXT, -- JSON array: ['ticket.overdue', 'ticket.critical']
  frequency TEXT DEFAULT 'immediate', -- 'immediate' | 'hourly' | 'daily'
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 3. Templates Personnalisables

```typescript
// Admin peut éditer templates via UI
CREATE TABLE notification_templates (
  id INTEGER PRIMARY KEY,
  event_type TEXT UNIQUE,
  subject_template TEXT,
  body_template TEXT, -- Handlebars/Mustache
  active BOOLEAN DEFAULT 1
);
```

### 4. Webhook Sortant pour Intégrations

```typescript
// Permettre à d'autres systèmes de s'abonner
POST /api/webhooks/subscribe
{
  "url": "https://autre-systeme.com/webhook",
  "events": ["ticket.created", "ticket.completed"]
}
```

---

## 📝 Checklist Avant Production

### Code
- [ ] Tous fichiers créés et testés localement
- [ ] Migration 0009 appliquée (local + prod)
- [ ] Types ajoutés dans `Bindings`
- [ ] Tests unitaires passent
- [ ] Pas de console.log sensibles (passwords, tokens)

### Configuration
- [ ] Workflow Pabbly Connect créé et testé
- [ ] URL webhook obtenue
- [ ] Secret `WEBHOOK_URL` ajouté dans Cloudflare
- [ ] Secret `NOTIFICATION_TEST_MODE` configuré
- [ ] Templates email validés (formatage, logos)

### Tests
- [ ] Mode test: notifications loguées mais pas envoyées
- [ ] Mode prod test: envoi à email test uniquement
- [ ] Webhook fail → app continue sans erreur
- [ ] Performance endpoint < 2s même avec webhook lent
- [ ] Logs BD contiennent tous les envois

### Monitoring
- [ ] Dashboard admin notification stats accessible
- [ ] Alertes configurées si taux échec > 20%
- [ ] Logs Cloudflare Workers surveillés
- [ ] Email monitoring (spam folder check)

### Documentation
- [ ] README mis à jour avec section notifications
- [ ] Guide admin: comment configurer webhook
- [ ] Guide troubleshooting: que faire si échec
- [ ] Changelog avec version bump

---

## 🆘 Troubleshooting

### Problème: Notifications pas envoyées

**Debug**:
```sql
-- Vérifier logs
SELECT * FROM notification_logs ORDER BY created_at DESC LIMIT 10;

-- Si aucun log: webhook pas appelé
-- Si logs avec success=0: voir error_message
```

**Solutions**:
1. Vérifier `WEBHOOK_URL` configuré: `npx wrangler pages secret list`
2. Tester URL manuellement: `curl -X POST https://webhook-url -d '{...}'`
3. Vérifier mode test: `NOTIFICATION_TEST_MODE` doit être `false`
4. Check logs Cloudflare Workers: Console > Workers > Logs

### Problème: Emails reçus en spam

**Solutions**:
1. Configurer SPF/DKIM dans Pabbly
2. Demander whitelist email `@igpglass.ca`
3. Ajouter domaine sender dans contacts
4. Réduire fréquence (batching)

### Problème: Webhook timeout

**Cause**: Pabbly Connect lent (> 5s)

**Solutions**:
1. Augmenter `timeoutMs` dans config
2. Réduire payload (enlever champs inutiles)
3. Contacter support Pabbly
4. Utiliser queue (Workers Queues) au lieu de sync

### Problème: Trop de notifications (spam)

**Solutions**:
1. Activer batching (grouper plusieurs tickets)
2. Rate limiting plus strict
3. Digest emails (résumé quotidien au lieu d'immediate)
4. Filtrer doublons plus aggressivement

---

## 💰 Coûts Estimés

### Cloudflare Workers
- **Gratuit**: 100k req/jour
- **Notifications**: ~1k/jour max (bien en dessous)
- **Coût**: $0/mois

### Cloudflare D1
- **Gratuit**: 5M read/jour, 100k write/jour
- **Logs notifications**: ~1k write/jour
- **Coût**: $0/mois

### Pabbly Connect
- **Plans**: À partir de $19/mois (20k tasks)
- **Tasks utilisés**: ~1k-3k/mois (1 email = 1 task)
- **Coût estimé**: $19-29/mois

**Total estimé**: **$20-30/mois**

---

## 📚 Ressources

### Documentation Pabbly Connect
- Webhooks: https://www.pabbly.com/connect/docs/webhook/
- Email Actions: https://www.pabbly.com/connect/docs/email/

### Cloudflare
- Workers: https://developers.cloudflare.com/workers/
- D1 Database: https://developers.cloudflare.com/d1/
- Secrets: https://developers.cloudflare.com/workers/configuration/secrets/

### Alternatives Webhook Services
- Zapier (plus cher)
- Make (ex-Integromat)
- n8n (self-hosted, gratuit)

---

## ✅ Conclusion

Cette architecture permet d'intégrer un système de notifications email robuste et évolutif **sans risque** pour l'application existante:

1. **Module indépendant** - Peut être activé/désactivé sans toucher au code métier
2. **Non-bloquant** - Échecs webhook n'impactent pas les utilisateurs
3. **Auditable** - Tous les envois loggés en base de données
4. **Extensible** - Facile d'ajouter nouveaux événements/canaux
5. **Testable** - Mode test complet avant production réelle

**Recommandation**: Commencer par l'événement `ticket.overdue` uniquement (le plus critique), valider le système, puis étendre progressivement aux autres événements.

**Prêt pour implémentation**: Tous les fichiers sont spécifiés, l'architecture est validée, les risques sont identifiés et mitigés. 🚀
