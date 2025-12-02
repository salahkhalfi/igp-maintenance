# Guide de Refactoring Futur : Menu & Navigation

**Date de création :** 01 Décembre 2025
**Contexte :** Suite aux problèmes rencontrés lors de la tentative de modernisation du menu (conflits Mobile/Desktop, boutons manquants, instabilité), voici la stratégie technique stricte à adopter pour toute future tentative.

## 🛑 Règle d'Or : Ne JAMAIS mélanger la logique Mobile et Desktop

L'erreur principale a été de vouloir tout gérer dans un seul fichier `AppHeader.js` avec des conditions `isMobile`. Cela crée un code fragile où modifier la version PC casse la version Mobile.

## Stratégie Technique pour la Prochaine Fois

### 1. Architecture des Composants (Obligatoire)

Au lieu d'un fichier monolithique, l'architecture **DOIT** être :

```
src/components/navigation/
├── AppHeader.js          <-- Orchestrateur (très simple)
├── DesktopHeader.js      <-- Logique 100% Souris / Écran large
└── MobileHeader.js       <-- Logique 100% Tactile / Petit écran
```

**Exemple de code pour `AppHeader.js` :**
```javascript
const AppHeader = (props) => {
  const isMobile = useIsMobile(); // Hook personnalisé ou window.innerWidth

  if (isMobile) {
    return <MobileHeader {...props} />;
  }
  return <DesktopHeader {...props} />;
};
```
*Avantage :* Si on casse le `DesktopHeader`, le technicien sur le terrain avec son `MobileHeader` n'est **physiquement pas impacté**.

### 2. Séparation des Données (Data-Driven)

Ne jamais écrire les boutons en dur dans le JSX. Définir une configuration unique :

```javascript
// navigationConfig.js
export const MENU_ITEMS = [
  { 
    id: 'users', 
    label: 'Utilisateurs', 
    icon: 'fa-users', 
    action: 'onOpenUserManagement', 
    category: 'ADMINISTRATION',
    roles: ['admin', 'supervisor']
  },
  { 
    id: 'machines', 
    label: 'Machines', 
    icon: 'fa-cogs', 
    action: 'onOpenMachineManagement', 
    category: 'ADMINISTRATION',
    roles: ['admin', 'supervisor']
  },
  // ...
];
```

*   **MobileHeader** : Boucle sur cette liste pour afficher une grille simple.
*   **DesktopHeader** : Boucle sur cette liste en groupant par `category` pour les menus déroulants.

### 3. Interface Mobile (Standardisation)

*   **PAS de calculs de hauteur** (`100dvh`) : Cela cause des problèmes avec les barres d'adresse mobiles.
*   **Utiliser un Overlay (Drawer)** : Le menu mobile doit être une couche `fixed` qui vient **par-dessus** l'application (z-index élevé), et non pas un élément qui pousse le contenu.
*   **Boutons** : Garder les gros boutons carrés (44px minimum) pour l'accessibilité tactile.

---

## Pourquoi cette note ?
Cette note a été écrite pour garantir que la "mémoire courte" de l'IA ne soit pas un obstacle. Ce fichier fait partie du code source du projet. **Toute future IA travaillant sur ce projet devra lire ce fichier avant de toucher au menu.**
