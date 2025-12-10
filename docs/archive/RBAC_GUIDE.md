# 🔐 Guide du Système RBAC (Role-Based Access Control)

## Vue d'ensemble

Le système RBAC permet une gestion flexible et scalable des permissions utilisateurs via :

- **Rôles prédéfinis** : Admin, Supervisor, Technician, Operator
- **Rôles personnalisés** : Créez vos propres rôles avec permissions spécifiques
- **Permissions granulaires** : 35+ permissions couvrant toutes les fonctionnalités
- **Gestion dynamique** : Modifiez les permissions sans toucher au code

---

## 📊 Architecture des Tables

### Table `roles`
```sql
id              INTEGER PRIMARY KEY
name            TEXT UNIQUE         -- admin, supervisor, custom_role
display_name    TEXT                -- Administrateur, Superviseur
description     TEXT                -- Description du rôle
is_system       INTEGER             -- 1=système, 0=personnalisé
created_at      DATETIME
updated_at      DATETIME
```

### Table `permissions`
```sql
id              INTEGER PRIMARY KEY
resource        TEXT                -- tickets, machines, users, etc.
action          TEXT                -- create, read, update, delete
scope           TEXT                -- all, own, team, public, private
display_name    TEXT                -- Nom affiché
description     TEXT
created_at      DATETIME
```

### Table `role_permissions` (many-to-many)
```sql
role_id         INTEGER FK → roles.id
permission_id   INTEGER FK → permissions.id
granted_at      DATETIME
```

---

## 🔑 Format des Permissions

Les permissions utilisent le format : `resource.action.scope`

### Exemples
```typescript
'tickets.create.all'          // Créer des tickets
'tickets.read.own'            // Voir seulement ses propres tickets
'tickets.delete.all'          // Supprimer tous les tickets
'users.update.all'            // Modifier tous les utilisateurs
'media.upload.all'            // Uploader des médias
'roles.create.all'            // Créer des rôles (super-admin)
```

---

## 📋 Liste Complète des Permissions

### 🎫 Tickets (10 permissions)
| Permission | Description |
|------------|-------------|
| `tickets.create.all` | Créer des tickets de maintenance |
| `tickets.read.all` | Voir tous les tickets |
| `tickets.read.own` | Voir uniquement ses propres tickets |
| `tickets.update.all` | Modifier tous les tickets |
| `tickets.update.own` | Modifier uniquement ses propres tickets |
| `tickets.delete.all` | Supprimer tous les tickets |
| `tickets.delete.own` | Supprimer uniquement ses propres tickets |
| `tickets.assign.all` | Assigner des tickets à des techniciens |
| `tickets.move.all` | Déplacer des tickets (changer statut) |
| `tickets.comment.all` | Ajouter des commentaires |

### 🏭 Machines (4 permissions)
| Permission | Description |
|------------|-------------|
| `machines.create.all` | Créer de nouvelles machines |
| `machines.read.all` | Voir toutes les machines |
| `machines.update.all` | Modifier des machines |
| `machines.delete.all` | Supprimer des machines |

### 👥 Users (5 permissions)
| Permission | Description |
|------------|-------------|
| `users.create.all` | Créer des utilisateurs |
| `users.read.all` | Voir tous les utilisateurs |
| `users.update.all` | Modifier des utilisateurs |
| `users.delete.all` | Supprimer des utilisateurs |
| `users.reset_password.all` | Réinitialiser mots de passe |

### 💬 Messages (5 permissions)
| Permission | Description |
|------------|-------------|
| `messages.create.public` | Envoyer messages publics |
| `messages.create.private` | Envoyer messages privés |
| `messages.read.all` | Lire tous les messages |
| `messages.delete.own` | Supprimer ses propres messages |
| `messages.delete.all` | Supprimer tous les messages |

### 📸 Media (3 permissions)
| Permission | Description |
|------------|-------------|
| `media.upload.all` | Uploader photos/vidéos |
| `media.delete.own` | Supprimer ses propres médias |
| `media.delete.all` | Supprimer tous les médias |

### 🔐 Roles (4 permissions - Admin uniquement)
| Permission | Description |
|------------|-------------|
| `roles.create.all` | Créer des rôles personnalisés |
| `roles.read.all` | Voir les rôles et permissions |
| `roles.update.all` | Modifier les permissions des rôles |
| `roles.delete.custom` | Supprimer rôles non-système |

---

## 👥 Rôles Prédéfinis

### 👑 Admin (Super-utilisateur)
**Toutes les permissions** - Contrôle total du système

### ⭐ Supervisor
**Gestion complète sauf rôles/permissions**
- ✅ Gestion tickets complète
- ✅ Gestion machines complète
- ✅ Créer/modifier utilisateurs (sauf admins)
- ✅ Messages publics/privés
- ✅ Upload et gestion médias
- ❌ Supprimer/réinitialiser utilisateurs
- ❌ Gérer les rôles/permissions

### 🔧 Technician
**Intervention et gestion tickets**
- ✅ Tous les droits sur les tickets
- ✅ Voir machines et utilisateurs
- ✅ Messages publics/privés
- ✅ Upload et supprimer ses médias
- ❌ Gérer machines
- ❌ Gérer utilisateurs

### 👷 Operator
**Création et suivi de ses tickets**
- ✅ Créer/voir/modifier/supprimer ses propres tickets
- ✅ Commenter tous les tickets
- ✅ Voir machines et utilisateurs
- ✅ Upload médias
- ❌ Déplacer les tickets (changer statut)
- ❌ Modifier tickets d'autres opérateurs
- ❌ Messages privés
- ❌ Gérer machines/utilisateurs

---

## 💻 Utilisation dans le Code

### Vérifier une Permission
```typescript
import { hasPermission } from '../utils/permissions';

const canDelete = await hasPermission(
  c.env.DB, 
  userRole, 
  'tickets', 
  'delete', 
  'all'
);

if (!canDelete) {
  return c.json({ error: 'Permission refusée' }, 403);
}
```

### Middleware de Permission
```typescript
import { requirePermission, requireAnyPermission } from '../middlewares/auth';

// Exige une permission spécifique
app.post('/api/machines', 
  authMiddleware, 
  requirePermission('machines', 'create', 'all'),
  async (c) => { /* ... */ }
);

// Exige AU MOINS UNE permission
app.get('/api/tickets',
  authMiddleware,
  requireAnyPermission([
    'tickets.read.all',
    'tickets.read.own'
  ]),
  async (c) => { /* ... */ }
);
```

### Vérifier Plusieurs Permissions
```typescript
import { hasAnyPermission, hasAllPermissions } from '../utils/permissions';

// Au moins une permission
const canAccess = await hasAnyPermission(c.env.DB, userRole, [
  'tickets.read.all',
  'tickets.read.own'
]);

// Toutes les permissions requises
const isSuperUser = await hasAllPermissions(c.env.DB, userRole, [
  'users.create.all',
  'users.update.all',
  'users.delete.all'
]);
```

---

## 🔧 Gestion des Rôles via API

### Créer un Rôle Personnalisé
```bash
POST /api/roles
Authorization: Bearer <admin_token>

{
  "name": "maintenance_lead",
  "display_name": "Chef d'Équipe Maintenance",
  "description": "Responsable d'équipe avec permissions étendues",
  "permission_ids": [1, 2, 3, 4, 5, 10, 11, 12]
}
```

### Modifier les Permissions d'un Rôle
```bash
PUT /api/roles/:id
Authorization: Bearer <admin_token>

{
  "display_name": "Chef d'Équipe Maintenance",
  "description": "Description mise à jour",
  "permission_ids": [1, 2, 3, 4, 5, 6, 10, 11, 12, 20]
}
```

### Lister Toutes les Permissions Disponibles
```bash
GET /api/roles/permissions/all
Authorization: Bearer <admin_token>
```

### Supprimer un Rôle Personnalisé
```bash
DELETE /api/roles/:id
Authorization: Bearer <admin_token>
```

---

## 🎨 Interface Admin (À implémenter)

### Page de Gestion des Rôles
- Liste de tous les rôles (système + personnalisés)
- Badge "Système" pour les rôles non-supprimables
- Compteur de permissions par rôle
- Boutons Modifier/Supprimer

### Formulaire de Création/Modification
- Nom technique (slug)
- Nom d'affichage
- Description
- **Sélection des permissions** :
  - Groupées par ressource (Tickets, Machines, Users, etc.)
  - Checkboxes pour chaque permission
  - Description visible au survol

### Exemple UI
```jsx
<RolePermissionsSelector 
  permissions={allPermissions}
  selected={rolePermissions}
  onChange={setRolePermissions}
  groupBy="resource"
/>
```

---

## 🔄 Migration des Utilisateurs Existants

Les utilisateurs existants gardent leurs rôles actuels :
- `admin` → Toutes permissions
- `supervisor` → Permissions superviseur
- `technician` → Permissions technicien
- `operator` → Permissions opérateur

Aucune action requise, les permissions sont attribuées automatiquement via la migration.

---

## 🛡️ Sécurité

### Protection des Rôles Système
- ❌ Impossible de supprimer `admin`, `supervisor`, `technician`, `operator`
- ✅ Possible de modifier leurs permissions (admin uniquement)

### Cache des Permissions
- TTL: 5 minutes
- Vidé automatiquement après modification d'un rôle
- Optimise les performances (évite requêtes DB répétées)

### Validation
- Vérification existence du rôle
- Vérification utilisateurs assignés avant suppression
- Protection contre les permissions invalides

---

## 📈 Cas d'Usage Avancés

### Exemple 1: Créer un Rôle "Auditeur"
**Objectif**: Lecture seule de tout le système

```sql
INSERT INTO roles (name, display_name, description, is_system)
VALUES ('auditor', 'Auditeur', 'Accès lecture seule à tout le système', 0);

INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'auditor'),
  id
FROM permissions
WHERE action = 'read';
```

### Exemple 2: Créer un Rôle "Chef d'Équipe"
**Objectif**: Gestion tickets + assignation

```typescript
// Permissions: tickets.*, machines.read, users.read, messages.*
const permissions = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,  // Tous tickets
  12,  // machines.read
  16,  // users.read
  20, 21, 22,  // messages
  25  // media.upload
];
```

### Exemple 3: Rôle "Planificateur"
**Objectif**: Créer et assigner des tickets, aucune modification

```typescript
const permissions = [
  1,   // tickets.create
  2,   // tickets.read.all
  8,   // tickets.assign
  12,  // machines.read
  16   // users.read
];
```

---

## 🔍 Debugging

### Voir les Permissions d'un Utilisateur
```typescript
import { getRolePermissions } from '../utils/permissions';

const userPermissions = await getRolePermissions(c.env.DB, userRole);
console.log('User permissions:', userPermissions);
```

### Vider le Cache
```typescript
import { clearPermissionsCache } from '../utils/permissions';

// Après modification d'un rôle
clearPermissionsCache();
```

### Logs de Débogage
Les middlewares de permissions loggent automatiquement :
- Permission requise
- Rôle de l'utilisateur
- Résultat (autorisé/refusé)

---

## 🚀 Prochaines Étapes

1. ✅ Appliquer la migration `0008_create_rbac_system.sql`
2. ⏳ Créer l'interface admin de gestion des rôles
3. ⏳ Remplacer les anciens middlewares par les nouveaux
4. ⏳ Tester avec des rôles personnalisés
5. ⏳ Documenter les nouveaux rôles dans le README

---

## 📞 Support

Pour toute question sur le système RBAC :
- Consulter ce guide
- Vérifier les logs de permissions
- Tester avec `hasPermission()` dans la console

**Bonne gestion des permissions ! 🎉**
