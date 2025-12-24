# ⚡ SYSTEM KERNEL : THE RULES OF ENGAGEMENT
> **VERSION:** 6.0 (Unified) | **LIMIT:** < 500 lines | **STATUS:** IMMUTABLE SOURCE OF TRUTH

---

## 🟢 MODULE 0: META-PROTOCOL
*   **READ BEFORE WRITE**: `READ` → `GREP` → `PLAN` → `EDIT`. No blind coding.
*   **SCOPE ISOLATION**: Don't burn the house to kill a spider. Revert > Reset.
*   **ALIGNMENT**: Generic SaaS (White Label). IGP = first tenant, NOT the product.
*   **ONE FILE**: Update THIS file only. Never create `bible_v2.md`. Keep < 500 lines.
*   **CHESTERTON'S FENCE**: Never delete code you don't fully understand.

---

## 🟥 MODULE 1: THE CORE LOOP
1.  **SIMULATION**: Audit for Security, Performance (O(n²)), Mobile (<44px), Edge Cases.
2.  **GLOBAL IMPACT**: "Does this fix disrupt active states (Audio, Scroll, Input)?"
3.  **VERIFICATION**: Use `grep` to ensure no conflicts globally.
4.  **LEGACY AWARENESS**: "Dead code" in `src/` might be "Alive" in `public/static/`.

---

## 🟧 MODULE 2: TECHNICAL AXIOMS

### [PLATFORM - CLOUDFLARE EDGE]
*   **EDGE PURITY**: V8 Runtime. NO Node.js APIs (`fs`, `crypto`, `child_process`). Web Standards only.
*   **STATELESS**: DB (D1/R2) is the ONLY State. Workers are ephemeral.
*   **NO NATIVE CRON**: Use external webhooks (cron-job.org) → `/api/cron/*` with `CRON_SECRET`.
*   **NO WEBSOCKETS**: Use polling or Server-Sent Events instead.

### [DATA & TIME]
*   **UTC STORAGE**: Storage = UTC. Display = User Local (`timezone_offset`).
*   **TRUST NO INPUT**: Validate EVERYTHING. Verify JWTs against DB.
*   **SOFT DELETE**: Use `deleted_at` timestamp. NEVER `DELETE FROM`. Every SELECT filters `deleted_at IS NULL`.
*   **SQL SAFETY**: Use `COALESCE` for NULLs. Prepared statements only.

### [UX]
*   **MOBILE FIRST**: Touch target **44x44px MINIMUM**.
*   **ESCAPE HATCH**: Modals close on backdrop click.
*   **NO LIES**: Green = verified server-side. Never fake success.

### [CODE HYGIENE]
*   **ZERO HARDCODING**: Fetch values from DB (`system_settings`) or ENV.
*   **NO DEAD CODE**: Commented code = Deleted code.
*   **EXPLICIT NAMES**: Human-readable variable names.

### [🚨 HARDCODING FORBIDDEN]
```
❌ app.igpglass.ca    → Use window.location.hostname or getDomainFromRequest()
❌ igpglass.com       → Use window.location.origin
❌ IGP Glass          → Use window.APP_COMPANY_NAME or system_settings
❌ admin@igpglass.*   → Use system_settings support_email
❌ sk-*, AKIA*        → NEVER commit API keys

✅ Backend: import { getDomainFromRequest, getBrandingFromDB } from 'src/config/branding'
✅ Frontend: window.location.hostname, window.APP_COMPANY_NAME
✅ Both: system_settings table for tenant-specific values
```

---

## 🟨 MODULE 3: DEPLOYMENT

### [⚠️ SANDBOX PROTECTION - CRITICAL]
```
🚨 SANDBOX RAM LIMITED - NO FULL BUILDS
❌ npm run build (crashes sandbox)
✅ npx tsc --noEmit (type check only)
✅ git push origin main (GitHub Actions builds)
```

### [GITHUB ACTIONS - MANDATORY]
1.  **DEPLOY**: `git push origin main` → auto build & deploy (~2 min)
2.  **WORKFLOW**: `.github/workflows/deploy.yml`
3.  **MONITOR**: https://github.com/salahkhalfi/igp-maintenance/actions
4.  **VERIFY**: Test `https://app.igpglass.ca` after deploy.

### [DATABASE: maintenance-db]
*   **Local**: `npx wrangler d1 migrations apply maintenance-db --local`
*   **Prod**: `npx wrangler d1 migrations apply maintenance-db`
*   **Reset**: `rm -rf .wrangler/state/v3/d1 && npm run db:migrate:local`

---

## 🟩 MODULE 4: ARCHITECTURE TECHNIQUE

### [STACK]
*   **Framework**: Hono (lightweight, edge-optimized)
*   **Database**: Cloudflare D1 (`maintenance-db`) - SQLite distributed
*   **Storage**: Cloudflare R2 (`maintenance-media`) - Files/Images
*   **Frontend**: React 18 (via CDN) - Legacy dashboard
*   **Push**: `@block65/webcrypto-web-push` (NOT web-push npm)

### [CRON EXTERNE (cron-job.org)]
```
URL: mecanique.igpglass.ca (NEVER preview URLs)
Auth: Authorization: cron_secret_igp_2025_webhook_notifications (NO "Bearer" prefix)
Frequency: Every 5 min
Endpoints: /api/cron/*
```

### [TIMEZONE HANDLING]
```
Storage: UTC (via localDateTimeToUTC() frontend)
Display: Local (via parseUTCDate() adds 'Z' suffix)
Webhooks: Convert to local (via convertToLocalTime())
Helper: getTimezoneOffset() (used in cron.ts, webhooks.ts)
```

### [PUSH NOTIFICATIONS]
```
Queue: table pending_notifications (users offline)
Cleanup: CRON externe requis
Admin push: code in cron.ts L188-296 (NOT scheduled.ts)
```

---

## 🟦 MODULE 5: BUSINESS MODEL

### [📦 MODÈLE: INSTALLATION DÉDIÉE]
```
✅ 1 Client = 1 Instance Isolée (NO multi-tenant DB for now)

WHY:
├── App ALREADY ready (0 extra work)
├── Total isolation (0 data leak risk)
├── Unlimited customization per client
├── No tenant_id technical debt
└── Maximum margin (95%+)

PRICING:
├── Setup: $1,500 (one-time)
├── Monthly: $99/month
└── Real cost: ~$5/month Cloudflare
```

### [🔧 MULTI-CLIENT ARCHITECTURE]
```
EACH CLIENT HAS:
├── 1 GitHub Fork (github.com/salahkhalfi/[client]-maintenance)
├── 1 Cloudflare Pages project ([client]-app)
├── 1 D1 Database ([client]-db)
├── 1 R2 Bucket ([client]-media)
├── 1 Genspark Hub for support
└── 1 Custom BIBLE.md

AGENT MANAGEMENT:
├── 1 Session = 1 Client (via separate Hubs)
├── Never 2 clients in same session
└── Switch client = Switch Hub/Tab
```

### [🚀 NEW CLIENT ONBOARDING]
```bash
# 1. Create Genspark Hub "[Client] Maintenance"
# 2. In that Hub:
git clone https://github.com/salahkhalfi/igp-maintenance [client]-maintenance
cd [client]-maintenance
git remote set-url origin https://github.com/salahkhalfi/[client]-maintenance
git push -u origin main

# 3. Cloudflare Dashboard: Create Pages, D1, R2, configure secrets
# 4. Configure system_settings (branding, AI, modules)
# 5. Configure cron-job.org for this client
# 6. Deploy & test
```

### [⚙️ SYSTEM_SETTINGS - WHITE LABEL]
```
BRANDING (39 params): company_title, logo_url, primary_color, app_name, support_email
AI CUSTOM: ai_expert_name, ai_identity_block, ai_knowledge_block, ai_character_block
MODULES: planning, analytics, notifications, statistics, messaging, machines
```

### [💰 CLOUDFLARE ECONOMICS]
| Clients | Cost/month |
|---------|------------|
| 1 | ~$5 |
| 5 | ~$25 |
| 10 | ~$50 |

### [⏳ MULTI-TENANT: LATER]
```
TRIGGER: 10+ clients AND management becomes heavy
EFFORT: ~5-6 days
FOR NOW: DO NOT IMPLEMENT (unnecessary technical debt)
```

---

## 🟪 MODULE 6: COPILOT OATH

### [🚨 NO BULLSHIT - PRIORITY ZERO]
```
INTERDICTIONS ABSOLUES:
❌ "Excellent idea!" → Dire juste "ok" ou pointer le problème
❌ "Great question!" → Répondre directement
❌ "You're right" si c'est faux → "Non, parce que..."
❌ Tourner en rond sans le dire → "On tourne en rond, STOP"
❌ 3+ tentatives échouées → "Je n'y arrive pas, autre approche?"
❌ Flatter pour plaire → Vérité même si désagréable

OBLIGATIONS:
✅ Dire "Non" avec la raison
✅ Dire "Je sais pas" si incertain
✅ Dire "STOP" si session improductive
✅ Dire "C'est moi le problème" si c'est le cas
✅ Admettre quand user a raison de douter

RAPPEL: User peut dire "bullshit" = reset comportement
```

### [TOKEN PRIORITY]
0.  **NEVER WASTE TOKENS**: Every action must be justified. Think BEFORE acting.

### [COMMUNICATION]
1.  **RADICAL TRUTH**: No flattery. No ass-kissing. Jamais.
2.  **CALL BULLSHIT**: If user is wrong, say it directly. If AI is wrong, admit it.
3.  **UNCERTAINTY**: If unsure, say "I don't know". Never invent.

### [TOKEN ECONOMY - DEFAULT MODE]
```
FORMAT:
Action: [1 line]
[Code/Command]
Result: [1 line]

RULES:
- <100 words unless complex task
- Act first, summarize after
- No decoration (skip tables/emojis unless clarity)
- Batch tool calls
- No re-read files already read in session
- No repeating user's question
- No "Great question!" filler
- No explaining what you're ABOUT to do (just do it)

TRIGGERS:
- "mode efficace" / "sois bref" → Strict mode
- "explique" / "détails" → Verbose allowed
```

---

## 🟫 MODULE 7: SANCTUARIZED CODE (DO NOT TOUCH)

### [VITAL FUNCTIONS]
| Function | File | Lines |
|----------|------|-------|
| Voice Ticket | `ai.ts` | L135-400 |
| Push Notifications | `push.ts` | L197-450 |
| Expert IA | `ai.ts` | L88-130, L148-184, L480-700 |
| Service Worker | `service-worker.js` | ALL |
| Voice UI | `VoiceTicketFab.js` | ALL |

### [DANGEROUS ACTIONS]
| Action | Risk |
|--------|------|
| Rate limit `/api/ai/*` | 🔴 Breaks Voice Ticket |
| Rate limit `/api/v2/chat` | 🔴 Breaks Messenger polling |
| Modify R2 paths | 🔴 Breaks all images |

### [MANDATORY TESTS]
1. **Voice**: Record → Analyze → Pre-fill modal
2. **Push**: Create ticket → Receive notification
3. **Expert IA**: Send message → Get contextual response

### [HONO TRAP]
```
⚠️ FIRST declared route wins (unlike Express LAST wins)
Duplicate routes: First = ACTIVE, Second = DEAD CODE
```

---

## 🔵 MODULE 8: AI STACK
*   **Audio**: Groq Whisper → OpenAI Whisper (fallback)
*   **Logic**: DeepSeek → GPT-4o-mini (fallback)
*   **Vision**: OpenAI GPT-4o-mini only
*   **POLYGLOT**: User Input Language = Bot Output Language

---

## 🟤 MODULE 9: REACT ISOLATION
*   **ONE React per page**: Dashboard = Legacy (CDN), Messenger = Modern (Vite). NEVER mix.
*   **No bridge**: Injecting bundled React into legacy = GUARANTEED FAILURE.
*   **Modernization**: Create SEPARATE `/dashboard-v2` build if needed.

---

## ⚫ MODULE 10: COMMON ERRORS
*   **Infinite loading** → `npm run db:reset`
*   **Node API error** → Use Web APIs only (no `fs`/`path`)
*   **Heap out of memory** → Use sequential builds / GitHub Actions
*   **Full list**: `docs/COMMON_ERRORS.md`

---

## ⏳ MODULE 11: TEMPORARY MEASURES
*   **CACHE KILLER** in `home.ts`: Remove after 2025-12-25 to restore PWA caching.

---

## 🏁 END OF KERNEL (v6.0 - ~280 lines)
