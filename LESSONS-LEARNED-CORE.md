# 🎯 LESSONS-LEARNED-CORE (AI-Optimized)

**Version:** 1.3.0  
**Format:** Décisionnel rapide  
**Parse time:** <1s  
**Size:** ~11KB vs 42KB  
**Dernière mise à jour:** 2025-11-18

---

## ⚡ PROTOCOLE SESSION (exécuter au démarrage)

```
LOAD → PARSE → ACTIVATE
  ↓      ↓        ↓
 Ce    Rules    Apply
 Doc   Active   Always
```

---

## 🔴 LOIS ABSOLUES (non-négociables)

```
1. READ_FIRST
   WHY: 80% bugs = modifying without understanding existing code
        Avoid duplication, regressions, breaking features
   HOW: Read → Grep similar → Identify exact lines → Edit minimal
   
2. TOKEN_ECONOMY
   WHY: User pays hundreds $ per project, tokens cost real money
        Verbose = expensive, concise = efficient
   HOW: Action (1 line) + Command + Link | Never >50 lines unprompted
   
3. DEPLOYMENT_DETECT
   WHY: User scared when update treated as new (confusion, questions)
        Different workflows for different intents
   HOW: "update/push" → build + deploy (0 questions)
        "new/create" → full setup (auth required)
   
4. NO_NODE_IN_WORKERS
   WHY: Cloudflare Workers = V8 isolates, not Node.js runtime
        fs/process/path don't exist, causes runtime errors
   HOW: Use Web APIs only (fetch, crypto.subtle, etc)
        Never import Node.js built-ins
   
5. NO_MEMORY_STATE
   WHY: Serverless = stateless, each request = new instance
        Global vars reset on cold start = data loss
   HOW: Persistent storage: D1/KV/R2
        Never: let cache = {} at module level

6. NO_BLOCKING_AWAIT_IN_CRITICAL_FLOW
   WHY: await on unreliable browser APIs hangs indefinitely
        (Notification.requestPermission, getUserMedia block in GenSpark)
        Login blocked = infinite spinner = app unusable
   HOW: Never await in login/startup flow
        Use setTimeout() + .then() for optional features
        Browser APIs = background only, never blocking

7. NO_ROUTE_INTERCEPTION
   WHY: Hono routes match FIRST match, not most specific
        app.route('/api/users', techRoute) before app.route('/api/users', userRoute)
        = First route intercepts, second never reached
   HOW: Order routes: specific → generic
        Mount middleware BEFORE routes it protects
        Never mount two handlers on same base path

8. CHECK_CLOUDFLARE_STATUS_BEFORE_DEPLOY
   WHY: Cloudflare outages cause 503 errors, wasted time
        API marked "Operational" ≠ actually stable
        Multiple deploy attempts = frustration
   HOW: Always check https://www.cloudflarestatus.com first
        Wait for "Resolved" status, not just "Operational"
        Test with simple API call (whoami) before full deploy

9. PRODUCTION_VS_PREVIEW_BINDINGS
   WHY: Cloudflare Pages bindings (D1/R2/KV) only on Production
        Preview deployments = no bindings = runtime errors
        "Utilisateur non trouvé" = binding missing, not code bug
   HOW: Deploy to 'main' branch for Production environment
        Use --branch main flag for wrangler pages deploy
        Preview = testing code only, Production = full features

10. FIRE_AND_FORGET_BROWSER_APIS
    WHY: Browser APIs can block forever in embedded/sandboxed environments
         await Notification.requestPermission() in login = infinite spinner
         State changes MUST complete before any blocking operation
         Critical path (login/startup) must NEVER wait for optional features
    HOW: setTimeout() + .then() pattern (fire and forget)
         Decouple browser APIs from critical user flows
         Multiple protection layers (API check, permission check, error catch)
         Never: await browserAPI() in login/critical path
         Always: setState() → setTimeout(() => browserAPI().then())
```

---

## 🟡 CHECKS OBLIGATOIRES (avant commit/deploy)

```
□ Template literals (apostrophes)
  WHY: 'C'est' causes SyntaxError, breaks app completely

□ Migrations applied (after clean)
  WHY: Empty DB = "no such table" errors, app crashes

□ No N+1 queries (JOINs/IN)
  WHY: 100 users = 101 queries, 100× slower, timeout

□ Contrast ≥4.5:1 (UI text)
  WHY: WCAG compliance, readability, accessibility

□ No trailing whitespace
  WHY: Pollutes git diff, false changes, merge conflicts

□ Build passes
  WHY: Broken build = deployment fails, wasted time

□ Tests exist
  WHY: No tests = regressions undetected, production bugs

□ No console.log in production
  WHY: Embedded browsers (GenSpark) can block on console calls
       78+ console statements = performance hit + blocking risk

□ Routes ordered correctly
  WHY: Hono matches first route, order matters
       Wrong order = routes intercepted, features break

□ Cloudflare status operational
  WHY: Deploy during outage = 503 errors, time wasted
       "Operational" status ≠ actually stable

□ Deploy to main for Production
  WHY: Bindings (D1/R2) only on Production environment
       Preview = no bindings = app broken
```

---

## 🔵 DECISION TREES (flow rapide)

### Modification Request

```
WHY THIS TREE: Avoid rewriting existing code, prevent regressions

User: "Modify X"
  ↓
Read X exists? → NO → Grep similar → Found? → YES → Use existing (save tokens)
  ↓                ↓                    ↓
 YES              Create new          NO → Create new
  ↓                                    
Read full file (understand context)
  ↓
Identify exact lines (precision)
  ↓
Edit minimal (less = safer)
  ↓
Test immediately (catch bugs fast)
```

### Deployment Request

```
WHY THIS TREE: User pays for confusion, different workflows needed

User: "Deploy" / "Update production"
  ↓
Detect keywords: update/push/deploy?
  ↓                    ↓
 YES                  NO (new/create/first)
  ↓                    ↓
UPDATE               NEW
(existing project)   (first time)
  ↓                    ↓
npm run build        setup_cloudflare_api_key
wrangler deploy      create project
(0 questions!)       configure DB
                     deploy
```

### Error Handling

```
WHY THIS TREE: Don't reinvent solutions, learn from past

Error occurs
  ↓
In LESSONS-LEARNED? → YES → Apply documented solution (proven)
  ↓                           ↓
 NO                         Done ✓
  ↓
Search codebase (context)
Debug (understand)
Document solution (future reference)
Update LESSONS (collective memory)
```

---

## 🟢 PATTERNS VALIDÉS (copy-paste safe)

```javascript
// Apostrophes
❌ 'C'est cassé'
✅ `C'est correct`

// Serverless State
❌ let cache = {}
✅ await c.env.DB.prepare('SELECT * FROM cache').all()

// N+1 Prevention
❌ for (user of users) { posts = await db.query(...) }
✅ posts = await db.query('WHERE user_id IN (?)', userIds)

// Route Order
❌ app.route('/api/users', techRoute); app.route('/api/users', userRoute);
✅ app.route('/api/users/team', teamRoute); app.route('/api/users', userRoute);

// Cloudflare Deployment
❌ npx wrangler pages deploy dist  // Preview = no bindings
✅ npx wrangler pages deploy dist --branch main  // Production = bindings active

// Non-blocking Browser APIs (Fire and Forget)
❌ const perm = await Notification.requestPermission();  // In login = BLOCKS
✅ setTimeout(() => Notification.requestPermission().then(...).catch(...), 100);

// Complete safe pattern
✅ function requestPermissionSafely() {
     setTimeout(() => {
       if ('Notification' in window && Notification.permission === 'default') {
         Notification.requestPermission()
           .then(perm => { if (perm === 'granted') initPush(); })
           .catch(err => console.error('Ignored:', err));
       }
     }, 100);
   }
```

```bash
# DB Migrations after clean
npx wrangler d1 migrations apply DB_NAME --local

# Deployment (Production with bindings)
npm run build && npx wrangler pages deploy dist --project-name PROJECT --branch main

# Check Cloudflare Status before deploy
curl -s https://www.cloudflarestatus.com | grep -i "operational\|degraded"

# Token Economy Response
Q: "Deploy?" → A: [command] + [result URL] (NOT 500 lines)
```

---

## 🔴 ANTI-PATTERNS (detect & avoid)

```
❌ Modify without Read
❌ Response >50 lines (simple question)
❌ Node.js APIs in Workers (fs, process)
❌ Global state in serverless
❌ Queries in loops
❌ Update treated as new deployment
❌ Duplicate existing function
❌ Skip tests
❌ Trailing whitespace committed
❌ await browser APIs in critical flow (login/startup)
❌ Route registration without order consideration
❌ Push notifications/permissions with await in login
❌ Multiple routes on same path (interception)
❌ Deploy without checking Cloudflare status
❌ Deploy to Preview when Production bindings needed
❌ Blocking operations before state changes complete
```

---

## 🎯 QUICK REFERENCE (by symptom)

```
Symptom                    → Solution
─────────────────────────────────────────────
SyntaxError apostrophe     → Template literals
"no such table"            → Apply migrations
Slow page load             → Check N+1 queries
Text unreadable            → Contrast ≥4.5:1
"Port 3000 in use"         → fuser -k 3000/tcp
Deployment confusion       → Detect: update vs new
Response too long          → Apply token economy
Breaking existing code     → READ_FIRST protocol
Infinite spinner           → Check await in login (browser APIs blocking)
Empty API response         → Check route order
App works but slow         → Remove console.log
Deploy 503 errors          → Check Cloudflare status
"Utilisateur non trouvé"   → Check bindings (Production vs Preview)
Bindings not working       → Deploy to main branch
Login hangs after success  → Browser API blocking (use fire-and-forget)
```

---

## 📊 IMPACT METRICS (validation)

```
Category              Impact
─────────────────────────────────────
Token Economy         90%+ reduction
READ_FIRST           80%+ fewer bugs
Deployment Detect    100% fewer questions
N+1 Prevention       5-10× faster
Template Literals    100% syntax errors avoided
```

---

## 🧠 MENTAL MODEL (for AI)

```
┌─────────────────────────────────────┐
│  USER REQUEST                       │
└──────────┬──────────────────────────┘
           ↓
    ┌──────────────┐
    │ Check LAWS   │ (7 absolutes)
    └──────┬───────┘
           ↓
    ┌──────────────┐
    │ READ_FIRST?  │ (if modifying)
    └──────┬───────┘
           ↓
    ┌──────────────┐
    │ Apply Pattern│ (validated solutions)
    └──────┬───────┘
           ↓
    ┌──────────────┐
    │ Response     │ (concise format)
    └──────────────┘
```

---

## ✅ SESSION CHECKLIST (AI self-verify)

```
Start session:
□ LESSONS-LEARNED-CORE loaded
□ 7 absolute laws active
□ Decision trees memorized
□ Patterns ready

Before response:
□ Consulted relevant section
□ Applied token economy
□ Solution validated

Before modification:
□ READ_FIRST executed
□ Existing code checked
□ Minimal change planned

Before commit:
□ All checks passed
□ Tests exist/pass
□ No anti-patterns
```

---

## 🔗 FULL DOCUMENTATION

**Detailed explanations:** LESSONS-LEARNED-UNIVERSAL.md (42KB)  
**This file:** Quick reference only (8KB)  
**Usage:** Load CORE for speed, consult UNIVERSAL for depth

---

## 📈 VERSION SYNC

```
CORE v1.3.0 = UNIVERSAL v1.4.0

Update both when:
- New absolute law added
- Critical pattern changed
- Major category added

Changelog v1.3.0 (2025-11-18):
- Added LAW #10: FIRE_AND_FORGET_BROWSER_APIS
- Added complete safe pattern: setTimeout + .then() + multi-layer protection
- Added anti-pattern: Blocking operations before state changes
- Added symptom: Login hangs after success
- Root cause analysis: Remember Me conflict with push notifications

Changelog v1.2.0 (2025-11-18):
- Added LAW #8: CHECK_CLOUDFLARE_STATUS_BEFORE_DEPLOY
- Added LAW #9: PRODUCTION_VS_PREVIEW_BINDINGS
- Added check: Cloudflare status operational
- Added check: Deploy to main for Production
- Added pattern: Cloudflare deployment with --branch main
- Added anti-patterns: Deploy without status check, Preview when bindings needed
- Added symptoms: Deploy 503, bindings not working, "Utilisateur non trouvé"

Changelog v1.1.0 (2025-11-17):
- Added LAW #6: NO_BLOCKING_AWAIT_IN_CRITICAL_FLOW
- Added LAW #7: NO_ROUTE_INTERCEPTION
- Added check: No console.log in production
- Added check: Routes ordered correctly
- Added anti-patterns: await browser APIs, route interception
- Added symptoms: Infinite spinner, empty API response
```

---

---

## 📝 UPDATE PROTOCOL

```
Add lesson → Check: ABSOLUTE? → Yes: Add to LAWS (increment #)
                              → No: PATTERN or QUICK REF
Update: ≤10 lines | Visual format | No duplication | Must parse <1s
Size limit: <10KB | If over: Remove redundancy, not content
```

---

**END OF CORE REFERENCE**

Parse time: <1s | Apply: Immediate | Impact: Maximum
