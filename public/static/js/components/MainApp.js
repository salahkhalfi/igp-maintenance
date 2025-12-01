const MainApp = ({ tickets, machines, currentUser, onLogout, onRefresh, showCreateModal, setShowCreateModal, onTicketCreated, unreadMessagesCount, onRefreshMessages, headerTitle, headerSubtitle }) => {
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

    // États de recherche
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState([]);
    const [showSearchResults, setShowSearchResults] = React.useState(false);
    const [searchLoading, setSearchLoading] = React.useState(false);
    const [searchKeywordResults, setSearchKeywordResults] = React.useState([]);
    const [searchTextResults, setSearchTextResults] = React.useState([]);
    const [searchIsKeyword, setSearchIsKeyword] = React.useState(false);
    const [searchKeywordType, setSearchKeywordType] = React.useState(null);
    const [searchDropdownPosition, setSearchDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });
    
    const searchTimeoutRef = React.useRef(null);
    const searchInputRef = React.useRef(null);

    // États Push Notification
    const [pushSubscribed, setPushSubscribed] = React.useState(false);
    const [pushPermission, setPushPermission] = React.useState(Notification.permission);

    // Gestion des placeholders de recherche
    const searchPlaceholdersDesktop = [
        'Essayez: "retard" pour voir les tickets en retard',
        'Essayez: "urgent" pour voir les priorités critiques',
        'Essayez: "commentaire" pour voir les tickets avec notes',
        'Essayez: "haute" pour voir les haute priorité',
        'Ou cherchez par machine, lieu, ticket...'
    ];
    const searchPlaceholdersMobile = [
        'Ex: "retard" tickets en retard',
        'Ex: "urgent" tickets critiques',
        'Ex: "commentaire" avec notes',
        'Ex: "haute" haute priorité',
        'Machine, lieu, ticket...'
    ];
    const isMobile = window.innerWidth < 768;
    const searchPlaceholders = isMobile ? searchPlaceholdersMobile : searchPlaceholdersDesktop;
    const [placeholderIndex, setPlaceholderIndex] = React.useState(0);

    // --- EFFETS (Listeners & Initialisation) ---

    React.useEffect(() => {
        const checkPushStatus = async () => {
            if (typeof Notification !== 'undefined') setPushPermission(Notification.permission);
            if (window.isPushSubscribed) {
                try {
                    const sub = await window.isPushSubscribed();
                    setPushSubscribed(sub);
                } catch (e) { console.error('Error checking push status:', e); }
            }
        };
        checkPushStatus();
        const handlePushChange = () => checkPushStatus();
        window.addEventListener('push-notification-changed', handlePushChange);
        return () => window.removeEventListener('push-notification-changed', handlePushChange);
    }, []);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % searchPlaceholders.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    React.useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300 && showArchived);
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [showArchived]);

    React.useEffect(() => {
        const updateDropdownPosition = () => {
            if (searchInputRef.current && showSearchResults) {
                const rect = searchInputRef.current.getBoundingClientRect();
                setSearchDropdownPosition({
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width
                });
            }
        };
        window.addEventListener('scroll', updateDropdownPosition);
        window.addEventListener('resize', updateDropdownPosition);
        window.addEventListener('orientationchange', updateDropdownPosition);
        return () => {
            window.removeEventListener('scroll', updateDropdownPosition);
            window.removeEventListener('resize', updateDropdownPosition);
            window.removeEventListener('orientationchange', updateDropdownPosition);
        };
    }, [showSearchResults]);

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
            await axios.patch(API_URL + '/tickets/' + ticket.id, {
                status: newStatus,
                comment: 'Changement de statut: ' + ticket.status + ' → ' + newStatus
            });
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
            await axios.delete(API_URL + '/tickets/' + ticketId);
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

    const headerStyle = isAnyModalOpen ? {
        background: '#f8fafc', backdropFilter: 'none', WebkitBackdropFilter: 'none',
        boxShadow: 'none', borderBottom: '1px solid #e2e8f0', transition: 'all 0.3s ease'
    } : {
        background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(25px) saturate(180%)',
        WebkitBackdropFilter: 'blur(25px) saturate(180%)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)', transition: 'all 0.3s ease'
    };

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

        // --- HEADER ---
        React.createElement('header', { className: 'sticky top-0 z-50', style: headerStyle },
            React.createElement('div', { className: 'max-w-[1600px] mx-auto px-4 py-2' },
                React.createElement('div', { className: 'flex flex-col md:flex-row md:justify-between md:items-center gap-3' },
                    // LOGO
                    React.createElement('div', { className: 'flex items-center min-w-0 group' },
                        React.createElement('div', { className: 'flex items-center' },
                            React.createElement('img', {
                                src: '/api/settings/logo?t=' + Date.now(), alt: 'IGP Logo',
                                className: 'h-8 md:h-10 w-auto object-contain flex-shrink-0 transition-transform duration-300 group-hover:scale-105',
                                onError: (e) => { e.target.src = '/static/logo-igp.png'; }
                            }),
                            React.createElement('div', { className: 'pl-3 flex flex-col justify-center', style: { borderLeft: '1px solid rgba(0,0,0,0.1)', marginLeft: '12px' } },
                                React.createElement('h1', { className: 'text-sm md:text-base font-bold leading-none tracking-tight text-slate-800', title: headerTitle }, headerTitle),
                                React.createElement('p', { className: 'text-[10px] md:text-xs font-medium text-slate-500 mt-0.5' }, headerSubtitle)
                            )
                        ),
                        React.createElement('div', { className: 'hidden md:flex items-center ml-4 px-3 py-1 rounded-full bg-blue-50/50 border border-blue-100/50' },
                            React.createElement('span', { className: 'text-xs font-medium text-blue-700' }, '👋 Bonjour ' + ((currentUser && currentUser.first_name) || (currentUser?.email?.split('@')[0]) || 'Utilisateur'))
                        )
                    ),

                    // SEARCH BAR
                    React.createElement('div', { className: 'relative w-full md:flex-1 md:mx-4 order-3 md:order-none mt-1.5 md:mt-0', style: { zIndex: 50 } },
                        React.createElement('div', { className: 'relative flex items-center w-full' },
                            React.createElement('input', {
                                ref: searchInputRef, type: 'text', placeholder: searchPlaceholders[placeholderIndex],
                                className: 'w-full px-3 md:px-4 py-1.5 md:py-2 pr-20 md:pr-24 border-2 border-blue-200/50 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-xs md:text-sm placeholder-gray-500 bg-white transition-all shadow-inner',
                                value: searchQuery,
                                onChange: (e) => {
                                    const query = e.target.value;
                                    setSearchQuery(query);
                                    if (searchInputRef.current) {
                                        const rect = searchInputRef.current.getBoundingClientRect();
                                        setSearchDropdownPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
                                    }
                                    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                                    if (query.trim().length >= 2) {
                                        setSearchLoading(true);
                                        searchTimeoutRef.current = setTimeout(async () => {
                                            try {
                                                const response = await fetch('/api/search?q=' + encodeURIComponent(query), { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') } });
                                                const data = await response.json();
                                                setSearchResults(data.results || []);
                                                setSearchKeywordResults(data.keywordResults || []);
                                                setSearchTextResults(data.textResults || []);
                                                setSearchIsKeyword(data.isKeywordSearch || false);
                                                setSearchKeywordType(data.keyword || null);
                                                setShowSearchResults(true);
                                            } catch (err) { console.error('Search error:', err); } 
                                            finally { setSearchLoading(false); }
                                        }, 300);
                                    } else { setShowSearchResults(false); setSearchLoading(false); }
                                },
                                onFocus: () => {
                                    if (searchInputRef.current) {
                                        const rect = searchInputRef.current.getBoundingClientRect();
                                        setSearchDropdownPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
                                    }
                                },
                                onBlur: () => setTimeout(() => setShowSearchResults(false), 200)
                            }),
                            searchQuery && React.createElement('button', {
                                onClick: (e) => { e.stopPropagation(); setSearchQuery(''); setShowSearchResults(false); },
                                className: 'absolute right-16 md:right-20 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1',
                            }, React.createElement('i', { className: 'fas fa-times-circle text-lg' })),
                            React.createElement('i', { className: 'fas ' + (searchLoading ? 'fa-spinner fa-spin' : 'fa-search') + ' absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500' })
                        )
                    ),

                    // ACTIONS & BADGES
                    React.createElement('div', { className: "flex items-center gap-2 flex-wrap justify-between w-full md:w-auto md:justify-start mt-2 md:mt-0 flex-shrink-0" },
                        React.createElement('div', { className: "flex items-center gap-2 flex-wrap" },
                            React.createElement('p', { className: "text-xs font-semibold hidden lg:block", style: { color: '#1e40af', fontWeight: '900' } }, getActiveTicketsCount() + " actifs"),
                            (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') ? React.createElement('span', {
                                className: 'px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-300 cursor-pointer hover:bg-orange-200',
                                onClick: () => setShowOverdueModal(true), title: 'Tickets en retard'
                            }, React.createElement('i', { className: 'fas fa-clock mr-1' }), '0') : null,
                            (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') ? React.createElement('span', {
                                className: 'px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300 cursor-pointer hover:bg-blue-200',
                                onClick: () => setShowPerformanceModal(true), title: 'Techniciens actifs'
                            }, React.createElement('i', { className: 'fas fa-users-cog mr-1' }), React.createElement('span', { id: 'technicians-count-badge' }, '0 techs')) : null,
                            (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') ? React.createElement('span', {
                                className: 'px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-300 cursor-pointer hover:bg-purple-200',
                                onClick: () => setShowPushDevicesModal(true), title: 'Appareils Push'
                            }, React.createElement('i', { className: 'fas fa-mobile-alt mr-1' }), React.createElement('span', { id: 'push-devices-badge' }, '0 apps')) : null,
                            (unreadMessagesCount > 0) ? React.createElement('div', {
                                className: "flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg hover:shadow-xl cursor-pointer bg-igp-red animate-pulse",
                                onClick: () => setShowMessaging(true), title: unreadMessagesCount + " messages"
                            }, React.createElement('i', { className: "fas fa-envelope text-white text-xs" }), React.createElement('span', { className: "text-white text-xs font-bold" }, unreadMessagesCount)) : null
                        ),
                        React.createElement('div', { className: "flex items-center gap-2 flex-1 md:flex-none justify-end" },
                            React.createElement('button', {
                                onClick: () => setShowCreateModal(true),
                                className: 'md:hidden flex-1 px-3 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold rounded-lg shadow-md flex items-center justify-center border border-blue-500/30 mx-2'
                            }, React.createElement('i', { className: 'fas fa-plus mr-2' }), 'Nouvelle Demande'),
                            React.createElement('button', {
                                className: 'md:hidden ml-0 px-3 py-2.5 bg-white text-blue-600 rounded-lg shadow-md border border-blue-100 flex-shrink-0',
                                onClick: () => setShowMobileMenu(!showMobileMenu)
                            }, React.createElement('i', { className: 'fas ' + (showMobileMenu ? 'fa-times' : 'fa-bars') + ' text-xl' }))
                        )
                    )
                ),

                // SEARCH RESULTS PORTAL
                showSearchResults && (searchKeywordResults.length > 0 || searchTextResults.length > 0) && typeof ReactDOM !== 'undefined' && ReactDOM.createPortal ? ReactDOM.createPortal(
                    React.createElement('div', {
                        className: 'search-results-portal bg-white border-2 border-gray-300 rounded-lg shadow-2xl overflow-y-auto',
                        style: { position: 'absolute', zIndex: 99999, top: (searchDropdownPosition.top + 2) + 'px', left: searchDropdownPosition.left + 'px', width: searchDropdownPosition.width + 'px', minWidth: '320px', maxHeight: '400px' },
                        onMouseDown: (e) => e.stopPropagation()
                    },
                        React.createElement('button', { onClick: (e) => { e.stopPropagation(); setShowSearchResults(false); }, className: 'sticky top-0 right-0 float-right bg-white p-2 m-2 rounded-full shadow-md' }, React.createElement('i', { className: 'fas fa-times text-sm' })),
                        searchKeywordResults.length > 0 && searchKeywordResults.map(r => React.createElement('div', { key: 'kw-'+r.id, className: 'p-3 border-b hover:bg-red-50 cursor-pointer', onClick: () => { setSelectedTicketId(r.id); setShowDetailsModal(true); setShowSearchResults(false); } }, r.title)),
                        searchTextResults.length > 0 && searchTextResults.map(r => React.createElement('div', { key: 'txt-'+r.id, className: 'p-3 border-b hover:bg-gray-50 cursor-pointer', onClick: () => { setSelectedTicketId(r.id); setShowDetailsModal(true); setShowSearchResults(false); } }, r.title))
                    ), document.body
                ) : null,

                // DESKTOP MENU ACTIONS
                React.createElement('div', { 
                    className: 'header-actions md:flex md:flex-row md:items-center md:justify-center gap-2 mt-4 transition-all duration-300 ease-in-out ' + (showMobileMenu ? 'flex flex-col p-4 mx-2 bg-white/95 rounded-2xl shadow-lg' : 'hidden')
                },
                    React.createElement('button', { onClick: () => setShowCreateModal(true), className: 'hidden md:flex px-3 py-1.5 bg-igp-blue text-white text-sm rounded-md shadow-md items-center' }, React.createElement('i', { className: 'fas fa-plus mr-2' }), 'Demande'),
                    React.createElement('button', { onClick: () => setShowMessaging(true), className: 'px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md border shadow-sm items-center flex' }, React.createElement('i', { className: 'fas fa-comments mr-2 text-blue-500' }), 'Messagerie'),
                    React.createElement('button', {
                        onClick: () => { setShowArchived(!showArchived); if(!showArchived) setTimeout(() => document.getElementById('archived-section')?.scrollIntoView({behavior:'smooth'}), 100); },
                        className: 'px-3 py-1.5 text-sm rounded-md shadow-sm flex items-center gap-2 border ' + (showArchived ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-700')
                    }, React.createElement('i', { className: 'fas fa-' + (showArchived ? 'eye-slash' : 'archive') }), showArchived ? 'Masquer' : 'Archivés'),
                    (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') ? React.createElement('button', { onClick: () => setShowMachineManagement(true), className: 'px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md border shadow-sm flex items-center' }, React.createElement('i', { className: 'fas fa-cogs mr-2 text-teal-500' }), 'Machines') : null,
                    (currentUser?.role === 'admin') ? React.createElement('button', { onClick: () => window.location.href = '/admin/roles', className: 'px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md border shadow-sm flex items-center' }, React.createElement('i', { className: 'fas fa-shield-alt mr-2 text-blue-600' }), 'Rôles') : null,
                    React.createElement('button', { onClick: onRefresh, className: 'px-3 py-1.5 bg-igp-blue text-white text-sm rounded-md shadow-md flex items-center' }, React.createElement('i', { className: 'fas fa-sync-alt mr-2' }), 'Actualiser'),
                    React.createElement('button', { onClick: onLogout, className: 'px-3 py-1.5 bg-gray-600 text-white text-sm rounded-md shadow-md flex items-center' }, React.createElement('i', { className: 'fas fa-sign-out-alt mr-2' }), 'Déconnexion')
                )
            )
        ),

        // --- KANBAN BOARD (LE COEUR DE L'APP) ---
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