# ⚡ SYSTEM KERNEL : THE RULES OF ENGAGEMENT
> **STATUS:** IMMUTABLE SOURCE OF TRUTH | **PRIORITY:** HIGHEST

---

## 🟢 MODULE 0: META-PROTOCOL
*   **READ BEFORE WRITE**: Always `READ` -> `GREP` before any `EDIT`. No blind coding.
*   **SCOPE ISOLATION**: Do not break the app to fix a typo. Revert > Reset.
*   **ALIGNMENT**: Build a **Generic SaaS** (White Label). IGP is just the first tenant.
*   **ONE FILE**: Update THIS file, never create `bible_v2.md`. Keep < 400 lines (compress if exceeded).
*   **CHESTERTON'S FENCE**: Never delete code you don't fully understand.

---

## 🟥 MODULE 1: THE CORE LOOP
1.  **SIMULATION**: Audit for Security, Performance (O(n²)), Mobile (<44px), Edge Cases (Null/Offline).
2.  **GLOBAL IMPACT**: "Does this fix disrupt active states (Audio, Scroll, Input)?"
3.  **VERIFICATION**: Use `grep` to ensure no conflicts globally.
4.  **LEGACY AWARENESS**: "Dead code" in `src/` might be "Alive" in `public/static/`. Always grep ENTIRE project.

---

## 🟧 MODULE 2: TECHNICAL AXIOMS

### [PLATFORM - CLOUDFLARE EDGE]
*   **EDGE PURITY**: V8 Runtime. NO Node.js APIs (`fs`, `crypto`, `child_process`). Web Standards only.
*   **STATELESS**: DB (D1/R2) is the ONLY State. Workers are ephemeral.
*   **NO NATIVE CRON**: Use external webhooks (cron-job.org) → `/api/cron/*` routes with `CRON_SECRET`.

### [DATA & TIME]
*   **UTC STORAGE**: Storage = UTC. Display = User Local (`timezone_offset`).
*   **TRUST NO INPUT**: Validate EVERYTHING. Verify JWTs against DB.
*   **SOFT DELETE**: Use `deleted_at` timestamp. NEVER `DELETE FROM`. Every SELECT MUST filter `deleted_at IS NULL`.
*   **SQL SAFETY**: Use `COALESCE` for NULLs. Prepared statements only.

### [UX]
*   **MOBILE FIRST**: Touch target **44x44px MINIMUM**.
*   **ESCAPE HATCH**: Modals close on backdrop click.
*   **NO LIES**: Green = verified server-side. Never fake success.

### [CODE HYGIENE]
*   **ZERO HARDCODING**: Fetch business values from DB (`system_settings`) or ENV.
*   **NO DEAD CODE**: Commented code = Deleted code.
*   **EXPLICIT NAMES**: Human-readable variable names.

### [🚨 HARDCODING FORBIDDEN - AUTO-BLOCKED BY PRE-COMMIT]
```
FORBIDDEN PATTERNS (pre-commit hook blocks these):
❌ app.igpglass.ca    → Use window.location.hostname or getDomainFromRequest()
❌ igpglass.com       → Use window.location.origin
❌ IGP Glass          → Use window.APP_COMPANY_NAME or system_settings
❌ admin@igpglass.*   → Use system_settings support_email
❌ sk-*, AKIA*        → NEVER commit API keys

✅ CORRECT APPROACH:
- Backend: import { getDomainFromRequest, getBrandingFromDB } from 'src/config/branding'
- Frontend: window.location.hostname, window.APP_COMPANY_NAME
- Both: system_settings table for tenant-specific values

🔧 Script: ./scripts/check-hardcoding.sh
🔧 Config: src/config/branding.ts
```

### [TOKEN OPTIMIZATION]
*   **NO RE-READ**: Never re-read a file already read in same session.
*   **NO UNSOLICITED EXPLANATIONS**: Don't explain unless asked "pourquoi?" or "explique".
*   **NO RECAP**: After action, just "Fait." or show error. No summary.
*   **MINIMAL READS**: Use `head -20` or `grep` instead of full `Read` when possible.
*   **ONE COMMAND**: One bash command at a time when debugging.

---

## 🟨 MODULE 3: DEPLOYMENT

### [⚠️ SANDBOX PROTECTION - CRITICAL]
```
🚨 SANDBOX RAM LIMITED - NO FULL BUILDS ALLOWED
   ❌ npm run build (crashes sandbox)
   ❌ npm run build:worker/client/messenger (crashes sandbox)
   ✅ npx tsc --noEmit (lightweight type check only)
   ✅ git push origin main (GitHub Actions builds for us)
```

### [GITHUB ACTIONS - MANDATORY]
1.  **TO DEPLOY**: `git push origin main` → auto build & deploy (~2 min)
2.  **WORKFLOW**: `.github/workflows/deploy.yml`
3.  **MONITOR**: https://github.com/salahkhalfi/igp-maintenance/actions
4.  **VERIFY**: Test `https://app.igpglass.ca` after deploy.

### [DATABASE: maintenance-db]
*   **Local**: `npx wrangler d1 migrations apply maintenance-db --local`
*   **Prod**: `npx wrangler d1 migrations apply maintenance-db`
*   **Reset**: `rm -rf .wrangler/state/v3/d1 && npm run db:migrate:local`

---

## 🟩 MODULE 9: BUSINESS MODEL & SCALING

### [📦 MODÈLE CHOISI: INSTALLATION DÉDIÉE]
```
✅ DÉCISION: 1 Client = 1 Instance Isolée (PAS de multi-tenant DB)

POURQUOI:
├── App DÉJÀ prête (0 travail supplémentaire)
├── Isolation totale (0 risque fuite données)
├── Personnalisation illimitée par client
├── Pas de dette technique tenant_id
└── Marge maximale (95%+)

PRICING SUGGÉRÉ:
├── Setup: $1,500 (one-time)
├── Mensuel: $99/mois
└── Coût réel: ~$5/mois Cloudflare
```

### [🔧 ARCHITECTURE MULTI-CLIENT]
```
CHAQUE CLIENT A:
├── 1 Fork GitHub (github.com/salahkhalfi/[client]-maintenance)
├── 1 Projet Cloudflare Pages ([client]-app)
├── 1 Base D1 dédiée ([client]-db)
├── 1 Bucket R2 dédié ([client]-media)
├── 1 Hub Genspark dédié pour support
└── 1 BIBLE.md personnalisée

GESTION AGENT:
├── 1 Session = 1 Client (via Hubs séparés)
├── Jamais 2 clients dans même session
└── Switch client = Switch Hub/Onglet
```

### [🚀 ONBOARDING NOUVEAU CLIENT]
```bash
# 1. Créer nouveau Hub Genspark "[Client] Maintenance"
# 2. Dans ce Hub:
git clone https://github.com/salahkhalfi/igp-maintenance [client]-maintenance
cd [client]-maintenance
git remote set-url origin https://github.com/salahkhalfi/[client]-maintenance
git push -u origin main

# 3. Cloudflare Dashboard:
#    - Créer projet Pages: [client]-app
#    - Créer D1: [client]-db
#    - Créer R2: [client]-media
#    - Configurer secrets (CRON_SECRET, API keys)

# 4. Configurer system_settings (branding, IA, modules)
# 5. Configurer cron-job.org pour ce client
# 6. Déployer & tester
```

### [⚙️ SYSTEM_SETTINGS - WHITE LABEL READY]
```
BRANDING (39 paramètres configurables):
├── company_title, company_subtitle, company_logo_url
├── primary_color, secondary_color
├── app_name, app_base_url, app_tagline
└── support_email, documentation_url

IA PERSONNALISÉE:
├── ai_expert_name, ai_expert_avatar_key
├── ai_identity_block (qui est l'IA)
├── ai_knowledge_block (expertise métier)
├── ai_character_block (personnalité)
├── ai_hierarchy_block (noms des managers)
├── ai_rules_block (règles comportement)
└── ai_custom_context (contexte additionnel)

MODULES ACTIVABLES:
├── planning, analytics, notifications
├── statistics, messaging, machines
└── [futurs modules]: inventory, quality, etc.
```

### [📊 MODULES CUSTOM PAR CLIENT]
```
SCÉNARIO: Client A veut "Gestion Stock", Client B non

SOLUTION:
├── Créer src/routes/inventory.ts (code commun)
├── Créer migration inventory.sql
├── Client A: modules_config.inventory = true (visible)
├── Client B: modules_config.inventory = false (caché)
└── Tables existent mais UI cachée = 0 confusion

IA AWARENESS:
├── L'IA charge modules_config au démarrage
├── Elle sait quels modules sont actifs
└── Ne suggère PAS de fonctionnalités désactivées
```

### [💰 ÉCONOMIE CLOUDFLARE]
| Clients | D1 | R2 | Coût Total |
|---------|----|----|------------|
| 1 | 713 KB | ~0 | $5/mois |
| 5 | ~5×$5 | ~5×$5 | ~$25/mois |
| 10 | ~10×$5 | ~10×$5 | ~$50/mois |

*Chaque client paie son propre Cloudflare OU tu factures +$10/mois*

### [⏳ MIGRATION MULTI-TENANT: PLUS TARD]
```
TRIGGER: 10+ clients ET gestion devient lourde
EFFORT: ~5-6 jours
CHANGEMENTS:
├── Ajouter tenant_id à toutes tables
├── Middleware extraction tenant (domain → tenant)
├── Super-admin panel
└── 1 seule instance pour tous

POUR L'INSTANT: NE PAS IMPLÉMENTER (dette technique inutile)
```

---

## 🟦 MODULE 4: THE COPILOT OATH
0.  **TOKEN PRIORITY**: Ne JAMAIS gaspiller les tokens Genspark. Chaque action doit être justifiée. Réfléchir AVANT d'agir.
1.  **RADICAL TRUTH**: Admit mistakes immediately. No flattery. No ass-kissing.
2.  **CALL BULLSHIT**: If user is wrong, say it directly. No automatic "you're right".
3.  **TOKEN ECONOMY**: Code > Chat. Concise. <50 lines unless requested.
4.  **UNCERTAINTY**: If unsure, say "I need to verify". Never invent.
5.  **NO QUICK HACKS**: Temporary fix = permanent bug.
6.  **AUDIT REGULARLY**: AI codes fast but lacks foresight. Clean up "trash" proactively.

---

## 🟪 MODULE 5: REACT ISOLATION
*   **ONE React per page**: Dashboard = Legacy (CDN), Messenger = Modern (Vite). NEVER mix.
*   **No bridge**: Injecting bundled React into legacy = GUARANTEED FAILURE.
*   **Modernization**: If needed, create SEPARATE `/dashboard-v2` build.

---

## 🟫 MODULE 6: AI STACK
*   **Audio**: Groq Whisper → OpenAI Whisper (fallback)
*   **Logic**: DeepSeek → GPT-4o-mini (fallback)
*   **Vision**: OpenAI GPT-4o-mini only
*   **POLYGLOT**: User Input Language = Bot Output Language

---

## 🟤 MODULE 7: COMMON ERRORS
*   **Infinite loading** → `npm run db:reset`
*   **Node API error** → Use Web APIs only (no `fs`/`path`)
*   **Heap out of memory** → Use sequential builds
*   **Full list**: `docs/COMMON_ERRORS.md`

---

## 🔴 MODULE 8: SANCTUARIZED CODE (DO NOT TOUCH)

### [VITAL FUNCTIONS - FORBIDDEN WITHOUT VALIDATION]
| Function | File | Critical Lines |
|----------|------|----------------|
| Voice Ticket | `ai.ts` | L135-400 (transcribe, analyze, route) |
| Push Notifications | `push.ts` | L197-450 (sendPush, queue) |
| Expert IA | `ai.ts` | L88-130 (vision), L148-184 (config), L480-700 (context) |
| Service Worker | `service-worker.js` | ALL |
| Voice UI | `VoiceTicketFab.js` | ALL |

### [DANGEROUS ACTIONS - HIGH RISK]
| Action | Risk | Reason |
|--------|------|--------|
| Rate limit `/api/ai/*` | 🔴 CRITICAL | Breaks Voice Ticket |
| Rate limit `/api/v2/chat` | 🔴 CRITICAL | Breaks Messenger polling |
| Modify R2 paths | 🔴 CRITICAL | Breaks all images |
| Pagination in `ai.ts` | 🟠 HIGH | Expert IA loses context |

### [MANDATORY TESTS AFTER ANY CHANGE]
1. **Voice**: Record → Analyze → Pre-fill modal
2. **Push**: Create ticket → Receive notification with sound
3. **Expert IA**: Send message → Get contextual response

### [HONO TRAP]
```
⚠️ In Hono, FIRST declared route wins (unlike Express where LAST wins).
   Duplicate routes: First = ACTIVE, Second = DEAD CODE.
```

---

## 🏁 END OF KERNEL
