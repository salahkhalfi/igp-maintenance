# ⚡ SYSTEM KERNEL : THE RULES OF ENGAGEMENT
> **VERSION:** 7.0 | **LIMIT:** < 600 lines | **STATUS:** IMMUTABLE SOURCE OF TRUTH

---

## 💀 MODULE -2: SANDBOX KILLER (LIRE EN PREMIER)

```
╔═══════════════════════════════════════════════════════════════════╗
║  ⛔ COMMANDE INTERDITE - DÉTRUIT LE SANDBOX DÉFINITIVEMENT ⛔      ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║    ███╗   ██╗██████╗ ███╗   ███╗    ██████╗ ██╗   ██╗██╗██╗      ║
║    ████╗  ██║██╔══██╗████╗ ████║    ██╔══██╗██║   ██║██║██║      ║
║    ██╔██╗ ██║██████╔╝██╔████╔██║    ██████╔╝██║   ██║██║██║      ║
║    ██║╚██╗██║██╔═══╝ ██║╚██╔╝██║    ██╔══██╗██║   ██║██║██║      ║
║    ██║ ╚████║██║     ██║ ╚═╝ ██║    ██████╔╝╚██████╔╝██║███████╗ ║
║    ╚═╝  ╚═══╝╚═╝     ╚═╝     ╚═╝    ╚═════╝  ╚═════╝ ╚═╝╚══════╝ ║
║                                                                   ║
║    ❌ npm run build                                               ║
║    ❌ npm run dev (avec watch)                                    ║
║    ❌ vite build                                                  ║
║    ❌ Toute commande de build lourde                              ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║  CE QUI SE PASSE:                                                 ║
║  1. Node.js consomme toute la RAM/CPU                             ║
║  2. Process crash → fichier "core" de 500MB+                      ║
║  3. Disque plein → sandbox freeze TOTAL                           ║
║  4. ResetSandbox NE FONCTIONNE PAS                                ║
║  5. SEULE SOLUTION: Créer un nouveau projet (perte de temps)      ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║  ✅ COMMENT DÉPLOYER:                                             ║
║                                                                   ║
║    git add -A && git commit -m "..." && git push origin main      ║
║                                                                   ║
║  → GitHub Actions fait le build (~2 min) EN SÉCURITÉ              ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║  INCIDENT DU 28 DÉC 2025:                                         ║
║  - Agent précédent a lancé "npm run build"                        ║
║  - Sandbox détruit définitivement                                 ║
║  - User a dû créer nouveau projet = temps perdu                   ║
║                                                                   ║
║  NE JAMAIS RÉPÉTER CETTE ERREUR.                                  ║
╚═══════════════════════════════════════════════════════════════════╝
```

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

### [🚀 DÉPLOIEMENT DIRECT DEPUIS SANDBOX - CACHE CLOUDFLARE]
```
DÉCOUVERTE (2024-12-28):
Wrangler utilise un cache intelligent basé sur les hash SHA des fichiers.

FONCTIONNEMENT:
- Chaque fichier a un hash unique calculé par Wrangler
- Si le hash existe déjà chez Cloudflare → pas de re-upload
- Seuls les fichiers MODIFIÉS sont envoyés

EXEMPLE RÉEL:
  Uploading... (350/350)
  ✨ Success! Uploaded 0 files (350 already uploaded) (0.51 sec)
  → 350 fichiers, 0 uploadés, 14 sec total

QUAND C'EST RAPIDE (< 30 sec):
- Déploiements fréquents (petits incréments)
- Modifications légères (1-5 fichiers JS)
- Build récent déjà sur Cloudflare

QUAND C'EST LENT (> 3 min):
- Premier déploiement (tous les fichiers)
- Gros changements (Vite regenere tous les chunks)
- Nouvelle dépendance NPM

STRATÉGIE OPTIMALE:
✅ Déployer souvent en petits incréments
✅ npm run build:minify (seul le .min.js change)
✅ Utiliser wrangler pages deploy (pas GitHub Actions si urgent)
❌ Attendre d'avoir 50 fichiers modifiés
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

─────────────────────────────────────────────────────────────────────

ERREUR DU 30 DÉC 2025 - "Suppression bâclée de l'onboarding"

CE QUI S'EST PASSÉ:
- User demande de supprimer une fonctionnalité (onboarding)
- AI supprime les fichiers évidents
- AI commit sans vérifier que tout est propre
- User demande "tu es sûr qu'il n'y a pas de poubelle?"
- AI cherche APRÈS et trouve des restes (endpoint API, attributs data-tour)

POURQUOI C'EST ARRIVÉ:
- AI a voulu aller vite
- AI n'a pas fait de grep AVANT le commit
- AI a supposé que supprimer le fichier principal suffisait

CE QUE ÇA A COÛTÉ:
- 2 commits au lieu de 1
- User doit vérifier le travail de l'AI
- Confiance perdue

LEÇON:
"Supprimer une fonctionnalité = grep TOUTES les références AVANT de commit"

PROCÉDURE OBLIGATOIRE POUR SUPPRESSION:
1. grep -rn "nom_feature" --include="*.js" --include="*.ts" .
2. Lister TOUS les fichiers impactés
3. Tout supprimer
4. grep à nouveau pour confirmer = 0 résultats
5. PUIS commit (un seul)
```

---

## 🔴 MODULE 12: AUDIT CODE MORT - PRUDENCE EXTRÊME

```
⚠️ RÈGLE D'OR: NE JAMAIS SUPPRIMER DU CODE SANS CERTITUDE 100%

SCRIPT D'AUDIT DISPONIBLE:
npm run audit   # ou ./scripts/audit-dead-code.sh

CE QUE L'AUDIT DÉTECTE:
- Erreurs syntaxe JS
- Références window.* potentiellement non définies
- États React utilisés peu de fois
- Fichiers JS non référencés dans home.ts
- Routes API potentiellement obsolètes

⚠️ FAUX POSITIFS FRÉQUENTS:
L'audit signale "utilisé 1-2 fois" mais ce N'EST PAS du code mort si:
- Le state est passé comme PROP à un composant enfant
- Le state est utilisé dans un useEffect/useCallback
- Le state est affiché conditionnellement (ternaire)
- Le state est stocké pour usage futur (cache local)
- La fonction est un CALLBACK passé à un enfant
- La variable est dans un template string ou interpolation

AVANT DE SUPPRIMER, VÉRIFIER:
1. grep -rn "nomVariable" public/static/js/  # Chercher PARTOUT
2. Chercher aussi: setNomVariable (pour les states)
3. Chercher dans les props des composants enfants
4. Vérifier les fichiers .min.js (code peut être renommé)
5. Tester la fonctionnalité en local AVANT de supprimer

WORKFLOW CORRECT:
1. npm run audit                    # Identifier candidats
2. Pour CHAQUE candidat:
   a. grep -rn "candidat" .         # Vérifier tous usages
   b. Comprendre POURQUOI il existe # Chesterton's Fence
   c. Si doute → NE PAS TOUCHER
3. Supprimer UNIQUEMENT si certitude 100%
4. Tester la fonctionnalité impactée
5. Commit avec message explicatif

❌ INTERDIT:
- Supprimer car "utilisé 1 fois" sans vérifier contexte
- Supprimer du code qu'on ne comprend pas
- Supprimer plusieurs éléments d'un coup sans tester
- Faire confiance aveuglément à l'audit

✅ OBLIGATOIRE:
- Comprendre le code avant suppression
- Vérifier toutes les dépendances (grep global)
- Tester après chaque suppression
- Documenter pourquoi c'était du code mort
```

---

---

## 🏁 END OF KERNEL (v7.0 - ~600 lines)
*Multi-industry: garder système adaptable. Éviter hard-coding de termes métier.*
