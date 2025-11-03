# 🧪 GUIDE DE TEST - Gestion des Utilisateurs (Admin)

## 🎯 Objectif

Tester la nouvelle fonctionnalité de gestion des utilisateurs avant le déploiement en production.

---

## 🌐 URL DE TEST

**👉 https://security-test.webapp-7t8.pages.dev**

---

## 🔑 ÉTAPE 1: Se connecter en tant qu'Admin

1. Ouvrir https://security-test.webapp-7t8.pages.dev
2. Se connecter avec le compte admin:
   - Email: `admin@igpglass.ca`
   - Mot de passe: `password123`
3. Vérifier que vous êtes bien connecté (dashboard s'affiche)

---

## 🧪 ÉTAPE 2: Ouvrir la Console Développeur

1. **Chrome/Edge/Brave**: Appuyer sur `F12` ou `Ctrl+Shift+I`
2. **Firefox**: Appuyer sur `F12` ou `Ctrl+Shift+K`
3. **Safari**: `Cmd+Option+I` (Mac)
4. Aller dans l'onglet **"Console"**

---

## 📋 ÉTAPE 3: Tests des Fonctionnalités

### Test 1: Lister tous les utilisateurs ✅

**Copier-coller dans la console**:
```javascript
fetch('/api/users', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Liste des utilisateurs:', data.users);
  console.table(data.users);
});
```

**Résultat attendu**:
- ✅ Liste des utilisateurs affichée
- ✅ Colonnes: id, email, full_name, role, hash_type
- ✅ Voir le type de hash (PBKDF2 ou SHA-256)

---

### Test 2: Créer un nouvel utilisateur ✅

**Copier-coller dans la console**:
```javascript
fetch('/api/users', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'test.utilisateur@igpglass.ca',
    password: 'testpassword123',
    full_name: 'Utilisateur Test',
    role: 'operator'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Utilisateur créé:', data);
  window.testUserId = data.user.id;  // Sauvegarder l'ID pour tests suivants
});
```

**Résultat attendu**:
- ✅ Message: "Utilisateur créé avec succès"
- ✅ Détails de l'utilisateur créé
- ✅ Hash automatiquement en PBKDF2

**Si erreur "Email déjà utilisé"**: C'est normal si vous refaites le test, utilisez un autre email.

---

### Test 3: Modifier un utilisateur ✅

**Copier-coller dans la console** (après Test 2):
```javascript
// Utilise l'ID sauvegardé du test précédent
const userId = window.testUserId || 2;  // Ou remplacer par un ID valide

fetch(`/api/users/${userId}`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    full_name: 'Utilisateur Test Modifié',
    role: 'technician'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Utilisateur modifié:', data);
});
```

**Résultat attendu**:
- ✅ Message: "Utilisateur mis à jour avec succès"
- ✅ Nom et/ou rôle modifiés

---

### Test 4: Réinitialiser un mot de passe ✅

**Copier-coller dans la console**:
```javascript
const userId = window.testUserId || 2;

fetch(`/api/users/${userId}/reset-password`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    new_password: 'nouveaumotdepasse123'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Mot de passe réinitialisé:', data);
});
```

**Résultat attendu**:
- ✅ Message: "Mot de passe réinitialisé avec succès"

---

### Test 5: Supprimer un utilisateur ✅

**Copier-coller dans la console**:
```javascript
const userId = window.testUserId || 3;

fetch(`/api/users/${userId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Utilisateur supprimé:', data);
});
```

**Résultat attendu**:
- ✅ Message: "Utilisateur supprimé avec succès"
- ✅ Détails de l'utilisateur supprimé

---

## 🛡️ ÉTAPE 4: Tests de Sécurité

### Test de sécurité 1: Impossible de se supprimer soi-même ❌

**Copier-coller dans la console**:
```javascript
// Récupérer l'ID de l'utilisateur actuel
fetch('/api/auth/me', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
})
.then(r => r.json())
.then(meData => {
  const myId = meData.user.id;
  console.log('Mon ID:', myId);
  
  // Essayer de se supprimer
  return fetch(`/api/users/${myId}`, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
  });
})
.then(r => r.json())
.then(data => {
  console.log('❌ Tentative de suppression de soi-même:', data);
  console.log('✅ Devrait afficher une erreur 403');
});
```

**Résultat attendu**:
- ❌ Erreur 403: "Vous ne pouvez pas supprimer votre propre compte"

---

### Test de sécurité 2: Impossible de retirer ses propres droits admin ❌

**Copier-coller dans la console**:
```javascript
fetch('/api/auth/me', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
})
.then(r => r.json())
.then(meData => {
  const myId = meData.user.id;
  
  // Essayer de changer son rôle
  return fetch(`/api/users/${myId}`, {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('auth_token'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ role: 'operator' })
  });
})
.then(r => r.json())
.then(data => {
  console.log('❌ Tentative de retirer ses droits:', data);
  console.log('✅ Devrait afficher une erreur 403');
});
```

**Résultat attendu**:
- ❌ Erreur 403: "Vous ne pouvez pas retirer vos propres droits administrateur"

---

### Test de sécurité 3: Accès refusé pour non-admin 🔒

**Pour tester ceci, vous devez**:
1. Créer un compte opérateur (Test 2)
2. Se déconnecter
3. Se connecter avec ce compte
4. Essayer d'accéder à `/api/users`

**Résultat attendu**:
- ❌ Erreur 403: "Accès réservé aux administrateurs"

---

## 🎨 ÉTAPE 5: Fonctions Helper (Optionnel)

Pour faciliter les tests répétés, copier-coller ces fonctions dans la console :

```javascript
// Configuration
const API_URL = '/api';
const getToken = () => localStorage.getItem('auth_token');

// Helper pour les requêtes
const apiCall = async (method, endpoint, body = null) => {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(API_URL + endpoint, options);
  const data = await response.json();
  console.log(`${method} ${endpoint}:`, data);
  return data;
};

// Fonctions raccourcies
const listUsers = () => apiCall('GET', '/users');
const getUser = (id) => apiCall('GET', `/users/${id}`);
const createUser = (email, password, fullName, role) => 
  apiCall('POST', '/users', { email, password, full_name: fullName, role });
const updateUser = (id, updates) => apiCall('PUT', `/users/${id}`, updates);
const deleteUser = (id) => apiCall('DELETE', `/users/${id}`);
const resetPassword = (id, newPassword) => 
  apiCall('POST', `/users/${id}/reset-password`, { new_password: newPassword });

console.log('✅ Fonctions helper chargées !');
console.log('Utilisez: listUsers(), createUser(), updateUser(), deleteUser(), resetPassword()');
```

**Ensuite, vous pouvez simplement utiliser**:
```javascript
// Liste
listUsers();

// Créer
createUser('test2@igpglass.ca', 'pass123', 'Test 2', 'operator');

// Modifier
updateUser(3, { full_name: 'Nouveau Nom' });

// Réinitialiser mot de passe
resetPassword(3, 'nouveaupass');

// Supprimer
deleteUser(3);
```

---

## ✅ CHECKLIST DE VALIDATION

### Fonctionnalités ✅
- [ ] Lister les utilisateurs fonctionne
- [ ] Créer un utilisateur fonctionne
- [ ] Modifier un utilisateur fonctionne
- [ ] Réinitialiser un mot de passe fonctionne
- [ ] Supprimer un utilisateur fonctionne
- [ ] Les hashs PBKDF2 sont créés automatiquement

### Sécurité 🔒
- [ ] Impossible de se supprimer soi-même
- [ ] Impossible de retirer ses droits admin
- [ ] Accès refusé pour non-admin (403)
- [ ] Validation des emails
- [ ] Validation des mots de passe (min 6 car.)
- [ ] Validation des rôles

### Tests effectués
- [ ] Test 1: Lister
- [ ] Test 2: Créer
- [ ] Test 3: Modifier
- [ ] Test 4: Réinitialiser MDP
- [ ] Test 5: Supprimer
- [ ] Sécurité 1: Se supprimer
- [ ] Sécurité 2: Retirer droits
- [ ] Sécurité 3: Non-admin

---

## 📊 RÉSUMÉ DES RÉSULTATS

| Test | Résultat | Notes |
|------|----------|-------|
| Liste utilisateurs | ⏳ | |
| Créer utilisateur | ⏳ | |
| Modifier utilisateur | ⏳ | |
| Réinitialiser MDP | ⏳ | |
| Supprimer utilisateur | ⏳ | |
| Sécurité: Auto-suppression | ⏳ | Doit échouer (403) |
| Sécurité: Retirer droits | ⏳ | Doit échouer (403) |
| Sécurité: Non-admin | ⏳ | Doit échouer (403) |

---

## 🚀 PROCHAINES ÉTAPES

### Si tous les tests passent ✅

1. **Merger et déployer en production**:
   ```bash
   cd /home/user/webapp
   git checkout main
   git merge security-improvements
   git push origin main
   npm run build
   npx wrangler pages deploy dist --project-name webapp
   ```

2. **Configurer JWT_SECRET** (si pas encore fait):
   ```bash
   openssl rand -base64 32
   npx wrangler secret put JWT_SECRET --project-name webapp
   ```

3. **Documenter les accès admin** pour votre équipe

### Si un problème est détecté ❌

1. **Documenter le problème**:
   - Quel test a échoué ?
   - Message d'erreur exact ?
   - Comportement attendu vs obtenu ?

2. **Vérifier les logs**:
   ```bash
   npx wrangler tail --project-name webapp
   ```

3. **La version stable reste disponible** sur https://mecanique.igpglass.ca

---

## 📞 SUPPORT

- **Documentation API**: `ADMIN_USER_MANAGEMENT.md`
- **Guide de sécurité**: `SECURITY_UPGRADE_GUIDE.md`
- **Rapport d'audit**: `SECURITY_AUDIT_REPORT.md`

---

**Bonne chance avec les tests ! 🎉**
