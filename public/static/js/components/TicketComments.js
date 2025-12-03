const TicketComments = ({ ticketId, currentUser, onRefresh }) => {
    const [comments, setComments] = React.useState([]);
    const [visibleCommentsCount, setVisibleCommentsCount] = React.useState(50);
    const [newComment, setNewComment] = React.useState('');
    const [submittingComment, setSubmittingComment] = React.useState(false);
    const [uploadingMedia, setUploadingMedia] = React.useState(false);
    const [confirmDialog, setConfirmDialog] = React.useState({ show: false, message: '', onConfirm: null });
    
    // Voice recognition setup
    const [isRecording, setIsRecording] = React.useState(false);
    const recognitionRef = React.useRef(null);

    React.useEffect(() => {
        if (ticketId) {
            loadComments();
        }
    }, [ticketId]);

    React.useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'fr-FR';

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const capitalizedTranscript = transcript.charAt(0).toUpperCase() + transcript.slice(1);
                
                setNewComment(prev => {
                    const prefix = prev ? prev + ' ' : '';
                    return prefix + capitalizedTranscript;
                });
                setIsRecording(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsRecording(false);
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
        }
    }, []);

    const toggleRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
            setIsRecording(true);
        }
    };

    const loadComments = async () => {
        try {
            const response = await axios.get(API_URL + '/comments/ticket/' + ticketId);
            setComments(response.data.comments || []);
            setVisibleCommentsCount(50);
        } catch (error) {
            // Erreur silencieuse
        }
    };

    const handleDeleteComment = async (commentId) => {
        setConfirmDialog({
            show: true,
            message: 'Supprimer ce commentaire ? (Si c\'est un message vocal, le fichier audio sera aussi supprimé)',
            onConfirm: async () => {
                setConfirmDialog({ show: false, message: '', onConfirm: null });
                try {
                    await axios.delete(API_URL + '/comments/' + commentId);
                    alert('Commentaire supprimé');
                    loadComments();
                    if (onRefresh) onRefresh();
                } catch (error) {
                    alert('Erreur lors de la suppression: ' + (error.response?.data?.error || 'Erreur inconnue'));
                }
            }
        });
    };

    const [audioBlob, setAudioBlob] = React.useState(null);
    const [isRecordingAudio, setIsRecordingAudio] = React.useState(false);
    const [recordingDuration, setRecordingDuration] = React.useState(0);
    const mediaRecorderRef = React.useRef(null);
    const audioChunksRef = React.useRef([]);
    const recordingTimerRef = React.useRef(null);

    React.useEffect(() => {
        return () => {
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        };
    }, []);

    const startAudioRecording = async () => {
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
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: mimeType });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecordingAudio(true);
            setRecordingDuration(0);

            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

        } catch (error) {
            alert('Impossible d\'accéder au microphone');
        }
    };

    const stopAudioRecording = () => {
        if (mediaRecorderRef.current && isRecordingAudio) {
            mediaRecorderRef.current.stop();
            setIsRecordingAudio(false);
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }
        }
    };

    const cancelAudioRecording = () => {
        if (isRecordingAudio) stopAudioRecording();
        setAudioBlob(null);
        setRecordingDuration(0);
        audioChunksRef.current = [];
    };

    const renderCommentContent = (commentText) => {
        // SAFEGUARD: Ensure commentText is a string
        if (typeof commentText === 'object' && commentText !== null) {
            try {
                commentText = JSON.stringify(commentText);
            } catch (e) {
                commentText = "[Objet non affichable]";
            }
        }
        if (commentText === null || commentText === undefined) commentText = "";
        commentText = String(commentText);

        const audioMatch = commentText.match(/\[audio:(\d+)\]/);
        
        if (audioMatch) {
            const mediaId = audioMatch[1];
            const textPart = commentText.replace(/\[audio:\d+\]/, '').trim();
            
            return React.createElement('div', {},
                textPart ? React.createElement('p', { className: 'mb-2 text-gray-700 text-sm' }, textPart) : null,
                React.createElement('div', { className: 'bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-3 border border-blue-100 shadow-sm inline-block min-w-[250px]' },
                    React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                        React.createElement('div', { className: 'w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center' },
                            React.createElement('i', { className: 'fas fa-microphone text-blue-600 text-xs' })
                        ),
                        React.createElement('span', { className: 'text-xs font-bold text-blue-700' }, 'Message vocal')
                    ),
                    React.createElement('audio', {
                        controls: true,
                        controlsList: "nodownload",
                        src: API_URL + '/media/' + mediaId,
                        className: 'h-8 w-full max-w-[300px]',
                        preload: "metadata"
                    })
                )
            );
        }
        
        return React.createElement('p', { className: 'text-gray-700 text-sm whitespace-pre-wrap' }, commentText);
    };

    const handleUploadAudio = async () => {
        if (!audioBlob) return;
        
        setUploadingMedia(true);
        try {
            const formData = new FormData();
            const safeName = (currentUser.first_name || 'user').replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `vocal_${safeName}_${new Date().getTime()}.${audioBlob.type.includes('mp4') ? 'mp4' : 'webm'}`;
            formData.append('file', audioBlob, filename);
            formData.append('ticket_id', ticketId);

            const response = await axios.post(API_URL + '/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const mediaId = response.data.media ? response.data.media.id : '';
            const utcTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
            let userRoleFr = 'Opérateur';
            if (currentUser?.role === 'technician') userRoleFr = 'Technicien';
            else if (currentUser?.role === 'supervisor') userRoleFr = 'Superviseur';
            else if (currentUser?.role === 'admin') userRoleFr = 'Admin';
            
            const commentText = mediaId 
                ? `🎤 A ajouté un message vocal\n[audio:${mediaId}]` 
                : '🎤 A ajouté un message vocal';

            await axios.post(API_URL + '/comments', {
                ticket_id: ticketId,
                user_name: currentUser.first_name || currentUser.email || 'Utilisateur', // Fallback
                user_role: userRoleFr,
                comment: commentText,
                created_at: utcTime
            });

            alert('Message vocal envoyé !');
            setAudioBlob(null);
            loadComments();
            if (onRefresh) onRefresh();
        } catch (error) {
            alert("Erreur lors de l'envoi du message vocal");
        } finally {
            setUploadingMedia(false);
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) {
            alert('Veuillez écrire un commentaire');
            return;
        }

        setSubmittingComment(true);
        try {
            const utcTime = new Date();
            const year = utcTime.getUTCFullYear();
            const month = String(utcTime.getUTCMonth() + 1).padStart(2, '0');
            const day = String(utcTime.getUTCDate()).padStart(2, '0');
            const hours = String(utcTime.getUTCHours()).padStart(2, '0');
            const minutes = String(utcTime.getUTCMinutes()).padStart(2, '0');
            const seconds = String(utcTime.getUTCSeconds()).padStart(2, '0');
            const localTimestamp = year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;

            let userRoleFr = 'Opérateur';
            if (currentUser?.role === 'technician') userRoleFr = 'Technicien';
            else if (currentUser?.role === 'supervisor') userRoleFr = 'Superviseur';
            else if (currentUser?.role === 'admin') userRoleFr = 'Admin';

            await axios.post(API_URL + '/comments', {
                ticket_id: ticketId,
                user_name: currentUser.first_name || currentUser.email || 'Utilisateur', // Fallback
                user_role: userRoleFr,
                comment: newComment,
                created_at: localTimestamp
            });

            setNewComment('');
            loadComments();
        } catch (error) {
            alert("Erreur lors de l'ajout du commentaire");
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleInvalidComment = (e) => {
        e.target.setCustomValidity("Veuillez remplir ce champ.");
    };

    const handleInputComment = (e) => {
        e.target.setCustomValidity("");
        setNewComment(e.target.value);
    };

    return React.createElement('div', { className: 'mb-4 sm:mb-6 border-t-2 border-gray-200 pt-4 sm:pt-6' },
        React.createElement('h4', { className: 'text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center' },
            React.createElement('i', { className: 'fas fa-comments mr-2 text-igp-blue text-sm sm:text-base' }),
            'Commentaires et Notes (' + comments.length + ')'
        ),

        comments.length > 0 ? React.createElement('div', { className: 'space-y-3 mb-4 max-h-64 overflow-y-auto' },
            comments.length > visibleCommentsCount ? React.createElement('button', {
                onClick: () => setVisibleCommentsCount(prev => prev + 50),
                className: 'w-full py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mb-2 border border-blue-100'
            },
                React.createElement('i', { className: 'fas fa-history mr-2' }),
                'Voir les commentaires précédents (' + (comments.length - visibleCommentsCount) + ' restants)'
            ) : null,

            comments.slice(-visibleCommentsCount).map(comment =>
                React.createElement('div', {
                    key: comment.id,
                    className: 'bg-gray-50 rounded-lg p-3 border-l-4 ' +
                               (comment.user_role === 'Technicien' ? 'border-blue-600' : 'border-igp-blue')
                },
                    React.createElement('div', { className: 'flex justify-between items-start mb-2' },
                        React.createElement('div', { className: 'flex items-center gap-2' },
                            React.createElement('i', {
                                className: 'fas ' + (comment.user_role === 'Technicien' ? 'fa-wrench' : 'fa-user') + ' text-sm text-gray-600'
                            }),
                            React.createElement('span', { className: 'font-semibold text-gray-800' }, comment.user_name),
                            React.createElement('span', { className: 'text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded' },
                                comment.user_role || 'Opérateur'
                            )
                        ),
                        React.createElement('div', { className: 'flex items-center gap-2' },
                            React.createElement('span', { className: 'text-xs text-gray-500' },
                                formatDateEST(comment.created_at)
                            ),
                            (currentUser && (
                                currentUser?.role === 'admin' || 
                                currentUser?.role === 'supervisor' ||
                                (currentUser?.first_name && comment.user_name === currentUser.first_name)
                            )) ? React.createElement('button', {
                                onClick: () => handleDeleteComment(comment.id),
                                className: 'text-gray-400 hover:text-red-500 transition-colors p-1',
                                title: 'Supprimer'
                            }, React.createElement('i', { className: 'fas fa-trash-alt text-xs' })) : null
                        )
                    ),
                    renderCommentContent(comment.comment)
                )
            )
        ) : React.createElement('div', { className: 'text-center py-6 bg-gray-50 rounded mb-4' },
            React.createElement('i', { className: 'fas fa-comment-slash text-gray-400 text-3xl mb-2' }),
            React.createElement('p', { className: 'text-gray-500 text-sm' }, 'Aucun commentaire pour le moment')
        ),

        React.createElement('form', {
            onSubmit: handleAddComment,
            className: 'bg-blue-50 rounded-lg p-3 sm:p-4 border-2 border-igp-blue'
        },
            React.createElement('h5', { className: 'font-semibold text-gray-800 mb-3 flex items-center' },
                React.createElement('i', { className: 'fas fa-plus-circle mr-2 text-igp-blue' }),
                'Ajouter un commentaire'
            ),

            React.createElement('div', { className: 'mb-3 relative' },
                React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-1' },
                    React.createElement('i', { className: 'fas fa-comment mr-1' }),
                    'Commentaire *'
                ),
                React.createElement('textarea', {
                    value: newComment,
                    onChange: handleInputComment,
                    onInvalid: handleInvalidComment,
                    placeholder: 'Ex: Pièce commandée, livraison prévue jeudi...',
                    required: true,
                    rows: 3,
                    className: 'w-full px-3 py-2 pr-10 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue focus:border-transparent resize-none'
                }),
                recognitionRef.current ? React.createElement('button', {
                    type: 'button',
                    onClick: toggleRecording,
                    className: 'absolute right-2 bottom-2 p-1.5 rounded-full transition-colors ' + 
                        (isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'),
                    title: "Dictée vocale"
                },
                    isRecording 
                        ? React.createElement('i', { className: 'fas fa-stop-circle text-lg' }) 
                        : React.createElement('i', { className: 'fas fa-microphone text-lg' })
                ) : null
            ),

            React.createElement('button', {
                type: 'submit',
                disabled: submittingComment,
                className: 'w-full px-4 py-2 bg-igp-blue text-white rounded-md hover:bg-blue-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
            },
                submittingComment
                    ? React.createElement('span', {},
                        React.createElement('i', { className: 'fas fa-spinner fa-spin mr-2' }),
                        'Envoi en cours...'
                    )
                    : React.createElement('span', {},
                        React.createElement('i', { className: 'fas fa-paper-plane mr-2' }),
                        'Publier le commentaire'
                    )
            )
        ),

        React.createElement('div', { className: 'mb-4 sm:mb-6 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border-2 border-slate-200 mt-4' },
            React.createElement('h5', { className: 'font-semibold text-gray-800 mb-3 flex items-center' },
                React.createElement('i', { className: 'fas fa-microphone-alt mr-2 text-slate-600' }),
                'Message Vocal Rapide'
            ),
            !audioBlob && !isRecordingAudio ? React.createElement('button', {
                type: 'button',
                onClick: startAudioRecording,
                className: 'w-full py-3 bg-white border-2 border-slate-300 hover:border-slate-500 text-slate-700 rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md'
            },
                React.createElement('div', { className: 'w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600' },
                    React.createElement('i', { className: 'fas fa-microphone' })
                ),
                'Enregistrer un message vocal'
            ) : null,

            isRecordingAudio ? React.createElement('div', { className: 'flex items-center justify-between bg-red-50 p-3 rounded-lg border border-red-200 animate-pulse' },
                React.createElement('div', { className: 'flex items-center gap-3' },
                    React.createElement('div', { className: 'w-3 h-3 bg-red-600 rounded-full' }),
                    React.createElement('span', { className: 'font-mono font-bold text-red-700' }, formatDuration(recordingDuration)),
                    React.createElement('span', { className: 'text-sm text-red-600' }, 'Enregistrement...')
                ),
                React.createElement('button', {
                    onClick: stopAudioRecording,
                    className: 'px-4 py-1 bg-red-600 text-white rounded-md font-bold text-sm hover:bg-red-700'
                }, 'Arrêter')
            ) : null,

            audioBlob ? React.createElement('div', { className: 'space-y-3' },
                React.createElement('div', { className: 'flex items-center gap-3 bg-white p-3 rounded-lg border border-green-200 shadow-sm' },
                    React.createElement('i', { className: 'fas fa-check-circle text-green-500 text-xl' }),
                    React.createElement('div', { className: 'flex-1' },
                        React.createElement('p', { className: 'text-sm font-bold text-gray-800' }, 'Message enregistré'),
                        React.createElement('p', { className: 'text-xs text-gray-500' }, formatDuration(recordingDuration))
                    ),
                    React.createElement('audio', {
                        controls: true,
                        src: URL.createObjectURL(audioBlob),
                        className: 'h-8 w-32'
                    }),
                    React.createElement('button', {
                        onClick: cancelAudioRecording,
                        className: 'text-gray-400 hover:text-red-500 p-2'
                    }, React.createElement('i', { className: 'fas fa-trash' }))
                ),
                React.createElement('button', {
                    onClick: handleUploadAudio,
                    disabled: uploadingMedia,
                    className: 'w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2'
                },
                    uploadingMedia ? React.createElement('i', { className: 'fas fa-spinner fa-spin' }) : React.createElement('i', { className: 'fas fa-paper-plane' }),
                    uploadingMedia ? 'Envoi...' : 'Envoyer le vocal'
                )
            ) : null
        ),

        React.createElement(ConfirmModal, {
            show: confirmDialog.show,
            message: confirmDialog.message,
            onConfirm: confirmDialog.onConfirm,
            onCancel: () => setConfirmDialog({ show: false, message: '', onConfirm: null })
        })
    );
};

window.TicketComments = TicketComments;
