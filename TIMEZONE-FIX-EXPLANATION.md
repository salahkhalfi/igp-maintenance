# 🐛 CORRECTION DU BUG DE CONVERSION TIMEZONE

**Date:** 2025-11-13  
**Commit:** 7735b5d  
**Priorité:** CRITIQUE ⚠️

---

## 📋 PROBLÈME IDENTIFIÉ

### Symptôme Observé
- Utilisateur entre: **14:30** (heure locale)
- Système affiche: **19:30** (erreur de +5 heures)
- Heure de création correcte, mais heure de planification incorrecte

### Cause Racine

**Double conversion timezone dans le mauvais sens:**

```javascript
// ❌ CODE INCORRECT (avant correction)
const localDateTimeToUTC = (localDateTime) => {
    const localDate = new Date(localDateTime);  // ← "2025-11-14T14:30"
    const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
    const utcDate = new Date(localDate.getTime() - (offset * 60 * 60 * 1000));
    // Résultat: 14:30 - (-5) = 14:30 + 5 = 19:30 LOCAL (pas UTC!)
}
```

**Pourquoi ça ne marchait pas:**
1. `new Date("2025-11-14T14:30")` **sans "Z"** est interprété comme **heure locale du navigateur**
2. Le timestamp créé représente déjà "14:30 dans le fuseau local du navigateur"
3. En ajoutant +5h, on obtenait "19:30 dans le fuseau local" au lieu de "19:30 UTC"

---

## ✅ SOLUTION IMPLÉMENTÉE

### Nouvelle Logique

**Parser manuellement et utiliser Date.UTC() pour éviter l'interprétation automatique:**

```javascript
// ✅ CODE CORRECT (après correction)
const localDateTimeToUTC = (localDateTime) => {
    if (!localDateTime) return null;
    
    // Parser manuellement: "2025-11-14T14:30" → composants
    const parts = localDateTime.split('T');
    const dateParts = parts[0].split('-');
    const timeParts = parts[1].split(':');
    
    const year = parseInt(dateParts[0]);    // 2025
    const month = parseInt(dateParts[1]) - 1; // 10 (Nov = mois 10, base 0)
    const day = parseInt(dateParts[2]);     // 14
    const hours = parseInt(timeParts[0]);   // 14
    const minutes = parseInt(timeParts[1]); // 30
    
    const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
    
    // Calculer l'heure UTC en soustrayant l'offset
    // offset = -5 signifie "UTC-5"
    // Pour convertir local → UTC: UTC = local - offset
    // Exemple: 14:30 local avec offset -5 → UTC = 14:30 - (-5) = 19:30
    const utcHours = hours - offset;
    
    // Créer la date UTC directement (pas d'interprétation locale)
    const utcDate = new Date(Date.UTC(year, month, day, utcHours, minutes, 0));
    
    // Extraire les composants UTC
    const utcYear = utcDate.getUTCFullYear();
    const utcMonth = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
    const utcDay = String(utcDate.getUTCDate()).padStart(2, '0');
    const utcHoursStr = String(utcDate.getUTCHours()).padStart(2, '0');
    const utcMinutes = String(utcDate.getUTCMinutes()).padStart(2, '0');
    
    return utcYear + '-' + utcMonth + '-' + utcDay + ' ' + utcHoursStr + ':' + utcMinutes + ':00';
};
```

### Formules de Conversion

**Local → UTC:**
```
UTC_hours = local_hours - timezone_offset
Exemple: 14:30 - (-5) = 14:30 + 5 = 19:30 UTC
```

**UTC → Local:**
```
local_hours = UTC_hours + timezone_offset
Exemple: 19:30 + (-5) = 19:30 - 5 = 14:30 local
```

---

## 🧪 TESTS REQUIS

### Test 1: Créer un nouveau ticket
1. Entrer: **2025-11-14 à 14:30** (local)
2. **Vérifier affichage:** Doit rester **14:30**
3. **Vérifier DB:** Doit stocker **2025-11-14 19:30:00** (UTC)

### Test 2: Modifier un ticket existant
1. Changer de **14:30** à **09:00**
2. **Vérifier affichage:** Doit afficher **09:00**
3. **Vérifier DB:** Doit stocker **2025-11-14 14:00:00** (UTC)

### Test 3: Compatibilité avec anciens tickets
1. Ticket ancien: **2025-11-15 23:59:59** (stocké en UTC)
2. **Affichage attendu:** **2025-11-15T18:59** (local)
3. Explique le bug original: tickets expiraient à 18:59 au lieu de minuit

### Test 4: Countdown timer
1. Créer ticket pour **dans 2 heures**
2. Vérifier que le countdown affiche **~2 heures restantes**

### Test 5: Notifications CRON
1. Créer ticket pour **maintenant + 5 minutes**
2. Attendre 5+ minutes
3. Vérifier notification envoyée au bon moment

---

## 📊 IMPACT

### Code Modifié
- **Fichier:** `/home/user/webapp/src/index.tsx`
- **Lignes:** 1725-1778
- **Fonctions:** `localDateTimeToUTC()` et `utcToLocalDateTime()`

### Fonctionnalités Affectées
- ✅ Création de ticket avec date/heure planifiée
- ✅ Modification de date/heure planifiée
- ✅ Affichage countdown
- ✅ Système de notifications CRON
- ✅ Messages/commentaires horodatés
- ✅ Expiration de tickets

### Risques Résiduels
- ⚠️ Compatibilité avec anciens tickets (format 23:59:59)
- ⚠️ Timezone offset incorrect dans system_settings
- ⚠️ Changement d'heure été/hiver (DST)

---

## 🚀 DÉPLOIEMENT

### Prérequis
- ✅ Build réussi: `npm run build`
- ✅ Service redémarré: `pm2 restart maintenance-app`
- ⏳ Tests manuels complets
- ⏳ Validation sur environnement local
- ⏳ Décision de déploiement en production

### Rollback Plan
- Tag Git disponible: `backup-before-datetime-calendar`
- Commande rollback: `git reset --hard backup-before-datetime-calendar`

---

## 📝 NOTES ADDITIONNELLES

### Pourquoi Date.UTC() ?
- Crée un timestamp UTC **sans interprétation du fuseau local du navigateur**
- Garantit que les calculs sont prévisibles et reproductibles
- Évite les ambiguïtés liées aux changements d'heure (DST)

### Pourquoi Parser Manuellement ?
- `new Date("2025-11-14T14:30")` est ambigu (local? UTC? fuseau navigateur?)
- Parser explicitement rend le code plus clair et prévisible
- Permet un contrôle total sur la conversion timezone

### Offset Négatif = À l'Ouest de UTC
- `-5` = UTC-5 = EST (Eastern Standard Time)
- `-4` = UTC-4 = EDT (Eastern Daylight Time)
- Pour convertir **local → UTC**: **soustraire** l'offset (14:30 - (-5) = 19:30)
- Pour convertir **UTC → local**: **ajouter** l'offset (19:30 + (-5) = 14:30)

---

**Statut:** ⚠️ CODE CORRIGÉ - EN ATTENTE DE TESTS COMPLETS
