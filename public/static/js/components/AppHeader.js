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
    // Ensure role check is robust
    const normalizeRole = (r) => r ? r.toString().toLowerCase() : '';
    const isAdmin = normalizeRole(currentUser?.role) === 'admin';
    const isAdminOrSup = ['admin', 'supervisor'].includes(normalizeRole(currentUser?.role));
    
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

    return React.createElement('header', { className: 'sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200' },
        React.createElement('div', { className: 'max-w-[1600px] mx-auto px-4 py-2' },
            React.createElement('div', { className: 'flex flex-col md:flex-row md:items-center gap-3' },
                
                // 1. LOGO & TITLE & MOBILE ACTIONS
                React.createElement('div', { className: 'flex justify-between items-center md:w-auto w-full' },
                    React.createElement('div', { className: 'flex items-center group cursor-pointer', onClick: onRefresh },
                        React.createElement('img', {
                            src: '/api/settings/logo?t=' + Date.now(), alt: 'Logo',
                            className: 'h-8 md:h-9 w-auto object-contain',
                            onError: (e) => { e.target.src = '/static/logo-igp.png'; }
                        }),
                        React.createElement('div', { className: 'pl-3 flex flex-col justify-center ml-3 border-l border-slate-200' },
                            React.createElement('h1', { className: 'text-sm font-bold leading-none text-slate-800 hidden md:block' }, headerTitle),
                            React.createElement('h1', { className: 'text-sm font-bold leading-none text-slate-800 md:hidden' }, 'Maint. IGP'),
                            React.createElement('p', { className: 'text-[10px] font-medium text-slate-500 mt-0.5 hidden md:block' }, headerSubtitle)
                        )
                    ),
                    
                    // Mobile Header Buttons (Visible)
                    React.createElement('div', { className: 'md:hidden flex items-center gap-2' },
                        // Active Badge
                        React.createElement('div', { className: 'bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-bold border border-blue-100' },
                            activeTicketsCount
                        ),
                        
                        // Overdue (if admin)
                        isAdminOrSup && React.createElement('button', {
                            onClick: onOpenOverdue,
                            className: 'w-8 h-8 flex items-center justify-center text-orange-600 bg-orange-50 rounded-full active:scale-95 transition-transform'
                        }, React.createElement('i', { className: 'fas fa-clock' })),

                        // Messages
                        React.createElement('button', {
                            onClick: onOpenMessaging,
                            className: 'relative w-8 h-8 flex items-center justify-center text-slate-600 bg-slate-50 rounded-full active:scale-95 transition-transform'
                        },
                            React.createElement('i', { className: 'fas fa-envelope' }),
                            (unreadMessagesCount > 0) && React.createElement('span', {
                                className: 'absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white'
                            }, unreadMessagesCount)
                        ),

                        // Hamburger
                        React.createElement('button', {
                            onClick: () => setShowMobileMenu(!showMobileMenu),
                            className: 'w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-lg active:scale-95 transition-transform ml-1'
                        }, React.createElement('i', { className: 'fas fa-bars text-xl' }))
                    )
                ),

                // 2. SEARCH BAR
                React.createElement('div', { className: 'relative flex-1 order-3 md:order-none w-full md:max-w-xl md:mx-auto' },
                    React.createElement('div', { className: 'relative flex items-center w-full' },
                        React.createElement('input', {
                            ref: searchInputRef, type: 'text', placeholder: searchPlaceholders[placeholderIndex],
                            className: 'w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all',
                            value: searchQuery,
                            onChange: handleSearchChange,
                            onFocus: () => setShowSearchResults(searchQuery.length >= 2),
                            onBlur: () => setTimeout(() => setShowSearchResults(false), 200)
                        }),
                        React.createElement('i', { className: 'fas ' + (searchLoading ? 'fa-spinner fa-spin' : 'fa-search') + ' absolute left-3.5 text-slate-400' }),
                        searchQuery && React.createElement('button', {
                            onClick: (e) => { e.stopPropagation(); setSearchQuery(''); setShowSearchResults(false); },
                            className: 'absolute right-3 text-slate-400 hover:text-slate-600',
                        }, React.createElement('i', { className: 'fas fa-times-circle' }))
                    )
                ),

                // 3. DESKTOP ACTIONS
                React.createElement('div', { className: 'hidden md:flex items-center gap-2 lg:gap-3 justify-end' },
                    // Badges
                    React.createElement('div', { className: 'flex items-center gap-2 mr-2' },
                        React.createElement('span', { className: 'text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md' }, activeTicketsCount + ' actifs'),
                        isAdminOrSup && React.createElement('button', {
                            onClick: onOpenOverdue,
                            className: 'text-xs font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded-md border border-orange-100 hover:bg-orange-100 transition-colors flex items-center gap-1',
                            title: 'Tickets en retard'
                        }, React.createElement('i', { className: 'fas fa-clock' }), React.createElement('span', { id: 'overdue-tickets-badge' }, '0'))
                    ),

                    // Archives
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

                    // New Ticket Button
                    React.createElement('button', {
                        onClick: onOpenCreateModal,
                        className: 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2'
                    }, React.createElement('i', { className: 'fas fa-plus' }), 'Demande'),

                    // Admin Dropdown
                    isAdminOrSup && React.createElement('div', { className: 'relative', ref: adminMenuRef },
                        React.createElement('button', {
                            onClick: () => setShowAdminMenu(!showAdminMenu),
                            className: 'px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors flex items-center gap-2 font-medium text-sm' + (showAdminMenu ? ' bg-slate-100 text-slate-900' : '')
                        }, 
                            React.createElement('i', { className: 'fas fa-cog text-lg' }), 
                            React.createElement('span', { className: 'hidden lg:inline' }, 'Admin'),
                            React.createElement('i', { className: 'fas fa-chevron-down text-xs opacity-50' })
                        ),
                        showAdminMenu && React.createElement('div', {
                            className: 'absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50'
                        },
                            React.createElement('button', { onClick: () => { onOpenUserManagement(); setShowAdminMenu(false); }, className: 'w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3' }, React.createElement('i', { className: 'fas fa-users w-5 text-indigo-500' }), 'Utilisateurs'),
                            React.createElement('button', { onClick: () => { onOpenMachineManagement(); setShowAdminMenu(false); }, className: 'w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3' }, React.createElement('i', { className: 'fas fa-cogs w-5 text-teal-500' }), 'Machines'),
                            React.createElement('button', { onClick: () => { onOpenManageColumns(); setShowAdminMenu(false); }, className: 'w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3' }, React.createElement('i', { className: 'fas fa-columns w-5 text-blue-500' }), 'Colonnes'),
                            React.createElement('button', { onClick: () => { onOpenPerformance(); setShowAdminMenu(false); }, className: 'w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3' }, React.createElement('i', { className: 'fas fa-chart-line w-5 text-emerald-500' }), 'Performance'),
                            React.createElement('button', { onClick: () => { onOpenPushDevices(); setShowAdminMenu(false); }, className: 'w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3' }, React.createElement('i', { className: 'fas fa-mobile-alt w-5 text-slate-500' }), 'Appareils'),
                            isAdmin && React.createElement('div', { className: 'my-1 border-t border-slate-100' }),
                            isAdmin && React.createElement('button', { onClick: () => { onOpenAdminRoles(); setShowAdminMenu(false); }, className: 'w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3' }, React.createElement('i', { className: 'fas fa-shield-alt w-5 text-purple-500' }), 'Rôles'),
                            isAdmin && React.createElement('button', { onClick: () => { onOpenSystemSettings(); setShowAdminMenu(false); }, className: 'w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3' }, React.createElement('i', { className: 'fas fa-sliders-h w-5 text-gray-500' }), 'Paramètres')
                        )
                    ),

                    // User Profile
                    React.createElement('div', { className: 'relative pl-2 border-l border-slate-200', ref: userMenuRef },
                        React.createElement('button', {
                            onClick: () => setShowUserMenu(!showUserMenu),
                            className: 'flex items-center gap-2 hover:bg-slate-50 rounded-lg p-1 pr-2 transition-colors'
                        },
                            React.createElement('div', { className: 'w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm' }, (currentUser?.first_name || 'U')[0].toUpperCase()),
                            React.createElement('i', { className: 'fas fa-chevron-down text-xs text-slate-400' })
                        ),
                        showUserMenu && React.createElement('div', {
                            className: 'absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50'
                        },
                            React.createElement('div', { className: 'px-4 py-3 border-b border-slate-50 mb-1' },
                                React.createElement('p', { className: 'text-sm font-bold text-slate-800' }, currentUser?.full_name),
                                React.createElement('p', { className: 'text-xs text-slate-500' }, currentUser?.email)
                            ),
                            React.createElement('button', { onClick: () => { onRefresh(); setShowUserMenu(false); }, className: 'w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3' }, React.createElement('i', { className: 'fas fa-sync-alt w-5 text-blue-500' }), 'Actualiser'),
                            React.createElement('button', { onClick: () => { onLogout(); setShowUserMenu(false); }, className: 'w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3' }, React.createElement('i', { className: 'fas fa-sign-out-alt w-5' }), 'Déconnexion')
                        )
                    )
                )
            ),

            // SEARCH RESULTS PORTAL
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

            // 4. MOBILE MENU DRAWER (Simplified & Robust)
            React.createElement('div', { 
                className: 'md:hidden fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ' + (showMobileMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'),
                onClick: () => setShowMobileMenu(false)
            },
                React.createElement('div', {
                    className: 'absolute top-0 right-0 w-72 h-full bg-white shadow-2xl transform transition-transform duration-300 flex flex-col ' + (showMobileMenu ? 'translate-x-0' : 'translate-x-full'),
                    onClick: (e) => e.stopPropagation()
                },
                    // Menu Header
                    React.createElement('div', { className: 'p-5 border-b border-slate-100 bg-slate-50 flex flex-col gap-3' },
                        React.createElement('div', { className: 'flex items-center gap-3' },
                            React.createElement('div', { className: 'w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg' }, (currentUser?.first_name || 'U')[0].toUpperCase()),
                            React.createElement('div', { className: 'flex-1 overflow-hidden' },
                                React.createElement('p', { className: 'font-bold text-slate-800 truncate' }, currentUser?.full_name),
                                React.createElement('p', { className: 'text-xs text-slate-500 uppercase font-semibold' }, currentUser?.role)
                            ),
                            React.createElement('button', { onClick: () => setShowMobileMenu(false), className: 'text-slate-400 hover:text-slate-600' }, React.createElement('i', { className: 'fas fa-times text-lg' }))
                        ),
                        React.createElement('button', {
                            onClick: onOpenCreateModal,
                            className: 'w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-transform'
                        }, React.createElement('i', { className: 'fas fa-plus' }), 'Nouvelle Demande')
                    ),

                    // Menu Content (Scrollable)
                    React.createElement('div', { className: 'flex-1 overflow-y-auto py-2' },
                        React.createElement('div', { className: 'px-4 py-2 text-xs font-bold text-slate-400 uppercase' }, 'Navigation'),
                        React.createElement('div', { className: 'grid grid-cols-2 gap-3 px-4 mb-4' },
                            React.createElement('button', { onClick: () => { onOpenMessaging(); setShowMobileMenu(false); }, className: 'p-3 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-100 active:scale-95 transition-transform' },
                                React.createElement('div', { className: 'w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 text-blue-500' }, React.createElement('i', { className: 'fas fa-envelope text-xl' })),
                                React.createElement('span', { className: 'text-xs font-bold text-slate-700' }, 'Messagerie')
                            ),
                            React.createElement('button', { onClick: () => { setShowArchived(!showArchived); setShowMobileMenu(false); }, className: 'p-3 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-100 active:scale-95 transition-transform' },
                                React.createElement('div', { className: 'w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 text-amber-500' }, React.createElement('i', { className: 'fas fa-archive text-xl' })),
                                React.createElement('span', { className: 'text-xs font-bold text-slate-700' }, showArchived ? 'Masquer' : 'Archives')
                            )
                        ),

                        isAdminOrSup && React.createElement('div', { className: 'mt-2' },
                            React.createElement('div', { className: 'px-4 py-2 text-xs font-bold text-slate-400 uppercase mb-2' }, 'Administration'),
                            React.createElement('div', { className: 'grid grid-cols-2 gap-3 px-4 pb-4' },
                                React.createElement('button', { onClick: () => { onOpenUserManagement(); setShowMobileMenu(false); }, className: 'p-3 flex flex-col items-center justify-center bg-indigo-50 rounded-xl border border-indigo-100 active:scale-95 transition-transform' },
                                    React.createElement('div', { className: 'w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 text-indigo-600' }, React.createElement('i', { className: 'fas fa-users text-xl' })),
                                    React.createElement('span', { className: 'text-xs font-bold text-indigo-900' }, 'Utilisateurs')
                                ),
                                React.createElement('button', { onClick: () => { onOpenMachineManagement(); setShowMobileMenu(false); }, className: 'p-3 flex flex-col items-center justify-center bg-teal-50 rounded-xl border border-teal-100 active:scale-95 transition-transform' },
                                    React.createElement('div', { className: 'w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 text-teal-600' }, React.createElement('i', { className: 'fas fa-cogs text-xl' })),
                                    React.createElement('span', { className: 'text-xs font-bold text-teal-900' }, 'Machines')
                                ),
                                React.createElement('button', { onClick: () => { onOpenManageColumns(); setShowMobileMenu(false); }, className: 'p-3 flex flex-col items-center justify-center bg-blue-50 rounded-xl border border-blue-100 active:scale-95 transition-transform' },
                                    React.createElement('div', { className: 'w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 text-blue-600' }, React.createElement('i', { className: 'fas fa-columns text-xl' })),
                                    React.createElement('span', { className: 'text-xs font-bold text-blue-900' }, 'Colonnes')
                                ),
                                React.createElement('button', { onClick: () => { onOpenPerformance(); setShowMobileMenu(false); }, className: 'p-3 flex flex-col items-center justify-center bg-emerald-50 rounded-xl border border-emerald-100 active:scale-95 transition-transform' },
                                    React.createElement('div', { className: 'w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 text-emerald-600' }, React.createElement('i', { className: 'fas fa-chart-line text-xl' })),
                                    React.createElement('span', { className: 'text-xs font-bold text-emerald-900' }, 'Performance')
                                ),
                                React.createElement('button', { onClick: () => { onOpenPushDevices(); setShowMobileMenu(false); }, className: 'p-3 flex flex-col items-center justify-center bg-slate-100 rounded-xl border border-slate-200 active:scale-95 transition-transform' },
                                    React.createElement('div', { className: 'w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 text-slate-600' }, React.createElement('i', { className: 'fas fa-mobile-alt text-xl' })),
                                    React.createElement('span', { className: 'text-xs font-bold text-slate-700' }, 'Appareils')
                                ),
                                isAdmin && React.createElement('button', { onClick: () => { onOpenAdminRoles(); setShowMobileMenu(false); }, className: 'p-3 flex flex-col items-center justify-center bg-purple-50 rounded-xl border border-purple-100 active:scale-95 transition-transform' },
                                    React.createElement('div', { className: 'w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 text-purple-600' }, React.createElement('i', { className: 'fas fa-shield-alt text-xl' })),
                                    React.createElement('span', { className: 'text-xs font-bold text-purple-900' }, 'Rôles')
                                ),
                                isAdmin && React.createElement('button', { onClick: () => { onOpenSystemSettings(); setShowMobileMenu(false); }, className: 'p-3 flex flex-col items-center justify-center bg-gray-100 rounded-xl border border-gray-200 active:scale-95 transition-transform' },
                                    React.createElement('div', { className: 'w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 text-gray-600' }, React.createElement('i', { className: 'fas fa-sliders-h text-xl' })),
                                    React.createElement('span', { className: 'text-xs font-bold text-gray-700' }, 'Paramètres')
                                )
                            )
                        )
                    ),

                    // Menu Footer
                    React.createElement('div', { className: 'p-4 border-t border-slate-100 bg-slate-50' },
                        React.createElement('button', { onClick: () => { onRefresh(); setShowMobileMenu(false); }, className: 'w-full mb-2 py-2 text-blue-600 font-bold flex items-center justify-center gap-2 hover:bg-blue-50 rounded-lg transition-colors' },
                            React.createElement('i', { className: 'fas fa-sync-alt' }), 'Actualiser'
                        ),
                        React.createElement('button', { onClick: () => { onLogout(); setShowMobileMenu(false); }, className: 'w-full py-2 text-red-600 font-bold flex items-center justify-center gap-2 hover:bg-red-50 rounded-lg transition-colors' },
                            React.createElement('i', { className: 'fas fa-sign-out-alt' }), 'Déconnexion'
                        )
                    )
                )
            )
        )
    );
};