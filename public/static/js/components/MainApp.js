const MainApp = ({ tickets, machines, currentUser, onLogout, onRefresh, showCreateModal, setShowCreateModal, onTicketCreated, unreadMessagesCount, onRefreshMessages, headerTitle, headerSubtitle, moveTicket, deleteTicket }) => {
    // États globaux de l'interface
    const [selectedTicketId, setSelectedTicketId] = React.useState(null);
    const [showDetailsModal, setShowDetailsModal] = React.useState(false);
    const [showUserManagement, setShowUserManagement] = React.useState(false);
    const [showMachineManagement, setShowMachineManagement] = React.useState(false);
    const [showSystemSettings, setShowSystemSettings] = React.useState(false);
    const [showUserGuide, setShowUserGuide] = React.useState(false);
    const [showArchived, setShowArchived] = React.useState(false);
    const [showMessaging, setShowMessaging] = React.useState(false);
    const [messagingContact, setMessagingContact] = React.useState(null);
    const [messagingTab, setMessagingTab] = React.useState("public");
    const [showScrollTop, setShowScrollTop] = React.useState(false);
    const [showPerformanceModal, setShowPerformanceModal] = React.useState(false);
    const [showOverdueModal, setShowOverdueModal] = React.useState(false);
    const [showPushDevicesModal, setShowPushDevicesModal] = React.useState(false);
    const [showMobileMenu, setShowMobileMenu] = React.useState(false);
    const [showAdminRoles, setShowAdminRoles] = React.useState(false);

    // --- EFFETS (Listeners & Initialisation) ---

    React.useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300 && showArchived);
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [showArchived]);

    // Gestion URL (Deep linking)
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
                if (tickets.length > 0) {
                    const ticket = tickets.find(t => t.id === ticketId);
                    if (ticket && autoAction === 'acknowledge' && ticket.status === 'received') {
                        setTimeout(() => moveTicketToStatus(ticket, 'in_progress'), 1500);
                    }
                }
            }
        } else if (openMessagesSenderId) {
            const senderId = parseInt(openMessagesSenderId, 10);
            setMessagingContact({ id: senderId, first_name: 'Chargement...', role: 'unknown' });
            setMessagingTab('private');
            setShowMessaging(true);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [tickets]);

    // Service Worker Messages
    React.useEffect(() => {
        const handleServiceWorkerMessage = (event) => {
            if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
                const { action, data } = event.data;
                if ((action === 'view_ticket' || action === 'view' || action === 'acknowledge') && data.ticketId) {
                    const ticketId = parseInt(data.ticketId, 10);
                    setSelectedTicketId(ticketId);
                    setShowDetailsModal(true);
                    const ticket = tickets.find(t => t.id === ticketId);
                    if (ticket && data.auto_action === 'acknowledge' && ticket.status === 'received') {
                        setTimeout(() => moveTicketToStatus(ticket, 'in_progress'), 1500);
                    } else if (!ticket && onRefresh) {
                        onRefresh();
                    }
                } else if (action === 'new_private_message' && data.senderId) {
                    setMessagingContact({ id: data.senderId, first_name: data.senderName || 'Utilisateur', role: 'unknown' });
                    setMessagingTab('private');
                    setShowMessaging(true);
                }
            }
        };
        navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        return () => navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    }, [tickets]);

    // --- FONCTIONS MÉTIER ---

    const getActiveTicketsCount = () => {
        let activeTickets = tickets.filter(t => t.status !== 'completed' && t.status !== 'archived');
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
                          showSystemSettings || showMachineManagement || showMessaging || 
                          showUserGuide;

    const footerStyle = isAnyModalOpen ? {
        background: '#f1f5f9', backdropFilter: 'none', WebkitBackdropFilter: 'none',
        boxShadow: 'none', borderTop: '4px solid #003366'
    } : {
        background: 'rgba(255, 255, 255, 0.40)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 -8px 32px 0 rgba(0, 0, 0, 0.2)',
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
            machines: machines, onTicketCreated: onTicketCreated, currentUser: currentUser
        }),
        React.createElement(TicketDetailsModal, {
            show: showDetailsModal, onClose: () => { setShowDetailsModal(false); setSelectedTicketId(null); },
            ticketId: selectedTicketId, currentUser: currentUser,
            onTicketDeleted: () => { setShowDetailsModal(false); setSelectedTicketId(null); onTicketCreated(); }
        }),
        React.createElement(PerformanceModal, { show: showPerformanceModal, onClose: () => setShowPerformanceModal(false) }),
        React.createElement(OverdueTicketsModal, { show: showOverdueModal, onClose: () => setShowOverdueModal(false), currentUser: currentUser }),
        React.createElement(PushDevicesModal, { show: showPushDevicesModal, onClose: () => setShowPushDevicesModal(false) }),
        React.createElement(UserManagementModal, {
            show: showUserManagement, onClose: () => setShowUserManagement(false), currentUser: currentUser,
            onOpenMessage: (user) => { setShowUserManagement(false); setMessagingContact(user); setMessagingTab("private"); setShowMessaging(true); }
        }),
        React.createElement(SystemSettingsModal, { show: showSystemSettings, onClose: () => setShowSystemSettings(false), currentUser: currentUser }),
        React.createElement(MachineManagementModal, { show: showMachineManagement, onClose: () => setShowMachineManagement(false), currentUser: currentUser, machines: machines, onRefresh: onRefresh }),
        React.createElement(MessagingModal, {
            show: showMessaging, onClose: () => { setShowMessaging(false); setMessagingContact(null); setMessagingTab("public"); if (onRefreshMessages) onRefreshMessages(); },
            currentUser: currentUser, initialContact: messagingContact, initialTab: messagingTab
        }),
        React.createElement(UserGuideModal, { show: showUserGuide, onClose: () => setShowUserGuide(false), currentUser: currentUser }),

        // --- HEADER (NOUVEAU COMPOSANT) ---
        React.createElement(AppHeader, {
            currentUser,
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
            onOpenMessaging: () => { setShowMessaging(true); setShowMobileMenu(false); },
            onOpenMachineManagement: () => { setShowMachineManagement(true); setShowMobileMenu(false); },
            onOpenPerformance: () => { setShowPerformanceModal(true); setShowMobileMenu(false); },
            onOpenOverdue: () => { setShowOverdueModal(true); setShowMobileMenu(false); },
            onOpenPushDevices: () => { setShowPushDevicesModal(true); setShowMobileMenu(false); },
            onOpenUserManagement: () => { setShowUserManagement(true); setShowMobileMenu(false); },
            onOpenAdminRoles: () => { setShowAdminRoles(true); setShowMobileMenu(false); },
            onOpenDetails: (id) => { setSelectedTicketId(id); setShowDetailsModal(true); setShowMobileMenu(false); }
        }),

        // --- KANBAN BOARD OU ADMIN ROLES ---
        showAdminRoles ? 
            React.createElement(AdminRoles, { onBack: () => setShowAdminRoles(false) }) :
            React.createElement('div', { className: 'max-w-[1600px] mx-auto px-4 py-6', style: kanbanContainerStyle },
                React.createElement(KanbanBoard, {
                    tickets: tickets,
                    currentUser: currentUser,
                    showArchived: showArchived,
                    onTicketClick: (id) => { setSelectedTicketId(id); setShowDetailsModal(true); },
                    onTicketMove: moveTicketToStatus,
                    onTicketDelete: handleDeleteTicket
                })
            ),

        // --- FOOTER ---
        React.createElement('footer', { className: 'mt-12 py-6 text-center border-t-4 border-igp-blue', style: footerStyle },
            React.createElement('div', { className: 'max-w-[1600px] mx-auto px-4' },
                React.createElement('p', { className: 'text-sm mb-2', style: { color: '#1a1a1a', fontWeight: '700' } },
                    React.createElement('i', { className: 'fas fa-code mr-2', style: { color: '#003366' } }),
                    'Application conçue et développée par ',
                    React.createElement('span', { style: { fontWeight: '900', color: '#003366' } }, "Le département des Technologies de l'Information")
                ),
                React.createElement('p', { className: 'text-xs', style: { color: '#1a1a1a', fontWeight: '700' } }, '© ' + new Date().getFullYear() + ' - Produits Verriers International (IGP) Inc.')
            )
        ),

        // Bouton Scroll Top
        showScrollTop ? React.createElement('button', {
            onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
            className: 'fixed bottom-8 right-8 z-50 bg-blue-600 text-white rounded-full p-4 shadow-2xl hover:bg-blue-700 transition-all'
        }, React.createElement('i', { className: 'fas fa-arrow-up' })) : null
    );
};
