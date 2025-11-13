# 📚 Documentation: Utilisateur Système "Toute l'équipe"

## 🎯 Objectif

L'utilisateur `system.team@igpglass.ca` est un **utilisateur fictif spécial** créé pour permettre l'assignation de tickets à **toute l'équipe** plutôt qu'à un technicien spécifique.

## 📊 Informations Techniques

### Base de Données
```sql
-- Table: users
id: 0 (ID spécial réservé)
email: "system.team@igpglass.ca"
password_hash: "SYSTEM_USER_NO_LOGIN"
full_name: "👥 Toute l'équipe"
role: "technician"
is_super_admin: 0
```

### Caractéristiques Spéciales
- **ID = 0**: Réservé, jamais réutilisé pour un vrai utilisateur
- **Password**: `SYSTEM_USER_NO_LOGIN` - impossible de se connecter avec cet utilisateur
- **Création**: Migration `0008_add_team_system_user.sql`

## 🔧 Utilisation dans l'Application

### 1. Création de Tickets

Lors de la création d'un ticket, les **superviseurs** et **admins** peuvent choisir:

**Interface:**
```
Assigner à:
┌──────────────────────────────┐
│ -- Non assigné --            │
│ 👥 À Équipe                  │  ← assigned_to = 0
│ 👤 Technicien Martin         │  ← assigned_to = 1
│ 👤 Technicienne Sophie       │  ← assigned_to = 2
│ ...                          │
└──────────────────────────────┘
```

**Code Frontend (ligne 3180):**
```javascript
React.createElement('option', { value: '0' }, '👥 À Équipe'),
```

**Code Backend (ligne 2921):**
```javascript
if (assignedTo) {
    // CRITICAL FIX: Use 0 (integer) for team assignment
    requestBody.assigned_to = parseInt(assignedTo);
}
```

### 2. Affichage dans les Tickets

Quand un ticket est assigné à l'équipe, l'affichage montre:

**Code (ligne 1184-1188):**
```javascript
const assignedInfo = ticket.assigned_to === 0 
    ? '👥 Toute l\'équipe'      // ← Cas team assignment
    : ticket.assigned_name 
        ? `👤 ${ticket.assigned_name}` 
        : '❌ Non assigné';
```

**Résultat visuel:**
```
📋 Ticket #123
┌─────────────────────────────────┐
│ Machine: Fournaise Modèle X     │
│ Priorité: 🔴 Urgente            │
│ Assigné à: 👥 Toute l'équipe   │  ← Affichage spécial
│ Statut: En cours                │
└─────────────────────────────────┘
```

### 3. Notifications de Retard

Quand un ticket en retard est assigné à l'équipe:

**Code (ligne 1202):**
```javascript
Assigné à: ${assignedInfo}

// Résultat:
// "Assigné à: 👥 Toute l'équipe"
```

### 4. Filtrage des Techniciens

Dans les listes déroulantes, on **exclut** l'utilisateur système des vraies personnes:

**Code (ligne 3181):**
```javascript
technicians.filter(tech => tech.id !== 0).map(tech => 
    React.createElement('option', { 
        key: tech.id, 
        value: tech.id 
    }, 
        '👤 ' + tech.full_name
    )
)
```

## ⚙️ Vérifications Critiques

### Comparaison avec NULL

**ATTENTION**: L'ID 0 est une valeur valide, pas NULL!

**❌ INCORRECT:**
```javascript
if (ticket.assigned_to) {
    // Problème: 0 est falsy en JavaScript
    // 0 serait traité comme "non assigné"
}
```

**✅ CORRECT:**
```javascript
if (ticket.assigned_to !== null) {
    // Bon: 0 est valide et différent de null
}
```

**Exemples dans le code:**
- Ligne 3309: `// CRITICAL: Check !== null (not just falsy)`
- Ligne 7435: `// CRITICAL: Check !== null (not falsy)`
- Ligne 7566: `// CRITICAL: Check !== null (not falsy)`
- Ligne 7693: `// CRITICAL: Check !== null (not falsy)`

## 📋 Cas d'Usage

### Cas 1: Ticket Général
```
Situation: Une machine a besoin d'entretien mais n'importe quel technicien peut le faire

Solution:
1. Créer ticket
2. Assigner à "👥 À Équipe"
3. N'importe quel technicien peut prendre le ticket
```

### Cas 2: Pic d'Activité
```
Situation: Beaucoup de tickets urgents, besoin de flexibilité

Solution:
1. Assigner les tickets urgents à "👥 À Équipe"
2. Les techniciens disponibles peuvent choisir
3. Puis réassigner à eux-mêmes
```

### Cas 3: Rotation d'Équipe
```
Situation: Maintenance quotidienne partagée entre techniciens

Solution:
1. Tickets de routine assignés à "👥 À Équipe"
2. Chaque technicien prend ce qu'il peut
3. Équilibrage naturel de la charge
```

## 🔍 Avantages

### 1. Flexibilité
- Pas besoin d'assigner immédiatement à une personne spécifique
- Les techniciens peuvent s'auto-assigner

### 2. Conformité Base de Données
- Respecte la contrainte de clé étrangère `tickets.assigned_to → users.id`
- Pas de valeur invalide ou "orpheline"

### 3. Traçabilité
- Distinction claire entre:
  - Non assigné (NULL)
  - Assigné à l'équipe (0)
  - Assigné à une personne (1, 2, 3, ...)

### 4. Simplicité
- Une seule table `users`
- Pas besoin de table séparée pour "équipes" ou "groupes"

## 🚫 Restrictions

### Connexion Impossible
```sql
password_hash: "SYSTEM_USER_NO_LOGIN"
```
- Aucun hash valide
- Impossible de se connecter
- Utilisé uniquement pour les assignations

### Pas de Vrai Utilisateur
- N'apparaît pas dans les listes de techniciens individuels
- Filtré dans les statistiques par personne
- Réservé uniquement pour l'assignation collective

### ID Réservé
```sql
id: 0
```
- Les vrais utilisateurs commencent à `id = 1`
- L'auto-increment SQLite saute l'ID 0
- Garantit qu'aucun vrai utilisateur n'aura jamais `id = 0`

## 🧪 Tests de Validation

### Test 1: Création avec Assignation Équipe
```bash
# Créer un ticket assigné à l'équipe
curl -X POST http://localhost:3000/api/tickets \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "machine_id": 1,
    "title": "Test équipe",
    "priority": "medium",
    "assigned_to": 0
  }'

# Vérifier
curl http://localhost:3000/api/tickets
# → assigned_to: 0
# → assigned_name: "👥 Toute l'équipe"
```

### Test 2: Vérification NULL vs 0
```javascript
// Dans la console navigateur
tickets.forEach(t => {
    console.log(`Ticket ${t.id}:`, {
        assigned_to: t.assigned_to,
        is_null: t.assigned_to === null,
        is_zero: t.assigned_to === 0,
        is_falsy: !t.assigned_to
    });
});

// Résultats attendus:
// Ticket 1: { assigned_to: 0, is_null: false, is_zero: true, is_falsy: true }
// Ticket 2: { assigned_to: null, is_null: true, is_zero: false, is_falsy: true }
// Ticket 3: { assigned_to: 1, is_null: false, is_zero: false, is_falsy: false }
```

### Test 3: Notifications
```bash
# Créer ticket en retard assigné à l'équipe
# Attendre expiration scheduled_date
# Déclencher webhook notifications

# Vérifier message contient:
# "Assigné à: 👥 Toute l'équipe"
```

## 📝 Migration SQL

**Fichier:** `migrations/0008_add_team_system_user.sql`

```sql
-- Migration 0008: Ajouter un utilisateur système pour "Toute l'équipe"
-- Cet utilisateur fictif (id=0) permet d'assigner des tickets à toute l'équipe
-- sans violer la contrainte de clé étrangère

-- Insérer l'utilisateur système avec id=0
INSERT OR IGNORE INTO users (id, email, password_hash, full_name, role) 
VALUES (
    0, 
    'system.team@igpglass.ca', 
    'SYSTEM_USER_NO_LOGIN', 
    '👥 Toute l''équipe', 
    'technician'
);

-- Réinitialiser l'auto-increment pour qu'il recommence à 1 pour les vrais utilisateurs
-- (SQLite utilisera max(id)+1, donc les prochains IDs seront >= 1)
```

## 🔮 Évolutions Futures Possibles

### Option 1: Plusieurs Équipes
```sql
-- Créer plusieurs utilisateurs système
INSERT INTO users VALUES (0, 'system.team@igp.ca', 'NO_LOGIN', '👥 Toute équipe', 'technician');
INSERT INTO users VALUES (-1, 'system.day@igp.ca', 'NO_LOGIN', '☀️ Équipe Jour', 'technician');
INSERT INTO users VALUES (-2, 'system.night@igp.ca', 'NO_LOGIN', '🌙 Équipe Nuit', 'technician');
```

### Option 2: Auto-Assignment
```javascript
// Quand un technicien prend un ticket assigné à l'équipe
async function claimTicket(ticketId, technicianId) {
    await axios.put(`/api/tickets/${ticketId}`, {
        assigned_to: technicianId
    });
}
```

### Option 3: Statistiques d'Équipe
```sql
-- Compter tickets par type d'assignation
SELECT 
    CASE 
        WHEN assigned_to = 0 THEN 'Équipe'
        WHEN assigned_to IS NULL THEN 'Non assigné'
        ELSE 'Individuel'
    END AS type_assignation,
    COUNT(*) as count
FROM tickets
GROUP BY type_assignation;
```

## ✅ Résumé

**L'utilisateur `system.team@igpglass.ca` est:**
- ✅ Un **placeholder** pour l'assignation collective
- ✅ Un **utilisateur fictif** avec ID réservé (0)
- ✅ **Impossible de connexion** (password invalide)
- ✅ Utilisé dans les **tickets** pour "👥 Toute l'équipe"
- ✅ **Filtré** des listes de techniciens réels
- ✅ **Vérifié avec `!== null`** pour éviter bugs

**Avantages:**
- 🎯 Flexibilité d'assignation
- 🔐 Respect des contraintes DB
- 📊 Traçabilité claire
- 🚀 Simple à maintenir

---

**Documentation mise à jour:** 2025-11-13
**Version application:** 2.0.12
