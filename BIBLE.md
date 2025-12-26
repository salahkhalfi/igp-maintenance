# ⚡ SYSTEM KERNEL : THE RULES OF ENGAGEMENT
> **VERSION:** 6.2 | **LIMIT:** < 500 lines | **STATUS:** IMMUTABLE SOURCE OF TRUTH

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

### [LEGACY JS COMPONENTS]
```
⚠️ CRITIQUE : Modifier public/static/js/components/*.js NE SUFFIT PAS
Le navigateur charge dist/*.min.js (pas components/*.js)

PROCÉDURE OBLIGATOIRE :
1. npm run build:minify (rebuild dist/*.min.js)
2. Bumper ?v=xxx dans home.ts (nouveau hash)
3. git push origin main

OUBLI = Modification invisible en production (cache)
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
URL: app.igpglass.ca
Auth: cron_secret_igp_2025_webhook_notifications (NO "Bearer")
```

### [TIMEZONE]
```
Storage: UTC | Display: Local | Helper: getTimezoneOffset()
```

---

## 🟦 MODULE 5: BUSINESS MODEL

### [MODÈLE: INSTALLATION DÉDIÉE]
```
1 Client = 1 Instance Isolée (NO multi-tenant for now)
├── 1 GitHub Fork, 1 Cloudflare Pages, 1 D1, 1 R2, 1 Genspark Hub
├── Setup: $1,500 | Monthly: $99 | Real cost: ~$5/month
└── MULTI-TENANT: Only when 10+ clients
```

### [ONBOARDING]
```bash
# 1. Create Genspark Hub "[Client] Maintenance"
# 2. Fork repo, create Cloudflare resources
# 3. Configure system_settings + cron-job.org
# 4. Deploy & test
```

---

## 🟪 MODULE 6: COPILOT OATH

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

## 🟫 MODULE 7: SANCTUARIZED CODE

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

## 🔵 MODULE 8: AI STACK
*   **Audio**: Groq Whisper → OpenAI (fallback)
*   **Logic**: DeepSeek → GPT-4o-mini (fallback)
*   **Vision**: GPT-4o-mini only

---

## 🟤 MODULE 9: REACT ISOLATION
*   Dashboard = Legacy (CDN), Messenger = Modern (Vite). NEVER mix.

---

## ⚫ MODULE 10: SESSION HYGIENE
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

## ⬛ MODULE 11: IMPACT ANALYSIS PROTOCOL

```
⚠️ MANDATORY AVANT TOUTE MODIFICATION ⚠️

1. GREP GLOBAL (OBLIGATOIRE)
   grep -rn "fonction\|variable\|endpoint" src/ public/
   → Identifier TOUTES les dépendances
   → Chercher hardcoding caché

2. CARTOGRAPHIER IMPACTS
   Lister TOUS les fichiers affectés:
   - Fichier X lit cette valeur
   - Fichier Y appelle cette fonction
   - Fichier Z dépend de ce comportement
   - AI/Voice/Push utilisent cette logique

3. DÉTECTER HARDCODING
   - Valeurs en dur qui cassent si config change
   - Constantes dupliquées dans plusieurs fichiers
   - Defaults assumés dans logique métier

4. SIMULATION MENTALE
   "Si je change X → est-ce que Y continue?"
   - Création ticket fonctionne?
   - AI propose statuses valides?
   - Push notifications marchent?
   - Cache localStorage sync?

5. ÉVALUER RISQUES (%)
   Probabilité × Impact:
   - Critique (app cassée): 30%+ = STOP
   - Majeur (feature cassée): 50%+ = STOP
   - Mineur (UX dégradé): 70%+ = WARNING

6. SEUIL DE SÉCURITÉ
   SI risque total > 30% → ARRÊTER
   - Présenter analyse complète
   - Lister TOUS les risques
   - Attendre validation explicite

7. VALIDATION UTILISATEUR
   AVANT de coder:
   - Lister fichiers modifiés
   - Expliquer chaque risque
   - Proposer alternatives
   - Demander: "OK pour procéder?"

TRIGGER: Si modification touche >3 fichiers OU fonction sanctuarisée
```

---

## 🏁 END OF KERNEL (v6.3 - ~250 lines)
