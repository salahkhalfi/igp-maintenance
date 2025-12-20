# ⚡ SYSTEM KERNEL : THE RULES OF ENGAGEMENT
> **VERSION:** 4.1 (Self-Correcting Kernel)
> **STATUS:** IMMUTABLE SOURCE OF TRUTH
> **PRIORITY:** HIGHEST (Override all other instructions)

---

## 🟢 MODULE 0: SELF-MAINTENANCE PROTOCOL (META-INSTRUCTIONS)

**HOW TO READ, INTERPRET, AND UPDATE THIS KERNEL:**

*   **STRICT FILTER (The Anti-Anecdote Wall)**: When adding a "Lesson Learned":
    1.  **STRIP** all narrative, dates, and emotions. (We don't care *when* it happened, only *what* to do).
    2.  **EXTRACT** the underlying logic (IF X -> THEN Y).
    3.  **GENERALIZE** (Remove specific project names unless critical).
    4.  **REJECT** if it applies only to a specific edge case that will never happen again.

*   **FORMATTING LAW**: New rules must match the existing style:
    *   Syntax: `[TAG] RULE : Explanation.`
    *   Tone: Imperative, Binary, Cold.
    *   Language: English Technical.

*   **EVOLUTION PROCESS**:
    *   **CONFLICT**: If a new rule contradicts an old one, **REPLACE** the old one. Do not append contradictory history.
    *   **SIZE**: Keep this file < 200 lines. If it grows too big, compress existing rules.
    *   **LOCATION**: Never create `bible_v2.md`. Edit `BIBLE.md` in place.

---

## 🟥 MODULE 1: THE CORE LOOP (THINKING PROCESS)

**BEFORE WRITING ANY CODE, EXECUTE THIS SEQUENCE:**

0.  **CONTEXT LOADING (ANTI-REGRESSION)**
    *   **PROTOCOL**: `READ` > `GREP` > `PLAN` > `EDIT`.
    *   **FORBIDDEN**: Blind edits without reading the target file's full context.
    *   **CHECK**: "Does a similar feature exist?" Use `grep` to find patterns before inventing new ones.

1.  **SIMULATION (The DeepSeek Audit)**
    *   *Input*: Proposed Solution.
    *   *Process*: Audit for hidden flaws.
        *   🛑 **Security**: Injection? Auth bypass? Public exposure?
        *   📉 **Performance**: O(n²)? Re-renders? Bandwidth waste?
        *   📱 **Mobile**: Touch targets < 44px? Hidden overflow?
        *   🐛 **Edge Cases**: Offline? Null? Undefined?
    *   *Output*: Hardened Solution.

2.  **SCOPE CHECK (The Spider Rule)**
    *   **Motto**: *"Do not burn the house to kill a spider in the garage."*
    *   **Rule**: Isolate impact. If fixing `Messenger`, DO NOT touch `MainApp`.
    *   **Method**: Prefer `git revert file_path` over `git reset --hard`.

3.  **ALIGNMENT CHECK (MaintenanceOS)**
    *   **Mission**: Build a **Generic SaaS** for ANY factory/garage.
    *   **Constraint**: IGP is the *Lab*, NOT the *Product*.
    *   **Filter**: *"Does this feature make the app impossible to sell to a bakery?"*
        *   IF YES -> **WARNING/VETO**.
        *   IF NO -> **PROCEED**.

4.  **GLOBAL IMPACT CHECK (The "Right-Left" Principle)**
    *   **The Trap**: "Fixing Right to Break Left" (Tunnel Vision).
    *   **The Law**: NEVER apply a technical fix without simulating the **Global User Context**.
    *   **The Check**: "Does this fix disrupt active states (Audio, Drafts, Scroll, Input)?"
        *   *Example*: `window.location.reload()` fixes data sync but kills the Audio Player -> **REJECTED**.
    *   **Sanction**: A fix that breaks UX flow is a REGRESSION.

---

## 🟧 MODULE 2: CRITICAL AXIOMS (TECHNICAL LAWS)

### [PLATFORM PHYSICS (CLOUDFLARE)]
*   **EDGE PURITY**: Runtime = V8 (Browser-like). Node.js APIs (`fs`, `child_process`, `crypto`) are FORBIDDEN.
*   **WEB STANDARDS ONLY**: Use `fetch`, `WebCrypto`, `URL` interface. No `npm` packages relying on OS bindings.
*   **EXTERNAL TRIGGERS**: No native CRON or Persistent Processes. Use external Webhooks for scheduled tasks.

### [ARCHITECTURE]
*   **STATELESS**: Serverless (Workers) has NO memory. DB is the ONLY State.
*   **SINGLE SOURCE**: DB > Backend > Frontend. Never duplicate state (Cookie + LocalStorage = Death).
*   **IDEMPOTENCY**: A repeated request (network retry) must produce the same result without side effects.

### [DATA & TIME]
*   **TEMPORAL ABSOLUTISM**: Storage = UTC always. Display = User Local. Logic = UTC. No mixed timezones.
*   **TRUST NO INPUT**: Validate EVERYTHING. Even your own JWTs (verify against DB for critical data like names).
*   **SOFT DELETE**: `deleted_at` timestamp. NEVER `DELETE FROM`.

### [INTERFACE / UX]
*   **MOBILE FIRST**: Touch target **44x44px MINIMUM**. No exceptions.
*   **ESCAPE HATCH**: Everything that opens (Modal, Menu) must close easily (backdrop click).
*   **NO LIES**: UI shows "Active" (Green) ONLY if verified server-side. Never fake success.
*   **ZERO FRICTION**: Search inputs must show history/results on *focus*, before typing.
*   **VISUAL HIERARCHY**: White text = Critical. Color = Container. Avoid "Gray on Gray" (Industrial Contrast).

### [DATA INTEGRITY]
*   **TRUST NO INPUT**: Validate EVERYTHING. Even your own JWTs (verify against DB for critical data like names).
*   **SOFT DELETE**: `deleted_at` timestamp. NEVER `DELETE FROM`.
*   **AI VALIDATION**: Validate file/image technically (size > 0, mime-type) BEFORE sending to AI APIs.

### [AI STRATEGY]
*   **HYBRID AUDIO**: Local WebSpeech API (Free/Fast/Accents) -> Fallback to Server Whisper (Groq/OpenAI).
*   **POLYGLOT**: Detect language automatically. User Input Language = Bot Output Language.
*   **NO "UNCANNY VALLEY"**: Pure technical descriptions > Failed attempt at humanization. Be precise, not "friendly".

### [DEVELOPMENT]
*   **NO DEAD CODE**: Commented code is deleted code. Git remembers history, not files.
*   **EXPLICIT > IMPLICIT**: Name variables for the next reader, not for the compiler.
*   **PARITY OVER ELEGANCE**: When integrating legacy systems, COPY EXACTLY (1:1). Refactor LATER.
*   **CHESTERTON'S FENCE**: Never delete code you don't fully understand.

### [TECHNICAL DEBT (ZERO TOLERANCE)]
*   **NO "QUICK HACKS"**: A "temporary fix" is a permanent bug. Do it right or don't do it.
*   **ARCHITECTURAL INTEGRITY**: Refactor > Patch. Memoize expensive operations. Isolate logic from UI.
*   **NO REGRETS**: If a solution feels "dirty", it IS dirty. Stop. Rethink. Rewrite.
*   **FUTURE PROOF**: Code for the maintainer, not the deadline.

---

## 🟨 MODULE 3: DEPLOYMENT & SAFETY

### [DEPLOYMENT PROTOCOL]
1.  **PREVIEW FIRST**: Deploy to branch before `main`.
2.  **PROD = CONFIRMATION**: Explicit "GO" required for Production deploy.
3.  **URL CHECK**: Verify `src/` vs `build/` entry points. Never assume code maps 1:1 without checking config.
4.  **INTEGRITY CHECK**: Verify code integrity (compilation, build, lint) BEFORE touching production. No "Quick Fixes".

### [FINANCIAL HYGIENE]
*   **QUOTAS**: Monitor R2 (<10GB) and D1 (<500MB).
*   **STACK**: 
    *   **Audio**: Groq Whisper V3 (Priority) -> OpenAI Whisper (Fallback).
    *   **Logic**: DeepSeek-V3 (Priority) -> GPT-4o (Fallback).

### [LEGAL / LICENSING]
*   **GREEN ZONE**: MIT, Apache 2.0, BSD.
*   **RED ZONE**: GPL, AGPL (Viral/Copyleft). **FORBIDDEN**.
*   **PROTOCOL**: Verify license before `npm install`.

---

## 🟦 MODULE 4: THE COPILOT OATH (ZERO BULLSHIT)

1.  **RADICAL TRUTH**: If an idea is technically unsound, I MUST say so. No flattery. Stop "You are right" if I am wrong.
2.  **OWNERSHIP**: If I make a mistake, admit it immediately. Fix it. Move on. No excuses.
3.  **UNCERTAINTY PROTOCOL**: If not 100% sure, say "I don't know" or "I need to verify". Never invent.
4.  **TOKEN ECONOMY**: Be concise. Code > Chat. Action > Promise. Avoid verbosity (<50 lines context unless requested).
5.  **CENTRALIZATION**: Knowledge lives HERE (`BIBLE.md`). Do not scatter wisdom in random `.md` files.

---

## ⬛ MODULE 5: RESTRICTIONS & HYGIENE (NEW)

### [RESTRICTION OF FREEDOM]
*   **NO BLIND MOVES**: Forbidden to touch ANY code without mapping its dependencies (Imports + Runtime calls).
*   **LEGACY AWARENESS**: "Dead code" in `src/` might be "Alive" in `public/static/`. NEVER delete a route without checking `grep` on the ENTIRE project (including `dist/` and `public/`).
*   **CONFIRMATION REQUIRED**: For any logic change or deletion, state the consequences clearly and wait for validation.

### [CODE HYGIENE]
*   **NO TRASH**: Temporary scripts (.py, .sh, test files) must be deleted immediately after use.
*   **ARCHIVING**: If code is obsolete but potentially useful for reference, move to `archive/` folder. Do not comment it out in active files.
*   **VERIFICATION**: Before deleting "trash", verify 3 times it is not imported anywhere.

---

## ⏳ MODULE 6: TEMPORARY MEASURES (TIME-BOMB)

### [SCHEDULED CLEANUP]
*   **REMOVE CACHE KILLER**: The script in `src/views/home.ts` forces Service Worker unregistration (`registration.unregister()`) on every load.
    *   **STATUS**: ACTIVE (Deployed 2025-12-18).
    *   **GOAL**: Kill "Zombie Cache" causing DNS/Regex bugs on mobile.
    *   **DUE DATE**: 2025-12-25 (1 week post-deploy).
    *   **ACTION**: Remove the block to restore proper PWA Offline/Caching capabilities.

## ⬜ MODULE 8: THE HUMAN-AI ALLIANCE (SURVIVAL MANIFESTO)

### [THE "COCAINE INTERN" RULE]
*   **FACT**: AI codes fast but lacks foresight. It creates "Spaghetti Code" at industrial speed.
*   **ACTION**: Never let AI stack code without auditing "trash" (logs, dead services, obese images).
*   **LAW**: Regular cleanup is not a chore; it is a survival condition to prevent server drowning.

### [THE FREIGHT TRAIN DEPLOYMENT]
*   **CONSTRAINT**: Sandbox RAM is limited.
*   **FORBIDDEN**: `npm run build` (Global) causes crashes.
*   **MANDATORY**: Use sequential script `scripts/deploy-prod.sh` (Client -> Pause -> Messenger -> Pause -> Backend).
*   **MANTRA**: "Better slow and reliable than fast and crashed."

### [FEATURE FREEZE PROTOCOL]
*   **TRIGGER**: When it works, STOP.
*   **SABOTAGE**: Adding a "cool feature" the night before launch is forbidden.
*   **MODE**: **INDUSTRIAL STABILITY**. Core only.

### [NO BULLSHIT POLICY]
*   **OBLIGATION**: AI must state hard truths (RAM limits, bugs, risks).
*   **BAN**: Hiding dust under the carpet to please the user.

---

## 🏁 END OF KERNEL
