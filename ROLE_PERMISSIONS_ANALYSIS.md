# Analyse des Permissions par Rôle - Système de Maintenance IGP Glass

## 📊 Vue d'ensemble

| Rôle | Nom Affiché | Permissions | Logique Métier |
|------|-------------|-------------|----------------|
| **admin** | Administrateur | **31** | ✅ Complet - Configuration système |
| **director** | Directeur Général | **5** | ✅ Lecture seule - Vue d'ensemble |
| **supervisor** | Superviseur | **25** | ✅ Quasi-complet - Gestion équipe |
| **coordinator** | Coordonnateur Maintenance | **12** | ⚠️ À REVOIR - Manque delete |
| **planner** | Planificateur Maintenance | **11** | ⚠️ À REVOIR - Manque delete |
| **senior_technician** | Technicien Senior | **16** | ✅ Excellent - Tech + assignation |
| **technician** | Technicien | **16** | ✅ Excellent - Exécution technique |
| **team_leader** | Chef Équipe Production | **8** | ⚠️ LIMITÉ - Devrait avoir update/move |
| **furnace_operator** | Opérateur Four | **8** | ✅ Bon - Focus équipement critique |
| **operator** | Opérateur | **11** | ✅ Bon - Signalement + suivi |
| **safety_officer** | Agent Santé & Sécurité | **9** | ✅ Excellent - Blocage machines |
| **quality_inspector** | Inspecteur Qualité | **7** | ✅ Bon - Traçabilité |
| **storekeeper** | Magasinier | **5** | ⚠️ LIMITÉ - Devrait créer tickets pièces |
| **viewer** | Lecture Seule | **5** | ✅ Parfait - Audit/consultation |

---

## 🔴 Problèmes identifiés et recommandations

### 1. **TEAM_LEADER** (Chef Équipe Production) - SOUS-ALIMENTÉ ⚠️

**Permissions actuelles:** (8 permissions)
- ✅ Créer tickets
- ✅ Lire tous les tickets
- ✅ Commenter
- ✅ Modifier ses propres tickets
- ❌ **MANQUE: Déplacer tickets** (move)
- ❌ **MANQUE: Modifier tickets de son équipe**
- ❌ **MANQUE: Assigner tickets mineurs à son équipe**

**Problème réel:**
Un chef d'équipe de production découvre un problème, crée un ticket, mais **ne peut pas le déplacer** de "Reçu" vers "Diagnostic" ou "En cours" quand son équipe commence à travailler dessus. Il doit attendre qu'un coordinateur/superviseur le fasse.

**Recommandation:**
```sql
-- Ajouter ces permissions:
- tickets.move (all) - Déplacer tickets dans le Kanban
- tickets.update (all) - Modifier tous tickets (pas juste les siens)
- tickets.assign (own) - Assigner tickets à son équipe
```

**Justification métier:**
- Chef d'équipe = responsable de son secteur production
- Doit pouvoir gérer le workflow de ses tickets
- Interface critique production-maintenance

---

### 2. **COORDINATOR** (Coordonnateur Maintenance) - MANQUE DELETE ⚠️

**Permissions actuelles:** (12 permissions)
- ✅ Tout sauf delete

**Problème:**
Un coordonnateur ne peut pas supprimer un ticket créé par erreur ou un doublon. Doit demander à un superviseur.

**Recommandation:**
```sql
-- Ajouter:
- tickets.delete (all) - Supprimer tickets (doublons, erreurs)
```

**Justification:**
- Rôle de coordination = nettoyage de la file
- Autonomie dans la gestion quotidienne

---

### 3. **PLANNER** (Planificateur Maintenance) - MANQUE DELETE ⚠️

**Permissions actuelles:** (11 permissions)
- ✅ Presque identique à coordinator

**Problème:**
Même problème que coordinator. Ne peut pas nettoyer les tickets obsolètes lors de la planification.

**Recommandation:**
```sql
-- Ajouter:
- tickets.delete (all) - Supprimer tickets obsolètes
```

---

### 4. **STOREKEEPER** (Magasinier) - TROP LIMITÉ ⚠️

**Permissions actuelles:** (5 permissions)
- ✅ Lire tickets/machines
- ✅ Commenter
- ❌ **MANQUE: Créer tickets**

**Problème réel:**
Le magasinier découvre qu'une pièce critique est défectueuse ou manquante, mais **ne peut pas créer de ticket** pour signaler le problème. Il doit demander à quelqu'un d'autre de le faire.

**Recommandation:**
```sql
-- Ajouter:
- tickets.create (all) - Créer tickets pour pièces défectueuses
- media.upload (all) - Ajouter photos de pièces
```

**Justification métier:**
- Magasinier = première ligne pour problèmes de pièces
- Doit pouvoir signaler défauts/manques directement

---

### 5. **FURNACE_OPERATOR** vs **OPERATOR** - Incohérence mineure

**Différence:** `operator` a 11 permissions, `furnace_operator` a 8.

**Analyse:** 
- `operator` a tickets.delete (own) + messages.delete (own) + media.delete (own)
- `furnace_operator` n'a pas ces permissions de suppression

**Recommandation:**
Les deux devraient avoir les **mêmes permissions** car un opérateur de four est un opérateur spécialisé, pas moins autonome.

```sql
-- Ajouter à furnace_operator:
- tickets.delete (own)
- messages.delete (own) 
- media.delete (own)
```

---

## ✅ Rôles bien configurés (aucun changement nécessaire)

### **ADMIN** (31 permissions) ✅
- Accès complet au système
- Gestion utilisateurs, rôles, permissions
- Configuration globale

### **DIRECTOR** (5 permissions) ✅
- Lecture seule tous modules
- Vue d'ensemble sans modification
- Parfait pour direction exécutive

### **SUPERVISOR** (25 permissions) ✅
- Quasi-complet sauf gestion utilisateurs/rôles
- Peut tout faire sur tickets/machines
- Autonomie opérationnelle complète

### **SENIOR_TECHNICIAN** (16 permissions) ✅
- Identique à technician + assignation
- Peut coordonner l'équipe technique
- Excellent équilibre

### **TECHNICIAN** (16 permissions) ✅
- Toutes permissions nécessaires pour travail quotidien
- Peut tout faire sauf assigner
- Bien dimensionné

### **SAFETY_OFFICER** (9 permissions) ✅
- Lecture complète
- Création tickets + commentaires
- **Update machines (blocage équipements dangereux)** ✅
- Parfait pour conformité SST

### **QUALITY_INSPECTOR** (7 permissions) ✅
- Lecture complète
- Création tickets qualité
- Traçabilité machine-qualité
- Bien adapté au rôle

### **VIEWER** (5 permissions) ✅
- Lecture seule complète
- Aucune modification
- Parfait pour auditeurs/stagiaires

---

## 🎯 Résumé des changements recommandés

### Priorité HAUTE 🔴

1. **TEAM_LEADER** - Ajouter 3 permissions:
   ```sql
   - tickets.move (all)
   - tickets.update (all) 
   - tickets.assign (own)
   ```

2. **STOREKEEPER** - Ajouter 2 permissions:
   ```sql
   - tickets.create (all)
   - media.upload (all)
   ```

### Priorité MOYENNE 🟡

3. **COORDINATOR** - Ajouter 1 permission:
   ```sql
   - tickets.delete (all)
   ```

4. **PLANNER** - Ajouter 1 permission:
   ```sql
   - tickets.delete (all)
   ```

5. **FURNACE_OPERATOR** - Ajouter 3 permissions:
   ```sql
   - tickets.delete (own)
   - messages.delete (own)
   - media.delete (own)
   ```

---

## 📋 Migration SQL recommandée

```sql
-- ================================================
-- MIGRATION: Corrections permissions rôles industriels
-- Date: 2025-11-08
-- Description: Ajuster permissions pour réalité terrain
-- ================================================

-- 1. TEAM_LEADER - Ajouter move, update all, assign own
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'team_leader'),
  id
FROM permissions
WHERE 
  (resource = 'tickets' AND action = 'move' AND scope = 'all') OR
  (resource = 'tickets' AND action = 'assign' AND scope = 'own') OR
  (resource = 'tickets' AND action = 'update' AND scope = 'all');

-- 2. STOREKEEPER - Ajouter create tickets + upload media
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'storekeeper'),
  id
FROM permissions
WHERE 
  (resource = 'tickets' AND action = 'create' AND scope = 'all') OR
  (resource = 'media' AND action = 'upload' AND scope = 'all');

-- 3. COORDINATOR - Ajouter delete tickets
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'coordinator'),
  id
FROM permissions
WHERE resource = 'tickets' AND action = 'delete' AND scope = 'all';

-- 4. PLANNER - Ajouter delete tickets
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'planner'),
  id
FROM permissions
WHERE resource = 'tickets' AND action = 'delete' AND scope = 'all';

-- 5. FURNACE_OPERATOR - Ajouter delete own (harmoniser avec operator)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'furnace_operator'),
  id
FROM permissions
WHERE 
  (resource = 'tickets' AND action = 'delete' AND scope = 'own') OR
  (resource = 'messages' AND action = 'delete' AND scope = 'own') OR
  (resource = 'media' AND action = 'delete' AND scope = 'own');
```

---

## 🏭 Cas d'usage réels validant ces changements

### Scénario 1: Chef d'équipe qui ne peut pas gérer son workflow
**Situation actuelle:**
- Chef d'équipe signale fuite d'huile → crée ticket
- Son équipe commence à investiguer
- Chef ne peut PAS déplacer ticket vers "Diagnostic" 
- Doit attendre que coordinateur le fasse
- **Perte de temps et autonomie**

**Après correction:**
- Chef crée ticket + déplace dans Kanban
- Assigne à son équipe si nécessaire
- Autonomie complète sur son secteur

### Scénario 2: Magasinier qui découvre pièce défectueuse
**Situation actuelle:**
- Magasinier reçoit livraison de pièces
- Découvre qu'elles sont défectueuses
- Ne peut PAS créer de ticket
- Doit appeler quelqu'un pour le faire
- **Délai et inefficacité**

**Après correction:**
- Magasinier crée ticket immédiatement
- Ajoute photos de la pièce défectueuse
- Workflow fluide

### Scénario 3: Coordinateur face à un doublon
**Situation actuelle:**
- Coordinateur voit 2 tickets identiques
- Ne peut PAS supprimer le doublon
- Doit demander à superviseur
- **Inefficace**

**Après correction:**
- Coordinateur supprime le doublon
- Gestion autonome quotidienne

---

## ✅ Conclusion

**Globalement:** Les permissions sont **bien pensées** et reflètent la réalité industrielle.

**Points forts:**
- ✅ Séparation claire direction/management/exécution
- ✅ Sécurité bien gérée (safety_officer)
- ✅ Qualité intégrée (quality_inspector)
- ✅ Hiérarchie technique respectée

**Points à améliorer (5 rôles):**
- 🔴 **TEAM_LEADER** - Besoin critique d'autonomie
- 🔴 **STOREKEEPER** - Besoin de créer tickets pièces
- 🟡 COORDINATOR/PLANNER - Manque delete pour nettoyage
- 🟡 FURNACE_OPERATOR - Harmoniser avec operator

**Impact si pas corrigé:**
- Frustration utilisateurs
- Inefficacité opérationnelle
- Demandes répétitives aux superviseurs
- Non-respect de l'autonomie des rôles

**Impact si corrigé:**
- ✅ Fluidité opérationnelle
- ✅ Autonomie réelle des équipes
- ✅ Moins de sollicitation des superviseurs
- ✅ Satisfaction utilisateurs
