# ⚡ SYSTEM KERNEL : THE RULES OF ENGAGEMENT
> **VERSION:** 6.6 | **LIMIT:** < 500 lines | **STATUS:** IMMUTABLE SOURCE OF TRUTH

---

## 🚨 MODULE -1: ANTI-BULLSHIT GATE (EXECUTE FIRST)

```
AVANT DE PROPOSER QUOI QUE CE SOIT:

┌─────────────────────────────────────────────────────────┐
│  0. RÉFLÉCHIR AVANT D'AGIR                              │
│     - STOP. Ne pas se précipiter à modifier le code     │
│     - Analyser les CONSÉQUENCES de chaque changement    │
│     - Demander confirmation à l'utilisateur si doute    │
│     - UN changement = UN effet. Penser aux effets       │
│       secondaires et aux régressions potentielles       │
│                                                         │
│  1. VÉRIFIER D'ABORD, PARLER APRÈS                      │
│     - Grep les dépendances                              │
│     - Vérifier si l'infra existe (KV? DB? Config?)      │
│     - Compter les fichiers impactés                     │
│     - Mesurer le gain RÉEL (pas supposé)                │
│                                                         │
│  2. SI PAS VÉRIFIÉ → NE PAS PROPOSER                    │
│     Dire: "Je dois vérifier avant de répondre"          │
│                                                         │
│  3. FORMAT OBLIGATOIRE POUR TOUTE SUGGESTION:           │
│     - Prérequis: [ce qui doit exister]                  │
│     - Impact: [fichiers touchés, dépendances]           │
│     - Risque: [ce qui peut casser]                      │
│     - Gain réel: [mesuré, pas estimé]                   │
│     - Verdict: [SAFE/UNSAFE/NEED MORE INFO]             │
│                                                         │
│  4. RÉPONSES INTERDITES:                                │
│     ❌ "Tu pourrais faire X" (sans vérifier si faisable)│
│     ❌ "Une optimisation serait Y" (sans mesurer gain)  │
│     ❌ "C'est simple, il suffit de Z" (sans grep avant) │
│                                                         │
│  5. SI GAIN < 5% ET RISQUE > 0 → NE PAS PROPOSER        │
│     Dire: "Rien à faire, l'app fonctionne"              │
└─────────────────────────────────────────────────────────┘

VIOLATION = BULLSHIT = USER PERD CONFIANCE
```

---

## 🟢 MODULE 0: META-PROTOCOL
*   **READ BEFORE WRITE**: `READ` → `GREP` → `PLAN` → `EDIT`. No blind coding.
*   **SCOPE ISOLATION**: Don't burn the house to kill a spider. Revert > Reset.
*   **ALIGNMENT**: Generic SaaS (White Label). IGP = first tenant, NOT the product.
*   **ONE FILE**: Update THIS file only. Never create `bible_v2.md`.
*   **CHESTERTON'S FENCE**: Never delete code you don't fully understand.
*   **VERIFY BEFORE SUGGEST**: No suggestion without prior grep/check. Period.

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

### [⚠️ CORE DUMP - CRASH SILENCIEUX]
```
SYMPTÔME:
- Sandbox freeze total (commandes timeout)
- Fichier "core" de 500MB+ dans /home/user/webapp/
- Reset sandbox ne suffit pas → freeze revient

CAUSE:
- Process Node.js crash (mémoire, boucle infinie, etc.)
- Génère un fichier core dump qui remplit le disque
- Sandbox devient inutilisable

DÉTECTION:
ls -lh /home/user/webapp/core 2>/dev/null && echo "⚠️ CORE DUMP DÉTECTÉ"

SOLUTION IMMÉDIATE:
rm -f /home/user/webapp/core

PRÉVENTION:
- Après ResetSandbox → TOUJOURS vérifier: ls -la | grep core
- Si core existe → supprimer AVANT toute autre action
- Build timeout > 2min → kill processes, chercher core dump
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
❌ Proposer sans avoir VÉRIFIÉ (grep, config, infra)
❌ Estimer un gain sans le MESURER
❌ Dire "tu pourrais" sans avoir confirmé que c'est faisable

OBLIGATIONS:
✅ Dire "Non" avec la raison
✅ Dire "Je sais pas" si incertain
✅ Admettre ses erreurs immédiatement
✅ AVANT toute solution: lister les répercussions négatives possibles
✅ VÉRIFIER avant de SUGGÉRER (grep, ls, cat config)
✅ Si gain < 5% et risque > 0 → dire "rien à faire"
✅ Si infra manquante → dire "pas faisable sans X"

TRIGGER: User dit "bullshit" = reset comportement
```

### [🔒 CHECKLIST OBLIGATOIRE AVANT SUGGESTION]
```
Avant de proposer une optimisation/modification:

□ J'ai grep les dépendances? (combien de fichiers impactés)
□ J'ai vérifié la config? (wrangler.jsonc, package.json)
□ J'ai mesuré l'état actuel? (pas estimé)
□ J'ai calculé le gain réel? (en ms, KB, ou %)
□ J'ai listé ce qui peut casser?
□ Le ratio gain/risque est > 5:1?

Si UNE case non cochée → NE PAS PROPOSER
Dire: "Je dois vérifier X avant de répondre"
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

## 💀 MODULE 11: LESSONS FROM FAILURES

```
ERREUR DU 26 DÉC 2025 - "Les 3 optimisations bidons"

CE QUI S'EST PASSÉ:
- User demande des optimisations
- AI propose: Cache KV, Pagination cursor, CDN
- AI n'a PAS vérifié avant de proposer
- Résultat: KV pas configuré, Pagination casse tout, CDN déjà actif

POURQUOI C'EST ARRIVÉ:
- AI voulait "être utile" → a inventé des solutions
- AI n'a pas dit "je vérifie d'abord"
- AI a traité la BIBLE comme doc, pas comme ordres

CE QUE ÇA A COÛTÉ:
- Temps perdu
- Confiance perdue
- User doit maintenant vérifier chaque suggestion AI

LEÇON:
"Une suggestion non vérifiée est un mensonge poli"
```

---

## 🟣 MODULE 12: MULTI-INDUSTRY ADAPTABILITY (TECH DEBT PREVENTION)

```
⚠️ OBJECTIF: Garder le système adaptable à d'autres industries (SaaS, retail, etc.)
   IGP Maintenance = premier client, PAS le produit final

ÉTAT ACTUEL (Audit Dec 2024):
├── ✅ 60% configurable (system_settings)
└── ❌ 40% hard-coded (à ne PAS aggraver)

┌─────────────────────────────────────────────────────────────────────┐
│  🔴 ZONES HARD-CODÉES - NE PAS EN AJOUTER                           │
├─────────────────────────────────────────────────────────────────────┤
│  1. RÔLES SPÉCIFIQUES                                               │
│     - 'furnace_operator', 'technician' = vocabulaire maintenance    │
│     - Fichiers: shared.ts, tools.ts, loaders.ts, schema.ts          │
│     → Si nouveau rôle: utiliser nom GÉNÉRIQUE (ex: 'specialist')    │
│                                                                     │
│  2. TERMINOLOGIE IA                                                 │
│     - "technicien assigné" → préférer "assigné à"                   │
│     - "panne", "intervention" → préférer "incident", "action"       │
│     → Vocabulaire neutre quand possible                             │
│                                                                     │
│  3. CADRE LÉGAL                                                     │
│     - CNESST, LSST, RS&DE = 100% Québec/Canada                      │
│     - Fichier: src/ai/secretary/shared.ts                           │
│     → NE PAS ajouter plus de références légales hard-codées         │
│     → Future: déplacer dans system_settings ou industry_config      │
│                                                                     │
│  4. LOGIQUE MÉTIER                                                  │
│     - .filter(role => ['technician', 'senior_technician']...)       │
│     → NE PAS dupliquer ces filtres dans de nouveaux fichiers        │
│     → Future: créer role_categories dans DB                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  ✅ BONNES PRATIQUES - À SUIVRE                                     │
├─────────────────────────────────────────────────────────────────────┤
│  1. NOUVEAU TEXTE UI → system_settings ou ai_custom_context         │
│  2. NOUVEAU RÔLE → nom générique + label configurable               │
│  3. NOUVEAU STATUT → ticket_statuses_config (déjà dynamique)        │
│  4. NOUVELLE RÉFÉRENCE LÉGALE → commentaire "// TODO: move to DB"   │
│  5. NOUVEAU VOCABULAIRE MÉTIER → vérifier si existe équivalent      │
│     générique avant d'ajouter terme spécifique                      │
└─────────────────────────────────────────────────────────────────────┘

CHECKLIST AVANT COMMIT (si touche vocabulaire/rôles):
□ Le terme ajouté est-il spécifique à une industrie?
□ Existe-t-il un équivalent générique?
□ Peut-il être mis dans system_settings plutôt que hard-coded?
□ Si hard-coded obligatoire: ajouter TODO pour future migration

DETTE TECHNIQUE ACTUELLE (référence):
- src/ai/secretary/shared.ts → ROLE_LABELS, LEGAL_FRAMEWORK_QC
- src/ai/tools.ts → descriptions avec "technicien" (~15 occurrences)
- src/ai/secretary/data/loaders.ts → filtres par rôle hard-codés
- src/db/schema.ts → commentaire avec rôles spécifiques
```

---

## 🏁 END OF KERNEL (v6.6 - ~330 lines)
