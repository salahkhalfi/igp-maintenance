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

    return React.createElement('header', { className: 'sticky top-0 z-50 bg-white/75 backdrop-blur-md shadow-sm border-b border-slate-100 transition-all duration-300' },
        React.createElement('div', { className: 'max-w-[1600px] mx-auto px-4 py-2' },
            React.createElement('div', { className: 'flex flex-col md:flex-row md:justify-between md:items-center gap-3' },
                
                // LOGO & TITLE
                React.createElement('div', { className: 'flex justify-between items-center w-full md:w-auto md:min-w-0 group' },
                    React.createElement('div', { className: 'flex items-center' },
                        React.createElement('img', {
                            src: logoUrl, alt: 'Logo',
                            className: 'h-8 md:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105',
                            onError: (e) => { 
                                if (e.target.src.includes('logo-igp.png')) return; // Prevent infinite loop
                                e.target.src = '/static/logo-igp.png'; 
                            }
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
                        React.createElement('i', { className: 'fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10' }),
                        React.createElement('input', {
                            ref: searchInputRef, type: 'text', placeholder: searchPlaceholders[placeholderIndex],
                            className: 'w-full px-3 md:px-4 py-1.5 md:py-2 pl-9 pr-12 border-2 border-blue-200/50 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-xs md:text-sm bg-white transition-all shadow-inner',
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
                        
                        // Action Button (Clear / Close Keyboard)
                        (searchQuery || viewingList) && React.createElement('button', {
                            onMouseDown: (e) => e.preventDefault(), // Prevent blur
                            onClick: (e) => { 
                                e.stopPropagation(); 
                                if (searchQuery) {
                                    setSearchQuery(''); 
                                    setViewingList(false);
                                    setShowSearchResults(false);
                                    searchInputRef.current?.focus(); 
                                } else if (viewingList) {
                                    setViewingList(false);
                                    setShowSearchResults(false);
                                    searchInputRef.current?.blur();
                                }
                            },
                            className: 'absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center',
                        }, React.createElement('i', { className: 'fas ' + (searchQuery ? 'fa-times-circle' : 'fa-times') })),

                        // Loading Spinner
                        searchLoading && React.createElement('i', { className: 'fas fa-spinner fa-spin absolute right-3 top-1/2 -translate-y-1/2 text-blue-500' }),
                        
                        // Zero Friction Arrow (Open list without keyboard)
                        (!searchLoading && !searchQuery && !viewingList) && React.createElement('button', {
                            onMouseDown: (e) => { e.preventDefault(); e.stopPropagation(); },
                            onClick: (e) => {
                                e.stopPropagation();
                                if (searchQuery.length >= 2) {
                                    setViewingList(true);
                                    setShowSearchResults(true);
                                } else {
                                    // Maybe show recent history if empty? For now just focus to type
                                    searchInputRef.current?.focus();
                                }
                            },
                            className: 'absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-500'
                        }, React.createElement('i', { className: 'fas fa-chevron-down' }))
                    )
                ),

                // ACTIONS & BADGES
                React.createElement('div', { className: "flex items-center gap-2 flex-wrap justify-between w-full md:w-auto md:justify-start mt-2 md:mt-0 flex-shrink-0" },
                    React.createElement('div', { className: "flex items-center gap-2 flex-wrap" },
                        React.createElement('p', { id: "active-tickets-count", className: "text-xs font-extrabold text-blue-800 hidden lg:block" }, activeTicketsCount + " actifs"),
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
                                (pushState === 'granted' && isSubscribed ? 'bg-teal-100 text-teal-700 border-teal-300 hover:bg-teal-200' : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200 animate-pulse'),
                            onClick: handlePushClick, 
                            title: pushState === 'granted' && isSubscribed ? 'Notifications activées (Cliquer pour tester)' : 'Activer les notifications'
                        }, React.createElement('i', { className: 'fas ' + (pushState === 'granted' && isSubscribed ? 'fa-bell' : 'fa-bell-slash') + ' mr-1' }), 'Notif'),

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

            // MOBILE MENU & DESKTOP ACTIONS
            React.createElement('div', { 
                className: 'md:flex md:flex-row md:items-center md:justify-center gap-2 mt-4 transition-all duration-300 ease-in-out ' + (showMobileMenu ? 'flex flex-col p-4 mx-2 bg-white/95 rounded-2xl shadow-lg border border-gray-100 max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent' : 'hidden')
            },

                activeModules.messaging && React.createElement('button', { onClick: onOpenMessaging, className: 'px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md border shadow-sm items-center flex justify-between md:justify-start hover:bg-gray-50' }, 
                    React.createElement('div', { className: 'flex items-center' }, React.createElement('i', { className: 'fas fa-comments mr-2 text-blue-500' }), 'Messagerie'),
                    (unreadMessagesCount > 0) && React.createElement('span', { className: 'ml-2 px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full' }, unreadMessagesCount)
                ),
                // NEW IGP CONNECT BUTTON
                React.createElement('button', { 
                    onClick: () => window.open('/messenger', '_blank'), 
                    className: 'px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md border shadow-sm items-center flex justify-between md:justify-start hover:bg-emerald-50 border-emerald-200' 
                }, 
                    React.createElement('div', { className: 'flex items-center' }, 
                        React.createElement('i', { className: 'fas fa-rocket mr-2 text-emerald-600' }), 
                        React.createElement('span', { className: 'font-bold text-emerald-700' }, 'IGP Connect')
                    ),
                    React.createElement('span', { className: 'ml-2 px-2 py-0.5 text-[10px] font-bold text-white bg-emerald-600 rounded-full animate-pulse' }, 'NOUVEAU')
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
                safeHasPermission('settings.manage') && React.createElement('button', { onClick: onOpenTv, className: 'px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md border shadow-sm flex items-center hover:bg-gray-50' }, React.createElement('i', { className: 'fas fa-tv mr-2 text-purple-600' }), 'Écran TV'),

                React.createElement('button', { onClick: onRefresh, className: 'px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md shadow-md flex items-center hover:bg-blue-700 transition' }, React.createElement('i', { className: 'fas fa-sync-alt mr-2' }), 'Actualiser'),
                React.createElement('button', { onClick: onLogout, className: 'px-3 py-1.5 bg-gray-600 text-white text-sm rounded-md shadow-md flex items-center hover:bg-gray-700 transition' }, React.createElement('i', { className: 'fas fa-sign-out-alt mr-2' }), 'Déconnexion')
            )
        )
    );
};

// Make it available globally
window.AppHeader = AppHeader;
