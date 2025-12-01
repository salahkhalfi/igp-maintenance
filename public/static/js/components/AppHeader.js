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
    onOpenDetails
}) => {
    // Search state
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState([]);
    const [showSearchResults, setShowSearchResults] = React.useState(false);
    const [searchLoading, setSearchLoading] = React.useState(false);
    const [searchKeywordResults, setSearchKeywordResults] = React.useState([]);
    const [searchTextResults, setSearchTextResults] = React.useState([]);
    const [searchDropdownPosition, setSearchDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });
    
    // Dropdown states
    const [showAdminMenu, setShowAdminMenu] = React.useState(false);
    const [showUserMenu, setShowUserMenu] = React.useState(false);
    const adminMenuRef = React.useRef(null);
    const userMenuRef = React.useRef(null);
    
    const searchTimeoutRef = React.useRef(null);
    const searchInputRef = React.useRef(null);
    const [placeholderIndex, setPlaceholderIndex] = React.useState(0);

    const isMobile = window.innerWidth < 768;
    const isAdmin = currentUser?.role === 'admin';
    const isAdminOrSup = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';
    
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

    // Close menus on click outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
                setShowAdminMenu(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    return React.createElement('header', { className: 'sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-100' },
        React.createElement('div', { className: 'max-w-[1600px] mx-auto px-4 py-2' },
            React.createElement('div', { className: 'flex flex-col md:flex-row md:items-center gap-3' },
                
                // 1. LOGO & TITLE & MOBILE MENU TOGGLE
                React.createElement('div', { className: 'flex justify-between items-center md:w-auto w-full' },
                    React.createElement('div', { className: 'flex items-center group' },
                        React.createElement('img', {
                            src: '/api/settings/logo?t=' + Date.now(), alt: 'Logo',
                            className: 'h-8 md:h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105',
                            onError: (e) => { e.target.src = '/static/logo-igp.png'; }
                        }),
                        React.createElement('div', { className: 'pl-3 flex flex-col justify-center ml-3 border-l border-slate-200' },
                            React.createElement('h1', { className: 'text-sm font-bold leading-none text-slate-800 hidden md:block' }, headerTitle),
                            React.createElement('h1', { className: 'text-sm font-bold leading-none text-slate-800 md:hidden' }, 'Maintenance IGP'),
                            React.createElement('p', { className: 'text-[10px] font-medium text-slate-500 mt-0.5 hidden md:block' }, headerSubtitle)
                        )
                    ),
                    
                    // Mobile Actions (Messaging + Hamburger)
                    React.createElement('div', { className: 'md:hidden flex items-center gap-3' },
                        React.createElement('div', { className: 'flex items-center gap-2' },
                            React.createElement('span', { className: 'text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md' }, activeTicketsCount + ' actifs'),
                            isAdminOrSup && React.createElement('button', {
                                onClick: onOpenOverdue,
                                className: 'text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded-md border border-orange-100 hover:bg-orange-100 transition-colors flex items-center gap-1',
                                title: 'Tickets en retard'
                            }, React.createElement('i', { className: 'fas fa-clock' }), React.createElement('span', { id: 'overdue-tickets-badge-mobile' }, '0'))
                        ),
                        React.createElement('button', {
                            onClick: onOpenMessaging,
                            className: 'relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors'
                        },
                            React.createElement('i', { className: 'fas fa-envelope text-lg' }),
                            (unreadMessagesCount > 0) && React.createElement('span', {
                                className: 'absolute top-0 right-0 flex items-center justify-center w-4 h-4 bg-red-600 text-white text-[9px] font-bold rounded-full ring-2 ring-white animate-pulse'
                            }, unreadMessagesCount)
                        ),
                        React.createElement('button', {
                            onClick: () => setShowMobileMenu(!showMobileMenu),
                            className: 'p-2 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors'
                        }, React.createElement('i', { className: 'fas ' + (showMobileMenu ? 'fa-times' : 'fa-bars') + ' text-lg' }))
                    )
                ),

                // 2. SEARCH BAR (Centered)
                React.createElement('div', { className: 'relative flex-1 order-3 md:order-none w-full md:max-w-xl md:mx-auto' },
                    React.createElement('div', { className: 'relative flex items-center w-full group' },
                        React.createElement('input', {
                            ref: searchInputRef, type: 'text', placeholder: searchPlaceholders[placeholderIndex],
                            className: 'w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all',
                            value: searchQuery,
                            onChange: handleSearchChange,
                            onFocus: () => setShowSearchResults(searchQuery.length >= 2),
                            onBlur: () => setTimeout(() => setShowSearchResults(false), 200)
                        }),
                        React.createElement('i', { className: 'fas ' + (searchLoading ? 'fa-spinner fa-spin' : 'fa-search') + ' absolute left-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors' }),
                        searchQuery && React.createElement('button', {
                            onClick: (e) => { e.stopPropagation(); setSearchQuery(''); setShowSearchResults(false); },
                            className: 'absolute right-3 text-slate-400 hover:text-slate-600',
                        }, React.createElement('i', { className: 'fas fa-times-circle' }))
                    )
                ),

                // 3. DESKTOP ACTIONS
                React.createElement('div', { className: 'hidden md:flex items-center gap-2 lg:gap-3 justify-end' },
                    // Info Badges (Simplified)
                    React.createElement('div', { className: 'flex items-center gap-2 mr-2' },
                        React.createElement('span', { className: 'text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md' }, activeTicketsCount + ' actifs'),
                        isAdminOrSup && React.createElement('button', {
                            onClick: onOpenOverdue,
                            className: 'text-xs font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded-md border border-orange-100 hover:bg-orange-100 transition-colors flex items-center gap-1',
                            title: 'Tickets en retard'
                        }, React.createElement('i', { className: 'fas fa-clock' }), React.createElement('span', { id: 'overdue-tickets-badge' }, '0'))
                    ),

                    // Archived Toggle
                    React.createElement('button', {
                        onClick: () => { setShowArchived(!showArchived); if(!showArchived) setTimeout(() => document.getElementById('archived-section')?.scrollIntoView({behavior:'smooth'}), 100); },
                        className: 'p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors',
                        title: showArchived ? 'Masquer les archives' : 'Voir les archives'
                    }, React.createElement('i', { className: 'fas fa-' + (showArchived ? 'box-open' : 'archive') + ' text-lg' })),

                    // Messaging
                    React.createElement('button', {
                        onClick: onOpenMessaging,
                        className: 'relative p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors mr-2',
                        title: 'Messagerie'
                    },
                        React.createElement('i', { className: 'fas fa-envelope text-lg' }),
                        (unreadMessagesCount > 0) && React.createElement('span', {
                            className: 'absolute top-0 right-0 flex items-center justify-center w-4 h-4 bg-red-600 text-white text-[9px] font-bold rounded-full ring-2 ring-white animate-pulse'
                        }, unreadMessagesCount)
                    ),

                    // New Ticket (Primary)
                    React.createElement('button', {
                        onClick: onOpenCreateModal,
                        className: 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2'
                    }, React.createElement('i', { className: 'fas fa-plus' }), 'Demande'),

                    // Administration Dropdown
                    isAdminOrSup && React.createElement('div', { className: 'relative', ref: adminMenuRef },
                        React.createElement('button', {
                            onClick: () => setShowAdminMenu(!showAdminMenu),
                            className: 'px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors flex items-center gap-2 font-medium text-sm' + (showAdminMenu ? ' bg-slate-100 text-slate-900' : '')
                        }, 
                            React.createElement('i', { className: 'fas fa-cog text-lg' }), 
                            React.createElement('span', { className: 'hidden lg:inline' }, 'Administration'),
                            React.createElement('i', { className: 'fas fa-chevron-down text-xs opacity-50' })
                        ),
                        
                        showAdminMenu && React.createElement('div', {
                            className: 'absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in duration-200 origin-top-right'
                        },
                            React.createElement('div', { className: 'px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2' }, 
                                React.createElement('i', { className: 'fas fa-tools' }), 'Gestion'
                            ),
                            React.createElement('button', { onClick: () => { onOpenUserManagement(); setShowAdminMenu(false); }, className: 'w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 group' }, 
                                React.createElement('div', { className: 'w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors' }, React.createElement('i', { className: 'fas fa-users' })),
                                React.createElement('span', { className: 'font-medium' }, 'Utilisateurs')
                            ),
                            React.createElement('button', { onClick: () => { onOpenMachineManagement(); setShowAdminMenu(false); }, className: 'w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 group' }, 
                                React.createElement('div', { className: 'w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-100 transition-colors' }, React.createElement('i', { className: 'fas fa-cogs' })),
                                React.createElement('span', { className: 'font-medium' }, 'Machines')
                            ),
                            React.createElement('button', { onClick: () => { onOpenManageColumns(); setShowAdminMenu(false); }, className: 'w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 group' }, 
                                React.createElement('div', { className: 'w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors' }, React.createElement('i', { className: 'fas fa-columns' })),
                                React.createElement('span', { className: 'font-medium' }, 'Colonnes')
                            ),
                            isAdmin && React.createElement('button', { onClick: () => { onOpenAdminRoles(); setShowAdminMenu(false); }, className: 'w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 group' }, 
                                React.createElement('div', { className: 'w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors' }, React.createElement('i', { className: 'fas fa-shield-alt' })),
                                React.createElement('span', { className: 'font-medium' }, 'Rôles & Permissions')
                            ),
                            
                            React.createElement('div', { className: 'my-1 border-t border-slate-100' }),
                            React.createElement('div', { className: 'px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2' }, 
                                React.createElement('i', { className: 'fas fa-chart-pie' }), 'Système'
                            ),

                            React.createElement('button', { onClick: () => { onOpenPerformance(); setShowAdminMenu(false); }, className: 'w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 group' }, 
                                React.createElement('div', { className: 'w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors' }, React.createElement('i', { className: 'fas fa-chart-line' })),
                                React.createElement('span', { className: 'font-medium' }, 'Performance')
                            ),
                            React.createElement('button', { onClick: () => { onOpenPushDevices(); setShowAdminMenu(false); }, className: 'w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 group' }, 
                                React.createElement('div', { className: 'w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-200 transition-colors' }, React.createElement('i', { className: 'fas fa-mobile-alt' })),
                                React.createElement('span', { className: 'font-medium' }, 'Appareils Connectés')
                            ),
                            isAdmin && React.createElement('button', { onClick: () => { onOpenSystemSettings(); setShowAdminMenu(false); }, className: 'w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 group' }, 
                                React.createElement('div', { className: 'w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center group-hover:bg-gray-200 transition-colors' }, React.createElement('i', { className: 'fas fa-sliders-h' })),
                                React.createElement('span', { className: 'font-medium' }, 'Paramètres Généraux')
                            )
                        )
                    ),

                    // User Profile Dropdown
                    React.createElement('div', { className: 'relative pl-2 border-l border-slate-200', ref: userMenuRef },
                        React.createElement('button', {
                            onClick: () => setShowUserMenu(!showUserMenu),
                            className: 'flex items-center gap-2 hover:bg-slate-50 rounded-lg p-1 pr-2 transition-colors'
                        },
                            React.createElement('div', { className: 'w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-sm' },
                                (currentUser?.first_name || 'U')[0].toUpperCase()
                            ),
                            React.createElement('div', { className: 'flex flex-col items-start' },
                                React.createElement('span', { className: 'text-xs font-bold text-slate-700 leading-tight' }, currentUser?.first_name || 'Utilisateur'),
                                React.createElement('span', { className: 'text-[10px] text-slate-500 leading-tight' }, 'En ligne')
                            ),
                            React.createElement('i', { className: 'fas fa-chevron-down text-[10px] text-slate-400 ml-1' })
                        ),

                        showUserMenu && React.createElement('div', {
                            className: 'absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in duration-200 origin-top-right'
                        },
                            React.createElement('div', { className: 'px-4 py-3 border-b border-slate-50 mb-1 bg-slate-50/50' },
                                React.createElement('p', { className: 'text-sm font-bold text-slate-800' }, currentUser?.full_name),
                                React.createElement('p', { className: 'text-xs text-slate-500 font-mono' }, currentUser?.email)
                            ),
                            React.createElement('div', { className: 'px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2' }, 
                                React.createElement('i', { className: 'fas fa-user-circle' }), 'Mon Profil'
                            ),
                            React.createElement('button', { onClick: () => { onRefresh(); setShowUserMenu(false); }, className: 'w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 group' }, 
                                React.createElement('div', { className: 'w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors' }, React.createElement('i', { className: 'fas fa-sync-alt' })),
                                React.createElement('span', { className: 'font-medium' }, 'Actualiser les données')
                            ),
                            React.createElement('div', { className: 'my-1 border-t border-slate-100' }),
                            React.createElement('button', { onClick: () => { onLogout(); setShowUserMenu(false); }, className: 'w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 group' }, 
                                React.createElement('div', { className: 'w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-100 transition-colors' }, React.createElement('i', { className: 'fas fa-sign-out-alt' })),
                                React.createElement('span', { className: 'font-medium' }, 'Déconnexion')
                            )
                        )
                    )
                )
            ),

            // SEARCH PORTAL
            showSearchResults && (searchKeywordResults.length > 0 || searchTextResults.length > 0) && typeof ReactDOM !== 'undefined' && ReactDOM.createPortal(
                React.createElement('div', {
                    className: 'bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-[60vh] flex flex-col',
                    style: { position: 'absolute', zIndex: 99999, top: (searchDropdownPosition.top + 8) + 'px', left: searchDropdownPosition.left + 'px', width: searchDropdownPosition.width + 'px', minWidth: '300px' },
                    onMouseDown: (e) => e.stopPropagation()
                },
                    React.createElement('div', { className: 'bg-slate-50 px-3 py-2 border-b border-slate-100 flex justify-between items-center' },
                        React.createElement('span', { className: 'text-xs font-bold text-slate-500 uppercase' }, 'Résultats'),
                        React.createElement('button', { onClick: (e) => { e.stopPropagation(); setShowSearchResults(false); }, className: 'text-slate-400 hover:text-slate-600' }, React.createElement('i', { className: 'fas fa-times' }))
                    ),
                    React.createElement('div', { className: 'overflow-y-auto' },
                        searchKeywordResults.map(r => React.createElement('div', { key: 'kw-'+r.id, className: 'p-3 border-b border-slate-50 hover:bg-blue-50 cursor-pointer group', onClick: () => { onOpenDetails(r.id); setShowSearchResults(false); } },
                            React.createElement('div', { className: 'flex items-center gap-2' },
                                React.createElement('span', { className: 'text-xs font-bold bg-white border border-slate-200 px-1.5 rounded text-slate-600' }, '#' + r.id),
                                React.createElement('span', { className: 'text-sm font-medium text-slate-700 group-hover:text-blue-700' }, r.title)
                            )
                        )),
                        searchTextResults.map(r => React.createElement('div', { key: 'txt-'+r.id, className: 'p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer', onClick: () => { onOpenDetails(r.id); setShowSearchResults(false); } },
                            React.createElement('div', { className: 'flex items-center gap-2' },
                                React.createElement('span', { className: 'text-xs font-mono text-slate-400' }, '#' + r.id),
                                React.createElement('span', { className: 'text-sm text-slate-600' }, r.title)
                            )
                        ))
                    )
                ), document.body
            ),

            // 4. MOBILE MENU (Full Overlay)
            React.createElement('div', { 
                className: 'md:hidden fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ' + (showMobileMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'),
                onClick: () => setShowMobileMenu(false)
            },
                React.createElement('div', {
                    className: 'absolute top-0 right-0 w-[80%] max-w-[300px] h-full bg-white shadow-2xl transform transition-transform duration-300 flex flex-col ' + (showMobileMenu ? 'translate-x-0' : 'translate-x-full'),
                    onClick: (e) => e.stopPropagation()
                },
                    // Mobile User Info
                    React.createElement('div', { className: 'p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white' },
                        React.createElement('div', { className: 'flex items-center gap-3 mb-3' },
                            React.createElement('div', { className: 'w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg border border-white/30' }, (currentUser?.first_name || 'U')[0].toUpperCase()),
                            React.createElement('div', {},
                                React.createElement('p', { className: 'font-bold text-lg leading-tight' }, currentUser?.first_name),
                                React.createElement('p', { className: 'text-xs text-blue-100' }, currentUser?.role)
                            )
                        ),
                        React.createElement('button', {
                            onClick: onOpenCreateModal,
                            className: 'w-full py-2 bg-white text-blue-700 font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-transform'
                        }, React.createElement('i', { className: 'fas fa-plus' }), 'Nouvelle Demande')
                    ),

                    // Mobile Links
                    React.createElement('div', { className: 'flex-1 overflow-y-auto py-2' },
                        // Main Actions
                        React.createElement('div', { className: 'px-4 py-2' },
                            React.createElement('div', { className: 'text-xs font-bold text-slate-400 uppercase mb-2' }, 'Principal'),
                            React.createElement('button', { onClick: () => { onOpenMessaging(); setShowMobileMenu(false); }, className: 'w-full p-3 flex items-center gap-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium' },
                                React.createElement('div', { className: 'w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center' }, React.createElement('i', { className: 'fas fa-envelope' })),
                                'Messagerie',
                                (unreadMessagesCount > 0) && React.createElement('span', { className: 'ml-auto bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full' }, unreadMessagesCount)
                            ),
                            React.createElement('button', { onClick: () => { setShowArchived(!showArchived); setShowMobileMenu(false); }, className: 'w-full p-3 flex items-center gap-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium' },
                                React.createElement('div', { className: 'w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center' }, React.createElement('i', { className: 'fas fa-archive' })),
                                showArchived ? 'Masquer les archives' : 'Voir les archives'
                            )
                        ),

                        // Administration Section
                        // Force rendering for mobile debugging if needed, but logic seems correct. 
                        // Ensure icons and text are visible against white background.
                        isAdminOrSup && React.createElement('div', { className: 'px-4 py-2 border-t border-slate-100' },
                            React.createElement('div', { className: 'text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2' }, 
                                React.createElement('i', { className: 'fas fa-tools' }), 'Administration'
                            ),
                            React.createElement('button', { onClick: () => { onOpenUserManagement(); setShowMobileMenu(false); }, className: 'w-full p-3 flex items-center gap-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors' },
                                React.createElement('div', { className: 'w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center' }, React.createElement('i', { className: 'fas fa-users' })),
                                'Utilisateurs'
                            ),
                            React.createElement('button', { onClick: () => { onOpenMachineManagement(); setShowMobileMenu(false); }, className: 'w-full p-3 flex items-center gap-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors' },
                                React.createElement('div', { className: 'w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center' }, React.createElement('i', { className: 'fas fa-cogs' })),
                                'Machines'
                            ),
                            React.createElement('button', { onClick: () => { onOpenManageColumns(); setShowMobileMenu(false); }, className: 'w-full p-3 flex items-center gap-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors' },
                                React.createElement('div', { className: 'w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center' }, React.createElement('i', { className: 'fas fa-columns' })),
                                'Colonnes'
                            ),
                            isAdmin && React.createElement('button', { onClick: () => { onOpenAdminRoles(); setShowMobileMenu(false); }, className: 'w-full p-3 flex items-center gap-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors' },
                                React.createElement('div', { className: 'w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center' }, React.createElement('i', { className: 'fas fa-shield-alt' })),
                                'Rôles'
                            ),
                            React.createElement('button', { onClick: () => { onOpenPerformance(); setShowMobileMenu(false); }, className: 'w-full p-3 flex items-center gap-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors' },
                                React.createElement('div', { className: 'w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center' }, React.createElement('i', { className: 'fas fa-chart-line' })),
                                'Performance'
                            ),
                            React.createElement('button', { onClick: () => { onOpenPushDevices(); setShowMobileMenu(false); }, className: 'w-full p-3 flex items-center gap-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors' },
                                React.createElement('div', { className: 'w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center' }, React.createElement('i', { className: 'fas fa-mobile-alt' })),
                                'Appareils'
                            ),
                            isAdmin && React.createElement('button', { onClick: () => { onOpenSystemSettings(); setShowMobileMenu(false); }, className: 'w-full p-3 flex items-center gap-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors' },
                                React.createElement('div', { className: 'w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center' }, React.createElement('i', { className: 'fas fa-sliders-h' })),
                                'Paramètres'
                            )
                        )
                    ),

                    // Footer Actions
                    React.createElement('div', { className: 'p-4 border-t border-slate-100 bg-slate-50' },
                        React.createElement('button', { onClick: () => { onRefresh(); setShowMobileMenu(false); }, className: 'w-full p-2 flex items-center justify-center gap-2 text-blue-600 font-bold mb-2' },
                            React.createElement('i', { className: 'fas fa-sync-alt' }), 'Actualiser'
                        ),
                        React.createElement('button', { onClick: () => { onLogout(); setShowMobileMenu(false); }, className: 'w-full p-2 flex items-center justify-center gap-2 text-red-600 font-bold bg-white border border-red-100 rounded-lg shadow-sm' },
                            React.createElement('i', { className: 'fas fa-sign-out-alt' }), 'Déconnexion'
                        )
                    )
                )
            )
        )
    );
};
