const MessageBubble = React.memo(({ msg, isMe, currentUser, activeTab, selectionMode, isSelected, onToggleSelection, onDelete, onOpenPrivate, onPlayAudio }) => {
    
    const roleBadgeClass = (role) => {
        const colors = {
            'admin': 'bg-red-100 text-red-700', 'director': 'bg-red-50 text-red-600',
            'supervisor': 'bg-yellow-100 text-yellow-700', 'coordinator': 'bg-amber-100 text-amber-700',
            'technician': 'bg-blue-50 text-blue-600', 'operator': 'bg-green-50 text-green-600'
        };
        return colors[role] || 'bg-gray-100 text-gray-700';
    };

    const roleLabel = (role) => {
        const labels = {
            'admin': 'Admin', 'supervisor': 'Superviseur', 'technician': 'Technicien', 'operator': 'Opérateur'
        };
        return labels[role] || role;
    };

    const formatTime = (timestamp) => {
        const isoTimestamp = timestamp.replace(' ', 'T') + (timestamp.includes('Z') ? '' : 'Z');
        const dateUTC = new Date(isoTimestamp);
        const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
        // Legacy Fix: Standard logic was causing double offset (UTC-10) or partial shift.
        // D1 timestamps are UTC.
        // We want to display LOCAL TIME (e.g. EST).
        // If we add offset to UTC, we get "Local Time Value" in UTC variable.
        // e.g. 15:00 UTC + (-5h) = 10:00 UTC.
        // Then we display it as UTC using toLocaleDateString('...UTC')?
        // NO! The previous code used `date.toLocaleDateString` WITHOUT timezone option.
        // This used the BROWSER timezone on the SHIFTED date.
        // 10:00 UTC -> Browser (EST) -> 05:00. 
        // THIS IS THE BUG. 10:00 - 5 = 05:00. "UTC - 10".
        
        // CORRECTION:
        // We manually shift the date. 
        // Then we must force the formatter to treat it as UTC so it doesn't shift it AGAIN.
        const date = new Date(dateUTC.getTime() + (offset * 60 * 60 * 1000));
        return date.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'short', 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'UTC' // <--- CRITICAL FIX: Prevent browser from shifting the already-shifted date
        });
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    };

    const formatContent = (content) => {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = linkRegex.exec(content)) !== null) {
            if (match.index > lastIndex) parts.push(content.substring(lastIndex, match.index));
            const label = match[1];
            const url = match[2];
            parts.push(React.createElement('button', {
                key: match.index,
                onClick: (e) => {
                    e.stopPropagation();
                    if (url === '/planning') {
                        setTimeout(() => window.dispatchEvent(new CustomEvent('open-planning')), 100);
                    } else if (url.startsWith('/')) {
                        window.location.href = url;
                    } else {
                        window.open(url, '_blank');
                    }
                },
                className: 'inline-flex items-center gap-1.5 px-3 py-1 my-1 mx-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all font-semibold text-xs shadow-sm transform hover:scale-105'
            }, React.createElement('i', { className: 'fas fa-external-link-alt' }), label));
            lastIndex = linkRegex.lastIndex;
        }
        if (lastIndex < content.length) parts.push(content.substring(lastIndex));
        return parts.length > 0 ? parts : content;
    };

    const canDeleteMsg = () => {
        if (msg.sender_id === currentUser.id) return true;
        if (currentUser?.role === 'admin') return true;
        if (currentUser?.role === 'supervisor' && msg.sender_role !== 'admin') return true;
        return false;
    };

    return React.createElement('div', {
        className: 'flex w-full mb-2 ' + (isMe ? 'justify-end pr-4' : 'justify-start pl-1') + ' group px-2 items-end'
    },
        selectionMode && canDeleteMsg() ? React.createElement('input', {
            type: 'checkbox',
            checked: isSelected,
            onChange: () => onToggleSelection(msg.id),
            className: 'w-4 h-4 mx-2 cursor-pointer self-center flex-shrink-0',
            onClick: (e) => e.stopPropagation()
        }) : null,
        
        React.createElement('div', {
            className: 'max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 shadow-sm border relative flex flex-col ' +
                (isMe ? 'bg-blue-100 border-blue-200 rounded-tr-sm items-end' : 'bg-white border-gray-200 rounded-tl-sm items-start')
        },
            activeTab === 'public' && !isMe ? React.createElement('div', { className: 'flex items-center gap-2 mb-1 flex-wrap justify-start' },
                React.createElement('div', {
                    className: 'w-5 h-5 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white font-bold text-[10px] shadow-sm cursor-pointer',
                    onClick: () => onOpenPrivate(msg.sender_id, msg.sender_name),
                    title: 'Message privé'
                }, msg.sender_name ? msg.sender_name.charAt(0).toUpperCase() : '?'),
                React.createElement('span', {
                    className: 'font-bold text-xs text-gray-700 cursor-pointer hover:text-blue-600',
                    onClick: () => onOpenPrivate(msg.sender_id, msg.sender_name)
                }, msg.sender_name),
                React.createElement('span', {
                    className: 'text-[10px] px-1.5 py-0.5 rounded-full ' + roleBadgeClass(msg.sender_role)
                }, roleLabel(msg.sender_role)),
                React.createElement('span', { className: 'text-[10px] text-gray-400' }, formatTime(msg.created_at))
            ) : null,

            msg.audio_file_key ? React.createElement('div', { className: 'mt-1 w-full' },
                React.createElement('div', { className: 'flex items-center gap-2 bg-white/50 rounded-lg p-2' },
                    React.createElement('i', { className: 'fas fa-microphone ' + (isMe ? 'text-blue-600' : 'text-gray-600') }),
                    React.createElement('audio', {
                        controls: true,
                        controlsList: 'nodownload',
                        preload: 'metadata', // OPTIMISATION: Ne charge pas l'audio tout de suite
                        className: 'h-8 min-w-[200px] max-w-[220px]',
                        src: '/api/v2/chat/audio/' + msg.audio_file_key // Use relative path for proxy
                    })
                ),
                msg.audio_duration ? React.createElement('p', { className: 'text-[10px] text-gray-500 mt-1 text-right' }, formatDuration(msg.audio_duration)) : null
            ) : React.createElement('div', { className: 'flex flex-col ' + (isMe ? 'items-end' : 'items-start') },
                React.createElement('div', { 
                    className: 'text-sm whitespace-pre-wrap break-words leading-snug ' + (isMe ? 'text-blue-900 text-right' : 'text-gray-800 text-left')
                }, formatContent(msg.content)),
                activeTab === 'private' ? React.createElement('span', { className: 'text-[10px] text-gray-400 mt-1 opacity-70' }, formatTime(msg.created_at)) : null
            ),
            
            canDeleteMsg() && !selectionMode ? React.createElement('button', {
                onClick: (e) => { e.stopPropagation(); onDelete(msg.id); },
                className: 'absolute -top-2 ' + (isMe ? '-left-2' : '-right-2') + ' bg-white text-red-500 rounded-full w-6 h-6 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity border border-gray-200 z-10',
                title: 'Supprimer'
            }, React.createElement('i', { className: 'fas fa-trash text-[10px]' })) : null
        )
    );
}, (prevProps, nextProps) => {
    // Custom comparison function for Memo
    return (
        prevProps.msg.id === nextProps.msg.id &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.selectionMode === nextProps.selectionMode &&
        prevProps.isMe === nextProps.isMe
    );
});

const MessagingChatWindow = ({ 
    messages, 
    currentUser: propUser, 
    loading, 
    activeTab, 
    selectedContact, 
    onSendMessage, 
    onSendAudio, 
    onDeleteMessage, 
    onBulkDelete,
    onOpenPrivateMessage,
    onBack,
    onClose,
    onTicketDetected
}) => {
    // PARACHUTE FIX: Fallback to cache if currentUser is missing (Offline/Refresh fix)
    const currentUser = React.useMemo(() => {
        if (propUser) return propUser;
        try { return JSON.parse(localStorage.getItem('user_cache') || '{}'); } catch(e) { return {}; }
    }, [propUser]);

    const messagesEndRef = React.useRef(null);
    const [messageContent, setMessageContent] = React.useState('');
    
    // Audio recording state
    const [isRecording, setIsRecording] = React.useState(false);
    const [audioBlob, setAudioBlob] = React.useState(null);
    const [recordingDuration, setRecordingDuration] = React.useState(0);
    const [audioURL, setAudioURL] = React.useState(null);
    const mediaRecorderRef = React.useRef(null);
    const audioChunksRef = React.useRef([]);
    const recordingTimerRef = React.useRef(null);

    // Dictation state
    const [isDictating, setIsDictating] = React.useState(false);
    const dictationRef = React.useRef(null);

    // Image Upload State
    const [selectedImage, setSelectedImage] = React.useState(null);
    const [imagePreview, setImagePreview] = React.useState(null);
    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef(null);
    const [isOnline, setIsOnline] = React.useState(navigator.onLine);

    // Selection mode state
    const [selectionMode, setSelectionMode] = React.useState(false);
    const [selectedMessages, setSelectedMessages] = React.useState([]);

    // Audio playback state
    const [playingAudio, setPlayingAudio] = React.useState({});

    // MAGIC TICKET STATE
    const [isMagicRecording, setIsMagicRecording] = React.useState(false);
    const [isMagicAnalyzing, setIsMagicAnalyzing] = React.useState(false);
    const magicMediaRecorderRef = React.useRef(null);
    const magicChunksRef = React.useRef([]);

    const startMagicRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            magicChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) magicChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(magicChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                await analyzeMagicAudio(audioBlob);
            };

            recorder.start();
            magicMediaRecorderRef.current = recorder;
            setIsMagicRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Impossible d'accéder au microphone. Vérifiez vos permissions.");
        }
    };

    const stopMagicRecording = () => {
        if (magicMediaRecorderRef.current && isMagicRecording) {
            magicMediaRecorderRef.current.stop();
            setIsMagicRecording(false);
            setIsMagicAnalyzing(true);
        }
    };

    const analyzeMagicAudio = async (audioBlob) => {
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.webm');

        try {
            const response = await axios.post('/api/ai/analyze-ticket', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data) {
                if (response.data.priority) {
                    response.data.priority = response.data.priority.toLowerCase();
                }
                // Call parent callback
                if (onTicketDetected) {
                    onTicketDetected(response.data);
                } else {
                    console.warn('onTicketDetected prop is missing');
                }
            }
        } catch (error) {
            console.error("AI Analysis failed:", error);
            alert("Erreur lors de l'analyse vocale: " + (error.response?.data?.error || error.message));
        } finally {
            setIsMagicAnalyzing(false);
        }
    };

    // Scroll to bottom on new messages
    React.useEffect(() => {
        if (activeTab === 'private' && selectedContact) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, activeTab, selectedContact]);

    // Init Dictation & Online Status
    React.useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            dictationRef.current = new SpeechRecognition();
            dictationRef.current.continuous = false;
            dictationRef.current.interimResults = false;
            dictationRef.current.lang = 'fr-FR';

            dictationRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const capitalizedTranscript = transcript.charAt(0).toUpperCase() + transcript.slice(1);
                
                setMessageContent(prev => {
                    const prefix = prev ? prev + ' ' : '';
                    return prefix + capitalizedTranscript;
                });
                setIsDictating(false);
            };

            dictationRef.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsDictating(false);
            };

            dictationRef.current.onend = () => {
                setIsDictating(false);
            };
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const toggleDictation = () => {
        if (isDictating) {
            dictationRef.current?.stop();
        } else {
            dictationRef.current?.start();
            setIsDictating(true);
        }
    };

    // Audio functions
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            });

            let mimeType = '';
            if (MediaRecorder.isTypeSupported('audio/mpeg')) mimeType = 'audio/mpeg';
            else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
            else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
            else mimeType = 'audio/webm';

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
        if (isRecording) stopRecording();
        setAudioBlob(null);
        setAudioURL(null);
        setRecordingDuration(0);
        audioChunksRef.current = [];
        if (audioURL) URL.revokeObjectURL(audioURL);
    };

    const handleSendAudio = () => {
        if (audioBlob) {
            onSendAudio(audioBlob, recordingDuration);
            cancelRecording();
        }
    };

    const handleSendMessage = async () => {
        // Mode IMAGE
        if (selectedImage) {
            if (!isOnline) {
                alert("Impossible d'envoyer des images hors ligne.");
                return;
            }

            try {
                setIsUploading(true);
                const formData = new FormData();
                formData.append('file', selectedImage);

                // 1. Upload File
                const uploadRes = await fetch('/api/v2/chat/upload', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });

                if (!uploadRes.ok) throw new Error('Upload failed');
                
                const { key } = await uploadRes.json();

                // 2. Send Message with Attachment
                onSendMessage(messageContent || '📷 Photo', 'image', key);
                
                // Cleanup
                cancelImageSelection();
            } catch (error) {
                console.error("Image upload error:", error);
                alert("Erreur lors de l'envoi de l'image");
            } finally {
                setIsUploading(false);
            }
        } 
        // Mode TEXTE
        else if (messageContent.trim()) {
            onSendMessage(messageContent);
            setMessageContent('');
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // BIBLE RULE: Strict Validation
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!ALLOWED_TYPES.includes(file.type)) {
            alert("Format non supporté. Utilisez JPG, PNG ou WEBP.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert("L'image est trop volumineuse (Max 5MB).");
            return;
        }
        if (file.size === 0) {
            alert("Fichier vide invalide.");
            return;
        }

        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const cancelImageSelection = () => {
        setSelectedImage(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isUploading) handleSendMessage();
        }
    };

    const formatRecordingDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    };

    const formatMessageTime = (timestamp) => {
        const isoTimestamp = timestamp.replace(' ', 'T') + (timestamp.includes('Z') ? '' : 'Z');
        const dateUTC = new Date(isoTimestamp);
        const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
        const date = new Date(dateUTC.getTime() + (offset * 60 * 60 * 1000));
        
        // Simple logic for "now", "minutes ago", etc. can be copied or simplified
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const getRoleBadgeClass = (role) => {
        const colors = {
            'admin': 'bg-red-100 text-red-700', 'director': 'bg-red-50 text-red-600',
            'supervisor': 'bg-yellow-100 text-yellow-700', 'coordinator': 'bg-amber-100 text-amber-700',
            'technician': 'bg-blue-50 text-blue-600', 'operator': 'bg-green-50 text-green-600'
        };
        return colors[role] || 'bg-gray-100 text-gray-700';
    };

    const getRoleLabel = (role) => {
        const labels = {
            'admin': 'Admin', 'supervisor': 'Superviseur', 'technician': 'Technicien', 'operator': 'Opérateur'
        };
        return labels[role] || role;
    };

    const canDelete = (msg) => {
        if (msg.sender_id === currentUser.id) return true;
        if (currentUser?.role === 'admin') return true;
        if (currentUser?.role === 'supervisor' && msg.sender_role !== 'admin') return true;
        return false;
    };

    // Selection Logic
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
        const selectableIds = messages.filter(msg => canDelete(msg)).map(msg => msg.id);
        setSelectedMessages(selectableIds);
    };

    const handleBulkDelete = () => {
        if (selectedMessages.length > 0) {
            onBulkDelete(selectedMessages);
            setSelectedMessages([]);
            setSelectionMode(false);
        }
    };

    // Memoize handlers to keep MessageBubble props stable
    const handleToggleSelection = React.useCallback((id) => {
        toggleMessageSelection(id);
    }, [toggleMessageSelection]);

    const handleOpenPrivate = React.useCallback((id, name) => {
        if (onOpenPrivateMessage) onOpenPrivateMessage(id, name);
    }, [onOpenPrivateMessage]);

    // RENDER
    if (activeTab === 'private' && !selectedContact) {
        return React.createElement('div', { className: 'flex-1 flex items-center justify-center bg-gray-50' },
            React.createElement('div', { className: 'text-center text-gray-400' },
                React.createElement('i', { className: 'fas fa-arrow-left text-6xl mb-4' }),
                React.createElement('p', { className: 'text-lg mb-6' }, 'Sélectionnez un contact'),
                React.createElement('button', {
                    onClick: onClose || onBack, // Use onClose if available, otherwise fallback to onBack (though onBack likely just clears selection which is already null)
                    className: 'hidden sm:block mt-4 px-6 py-3 bg-gradient-to-r from-slate-700 to-gray-700 text-white rounded-lg hover:from-slate-800 hover:to-gray-800 font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 mx-auto'
                },
                    React.createElement('i', { className: 'fas fa-times' }),
                    React.createElement('span', {}, 'Fermer')
                )
            )
        );
    }

    return React.createElement('div', { className: 'flex-1 flex flex-col min-w-0' },
        // Header for Private Chat
        activeTab === 'private' && selectedContact ? React.createElement('div', { className: 'p-2 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50 shadow-sm' },
            React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3' },
                React.createElement('button', {
                    onClick: onBack,
                    className: 'sm:hidden p-2 hover:bg-indigo-100 rounded-full transition-colors'
                },
                    React.createElement('i', { className: 'fas fa-arrow-left text-indigo-600' })
                ),
                React.createElement('div', {
                    className: 'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-md flex-shrink-0'
                }, (selectedContact.first_name || selectedContact.full_name || '?').charAt(0).toUpperCase()),
                React.createElement('div', { className: 'flex-1 min-w-0' },
                    React.createElement('h3', { className: 'font-semibold text-gray-800 text-sm sm:text-base truncate' }, selectedContact.first_name || selectedContact.full_name || 'Utilisateur'),
                    React.createElement('span', {
                        className: 'text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium inline-block ' + getRoleBadgeClass(selectedContact.role)
                    }, getRoleLabel(selectedContact.role))
                )
            )
        ) : null,

        // Toolbar (Public or Private)
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
                    selectionMode ? 'Annuler' : 'Sélectionner'
                ),
                selectionMode ? React.createElement('button', {
                    onClick: selectAllMessages,
                    className: 'px-3 py-1.5 text-sm font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all'
                },
                    React.createElement('i', { className: 'fas fa-check-double mr-1.5' }),
                    'Tout'
                ) : null
            ),
            selectionMode && selectedMessages.length > 0 ? React.createElement('button', {
                onClick: handleBulkDelete,
                className: 'px-3 py-1.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all'
            },
                React.createElement('i', { className: 'fas fa-trash mr-1.5' }),
                'Supprimer (' + selectedMessages.length + ')'
            ) : null
        ),

        // Message List
        React.createElement('div', { className: 'flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 sm:p-4 space-y-2 sm:space-y-3 bg-gradient-to-b from-gray-50 to-gray-100' },
            loading ? React.createElement('div', { className: 'text-center text-gray-400 py-12' },
                React.createElement('i', { className: 'fas fa-spinner fa-spin text-3xl sm:text-4xl text-indigo-500' })
            ) : messages.length === 0 ? React.createElement('div', {
                className: 'text-center text-gray-400 py-12'
            },
                React.createElement('i', { className: 'fas fa-comments text-5xl sm:text-6xl mb-4 opacity-50' }),
                React.createElement('p', { className: 'text-base sm:text-lg font-medium' }, 'Aucun message'),
                React.createElement('p', { className: 'text-xs sm:text-sm text-gray-400 mt-2' }, 'Soyez le premier à envoyer un message!')
            ) : messages.map(msg => {
                return React.createElement(MessageBubble, {
                    key: msg.id,
                    msg: msg,
                    isMe: msg.sender_id === currentUser.id,
                    currentUser: currentUser,
                    activeTab: activeTab,
                    selectionMode: selectionMode,
                    isSelected: selectedMessages.includes(msg.id),
                    onToggleSelection: handleToggleSelection,
                    onDelete: onDeleteMessage,
                    onOpenPrivate: handleOpenPrivate,
                    onPlayAudio: null
                });
            }),
            React.createElement('div', { ref: messagesEndRef })
        ),

        // Input Zone (Rest preserved below)
        React.createElement('div', { className: 'border-t border-gray-200 p-2 sm:p-4 bg-white shadow-lg' },
            // Hidden File Input
            React.createElement('input', {
                type: 'file',
                ref: fileInputRef,
                onChange: handleImageSelect,
                accept: 'image/jpeg,image/png,image/gif,image/webp',
                className: 'hidden'
            }),

            // IMAGE PREVIEW ZONE
            selectedImage ? React.createElement('div', { className: 'mb-3 p-3 bg-blue-50 rounded-xl border border-blue-200 relative' },
                React.createElement('button', {
                    onClick: cancelImageSelection,
                    className: 'absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-red-600 z-10',
                    title: 'Supprimer l\'image'
                }, React.createElement('i', { className: 'fas fa-times text-xs' })),
                
                React.createElement('div', { className: 'flex items-center gap-3' },
                    React.createElement('img', {
                        src: imagePreview,
                        className: 'h-16 w-16 object-cover rounded-lg border border-blue-200 shadow-sm'
                    }),
                    React.createElement('div', { className: 'flex-1 min-w-0' },
                        React.createElement('p', { className: 'text-sm font-medium text-blue-900 truncate' }, selectedImage.name),
                        React.createElement('p', { className: 'text-xs text-blue-600' }, (selectedImage.size / 1024).toFixed(1) + ' KB')
                    )
                )
            ) : null,

            (isRecording || audioBlob) ? React.createElement('div', { className: 'mb-3 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border-2 border-red-200' },
                React.createElement('div', { className: 'flex items-center justify-between mb-3' },
                    React.createElement('div', { className: 'flex items-center gap-3' },
                        React.createElement('div', { className: 'w-3 h-3 bg-red-500 rounded-full animate-pulse' }),
                        React.createElement('span', { className: 'font-semibold text-red-700' },
                            isRecording ? 'Enregistrement en cours...' : 'Prévisualisation audio'
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
                        'Arrêter'
                    ) : React.createElement('button', {
                        onClick: handleSendAudio,
                        disabled: !audioBlob,
                        className: 'flex-1 bg-gradient-to-br from-slate-700 to-gray-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg px-4 py-2 font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50'
                    },
                        React.createElement('i', { className: 'fas fa-paper-plane' }),
                        'Envoyer le message vocal'
                    )
                )
            ) : null,
            !isRecording && !audioBlob ? React.createElement('div', { className: 'flex gap-2 items-end' },
                // Bouton PHOTO (Nouveau)
                React.createElement('button', {
                    onClick: () => fileInputRef.current?.click(),
                    disabled: !isOnline || isUploading,
                    className: 'flex-shrink-0 w-10 h-10 mb-1 rounded-full flex items-center justify-center transition-all ' + 
                        (isOnline ? 'text-gray-500 hover:text-blue-600 hover:bg-blue-50' : 'text-gray-300 cursor-not-allowed'),
                    title: isOnline ? 'Envoyer une photo' : 'Photo indisponible hors ligne'
                },
                    React.createElement('i', { className: 'fas fa-camera text-lg' })
                ),

                React.createElement('div', { className: 'flex-1 relative' },
                    React.createElement('textarea', {
                        value: messageContent,
                        onChange: (e) => setMessageContent(e.target.value),
                        onKeyPress: handleKeyPress,
                        placeholder: selectedImage ? 'Ajouter une légende...' : 'Écrire un message...',
                        className: 'w-full border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 pr-10 text-sm sm:text-base focus:ring-2 focus:ring-blue-600 focus:border-blue-600 resize-none transition-all shadow-lg hover:shadow-xl',
                        rows: 1, // Reduced default height
                        style: { minHeight: '42px', maxHeight: '120px' }
                    }),
                    dictationRef.current ? React.createElement('button', {
                        onClick: toggleDictation,
                        className: 'absolute right-2 bottom-2 p-1.5 rounded-full transition-colors ' + 
                            (isDictating ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'),
                        title: "Dictée vocale"
                    },
                        isDictating 
                            ? React.createElement('i', { className: 'fas fa-stop-circle' }) 
                            : React.createElement('i', { className: 'fas fa-microphone' })
                    ) : null
                ),

                // BOUTON MAGIC TICKET (IA)
                React.createElement('button', {
                    onClick: isMagicRecording ? stopMagicRecording : startMagicRecording,
                    disabled: isMagicAnalyzing || isRecording,
                    className: 'flex-shrink-0 w-10 h-10 mb-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 ' + (isMagicRecording ? 'animate-pulse ring-2 ring-violet-300' : ''),
                    title: isMagicRecording ? 'Arrêter l\'analyse' : 'Créer un ticket (IA)'
                },
                    isMagicAnalyzing ? React.createElement('i', { className: 'fas fa-spinner fa-spin' }) :
                    isMagicRecording ? React.createElement('i', { className: 'fas fa-stop' }) :
                    React.createElement('i', { className: 'fas fa-magic' })
                ),

                React.createElement('button', {
                    onClick: startRecording,
                    className: 'flex-shrink-0 px-3 sm:px-4 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-semibold transition-all shadow-xl hover:shadow-2xl flex items-center justify-center transform hover:scale-105 active:scale-95',
                    title: 'Enregistrer un message vocal'
                },
                    React.createElement('i', { className: 'fas fa-microphone text-sm sm:text-base' }),
                    React.createElement('span', { className: 'ml-2 hidden sm:inline' }, 'Audio')
                ),
                React.createElement('button', {
                    onClick: handleSendMessage,
                    disabled: (!messageContent.trim() && !selectedImage) || isUploading,
                    className: 'flex-shrink-0 px-3 sm:px-6 h-10 mb-1 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-xl hover:shadow-2xl disabled:hover:shadow-xl flex items-center justify-center transform hover:scale-105 active:scale-95'
                },
                    isUploading 
                        ? React.createElement('i', { className: 'fas fa-spinner fa-spin' })
                        : React.createElement('i', { className: 'fas fa-paper-plane text-sm sm:text-base' }),
                    React.createElement('span', { className: 'ml-2 hidden sm:inline' }, isUploading ? 'Envoi...' : 'Envoyer')
                )
            ) : null
        )
    );
};

window.MessagingChatWindow = MessagingChatWindow;