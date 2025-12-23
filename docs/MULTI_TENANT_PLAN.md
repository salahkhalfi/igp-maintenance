# 🏢 PLAN MULTI-TENANT SaaS

> **STATUS:** EN ATTENTE | **PRÉREQUIS:** 2 semaines prod stable, 0 bug critique

---

## 📋 PRÉREQUIS (Tous doivent être ✅)

| # | Critère | Status |
|---|---------|--------|
| 1 | App stable 2+ semaines en prod | ⏳ |
| 2 | 0 bugs critiques ouverts | ⏳ |
| 3 | Backup complet DB prod | ⏳ |
| 4 | Premier client confirmé (ou décision go) | ⏳ |

---

## 🗓️ PHASE 1: PRÉPARATION (1h)

### 1.1 Créer table `tenants`
```sql
CREATE TABLE tenants (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT UNIQUE,
  industry TEXT,
  logo_url TEXT,
  ai_expert_name TEXT DEFAULT 'Expert',
  ai_expert_avatar TEXT,
  ai_custom_context TEXT,
  settings JSON DEFAULT '{}',
  plan TEXT DEFAULT 'starter',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_domain ON tenants(domain);
```

### 1.2 Migrer IGP comme premier tenant
```sql
INSERT INTO tenants (id, name, slug, domain, industry, ai_expert_name, ai_custom_context)
VALUES ('igp-glass', 'IGP Glass', 'igp', 'app.igpglass.ca', 'vitrerie', 'Marc', 
'Expert en vitrerie industrielle...');
```

---

## 🗓️ PHASE 2: MIGRATION DB (2h)

### 2.1 Tables à modifier (ajouter `tenant_id`)

| Table | Priorité | Notes |
|-------|----------|-------|
| `users` | 🔴 CRITICAL | Auth dépend de ça |
| `tickets` | 🔴 CRITICAL | Core business |
| `machines` | 🔴 CRITICAL | Core business |
| `ticket_comments` | 🟠 HIGH | Lié aux tickets |
| `ticket_timeline` | 🟠 HIGH | Lié aux tickets |
| `media` | 🟠 HIGH | Lié aux tickets |
| `chat_messages` | 🟠 HIGH | Messenger |
| `planning_events` | 🟠 HIGH | Planning |
| `push_subscriptions` | 🟡 MEDIUM | Notifications |
| `push_logs` | 🟡 MEDIUM | Logs |
| `audit_logs` | 🟡 MEDIUM | Logs |
| `system_settings` | 🟡 MEDIUM | Sera remplacé par tenants.settings |

### 2.2 Script de migration type
```sql
-- Pour chaque table:
ALTER TABLE users ADD COLUMN tenant_id TEXT REFERENCES tenants(id);
UPDATE users SET tenant_id = 'igp-glass' WHERE tenant_id IS NULL;
CREATE INDEX idx_users_tenant ON users(tenant_id);
```

---

## 🗓️ PHASE 3: MIDDLEWARE TENANT (1h)

### 3.1 Créer `src/middleware/tenant.ts`
```typescript
import { Context, Next } from 'hono';

export async function tenantMiddleware(c: Context, next: Next) {
  const host = c.req.header('host') || '';
  
  // Extraire tenant du domaine
  // app.igpglass.ca → igp-glass
  // client2.maintenance-app.com → client2
  
  const tenant = await c.env.DB.prepare(
    'SELECT * FROM tenants WHERE domain = ? AND is_active = 1 AND deleted_at IS NULL'
  ).bind(host).first();
  
  if (!tenant) {
    return c.json({ error: 'Tenant not found' }, 404);
  }
  
  c.set('tenant', tenant);
  c.set('tenantId', tenant.id);
  
  await next();
}
```

### 3.2 Appliquer à toutes les routes
```typescript
// src/index.tsx
import { tenantMiddleware } from './middleware/tenant';

app.use('/api/*', tenantMiddleware);
```

---

## 🗓️ PHASE 4: ISOLATION QUERIES (3h)

### 4.1 Pattern obligatoire pour TOUTES les queries
```typescript
// ❌ AVANT (single tenant)
const tickets = await db.select().from(ticketsTable)
  .where(eq(ticketsTable.deleted_at, null));

// ✅ APRÈS (multi-tenant)
const tenantId = c.get('tenantId');
const tickets = await db.select().from(ticketsTable)
  .where(and(
    eq(ticketsTable.tenant_id, tenantId),
    isNull(ticketsTable.deleted_at)
  ));
```

### 4.2 Fichiers à modifier

| Fichier | Queries | Complexité |
|---------|---------|------------|
| `tickets.ts` | ~15 | Moyenne |
| `users.ts` | ~10 | Moyenne |
| `machines.ts` | ~8 | Facile |
| `chat.ts` | ~20 | Complexe |
| `messages.ts` | ~12 | Moyenne |
| `planning.ts` | ~8 | Facile |
| `ai.ts` | ~10 | ⚠️ SANCTUARISÉ |
| `push.ts` | ~8 | ⚠️ SANCTUARISÉ |
| `auth.ts` | ~5 | Critique |
| `cron.ts` | ~3 | Facile |
| `stats.ts` | ~6 | Facile |
| `search.ts` | ~4 | Facile |

---

## 🗓️ PHASE 5: AUTH MULTI-TENANT (1h)

### 5.1 Modifier JWT payload
```typescript
// Avant
{ userId: '123', role: 'technician' }

// Après
{ userId: '123', role: 'technician', tenantId: 'igp-glass' }
```

### 5.2 Modifier login
```typescript
// Vérifier que user appartient au tenant du domaine
const user = await db.select().from(usersTable)
  .where(and(
    eq(usersTable.email, email),
    eq(usersTable.tenant_id, tenantId),
    isNull(usersTable.deleted_at)
  )).get();
```

---

## 🗓️ PHASE 6: ADMIN PANEL TENANTS (2h)

### 6.1 Routes admin (`/api/admin/tenants`)
```
GET    /api/admin/tenants          - Liste tous les tenants
POST   /api/admin/tenants          - Créer tenant
GET    /api/admin/tenants/:id      - Détails tenant
PATCH  /api/admin/tenants/:id      - Modifier tenant
DELETE /api/admin/tenants/:id      - Supprimer tenant (soft)
POST   /api/admin/tenants/:id/users - Créer premier admin du tenant
```

### 6.2 UI Admin (super-admin only)
- Liste tenants avec stats (users, tickets, storage)
- Formulaire création tenant
- Gestion domaines custom
- Toggle actif/inactif

---

## 🗓️ PHASE 7: TESTS ISOLATION (2h)

### 7.1 Tests critiques
```typescript
// Test: User tenant A ne voit PAS tickets tenant B
// Test: Recherche ne retourne PAS résultats autre tenant
// Test: Push notification ne va PAS à autre tenant
// Test: Expert IA ne voit PAS contexte autre tenant
// Test: Login échoue si mauvais tenant
```

### 7.2 Checklist manuelle
| Test | Tenant A | Tenant B | Résultat |
|------|----------|----------|----------|
| Créer ticket | ✅ Visible | ❌ Invisible | ✅ |
| Voir users | Ses users | Ses users | ✅ |
| Expert IA | Son contexte | Son contexte | ✅ |
| Push notif | Ses users | Ses users | ✅ |

---

## 📊 RÉSUMÉ TEMPS

| Phase | Durée |
|-------|-------|
| 1. Préparation | 1h |
| 2. Migration DB | 2h |
| 3. Middleware | 1h |
| 4. Isolation queries | 3h |
| 5. Auth | 1h |
| 6. Admin panel | 2h |
| 7. Tests | 2h |
| **TOTAL** | **12h** |

---

## ⚠️ RISQUES & MITIGATIONS

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Fuite données inter-tenant | 🔴 CRITIQUE | Tests exhaustifs Phase 7 |
| Régression features | 🟠 HIGH | Tester chaque feature après |
| Perf dégradée (index) | 🟡 MEDIUM | Index sur tenant_id partout |
| Migration rate DB prod | 🟡 MEDIUM | Backup avant, migration off-peak |

---

## 🚀 COMMANDE DE LANCEMENT

Quand tous les prérequis sont ✅, dis simplement:
```
"Lance le plan multi-tenant"
```

Je suivrai ce document phase par phase.

---

## 📝 CHANGELOG

| Date | Action |
|------|--------|
| 2024-12-23 | Plan créé, en attente stabilisation |
