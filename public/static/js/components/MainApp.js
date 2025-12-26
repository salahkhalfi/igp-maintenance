const MainApp = ({ tickets = [], machines = [], currentUser, onLogout, onRefresh, showCreateModal, setShowCreateModal, onTicketCreated, unreadMessagesCount, onRefreshMessages, headerTitle, headerSubtitle, moveTicket, deleteTicket, initialDescription, initialImageUrl, initialTitle: propTitle, initialPriority: propPriority, initialMachineId: propMachineId, initialAssignedToId: propAssignedToId, initialScheduledDate: propScheduledDate }) => {
    // Sécurité : Garantir que tickets est un tableau
    const safeTickets = Array.isArray(tickets) ? tickets : [];
    const safeMachines = Array.isArray(machines) ? machines : [];

    // États globaux de l'interface
    const [selectedTicketId, setSelectedTicketId] = React.useState(null);
    const [showDetailsModal, setShowDetailsModal] = React.useState(false);
    const [showUserManagement, setShowUserManagement] = React.useState(false);
    const [showMachineManagement, setShowMachineManagement] = React.useState(false);
    const [showSystemSettings, setShowSystemSettings] = React.useState(false);
    const [showUserGuide, setShowUserGuide] = React.useState(false);
    const [showArchived, setShowArchived] = React.useState(false);
    // Messaging States Removed
    const [showScrollTop, setShowScrollTop] = React.useState(false);
    const [showPerformanceModal, setShowPerformanceModal] = React.useState(false);
    const [showOverdueModal, setShowOverdueModal] = React.useState(false);
    const [showPushDevicesModal, setShowPushDevicesModal] = React.useState(false);
    const [showMobileMenu, setShowMobileMenu] = React.useState(false);
    const [showAdminRoles, setShowAdminRoles] = React.useState(false);
    const [showProductionPlanning, setShowProductionPlanning] = React.useState(false);
    const [showTvModal, setShowTvModal] = React.useState(false);
    const [showAIChat, setShowAIChat] = React.useState(false);
    const [showDataImport, setShowDataImport] = React.useState(false);
    const [dataImportTab, setDataImportTab] = React.useState('users');

    // Gestion des modules (Feature Flipping)
    const [activeModules, setActiveModules] = React.useState({ planning: true, statistics: true, notifications: true, messaging: true, machines: true });

    // Helper pour vérifier les permissions
    const hasPermission = (permission) => {
        if (!currentUser) return false;
        if (currentUser.role === 'admin' || currentUser.is_super_admin || currentUser.isSuperAdmin) return true;
        
        // Safety check for permissions array
        if (!currentUser.permissions || !Array.isArray(currentUser.permissions)) return false;

        // Check for exact match OR permission with scope (e.g. 'tickets.read' matches 'tickets.read.all' or 'tickets.read.own')
        return currentUser.permissions.some(p => p === permission || p.startsWith(permission + '.'));
    };

    React.useEffect(() => {
        if (currentUser) {
            // Modules are forced ON in legacy mode
            setActiveModules({ planning: true, statistics: true, notifications: true, messaging: true, machines: true });
            /*
            // Charger la configuration des modules
            axios.get('/api/settings/modules')
                .then(res => {
                    if (res.data) setActiveModules(res.data);
                })
                .catch(err => console.warn('Failed to load modules config', err));
            */
        }
    }, [currentUser]);

    // Gestion des colonnes dynamiques (Levé depuis KanbanBoard)
    const [columns, setColumns] = React.useState(() => {
        const saved = localStorage.getItem('kanban_columns');
        return saved ? JSON.parse(saved) : [
            { key: 'received', label: 'Requête Reçue', icon: 'inbox', color: 'blue' },
            { key: 'diagnostic', label: 'Diagnostic', icon: 'search', color: 'yellow' },
            { key: 'in_progress', label: 'En Cours', icon: 'wrench', color: 'orange' },
            { key: 'waiting_parts', label: 'En Attente Pièces', icon: 'clock', color: 'purple' },
            { key: 'completed', label: 'Terminé', icon: 'check-circle', color: 'green' },
            { key: 'archived', label: 'Archivé', icon: 'archive', color: 'gray' }
        ];
    });
    const [showManageColumns, setShowManageColumns] = React.useState(false);

    React.useEffect(() => {
        if (currentUser) {
             // Try loading from API first
             axios.get(API_URL + '/preferences/kanban_columns')
                .then(res => {
                    if (res.data.value) {
                        setColumns(res.data.value);
                        localStorage.setItem('kanban_columns', JSON.stringify(res.data.value));
                    } else {
                        const saved = localStorage.getItem('kanban_columns');
                        if (saved) setColumns(JSON.parse(saved));
                    }
                })
                .catch(err => {
                    console.warn('Failed to load preferences', err);
                    const saved = localStorage.getItem('kanban_columns');
                    if (saved) setColumns(JSON.parse(saved));
                });
        }
    }, [currentUser]);

    const handleSaveColumns = (newCols) => {
        setColumns(newCols);
        localStorage.setItem('kanban_columns', JSON.stringify(newCols));
        
        if (currentUser) {
             axios.put(API_URL + '/preferences/kanban_columns', { value: newCols })
                .catch(err => console.error('Failed to save columns preference', err));
        }
    };

    const [initialTitle, setInitialTitle] = React.useState(propTitle || '');
    const [initialPriority, setInitialPriority] = React.useState(propPriority || 'medium');
    const [initialMachineId, setInitialMachineId] = React.useState(propMachineId || '');
    const [initialAssignedToId, setInitialAssignedToId] = React.useState(propAssignedToId || null);
    const [initialAssignedToName, setInitialAssignedToName] = React.useState('');
    const [initialScheduledDate, setInitialScheduledDate] = React.useState(propScheduledDate || '');

    // Sync Props to State (Deep Link Support)
    React.useEffect(() => { if (propTitle) setInitialTitle(propTitle); }, [propTitle]);
    React.useEffect(() => { if (propPriority) setInitialPriority(propPriority); }, [propPriority]);
    React.useEffect(() => { if (propMachineId) setInitialMachineId(propMachineId); }, [propMachineId]);
    React.useEffect(() => { if (propAssignedToId) setInitialAssignedToId(propAssignedToId); }, [propAssignedToId]);
    React.useEffect(() => { if (propScheduledDate) setInitialScheduledDate(propScheduledDate); }, [propScheduledDate]);

    // Use local description to allow override from AI
    const [localDescription, setLocalDescription] = React.useState(initialDescription || '');
    
    // Update local description when prop changes (Deep Link)
    React.useEffect(() => {
        if (initialDescription) setLocalDescription(initialDescription);
    }, [initialDescription]);

    const handleTicketDetected = (data) => {
        if (data.title) setInitialTitle(data.title);
        if (data.description) setLocalDescription(data.description);
        if (data.priority) setInitialPriority(data.priority);
        if (data.machine_id) setInitialMachineId(data.machine_id);
        
        // AI FIX: Capture assignment and date
        if (data.assigned_to_id) setInitialAssignedToId(data.assigned_to_id);
        if (data.assigned_to_name) setInitialAssignedToName(data.assigned_to_name);
        if (data.scheduled_date) setInitialScheduledDate(data.scheduled_date);

        setShowCreateModal(true);
    };

    // --- EFFETS (Listeners & Initialisation) ---

    React.useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300 && showArchived);
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [showArchived]);

        // --- URL (Deep linking) ---
    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const ticketIdFromUrl = urlParams.get('ticket');
        const autoAction = urlParams.get('auto_action');
        const openMessagesSenderId = urlParams.get('openMessages');
        
        if (ticketIdFromUrl) {
            const ticketId = parseInt(ticketIdFromUrl, 10);
            if (!isNaN(ticketId)) {
                setSelectedTicketId(ticketId);
                setShowDetailsModal(true);
                if (safeTickets.length > 0) {
                    const ticket = safeTickets.find(t => t.id === ticketId);
                    if (ticket && autoAction === 'acknowledge' && ticket.status === 'received') {
                        setTimeout(() => moveTicketToStatus(ticket, 'in_progress'), 1500);
                    }
                }
            }
        } else if (openMessagesSenderId) {
            // REDIRECT TO MESSENGER
            const senderId = parseInt(openMessagesSenderId, 10);
            window.location.href = `/messenger?conversationId=direct_${senderId}`;
        }
    }, [safeTickets]);

    // Listener for 'open-planning' event
    React.useEffect(() => {
        const handleOpenPlanning = () => {
            if (activeModules.planning) {
                setShowProductionPlanning(true);
            } else {
                alert("Le module Planning n'est pas activé.");
            }
        };
        window.addEventListener('open-planning', handleOpenPlanning);
        return () => window.removeEventListener('open-planning', handleOpenPlanning);
    }, [activeModules]);

    // URL-based view persistence (e.g., ?view=planning)
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const view = params.get('view');
        if (view === 'planning' && activeModules.planning) {
            setShowProductionPlanning(true);
        }
    }, [activeModules]);

    // Update URL when planning opens/closes
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (showProductionPlanning) {
            params.set('view', 'planning');
        } else {
            params.delete('view');
        }
        const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
        window.history.replaceState({}, '', newUrl);
    }, [showProductionPlanning]);

    // Expose openDataImport globally
    React.useEffect(() => {
        window.openDataImport = (tab = 'users') => {
            setDataImportTab(tab);
            setShowDataImport(true);
        };
        return () => { delete window.openDataImport; };
    }, []);

    // Service Worker Messages
    React.useEffect(() => {
        const handleServiceWorkerMessage = (event) => {
            if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
                const { action, data } = event.data;
                if ((action === 'view_ticket' || action === 'view' || action === 'acknowledge') && data.ticketId) {
                    const ticketId = parseInt(data.ticketId, 10);
                    setSelectedTicketId(ticketId);
                    setShowDetailsModal(true);
                    const ticket = safeTickets.find(t => t.id === ticketId);
                    if (ticket && data.auto_action === 'acknowledge' && ticket.status === 'received') {
                        setTimeout(() => moveTicketToStatus(ticket, 'in_progress'), 1500);
                    } else if (!ticket && onRefresh) {
                        onRefresh();
                    }
                } else if (action === 'new_private_message' && data.senderId) {
                    // REDIRECT TO MESSENGER
                    window.location.href = `/messenger?conversationId=direct_${data.senderId}`;
                }
            }
        };
        navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        return () => navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    }, [safeTickets]);

    // --- FONCTIONS MÉTIER ---

    const getActiveTicketsCount = () => {
        // Double check just in case
        if (!safeTickets || !safeTickets.filter) return 0;
        
        let activeTickets = safeTickets.filter(t => t.status !== 'completed' && t.status !== 'archived' && t.status !== 'cancelled');
        if (currentUser && currentUser.role === 'operator') {
            activeTickets = activeTickets.filter(t => t.reported_by === currentUser.id);
        }
        return activeTickets.length;
    };

    const playCelebrationSound = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const notes = [523.25, 659.25, 783.99]; 
            const now = audioContext.currentTime;
            notes.forEach((freq, i) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscillator.frequency.value = freq;
                oscillator.type = 'sine'; 
                gainNode.gain.setValueAtTime(0, now + i * 0.08);
                gainNode.gain.linearRampToValueAtTime(0.15, now + i * 0.08 + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.3);
                oscillator.start(now + i * 0.08);
                oscillator.stop(now + i * 0.08 + 0.3);
            });
        } catch (error) { console.log('Audio not available:', error); }
    };

    const moveTicketToStatus = async (ticket, newStatus) => {
        if (ticket.status === newStatus) return;
        try {
            await moveTicket(ticket.id, newStatus, 'Changement de statut: ' + ticket.status + ' → ' + newStatus);
            onTicketCreated(); 
            
            if (newStatus === 'completed') {
                requestAnimationFrame(() => {
                    if (typeof confetti !== 'undefined') {
                        confetti({
                            particleCount: 100, spread: 70, origin: { y: 0.6 },
                            colors: ['#003B73', '#FFD700', '#C0C0C0', '#4CAF50', '#FF6B6B'],
                            ticks: 120, gravity: 1.5, scalar: 0.9
                        });
                    }
                    setTimeout(() => playCelebrationSound(), 0);
                });
            }
        } catch (error) {
            alert('Erreur lors du déplacement: ' + (error.response?.data?.error || 'Erreur inconnue'));
        }
    };

    const handleDeleteTicket = async (ticketId) => {
        const confirmed = window.confirm('Supprimer ce ticket définitivement ? Cette action est irréversible.');
        if (!confirmed) return;
        try {
            await deleteTicket(ticketId);
            await onRefresh();
            alert('Ticket supprimé avec succès');
        } catch (error) {
            alert('Erreur lors de la suppression: ' + (error.response?.data?.error || 'Erreur inconnue'));
        }
    };

    // --- STYLES CONDITIONNELS ---
    const isAnyModalOpen = showCreateModal || showDetailsModal || showPerformanceModal || 
                          showOverdueModal || showPushDevicesModal || showUserManagement || 
                          showSystemSettings || showMachineManagement || 
                          showUserGuide; // showMessaging removed

    const footerStyle = isAnyModalOpen ? {
        background: '#f1f5f9',
        boxShadow: 'none', borderTop: '4px solid #003366'
    } : {
        background: 'rgba(255, 255, 255, 0.90)', /* Removed backdrop-filter for stability */
        boxShadow: '0 -4px 12px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.5)', borderTop: '4px solid #003366'
    };

    const kanbanContainerStyle = isAnyModalOpen ? {
        pointerEvents: 'none', transition: 'none'
    } : {};

    // --- RENDU ---
    return React.createElement('div', { className: 'min-h-screen' },
        // --- MODALS ---
        React.createElement(CreateTicketModal, {
            show: showCreateModal, onClose: () => setShowCreateModal(false),
            machines: machines, onTicketCreated: onTicketCreated, currentUser: currentUser,
            initialDescription: localDescription, initialImageUrl: initialImageUrl,
            initialTitle: initialTitle, initialPriority: initialPriority, initialMachineId: initialMachineId,
            initialAssignedToId: initialAssignedToId, initialAssignedToName: initialAssignedToName, initialScheduledDate: initialScheduledDate
        }),
        React.createElement(TicketDetailsModal, {
            show: showDetailsModal, onClose: () => { setShowDetailsModal(false); setSelectedTicketId(null); },
            ticketId: selectedTicketId, currentUser: currentUser,
            onTicketDeleted: () => { setShowDetailsModal(false); setSelectedTicketId(null); onTicketCreated(); }
        }),
        React.createElement(PerformanceModal, { show: showPerformanceModal, onClose: () => setShowPerformanceModal(false) }),
        React.createElement(OverdueTicketsModal, { show: showOverdueModal, onClose: () => setShowOverdueModal(false), currentUser: currentUser }),
        React.createElement(PushDevicesModal, { show: showPushDevicesModal, onClose: () => setShowPushDevicesModal(false) }),
        
        /* MODERN BRIDGE REPLACEMENT - LEGACY MODALS REMOVED */

        React.createElement(ManageColumnsModal, {
            show: showManageColumns,
            onClose: () => setShowManageColumns(false),
            columns: columns,
            onSave: handleSaveColumns,
            tickets: tickets,  // ← NOUVEAU: Passage de tickets pour validation
            currentUser: currentUser
        }),
        React.createElement(SystemSettingsModal, { show: showSystemSettings, onClose: () => setShowSystemSettings(false), currentUser: currentUser }),
        
        /* MODERN BRIDGE REPLACEMENT - LEGACY MODALS REMOVED */

        React.createElement(UserGuideModal, { show: showUserGuide, onClose: () => setShowUserGuide(false), currentUser: currentUser }),

        // --- HEADER (NOUVEAU COMPOSANT) ---
        React.createElement(AppHeader, {
            currentUser,
            activeModules, // Pass modules to Header
            hasPermission, // Pass permission helper
            activeTicketsCount: getActiveTicketsCount(),
            unreadMessagesCount,
            headerTitle,
            headerSubtitle,
            showMobileMenu,
            setShowMobileMenu,
            showArchived,
            setShowArchived: (val) => { 
                setShowArchived(val); 
                if(!val) setTimeout(() => document.getElementById('archived-section')?.scrollIntoView({behavior:'smooth'}), 100);
            },
            onRefresh: () => { onRefresh(); setShowMobileMenu(false); },
            onLogout: () => { onLogout(); setShowMobileMenu(false); },
            onSearch: () => {}, // Search géré en interne dans AppHeader
            onOpenCreateModal: () => { setShowCreateModal(true); setShowMobileMenu(false); },
            onOpenMessaging: () => { 
                // Redirect to new messenger
                window.open('/messenger', '_blank');
                setShowMobileMenu(false); 
            },
            onOpenMachineManagement: () => { 
                if (activeModules.machines) {
                    // FORCE BRIDGE TO MODERN REACT MODAL
                    if (window.openMachineManagement) {
                        window.openMachineManagement();
                    } else {
                        console.warn("Module Machines en cours de chargement...");
                    }
                } else {
                    alert("Le module 'Gestion Machines' n'est pas activé.");
                }
                setShowMobileMenu(false); 
            },
            onOpenOverdue: () => { setShowOverdueModal(true); setShowMobileMenu(false); },
            onOpenPushDevices: () => { setShowPushDevicesModal(true); setShowMobileMenu(false); },
            onOpenUserManagement: () => { 
                // FORCE BRIDGE TO MODERN REACT MODAL
                if (window.openUserManagement) {
                    window.openUserManagement();
                } else {
                    console.warn("Module Utilisateurs en cours de chargement...");
                }
                setShowMobileMenu(false); 
            },
            onOpenPerformance: () => { setShowPerformanceModal(true); setShowMobileMenu(false); },
            onOpenManageColumns: () => { setShowManageColumns(true); setShowMobileMenu(false); },
            onOpenSystemSettings: () => { setShowSystemSettings(true); setShowMobileMenu(false); },
            onOpenAdminRoles: () => { setShowAdminRoles(true); setShowMobileMenu(false); },
            onOpenTv: () => { setShowTvModal(true); setShowMobileMenu(false); },
            onOpenAIChat: () => { setShowAIChat(true); setShowMobileMenu(false); },
            onOpenPlanning: () => { 
                if (activeModules.planning) {
                    setShowProductionPlanning(true); 
                } else {
                    alert("Le module Planning n'est pas activé.");
                }
                setShowMobileMenu(false); 
            },
            onOpenDetails: (id) => { setSelectedTicketId(id); setShowDetailsModal(true); setShowMobileMenu(false); }
        }),

        // --- PRODUCTION PLANNING (FULL SCREEN MODAL) ---
        showProductionPlanning && React.createElement(window.ProductionPlanning, { onClose: () => setShowProductionPlanning(false) }),

        // --- KANBAN BOARD ---
        React.createElement('div', { className: 'max-w-[1600px] mx-auto px-4 py-6', style: { ...kanbanContainerStyle, display: (showAdminRoles || showProductionPlanning) ? 'none' : 'block' } },
            React.createElement(KanbanBoard, {
                tickets: safeTickets,
                currentUser: currentUser,
                columns: columns,
                showArchived: showArchived,
                onTicketClick: (id) => { setSelectedTicketId(id); setShowDetailsModal(true); },
                onTicketMove: moveTicketToStatus,
                onTicketDelete: handleDeleteTicket
            })
        ),

        // --- ADMIN ROLES (FULL SCREEN MODAL) ---
        showAdminRoles && React.createElement('div', { className: 'fixed inset-0 z-[100] overflow-y-auto bg-gray-50 animate-fadeIn' },
            React.createElement(window.AdminRoles, { onBack: () => setShowAdminRoles(false) })
        ),

        // --- TV DASHBOARD MODAL ---
        showTvModal && React.createElement(window.TVDashboardModal, { isOpen: showTvModal, onClose: () => setShowTvModal(false) }),

        // --- AI CHAT MODAL ---
        window.AIChatModal && React.createElement(window.AIChatModal, { isOpen: showAIChat, onClose: () => setShowAIChat(false), ticket: null }),

        // --- DATA IMPORT/EXPORT MODAL ---
        window.DataImportModal && React.createElement(window.DataImportModal, { 
            show: showDataImport, 
            onClose: () => setShowDataImport(false), 
            initialTab: dataImportTab 
        }),

        // --- FOOTER ---
        // Hide VoiceTicketFab when Planning is open (avoid z-index conflict with Notes panel)
        (window.VoiceTicketFab && !showProductionPlanning) ? React.createElement(window.VoiceTicketFab, { onTicketDetected: handleTicketDetected }) : null,
        React.createElement('footer', { className: 'mt-12 py-6 text-center border-t-4 border-igp-blue', style: footerStyle },
            React.createElement('div', { className: 'max-w-[1600px] mx-auto px-4' },
            React.createElement('p', { className: 'text-sm mb-2', style: { color: '#1a1a1a', fontWeight: '700' } },
                React.createElement('i', { className: 'fas fa-code mr-2', style: { color: '#003366' } }),
                'Application conçue et développée par ',
                React.createElement('span', { style: { fontWeight: '900', color: '#003366' } }, "Le département des Technologies de l'Information")
            ),
                React.createElement('p', { className: 'text-xs', style: { color: '#1a1a1a', fontWeight: '700' } }, '© ' + new Date().getFullYear() + ' - MaintenanceOS')
            )
        ),

        // Bouton Scroll Top
        showScrollTop ? React.createElement('button', {
            onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
            className: 'fixed bottom-8 right-8 z-50 bg-blue-600 text-white rounded-full p-4 shadow-2xl hover:bg-blue-700 transition-all'
        }, React.createElement('i', { className: 'fas fa-arrow-up' })) : null
    );
};

// Make it available globally
window.MainApp = MainApp;