# ⚡ Webhook Notifications - Quick Start

**Pour développeurs pressés qui veulent comprendre en 5 minutes**

---

## 🎯 Qu'est-ce que c'est?

Un système qui envoie automatiquement un email quand un ticket de maintenance planifié est en retard.

---

## 🚀 Comment ça marche?

```
cron-job.org (5 min)
    ↓
POST /api/cron/check-overdue
+ Secret Token
    ↓
Query D1: Tickets expirés
    ↓
Pour chaque ticket:
  - Vérifier limite 24h
  - Envoyer webhook Pabbly
  - Enregistrer notification
  - Wait 200ms (éviter dedup)
    ↓
Pabbly Connect
    ↓
Email envoyé ✅
```

---

## 📋 Conditions de déclenchement

Un webhook est envoyé **SI ET SEULEMENT SI**:

1. ✅ `scheduled_date < NOW()`
2. ✅ `assigned_to IS NOT NULL`
3. ✅ `status = 'received' OR 'diagnostic'`
4. ✅ Aucune notification dans les 24 dernières heures

---

## 🔧 Endpoints Principaux

### 1. Public CRON (Service externe)
```bash
POST /api/cron/check-overdue
Authorization: Bearer cron_secret_igp_2025_webhook_notifications
```

**Réponse**:
```json
{
  "message": "Vérification terminée",
  "total_overdue": 3,
  "notifications_sent": 2,
  "notifications": [...]
}
```

### 2. Authentifié (Tests manuels)
```bash
POST /api/webhooks/check-overdue-tickets
Authorization: Bearer {JWT_TOKEN}
```

### 3. Historique
```bash
GET /api/webhooks/notification-history/:ticketId
Authorization: Bearer {JWT_TOKEN}
```

---

## 💾 Base de Données

**Table**: `webhook_notifications`

```sql
CREATE TABLE webhook_notifications (
  id INTEGER PRIMARY KEY,
  ticket_id INTEGER NOT NULL,
  notification_type VARCHAR(50),
  webhook_url TEXT,
  sent_at DATETIME,
  response_status INTEGER,
  response_body TEXT
);
```

**Migration**: `migrations/0014_add_webhook_notifications.sql`

---

## 🧪 Tester Rapidement

### Test Production
```bash
curl -X POST https://cd79a9f1.webapp-7t8.pages.dev/api/cron/check-overdue \
  -H "Authorization: Bearer cron_secret_igp_2025_webhook_notifications"
```

### Voir notifications récentes
```bash
npx wrangler d1 execute maintenance-db --remote \
  --command="SELECT * FROM webhook_notifications ORDER BY sent_at DESC LIMIT 5"
```

### Voir tickets expirés actuels
```bash
npx wrangler d1 execute maintenance-db --remote \
  --command="SELECT ticket_id, title, scheduled_date, status FROM tickets WHERE assigned_to IS NOT NULL AND scheduled_date < datetime('now') AND status IN ('received', 'diagnostic')"
```

---

## 🔐 Configuration

### Service CRON Externe
- **Plateforme**: cron-job.org
- **URL**: https://cd79a9f1.webapp-7t8.pages.dev/api/cron/check-overdue
- **Fréquence**: */5 * * * * (toutes les 5 minutes)
- **Header**: `Authorization: Bearer cron_secret_igp_2025_webhook_notifications`

### Pabbly Connect
- **Webhook URL**: `https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY0MDYzMDA0M2Q1MjY5NTUzYzUxM2Ei_pc`
- **Action**: Envoi email à admin@igpglass.ca

---

## 📊 Payload Webhook

```json
{
  "ticket_id": "IGP-POLISSEUSE-DOUBLE EDGER-20251109-768",
  "title": "Ajouter de la graisse aux engrenages",
  "description": "...",
  "priority": "high",
  "status": "diagnostic",
  "machine": "POLISSEUSE - DOUBLE EDGER",
  "scheduled_date": "2025-11-10 00:00:00",
  "assigned_to": "Salah Khalfi",
  "reporter": "Salah Khalfi",
  "overdue_text": "2 jour(s) 9h 26min",
  "notification_sent_at": "2025-11-12T09:26:14.510Z"
}
```

---

## 🛠️ Fichiers Modifiés

### Code Source
- **src/index.tsx** (ligne 350-544): Public CRON endpoint
- **src/routes/webhooks.ts** (200+ lignes): Routes authentifiées

### Base de Données
- **migrations/0014_add_webhook_notifications.sql**: Nouvelle table

### Configuration
- **wrangler.jsonc**: Retiré `triggers.crons` (Pages incompatible)

---

## 🐛 Debugging Rapide

### Logs Cloudflare
```
Dashboard > Workers & Pages > webapp > Logs
Chercher: "🔔 CRON démarré"
```

### Pabbly Task History
```
https://www.pabbly.com/connect/task-history
Workflow: Ticket Expiré IGP
```

### Dernières notifications
```bash
npx wrangler d1 execute maintenance-db --remote \
  --command="SELECT t.ticket_id, wn.sent_at, wn.response_status FROM webhook_notifications wn INNER JOIN tickets t ON wn.ticket_id = t.id ORDER BY wn.sent_at DESC LIMIT 10"
```

---

## 🔄 Problèmes Courants

### Pas d'email reçu?
1. ✅ Vérifier logs Cloudflare (erreur API?)
2. ✅ Vérifier Pabbly Task History (webhook reçu?)
3. ✅ Vérifier conditions ticket (date expirée? assigné? status correct?)
4. ✅ Vérifier limite 24h (notification déjà envoyée?)

### Doublons emails?
- ✅ Vérifier delay 200ms entre webhooks
- ✅ Vérifier timestamps différents dans BD

### Erreur 401 Unauthorized?
- ✅ Vérifier token secret exact (copier/coller)
- ✅ Vérifier header `Authorization: Bearer ...`

---

## 📚 Documentation Complète

Pour plus de détails, voir:

- **Architecture complète**: WEBHOOK_NOTIFICATIONS.md
- **Tests détaillés**: WEBHOOK_TEST_GUIDE.md
- **Déploiement**: DEPLOYMENT_PRODUCTION.md
- **Session complète**: CONVERSATION_SUMMARY_2025-11-12.md
- **Rapport exécutif**: SESSION_RAPPORT_2025-11-12.md
- **Navigation docs**: DOCS_SESSION_README.md

---

## ✅ Checklist Validation

- [ ] Migration appliquée en production
- [ ] CRON externe configuré (cron-job.org)
- [ ] Test endpoint public (curl) → 200 OK
- [ ] Email reçu dans Pabbly Connect
- [ ] Vérifier logs Cloudflare (aucune erreur)
- [ ] Vérifier table webhook_notifications (COUNT > 0)
- [ ] Test limite 24h (2e appel = 0 notification)

---

## 🎯 En Résumé

**3 choses à retenir**:

1. **Automatique 24/7**: Service externe appelle endpoint toutes les 5 min
2. **Protection spam**: Max 1 notification par 24h par ticket
3. **Simple et fiable**: Query SQL → Webhook POST → Email

**Statut actuel**: ✅ **PRODUCTION - OPÉRATIONNEL**

---

**Temps de lecture**: ~5 minutes  
**Niveau**: Développeur  
**Dernière mise à jour**: 12 novembre 2025

---

*Pour documentation complète, voir DOCS_SESSION_README.md*
