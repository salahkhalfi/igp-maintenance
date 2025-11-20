# 🔧 Guide de Configuration - Webhook Pabbly Connect

**Date:** 20 novembre 2025  
**Version:** 1.8.0  
**Application:** Système de Gestion de Maintenance IGP

---

## 📋 Vue d'Ensemble

Ce guide explique comment configurer le webhook **Pabbly Connect** pour les notifications automatiques de tickets en retard.

### Qu'est-ce que Pabbly Connect ?

**Pabbly Connect** est une plateforme d'automatisation qui permet de connecter différentes applications et services. Dans notre cas, il reçoit des notifications de l'application et peut :
- Envoyer des emails
- Envoyer des SMS
- Créer des alertes Slack
- Intégrer avec d'autres services

---

## 🔑 Configuration du Secret Cloudflare

### Nom du Secret

**IMPORTANT:** Le secret doit s'appeler **`PABBLY_WEBHOOK_URL`** (et NON `MAKE_WEBHOOK_URL`)

### Étapes de Configuration

#### 1. Obtenir l'URL du Webhook Pabbly Connect

Connectez-vous à votre compte Pabbly Connect et créez un workflow qui :
1. Reçoit des webhooks entrants
2. Copier l'URL du webhook générée

**Format attendu:**
```
https://connect.pabbly.com/workflow/sendwebhookdata/[VOTRE_ID_WORKFLOW]
```

**URL de production actuelle:**
```
https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY0MDYzMDA0M2Q1MjY5NTUzYzUxM2Ei_pc
```

#### 2. Configurer le Secret dans Cloudflare

**Via wrangler CLI:**
```bash
cd /home/user/webapp
npx wrangler pages secret put PABBLY_WEBHOOK_URL --project-name webapp
```

Quand demandé, collez l'URL du webhook Pabbly Connect.

**Via Cloudflare Dashboard:**
1. Aller sur https://dash.cloudflare.com
2. Sélectionner votre compte
3. Aller dans **Workers & Pages**
4. Sélectionner le projet **webapp**
5. Onglet **Settings** → **Environment variables**
6. Section **Production**
7. Cliquer **Add variable**
   - **Variable name:** `PABBLY_WEBHOOK_URL`
   - **Type:** Secret (encrypted)
   - **Value:** [Coller l'URL du webhook]
8. Cliquer **Save**

#### 3. Vérifier la Configuration

```bash
# Lister tous les secrets (les valeurs sont masquées)
npx wrangler pages secret list --project-name webapp
```

**Sortie attendue:**
```
✅ CRON_SECRET: Value Encrypted
✅ JWT_SECRET: Value Encrypted
✅ VAPID_PRIVATE_KEY: Value Encrypted
✅ PABBLY_WEBHOOK_URL: Value Encrypted  ← Nouveau secret
```

---

## 🤖 Configuration du CRON Job

### Option 1: Cloudflare Cron Triggers (Recommandé)

**Avantages:**
- Gratuit
- Intégré directement dans Cloudflare
- Pas de service externe requis

**Configuration:**

1. **Via wrangler.jsonc** (ajouter à la configuration existante):
```jsonc
{
  "name": "webapp",
  // ... autres configurations ...
  "triggers": {
    "crons": ["*/5 * * * *"]  // Toutes les 5 minutes
  }
}
```

2. **Déployer:**
```bash
cd /home/user/webapp
npm run build
npx wrangler pages deploy dist --project-name webapp
```

3. **Via Cloudflare Dashboard:**
   - Aller dans **Workers & Pages**
   - Sélectionner **webapp**
   - Onglet **Settings** → **Triggers**
   - Section **Cron Triggers**
   - Cliquer **Add Cron Trigger**
   - **Cron expression:** `*/5 * * * *`
   - **Route:** `/api/cron/check-overdue`
   - **Save**

### Option 2: Déclenchement via Pabbly Connect

**Configuration Pabbly Connect:**

1. Créer un nouveau workflow dans Pabbly Connect
2. **Trigger:** Scheduler (toutes les 5 minutes)
3. **Action:** Webhook by Pabbly
   - **URL:** `https://3382aa78.webapp-7t8.pages.dev/api/cron/check-overdue`
   - **Method:** POST
   - **Headers:**
     - `Authorization`: [VALEUR_CRON_SECRET]
     - `Content-Type`: `application/json`
4. Activer le workflow

---

## 📊 Structure des Données Envoyées

### Payload Webhook

Quand un ticket est en retard, l'application envoie ce JSON à Pabbly Connect :

```json
{
  "ticket_id": "FOUR-001",
  "title": "Réparer four 3 - Surchauffe détectée",
  "description": "Le four 3 présente des signes de surchauffe...",
  "priority": "high",
  "status": "received",
  "machine_type": "Four",
  "model": "Model XYZ-500",
  "scheduled_date": "2025-11-20 10:00:00",
  "assigned_to": "Jean Dupont",
  "reporter": "Marie Martin",
  "overdue_text": "3h 25min",
  "created_at": "2025-11-20 09:00:00",
  "notification_time": "2025-11-20T13:25:00.000Z"
}
```

### Champs Expliqués

| Champ | Type | Description |
|-------|------|-------------|
| `ticket_id` | string | ID unique du ticket (ex: FOUR-001) |
| `title` | string | Titre du ticket |
| `description` | string | Description détaillée du problème |
| `priority` | string | Priorité: `critical`, `high`, `medium`, `low` |
| `status` | string | Statut actuel: `received` ou `diagnostic` |
| `machine_type` | string | Type de machine concernée |
| `model` | string | Modèle de la machine |
| `scheduled_date` | string | Date/heure planifiée initiale |
| `assigned_to` | string | Nom du technicien assigné ou "Toute l'équipe" |
| `reporter` | string | Nom de la personne ayant créé le ticket |
| `overdue_text` | string | Retard formaté (ex: "3h 25min" ou "45min") |
| `created_at` | string | Date/heure de création du ticket |
| `notification_time` | string | Date/heure d'envoi de la notification (ISO 8601) |

---

## ✅ Exemple de Workflow Pabbly Connect

### Workflow Recommandé

**Nom:** Alertes Tickets en Retard - IGP Maintenance

**Étapes:**

1. **Webhook Trigger** (reçoit les données)
   - Méthode: POST
   - Format: JSON

2. **Formatter** (optionnel - formater le message)
   ```
   🚨 TICKET EN RETARD 🚨
   
   Ticket: {{ticket_id}}
   Titre: {{title}}
   Machine: {{machine_type}} - {{model}}
   Priorité: {{priority}}
   Retard: {{overdue_text}}
   
   Assigné à: {{assigned_to}}
   Rapporté par: {{reporter}}
   
   Action requise immédiatement!
   ```

3. **Action 1: Envoyer Email** (via Gmail, Outlook, etc.)
   - **To:** superviseur@igpglass.ca, maintenance@igpglass.ca
   - **Subject:** `🚨 Ticket en retard: {{ticket_id}}`
   - **Body:** Message formaté de l'étape 2

4. **Action 2: Envoyer SMS** (optionnel, via Twilio, etc.)
   - **To:** Numéro du superviseur
   - **Message:** `Ticket {{ticket_id}} en retard de {{overdue_text}}. Assigné à {{assigned_to}}.`

5. **Action 3: Slack Notification** (optionnel)
   - **Channel:** #maintenance-alerts
   - **Message:** Message formaté avec mention @channel

---

## 🧪 Tests

### Test 1: Vérifier le Secret

```bash
# Appeler l'endpoint CRON avec le CRON_SECRET
curl -X POST https://3382aa78.webapp-7t8.pages.dev/api/cron/check-overdue \
  -H "Authorization: [VOTRE_CRON_SECRET]"
```

**Réponse attendue si aucun ticket en retard:**
```json
{
  "message": "Aucun ticket planifié expiré trouvé",
  "checked_at": "2025-11-20T14:30:00.000Z"
}
```

**Réponse attendue si tickets en retard:**
```json
{
  "message": "Vérification terminée",
  "total_overdue": 2,
  "notifications_sent": 2,
  "notifications": [
    {
      "ticket_id": "FOUR-001",
      "title": "Réparer four 3",
      "overdue_text": "3h 25min",
      "webhook_status": 200,
      "sent_at": "2025-11-20T14:30:00.000Z"
    }
  ],
  "checked_at": "2025-11-20T14:30:00.000Z"
}
```

### Test 2: Créer un Ticket Test en Retard

1. Se connecter à l'application en tant qu'admin
2. Créer un nouveau ticket
3. Définir `scheduled_date` à une date passée (ex: hier)
4. Définir `status` à "received" ou "diagnostic"
5. Attendre 5 minutes (ou déclencher CRON manuellement)
6. Vérifier que Pabbly Connect a reçu le webhook

### Test 3: Vérifier les Logs

**Dans la base de données:**
```sql
SELECT 
  wn.*,
  t.ticket_id,
  t.title
FROM webhook_notifications wn
LEFT JOIN tickets t ON wn.ticket_id = t.id
WHERE wn.event_type = 'overdue_scheduled'
ORDER BY wn.sent_at DESC
LIMIT 10;
```

**Via Cloudflare Dashboard:**
1. Aller dans **Workers & Pages**
2. Sélectionner **webapp**
3. Onglet **Logs** (Real-time)
4. Chercher les logs du CRON:
   ```
   🔔 CRON externe démarré
   ✅ CRON: Webhook envoyé pour FOUR-001 (status: 200)
   ```

---

## 🔒 Sécurité

### Bonnes Pratiques

1. **Ne jamais exposer PABBLY_WEBHOOK_URL publiquement**
   - Toujours utiliser Cloudflare Secrets
   - Ne jamais committer dans git

2. **Protéger l'endpoint CRON**
   - CRON_SECRET doit être complexe (32+ caractères)
   - Régénérer régulièrement (tous les 6 mois)

3. **Vérifier les logs webhook**
   - Surveiller `webhook_notifications` table
   - Alerter si taux d'échec > 5%

4. **Limiter les tentatives**
   - Application envoie 1 webhook par ticket
   - Délai de 200ms entre webhooks (éviter spam)

---

## 🐛 Dépannage

### Problème: Webhooks non envoyés

**Symptômes:**
- Table `webhook_notifications` vide
- Aucune notification reçue dans Pabbly Connect

**Solutions:**

1. **Vérifier PABBLY_WEBHOOK_URL configuré:**
   ```bash
   npx wrangler pages secret list --project-name webapp
   # Doit afficher PABBLY_WEBHOOK_URL
   ```

2. **Vérifier CRON activé:**
   - Cloudflare Dashboard → Cron Triggers
   - Ou tester manuellement avec curl

3. **Vérifier tickets en retard existent:**
   ```sql
   SELECT * FROM tickets
   WHERE scheduled_date IS NOT NULL
     AND scheduled_date < datetime('now')
     AND status IN ('received', 'diagnostic');
   ```

### Problème: Webhooks échouent (status != 200)

**Symptômes:**
- `response_status` dans logs = 400, 500, etc.
- Pabbly Connect rejette le webhook

**Solutions:**

1. **Vérifier URL webhook correcte:**
   - Tester l'URL dans Postman/curl
   - Vérifier que le workflow Pabbly est actif

2. **Vérifier format JSON:**
   - Consulter `response_body` dans `webhook_notifications`
   - Ajuster le payload si nécessaire

3. **Vérifier limites Pabbly Connect:**
   - Plan gratuit: 100 tâches/mois
   - Passer à plan payant si nécessaire

### Problème: Webhooks en double

**Symptômes:**
- Même ticket reçoit plusieurs notifications

**Cause:**
- CRON tourne toutes les 5 minutes
- Ticket toujours en retard

**Solution actuelle:**
- Pabbly Connect doit gérer les doublons
- Ou implémenter throttling (1 notification max par ticket par 24h)

---

## 📈 Monitoring

### KPIs à Surveiller

1. **Taux de succès webhooks:**
   ```sql
   SELECT 
     ROUND(100.0 * SUM(CASE WHEN response_status = 200 THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
   FROM webhook_notifications;
   ```
   - **Cible:** > 95%

2. **Nombre de tickets en retard:**
   ```sql
   SELECT COUNT(*) as overdue_count
   FROM tickets
   WHERE scheduled_date < datetime('now')
     AND status IN ('received', 'diagnostic');
   ```
   - **Cible:** < 5

3. **Temps moyen de retard:**
   ```sql
   SELECT 
     AVG((JULIANDAY('now') - JULIANDAY(scheduled_date)) * 24) as avg_hours_overdue
   FROM tickets
   WHERE scheduled_date < datetime('now')
     AND status IN ('received', 'diagnostic');
   ```
   - **Cible:** < 2 heures

---

## 📞 Support

### En Cas de Problème

**Vérifications rapides:**
1. `npx wrangler pages secret list --project-name webapp`
2. `curl -X POST [URL]/api/cron/check-overdue -H "Authorization: [SECRET]"`
3. Consulter `webhook_notifications` table

**Contact:**
- **Développeur:** Salah Khalfi (salah@igpglass.ca)
- **Documentation:** /home/user/webapp/README.md
- **Logs production:** Cloudflare Dashboard

---

**Document créé:** 20 novembre 2025  
**Dernière mise à jour:** 20 novembre 2025  
**Version:** 1.0  
**Responsable:** Assistant IA
