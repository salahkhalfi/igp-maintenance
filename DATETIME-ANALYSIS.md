# 🕐 ANALYSE SYSTÈME DE GESTION DU TEMPS

**Date**: 2025-11-12  
**Objectif**: Activer la sélection des heures dans le calendrier de planification  
**Criticité**: ⚠️ **TRÈS HAUTE** - Impact sur notifications, CRON, expiration tickets

---

## 🔍 SYSTÈME ACTUEL

### 1. **Format de Stockage (Base de Données)**

**Colonne**: `scheduled_date` (type: TEXT)  
**Format actuel**: `YYYY-MM-DD 23:59:59`

```sql
-- Exemple actuel
scheduled_date = '2025-11-10 23:59:59'  -- Toujours fin de journée (23:59:59)
```

**Comportement actuel:**
- L'utilisateur sélectionne uniquement une **date** (input type="date")
- Le système ajoute automatiquement `23:59:59` (ligne 2804, 3359)
- Tous les tickets planifiés expirent à **23:59:59** du jour sélectionné

---

### 2. **Gestion du Fuseau Horaire**

**Paramètre**: `timezone_offset_hours` (system_settings)  
**Valeurs**: `-5` (EST hiver) ou `-4` (EDT été)  
**Stockage**: `localStorage.getItem('timezone_offset_hours')`

**Conversion UTC → Local:**
```javascript
// Fonction formatDateEST (ligne 1688)
const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
const dateEST = new Date(dateUTC.getTime() + (offset * 60 * 60 * 1000));
```

**Points critiques:**
1. Les dates sont stockées en **UTC dans la DB**
2. L'affichage utilise l'offset `timezone_offset_hours`
3. Les comparaisons SQLite utilisent `datetime('now')` (UTC)

---

### 3. **Points d'Utilisation de `scheduled_date`**

#### A. **Création de Ticket (Modal CreateTicketModal)**

**Ligne 2803-2804:**
```javascript
if (scheduledDate) {
    requestBody.scheduled_date = scheduledDate + ' 23:59:59';
}
```

**État actuel:**
- Input: `<input type="date" value={scheduledDate} />`
- Valeur: `"2025-11-10"` (YYYY-MM-DD)
- Envoyé: `"2025-11-10 23:59:59"`

#### B. **Modification de Ticket (Modal TicketDetailModal)**

**Ligne 3359:**
```javascript
updateData.scheduled_date = scheduledDate ? scheduledDate + ' 23:59:59' : null;
```

**Même comportement que création.**

#### C. **CRON Check Overdue (Notifications)**

**Ligne 401:**
```sql
AND datetime(t.scheduled_date) < datetime('now')
```

**Comparaison en UTC:**
- `datetime('now')` = temps UTC actuel
- `datetime(t.scheduled_date)` = date planifiée en UTC
- Si `scheduled_date = '2025-11-10 23:59:59'`, le ticket expire à **23:59:59 UTC**

**Impact fuseau horaire:**
- Québec EST (UTC-5): 23:59 UTC = 18:59 locale (6:59 PM)
- Québec EDT (UTC-4): 23:59 UTC = 19:59 locale (7:59 PM)

**❌ PROBLÈME ACTUEL**: Les tickets expirent à 18h59/19h59 heure locale, pas à minuit !

#### D. **Affichage Countdown (ScheduledCountdown)**

**Ligne 1954-1976:**
```javascript
const getCountdownInfo = (scheduledDate) => {
    const scheduledISO = scheduledDate.replace(' ', 'T');
    const scheduledUTC = new Date(scheduledISO + 'Z'); // Force UTC
    const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
    const scheduledLocal = new Date(scheduledUTC.getTime() + (offset * 60 * 60 * 1000));
    
    const now = getNowEST();
    const diffMs = scheduledLocal - now;
    // ...
};
```

**Calcul correct du compte à rebours avec fuseau horaire.**

---

## ⚠️ PROBLÈMES IDENTIFIÉS

### Problème 1: **Heure d'expiration incorrecte**

**Actuel:**
- Utilisateur sélectionne: `2025-11-10`
- Stocké: `2025-11-10 23:59:59` (UTC)
- Expiration réelle (EST): `2025-11-10 18:59:59` (6:59 PM)

**Attendu:**
- Expiration à minuit heure locale: `2025-11-11 00:00:00` locale
- Soit: `2025-11-11 05:00:00` UTC (avec offset -5)

### Problème 2: **Conversion fuseau horaire incohérente**

**Backend CRON (ligne 401):**
```sql
datetime(t.scheduled_date) < datetime('now')  -- Comparaison UTC pure
```

**Frontend (ligne 1954):**
```javascript
const scheduledLocal = new Date(scheduledUTC.getTime() + (offset * 60 * 60 * 1000));
// Applique l'offset pour affichage
```

**Incohérence:** Le CRON compare en UTC sans tenir compte du fuseau horaire configuré.

---

## 🎯 SOLUTION PROPOSÉE

### Phase 1: Activer Sélection Heures (PRUDENT)

**Changement minimal pour ne rien casser:**

1. **Input date → datetime-local**
   ```javascript
   // AVANT
   <input type="date" value={scheduledDate} />
   // scheduledDate = "2025-11-10"
   
   // APRÈS
   <input type="datetime-local" value={scheduledDateTime} />
   // scheduledDateTime = "2025-11-10T14:30"
   ```

2. **Adapter formatage lors de l'envoi**
   ```javascript
   // AVANT
   requestBody.scheduled_date = scheduledDate + ' 23:59:59';
   
   // APRÈS
   if (scheduledDateTime) {
       // scheduledDateTime = "2025-11-10T14:30"
       const [date, time] = scheduledDateTime.split('T');
       requestBody.scheduled_date = date + ' ' + time + ':00';
       // Résultat: "2025-11-10 14:30:00"
   }
   ```

3. **Adapter chargement depuis DB**
   ```javascript
   // AVANT
   setScheduledDate(ticket.scheduled_date.substring(0, 10)); // "2025-11-10"
   
   // APRÈS
   // ticket.scheduled_date = "2025-11-10 14:30:00"
   const datetimeLocal = ticket.scheduled_date.substring(0, 16).replace(' ', 'T');
   setScheduledDateTime(datetimeLocal); // "2025-11-10T14:30"
   ```

### Phase 2: Gérer Fuseau Horaire Correctement (CRITIQUE)

**Option A: Stocker en heure locale (RECOMMANDÉ)**

```javascript
// Lors de la création/modification
const localDateTime = document.querySelector('input[type="datetime-local"]').value;
// localDateTime = "2025-11-10T14:30" (heure locale saisie)

// Convertir en UTC pour stockage
const localDate = new Date(localDateTime);
const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
const utcDate = new Date(localDate.getTime() - (offset * 60 * 60 * 1000));

// Format SQL
const sqlDateTime = utcDate.toISOString().slice(0, 19).replace('T', ' ');
// Résultat: "2025-11-10 19:30:00" (UTC)

requestBody.scheduled_date = sqlDateTime;
```

**Avantages:**
- Cohérent avec système actuel (stockage UTC)
- CRON fonctionne correctement (comparaison UTC)
- Affichage correct avec offset

**Option B: Stocker en heure locale + indication fuseau (COMPLEXE)**

```sql
-- Ajouter colonne timezone_offset
ALTER TABLE tickets ADD COLUMN timezone_offset INTEGER DEFAULT -5;
```

❌ **Non recommandé** - Nécessite migration DB + modifications majeures

---

## 📋 PLAN D'IMPLÉMENTATION

### Étape 1: Modifier Input (2 endroits)

**Fichier**: `src/index.tsx`

1. **Modal CreateTicketModal (ligne ~3100)**
2. **Modal TicketDetailModal (ligne ~3560)**

**Changements:**
```javascript
// État
const [scheduledDateTime, setScheduledDateTime] = React.useState('');

// Input
React.createElement('input', {
    type: 'datetime-local',
    value: scheduledDateTime,
    onChange: (e) => setScheduledDateTime(e.target.value),
    className: '...'
})
```

### Étape 2: Adapter Envoi Backend

**CreateTicketModal (ligne ~2803):**
```javascript
if (scheduledDateTime) {
    // scheduledDateTime = "2025-11-10T14:30"
    const localDate = new Date(scheduledDateTime);
    const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
    const utcDate = new Date(localDate.getTime() - (offset * 60 * 60 * 1000));
    
    // Format: YYYY-MM-DD HH:MM:SS
    const sqlDateTime = utcDate.toISOString().slice(0, 19).replace('T', ' ');
    requestBody.scheduled_date = sqlDateTime;
}
```

**TicketDetailModal (ligne ~3359):**
Même conversion.

### Étape 3: Adapter Chargement depuis DB

**TicketDetailModal (ligne ~3185):**
```javascript
if (hasScheduledDate(ticket.scheduled_date)) {
    // ticket.scheduled_date = "2025-11-10 14:30:00" (UTC)
    const utcDateStr = ticket.scheduled_date.replace(' ', 'T') + 'Z';
    const utcDate = new Date(utcDateStr);
    
    const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
    const localDate = new Date(utcDate.getTime() + (offset * 60 * 60 * 1000));
    
    // Format datetime-local: YYYY-MM-DDTHH:MM
    const year = localDate.getUTCFullYear();
    const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(localDate.getUTCDate()).padStart(2, '0');
    const hours = String(localDate.getUTCHours()).padStart(2, '0');
    const minutes = String(localDate.getUTCMinutes()).padStart(2, '0');
    
    setScheduledDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
}
```

### Étape 4: Adapter Affichage

**Ligne ~3080, ~3520, ~7314:** Déjà correct (utilise `formatDateEST`)

### Étape 5: Vérifier Countdown

**Ligne 1954:** Déjà correct (gère fuseau horaire)

### Étape 6: Vérifier CRON

**Ligne 401:** ✅ Aucun changement nécessaire (comparaison UTC correcte)

---

## ✅ TESTS REQUIS

### Test 1: Création avec Heure

1. Créer ticket avec date: `2025-11-15 14:30`
2. Vérifier DB: `scheduled_date = '2025-11-15 19:30:00'` (UTC si offset -5)
3. Vérifier affichage: `15-11-2025 14:30`

### Test 2: Modification avec Heure

1. Modifier date: `2025-11-16 10:00`
2. Vérifier DB: `scheduled_date = '2025-11-16 15:00:00'` (UTC)
3. Vérifier affichage: `16-11-2025 10:00`

### Test 3: Expiration CRON

1. Créer ticket avec date passée: `2025-11-12 10:00` (locale)
2. Attendre que l'heure passe
3. Vérifier notification envoyée

### Test 4: Countdown

1. Créer ticket futur: `2025-11-20 14:00`
2. Vérifier countdown affiche temps correct

### Test 5: Changement Fuseau Horaire

1. Créer ticket avec offset -5
2. Changer offset à -4 dans paramètres
3. Vérifier affichage mis à jour (+1h)

---

## 🚨 RISQUES & MITIGATIONS

### Risque 1: Tickets Existants

**Problème**: Tickets avec `scheduled_date = 'YYYY-MM-DD 23:59:59'`

**Mitigation**:
- Format datetime-local accepte: `2025-11-10T23:59`
- Conversion: `'2025-11-10 23:59:59'` → `'2025-11-10T23:59'`
- ✅ Compatible

### Risque 2: CRON Notifications

**Problème**: Comparaison UTC pourrait changer comportement

**Mitigation**:
- Actuellement: Compare UTC à UTC ✅
- Après changement: Compare UTC à UTC ✅
- Pas de changement dans CRON

### Risque 3: Confusion Utilisateur

**Problème**: Utilisateur saisit heure locale, mais ne comprend pas fuseau horaire

**Mitigation**:
- Ajouter label explicatif: "Heure locale (EST/EDT)"
- Afficher timezone dans interface

---

## 📝 TRADUCTION FRANÇAISE (Phase 2)

**Input datetime-local:** Navigateur gère automatiquement la langue selon `lang="fr"`

**Labels à ajouter:**
```javascript
'Date et heure de maintenance (heure locale EST/EDT)'
```

**Vérifications:**
- ✅ Pas de caractères spéciaux dans labels
- ✅ Apostrophes: utiliser `'` dans JSX
- ✅ Accents: UTF-8 déjà configuré

---

## 🔧 ROLLBACK

**Si problème détecté:**

```bash
# Retour au code avant modifications
git reset --hard backup-before-datetime-calendar

# Rebuild et redéployer
npm run build
pm2 restart webapp
```

**Vérifier:**
- ✅ Tickets existants fonctionnent
- ✅ Nouvelles créations avec date seule
- ✅ CRON notifications OK

---

## ✅ VALIDATION FINALE

**Checklist avant déploiement production:**

- [ ] Tests locaux complets (création, modification, affichage)
- [ ] Test CRON avec ticket expiré
- [ ] Test countdown avec ticket futur
- [ ] Test changement fuseau horaire
- [ ] Vérification DB (format dates correct)
- [ ] Vérification logs (pas d'erreurs)
- [ ] Test régression (tickets existants)
- [ ] Documentation mise à jour

---

**Préparé par**: Assistant IA  
**Revue requise**: OUI (criticité haute)  
**Backup créé**: `backup-before-datetime-calendar`
