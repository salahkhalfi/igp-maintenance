# 🔄 Guide de Migration - Système de Rôles Flexible

**Objectif**: Transformer les 63 vérifications hardcodées en vérifications basées sur permissions

---

## 📊 STATISTIQUES DE MIGRATION

| Métrique | Valeur |
|----------|--------|
| **Vérifications hardcodées** | 63 |
| **Lignes à modifier** | ~150 |
| **Nouveaux hooks à créer** | 3 |
| **Nouveaux endpoints API** | 1 |
| **Temps estimé** | 2-3 jours |
| **Risque** | Moyen |

---

## 🎯 ÉTAPE 1: Créer les hooks de permissions (4h)

### 1.1 Hook principal: `usePermission`

**Fichier**: `src/frontend/hooks/usePermission.ts`

```typescript
import { useState, useEffect } from 'react';
import { apiGet } from '../../utils/api';

/**
 * Hook pour vérifier une permission spécifique
 * @param resource - Ressource (tickets, machines, users, etc.)
 * @param action - Action (create, read, update, delete)
 * @param scope - Portée (all, own, team)
 * @returns true si l'utilisateur a la permission
 */
export function usePermission(
  resource: string, 
  action: string, 
  scope: string = 'all'
): boolean {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        setLoading(true);
        const result = await apiGet<{ allowed: boolean }>(
          `/rbac/check?resource=${resource}&action=${action}&scope=${scope}`
        );
        setHasAccess(result.allowed);
      } catch (error) {
        console.error('Permission check failed:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [resource, action, scope]);

  return hasAccess;
}

/**
 * Hook pour vérifier plusieurs permissions (AU MOINS UNE)
 * @param permissions - Liste de permissions ["resource.action.scope", ...]
 * @returns true si l'utilisateur a au moins une permission
 */
export function useAnyPermission(permissions: string[]): boolean {
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const result = await apiGet<{ allowed: boolean }>(
          `/rbac/check-any?permissions=${permissions.join(',')}`
        );
        setHasAccess(result.allowed);
      } catch (error) {
        console.error('Permission check failed:', error);
        setHasAccess(false);
      }
    };

    checkPermissions();
  }, [permissions.join(',')]);

  return hasAccess;
}

/**
 * Hook pour vérifier plusieurs permissions (TOUTES)
 * @param permissions - Liste de permissions ["resource.action.scope", ...]
 * @returns true si l'utilisateur a toutes les permissions
 */
export function useAllPermissions(permissions: string[]): boolean {
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const result = await apiGet<{ allowed: boolean }>(
          `/rbac/check-all?permissions=${permissions.join(',')}`
        );
        setHasAccess(result.allowed);
      } catch (error) {
        console.error('Permission check failed:', error);
        setHasAccess(false);
      }
    };

    checkPermissions();
  }, [permissions.join(',')]);

  return hasAccess;
}
```

---

### 1.2 Endpoints API de vérification

**Fichier**: `src/index.tsx` (ajouter ces routes)

```typescript
// Vérifier une permission simple
app.get('/api/rbac/check', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;
    const resource = c.req.query('resource');
    const action = c.req.query('action');
    const scope = c.req.query('scope') || 'all';

    if (!resource || !action) {
      return c.json({ error: 'Paramètres manquants' }, 400);
    }

    const allowed = await hasPermission(c.env.DB, user.role, resource, action, scope);
    return c.json({ allowed });
  } catch (error) {
    console.error('RBAC check error:', error);
    return c.json({ error: 'Erreur vérification permission' }, 500);
  }
});

// Vérifier plusieurs permissions (AU MOINS UNE)
app.get('/api/rbac/check-any', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;
    const permsParam = c.req.query('permissions');
    
    if (!permsParam) {
      return c.json({ error: 'Paramètres manquants' }, 400);
    }

    const permissions = permsParam.split(',');
    
    for (const perm of permissions) {
      const [resource, action, scope = 'all'] = perm.split('.');
      const allowed = await hasPermission(c.env.DB, user.role, resource, action, scope);
      if (allowed) {
        return c.json({ allowed: true });
      }
    }

    return c.json({ allowed: false });
  } catch (error) {
    console.error('RBAC check-any error:', error);
    return c.json({ error: 'Erreur vérification permissions' }, 500);
  }
});

// Vérifier plusieurs permissions (TOUTES)
app.get('/api/rbac/check-all', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;
    const permsParam = c.req.query('permissions');
    
    if (!permsParam) {
      return c.json({ error: 'Paramètres manquants' }, 400);
    }

    const permissions = permsParam.split(',');
    
    for (const perm of permissions) {
      const [resource, action, scope = 'all'] = perm.split('.');
      const allowed = await hasPermission(c.env.DB, user.role, resource, action, scope);
      if (!allowed) {
        return c.json({ allowed: false });
      }
    }

    return c.json({ allowed: true });
  } catch (error) {
    console.error('RBAC check-all error:', error);
    return c.json({ error: 'Erreur vérification permissions' }, 500);
  }
});
```

---

### 1.3 Helper pour affichage conditionnel

**Fichier**: `src/frontend/hooks/useRoleDisplay.ts`

```typescript
/**
 * Hook pour obtenir l'icône et le texte d'un rôle
 * Compatible avec nouveaux rôles personnalisés
 */
export function useRoleDisplay(role: string) {
  const ROLE_CONFIG = {
    admin: {
      icon: '👑',
      label: 'Administrateur',
      labelShort: 'Admin',
      color: 'bg-red-100 text-red-800',
      description: 'Accès complet - Peut tout faire'
    },
    supervisor: {
      icon: '⭐',
      label: 'Superviseur',
      labelShort: 'Superviseur',
      color: 'bg-yellow-100 text-yellow-800',
      description: 'Gestion complète sauf rôles/permissions'
    },
    technician: {
      icon: '🔧',
      label: 'Technicien',
      labelShort: 'Technicien',
      color: 'bg-blue-100 text-blue-800',
      description: 'Gestion tickets + lecture'
    },
    operator: {
      icon: '👤',
      label: 'Opérateur',
      labelShort: 'Opérateur',
      color: 'bg-gray-100 text-gray-800',
      description: 'Tickets propres uniquement'
    },
    default: {
      icon: '👤',
      label: 'Utilisateur',
      labelShort: 'User',
      color: 'bg-purple-100 text-purple-800',
      description: 'Rôle personnalisé'
    }
  };

  return ROLE_CONFIG[role] || ROLE_CONFIG.default;
}
```

---

## 🔄 ÉTAPE 2: Migration des vérifications (12h)

### 2.1 Pattern de migration - Boutons conditionnels

#### **AVANT (hardcodé)**
```typescript
// Ligne 1942, 2019, 2344
if (show && (currentUser.role === 'admin' || currentUser.role === 'supervisor')) {
  return React.createElement('button', {
    onClick: () => setShowUsersModal(true)
  }, 'Gestion Utilisateurs');
}
```

#### **APRÈS (basé permissions)**
```typescript
const canManageUsers = useAnyPermission(['users.update.all', 'users.delete.all']);

if (show && canManageUsers) {
  return React.createElement('button', {
    onClick: () => setShowUsersModal(true)
  }, 'Gestion Utilisateurs');
}
```

---

### 2.2 Pattern de migration - Affichage d'icônes/labels

#### **AVANT (hardcodé)**
```typescript
// Lignes 1462-1464
if (currentUser.role === 'admin') return '👑 Admin';
if (currentUser.role === 'supervisor') return '⭐ Superviseur';
if (currentUser.role === 'technician') return '🔧 Technicien';
return '👤 Utilisateur';
```

#### **APRÈS (config-based)**
```typescript
const roleDisplay = useRoleDisplay(currentUser.role);
return `${roleDisplay.icon} ${roleDisplay.labelShort}`;
```

---

### 2.3 Pattern de migration - Permissions complexes

#### **AVANT (hardcodé)**
```typescript
// Lignes 2537-2540
const canEdit = 
  (currentUser.role === 'technician' && (!ticket.scheduled_date || ticket.reported_by === currentUser.id)) || 
  (currentUser.role === 'supervisor') ||
  (currentUser.role === 'admin') ||
  (currentUser.role === 'operator' && ticket.reported_by === currentUser.id);
```

#### **APRÈS (basé permissions + logique métier)**
```typescript
const canEditAllTickets = usePermission('tickets', 'update', 'all');
const canEditOwnTickets = usePermission('tickets', 'update', 'own');

const canEdit = useMemo(() => {
  // Permission "all" = peut éditer tous les tickets non planifiés
  if (canEditAllTickets && !ticket.scheduled_date) {
    return true;
  }
  
  // Permission "own" = peut éditer ses propres tickets
  if (canEditOwnTickets && ticket.reported_by === currentUser.id) {
    return true;
  }
  
  return false;
}, [canEditAllTickets, canEditOwnTickets, ticket, currentUser]);
```

---

### 2.4 Pattern de migration - Suppression conditionnelle

#### **AVANT (hardcodé)**
```typescript
// Lignes 624-626
const canDelete = 
  user.role === 'admin' || 
  (user.role === 'supervisor' && message.sender_role !== 'admin');
```

#### **APRÈS (basé permissions + règles métier)**
```typescript
const canDeleteAllMessages = usePermission('messages', 'delete', 'all');
const canDeleteOwnMessages = usePermission('messages', 'delete', 'own');

const canDelete = useMemo(() => {
  // Admin peut tout supprimer
  if (canDeleteAllMessages) {
    return true;
  }
  
  // Autres rôles ne peuvent pas supprimer les messages des admins
  if (canDeleteOwnMessages && message.sender_role !== 'admin') {
    return true;
  }
  
  return false;
}, [canDeleteAllMessages, canDeleteOwnMessages, message]);
```

---

### 2.5 Pattern de migration - Endpoints conditionnels

#### **AVANT (hardcodé)**
```typescript
// Ligne 3372
const endpoint = currentUser.role === 'technician' ? '/users/team' : '/users';
```

#### **APRÈS (basé permissions)**
```typescript
const canViewAllUsers = usePermission('users', 'read', 'all');
const endpoint = canViewAllUsers ? '/users' : '/users/team';
```

---

## 📋 CHECKLIST DE MIGRATION

### Phase 1: Infrastructure (4h)
- [ ] Créer `src/frontend/hooks/usePermission.ts`
- [ ] Créer `src/frontend/hooks/useRoleDisplay.ts`
- [ ] Ajouter routes `/api/rbac/check*` dans `src/index.tsx`
- [ ] Tester les hooks avec rôles existants
- [ ] Vérifier les performances (cache si nécessaire)

### Phase 2: Migration par catégorie (12h)

#### Catégorie 1: Affichage simple (2h)
- [ ] Icônes de rôles (lignes 1462-1464, 3407-3409)
- [ ] Couleurs de badges (lignes 3414-3416, 4270-4271)
- [ ] Labels de rôles (lignes 4277-4278, 2421-2423)
- [ ] Descriptions (lignes 120-123)

#### Catégorie 2: Boutons d'action (3h)
- [ ] Bouton Gestion Utilisateurs (lignes 1942, 2019, 2344)
- [ ] Boutons de suppression (lignes 3131, 3299, 3584)
- [ ] Boutons d'édition (lignes 2240, 2615)

#### Catégorie 3: Permissions complexes (4h)
- [ ] Édition tickets (lignes 2381, 2537-2540)
- [ ] Suppression messages (lignes 624-626, 4242)
- [ ] Gestion utilisateurs (lignes 3481, 3483, 3809)

#### Catégorie 4: Accès sections (3h)
- [ ] Accès fonctionnalités avancées (lignes 5040, 5082, 5116, 5490)
- [ ] Endpoints conditionnels (ligne 3372)
- [ ] Affichage titres (ligne 3570)

### Phase 3: Tests et validation (4h)
- [ ] Tester avec rôles existants (admin, supervisor, technician, operator)
- [ ] Créer un rôle test "Manager" avec permissions mixtes
- [ ] Vérifier tous les boutons sont visibles/cachés correctement
- [ ] Tester les cas limites (permissions "own" vs "all")
- [ ] Vérifier les performances (pas de requêtes excessives)

---

## 🧪 PLAN DE TEST

### Test 1: Rôle "Manager" (permissions intermédiaires)
```sql
-- Créer le rôle Manager
INSERT INTO roles (name, description) VALUES 
  ('manager', 'Gestionnaire - Peut gérer tickets et machines');

-- Assigner permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'manager'),
  id
FROM permissions
WHERE 
  (resource = 'tickets' AND action IN ('create', 'read', 'update', 'delete') AND scope = 'all')
  OR (resource = 'machines' AND action IN ('read', 'update') AND scope = 'all')
  OR (resource = 'messages' AND action IN ('create', 'read') AND scope = 'all');
```

**Résultats attendus:**
- ✅ Peut créer/modifier/supprimer tickets
- ✅ Peut voir et modifier machines
- ✅ Peut créer/lire messages
- ❌ Ne peut PAS gérer utilisateurs
- ❌ Ne peut PAS gérer rôles

---

### Test 2: Rôle "Viewer" (lecture seule)
```sql
-- Créer le rôle Viewer
INSERT INTO roles (name, description) VALUES 
  ('viewer', 'Observateur - Lecture seule');

-- Assigner permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'viewer'),
  id
FROM permissions
WHERE action = 'read' AND scope = 'all';
```

**Résultats attendus:**
- ✅ Peut voir tickets/machines/messages
- ❌ Aucun bouton de création/modification/suppression
- ✅ Interface accessible mais limitée

---

## 🚨 POINTS D'ATTENTION

### 1. **Performance**
- Les hooks font des requêtes API pour chaque permission
- Risque: Trop de requêtes si hooks appelés dans boucles
- **Solution**: Implémenter cache côté frontend (5 min TTL)

### 2. **Loading states**
- Les hooks nécessitent un fetch initial
- Risque: Flickering UI (boutons qui apparaissent/disparaissent)
- **Solution**: Skeleton loaders pendant chargement initial

### 3. **Logique métier complexe**
- Certaines règles ne sont pas que des permissions
  - Ex: "supervisor ne peut pas supprimer messages admin"
  - Ex: "technician ne peut éditer que tickets non planifiés"
- **Solution**: Combiner permissions + règles métier dans useMemo

### 4. **Compatibilité arrière**
- Migration progressive = code mixte temporairement
- Risque: Confusion entre anciennes et nouvelles vérifications
- **Solution**: Commenter clairement les sections migrées

---

## 📊 MÉTRIQUES DE SUCCÈS

| Métrique | Avant | Objectif |
|----------|-------|----------|
| **Vérifications hardcodées** | 63 | 0 |
| **Nouveaux rôles supportés** | 0 | ∞ |
| **Couverture tests** | 0% | 80% |
| **Temps ajout nouveau rôle** | N/A (cassé) | 5 min |
| **Flexibilité permissions** | 0/10 | 10/10 |

---

## 🎯 PROCHAINES ÉTAPES

1. **Valider ce plan** avec l'équipe
2. **Créer branche** `feature/rbac-frontend-migration`
3. **Implémenter Phase 1** (hooks + endpoints)
4. **Tester Phase 1** avec rôles existants
5. **Migration progressive** Phase 2 (par catégorie)
6. **Tests complets** Phase 3
7. **Code review** et merge
8. **Créer rôle test** en production

---

**Temps total estimé**: 20h (2.5 jours)  
**Priorité**: Haute (bloque extensibilité)  
**Risque**: Moyen (migration progressive réduit les risques)
