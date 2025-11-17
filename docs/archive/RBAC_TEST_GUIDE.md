# 🧪 Guide de Test RBAC en Local

## 🚀 Service Démarré

**URL**: `http://localhost:7000`

**Endpoints de test créés**:
- `GET /api/rbac/test` - Test complet de vos permissions
- `GET /api/rbac/test-permission` - Test middleware requirePermission
- `GET /api/rbac/test-any-permission` - Test middleware requireAnyPermission
- `GET /api/roles` - Liste des rôles (admin uniquement)
- `GET /api/roles/permissions/all` - Toutes les permissions (admin)

---

## 📋 Étape 1: Se Connecter

### Comptes de Test Disponibles

| Email | Mot de passe | Rôle | Permissions |
|-------|--------------|------|-------------|
| admin@igpglass.ca | password123 | Admin | 31/31 (100%) |
| operateur@igpglass.ca | password123 | Operator | 11/31 (35%) |

### 🔑 Obtenir un Token

```bash
# Se connecter comme ADMIN
curl -X POST http://localhost:7000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@igpglass.ca",
    "password": "password123"
  }'

# Réponse:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}

# Copier le token pour les prochaines requêtes
```

```bash
# Se connecter comme OPERATOR
curl -X POST http://localhost:7000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "operateur@igpglass.ca",
    "password": "password123"
  }'
```

---

## 🧪 Étape 2: Tester Vos Permissions

### Test 1: Voir Toutes Vos Permissions

```bash
# Remplacer <TOKEN> par votre token
curl -X GET http://localhost:7000/api/rbac/test \
  -H "Authorization: Bearer <TOKEN>"
```

**Réponse attendue (Admin)**:
```json
{
  "message": "Test RBAC réussi",
  "user": {
    "id": 1,
    "email": "admin@igpglass.ca",
    "role": "admin"
  },
  "permissions": {
    "total": 31,
    "list": [
      "tickets.create.all",
      "tickets.read.all",
      "tickets.update.all",
      "tickets.delete.all",
      "machines.create.all",
      "users.create.all",
      "roles.create.all",
      ...
    ]
  },
  "specificTests": {
    "canCreateTickets": true,
    "canDeleteAllTickets": true,
    "canDeleteOwnTickets": true,
    "canCreateMachines": true,
    "canCreateUsers": true,
    "canManageRoles": true
  },
  "interpretation": {
    "role": "admin",
    "description": "Accès complet - Peut tout faire"
  }
}
```

**Réponse attendue (Operator)**:
```json
{
  "message": "Test RBAC réussi",
  "user": {
    "id": 4,
    "email": "operateur@igpglass.ca",
    "role": "operator"
  },
  "permissions": {
    "total": 11,
    "list": [
      "tickets.create.all",
      "tickets.read.all",
      "tickets.read.own",
      "tickets.update.own",
      "tickets.delete.own",
      "tickets.comment.all",
      "machines.read.all",
      "users.read.all",
      "media.upload.all"
    ]
  },
  "specificTests": {
    "canCreateTickets": true,
    "canDeleteAllTickets": false,
    "canDeleteOwnTickets": true,
    "canCreateMachines": false,
    "canCreateUsers": false,
    "canManageRoles": false
  },
  "interpretation": {
    "role": "operator",
    "description": "Tickets propres uniquement"
  }
}
```

### Test 2: Middleware requirePermission

```bash
# Test avec permission tickets.read.all
curl -X GET http://localhost:7000/api/rbac/test-permission \
  -H "Authorization: Bearer <TOKEN>"
```

**Avec Admin** (a la permission):
```json
{
  "message": "Permission accordée!",
  "requiredPermission": "tickets.read.all"
}
```

**Avec Operator** (a aussi la permission):
```json
{
  "message": "Permission accordée!",
  "requiredPermission": "tickets.read.all"
}
```

### Test 3: Middleware requireAnyPermission

```bash
# Test avec tickets.read.all OU tickets.read.own
curl -X GET http://localhost:7000/api/rbac/test-any-permission \
  -H "Authorization: Bearer <TOKEN>"
```

**Avec n'importe quel rôle** (tous ont au moins une des deux permissions):
```json
{
  "message": "Au moins une permission accordée!",
  "requiredPermissions": ["tickets.read.all", "tickets.read.own"]
}
```

---

## 🔐 Étape 3: Tester l'API Roles (Admin Uniquement)

### Liste des Rôles

```bash
# Avec token ADMIN
curl -X GET http://localhost:7000/api/roles \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Réponse**:
```json
{
  "roles": [
    {
      "id": 1,
      "name": "admin",
      "display_name": "Administrateur",
      "description": "Accès complet au système...",
      "is_system": 1,
      "permissions_count": 31
    },
    {
      "id": 2,
      "name": "supervisor",
      "display_name": "Superviseur",
      "description": "Gestion des tickets...",
      "is_system": 1,
      "permissions_count": 25
    },
    {
      "id": 3,
      "name": "technician",
      "display_name": "Technicien",
      "description": "Intervention sur les tickets...",
      "is_system": 1,
      "permissions_count": 16
    },
    {
      "id": 4,
      "name": "operator",
      "display_name": "Opérateur",
      "description": "Création et suivi...",
      "is_system": 1,
      "permissions_count": 11
    }
  ]
}
```

### Détails d'un Rôle

```bash
# Voir les permissions du rôle Admin (ID: 1)
curl -X GET http://localhost:7000/api/roles/1 \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Réponse**:
```json
{
  "role": {
    "id": 1,
    "name": "admin",
    "display_name": "Administrateur",
    "permissions": [
      {
        "id": 1,
        "resource": "tickets",
        "action": "create",
        "scope": "all",
        "display_name": "Créer des tickets"
      },
      {
        "id": 2,
        "resource": "tickets",
        "action": "read",
        "scope": "all",
        "display_name": "Voir tous les tickets"
      },
      ...
    ]
  }
}
```

### Liste Toutes les Permissions Disponibles

```bash
curl -X GET http://localhost:7000/api/roles/permissions/all \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Réponse**:
```json
{
  "permissions": [...],
  "grouped": {
    "tickets": [
      {"id": 1, "action": "create", "scope": "all", ...},
      {"id": 2, "action": "read", "scope": "all", ...},
      ...
    ],
    "machines": [...],
    "users": [...],
    "messages": [...],
    "media": [...],
    "roles": [...]
  }
}
```

---

## 🎨 Étape 4: Créer un Rôle Personnalisé

### Exemple: Créer un Rôle "Auditeur"

```bash
curl -X POST http://localhost:7000/api/roles \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "auditor",
    "display_name": "Auditeur",
    "description": "Accès en lecture seule à tout le système",
    "permission_ids": [2, 3, 12, 16, 22]
  }'
```

**Permissions choisies**:
- 2: tickets.read.all
- 3: tickets.read.own
- 12: machines.read.all
- 16: users.read.all
- 22: messages.read.all

**Réponse**:
```json
{
  "message": "Rôle créé avec succès",
  "role": {
    "id": 5,
    "name": "auditor",
    "display_name": "Auditeur",
    "description": "Accès en lecture seule...",
    "is_system": 0
  }
}
```

### Modifier le Rôle

```bash
curl -X PUT http://localhost:7000/api/roles/5 \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "Auditeur Senior",
    "description": "Accès lecture + export",
    "permission_ids": [2, 3, 12, 16, 22, 25]
  }'
```

### Supprimer le Rôle

```bash
curl -X DELETE http://localhost:7000/api/roles/5 \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## ❌ Tests d'Erreur (Important)

### Test 1: Operator Essaie d'Accéder aux Rôles

```bash
# Avec token OPERATOR
curl -X GET http://localhost:7000/api/roles \
  -H "Authorization: Bearer <OPERATOR_TOKEN>"
```

**Réponse** (403 Forbidden):
```json
{
  "error": "Accès réservé aux administrateurs"
}
```

### Test 2: Sans Token

```bash
curl -X GET http://localhost:7000/api/rbac/test
```

**Réponse** (401 Unauthorized):
```json
{
  "error": "Token manquant"
}
```

### Test 3: Supprimer un Rôle Système

```bash
# Essayer de supprimer le rôle Admin (ID: 1)
curl -X DELETE http://localhost:7000/api/roles/1 \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Réponse** (403 Forbidden):
```json
{
  "error": "Impossible de supprimer un rôle système"
}
```

---

## 📊 Vérifications Base de Données

### Voir les Rôles

```bash
npx wrangler d1 execute maintenance-db --local \
  --command="SELECT * FROM roles"
```

### Voir les Permissions

```bash
npx wrangler d1 execute maintenance-db --local \
  --command="SELECT * FROM permissions LIMIT 10"
```

### Voir les Assignations

```bash
npx wrangler d1 execute maintenance-db --local \
  --command="
    SELECT r.name, COUNT(*) as perms 
    FROM roles r 
    JOIN role_permissions rp ON r.id = rp.role_id 
    GROUP BY r.id
  "
```

---

## ✅ Checklist de Test

- [ ] Se connecter avec admin@igpglass.ca
- [ ] Tester `/api/rbac/test` et voir les 31 permissions
- [ ] Tester `/api/rbac/test-permission` (devrait passer)
- [ ] Lister les rôles avec `/api/roles`
- [ ] Voir détails d'un rôle avec `/api/roles/1`
- [ ] Lister toutes les permissions avec `/api/roles/permissions/all`
- [ ] Créer un rôle "auditor" personnalisé
- [ ] Voir le rôle créé dans `/api/roles`
- [ ] Modifier le rôle créé
- [ ] Supprimer le rôle créé
- [ ] Se connecter avec operateur@igpglass.ca
- [ ] Tester `/api/rbac/test` et voir les 11 permissions
- [ ] Essayer d'accéder `/api/roles` (devrait échouer avec 403)

---

## 🎯 Résultat Attendu

**Tous les tests devraient fonctionner correctement !**

✅ Admin a toutes les permissions\
✅ Operator a permissions limitées\
✅ Operator ne peut pas gérer les rôles\
✅ Rôles personnalisés peuvent être créés\
✅ Rôles système ne peuvent pas être supprimés\
✅ Cache fonctionne (performances)\
✅ Middlewares bloquent correctement

**Le système RBAC fonctionne parfaitement ! 🎉**
