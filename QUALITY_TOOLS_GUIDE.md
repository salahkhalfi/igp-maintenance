# 🛠️ Guide des Outils de Qualité

Ce document explique comment utiliser les nouveaux outils de qualité ajoutés au projet pour **éviter que corriger A casse B**.

---

## 📋 1. Checklist de Test (TESTING_CHECKLIST.md)

### 🎯 Objectif
Liste complète de tous les tests à effectuer **AVANT chaque déploiement** en production.

### 📖 Comment l'utiliser

**Avant CHAQUE déploiement**:

1. **Ouvrir le fichier**: `TESTING_CHECKLIST.md`
2. **Copier la checklist**: Dans un nouveau fichier ou document
3. **Tester un par un**: Cocher chaque élément qui passe
4. **Noter les bugs**: Si un test échoue, noter le bug
5. **Corriger**: Corriger tous les bugs trouvés
6. **Recommencer**: Refaire TOUTE la checklist depuis le début
7. **Déployer**: Seulement quand TOUS les tests passent ✅

**Temps estimé**: 30-45 minutes pour la checklist complète

### ⚠️ Tests Critiques (NE JAMAIS Oublier)

Ces tests doivent **TOUJOURS** passer:

- ✅ Bannière planification affiche nom technicien (pas Tech #X)
- ✅ Changement de rôle fonctionne pour les 14 rôles
- ✅ Permissions changent après changement de rôle
- ✅ Technicien peut lire les messages
- ✅ Opérateur peut lire les messages

### 📝 Exemple d'utilisation

```bash
# 1. Déployer en preview
npm run build
npx wrangler pages deploy dist --project-name webapp

# 2. Ouvrir TESTING_CHECKLIST.md
# 3. Tester chaque section
# 4. Noter bugs trouvés

# 5. Corriger bugs
git add .
git commit -m "Fix: [description]"
npm run build
npx wrangler pages deploy dist --project-name webapp

# 6. Refaire la checklist complète
# 7. Si tout passe, déployer en production
```

---

## 🎨 2. Utilitaires de Formatage (src/utils/formatters.ts)

### 🎯 Objectif
Centraliser TOUTES les fonctions de formatage pour éviter la duplication de code.

### 📖 Fonctions Disponibles

#### 👤 Formatage des Utilisateurs
```typescript
import { formatAssigneeName, formatReporterName, formatRole } from './utils/formatters';

// Afficher le nom de l'assigné
formatAssigneeName(ticket)
// => "👤 Brahim" ou "👥 Équipe complète" ou "⚠️ Non assigné"

// Afficher le reporter
formatReporterName(ticket)
// => "Jean Dupont"

// Traduire un rôle
formatRole('team_leader')
// => "Chef d'Équipe de Production"
```

#### 📅 Formatage des Dates
```typescript
import { formatDate, formatScheduledDate, formatRelativeTime } from './utils/formatters';

// Date avec heure
formatDate('2025-11-08 14:30:00', true)
// => "08 nov, 14:30"

// Date courte (pour badge)
formatScheduledDate('2025-11-08 14:30:00')
// => "08 nov"

// Temps relatif
formatRelativeTime('2025-11-08 14:30:00')
// => "Il y a 2h"
```

#### 🎫 Formatage des Tickets
```typescript
import { formatPriorityBadge, formatStatus, formatMachineInfo } from './utils/formatters';

// Badge de priorité
const badge = formatPriorityBadge('critical')
// => { text: 'CRIT', className: 'bg-red-100 text-red-700', emoji: '🔴' }

// Statut en français
formatStatus('in_progress')
// => "En cours"

// Info machine
formatMachineInfo(ticket)
// => "Four à arc électrique Model X"
```

### 💡 Quand utiliser formatters.ts

**✅ TOUJOURS utiliser ces fonctions au lieu de dupliquer la logique**

**Avant** (Code dupliqué ❌):
```typescript
// Ligne 5742
'👤 Tech #' + ticket.assigned_to

// Ligne 2897
'👤 Technicien #' + ticket.assigned_to

// Ligne 3456
'👤 ' + ticket.assigned_to
```

**Après** (Code centralisé ✅):
```typescript
// Partout où on affiche l'assigné
import { formatAssigneeName } from './utils/formatters';

formatAssigneeName(ticket)
```

**Avantages**:
- ✅ Une seule modification corrige partout
- ✅ Logique cohérente dans toute l'app
- ✅ Facile à tester
- ✅ Code plus lisible

### 🔧 Comment ajouter une nouvelle fonction

```typescript
// 1. Ajouter dans src/utils/formatters.ts
/**
 * Description de la fonction
 * @param param - Description du paramètre
 * @returns Description du retour
 * @example
 * maFonction('exemple') // => "résultat"
 */
export function maFonction(param: string): string {
  // Logique ici
  return result;
}

// 2. Importer dans le fichier qui en a besoin
import { maFonction } from './utils/formatters';

// 3. Utiliser
const result = maFonction(value);
```

---

## 🔍 3. ESLint (Analyse de Code)

### 🎯 Objectif
Détecter automatiquement les erreurs courantes, le code dupliqué, et les mauvaises pratiques.

### 📖 Commandes Disponibles

#### Vérifier le code (sans modifier)
```bash
npm run lint
```

**Affiche**:
- ❌ Erreurs critiques (doivent être corrigées)
- ⚠️ Avertissements (recommandé de corriger)
- 📊 Résumé des problèmes

**Exemple de sortie**:
```
src/index.tsx
  1234:5  error    'assignee_name' is assigned a value but never used    no-unused-vars
  5678:10 warning  Unexpected console statement                          no-console
  9012:15 warning  Missing semicolon                                     semi

✖ 3 problems (1 error, 2 warnings)
```

#### Corriger automatiquement
```bash
npm run lint:fix
```

**Corrige automatiquement**:
- ✅ Indentation
- ✅ Points-virgules manquants
- ✅ Guillemets simples/doubles
- ✅ Espaces superflus
- ✅ Et plus...

**Ne corrige PAS automatiquement**:
- Variables non utilisées (besoin de décision humaine)
- Logique dupliquée (besoin de refactoring manuel)

#### Vérification stricte (CI/CD)
```bash
npm run lint:check
```

**Échoue si**:
- ❌ Même un seul avertissement existe
- Utile pour intégration continue (GitHub Actions)

### 📋 Règles Principales

#### ✅ Règles Activées

**Variables et Imports**:
- `no-unused-vars`: Variables non utilisées (warning)
- `no-duplicate-imports`: Imports dupliqués (error)
- `prefer-const`: Utiliser const au lieu de let (warning)
- `no-var`: Ne pas utiliser var (error)

**Fonctions**:
- `no-empty-function`: Fonctions vides (warning)
- `consistent-return`: Return cohérent (warning)
- `require-await`: async doit contenir await (warning)

**Code Quality**:
- `eqeqeq`: Utiliser === au lieu de == (error)
- `no-eval`: Ne pas utiliser eval (error)
- `no-alert`: Éviter alert() (warning)
- `complexity`: Complexité max 20 (warning)
- `max-depth`: Profondeur max 4 niveaux (warning)

**Style**:
- `indent`: Indentation 2 espaces (warning)
- `semi`: Points-virgules obligatoires (error)
- `quotes`: Guillemets simples (warning)
- `max-len`: Ligne max 120 caractères (warning)

#### ⚙️ Règles Spéciales pour ce Projet

**Champs SQL autorisés en snake_case**:
```javascript
// ✅ Autorisé (noms de colonnes DB)
ticket.assigned_to
ticket.assignee_name
ticket.scheduled_date
ticket.created_at
user.full_name
```

**console.log autorisé**:
```javascript
// ✅ Autorisé
console.error('Error:', error);
console.warn('Warning:', message);
console.info('Info:', data);

// ⚠️ Warning
console.log('Debug:', value); // Utiliser console.info
```

### 🔧 Configuration

**Fichier**: `.eslintrc.json`

**Modifier une règle**:
```json
{
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error", "info"] }],
    "max-len": ["warn", { "code": 150 }]  // Augmenter à 150
  }
}
```

**Ignorer un fichier**:
```json
{
  "ignorePatterns": [
    "node_modules/",
    "dist/",
    "specific-file.js"
  ]
}
```

**Ignorer une ligne dans le code**:
```javascript
// eslint-disable-next-line no-console
console.log('Debug important');

// Ignorer toute une fonction
/* eslint-disable no-unused-vars */
function oldFunction(param) {
  // Code legacy
}
/* eslint-enable no-unused-vars */
```

---

## 🚀 Workflow Recommandé

### Pour CHAQUE Correction/Feature

```bash
# 1. Créer une branche
git checkout -b fix/assignee-name-display

# 2. Faire les modifications
# ... éditer les fichiers ...

# 3. Vérifier avec ESLint
npm run lint

# 4. Corriger automatiquement ce qui peut l'être
npm run lint:fix

# 5. Corriger manuellement le reste
# ... corriger les erreurs ...

# 6. Commiter
git add .
git commit -m "Fix: Display assignee name instead of ID"

# 7. Build
npm run build

# 8. Déployer en preview
npx wrangler pages deploy dist --project-name webapp

# 9. TESTING_CHECKLIST.md
# Suivre TOUTE la checklist

# 10. Si tout passe, merger et déployer prod
git checkout main
git merge fix/assignee-name-display
npm run build
npm run deploy
```

### Avant CHAQUE Déploiement Production

```
1. ✅ npm run lint:fix      (Corriger le code)
2. ✅ npm run build         (Compiler)
3. ✅ TESTING_CHECKLIST.md  (Tester manuellement)
4. ✅ Tous tests passent     (100% de la checklist)
5. ✅ npm run deploy        (Déployer)
```

---

## 📊 Métriques de Qualité

### Objectifs à Atteindre

**Court Terme (Cette Semaine)**:
- [ ] 100% de la checklist de test passe avant chaque déploiement
- [ ] 0 erreur ESLint dans le code nouveau
- [ ] Utiliser formatters.ts pour 100% des nouveaux affichages

**Moyen Terme (Ce Mois)**:
- [ ] Réduire les warnings ESLint de 50%
- [ ] Refactorer les sections avec code dupliqué
- [ ] Ajouter JSDoc pour toutes les fonctions utilitaires

**Long Terme (Prochain Trimestre)**:
- [ ] 0 warning ESLint dans tout le code
- [ ] 100% des affichages utilisent formatters.ts
- [ ] Tests automatisés pour les fonctions critiques

---

## 🎓 Formation d'Équipe

### Pour les Nouveaux Développeurs

**Jour 1**: Lire ce guide
**Jour 2**: Pratiquer avec la checklist sur environnement de test
**Jour 3**: Faire une correction simple en suivant le workflow
**Jour 4**: Review de code avec mentor
**Jour 5**: Première correction en autonomie

### Ressources

**Documentation**:
- `TESTING_CHECKLIST.md` - Liste complète des tests
- `src/utils/formatters.ts` - Fonctions de formatage
- `.eslintrc.json` - Configuration ESLint

**Exemples**:
- Commit `f092e67` - Utilisation de formatters pour assignee_name
- Commit `9dfb109` - Migration de base de données

---

## 💡 FAQ

### Q: Dois-je VRAIMENT faire la checklist COMPLÈTE à chaque fois?
**R**: OUI! C'est 45 minutes qui évitent des heures de debug. Une correction peut casser 5 autres choses sans que vous le sachiez.

### Q: ESLint me donne 200 warnings, je dois tous les corriger?
**R**: Non, commencez par:
1. Corriger les erreurs (errors) d'abord
2. Corriger les warnings du code que vous modifiez
3. Progressivement corriger le reste (1 fichier/semaine)

### Q: Je peux ignorer ESLint sur mon code?
**R**: Seulement si vous avez une TRÈS bonne raison et documentez pourquoi:
```javascript
// eslint-disable-next-line no-console
// REASON: Debug critique pour tracer le bug #1234
console.log('Critical debug:', data);
```

### Q: Les formatters.ts ajoutent du code, c'est plus lourd?
**R**: Non! Les fonctions sont réutilisées, donc:
- Avant: 1000 lignes de code dupliqué
- Après: 100 lignes dans formatters + 10 lignes d'imports = **90% de réduction**

### Q: Comment savoir quelle fonction formatters utiliser?
**R**: Cherchez dans `formatters.ts`:
```bash
# Chercher une fonction
grep -n "format.*[Aa]ssign" src/utils/formatters.ts

# Lire toutes les fonctions disponibles
cat src/utils/formatters.ts | grep "^export function"
```

---

## 🎯 Résumé

**3 Outils pour Éviter que "Corriger A Casse B"**:

1. **TESTING_CHECKLIST.md** → Tester manuellement TOUT avant déploiement
2. **formatters.ts** → Centraliser la logique, éviter duplication
3. **ESLint** → Détecter automatiquement les erreurs courantes

**Utiliser les 3 = Qualité Garantie** ✅

---

**Dernière Mise à Jour**: 2025-11-08  
**Auteur**: Claude Assistant  
**Version**: 1.0.0
