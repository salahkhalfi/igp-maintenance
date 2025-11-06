# 🔄 Plan d'Intégration RBAC - Approche Prudente

## ⚠️ IMPORTANT: Gestion des Apostrophes

**CRITIQUE**: Toutes les chaînes SQL contiennent des apostrophes françaises (l', d', etc.)

### ✅ Sécurité Garantie
- ✅ Toutes les requêtes utilisent `.bind()` avec paramètres
- ✅ Aucune concaténation de strings SQL
- ✅ Apostrophes dans les descriptions sont SÛRES (paramétrisées)

### Exemple Sécurisé
```typescript
// ✅ BON - Paramétrisé
await DB.prepare(
  "INSERT INTO permissions (description) VALUES (?)"
).bind("Permet de créer l'utilisateur").run();

// ❌ MAUVAIS - Concaténation (non utilisé dans notre code)
await DB.prepare(
  "INSERT INTO permissions (description) VALUES ('" + desc + "')"
).run();
```

---

## 📋 Plan d'Intégration Progressive

### Phase 1: Test en Local (ACTUEL)
**Objectif**: Valider le système sans impact sur production

#### Étape 1.1: Appliquer la Migration
```bash
# En local uniquement
cd /home/user/webapp
npm run db:migrate:local
```

**Vérifications**:
- ✅ Tables créées: `roles`, `permissions`, `role_permissions`
- ✅ 4 rôles système insérés
- ✅ 35 permissions créées
- ✅ Permissions assignées aux rôles

#### Étape 1.2: Tester les Utilitaires
```typescript
// Test dans un endpoint temporaire
import { hasPermission, getRolePermissions } from '../utils/permissions';

app.get('/api/test-rbac', authMiddleware, async (c) => {
  const user = c.get('user') as any;
  
  // Test 1: Vérifier une permission
  const canCreate = await hasPermission(
    c.env.DB, 
    user.role, 
    'tickets', 
    'create', 
    'all'
  );
  
  // Test 2: Lister toutes les permissions du rôle
  const permissions = await getRolePermissions(c.env.DB, user.role);
  
  return c.json({
    role: user.role,
    canCreateTickets: canCreate,
    allPermissions: permissions
  });
});
```

#### Étape 1.3: Tester un Middleware
```typescript
// Test sur un endpoint non-critique
import { requirePermission } from '../middlewares/auth';

app.get('/api/test-permission',
  authMiddleware,
  requirePermission('tickets', 'read', 'all'),
  async (c) => {
    return c.json({ message: 'Permission accordée!' });
  }
);
```

---

### Phase 2: Migration Progressive des Endpoints

**Stratégie**: Remplacer les anciens middlewares UN PAR UN

#### Ordre de Migration (du moins au plus critique)

##### 1️⃣ Endpoints de Lecture (faible risque)
```typescript
// AVANT
app.get('/api/machines', authMiddleware, async (c) => {...})

// APRÈS
app.get('/api/machines', 
  authMiddleware,
  requirePermission('machines', 'read', 'all'),
  async (c) => {...}
)
```

##### 2️⃣ Endpoints de Création
```typescript
// AVANT
app.post('/api/tickets', authMiddleware, async (c) => {...})

// APRÈS
app.post('/api/tickets',
  authMiddleware,
  requirePermission('tickets', 'create', 'all'),
  async (c) => {...}
)
```

##### 3️⃣ Endpoints Sensibles (modification/suppression)
```typescript
// AVANT
app.delete('/api/users/:id', authMiddleware, adminOnly, async (c) => {...})

// APRÈS
app.delete('/api/users/:id',
  authMiddleware,
  requirePermission('users', 'delete', 'all'),
  async (c) => {...}
)
```

---

### Phase 3: Tests de Non-Régression

#### Checklist de Tests

**Admin** (doit tout pouvoir faire):
- ✅ Créer/modifier/supprimer tickets
- ✅ Créer/modifier/supprimer machines
- ✅ Créer/modifier/supprimer utilisateurs
- ✅ Accéder aux rôles et permissions

**Supervisor** (restrictions):
- ✅ Gérer tickets et machines
- ✅ Créer/modifier utilisateurs (sauf admins)
- ❌ Supprimer utilisateurs
- ❌ Gérer rôles/permissions

**Technician** (tickets + lecture):
- ✅ Gérer tous les tickets
- ✅ Voir machines et utilisateurs
- ❌ Modifier machines
- ❌ Gérer utilisateurs

**Operator** (limité à ses tickets):
- ✅ Créer et voir ses tickets
- ✅ Modifier/supprimer SES tickets
- ❌ Modifier tickets d'autres opérateurs
- ❌ Déplacer les tickets

---

### Phase 4: Intégration API Roles

**Nouvelle Route à Ajouter**:
```typescript
// Dans src/index.tsx
import roles from './routes/roles';

// Protéger la route avec admin uniquement
app.use('/api/roles/*', authMiddleware, adminOnly);
app.route('/api/roles', roles);
```

**Tester les Endpoints**:
```bash
# Lister les rôles
GET /api/roles
Authorization: Bearer <admin_token>

# Lister les permissions
GET /api/roles/permissions/all
Authorization: Bearer <admin_token>

# Créer un rôle personnalisé
POST /api/roles
{
  "name": "test_role",
  "display_name": "Rôle Test",
  "description": "Test du système",
  "permission_ids": [1, 2, 3]
}
```

---

## 🔍 Points de Vigilance

### 1. Apostrophes dans les Requêtes
**Status**: ✅ SÉCURISÉ
- Toutes les descriptions françaises sont paramétrées
- Utilisation systématique de `.bind()`
- Aucun risque d'injection SQL

### 2. Cache des Permissions
**Considération**: Cache de 5 minutes
- ✅ Vidé automatiquement après modification rôle
- ⚠️ Redémarrer le service si changements ne sont pas pris en compte
- 💡 Utiliser `clearPermissionsCache()` si nécessaire

### 3. Backward Compatibility
**Status**: ✅ COMPATIBLE
- Anciens middlewares (`adminOnly`, etc.) fonctionnent toujours
- Migration progressive possible
- Pas de breaking changes

### 4. Performance
**Impact**: Minimal
- Cache réduit les requêtes DB
- Index optimisés sur les tables
- Requêtes simples (1-2 JOINs max)

---

## 🚀 Commandes de Déploiement

### En Local (TEST)
```bash
# 1. Appliquer la migration
npm run db:migrate:local

# 2. Vérifier les tables
npx wrangler d1 execute maintenance-db --local --command="
SELECT COUNT(*) as roles_count FROM roles;
SELECT COUNT(*) as permissions_count FROM permissions;
SELECT COUNT(*) as assignments FROM role_permissions;
"

# 3. Tester un rôle
npx wrangler d1 execute maintenance-db --local --command="
SELECT p.resource, p.action, p.scope
FROM permissions p
INNER JOIN role_permissions rp ON p.id = rp.permission_id
INNER JOIN roles r ON rp.role_id = r.id
WHERE r.name = 'admin'
LIMIT 5;
"

# 4. Rebuild et restart
npm run build
pm2 restart maintenance-app
```

### En Production (APRÈS TESTS)
```bash
# 1. Appliquer la migration production
npm run db:migrate:prod

# 2. Déployer
npm run deploy
```

---

## ✅ Checklist Avant Production

- [ ] Migration testée en local
- [ ] Tous les rôles ont les bonnes permissions
- [ ] Tests avec chaque rôle (admin, supervisor, technician, operator)
- [ ] Aucune régression sur les fonctionnalités existantes
- [ ] Cache de permissions fonctionne
- [ ] API `/api/roles` accessible (admin uniquement)
- [ ] Documentation RBAC_GUIDE.md à jour
- [ ] Backup de la base de données avant migration prod

---

## 🆘 Rollback Plan

Si problème en production:

### Option 1: Revenir à l'ancien système
```sql
-- Supprimer les nouvelles tables
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
```

### Option 2: Désactiver temporairement
```typescript
// Retourner aux anciens middlewares
// Commenter les nouveaux requirePermission()
// Utiliser adminOnly, supervisorOrAdmin, etc.
```

---

## 📞 Support

**En cas de problème**:
1. Vérifier les logs PM2: `pm2 logs maintenance-app --nostream`
2. Tester les permissions: `/api/test-rbac`
3. Vider le cache: `clearPermissionsCache()`
4. Consulter RBAC_GUIDE.md

**Bonne migration ! 🎉**
