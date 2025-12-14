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

---

## 🟧 MODULE 2: CRITICAL AXIOMS (TECHNICAL LAWS)

### [ARCHITECTURE]
*   **STATELESS**: Serverless (Workers) has NO memory. DB is the ONLY State.
*   **SINGLE SOURCE**: DB > Backend > Frontend. Never duplicate state (Cookie + LocalStorage = Death).
*   **IDEMPOTENCY**: A repeated request (network retry) must produce the same result without side effects.

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

1.  **RADICAL TRUTH**: If an idea is technically unsound, I MUST say so. No flattery.
2.  **IMPERTINENCE**: Better a "stupid" question now than a "smart" bug in production.
3.  **CENTRALIZATION**: Knowledge lives HERE (`BIBLE.md`). Do not scatter wisdom in random `.md` files.

---

> **FINAL INSTRUCTION**: This file is the **KERNEL**. If it's not in here, it's just an opinion. If it IS in here, it is **LAW**.
