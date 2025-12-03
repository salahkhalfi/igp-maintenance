const AppHeader = ({
    currentUser,
    activeTicketsCount,
    unreadMessagesCount,
    headerTitle,
    headerSubtitle,
    showMobileMenu,
    setShowMobileMenu,
    showArchived,
    setShowArchived,
    onRefresh,
    onLogout,
    onSearch,
    onOpenCreateModal,
    onOpenMessaging,
    onOpenMachineManagement,
    onOpenPerformance,
    onOpenOverdue,
    onOpenPushDevices,
    onOpenUserManagement,
    onOpenManageColumns,
    onOpenSystemSettings,
    onOpenAdminRoles,
    onOpenPlanning,
    onOpenDetails,
    activeModules = { planning: true, statistics: true, notifications: true, messaging: true, machines: true }, // Default
    hasPermission = () => false // Safety fallback
}) => {
    // Search state
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState([]);
    const [showSearchResults, setShowSearchResults] = React.useState(false);
    const [searchLoading, setSearchLoading] = React.useState(false);
    const [searchKeywordResults, setSearchKeywordResults] = React.useState([]);
    const [searchTextResults, setSearchTextResults] = React.useState([]);
    const [searchDropdownPosition, setSearchDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });
    
    const searchTimeoutRef = React.useRef(null);
    const searchInputRef = React.useRef(null);
    const [placeholderIndex, setPlaceholderIndex] = React.useState(0);

    // Push Notification Logic
    const [pushState, setPushState] = React.useState(typeof Notification !== 'undefined' ? Notification.permission : 'default');
    
    React.useEffect(() => {
        const updatePushState = () => {
            if (typeof Notification !== 'undefined') {
                setPushState(Notification.permission);
            }
        };
        window.addEventListener('push-notification-changed', updatePushState);
        return () => window.removeEventListener('push-notification-changed', updatePushState);
    }, []);

    const handlePushClick = async () => {
        if (!window.requestPushPermission) {
            alert('Système de notifications non initialisé. Rafraichissez la page.');
            return;
        }
        
        if (pushState === 'granted') {
            if(confirm('Les notifications sont déjà activées. Voulez-vous tester une notification ?')) {
                 if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'TEST_NOTIFICATION',
                        title: 'Test Notification',
                        body: 'Ceci est un test de fonctionnement.'
                    });
                 }
            }
        } else {
            await window.requestPushPermission();
        }
    };

    const isMobile = window.innerWidth < 768;
    const searchPlaceholders = isMobile ? [
        'Ex: "retard" tickets en retard', 'Ex: "urgent" tickets critiques', 
        'Ex: "commentaire" avec notes', 'Machine, lieu, ticket...'
    ] : [
        'Essayez: "retard" pour voir les tickets en retard', 'Essayez: "urgent" pour voir les priorités critiques',
        'Essayez: "commentaire" pour voir les tickets avec notes', 'Ou cherchez par machine, lieu, ticket...'
    ];

    React.useEffect(() => {
        const interval = setInterval(() => setPlaceholderIndex(prev => (prev + 1) % searchPlaceholders.length), 4000);
        return () => clearInterval(interval);
    }, [searchPlaceholders.length]);

    React.useEffect(() => {
        const updatePos = () => {
            if (searchInputRef.current && showSearchResults) {
                const rect = searchInputRef.current.getBoundingClientRect();
                setSearchDropdownPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
            }
        };
        window.addEventListener('scroll', updatePos);
        window.addEventListener('resize', updatePos);
        return () => {
            window.removeEventListener('scroll', updatePos);
            window.removeEventListener('resize', updatePos);
        };
    }, [showSearchResults]);

    // Helper to safely check permissions
    const safeHasPermission = (perm) => {
        try {
            if (typeof hasPermission !== 'function') return false;
            // Bypass for technician on critical buttons
            if (perm === 'tickets.create' && currentUser?.role === 'technician') return true;
            return hasPermission(perm);
        } catch (e) {
            console.warn('Permission check failed:', e);
            return false;
        }
    };

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        
        if (query.trim().length >= 2) {
            setSearchLoading(true);
            searchTimeoutRef.current = setTimeout(async () => {
                try {
                    const response = await fetch('/api/search?q=' + encodeURIComponent(query), { 
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') } 
                    });
                    const data = await response.json();
                    setSearchResults(data.results || []);
                    setSearchKeywordResults(data.keywordResults || []);
                    setSearchTextResults(data.textResults || []);
                    setShowSearchResults(true);
                } catch (err) { console.error('Search error:', err); } 
                finally { setSearchLoading(false); }
            }, 300);
        } else {
            setShowSearchResults(false);
            setSearchLoading(false);
        }
    };

    return React.createElement('header', { className: 'sticky top-0 z-50 bg-white/75 backdrop-blur-md shadow-sm border-b border-slate-100 transition-all duration-300' },
        React.createElement('div', { className: 'max-w-[1600px] mx-auto px-4 py-2' },
            React.createElement('div', { className: 'flex flex-col md:flex-row md:justify-between md:items-center gap-3' },
                
                // LOGO & TITLE
                React.createElement('div', { className: 'flex justify-between items-center w-full md:w-auto md:min-w-0 group' },
                    React.createElement('div', { className: 'flex items-center' },
                        React.createElement('img', {
                            src: '/api/settings/logo?t=' + Date.now(), alt: 'Logo',
                            className: 'h-8 md:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105',
                            onError: (e) => { e.target.src = '/static/logo-igp.png'; }
                        }),
                        React.createElement('div', { className: 'pl-3 flex flex-col justify-center ml-3 border-l border-black/10' },
                            React.createElement('h1', { className: 'text-sm md:text-base font-bold leading-none text-slate-800', title: headerTitle }, headerTitle),
                            React.createElement('p', { className: 'hidden md:block text-xs font-medium text-slate-500 mt-0.5' }, headerSubtitle),
                            React.createElement('div', { className: 'md:hidden flex flex-col mt-0.5' },
                                React.createElement('p', { className: 'text-[10px] font-medium text-slate-500' }, headerSubtitle),
                                React.createElement('p', { className: 'text-[10px] font-bold text-blue-700' }, '👋 ' + (currentUser?.first_name || 'User'))
                            )
                        )
                    ),
                    // Desktop Greeting
                    React.createElement('div', { className: 'hidden md:flex items-center ml-4 px-3 py-1 rounded-full bg-blue-50/50 border border-blue-100/50' },
                        React.createElement('span', { className: 'text-xs font-medium text-blue-700' }, '👋 ' + ((currentUser?.first_name) || (currentUser?.email?.split('@')[0]) || 'Utilisateur'))
                    ),
                    // Mobile Messaging Icon & Badge (Always visible IF enabled)
                    activeModules.messaging && React.createElement('div', { className: 'md:hidden flex items-center gap-2 ml-2 relative' },
                        React.createElement('button', {
                            onClick: onOpenMessaging,
                            className: 'w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100 shadow-sm active:scale-95 transition'
                        }, React.createElement('i', { className: 'fas fa-envelope' })),
                        (unreadMessagesCount > 0) && React.createElement('div', {
                            className: 'absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-red-600 rounded-full shadow-md animate-pulse pointer-events-none',
                            onClick: onOpenMessaging // Propagate click
                        }, React.createElement('span', { className: 'text-white text-[9px] font-bold' }, unreadMessagesCount))
                    )
                ),

                // SEARCH BAR
                React.createElement('div', { className: 'relative w-full md:flex-1 md:mx-4 order-3 md:order-none mt-1.5 md:mt-0 z-50' },
                    React.createElement('div', { className: 'relative flex items-center w-full' },
                        React.createElement('input', {
                            ref: searchInputRef, type: 'text', placeholder: searchPlaceholders[placeholderIndex],
                            className: 'w-full px-3 md:px-4 py-1.5 md:py-2 pr-10 border-2 border-blue-200/50 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-xs md:text-sm bg-white transition-all shadow-inner',
                            value: searchQuery,
                            onChange: handleSearchChange,
                            onFocus: () => setShowSearchResults(searchQuery.length >= 2),
                            onBlur: () => setTimeout(() => setShowSearchResults(false), 200)
                        }),
                        searchQuery && React.createElement('button', {
                            onClick: (e) => { e.stopPropagation(); setSearchQuery(''); setShowSearchResults(false); },
                            className: 'absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600',
                        }, React.createElement('i', { className: 'fas fa-times-circle' })),
                        React.createElement('i', { className: 'fas ' + (searchLoading ? 'fa-spinner fa-spin' : 'fa-search') + ' absolute right-3 top-1/2 -translate-y-1/2 text-blue-500' })
                    )
                ),

                // ACTIONS & BADGES
                React.createElement('div', { className: "flex items-center gap-2 flex-wrap justify-between w-full md:w-auto md:justify-start mt-2 md:mt-0 flex-shrink-0" },
                    React.createElement('div', { className: "flex items-center gap-2 flex-wrap" },
                        React.createElement('p', { className: "text-xs font-extrabold text-blue-800 hidden lg:block" }, activeTicketsCount + " actifs"),
                        safeHasPermission('tickets.read') && React.createElement('button', {
                            className: 'px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-300 hover:bg-orange-200',
                            onClick: onOpenOverdue, title: 'Tickets en retard'
                        }, React.createElement('i', { className: 'fas fa-clock mr-1' }), 'Retard'),
                        safeHasPermission('stats.read') && React.createElement('button', {
                            className: 'px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200',
                            onClick: onOpenPerformance, title: 'Performance'
                        }, React.createElement('i', { className: 'fas fa-users-cog mr-1' }), React.createElement('span', { id: 'technicians-count-badge' }, 'Techs')),
                        
                        // Push Subscribe Button (Visible for everyone if enabled)
                        activeModules.notifications && React.createElement('button', {
                            className: 'px-2 py-1 rounded-full text-xs font-bold border transition-all ' + 
                                (pushState === 'granted' ? 'bg-teal-100 text-teal-700 border-teal-300 hover:bg-teal-200' : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200 animate-pulse'),
                            onClick: handlePushClick, 
                            title: pushState === 'granted' ? 'Notifications activées (Cliquer pour tester)' : 'Activer les notifications'
                        }, React.createElement('i', { className: 'fas ' + (pushState === 'granted' ? 'fa-bell' : 'fa-bell-slash') + ' mr-1' }), 'Notif'),

                        // Apps / Appareils Button (Now visible for everyone to manage THEIR devices)
                        // Removed admin/permission check to allow users to see their own devices
                        activeModules.notifications && React.createElement('button', {
                            className: 'px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200',
                            onClick: onOpenPushDevices, title: 'Gérer mes appareils'
                        }, React.createElement('i', { className: 'fas fa-mobile-alt mr-1' }), React.createElement('span', { id: 'push-devices-badge' }, 'Apps')),
                        // Desktop Only Badge IF enabled
                        (activeModules.messaging && unreadMessagesCount > 0) && React.createElement('div', {
                            className: "hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg cursor-pointer bg-red-600 animate-pulse hover:bg-red-700",
                            onClick: onOpenMessaging, title: unreadMessagesCount + " messages"
                        }, React.createElement('i', { className: "fas fa-envelope text-white text-xs" }), React.createElement('span', { className: "text-white text-xs font-bold" }, unreadMessagesCount))
                    ),
                    React.createElement('div', { className: "flex items-center gap-2 flex-1 md:flex-none justify-end" },
                        
                        /* 🛑 FIX: Force-show button for technicians */
                        (safeHasPermission('tickets.create')) && React.createElement('button', {
                            onClick: onOpenCreateModal,
                            className: 'hidden md:flex px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-md items-center hover:bg-blue-700 hover:scale-105 transition-all transform mx-2'
                        }, React.createElement('i', { className: 'fas fa-plus-circle mr-2' }), 'Nouveau Ticket'),

                        safeHasPermission('tickets.create') && React.createElement('button', {
                            onClick: onOpenCreateModal,
                            className: 'md:hidden flex-1 px-3 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold rounded-lg shadow-md flex items-center justify-center border border-blue-500/30 mx-2'
                        }, React.createElement('i', { className: 'fas fa-plus mr-2' }), 'Nouvelle Demande'),
                        React.createElement('button', {
                            className: 'md:hidden ml-0 px-3 py-2.5 bg-white text-blue-600 rounded-lg shadow-md border border-blue-100 flex-shrink-0',
                            onClick: () => setShowMobileMenu(!showMobileMenu)
                        }, React.createElement('i', { className: 'fas ' + (showMobileMenu ? 'fa-times' : 'fa-bars') + ' text-xl' }))
                    )
                )
            ),

            // SEARCH PORTAL
            showSearchResults && (searchKeywordResults.length > 0 || searchTextResults.length > 0) && typeof ReactDOM !== 'undefined' && ReactDOM.createPortal(
                React.createElement('div', {
                    className: 'bg-white border-2 border-gray-300 rounded-lg shadow-2xl overflow-y-auto',
                    style: { position: 'absolute', zIndex: 99999, top: (searchDropdownPosition.top + 2) + 'px', left: searchDropdownPosition.left + 'px', width: searchDropdownPosition.width + 'px', minWidth: '320px', maxHeight: '400px' },
                    onMouseDown: (e) => e.stopPropagation()
                },
                    React.createElement('button', { onClick: (e) => { e.stopPropagation(); setShowSearchResults(false); }, className: 'sticky top-0 right-0 float-right bg-white p-2 m-2 rounded-full shadow-md' }, React.createElement('i', { className: 'fas fa-times text-sm' })),
                    searchKeywordResults.map(r => React.createElement('div', { key: 'kw-'+r.id, className: 'p-3 border-b hover:bg-red-50 cursor-pointer', onClick: () => { onOpenDetails(r.id); setShowSearchResults(false); } }, r.title)),
                    searchTextResults.map(r => React.createElement('div', { key: 'txt-'+r.id, className: 'p-3 border-b hover:bg-gray-50 cursor-pointer', onClick: () => { onOpenDetails(r.id); setShowSearchResults(false); } }, r.title))
                ), document.body
            ),

            // MOBILE MENU & DESKTOP ACTIONS
            React.createElement('div', { 
                className: 'md:flex md:flex-row md:items-center md:justify-center gap-2 mt-4 transition-all duration-300 ease-in-out ' + (showMobileMenu ? 'flex flex-col p-4 mx-2 bg-white/95 rounded-2xl shadow-lg border border-gray-100' : 'hidden')
            },
                safeHasPermission('tickets.create') && React.createElement('button', { onClick: onOpenCreateModal, className: 'hidden md:flex px-3 py-1.5 bg-blue-800 text-white text-sm rounded-md shadow-md items-center hover:bg-blue-900 transition' }, React.createElement('i', { className: 'fas fa-plus mr-2' }), 'Demande'),
                activeModules.messaging && React.createElement('button', { onClick: onOpenMessaging, className: 'px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md border shadow-sm items-center flex justify-between md:justify-start hover:bg-gray-50' }, 
                    React.createElement('div', { className: 'flex items-center' }, React.createElement('i', { className: 'fas fa-comments mr-2 text-blue-500' }), 'Messagerie'),
                    (unreadMessagesCount > 0) && React.createElement('span', { className: 'ml-2 px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full' }, unreadMessagesCount)
                ),
                React.createElement('button', {
                    onClick: () => { setShowArchived(!showArchived); if(!showArchived) setTimeout(() => document.getElementById('archived-section')?.scrollIntoView({behavior:'smooth'}), 100); },
                    className: 'px-3 py-1.5 text-sm rounded-md shadow-sm flex items-center gap-2 border ' + (showArchived ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-700 hover:bg-gray-50')
                }, React.createElement('i', { className: 'fas fa-' + (showArchived ? 'eye-slash' : 'archive') }), showArchived ? 'Masquer' : 'Archivés'),
                safeHasPermission('users.read') && React.createElement('button', { onClick: onOpenUserManagement, className: 'px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md border shadow-sm flex items-center hover:bg-gray-50' }, React.createElement('i', { className: 'fas fa-users mr-2 text-indigo-600' }), currentUser?.role === 'technician' ? 'Équipe' : 'Utilisateurs'),
                safeHasPermission('machines.read') && activeModules.machines && React.createElement('button', { onClick: onOpenMachineManagement, className: 'px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md border shadow-sm flex items-center hover:bg-gray-50' }, React.createElement('i', { className: 'fas fa-cogs mr-2 text-teal-500' }), 'Machines'),
                safeHasPermission('settings.manage') && React.createElement('button', { onClick: onOpenManageColumns, className: 'px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md border shadow-sm flex items-center hover:bg-gray-50' }, React.createElement('i', { className: 'fas fa-columns mr-2 text-gray-500' }), 'Colonnes'),
                safeHasPermission('planning.read') && activeModules.planning && React.createElement('button', { onClick: onOpenPlanning, className: 'px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md border shadow-sm flex items-center hover:bg-gray-50' }, React.createElement('i', { className: 'fas fa-calendar-alt mr-2 text-blue-500' }), 'Planning'),
                safeHasPermission('settings.manage') && React.createElement('button', { onClick: onOpenSystemSettings, className: 'px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md border shadow-sm flex items-center hover:bg-gray-50' }, React.createElement('i', { className: 'fas fa-cog mr-2 text-gray-600' }), 'Paramètres'),
                safeHasPermission('roles.read') && React.createElement('button', { onClick: onOpenAdminRoles, className: 'px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md border shadow-sm flex items-center hover:bg-gray-50' }, React.createElement('i', { className: 'fas fa-shield-alt mr-2 text-blue-600' }), 'Rôles'),
                React.createElement('button', { onClick: onRefresh, className: 'px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md shadow-md flex items-center hover:bg-blue-700 transition' }, React.createElement('i', { className: 'fas fa-sync-alt mr-2' }), 'Actualiser'),
                React.createElement('button', { onClick: onLogout, className: 'px-3 py-1.5 bg-gray-600 text-white text-sm rounded-md shadow-md flex items-center hover:bg-gray-700 transition' }, React.createElement('i', { className: 'fas fa-sign-out-alt mr-2' }), 'Déconnexion')
            )
        )
    );
};
