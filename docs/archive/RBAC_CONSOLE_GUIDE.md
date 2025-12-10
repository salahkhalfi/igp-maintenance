# 🎮 Guide RBAC - Test depuis la Console du Navigateur

## 🚀 Accès à la Console

1. **Ouvrir votre application** : `http://localhost:7000` (ou votre URL de production)
2. **Ouvrir la Console** : 
   - Windows/Linux: `F12` ou `Ctrl + Shift + J`
   - Mac: `Cmd + Option + J`
3. **Aller dans l'onglet "Console"**

---

## 🔑 Étape 1: Se Connecter (si pas déjà connecté)

Si vous êtes déjà connecté en tant qu'admin dans l'application, **sautez cette étape** - votre token est déjà stocké !

Sinon, exécutez dans la console :

```javascript
// Se connecter
fetch('http://localhost:7000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@igp.com',
    password: 'admin123'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Connecté !', data);
  localStorage.setItem('token', data.token);
  window.currentUser = data.user;
})
```

---

## 🧪 Étape 2: Tester Vos Permissions

### Test Complet de Vos Permissions

```javascript
// Voir toutes vos permissions
fetch('http://localhost:7000/api/rbac/test', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('🎯 Mes Permissions:', data);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Rôle:', data.user.role);
  console.log('📊 Total permissions:', data.permissions.total);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Peut créer tickets:', data.specificTests.canCreateTickets);
  console.log('✅ Peut supprimer tous tickets:', data.specificTests.canDeleteAllTickets);
  console.log('✅ Peut créer machines:', data.specificTests.canCreateMachines);
  console.log('✅ Peut créer users:', data.specificTests.canCreateUsers);
  console.log('✅ Peut gérer rôles:', data.specificTests.canManageRoles);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Liste complète des permissions:');
  data.permissions.list.forEach((p, i) => {
    console.log(`  ${i+1}. ${p}`);
  });
});
```

**Résultat attendu (Admin)** :
```
🎯 Mes Permissions: {...}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Rôle: admin
📊 Total permissions: 31
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Peut créer tickets: true
✅ Peut supprimer tous tickets: true
✅ Peut créer machines: true
✅ Peut créer users: true
✅ Peut gérer rôles: true
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Liste complète des permissions:
  1. tickets.create.all
  2. tickets.read.all
  3. tickets.update.all
  ...
  31. roles.delete.custom
```

---

## 🎨 Étape 3: Lister Tous les Rôles

```javascript
// Voir tous les rôles disponibles
fetch('http://localhost:7000/api/roles', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('👥 RÔLES DISPONIBLES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  data.roles.forEach(role => {
    console.log(`${role.is_system ? '🔒' : '🔓'} ${role.display_name} (${role.name})`);
    console.log(`   📊 ${role.permissions_count} permissions`);
    console.log(`   📝 ${role.description}`);
    console.log('');
  });
});
```

**Résultat attendu** :
```
👥 RÔLES DISPONIBLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 Administrateur (admin)
   📊 31 permissions
   📝 Accès complet au système...

🔒 Superviseur (supervisor)
   📊 25 permissions
   📝 Gestion des tickets, machines...

🔒 Technicien (technician)
   📊 16 permissions
   📝 Intervention sur les tickets...

🔒 Opérateur (operator)
   📊 11 permissions
   📝 Création et suivi de ses propres tickets...
```

---

## 🔍 Étape 4: Voir Détails d'un Rôle

```javascript
// Voir les permissions détaillées du rôle Technicien (ID: 3)
fetch('http://localhost:7000/api/roles/3', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  const role = data.role;
  console.log(`🔧 ${role.display_name} (${role.name})`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝', role.description);
  console.log('');
  console.log('📋 PERMISSIONS:');
  
  // Grouper par ressource
  const grouped = {};
  role.permissions.forEach(p => {
    if (!grouped[p.resource]) grouped[p.resource] = [];
    grouped[p.resource].push(p);
  });
  
  Object.keys(grouped).forEach(resource => {
    console.log(`\n📦 ${resource.toUpperCase()}`);
    grouped[resource].forEach(p => {
      console.log(`   ✓ ${p.display_name} (${p.action}.${p.scope})`);
    });
  });
});
```

**Résultat attendu** :
```
🔧 Technicien (technician)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Intervention sur les tickets, déplacement et modification

📋 PERMISSIONS:

📦 TICKETS
   ✓ Créer des tickets (create.all)
   ✓ Voir tous les tickets (read.all)
   ✓ Modifier tous les tickets (update.all)
   ...

📦 MACHINES
   ✓ Voir les machines (read.all)

📦 USERS
   ✓ Voir les utilisateurs (read.all)
...
```

---

## 📋 Étape 5: Lister Toutes les Permissions Disponibles

```javascript
// Voir toutes les permissions du système
fetch('http://localhost:7000/api/roles/permissions/all', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('🎯 TOUTES LES PERMISSIONS DISPONIBLES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Total:', data.permissions.length);
  console.log('');
  
  Object.keys(data.grouped).forEach(resource => {
    console.log(`\n📦 ${resource.toUpperCase()} (${data.grouped[resource].length} permissions)`);
    data.grouped[resource].forEach(p => {
      console.log(`   [${p.id}] ${p.display_name}`);
      console.log(`       → ${p.resource}.${p.action}.${p.scope}`);
    });
  });
});
```

---

## 🎨 Étape 6: Créer un Rôle Personnalisé

### Exemple: Créer un "Auditeur" (lecture seule)

```javascript
// Créer un rôle Auditeur avec accès lecture seule
fetch('http://localhost:7000/api/roles', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'auditor',
    display_name: 'Auditeur',
    description: 'Accès en lecture seule à tout le système pour audit et reporting',
    permission_ids: [2, 3, 12, 16, 22]  // read permissions
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Rôle créé avec succès !', data);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🆔 ID:', data.role.id);
  console.log('📛 Nom:', data.role.display_name);
  console.log('🔓 Type:', data.role.is_system ? 'Système' : 'Personnalisé');
});
```

### Exemple: Créer un "Chef d'Équipe"

```javascript
// Créer un rôle Chef d'Équipe avec gestion complète des tickets
fetch('http://localhost:7000/api/roles', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'team_lead',
    display_name: 'Chef d Équipe',
    description: 'Gestion complète des tickets, assignation, messages équipe',
    permission_ids: [
      1,2,3,4,5,6,7,8,9,10,  // Tous tickets
      12,                     // Lecture machines
      16,                     // Lecture users
      20,21,22,               // Messages
      25                      // Upload media
    ]
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Chef d Équipe créé !', data);
});
```

### Exemple: Créer un "Planificateur"

```javascript
// Créer un rôle Planificateur (création et assignation uniquement)
fetch('http://localhost:7000/api/roles', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'planner',
    display_name: 'Planificateur',
    description: 'Peut créer et assigner des tickets, aucune modification',
    permission_ids: [1, 2, 8, 12, 16]  // create, read, assign, view machines/users
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Planificateur créé !', data);
});
```

---

## ✏️ Étape 7: Modifier un Rôle

```javascript
// Modifier le rôle Auditeur (ID: 5) pour ajouter des permissions
fetch('http://localhost:7000/api/roles/5', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    display_name: 'Auditeur Senior',
    description: 'Accès lecture + export de rapports',
    permission_ids: [2, 3, 12, 16, 22, 25]  // Ajouter upload media
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Rôle modifié !', data);
});
```

---

## 🗑️ Étape 8: Supprimer un Rôle Personnalisé

```javascript
// Supprimer le rôle Auditeur (ID: 5)
fetch('http://localhost:7000/api/roles/5', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Rôle supprimé !', data);
});
```

**Note**: Les rôles système (admin, supervisor, technician, operator) NE PEUVENT PAS être supprimés.

---

## 🎯 Fonction Utilitaire Complète

Copiez cette fonction dans la console pour faciliter les tests :

```javascript
// Utilitaire RBAC complet
window.rbac = {
  // Voir mes permissions
  async myPermissions() {
    const res = await fetch('http://localhost:7000/api/rbac/test', {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    const data = await res.json();
    console.log('🎯 Mes Permissions:', data);
    return data;
  },
  
  // Lister tous les rôles
  async listRoles() {
    const res = await fetch('http://localhost:7000/api/roles', {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    const data = await res.json();
    console.table(data.roles);
    return data.roles;
  },
  
  // Voir détails d'un rôle
  async getRole(id) {
    const res = await fetch(`http://localhost:7000/api/roles/${id}`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    const data = await res.json();
    console.log(`🔍 Rôle #${id}:`, data);
    return data.role;
  },
  
  // Toutes les permissions
  async allPermissions() {
    const res = await fetch('http://localhost:7000/api/roles/permissions/all', {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    const data = await res.json();
    console.log('📋 Permissions groupées:', data.grouped);
    return data;
  },
  
  // Créer un rôle
  async createRole(name, displayName, description, permissionIds) {
    const res = await fetch('http://localhost:7000/api/roles', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        display_name: displayName,
        description,
        permission_ids: permissionIds
      })
    });
    const data = await res.json();
    console.log('✅ Rôle créé:', data);
    return data;
  },
  
  // Supprimer un rôle
  async deleteRole(id) {
    const res = await fetch(`http://localhost:7000/api/roles/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    const data = await res.json();
    console.log('🗑️ Rôle supprimé:', data);
    return data;
  }
};

console.log('✅ Utilitaire RBAC chargé !');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Commandes disponibles:');
console.log('  rbac.myPermissions()');
console.log('  rbac.listRoles()');
console.log('  rbac.getRole(id)');
console.log('  rbac.allPermissions()');
console.log('  rbac.createRole(name, display, desc, permIds)');
console.log('  rbac.deleteRole(id)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
```

### Utilisation de l'utilitaire :

```javascript
// Voir mes permissions
await rbac.myPermissions();

// Lister les rôles
await rbac.listRoles();

// Voir détails du rôle Admin (ID: 1)
await rbac.getRole(1);

// Toutes les permissions disponibles
await rbac.allPermissions();

// Créer un auditeur
await rbac.createRole(
  'auditor', 
  'Auditeur', 
  'Lecture seule', 
  [2, 3, 12, 16, 22]
);

// Supprimer un rôle
await rbac.deleteRole(5);
```

---

## ✅ Checklist de Test Console

1. [ ] Ouvrir la console (F12)
2. [ ] Vérifier que vous êtes connecté (token présent)
3. [ ] Tester `rbac.myPermissions()` → Voir vos 31 permissions (admin)
4. [ ] Tester `rbac.listRoles()` → Voir les 4 rôles système
5. [ ] Tester `rbac.getRole(3)` → Détails du Technicien
6. [ ] Tester `rbac.allPermissions()` → Voir toutes les 31 permissions
7. [ ] Créer un rôle "Auditeur" personnalisé
8. [ ] Lister à nouveau → Voir le 5ème rôle créé
9. [ ] Supprimer le rôle créé
10. [ ] Essayer de supprimer un rôle système → Devrait échouer

---

## 🎉 Résultat Attendu

**Tous les tests devraient fonctionner parfaitement depuis la console !**

✅ Admin a accès à tout\
✅ Peut créer des rôles personnalisés\
✅ Peut modifier/supprimer rôles personnalisés\
✅ Rôles système protégés\
✅ Interface console simple et rapide

**Le système RBAC est prêt et fonctionnel ! 🚀**
