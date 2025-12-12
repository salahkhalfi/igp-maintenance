const CreateTicketModal = ({ show, onClose, machines = [], onTicketCreated, currentUser: propUser, initialDescription, initialImageUrl, initialTitle, initialPriority, initialMachineId }) => {
    // PARACHUTE FIX: Fallback to cache if currentUser is missing (Offline/Refresh fix)
    const currentUser = React.useMemo(() => {
        if (propUser) return propUser;
        try { return JSON.parse(localStorage.getItem('user_cache') || '{}'); } catch(e) { return {}; }
    }, [propUser]);

    const [title, setTitle] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [machineId, setMachineId] = React.useState('');
    const [priority, setPriority] = React.useState('medium');
    const [assignedTo, setAssignedTo] = React.useState('');
    const [mediaFiles, setMediaFiles] = React.useState([]);
    const [mediaPreviews, setMediaPreviews] = React.useState([]);
    const [submitting, setSubmitting] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const [isListening, setIsListening] = React.useState(false); // État pour l'écoute vocale
    const [listeningField, setListeningField] = React.useState(null); // Quel champ écoute ? (title ou description)

    // Pré-remplissage depuis le Chat (Deep Link) ou Magic Ticket (AI)
    React.useEffect(() => {
        if (show) {
            if (initialDescription) setDescription(initialDescription);
            if (initialTitle) setTitle(initialTitle);
            if (initialPriority) setPriority(initialPriority);
            if (initialMachineId) setMachineId(initialMachineId);
            
            // Legacy: if no title provided but description exists
            if (initialDescription && !initialTitle && !title) {
                const shortTitle = initialDescription.length > 50 ? initialDescription.substring(0, 50) + '...' : initialDescription;
                setTitle(shortTitle);
            }
        }
    }, [show, initialDescription, initialTitle, initialPriority, initialMachineId]);

    React.useEffect(() => {
        if (show && initialImageUrl && mediaFiles.length === 0) {
            // HYBRID DOWNLOAD STRATEGY
            // 1. Detect if URL is absolute (http...) or relative
            const isAbsolute = initialImageUrl.startsWith('http');
            
            const processBlob = (blob) => {
                const file = new File([blob], "chat-attachment.jpg", { type: blob.type || "image/jpeg" });
                setMediaFiles([file]);
                
                const reader = new FileReader();
                reader.onloadend = () => {
                    setMediaPreviews([{
                        url: reader.result,
                        type: file.type,
                        name: file.name,
                        size: file.size
                    }]);
                };
                reader.readAsDataURL(file);
            };

            if (isAbsolute) {
                // STRATEGY A: External/Absolute URL (e.g., Cloudflare R2, S3)
                // Use fetch() WITHOUT headers to avoid "403 SignatureDoesNotMatch" 
                // caused by Axios sending 'Authorization: Bearer ...' to public/signed buckets
                fetch(initialImageUrl)
                    .then(res => {
                        if (!res.ok) throw new Error('Download failed: ' + res.status);
                        return res.blob();
                    })
                    .then(processBlob)
                    .catch(err => {
                        console.error("Fetch error:", err);
                        // Retry with Axios as fallback (in case it IS a protected absolute URL)
                        axios.get(initialImageUrl, { responseType: 'blob' })
                            .then(res => processBlob(res.data))
                            .catch(e => alert("Impossible de récupérer la photo jointe (CORS/Auth)."));
                    });
            } else {
                // STRATEGY B: Internal/Relative URL (e.g., /api/media/...)
                // Use Axios to AUTOMATICALLY include the 'Authorization' header
                axios.get(initialImageUrl, { responseType: 'blob' })
                    .then(response => processBlob(response.data))
                    .catch(err => console.error("Axios error:", err));
            }
        }
    }, [show, initialImageUrl]);

    // Fonction de reconnaissance vocale (Web Speech API - Gratuite)
    const startVoiceInput = (fieldSetter, currentVal, fieldName) => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("La reconnaissance vocale n'est pas supportée par ce navigateur. Essayez Chrome ou Safari.");
            return;
        }

        if (isListening) {
            // Si déjà en train d'écouter, on arrête tout (toggle off)
            setIsListening(false);
            setListeningField(null);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'fr-FR'; // Français
        recognition.continuous = false; // S'arrête dès qu'on fait une pause (mieux pour le bruit)
        recognition.interimResults = false; // Attend le résultat final

        recognition.onstart = () => {
            setIsListening(true);
            setListeningField(fieldName);
        };

        recognition.onend = () => {
            setIsListening(false);
            setListeningField(null);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            // Ajoute le texte à la suite de l'existant (avec un espace si non vide)
            const newValue = currentVal ? (currentVal + ' ' + transcript) : transcript;
            // Capitalise la première lettre
            const formattedValue = newValue.charAt(0).toUpperCase() + newValue.slice(1);
            fieldSetter(formattedValue);
        };

        recognition.onerror = (event) => {
            console.error("Erreur vocale:", event.error);
            setIsListening(false);
            setListeningField(null);
            if (event.error === 'not-allowed') {
                alert("Veuillez autoriser l'accès au micro pour utiliser la dictée vocale.");
            }
        };

        recognition.start();
    };

    // États pour la planification (superviseur/admin seulement)
    const [scheduledDate, setScheduledDate] = React.useState('');
    const [technicians, setTechnicians] = React.useState([]);

    // Charger la liste des techniciens si superviseur ou admin
    React.useEffect(() => {
        if (show && (currentUser?.role === 'admin' || currentUser?.role === 'supervisor')) {
            axios.get(API_URL + '/technicians')
                .then(res => setTechnicians(res.data.technicians))
                .catch(err => {});
        }
    }, [show, currentUser?.role]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setMediaFiles(prevFiles => [...prevFiles, ...files]);


        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setMediaPreviews(prev => [...prev, {
                    url: reader.result,
                    type: file.type,
                    name: file.name,
                    size: file.size
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeMedia = (index) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
        setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const uploadMediaFiles = async (ticketId) => {
        if (mediaFiles.length === 0) return;

        for (let i = 0; i < mediaFiles.length; i++) {
            const file = mediaFiles[i];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('ticket_id', ticketId);

            try {
                await axios.post(API_URL + '/media/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setUploadProgress(Math.round(((i + 1) / mediaFiles.length) * 100));
            } catch (error) {
                // Erreur silencieuse
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setUploadProgress(0);

        try {
            // Capturer l'heure UTC pour stockage dans la DB
            const utcTime = new Date();
            const year = utcTime.getUTCFullYear();
            const month = String(utcTime.getUTCMonth() + 1).padStart(2, '0');
            const day = String(utcTime.getUTCDate()).padStart(2, '0');
            const hours = String(utcTime.getUTCHours()).padStart(2, '0');
            const minutes = String(utcTime.getUTCMinutes()).padStart(2, '0');
            const seconds = String(utcTime.getUTCSeconds()).padStart(2, '0');
            const localTimestamp = year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;

            const requestBody = {
                title,
                description,
                reporter_name: currentUser.first_name || currentUser.full_name || currentUser.email?.split('@')[0] || 'Utilisateur',
                machine_id: parseInt(machineId),
                priority,
                created_at: localTimestamp
            };

            // Ajouter les champs de planification si superviseur/admin
            if (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') {
                if (assignedTo) {
                    // CRITICAL FIX: Use 0 (integer) for team assignment (compatible with INTEGER column)
                    requestBody.assigned_to = parseInt(assignedTo);
                }
                if (scheduledDate) {
                    // NOUVEAU: Conversion datetime-local → UTC SQL
                    // scheduledDate = "2025-11-15T14:30" (heure locale)
                    requestBody.scheduled_date = localDateTimeToUTC(scheduledDate);
                    // Résultat: "2025-11-15 19:30:00" (UTC avec offset -5)
                }
            }

            const response = await axios.post(API_URL + '/tickets', requestBody);

            const isOffline = response.data.offline === true;
            const ticketId = response.data.ticket ? response.data.ticket.id : (response.data.id || 0);


            if (mediaFiles.length > 0) {
                if (isOffline) {
                     alert("⚠️ Note : Le ticket a été créé hors-ligne. Les photos/vidéos ne peuvent pas être envoyées sans connexion et devront être ajoutées plus tard.");
                } else {
                     await uploadMediaFiles(ticketId);
                }
            }

            alert((isOffline ? '⚠️ HORS-LIGNE : Ticket sauvegardé !' : 'Ticket créé avec succès !') + (mediaFiles.length > 0 && !isOffline ? ' (' + mediaFiles.length + ' média(s) uploadé(s))' : ''));


            setTitle('');
            setDescription('');
            setMachineId('');
            setPriority('medium');
            setAssignedTo('');
            setScheduledDate('');
            setMediaFiles([]);
            setMediaPreviews([]);
            setUploadProgress(0);
            onClose();
            onTicketCreated();
        } catch (error) {
            alert('Erreur: ' + (error.response?.data?.error || 'Erreur inconnue'));
        } finally {
            setSubmitting(false);
        }
    };

    // Gestionnaires validation en francais
    const handleInvalidField = (e) => {
        e.target.setCustomValidity("Veuillez remplir ce champ.");
    };

    const handleInputField = (e, setter) => {
        e.target.setCustomValidity("");
        setter(e.target.value);
    };

    if (!show) return null;

    return React.createElement('div', {
        className: 'fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[60] p-2 sm:p-4 animate-fadeIn',
        onClick: onClose
    },
        React.createElement('div', {
            className: 'bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-3xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col',
            onClick: (e) => e.stopPropagation(),
            style: {
                transform: 'translateZ(0)'
            }
        },
            React.createElement('div', { className: 'sticky top-0 bg-gradient-to-r from-blue-700 to-blue-800 text-white p-3 sm:p-5 flex justify-between items-center shadow-md z-10' },
                React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3 min-w-0' },
                    React.createElement('i', { className: 'fas fa-plus-circle text-xl sm:text-2xl text-blue-300 flex-shrink-0' }),
                    React.createElement('h2', { className: 'text-lg sm:text-2xl font-bold truncate' },
                        'Nouvelle Demande'
                    )
                ),
                React.createElement('button', {
                    onClick: onClose,
                    className: 'text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all flex-shrink-0'
                },
                    React.createElement('i', { className: 'fas fa-times text-lg sm:text-xl' })
                )
            ),
            React.createElement('div', { className: 'p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 bg-gradient-to-br from-white/50 to-blue-50/30' },
            React.createElement('form', { id: 'create-ticket-form', onSubmit: handleSubmit, className: 'space-y-4' },
                React.createElement('div', { className: 'mb-4' },
                    React.createElement('div', { className: 'flex justify-between items-center mb-2' },
                        React.createElement('label', { className: 'block text-gray-700 text-sm font-bold' },
                            React.createElement('i', { className: 'fas fa-heading mr-2' }),
                            'Titre du problème *'
                        ),
                        // BOUTON MICRO TITRE
                        React.createElement('button', {
                            type: 'button',
                            onClick: () => startVoiceInput(setTitle, title, 'title'),
                            className: `text-xs px-3 py-1 rounded-full font-bold transition-all flex items-center gap-1 ${
                                isListening && listeningField === 'title'
                                    ? 'bg-red-100 text-red-600 animate-pulse border border-red-200'
                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'
                            }`
                        },
                            React.createElement('i', { className: `fas ${isListening && listeningField === 'title' ? 'fa-stop-circle' : 'fa-microphone'}` }),
                            React.createElement('span', {}, isListening && listeningField === 'title' ? 'Écoute...' : 'Dicter')
                        )
                    ),
                    React.createElement('input', {
                        type: 'text',
                        id: 'ticketTitle',
                        name: 'ticketTitle',
                        autoComplete: 'off',
                        'data-lpignore': 'true',
                        'data-form-type': 'other',
                        className: 'w-full px-4 py-3 bg-white/95 border-2 border-white/50 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow hover:shadow-xl',
                        style: { boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.5)' },
                        value: title,
                        onChange: (e) => handleInputField(e, setTitle),
                        onInvalid: handleInvalidField,
                        placeholder: 'Ex: Bruit anormal sur la machine',
                        required: true
                    })
                ),
                React.createElement('div', { className: 'mb-4' },
                    React.createElement('div', { className: 'flex justify-between items-center mb-2' },
                        React.createElement('label', { className: 'block text-gray-700 text-sm font-bold' },
                            React.createElement('i', { className: 'fas fa-align-left mr-2' }),
                            'Description détaillée'
                        ),
                        // BOUTON MICRO DESCRIPTION
                        React.createElement('button', {
                            type: 'button',
                            onClick: () => startVoiceInput(setDescription, description, 'desc'),
                            className: `text-xs px-3 py-1 rounded-full font-bold transition-all flex items-center gap-1 ${
                                isListening && listeningField === 'desc'
                                    ? 'bg-red-100 text-red-600 animate-pulse border border-red-200'
                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'
                            }`
                        },
                            React.createElement('i', { className: `fas ${isListening && listeningField === 'desc' ? 'fa-stop-circle' : 'fa-microphone'}` }),
                            React.createElement('span', {}, isListening && listeningField === 'desc' ? 'Écoute...' : 'Dicter')
                        )
                    ),
                    React.createElement('textarea', {
                        id: 'ticketDescription',
                        name: 'ticketDescription',
                        autoComplete: 'off',
                        'data-lpignore': 'true',
                        'data-form-type': 'other',
                        className: 'w-full px-4 py-3 bg-white/95 border-2 border-white/50 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:shadow-xl resize-none',
                        style: { boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.5)' },
                        value: description,
                        onChange: (e) => handleInputField(e, setDescription),
                        onInvalid: handleInvalidField,
                        placeholder: 'Décrivez le problème (optionnel)...',
                        rows: 4,
                        required: false
                    })
                ),
                React.createElement('div', { className: 'mb-4' },
                    React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' },
                        React.createElement('i', { className: 'fas fa-cog mr-2' }),
                        'Machine concernée *'
                    ),
                    React.createElement('div', { className: 'flex gap-2' },
                        React.createElement('select', {
                            id: 'ticketMachine',
                            name: 'ticketMachine',
                            autoComplete: 'off',
                            className: 'w-full px-4 py-3 bg-white/95 border-2 border-white/50 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:shadow-xl cursor-pointer flex-1',
                            style: { boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.5)' },
                            value: machineId,
                            onChange: (e) => handleInputField(e, setMachineId),
                            onInvalid: handleInvalidField,
                            required: true
                        },
                            React.createElement('option', { value: '' }, '-- Sélectionnez une machine --'),
                            (machines || []).map(m =>
                                React.createElement('option', { key: m.id, value: m.id },
                                    m.machine_type + (m.model ? ' ' + m.model : '') + (m.location ? ' - ' + m.location : '')
                                )
                            )
                        )
                    )
                ),
                React.createElement('div', { className: 'mb-4' },
                    React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' },
                        React.createElement('i', { className: 'fas fa-camera mr-2 text-blue-700' }),
                        'Photos / Vidéos du problème'
                    ),
                    React.createElement('input', {
                        type: 'file',
                        accept: 'image/*',
                        capture: 'environment',
                        onChange: handleFileChange,
                        className: 'hidden',
                        id: 'photo-upload'
                    }),
                    React.createElement('input', {
                        type: 'file',
                        accept: 'video/*',
                        capture: 'environment',
                        onChange: handleFileChange,
                        className: 'hidden',
                        id: 'video-upload'
                    }),
                    React.createElement('input', {
                        type: 'file',
                        accept: 'image/*,video/*',
                        multiple: true,
                        onChange: handleFileChange,
                        className: 'hidden',
                        id: 'media-upload'
                    }),
                    React.createElement('div', { className: 'grid grid-cols-3 gap-2' },
                        React.createElement('label', {
                            htmlFor: 'photo-upload',
                            className: 'flex flex-col items-center justify-center px-2 py-3 border-2 border-dashed border-igp-blue rounded-md text-center cursor-pointer hover:bg-blue-50 transition-all text-igp-blue font-semibold h-full'
                        },
                            React.createElement('i', { className: 'fas fa-camera text-lg mb-1' }),
                            React.createElement('span', { className: 'text-xs' }, 'Photo')
                        ),
                        React.createElement('label', {
                            htmlFor: 'video-upload',
                            className: 'flex flex-col items-center justify-center px-2 py-3 border-2 border-dashed border-red-400 rounded-md text-center cursor-pointer hover:bg-red-50 transition-all text-red-600 font-semibold h-full'
                        },
                            React.createElement('i', { className: 'fas fa-video text-lg mb-1' }),
                            React.createElement('span', { className: 'text-xs' }, 'Vidéo')
                        ),
                        React.createElement('label', {
                            htmlFor: 'media-upload',
                            className: 'flex flex-col items-center justify-center px-2 py-3 border-2 border-dashed border-gray-400 rounded-md text-center cursor-pointer hover:bg-gray-50 transition-all text-gray-700 font-semibold h-full'
                        },
                            React.createElement('i', { className: 'fas fa-images text-lg mb-1' }),
                            React.createElement('span', { className: 'text-xs' }, 'Galerie')
                        )
                    ),
                    mediaPreviews.length > 0 ? React.createElement('div', { className: 'mt-3 grid grid-cols-3 gap-2' },
                        mediaPreviews.map((preview, index) =>
                            React.createElement('div', {
                                key: index,
                                className: 'relative group'
                            },
                                preview.type.startsWith('image/')
                                    ? React.createElement('img', {
                                        src: preview.url,
                                        alt: preview.name,
                                        className: 'w-full h-24 object-cover rounded border-2 border-gray-300 pointer-events-none'
                                    })
                                    : React.createElement('video', {
                                        src: preview.url,
                                        className: 'w-full h-24 object-cover rounded border-2 border-gray-300 pointer-events-none',
                                        controls: false
                                    }),
                                React.createElement('button', {
                                    type: 'button',
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        removeMedia(index);
                                    },
                                    className: 'absolute top-1 right-1 bg-red-500 text-white rounded-full w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center shadow-lg hover:bg-red-600 transition-all z-20',
                                    style: { opacity: 1 }
                                },
                                    React.createElement('i', { className: 'fas fa-times text-sm' })
                                ),
                                React.createElement('div', { className: 'absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded' },
                                    preview.type.startsWith('image/') ? '📷' : '🎥',
                                    ' ' + Math.round(preview.size / 1024) + ' KB'
                                )
                            )
                        )
                    ) : null,
                React.createElement('div', { className: 'mb-6' },
                    React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' },
                        React.createElement('i', { className: 'fas fa-exclamation-triangle mr-2' }),
                        'Priorité *'
                    ),
                    React.createElement('div', { className: 'grid grid-cols-4 gap-2' },
                        ['low', 'medium', 'high', 'critical'].map(p =>
                            React.createElement('button', {
                                key: p,
                                type: 'button',
                                onClick: () => setPriority(p),
                                className: 'flex-1 min-w-0 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all text-center whitespace-nowrap overflow-hidden ' +
                                    (priority === p
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
                            },
                                React.createElement('span', { className: 'hidden sm:inline' },
                                    p === 'low' ? '🟢 Faible' :
                                    p === 'medium' ? '🟡 Moyenne' :
                                    p === 'high' ? '🟠 Haute' :
                                    '🔴 Critique'
                                ),
                                React.createElement('span', { className: 'inline sm:hidden' },
                                    p === 'low' ? '🟢 Faible' :
                                    p === 'medium' ? '🟡 Moy.' :
                                    p === 'high' ? '🟠 Haute' :
                                    '🔴 Crit.'
                                )
                            )
                        )
                    )
                ),

                // Section planification (superviseur/admin seulement)
                (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') ?
                    React.createElement('div', { className: 'mb-6 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg' },
                        React.createElement('h3', { className: 'text-lg font-bold text-slate-700 mb-4 flex items-center' },
                            React.createElement('i', { className: 'fas fa-calendar-alt mr-2' }),
                            'Planification (Superviseur/Admin)'
                        ),

                        // Assigner à un technicien
                        React.createElement('div', { className: 'mb-4' },
                            React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                React.createElement('i', { className: 'fas fa-user-cog mr-2' }),
                                'Assigner à'
                            ),
                            React.createElement('select', {
                                id: 'ticketAssignedTo',
                                name: 'ticketAssignedTo',
                                autoComplete: 'off',
                                value: assignedTo,
                                onChange: (e) => setAssignedTo(e.target.value),
                                className: "w-full px-4 py-3 bg-white/97 border-2 border-gray-300 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition-all hover:shadow-xl cursor-pointer font-semibold appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%236b7280%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22M6 8l4 4 4-4%22/%3E%3C/svg%3E')] bg-[position:right_0.5rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-10",
                                style: { boxShadow: '0 6px 20px rgba(147, 51, 234, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.5)' }
                            },
                                React.createElement('option', { value: '' }, '-- Non assigné --'),
                                React.createElement('option', { value: '0' }, '👥 À Équipe'),
                                technicians.filter(tech => tech.id !== 0).map(tech =>
                                    React.createElement('option', {
                                        key: tech.id,
                                        value: tech.id
                                    },
                                        '👤 ' + tech.first_name
                                    )
                                )
                            )
                        ),

                        // Date de maintenance planifiée
                        React.createElement('div', { className: 'mb-2' },
                            // Badge d'état
                            scheduledDate ? React.createElement('div', { className: 'mb-3 p-2 rounded-lg bg-blue-50 border-2 border-blue-300' },
                                React.createElement('div', { className: 'flex items-center gap-2' },
                                    React.createElement('i', { className: 'fas fa-calendar-check text-blue-600' }),
                                    React.createElement('span', { className: 'text-sm font-bold text-blue-800' },
                                        "État : PLANIFIÉ"
                                    )
                                ),
                                React.createElement('div', { className: 'mt-1 text-xs text-blue-700' },
                                    "📅 " + new Date(scheduledDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                )
                            ) : assignedTo ? React.createElement('div', { className: 'mb-3 p-2 rounded-lg bg-orange-50 border-2 border-orange-300' },
                                React.createElement('div', { className: 'flex items-center gap-2' },
                                    React.createElement('i', { className: 'fas fa-user-check text-orange-600' }),
                                    React.createElement('span', { className: 'text-sm font-bold text-orange-800' },
                                        "État : ASSIGNÉ"
                                    )
                                ),
                                React.createElement('div', { className: 'mt-1 text-xs text-orange-700' },
                                    "ℹ️ Ajoutez une date pour planifier"
                                )
                            ) : null,

                            React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' },
                                React.createElemen