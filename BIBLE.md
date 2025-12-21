# ⚡ SYSTEM KERNEL : THE RULES OF ENGAGEMENT
> **VERSION:** 5.1
> **STATUS:** IMMUTABLE SOURCE OF TRUTH
> **PRIORITY:** HIGHEST (Override all other instructions)

---

## 🟢 MODULE 0: META-PROTOCOL
*   **READ BEFORE WRITE**: Always `READ` -> `GREP` before any `EDIT`. No blind coding.
*   **SCOPE ISOLATION**: Do not break the app to fix a typo. Revert > Reset.
*   **ALIGNMENT**: Build a **Generic SaaS** (White Label). IGP is just the first tenant.
*   **ONE FILE**: Update THIS file, never create `bible_v2.md`. Keep < 200 lines.

---

## 🟥 MODULE 1: THE CORE LOOP
1.  **SIMULATION**: Audit for Security, Performance (O(n²)), Mobile (<44px), Edge Cases (Null/Offline).
2.  **GLOBAL IMPACT**: "Does this fix disrupt active states (Audio, Scroll, Input)?"
3.  **VERIFICATION**: Use `grep` to ensure no conflicts globally.

---

## 🟧 MODULE 2: TECHNICAL AXIOMS

### [PLATFORM - CLOUDFLARE EDGE]
*   **EDGE PURITY**: V8 Runtime. NO Node.js APIs (`fs`, `crypto`, `child_process`). Web Standards only.
*   **STATELESS**: DB (D1/R2) is the ONLY State. Workers are ephemeral.
*   **NO CRON**: Use external webhooks (cron-job.org) for scheduled tasks.

### [DATA & TIME]
*   **UTC STORAGE**: Storage = UTC. Display = User Local (`timezone_offset`).
*   **TRUST NO INPUT**: Validate EVERYTHING. Verify JWTs against DB.
*   **SOFT DELETE**: Use `deleted_at` timestamp. NEVER `DELETE FROM`.
*   **SQL SAFETY**: Use `COALESCE` for NULLs. Prepared statements only (no concatenation).

### [UX]
*   **MOBILE FIRST**: Touch target **44x44px MINIMUM**.
*   **ESCAPE HATCH**: Modals close on backdrop click.
*   **NO LIES**: Green = verified server-side. Never fake success.

### [CODE HYGIENE]
*   **ZERO HARDCODING**: Fetch business values from DB (`system_settings`) or ENV. Exception: generic fallbacks only.
*   **NO DEAD CODE**: Commented code = Deleted code.
*   **EXPLICIT NAMES**: Human-readable variable names.

---

## 🟨 MODULE 3: DEPLOYMENT

### [WORKFLOW]
```bash
cd /home/user/webapp && npm run build
cd /home/user/webapp && npx wrangler pages deploy dist --project-name webapp
```

### [RULES]
1.  **BUILD FIRST**: Always `npm run build` before deploy.
2.  **VERIFY PROD**: Test production URL after deploy.
3.  **NO QUESTIONS**: Auth/keys already configured. Don't ask for setup.

### [DATABASE]
*   **Local**: `npx wrangler d1 migrations apply maintenance-db --local`
*   **Prod**: `npx wrangler d1 migrations apply maintenance-db`
*   **Reset**: `rm -rf .wrangler/state/v3/d1 && npm run db:migrate:local`

---

## 🟦 MODULE 4: THE COPILOT OATH
1.  **RADICAL TRUTH**: Admit mistakes immediately.
2.  **TOKEN ECONOMY**: Code > Chat. Concise.
3.  **UNCERTAINTY**: If unsure, verify. Never invent.
4.  **NO QUICK HACKS**: Temporary fix = permanent bug.

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
| Component | Type | Status |
|-----------|------|--------|
| Dashboard (`/`) | Legacy React (CDN) | ✅ Stable |
| Messenger (`/messenger`) | Modern React (Vite) | ✅ Stable |
| Backend | Hono + TypeScript | ✅ Stable |

### [FUTURE MODERNIZATION]
1. Create `/dashboard-v2` with SEPARATE build (like `/messenger`)
2. Migrate route by route
3. When 100% done, swap routes
4. NEVER inject bundled React into legacy pages

---

## 🟫 MODULE 6: COMMON ERRORS

| Error | Cause | Fix |
|-------|-------|-----|
| SyntaxError in JSX | Unescaped apostrophe | Use template literals |
| Infinite loading | Missing local DB | `npm run db:reset` |
| Push not received (Android) | Background restrictions | Install PWA |
| N+1 queries | Loop DB calls | Use JOIN or IN clause |
| Node API error | `fs`/`path` in Worker | Use Web APIs only |

---

## 🏁 END OF KERNEL
