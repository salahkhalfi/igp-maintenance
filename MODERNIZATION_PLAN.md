# 🚀 PLAN DE MODERNISATION v1.0

## 📋 OBJECTIFS
- Application stable, moderne, maintenable
- Zéro valeur hardcodée (y compris prompts IA)
- Multi-tenant : personnalisable par secteur industriel
- Architecture cohérente (fin du legacy React CDN)

---

## 🏗️ PHASE 1: FONDATIONS (Semaine 1-2)

### 1.1 Centraliser TOUTES les configurations en DB

**Table `system_settings` - Ajouter :**
```sql
-- Branding
app_name                    -- "MaintenanceOS" (défaut générique)
app_tagline                 -- "Gestion intelligente"
primary_color               -- "#10b981" (emerald)
secondary_color             -- "#1f2937"

-- URLs (déjà existant: app_base_url)
support_email               -- "support@example.com"
documentation_url           -- "/guide"

-- AI Prompts (déjà partiellement: ai_identity_block, ai_rules_block, etc.)
ai_whisper_context          -- Contexte pour transcription vocale
ai_analysis_prompt          -- Prompt analyse de tickets
ai_vision_prompt            -- Prompt analyse d'images

-- Secteur/Industrie
industry_type               -- "manufacturing" | "food" | "auto" | "general"
industry_vocabulary         -- JSON des termes spécifiques
```

**Action :** Migration SQL + API CRUD admin

### 1.2 Créer service `ConfigService`

```typescript
// src/services/config.ts
export class ConfigService {
  private cache: Map<string, string> = new Map();
  
  async get(key: string, defaultValue?: string): Promise<string> {
    // Check cache first, then DB
  }
  
  async getAll(prefix?: string): Promise<Record<string, string>> {
    // Get all settings, optionally filtered by prefix (ai_, app_, etc.)
  }
}
```

**Utilisation :**
```typescript
const appName = await config.get('app_name', 'MaintenanceOS');
const aiPrompt = await config.get('ai_identity_block');
```

### 1.3 Éliminer TOUS les hardcodes restants

**Fichiers à auditer :**
| Fichier | Hardcodes trouvés | Action |
|---------|-------------------|--------|
| `src/views/guide.ts` | `app.igpglass.ca` | → `${baseUrl}` |
| `src/routes/chat.ts:816` | fallback `igpglass.ca` | → `config.get('app_base_url')` |
| `src/routes/ai.ts` | prompts inline | → `config.get('ai_*')` |
| `src/views/tv.ts` | latitude/longitude météo | → `config.get('location_*')` |

---

## 🎨 PHASE 2: DASHBOARD MODERNE (Semaine 3-5)

### 2.1 Architecture `/dashboard-v2`

```
src/
├── dashboard-v2/           # NOUVEAU - Isolé
│   ├── main.tsx           # Entry point React moderne
│   ├── App.tsx            # Root component
│   ├── components/
│   │   ├── Layout/
│   │   ├── Tickets/
│   │   ├── Machines/
│   │   ├── Users/
│   │   └── Modals/
│   ├── hooks/
│   │   ├── useTickets.ts
│   │   ├── useMachines.ts
│   │   └── useConfig.ts   # Fetch system_settings
│   ├── stores/            # Zustand ou Jotai
│   └── types/
├── messenger/             # Déjà moderne ✅
└── routes/                # Backend Hono ✅
```

### 2.2 Stack technique

| Couche | Technologie | Raison |
|--------|-------------|--------|
| UI | React 18 + TypeScript | Type safety |
| State | Zustand | Léger, simple |
| Fetch | TanStack Query | Cache, retry, optimistic |
| Style | Tailwind CSS | Déjà utilisé |
| Build | Vite (séparé) | Isolation du legacy |
| Icons | Lucide React | Consistant, tree-shakable |

### 2.3 Migration progressive

```
Étape 1: /dashboard-v2 accessible en parallèle
Étape 2: Migrer Kanban (composant principal)
Étape 3: Migrer Modals (Create, Details, User, Machine)
Étape 4: Migrer Header + Navigation
Étape 5: Tests utilisateurs
Étape 6: Swap routes (/ → legacy, /v1 → legacy, / → moderne)
Étape 7: Supprimer legacy après 2 semaines stable
```

---

## 🤖 PHASE 3: IA CONFIGURABLE (Semaine 4-5)

### 3.1 Structure prompts en DB

**Déjà existant :**
- `ai_identity_block` - Identité de l'assistant
- `ai_rules_block` - Règles comportement
- `ai_knowledge_block` - Base de connaissances
- `ai_hierarchy_block` - Hiérarchie entreprise
- `ai_character_block` - Personnalité
- `ai_custom_context` - Contexte libre

**À ajouter :**
```sql
ai_whisper_context          -- "Contexte: maintenance industrielle. Termes: {vocabulary}"
ai_ticket_analysis_prompt   -- Prompt pour analyser nouveau ticket
ai_image_analysis_prompt    -- Prompt pour analyser photos
ai_summary_prompt           -- Prompt pour résumés
ai_translation_prompt       -- Prompt pour traductions
```

### 3.2 Interface Admin IA

```
/admin/ai-config
├── Identité & Personnalité
│   ├── Nom de l'assistant
│   ├── Avatar
│   ├── Ton (formel/casual)
│   └── Langue préférée
├── Prompts système
│   ├── Éditeur avec preview
│   ├── Variables disponibles: {user_name}, {company}, {vocabulary}
│   └── Test en direct
└── Vocabulaire métier
    ├── Termes techniques (JSON)
    └── Import/Export CSV
```

### 3.3 Templates par industrie

```typescript
const industryTemplates = {
  manufacturing: {
    vocabulary: ["CNC", "usinage", "tolérances", "CAO"],
    ai_identity: "Expert en fabrication industrielle...",
  },
  food: {
    vocabulary: ["HACCP", "traçabilité", "DLC", "lot"],
    ai_identity: "Expert en production alimentaire...",
  },
  automotive: {
    vocabulary: ["OBD", "diagnostic", "couple", "vidange"],
    ai_identity: "Expert en mécanique automobile...",
  },
  general: {
    vocabulary: [],
    ai_identity: "Assistant de maintenance polyvalent...",
  }
};
```

---

## 🏢 PHASE 4: MULTI-TENANCY (Semaine 6-8)

### 4.1 Schema DB

```sql
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,  -- acme.pmeapp.com
  industry_type TEXT DEFAULT 'general',
  settings JSON,                    -- Override system_settings
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ajouter tenant_id à TOUTES les tables
ALTER TABLE tickets ADD COLUMN tenant_id TEXT REFERENCES tenants(id);
ALTER TABLE users ADD COLUMN tenant_id TEXT REFERENCES tenants(id);
ALTER TABLE machines ADD COLUMN tenant_id TEXT REFERENCES tenants(id);
-- etc.

CREATE INDEX idx_tickets_tenant ON tickets(tenant_id);
```

### 4.2 Middleware tenant

```typescript
// src/middlewares/tenant.ts
export const tenantMiddleware = async (c: Context, next: Next) => {
  const host = c.req.header('host') || '';
  const subdomain = host.split('.')[0];
  
  if (subdomain === 'app' || subdomain === 'www') {
    // Main app, no tenant filtering
    await next();
    return;
  }
  
  const tenant = await c.env.DB.prepare(
    'SELECT * FROM tenants WHERE subdomain = ?'
  ).bind(subdomain).first();
  
  if (!tenant) return c.json({ error: 'Tenant not found' }, 404);
  
  c.set('tenant', tenant);
  c.set('tenantId', tenant.id);
  await next();
};
```

### 4.3 Queries avec tenant

```typescript
// Avant
const tickets = await db.select().from(ticketsTable);

// Après
const tenantId = c.get('tenantId');
const tickets = await db.select().from(ticketsTable)
  .where(eq(ticketsTable.tenant_id, tenantId));
```

---

## 📊 PHASE 5: QUALITÉ & TESTS (Continu)

### 5.1 Tests automatisés

```
tests/
├── unit/
│   ├── config.test.ts
│   └── permissions.test.ts
├── integration/
│   ├── tickets.test.ts
│   └── auth.test.ts
└── e2e/
    └── flows.test.ts
```

### 5.2 CI/CD

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]

jobs:
  test:
    - npm run test
    - npm run lint
  
  deploy:
    needs: test
    - npm run build
    - wrangler pages deploy
```

---

## 📅 TIMELINE RÉSUMÉ

| Phase | Durée | Livrables |
|-------|-------|-----------|
| 1. Fondations | 2 sem | ConfigService, zéro hardcode |
| 2. Dashboard v2 | 3 sem | React moderne isolé, migration graduelle |
| 3. IA Config | 2 sem | Prompts en DB, admin UI, templates industrie |
| 4. Multi-tenant | 3 sem | Schema, middleware, isolation données |
| 5. Qualité | Continu | Tests, CI/CD |

**Total estimé : 8-10 semaines**

---

## ✅ CRITÈRES DE SUCCÈS

- [ ] Aucun hardcode dans le code (grep retourne 0)
- [ ] Dashboard 100% React moderne (plus de CDN)
- [ ] Prompts IA 100% configurables via admin
- [ ] Nouveau tenant déployable en < 5 minutes
- [ ] Tests couvrent 80%+ du code critique
- [ ] Documentation API complète

---

## ⚠️ RÈGLES INVIOLABLES

1. **JAMAIS mixer React legacy + moderne** (MODULE 5 BIBLE)
2. **Toujours UTC en DB** (MODULE 2 BIBLE)
3. **Migrations réversibles** (down migrations)
4. **Feature flags** pour rollback rapide
5. **Un tenant ne voit JAMAIS les données d'un autre**
