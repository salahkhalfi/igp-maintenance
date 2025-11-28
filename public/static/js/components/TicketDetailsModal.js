const TicketDetailsModal = ({ show, onClose, ticketId, currentUser, onTicketDeleted }) => {
    const [ticket, setTicket] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [selectedMedia, setSelectedMedia] = React.useState(null);
    const [comments, setComments] = React.useState([]);
    const [newComment, setNewComment] = React.useState('');
    const [submittingComment, setSubmittingComment] = React.useState(false);
    const [uploadingMedia, setUploadingMedia] = React.useState(false);
    const [newMediaFiles, setNewMediaFiles] = React.useState([]);
    const [newMediaPreviews, setNewMediaPreviews] = React.useState([]);
    const [confirmDialog, setConfirmDialog] = React.useState({ show: false, message: '', onConfirm: null });

    // États pour la planification (superviseur/admin seulement)
    const [editingSchedule, setEditingSchedule] = React.useState(false);
    const [scheduledAssignedTo, setScheduledAssignedTo] = React.useState('');
    const [scheduledDate, setScheduledDate] = React.useState('');
    const [technicians, setTechnicians] = React.useState([]);
    const [savingSchedule, setSavingSchedule] = React.useState(false);
    
    // États pour l'édition de priorité
    const [editingPriority, setEditingPriority] = React.useState(false);
    const [newPriority, setNewPriority] = React.useState('');
    const [savingPriority, setSavingPriority] = React.useState(false);

    React.useEffect(() => {
        if (show && ticketId) {
            loadTicketDetails();
            loadComments();
        }
    }, [show, ticketId]);

    // Charger les techniciens et pré-remplir le formulaire de planification
    React.useEffect(() => {
        if (show && (currentUser.role === 'admin' || currentUser.role === 'supervisor')) {
            axios.get(API_URL + '/technicians')
                .then(res => setTechnicians(res.data.technicians))
                .catch(err => {});
        }

        // Pré-remplir les champs si le ticket est déjà planifié
        if (ticket) {
            // CRITICAL: Check !== null (not just falsy) because 0 is valid (team assignment)
            setScheduledAssignedTo(ticket.assigned_to !== null && ticket.assigned_to !== undefined ? String(ticket.assigned_to) : '');
            // NOUVEAU: Conversion UTC SQL → datetime-local
            setScheduledDate(hasScheduledDate(ticket.scheduled_date) ? utcToLocalDateTime(ticket.scheduled_date) : '');
        }
    }, [show, currentUser.role, ticket]);

    const loadTicketDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(API_URL + '/tickets/' + ticketId);
            setTicket(response.data.ticket);
        } catch (error) {
            alert('Erreur lors du chargement des détails du ticket');
        } finally {
            setLoading(false);
        }
    };

    const loadComments = async () => {
        try {
            const response = await axios.get(API_URL + '/comments/ticket/' + ticketId);
            setComments(response.data.comments || []);
        } catch (error) {
            // Erreur silencieuse
        }
    };

    const handleDeleteTicket = async () => {
        // Verification: technicien ne peut pas supprimer un ticket planifié (avec date) créé par quelqu'un d'autre
        if (currentUser.role === 'technician' && ticket?.scheduled_date && ticket?.reported_by !== currentUser.id) {
            alert("Les techniciens ne peuvent pas supprimer les tickets planifiés créés par d'autres utilisateurs");
            return;
        }

        setConfirmDialog({
            show: true,
            message: 'Supprimer ce ticket ?',
            onConfirm: async () => {
                setConfirmDialog({ show: false, message: '', onConfirm: null });
                try {
                    await axios.delete(API_URL + '/tickets/' + ticketId);
                    alert('Ticket supprime avec succes');
                    onClose();
                    if (onTicketDeleted) onTicketDeleted();
                } catch (error) {
                    alert('Erreur lors de la suppression: ' + (error.response?.data?.error || 'Erreur inconnue'));
                }
            }
        });
    };

    const handleDeleteMedia = async (mediaId) => {
        setConfirmDialog({
            show: true,
            message: 'Supprimer ce media ?',
            onConfirm: async () => {
                setConfirmDialog({ show: false, message: '', onConfirm: null });
                try {
                    await axios.delete(API_URL + '/media/' + mediaId);
                    alert('Media supprime avec succes');
                    loadTicketDetails();
                } catch (error) {
                    alert('Erreur lors de la suppression: ' + (error.response?.data?.error || 'Erreur inconnue'));
                }
            }
        });
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) {
            alert('Veuillez écrire un commentaire');
            return;
        }

        setSubmittingComment(true);
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

            // Convertir le rôle de l'utilisateur en français
            let userRoleFr = 'Opérateur';
            if (currentUser.role === 'technician') userRoleFr = 'Technicien';
            else if (currentUser.role === 'supervisor') userRoleFr = 'Superviseur';
            else if (currentUser.role === 'admin') userRoleFr = 'Admin';

            await axios.post(API_URL + '/comments', {
                ticket_id: ticketId,
                user_name: currentUser.first_name,
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

    // Gestionnaire validation commentaire
    const handleInvalidComment = (e) => {
        e.target.setCustomValidity("Veuillez remplir ce champ.");
    };

    const handleInputComment = (e) => {
        e.target.setCustomValidity("");
        setNewComment(e.target.value);
    };

    const handleNewMediaChange = (e) => {
        const files = Array.from(e.target.files);
        setNewMediaFiles(prevFiles => [...prevFiles, ...files]);

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewMediaPreviews(prev => [...prev, {
                    url: reader.result,
                    type: file.type,
                    name: file.name,
                    size: file.size
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleUploadNewMedia = async () => {
        if (newMediaFiles.length === 0) return;

        setUploadingMedia(true);
        try {
            for (let i = 0; i < newMediaFiles.length; i++) {
                const file = newMediaFiles[i];
                const formData = new FormData();
                formData.append('file', file);
                formData.append('ticket_id', ticketId);

                await axios.post(API_URL + '/media/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            alert('Médias ajoutés avec succès !');
            setNewMediaFiles([]);
            setNewMediaPreviews([]);
            loadTicketDetails();
        } catch (error) {
            alert("Erreur lors de l'upload des médias");
        } finally {
            setUploadingMedia(false);
        }
    };

    const handleSavePriority = async () => {
        try {
            setSavingPriority(true);
            await axios.patch(API_URL + '/tickets/' + ticketId, {
                priority: newPriority
            });
            alert('Priorité mise à jour avec succès !');
            setEditingPriority(false);
            loadTicketDetails(); // Recharger les détails
        } catch (error) {
            alert('Erreur lors de la mise à jour de la priorité');
        } finally {
            setSavingPriority(false);
        }
    };

    const handleSaveSchedule = async () => {
        try {
            setSavingSchedule(true);
            const updateData = {};

            // Assigner à un technicien ou toute l'équipe
            // CRITICAL FIX: Use 0 (integer) for team assignment (compatible with INTEGER column)
            if (scheduledAssignedTo) {
                updateData.assigned_to = parseInt(scheduledAssignedTo);
                // Si assignation définie, sauvegarder la date (ou null si vide)
                // NOUVEAU: Conversion datetime-local → UTC SQL
                updateData.scheduled_date = scheduledDate ? localDateTimeToUTC(scheduledDate) : null;
            } else {
                // Si "Non assigné" sélectionné, retirer aussi la date (dé-planifier complètement)
                updateData.assigned_to = null;
                updateData.scheduled_date = null;
                // Effacer aussi le champ date dans le formulaire
                setScheduledDate('');
            }

            await axios.patch(API_URL + '/tickets/' + ticketId, updateData);

            // Message dynamique selon si planifié (avec date) ou juste assigné (sans date)
            const successMessage = scheduledDate
                ? 'Planification mise à jour avec succès !'
                : 'Assignation mise à jour avec succès !';
            alert(successMessage);
            setEditingSchedule(false);
            loadTicketDetails(); // Recharger les détails
        } catch (error) {
            alert('Erreur lors de la mise à jour de la planification');
        } finally {
            setSavingSchedule(false);
        }
    };

    if (!show) return null;

    return React.createElement('div', {
        className: 'modal active bg-gradient-to-br from-slate-900/40 via-gray-900/40 to-slate-800/40 backdrop-blur-sm',
        onClick: onClose
    },
        React.createElement('div', {
            className: 'modal-content bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-3 sm:p-6 md:p-8 max-w-5xl w-full mx-2 sm:mx-4 my-auto',
            onClick: (e) => e.stopPropagation(),
            style: { marginTop: 'auto', marginBottom: 'auto', maxHeight: '90vh', overflowY: 'auto' }
        },
            React.createElement('div', { className: 'flex justify-between items-center gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-gradient-to-r from-blue-400 to-gray-400' },
                // LEFT: Delete button (trash)
                (ticket && currentUser && (
                    (currentUser.role === 'technician' && (!ticket.scheduled_date || ticket.reported_by === currentUser.id)) ||
                    (currentUser.role === 'supervisor') ||
                    (currentUser.role === 'admin') ||
                    (currentUser.role === 'operator' && ticket.reported_by === currentUser.id)
                )) ? React.createElement('button', {
                    onClick: handleDeleteTicket,
                    className: 'text-red-500 hover:text-red-700 transition-colors transform hover:scale-110 active:scale-95 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center',
                    title: 'Supprimer ce ticket',
                    'aria-label': 'Supprimer ce ticket'
                },
                    React.createElement('i', { className: 'fas fa-trash-alt text-xl sm:text-2xl' })
                ) : React.createElement('div', { className: 'w-[44px]' }), // Placeholder pour alignement
                
                // CENTER: Title
                React.createElement('h2', { className: 'text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-700 to-gray-700 bg-clip-text text-transparent' },
                    React.createElement('i', { className: 'fas fa-ticket-alt mr-2 text-blue-600 text-sm sm:text-base' }),
                    "Détails du Ticket"
                ),
                
                // RIGHT: Close button (X)
                React.createElement('button', {
                    onClick: onClose,
                    className: 'text-gray-500 hover:text-gray-700 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center',
                    'aria-label': 'Fermer'
                },
                    React.createElement('i', { className: 'fas fa-times text-xl sm:text-2xl' })
                )
            ),

            loading ? React.createElement('div', { className: 'text-center py-8' },
                React.createElement('i', { className: 'fas fa-spinner fa-spin fa-3x text-igp-blue' }),
                React.createElement('p', { className: 'mt-4 text-gray-600' }, 'Chargement...')
            ) : ticket ? React.createElement('div', {},

                React.createElement('div', { className: 'mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 bg-gradient-to-br from-blue-50/90 to-gray-50/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border-2 border-blue-200/50' },
                    React.createElement('div', { className: 'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4' },
                        React.createElement('span', { className: 'text-sm sm:text-base font-mono font-bold text-blue-700 bg-blue-100/70 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg' }, ticket.ticket_id),
                        !editingPriority ? React.createElement('div', { className: 'flex items-center gap-2' },
                            React.createElement('span', {
                                className: 'px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold shadow-md text-xs sm:text-sm ' +
                                (ticket.priority === 'critical' ? 'bg-igp-red text-white' :
                                 ticket.priority === 'high' ? 'bg-igp-yellow text-white' :
                                 ticket.priority === 'medium' ? 'bg-yellow-500 text-white' :
                                 'bg-igp-green text-white')
                            },
                                ticket.priority === 'critical' ? '🔴 CRITIQUE' :
                                ticket.priority === 'high' ? '🟠 HAUTE' :
                                ticket.priority === 'medium' ? '🟡 MOYENNE' :
                                '🟢 FAIBLE'
                            ),
                            (currentUser && (currentUser.role === 'admin' || currentUser.role === 'supervisor')) ? React.createElement('button', {
                                onClick: () => {
                                    setEditingPriority(true);
                                    setNewPriority(ticket.priority);
                                },
                                className: 'text-blue-600 hover:text-blue-800 transition-colors p-1',
                                title: 'Modifier la priorité'
                            },
                                React.createElement('i', { className: 'fas fa-edit' })
                            ) : null
                        ) : React.createElement('div', { className: 'flex items-center gap-2' },
                            React.createElement('select', {
                                value: newPriority,
                                onChange: (e) => setNewPriority(e.target.value),
                                className: 'px-3 py-2 border-2 border-blue-500 rounded-lg text-sm font-semibold'
                            },
                                React.createElement('option', { value: 'low' }, '🟢 FAIBLE'),
                                React.createElement('option', { value: 'medium' }, '🟡 MOYENNE'),
                                React.createElement('option', { value: 'high' }, '🟠 HAUTE'),
                                React.createElement('option', { value: 'critical' }, '🔴 CRITIQUE')
                            ),
                            React.createElement('button', {
                                onClick: handleSavePriority,
                                disabled: savingPriority,
                                className: 'px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50',
                                title: 'Sauvegarder'
                            },
                                savingPriority ? React.createElement('i', { className: 'fas fa-spinner fa-spin' }) : React.createElement('i', { className: 'fas fa-check' })
                            ),
                            React.createElement('button', {
                                onClick: () => {
                                    setEditingPriority(false);
                                    setNewPriority(ticket.priority);
                                },
                                className: 'px-3 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-400',
                                title: 'Annuler'
                            },
                                React.createElement('i', { className: 'fas fa-times' })
                            )
                        )
                    ),
                    React.createElement('h3', { className: 'text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-3' }, ticket.title),
                    React.createElement('p', { className: 'text-sm sm:text-base text-gray-700 mb-4 sm:mb-5 leading-relaxed bg-white/60 p-3 sm:p-4 rounded-lg' }, ticket.description),
                    React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4' },
                        React.createElement('div', { className: 'bg-white/95 p-3 rounded-lg shadow-sm' },
                            React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                React.createElement('i', { className: 'fas fa-cog text-blue-600 text-sm' }),
                                React.createElement('span', { className: 'font-bold text-gray-700 text-xs sm:text-sm' }, 'Machine:')
                            ),
                            React.createElement('span', { className: 'text-gray-800 font-semibold text-xs sm:text-sm block pl-6' }, ticket.machine_type + ' ' + ticket.model)
                        ),
                        React.createElement('div', { className: 'bg-white/95 p-3 rounded-lg shadow-sm' },
                            React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                React.createElement('i', { className: 'fas fa-tasks text-slate-600 text-sm' }),
                                React.createElement('span', { className: 'font-bold text-gray-700 text-xs sm:text-sm' }, 'Statut:')
                            ),
                            React.createElement('span', { className: 'text-gray-800 font-semibold text-xs sm:text-sm block pl-6' }, getStatusLabel(ticket.status))
                        ),
                        React.createElement('div', { className: 'bg-white/95 p-3 rounded-lg shadow-sm' },
                            React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                React.createElement('i', { className: 'far fa-calendar text-green-600 text-sm' }),
                                React.createElement('span', { className: 'font-bold text-gray-700 text-xs sm:text-sm' }, "Créé le:")
                            ),
                            React.createElement('span', { className: 'text-gray-800 font-semibold text-xs sm:text-sm block pl-6' },
                                formatDateEST(ticket.created_at)
                            )
                        ),
                        React.createElement('div', { className: 'bg-white/95 p-3 rounded-lg shadow-sm' },
                            React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                React.createElement('i', { className: 'fas fa-user text-blue-700 text-sm' }),
                                React.createElement('span', { className: 'font-bold text-gray-700 text-xs sm:text-sm' }, "Rapporté par:")
                            ),
                            React.createElement('span', { className: 'text-gray-800 font-semibold text-xs sm:text-sm block pl-6' }, ticket.reporter_name || 'N/A')
                        )
                    )
                ),

                // Badge "En retard" si ticket expiré (visible pour tous)
                (ticket.scheduled_date && ticket.status !== 'completed' && ticket.status !== 'archived' && parseUTCDate(ticket.scheduled_date) < new Date()) ?
                    React.createElement('div', { className: 'mb-4 sm:mb-6 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-400 rounded-xl shadow-lg p-4 sm:p-6' },
                        React.createElement('div', { className: 'flex flex-col sm:flex-row items-start gap-4' },
                            React.createElement('div', { className: 'text-4xl sm:text-5xl flex-shrink-0' }, '⏰'),
                            React.createElement('div', { className: 'flex-1 w-full' },
                                React.createElement('h4', { className: 'font-bold text-orange-900 text-lg sm:text-xl mb-2 flex items-center gap-2' },
                                    React.createElement('span', {}, 'Ticket en retard'),
                                    React.createElement('span', { className: 'text-sm sm:text-base font-normal text-orange-700' },
                                        ' - ',
                                        (() => {
                                            const scheduledUTC = parseUTCDate(ticket.scheduled_date);
                                            const delay = new Date().getTime() - scheduledUTC.getTime();
                                            const hours = Math.floor(delay / (1000 * 60 * 60));
                                            const minutes = Math.floor((delay % (1000 * 60 * 60)) / (1000 * 60));
                                            return hours > 0 ? hours + 'h ' + minutes + 'min' : minutes + 'min';
                                        })()
                                    )
                                ),
                                React.createElement('p', { className: 'text-sm sm:text-base text-orange-800 mb-4' },
                                    'En attente de pièces, validation externe, ou autre blocage?'
                                ),
                                (currentUser.role === 'admin' || currentUser.role === 'supervisor') ?
                                    React.createElement('button', {
                                        onClick: () => {
                                            setEditingSchedule(true);
                                            // Scroll vers section planification
                                            setTimeout(() => {
                                                const section = document.querySelector('[data-section="planning"]');
                                                if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }, 100);
                                        },
                                        className: 'bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0'
                                    },
                                        React.createElement('i', { className: 'fas fa-calendar-alt mr-2' }),
                                        'Modifier la date planifiée'
                                    ) :
                                    React.createElement('p', { className: 'text-xs sm:text-sm text-orange-700 italic bg-orange-100/50 px-3 py-2 rounded-lg border border-orange-300' },
                                        React.createElement('i', { className: 'fas fa-info-circle mr-2' }),
                                        'Contactez un superviseur ou administrateur pour modifier la date planifiée'
                                    )
                            )
                        )
                    ) : null,

                // Section planification (superviseur/admin seulement)
                (currentUser.role === 'admin' || currentUser.role === 'supervisor') ?
                    React.createElement('div', { 
                        className: 'mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 bg-gradient-to-br from-slate-50/90 to-gray-50/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border-2 border-gray-200/50',
                        'data-section': 'planning'
                    },
                        React.createElement('div', { className: 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4' },
                            React.createElement('h4', { className: 'text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent flex items-center' },
                                React.createElement('i', { className: 'fas fa-calendar-alt mr-2 text-blue-600 text-sm sm:text-base' }),
                                'Planification'
                            ),
                            !editingSchedule ? React.createElement('button', {
                                onClick: () => setEditingSchedule(true),
                                className: 'px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-lg font-bold text-xs sm:text-sm transition-all shadow-[0_6px_12px_rgba(147,51,234,0.35),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_8px_16px_rgba(147,51,234,0.45),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_3px_6px_rgba(147,51,234,0.3),inset_0_2px_4px_rgba(0,0,0,0.15)] border-t border-blue-300/50'
                            },
                                React.createElement('i', { className: 'fas fa-edit mr-1' }),
                                'Modifier'
                            ) : null
                        ),

                        !editingSchedule ? (
                            // Affichage lecture seule
                            React.createElement('div', { className: 'space-y-3' },
                                React.createElement('div', { className: 'bg-white/95 p-4 rounded-lg shadow-sm' },
                                    React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                        React.createElement('i', { className: 'fas fa-user-cog text-slate-600' }),
                                        React.createElement('span', { className: 'font-bold text-gray-700' }, "Assigné à:")
                                    ),
                                    React.createElement('span', { className: 'text-gray-800 font-semibold ml-6' },
                                        ticket.assigned_to !== null && ticket.assigned_to !== undefined && ticket.assigned_to !== ''
                                            ? (ticket.assigned_to === 0 ? '👥 Équipe' : '👤 ' + (ticket.assignee_name || 'Technicien #' + ticket.assigned_to))
                                            : '❌ Non assigné'
                                    )
                                ),
                                React.createElement('div', { className: 'bg-white/95 p-4 rounded-lg shadow-sm' },
                                    React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                        React.createElement('i', { className: 'far fa-clock text-slate-600' }),
                                        React.createElement('span', { className: 'font-bold text-gray-700' }, "Date planifiée:")
                                    ),
                                    React.createElement('span', { className: 'text-gray-800 font-semibold ml-6' },
                                        ticket.scheduled_date
                                            ? formatDateEST(ticket.scheduled_date)
                                            : '❌ Non planifié'
                                    )
                                )
                            )
                        ) : (
                            // Mode édition
                            React.createElement('div', { className: 'space-y-4' },
                                // Assigner à un technicien
                                React.createElement('div', {},
                                    React.createElement('label', { className: 'block font-bold text-gray-700 mb-2 text-sm sm:text-base' },
                                        React.createElement('i', { className: 'fas fa-user-cog mr-2 text-slate-600 text-xs sm:text-sm' }),
                                        "Assigner à"
                                    ),
                                    React.createElement('select', {
                                        value: scheduledAssignedTo,
                                        onChange: (e) => setScheduledAssignedTo(e.target.value),
                                        className: 'w-full px-4 py-3 bg-white/95 border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all font-semibold'
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
                                React.createElement('div', {},
                                    // Badge d'état actuel
                                    scheduledDate || scheduledAssignedTo ? React.createElement('div', { className: 'mb-3 p-3 rounded-lg border-2 ' + (scheduledDate ? 'bg-blue-50 border-blue-300' : 'bg-orange-50 border-orange-300') },
                                        React.createElement('div', { className: 'flex items-center gap-2' },
                                            React.createElement('i', { className: 'text-lg ' + (scheduledDate ? 'fas fa-calendar-check text-blue-600' : 'fas fa-user-check text-orange-600') }),
                                            React.createElement('span', { className: 'font-bold ' + (scheduledDate ? 'text-blue-800' : 'text-orange-800') },
                                                "État actuel : " + (scheduledDate ? "PLANIFIÉ" : "ASSIGNÉ")
                                            )
                                        ),
                                        scheduledDate ?
                                            React.createElement('div', { className: 'mt-1 text-xs text-blue-700' },
                                                "📅 Date : " + new Date(scheduledDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                            )
                                        : React.createElement('div', { className: 'mt-1 text-xs text-orange-700' },
                                            "ℹ️ Aucune date planifiée - Ajoutez-en une pour planifier"
                                        )
                                    ) : null, // Ferme le badge d'état (ligne 3307)

                                    React.createElement('label', { className: 'block font-bold text-gray-700 mb-2 text-sm sm:text-base' },
                                        React.createElement('i', { className: 'fas fa-calendar-day mr-2 text-slate-600 text-xs sm:text-sm' }),
                                        "Date et heure de maintenance" + (scheduledDate ? " (modifier)" : " (ajouter)"),
                                        React.createElement('span', { className: 'ml-2 text-xs text-gray-500 font-normal' },
                                            '(heure locale EST/EDT)'
                                        )
                                    ),
                                    React.createElement('div', { className: 'flex gap-2' },
                                        React.createElement('input', {
                                            type: 'datetime-local',
                                            value: scheduledDate,
                                            onChange: (e) => setScheduledDate(e.target.value),
                                            className: 'flex-1 px-4 py-3 bg-white/95 border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all font-semibold'
                                        }),
                                        scheduledDate ? React.createElement('button', {
                                            type: 'button',
                                            onClick: () => setScheduledDate(''),
                                            className: 'px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg'
                                        },
                                            React.createElement('i', { className: 'fas fa-times mr-1' }),
                                            "Retirer"
                                        ) : null
                                    ), // Ferme le div flex gap-2 (ligne 3327)
                                    scheduledDate ? React.createElement('div', { className: 'mt-2 text-xs text-gray-600 italic' },
                                        '💡 Cliquez sur "Retirer" pour passer de PLANIFIÉ à ASSIGNÉ'
                                    ) : null
                                ), // Ferme le div principal Date de maintenance (ligne 3305)

                                // Boutons d'action
                                React.createElement('div', { className: 'flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3' },
                                    React.createElement('button', {
                                        onClick: () => {
                                            setEditingSchedule(false);
                                            setScheduledAssignedTo(ticket.assigned_to ? String(ticket.assigned_to) : '');
                                            setScheduledDate(hasScheduledDate(ticket.scheduled_date) ? ticket.scheduled_date.substring(0, 10) : '');
                                        },
                                        className: 'w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 text-gray-800 rounded-lg font-bold text-sm transition-all shadow-[0_6px_12px_rgba(0,0,0,0.15),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(0,0,0,0.1)] border-t border-white/60'
                                    },
                                        React.createElement('i', { className: 'fas fa-times mr-1' }),
                                        'Annuler'
                                    ),
                                    React.createElement('button', {
                                        onClick: handleSaveSchedule,
                                        disabled: savingSchedule,
                                        className: 'w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-lg font-bold text-sm transition-all shadow-[0_8px_16px_rgba(147,51,234,0.4),0_4px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_12px_24px_rgba(147,51,234,0.5),0_6px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:translate-y-0 active:shadow-[0_4px_8px_rgba(147,51,234,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 border-t border-blue-300/50'
                                    },
                                        savingSchedule
                                            ? React.createElement('i', { className: 'fas fa-spinner fa-spin mr-1' })
                                            : React.createElement('i', { className: 'fas fa-save mr-1' }),
                                        savingSchedule ? 'Enregistrement...' : 'Enregistrer'
                                    )
                                )
                            )
                        )
                    )
                : null,


                (ticket.media && ticket.media.length > 0) ? React.createElement('div', { className: 'mb-4 sm:mb-6' },
                    React.createElement('h4', { className: 'text-base sm:text-lg font-bold text-gray-800 mb-3 flex items-center' },
                        React.createElement('i', { className: 'fas fa-images mr-2 text-blue-700 text-sm sm:text-base' }),
                        'Photos et Vidéos (' + ticket.media.length + ')'
                    ),
                    React.createElement('div', { className: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3' },
                        ticket.media.map((media, index) =>
                            React.createElement('div', {
                                key: media.id,
                                className: 'relative group'
                            },
                                React.createElement('div', {
                                    className: 'cursor-pointer sm:cursor-pointer',
                                    onClick: () => setSelectedMedia(media)
                                },
                                    media.file_type.startsWith('image/')
                                        ? React.createElement('img', {
                                            src: API_URL + '/media/' + media.id,
                                            alt: media.file_name,
                                            className: 'w-full h-32 object-cover rounded border-2 border-gray-300 hover:border-igp-blue transition-all pointer-events-none sm:pointer-events-auto'
                                        })
                                        : React.createElement('div', { className: 'w-full h-32 bg-gray-200 rounded border-2 border-gray-300 hover:border-igp-blue transition-all flex items-center justify-center pointer-events-none sm:pointer-events-auto' },
                                            React.createElement('i', { className: 'fas fa-video fa-3x text-gray-500' })
                                        ),
                                    React.createElement('div', { className: 'absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center pointer-events-none' },
                                        React.createElement('i', { className: 'fas fa-search-plus text-white text-2xl opacity-0 group-hover:opacity-100 transition-all' })
                                    ),
                                    React.createElement('div', { className: 'absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded pointer-events-none' },
                                        media.file_type.startsWith('image/') ? '📷' : '🎥'
                                    )
                                ),
                                (currentUser && (
                                    currentUser.role === 'admin' ||
                                    currentUser.role === 'supervisor' ||
                                    currentUser.role === 'technician' ||
                                    (ticket.reported_by === currentUser.id)
                                )) ? React.createElement('button', {
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        handleDeleteMedia(media.id);
                                    },
                                    className: 'absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-lg z-20',
                                    style: { opacity: 1 },
                                    title: 'Supprimer ce media'
                                },
                                    React.createElement('i', { className: 'fas fa-trash text-sm' })
                                ) : null
                            )
                        )
                    )
                ) : null,


                (!ticket.media || ticket.media.length === 0) ? React.createElement('div', { className: 'mb-4 sm:mb-6 text-center py-6 sm:py-8 bg-gray-50 rounded' },
                    React.createElement('i', { className: 'fas fa-camera text-gray-400 text-4xl mb-2' }),
                    React.createElement('p', { className: 'text-gray-500' }, 'Aucune photo ou vidéo attachée à ce ticket')
                ) : null,


                React.createElement('div', { className: 'mb-4 sm:mb-6 border-t-2 border-gray-200 pt-4 sm:pt-6' },
                    React.createElement('h4', { className: 'text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center' },
                        React.createElement('i', { className: 'fas fa-comments mr-2 text-igp-blue text-sm sm:text-base' }),
                        'Commentaires et Notes (' + comments.length + ')'
                    ),


                    comments.length > 0 ? React.createElement('div', { className: 'space-y-3 mb-4 max-h-64 overflow-y-auto' },
                        comments.map(comment =>
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
                                    React.createElement('span', { className: 'text-xs text-gray-500' },
                                        formatDateEST(comment.created_at)
                                    )
                                ),
                                React.createElement('p', { className: 'text-gray-700 text-sm whitespace-pre-wrap' }, comment.comment)
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


                        React.createElement('div', { className: 'mb-3' },
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
                                className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue focus:border-transparent resize-none'
                            })
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
                    )
                ),


                React.createElement('div', { className: 'mb-4 sm:mb-6 border-t-2 border-gray-200 pt-4 sm:pt-6' },
                    React.createElement('h4', { className: 'text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center' },
                        React.createElement('i', { className: 'fas fa-camera-retro mr-2 text-blue-700 text-sm sm:text-base' }),
                        'Ajouter des photos/vidéos supplémentaires'
                    ),


                    newMediaPreviews.length > 0 ? React.createElement('div', { className: 'mb-4' },
                        React.createElement('p', { className: 'text-sm font-semibold text-gray-700 mb-2' },
                            React.createElement('i', { className: 'fas fa-images mr-1' }),
                            newMediaPreviews.length + ' fichier(s) sélectionné(s)'
                        ),
                        React.createElement('div', { className: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 mb-3' },
                            newMediaPreviews.map((preview, index) =>
                                React.createElement('div', {
                                    key: index,
                                    className: 'relative group'
                                },
                                    preview.type.startsWith('image/')
                                        ? React.createElement('img', {
                                            src: preview.url,
                                            alt: preview.name,
                                            className: 'w-full h-24 object-cover rounded border-2 border-blue-600'
                                        })
                                        : React.createElement('div', { className: 'w-full h-24 bg-gray-200 rounded border-2 border-blue-600 flex items-center justify-center' },
                                            React.createElement('i', { className: 'fas fa-video fa-2x text-gray-500' })
                                        ),
                                    React.createElement('button', {
                                        type: 'button',
                                        onClick: () => {
                                            setNewMediaFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
                                            setNewMediaPreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));
                                        },
                                        className: 'absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 transition-all'
                                    },
                                        React.createElement('i', { className: 'fas fa-times text-xs' })
                                    ),
                                    React.createElement('div', { className: 'absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded max-w-full truncate' },
                                        preview.name
                                    )
                                )
                            )
                        ),
                        React.createElement('button', {
                            onClick: handleUploadNewMedia,
                            disabled: uploadingMedia,
                            className: 'w-full px-4 py-2 bg-igp-blue text-white rounded-md hover:bg-igp-blue-dark transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
                        },
                            uploadingMedia
                                ? React.createElement('span', {},
                                    React.createElement('i', { className: 'fas fa-spinner fa-spin mr-2' }),
                                    'Upload en cours...'
                                )
                                : React.createElement('span', {},
                                    React.createElement('i', { className: 'fas fa-cloud-upload-alt mr-2' }),
                                    'Uploader ces fichiers'
                                )
                        )
                    ) : null,


                    React.createElement('div', { className: 'flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center' },
                        React.createElement('label', {
                            className: 'inline-block px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-100 border-2 border-dashed border-blue-400 rounded-lg cursor-pointer hover:bg-blue-200 hover:border-blue-600 transition-all text-center'
                        },
                            React.createElement('input', {
                                type: 'file',
                                accept: 'image/*',
                                capture: 'environment',
                                onChange: handleNewMediaChange,
                                className: 'hidden',
                                id: 'photo-upload-detail'
                            }),
                            React.createElement('i', { className: 'fas fa-camera text-xl sm:text-2xl text-blue-600 mb-1 sm:mb-2 block' }),
                            React.createElement('span', { className: 'text-xs sm:text-sm font-semibold text-blue-700 block' },
                                'Prendre une photo'
                            )
                        ),
                        React.createElement('label', {
                            className: 'inline-block px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 border-2 border-dashed border-gray-400 rounded-lg cursor-pointer hover:bg-gray-200 hover:border-gray-600 transition-all text-center'
                        },
                            React.createElement('input', {
                                type: 'file',
                                multiple: true,
                                accept: 'image/*,video/*',
                                onChange: handleNewMediaChange,
                                className: 'hidden',
                                id: 'media-upload-detail'
                            }),
                            React.createElement('i', { className: 'fas fa-images text-xl sm:text-2xl text-gray-600 mb-1 sm:mb-2 block' }),
                            React.createElement('span', { className: 'text-xs sm:text-sm font-semibold text-gray-700 block' },
                                'Choisir fichiers'
                            )
                        )
                    )
                ),


                React.createElement('div', { className: 'flex justify-end mt-6 pt-4 border-t-2 border-gray-200' },
                    React.createElement('button', {
                        onClick: onClose,
                        className: 'px-6 py-2 bg-igp-blue text-white rounded-md hover:bg-blue-800 transition-all'
                    },
                        React.createElement('i', { className: 'fas fa-times mr-2' }),
                        'Fermer'
                    )
                )
            ) : React.createElement('div', { className: 'text-center py-8' },
                React.createElement('p', { className: 'text-red-600' }, 'Erreur lors du chargement du ticket')
            )
        ),


        selectedMedia ? React.createElement('div', {
            className: 'fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4',
            onClick: () => setSelectedMedia(null)
        },
            React.createElement('div', { className: 'relative max-w-6xl max-h-full' },
                React.createElement('button', {
                    onClick: () => setSelectedMedia(null),
                    className: 'absolute top-2 right-2 bg-white text-gray-800 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-200 transition-all z-10'
                },
                    React.createElement('i', { className: 'fas fa-times fa-lg' })
                ),
                selectedMedia.file_type.startsWith('image/')
                    ? React.createElement('img', {
                        src: API_URL + '/media/' + selectedMedia.id,
                        alt: selectedMedia.file_name,
                        className: 'max-w-full max-h-screen object-contain',
                        onClick: (e) => e.stopPropagation()
                    })
                    : React.createElement('video', {
                        src: API_URL + '/media/' + selectedMedia.id,
                        controls: true,
                        className: 'max-w-full max-h-screen',
                        onClick: (e) => e.stopPropagation()
                    }),
                React.createElement('div', { className: 'absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-3 py-2 rounded text-sm' },
                    selectedMedia.file_name + ' - ' + Math.round(selectedMedia.file_size / 1024) + ' KB'
                )
            )
        ) : null,

        React.createElement(ConfirmModal, {
            show: confirmDialog.show,
            message: confirmDialog.message,
            onConfirm: confirmDialog.onConfirm,
            onCancel: () => setConfirmDialog({ show: false, message: '', onConfirm: null })
        })
    );
};
