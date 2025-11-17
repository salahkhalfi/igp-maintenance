# 🧪 Guide de Test - Notifications Webhook

## 📋 Pré-requis

1. ✅ Application déployée et accessible
2. ✅ Migration 0014 appliquée
3. ✅ Compte Pabbly Connect configuré
4. ✅ Accès admin ou superviseur à l'application

## 🎯 Scénario de Test Complet

### Étape 1 : Créer un ticket de test

1. Connectez-vous à l'application
2. Créez un nouveau ticket avec ces paramètres :
   - **Titre** : "Test Webhook - Presse Hydraulique"
   - **Machine** : N'importe quelle machine
   - **Priorité** : High
   - **Description** : "Ticket de test pour webhook"

### Étape 2 : Planifier le ticket dans le passé

1. Ouvrez le ticket créé
2. Cliquez sur "Modifier" dans la section Planification
3. **Assignez** le ticket à un technicien (ou à l'équipe)
4. **Date planifiée** : Choisissez **hier** ou **avant-hier**
5. Cliquez sur "Enregistrer"

✅ **Attendu** : La bannière "PLANIFIÉ" devient visible en bleu/vert avec un compte à rebours en rouge "Retard: X jours..."

### Étape 3 : Vérifier le déclenchement automatique

#### Option A : Attendre 5 minutes (automatique)
- Le système vérifie automatiquement toutes les 5 minutes
- Ouvrez la console du navigateur (F12)
- Attendez 5 minutes maximum
- Vous devriez voir : `Notifications webhook envoyées: 1 ticket(s)`

#### Option B : Déclencher manuellement (immédiat)

Ouvrez la console du navigateur et exécutez :

```javascript
// Dans la console du navigateur
axios.post('/api/webhooks/check-overdue-tickets')
  .then(res => console.log('Résultat:', res.data))
  .catch(err => console.error('Erreur:', err.response?.data || err.message));
```

### Étape 4 : Vérifier la réception dans Pabbly Connect

1. Connectez-vous à votre compte Pabbly Connect
2. Allez dans votre workflow webhook
3. Vérifiez l'onglet "History" ou "Logs"
4. Vous devriez voir une nouvelle requête avec toutes les données du ticket

**Données reçues attendues :**
```json
{
  "ticket_id": "TKT-2024-XXX",
  "title": "Test Webhook - Presse Hydraulique",
  "priority": "high",
  "overdue_text": "1 jour(s) Xh Xmin",
  "assigned_to": "Nom du technicien",
  ...
}
```

### Étape 5 : Vérifier l'historique des notifications

Dans la console du navigateur :

```javascript
// Remplacez TKT-2024-XXX par votre ticket_id
axios.get('/api/webhooks/notification-history/TKT-2024-XXX')
  .then(res => console.log('Historique:', res.data))
  .catch(err => console.error('Erreur:', err));
```

**Résultat attendu :**
```json
{
  "ticket_id": "TKT-2024-XXX",
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

## 🔄 Test de la limite 24h

### Test : Tentative de double notification

1. Après avoir reçu la première notification, essayez immédiatement de déclencher à nouveau :

```javascript
axios.post('/api/webhooks/check-overdue-tickets')
  .then(res => {
    console.log('Total expirés:', res.data.total_overdue);
    console.log('Notifications envoyées:', res.data.notifications_sent);
  });
```

✅ **Attendu** : 
- `total_overdue: 1` (le ticket est toujours expiré)
- `notifications_sent: 0` (mais aucune notification envoyée car < 24h)

### Test : Notification après 24h

Pour tester complètement, vous devrez :
1. Attendre 24 heures OU
2. Modifier manuellement la date dans la DB :

```sql
-- Via wrangler d1 execute
UPDATE webhook_notifications 
SET sent_at = datetime('now', '-25 hours')
WHERE ticket_id = (SELECT id FROM tickets WHERE ticket_id = 'TKT-2024-XXX');
```

Puis redéclencher la vérification.

✅ **Attendu** : Une nouvelle notification est envoyée

## 🚫 Tests de cas négatifs

### Test 1 : Ticket en cours (pas de notification)

1. Modifiez le status du ticket à "in_progress"
2. Déclenchez la vérification
3. ✅ **Attendu** : Aucune notification envoyée

### Test 2 : Ticket assigné sans date (pas de notification)

1. Créez un ticket
2. Assignez-le à quelqu'un SANS mettre de date
3. ✅ **Attendu** : Aucune notification envoyée

### Test 3 : Ticket avec date future (pas de notification)

1. Créez un ticket
2. Planifiez-le pour demain
3. ✅ **Attendu** : Aucune notification envoyée

### Test 4 : Ticket non assigné (pas de notification)

1. Créez un ticket avec date passée
2. NE PAS l'assigner
3. ✅ **Attendu** : Aucune notification envoyée

## 📊 Tests via Base de Données

### Vérifier les notifications en DB

```bash
# Via wrangler CLI
cd /home/user/webapp
npx wrangler d1 execute maintenance-db --local --command="SELECT * FROM webhook_notifications ORDER BY sent_at DESC LIMIT 5"
```

### Vérifier les tickets expirés

```sql
SELECT 
  ticket_id,
  title,
  status,
  scheduled_date,
  assigned_to,
  datetime(scheduled_date) < datetime('now') as is_overdue
FROM tickets
WHERE assigned_to IS NOT NULL
  AND scheduled_date IS NOT NULL
  AND scheduled_date != 'null'
  AND status IN ('received', 'diagnostic')
ORDER BY scheduled_date ASC;
```

## 🎨 Test de l'interface utilisateur

### Vérifier les indicateurs visuels

1. **Compte à rebours** :
   - Ticket planifié futur → Vert ou jaune
   - Ticket expiré → Rouge avec "Retard: X jours..."

2. **Bannière** :
   - Ticket planifié → Bleue "PLANIFIÉ"
   - Ticket assigné sans date → Orange "ASSIGNÉ"

3. **Console du navigateur** :
   - Vérifier qu'il n'y a pas d'erreurs JavaScript
   - Vérifier les logs de notifications

## 📧 Test Email (Pabbly Connect)

### Configuration minimale dans Pabbly

1. **Trigger** : Webhook
2. **Action** : Email by Pabbly
3. **Template** :

```
Sujet : 🚨 Ticket en retard : {{title}}

Ticket : {{ticket_id}}
Machine : {{machine}}
Priorité : {{priority}}
Retard : {{overdue_text}}
Assigné à : {{assigned_to}}

Description :
{{description}}
```

### Vérifier l'email reçu

✅ Toutes les données doivent être correctement insérées
✅ Le formatage doit être propre
✅ Les emojis doivent s'afficher

## 🔍 Débogage

### Problème : Aucune notification reçue

**Checklist :**
1. ✅ Le ticket a-t-il une date planifiée ?
2. ✅ Le ticket est-il assigné ?
3. ✅ La date est-elle dans le passé ?
4. ✅ Le status est-il 'received' ou 'diagnostic' ?
5. ✅ Y a-t-il une notification dans les 24 dernières heures ?

**Vérifier dans la console :**
```javascript
// Lister tous les tickets expirés
axios.post('/api/webhooks/check-overdue-tickets')
  .then(res => console.log('Détails complets:', JSON.stringify(res.data, null, 2)));
```

### Problème : Erreur 500

**Vérifier les logs PM2 :**
```bash
cd /home/user/webapp
pm2 logs maintenance-app --nostream --lines 50
```

**Vérifier la migration :**
```bash
npx wrangler d1 migrations list maintenance-db --local
```

### Problème : Webhook ne fonctionne pas

**Tester l'URL Pabbly manuellement :**
```bash
curl -X POST \
  https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY0MDYzMDA0M2Q1MjY5NTUzYzUxM2Ei_pc \
  -H "Content-Type: application/json" \
  -d '{
    "test": "true",
    "ticket_id": "TEST-001",
    "title": "Test manuel"
  }'
```

✅ **Attendu** : Réponse 200 OK

## 📝 Checklist finale

- [ ] Migration appliquée avec succès
- [ ] Table webhook_notifications existe
- [ ] Ticket de test créé et planifié dans le passé
- [ ] Bannière "PLANIFIÉ" visible en rouge (retard)
- [ ] Notification envoyée (visible dans console ou historique)
- [ ] Webhook reçu dans Pabbly Connect
- [ ] Email reçu avec toutes les bonnes données
- [ ] Deuxième tentative bloquée (< 24h)
- [ ] Tickets non expirés ignorés
- [ ] Tickets en cours ignorés

## 🎉 Test réussi !

Si tous les tests passent, votre système de notifications webhook est opérationnel ! 🚀

Les notifications seront maintenant envoyées automatiquement toutes les 5 minutes pour tous les tickets planifiés expirés.
