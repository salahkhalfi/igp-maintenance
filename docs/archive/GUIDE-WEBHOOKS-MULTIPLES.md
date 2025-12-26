# 🔗 Guide : Utiliser le Cron pour Plusieurs Webhooks

## 📅 Date
**Jeudi 13 Novembre 2025, 13:00**

## 🎯 Question

> "Pourra-t-on utiliser le même cron pour une autre webhook Pabbly Connect ?"

**Réponse courte : OUI, absolument !** ✅

---

## 📊 Situation Actuelle

### Webhook Existant

**URL Pabbly Connect actuelle :**
```
https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY0MDYzMDA0M2Q1MjY5NTUzYzUxM2Ei_pc
```

**Ce qu'elle fait :**
- Détecte les tickets en retard (scheduled_date dépassée)
- Envoie une notification via webhook Pabbly
- Vérifie qu'aucune notification n'a été envoyée dans les dernières 24h
- Enregistre chaque envoi dans la table `webhook_notifications`

**Fréquence :** Toutes les 15 minutes (cron job)

**Route :** `GET /api/cron/check-overdue-tickets`

---

## 🎨 Options pour Ajouter d'Autres Webhooks

### Option 1 : Plusieurs Webhooks dans le Même Cron (Recommandé)

**Concept :** Le même cron envoie vers **plusieurs URLs Pabbly** en parallèle.

**Cas d'usage :**
- Webhook 1 → Envoie vers Slack via Pabbly
- Webhook 2 → Envoie vers Email via Pabbly
- Webhook 3 → Envoie vers Discord via Pabbly

**Avantages :**
✅ Un seul déclencheur cron (économe)  
✅ Données synchronisées (même timestamp)  
✅ Facile à maintenir  
✅ Historique centralisé  

**Code exemple :**
```typescript
app.get('/api/cron/check-overdue-tickets', async (c) => {
  // ... vérification token ...
  
  // PLUSIEURS WEBHOOKS PABBLY
  const WEBHOOKS = [
    {
      name: 'Pabbly_Slack',
      url: 'https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYw..._slack',
      enabled: true
    },
    {
      name: 'Pabbly_Email',
      url: 'https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYw..._email',
      enabled: true
    },
    {
      name: 'Pabbly_Discord',
      url: 'https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYw..._discord',
      enabled: false  // Désactivé pour l'instant
    }
  ];
  
  // Pour chaque ticket en retard
  for (const ticket of overdueTickets.results) {
    const webhookData = { /* ... données ticket ... */ };
    
    // Envoyer vers TOUS les webhooks activés
    for (const webhook of WEBHOOKS.filter(w => w.enabled)) {
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        });
        
        // Enregistrer le résultat
        await c.env.DB.prepare(`
          INSERT INTO webhook_notifications 
          (ticket_id, notification_type, webhook_url, webhook_name, sent_at, response_status)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          ticket.id,
          'overdue_scheduled',
          webhook.url,
          webhook.name,  // Nouveau : identifier le webhook
          new Date().toISOString(),
          response.status
        ).run();
        
        console.log(`✅ Webhook ${webhook.name} envoyé (${response.status})`);
        
      } catch (error) {
        console.error(`❌ Erreur webhook ${webhook.name}:`, error);
      }
      
      // Délai 200ms entre webhooks
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return c.json({ success: true, webhooks_sent: WEBHOOKS.filter(w => w.enabled).length });
});
```

---

### Option 2 : Crons Séparés pour Chaque Webhook

**Concept :** Un cron différent pour chaque destination.

**Routes :**
- `/api/cron/notify-slack` → Webhook Pabbly vers Slack
- `/api/cron/notify-email` → Webhook Pabbly vers Email
- `/api/cron/notify-discord` → Webhook Pabbly vers Discord

**Configuration Cloudflare Cron Triggers :**
```toml
# wrangler.toml
[triggers]
crons = [
  "*/15 * * * *",  # Slack (toutes les 15 min)
  "0 */2 * * *",   # Email (toutes les 2h)
  "0 9 * * *"      # Discord (1 fois/jour à 9h)
]
```

**Avantages :**
✅ Fréquences différentes par webhook  
✅ Isolation des erreurs  
✅ Plus flexible  

**Inconvénients :**
⚠️ Plus de ressources utilisées  
⚠️ Données potentiellement désynchronisées  
⚠️ Plus complexe à maintenir  

---

### Option 3 : Configuration Dynamique via Database

**Concept :** Stocker les webhooks dans la base de données.

**Nouvelle table :**
```sql
CREATE TABLE webhook_endpoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  provider TEXT DEFAULT 'pabbly',  -- pabbly, make, zapier, etc.
  notification_type TEXT NOT NULL,  -- overdue_scheduled, ticket_created, etc.
  enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Exemples de données
INSERT INTO webhook_endpoints (name, url, notification_type, enabled) VALUES
  ('Pabbly Slack', 'https://connect.pabbly.com/workflow/.../slack', 'overdue_scheduled', 1),
  ('Pabbly Email', 'https://connect.pabbly.com/workflow/.../email', 'overdue_scheduled', 1),
  ('Pabbly Discord', 'https://connect.pabbly.com/workflow/.../discord', 'overdue_scheduled', 0);
```

**Code :**
```typescript
app.get('/api/cron/check-overdue-tickets', async (c) => {
  // Récupérer les webhooks actifs depuis la DB
  const webhooks = await c.env.DB.prepare(`
    SELECT * FROM webhook_endpoints 
    WHERE notification_type = 'overdue_scheduled' 
      AND enabled = 1
  `).all();
  
  for (const ticket of overdueTickets.results) {
    const webhookData = { /* ... */ };
    
    // Envoyer vers tous les webhooks DB
    for (const webhook of webhooks.results) {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });
      
      // Log...
    }
  }
});
```

**Avantages :**
✅ Configuration via UI (pas besoin redéployer)  
✅ Historique et audit facile  
✅ Activation/désactivation dynamique  
✅ Scalable (ajouter autant de webhooks qu'on veut)  

**Inconvénients :**
⚠️ Nécessite UI de gestion des webhooks  
⚠️ Plus complexe à implémenter  

---

## 🎯 Recommandation

### Pour Votre Cas (IGP)

**Je recommande Option 1 : Plusieurs Webhooks dans le Même Cron**

**Pourquoi ?**
1. ✅ Simple à implémenter (5 minutes)
2. ✅ Pas besoin de nouvelle table
3. ✅ Facile à tester
4. ✅ Économe en ressources
5. ✅ Suffisant pour 2-5 webhooks Pabbly

**Quand passer à Option 3 ?**
- Si vous avez >10 webhooks différents
- Si vous voulez une UI de gestion
- Si les webhooks changent souvent

---

## 💻 Implémentation Option 1 (Simple)

### Étape 1 : Obtenir Nouvelle URL Pabbly

1. Allez sur **Pabbly Connect**
2. Créez un nouveau workflow
3. Trigger : **Webhook** (Catch Webhook)
4. Copiez l'URL webhook : `https://connect.pabbly.com/workflow/sendwebhookdata/XXXXX`

### Étape 2 : Ajouter dans le Code

**Modifier `/src/index.tsx` ligne 417 :**

**AVANT (1 seul webhook) :**
```typescript
const WEBHOOK_URL = 'https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYw...';
```

**APRÈS (plusieurs webhooks) :**
```typescript
const WEBHOOKS = [
  {
    name: 'Pabbly_Primary',
    url: 'https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYw...', // Ancien
    enabled: true
  },
  {
    name: 'Pabbly_Secondary',
    url: 'https://connect.pabbly.com/workflow/sendwebhookdata/NOUVELLE_URL', // Nouveau
    enabled: true
  }
];
```

### Étape 3 : Modifier la Boucle d'Envoi

**Ligne 469 (envoi webhook), remplacer :**

**AVANT :**
```typescript
const webhookResponse = await fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(webhookData)
});
```

**APRÈS :**
```typescript
// Envoyer vers TOUS les webhooks activés
for (const webhook of WEBHOOKS.filter(w => w.enabled)) {
  try {
    const webhookResponse = await fetch(webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData)
    });
    
    const responseStatus = webhookResponse.status;
    let responseBody = '';
    try {
      responseBody = await webhookResponse.text();
    } catch (e) {
      responseBody = 'Could not read response body';
    }
    
    // Enregistrer avec le nom du webhook
    await c.env.DB.prepare(`
      INSERT INTO webhook_notifications 
      (ticket_id, notification_type, webhook_url, sent_at, response_status, response_body)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      ticket.id,
      `overdue_scheduled_${webhook.name}`,  // Identifie quel webhook
      webhook.url,
      new Date().toISOString(),
      responseStatus,
      responseBody.substring(0, 1000)
    ).run();
    
    console.log(`✅ Webhook ${webhook.name} envoyé (${responseStatus})`);
    
  } catch (error) {
    console.error(`❌ Erreur webhook ${webhook.name}:`, error);
  }
  
  // Délai 200ms entre webhooks pour éviter spam
  await new Promise(resolve => setTimeout(resolve, 200));
}
```

### Étape 4 : Tester

```bash
# Build
npm run build

# Tester le cron manuellement
curl -X GET https://app.igpglass.ca/api/cron/check-overdue-tickets \
  -H "Authorization: Bearer cron_secret_igp_2025_webhook_notifications"

# Vérifier les logs
npx wrangler tail --project-name webapp
```

---

## 📋 Exemples de Cas d'Usage

### Cas 1 : Notifications Multi-Canaux

**Webhooks Pabbly :**
1. **Pabbly → Slack** : Notification équipe en temps réel
2. **Pabbly → Email** : Résumé quotidien au manager
3. **Pabbly → SMS** : Alertes critiques (priorité haute)

**Configuration :**
```typescript
const WEBHOOKS = [
  {
    name: 'Slack_RealTime',
    url: 'https://connect.pabbly.com/.../slack',
    enabled: true,
    filter: null  // Tous les tickets
  },
  {
    name: 'Email_Manager',
    url: 'https://connect.pabbly.com/.../email',
    enabled: true,
    filter: (ticket) => ticket.priority === 'high' || ticket.priority === 'critical'
  },
  {
    name: 'SMS_Critical',
    url: 'https://connect.pabbly.com/.../sms',
    enabled: true,
    filter: (ticket) => ticket.priority === 'critical'
  }
];
```

### Cas 2 : Intégrations Tierces

**Webhooks Pabbly :**
1. **Pabbly → Google Sheets** : Log automatique des retards
2. **Pabbly → Trello** : Créer carte automatiquement
3. **Pabbly → WhatsApp** : Notification technicien mobile

---

## 🔧 Migration Existant → Multiple Webhooks

### Plan de Migration (15 minutes)

**Étape 1 : Backup (2 min)**
```bash
cd /home/user/webapp
git add .
git commit -m "Backup avant ajout webhooks multiples"
```

**Étape 2 : Modifier Code (5 min)**
- Ligne 417 : Changer `WEBHOOK_URL` → `WEBHOOKS` array
- Ligne 469 : Ajouter boucle `for (const webhook of WEBHOOKS)`
- Ligne 488 : Modifier notification_type pour inclure nom webhook

**Étape 3 : Tester Local (3 min)**
```bash
npm run build
pm2 restart webapp
curl -X GET http://localhost:3000/api/cron/check-overdue-tickets \
  -H "Authorization: Bearer cron_secret_igp_2025_webhook_notifications"
```

**Étape 4 : Déployer (5 min)**
```bash
git add .
git commit -m "feat: Support webhooks multiples Pabbly Connect"
npm run build
npx wrangler pages deploy dist --project-name webapp
```

---

## 📊 Performance et Limites

### Cloudflare Workers Limites

**Plan Free :**
- 100 000 requêtes/jour
- 10ms CPU time/requête
- 1000 sous-requêtes (fetch)

**Webhooks multiples :**
- 1 cron toutes les 15 min = 96 exécutions/jour
- 5 webhooks/exécution = 480 webhooks/jour
- ✅ Largement dans les limites

**Recommandation :**
- Maximum 10 webhooks par cron (pour rester sous 10ms CPU)
- Si plus, utiliser Option 2 (crons séparés)

---

## ✅ Checklist Ajout Webhook

- [ ] Créer workflow Pabbly Connect
- [ ] Copier URL webhook
- [ ] Ajouter dans array WEBHOOKS (code)
- [ ] Tester localement avec curl
- [ ] Vérifier logs webhook_notifications
- [ ] Déployer en production
- [ ] Tester en production
- [ ] Surveiller logs Cloudflare (wrangler tail)
- [ ] Vérifier réception dans Pabbly Connect

---

## 🎯 Réponse Finale à Votre Question

> "Pourra-t-on utiliser le même cron pour une autre webhook Pabbly Connect ?"

**OUI ! Vous avez 3 options :**

1. ⭐ **Option 1 (Recommandé)** : Ajouter webhooks dans le cron existant
   - Temps : 15 minutes
   - Complexité : Faible
   - Parfait pour 2-10 webhooks

2. **Option 2** : Créer crons séparés
   - Temps : 30 minutes
   - Complexité : Moyenne
   - Parfait si fréquences différentes

3. **Option 3** : Webhooks en base de données
   - Temps : 2-3 heures
   - Complexité : Élevée
   - Parfait si >10 webhooks ou UI nécessaire

**Pour IGP : Utilisez Option 1** ✅

---

## 📞 Besoin d'Aide ?

Si vous voulez que j'implémente l'ajout de webhooks multiples :
1. Donnez-moi la nouvelle URL Pabbly Connect
2. Dites-moi quel nom lui donner (ex: "Pabbly_Email", "Pabbly_Discord")
3. Je modifie le code et déploie en 15 minutes !

C'est simple et ça marche parfaitement avec le système existant 🚀
