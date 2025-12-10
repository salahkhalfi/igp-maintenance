# 📧 Système de Notifications Webhook pour Tickets Expirés

## 🎯 Objectif

Envoyer automatiquement une notification par email (via Pabbly Connect) à l'administrateur ou à tout destinataire configuré lorsqu'un ticket **planifié** est expiré sans avoir été traité.

## ⚙️ Fonctionnement

### Critères de déclenchement

Un webhook est envoyé **UNIQUEMENT** si **TOUTES** les conditions suivantes sont remplies :

1. ✅ Le ticket a une **date planifiée** (`scheduled_date IS NOT NULL`)
2. ✅ Le ticket est **assigné** à quelqu'un (`assigned_to IS NOT NULL`)
3. ✅ La date planifiée est **dépassée** (`scheduled_date < NOW()`)
4. ✅ Le ticket est toujours en attente (`status = 'received' OR 'diagnostic'`)
5. ✅ La bannière **"PLANIFIÉ"** est encore visible (pas "En cours" ou "Terminé")
6. ✅ Aucune notification n'a été envoyée dans les **24 dernières heures** pour ce ticket

### Fréquence de vérification

- **Vérification initiale** : Au chargement de l'application
- **Vérification périodique** : Toutes les **5 minutes**
- **Limite d'envoi** : Maximum **1 notification par 24h** par ticket

### Données envoyées au webhook

Chaque notification contient les informations suivantes :

```json
{
  "ticket_id": "TKT-2024-001",
  "title": "Réparation presse hydraulique",
  "description": "La presse ne démarre plus",
  "priority": "high",
  "status": "diagnostic",
  "machine": "Presse Hydraulique Model X100",
  "scheduled_date": "2024-11-10 14:00:00",
  "assigned_to": "Jean Tremblay",
  "reporter": "Marie Lavoie",
  "created_at": "2024-11-08 09:30:00",
  "overdue_days": 2,
  "overdue_hours": 6,
  "overdue_minutes": 30,
  "overdue_text": "2 jour(s) 6h 30min",
  "notification_sent_at": "2024-11-12T20:30:00.000Z"
}
```

## 🔧 Configuration Technique

### URL Webhook Pabbly Connect

```
https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY0MDYzMDA0M2Q1MjY5NTUzYzUxM2Ei_pc
```

### Routes API

#### 1. Vérifier et envoyer notifications
```
POST /api/webhooks/check-overdue-tickets
Authorization: Bearer {token}
```

**Réponse :**
```json
{
  "message": "Vérification terminée",
  "total_overdue": 3,
  "notifications_sent": 2,
  "notifications": [
    {
      "ticket_id": "TKT-2024-001",
      "title": "Réparation presse",
      "overdue_text": "2 jour(s) 6h 30min",
      "webhook_status": 200,
      "sent_at": "2024-11-12T20:30:00.000Z"
    }
  ],
  "checked_at": "2024-11-12T20:30:00.000Z"
}
```

#### 2. Historique des notifications
```
GET /api/webhooks/notification-history/:ticketId
Authorization: Bearer {token}
```

**Exemple :**
```
GET /api/webhooks/notification-history/TKT-2024-001
```

**Réponse :**
```json
{
  "ticket_id": "TKT-2024-001",
  "notifications": [
    {
      "id": 1,
      "notification_type": "overdue_scheduled",
      "sent_at": "2024-11-12 20:30:00",
      "response_status": 200,
      "response_body": "OK"
    }
  ]
}
```

## 📊 Base de données

### Table `webhook_notifications`

| Colonne | Type | Description |
|---------|------|-------------|
| id | INTEGER | Clé primaire |
| ticket_id | INTEGER | Référence au ticket |
| notification_type | VARCHAR(50) | Type de notification (ex: 'overdue_scheduled') |
| webhook_url | TEXT | URL du webhook appelé |
| sent_at | DATETIME | Date/heure d'envoi (UTC) |
| response_status | INTEGER | Code HTTP de réponse (200, 500, etc.) |
| response_body | TEXT | Réponse du webhook (max 1000 char) |
| created_at | DATETIME | Date de création de l'enregistrement |

### Index

```sql
CREATE INDEX idx_webhook_notifications_ticket_id ON webhook_notifications(ticket_id);
CREATE INDEX idx_webhook_notifications_type ON webhook_notifications(notification_type);
CREATE INDEX idx_webhook_notifications_sent_at ON webhook_notifications(sent_at);
CREATE INDEX idx_webhook_ticket_type_sent ON webhook_notifications(ticket_id, notification_type, sent_at);
```

## 🧪 Tests

### Test manuel via curl

```bash
# Tester la route de vérification (nécessite un token valide)
curl -X POST \
  https://your-domain.com/api/webhooks/check-overdue-tickets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Consulter l'historique d'un ticket

```bash
curl https://your-domain.com/api/webhooks/notification-history/TKT-2024-001 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📧 Configuration Pabbly Connect

Dans votre workflow Pabbly Connect, vous recevrez les données suivantes :

1. **ticket_id** : Identifiant unique du ticket
2. **title** : Titre du ticket
3. **description** : Description complète
4. **priority** : Priorité (critical, high, medium, low)
5. **machine** : Machine concernée
6. **scheduled_date** : Date prévue de maintenance
7. **assigned_to** : Personne assignée
8. **reporter** : Personne ayant rapporté le problème
9. **overdue_text** : Texte formaté du retard (ex: "2 jour(s) 6h 30min")
10. **notification_sent_at** : Timestamp de l'envoi

### Exemple de template email

```
Sujet : 🚨 Ticket en retard : {{title}}

Bonjour,

Le ticket suivant est en retard :

📌 Ticket : {{ticket_id}}
🔧 Machine : {{machine}}
⚠️ Priorité : {{priority}}
📅 Date planifiée : {{scheduled_date}}
⏱️ Retard : {{overdue_text}}

👤 Assigné à : {{assigned_to}}
📝 Rapporté par : {{reporter}}

Description :
{{description}}

Veuillez traiter ce ticket dans les plus brefs délais.

---
Notification envoyée automatiquement le {{notification_sent_at}}
```

## 🔒 Sécurité

- ✅ Toutes les routes webhook nécessitent une authentification (`authMiddleware`)
- ✅ Seuls les utilisateurs connectés peuvent déclencher les vérifications
- ✅ Les tokens JWT sont validés pour chaque requête
- ✅ Les données sensibles ne sont pas exposées dans les logs
- ✅ Limite de 1 notification par 24h pour éviter le spam

## 📝 Logs et Monitoring

Les vérifications sont enregistrées dans la console :

```
Notifications webhook envoyées: 2 ticket(s)
```

En cas d'erreur :
```
Erreur vérification tickets expirés: [détails de l'erreur]
```

## 🎯 Scénarios d'utilisation

### Scénario 1 : Ticket planifié hier
- Ticket créé : 10 nov, 9h00
- Date planifiée : 11 nov, 14h00
- Date actuelle : 12 nov, 20h30
- **Résultat** : Notification envoyée (retard : 1 jour 6h 30min)

### Scénario 2 : Ticket déjà notifié
- Première notification : 12 nov, 08h00
- Vérification actuelle : 12 nov, 20h30
- **Résultat** : Pas de notification (24h non écoulées)

### Scénario 3 : Ticket en cours de traitement
- Date planifiée : 10 nov, 14h00
- Status : "in_progress"
- **Résultat** : Pas de notification (ticket en cours)

### Scénario 4 : Ticket assigné sans date
- Assigned_to : Jean Tremblay
- Scheduled_date : NULL
- **Résultat** : Pas de notification (pas de date planifiée)

## 🚀 Déploiement

### Migration de la base de données

```bash
# Local (développement)
npx wrangler d1 migrations apply maintenance-db --local

# Production
npx wrangler d1 migrations apply maintenance-db
```

### Vérification après déploiement

1. ✅ Vérifier que la table `webhook_notifications` existe
2. ✅ Créer un ticket planifié avec une date passée
3. ✅ Attendre 5 minutes ou déclencher manuellement la route
4. ✅ Vérifier dans Pabbly Connect que le webhook est reçu
5. ✅ Vérifier l'email reçu

## ⚠️ Notes importantes

1. **Fuseau horaire** : Toutes les dates sont en **UTC** dans la base de données
2. **Interval** : Les vérifications se font toutes les **5 minutes** (configurable)
3. **Limite 24h** : Une notification ne peut être envoyée qu'une fois par 24h par ticket
4. **Status requis** : Seuls les tickets en "received" ou "diagnostic" sont notifiés
5. **Bannière visible** : La notification n'est envoyée que si la bannière "PLANIFIÉ" est visible

## 🔧 Maintenance

### Nettoyer les anciennes notifications (> 90 jours)

```sql
DELETE FROM webhook_notifications 
WHERE datetime(created_at) < datetime('now', '-90 days');
```

### Statistiques

```sql
-- Nombre total de notifications envoyées
SELECT COUNT(*) FROM webhook_notifications;

-- Notifications par ticket
SELECT 
  t.ticket_id,
  t.title,
  COUNT(wn.id) as notification_count
FROM webhook_notifications wn
INNER JOIN tickets t ON wn.ticket_id = t.id
GROUP BY t.ticket_id, t.title
ORDER BY notification_count DESC;

-- Dernières notifications
SELECT 
  t.ticket_id,
  t.title,
  wn.sent_at,
  wn.response_status
FROM webhook_notifications wn
INNER JOIN tickets t ON wn.ticket_id = t.id
ORDER BY wn.sent_at DESC
LIMIT 10;
```

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs de la console navigateur
2. Vérifier les logs PM2 : `pm2 logs maintenance-app --nostream`
3. Tester manuellement via curl
4. Consulter l'historique des notifications via l'API
