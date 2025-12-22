const AppHeader = ({
    currentUser: propUser,
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
    onOpenTv,
    onOpenAIChat,
    onOpenPlanning,
    onOpenDetails,
    activeModules = { planning: true, statistics: true, notifications: true, messaging: true, machines: true }, // Default
    hasPermission = () => false // Safety fallback
}) => {
    // PARACHUTE FIX: Fallback to cache if currentUser is missing (Offline/Refresh fix)
    const currentUser = React.useMemo(() => {
        if (propUser) return propUser;
        try { return JSON.parse(localStorage.getItem('user_cache') || '{}'); } catch(e) { return {}; }
    }, [propUser]);

    // Search state
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState([]);
    const [showSearchResults, setShowSearchResults] = React.useState(false);
    const [searchLoading, setSearchLoading] = React.useState(false);
    const [searchKeywordResults, setSearchKeywordResults] = React.useState([]);
    const [searchTextResults, setSearchTextResults] = React.useState([]);
    const [searchDropdownPosition, setSearchDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });
    // Smart List: Keep results open when not focused if user is interacting with list
    const [viewingList, setViewingList] = React.useState(false);
    // History State
    const [searchHistory, setSearchHistory] = React.useState(() => {
        if (typeof localStorage === 'undefined') return [];
        try { return JSON.parse(localStorage.getItem('search_history') || '[]'); } catch { return []; }
    });

    const addToHistory = (term) => {
        if (!term || term.trim().length < 2) return;
        const cleanTerm = term.trim();
        setSearchHistory(prev => {
            const newHistory = [cleanTerm, ...prev.filter(h => h !== cleanTerm)].slice(0, 5);
            localStorage.setItem('search_history', JSON.stringify(newHistory));
            return newHistory;
        });
    };
    
    const searchTimeoutRef = React.useRef(null);
    const searchInputRef = React.useRef(null);
    const [placeholderIndex, setPlaceholderIndex] = React.useState(0);

    // Push Notification Logic
    const [pushState, setPushState] = React.useState(typeof Notification !== 'undefined' ? Notification.permission : 'default');
    const [isSubscribed, setIsSubscribed] = React.useState(false); // UI Truthfulness: Actually subscribed on server?

    // Stable logo URL to prevent cache flooding and re-render flickering
    // Only updates on full page refresh or explicit update
    const [logoTimestamp] = React.useState(Date.now());
    const logoUrl = '/api/settings/logo?t=' + logoTimestamp;
    
    // Custom Messenger Name (Default to 'Connect' but can be overridden)
    // IMPORTANT: Defaults to 'Connect' for generic use, but user can set to 'IGP Connect' via settings
    const [messengerName, setMessengerName] = React.useState('Connect');

    React.useEffect(() => {
        try {
            fetch('/api/settings/messenger_app_name')
                .then(res => res.json())
                .then(data => {
                    if (data && data.setting_value) {
                        setMessengerName(data.setting_value);
                    } else {
                        // Fallback if not set? We stick to 'Connect' as per code default
                        // But if we wanted to be super friendly to existing users we could check other things
                    }
                })
                .catch(err => console.warn('Failed to load messenger name', err));
        } catch (e) {
            console.warn('Error fetching settings', e);
        }
    }, []);
    
    React.useEffect(() => {
        const updatePushState = async () => {
            if (typeof Notification !== 'undefined') {
                setPushState(Notification.permission);
            }
            if (window.isPushSubscribed) {
                const sub = await window.isPushSubscribed();
                setIsSubscribed(sub);
            }
        };
        
        // Initial check
        updatePushState();

        // RETRY LOGIC: Check again after SW wakes up (Race condition fix)
        setTimeout(updatePushState, 1000);
        setTimeout(updatePushState, 3000);

        window.addEventListener('push-notification-changed', updatePushState);
        return () => window.removeEventListener('push-notification-changed', updatePushState);
    }, []);

    const handlePushClick = async () => {
        if (!window.requestPushPermission) {
            alert('Système de notifications non initialisé. Rafraichissez la page.');
            return;
        }
        
        // Case: Fully Active
        if (pushState === 'granted' && isSubscribed) {
            if(confirm('Les notifications sont déjà activées. Voulez-vous tester une notification ?')) {
                 if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'TEST_NOTIFICATION',
                        title: 'Test Notification',
                        body: 'Ceci est un test de fonctionnement.'
                    });
                 }
            }
            return;
        }

        // Case: Permission Granted but Not Subscribed (Broken/Desync)
        if (pushState === 'granted' && !isSubscribed) {
             if(confirm('Permission accordée mais abonnement inactif. Réactiver ?')) {
                 await window.subscribeToPush();
                 // Update state check
                 if (window.isPushSubscribed) {
                     const sub = await window.isPushSubscribed();
                     setIsSubscribed(sub);
                     if(sub) alert("✅ Notifications réactivées !");
                 }
             }
             return;
        }

        // Case: Not Granted
        await window.requestPushPermission();
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
        if (showMobileMenu) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showMobileMenu]);

    // Handle resize to prevent layout glitches
    React.useEffect(() => {
        const handleResize = () => {
            // Close mobile menu on desktop to prevent layout glitches
            if (window.innerWidth >= 768 && showMobileMenu) {
                setShowMobileMenu(false);
            }
            // Close search results on resize to prevent positioning errors
            if (showSearchResults && !viewingList) {
                setShowSearchResults(false);
            }
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [showMobileMenu, showSearchResults, viewingList]);

    React.useEffect(() => {
        const updatePos = () => {
            if (searchInputRef.current && (showSearchResults || viewingList)) {
                const rect = searchInputRef.current.getBoundingClientRect();
                setSearchDropdownPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
            }
        };
        window.addEventListener('scroll', updatePos);
        // Removed resize listener here to avoid conflicts, handled by handleResize above
        return () => {
            window.removeEventListener('scroll', updatePos);
        };
    }, [showSearchResults, viewingList]);

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
                    setViewingList(true); // Auto-keep open if results found
                } catch (err) { console.error('Search error:', err); } 
                finally { setSearchLoading(false); }
            }, 300);
        } else {
            setShowSearchResults(false);
            setSearchLoading(false);
            setViewingList(false);
        }
    };

    const isSupervisor = (currentUser && currentUser.role === 'supervisor');
    const isAdmin = (currentUser && currentUser.role === 'admin');
    const canViewStats = isAdmin || isSupervisor;

    return React.createElement('header', { className: 'sticky top-0 z-50 bg-transparent transition-all duration-300' },
        
        // --- ROW 1: IDENTITY & NAVIGATION ---
        React.createElement('div', { className: 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-100' },
            React.createElement('div', { className: 'max-w-[1600px] mx-auto px-3 md:px-4 py-2' },
                React.createElement('div', { className: 'flex justify-between items-center h-12 md:h-12' },
                    
                    // LEFT: LOGO & TITLE
                    React.createElement('div', { className: 'flex items-center group cursor-pointer flex-1 min-w-0', onClick: () => window.location.reload() },
                        React.createElement('img', {
                            src: logoUrl, alt: 'Logo',
                            className: 'h-9 md:h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105 shrink-0',
                            onError: (e) => { 
                                if (e.target.src.includes('logo.png')) return;
                                e.target.src = '/logo.png'; 
                            }
                        }),
                        // Mobile: Compact title
                        React.createElement('div', { className: 'md:hidden flex flex-col justify-center ml-2 pl-2 border-l border-slate-200 flex-1 min-w-0' },
                            React.createElement('h1', { className: 'text-[11px] font-bold leading-tight text-slate-800 tracking-tight line-clamp-2', title: headerTitle }, headerTitle),
                            React.createElement('p', { className: 'text-[9px] font-medium text-slate-400 truncate hidden' }, headerSubtitle)
                        ),
                        // Desktop: Full title
                        React.createElement('div', { className: 'hidden md:flex flex-col justify-center ml-3 pl-3 border-l border-slate-200 flex-1 min-w-0' },
                            React.createElement('h1', { className: 'text-sm font-bold leading-none text-slate-800 tracking-tight truncate', title: headerTitle }, headerTitle),
                            React.createElement('p', { className: 'text-[10px] font-medium text-slate-500 mt-0.5 truncate' }, headerSubtitle)
                        )
                    ),

                    // RIGHT: USER & MOBILE TOGGLE
                    React.createElement('div', { className: 'flex items-center gap-1.5 md:gap-3 shrink-0 ml-2' },

                        // Mobile: Compact user badge with initial
                        React.createElement('div', { className: 'md:hidden flex items-center gap-2' },
                            React.createElement('div', { className: 'flex flex-col items-end' },
                                React.createElement('span', { className: 'text-[9px] text-slate-400 font-medium leading-none' }, 'Bonjour,'),
                                React.createElement('span', { className: 'text-[11px] font-bold text-slate-700 leading-tight truncate max-w-[70px]' }, (currentUser?.first_name || 'Vous'))
                            )
                        ),
                        
                        // User Badge (Desktop) - STATIC (No click)
                        React.createElement('div', { className: 'hidden md:flex items-center px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 cursor-default' },
                            React.createElement('div', { className: 'w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold mr-2' },
                                (currentUser?.first_name?.[0] || 'U')
                            ),
                            React.createElement('span', { className: 'text-xs font-medium text-slate-700' }, 
                                "Bonjour, " + (currentUser?.first_name || 'Utilisateur')
                            ),
                            (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') && React.createElement('span', { className: 'ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-slate-200 text-slate-600 rounded uppercase tracking-wide' }, 
                                currentUser?.role === 'supervisor' ? 'SUP' : 'ADM'
                            )
                        ),

                        // Push Notif Bell (Desktop)
                        activeModules.notifications && React.createElement('button', {
                            className: 'hidden md:flex w-8 h-8 items-center justify-center rounded-full transition-all ' + 
                                (pushState === 'granted' && isSubscribed ? 'text-teal-600 hover:bg-teal-50' : 'text-slate-400 hover:text-slate-600'),
                            onClick: handlePushClick, 
                            title: 'Connecter cet appareil aux notifications'
                        }, React.createElement('i', { className: 'fas ' + (pushState === 'granted' && isSubscribed ? 'fa-bell' : 'fa-bell-slash') })),

                        // Apps Button (Desktop)
                        (isAdmin) && React.createElement('button', {
                            className: 'hidden md:flex w-8 h-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50 hover:text-purple-600 transition-all',
                            onClick: onOpenPushDevices, title: 'Gérer les appareils connectés'
                        }, React.createElement('i', { className: 'fas fa-mobile-alt' })),

                        // Expert AI Button (Desktop)
                        React.createElement('button', {
                            className: 'hidden md:flex w-8 h-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50 hover:text-purple-600 transition-all',
                            onClick: onOpenAIChat, title: 'Expert Industriel (IA)'
                        }, React.createElement('i', { className: 'fas fa-robot' })),

                        // --- RESTORED DESKTOP BUTTONS ---

                        // IGP Connect / Messenger (Desktop - Top Row) - NEW GREEN ROCKET
                        React.createElement('button', {
                            className: 'hidden md:flex w-8 h-8 items-center justify-center rounded-full text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all relative',
                            onClick: () => window.open('/messenger', '_blank'), 
                            title: (messengerName || 'Connect') + ' (Nouvelle Messagerie)'
                        }, 
                            React.createElement('i', { className: 'fas fa-rocket' }),
                            React.createElement('span', { className: 'absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-white' })
                        ),
                        
                        // User Management (Desktop)
                        (safeHasPermission('users.read') || currentUser?.role === 'technician') && React.createElement('button', {
                             className: 'hidden md:flex w-8 h-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all',
                             onClick: onOpenUserManagement, title: 'Gérer les utilisateurs et équipes'
                        }, React.createElement('i', { className: 'fas fa-users' })),

                        // Role Management (Desktop)
                        (isAdmin) && safeHasPermission('roles.read') && React.createElement('button', {
                            className: 'hidden md:flex w-8 h-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-all',
                            onClick: onOpenAdminRoles, title: 'Configurer les rôles et permissions'
                       }, React.createElement('i', { className: 'fas fa-shield-alt' })),

                        // Machines (Desktop)
                        safeHasPermission('machines.read') && activeModules.machines && React.createElement('button', {
                             className: 'hidden md:flex w-8 h-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50 hover:text-teal-600 transition-all',
                             onClick: onOpenMachineManagement, title: 'Gérer le parc machines'
                        }, React.createElement('i', { className: 'fas fa-cogs' })),

                        // Settings (Desktop) - CRITICAL REQUEST
                        (isAdmin) && safeHasPermission('settings.manage') && React.createElement('button', {
                             className: 'hidden md:flex w-8 h-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50 hover:text-gray-700 transition-all',
                             onClick: onOpenSystemSettings, title: 'Paramètres généraux du système'
                        }, React.createElement('i', { className: 'fas fa-cog' })),

                        // TV Mode (Desktop)
                        (isAdmin) && safeHasPermission('settings.manage') && React.createElement('button', {
                             className: 'hidden md:flex w-8 h-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50 hover:text-purple-600 transition-all',
                             onClick: onOpenTv, title: 'Passer en mode affichage TV'
                        }, React.createElement('i', { className: 'fas fa-tv' })),

                        // MAIN MENU TOGGLE (Premium design)
                        React.createElement('button', {
                            className: 'w-10 h-10 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 text-white hover:from-slate-600 hover:to-slate-700 shadow-lg shadow-slate-400/30 active:scale-95 transition-all ml-1 md:ml-2',
                            onClick: () => setShowMobileMenu(!showMobileMenu),
                            title: 'Ouvrir le menu complet'
                        }, React.createElement('i', { className: 'fas ' + (showMobileMenu ? 'fa-times' : 'fa-bars') + ' text-base' }))
                    )
                )
            )
        ),

        // --- ROW 2: CONTROL BAR (Action Toolbar) ---
        // Hidden on mobile (kept simple), Visible on Desktop
        React.createElement('div', { className: 'hidden md:block bg-white/80 border-b border-slate-200/60 shadow-sm' },
            React.createElement('div', { className: 'max-w-[1600px] mx-auto px-4 py-3' },
                React.createElement('div', { className: 'flex items-center gap-4' },
                    
                    // SEARCH BAR (Expanded)
                    React.createElement('div', { className: 'relative flex-1 max-w-3xl z-40' },
                        React.createElement('div', { className: 'relative group' },
                            React.createElement('i', { className: 'fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors' }),
                            React.createElement('input', {
                                ref: searchInputRef, 
                                type: 'text', 
                                placeholder: searchPlaceholders[placeholderIndex],
                                className: 'w-full h-11 pl-11 pr-12 bg-white border border-slate-200 rounded-xl shadow-sm text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none',
                                value: searchQuery,
                                onChange: handleSearchChange,
                                onFocus: () => { setShowSearchResults(searchQuery.length >= 2); setViewingList(true); },
                                onBlur: () => setTimeout(() => { if(!viewingList) setShowSearchResults(false); }, 200),
                                onKeyDown: (e) => {
                                    if (e.key === 'Enter' && searchQuery.length >= 2) {
                                        addToHistory(searchQuery);
                                        setShowSearchResults(false);
                                        setViewingList(false);
                                        searchInputRef.current?.blur();
                                    }
                                }
                            }),
                            // Clear Button
                            (searchQuery) && React.createElement('button', {
                                onClick: () => { setSearchQuery(''); setViewingList(false); setShowSearchResults(false); searchInputRef.current?.focus(); },
                                className: 'absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 p-1',
                                title: 'Effacer la recherche'
                            }, React.createElement('i', { className: 'fas fa-times-circle' })),
                            
                            // Spinner
                            searchLoading && React.createElement('i', { className: 'fas fa-spinner fa-spin absolute right-3 top-1/2 -translate-y-1/2 text-blue-500' }),
                            
                            // Chevron
                            (!searchQuery && !searchLoading) && React.createElement('button', {
                                onClick: () => { setViewingList(!viewingList); setShowSearchResults(!showSearchResults); },
                                className: 'absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500 p-1',
                                title: 'Afficher les filtres rapides et l\'historique'
                            }, React.createElement('i', { className: 'fas fa-chevron-down text-xs' }))
                        )
                    ),

                    // QUICK FILTERS (Desktop)
                    React.createElement('div', { className: 'flex items-center gap-2 border-l border-slate-200 pl-4 mr-auto' },
                        React.createElement('button', {
                            onClick: onOpenOverdue,
                            className: 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-orange-50 hover:text-orange-700 transition-colors',
                            title: 'Voir uniquement les tickets en retard'
                        }, React.createElement('i', { className: 'fas fa-clock text-orange-500' }), 'Retard'),
                        
                        (canViewStats) && React.createElement('button', {
                            onClick: onOpenPerformance,
                            className: 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors',
                            title: 'Afficher les statistiques de performance'
                        }, React.createElement('i', { className: 'fas fa-chart-line text-blue-500' }), 'Performance'),

                        (isAdmin) && React.createElement('button', {
                            onClick: onOpenManageColumns,
                            className: 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors',
                            title: 'Configurer l\'affichage des colonnes Kanban'
                        }, React.createElement('i', { className: 'fas fa-columns text-slate-400' }), 'Vues'),

                        safeHasPermission('planning.read') && activeModules.planning && React.createElement('button', {
                            onClick: onOpenPlanning,
                            className: 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors',
                            title: 'Consulter le planning de production'
                        }, React.createElement('i', { className: 'fas fa-calendar-alt text-indigo-500' }), 'Planning')
                    ),

                    // PRIMARY ACTIONS (Right aligned)
                    React.createElement('div', { className: 'flex items-center gap-3' },
                        
                        // Active Tickets Count (Desktop Toolbar)
                        React.createElement('span', { 
                            className: 'hidden xl:inline-block text-xs font-extrabold text-blue-800 mr-2 bg-blue-50 px-2 py-1 rounded-md',
                            title: 'Nombre total de tickets en cours de traitement'
                        }, 
                            activeTicketsCount + " actifs"
                        ),

                        // Refresh
                        React.createElement('button', {
                            onClick: onRefresh,
                            className: 'w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:bg-white hover:text-blue-600 hover:shadow-md hover:-translate-y-0.5 transition-all',
                            title: 'Actualiser les données maintenant'
                        }, React.createElement('i', { className: 'fas fa-sync-alt' })),

                        // NEW TICKET (The Big Button)
                        safeHasPermission('tickets.create') && React.createElement('button', {
                            onClick: onOpenCreateModal,
                            className: 'flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all',
                            title: 'Créer un nouveau ticket de maintenance ou scanner un QR code'
                        }, 
                            React.createElement('i', { className: 'fas fa-plus-circle text-lg' }),
                            React.createElement('span', {}, 'Nouveau Ticket')
                        )
                    )
                )
            )
        ),

        // --- MOBILE HEADER ROW (Action Bar) ---
        // Visible only on mobile to restore quick access
        React.createElement('div', { className: 'md:hidden px-4 py-2 bg-white border-b border-slate-100 flex items-center gap-2' },
            // Search Bar
            React.createElement('div', { className: 'relative flex-1' },
                React.createElement('i', { className: 'fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' }),
                React.createElement('input', {
                    ref: isMobile ? searchInputRef : null,
                    type: 'text',
                    placeholder: 'Rechercher...',
                    className: 'w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500',
                    value: searchQuery,
                    onChange: handleSearchChange,
                    onFocus: () => { setShowSearchResults(true); setViewingList(true); }
                })
            ),
            // Mobile Quick Actions
            
            // 1. EXPERT AI (ROBOT) - NEW
            React.createElement('button', {
                onClick: onOpenAIChat,
                className: 'w-10 h-10 flex items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-100 shadow-sm active:scale-95 shrink-0',
                title: 'Expert Industriel'
            }, React.createElement('i', { className: 'fas fa-robot' })),

            // 2. CONNECT (ROCKET) - NEW
            React.createElement('button', {
                onClick: () => window.open('/messenger', '_blank'),
                className: 'w-10 h-10 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm active:scale-95 relative shrink-0',
                title: messengerName
            }, 
                React.createElement('i', { className: 'fas fa-rocket' }),
                React.createElement('span', { className: 'absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border border-white' })
            ),

            // 4. NEW TICKET (+)
            safeHasPermission('tickets.create') && React.createElement('button', {
                onClick: onOpenCreateModal,
                className: 'w-10 h-10 flex items-center justify-center rounded-lg bg-blue-600 text-white shadow-md active:scale-95',
                title: 'Nouveau Ticket'
            }, React.createElement('i', { className: 'fas fa-plus' }))
        ),

            // SEARCH PORTAL
            (showSearchResults || viewingList) && (searchKeywordResults.length > 0 || searchTextResults.length > 0 || (!searchQuery && viewingList)) && typeof ReactDOM !== 'undefined' && ReactDOM.createPortal(
                React.createElement('div', {
                    className: 'bg-white border-2 border-gray-300 rounded-lg shadow-2xl overflow-y-auto',
                    style: { position: 'absolute', zIndex: 99999, top: (searchDropdownPosition.top + 2) + 'px', left: searchDropdownPosition.left + 'px', width: searchDropdownPosition.width + 'px', minWidth: '320px', maxHeight: '400px' },
                    onMouseDown: (e) => e.stopPropagation(),
                    onTouchStart: () => {
                        // Zero Friction: Touch list closes keyboard
                        if (document.activeElement === searchInputRef.current) {
                            searchInputRef.current?.blur();
                        }
                    }
                },
                    React.createElement('div', { className: 'sticky top-0 right-0 float-right bg-white p-2 m-2 rounded-full shadow-md z-10' }, 
                        React.createElement('button', { onClick: (e) => { e.stopPropagation(); setShowSearchResults(false); setViewingList(false); } }, React.createElement('i', { className: 'fas fa-times text-sm' }))
                    ),
                    searchKeywordResults.map(r => React.createElement('div', { key: 'kw-'+r.id, className: 'p-3 border-b hover:bg-red-50 cursor-pointer', onClick: () => { addToHistory(searchQuery); onOpenDetails(r.id); setShowSearchResults(false); setViewingList(false); } }, r.title)),
                    searchTextResults.map(r => React.createElement('div', { key: 'txt-'+r.id, className: 'p-3 border-b hover:bg-gray-50 cursor-pointer', onClick: () => { addToHistory(searchQuery); onOpenDetails(r.id); setShowSearchResults(false); setViewingList(false); } }, r.title)),
                    
                    // Empty State: History & Suggestions
                    (!searchQuery && viewingList) && React.createElement('div', { className: 'p-2' },
                        // History Section
                        React.createElement('div', { className: 'mb-3' },
                            React.createElement('div', { className: 'px-2 py-1 text-xs font-bold text-gray-400 uppercase tracking-widest flex justify-between items-center' }, 
                                'Récents',
                                searchHistory.length > 0 && React.createElement('button', { 
                                    onClick: (e) => { e.stopPropagation(); setSearchHistory([]); localStorage.removeItem('search_history'); },
                                    className: 'text-[10px] text-red-400 hover:text-red-600'
                                }, 'Effacer')
                            ),
                            searchHistory.length === 0 
                                ? React.createElement('div', { className: 'px-3 py-2 text-xs text-gray-400 italic' }, 'Vos dernières recherches apparaîtront ici...')
                                : searchHistory.map(term => React.createElement('div', {
                                    key: term,
                                    onClick: () => { setSearchQuery(term); handleSearchChange({target: {value: term}}); },
                                    className: 'flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer group text-gray-600 hover:text-blue-600'
                                }, 
                                    React.createElement('i', { className: 'fas fa-history text-gray-300 group-hover:text-blue-400' }),
                                    React.createElement('span', { className: 'font-medium' }, term)
                                ))
                        ),
                        // Quick Filters
                        React.createElement('div', {},
                            React.createElement('div', { className: 'px-2 py-1 text-xs font-bold text-gray-400 uppercase tracking-widest' }, 'Filtres Rapides'),
                            React.createElement('div', { className: 'grid grid-cols-2 gap-2 mt-1' },
                                React.createElement('button', {
                                    onClick: () => { setSearchQuery('urgent'); handleSearchChange({target: {value: 'urgent'}}); },
                                    className: 'flex items-center justify-center gap-2 p-2 bg-red-50 text-red-600 rounded-lg border border-red-100 hover:bg-red-100 transition'
                                }, React.createElement('i', { className: 'fas fa-fire' }), 'Urgent'),
                                React.createElement('button', {
                                    onClick: () => { setSearchQuery('retard'); handleSearchChange({target: {value: 'retard'}}); },
                                    className: 'flex items-center justify-center gap-2 p-2 bg-orange-50 text-orange-600 rounded-lg border border-orange-100 hover:bg-orange-100 transition'
                                }, React.createElement('i', { className: 'fas fa-clock' }), 'Retard'),
                                React.createElement('button', {
                                    onClick: () => { setSearchQuery('panne'); handleSearchChange({target: {value: 'panne'}}); },
                                    className: 'flex items-center justify-center gap-2 p-2 bg-gray-50 text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-100 transition'
                                }, React.createElement('i', { className: 'fas fa-tools' }), 'Panne'),
                                React.createElement('button', {
                                    onClick: () => { setSearchQuery('maintenance'); handleSearchChange({target: {value: 'maintenance'}}); },
                                    className: 'flex items-center justify-center gap-2 p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 hover:bg-blue-100 transition'
                                }, React.createElement('i', { className: 'fas fa-wrench' }), 'Maint.')
                            )
                        )
                    )
                ), document.body
            ),

            // MOBILE MENU PORTAL (Premium Design)
            showMobileMenu && typeof ReactDOM !== 'undefined' && ReactDOM.createPortal(
                React.createElement('div', { 
                    className: 'fixed inset-0 z-[9999]',
                    onClick: () => setShowMobileMenu(false)
                },
                    // Premium Overlay with gradient
                    React.createElement('div', { 
                        className: 'absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/50 to-slate-900/60 backdrop-blur-md'
                    }),
                    
                    // Premium Drawer Panel
                    React.createElement('div', { 
                        className: 'absolute top-0 right-0 h-full w-[88%] max-w-[340px] bg-gradient-to-b from-slate-50 to-white flex flex-col overflow-hidden shadow-[-8px_0_30px_-5px_rgba(0,0,0,0.3)]',
                        onClick: (e) => e.stopPropagation()
                    },
                        
                        // === HEADER SECTION ===
                        React.createElement('div', { 
                            className: 'relative px-5 pt-5 pb-4 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800'
                        },
                            // Close button
                            React.createElement('button', {
                                onClick: () => setShowMobileMenu(false),
                                className: 'absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all'
                            }, React.createElement('i', { className: 'fas fa-times text-sm' })),
                            
                            // User Profile Card
                            React.createElement('div', { className: 'flex items-center gap-3' },
                                React.createElement('div', { 
                                    className: 'w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-500/30'
                                }, (currentUser?.first_name?.[0] || 'U')),
                                React.createElement('div', { className: 'flex-1 min-w-0' },
                                    React.createElement('h3', { className: 'text-white font-bold text-base truncate' }, 
                                        currentUser?.first_name || 'Utilisateur'
                                    ),
                                    React.createElement('p', { className: 'text-slate-400 text-xs truncate' }, 
                                        currentUser?.email || ''
                                    )
                                )
                            ),
                            // Role Badge
                            (currentUser?.role) && React.createElement('div', { 
                                className: 'mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ' +
                                    (currentUser?.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : 
                                     currentUser?.role === 'supervisor' ? 'bg-blue-500/20 text-blue-300' : 
                                     'bg-slate-500/20 text-slate-300')
                            }, 
                                React.createElement('i', { className: 'fas fa-shield-alt text-[8px]' }),
                                currentUser?.role === 'admin' ? 'Administrateur' : 
                                currentUser?.role === 'supervisor' ? 'Superviseur' : 
                                currentUser?.role === 'technician' ? 'Technicien' : 'Opérateur'
                            )
                        ),

                        // === SCROLLABLE CONTENT ===
                        React.createElement('div', { 
                            className: 'flex-1 overflow-y-auto px-4 py-4',
                            style: { WebkitOverflowScrolling: 'touch' }
                        },
                            
                            // --- QUICK ACTIONS SECTION ---
                            React.createElement('div', { className: 'mb-5' },
                                React.createElement('p', { className: 'text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1' }, 'Actions rapides'),
                                React.createElement('div', { className: 'bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden' },
                                    // Tickets en Retard
                                    React.createElement('button', {
                                        onClick: () => { onOpenOverdue(); setShowMobileMenu(false); },
                                        className: 'w-full flex items-center gap-3 px-4 py-3.5 hover:bg-orange-50/50 transition-colors border-b border-slate-100'
                                    },
                                        React.createElement('div', { className: 'w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-md shadow-orange-500/20' },
                                            React.createElement('i', { className: 'fas fa-clock text-white text-sm' })
                                        ),
                                        React.createElement('span', { className: 'flex-1 text-left text-sm font-semibold text-slate-700' }, 'Tickets en Retard')
                                    ),
                                    // Performance
                                    (canViewStats) && React.createElement('button', {
                                        onClick: () => { onOpenPerformance(); setShowMobileMenu(false); },
                                        className: 'w-full flex items-center gap-3 px-4 py-3.5 hover:bg-blue-50/50 transition-colors border-b border-slate-100'
                                    },
                                        React.createElement('div', { className: 'w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20' },
                                            React.createElement('i', { className: 'fas fa-chart-line text-white text-sm' })
                                        ),
                                        React.createElement('span', { className: 'flex-1 text-left text-sm font-semibold text-slate-700' }, 'Statistiques Performance')
                                    ),
                                    // Push Notifications
                                    React.createElement('button', {
                                        onClick: () => { handlePushClick(); },
                                        className: 'w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100'
                                    },
                                        React.createElement('div', { className: 'w-9 h-9 rounded-xl flex items-center justify-center shadow-md ' + 
                                            (pushState === 'granted' && isSubscribed ? 'bg-gradient-to-br from-teal-400 to-emerald-500 shadow-teal-500/20' : 'bg-gradient-to-br from-slate-300 to-slate-400 shadow-slate-400/20')
                                        },
                                            React.createElement('i', { className: 'fas fa-bell text-white text-sm' })
                                        ),
                                        React.createElement('span', { className: 'flex-1 text-left text-sm font-semibold text-slate-700' }, 'Notifications Push'),
                                        React.createElement('span', { 
                                            className: 'px-2 py-0.5 rounded-md text-[10px] font-bold ' + 
                                            (pushState === 'granted' && isSubscribed ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500')
                                        }, pushState === 'granted' && isSubscribed ? 'ON' : 'OFF')
                                    ),
                                    // Manage devices (admin)
                                    (isAdmin) && React.createElement('button', {
                                        onClick: () => { onOpenPushDevices(); setShowMobileMenu(false); },
                                        className: 'w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100'
                                    },
                                        React.createElement('div', { className: 'w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-md shadow-violet-500/20' },
                                            React.createElement('i', { className: 'fas fa-mobile-alt text-white text-sm' })
                                        ),
                                        React.createElement('span', { className: 'flex-1 text-left text-sm font-semibold text-slate-700' }, 'Gérer mes appareils')
                                    ),
                                    // AI Expert
                                    React.createElement('button', {
                                        onClick: () => { onOpenAIChat(); setShowMobileMenu(false); },
                                        className: 'w-full flex items-center gap-3 px-4 py-3.5 hover:bg-purple-50/50 transition-colors border-b border-slate-100'
                                    },
                                        React.createElement('div', { className: 'w-9 h-9 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-md shadow-purple-500/20' },
                                            React.createElement('i', { className: 'fas fa-robot text-white text-sm' })
                                        ),
                                        React.createElement('span', { className: 'flex-1 text-left text-sm font-semibold text-slate-700' }, 'Expert Industriel (IA)')
                                    ),
                                    // Archive toggle
                                    React.createElement('button', {
                                        onClick: () => { setShowArchived(!showArchived); setShowMobileMenu(false); },
                                        className: 'w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors'
                                    },
                                        React.createElement('div', { className: 'w-9 h-9 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center shadow-md shadow-slate-400/20' },
                                            React.createElement('i', { className: 'fas fa-archive text-white text-sm' })
                                        ),
                                        React.createElement('span', { className: 'flex-1 text-left text-sm font-semibold text-slate-700' }, 'Voir les tickets archivés')
                                    )
                                )
                            ),

                            // --- MANAGEMENT SECTION ---
                            React.createElement('div', { className: 'mb-5' },
                                React.createElement('p', { className: 'text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1' }, 'Gestion'),
                                React.createElement('div', { className: 'bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden' },
                                    // Users
                                    (safeHasPermission('users.read') || currentUser?.role === 'technician') && React.createElement('button', {
                                        onClick: () => { onOpenUserManagement(); setShowMobileMenu(false); },
                                        className: 'w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100'
                                    },
                                        React.createElement('div', { className: 'w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center shadow-md shadow-indigo-500/20' },
                                            React.createElement('i', { className: 'fas fa-users text-white text-sm' })
                                        ),
                                        React.createElement('span', { className: 'flex-1 text-left text-sm font-semibold text-slate-700' }, 'Gestion Utilisateurs')
                                    ),
                                    // Machines
                                    safeHasPermission('machines.read') && activeModules.machines && React.createElement('button', {
                                        onClick: () => { onOpenMachineManagement(); setShowMobileMenu(false); },
                                        className: 'w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100'
                                    },
                                        React.createElement('div', { className: 'w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-md shadow-teal-500/20' },
                                            React.createElement('i', { className: 'fas fa-cogs text-white text-sm' })
                                        ),
                                        React.createElement('span', { className: 'flex-1 text-left text-sm font-semibold text-slate-700' }, 'Gestion Machines')
                                    ),
                                    // Kanban columns
                                    (isAdmin) && safeHasPermission('settings.manage') && React.createElement('button', {
                                        onClick: () => { onOpenManageColumns(); setShowMobileMenu(false); },
                                        className: 'w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100'
                                    },
                                        React.createElement('div', { className: 'w-9 h-9 rounded-xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center shadow-md shadow-slate-500/20' },
                                            React.createElement('i', { className: 'fas fa-columns text-white text-sm' })
                                        ),
                                        React.createElement('span', { className: 'flex-1 text-left text-sm font-semibold text-slate-700' }, 'Colonnes Kanban')
                                    ),
                                    // Planning
                                    safeHasPermission('planning.read') && activeModules.planning && React.createElement('button', {
                                        onClick: () => { onOpenPlanning(); setShowMobileMenu(false); },
                                        className: 'w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100'
                                    },
                                        React.createElement('div', { className: 'w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20' },
                                            React.createElement('i', { className: 'fas fa-calendar-alt text-white text-sm' })
                                        ),
                                        React.createElement('span', { className: 'flex-1 text-left text-sm font-semibold text-slate-700' }, 'Planning Production')
                                    ),
                                    // System Settings
                                    (isAdmin) && safeHasPermission('settings.manage') && React.createElement('button', {
                                        onClick: () => { onOpenSystemSettings(); setShowMobileMenu(false); },
                                        className: 'w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors'
                                    },
                                        React.createElement('div', { className: 'w-9 h-9 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center shadow-md shadow-slate-600/20' },
                                            React.createElement('i', { className: 'fas fa-cog text-white text-sm' })
                                        ),
                                        React.createElement('span', { className: 'flex-1 text-left text-sm font-semibold text-slate-700' }, 'Paramètres Système')
                                    )
                                )
                            ),

                            // --- CONNECT SECTION (Prominent) ---
                            React.createElement('div', { className: 'mb-5' },
                                React.createElement('button', {
                                    onClick: () => { window.open('/messenger', '_blank'); setShowMobileMenu(false); },
                                    className: 'w-full flex items-center gap-3 px-4 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all'
                                },
                                    React.createElement('div', { className: 'w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center' },
                                        React.createElement('i', { className: 'fas fa-rocket text-white text-lg' })
                                    ),
                                    React.createElement('div', { className: 'flex-1 text-left' },
                                        React.createElement('span', { className: 'text-white font-bold text-sm block' }, messengerName),
                                        React.createElement('span', { className: 'text-emerald-100 text-[10px]' }, 'Messagerie instantanée')
                                    ),
                                    React.createElement('span', { className: 'px-2 py-1 bg-white/20 rounded-lg text-[9px] font-bold text-white uppercase' }, 'New')
                                )
                            )
                        ),

                        // === FOOTER ACTIONS ===
                        React.createElement('div', { 
                            className: 'px-4 py-4 bg-slate-50 border-t border-slate-200'
                        },
                            React.createElement('div', { className: 'flex gap-2' },
                                React.createElement('button', {
                                    onClick: () => { onRefresh(); setShowMobileMenu(false); },
                                    className: 'flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-semibold text-sm hover:bg-slate-50 active:scale-95 transition-all shadow-sm'
                                }, 
                                    React.createElement('i', { className: 'fas fa-sync-alt' }),
                                    'Actualiser'
                                ),
                                React.createElement('button', {
                                    onClick: () => { onLogout(); setShowMobileMenu(false); },
                                    className: 'flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 rounded-xl text-white font-semibold text-sm hover:bg-slate-700 active:scale-95 transition-all shadow-sm'
                                }, 
                                    React.createElement('i', { className: 'fas fa-sign-out-alt' }),
                                    'Déconnexion'
                                )
                            )
                        )
                    )
                ), document.body
            )
    );
};

// Make it available globally
window.AppHeader = AppHeader;