# 🎤 Code Frontend - Enregistrement Audio

Ce document contient tout le code nécessaire pour implémenter l'enregistrement audio dans la messagerie.

## 📋 Étapes d'Intégration

### 1. Ajouter les états au composant MessagingModal (ligne ~3667)

```typescript
// AJOUTER CES ÉTATS après la ligne 3676
const [isRecording, setIsRecording] = React.useState(false);
const [audioBlob, setAudioBlob] = React.useState(null);
const [recordingDuration, setRecordingDuration] = React.useState(0);
const [audioURL, setAudioURL] = React.useState(null);
const mediaRecorderRef = React.useRef(null);
const audioChunksRef = React.useRef([]);
const recordingTimerRef = React.useRef(null);
```

### 2. Ajouter les fonctions d'enregistrement (après loadUnreadCount)

```typescript
// AJOUTER CES FONCTIONS après la fonction loadUnreadCount (ligne ~3762)

// Démarrer l'enregistrement audio
const startRecording = async () => {
    try {
        // Demander permission microphone
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            }
        });
        
        // Créer MediaRecorder
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' :
                      MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/ogg'
        });
        
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
            const url = URL.createObjectURL(audioBlob);
            setAudioBlob(audioBlob);
            setAudioURL(url);
            
            // Arrêter le stream
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
        setRecordingDuration(0);
        
        // Timer pour la durée
        recordingTimerRef.current = setInterval(() => {
            setRecordingDuration(prev => {
                if (prev >= 300) { // Max 5 minutes
                    stopRecording();
                    return 300;
                }
                return prev + 1;
            });
        }, 1000);
        
    } catch (error) {
        console.error('Erreur accès microphone:', error);
        if (error.name === 'NotAllowedError') {
            alert('Permission microphone refusée. Veuillez autoriser l\'accès au microphone dans les paramètres de votre navigateur.');
        } else {
            alert('Erreur accès microphone: ' + error.message);
        }
    }
};

// Arrêter l'enregistrement
const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
    }
    setIsRecording(false);
};

// Annuler l'enregistrement
const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setAudioURL(null);
    setRecordingDuration(0);
    audioChunksRef.current = [];
};

// Envoyer le message audio
const sendAudioMessage = async () => {
    if (!audioBlob) return;
    
    try {
        const formData = new FormData();
        
        // Déterminer l'extension
        const mimeType = audioBlob.type;
        const extension = mimeType.includes('webm') ? 'webm' :
                         mimeType.includes('mp4') ? 'mp4' :
                         mimeType.includes('ogg') ? 'ogg' : 'webm';
        
        formData.append('audio', audioBlob, `voice-${Date.now()}.${extension}`);
        formData.append('message_type', activeTab);
        formData.append('duration', recordingDuration.toString());
        
        if (activeTab === 'private' && selectedContact) {
            formData.append('recipient_id', selectedContact.id.toString());
        }
        
        // Envoyer
        await axios.post(API_URL + '/messages/audio', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        // Réinitialiser
        cancelRecording();
        
        // Recharger les messages
        if (activeTab === 'public') {
            loadPublicMessages();
        } else if (selectedContact) {
            loadPrivateMessages(selectedContact.id);
            loadConversations();
        }
        
    } catch (error) {
        console.error('Erreur envoi audio:', error);
        alert('Erreur envoi message vocal: ' + (error.response?.data?.error || error.message));
    }
};

// Formater la durée d'enregistrement
const formatRecordingDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};
```

### 3. Modifier l'affichage des messages pour inclure l'audio

**Remplacer la ligne qui affiche le contenu du message (ligne ~4086) :**

```typescript
// AVANT (ligne ~4086):
React.createElement('p', { className: 'text-gray-700 whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed' }, msg.content)

// APRÈS:
msg.audio_file_key ? 
    // Message audio
    React.createElement('div', { className: 'flex flex-col gap-2' },
        React.createElement('div', { className: 'flex items-center gap-2 text-blue-600' },
            React.createElement('i', { className: 'fas fa-microphone text-lg' }),
            React.createElement('span', { className: 'text-sm font-semibold' }, 'Message vocal'),
            msg.audio_duration ? React.createElement('span', { className: 'text-xs text-gray-500' }, 
                formatRecordingDuration(msg.audio_duration)
            ) : null
        ),
        React.createElement('audio', {
            controls: true,
            className: 'w-full max-w-md',
            style: { height: '40px' },
            src: API_URL + '/messages/audio/' + msg.audio_file_key,
            preload: 'metadata'
        })
    )
    :
    // Message texte normal
    React.createElement('p', { className: 'text-gray-700 whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed' }, msg.content)
```

### 4. Modifier la zone d'input pour ajouter les boutons audio (ligne ~4104)

**Remplacer toute la div className='flex gap-2' (lignes 4105-4124) par :**

```typescript
// NOUVELLE ZONE D'INPUT AVEC AUDIO
React.createElement('div', { className: 'flex flex-col gap-2' },
    // Preview audio si enregistrement terminé
    audioBlob && !isRecording ? React.createElement('div', {
        className: 'flex items-center gap-2 p-3 bg-blue-50 rounded-xl border-2 border-blue-200'
    },
        React.createElement('i', { className: 'fas fa-microphone text-blue-500 text-xl' }),
        React.createElement('audio', {
            controls: true,
            src: audioURL,
            className: 'flex-1',
            style: { height: '40px' }
        }),
        React.createElement('div', { className: 'flex gap-2' },
            React.createElement('button', {
                onClick: cancelRecording,
                className: 'px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all',
                title: 'Annuler'
            },
                React.createElement('i', { className: 'fas fa-trash' })
            ),
            React.createElement('button', {
                onClick: sendAudioMessage,
                className: 'px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-semibold',
                title: 'Envoyer le message vocal'
            },
                React.createElement('i', { className: 'fas fa-paper-plane mr-2' }),
                'Envoyer'
            )
        )
    ) : null,
    
    // Barre d'enregistrement si en cours
    isRecording ? React.createElement('div', {
        className: 'flex items-center gap-3 p-3 bg-red-50 rounded-xl border-2 border-red-200'
    },
        React.createElement('div', { className: 'w-3 h-3 bg-red-500 rounded-full animate-pulse' }),
        React.createElement('span', { className: 'text-red-600 font-semibold' }, 'Enregistrement...'),
        React.createElement('span', { className: 'text-red-700 font-mono text-lg' }, formatRecordingDuration(recordingDuration)),
        React.createElement('button', {
            onClick: stopRecording,
            className: 'ml-auto px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-semibold'
        },
            React.createElement('i', { className: 'fas fa-stop mr-2' }),
            'Arrêter'
        )
    ) : null,
    
    // Input normal si pas d'enregistrement
    !isRecording && !audioBlob ? React.createElement('div', { className: 'flex gap-2' },
        React.createElement('textarea', {
            value: messageContent,
            onChange: (e) => setMessageContent(e.target.value),
            onKeyPress: handleKeyPress,
            placeholder: 'Ecrire un message public... (Enter pour envoyer)',
            className: 'flex-1 bg-white/80 backdrop-blur-sm border-2 border-white/50 rounded-xl px-3 sm:px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all shadow-lg hover:shadow-xl',
            style: { boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.5)' },
            rows: 2
        }),
        React.createElement('button', {
            onClick: startRecording,
            className: 'px-3 sm:px-4 bg-gradient-to-br from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 font-semibold transition-all shadow-xl hover:shadow-2xl flex items-center justify-center transform hover:scale-105 active:scale-95',
            title: 'Enregistrer un message vocal',
            style: { boxShadow: '0 10px 30px rgba(239, 68, 68, 0.4), inset 0 -2px 8px rgba(0, 0, 0, 0.2)' }
        },
            React.createElement('i', { className: 'fas fa-microphone text-base sm:text-lg' })
        ),
        React.createElement('button', {
            onClick: sendMessage,
            disabled: !messageContent.trim(),
            className: 'px-3 sm:px-6 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-xl hover:shadow-2xl disabled:hover:shadow-xl flex items-center justify-center transform hover:scale-105 active:scale-95',
            style: { boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4), inset 0 -2px 8px rgba(0, 0, 0, 0.2)' }
        },
            React.createElement('i', { className: 'fas fa-paper-plane text-sm sm:text-base' }),
            React.createElement('span', { className: 'ml-2 hidden sm:inline' }, 'Envoyer')
        )
    ) : null
)
```

### 5. Faire de même pour l'onglet PRIVATE (répéter les étapes 3 et 4)

Chercher la deuxième occurrence de la zone d'input (dans l'onglet private) et appliquer les mêmes modifications.

---

## 🎯 Résultat Final

### Fonctionnalités
- ✅ Bouton microphone rouge à côté du champ texte
- ✅ Enregistrement avec timer en temps réel
- ✅ Arrêt manuel ou automatique à 5 minutes
- ✅ Preview audio avant envoi
- ✅ Annulation possible
- ✅ Player audio HTML5 natif pour lecture
- ✅ Affichage durée du message vocal
- ✅ Format léger universel (WebM/MP4/OGG selon navigateur)

### Compatibilité
- ✅ Desktop: Chrome, Firefox, Safari, Edge
- ✅ Mobile: iOS Safari, Android Chrome
- ✅ Formats audio: WebM (Chrome/Edge), MP4 (Safari), OGG (Firefox)

### UX
- 🎤 Bouton microphone rouge distinct
- 🔴 Animation pulsante pendant enregistrement
- ⏱️ Timer visible (0:00 → 5:00)
- 🎧 Player audio intégré avec controls natifs
- 📱 Responsive (mobile + desktop)

---

**Prêt pour intégration manuelle !** 🚀
