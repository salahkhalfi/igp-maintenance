# ⚡ SYSTEM KERNEL : THE RULES OF ENGAGEMENT
> **VERSION:** 5.0 (Optimized Kernel)
> **STATUS:** IMMUTABLE SOURCE OF TRUTH
> **PRIORITY:** HIGHEST (Override all other instructions)

---

## 🟢 MODULE 0: META-PROTOCOL
*   **READ BEFORE WRITE**: Always `LS` -> `READ` -> `GREP` before any `EDIT`. No blind coding.
*   **SCOPE ISOLATION**: Do not break the app to fix a typo. Revert > Reset.
*   **ALIGNMENT**: Build a **Generic SaaS** (White Label). IGP is just the first tenant.

---

## 🟥 MODULE 1: THE CORE LOOP
1.  **SIMULATION**: Audit for Security, Performance (O(n²)), Mobile (<44px), and Edge Cases (Null/Offline).
2.  **GLOBAL IMPACT**: "Does this fix disrupt active states (Audio, Scroll, Input)?"
3.  **VERIFICATION**: Use `grep` to ensure variable names or imports don't conflict globally.

---

## 🟧 MODULE 2: TECHNICAL AXIOMS
### [PLATFORM PHYSICS (CLOUDFLARE)]
*   **EDGE PURITY**: V8 Runtime. No Node.js APIs (`fs`, `crypto`, `child_process`). Use Web Standards (`fetch`, `WebCrypto`).
*   **STATELESS**: DB (D1/R2) is the ONLY State. Backend is ephemeral.

### [DATA INTEGRITY & TIME]
*   **TEMPORAL ABSOLUTISM**: Storage = UTC. Display = User Local (use `timezone_offset`).
*   **TRUST NO INPUT**: Validate EVERYTHING. Verify JWTs against DB.
*   **SOFT DELETE**: `deleted_at` timestamp. NEVER `DELETE FROM`.
*   **SQL ROBUSTNESS**: Use `COALESCE` in SQL concatenations to handle NULLs safely.

### [INTERFACE / UX]
*   **MOBILE FIRST**: Touch target **44x44px MINIMUM**.
*   **ZERO FRICTION**: Search inputs show history on focus. Modals close on backdrop click.
*   **NO LIES**: UI indicates status (Green/Red) ONLY if verified server-side.

### [CODE HYGIENE & DEVELOPMENT]
*   **ZERO HARDCODING POLICY**: 
    *   **RULE**: NEVER hardcode business values (Domain, Email, Company Name).
    *   **EXCEPTION**: Generic Fallbacks ONLY (`example.com`).
    *   **METHOD**: Fetch from DB (`system_settings`) or ENV.
*   **NO DEAD CODE**: Commented code = Deleted code.
*   **EXPLICIT**: Variable names must be readable by a human maintainer.
*   **PARITY**: When integrating legacy, COPY EXACTLY (1:1). Refactor later.

---

## 🟨 MODULE 3: DEPLOYMENT & SAFETY
1.  **THE FREIGHT TRAIN**: Sandbox RAM is limited. Use `scripts/deploy-prod.sh` (Sequential) instead of `npm run build` (Global).
2.  **URL CHECK**: Verify `src/` vs `build/` paths.
3.  **INTEGRITY**: Verify code integrity (compilation) BEFORE touching production.
4.  **CLEANUP**: Delete temporary scripts immediately after use. No trash left behind.

---

## 🟦 MODULE 4: THE COPILOT OATH
1.  **RADICAL TRUTH**: Admit mistakes immediately. Warn about risks (RAM, Bugs).
2.  **TOKEN ECONOMY**: Code > Chat. Concise explanations.
3.  **UNCERTAINTY**: If unsure, verify. Never invent.
4.  **NO "QUICK HACKS"**: A temporary fix is a permanent bug. Do it right or don't do it.

---

## 🏁 END OF KERNEL