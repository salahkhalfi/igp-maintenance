# 🔔 Notifications en Temps Réel - Guide Complet

**Version** : v2.6.0  
**Statut** : ✅ **DÉJÀ IMPLÉMENTÉ** (Push Notifications PWA)  
**Dernière mise à jour** : 17 janvier 2025

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Système actuel (Push Notifications)](#système-actuel-push-notifications)
3. [Événements notifiés](#événements-notifiés)
4. [Architecture technique](#architecture-technique)
5. [Améliorations possibles](#améliorations-possibles)
6. [Implémentation Server-Sent Events (SSE)](#implémentation-server-sent-events-sse)
7. [Comparaison des technologies](#comparaison-des-technologies)

---

## 🎯 Vue d'ensemble

### ✅ **Ce qui est DÉJÀ fonctionnel**

Votre application dispose **déjà** d'un système de notifications en temps réel via **Web Push Notifications** (PWA) :

```
✅ Push Notifications PWA
   ├─ Abonnement utilisateur (/api/push/subscribe)
   ├─ Désabonnement (/api/push/unsubscribe)
   ├─ Clé VAPID publique (/api/push/vapid-public-key)
   ├─ Test manuel (/api/push/test)
   └─ Envoi automatique (tickets assignés)

✅ Événements déclenchés
   ├─ Ticket assigné à un technicien
   └─ Réassignation de ticket
```

---

## 🔔 Système Actuel (Push Notifications)

### **1. Architecture Push Notifications**

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (PWA)                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Service Worker (sw.js)                             │  │
│  │  - Écoute événements push                           │  │
│  │  - Affiche notifications                            │  │
│  │  - Gère clics notifications                         │  │
│  └─────────────────────────────────────────────────────┘  │
│                          ▲                                  │
│                          │ Push Event                      │
└──────────────────────────┼─────────────────────────────────┘
                           │
                           │
┌──────────────────────────┼─────────────────────────────────┐
│                          │                                  │
│              BROWSER PUSH SERVICE                          │
│         (Chrome/Firefox/Safari Push Server)                │
│                          ▲                                  │
└──────────────────────────┼─────────────────────────────────┘
                           │
                           │ HTTPS POST
                           │
┌──────────────────────────┼─────────────────────────────────┐
│                    BACKEND (Cloudflare)                    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  /api/push/subscribe                                 │ │
│  │  - Stocke endpoint + keys (p256dh, auth)            │ │
│  │  - Enregistre dans D1: push_subscriptions           │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  sendPushNotification(userId, payload)               │ │
│  │  - Récupère subscriptions D1                        │ │
│  │  - Construit payload VAPID                          │ │
│  │  - POST vers browser push service                   │ │
│  │  - Retry logic (3 tentatives)                       │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Triggers (événements métier)                        │ │
│  │  - POST /api/tickets/:id/assign                     │ │
│  │  - PUT /api/tickets/:id (assigned_to changé)        │ │
│  │  └─> Appelle sendPushNotification()                 │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Cloudflare D1 Database                              │ │
│  │  - push_subscriptions (endpoint, keys, user_id)     │ │
│  │  - push_logs (historique envois)                    │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **2. Flux d'Abonnement**

```javascript
// 1. Frontend demande permission
const permission = await Notification.requestPermission();

// 2. Si autorisé, récupère clé VAPID
const response = await fetch('/api/push/vapid-public-key');
const { publicKey } = await response.json();

// 3. Enregistre Service Worker
const registration = await navigator.serviceWorker.register('/sw.js');

// 4. Souscrit aux push notifications
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(publicKey)
});

// 5. Envoie subscription au backend
await fetch('/api/push/subscribe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    subscription: subscription.toJSON(),
    deviceType: 'desktop',
    deviceName: navigator.userAgent
  })
});
```

### **3. Base de Données**

**Table `push_subscriptions`** :

```sql
CREATE TABLE push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  endpoint TEXT UNIQUE NOT NULL,      -- URL du push service
  p256dh TEXT NOT NULL,               -- Clé publique client
  auth TEXT NOT NULL,                 -- Secret d'authentification
  device_type TEXT,                   -- 'desktop' | 'mobile' | 'tablet'
  device_name TEXT,                   -- User agent
  last_used DATETIME,                 -- Dernière notification envoyée
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
```

**Table `push_logs`** (historique) :

```sql
CREATE TABLE push_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  ticket_id INTEGER,
  status TEXT NOT NULL,              -- 'sent' | 'send_failed'
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);
```

---

## 📣 Événements Notifiés

### **✅ Événements Actuels**

#### **1. Ticket Assigné** (`POST /api/tickets/:id/assign`)

```typescript
// Trigger: Quand un ticket est assigné à un technicien
const pushResult = await sendPushNotification(c.env, assigned_to, {
  title: '🎫 Nouveau ticket assigné',
  body: `Ticket #${ticket.ticket_id}: ${ticket.title}`,
  icon: '/icon-192.png',
  badge: '/badge-72.png',
  data: {
    url: `/tickets/${ticket.id}`,
    ticketId: ticket.id,
    action: 'ticket_assigned'
  }
});
```

**Notification visible** :
```
┌─────────────────────────────────────┐
│ 🎫 Nouveau ticket assigné           │
│ Ticket #T-2025-001: Panne machine   │
│ [Voir le ticket]                    │
└─────────────────────────────────────┘
```

#### **2. Ticket Réassigné** (`PUT /api/tickets/:id`)

```typescript
// Trigger: Quand assigned_to change dans un PUT
if (body.assigned_to && body.assigned_to !== existingTicket.assigned_to) {
  const pushResult = await sendPushNotification(c.env, body.assigned_to, {
    title: '🔄 Ticket réassigné',
    body: `Ticket #${existingTicket.ticket_id}: ${existingTicket.title}`,
    icon: '/icon-192.png',
    data: {
      url: `/tickets/${id}`,
      ticketId: id,
      action: 'ticket_reassigned'
    }
  });
}
```

### **✅ Fonctionnalités Temps Réel Existantes**

#### **Messages - Compteur Non Lus** ✅
- **API** : `GET /api/messages/unread-count`
- **Frontend** : Badge rouge avec compteur live
- **Implémentation** :
  ```sql
  SELECT COUNT(*) as count
  FROM messages
  WHERE recipient_id = ? AND is_read = 0
  ```
- **UI** : 
  - Badge rouge pulsant si messages non lus
  - Compteur affiché dans header
  - Rafraîchissement au chargement et après envoi/lecture
  - Tooltip : "X messages non lus"

#### **Conversations - Compteur par Contact** ✅
- **API** : `GET /api/messages/conversations`
- **Fonctionnalité** : 
  ```sql
  COUNT(CASE WHEN recipient_id = ? AND is_read = 0 THEN 1 END) as unread_count
  ```
- **UI** : Badge orange avec nombre de messages non lus par conversation

### **⏳ Événements Possibles (Non Implémentés)**

Voici les événements qui **pourraient** déclencher des notifications :

#### **Messages**
- ✨ Push notification pour nouveau message privé reçu
- ✨ Push notification pour nouveau message audio
- ✨ SSE pour mise à jour badge compteur temps réel (sans refresh)

#### **Tickets**
- ✨ Ticket en retard (scheduled_date dépassée)
- ✨ Changement de statut (reçu → diagnostic → réparé → testé → terminé)
- ✨ Changement de priorité (normale → haute → urgente)
- ✨ Nouveau commentaire sur un ticket suivi
- ✨ Ticket fermé/résolu

#### **Machines**
- ✨ Nouvelle intervention planifiée
- ✨ Machine en panne signalée
- ✨ Maintenance préventive due

#### **Système**
- ✨ Nouveau utilisateur inscrit (admins)
- ✨ Rôle modifié (utilisateur concerné)
- ✨ Paramètres système changés (admins)

---

## 🏗️ Architecture Technique

### **Technologies Utilisées**

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| **Protocol** | Web Push API | Standard W3C pour push notifications |
| **Authentification** | VAPID (Voluntary Application Server Identification) | Signature des messages push |
| **Backend** | @block65/webcrypto-web-push | Librairie Workers-compatible |
| **Storage** | Cloudflare D1 (SQLite) | Stockage subscriptions |
| **Frontend** | Service Worker | Réception et affichage notifications |

### **Sécurité**

```typescript
// Authentification JWT requise pour subscribe/unsubscribe
app.use('/api/push/*', authMiddleware);

// Clés VAPID stockées en secrets Cloudflare
const vapid: VapidKeys = {
  subject: 'mailto:support@igpglass.ca',
  publicKey: env.VAPID_PUBLIC_KEY,    // Public (frontend)
  privateKey: env.VAPID_PRIVATE_KEY   // Privé (backend only)
};

// Validation subscription
if (!subscription || !subscription.endpoint || !subscription.keys) {
  return c.json({ error: 'Subscription invalide' }, 400);
}
```

### **Fiabilité**

```typescript
// 1. Retry logic (3 tentatives avec backoff exponentiel)
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    const response = await fetch(pushSubscription.endpoint, pushPayload);
    if (response.ok) break;
  } catch (error) {
    if (attempt < 2) {
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
}

// 2. Gestion tokens expirés (410 Gone)
if (error.statusCode === 410) {
  await env.DB.prepare(`
    DELETE FROM push_subscriptions WHERE endpoint = ?
  `).bind(sub.endpoint).run();
}

// 3. Logs d'erreurs
await env.DB.prepare(`
  INSERT INTO push_logs (user_id, status, error_message)
  VALUES (?, 'send_failed', ?)
`).bind(userId, JSON.stringify(errorDetails)).run();

// 4. Fail-safe (si push échoue, l'app continue)
return { success: false, sentCount: 0, failedCount: 0 };
```

### **Performance**

```typescript
// TTL: 24 heures (notification livrée même si utilisateur offline)
const message: PushMessage = {
  data: JSON.stringify(payload),
  options: {
    ttl: 86400  // 24 heures
  }
};

// Validation taille payload
if (payload.title.length > 100) {
  payload.title = payload.title.substring(0, 97) + '...';
}
if (payload.body.length > 200) {
  payload.body = payload.body.substring(0, 197) + '...';
}
if (JSON.stringify(payload.data).length > 1000) {
  payload.data = { truncated: true };
}
```

---

## 🚀 Améliorations Possibles

### **Option A : Ajouter Plus d'Événements Push**

**Difficulté** : 🟢 Facile (2-3 heures)  
**Impact** : 🟢 Moyen  
**Coût tokens** : ~15,000

**Implémentation** :

```typescript
// 1. Dans src/routes/messages.ts - Nouveau message privé
app.post('/api/messages', authMiddleware, async (c) => {
  const { message_type, recipient_id, content } = await c.req.json();
  
  // ... insertion message ...
  
  // Envoyer push au destinataire
  if (message_type === 'private' && recipient_id) {
    const { sendPushNotification } = await import('./push');
    await sendPushNotification(c.env, recipient_id, {
      title: '💬 Nouveau message privé',
      body: content.substring(0, 100),
      icon: '/icon-192.png',
      data: {
        url: `/messages/private/${user.userId}`,
        action: 'new_private_message'
      }
    });
  }
});

// 2. Dans src/routes/tickets.ts - Changement statut
app.put('/api/tickets/:id', authMiddleware, async (c) => {
  // ... update ticket ...
  
  // Si statut changé, notifier le technicien assigné
  if (body.status && body.status !== existingTicket.status) {
    const { sendPushNotification } = await import('./push');
    await sendPushNotification(c.env, existingTicket.assigned_to, {
      title: '📊 Statut ticket modifié',
      body: `Ticket #${existingTicket.ticket_id}: ${body.status}`,
      icon: '/icon-192.png',
      data: {
        url: `/tickets/${id}`,
        ticketId: id,
        action: 'ticket_status_changed',
        newStatus: body.status
      }
    });
  }
});

// 3. Dans src/routes/alerts.ts - Ticket en retard
// Modifier pour envoyer PUSH en plus du message privé
const { sendPushNotification } = await import('./push');
await sendPushNotification(c.env, admin.id, {
  title: '⚠️ ALERTE RETARD',
  body: `Ticket #${ticket.ticket_id} - ${delayText}`,
  icon: '/icon-192.png',
  badge: '/badge-72.png',
  data: {
    url: `/tickets/${ticket.id}`,
    ticketId: ticket.id,
    action: 'ticket_overdue',
    urgency: 'high'
  }
});
```

---

### **Option B : Server-Sent Events (SSE) pour Notifications In-App**

**Difficulté** : 🟡 Moyen (6-8 heures)  
**Impact** : 🔵 Élevé (notifications temps réel dans l'interface)  
**Coût tokens** : ~30,000

**Cas d'usage** :
- Notifications **in-app** (badge rouge, popup)
- Mises à jour **temps réel** du tableau Kanban
- Compteur de messages non lus **live**
- Présence utilisateur (qui est en ligne)

**Architecture SSE** :

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND                                │
│                                                             │
│  const eventSource = new EventSource('/api/sse/stream');   │
│                                                             │
│  eventSource.onmessage = (event) => {                      │
│    const data = JSON.parse(event.data);                   │
│    if (data.type === 'new_message') {                     │
│      updateMessageBadge(data.count);                      │
│    }                                                        │
│  };                                                         │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │ HTTP Streaming
                           │
┌──────────────────────────┼─────────────────────────────────┐
│                    BACKEND                                  │
│                                                             │
│  GET /api/sse/stream (authMiddleware)                     │
│  - Maintient connexion HTTP ouverte                        │
│  - Envoie événements au format SSE                         │
│  - Heartbeat toutes les 30s                                │
│                                                             │
│  POST /api/sse/broadcast                                   │
│  - Diffuse événement à tous connectés                      │
│  - Ou à un utilisateur spécifique                          │
└─────────────────────────────────────────────────────────────┘
```

**Implémentation** :

```typescript
// src/routes/sse.ts (nouveau fichier)
import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth';
import type { Bindings } from '../types';

const sse = new Hono<{ Bindings: Bindings }>();

// Map pour stocker les connexions actives
// Note: Sur Cloudflare Workers, utilisez Durable Objects pour état partagé
const activeConnections = new Map<number, ReadableStreamDefaultController>();

/**
 * GET /api/sse/stream
 * Établit connexion SSE pour recevoir événements temps réel
 */
sse.get('/stream', authMiddleware, async (c) => {
  const user = c.get('user') as any;
  
  // Créer un stream SSE
  const stream = new ReadableStream({
    start(controller) {
      // Stocker la connexion
      activeConnections.set(user.userId, controller);
      
      // Envoyer message initial
      const data = `data: ${JSON.stringify({
        type: 'connected',
        userId: user.userId,
        timestamp: new Date().toISOString()
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(data));
      
      // Heartbeat toutes les 30s
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
          activeConnections.delete(user.userId);
        }
      }, 30000);
    },
    
    cancel() {
      activeConnections.delete(user.userId);
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
});

/**
 * Fonction helper: Diffuser événement à un utilisateur
 */
export function broadcastToUser(userId: number, event: any) {
  const controller = activeConnections.get(userId);
  if (controller) {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    controller.enqueue(new TextEncoder().encode(data));
  }
}

/**
 * Fonction helper: Diffuser à tous les utilisateurs connectés
 */
export function broadcastToAll(event: any) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  const encoded = new TextEncoder().encode(data);
  
  for (const controller of activeConnections.values()) {
    try {
      controller.enqueue(encoded);
    } catch {
      // Connexion fermée, sera nettoyée au prochain heartbeat
    }
  }
}

export default sse;
```

**Utilisation dans les routes** :

```typescript
// src/routes/messages.ts
import { broadcastToUser } from './sse';

app.post('/', authMiddleware, async (c) => {
  // ... insertion message ...
  
  // Diffuser via SSE au destinataire (notification in-app)
  if (message_type === 'private' && recipient_id) {
    broadcastToUser(recipient_id, {
      type: 'new_message',
      from: user.userId,
      message: content.substring(0, 100),
      timestamp: new Date().toISOString()
    });
  }
  
  // ... rest of code ...
});
```

**Frontend** :

```javascript
// Établir connexion SSE
const eventSource = new EventSource('/api/sse/stream', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'new_message':
      // Afficher badge notification
      updateMessageBadge(+1);
      // Afficher toast in-app
      showToast(`Nouveau message de ${data.from}`);
      break;
      
    case 'ticket_assigned':
      // Rafraîchir le tableau Kanban
      refreshKanbanBoard();
      break;
      
    case 'ticket_status_changed':
      // Déplacer la carte dans la bonne colonne
      moveTicketCard(data.ticketId, data.newStatus);
      break;
  }
});

eventSource.addEventListener('error', (error) => {
  console.error('SSE error:', error);
  // Reconnexion automatique après 5s
  setTimeout(() => {
    eventSource.close();
    // Recréer connexion
  }, 5000);
});
```

---

### **Option C : WebSockets (NON RECOMMANDÉ sur Cloudflare Workers)**

**Difficulté** : 🔴 Difficile  
**Impact** : 🔵 Élevé  
**Coût tokens** : ~50,000  
**⚠️ Limitation** : Cloudflare Workers ne supporte pas WebSockets natifs (nécessite Durable Objects)

---

## 📊 Comparaison des Technologies

| Caractéristique | Push Notifications | Server-Sent Events | WebSockets |
|----------------|-------------------|-------------------|------------|
| **Direction** | Backend → Frontend | Backend → Frontend | Bidirectionnel |
| **Protocole** | HTTP POST | HTTP Streaming | WS Protocol |
| **Connexion** | Fermée (one-shot) | Ouverte (long-polling) | Ouverte (full-duplex) |
| **Offline** | ✅ Oui (TTL 24h) | ❌ Non | ❌ Non |
| **Notification système** | ✅ Oui | ❌ Non (in-app only) | ❌ Non (in-app only) |
| **Complexité** | 🟢 Moyenne | 🟡 Moyenne | 🔴 Élevée |
| **Cloudflare Workers** | ✅ Natif | ✅ Possible | ⚠️ Durable Objects requis |
| **Cas d'usage** | Notifications externes | Updates temps réel in-app | Chat, gaming |
| **Batterie** | 🟢 Économe | 🟡 Modérée | 🔴 Consomme |
| **Implémenté** | ✅ Oui | ❌ Non | ❌ Non |

---

## 🎯 Recommandation

### **Stratégie Hybride Optimale**

```
┌─────────────────────────────────────────────────────────────┐
│              NOTIFICATIONS STRATÉGIE MIXTE                   │
└─────────────────────────────────────────────────────────────┘

📱 PUSH NOTIFICATIONS (Déjà implémenté ✅)
   └─> Événements critiques nécessitant attention immédiate
       • Ticket assigné/réassigné
       • Ticket en retard (alertes)
       • Messages privés urgents
       • Machines en panne critique

🔔 SERVER-SENT EVENTS (À implémenter)
   └─> Mises à jour temps réel dans l'interface
       • Nouveau message (badge compteur)
       • Changement statut ticket (Kanban live)
       • Nouveau commentaire
       • Présence utilisateur (online/offline)

📊 POLLING (Fallback si SSE indisponible)
   └─> Requêtes régulières toutes les 30-60s
       • /api/messages/unread-count
       • /api/tickets (filtered by user)
```

### **Plan d'Implémentation Recommandé**

#### **Phase 1 : Étendre Push Notifications** (2-3h, ~15K tokens)
✅ **Priorité : HAUTE**

1. Nouveau message privé → Push notification
2. Changement statut ticket → Push notification
3. Nouveau commentaire → Push notification
4. Ticket en retard → Push notification (déjà dans alerts.ts, ajouter push en plus)

#### **Phase 2 : Implémenter SSE** (6-8h, ~30K tokens)
✅ **Priorité : MOYENNE**

1. Créer `/api/sse/stream` endpoint
2. Gestion connexions actives (Map ou Durable Objects)
3. Intégrer `broadcastToUser()` dans routes existantes
4. Frontend : EventSource + gestion UI temps réel

#### **Phase 3 : Optimisations** (2-4h, ~10K tokens)
✅ **Priorité : BASSE**

1. Préférences notifications utilisateur (activer/désactiver par type)
2. Mode "Ne pas déranger" (horaires)
3. Historique notifications (UI)
4. Analytics (taux d'ouverture, engagement)

---

## 📚 Documentation Supplémentaire

### **Ressources**

- [Web Push API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)
- [Server-Sent Events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [@block65/webcrypto-web-push](https://github.com/block65/webcrypto-web-push)
- [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/)

### **Fichiers du Projet**

- `src/routes/push.ts` - Implémentation push notifications
- `src/routes/tickets.ts` - Triggers notifications (lignes 234, 389)
- `migrations/XXX_create_push_tables.sql` - Schéma DB push
- `public/sw.js` - Service Worker frontend (si existe)

---

## 💡 Conclusion

**Votre application dispose DÉJÀ d'un système de notifications temps réel fonctionnel via Push Notifications PWA !** 🎉

**Ce qui fonctionne** :
✅ Notifications système (même app fermée)  
✅ Multi-device (desktop + mobile)  
✅ Offline-capable (TTL 24h)  
✅ Sécurisé (VAPID + JWT)  
✅ Fiable (retry logic + logs)

**Ce qui existe déjà en temps réel** :
✅ Compteur messages non lus (GET /api/messages/unread-count)  
✅ Badge rouge pulsant dans header  
✅ Compteur par conversation  
✅ Rafraîchissement automatique après actions  

**Ce qui pourrait être ajouté** :
- ✨ Push notifications pour nouveaux messages (pas encore implémenté)
- ✨ Server-Sent Events pour badge temps réel sans polling
- ✨ Plus d'événements déclencheurs (statuts tickets, alertes)
- ✨ Préférences utilisateur (types notifications, horaires)

**Prochaine étape recommandée** : **Phase 1 - Étendre les événements push** (facile, impact immédiat, 2-3h).

---

**Dernière mise à jour** : 17 janvier 2025  
**Version** : v2.6.0
