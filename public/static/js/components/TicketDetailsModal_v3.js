const TicketDetailsModal = ({ show, onClose, ticketId, currentUser, onTicketDeleted }) => {
    const [ticket, setTicket] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
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
    
    // État pour le chat AI
    const [isAIChatOpen, setIsAIChatOpen] = React.useState(false);

    // Fonction d'impression du ticket
    const handlePrint = async () => {
        if (!ticket) return;
        
        // Mappings français
        const statusLabels = {
            'received': 'Requête Reçue',
            'diagnostic': 'Diagnostic',
            'in_progress': 'En Cours',
            'waiting_parts': 'En Attente Pièces',
            'private': 'Privé',
            'completed': 'Terminé',
            'archived': 'Archivé'
        };
        const priorityLabels = {
            'critical': 'CRITIQUE',
            'high': 'HAUTE',
            'medium': 'MOYENNE',
            'low': 'BASSE'
        };
        const statusColors = {
            'received': '#fef3c7',
            'diagnostic': '#e0e7ff',
            'in_progress': '#dbeafe',
            'waiting_parts': '#fef3c7',
            'completed': '#d1fae5',
            'archived': '#f3f4f6'
        };
        const priorityColors = {
            'critical': '#dc2626',
            'high': '#ea580c',
            'medium': '#ca8a04',
            'low': '#16a34a'
        };
        
        // Calculer le temps écoulé (retard)
        const calcElapsed = () => {
            const now = new Date();
            const created = new Date(ticket.created_at);
            if (isNaN(created.getTime())) return null;
            const diffMs = now - created;
            if (diffMs < 0) return null;
            const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            let text = '';
            let color = '#16a34a'; // vert
            let label = '🟢 Dans les temps';
            if (days > 0) text = days + 'j ' + hours + 'h ' + minutes + 'min';
            else if (hours > 0) text = hours + 'h ' + minutes + 'min';
            else text = minutes + 'min';
            if (days >= 7) { color = '#dc2626'; label = '🔴 Retard critique'; }
            else if (days >= 3) { color = '#ea580c'; label = '🟠 Retard important'; }
            else if (days >= 1) { color = '#ca8a04'; label = '🟡 En attente'; }
            return { text, color, label };
        };
        const elapsed = calcElapsed();
        
        // Charger les infos compagnie
        let companyTitle = 'Système de Maintenance';
        let companySubtitle = '';
        let logoUrl = '';
        try {
            const [titleRes, subtitleRes] = await Promise.all([
                axios.get(API_URL + '/settings/company_title').catch(() => null),
                axios.get(API_URL + '/settings/company_subtitle').catch(() => null)
            ]);
            if (titleRes?.data?.value) companyTitle = titleRes.data.value;
            if (subtitleRes?.data?.value) companySubtitle = subtitleRes.data.value;
            logoUrl = API_URL + '/settings/logo?t=' + Date.now();
        } catch (e) { /* Utiliser valeurs par défaut */ }
        
        // Charger les commentaires
        let comments = [];
        try {
            const response = await axios.get(API_URL + '/comments/ticket/' + ticket.id);
            comments = response.data.comments || [];
        } catch (e) { /* Ignorer si pas de commentaires */ }
        
        // Générer HTML des commentaires
        const commentsHtml = comments.length > 0 
            ? comments.map(c => `
                <div class="comment">
                    <div class="comment-header">
                        <strong>${c.user_name || 'Utilisateur'}</strong>
                        <span class="comment-date">${new Date(c.created_at).toLocaleString('fr-CA')}</span>
                    </div>
                    <div class="comment-content">${c.comment}</div>
                </div>
            `).join('')
            : '<p class="no-data">Aucun commentaire</p>';
        
        // Générer HTML de la timeline avec statuts traduits
        const timelineHtml = ticket.timeline && ticket.timeline.length > 0
            ? ticket.timeline.map(t => {
                let actionText = t.action;
                // Si changement de statut, afficher ancien → nouveau
                if (t.new_status || t.old_status) {
                    const oldLabel = t.old_status ? (statusLabels[t.old_status] || t.old_status) : '';
                    const newLabel = t.new_status ? (statusLabels[t.new_status] || t.new_status) : '';
                    if (oldLabel && newLabel) {
                        actionText = `${t.action}: ${oldLabel} → ${newLabel}`;
                    } else if (newLabel) {
                        actionText = `${t.action}: → ${newLabel}`;
                    }
                }
                return `
                <div class="timeline-item">
                    <span class="timeline-date">${new Date(t.created_at).toLocaleString('fr-CA')}</span>
                    <span class="timeline-action">${actionText}</span>
                    ${t.user_name ? `<span class="timeline-user">par ${t.user_name}</span>` : ''}
                    ${t.comment ? `<div class="timeline-comment">${t.comment}</div>` : ''}
                </div>
            `}).join('')
            : '<p class="no-data">Aucun historique</p>';
        
        const printContent = `
            <html>
            <head>
                <title>Ticket #${ticket.ticket_id} - ${ticket.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; font-size: 12px; }
                    h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; font-size: 18px; margin-bottom: 5px; }
                    .company-header { display: flex; align-items: center; gap: 15px; padding-bottom: 15px; border-bottom: 2px solid #3b82f6; margin-bottom: 15px; }
                    .company-logo { max-height: 50px; max-width: 120px; object-fit: contain; }
                    .company-info { flex: 1; }
                    .company-title { font-size: 16px; font-weight: bold; color: #1f2937; margin: 0; }
                    .company-subtitle { font-size: 11px; color: #6b7280; margin: 2px 0 0 0; }
                    .header { margin-bottom: 15px; }
                    .ticket-id { font-size: 14px; color: #6b7280; font-weight: bold; }
                    .section { margin-bottom: 15px; page-break-inside: avoid; }
                    .section-title { font-weight: bold; color: #1f2937; font-size: 13px; margin-bottom: 8px; border-bottom: 2px solid #3b82f6; padding-bottom: 4px; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                    .info-row { display: flex; margin-bottom: 4px; }
                    .info-label { font-weight: 600; width: 140px; color: #6b7280; }
                    .info-value { flex: 1; color: #1f2937; }
                    .status { padding: 3px 10px; border-radius: 4px; font-weight: bold; display: inline-block; font-size: 11px; }
                    .priority { font-weight: bold; }
                    .elapsed-badge { padding: 3px 10px; border-radius: 4px; font-weight: bold; display: inline-block; font-size: 11px; }
                    .description { background: #f9fafb; padding: 10px; border-radius: 6px; white-space: pre-wrap; border: 1px solid #e5e7eb; }
                    .machine-alert { background: #fef2f2; border: 2px solid #dc2626; padding: 8px; border-radius: 6px; color: #991b1b; margin-bottom: 12px; font-weight: bold; text-align: center; }
                    .comment { background: #f9fafb; padding: 8px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #3b82f6; }
                    .comment-header { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px; }
                    .comment-date { color: #6b7280; }
                    .comment-content { color: #374151; }
                    .timeline-item { padding: 6px 0; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
                    .timeline-date { color: #6b7280; margin-right: 10px; font-weight: 500; }
                    .timeline-action { color: #1f2937; font-weight: 500; }
                    .timeline-user { color: #6b7280; font-style: italic; margin-left: 5px; }
                    .timeline-comment { color: #6b7280; font-size: 10px; margin-top: 2px; padding-left: 10px; border-left: 2px solid #e5e7eb; }
                    .no-data { color: #9ca3af; font-style: italic; }
                    .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; text-align: center; }
                    .two-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                    @media print { 
                        body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } 
                        .section { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="company-header">
                    <img src="${logoUrl}" class="company-logo" onerror="this.style.display='none'" />
                    <div class="company-info">
                        <p class="company-title">${companyTitle}</p>
                        ${companySubtitle ? `<p class="company-subtitle">${companySubtitle}</p>` : ''}
                    </div>
                </div>
                
                <div class="header">
                    <h1>${ticket.title}</h1>
                    <span class="ticket-id">Ticket #${ticket.ticket_id}</span>
                </div>
                
                ${ticket.is_machine_down ? '<div class="machine-alert">⚠️ MACHINE HORS SERVICE</div>' : ''}
                
                <div class="two-columns">
                    <div class="section">
                        <div class="section-title">📋 Informations générales</div>
                        <div class="info-row">
                            <span class="info-label">Statut:</span>
                            <span class="info-value">
                                <span class="status" style="background: ${statusColors[ticket.status] || '#f3f4f6'}">
                                    ${statusLabels[ticket.status] || ticket.status}
                                </span>
                            </span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Priorité:</span>
                            <span class="info-value priority" style="color: ${priorityColors[ticket.priority] || '#374151'}">
                                ${priorityLabels[ticket.priority] || ticket.priority}
                            </span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Créé le:</span>
                            <span class="info-value">${new Date(ticket.created_at).toLocaleString('fr-CA')}</span>
                        </div>
                        ${elapsed ? `
                        <div class="info-row">
                            <span class="info-label">⏱️ Temps écoulé:</span>
                            <span class="info-value">
                                <span class="elapsed-badge" style="background: ${elapsed.color}20; color: ${elapsed.color}; border: 1px solid ${elapsed.color};">
                                    ${elapsed.label} (${elapsed.text})
                                </span>
                            </span>
                        </div>` : ''}
                        <div class="info-row">
                            <span class="info-label">Signalé par:</span>
                            <span class="info-value">${ticket.reporter_name || ticket.created_by_name || 'N/A'}</span>
                        </div>
                        ${ticket.assignee_name ? `
                        <div class="info-row">
                            <span class="info-label">Assigné à:</span>
                            <span class="info-value">${ticket.assignee_name}</span>
                        </div>` : ''}
                        ${ticket.scheduled_date ? `
                        <div class="info-row">
                            <span class="info-label">Planifié pour:</span>
                            <span class="info-value"><strong>${new Date(ticket.scheduled_date).toLocaleString('fr-CA')}</strong></span>
                        </div>` : ''}
                    </div>
                    
                    <div class="section">
                        <div class="section-title">🔧 Machine</div>
                        <div class="info-row">
                            <span class="info-label">Équipement:</span>
                            <span class="info-value">${ticket.machine_name || ticket.machine_type || 'N/A'}</span>
                        </div>
                        ${ticket.manufacturer ? `
                        <div class="info-row">
                            <span class="info-label">Fabricant:</span>
                            <span class="info-value">${ticket.manufacturer}</span>
                        </div>` : ''}
                        ${ticket.model ? `
                        <div class="info-row">
                            <span class="info-label">Modèle:</span>
                            <span class="info-value">${ticket.model}</span>
                        </div>` : ''}
                        ${ticket.serial_number ? `
                        <div class="info-row">
                            <span class="info-label">N° série:</span>
                            <span class="info-value">${ticket.serial_number}</span>
                        </div>` : ''}
                        ${ticket.location ? `
                        <div class="info-row">
                            <span class="info-label">Emplacement:</span>
                            <span class="info-value">${ticket.location}</span>
                        </div>` : ''}
                        ${ticket.year ? `
                        <div class="info-row">
                            <span class="info-label">Année:</span>
                            <span class="info-value">${ticket.year}</span>
                        </div>` : ''}
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">📝 Description</div>
                    <div class="description">${ticket.description || 'Aucune description'}</div>
                </div>
                
                <div class="section">
                    <div class="section-title">💬 Commentaires (${comments.length})</div>
                    ${commentsHtml}
                </div>
                
                <div class="section">
                    <div class="section-title">📜 Historique</div>
                    ${timelineHtml}
                </div>
                
                <div class="footer">
                    Imprimé le ${new Date().toLocaleString('fr-CA')} | Système de maintenance
                </div>
            </body>
            </html>
        `;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 250);
    };

    React.useEffect(() => {
        if (show && ticketId) {
            loadTicketDetails();
        }
    }, [show, ticketId]);

    // Charger les techniciens et pré-remplir le formulaire de planification
    React.useEffect(() => {
        if (show && (currentUser?.role === 'admin' || currentUser?.role === 'supervisor')) {
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
    }, [show, currentUser?.role, ticket]);

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

    const handleDeleteTicket = async () => {
        // Verification: technicien ne peut pas supprimer un ticket planifié (avec date) créé par quelqu'un d'autre
        if (currentUser?.role === 'technician' && ticket?.scheduled_date && ticket?.reported_by !== currentUser.id) {
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

    // PSEUDO-PAGE FULLSCREEN VIEW
    return React.createElement('div', {
        className: 'fixed inset-0 bg-gray-100 overflow-y-auto',
        style: { 
            overscrollBehavior: 'contain',
            zIndex: 99999 
        }
    },
        React.createElement('div', {
            className: 'min-h-screen w-full max-w-5xl mx-auto bg-white shadow-2xl flex flex-col',
            onClick: (e) => e.stopPropagation()
        },
            // STICKY HEADER
            React.createElement('div', { className: 'sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm' },
                // BACK BUTTON
                React.createElement('button', {
                    onClick: onClose,
                    className: 'flex items-center gap-2 text-gray-700 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-all group'
                },
                    React.createElement('i', { className: 'fas fa-arrow-left text-lg group-hover:-translate-x-1 transition-transform' }),
                    React.createElement('span', { className: 'font-bold hidden sm:inline' }, 'Retour')
                ),

                // TITLE
                React.createElement('h2', { className: 'text-lg font-bold text-gray-800 truncate flex-1 text-center mx-2' },
                     loading ? 'Chargement...' : (ticket ? `#${ticket.ticket_id} - ${ticket.title}` : 'Détails')
                ),

                // DELETE BUTTON
                (ticket && currentUser && (
                    (currentUser?.role === 'technician' && (!ticket.scheduled_date || ticket.reported_by === currentUser.id)) ||
                    (currentUser?.role === 'supervisor') ||
                    (currentUser?.role === 'admin') ||
                    (currentUser?.role === 'operator' && ticket.reported_by === currentUser.id)
                )) ? React.createElement('button', {
                    onClick: handleDeleteTicket,
                    className: 'text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors',
                    title: 'Supprimer'
                },
                    React.createElement('i', { className: 'fas fa-trash-alt text-lg' })
                ) : React.createElement('div', { className: 'w-10' })
            ),

            // MAIN CONTENT
            React.createElement('div', { className: 'p-4 sm:p-6 md:p-8 flex-1' },
                loading ? React.createElement('div', { className: 'text-center py-12' },
                    React.createElement('i', { className: 'fas fa-spinner fa-spin fa-3x text-igp-blue' }),
                    React.createElement('p', { className: 'mt-4 text-gray-600' }, 'Chargement...')
                ) : ticket ? React.createElement('div', {},

                    // --- BLOC ÉTAT MACHINE (MOVED TO TOP - v3.2) ---
                    React.createElement('div', { className: 'mb-4 sm:mb-6' },
                        React.createElement('div', { 
                            className: 'p-4 sm:p-6 rounded-xl border-2 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ' + 
                            (ticket.is_machine_down ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200')
                        },
                            React.createElement('div', { className: 'flex items-center gap-4' },
                                React.createElement('div', { 
                                    className: 'w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-sm ' + 
                                    (ticket.is_machine_down ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600')
                                },
                                    React.createElement('i', { className: ticket.is_machine_down ? 'fas fa-exclamation-triangle' : 'fas fa-check-circle' })
                                ),
                                React.createElement('div', {},
                                    React.createElement('h4', { className: 'font-bold text-lg sm:text-xl ' + (ticket.is_machine_down ? 'text-red-800' : 'text-green-800') },
                                        ticket.is_machine_down ? "MACHINE À L'ARRÊT" : "MACHINE OPÉRATIONNELLE"
                                    ),
                                    React.createElement('p', { className: 'text-sm ' + (ticket.is_machine_down ? 'text-red-700' : 'text-green-700') },
                                        ticket.is_machine_down 
                                            ? "Machine déclarée hors service. Intervention requise." 
                                            : "Machine en état de marche."
                                    )
                                )
                            ),
                            React.createElement('button', {
                                onClick: async (e) => {
                                    e.stopPropagation();
                                    if(!confirm(ticket.is_machine_down ? "Confirmer la remise en service ?" : "Confirmer l'arrêt de la machine ?")) return;
                                    try {
                                        setLoading(true);
                                        await axios.patch(API_URL + '/tickets/' + ticket.id, { is_machine_down: !ticket.is_machine_down });
                                        const response = await axios.get(API_URL + '/tickets/' + ticketId);
                                        setTicket(response.data.ticket);
                                    } catch(err) {
                                        alert('Erreur: ' + (err.response?.data?.error || err.message));
                                    } finally {
                                        setLoading(false);
                                    }
                                },
                                className: 'w-full sm:w-auto px-6 py-3 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 transition-all transform hover:scale-105 ' +
                                (ticket.is_machine_down ? 'bg-green-600 text-white hover:bg-green-700 shadow-md' : 'bg-red-600 text-white hover:bg-red-700 shadow-md')
                            },
                                React.createElement('i', { className: ticket.is_machine_down ? 'fas fa-check-circle' : 'fas fa-power-off' }),
                                ticket.is_machine_down ? "Remettre en service" : "Déclarer HS"
                            )
                        )
                    ),

                React.createElement('div', { className: 'mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 bg-gray-50 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200' },
                    React.createElement('div', { className: 'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4' },
                        React.createElement('span', { className: 'text-sm sm:text-base font-mono font-bold text-blue-700 bg-blue-100/70 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg' }, ticket.ticket_id),
                        !editingPriority ? React.createElement('div', { className: 'flex items-center gap-2' },
                            React.createElement('span', {
                                className: 'px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold shadow-sm text-xs sm:text-sm ' +
                                (ticket.priority === 'critical' ? 'bg-red-500 text-white' :
                                 ticket.priority === 'high' ? 'bg-orange-500 text-white' :
                                 ticket.priority === 'medium' ? 'bg-yellow-500 text-white' :
                                 'bg-green-500 text-white')
                            },
                                ticket.priority === 'critical' ? '🔴 CRITIQUE' :
                                ticket.priority === 'high' ? '🟠 HAUTE' :
                                ticket.priority === 'medium' ? '🟡 MOYENNE' :
                                '🟢 FAIBLE'
                            ),
                            (currentUser && (currentUser?.role === 'admin' || currentUser?.role === 'supervisor')) ? React.createElement('button', {
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
                    
                    React.createElement('div', { className: 'flex justify-between items-start mb-4 bg-white p-3 sm:p-4 rounded-lg border border-gray-100' },
                        React.createElement('p', { className: 'text-sm sm:text-base text-gray-700 leading-relaxed flex-1 mr-4' }, ticket.description),
                        /* AI BUTTON RESTORED */
                    React.createElement('div', { className: 'mt-3 flex justify-end' },
                        React.createElement('button', {
                            onClick: () => setIsAIChatOpen(true),
                            className: 'flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow-md transition-all transform hover:scale-105 font-bold text-sm'
                        },
                            React.createElement('i', { className: 'fas fa-robot mr-1' }),
                            'Demander conseil'
                        )
                    ),
                    ),
                    
                    // MAGIC BRIDGE: Bouton Discussion
                    React.createElement('div', { className: 'flex justify-end -mt-3 mb-4' },
                        React.createElement('button', {
                            onClick: () => {
                                const message = `Ref Ticket #${ticket.ticket_id}: ${ticket.title} - `;
                                let target = '';
                                
                                // Logic: Chat with the "Other" party
                                if (ticket.reported_by && ticket.reported_by !== currentUser?.id) {
                                    target = `&recipientId=${ticket.reported_by}`;
                                } else if (ticket.assigned_to && ticket.assigned_to !== 0 && ticket.assigned_to !== currentUser?.id) {
                                    target = `&recipientId=${ticket.assigned_to}`;
                                }
                                
                                // SSO SIDE-CAR: Pass the token securely
                                const token = localStorage.getItem('auth_token');
                                const authParam = token ? `&token=${token}` : '';
                                
                                window.open(`/messenger?message=${encodeURIComponent(message)}${target}${authParam}`, '_blank');
                            },
                            className: 'text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-200 shadow-sm'
                        },
                            React.createElement('i', { className: 'fas fa-comment-alt' }),
                            (ticket.reported_by && ticket.reported_by !== currentUser?.id) ? 'Discuter avec le demandeur' : 'Ouvrir dans IGP Connect'
                        )
                    ),
                    React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4' },
                        React.createElement('div', { className: 'bg-white p-3 rounded-lg shadow-sm border border-gray-200' },
                            React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                React.createElement('i', { className: 'fas fa-cog text-blue-600 text-sm' }),
                                React.createElement('span', { className: 'font-bold text-gray-700 text-xs sm:text-sm' }, 'Machine:')
                            ),
                            React.createElement('div', { className: 'pl-6' },
                                React.createElement('span', { className: 'text-gray-800 font-semibold text-xs sm:text-sm block' }, (ticket.machine_type || 'Machine') + (ticket.model ? ' ' + ticket.model : '')),
                                (ticket.manufacturer || ticket.year) ? React.createElement('span', { className: 'text-gray-500 text-xs block' }, 
                                    [ticket.manufacturer, ticket.year ? `(${ticket.year})` : ''].filter(Boolean).join(' ')
                                ) : null,
                                ticket.serial_number ? React.createElement('span', { className: 'text-gray-400 text-[10px] block' }, 'S/N: ' + ticket.serial_number) : null
                            )
                        ),
                        React.createElement('div', { className: 'bg-white p-3 rounded-lg shadow-sm border border-gray-200' },
                            React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                React.createElement('i', { className: 'fas fa-tasks text-slate-600 text-sm' }),
                                React.createElement('span', { className: 'font-bold text-gray-700 text-xs sm:text-sm' }, 'Statut:')
                            ),
                            (currentUser && ['admin', 'supervisor', 'technician', 'senior_technician'].includes(currentUser.role)) ? 
                            React.createElement('select', { 
                                className: 'w-full mt-1 bg-white border border-gray-300 text-gray-800 text-xs sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1.5 font-bold',
                                value: ticket.status,
                                onClick: (e) => e.stopPropagation(),
                                onChange: async (e) => {
                                    const newStatus = e.target.value;
                                    if(!confirm("Changer le statut en " + newStatus.toUpperCase() + " ?")) return;
                                    try {
                                        setLoading(true);
                                        await axios.patch(API_URL + '/tickets/' + ticket.id, { status: newStatus });
                                        const response = await axios.get(API_URL + '/tickets/' + ticketId);
                                        setTicket(response.data.ticket);
                                    } catch(err) {
                                        alert('Erreur update status: ' + err.message);
                                    } finally {
                                        setLoading(false);
                                    }
                                }
                            },
                                React.createElement('option', { value: 'received' }, 'OUVERT'),
                                React.createElement('option', { value: 'diagnostic' }, 'DIAGNOSTIC'),
                                React.createElement('option', { value: 'in_progress' }, 'EN COURS'),
                                React.createElement('option', { value: 'waiting_parts' }, 'EN ATTENTE'),
                                React.createElement('option', { value: 'private' }, '🔒 PRIVÉ'),
                                React.createElement('option', { value: 'completed' }, 'TERMINÉ')
                            )
                            : React.createElement('span', { className: 'text-gray-800 font-semibold text-xs sm:text-sm block pl-6' }, getStatusLabel(ticket.status))
                        ),
                        React.createElement('div', { className: 'bg-white p-3 rounded-lg shadow-sm border border-gray-200' },
                            React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                                React.createElement('i', { className: 'far fa-calendar text-green-600 text-sm' }),
                                React.createElement('span', { className: 'font-bold text-gray-700 text-xs sm:text-sm' }, "Créé le:")
                            ),
                            React.createElement('span', { className: 'text-gray-800 font-semibold text-xs sm:text-sm block pl-6' },
                                formatDateEST(ticket.created_at)
                            )
                        ),
                        React.createElement('div', { className: 'bg-white p-3 rounded-lg shadow-sm border border-gray-200' },
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
                    React.createElement('div', { className: 'mb-4 sm:mb-6 bg-orange-50 border-2 border-orange-400 rounded-xl shadow-md p-4 sm:p-6' },
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
                                (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') ?
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
                (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') ?
                    React.createElement('div', { 
                        className: 'mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 bg-gray-50 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200',
                        'data-section': 'planning'
                    },
                        React.createElement('div', { className: 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4' },
                            React.createElement('h4', { className: 'text-base sm:text-lg md:text-xl font-bold text-gray-800 flex items-center' },
                                React.createElement('i', { className: 'fas fa-calendar-alt mr-2 text-blue-600 text-sm sm:text-base' }),
                                'Planification'
                            ),
                            !editingSchedule ? React.createElement('button', {
                                onClick: () => setEditingSchedule(true),
                                className: 'px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs sm:text-sm transition-all shadow-sm'
                            },
                                React.createElement('i', { className: 'fas fa-edit mr-1' }),
                                'Modifier'
                            ) : null
                        ),

                        !editingSchedule ? (
                            // Affichage lecture seule
                            React.createElement('div', { className: 'space-y-3' },
                                React.createElement('div', { className: 'bg-white p-4 rounded-lg shadow-sm border border-gray-200' },
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
                                React.createElement('div', { className: 'bg-white p-4 rounded-lg shadow-sm border border-gray-200' },
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
                                        className: 'w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all font-semibold'
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
                                    ) : null, // Ferme le badge d'état

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
                                            className: 'flex-1 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all font-semibold'
                                        }),
                                        scheduledDate ? React.createElement('button', {
                                            type: 'button',
                                            onClick: () => setScheduledDate(''),
                                            className: 'px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg'
                                        },
                                            React.createElement('i', { className: 'fas fa-times mr-1' }),
                                            "Retirer"
                                        ) : null
                                    ), // Ferme le div flex gap-2
                                    scheduledDate ? React.createElement('div', { className: 'mt-2 text-xs text-gray-600 italic' },
                                        '💡 Cliquez sur "Retirer" pour passer de PLANIFIÉ à ASSIGNÉ'
                                    ) : null
                                ), // Ferme le div principal Date de maintenance

                                // Boutons d'action
                                React.createElement('div', { className: 'flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3' },
                                    React.createElement('button', {
                                        onClick: () => {
                                            setEditingSchedule(false);
                                            setScheduledAssignedTo(ticket.assigned_to ? String(ticket.assigned_to) : '');
                                            setScheduledDate(hasScheduledDate(ticket.scheduled_date) ? ticket.scheduled_date.substring(0, 10) : '');
                                        },
                                        className: 'w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-200 text-gray-800 rounded-lg font-bold text-sm transition-all hover:bg-gray-300'
                                    },
                                        React.createElement('i', { className: 'fas fa-times mr-1' }),
                                        'Annuler'
                                    ),
                                    React.createElement('button', {
                                        onClick: handleSaveSchedule,
                                        disabled: savingSchedule,
                                        className: 'w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-all disabled:opacity-50'
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

                // --- NEW TICKET ATTACHMENTS COMPONENT ---
                React.createElement(TicketAttachments, {
                    ticket: ticket,
                    currentUser: currentUser,
                    onMediaChange: loadTicketDetails
                }),

                // --- NEW TICKET COMMENTS COMPONENT ---
                React.createElement(TicketComments, {
                    ticketId: ticket.id, // FIXED: Pass Integer ID instead of String ticket_id
                    currentUser: currentUser,
                    onRefresh: loadTicketDetails
                }),

                React.createElement('div', { className: 'flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6 pt-4 border-t-2 border-gray-200' },
                    React.createElement('button', {
                        onClick: handlePrint,
                        className: 'w-full sm:w-auto px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition-all flex items-center justify-center gap-2'
                    },
                        React.createElement('i', { className: 'fas fa-print' }),
                        'Imprimer'
                    ),
                    React.createElement('button', {
                        onClick: onClose,
                        className: 'w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition-all flex items-center justify-center gap-2'
                    },
                        React.createElement('i', { className: 'fas fa-arrow-left' }),
                        'Retour au tableau de bord'
                    )
                )
            ) : React.createElement('div', { className: 'text-center py-12' },
                React.createElement('p', { className: 'text-red-600 font-semibold' }, 'Erreur lors du chargement du ticket'),
                React.createElement('button', { onClick: onClose, className: 'mt-4 text-blue-600 hover:underline' }, 'Fermer')
            ),
            
            // Modal Expert AI
            ticket && React.createElement(window.AIChatModal || (() => null), {
                isOpen: isAIChatOpen,
                onClose: () => setIsAIChatOpen(false),
                ticket: ticket
            })
        ),
        ),

        React.createElement(ConfirmModal, {
            show: confirmDialog.show,
            message: confirmDialog.message,
            onConfirm: confirmDialog.onConfirm,
            onCancel: () => setConfirmDialog({ show: false, message: '', onConfirm: null })
        })
    );
};

// Make it available globally
window.TicketDetailsModal = TicketDetailsModal;