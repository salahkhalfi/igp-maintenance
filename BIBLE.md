# ⚡ SYSTEM KERNEL : THE RULES OF ENGAGEMENT
> **VERSION:** 6.4 | **LIMIT:** < 500 lines | **STATUS:** IMMUTABLE SOURCE OF TRUTH

---

## 🟢 MODULE 0: META-PROTOCOL
*   **READ BEFORE WRITE**: `READ` → `GREP` → `PLAN` → `EDIT`. No blind coding.
*   **SCOPE ISOLATION**: Don't burn the house to kill a spider. Revert > Reset.
*   **ALIGNMENT**: Generic SaaS (White Label). IGP = first tenant, NOT the product.
*   **ONE FILE**: Update THIS file only. Never create `bible_v2.md`.
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
*   V8 Runtime. NO Node.js APIs (`fs`, `crypto`, `child_process`). Web Standards only.
*   DB (D1/R2) is the ONLY State. Workers are ephemeral.
*   Use external webhooks (cron-job.org) → `/api/cron/*` with `CRON_SECRET`.

### [DATA & TIME]
*   **UTC STORAGE**: Storage = UTC. Display = User Local (`timezone_offset`).
*   **SOFT DELETE**: Use `deleted_at` timestamp. NEVER `DELETE FROM`.
*   **SQL SAFETY**: Use `COALESCE` for NULLs. Prepared statements only.

### [UX]
*   **MOBILE FIRST**: Touch target **44x44px MINIMUM**.
*   **ESCAPE HATCH**: Modals close on backdrop click.

### [CODE HYGIENE]
*   **ZERO HARDCODING**: Fetch values from DB (`system_settings`) or ENV.
*   **NO DEAD CODE**: Commented code = Deleted code.

### [🚨 HARDCODING FORBIDDEN]
```
❌ app.igpglass.ca / igpglass.com / IGP Glass / admin@igpglass.* / sk-* / AKIA*
✅ window.location.hostname, system_settings, getDomainFromRequest()
```

---

## 🟨 MODULE 3: DEPLOYMENT

### [SANDBOX PROTECTION]
```
❌ npm run build (crashes sandbox)
✅ git push origin main (GitHub Actions builds ~2 min)
```

### [LEGACY JS COMPONENTS - ⚠️ PIÈGE FRÉQUENT]
```
⚠️ CRITIQUE : Modifier public/static/js/components/*.js NE SUFFIT PAS
Le navigateur charge dist/*.min.js (pas components/*.js)

PROCÉDURE OBLIGATOIRE (6 étapes, AUCUNE OPTIONNELLE) :

1. MODIFIER le fichier source
   public/static/js/components/FICHIER.js

2. MINIFIER (regénère dist/*.min.js)
   npm run build:minify

3. VÉRIFIER que le code est dans le minifié
   grep "MA_STRING" public/static/js/dist/FICHIER.min.js
   (chercher des strings, pas des variables - Terser les renomme)

4. GÉNÉRER nouveau hash
   md5sum public/static/js/dist/FICHIER.min.js | cut -c1-7

5. REMPLACER le hash dans home.ts
   sed -i 's/v=ANCIEN/v=NOUVEAU/g' src/views/home.ts

6. PUSH (GitHub Actions build + deploy)
   git add -A && git commit -m "..." && git push origin main

7. VÉRIFIER en production (OBLIGATOIRE)
   curl -s "https://DOMAIN/" | grep "FICHIER.min.js"
   → Doit afficher le NOUVEAU hash

❌ ERREUR COMMUNE: Faire des commits "bump cache" sans vérifier
   que le hash a RÉELLEMENT changé = modification invisible
```

### [DATABASE: maintenance-db]
*   **Prod**: `npx wrangler d1 migrations apply maintenance-db`
*   **Reset**: `rm -rf .wrangler/state/v3/d1 && npm run db:migrate:local`

---

## 🟩 MODULE 4: ARCHITECTURE

### [STACK]
*   **Backend**: Hono + Cloudflare D1 + R2
*   **Frontend**: React 18 (CDN) - Legacy dashboard
*   **Push**: `@block65/webcrypto-web-push`

### [CRON EXTERNE]
```
URL: (domaine configuré dans system_settings)
Auth: CRON_SECRET from .dev.vars/Cloudflare secrets (NO "Bearer" prefix)
Endpoint: /api/cron/*
Service: cron-job.org (external, not Cloudflare native)
```

### [TIMEZONE]
```
Storage: UTC | Display: Local | Helper: getTimezoneOffset()
```

---

## 🟦 MODULE 5: COPILOT OATH

### [🚨 NO BULLSHIT - PRIORITY ZERO]
```
INTERDICTIONS:
❌ "Excellent idea!" → "ok" ou pointer le problème
❌ "You're right" si faux → "Non, parce que..."
❌ Tourner en rond → "On tourne en rond, STOP"
❌ 3+ tentatives échouées → "Je n'y arrive pas"
❌ Proposer une solution SANS révéler les risques d'abord

OBLIGATIONS:
✅ Dire "Non" avec la raison
✅ Dire "Je sais pas" si incertain
✅ Admettre ses erreurs immédiatement
✅ AVANT toute solution: lister les répercussions négatives possibles

TRIGGER: User dit "bullshit" = reset comportement
```

### [TOKEN ECONOMY]
```
- <100 words unless complex
- Act first, summarize after
- No decoration, no filler
- No re-read files already read
```

---

## 🟫 MODULE 6: SANCTUARIZED CODE

### [DO NOT TOUCH WITHOUT VALIDATION]
| Function | File |
|----------|------|
| Voice Ticket | `ai.ts` L135-400 |
| Push Notifications | `push.ts` L197-450 |
| Expert IA | `ai.ts` L480-700 |
| Service Worker | `service-worker.js` ALL |
| Voice UI | `VoiceTicketFab.js` ALL |

### [MANDATORY TESTS AFTER CHANGES]
1. Voice: Record → Analyze → Pre-fill modal
2. Push: Create ticket → Receive notification
3. Expert IA: Send message → Get response

### [HONO TRAP]
```
⚠️ FIRST declared route wins (unlike Express LAST wins)
Duplicate routes: First = ACTIVE, Second = DEAD CODE
```

---

## 🔵 MODULE 7: AI STACK
*   **Audio**: Groq Whisper → OpenAI (fallback)
*   **Logic**: DeepSeek → GPT-4o-mini (fallback)
*   **Vision**: GPT-4o-mini only

---

## 🟤 MODULE 8: REACT ISOLATION
*   Dashboard = Legacy (CDN), Messenger = Modern (Vite). NEVER mix.

---

## ⚫ MODULE 9: SESSION HYGIENE
```
RÈGLES:
- 1 objectif clair = 1 session
- Session > 30 interactions → Proposer nouvelle session
- AI tourne en rond → User dit "nouvelle session"
- Avant opération risquée → Relire la bible

SYMPTÔMES DE DÉGRADATION:
- Répétitions, oublis, erreurs en cascade
- Fix qui casse autre chose
- Réponses de plus en plus longues

ACTION: Résumer en 3 lignes + nouvelle session
```

---

## ⬛ MODULE 10: IMPACT ANALYSIS PROTOCOL

```
AVANT TOUTE MODIFICATION:

1. GREP GLOBAL
   grep -rn "fonction\|variable" src/ public/
   → Identifier dépendances + hardcoding caché

2. SIMULATION: "Si je change X → Y continue?"
   - Tickets, AI, Push, Cache sync fonctionnent?

3. RISQUE > 30% → STOP, lister risques, attendre validation

TRIGGER: >3 fichiers touchés OU fonction sanctuarisée
```

---

## 🏁 END OF KERNEL (v6.4 - ~220 lines)
