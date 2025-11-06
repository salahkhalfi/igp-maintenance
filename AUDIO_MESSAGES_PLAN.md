# 🎤 Plan d'Implémentation - Messages Audio

**Date :** 2025-11-06  
**Priorité :** Haute  
**Complexité :** Moyenne-Élevée

## 🎯 Objectif

Permettre aux utilisateurs d'enregistrer et d'envoyer des messages vocaux directement depuis la messagerie, compatible avec tous les appareils (mobile, tablet, desktop).

## 📋 Fonctionnalités Requises

### 1. Enregistrement Audio ✅
- **API Web :** MediaRecorder API (natif navigateur)
- **Support :** Desktop, mobile, tablette
- **Format :** WebM (Chrome/Edge), MP4 (Safari), OGG (Firefox)
- **Compression :** Audio codec optimisé
- **Durée max :** 5 minutes par message
- **Visualisation :** Timer d'enregistrement en temps réel

### 2. Interface Utilisateur ✅
- **Bouton microphone** à côté du champ de texte
- **States visuels :**
  - Inactif : 🎤 gris
  - Enregistrement : 🔴 rouge pulsant
  - Lecture : ▶️ vert
- **Controls :**
  - Démarrer enregistrement
  - Arrêter enregistrement
  - Annuler
  - Envoyer
- **Preview audio** avant envoi

### 3. Stockage ✅
- **Cloudflare R2** pour les fichiers audio
- **Organisation :** `messages/audio/{userId}/{timestamp}-{randomId}.webm`
- **Metadata en DB :**
  ```sql
  messages table:
  - audio_file_key (NULL si message texte)
  - audio_duration (secondes)
  - audio_size (bytes)
  ```

### 4. Lecture Audio ✅
- **Player HTML5** natif avec controls
- **Download** optionnel
- **Waveform** visuelle (optionnel, phase 2)

## 🏗️ Architecture Technique

### Frontend (React)
```typescript
// État d'enregistrement
const [isRecording, setIsRecording] = useState(false);
const [audioBlob, setAudioBlob] = useState(null);
const [audioDuration, setAudioDuration] = useState(0);
const mediaRecorderRef = useRef(null);
const audioChunksRef = useRef([]);

// Démarrer enregistrement
const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  
  mediaRecorder.ondataavailable = (e) => {
    audioChunksRef.current.push(e.data);
  };
  
  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    setAudioBlob(audioBlob);
    audioChunksRef.current = [];
  };
  
  mediaRecorder.start();
  mediaRecorderRef.current = mediaRecorder;
  setIsRecording(true);
};

// Arrêter enregistrement
const stopRecording = () => {
  mediaRecorderRef.current?.stop();
  mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
  setIsRecording(false);
};

// Envoyer audio
const sendAudioMessage = async () => {
  const formData = new FormData();
  formData.append('audio', audioBlob, `voice-${Date.now()}.webm`);
  formData.append('message_type', activeTab);
  formData.append('recipient_id', selectedContact?.id);
  formData.append('duration', audioDuration);
  
  await axios.post('/api/messages/audio', formData);
};
```

### Backend (Hono + R2)

**Nouvelle route API :**
```typescript
// POST /api/messages/audio - Upload message audio
messages.post('/audio', authMiddleware, async (c) => {
  const formData = await c.req.formData();
  const audioFile = formData.get('audio') as File;
  const messageType = formData.get('message_type');
  const recipientId = formData.get('recipient_id');
  const duration = formData.get('duration');
  
  // Validation
  if (!audioFile) {
    return c.json({ error: 'Fichier audio requis' }, 400);
  }
  
  const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10 MB
  if (audioFile.size > MAX_AUDIO_SIZE) {
    return c.json({ error: 'Fichier trop volumineux (max 10MB)' }, 400);
  }
  
  const allowedTypes = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg'];
  if (!allowedTypes.includes(audioFile.type)) {
    return c.json({ error: 'Type de fichier non autorisé' }, 400);
  }
  
  // Upload vers R2
  const user = c.get('user');
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const fileKey = `messages/audio/${user.userId}/${timestamp}-${randomId}.webm`;
  
  const arrayBuffer = await audioFile.arrayBuffer();
  await c.env.MEDIA_BUCKET.put(fileKey, arrayBuffer, {
    httpMetadata: { contentType: audioFile.type }
  });
  
  // Sauvegarder en DB
  const result = await c.env.DB.prepare(`
    INSERT INTO messages (
      sender_id, recipient_id, message_type, content,
      audio_file_key, audio_duration, audio_size, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(
    user.userId,
    recipientId || null,
    messageType,
    '🎤 Message vocal',
    fileKey,
    duration,
    audioFile.size
  ).run();
  
  return c.json({ 
    message: 'Message audio envoyé',
    messageId: result.meta.last_row_id
  }, 201);
});

// GET /api/messages/audio/:key - Récupérer fichier audio
messages.get('/audio/:key', authMiddleware, async (c) => {
  const key = c.req.param('key');
  
  const object = await c.env.MEDIA_BUCKET.get(`messages/audio/${key}`);
  if (!object) {
    return c.json({ error: 'Audio non trouvé' }, 404);
  }
  
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'audio/webm',
      'Content-Disposition': 'inline'
    }
  });
});
```

### Migration DB

**Fichier :** `migrations/0006_add_audio_messages.sql`
```sql
-- Ajouter colonnes audio à la table messages
ALTER TABLE messages ADD COLUMN audio_file_key TEXT;
ALTER TABLE messages ADD COLUMN audio_duration INTEGER; -- en secondes
ALTER TABLE messages ADD COLUMN audio_size INTEGER; -- en bytes
```

## 🎨 Design UI

### Bouton Microphone
```html
<!-- État inactif -->
<button class="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600">
  <i class="fas fa-microphone"></i>
</button>

<!-- État enregistrement -->
<button class="p-3 bg-red-500 text-white rounded-full animate-pulse">
  <i class="fas fa-stop-circle"></i>
  <span>0:15</span>
</button>

<!-- Prévisualisation -->
<div class="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
  <audio controls src="blob:..."></audio>
  <button class="text-red-500" onclick="cancel()">
    <i class="fas fa-trash"></i>
  </button>
  <button class="text-green-500" onclick="send()">
    <i class="fas fa-paper-plane"></i>
  </button>
</div>
```

### Message Audio Display
```html
<div class="message-audio flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
  <i class="fas fa-microphone text-blue-500 text-xl"></i>
  <audio controls class="flex-1" src="/api/messages/audio/...">
  </audio>
  <span class="text-xs text-gray-500">2:34</span>
</div>
```

## ✅ Checklist d'Implémentation

### Phase 1 : Backend (1-2h)
- [ ] Créer migration DB `0006_add_audio_messages.sql`
- [ ] Appliquer migration locale et production
- [ ] Créer route POST `/api/messages/audio`
- [ ] Créer route GET `/api/messages/audio/:key`
- [ ] Ajouter validation (taille, type MIME)
- [ ] Tester upload R2

### Phase 2 : Frontend (2-3h)
- [ ] Ajouter état recording dans MessagingModal
- [ ] Implémenter `startRecording()` avec MediaRecorder API
- [ ] Implémenter `stopRecording()`
- [ ] Ajouter UI bouton microphone
- [ ] Ajouter timer d'enregistrement
- [ ] Implémenter preview audio
- [ ] Implémenter `sendAudioMessage()`
- [ ] Gérer permissions microphone (prompt utilisateur)

### Phase 3 : Affichage (1h)
- [ ] Modifier rendering des messages pour détecter audio
- [ ] Afficher player HTML5 pour messages audio
- [ ] Ajouter icône microphone distinctive
- [ ] Tester sur mobile et desktop

### Phase 4 : Tests (1h)
- [ ] Test enregistrement Desktop (Chrome, Firefox, Safari)
- [ ] Test enregistrement Mobile (iOS Safari, Android Chrome)
- [ ] Test upload et lecture
- [ ] Test permissions refusées
- [ ] Test taille maximale
- [ ] Test types MIME

## 🚀 Déploiement

```bash
# 1. Appliquer migrations
npm run db:migrate:local
npm run db:migrate:prod

# 2. Build
npm run build

# 3. Test local
npm run dev:sandbox

# 4. Deploy production
npm run deploy
```

## 📊 Estimations

| Phase | Durée | Complexité |
|-------|-------|------------|
| Backend | 1-2h | Moyenne |
| Frontend | 2-3h | Élevée |
| Affichage | 1h | Faible |
| Tests | 1h | Moyenne |
| **TOTAL** | **5-7h** | **Moyenne-Élevée** |

## ⚠️ Considérations

### Permissions Navigateur
- L'utilisateur doit **autoriser l'accès au microphone**
- Gestion du refus de permission
- Message d'erreur clair si permission refusée

### Compatibilité
- **Chrome/Edge** : WebM (VP9/Opus)
- **Firefox** : OGG (Opus)
- **Safari** : MP4 (AAC)
- **Fallback** : Détecter codec supporté

### Performances
- Compression audio automatique par le navigateur
- Limite 10 MB par message
- Limite 5 minutes de durée
- Chunked upload pour gros fichiers (optionnel)

### Sécurité
- Validation type MIME côté serveur
- Limitation de taille stricte
- Authentification requise
- Pas de transcription automatique (phase 1)

## 🔮 Améliorations Futures (Phase 2)

- 🎵 **Waveform visuelle** pendant enregistrement
- 📊 **Visualisation amplitude** en temps réel
- ⏯️ **Pause/Resume** pendant enregistrement
- 📝 **Transcription automatique** (Speech-to-Text)
- 🔊 **Ajustement volume** avant envoi
- 💾 **Brouillons audio** sauvegardés localement
- 🎨 **Thèmes personnalisés** pour player audio

---

**Prêt pour implémentation ?** 🚀  
**Temps estimé :** 5-7 heures  
**Priorité :** Haute (demande utilisateur)
