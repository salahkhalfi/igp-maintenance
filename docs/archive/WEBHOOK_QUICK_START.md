# 🚀 Webhook Notifications - Guide Rapide

## Vue d'Ensemble

**Objectif**: Envoyer emails automatiques via Pabbly Connect quand tickets planifiés sont en retard.

**Architecture**: Module indépendant, non-bloquant, ne casse rien si webhook échoue.

---

## ⚡ Démarrage Rapide

### 1. Configurer Pabbly Connect

```bash
# Créer workflow dans Pabbly:
# 1. Trigger: Webhook
# 2. Action: Email by Pabbly
# 3. Copier URL webhook générée
```

### 2. Ajouter Secret Cloudflare

```bash
# Production
npx wrangler pages secret put WEBHOOK_URL --project-name webapp
# Coller: https://connect.pabbly.com/workflow/sendwebhookdata/IjU3Nj...

# Mode test (optionnel)
npx wrangler pages secret put NOTIFICATION_TEST_MODE --project-name webapp
# Entrer: true  (pas d'envoi réel)
```

### 3. Créer Migration BD

```bash
# Créer fichier: migrations/0009_add_notification_logs.sql
# Contenu: voir WEBHOOK_NOTIFICATION_ANALYSIS.md section "Migration BD"

# Appliquer
npm run db:migrate:local   # Test local
npm run db:migrate:prod    # Production
```

### 4. Créer Fichiers Services

```
src/
├── services/
│   ├── notification-service.ts       ← Service principal
│   ├── webhook-client.ts             ← HTTP client
│   └── notification-templates.ts     ← Templates (optionnel)
├── types/
│   └── notifications.ts              ← Types TypeScript
└── utils/
    └── notification-logger.ts        ← Logger BD
```

Copier le code depuis `WEBHOOK_NOTIFICATION_ANALYSIS.md` sections correspondantes.

### 5. Intégrer dans `/api/alerts/check-overdue`

**Ajouter ces lignes** après l'envoi des messages en BD (ligne ~1012):

```typescript
// Import en haut du fichier
import { NotificationService } from './services/notification-service';

// Dans le endpoint, après la boucle des admins
const notificationService = new NotificationService(
  c.env.DB,
  c.env.WEBHOOK_URL,
  c.env.NOTIFICATION_TEST_MODE === 'true'
);

for (const ticket of overdueTickets) {
  const recipients = await notificationService.getRecipientsByRoles(['admin', 'supervisor']);
  
  if (ticket.assigned_to && ticket.assigned_to !== 0) {
    const assignee = await notificationService.getRecipientById(ticket.assigned_to);
    if (assignee) recipients.push(assignee);
  }

  // Fire-and-forget (non-bloquant)
  notificationService.trigger({
    event: 'ticket.overdue',
    priority: ticket.priority === 'critical' ? 'critical' : 'high',
    timestamp: new Date().toISOString(),
    data: { ticket: { /* ... */ }, recipients }
  });
}
```

### 6. Mettre à Jour Types

**`src/types/index.ts`**:
```typescript
export interface Bindings {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  JWT_SECRET?: string;
  WEBHOOK_URL?: string;              // ← AJOUTER
  NOTIFICATION_TEST_MODE?: string;   // ← AJOUTER
}
```

### 7. Build & Deploy

```bash
npm run build
npx wrangler pages deploy dist --project-name webapp
```

---

## 🧪 Tester

### Test Local (Mode Test)

```bash
# .dev.vars
NOTIFICATION_TEST_MODE=true
WEBHOOK_URL=https://webhook.site/unique-id  # Pour voir payload

# Lancer
npm run dev:sandbox

# Déclencher manuellement
curl -X POST http://localhost:3000/api/alerts/check-overdue \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Vérifier Logs BD

```sql
-- Dernières notifications
SELECT * FROM notification_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Taux de succès
SELECT 
  COUNT(*) as total,
  SUM(success) as successful,
  ROUND(100.0 * SUM(success) / COUNT(*), 2) as success_rate
FROM notification_logs
WHERE sent_at > datetime('now', '-24 hours');
```

### Test Production

```bash
# 1. Mode test d'abord
npx wrangler pages secret put NOTIFICATION_TEST_MODE --project-name webapp
# true

# 2. Deploy et déclencher
curl -X POST https://app.igpglass.ca/api/alerts/check-overdue \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 3. Vérifier logs (pas d'email envoyé)
# 4. Si OK, désactiver mode test
npx wrangler pages secret put NOTIFICATION_TEST_MODE --project-name webapp
# false
```

---

## 📊 Payload Webhook

**Format JSON envoyé à Pabbly**:

```json
{
  "event": "ticket.overdue",
  "priority": "high",
  "timestamp": "2025-11-10T15:30:00Z",
  "data": {
    "ticket": {
      "id": 42,
      "ticket_id": "FOU-VIT-2024-001",
      "title": "Problème four",
      "status": "received",
      "priority": "high",
      "scheduled_date": "2025-11-10T08:00:00Z"
    },
    "recipients": [
      {
        "email": "admin@igpglass.ca",
        "full_name": "Jean Admin",
        "role": "admin"
      }
    ]
  }
}
```

**Mapping Pabbly**:
- **To**: `{{data.recipients[*].email}}`
- **Subject**: `[IGP] Alerte: {{data.ticket.ticket_id}} en retard`
- **Body**: Template HTML avec `{{data.ticket.title}}`, etc.

---

## ⚠️ Points d'Attention

### ✅ Ce qui est SÛR

- Webhook fail → App continue normalement
- Pas de secret en code (Cloudflare Secrets)
- Logs tous les envois en BD
- Mode test avant production
- Non-bloquant (async)

### ⚠️ Ce qui DOIT être fait

1. **Tester mode test local** avant prod
2. **Vérifier emails pas en spam** (SPF/DKIM Pabbly)
3. **Monitoring logs** première semaine
4. **Rate limiting** si besoin (éviter spam)

### ❌ Ce qu'il NE FAUT PAS faire

- ❌ Mettre WEBHOOK_URL dans code (use secret)
- ❌ Faire `await` sur trigger() (bloquant)
- ❌ Throw error si webhook échoue
- ❌ Inclure données sensibles dans payload

---

## 🔧 Troubleshooting Rapide

| Problème | Solution |
|----------|----------|
| Pas d'email reçu | 1. Check `notification_logs` (success=0?)<br>2. Vérifier `WEBHOOK_URL` configuré<br>3. Mode test désactivé? |
| Email en spam | Configurer SPF/DKIM dans Pabbly |
| Webhook timeout | Augmenter `timeoutMs` dans config |
| Trop de notifications | Activer batching ou digest quotidien |

**Debug SQL**:
```sql
-- Derniers échecs
SELECT * FROM notification_logs 
WHERE success = 0 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 📈 Prochaines Étapes

### Phase 1 (Semaine 1)
- ✅ Setup Pabbly workflow
- ✅ Migration BD
- ✅ Code services
- ✅ Intégration `/api/alerts/check-overdue`
- ✅ Tests mode test

### Phase 2 (Semaine 2)
- ✅ Deploy production
- ✅ Monitoring 48h
- ✅ Ajustements si nécessaire

### Phase 3 (Futur)
- 🔄 Ajouter événement `ticket.critical`
- 🔄 Ajouter événement `ticket.completed`
- 🔄 Dashboard admin stats
- 🔄 Préférences utilisateur

---

## 📞 Support

**Documentation complète**: Voir `WEBHOOK_NOTIFICATION_ANALYSIS.md`

**Pabbly Support**: https://www.pabbly.com/support/

**Cloudflare Docs**: https://developers.cloudflare.com/workers/

---

## ✅ Checklist Déploiement

```
Installation:
[ ] Workflow Pabbly créé
[ ] URL webhook obtenue
[ ] Secret WEBHOOK_URL ajouté Cloudflare
[ ] Migration 0009 appliquée (local + prod)
[ ] Fichiers services créés
[ ] Types Bindings mis à jour

Tests:
[ ] Mode test local fonctionne
[ ] Logs BD créés correctement
[ ] Payload reçu par Pabbly
[ ] Template email OK (pas spam)
[ ] Performance endpoint < 2s

Production:
[ ] NOTIFICATION_TEST_MODE=false
[ ] Premier envoi manuel validé
[ ] Monitoring actif 48h
[ ] Aucune régression app existante
```

---

**Temps estimé total**: 4-6 heures (setup + tests)

**Risque**: ⭐ Très faible (module isolé, fail-safe)

**Prêt à démarrer!** 🚀
