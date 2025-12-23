# 🔴 CARTOGRAPHIE DES FONCTIONS VITALES

**Document de référence CRITIQUE - NE PAS MODIFIER SANS VALIDATION**

---

## 1. 🎤 CRÉATION VOCALE DE TICKETS

### Flux Complet
```
[VoiceTicketFab.js] → [/api/ai/analyze-ticket] → [Groq/OpenAI Whisper] → [DeepSeek/GPT-4o-mini] → [CreateTicketModal]
```

### Fichiers Impliqués
| Fichier | Rôle | Lignes Critiques |
|---------|------|------------------|
| `public/static/js/components/VoiceTicketFab.js` | UI Frontend (92L) | L6-28 (recording), L39-60 (analyze) |
| `src/routes/ai.ts` | Backend API (898L) | L186-238 (transcribeAudio), L240-314 (analyzeText), L318-400 (route handler) |
| `src/messenger/components/VoiceTicketFab.tsx` | Version Messenger (167L) | Même logique |

### Dépendances Externes
- **GROQ_API_KEY** → Whisper transcription (principal)
- **OPENAI_API_KEY** → Whisper fallback + GPT analysis fallback
- **DEEPSEEK_API_KEY** → Intelligence principale (JSON extraction)

### Points de Fragilité
1. **Ordre de fallback** : Groq → OpenAI (transcription), DeepSeek → OpenAI (analyse)
2. **Validation Zod** : `TicketAnalysisSchema` (L135-144)
3. **Context dynamique** : Machines, Users, Timezone depuis DB

### ⚠️ NE PAS TOUCHER
- Fonction `transcribeAudio()` (L186-238)
- Fonction `analyzeText()` (L240-314)
- Route `/api/ai/analyze-ticket` (L318-400)
- Schéma `TicketAnalysisSchema` (L135-144)

---

## 2. 🔔 PUSH NOTIFICATIONS SONORES

### Flux Complet
```
[Événement] → [sendPushNotification()] → [push_subscriptions DB] → [VAPID] → [Service Worker] → [Son]
```

### Fichiers Impliqués
| Fichier | Rôle | Lignes Critiques |
|---------|------|------------------|
| `src/routes/push.ts` | Backend API (886L) | L197-450 (sendPushNotification) |
| `src/index.tsx` | VAPID route publique | L228-240 |
| `public/service-worker.js` | Réception push | Tout le fichier |
| `public/push-notifications.js` | Init frontend | Tout le fichier |

### Dépendances
- **VAPID_PUBLIC_KEY** (env)
- **VAPID_PRIVATE_KEY** (env)
- **PUSH_ENABLED** (env)
- **@block65/webcrypto-web-push** (package)

### Tables DB
- `push_subscriptions` (endpoint, p256dh, auth, user_id, device_type)
- `pending_notifications` (queue pour offline)

### Points de Fragilité
1. **Limite 5 appareils** : L47-90 (gestion automatique)
2. **Queue system** : L269-293 (pending_notifications)
3. **Retry logic** : L327-400 (3 tentatives avec backoff)
4. **VAPID keys** : Doivent être valides et correspondre

### ⚠️ NE PAS TOUCHER
- Fonction `sendPushNotification()` (L197-450)
- Route `/api/push/vapid-public-key` (publique, sans auth)
- Logique de queue (L269-293)
- Service Worker `push` event handler

---

## 3. 🧠 EXPERT IA (IGP Verre)

### Flux Complet
```
[ChatWindow Messenger] → [/api/v2/chat] → [chat.ts] → [ai.ts helpers] → [GPT-4o / DeepSeek] → [Response]
```

### Fichiers Impliqués
| Fichier | Rôle | Lignes Critiques |
|---------|------|------------------|
| `src/routes/ai.ts` | Logique IA (898L) | L88-130 (vision), L148-184 (config), L500-700 (expert context) |
| `src/routes/chat.ts` | Routes Messenger (1455L) | Routes chat avec IA |
| `src/ai/tools.ts` | Outils IA | TOOLS array |

### Configuration DB (system_settings)
- `ai_identity_block` - Identité de l'IA
- `ai_hierarchy_block` - Hiérarchie
- `ai_character_block` - Personnalité
- `ai_knowledge_block` - Base de connaissances
- `ai_rules_block` - Règles comportementales
- `ai_custom_context` - Contexte personnalisé usine
- `ai_voice_extraction_prompt` - Prompt extraction vocale
- `ai_whisper_context` - Contexte Whisper

### Dépendances Externes
- **OPENAI_API_KEY** → GPT-4o-mini (vision + chat)
- **DEEPSEEK_API_KEY** → DeepSeek-chat (principal)
- **GROQ_API_KEY** → Whisper audio

### Points de Fragilité
1. **Vision context** : L604-637 (historique images)
2. **Dynamic context loading** : L480-570 (machines, users, tickets)
3. **Config from DB** : `getAiConfig()` (L148-184)
4. **conversation_id = 'expert_ai'** : Identifiant réservé

### ⚠️ NE PAS TOUCHER
- Fonction `getAiConfig()` (L148-184)
- Fonction `analyzeImageWithOpenAI()` (L88-130)
- Context building (L480-700)
- Clés system_settings `ai_*`

---

## 4. 📊 STRUCTURE IA GLOBALE

### Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    COUCHE FRONTEND                       │
├─────────────────────────────────────────────────────────┤
│ VoiceTicketFab.js │ AIChatModal_v4.js │ Messenger PWA   │
└─────────┬─────────────────┬─────────────────┬───────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────┐
│                    COUCHE API (Hono)                     │
├─────────────────────────────────────────────────────────┤
│  /api/ai/analyze-ticket  │  /api/v2/chat  │  /api/ai/*  │
│        (ai.ts)           │   (chat.ts)    │   (ai.ts)   │
└─────────┬─────────────────────┬─────────────────────────┘
          │                     │
          ▼                     ▼
┌─────────────────────────────────────────────────────────┐
│                 COUCHE SERVICES IA                       │
├─────────────────────────────────────────────────────────┤
│ transcribeAudio() │ analyzeText() │ analyzeImageWithOpenAI() │
│   (Whisper)       │ (JSON Gen)    │     (Vision)             │
└─────────┬─────────────────┬─────────────────┬───────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────┐
│                 PROVIDERS EXTERNES                       │
├─────────────────────────────────────────────────────────┤
│     GROQ          │   DEEPSEEK      │     OPENAI        │
│  (Whisper Fast)   │  (JSON Cheap)   │ (Fallback+Vision) │
└─────────────────────────────────────────────────────────┘
```

### Ordre de Priorité des Providers
1. **Transcription** : Groq → OpenAI
2. **Analyse JSON** : DeepSeek → OpenAI
3. **Vision** : OpenAI uniquement

---

## 🛡️ RÈGLES DE MODIFICATION

### AVANT de modifier ces fichiers :
1. ✅ Lire TOUT le fichier
2. ✅ Identifier les dépendances avec `grep`
3. ✅ Tester localement (`npm run dev:sandbox`)
4. ✅ Vérifier les 3 fonctions vitales après modification
5. ✅ Commit atomique avec message explicite

### Tests de Non-Régression Obligatoires
```bash
# 1. Voice Ticket
- [ ] Enregistrer audio → Analyse → Pré-remplissage CreateTicketModal

# 2. Push Notification
- [ ] Créer ticket → Push reçu avec son sur mobile

# 3. Expert IA
- [ ] Envoyer message à l'Expert → Réponse contextuelle
- [ ] Envoyer image → Vision analysis
```

### Fichiers SANCTUARISÉS (modification interdite sans validation)
- `src/routes/ai.ts` lignes 135-400
- `src/routes/push.ts` lignes 197-450
- `public/static/js/components/VoiceTicketFab.js`
- `public/service-worker.js`

---

*Document créé le 2025-12-23 - À mettre à jour après chaque modification majeure*
