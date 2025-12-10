# 🧪 Guide Tests - IGP Maintenance App

## 🎯 Vue d'ensemble

**Framework**: Vitest v2.1.8  
**Couverture**: 146 tests unitaires (100% passing)  
**Modules testés**: `validation`, `permissions`, `formatters`, `password`, `jwt`, `ticket-id`, et plus

---

## 📂 Structure Tests

```
tests/
├─ unit/
│  ├─ utils/
│  │  ├─ validation.test.ts     (24 tests)
│  │  ├─ permissions.test.ts    (20 tests)
│  │  └─ formatters.test.ts     (23 tests)
│  └─ middlewares/
├─ integration/
│  └─ routes/
├─ fixtures/
│  └─ mock-db.ts                (Mock D1Database)
└─ README.md
```

---

## 🚀 Commandes NPM

```bash
# Lancer tous les tests
npm test

# Mode watch (développement)
npm run test:watch

# Interface UI
npm run test:ui

# Génération coverage
npm run test:coverage
```

---

## ✅ Tests Unitaires Implémentés

### 1. **validation.ts** (24 tests)
Tests validation formulaires:
- `validateName` - noms utilisateurs/machines
- `validateEmail` - adresses email
- `validatePassword` - mots de passe
- `validateDescription` - descriptions tickets

**Exemple:**
```typescript
it('rejette email sans @', () => {
  const result = validateEmail('testexample.com');
  expect(result.valid).toBe(false);
  expect(result.error).toContain('invalide');
});
```

### 2. **permissions.ts** (20 tests)
Tests RBAC (Role-Based Access Control):
- `hasPermission` - vérification permissions individuelles
- `hasAnyPermission` - au moins 1 permission
- `hasAllPermissions` - toutes permissions requises
- `getRolePermissions` - liste permissions rôle
- Cache permissions (TTL 5 min)

**Exemple:**
```typescript
it('admin a permission tickets.create.all', async () => {
  const result = await hasPermission(mockDB, 'admin', 'tickets', 'create', 'all');
  expect(result).toBe(true);
});
```

### 3. **formatters.ts** (23 tests)
Tests formatage affichage:
- `formatAssigneeName` - noms assignés tickets
- `formatPriorityText` - textes priorités
- `formatPriorityBadge` - badges priorités
- `formatStatus` - statuts tickets

**Exemple:**
```typescript
it('formate équipe complète', () => {
  const ticket = { assigned_to: 'all' };
  expect(formatAssigneeName(ticket)).toBe('👥 Équipe complète');
});
```

---

## 🛠️ Écrire Nouveaux Tests

### Template Test Unitaire

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../../../src/utils/my-module';

describe('my-module.ts - myFunction', () => {
  it('cas nominal', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });

  it('cas erreur', () => {
    const result = myFunction('');
    expect(result).toBeUndefined();
  });
});
```

### Mock D1 Database

```typescript
import { createMockDBWithPermissions } from '../../fixtures/mock-db';

const mockDB = createMockDBWithPermissions();

// Ajouter données test
mockDB.addTestData('users', [
  { id: 1, email: 'test@example.com', role: 'admin' }
]);
```

---

## 📊 Coverage Actuel

| Module | Tests | Status |
|--------|-------|--------|
| **utils/validation** | 24 | ✅ 100% |
| **utils/permissions** | 20 | ✅ 100% |
| **utils/formatters** | 23 | ✅ 100% |
| **utils/formatters-extended** | 32 | ✅ 100% |
| **utils/password** | 15 | ✅ 100% |
| **utils/jwt** | 10 | ✅ 100% |
| **utils/ticket-id** | 22 | ✅ 100% |
| **Total** | **146** | **✅ 100%** |

---

## 🔜 Tests à Implémenter

### Phase 2: Tests Intégration Routes API
- [ ] `POST /api/auth/register`
- [ ] `POST /api/auth/login`
- [ ] `GET /api/tickets`
- [ ] `POST /api/tickets`
- [ ] `PATCH /api/tickets/:id`

### Phase 3: Tests E2E
- [ ] User flows complets
- [ ] Tests navigateurs (Playwright)

---

## ⚙️ Configuration

**vitest.config.simple.ts** - Tests unitaires simples:
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

**vitest.config.ts** - Tests avec Cloudflare Workers:
```typescript
export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
      },
    },
  },
});
```

---

## 🐛 Debugging Tests

```bash
# Tests spécifiques
npx vitest run tests/unit/utils/validation.test.ts

# Mode verbose
npx vitest run --reporter=verbose

# Voir output console
npx vitest run --reporter=verbose --no-coverage
```

---

## 📖 Ressources

- **Vitest Docs**: https://vitest.dev/
- **Cloudflare Workers Testing**: https://developers.cloudflare.com/workers/testing/vitest-integration/
- **Assertion API**: https://vitest.dev/api/expect.html

---

**Dernière mise à jour**: 2025-11-17  
**Contributeur**: Salah Khalfi
