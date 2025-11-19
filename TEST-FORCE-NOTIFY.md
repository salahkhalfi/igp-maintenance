# 🧪 Test Force Notify - Instructions Manuelles

**Date**: 2025-11-19  
**Feature**: Notification push sur réassignation avec `force_notify`

---

## 📋 **PRÉREQUIS**

- ✅ Service local actif sur http://localhost:3000
- ✅ Compte admin pour authentification
- ✅ Laurent a des souscriptions push actives (ID user: 2)
- ✅ Ticket test: ID 13 "Une souris dans la machine" (déjà assigné à Laurent)

---

## 🧪 **TEST 1 : Comportement Normal (Sans force_notify)**

### **Objectif**: Vérifier que le comportement actuel est préservé

**Action**: Réassigner le ticket 13 à Laurent (déjà assigné à lui)

**Méthode**: Console navigateur (F12)

```javascript
// 1. Se connecter et récupérer le token
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'admin@igpglass.ca',
    password: 'VOTRE_MOT_DE_PASSE'
  })
});
const loginData = await loginResponse.json();
const token = loginData.token;
console.log('✅ Token:', token);

// 2. Réassigner ticket 13 à Laurent (sans force_notify)
const response = await fetch('http://localhost:3000/api/tickets/13', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  credentials: 'include',
  body: JSON.stringify({
    assigned_to: 2  // Laurent - PAS de force_notify
  })
});
const result = await response.json();
console.log('Résultat:', result);
```

**Résultat Attendu**:
- ✅ Ticket mis à jour avec succès
- ❌ **AUCUNE notification push envoyée** (comportement normal)
- Console backend: Pas de log "Push notification sent"

---

## 🧪 **TEST 2 : Nouveau Comportement (Avec force_notify)**

### **Objectif**: Vérifier que `force_notify: true` envoie une notification

**Action**: Réassigner le même ticket avec flag `force_notify`

**Méthode**: Console navigateur

```javascript
// Réutiliser le token du test précédent

// Réassigner ticket 13 à Laurent AVEC force_notify
const response = await fetch('http://localhost:3000/api/tickets/13', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  credentials: 'include',
  body: JSON.stringify({
    assigned_to: 2,           // Laurent
    force_notify: true        // ← NOUVEAU FLAG
  })
});
const result = await response.json();
console.log('Résultat:', result);
```

**Résultat Attendu**:
- ✅ Ticket mis à jour avec succès
- ✅ **Notification push ENVOYÉE à Laurent**
- ✅ Titre: "🔔 Rappel: Ticket assigné" (car isReassignment = true)
- ✅ Console backend: "✅ Push notification sent for ticket 13 to user 2"

---

## 🧪 **TEST 3 : Nouvelle Assignation (Comportement Normal)**

### **Objectif**: Vérifier que les nouvelles assignations fonctionnent toujours

**Action**: Assigner le ticket à un autre utilisateur puis à Laurent

**Méthode**: Console navigateur

```javascript
// 1. Désassigner (mettre à null ou autre user)
const unassign = await fetch('http://localhost:3000/api/tickets/13', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  credentials: 'include',
  body: JSON.stringify({
    assigned_to: null  // Désassigner
  })
});
console.log('Désassigné:', await unassign.json());

// 2. Réassigner à Laurent (nouvelle assignation)
const reassign = await fetch('http://localhost:3000/api/tickets/13', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  credentials: 'include',
  body: JSON.stringify({
    assigned_to: 2  // Laurent - SANS force_notify
  })
});
console.log('Réassigné:', await reassign.json());
```

**Résultat Attendu**:
- ✅ Ticket mis à jour avec succès
- ✅ **Notification push ENVOYÉE** (car assignation a changé: null → 2)
- ✅ Titre: "🔧 Nouveau ticket assigné" (car isReassignment = false)
- ✅ Console backend: "✅ Push notification sent for ticket 13 to user 2"

---

## 📊 **VÉRIFICATION DES LOGS**

### **Console Backend (PM2)**

```bash
# Voir les logs en temps réel
pm2 logs webapp --nostream

# Chercher les logs push
pm2 logs webapp --nostream | grep -i "push notification"
```

### **Base de Données (Push Logs)**

```bash
# Vérifier les logs de push pour Laurent
npx wrangler d1 execute maintenance-db --remote \
  --command="SELECT * FROM push_logs WHERE user_id = 2 ORDER BY created_at DESC LIMIT 5"
```

---

## ✅ **CHECKLIST DE VALIDATION**

| Test | Comportement Attendu | Résultat |
|------|---------------------|----------|
| **Test 1** : Réassignation sans `force_notify` | ❌ Pas de notification | ⬜ |
| **Test 2** : Réassignation avec `force_notify: true` | ✅ Notification "Rappel" | ⬜ |
| **Test 3** : Nouvelle assignation | ✅ Notification "Nouveau ticket" | ⬜ |
| **Logs Backend** : Messages push dans PM2 | ✅ Logs visibles | ⬜ |
| **Base de Données** : Entrées dans push_logs | ✅ Nouveaux logs créés | ⬜ |
| **Laurent** : Notification reçue | ✅ Laurent voit notification | ⬜ |

---

## 🎯 **CRITÈRES DE SUCCÈS**

- ✅ **Test 1 passe** : Pas de régression, comportement actuel préservé
- ✅ **Test 2 passe** : Nouvelle feature fonctionne (`force_notify`)
- ✅ **Test 3 passe** : Assignations normales fonctionnent toujours
- ✅ **Aucune erreur** dans les logs PM2
- ✅ **Laurent reçoit** les notifications push

---

## ⚠️ **EN CAS DE PROBLÈME**

### **Erreur 401 Unauthorized**
```javascript
// Vérifier que le token est valide
console.log('Token:', token);
// Réessayer le login si nécessaire
```

### **Notification non reçue**
```bash
# Vérifier que Laurent a des souscriptions actives
npx wrangler d1 execute maintenance-db --remote \
  --command="SELECT * FROM push_subscriptions WHERE user_id = 2"
```

### **Erreur backend**
```bash
# Vérifier les logs PM2
pm2 logs webapp --lines 50
```

---

## 📝 **NOTES**

- Le flag `force_notify` est **optionnel** : si absent, comportement normal
- Le titre de la notification change automatiquement selon le contexte
- Les logs push sont enregistrés dans `push_logs` table
- La feature est **fail-safe** : si push échoue, l'assignation réussit quand même

---

**Prêt pour les tests ?** Exécutez les scripts dans la console du navigateur et cochez les cases de la checklist.
