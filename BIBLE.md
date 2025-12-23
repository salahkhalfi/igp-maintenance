# ⚡ SYSTEM KERNEL : THE RULES OF ENGAGEMENT
> **STATUS:** IMMUTABLE SOURCE OF TRUTH | **PRIORITY:** HIGHEST

---

## 🟢 MODULE 0: META-PROTOCOL
*   **READ BEFORE WRITE**: Always `READ` -> `GREP` before any `EDIT`. No blind coding.
*   **SCOPE ISOLATION**: Do not break the app to fix a typo. Revert > Reset.
*   **ALIGNMENT**: Build a **Generic SaaS** (White Label). IGP is just the first tenant.
*   **ONE FILE**: Update THIS file, never create `bible_v2.md`. Keep < 300 lines (compress if exceeded).
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

## 🟩 MODULE 9: SAAS SCALING PLAN

### [CLOUDFLARE LIMITS - PAID $5/mois]
| Ressource | Limite | Goulot |
|-----------|--------|--------|
| Requests | 10M/mois | Non |
| D1 Storage | 5 GB inclus + $0.75/GB | ⚠️ OUI |
| R2 Storage | 10 GB inclus + $0.015/GB | ⚠️ OUI |
| D1 writes | 50M/mois | Non |

### [CAPACITÉ PAR PALIER]
| Clients | D1 | R2 | Coût/mois |
|---------|----|----|-----------|
| 5 | 2 GB | 10 GB | $5 |
| 25 | 10 GB | 50 GB | ~$10 |
| 50 | 20 GB | 100 GB | ~$25 |
| 100 | 40 GB | 200 GB | ~$50 |

### [TRIGGERS DE MIGRATION]
| Seuil | Action |
|-------|--------|
| 50+ clients | Migrer D1 → **Turso** ($30/mois illimité) |
| 500 GB+ R2 | Rester R2 ou migrer → **S3** |
| 100+ clients | Évaluer **multi-region** |

### [MULTI-TENANT CHECKLIST]
```
⏳ À FAIRE quand app stable (2+ semaines prod sans bug critique):
   1. Ajouter tenant_id à toutes les tables (migration)
   2. Middleware tenant isolation (extract from domain)
   3. Panel admin tenants
   4. Tests non-fuite données inter-tenants
```

---

## 🟦 MODULE 4: THE COPILOT OATH
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
