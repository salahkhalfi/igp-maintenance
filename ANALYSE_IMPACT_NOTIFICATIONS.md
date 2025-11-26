# Analyse d'Impact - UNIQUE Constraint et Retry sur Notifications

**Date:** 26 novembre 2025  
**Objectif:** Vérifier l'impact de UNIQUE constraint + retry logic sur le système de notifications

---

## 🔍 Analyse du Flux Actuel

### Flux de Création de Ticket (tickets.ts)

```typescript
// 1. Génération ticket_id
const ticket_id = await generateTicketId(c.env.DB, machine.machine_type);

// 2. Insertion ticket
INSERT INTO tickets (ticket_id, ...) VALUES (?, ...)

// 3. Récupération ticket créé
SELECT * FROM tickets WHERE ticket_id = ?

// 4. Timeline
INSERT INTO ticket_timeline (ticket_id, ...)

// 5. Notification push SI assigned_to existe
if (assigned_to) {
  try {
    const pushResult = await sendPushNotification(...);
    INSERT INTO push_logs (user_id, ticket_id, status, ...)
  } catch (pushError) {
    INSERT INTO push_logs (user_id, ticket_id, status='failed', ...)
    // Non-critique, le webhook prendra le relais
  }
}

// 6. Retour au client
return c.json({ ticket: newTicket }, 201);
```

### Points Clés Identifiés

1. **Notification = Optionnelle**
   - `if (assigned_to)` → Seulement si ticket assigné dès la création
   - Erreur push = Non bloquante (catch + log)

2. **Webhook Pabbly = Backup**
   - Commentaire ligne 217: "le webhook Pabbly prendra le relais"
   - System de fallback déjà en place

3. **Push Logs = Après ticket créé**
   - `push_logs` référence `ticket_id` (clé étrangère)
   - Si ticket échoue, push_logs n'est jamais créé → OK

---

## ⚠️ Scénario Problématique (AVANT Corrections)

### Cas 1: Race Condition SANS UNIQUE Constraint

```
Thread A:
  1. generateTicketId() → CNC-1125-0001
  2. INSERT INTO tickets → ✅ SUCCESS
  3. INSERT INTO push_logs → ✅ SUCCESS
  4. sendPushNotification() → ✅ Notification envoyée

Thread B (simultané):
  1. generateTicketId() → CNC-1125-0001 (même ID!)
  2. INSERT INTO tickets → ✅ SUCCESS (pas de constraint!)
  3. Maintenant 2 tickets avec même ticket_id ❌
  4. INSERT INTO push_logs → ✅ 
  5. sendPushNotification() → ✅ Notification envoyée

RÉSULTAT:
  ❌ 2 tickets avec ID identique
  ❌ 2 notifications envoyées pour même ticket logique
  ❌ Base de données incohérente
```

---

## ✅ Scénario Corrigé (AVEC UNIQUE Constraint + Retry)

### Cas 2: Race Condition AVEC UNIQUE Constraint

```
Thread A:
  1. generateTicketId() → CNC-1125-0001
  2. INSERT INTO tickets → ✅ SUCCESS
  3. INSERT INTO push_logs → ✅
  4. sendPushNotification() → ✅ Notification envoyée

Thread B (simultané):
  1. generateTicketId() → CNC-1125-0001 (même ID)
  2. INSERT INTO tickets → ❌ SQLITE_CONSTRAINT (UNIQUE violation)
  3. Catch error, retry = 1
  4. generateTicketId() → CNC-1125-0002 (nouveau ID)
  5. INSERT INTO tickets → ✅ SUCCESS
  6. INSERT INTO push_logs → ✅
  7. sendPushNotification() → ✅ Notification envoyée

RÉSULTAT:
  ✅ 2 tickets avec IDs distincts (CNC-1125-0001 et CNC-1125-0002)
  ✅ 2 notifications correctes
  ✅ Base de données cohérente
```

---

## 📊 Impact sur les Notifications

### Impact DIRECT: Aucun ❌

**Raison:**
- Notifications envoyées APRÈS insertion ticket réussie
- Si insertion échoue (UNIQUE constraint), le bloc notification n'est JAMAIS atteint
- Retry génère un NOUVEAU ticket_id → Nouveau ticket → Notification correcte

### Impact INDIRECT: Positif ✅

**Avant corrections:**
- Race condition → 2 tickets même ID → 2 notifications pour "même" ticket → Confusion

**Après corrections:**
- Pas de race condition → 2 tickets IDs différents → 2 notifications correctes → Clarté

---

## 🔄 Flux avec Retry Logic

### Code Proposé

```typescript
// POST /api/tickets
tickets.post('/', async (c) => {
  // ... Validations ...
  
  // Fonction interne avec retry
  const createTicketInternal = async (attempt = 0) => {
    try {
      // 1. Générer ticket_id
      const ticket_id = await generateTicketId(c.env.DB, machine.machine_type);
      
      // 2. Insérer ticket
      const result = await c.env.DB.prepare(`
        INSERT INTO tickets (ticket_id, title, description, ...)
        VALUES (?, ?, ?, ...)
      `).bind(ticket_id, title, description, ...).run();
      
      if (!result.success) {
        throw new Error('Insert failed');
      }
      
      // 3. Récupérer ticket créé
      const newTicket = await c.env.DB.prepare(
        'SELECT * FROM tickets WHERE ticket_id = ?'
      ).bind(ticket_id).first();
      
      // 4. Timeline
      await c.env.DB.prepare(`
        INSERT INTO ticket_timeline (ticket_id, ...)
      `).bind((newTicket as any).id, ...).run();
      
      // 5. Notifications (identique, après ticket créé)
      if (assigned_to) {
        try {
          const pushResult = await sendPushNotification(...);
          await c.env.DB.prepare(`
            INSERT INTO push_logs (user_id, ticket_id, status, ...)
          `).bind(...).run();
        } catch (pushError) {
          // Log error, non-critique
          await c.env.DB.prepare(`
            INSERT INTO push_logs (user_id, ticket_id, status='failed', ...)
          `).bind(...).run();
        }
      }
      
      return newTicket;
      
    } catch (error: any) {
      // Si erreur UNIQUE constraint ET pas encore max retries
      if (error.message?.includes('UNIQUE') && attempt < 2) {
        // Attendre un peu (backoff exponentiel)
        await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
        // Retenter
        return createTicketInternal(attempt + 1);
      }
      // Sinon, propager l'erreur
      throw error;
    }
  };
  
  try {
    // Tenter création avec retry
    const newTicket = await createTicketInternal();
    return c.json({ ticket: newTicket }, 201);
  } catch (error) {
    console.error('Create ticket error:', error);
    return c.json({ error: 'Erreur lors de la création du ticket' }, 500);
  }
});
```

### Points Clés

1. **Notification APRÈS ticket créé** ✅
   - Si retry échoue, notifications ne sont JAMAIS envoyées
   - Si retry réussit, notification envoyée avec bon ticket_id

2. **Retry transparent** ✅
   - Utilisateur ne voit qu'une seule requête
   - Délai < 150ms (50ms + 100ms si 2 retries)

3. **Push logs cohérents** ✅
   - Toujours lié au bon ticket_id (celui qui a réussi)

---

## 🧪 Tests de Validation

### Test 1: Création Simple (Pas de Collision)

```
GIVEN: Aucun ticket CNC-1125-*
WHEN: Créer ticket CNC assigné à user 5
THEN:
  ✅ Ticket créé: CNC-1125-0001
  ✅ Push notification envoyée à user 5
  ✅ Push log: ticket_id=CNC-1125-0001, status=success
```

### Test 2: Collision avec Retry Success

```
GIVEN: Thread A crée CNC-1125-0001 simultanément
WHEN: Thread B tente de créer ticket CNC
THEN Thread B:
  Tentative 1:
    ❌ INSERT CNC-1125-0001 → UNIQUE constraint
  Tentative 2:
    ✅ INSERT CNC-1125-0002 → SUCCESS
    ✅ Push notification envoyée avec ticket_id=CNC-1125-0002
    ✅ Push log: ticket_id=CNC-1125-0002, status=success
```

### Test 3: Collision avec Retry Échec (3 fois)

```
GIVEN: Contention extrême (impossible en pratique)
WHEN: Thread échoue 3 tentatives
THEN:
  ❌ Erreur 500 retournée au client
  ❌ AUCUNE notification envoyée (ticket pas créé)
  ❌ AUCUN push log créé (ticket pas créé)
```

**Impact:** Client voit erreur, peut retenter manuellement

---

## 📊 Matrice de Décision

| Scénario | AVANT | APRÈS | Impact Notifications |
|----------|-------|-------|---------------------|
| Création normale | ✅ CNC-1125-0001 | ✅ CNC-1125-0001 | Aucun |
| Collision (2 threads) | ❌ 2x CNC-1125-0001 | ✅ CNC-1125-0001 + CNC-1125-0002 | **Amélioration** (2 notifs correctes) |
| Push échoue | ⚠️ Log error | ⚠️ Log error | Aucun |
| Webhook backup | ✅ Fonctionne | ✅ Fonctionne | Aucun |

---

## 🎯 Conclusion

### Impact sur Notifications: ✅ **AUCUN IMPACT NÉGATIF**

**Raisons:**
1. Notifications envoyées APRÈS ticket créé avec succès
2. Si retry échoue, ticket n'existe pas → Pas de notification (correct)
3. Si retry réussit, ticket a un ID unique → Notification correcte

### Améliorations Apportées: ✅

1. **Élimination doublons**
   - Avant: 2 tickets même ID → Confusion
   - Après: IDs distincts → Clarté

2. **Cohérence garantie**
   - `push_logs.ticket_id` référence toujours un ticket valide
   - Pas de logs orphelins

3. **Expérience utilisateur**
   - Retry transparent (< 150ms)
   - Pas d'erreur visible si collision rare

### Risques: ✅ **AUCUN**

- Notifications restent dans le même bloc try/catch
- Webhook Pabbly reste en backup
- Push logs toujours après ticket créé

---

## ✅ Recommandation Finale

**🟢 IMPLÉMENTER SANS HÉSITATION**

Les corrections (UNIQUE constraint + retry logic) n'ont **AUCUN impact négatif** sur le système de notifications et apportent une **amélioration significative** de la cohérence des données.

### Actions Recommandées

1. ✅ Créer migration UNIQUE constraint
2. ✅ Implémenter retry logic dans `tickets.post()`
3. ✅ Tester en local avec collisions simulées
4. ✅ Déployer en production

**Aucune modification du système de notifications n'est nécessaire.**

---

**Analyse réalisée le:** 26 novembre 2025  
**Verdict:** 🟢 **SÉCURITAIRE - Aucun risque pour notifications**  
**Impact attendu:** ✅ **Positif (meilleure cohérence)**
