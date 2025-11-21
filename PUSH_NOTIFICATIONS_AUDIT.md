# 📱 Audit Complet: Système Push Notifications

**Date**: 2025-11-21  
**Objectif**: Vérifier que TOUS les cas d'usage push notifications sont implémentés correctement et sans conflit

---

## 📋 Cas d'Usage Identifiés

### **CAS 1: Ticket Créé avec Assignation** 
**Fichier**: `src/routes/tickets.ts` (lignes 179-216)  
**Trigger**: POST /api/tickets (création)  
**Condition**: `assigned_to` est défini (technicien ou équipe)

**Code Actuel**:
```typescript
if (assigned_to) {
  const pushResult = await sendPushNotification(c.env, assigned_to, {
    title: `🔧 ${title}`,
    body: `Nouveau ticket assigné`,
    icon: '/icon-192.png',
    data: { ticketId, url: '/' }
  });
}
```

**État**: ✅ **IMPLÉMENTÉ**
- ✅ Envoie push au technicien assigné
- ✅ Log dans push_logs
- ✅ Gestion erreurs (non-bloquant)
- ✅ Fonctionne AVEC ou SANS scheduled_date

**Test**: Créer ticket avec assigned_to → Push reçue immédiatement

---

### **CAS 2: Ticket Expire (scheduled_date dépassée)**
**Fichier**: `src/routes/cron.ts` (lignes 151-185)  
**Trigger**: CRON externe (toutes les 5 minutes)  
**Condition**: `scheduled_date < now` ET statut 'received'/'diagnostic'

**Code Actuel**:
```typescript
// APRÈS vérification scheduled_date_notified
const pushResult = await sendPushNotification(c.env, ticket.assigned_to, {
  title: `🔴 Ticket Expiré`,
  body: `${ticket.title} - En retard de ${overdueText}`,
  icon: '/icon-192.png',
  badge: '/icon-192.png',
  data: { 
    ticketId: ticket.id, 
    ticket_id: ticket.ticket_id,
    type: 'overdue',
    url: '/' 
  }
});
```

**État**: ✅ **IMPLÉMENTÉ** (fix récent commit 51186b6)
- ✅ Envoie push au technicien assigné
- ✅ Log dans push_logs
- ✅ Vérifie scheduled_date_notified (évite doublons)
- ✅ Gestion erreurs (non-bloquant)

**Test**: Modifier scheduled_date vers passé → Attendre 5 min → Push reçue

---

### **CAS 3: Réassignation Ticket (changement assigned_to)**
**Fichier**: `src/routes/tickets.ts` (lignes 319-337)  
**Trigger**: PATCH /api/tickets/:id (modification)  
**Condition**: `body.assigned_to !== currentTicket.assigned_to`

**Code Actuel**:
```typescript
if (body.assigned_to && body.assigned_to !== currentTicket.assigned_to) {
  const pushResult = await sendPushNotification(c.env, body.assigned_to, {
    title: `🔧 ${currentTicket.title}`,
    body: `Ticket réassigné`,
    icon: '/icon-192.png',
    data: { ticketId: id, url: '/' }
  });
}
```

**État**: ✅ **IMPLÉMENTÉ**
- ✅ Envoie push au NOUVEAU technicien
- ✅ Gestion erreurs (non-bloquant)
- ❌ **MANQUE**: Log dans push_logs

**Test**: Changer assigned_to d'un ticket → Push reçue par nouveau tech

---

### **CAS 4a: Message Privé Texte**
**Fichier**: `src/routes/messages.ts` (lignes 34-66)  
**Trigger**: POST /api/messages (message_type='private')  
**Condition**: `message_type === 'private' && recipient_id`

**Code Actuel**:
```typescript
if (message_type === 'private' && recipient_id) {
  await sendPushNotification(c.env, recipient_id, {
    title: `💬 ${senderName}`,
    body: content.substring(0, 97) + '...',  // Max 100 chars
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: {
      url: '/',
      action: 'new_private_message',
      senderId: user.userId,
      senderName: senderName,
      messageId: result.meta.last_row_id
    }
  });
}
```

**État**: ✅ **IMPLÉMENTÉ**
- ✅ Envoie push au destinataire
- ✅ Affiche aperçu message (100 chars max)
- ✅ Gestion erreurs (non-bloquant)
- ❌ **MANQUE**: Log dans push_logs

**Test**: Envoyer message privé → Destinataire reçoit push

---

### **CAS 4b: Message Privé Audio**
**Fichier**: `src/routes/messages.ts` (lignes 157-192)  
**Trigger**: POST /api/messages/upload-audio (message_type='private')  
**Condition**: `messageType === 'private' && recipientId`

**Code Actuel**:
```typescript
if (messageType === 'private' && recipientId) {
  await sendPushNotification(c.env, parseInt(recipientId), {
    title: `🎤 ${senderName}`,
    body: `Message vocal (${durationText})`,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: {
      url: '/',
      action: 'new_audio_message',
      senderId: user.userId,
      senderName: senderName,
      messageId: result.meta.last_row_id,
      audioKey: fileKey,
      duration: duration
    }
  });
}
```

**État**: ✅ **IMPLÉMENTÉ**
- ✅ Envoie push au destinataire
- ✅ Affiche durée audio
- ✅ Gestion erreurs (non-bloquant)
- ❌ **MANQUE**: Log dans push_logs

**Test**: Envoyer message audio privé → Destinataire reçoit push

---

## 🔍 Analyse des Conflits Potentiels

### **Conflit 1: Ticket Créé + Expire Immédiatement** ❌ POSSIBLE
**Scénario**: 
1. Créer ticket avec `scheduled_date` dans le passé
2. Push envoyée: "Nouveau ticket assigné" (CAS 1)
3. CRON tourne 5 min plus tard
4. Push envoyée: "Ticket Expiré" (CAS 2)

**Résultat**: ✅ **PAS DE CONFLIT - COMPORTEMENT CORRECT**
- Première push: Informe de l'assignation
- Deuxième push: Alerte qu'il est déjà en retard
- **Les deux notifications sont pertinentes**

---

### **Conflit 2: Réassignation + Expiration** ❌ POSSIBLE
**Scénario**:
1. Ticket assigné à User A, scheduled_date passée
2. CRON envoie push "Expiré" à User A
3. Ticket réassigné à User B
4. Push envoyée: "Ticket réassigné" à User B (CAS 3)
5. CRON re-tourne...
6. ❓ Push "Expiré" envoyée à User B?

**Analyse**: 
- ✅ **PAS DE CONFLIT** grâce à `scheduled_date_notified`
- Si scheduled_date ne change pas, CRON ne re-envoie pas
- Si scheduled_date change, nouvelle notification justifiée

---

### **Conflit 3: Messages Multiples Rapides** ⚠️ POTENTIEL
**Scénario**:
1. User A envoie 5 messages privés rapides à User B
2. Push envoyée pour chaque message (CAS 4a × 5)
3. User B reçoit 5 notifications rapides

**Analyse**:
- ⚠️ **Pas vraiment un conflit, mais peut être gênant**
- Les OS modernes groupent les notifications
- **Acceptable** car chaque message mérite sa notification

---

## ⚠️ Problèmes Identifiés

### **Problème 1: Logs Manquants**
**Impact**: Moyen  
**Fichiers Affectés**:
- `tickets.ts` ligne 319-337 (réassignation)
- `messages.ts` ligne 34-66 (message texte)
- `messages.ts` ligne 157-192 (message audio)

**Description**: Ces 3 cas n'enregistrent PAS dans `push_logs`

**Conséquence**:
- ❌ Impossible de tracer échecs push pour ces cas
- ❌ Impossible de débugger problèmes utilisateurs
- ❌ Pas de statistiques complètes

**Priorité**: 🔴 **HIGH** - Devrait être corrigé pour cohérence

---

### **Problème 2: Pas de Push pour Ancien Assigné**
**Impact**: Faible  
**Fichier**: `tickets.ts` ligne 319-337

**Scénario**:
- Ticket assigné à User A
- Réassigné à User B
- User A ne reçoit AUCUNE notification

**Analyse**:
- ⚠️ User A ne sait pas que le ticket lui a été retiré
- 🤔 Peut-être volontaire? (ne pas spammer)
- 💡 **Suggestion**: Optionnel selon besoin métier

---

## ✅ Points Forts du Système

### **1. Gestion Erreurs Robuste**
```typescript
catch (pushError) {
  // Non-bloquant: si push échoue, l'opération principale réussit quand même
  console.error('Push failed (non-critical):', pushError);
}
```
✅ Aucune opération critique ne dépend des push notifications

### **2. Retry Logic dans sendPushNotification**
```typescript
// 3 tentatives avec backoff exponentiel
for (let attempt = 0; attempt < 3; attempt++) {
  // ... envoi push ...
  if (success) break;
  await sleep(1000 * Math.pow(2, attempt)); // 1s, 2s
}
```
✅ Gère les échecs temporaires réseau

### **3. Nettoyage Tokens Expirés**
```typescript
// Si 410 Gone, supprimer subscription
if (error.statusCode === 410) {
  await DB.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?')
}
```
✅ Base de données propre automatiquement

### **4. Vérification Duplicate (CRON)**
```typescript
// Vérifie scheduled_date_notified
WHERE scheduled_date_notified = ?
```
✅ Évite spam notifications pour même scheduled_date

---

## 📊 Tableau Récapitulatif

| Cas | Trigger | Fichier | Implémenté | Logs | Priorité | État |
|-----|---------|---------|------------|------|----------|------|
| **Ticket créé** | POST /tickets | tickets.ts:179 | ✅ | ✅ | 🔴 HIGH | ✅ OK |
| **Ticket expire** | CRON /check-overdue | cron.ts:151 | ✅ | ✅ | 🔴 HIGH | ✅ OK |
| **Réassignation** | PATCH /tickets/:id | tickets.ts:319 | ✅ | ❌ | 🟡 MED | ⚠️ Logs manquants |
| **Message texte** | POST /messages | messages.ts:34 | ✅ | ❌ | 🟡 MED | ⚠️ Logs manquants |
| **Message audio** | POST /upload-audio | messages.ts:157 | ✅ | ❌ | 🟡 MED | ⚠️ Logs manquants |

---

## 🎯 Recommandations

### **Priorité 1: Ajouter Logs Manquants** 🔴
Ajouter `INSERT INTO push_logs` pour:
- Réassignation ticket (tickets.ts:319-337)
- Message texte privé (messages.ts:34-66)
- Message audio privé (messages.ts:157-192)

**Impact**: Traçabilité complète + debugging facilité

### **Priorité 2: Documenter Comportement** 🟡
Clarifier si les comportements suivants sont voulus:
- Ancien assigné ne reçoit pas notification lors réassignation
- Messages multiples = notifications multiples (pas de groupement)

### **Priorité 3: Monitoring** 🟢
Créer dashboard pour:
- Taux de succès push par cas d'usage
- Appareils avec échecs répétés
- Tokens expirés à nettoyer

---

## ✅ Conclusion

### **Système Globalement Robuste**
- ✅ Tous les cas d'usage principaux couverts
- ✅ Gestion erreurs non-bloquante
- ✅ Retry logic efficace
- ✅ Pas de conflits majeurs identifiés

### **Améliorations Recommandées**
1. 🔴 **Ajouter logs manquants** (réassignation + messages)
2. 🟡 **Tester scenarios edge cases** (ex: réassignations multiples rapides)
3. 🟢 **Monitoring dashboard** (taux succès, échecs)

### **Verdict Final**
**Le système est fonctionnel et logique**. Les seuls problèmes sont:
- Logs manquants dans 3 cas (non-critique)
- Pas de notification à l'ancien assigné (peut-être voulu)

**Aucun conflit bloquant détecté.** ✅

---

## 🧪 Plan de Test Suggéré

1. **Ticket Créé**: 
   - [ ] Avec assigned_to (avec scheduled_date)
   - [ ] Avec assigned_to (sans scheduled_date)
   - [ ] Vérifier push reçue immédiatement

2. **Ticket Expire**:
   - [ ] Modifier scheduled_date → passé
   - [ ] Attendre 5 minutes (CRON)
   - [ ] Vérifier push "🔴 Ticket Expiré"

3. **Réassignation**:
   - [ ] Changer assigned_to
   - [ ] Vérifier nouveau tech reçoit push
   - [ ] Vérifier ancien tech ne reçoit rien

4. **Messages Privés**:
   - [ ] Envoyer message texte → Push reçue
   - [ ] Envoyer message audio → Push reçue
   - [ ] Vérifier aperçu contenu correct

5. **Edge Cases**:
   - [ ] Ticket créé + expire immédiatement
   - [ ] Réassignation multiple rapide
   - [ ] Messages multiples rapides
