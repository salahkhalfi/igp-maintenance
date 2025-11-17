# 🎯 LESSONS-LEARNED-CORE (AI-Optimized)

**Version:** 1.0.0  
**Format:** Décisionnel rapide  
**Parse time:** <1s  
**Size:** ~8KB vs 42KB

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
   Before ANY file modification:
   Read → Grep → Identify → Edit
   
2. TOKEN_ECONOMY
   Response format: Action + Command + Link
   Never >50 lines without explicit request
   
3. DEPLOYMENT_DETECT
   "update" → build + deploy (0 questions)
   "new" → full setup (auth required)
   
4. NO_NODE_IN_WORKERS
   Cloudflare Workers = Web APIs only
   fs/path/process → FORBIDDEN
   
5. NO_MEMORY_STATE
   Serverless = stateless
   Use: D1/KV/R2, Never: global vars
```

---

## 🟡 CHECKS OBLIGATOIRES (avant commit/deploy)

```
□ Template literals (apostrophes)
□ Migrations applied (after clean)
□ No N+1 queries (JOINs/IN)
□ Contrast ≥4.5:1 (UI text)
□ No trailing whitespace
□ Build passes
□ Tests exist
```

---

## 🔵 DECISION TREES (flow rapide)

### Modification Request

```
User: "Modify X"
  ↓
Read X exists? → NO → Grep similar → Found? → YES → Use existing
  ↓                ↓                    ↓
 YES              Create new          NO → Create new
  ↓                                    
Read full file
  ↓
Identify exact lines
  ↓
Edit minimal
  ↓
Test immediately
```

### Deployment Request

```
User: "Deploy" / "Update production"
  ↓
Detect keywords: update/push/deploy?
  ↓                    ↓
 YES                  NO (new/create/first)
  ↓                    ↓
UPDATE               NEW
  ↓                    ↓
npm run build        setup_cloudflare_api_key
wrangler deploy      create project
                     configure DB
                     deploy
```

### Error Handling

```
Error occurs
  ↓
In LESSONS-LEARNED? → YES → Apply documented solution
  ↓                           ↓
 NO                         Done ✓
  ↓
Search codebase
Debug
Document solution
Update LESSONS
```

---

## 🟢 PATTERNS VALIDÉS (copy-paste safe)

### Apostrophes (Category 1)

```javascript
❌ 'C'est cassé'
✅ `C'est correct`
```

### DB Migrations (Category 2)

```bash
# After rm -rf .wrangler OR git clone
npx wrangler d1 migrations apply DB_NAME --local
npx wrangler d1 execute DB_NAME --local --file=seed.sql
```

### Serverless State (Category 4)

```javascript
❌ let cache = {}
✅ await c.env.DB.prepare('SELECT * FROM cache').all()
```

### N+1 Prevention (Category 7)

```javascript
❌ for (user of users) { posts = await db.query(...) }
✅ posts = await db.query('WHERE user_id IN (?)', userIds)
```

### Deployment Update (Category 8)

```bash
npm run build
npx wrangler pages deploy dist --project-name PROJECT
```

### Token Economy (Category 9)

```
Q: "Deploy?"
A: npm run build && wrangler deploy
   Result: https://...
   
NOT: [500 lines explanation]
```

### READ_FIRST (Category 10)

```
BEFORE any Edit:
1. Read [file]
2. Grep [feature]
3. if exists → use
4. if not → Edit precise
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
    │ Check LAWS   │ (5 absolutes)
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
□ 5 absolute laws active
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
CORE v1.0.0 = UNIVERSAL v1.3.0

Update both when:
- New absolute law added
- Critical pattern changed
- Major category added
```

---

---

## 📝 MAINTENANCE (for AI updating this file)

### Adding New Lesson

```
New lesson learned
    ↓
Is it ABSOLUTE? (non-negotiable, always apply)
    ↓ YES                        ↓ NO
Add to LOIS ABSOLUES        Is it VALIDATED pattern?
    ↓                            ↓ YES              ↓ NO
Increment law number        Add to PATTERNS    Add to QUICK REF
                                ↓
                        Is it workflow/decision?
                                ↓ YES
                        Add DECISION TREE
```

### Format Rules

```
✅ DO:
- Decision tree (workflow)
- Code snippet (1 example max)
- 1-liner rule
- Symptom → Solution

❌ NEVER:
- Long explanations
- Multiple examples
- Historical context
- Verbose philosophy
- Duplicate info
```

### Update Checklist

```
□ New content ≤10 lines
□ Visual format (tree/table/code)
□ No duplication
□ Actionable (not theory)
□ Test: Can AI parse in <1s?
```

### File Size Limit

```
CORE must stay: <10KB
If >10KB: Remove redundancy, not content
Priority: Speed > Completeness
```

---

**END OF CORE REFERENCE**

Parse time: <1s | Apply: Immediate | Impact: Maximum
