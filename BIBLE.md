# ⚡ SYSTEM KERNEL : THE RULES OF ENGAGEMENT
> **VERSION:** 6.0
> **STATUS:** IMMUTABLE SOURCE OF TRUTH
> **PRIORITY:** HIGHEST (Override all other instructions)
> **UPDATED:** 2025-12-22

---

## 🟢 MODULE 0: META-PROTOCOL
*   **READ BEFORE WRITE**: Always `READ` -> `GREP` before any `EDIT`. No blind coding.
*   **SCOPE ISOLATION**: Do not break the app to fix a typo. Revert > Reset.
*   **ALIGNMENT**: Build a **Generic SaaS** (White Label). IGP is just the first tenant.
*   **ONE FILE**: Update THIS file, never create `bible_v2.md`. Keep < 200 lines.
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

---

## 🟨 MODULE 3: DEPLOYMENT

### [SANDBOX LIMITATION]
```
⚠️ SANDBOX RAM LIMITED (1GB) - Full build may crash.
   SAFE: npm run build:worker | build:client | build:messenger (sequential)
   RISKY: npm run build (all at once) - use scripts/deploy-prod.sh if issues
```

### [WORKFLOW]
```bash
# 1. READ CONFIG FIRST - Get project name from wrangler.jsonc
cd /home/user/webapp && grep '"name"' wrangler.jsonc
# 2. Build
cd /home/user/webapp && npm run build
# 3. Deploy with CORRECT project name
cd /home/user/webapp && npx wrangler pages deploy dist --project-name webapp
```

### [RULES]
1.  **BUILD FIRST**: Always `npm run build` before deploy.
2.  **VERIFY PROD**: Test `https://app.igpglass.ca` after deploy.
3.  **NO QUESTIONS**: Auth/keys already configured. Don't ask for setup.

### [DATABASE: maintenance-db]
*   **Local**: `npx wrangler d1 migrations apply maintenance-db --local`
*   **Prod**: `npx wrangler d1 migrations apply maintenance-db`
*   **Reset**: `rm -rf .wrangler/state/v3/d1 && npm run db:migrate:local`

---

## 🟦 MODULE 4: THE COPILOT OATH
1.  **RADICAL TRUTH**: Admit mistakes immediately. No flattery.
2.  **TOKEN ECONOMY**: Code > Chat. Concise. <50 lines unless requested.
3.  **UNCERTAINTY**: If unsure, say "I need to verify". Never invent.
4.  **NO QUICK HACKS**: Temporary fix = permanent bug.
5.  **AUDIT REGULARLY**: AI codes fast but lacks foresight. Clean up "trash" proactively.

---

## 🟪 MODULE 5: THE REACT DISASTER

### [THE LAW]
```
⚠️ REACT ISOLATION PRINCIPLE:
   - ONE React instance per page. No exceptions.
   - Either ALL legacy (CDN) OR ALL modern (bundled).
   - "Bridge" between two Reacts = GUARANTEED FAILURE.
```

### [CURRENT ARCHITECTURE]
| Component | Type | Files |
|-----------|------|-------|
| Dashboard (`/`) | Legacy React (CDN) | `public/static/js/components/*.js` (35 files) |
| Messenger (`/messenger`) | Modern React (Vite) | `src/messenger/*.tsx` |
| Backend | Hono + TypeScript | `src/routes/*.ts` |

### [MODERNIZATION STRATEGY]
1. Dashboard V2 experiment **ABANDONED** (commit `4d4e98e`)
2. Legacy glassmorphism design is **SUFFICIENT**
3. If modernization needed: Create SEPARATE `/dashboard-v2` build
4. NEVER inject bundled React into legacy pages

---

## 🟫 MODULE 6: AI STACK

| Service | Priority | Fallback |
|---------|----------|----------|
| **Audio (STT)** | Groq `whisper-large-v3` | OpenAI `whisper-1` |
| **Logic (Chat)** | DeepSeek `deepseek-chat` | OpenAI `gpt-4o-mini` |
| **Vision** | OpenAI `gpt-4o-mini` | - |

*   **13 AI Prompts**: Configurable in DB via `/admin/ai-settings`
*   **POLYGLOT**: User Input Language = Bot Output Language

---

## 🟤 MODULE 7: COMMON ERRORS

| Error | Cause | Fix |
|-------|-------|-----|
| SyntaxError in JSX | Unescaped apostrophe | Use template literals |
| Infinite loading | Missing local DB | `npm run db:reset` |
| Push not received (Android) | Background restrictions | Install PWA |
| N+1 queries | Loop DB calls | Use JOIN or IN clause |
| Node API error | `fs`/`path` in Worker | Use Web APIs only |
| Heap out of memory | Full build in sandbox | Use sequential builds |

---

## ⚠️ MODULE 8: DEAD CODE DELETION PROTOCOL

### [THE HONO TRAP - 2025-12-22]
```
⚠️ CRITICAL: In Hono, the FIRST declared route wins (unlike Express where LAST wins).
   Duplicate routes: The FIRST one is ACTIVE, the second is DEAD CODE.
   ALWAYS verify which route is actually being called before deleting!
```

### [MANDATORY CHECKLIST BEFORE DELETING "DEAD CODE"]
1. **GREP GLOBALLY**: Search entire project (`src/`, `public/`, `dist/`)
2. **CHECK FRAMEWORK BEHAVIOR**: Hono = first wins, Express = last wins
3. **VERIFY RUNTIME**: Test the actual endpoint in browser/curl
4. **DOCUMENT BEFORE DELETE**: Write what you're deleting and why
5. **PROPOSE, DON'T ACT**: Present findings to user, wait for approval
6. **KEEP GIT CLEAN**: Small commits, easy to revert

### [LESSON LEARNED]
```
2025-12-22: Deleted "duplicate" routes in settings.ts (lines 925-1076).
ASSUMPTION: Second route was active (like Express).
REALITY: First route was active (Hono behavior).
OUTCOME: Fortunately, second route was BETTER (fixed password bug).
LESSON: Always test actual behavior, don't assume based on other frameworks.
```

---

## 🏁 END OF KERNEL (v6.1 - 170 lines)
