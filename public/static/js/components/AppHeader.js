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

    return React.createElement('header', { className: 'sticky top-0 z-50 bg-transparent transition-all duration-300' },
        
        // --- ROW 1: IDENTITY & NAVIGATION (White Background) ---
        React.createElement('div', { className: 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100' },
            React.createElement('div', { className: 'max-w-[1600px] mx-auto px-4 py-2' },
                React.createElement('div', { className: 'flex justify-between items-center h-12' },
                    
                    // LEFT: LOGO & TITLE
                    React.createElement('div', { className: 'flex items-center group cursor-pointer', onClick: () => window.location.reload() },
                        React.createElement('img', {
                            src: logoUrl, alt: 'Logo',
                            className: 'h-8 md:h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105',
                            onError: (e) => { 
                                if (e.target.src.includes('logo.png')) return;
                                e.target.src = '/static/logo.png'; 
                            }
                        }),
                        React.createElement('div', { className: 'flex flex-col justify-center ml-2 md:ml-3 pl-2 md:pl-3 border-l border-slate-200' },
                            React.createElement('h1', { className: 'text-xs md:text-sm font-bold leading-none text-slate-800 tracking-tight max-w-[100px] md:max-w-none truncate', title: headerTitle }, headerTitle),
                            React.createElement('p', { className: 'text-[9px] md:text-[10px] font-medium text-slate-500 mt-0.5 max-w-[100px] md:max-w-none truncate' }, headerSubtitle)
                        )
                    ),

                    // RIGHT: USER & MOBILE TOGGLE
                    React.createElement('div', { className: 'flex items-center gap-2 md:gap-3' },

                        // Mobile Greeting
                        React.createElement('span', { className: 'md:hidden text-xs font-bold text-slate-700 mr-1' }, 
                            "Bonjour, " + (currentUser?.first_name || 'Vous')
                        ),
                        
                        // User Badge (Desktop)
                        React.createElement('div', { className: 'hidden md:flex items-center px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 hover:bg-white hover:shadow-sm transition-all cursor-pointer', onClick: onOpenUserManagement, title: 'Mon profil et gestion des utilisateurs' },
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
                            title: 'Centre de notifications'
                        }, React.createElement('i', { className: 'fas ' + (pushState === 'granted' && isSubscribed ? 'fa-bell' : 'fa-bell-slash') })),

                        // Apps Button (Desktop)
                        React.createElement('button', {
                            className: 'hidden md:flex w-8 h-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50 hover:text-purple-600 transition-all',
                            onClick: onOpenPushDevices, title: 'Connecter un appareil mobile'
                        }, React.createElement('i', { className: 'fas fa-mobile-alt' })),

                        // --- RESTORED DESKTOP BUTTONS ---

                        // IGP Connect / Messenger (Desktop - Top Row)
                        activeModules.messaging && React.createElement('button', {
                            className: 'hidden md:flex w-8 h-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all relative',
                            onClick: onOpenMessaging, title: 'Messagerie instantanée (IGP Connect)'
                        }, 
                            React.createElement('i', { className: 'fas fa-comments' }),
                            (unreadMessagesCount > 0) && React.createElement('span', { className: 'absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white' })
                        ),
                        
                        // User Management (Desktop)
                        safeHasPermission('users.read') && React.createElement('button', {
                             className: 'hidden md:flex w-8 h-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all',
                             onClick: onOpenUserManagement, title: 'Gérer les utilisateurs et équipes'
                        }, React.createElement('i', { className: 'fas fa-users' })),

                        // Role Management (Desktop)
                        safeHasPermission('roles.read') && React.createElement('button', {
                            className: 'hidden md:flex w-8 h-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-all',
                            onClick: onOpenAdminRoles, title: 'Configurer les rôles et permissions'
                       }, React.createElement('i', { className: 'fas fa-shield-alt' })),

                        // Machines (Desktop)
                        safeHasPermission('machines.read') && activeModules.machines && React.createElement('button', {
                             className: 'hidden md:flex w-8 h-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50 hover:text-teal-600 transition-all',
                             onClick: onOpenMachineManagement, title: 'Gérer le parc machines'
                        }, React.createElement('i', { className: 'fas fa-cogs' })),

                        // Settings (Desktop) - CRITICAL REQUEST
                        safeHasPermission('settings.manage') && React.createElement('button', {
                             className: 'hidden md:flex w-8 h-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50 hover:text-gray-700 transition-all',
                             onClick: onOpenSystemSettings, title: 'Paramètres généraux du système'
                        }, React.createElement('i', { className: 'fas fa-cog' })),

                        // TV Mode (Desktop)
                        safeHasPermission('settings.manage') && React.createElement('button', {
                             className: 'hidden md:flex w-8 h-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50 hover:text-purple-600 transition-all',
                             onClick: onOpenTv, title: 'Passer en mode affichage TV'
                        }, React.createElement('i', { className: 'fas fa-tv' })),

                        // MAIN MENU TOGGLE (Visible on ALL screens)
                        // This button was missing on Desktop in v2, preventing access to Settings/Admin
                        React.createElement('button', {
                            className: 'w-10 h-10 flex items-center justify-center rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm ml-2',
                            onClick: () => setShowMobileMenu(!showMobileMenu),
                            title: 'Ouvrir le menu complet'
                        }, React.createElement('i', { className: 'fas ' + (showMobileMenu ? 'fa-times' : 'fa-bars') + ' text-lg' }))
                    )
                )
            )
        ),

        // --- ROW 2: CONTROL BAR (Action Toolbar) ---
        // Hidden on mobile (kept simple), Visible on Desktop
        React.createElement('div', { className: 'hidden md:block bg-white/80 backdrop-blur-sm border-b border-slate-200/60 shadow-sm' },
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
                                className: 'absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 p-1'
                            }, React.createElement('i', { className: 'fas fa-times-circle' })),
                            
                            // Spinner
                            searchLoading && React.createElement('i', { className: 'fas fa-spinner fa-spin absolute right-3 top-1/2 -translate-y-1/2 text-blue-500' }),
                            
                            // Chevron
                            (!searchQuery && !searchLoading) && React.createElement('button', {
                                onClick: () => { setViewingList(!viewingList); setShowSearchResults(!showSearchResults); },
                                className: 'absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500 p-1'
                            }, React.createElement('i', { className: 'fas fa-chevron-down text-xs' }))
                        )
                    ),

                    // QUICK FILTERS (Desktop)
                    React.createElement('div', { className: 'flex items-center gap-2 border-l border-slate-200 pl-4 mr-auto' },
                        React.createElement('button', {
                            onClick: onOpenOverdue,
                            className: 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-orange-50 hover:text-orange-700 transition-colors'
                        }, React.createElement('i', { className: 'fas fa-clock text-orange-500' }), 'Retard'),
                        
                        React.createElement('button', {
                            onClick: onOpenPerformance,
                            className: 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors'
                        }, React.createElement('i', { className: 'fas fa-chart-line text-blue-500' }), 'Performance'),

                        React.createElement('button', {
                            onClick: onOpenManageColumns,
                            className: 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors'
                        }, React.createElement('i', { className: 'fas fa-columns text-slate-400' }), 'Vues'),

                        activeModules.planning && React.createElement('button', {
                            onClick: onOpenPlanning,
                            className: 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors'
                        }, React.createElement('i', { className: 'fas fa-calendar-alt text-indigo-500' }), 'Planning')
                    ),

                    // PRIMARY ACTIONS (Right aligned)
                    React.createElement('div', { className: 'flex items-center gap-3' },
                        
                        // Active Tickets Count (Desktop Toolbar)
                        React.createElement('span', { className: 'hidden xl:inline-block text-xs font-extrabold text-blue-800 mr-2 bg-blue-50 px-2 py-1 rounded-md' }, 
                            activeTicketsCount + " actifs"
                        ),

                        // Refresh
                        React.createElement('button', {
                            onClick: onRefresh,
                            className: 'w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:bg-white hover:text-blue-600 hover:shadow-md hover:-translate-y-0.5 transition-all',
                            title: 'Actualiser'
                        }, React.createElement('i', { className: 'fas fa-sync-alt' })),

                        // Messenger
                        activeModules.messaging && React.createElement('button', {
                            onClick: onOpenMessaging,
                            className: 'relative w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700 hover:shadow-md hover:-translate-y-0.5 transition-all',
                            title: 'Messagerie'
                        }, 
                            React.createElement('i', { className: 'fas fa-comments' }),
                            (unreadMessagesCount > 0) && React.createElement('span', { className: 'absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white' })
                        ),

                        // NEW TICKET (The Big Button)
                        safeHasPermission('tickets.create') && React.createElement('button', {
                            onClick: onOpenCreateModal,
                            className: 'flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all'
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
            activeModules.messaging && React.createElement('button', {
                onClick: onOpenMessaging,
                className: 'w-10 h-10 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm active:scale-95 relative'
            }, 
                React.createElement('i', { className: 'fas fa-comments' }),
                (unreadMessagesCount > 0) && React.createElement('span', { className: 'absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white' })
            ),
            safeHasPermission('tickets.create') && React.createElement('button', {
                onClick: onOpenCreateModal,
                className: 'w-10 h-10 flex items-center justify-center rounded-lg bg-blue-600 text-white shadow-md active:scale-95'
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

            // MOBILE MENU PORTAL (Fixed Overlay behind header)
            showMobileMenu && typeof ReactDOM !== 'undefined' && ReactDOM.createPortal(
                React.createElement('div', { 
                    className: 'fixed inset-0 z-[49] flex flex-col bg-white/95 backdrop-blur-xl overflow-y-auto pt-[60px] pb-32 px-4',
                    style: { WebkitOverflowScrolling: 'touch' } // Native momentum scrolling
                },
                    activeModules.messaging && React.createElement('button', { onClick: onOpenMessaging, className: 'px-3 py-3 bg-white text-gray-700 text-sm rounded-lg border shadow-sm items-center flex justify-between mt-2 hover:bg-gray-50' }, 
                        React.createElement('div', { className: 'flex items-center' }, React.createElement('i', { className: 'fas fa-comments mr-3 text-blue-500 text-lg' }), 'Messagerie'),
                        (unreadMessagesCount > 0) && React.createElement('span', { className: 'ml-2 px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full' }, unreadMessagesCount)
                    ),
                    // NEW CONNECT BUTTON
                    React.createElement('button', { 
                        onClick: () => window.open('/messenger', '_blank'), 
                        className: 'px-3 py-3 bg-white text-gray-700 text-sm rounded-lg border shadow-sm items-center flex justify-between mt-2 hover:bg-emerald-50 border-emerald-200' 
                    }, 
                        React.createElement('div', { className: 'flex items-center' }, 
                            React.createElement('i', { className: 'fas fa-rocket mr-3 text-emerald-600 text-lg' }), 
                            React.createElement('span', { className: 'font-bold text-emerald-700' }, messengerName)
                        ),
                        React.createElement('span', { className: 'ml-2 px-2 py-0.5 text-[10px] font-bold text-white bg-emerald-600 rounded-full animate-pulse' }, 'NOUVEAU')
                    ),
                    React.createElement('button', {
                        onClick: () => { setShowArchived(!showArchived); if(!showArchived) setTimeout(() => document.getElementById('archived-section')?.scrollIntoView({behavior:'smooth'}), 100); },
                        className: 'px-3 py-3 text-sm rounded-lg shadow-sm flex items-center gap-2 border mt-2 ' + (showArchived ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-700 hover:bg-gray-50')
                    }, React.createElement('i', { className: 'fas fa-' + (showArchived ? 'eye-slash' : 'archive') + ' mr-1 text-lg' }), showArchived ? 'Masquer les tickets archivés' : 'Voir les tickets archivés'),
                    
                    React.createElement('div', { className: 'h-px bg-gray-200 my-4' }), // Separator
                    
                    safeHasPermission('users.read') && React.createElement('button', { onClick: onOpenUserManagement, className: 'px-3 py-3 bg-white text-gray-700 text-sm rounded-lg border shadow-sm flex items-center hover:bg-gray-50 mb-2' }, React.createElement('i', { className: 'fas fa-users mr-3 text-indigo-600 text-lg' }), currentUser?.role === 'technician' ? 'Mon Équipe' : 'Gestion Utilisateurs'),
                    safeHasPermission('machines.read') && activeModules.machines && React.createElement('button', { onClick: onOpenMachineManagement, className: 'px-3 py-3 bg-white text-gray-700 text-sm rounded-lg border shadow-sm flex items-center hover:bg-gray-50 mb-2' }, React.createElement('i', { className: 'fas fa-cogs mr-3 text-teal-500 text-lg' }), 'Gestion Machines'),
                    safeHasPermission('settings.manage') && React.createElement('button', { onClick: onOpenManageColumns, className: 'px-3 py-3 bg-white text-gray-700 text-sm rounded-lg border shadow-sm flex items-center hover:bg-gray-50 mb-2' }, React.createElement('i', { className: 'fas fa-columns mr-3 text-gray-500 text-lg' }), 'Colonnes Kanban'),
                    safeHasPermission('planning.read') && activeModules.planning && React.createElement('button', { onClick: onOpenPlanning, className: 'px-3 py-3 bg-white text-gray-700 text-sm rounded-lg border shadow-sm flex items-center hover:bg-gray-50 mb-2' }, React.createElement('i', { className: 'fas fa-calendar-alt mr-3 text-blue-500 text-lg' }), 'Planning Production'),
                    safeHasPermission('settings.manage') && React.createElement('button', { onClick: onOpenSystemSettings, className: 'px-3 py-3 bg-white text-gray-700 text-sm rounded-lg border shadow-sm flex items-center hover:bg-gray-50 mb-2' }, React.createElement('i', { className: 'fas fa-cog mr-3 text-gray-600 text-lg' }), 'Paramètres Système'),
                    safeHasPermission('roles.read') && React.createElement('button', { onClick: onOpenAdminRoles, className: 'px-3 py-3 bg-white text-gray-700 text-sm rounded-lg border shadow-sm flex items-center hover:bg-gray-50 mb-2' }, React.createElement('i', { className: 'fas fa-shield-alt mr-3 text-blue-600 text-lg' }), 'Gestion Rôles'),
                    safeHasPermission('settings.manage') && React.createElement('button', { onClick: onOpenTv, className: 'px-3 py-3 bg-white text-gray-700 text-sm rounded-lg border shadow-sm flex items-center hover:bg-gray-50 mb-2' }, React.createElement('i', { className: 'fas fa-tv mr-3 text-purple-600 text-lg' }), 'Mode Écran TV'),

                    React.createElement('div', { className: 'flex-1' }), // Spacer

                    React.createElement('button', { onClick: onRefresh, className: 'px-3 py-3 bg-blue-600 text-white text-sm rounded-lg shadow-md flex items-center justify-center hover:bg-blue-700 transition mt-4 font-bold' }, React.createElement('i', { className: 'fas fa-sync-alt mr-2' }), 'Actualiser les données'),
                    React.createElement('button', { onClick: onLogout, className: 'px-3 py-3 bg-gray-600 text-white text-sm rounded-lg shadow-md flex items-center justify-center hover:bg-gray-700 transition mt-2 font-bold' }, React.createElement('i', { className: 'fas fa-sign-out-alt mr-2' }), 'Se déconnecter')
                ), document.body
            )
    );
};

// Make it available globally
window.AppHeader = AppHeader;
