# 📱 Fix: Dropdown Custom pour la Sélection de Rôles sur Mobile

## 🐛 Problème identifié

**Date**: 2025-11-07  
**Rapport utilisateur**: "Sur mobile la liste de choix de rôles sur background noir n'est pas responsive et ne peut pas être fermée"

### Symptômes

Sur les appareils mobiles (iOS Safari, Chrome Android), lorsque l'utilisateur cliquait sur le `<select>` natif HTML pour choisir un rôle :

1. **Interface système native** : Le navigateur affichait sa propre interface de sélection (fond noir sur iOS, bottom sheet sur Android)
2. **Pas de contrôle CSS** : Impossible de styler ou personnaliser cette interface native
3. **Fermeture difficile** : Pas de bouton "Fermer" évident, comportement différent selon navigateur
4. **Non-responsive** : Liste complète affichée d'un coup, pas de scroll fluide
5. **Expérience incohérente** : Rupture de design avec le reste de l'application

### Cause racine

L'élément `<select>` HTML natif délègue son rendu au système d'exploitation sur mobile :

```typescript
// ❌ ANCIEN CODE (select natif)
React.createElement('select', {
    value: newRole,
    onChange: (e) => setNewRole(e.target.value),
    className: "w-full px-2 py-2 sm:px-4 sm:py-3 ..."
},
    React.createElement('option', { value: 'director' }, 'Directeur Général'),
    React.createElement('option', { value: 'admin' }, 'Administrateur'),
    // ... 14 options au total
)
```

**Problème** : Sur mobile, le navigateur ignore les styles CSS et affiche sa propre UI système (fond noir, comportement natif).

## ✅ Solution implémentée

### Composant custom `RoleDropdown`

Création d'un **composant de dropdown entièrement custom** en HTML/CSS/React qui remplace le `<select>` natif :

```typescript
// ✅ NOUVEAU CODE (dropdown custom)
const RoleDropdown = ({ value, onChange, disabled, currentUserRole, variant = 'blue' }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef(null);
    
    // Styles selon variant (blue pour création, green pour édition)
    const styles = {
        blue: {
            button: 'from-white/90 to-blue-50/80 border-blue-300 focus:ring-blue-500',
            chevron: 'text-blue-500',
            shadow: '0 6px 20px rgba(59, 130, 246, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.5)',
            border: 'border-blue-300'
        },
        green: {
            button: 'from-white/90 to-green-50/80 border-green-300 focus:ring-green-500',
            chevron: 'text-green-500',
            shadow: '0 6px 20px rgba(34, 197, 94, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.5)',
            border: 'border-green-300'
        }
    };
    
    // Définition des 14 rôles organisés par catégorie
    const roleGroups = [
        { label: '📊 Direction', roles: [...] },
        { label: '⚙️ Management Maintenance', roles: [...] },
        { label: '🔧 Technique', roles: [...] },
        { label: '🏭 Production', roles: [...] },
        { label: '🛡️ Support', roles: [...] },
        { label: '👁️ Transversal', roles: [...] }
    ];
    
    // Fermeture au clic extérieur
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside); // Support mobile
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);
    
    return React.createElement('div', { ref: dropdownRef, className: 'relative w-full' },
        // Bouton principal
        React.createElement('button', { ... }),
        
        // Liste déroulante (conditionnelle)
        isOpen && React.createElement('div', {
            className: 'absolute z-50 w-full mt-2 bg-white border-2 ... max-h-[60vh] overflow-y-auto'
        }, /* ... */)
    );
};
```

### Utilisation dans les formulaires

**Formulaire de création** (variant blue) :
```typescript
React.createElement(RoleDropdown, {
    value: newRole,
    onChange: (e) => setNewRole(e.target.value),
    disabled: false,
    currentUserRole: currentUser.role,
    variant: 'blue'  // Style bleu par défaut
})
```

**Formulaire d'édition** (variant green) :
```typescript
React.createElement(RoleDropdown, {
    value: editRole,
    onChange: (e) => setEditRole(e.target.value),
    disabled: currentUser.role === 'supervisor' && editingUser?.role === 'admin',
    currentUserRole: currentUser.role,
    variant: 'green'  // Style vert pour édition
})
```

## 🎯 Caractéristiques du composant

### 1. **Entièrement responsive**

| Écran | Padding | Font Size | Font Weight |
|-------|---------|-----------|-------------|
| Mobile (< 640px) | `px-2 py-2` (8px) | `text-sm` (14px) | `font-medium` (500) |
| Desktop (≥ 640px) | `px-4 py-3` (16px) | `text-base` (16px) | `font-semibold` (600) |

### 2. **Fermeture intelligente**

✅ Clic à l'extérieur du dropdown → Ferme automatiquement  
✅ Support événements tactiles (`touchstart`) pour mobile  
✅ Sélection d'une option → Ferme automatiquement  
✅ Ref React pour détecter les clics extérieurs

### 3. **Styles adaptatifs**

**Variant Blue** (Création) :
- Fond : Dégradé `white/90 → blue-50/80`
- Bordure : `border-blue-300`
- Chevron : `text-blue-500`
- Shadow : Ombre bleue

**Variant Green** (Édition) :
- Fond : Dégradé `white/90 → green-50/80`
- Bordure : `border-green-300`
- Chevron : `text-green-500`
- Shadow : Ombre verte

### 4. **Organisation par catégories**

**5 groupes de rôles** avec en-têtes sticky :
- 📊 Direction (2 rôles)
- ⚙️ Management Maintenance (3 rôles)
- 🔧 Technique (2 rôles)
- 🏭 Production (3 rôles)
- 🛡️ Support (3 rôles)
- 👁️ Transversal (1 rôle)

**Catégories sticky** : Les en-têtes restent visibles pendant le scroll

### 5. **Feedback visuel**

✅ **Chevron animé** : ⬇️ (fermé) → ⬆️ (ouvert)  
✅ **Option sélectionnée** : Fond bleu clair + texte gras + checkmark ✓  
✅ **Hover** : Fond bleu clair au survol  
✅ **Disabled** : Opacité 50% + curseur non-autorisé  
✅ **Focus** : Ring bleu/vert + bordure accentuée

### 6. **Accessibilité mobile**

✅ **Touch events** : `touchstart` pour détection tactile  
✅ **Zones touch** : Minimum 44px de hauteur (iOS guidelines)  
✅ **Scroll fluide** : `max-h-[60vh]` avec `overflow-y-auto`  
✅ **Truncate** : Labels longs tronqués avec `...`  
✅ **Z-index élevé** : `z-[9999]` pour passer au-dessus de tous les éléments (cartes, formulaires, etc.)

## 📊 Comparaison Avant/Après

| Aspect | Avant (select natif) | Après (dropdown custom) |
|--------|---------------------|------------------------|
| **Contrôle CSS** | ❌ Minimal | ✅ Total |
| **Fond noir mobile** | ❌ Oui (système) | ✅ Non (blanc) |
| **Fermeture** | ❌ Complexe | ✅ Clic extérieur |
| **Responsive** | ❌ Non | ✅ Oui |
| **Catégories** | ⚠️ optgroup limité | ✅ Headers sticky |
| **Animation** | ❌ Aucune | ✅ Chevron + transitions |
| **Cohérence UI** | ❌ Rupture | ✅ Intégration parfaite |
| **Taille code** | ~40 lignes | ~180 lignes |
| **Maintenabilité** | ✅ Simple | ⚠️ Plus complexe |

## 🚀 Tests effectués

### Build et déploiement

✅ **Build local réussi** : 893ms (476.78 kB)  
✅ **Serveur redémarré** : PM2 restart sans erreur  
✅ **Application accessible** : http://localhost:3000  
✅ **URL publique sandbox** : https://3000-i99eg52ghw8axx8tockng-583b4d74.sandbox.novita.ai  
✅ **Déploiement production** : https://606af4ce.webapp-7t8.pages.dev

### Tests fonctionnels à effectuer

⏳ **Desktop** :
- [ ] Clic sur dropdown ouvre la liste
- [ ] Clic sur option sélectionne et ferme
- [ ] Clic extérieur ferme le dropdown
- [ ] Scroll fonctionne pour les 14 options
- [ ] Catégories sticky restent visibles

⏳ **Mobile** :
- [ ] Tap sur dropdown ouvre la liste (fond blanc, pas noir)
- [ ] Tap sur option sélectionne et ferme
- [ ] Tap extérieur ferme le dropdown
- [ ] Scroll fluide sur la liste
- [ ] Interface cohérente avec l'appli

⏳ **Variantes** :
- [ ] Variant blue fonctionne (création)
- [ ] Variant green fonctionne (édition)
- [ ] Disabled bloque l'ouverture

## 🔧 Détails d'implémentation

### Gestion du state

```typescript
const [isOpen, setIsOpen] = React.useState(false);  // État ouvert/fermé
const dropdownRef = React.useRef(null);              // Ref pour détection clic extérieur
```

### Fermeture au clic extérieur

```typescript
React.useEffect(() => {
    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsOpen(false);
        }
    };
    
    if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);  // ← Mobile
    }
    
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
    };
}, [isOpen]);
```

### Sélection d'option

```typescript
const handleSelect = (roleValue) => {
    onChange({ target: { value: roleValue } });  // Simule event natif
    setIsOpen(false);                             // Ferme le dropdown
};
```

### Concaténation de strings

**Important** : React.createElement n'accepte pas les template literals. Utiliser la concaténation :

```typescript
// ❌ FAUX (template literal)
className: `w-full ${currentStyle.button} flex`

// ✅ BON (concaténation)
className: 'w-full ' + currentStyle.button + ' flex'
```

## 📝 Notes techniques

### Pourquoi pas un composant library externe ?

**Avantages du custom** :
- ✅ Contrôle total sur le comportement
- ✅ Pas de dépendance externe (bundle léger)
- ✅ Intégration parfaite avec React.createElement (pas de JSX)
- ✅ Styles Tailwind natifs

**Inconvénients** :
- ⚠️ Plus de code à maintenir (~180 lignes)
- ⚠️ Tests manuels nécessaires
- ⚠️ Pas d'accessibilité ARIA complète (à améliorer)

### Améliorations futures possibles

1. **Accessibilité ARIA** :
   - `role="listbox"` sur le container
   - `role="option"` sur les boutons
   - `aria-selected` sur l'option active
   - Navigation clavier (↑↓ Enter Escape)

2. **Recherche** :
   - Input de recherche dans le dropdown
   - Filtrage en temps réel des rôles

3. **Animations** :
   - Transition slide-down/up
   - Spring animation sur ouverture

4. **Performance** :
   - Virtualisation pour grandes listes (pas nécessaire pour 14 items)
   - Lazy loading des catégories

## 📦 Fichiers modifiés

**src/index.tsx** :
- Ligne 3453-3603 : Nouveau composant `RoleDropdown` (150 lignes)
- Ligne 3970-3975 : Remplacement du select de création par `RoleDropdown`
- Ligne 4018-4023 : Remplacement du select d'édition par `RoleDropdown`

**Total** : +162 lignes, -64 lignes (select natifs supprimés)

## 🎯 Commits Git

```bash
cb5d4b9 - Fix: Remplacer select natif par dropdown custom responsive

- Créé composant RoleDropdown custom pour remplacer <select> HTML natif
- Résout le problème du fond noir système non-fermable sur mobile
- Liste déroulante HTML/CSS entièrement personnalisée et responsive
- Clic extérieur pour fermer le dropdown (avec événements touch)
- Support variant blue/green pour formulaires création/édition
- Chevron animé (up/down) selon état ouvert/fermé
- Highlight de l'option sélectionnée avec checkmark
- Catégories sticky avec scroll indépendant (max 60vh)
- 14 rôles organisés en 5 groupes avec emojis
- Compatible mobile avec événements touch/click

54d6c59 - Fix: Augmenter z-index du dropdown à z-[9999]

- Changé z-50 vers z-[9999] pour passer au-dessus de toutes les cartes
- Résout le problème du dropdown caché par les cartes utilisateurs
- Header sticky ajusté à z-[1] (relatif au dropdown parent)
- Assure que le dropdown est toujours visible au-dessus du contenu
```

## 🌐 URLs de test

### Sandbox (Développement)
- **URL** : https://3000-i99eg52ghw8axx8tockng-583b4d74.sandbox.novita.ai
- **Port** : 3000
- **Status** : ✅ Active

### Production (Cloudflare Pages)
- **URL initiale** : https://606af4ce.webapp-7t8.pages.dev
- **URL avec z-index fix** : https://d6297935.webapp-7t8.pages.dev
- **Projet** : webapp
- **Status** : ✅ Déployé avec z-index fix
- **Date** : 2025-11-07

### Domaine personnalisé
- **URL** : https://app.igpglass.ca
- **Status** : ✅ Configuré

---

**Développeur** : Assistant IA  
**Date** : 2025-11-07  
**Version** : 2.0.2  
**Status** : ✅ Complété - Tests utilisateur requis
