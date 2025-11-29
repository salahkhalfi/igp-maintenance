// ========================================
// COMPOSANT MESSAGERIE
// ========================================
const MessagingModal = ({ show, onClose, currentUser, initialContact, initialTab }) => {
    const [activeTab, setActiveTab] = React.useState(initialTab || "public");
    const [publicMessages, setPublicMessages] = React.useState([]);
    const [conversations, setConversations] = React.useState([]);
    const [selectedContact, setSelectedContact] = React.useState(initialContact || null);
    const [privateMessages, setPrivateMessages] = React.useState([]);
    const [availableUsers, setAvailableUsers] = React.useState([]);
    const [messageContent, setMessageContent] = React.useState('');
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [loading, setLoading] = React.useState(false);
    const messagesEndRef = React.useRef(null);

    // États pour enregistrement audio
    const [isRecording, setIsRecording] = React.useState(false);
    const [audioBlob, setAudioBlob] = React.useState(null);
    const [recordingDuration, setRecordingDuration] = React.useState(0);
    const [audioURL, setAudioURL] = React.useState(null);
    const mediaRecorderRef = React.useRef(null);
    const audioChunksRef = React.useRef([]);
    const recordingTimerRef = React.useRef(null);

    // États pour lecteur audio personnalisé
    const [playingAudio, setPlayingAudio] = React.useState({});
    const audioRefs = React.useRef({});

    // États pour selection multiple et suppression en masse
    const [selectionMode, setSelectionMode] = React.useState(false);
    const [selectedMessages, setSelectedMessages] = React.useState([]);

    // État pour forcer le re-render des timestamps (pas besoin de valeur, juste un toggle)
    const [timestampTick, setTimestampTick] = React.useState(0);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(() => {
        if (show) {
            loadPublicMessages();
            loadConversations();
            loadAvailableUsers();
            loadUnreadCount();

            // Si un contact initial est fourni, basculer vers prive et charger ses messages
            if (initialContact) {
                setActiveTab("private");
                setSelectedContact(initialContact);
                loadPrivateMessages(initialContact.id);
            }

            // Rafraichir les timestamps, le compteur ET les messages toutes les 30 secondes
            const timestampInterval = setInterval(() => {
                setTimestampTick(prev => prev + 1);
                loadUnreadCount();

                // Recharger les messages pour voir les nouveaux messages des autres utilisateurs
                if (activeTab === 'public') {
                    loadPublicMessages();
                } else if (activeTab === 'private' && selectedContact) {
                    loadPrivateMessages(selectedContact.id);
                    loadConversations();
                }
            }, 30000); // 30 secondes

            return () => clearInterval(timestampInterval);
        }
    }, [show, activeTab, selectedContact]);

    React.useEffect(() => {
        // Scroller automatiquement seulement pour messages privés (ordre chronologique)
        // Messages publics: pas de scroll auto car ordre anti-chronologique (nouveaux en haut)
        if (activeTab === 'private' && selectedContact) {
            scrollToBottom();
        }
    }, [privateMessages, activeTab, selectedContact]);

    const loadPublicMessages = async () => {
        try {
            const response = await axios.get(API_URL + '/messages/public');
            setPublicMessages(response.data.messages);
        } catch (error) {
            // Erreur silencieuse
        }
    };

    const loadConversations = async () => {
        try {
            const response = await axios.get(API_URL + '/messages/conversations');
            setConversations(response.data.conversations);
        } catch (error) {
            // Erreur silencieuse
        }
    };

    const loadPrivateMessages = async (contactId) => {
        try {
            setLoading(true);
            const response = await axios.get(API_URL + '/messages/private/' + contactId);
            setPrivateMessages(response.data.messages);
            loadConversations(); // Rafraichir pour mettre a jour unread_count
        } catch (error) {
            // Erreur silencieuse
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableUsers = async () => {
        try {
            const response = await axios.get(API_URL + '/messages/available-users');
            setAvailableUsers(response.data.users);
        } catch (error) {
            // Erreur silencieuse
        }
    };

    const loadUnreadCount = async () => {
        try {
            const response = await axios.get(API_URL + '/messages/unread-count');
            setUnreadCount(response.data.count);
        } catch (error) {
            // Erreur silencieuse
        }
    };

    // Fonction pour ouvrir message prive avec un utilisateur
    const openPrivateMessage = (senderId, senderName) => {
        // Verifier si ce n est pas soi-meme
        if (senderId === currentUser.userId) {
            alert('Vous ne pouvez pas vous envoyer un message prive a vous-meme.');
            return;
        }

        // Verifier si utilisateur est dans la liste des contacts disponibles
        const user = availableUsers.find(u => u.id === senderId);

        if (!user) {
            // Utilisateur n existe plus dans la liste
            alert(senderName + ' ne fait plus partie de la liste des utilisateurs.');
            return;
        }

        // Switcher vers onglet Messages Prives
        setActiveTab('private');

        // Selectionner automatiquement l utilisateur
        setSelectedContact(user);

        // Charger les messages prives avec cette personne
        loadPrivateMessages(senderId);
    };

    // Fonctions audio
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            });

            // SOLUTION SIMPLE: Essayer MP3 en premier (universel sur TOUS les appareils)
            let mimeType = '';
            let extension = 'mp3';

            // 1. Essayer audio/mpeg (MP3) - UNIVERSEL
            if (MediaRecorder.isTypeSupported('audio/mpeg')) {
                mimeType = 'audio/mpeg';
                extension = 'mp3';
            }
            // 2. Essayer MP4/AAC - iOS et Chrome moderne
            else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
                extension = 'mp4';
            }
            // 3. Fallback WebM - Chrome Android uniquement
            else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
                extension = 'webm';
            }
            // 4. Fallback WebM basique
            else if (MediaRecorder.isTypeSupported('audio/webm')) {
                mimeType = 'audio/webm';
                extension = 'webm';
            }
            // 5. Dernier recours
            else {
                mimeType = '';
                extension = 'mp3';
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                setAudioBlob(audioBlob);
                setAudioURL(URL.createObjectURL(audioBlob));
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);

            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration(prev => {
                    if (prev >= 300) {
                        stopRecording();
                        return 300;
                    }
                    return prev + 1;
                });
            }, 1000);

        } catch (error) {
            alert('Impossible acceder au microphone. Verifiez les permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }
        }
    };

    const cancelRecording = () => {
        if (isRecording) {
            stopRecording();
        }
        setAudioBlob(null);
        setAudioURL(null);
        setRecordingDuration(0);
        audioChunksRef.current = [];
        if (audioURL) {
            URL.revokeObjectURL(audioURL);
        }
    };

    const sendAudioMessage = async () => {
        if (!audioBlob) return;
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio-message.' + (audioBlob.type.includes('mp4') ? 'mp4' : audioBlob.type.includes('ogg') ? 'ogg' : 'webm'));
            formData.append('message_type', activeTab);
            formData.append('duration', recordingDuration.toString());
            if (activeTab === 'private' && selectedContact) {
                formData.append('recipient_id', selectedContact.id.toString());
            }
            await axios.post(API_URL + '/messages/audio', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            cancelRecording();
            if (activeTab === 'public') {
                loadPublicMessages();
            } else if (selectedContact) {
                loadPrivateMessages(selectedContact.id);
                loadConversations();
            }

            // Rafraichir compteur immediatement apres envoi audio
            loadUnreadCount();
        } catch (error) {
            alert('Erreur envoi audio: ' + (error.response?.data?.error || 'Erreur'));
        }
    };

    const formatRecordingDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    };

    // Fonctions lecteur audio personnalisé
    const toggleAudio = async (messageId) => {
        const audio = audioRefs.current[messageId];

        if (!audio) {
            return;
        }

        if (playingAudio[messageId]) {
            audio.pause();
            setPlayingAudio(prev => ({ ...prev, [messageId]: false }));
        } else {
            // Arrêter tous les autres audios
            Object.keys(audioRefs.current).forEach(id => {
                if (id !== messageId && audioRefs.current[id]) {
                    audioRefs.current[id].pause();
                    setPlayingAudio(prev => ({ ...prev, [id]: false }));
                }
            });

            // Charger l'audio d'abord si nécessaire
            if (audio.readyState < 2) {
                audio.load();
            }

            try {
                await audio.play();
                setPlayingAudio(prev => ({ ...prev, [messageId]: true }));
            } catch (err) {
                setPlayingAudio(prev => ({ ...prev, [messageId]: false }));
                alert('Impossible de lire audio: ' + err.message);
            }
        }
    };

    const sendMessage = async () => {
        if (!messageContent.trim()) return;

        try {
            const payload = {
                message_type: activeTab,
                content: messageContent,
                recipient_id: activeTab === 'private' && selectedContact ? selectedContact.id : null
            };

            await axios.post(API_URL + '/messages', payload);
            setMessageContent('');

            if (activeTab === 'public') {
                loadPublicMessages();
            } else if (selectedContact) {
                loadPrivateMessages(selectedContact.id);
                loadConversations();
            }

            // Rafraichir compteur immediatement apres envoi
            loadUnreadCount();
        } catch (error) {
            alert('Erreur envoi message: ' + (error.response?.data?.error || 'Erreur'));
        }
    };

    const deleteMessage = async (messageId) => {
        if (!confirm('Etes-vous sur de vouloir supprimer ce message ?')) return;

        try {
            await axios.delete(API_URL + '/messages/' + messageId);

            if (activeTab === 'public') {
                loadPublicMessages();
            } else if (selectedContact) {
                loadPrivateMessages(selectedContact.id);
                loadConversations();
            }

            // Rafraichir compteur immediatement apres suppression
            loadUnreadCount();
        } catch (error) {
            alert('Erreur suppression: ' + (error.response?.data?.error || 'Erreur'));
        }
    };

    const canDeleteMessage = (msg) => {
        // Utilisateur peut supprimer son propre message
        if (msg.sender_id === currentUser.id) return true;
        // Admin peut supprimer tous les messages
        if (currentUser?.role === 'admin') return true;
        // Superviseur peut supprimer tous sauf ceux de admin
        if (currentUser?.role === 'supervisor' && msg.sender_role !== 'admin') return true;
        return false;
    };

    // Fonctions pour selection multiple
    const toggleSelectionMode = () => {
        setSelectionMode(!selectionMode);
        setSelectedMessages([]);
    };

    const toggleMessageSelection = (messageId) => {
        if (selectedMessages.includes(messageId)) {
            setSelectedMessages(selectedMessages.filter(id => id !== messageId));
        } else {
            setSelectedMessages([...selectedMessages, messageId]);
        }
    };

    const selectAllMessages = () => {
        const currentMessages = activeTab === 'public' ? publicMessages : privateMessages;
        const selectableIds = currentMessages
            .filter(msg => canDeleteMessage(msg))
            .map(msg => msg.id);
        setSelectedMessages(selectableIds);
    };

    const deselectAllMessages = () => {
        setSelectedMessages([]);
    };

    const deleteSelectedMessages = async () => {
        if (selectedMessages.length === 0) return;

        const count = selectedMessages.length;
        const confirmText = 'Supprimer ' + count + ' message' + (count > 1 ? 's' : '') + ' ?';

        if (!confirm(confirmText)) return;

        try {
            await axios.post(API_URL + '/messages/bulk-delete', {
                message_ids: selectedMessages
            });

            setSelectedMessages([]);
            setSelectionMode(false);

            if (activeTab === 'public') {
                loadPublicMessages();
            } else if (selectedContact) {
                loadPrivateMessages(selectedContact.id);
                loadConversations();
            }

            // Rafraichir compteur immediatement apres suppression masse
            loadUnreadCount();

            alert(count + ' message' + (count > 1 ? 's' : '') + ' supprime' + (count > 1 ? 's' : ''));
        } catch (error) {
            alert('Erreur suppression: ' + (error.response?.data?.error || 'Erreur'));
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatMessageTime = (timestamp) => {
        // Convertir le format SQL "YYYY-MM-DD HH:MM:SS" en format ISO avec T et Z (UTC)
        const isoTimestamp = timestamp.replace(' ', 'T') + (timestamp.includes('Z') ? '' : 'Z');
        const dateUTC = new Date(isoTimestamp);
        // Appliquer l'offset EST/EDT
        const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
        const date = new Date(dateUTC.getTime() + (offset * 60 * 60 * 1000));
        const now = getNowEST();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        // Format français/québécois (jj mois aaaa) avec heure locale de l'appareil
        const frenchOptions = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };

        if (diffMins < 1) return "À l'instant";
        if (diffMins < 60) return "Il y a " + diffMins + " min";
        if (diffHours < 24) return "Il y a " + diffHours + " h";
        if (diffHours < 48) return "Hier " + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        return date.toLocaleDateString('fr-FR', frenchOptions);
    };

    const getRoleBadgeClass = (role) => {
        const colors = {
            'admin': 'bg-red-100 text-red-700', 'director': 'bg-red-50 text-red-600',
            'supervisor': 'bg-yellow-100 text-yellow-700', 'coordinator': 'bg-amber-100 text-amber-700', 'planner': 'bg-amber-100 text-amber-700',
            'senior_technician': 'bg-blue-100 text-blue-700', 'technician': 'bg-blue-50 text-blue-600',
            'team_leader': 'bg-emerald-100 text-emerald-700', 'furnace_operator': 'bg-green-100 text-green-700', 'operator': 'bg-green-50 text-green-600',
            'safety_officer': 'bg-blue-100 text-blue-700', 'quality_inspector': 'bg-slate-100 text-slate-700', 'storekeeper': 'bg-violet-100 text-violet-700',
            'viewer': 'bg-gray-100 text-gray-700'
        };
        return colors[role] || 'bg-gray-100 text-gray-700';
    };

    const getRoleLabel = (role) => {
        const labels = {
            'admin': 'Admin', 'director': 'Directeur', 'supervisor': 'Superviseur', 'coordinator': 'Coordonnateur', 'planner': 'Planificateur',
            'senior_technician': 'Tech. Senior', 'technician': 'Technicien', 'team_leader': 'Chef Équipe', 'furnace_operator': 'Op. Four', 'operator': 'Opérateur',
            'safety_officer': 'Agent SST', 'quality_inspector': 'Insp. Qualité', 'storekeeper': 'Magasinier', 'viewer': 'Lecture Seule'
        };
        return labels[role] || role;
    };

    if (!show) return null;

    return React.createElement('div', {
        className: 'fixed inset-0 bg-gradient-to-br from-slate-900/40 via-gray-900/40 to-slate-800/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fadeIn',
        onClick: onClose
    },
        React.createElement('div', {
            className: 'bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-6xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden transform hover:scale-[1.005] transition-all duration-300',
            onClick: (e) => e.stopPropagation(),
            style: {
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                transform: 'translateZ(0)'
            }
        },
            // Header
            React.createElement('div', {
                className: 'bg-gradient-to-r from-slate-700 to-gray-700 text-white p-3 sm:p-5 flex justify-between items-center shadow-lg'
            },
                React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3 min-w-0' },
                    React.createElement('i', { className: 'fas fa-comments text-xl sm:text-2xl flex-shrink-0' }),
                    React.createElement('h2', { className: 'text-lg sm:text-2xl font-bold truncate' }, 'Messagerie Equipe'),
                    unreadCount > 0 ? React.createElement('span', {
                        className: 'bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 animate-pulse'
                    }, unreadCount) : null
                ),
                React.createElement('button', {
                    onClick: onClose,
                    className: 'text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all flex-shrink-0'
                },
                    React.createElement('i', { className: 'fas fa-times text-lg sm:text-xl' })
                )
            ),

            // Tabs
            React.createElement('div', {
                className: 'flex border-b border-gray-200 bg-gray-50 shadow-sm'
            },
                React.createElement('button', {
                    onClick: () => {
                        setActiveTab('public');
                        setSelectedContact(null);
                    },
                    className: 'flex-1 px-3 sm:px-6 py-2 sm:py-3 font-semibold text-sm sm:text-base transition-all ' +
                        (activeTab === 'public'
                            ? 'text-indigo-600 border-b-3 border-indigo-600 bg-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')
                },
                    React.createElement('i', { className: 'fas fa-globe mr-1 sm:mr-2' }),
                    React.createElement('span', { className: 'hidden xs:inline' }, 'Canal Public'),
                    React.createElement('span', { className: 'inline xs:hidden' }, 'Public')
                ),
                React.createElement('button', {
                    onClick: () => setActiveTab('private'),
                    className: 'flex-1 px-3 sm:px-6 py-2 sm:py-3 font-semibold text-sm sm:text-base transition-all relative ' +
                        (activeTab === 'private'
                            ? 'text-indigo-600 border-b-3 border-indigo-600 bg-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')
                },
                    React.createElement('i', { className: 'fas fa-user-friends mr-1 sm:mr-2' }),
                    React.createElement('span', { className: 'hidden xs:inline' }, 'Messages Prives'),
                    React.createElement('span', { className: 'inline xs:hidden' }, 'Prives')
                )
            ),

            // Barre outils selection
            React.createElement('div', { className: 'bg-white border-b border-gray-200 px-3 py-2 flex items-center flex-wrap gap-2' },
                React.createElement('div', { className: 'flex gap-2' },
                    React.createElement('button', {
                        onClick: toggleSelectionMode,
                        className: 'px-3 py-1.5 text-sm font-medium rounded-lg transition-all ' +
                            (selectionMode
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                    },
                        React.createElement('i', { className: 'fas ' + (selectionMode ? 'fa-times' : 'fa-check-square') + ' mr-1.5' }),
                        selectionMode ? 'Annuler' : 'Selectionner'
                    ),
                    selectionMode ? React.createElement('button', {
                        onClick: selectAllMessages,
                        className: 'px-3 py-1.5 text-sm font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all'
                    },
                        React.createElement('i', { className: 'fas fa-check-double mr-1.5' }),
                        'Tout'
                    ) : null,
                    selectionMode && selectedMessages.length > 0 ? React.createElement('button', {
                        onClick: deselectAllMessages,
                        className: 'px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all'
                    },
                        React.createElement('i', { className: 'fas fa-times-circle mr-1.5' }),
                        'Aucun'
                    ) : null
                ),
                selectionMode && selectedMessages.length > 0 ? React.createElement('button', {
                    onClick: deleteSelectedMessages,
                    className: 'px-3 py-1.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all'
                },
                    React.createElement('i', { className: 'fas fa-trash mr-1.5' }),
                    'Supprimer (' + selectedMessages.length + ')'
                ) : null,
                selectionMode ? React.createElement('span', { className: 'text-xs text-gray-500 ml-auto' },
                    selectedMessages.length + ' selectionne' + (selectedMessages.length > 1 ? 's' : '')
                ) : null
            ),

            // Content
            React.createElement('div', { className: 'flex-1 flex overflow-hidden' },
                // PUBLIC TAB
                activeTab === 'public' ? React.createElement('div', { className: 'flex-1 flex flex-col' },
                    // Messages publics
                    React.createElement('div', { className: 'flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3 bg-gradient-to-b from-gray-50 to-gray-100' },
                        publicMessages.length === 0 ? React.createElement('div', {
                            className: 'text-center text-gray-400 py-12'
                        },
                            React.createElement('i', { className: 'fas fa-comments text-5xl sm:text-6xl mb-4 opacity-50' }),
                            React.createElement('p', { className: 'text-base sm:text-lg font-medium' }, 'Aucun message public'),
                            React.createElement('p', { className: 'text-xs sm:text-sm text-gray-400 mt-2' }, 'Soyez le premier a envoyer un message!')
                        ) : publicMessages.map(msg => React.createElement('div', {
                            key: msg.id,
                            className: 'bg-white/95 rounded-xl shadow-lg p-3 sm:p-4 hover:shadow-2xl transition-shadow border border-white/50 ',
                            style: { boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.5)' }
                        },
                            React.createElement('div', { className: 'flex items-start gap-2 sm:gap-3' },
                                selectionMode && canDeleteMessage(msg) ? React.createElement('input', {
                                    type: 'checkbox',
                                    checked: selectedMessages.includes(msg.id),
                                    onChange: () => toggleMessageSelection(msg.id),
                                    className: 'w-5 h-5 mt-1 cursor-pointer flex-shrink-0',
                                    onClick: (e) => e.stopPropagation()
                                }) : null,
                                React.createElement('div', {
                                    className: 'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm sm:text-base shadow-md cursor-pointer hover:scale-110 transition-transform',
                                    onClick: () => openPrivateMessage(msg.sender_id, msg.sender_name),
                                    title: 'Envoyer un message prive a ' + msg.sender_name
                                }, msg.sender_name ? msg.sender_name.charAt(0).toUpperCase() : '?'),
                                React.createElement('div', { className: 'flex-1 min-w-0' },
                                    React.createElement('div', { className: 'flex flex-wrap items-center gap-1 sm:gap-2 mb-1' },
                                        React.createElement('span', {
                                            className: 'font-semibold text-gray-800 text-sm sm:text-base truncate cursor-pointer hover:text-indigo-600 transition-colors',
                                            onClick: () => openPrivateMessage(msg.sender_id, msg.sender_name),
                                            title: 'Envoyer un message prive a ' + msg.sender_name
                                        }, msg.sender_name),
                                        React.createElement('span', {
                                            className: 'text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium flex-shrink-0 ' + getRoleBadgeClass(msg.sender_role)
                                        }, getRoleLabel(msg.sender_role)),
                                        React.createElement('span', {
                                            className: 'text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium flex-shrink-0 bg-blue-100 text-blue-700'
                                        }, '🌐 Message public'),
                                        React.createElement('span', { className: 'text-xs text-gray-400 flex-shrink-0' }, formatMessageTime(msg.created_at))
                                    ),
                                    msg.audio_file_key ? React.createElement('div', { className: 'mt-2' },
                                        React.createElement('div', { className: 'bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 border border-gray-100' },
                                            React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                                React.createElement('i', { className: 'fas fa-microphone text-indigo-600 text-lg' }),
                                                React.createElement('span', { className: 'text-sm font-medium text-indigo-700' }, 'Message vocal')
                                            ),
                                            React.createElement('audio', {
                                                controls: true,
                                                preload: 'auto',
                                                controlsList: 'nodownload',
                                                className: 'w-full',
                                                style: { height: '54px', minHeight: '54px' },
                                                src: API_URL + '/audio/' + msg.audio_file_key,
                                                onError: (e) => {
                                                    // Erreur audio silencieuse
                                                }
                                            }),
                                            msg.audio_duration ? React.createElement('p', { className: 'text-xs text-gray-500 mt-2' },
                                                '⏱️ Durée: ' + formatRecordingDuration(msg.audio_duration)
                                            ) : null
                                        )
                                    ) : React.createElement('p', { className: 'text-gray-700 whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed' }, msg.content)
                                ),
                                canDeleteMessage(msg) ? React.createElement('button', {
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        deleteMessage(msg.id);
                                    },
                                    className: 'flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 transition-all transform hover:scale-110 active:scale-95',
                                    title: 'Supprimer le message'
                                },
                                    React.createElement('i', { className: 'fas fa-trash text-sm' })
                                ) : null
                            )
                        )),
                        React.createElement('div', { ref: messagesEndRef })
                    ),

                    // Input zone
                    React.createElement('div', { className: 'border-t border-gray-200 p-2 sm:p-4 bg-white shadow-lg' },
                        (isRecording || audioBlob) ? React.createElement('div', { className: 'mb-3 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border-2 border-red-200' },
                            React.createElement('div', { className: 'flex items-center justify-between mb-3' },
                                React.createElement('div', { className: 'flex items-center gap-3' },
                                    React.createElement('div', { className: 'w-3 h-3 bg-red-500 rounded-full animate-pulse' }),
                                    React.createElement('span', { className: 'font-semibold text-red-700' },
                                        isRecording ? 'Enregistrement en cours...' : 'Previsualisation audio'
                                    ),
                                    React.createElement('span', { className: 'text-sm text-gray-600 font-mono' },
                                        formatRecordingDuration(recordingDuration)
                                    )
                                ),
                                React.createElement('button', {
                                    onClick: cancelRecording,
                                    className: 'text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg p-2 transition-all',
                                    title: 'Annuler'
                                }, React.createElement('i', { className: 'fas fa-times' }))
                            ),
                            audioBlob ? React.createElement('div', { className: 'flex items-center gap-3 mb-3' },
                                React.createElement('audio', {
                                    controls: true,
                                    src: audioURL,
                                    className: 'flex-1 h-10'
                                })
                            ) : null,
                            React.createElement('div', { className: 'flex gap-2' },
                                isRecording ? React.createElement('button', {
                                    onClick: stopRecording,
                                    className: 'flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-semibold transition-all flex items-center justify-center gap-2'
                                },
                                    React.createElement('i', { className: 'fas fa-stop' }),
                                    'Arreter'
                                ) : React.createElement('button', {
                                    onClick: sendAudioMessage,
                                    disabled: !audioBlob,
                                    className: 'flex-1 bg-gradient-to-br from-slate-700 to-gray-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg px-4 py-2 font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50'
                                },
                                    React.createElement('i', { className: 'fas fa-paper-plane' }),
                                    'Envoyer le message vocal'
                                )
                            )
                        ) : null,
                        !isRecording && !audioBlob ? React.createElement('div', { className: 'flex gap-2' },
                            React.createElement('textarea', {
                                value: messageContent,
                                onChange: (e) => setMessageContent(e.target.value),
                                onKeyPress: handleKeyPress,
                                placeholder: 'Ecrire un message public... (Enter pour envoyer)',
                                className: 'flex-1 bg-white/95 border-2 border-white/50 rounded-xl px-3 sm:px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-600 focus:border-blue-600 resize-none transition-all shadow-lg hover:shadow-xl',
                                style: { boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.5)' },
                                rows: 2
                            }),
                            React.createElement('button', {
                                onClick: startRecording,
                                className: 'px-3 sm:px-4 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-semibold transition-all shadow-xl hover:shadow-2xl flex items-center justify-center transform hover:scale-105 active:scale-95',
                                title: 'Enregistrer un message vocal'
                            },
                                React.createElement('i', { className: 'fas fa-microphone text-sm sm:text-base' }),
                                React.createElement('span', { className: 'ml-2 hidden sm:inline' }, 'Audio')
                            ),
                            React.createElement('button', {
                                onClick: sendMessage,
                                disabled: !messageContent.trim(),
                                className: 'px-3 sm:px-6 bg-gradient-to-br from-slate-700 to-gray-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-xl hover:shadow-2xl disabled:hover:shadow-xl flex items-center justify-center transform hover:scale-105 active:scale-95',
                                style: { boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4), inset 0 -2px 8px rgba(0, 0, 0, 0.2)' }
                            },
                                React.createElement('i', { className: 'fas fa-paper-plane text-sm sm:text-base' }),
                                React.createElement('span', { className: 'ml-2 hidden sm:inline' }, 'Envoyer')
                            )
                        ) : null
                    )
                ) : null,

                // PRIVATE TAB
                activeTab === 'private' ? React.createElement('div', { className: 'flex-1 min-h-0 flex flex-col sm:flex-row' },
                    // Liste des conversations - Mobile: collapsible, Desktop: sidebar
                    React.createElement('div', { className: (selectedContact ? 'hidden sm:flex ' : 'flex ') + 'w-full sm:w-80 md:w-96 border-r border-gray-200 flex-col bg-gray-50' },
                        React.createElement('div', { className: 'p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50 shadow-sm' },
                            React.createElement('h3', { className: 'font-semibold text-gray-700 text-sm sm:text-base mb-2 flex items-center gap-2' },
                                React.createElement('i', { className: 'fas fa-address-book text-indigo-600' }),
                                'Contacts'
                            ),
                            React.createElement('select', {
                                onChange: (e) => {
                                    const userId = parseInt(e.target.value);
                                    if (!userId) {
                                        // Reset le select à la valeur par défaut
                                        e.target.value = '';
                                        return;
                                    }
                                    const user = availableUsers.find(u => u.id === userId);
                                    if (user) {
                                        setSelectedContact(user);
                                        loadPrivateMessages(user.id);
                                    }
                                    // Reset le select après sélection
                                    e.target.value = '';
                                },
                                className: "w-full px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-br from-white/95 to-gray-50/80 backdrop-blur-sm border-2 border-blue-300 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all hover:shadow-xl cursor-pointer font-semibold text-xs sm:text-sm appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%236366f1%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22M6 8l4 4 4-4%22/%3E%3C/svg%3E')] bg-[position:right_0.5rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-10",
                                style: { boxShadow: '0 6px 20px rgba(99, 102, 241, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.5)' },
                                value: ''
                            },
                                React.createElement('option', { value: '', disabled: true }, '📝 Nouvelle conversation...'),
                                React.createElement('option', { value: '0' }, '❌ Fermer ce menu'),
                                availableUsers.map(user => React.createElement('option', {
                                    key: user.id,
                                    value: user.id
                                }, user.full_name + ' (' + getRoleLabel(user.role) + ')'))
                            )
                        ),
                        React.createElement('div', { className: 'flex-1 overflow-y-auto' },
                            conversations.length === 0 ? React.createElement('div', {
                                className: 'text-center text-gray-500 py-8 px-4'
                            },
                                React.createElement('i', { className: 'fas fa-comments text-5xl mb-3 text-gray-300' }),
                                React.createElement('p', { className: 'text-sm font-semibold mb-2' }, 'Aucune conversation'),
                                React.createElement('p', { className: 'text-xs text-gray-400' },
                                    'Utilisez le menu ci-dessus pour demarrer une nouvelle conversation'
                                ),
                                React.createElement('div', { className: 'mt-3 text-indigo-600' },
                                    React.createElement('i', { className: 'fas fa-arrow-up mr-1' }),
                                    React.createElement('span', { className: 'text-xs font-semibold' }, 'Nouvelle conversation...')
                                )
                            ) : conversations.map(conv => React.createElement('div', {
                                key: conv.contact_id,
                                onClick: () => {
                                    setSelectedContact({ id: conv.contact_id, first_name: conv.contact_name, role: conv.contact_role });
                                    loadPrivateMessages(conv.contact_id);
                                },
                                className: 'p-2 sm:p-3 border-b border-gray-200 cursor-pointer hover:bg-indigo-50 transition-all active:scale-95 ' +
                                    (selectedContact?.id === conv.contact_id ? 'bg-indigo-100 border-l-4 border-l-indigo-600 shadow-sm' : 'bg-white hover:border-l-4 hover:border-l-indigo-300')
                            },
                                React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                    React.createElement('div', {
                                        className: 'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0 shadow-md'
                                    }, conv.contact_name ? conv.contact_name.charAt(0).toUpperCase() : '?'),
                                    React.createElement('div', { className: 'flex-1 min-w-0' },
                                        React.createElement('div', { className: 'flex items-center gap-1 sm:gap-2' },
                                            React.createElement('span', { className: 'font-semibold text-xs sm:text-sm text-gray-800 truncate' }, conv.contact_name),
                                            conv.unread_count > 0 ? React.createElement('span', {
                                                className: 'bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 animate-pulse'
                                            }, conv.unread_count) : null
                                        ),
                                        React.createElement('p', {
                                            className: 'text-xs text-gray-500 truncate'
                                        }, conv.last_message || 'Commencer la conversation')
                                    )
                                )
                            ))
                        )
                    ),

                    // Zone de conversation
                    selectedContact ? React.createElement('div', { className: 'flex-1 min-h-0 flex flex-col' },
                        // Header contact with back button on mobile
                        React.createElement('div', { className: 'p-2 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50 shadow-sm' },
                            React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3' },
                                // Back button for mobile only
                                React.createElement('button', {
                                    onClick: () => setSelectedContact(null),
                                    className: 'sm:hidden p-2 hover:bg-indigo-100 rounded-full transition-colors'
                                },
                                    React.createElement('i', { className: 'fas fa-arrow-left text-indigo-600' })
                                ),
                                React.createElement('div', {
                                    className: 'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-md flex-shrink-0'
                                }, selectedContact.first_name.charAt(0).toUpperCase()),
                                React.createElement('div', { className: 'flex-1 min-w-0' },
                                    React.createElement('h3', { className: 'font-semibold text-gray-800 text-sm sm:text-base truncate' }, selectedContact.first_name),
                                    React.createElement('span', {
                                        className: 'text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium inline-block ' + getRoleBadgeClass(selectedContact.role)
                                    }, getRoleLabel(selectedContact.role))
                                )
                            )
                        ),

                        // Messages
                        React.createElement('div', { className: 'flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3 bg-gradient-to-b from-gray-50 to-gray-100' },
                            loading ? React.createElement('div', { className: 'text-center text-gray-400 py-12' },
                                React.createElement('i', { className: 'fas fa-spinner fa-spin text-3xl sm:text-4xl text-indigo-500' })
                            ) : privateMessages.length === 0 ? React.createElement('div', {
                                className: 'text-center text-gray-400 py-8 sm:py-12 px-4'
                            },
                                React.createElement('i', { className: 'fas fa-comments text-5xl sm:text-6xl mb-3 sm:mb-4 opacity-50' }),
                                React.createElement('p', { className: 'text-sm sm:text-base' }, 'Commencez la conversation avec ' + selectedContact.first_name),
                                React.createElement('p', { className: 'text-xs text-gray-400 mt-2' }, 'Ecrivez votre premier message ci-dessous')
                            ) : privateMessages.map(msg => React.createElement('div', {
                                key: msg.id,
                                className: 'bg-white/95 rounded-xl shadow-lg p-3 sm:p-4 hover:shadow-2xl transition-shadow border border-white/50 ',
                                style: { boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.5)' }
                            },
                                React.createElement('div', { className: 'flex items-start gap-2 sm:gap-3' },
                                    selectionMode && canDeleteMessage(msg) ? React.createElement('input', {
                                        type: 'checkbox',
                                        checked: selectedMessages.includes(msg.id),
                                        onChange: () => toggleMessageSelection(msg.id),
                                        className: 'w-5 h-5 mt-1 cursor-pointer flex-shrink-0',
                                        onClick: (e) => e.stopPropagation()
                                    }) : null,
                                    React.createElement('div', {
                                        className: 'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm sm:text-base shadow-md'
                                    }, msg.sender_name ? msg.sender_name.charAt(0).toUpperCase() : '?'),
                                    React.createElement('div', { className: 'flex-1 min-w-0' },
                                        React.createElement('div', { className: 'flex flex-wrap items-center gap-1 sm:gap-2 mb-1' },
                                            React.createElement('span', { className: 'font-semibold text-gray-800 text-sm sm:text-base truncate' }, msg.sender_name),
                                            React.createElement('span', {
                                                className: 'text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium flex-shrink-0 bg-slate-100 text-slate-700'
                                            }, '🔒 Message privé'),
                                            React.createElement('span', { className: 'text-xs text-gray-400 flex-shrink-0' }, formatMessageTime(msg.created_at))
                                        ),
                                        msg.audio_file_key ? React.createElement('div', { className: 'mt-2' },
                                            React.createElement('div', { className: 'bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 border border-gray-100' },
                                                React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                                    React.createElement('i', { className: 'fas fa-microphone text-slate-600 text-lg' }),
                                                    React.createElement('span', { className: 'text-sm font-medium text-slate-700' }, 'Message vocal')
                                                ),
                                                React.createElement('audio', {
                                                    controls: true,
                                                    preload: 'auto',
                                                    controlsList: 'nodownload',
                                                    className: 'w-full',
                                                    style: { height: '54px', minHeight: '54px' },
                                                    src: API_URL + '/audio/' + msg.audio_file_key,
                                                    onError: (e) => {
                                                        // Erreur audio silencieuse
                                                    }
                                                }),
                                                msg.audio_duration ? React.createElement('p', { className: 'text-xs text-gray-500 mt-2' },
                                                    '⏱️ Durée: ' + formatRecordingDuration(msg.audio_duration)
                                                ) : null
                                            )
                                        ) : React.createElement('p', { className: 'text-gray-700 whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed' }, msg.content)
                                    ),
                                    canDeleteMessage(msg) ? React.createElement('button', {
                                        onClick: (e) => {
                                            e.stopPropagation();
                                            deleteMessage(msg.id);
                                        },
                                        className: 'flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 transition-all transform hover:scale-110 active:scale-95',
                                        title: 'Supprimer le message'
                                    },
                                        React.createElement('i', { className: 'fas fa-trash text-sm' })
                                    ) : null
                                )
                            )),
                            React.createElement('div', { ref: messagesEndRef })
                        ),

                        // Input
                        React.createElement('div', { className: 'border-t border-gray-200 p-2 sm:p-4 bg-white shadow-lg' },
                            (isRecording || audioBlob) ? React.createElement('div', { className: 'mb-3 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border-2 border-red-200' },
                                React.createElement('div', { className: 'flex items-center justify-between mb-3' },
                                    React.createElement('div', { className: 'flex items-center gap-3' },
                                        React.createElement('div', { className: 'w-3 h-3 bg-red-500 rounded-full animate-pulse' }),
                                        React.createElement('span', { className: 'font-semibold text-red-700' },
                                            isRecording ? 'Enregistrement en cours...' : 'Previsualisation audio'
                                        ),
                                        React.createElement('span', { className: 'text-sm text-gray-600 font-mono' },
                                            formatRecordingDuration(recordingDuration)
                                        )
                                    ),
                                    React.createElement('button', {
                                        onClick: cancelRecording,
                                        className: 'text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg p-2 transition-all',
                                        title: 'Annuler'
                                    }, React.createElement('i', { className: 'fas fa-times' }))
                                ),
                                audioBlob ? React.createElement('div', { className: 'flex items-center gap-3 mb-3' },
                                    React.createElement('audio', {
                                        controls: true,
                                        src: audioURL,
                                        className: 'flex-1 h-10'
                                    })
                                ) : null,
                                React.createElement('div', { className: 'flex gap-2' },
                                    isRecording ? React.createElement('button', {
                                        onClick: stopRecording,
                                        className: 'flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-semibold transition-all flex items-center justify-center gap-2'
                                    },
                                        React.createElement('i', { className: 'fas fa-stop' }),
                                        'Arreter'
                                    ) : React.createElement('button', {
                                        onClick: sendAudioMessage,
                                        disabled: !audioBlob,
                                        className: 'flex-1 bg-gradient-to-br from-slate-700 to-gray-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg px-4 py-2 font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50'
                                    },
                                        React.createElement('i', { className: 'fas fa-paper-plane' }),
                                        'Envoyer le message vocal'
                                    )
                                )
                            ) : null,
                            !isRecording && !audioBlob ? React.createElement('div', { className: 'flex gap-2' },
                                React.createElement('textarea', {
                                    value: messageContent,
                                    onChange: (e) => setMessageContent(e.target.value),
                                    onKeyPress: handleKeyPress,
                                    placeholder: 'Ecrire un message... (Enter pour envoyer)',
                                    className: 'flex-1 border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-600 focus:border-blue-600 resize-none transition-all',
                                    rows: 2
                                }),
                                React.createElement('button', {
                                    onClick: startRecording,
                                    className: 'px-3 sm:px-4 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-semibold transition-all shadow-xl hover:shadow-2xl flex items-center justify-center transform hover:scale-105 active:scale-95',
                                    title: 'Enregistrer un message vocal'
                                },
                                    React.createElement('i', { className: 'fas fa-microphone text-sm sm:text-base' }),
                                    React.createElement('span', { className: 'ml-2 hidden sm:inline' }, 'Audio')
                                ),
                                React.createElement('button', {
                                    onClick: sendMessage,
                                    disabled: !messageContent.trim(),
                                    className: 'px-3 sm:px-6 bg-gradient-to-r from-slate-700 to-gray-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-md hover:shadow-lg disabled:hover:shadow-md flex items-center justify-center'
                                },
                                    React.createElement('i', { className: 'fas fa-paper-plane text-sm sm:text-base' }),
                                    React.createElement('span', { className: 'ml-2 hidden sm:inline' }, 'Envoyer')
                                )
                            ) : null
                        )
                    ) : React.createElement('div', { className: 'flex-1 flex items-center justify-center bg-gray-50' },
                        React.createElement('div', { className: 'text-center text-gray-400' },
                            React.createElement('i', { className: 'fas fa-arrow-left text-6xl mb-4' }),
                            React.createElement('p', { className: 'text-lg mb-6' }, 'Sélectionnez un contact'),
                            React.createElement('button', {
                                onClick: onClose,
                                className: 'mt-4 px-6 py-3 bg-gradient-to-r from-slate-700 to-gray-700 text-white rounded-lg hover:from-slate-800 hover:to-gray-800 font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 mx-auto'
                            },
                                React.createElement('i', { className: 'fas fa-times' }),
                                React.createElement('span', {}, 'Fermer')
                            )
                        )
                    )
                ) : null
            )
        )
    );
};
