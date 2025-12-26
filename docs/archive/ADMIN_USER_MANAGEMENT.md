# 👥 GESTION DES UTILISATEURS (Admin)

## 🔒 Sécurité

Toutes ces fonctionnalités sont **exclusivement réservées aux administrateurs**.

### Protections implémentées

- ✅ Authentification requise (token JWT)
- ✅ Rôle admin requis pour tous les endpoints
- ✅ Impossible de se supprimer soi-même
- ✅ Impossible de retirer ses propres droits admin
- ✅ Impossible de supprimer le dernier administrateur
- ✅ Validation stricte de toutes les entrées
- ✅ Logging de toutes les actions admin
- ✅ Hashage PBKDF2 automatique des mots de passe

---

## 📡 API ENDPOINTS

### 1. Lister tous les utilisateurs

```http
GET /api/users
Authorization: Bearer {token}
```

**Réponse**:
```json
{
  "users": [
    {
      "id": 1,
      "email": "admin@igpglass.ca",
      "full_name": "Admin Principal",
      "role": "admin",
      "hash_type": "PBKDF2",
      "created_at": "2025-11-02T10:00:00Z",
      "updated_at": "2025-11-02T10:00:00Z"
    },
    {
      "id": 2,
      "email": "tech@igpglass.ca",
      "full_name": "Jean Technicien",
      "role": "technician",
      "hash_type": "SHA-256 (Legacy)",
      "created_at": "2025-11-02T10:00:00Z",
      "updated_at": "2025-11-02T10:00:00Z"
    }
  ]
}
```

---

### 2. Créer un nouvel utilisateur

```http
POST /api/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "nouveau@igpglass.ca",
  "password": "motdepasse123",
  "full_name": "Nouveau Utilisateur",
  "role": "operator"
}
```

**Rôles valides**: `admin`, `technician`, `operator`

**Validations**:
- Email valide et unique
- Mot de passe minimum 6 caractères
- Rôle valide
- Tous les champs requis

**Réponse (201)**:
```json
{
  "message": "Utilisateur créé avec succès",
  "user": {
    "id": 3,
    "email": "nouveau@igpglass.ca",
    "full_name": "Nouveau Utilisateur",
    "role": "operator",
    "created_at": "2025-11-02T12:00:00Z",
    "updated_at": "2025-11-02T12:00:00Z"
  }
}
```

**Erreurs possibles**:
- `400` - Champs manquants ou invalides
- `409` - Email déjà utilisé

---

### 3. Modifier un utilisateur

```http
PUT /api/users/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "nouvel.email@igpglass.ca",
  "full_name": "Nom Modifié",
  "role": "technician",
  "password": "nouveaumotdepasse"
}
```

**Note**: Tous les champs sont optionnels, seuls les champs fournis seront modifiés.

**Protections spéciales**:
- ❌ Impossible de retirer ses propres droits admin
- ✅ Peut modifier n'importe quel autre utilisateur

**Réponse (200)**:
```json
{
  "message": "Utilisateur mis à jour avec succès",
  "user": {
    "id": 2,
    "email": "nouvel.email@igpglass.ca",
    "full_name": "Nom Modifié",
    "role": "technician",
    "created_at": "2025-11-02T10:00:00Z",
    "updated_at": "2025-11-02T12:30:00Z"
  }
}
```

**Erreurs possibles**:
- `400` - Données invalides
- `403` - Tentative de retirer ses propres droits admin
- `404` - Utilisateur non trouvé
- `409` - Email déjà utilisé

---

### 4. Supprimer un utilisateur

```http
DELETE /api/users/:id
Authorization: Bearer {token}
```

**Protections spéciales**:
- ❌ Impossible de se supprimer soi-même
- ❌ Impossible de supprimer le dernier admin
- ✅ Peut supprimer n'importe quel autre utilisateur

**Réponse (200)**:
```json
{
  "message": "Utilisateur supprimé avec succès",
  "deleted_user": {
    "id": 3,
    "email": "ancien@igpglass.ca",
    "full_name": "Ancien Utilisateur",
    "role": "operator"
  }
}
```

**Erreurs possibles**:
- `403` - Tentative de se supprimer ou de supprimer le dernier admin
- `404` - Utilisateur non trouvé

---

### 5. Réinitialiser le mot de passe

```http
POST /api/users/:id/reset-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "new_password": "nouveaumotdepasse123"
}
```

**Validation**:
- Mot de passe minimum 6 caractères
- Hashage PBKDF2 automatique

**Réponse (200)**:
```json
{
  "message": "Mot de passe réinitialisé avec succès"
}
```

**Erreurs possibles**:
- `400` - Mot de passe trop court ou manquant
- `404` - Utilisateur non trouvé

---

### 6. Détails d'un utilisateur

```http
GET /api/users/:id
Authorization: Bearer {token}
```

**Réponse (200)**:
```json
{
  "user": {
    "id": 2,
    "email": "tech@igpglass.ca",
    "full_name": "Jean Technicien",
    "role": "technician",
    "hash_type": "PBKDF2",
    "created_at": "2025-11-02T10:00:00Z",
    "updated_at": "2025-11-02T12:00:00Z"
  }
}
```

---

## 🧪 EXEMPLES D'UTILISATION

### Exemple avec cURL

#### Lister les utilisateurs
```bash
curl -X GET "https://app.igpglass.ca/api/users" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Créer un utilisateur
```bash
curl -X POST "https://app.igpglass.ca/api/users" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nouveau@igpglass.ca",
    "password": "motdepasse123",
    "full_name": "Nouveau Utilisateur",
    "role": "operator"
  }'
```

#### Modifier un utilisateur
```bash
curl -X PUT "https://app.igpglass.ca/api/users/2" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jean Technicien Senior",
    "role": "technician"
  }'
```

#### Supprimer un utilisateur
```bash
curl -X DELETE "https://app.igpglass.ca/api/users/3" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Réinitialiser un mot de passe
```bash
curl -X POST "https://app.igpglass.ca/api/users/2/reset-password" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "new_password": "nouveaumotdepasse123"
  }'
```

---

### Exemple avec JavaScript (Console navigateur)

```javascript
// Récupérer le token (après connexion)
const token = localStorage.getItem('auth_token');

// Lister les utilisateurs
fetch('/api/users', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('Utilisateurs:', data.users));

// Créer un utilisateur
fetch('/api/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'test@igpglass.ca',
    password: 'test123456',
    full_name: 'Utilisateur Test',
    role: 'operator'
  })
})
.then(r => r.json())
.then(data => console.log('Créé:', data));

// Modifier un utilisateur
fetch('/api/users/2', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    full_name: 'Nouveau Nom',
    role: 'technician'
  })
})
.then(r => r.json())
.then(data => console.log('Modifié:', data));

// Supprimer un utilisateur
fetch('/api/users/3', {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('Supprimé:', data));

// Réinitialiser mot de passe
fetch('/api/users/2/reset-password', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    new_password: 'nouveaumotdepasse'
  })
})
.then(r => r.json())
.then(data => console.log('Mot de passe réinitialisé:', data));
```

---

## 📊 RÔLES ET PERMISSIONS

### Admin
- ✅ Gérer tous les utilisateurs
- ✅ Créer, modifier, supprimer des comptes
- ✅ Réinitialiser les mots de passe
- ✅ Changer les rôles
- ✅ Accès complet à toutes les fonctionnalités

### Technician
- ✅ Gérer les tickets
- ✅ Voir tous les utilisateurs (lecture seule)
- ❌ Pas de gestion des utilisateurs

### Operator
- ✅ Créer des tickets
- ✅ Voir ses propres tickets
- ❌ Pas de gestion des utilisateurs

---

## 🔍 LOGGING ET AUDIT

Toutes les actions administratives sont loggées dans les logs Cloudflare :

```bash
# Voir les logs en temps réel
npx wrangler tail --project-name webapp
```

**Exemples de logs**:
```
Admin admin@igpglass.ca created user nouveau@igpglass.ca with role operator
Admin admin@igpglass.ca updated user tech@igpglass.ca: name: Jean → Jean Senior, role: operator → technician
Admin admin@igpglass.ca reset password for user tech@igpglass.ca
Admin admin@igpglass.ca deleted user ancien@igpglass.ca (role: operator)
```

---

## 🛡️ MEILLEURES PRATIQUES

### Création de comptes

1. **Mots de passe forts**: Minimum 8 caractères, majuscules, minuscules, chiffres
2. **Rôle approprié**: Donner le minimum de privilèges nécessaires
3. **Email valide**: Vérifier que l'email est correct
4. **Formation**: S'assurer que l'utilisateur sait utiliser le système

### Gestion des rôles

- **Admin**: Réservé aux gestionnaires et responsables IT
- **Technician**: Pour les techniciens de maintenance
- **Operator**: Pour les opérateurs de production

### Sécurité

- 🔐 Ne jamais partager les identifiants admin
- 🔐 Changer les mots de passe régulièrement
- 🔐 Désactiver/supprimer les comptes inutilisés
- 🔐 Vérifier régulièrement les logs d'activité
- 🔐 Utiliser des mots de passe uniques pour chaque utilisateur

---

## 🚀 ACCÈS RAPIDE (Console navigateur)

Pour les admins, voici des fonctions helper à copier-coller dans la console :

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
  return response.json();
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

// Exemples d'utilisation
listUsers().then(console.log);
createUser('test@igpglass.ca', 'test123', 'Test User', 'operator').then(console.log);
updateUser(2, { full_name: 'Nouveau Nom' }).then(console.log);
resetPassword(2, 'nouveaupass123').then(console.log);
// deleteUser(3).then(console.log);  // Décommenter pour supprimer
```

---

## 📞 SUPPORT

Pour toute question ou problème :
- Consulter les logs : `npx wrangler tail`
- Vérifier le rapport d'audit : `SECURITY_AUDIT_REPORT.md`
- Vérifier le guide de migration : `SECURITY_UPGRADE_GUIDE.md`

---

**Date de création**: 2025-11-02  
**Version**: 1.0  
**Auteur**: Salah Khalfi
