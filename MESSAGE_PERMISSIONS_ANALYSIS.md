# Analyse Permissions Messages - Système de Maintenance IGP Glass

## 📊 État actuel des permissions par rôle

| Rôle | Read All | Create Public | Create Private | Delete Own | Delete All | Analyse |
|------|----------|---------------|----------------|------------|------------|---------|
| **admin** | ✅ | ✅ | ✅ | ✅ | ✅ | Complet |
| **director** | ✅ | ❌ | ❌ | ❌ | ❌ | Lecture seule (OK) |
| **supervisor** | ✅ | ✅ | ✅ | ✅ | ✅ | Complet |
| **coordinator** | ✅ | ✅ | ❌ | ❌ | ❌ | OK pour coordination |
| **planner** | ✅ | ✅ | ❌ | ❌ | ❌ | OK pour planification |
| **senior_technician** | ✅ | ✅ | ✅ | ✅ | ❌ | Complet technique |
| **technician** | ❌ | ✅ | ✅ | ✅ | ❌ | 🔴 **MANQUE READ** |
| **team_leader** | ✅ | ✅ | ❌ | ❌ | ❌ | OK pour chef équipe |
| **furnace_operator** | ✅ | ✅ | ❌ | ✅ | ❌ | OK opérateur spécialisé |
| **operator** | ❌ | ❌ | ❌ | ❌ | ❌ | 🔴 **PAS DE PERMISSIONS** |
| **safety_officer** | ✅ | ✅ | ❌ | ❌ | ❌ | OK pour sécurité |
| **quality_inspector** | ✅ | ✅ | ❌ | ❌ | ❌ | OK pour qualité |
| **storekeeper** | ✅ | ✅ | ❌ | ❌ | ❌ | OK pour magasin |
| **viewer** | ✅ | ❌ | ❌ | ❌ | ❌ | Lecture seule (OK) |

---

## 🔴 PROBLÈMES CRITIQUES IDENTIFIÉS

### 1. **TECHNICIAN** - Manque messages.read (all) 🔴

**Situation actuelle:**
- ✅ Peut créer messages publics
- ✅ Peut créer messages privés
- ✅ Peut supprimer ses propres messages
- ❌ **NE PEUT PAS LIRE** les messages de l'équipe!

**Problème réel:**
Un technicien ne peut pas voir les messages de coordination de l'équipe. Il peut envoyer des messages mais ne peut pas lire les réponses!

**Impact:**
- Communication brisée
- Coordination impossible
- Techniciens isolés de l'équipe

**Solution:**
```sql
-- Ajouter read all pour technician
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'technician'),
  id
FROM permissions
WHERE resource = 'messages' AND action = 'read' AND scope = 'all';
```

---

### 2. **OPERATOR** - Aucune permission messages 🔴

**Situation actuelle:**
- ❌ Ne peut PAS lire les messages
- ❌ Ne peut PAS créer de messages publics
- ❌ Ne peut PAS créer de messages privés
- ❌ Ne peut PAS supprimer ses messages

**Problème réel:**
Un opérateur est complètement isolé du système de messagerie. Il ne peut ni recevoir ni envoyer d'informations via messages.

**Impact:**
- Opérateurs exclus de la communication
- Pas de notifications d'équipe
- Pas de coordination possible

**Solution:**
```sql
-- Ajouter permissions messages de base pour operator
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'operator'),
  id
FROM permissions
WHERE 
  (resource = 'messages' AND action = 'read' AND scope = 'all') OR
  (resource = 'messages' AND action = 'create' AND scope = 'public') OR
  (resource = 'messages' AND action = 'delete' AND scope = 'own');
```

---

## ⚠️ INCOHÉRENCES DÉTECTÉES

### Incohérence 1: operator vs furnace_operator

**furnace_operator** (opérateur spécialisé):
- ✅ Read all
- ✅ Create public
- ✅ Delete own

**operator** (opérateur standard):
- ❌ Aucune permission

**Logique attendue:** Un opérateur standard devrait avoir AU MOINS les mêmes permissions qu'un opérateur spécialisé.

---

### Incohérence 2: technician sans read

**Contexte:**
- Technicien = exécutant principal des travaux
- Besoin de communication avec équipe et superviseurs
- Peut envoyer messages mais ne peut pas les lire!

**Comparaison:**
- `senior_technician` → ✅ Peut lire
- `technician` → ❌ Ne peut PAS lire

**Illogique:** Un technicien junior devrait pouvoir lire les messages de son équipe.

---

## 📋 PERMISSIONS RECOMMANDÉES PAR RÔLE

### Rôles de direction (lecture seule) ✅
- **director**: Read only (OK)
- **viewer**: Read only (OK)

### Rôles de management (communication complète) ✅
- **admin**: Tout (OK)
- **supervisor**: Tout (OK)
- **coordinator**: Read + Create public (OK)
- **planner**: Read + Create public (OK)

### Rôles techniques (PROBLÈMES)
- **senior_technician**: ✅ Read + Create public/private + Delete own (OK)
- **technician**: 🔴 **MANQUE READ** → Doit avoir Read + Create public/private + Delete own
- **operator**: 🔴 **RIEN** → Doit avoir Read + Create public + Delete own
- **furnace_operator**: ✅ Read + Create public + Delete own (OK)

### Rôles support (OK)
- **team_leader**: ✅ Read + Create public (OK)
- **safety_officer**: ✅ Read + Create public (OK)
- **quality_inspector**: ✅ Read + Create public (OK)
- **storekeeper**: ✅ Read + Create public (OK)

---

## 🔐 SÉCURITÉ: Messages privés

**Qui peut créer des messages privés?**
- ✅ **admin**: Oui (gestion système)
- ✅ **supervisor**: Oui (coordination)
- ✅ **senior_technician**: Oui (supervision technique)
- ✅ **technician**: Oui (communication technique)
- ❌ **Tous les autres**: Non (seulement publics)

**Analyse:** ✅ Bon équilibre
- Messages privés réservés à la hiérarchie technique
- Messages publics pour communication d'équipe
- Évite abus de messages privés

---

## 🚨 RISQUES SI NON CORRIGÉ

### Risque 1: Communication brisée
- Techniciens ne peuvent pas lire messages de coordination
- Opérateurs complètement isolés
- **Impact**: Erreurs opérationnelles, inefficacité

### Risque 2: Frustration utilisateurs
- Technicien envoie message mais ne voit pas réponse
- Opérateur ne reçoit jamais les annonces d'équipe
- **Impact**: Adoption faible du système

### Risque 3: Contournement
- Utilisateurs utiliseront téléphone/WhatsApp à la place
- Perte de traçabilité
- **Impact**: Défaite du système de messagerie

---

## ✅ MIGRATION RECOMMANDÉE

```sql
-- ================================================
-- MIGRATION: Correction permissions messages
-- Date: 2025-11-08
-- ================================================

-- 1. TECHNICIAN - Ajouter lecture messages
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'technician'),
  id
FROM permissions
WHERE resource = 'messages' AND action = 'read' AND scope = 'all';

-- 2. OPERATOR - Ajouter permissions messages de base
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'operator'),
  id
FROM permissions
WHERE 
  (resource = 'messages' AND action = 'read' AND scope = 'all') OR
  (resource = 'messages' AND action = 'create' AND scope = 'public') OR
  (resource = 'messages' AND action = 'delete' AND scope = 'own');
```

---

## 📊 RÉSUMÉ

**Rôles OK:** 12 / 14
**Rôles PROBLÈME:** 2 / 14

### À corriger:
1. 🔴 **technician** - Ajouter `messages.read (all)` (critique)
2. 🔴 **operator** - Ajouter 3 permissions messages (critique)

### Impact si corrigé:
- ✅ Communication d'équipe fonctionnelle
- ✅ Techniciens intégrés dans le flux
- ✅ Opérateurs peuvent recevoir annonces
- ✅ Cohérence avec furnace_operator

### Impact si NON corrigé:
- ❌ Système de messagerie inutilisable pour techniciens/opérateurs
- ❌ Frustration massive
- ❌ Contournement via outils externes
- ❌ Défaite de l'objectif du système
