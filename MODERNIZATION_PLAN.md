# 🚀 PLAN DE MODERNISATION v1.1

## 📋 OBJECTIFS
- Application stable, moderne, maintenable
- Zéro valeur hardcodée (y compris prompts IA)
- Multi-tenant : personnalisable par secteur industriel
- Architecture cohérente (fin du legacy React CDN)

---

## 🛡️ FONCTIONS CRITIQUES - NE JAMAIS CASSER

### Liste des fonctions INTOUCHABLES pendant migration :

| Fonction | Fichiers | Criticité |
|----------|----------|-----------|
| **Création vocale tickets** | `VoiceTicketFab.js`, `ai.ts` (whisper) | 🔴 CRITIQUE |
| **Bouton "Demander conseil"** | `AIChatModal_v4.js`, `ai.ts` | 🔴 CRITIQUE |
| **Push notifications** | `AppHeader.js`, `push.ts`, `App.js` | 🔴 CRITIQUE |
| **Sons/Audio** | `MainApp.js` (audioContext), `sound.ts` | 🟠 IMPORTANT |
| **Kanban drag & drop** | `KanbanBoard.js` | 🟠 IMPORTANT |
| **Login/Auth** | `LoginForm.js`, `auth.ts` | 🔴 CRITIQUE |
| **Création ticket standard** | `CreateTicketModal.js` | 🔴 CRITIQUE |
| **Détails ticket** | `TicketDetailsModal_v3.js` | 🟠 IMPORTANT |

### Règle absolue :
```
⚠️ AVANT de migrer un composant :
   1. Lister TOUTES ses dépendances (grep)
   2. Tester la fonction en production
   3. Migrer avec tests de non-régression
   4. Valider en staging AVANT merge
   5. Garder legacy fonctionnel jusqu'à validation complète
```

### Composants legacy (35 fichiers) :
```
public/static/js/components/
├── CRITIQUES (migrer en dernier)
│   ├── VoiceTicketFab.js      # Création vocale
│   ├── AIChatModal_v4.js      # IA conseil
│   ├── AppHeader.js           # Push + navigation
│   ├── App.js                 # State global + push init
│   ├── LoginForm.js           # Auth
│   └── CreateTicketModal.js   # Création ticket
├── IMPORTANTS
│   ├── KanbanBoard.js         # Vue principale
│   ├── MainApp.js             # Layout + sons
│   ├── TicketDetailsModal_v3.js
│   └── TicketComments.js      # Audio comments
└── SECONDAIRES (migrer en premier)
    ├── ConfirmModal.js
    ├── Toast.js
    ├── PromptModal.js
    └── ... (25 autres)
```

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

### 2.3 Migration progressive (ORDRE SÉCURISÉ)

```
PHASE A - Composants simples (risque faible)
   Étape 1: /dashboard-v2 accessible en parallèle (legacy intact)
   Étape 2: Migrer Toast, ConfirmModal, PromptModal
   Étape 3: Migrer UserList, RoleDropdown
   Étape 4: Migrer ManageColumnsModal, SystemSettingsModal
   ✓ Validation : fonctions critiques toujours sur legacy

PHASE B - Composants visuels (risque moyen)
   Étape 5: Migrer KanbanBoard (avec tests drag & drop)
   Étape 6: Migrer TicketDetailsModal, TicketHistory
   Étape 7: Migrer TicketComments (ATTENTION: audio recording)
   ✓ Validation : création vocale + push toujours fonctionnels

PHASE C - Composants critiques (risque élevé)
   Étape 8: Migrer CreateTicketModal (tester formulaire complet)
   Étape 9: Migrer MainApp + sons (tester audioContext)
   Étape 10: Migrer AppHeader + Push (tester notifications)
   Étape 11: Migrer VoiceTicketFab (tester Whisper E2E)
   Étape 12: Migrer AIChatModal (tester conversation IA)
   ✓ Validation COMPLÈTE par utilisateurs réels

PHASE D - Swap final
   Étape 13: Feature flag pour basculer legacy ↔ moderne
   Étape 14: Tests utilisateurs 1 semaine
   Étape 15: Swap routes (/ → moderne, /legacy → ancien)
   Étape 16: Supprimer legacy après 2 semaines stable
```

### 2.4 Tests de non-régression obligatoires

| Fonction | Test manuel | Test auto |
|----------|-------------|-----------|
| Création vocale | Enregistrer → ticket créé | API whisper mock |
| Push notification | Activer → recevoir test | Service worker check |
| Sons alerte | Ticket urgent → son joué | AudioContext mock |
| IA conseil | Question → réponse cohérente | API streaming test |
| Drag & drop | Déplacer ticket → status changé | E2E Playwright |

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
6. **NE PAS casser à droite pour fixer à gauche** - tester TOUT après chaque changement
7. **Fonctions critiques testées AVANT et APRÈS chaque migration**
8. **Legacy reste fonctionnel jusqu'à validation complète du moderne**

---

## 🔄 SYSTÈME DE CHECKPOINTS (ROLLBACK GARANTI)

### Principe : Chaque étape = 1 checkpoint réversible

```
CHECKPOINT = git tag + backup + deploy fonctionnel testé
```

### Commandes checkpoint :

```bash
# CRÉER checkpoint avant modification
git tag -a checkpoint-XX-description -m "État stable avant [modification]"
git push origin checkpoint-XX-description

# BACKUP complet (optionnel pour étapes majeures)
# Utiliser ProjectBackup tool → génère tar.gz téléchargeable

# ROLLBACK si problème
git checkout checkpoint-XX-description
npm run build
npx wrangler pages deploy dist --project-name webapp

# OU rollback Cloudflare (plus rapide)
npx wrangler pages deployment list --project-name webapp
npx wrangler pages deployment rollback <deployment-id> --project-name webapp
```

### Registre des checkpoints :

| ID | Tag | Description | Date | Status |
|----|-----|-------------|------|--------|
| 00 | `checkpoint-00-stable-legacy` | Avant toute modernisation | - | À créer |
| 01 | `checkpoint-01-phase1-config` | Après ConfigService | - | - |
| 02 | `checkpoint-02-phase2a-simple` | Après composants simples | - | - |
| 03 | `checkpoint-03-phase2b-visual` | Après composants visuels | - | - |
| 04 | `checkpoint-04-phase2c-critical` | Après composants critiques | - | - |
| 05 | `checkpoint-05-multitenancy` | Après multi-tenant | - | - |

### Règle checkpoint :

```
⚠️ AVANT chaque étape de migration :
   1. Vérifier que l'app fonctionne (toutes fonctions critiques)
   2. Créer checkpoint : git tag checkpoint-XX-description
   3. Push le tag : git push origin checkpoint-XX-description
   4. Noter dans le registre ci-dessus
   
⚠️ SI problème après modification :
   1. STOP - ne pas essayer de "fixer"
   2. Rollback immédiat au dernier checkpoint
   3. Analyser ce qui a cassé
   4. Réessayer avec approche différente
```

---

## 🔄 PROCÉDURE DE MIGRATION SÉCURISÉE

```
Pour CHAQUE composant migré :

1. AVANT migration
   [ ] Créer checkpoint (git tag)
   [ ] Tester composant legacy en prod (screenshot/vidéo)
   [ ] Lister toutes dépendances (grep imports)
   [ ] Identifier APIs backend utilisées
   [ ] Documenter comportement attendu

2. PENDANT migration
   [ ] Créer composant moderne SANS toucher legacy
   [ ] Implémenter 100% des fonctionnalités
   [ ] Tests unitaires
   [ ] Review code

3. APRÈS migration
   [ ] Tester en /dashboard-v2 (staging)
   [ ] Comparer avec legacy (même comportement?)
   [ ] Tester fonctions critiques (voix, push, IA)
   [ ] Validation utilisateur
   [ ] SI OK → nouveau checkpoint
   [ ] SI KO → rollback checkpoint précédent

4. ROLLBACK IMMÉDIAT SI :
   - Création vocale ne fonctionne plus
   - Push notifications cassées
   - IA ne répond plus
   - Sons ne jouent plus
   - Login impossible
   - Erreur console bloquante
```

---

## 🚨 PROCÉDURE D'URGENCE (ROLLBACK RAPIDE)

```bash
# Option 1: Rollback Git (complet)
git fetch --tags
git checkout checkpoint-XX-description
npm run build
npx wrangler pages deploy dist --project-name webapp

# Option 2: Rollback Cloudflare (plus rapide, code inchangé)
npx wrangler pages deployment list --project-name webapp
# Copier l'ID du déploiement stable
npx wrangler pages deployment rollback <deployment-id> --project-name webapp

# Option 3: Restaurer backup tar.gz
# Télécharger depuis URL backup
tar -xzf backup.tar.gz -C /home/user/
cd /home/user/webapp
npm install
npm run build
npx wrangler pages deploy dist --project-name webapp
```

### Temps de rollback estimé :
| Méthode | Temps | Quand utiliser |
|---------|-------|----------------|
| Cloudflare rollback | 30 sec | Bug mineur, code OK |
| Git checkout + deploy | 3 min | Bug code, besoin ancienne version |
| Restore backup | 10 min | Catastrophe, corruption |
