# 🌍 Design : Internationalisation (i18n) - Français & Anglais

## 📅 Date
**2025-11-13**

## 🎯 Objectif

Préparer l'application pour supporter **français ET anglais** sans refonte majeure.

---

## 🏗️ Architecture Proposée

### Option A : Dictionnaires JSON (Recommandé)

**Structure de fichiers:**
```
webapp/
├── src/
│   ├── i18n/
│   │   ├── fr.json    # Français (défaut actuel)
│   │   ├── en.json    # Anglais (futur)
│   │   └── index.ts   # Système de traduction
│   └── index.tsx
```

### Format des fichiers de traduction

**src/i18n/fr.json**
```json
{
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "edit": "Modifier",
    "search": "Rechercher",
    "loading": "Chargement..."
  },
  "auth": {
    "login": "Connexion",
    "logout": "Déconnexion",
    "email": "Adresse e-mail",
    "password": "Mot de passe",
    "forgot_password": "Mot de passe oublié ?",
    "invalid_credentials": "Identifiants invalides"
  },
  "tickets": {
    "title": "Tickets de Maintenance",
    "new_ticket": "Nouveau Ticket",
    "status": {
      "open": "OUVERT",
      "in_progress": "EN COURS",
      "resolved": "RÉSOLU"
    },
    "priority": {
      "low": "BASSE",
      "medium": "MOYENNE",
      "high": "HAUTE",
      "critical": "CRITIQUE"
    },
    "assigned_to": "Assigné à",
    "created_by": "Créé par",
    "scheduled_date": "Date planifiée"
  },
  "backup": {
    "title": "Sauvegarde et Restauration",
    "export_database": "Exporter la Base de Données",
    "export_in_progress": "Export en cours...",
    "export_success": "Export réussi ! Téléchargement en cours...",
    "export_error": "Erreur lors de l'export",
    "analyze_media": "Analyser les Médias",
    "orphan_files": "fichiers orphelins",
    "total_space": "Espace total",
    "last_backup": "Dernière sauvegarde"
  },
  "media_audit": {
    "title": "Analyse des Médias",
    "total_files": "Fichiers totaux",
    "referenced_files": "Fichiers référencés",
    "orphan_files": "Fichiers orphelins",
    "orphan_size": "Espace orphelins",
    "analyzing": "Analyse en cours...",
    "no_orphans": "Aucun fichier orphelin détecté",
    "cleanup_confirm": "Voulez-vous vraiment supprimer {count} fichiers orphelins ?"
  },
  "machines": {
    "title": "Machines",
    "add_machine": "Ajouter une Machine",
    "machine_name": "Nom de la machine",
    "location": "Emplacement",
    "status": "Statut",
    "last_maintenance": "Dernière maintenance"
  },
  "settings": {
    "title": "Paramètres Système",
    "company_info": "Informations Entreprise",
    "company_title": "Titre de l'entreprise",
    "company_subtitle": "Sous-titre",
    "company_logo": "Logo de l'entreprise",
    "user_management": "Gestion des Utilisateurs",
    "backup_restore": "Sauvegarde et Restauration",
    "appearance": "Apparence"
  }
}
```

**src/i18n/en.json**
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "search": "Search",
    "loading": "Loading..."
  },
  "auth": {
    "login": "Login",
    "logout": "Logout",
    "email": "Email Address",
    "password": "Password",
    "forgot_password": "Forgot password?",
    "invalid_credentials": "Invalid credentials"
  },
  "tickets": {
    "title": "Maintenance Tickets",
    "new_ticket": "New Ticket",
    "status": {
      "open": "OPEN",
      "in_progress": "IN PROGRESS",
      "resolved": "RESOLVED"
    },
    "priority": {
      "low": "LOW",
      "medium": "MEDIUM",
      "high": "HIGH",
      "critical": "CRITICAL"
    },
    "assigned_to": "Assigned to",
    "created_by": "Created by",
    "scheduled_date": "Scheduled date"
  },
  "backup": {
    "title": "Backup and Restore",
    "export_database": "Export Database",
    "export_in_progress": "Export in progress...",
    "export_success": "Export successful! Download starting...",
    "export_error": "Export error",
    "analyze_media": "Analyze Media",
    "orphan_files": "orphan files",
    "total_space": "Total space",
    "last_backup": "Last backup"
  },
  "media_audit": {
    "title": "Media Analysis",
    "total_files": "Total files",
    "referenced_files": "Referenced files",
    "orphan_files": "Orphan files",
    "orphan_size": "Orphan space",
    "analyzing": "Analyzing...",
    "no_orphans": "No orphan files detected",
    "cleanup_confirm": "Do you really want to delete {count} orphan files?"
  },
  "machines": {
    "title": "Machines",
    "add_machine": "Add Machine",
    "machine_name": "Machine name",
    "location": "Location",
    "status": "Status",
    "last_maintenance": "Last maintenance"
  },
  "settings": {
    "title": "System Settings",
    "company_info": "Company Information",
    "company_title": "Company title",
    "company_subtitle": "Subtitle",
    "company_logo": "Company logo",
    "user_management": "User Management",
    "backup_restore": "Backup and Restore",
    "appearance": "Appearance"
  }
}
```

---

## 🔧 Système de Traduction

**src/i18n/index.ts**
```typescript
// Dictionnaires de traduction
import fr from './fr.json';
import en from './en.json';

export type Locale = 'fr' | 'en';

const translations: Record<Locale, any> = {
  fr,
  en
};

// Langue par défaut (stockée dans localStorage)
let currentLocale: Locale = 'fr';

// Initialiser depuis localStorage ou navigateur
export function initI18n(): Locale {
  // 1. Vérifier localStorage
  const stored = localStorage.getItem('locale') as Locale;
  if (stored && translations[stored]) {
    currentLocale = stored;
    return currentLocale;
  }
  
  // 2. Vérifier langue navigateur
  const browserLang = navigator.language.split('-')[0];
  if (browserLang === 'en') {
    currentLocale = 'en';
  }
  
  localStorage.setItem('locale', currentLocale);
  return currentLocale;
}

// Changer de langue
export function setLocale(locale: Locale) {
  if (!translations[locale]) {
    console.error(`Locale ${locale} not supported`);
    return;
  }
  currentLocale = locale;
  localStorage.setItem('locale', locale);
  // Recharger l'application pour appliquer la langue
  window.location.reload();
}

// Obtenir la langue actuelle
export function getLocale(): Locale {
  return currentLocale;
}

// Fonction de traduction principale
export function t(key: string, params?: Record<string, any>): string {
  const keys = key.split('.');
  let value = translations[currentLocale];
  
  // Naviguer dans l'objet JSON
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key; // Retourner la clé si traduction manquante
    }
  }
  
  // Si c'est une chaîne, appliquer les paramètres
  if (typeof value === 'string') {
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param]?.toString() || match;
      });
    }
    return value;
  }
  
  return key;
}

// Hook React pour les composants
export function useTranslation() {
  const [locale, setLocaleState] = React.useState(getLocale());
  
  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    setLocaleState(newLocale);
  };
  
  return {
    t,
    locale,
    setLocale: changeLocale
  };
}
```

---

## 🎨 Utilisation dans les Composants

### Avant (Code actuel - français en dur)
```javascript
React.createElement('h1', { className: 'text-2xl font-bold' }, 
  'Tickets de Maintenance'
)

React.createElement('button', {}, 'Nouveau Ticket')

React.createElement('span', {}, 'OUVERT')
```

### Après (Code i18n)
```javascript
import { t } from './i18n';

React.createElement('h1', { className: 'text-2xl font-bold' }, 
  t('tickets.title')  // "Tickets de Maintenance" ou "Maintenance Tickets"
)

React.createElement('button', {}, t('tickets.new_ticket'))

React.createElement('span', {}, t('tickets.status.open'))
```

### Exemple avec paramètres
```javascript
// Français: "5 fichiers orphelins"
// Anglais: "5 orphan files"
t('media_audit.orphan_files', { count: 5 })

// Français: "Voulez-vous vraiment supprimer 8 fichiers orphelins ?"
// Anglais: "Do you really want to delete 8 orphan files?"
t('media_audit.cleanup_confirm', { count: 8 })
```

---

## 🔘 Sélecteur de Langue (UI)

**Ajout dans le Header**
```javascript
// LanguageSelector Component
const LanguageSelector = () => {
  const { locale, setLocale } = useTranslation();
  
  return React.createElement('div', { className: 'flex items-center gap-2' },
    React.createElement('button', {
      onClick: () => setLocale('fr'),
      className: `px-3 py-1 rounded ${locale === 'fr' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`
    }, '🇫🇷 FR'),
    
    React.createElement('button', {
      onClick: () => setLocale('en'),
      className: `px-3 py-1 rounded ${locale === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`
    }, '🇬🇧 EN')
  );
};
```

**Intégration dans le header existant**
```javascript
// Dans MainApp, ligne ~6850
React.createElement('div', { className: 'flex items-center gap-4' },
  // Logo et titre existants
  React.createElement(LanguageSelector),
  // User menu existant
)
```

---

## 📦 Stockage de la Langue

### Base de Données (Optionnel)
```sql
-- Ajouter colonne dans table users
ALTER TABLE users ADD COLUMN preferred_locale TEXT DEFAULT 'fr';
```

### localStorage (Recommandé pour MVP)
```javascript
// Sauvegardé automatiquement par setLocale()
localStorage.getItem('locale') // 'fr' ou 'en'
```

---

## 🗓️ Plan de Migration

### Phase 1 : Préparation (Maintenant - Avec Backup)
✅ Créer structure i18n (dossiers + fichiers)  
✅ Implémenter système de traduction  
✅ Garder textes français actuels **SANS TOUCHER AU CODE**  
✅ **Documenter les clés de traduction pour backup/restore**

**Temps: +30 minutes** (inclus dans Phase 1 backup)

### Phase 2 : Migration Progressive (Futur)
🔜 Remplacer textes en dur par `t('key')`  
🔜 Commencer par sections critiques (Login, Tickets)  
🔜 Traduire en anglais au fur et à mesure  
🔜 Tester chaque section

**Temps: 6-8 heures** (peut être fait en plusieurs sprints)

### Phase 3 : Finalisation (Optionnel)
🔮 Ajouter sélecteur de langue dans UI  
🔮 Sauvegarder préférence utilisateur en DB  
🔮 Traduire messages d'erreur API  

**Temps: 2-3 heures**

---

## 🎯 Code Spécifique au Backup/Restore

**Clés de traduction prioritaires pour Phase 1:**

```json
{
  "backup": {
    "title": "Sauvegarde et Restauration",
    "export_database": "Exporter la Base de Données",
    "export_in_progress": "Export en cours...",
    "export_success": "Export réussi !",
    "export_error": "Erreur lors de l'export",
    "analyze_media": "Analyser les Médias",
    "analyzing": "Analyse en cours...",
    "orphan_files": "fichiers orphelins",
    "orphan_size": "Espace total",
    "no_orphans": "Aucun fichier orphelin",
    "cleanup_warning": "Attention : Cette action est irréversible"
  }
}
```

**Utilisation immédiate:**
```javascript
// Dans SystemSettingsModal - Section Backup
React.createElement('h3', { className: 'text-lg font-semibold' },
  t('backup.title')  // Au lieu de "Sauvegarde et Restauration"
)

React.createElement('button', {
  onClick: exportDatabase,
  disabled: isExporting
}, isExporting ? t('backup.export_in_progress') : t('backup.export_database'))
```

---

## 📊 Impact sur le Projet

### ✅ Avantages
1. **Future-proof** : Prêt pour expansion internationale
2. **Maintenance facilitée** : Textes centralisés dans JSON
3. **Cohérence** : Terminologie uniforme
4. **SEO** : Meilleur référencement multilingue

### ⚠️ Considérations
1. **Taille bundle** : +20-30 KB (négligeable avec Cloudflare)
2. **Migration graduelle** : Peut se faire section par section
3. **Traductions** : Besoin de traducteur pour qualité anglais

---

## 🚀 Implémentation Proposée

### Option 1 : Préparation Minimale (Recommandé)
**Temps: +30 min sur Phase 1**

✅ Créer structure fichiers i18n  
✅ Implémenter fonction `t()`  
✅ **Utiliser uniquement pour le code de backup/restore**  
✅ Reste du code reste en français (aucun changement)

**Avantage**: Code backup/restore déjà internationalisé dès le début

### Option 2 : Migration Complète Immédiate
**Temps: +8 heures**

🔄 Migrer TOUTE l'application vers i18n  
🔄 Traduire tout en anglais  
🔄 Tester les 2 langues

**Avantage**: Application bilingue complète maintenant

### Option 3 : Reporter à plus tard
**Temps: 0**

❌ Implémenter backup en français uniquement  
❌ Refactoriser plus tard si besoin

**Désavantage**: Double travail (écrire puis réécrire)

---

## 💡 Ma Recommandation

**Option 1 : Préparation Minimale**

Pendant l'implémentation de Phase 1 (backup/restore):

1. Je crée la structure i18n (fichiers JSON)
2. J'utilise `t()` **uniquement pour le nouveau code** (backup/media audit)
3. Le reste de l'app reste en français (pas touché)
4. Temps total: 4h30 au lieu de 4h

**Résultat:**
- Infrastructure i18n en place
- Nouveau code déjà préparé
- Migration future facilitée
- Coût minimal (+30 min)

---

## 📋 TODO Phase 1 Révisée

### Implémentation Backup + i18n (4h30 total)

**1. Setup i18n (30 min)**
- [ ] Créer `src/i18n/fr.json`
- [ ] Créer `src/i18n/en.json` (clés backup seulement)
- [ ] Créer `src/i18n/index.ts`
- [ ] Documenter structure

**2. Backup Export (2h)**
- [ ] Créer middleware `superAdminOnly`
- [ ] Créer endpoint `/api/admin/backup/export`
- [ ] Utiliser `t()` pour messages UI
- [ ] Ajouter section SystemSettingsModal

**3. Media Audit (1h)**
- [ ] Créer endpoint `/api/admin/media/orphans`
- [ ] Utiliser `t()` pour rapport
- [ ] Ajouter UI analyse médias

**4. Documentation (1h)**
- [ ] Guide Cloudflare Time Travel
- [ ] Instructions restauration
- [ ] Exemples i18n pour futures sections

---

## 🎯 Réponse à votre Demande

> "Il faut prévoir une solution incluant la version anglaise dans le futur"

**Proposition concrète:**

✅ **J'implémente l'infrastructure i18n maintenant** (30 min)  
✅ **Code backup/restore directement internationalisé**  
✅ **Reste de l'app migré progressivement plus tard**  

**Coût:** Phase 1 passe de 4h à **4h30** (ajout minimal)

**Bénéfice:** Application prête pour l'anglais sans refonte future

---

## 🤔 Votre décision ?

**A)** Option 1 - Préparation minimale i18n (+30 min) ⭐ **RECOMMANDÉ**  
**B)** Option 2 - Migration complète immédiate (+8h)  
**C)** Option 3 - Reporter à plus tard (0 temps, mais double travail futur)

Quelle approche préférez-vous ?
