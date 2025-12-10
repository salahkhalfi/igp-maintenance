# 📱 Push Notifications d'Expiration - Destinataires

**Date:** 2025-11-26  
**Fichier source:** `src/routes/cron.ts`

---

## 🎯 Question

**"À qui sont envoyés les push d'expiration ?"**

---

## ✅ Réponse Courte

Les notifications d'expiration de tickets sont envoyées à **DEUX groupes** :

1. **Le technicien assigné au ticket** (push immédiat avec déduplication 5 minutes)
2. **TOUS les administrateurs** (push avec déduplication 24 heures)

---

## 📊 Détails Complets

### 1️⃣ Technicien Assigné

**Qui reçoit?**
- L'utilisateur désigné dans `tickets.assigned_to`
- Un seul destinataire par ticket

**Quand?**
- Dès que le ticket dépasse sa `scheduled_date`
- CRON vérifie toutes les 1 minute

**Déduplication:**
```sql
-- Fenêtre de 5 minutes pour éviter doublons
SELECT id FROM push_logs
WHERE user_id = ? AND ticket_id = ?
  AND datetime(created_at) >= datetime('now', '-5 minutes')
```

**Raison déduplication 5 min:**
- Évite doublon si ticket créé déjà expiré
- Ticket créé → Push immédiat (tickets.ts)
- 1 minute après → CRON détecte expiration → Skip car push récent

**Format notification:**
```
🔴 ${userName}, ticket expiré
Exemple: "🔴 Jean, ticket expiré"

Body:
CNC-1125-0042: Problème de refroidissement - Retard 2h 35min
```

**Code source (ligne 189-244):**
```typescript
// Récupérer le nom de l'utilisateur assigné
const assignedUser = await c.env.DB.prepare(
  'SELECT first_name FROM users WHERE id = ?'
).bind(ticket.assigned_to).first();

const userName = assignedUser?.first_name || 'Technicien';

const pushResult = await sendPushNotification(c.env, ticket.assigned_to, {
  title: `🔴 ${userName}, ticket expiré`,
  body: `${ticket.ticket_id}: ${ticket.title} - Retard ${overdueText}`,
  icon: '/icon-192.png',
  badge: '/icon-192.png',
  data: { 
    ticketId: ticket.id, 
    ticket_id: ticket.ticket_id,
    type: 'overdue',
    action: 'view_ticket',
    url: `/?ticket=${ticket.id}` 
  }
});
```

---

### 2️⃣ Tous les Administrateurs

**Qui reçoit?**
```sql
SELECT id, first_name FROM users WHERE role = 'admin'
```
- **TOUS** les utilisateurs avec rôle `admin`
- Notification envoyée à chaque admin individuellement

**Quand?**
- Même moment que le technicien assigné
- Pour chaque ticket expiré détecté

**Déduplication:**
```sql
-- Fenêtre de 24 heures pour éviter spam admins
SELECT id FROM push_logs
WHERE user_id = ? AND ticket_id = ?
  AND datetime(created_at) >= datetime('now', '-24 hours')
```

**Raison déduplication 24h:**
- Évite spam des admins pour même ticket
- Admin déjà notifié = pas besoin de re-notifier
- Si ticket toujours pas résolu après 24h → nouvelle notification

**Format notification:**
```
⚠️ ${adminName}, ticket expiré
Exemple: "⚠️ Marc, ticket expiré"

Body:
CNC-1125-0042: Problème de refroidissement - Retard 2h 35min
```

**Données supplémentaires:**
```javascript
data: {
  ticketId: ticket.id,
  ticket_id: ticket.ticket_id,
  action: 'view_ticket',
  url: `/?ticket=${ticket.id}`,
  overdue_cron: true,          // Flag spécifique CRON
  priority: ticket.priority,    // Priorité pour triage
  assignedTo: ticket.assigned_to // Savoir qui est assigné
}
```

**Code source (ligne 247-332):**
```typescript
// Récupérer tous les administrateurs
const { results: admins } = await c.env.DB.prepare(`
  SELECT id, first_name FROM users WHERE role = 'admin'
`).all();

if (admins && admins.length > 0) {
  console.log(`🔔 CRON: Envoi push aux ${admins.length} admin(s)`);
  
  // Envoyer à chaque admin
  for (const admin of admins as any[]) {
    // Vérifier déduplication 24h
    const existingAdminPush = await c.env.DB.prepare(`
      SELECT id FROM push_logs
      WHERE user_id = ? AND ticket_id = ?
        AND datetime(created_at) >= datetime('now', '-24 hours')
    `).bind(admin.id, ticket.id).first();

    if (existingAdminPush) {
      console.log(`⏭️ CRON: Push déjà envoyé à admin ${admin.id}`);
      continue;
    }

    const adminName = admin.first_name || 'Admin';
    
    const adminPushResult = await sendPushNotification(c.env, admin.id, {
      title: `⚠️ ${adminName}, ticket expiré`,
      body: `${ticket.ticket_id}: ${ticket.title} - Retard ${overdueText}`,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: {
        ticketId: ticket.id,
        ticket_id: ticket.ticket_id,
        action: 'view_ticket',
        url: `/?ticket=${ticket.id}`,
        overdue_cron: true,
        priority: ticket.priority,
        assignedTo: ticket.assigned_to
      }
    });
  }
}
```

---

## 📋 Exemple Concret

### Scénario
```
Ticket: CNC-1125-0042
Titre: Problème de refroidissement
Assigné à: Jean (ID: 9, technicien)
Scheduled date: 2025-11-26 14:00 (UTC)
Date actuelle: 2025-11-26 16:35 (UTC)
Retard: 2h 35min
```

### Qui reçoit les push?

#### 1. Jean (Technicien assigné)
```
Notification:
🔴 Jean, ticket expiré
CNC-1125-0042: Problème de refroidissement - Retard 2h 35min

Déduplication: 5 minutes
Prochaine notification si toujours expiré: 2025-11-26 16:40
```

#### 2. Tous les Admins

**Admin #1 - Administrateur (ID: 1)**
```
Notification:
⚠️ Administrateur, ticket expiré
CNC-1125-0042: Problème de refroidissement - Retard 2h 35min

Déduplication: 24 heures
Prochaine notification: 2025-11-27 16:35
```

**Admin #2 - Marc (ID: 5)**
```
Notification:
⚠️ Marc, ticket expiré
CNC-1125-0042: Problème de refroidissement - Retard 2h 35min

Déduplication: 24 heures
Prochaine notification: 2025-11-27 16:35
```

**Admin #3 - Salah (ID: 11)**
```
Notification:
⚠️ Salah, ticket expiré
CNC-1125-0042: Problème de refroidissement - Retard 2h 35min

Déduplication: 24 heures
Prochaine notification: 2025-11-27 16:35
```

### Total Notifications pour ce Ticket
```
1 technicien + 3 admins = 4 notifications push envoyées
```

---

## 📊 Utilisateurs Actuels Recevant Push Expiration

### Base de Données Production

**Admins avec Push Activé:**
1. ✅ **Administrateur** (ID: 1) - 3 appareils
2. ❌ **Marc Belanger** (ID: 5) - Aucune subscription
3. ✅ **Salah** (ID: 11) - 1 appareil

**Techniciens avec Push Activé:**
1. ✅ **Deuxieme** (ID: 9) - 1 appareil

### Exemple Réel

**Si ticket expiré assigné à Deuxieme (ID: 9):**
```
Push envoyés:
1. 🔴 Deuxieme, ticket expiré (technicien assigné)
2. ⚠️ Administrateur, ticket expiré (admin 1)
3. ⚠️ Marc, ticket expiré (admin 5) - ❌ PAS REÇU (pas de subscription)
4. ⚠️ Salah, ticket expiré (admin 11)

Total reçus: 3/4 (75%)
Raison échec: Marc n'a pas activé push
```

---

## 🔄 Workflow Complet

### 1. Déclenchement CRON (chaque minute)
```
1. Cloudflare Cron Trigger appelle /api/cron/check-overdue
2. Vérification CRON_SECRET token (sécurité)
3. Requête SQL cherche tickets expirés:
   - assigned_to NOT NULL
   - scheduled_date < NOW
   - status NOT IN (completed, archived)
```

### 2. Pour Chaque Ticket Expiré
```
A. Envoi webhook email (Pabbly Connect)
B. Push au technicien assigné (déduplication 5 min)
C. Push à tous les admins (déduplication 24h par admin)
```

### 3. Logging
```sql
-- Chaque push loggé dans push_logs
INSERT INTO push_logs (user_id, ticket_id, status, error_message)
VALUES (?, ?, 'success'/'failed', ?)

-- Permet audit et troubleshooting
```

---

## ❓ Questions Fréquentes

### Q: Pourquoi les admins reçoivent-ils aussi les notifications?

**R:** Pour supervision et visibilité managériale:
- Admins doivent savoir si tickets traînent
- Permet escalation si technicien ne répond pas
- Dashboard mental du management

### Q: Pourquoi déduplication 24h pour admins vs 5 min pour technicien?

**R:** Différents objectifs:
- **Technicien (5 min):** Éviter doublon création + cron immédiat
- **Admins (24h):** Éviter spam, une alerte par jour suffit

### Q: Si admin est aussi assigné au ticket?

**R:** Reçoit **DEUX notifications**:
1. En tant que technicien assigné (🔴 emoji)
2. En tant qu'admin (⚠️ emoji)

### Q: Si `assigned_to = 0` (Toute l'équipe)?

**R:** 
- Push technicien essaye d'envoyer à user_id 0
- User 0 = compte système, aucune subscription
- **Seuls les admins reçoivent** la notification

### Q: Comment désactiver notifications admins?

**R:** Deux options:
1. **Par admin:** Clic bouton push (vert → rouge)
2. **Global:** Commenter code ligne 247-332 dans cron.ts

### Q: Logs pour voir qui a reçu?

**R:**
```sql
-- Voir derniers push expiration (production)
SELECT 
  pl.id,
  pl.user_id,
  u.first_name,
  u.role,
  pl.ticket_id,
  t.ticket_id as ticket_code,
  pl.status,
  pl.created_at
FROM push_logs pl
JOIN users u ON pl.user_id = u.id
JOIN tickets t ON pl.ticket_id = t.id
WHERE pl.created_at > datetime('now', '-24 hours')
ORDER BY pl.created_at DESC
LIMIT 20;
```

---

## 📈 Statistiques Production (26 Nov 2025)

### Logs Récents (16:30)
```
ID  | User | Nom            | Statut  | Ticket
----|------|----------------|---------|-------
131 | 11   | Salah (admin)  | success | -
130 | 5    | Marc (admin)   | failed  | - (pas de subscription)
129 | 1    | Admin          | success | -
```

### Taux de Succès
```
Techniciens: 100% (si subscription active)
Admins: 66% (2/3 reçoivent, Marc n'a pas activé)
Global: 75% (3/4 notifications reçues)
```

---

## ✅ Résumé

| Aspect | Détails |
|--------|---------|
| **Destinataires** | 1 technicien + N admins |
| **Déduplication technicien** | 5 minutes |
| **Déduplication admins** | 24 heures |
| **Emoji technicien** | 🔴 |
| **Emoji admins** | ⚠️ |
| **Fréquence CRON** | Chaque minute |
| **Condition** | `scheduled_date < NOW` |
| **Logging** | `push_logs` table |

**En production actuellement:**
- 1 technicien actif (Deuxieme)
- 2 admins actifs (Administrateur, Salah)
- 1 admin inactif (Marc - à activer)

---

**Pour activer les notifications:**
1. Se connecter sur https://mecanique.igpglass.ca
2. Cliquer sur le bouton push (🔴 → 🟢)
3. Autoriser les notifications dans le navigateur
4. Si Android Chrome: Installer l'app en PWA

**Fichier source:** `src/routes/cron.ts` (lignes 189-332)
