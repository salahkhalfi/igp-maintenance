# 🔍 Diagnostic - Push Notification lors d'Assignation de Ticket

**Date**: 2025-11-18 20:45 UTC  
**Problème Rapporté**: "J'ai assigné un ticket à Laurent mais j'ai pas de push notification"  
**Ticket Concerné**: #34 - "deuxieme technicien" (IGP-THERMOS-TH-2000 PRO-20251115-263)

---

## ❌ **CAUSE IDENTIFIÉE**

### **Le ticket était déjà assigné à Laurent**

**Historique du Ticket #34**:
```
2025-11-15 10:22:xx  → Ticket créé et assigné à Laurent (ID: 2)
2025-11-16 06:31:55  → Changements de statut multiples
2025-11-16 06:32:42  → ...
2025-11-16 06:32:45  → ...
2025-11-16 06:35:20  → Mise à jour
2025-11-16 06:59:13  → Mise à jour
2025-11-16 08:41:23  → Changement de statut: diagnostic → in_progress
2025-11-16 11:09:39  → Changement de statut: in_progress → received
2025-11-17 10:48:23  → Mise à jour
2025-11-18 20:18:47  → Mise à jour
2025-11-18 20:37:58  → Mise à jour (votre action)
```

**Assigned_to**: 2 (Laurent) depuis la création du ticket

---

## 📋 **COMPORTEMENT ACTUEL DU CODE**

### Code d'Assignation avec Push (`src/routes/tickets.ts`, ligne 320-337)

```typescript
// Envoyer notification push si ticket assigné à un technicien (fail-safe)
if (body.assigned_to && body.assigned_to !== currentTicket.assigned_to) {
  try {
    const { sendPushNotification } = await import('./push');
    const pushResult = await sendPushNotification(c.env, body.assigned_to, {
      title: '🔧 Nouveau ticket assigné',
      body: `Ticket #${currentTicket.ticket_id}: ${currentTicket.title}`,
      icon: '/icon-192.png',
      data: { ticketId: id, url: '/' }
    });

    if (pushResult.success) {
      console.log(`✅ Push notification sent for ticket ${id} to user ${body.assigned_to}`);
    }
  } catch (pushError) {
    console.error('⚠️ Push notification failed (non-critical):', pushError);
  }
}
```

### **Conditions pour envoyer la notification**:
1. ✅ `body.assigned_to` existe (quelqu'un est assigné)
2. ❌ `body.assigned_to !== currentTicket.assigned_to` (l'assignation **doit changer**)

**Dans votre cas**:
- `body.assigned_to` = 2 (Laurent)
- `currentTicket.assigned_to` = 2 (Laurent)
- **Résultat**: 2 !== 2 = **FALSE** → Pas de notification envoyée

---

## 📊 **HISTORIQUE DES PUSH DE LAURENT**

**Dernières Notifications Réussies**:
- **2025-11-15 10:26:52** → Ticket #36 assigné ✅ SUCCESS
- **2025-11-15 10:22:28** → Ticket #35 assigné ✅ SUCCESS
- **2025-11-14 18:34:07** → Ticket #30 assigné ✅ SUCCESS

**Notifications Échouées** (2025-11-14):
- Tickets #28, #29, #32, #33 → Failed (Laurent n'avait pas encore de souscription push active)

**Conclusion**: Le système push fonctionne correctement quand l'assignation **change réellement**.

---

## ✅ **SOLUTIONS PROPOSÉES**

### **Option 1: Forcer l'envoi même si déjà assigné** (RECOMMANDÉ)

**Modification du code** pour envoyer une notification à chaque assignation manuelle, même si déjà assigné:

```typescript
// Envoyer notification push si ticket assigné à un technicien
if (body.assigned_to) {
  // Vérifier si c'est une ré-assignation manuelle ou une nouvelle assignation
  const isReassignment = body.assigned_to === currentTicket.assigned_to;
  
  try {
    const { sendPushNotification } = await import('./push');
    const pushResult = await sendPushNotification(c.env, body.assigned_to, {
      title: isReassignment ? '🔔 Rappel: Ticket toujours assigné' : '🔧 Nouveau ticket assigné',
      body: `Ticket #${currentTicket.ticket_id}: ${currentTicket.title}`,
      icon: '/icon-192.png',
      data: { ticketId: id, url: '/', isReassignment }
    });

    if (pushResult.success) {
      console.log(`✅ Push notification sent for ticket ${id} to user ${body.assigned_to} (reassignment: ${isReassignment})`);
    }
  } catch (pushError) {
    console.error('⚠️ Push notification failed (non-critical):', pushError);
  }
}
```

**Avantages**:
- ✅ Envoie toujours une notification lors d'une action manuelle d'assignation
- ✅ Distingue entre nouvelle assignation et rappel
- ✅ Utile pour rappeler à un technicien un ticket en attente

**Inconvénient**:
- ⚠️ Peut générer des notifications "spam" si vous réassignez fréquemment le même ticket

---

### **Option 2: Ajouter un bouton "Rappeler le technicien"** (ALTERNATIVE)

Au lieu de modifier le comportement d'assignation, ajouter un bouton dédié pour envoyer un rappel:

```typescript
// POST /api/tickets/:id/remind
tickets.post('/:id/remind', async (c) => {
  const user = c.get('user') as any;
  const id = c.req.param('id');
  
  const ticket = await c.env.DB.prepare(
    'SELECT * FROM tickets WHERE id = ?'
  ).bind(id).first() as any;
  
  if (!ticket || !ticket.assigned_to) {
    return c.json({ error: 'Ticket non assigné' }, 400);
  }
  
  const { sendPushNotification } = await import('./push');
  const pushResult = await sendPushNotification(c.env, ticket.assigned_to, {
    title: '🔔 Rappel de ticket',
    body: `Ticket #${ticket.ticket_id}: ${ticket.title}`,
    icon: '/icon-192.png',
    data: { ticketId: id, url: '/', isReminder: true }
  });
  
  return c.json({ success: pushResult.success, sentCount: pushResult.sentCount });
});
```

**Avantages**:
- ✅ Action explicite et claire
- ✅ Pas de confusion avec les assignations normales
- ✅ Traçabilité des rappels

---

### **Option 3: Garder le comportement actuel** (STATUS QUO)

Ne rien changer et accepter que les notifications ne sont envoyées que lors de **nouvelles assignations**.

**Workflow recommandé**:
1. Désassigner le ticket (assigner à "Équipe" ou null)
2. Réassigner à Laurent
3. La notification sera envoyée

**Avantages**:
- ✅ Évite le spam de notifications
- ✅ Notifications uniquement pour les changements réels

**Inconvénient**:
- ❌ Processus en 2 étapes pour forcer un rappel

---

## 🎯 **RECOMMANDATION**

### **Implémenter l'Option 1 avec un flag `force_notify`**

```typescript
if (body.assigned_to && (body.assigned_to !== currentTicket.assigned_to || body.force_notify)) {
  const isReassignment = body.assigned_to === currentTicket.assigned_to;
  
  // ... envoyer notification
}
```

**Utilisation**:
- Assignation normale → Notification uniquement si changement
- Assignation avec `force_notify: true` → Notification systématique (rappel)

**Meilleur compromis** entre flexibilité et prévention du spam.

---

## 📝 **TEST POUR VÉRIFIER LE FIX**

Après avoir implémenté une solution:

```bash
# 1. Assigner un ticket à Laurent
curl -X PATCH https://production-url/api/tickets/34 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"assigned_to": 2, "force_notify": true}'

# 2. Vérifier les logs push
npx wrangler d1 execute maintenance-db --remote \
  --command="SELECT * FROM push_logs WHERE user_id = 2 ORDER BY created_at DESC LIMIT 5"

# 3. Vérifier que Laurent a bien reçu la notification
# (Demander à Laurent de vérifier son navigateur)
```

---

## 💡 **CONCLUSION**

**Problème**: Le ticket #34 était déjà assigné à Laurent depuis le 15 novembre. Votre action du 18 novembre à 20:37:58 n'a pas changé l'assignation, donc aucune notification n'a été envoyée.

**Le système fonctionne comme prévu** selon la logique actuelle : "Notifier uniquement lors d'un **changement** d'assignation".

**Solution immédiate**: Pour tester si Laurent reçoit bien les notifications, assignez-lui un **nouveau ticket** ou **désassignez puis réassignez** le ticket #34.

**Solution permanente**: Implémenter l'Option 1 avec le flag `force_notify` pour permettre des rappels volontaires.
