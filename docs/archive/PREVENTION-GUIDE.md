# 🛡️ GUIDE DE PRÉVENTION - Erreurs de Sécurité

**Objectif:** Éviter les bugs d'échappement HTML et autres erreurs de sécurité

---

## 📋 RÈGLES D'OR

### ✅ RÈGLE #1: Stocker les valeurs BRUTES en DB

**❌ MAUVAIS:**
```typescript
// N'ÉCHAPPEZ JAMAIS avant stockage!
const escaped = value.replace(/</g, '&lt;');
await db.insert(escaped); // ❌ FAUX
```

**✅ BON:**
```typescript
// Stockez la valeur BRUTE (après trim/validation seulement)
const trimmed = value.trim();
await db.insert(trimmed); // ✅ CORRECT
```

**Pourquoi:**
- La DB doit contenir les données originales
- L'échappement dépend du contexte d'affichage (HTML, JSON, SQL, etc.)
- Permet la réutilisation dans différents contextes

---

### ✅ RÈGLE #2: React échappe automatiquement

**React.createElement() est SAFE par défaut:**
```javascript
// ✅ React échappe automatiquement
React.createElement('h1', {}, userInput)
// Si userInput = "<script>alert('XSS')</script>"
// Affiche: &lt;script&gt;alert('XSS')&lt;/script&gt;
// Le script n'est JAMAIS exécuté

// ✅ Même avec JSX
<h1>{userInput}</h1>  // Safe automatiquement
```

**⚠️ DANGER - dangerouslySetInnerHTML:**
```javascript
// ❌ DANGEREUX - à éviter!
<div dangerouslySetInnerHTML={{ __html: userInput }} />
// Le contenu est inséré tel quel (XSS possible)

// ✅ Si vraiment nécessaire, utiliser DOMPurify:
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);
<div dangerouslySetInnerHTML={{ __html: clean }} />
```

---

### ✅ RÈGLE #3: Échapper selon le contexte

**Différents contextes = Différents échappements:**

```typescript
// 1. Affichage HTML (React)
React.createElement('p', {}, value) // React échappe auto ✅

// 2. Attribut HTML
<input title={value} /> // React échappe auto ✅

// 3. URL
const url = `/search?q=${encodeURIComponent(value)}`; // ✅

// 4. JSON
JSON.stringify({ text: value }); // Échappe automatiquement ✅

// 5. SQL
db.prepare('SELECT * WHERE name = ?').bind(value); // Prepared statement ✅
```

---

### ✅ RÈGLE #4: Validation vs Échappement

**Ce sont deux choses DIFFÉRENTES:**

```typescript
// ✅ VALIDATION (backend)
if (value.length > 100) {
  return error('Trop long');
}
if (!/^[a-zA-Z0-9 ]+$/.test(value)) {
  return error('Caractères invalides');
}

// ✅ ÉCHAPPEMENT (frontend - automatique avec React)
React.createElement('h1', {}, value); // React échappe

// ❌ NE PAS mélanger
const escaped = value.replace(/</g, '&lt;'); // ❌ Faux
await db.insert(escaped); // ❌ Pollution de la DB
```

---

## 🔍 CHECKLIST DE CODE REVIEW

### Avant de commiter du code avec input utilisateur:

- [ ] **Les valeurs sont-elles stockées BRUTES en DB?**
  - ✅ Oui → Bon
  - ❌ Non (entités HTML stockées) → À corriger

- [ ] **L'échappement est-il fait à l'affichage?**
  - ✅ React.createElement() utilisé → Safe
  - ❌ dangerouslySetInnerHTML utilisé → Vérifier sanitization

- [ ] **Les attributs HTML sont-ils sûrs?**
  - ✅ Passés comme props React → Safe
  - ❌ Concaténation manuelle → Dangereux

- [ ] **Les requêtes SQL sont-elles sûres?**
  - ✅ Prepared statements avec .bind() → Safe
  - ❌ Concaténation de strings SQL → SQL Injection!

- [ ] **Les URLs sont-elles encodées?**
  - ✅ encodeURIComponent() utilisé → Safe
  - ❌ Concaténation directe → Potentiel injection

---

## 🧪 TESTS AUTOMATISÉS

### Test Case Template

```typescript
describe('User Input Sanitization', () => {
  test('Stores raw values in DB', async () => {
    const input = 'Test & Co';
    await api.put('/title', { value: input });
    
    const stored = await db.get('company_title');
    expect(stored).toBe('Test & Co'); // Pas "Test &amp; Co"
  });
  
  test('Displays correctly (no double escaping)', async () => {
    const input = 'Test & Co';
    await api.put('/title', { value: input });
    
    const rendered = render(<Title />);
    expect(rendered.text()).toBe('Test & Co'); // Correct
  });
  
  test('Blocks XSS attempts', async () => {
    const malicious = '<script>alert("XSS")</script>';
    await api.put('/title', { value: malicious });
    
    const rendered = render(<Title />);
    expect(rendered.html()).not.toContain('<script>'); // Échappé
    expect(rendered.text()).toBe('<script>alert("XSS")</script>'); // Visible comme texte
  });
});
```

---

## 📚 RESSOURCES DE RÉFÉRENCE

### Documentation officielle:

1. **React Security:**
   - https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html
   - "React DOM escapes any values embedded in JSX before rendering them"

2. **OWASP XSS Prevention:**
   - https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html

3. **HTML Escaping:**
   - https://developer.mozilla.org/en-US/docs/Glossary/Entity

### Quand échapper manuellement:

**Seulement si vous utilisez:**
- `innerHTML` directement (déconseillé)
- `dangerouslySetInnerHTML` (avec DOMPurify)
- Génération de HTML côté serveur (template engines)
- Email HTML (utiliser library)

**Avec React.createElement() / JSX:**
- **Jamais besoin d'échapper manuellement!**
- React le fait automatiquement

---

## 🚨 ANTI-PATTERNS À ÉVITER

### ❌ Anti-Pattern #1: Double Échappement
```typescript
// Backend
const escaped = value.replace(/</g, '&lt;'); // ❌
await db.insert(escaped);

// Frontend (React)
React.createElement('p', {}, escaped); // React échappe encore!
// Résultat: "&amp;lt;" affiché → Bug visible
```

### ❌ Anti-Pattern #2: Échappement partiel
```typescript
// ❌ Oubli de " et '
const escaped = value
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');
  // Manque " et ' → Vulnérable
```

### ❌ Anti-Pattern #3: Échappement dans la mauvaise couche
```typescript
// ❌ Dans le formulaire
const handleSubmit = () => {
  const escaped = input.replace(/</g, '&lt;');
  api.post('/data', { value: escaped }); // ❌ Trop tôt!
};
```

### ✅ Pattern Correct: Store Raw, Escape on Display
```typescript
// ✅ Formulaire - pas d'échappement
const handleSubmit = () => {
  api.post('/data', { value: input }); // Valeur brute
};

// ✅ Backend - stockage brut
await db.insert(input); // Pas d'échappement

// ✅ Frontend - React échappe auto
React.createElement('p', {}, value); // Safe automatiquement
```

---

## 🔧 OUTILS DE DÉTECTION

### ESLint Rules (à ajouter)

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // Interdire dangerouslySetInnerHTML
    'react/no-danger': 'error',
    
    // Avertir sur les regex d'échappement HTML
    'no-unsafe-regex': 'warn',
  },
  
  // Custom rule: détecter .replace(/</g, '&lt;')
  overrides: [{
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-html-escape-in-backend': 'error'
    }
  }]
};
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "🔍 Vérification sécurité..."

# Détecter échappement HTML dans backend
if git diff --cached --name-only | grep -E "routes|api" | xargs grep -l "replace.*&lt;"; then
  echo "❌ ERREUR: Échappement HTML détecté dans le backend!"
  echo "   Règle: Stocker les valeurs BRUTES en DB"
  echo "   React échappe automatiquement à l'affichage"
  exit 1
fi

echo "✅ Vérification passée"
```

---

## 📝 TEMPLATE DE DOCUMENTATION

**À ajouter dans chaque route qui gère des inputs utilisateur:**

```typescript
/**
 * PUT /api/settings/title
 * 
 * SÉCURITÉ:
 * - ✅ Validation: max 100 caractères, non vide
 * - ✅ Stockage: Valeur BRUTE en DB (pas d'échappement)
 * - ✅ Affichage: React.createElement() échappe automatiquement
 * - ✅ Protection XSS: Aucun dangerouslySetInnerHTML utilisé
 * - ✅ SQL Injection: Prepared statement avec .bind()
 * 
 * @param value - Titre brut de l'utilisateur
 * @returns {setting_value} - Valeur brute stockée
 */
settings.put('/title', authMiddleware, async (c) => {
  // ...
});
```

---

## ✅ RÉSUMÉ EN 3 POINTS

1. **Stockage:** Toujours BRUT en DB (trim/validate seulement)
2. **Affichage:** React échappe automatiquement (ne pas ré-échapper)
3. **Dangereux:** Éviter dangerouslySetInnerHTML (ou utiliser DOMPurify)

**Règle simple:** Si vous utilisez React, faites confiance à React pour l'échappement!

---

**Version:** 1.0  
**Dernière mise à jour:** 2025-11-12  
**Auteur:** AI Assistant (après correction bug échappement HTML)
