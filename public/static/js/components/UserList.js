// Composant de liste des utilisateurs
const UserList = ({ 
    users, 
    currentUser, 
    onEdit, 
    onDelete, 
    onResetPassword, 
    onOpenMessage, 
    onCreate 
}) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [displayLimit, setDisplayLimit] = React.useState(20);

    // OPTIMISATION: Mémoriser l'offset timezone
    const tzOffset = React.useMemo(() => parseInt(localStorage.getItem('timezone_offset_hours') || '-5'), []);

    // Fonctions utilitaires mémorisées
    const ROLE_LABELS = React.useMemo(() => ({
        'superadmin': '🛡️ SUPPORT',
        'admin': '👑 Administrateur',
        'director': '📊 Directeur Général',
        'supervisor': '⭐ Superviseur',
        'coordinator': '🎯 Coordonnateur Maintenance',
        'planner': '📅 Planificateur Maintenance',
        'senior_technician': '🔧 Technicien Senior',
        'technician': '🔧 Technicien',
        'team_leader': '👔 Chef Équipe Production',
        'furnace_operator': '🔥 Opérateur Four',
        'operator': '👷 Opérateur',
        'safety_officer': '🛡️ Agent Santé & Sécurité',
        'quality_inspector': '✓ Inspecteur Qualité',
        'storekeeper': '📦 Magasinier',
        'viewer': '👁️ Lecture Seule'
    }), []);

    const ROLE_BADGE_COLORS = React.useMemo(() => ({
        'superadmin': 'bg-purple-600 text-white',
        'admin': 'bg-red-100 text-red-800',
        'director': 'bg-red-50 text-red-700',
        'supervisor': 'bg-yellow-100 text-yellow-800',
        'coordinator': 'bg-amber-100 text-amber-800',
        'planner': 'bg-amber-100 text-amber-800',
        'senior_technician': 'bg-blue-100 text-blue-800',
        'technician': 'bg-blue-50 text-blue-700',
        'team_leader': 'bg-emerald-100 text-emerald-800',
        'furnace_operator': 'bg-green-100 text-green-800',
        'operator': 'bg-green-50 text-green-700',
        'safety_officer': 'bg-indigo-100 text-indigo-800',
        'quality_inspector': 'bg-slate-100 text-slate-700',
        'storekeeper': 'bg-violet-100 text-violet-800',
        'viewer': 'bg-gray-100 text-gray-800'
    }), []);

    // Fonction pour déterminer le rôle effectif (superadmin si is_super_admin === 1)
    const getEffectiveRole = React.useCallback((user) => {
        if (user.is_super_admin === 1) return 'superadmin';
        return user.role;
    }, []);

    const getRoleLabel = React.useCallback((user) => {
        const effectiveRole = typeof user === 'object' ? getEffectiveRole(user) : user;
        return ROLE_LABELS[effectiveRole] || '👤 ' + effectiveRole;
    }, [ROLE_LABELS, getEffectiveRole]);
    
    const getRoleBadgeClass = React.useCallback((user) => {
        const effectiveRole = typeof user === 'object' ? getEffectiveRole(user) : user;
        return ROLE_BADGE_COLORS[effectiveRole] || 'bg-gray-100 text-gray-800';
    }, [ROLE_BADGE_COLORS, getEffectiveRole]);

    const getLastLoginStatus = React.useCallback((lastLogin) => {
        if (!lastLogin) return { color: "text-gray-500", status: "Jamais connecté", time: "", dot: "bg-gray-400" };

        const now = getNowEST();
        const loginDate = new Date((lastLogin.includes('T') ? lastLogin : lastLogin.replace(' ', 'T')) + (lastLogin.includes('Z') ? '' : 'Z'));
        const adjustedLoginDate = new Date(loginDate.getTime() + (tzOffset * 3600000));
        
        const diffMs = now - adjustedLoginDate;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 5) return { color: "text-green-600", status: "En ligne", time: "Actif maintenant", dot: "bg-green-500" };
        if (diffMins < 60) return { color: "text-yellow-600", status: "Actif récemment", time: "Il y a " + diffMins + " min", dot: "bg-yellow-500" };
        
        const diffHours = Math.floor(diffMs / 3600000);
        if (diffHours < 24) return { color: "text-blue-700", status: "Actif aujourd'hui", time: "Il y a " + diffHours + "h", dot: "bg-amber-600" };
        
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffDays === 1) return { color: "text-red-600", status: "Inactif", time: "Hier", dot: "bg-red-500" };
        
        return { color: "text-red-600", status: "Inactif", time: "Il y a " + diffDays + " jours", dot: "bg-red-500" };
    }, [tzOffset]);

    const canSeeLastLogin = React.useCallback((targetUser) => {
        if (currentUser.role === "admin") return true;
        if (currentUser.role === "supervisor" && targetUser.role === "technician") return true;
        return false;
    }, [currentUser.role]);

    const filteredUsers = React.useMemo(() => {
        if (!users) return [];
        if (!searchQuery) return users;
        const lowerQuery = searchQuery.toLowerCase();
        return users.filter(user => 
            (user.full_name || '').toLowerCase().includes(lowerQuery) ||
            (user.email || '').toLowerCase().includes(lowerQuery)
        );
    }, [users, searchQuery]);

    const displayedUsers = React.useMemo(() => {
        return filteredUsers.slice(0, displayLimit);
    }, [filteredUsers, displayLimit]);

    return React.createElement('div', { className: 'flex-1 overflow-y-auto p-3 sm:p-6' },
        React.createElement('div', { className: 'mb-4 flex flex-col sm:flex-row gap-3' },
            (currentUser.role === 'admin' || currentUser.role === 'supervisor') ? React.createElement(React.Fragment, null,
                React.createElement('button', {
                    onClick: onCreate,
                    className: 'px-6 py-3 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-xl font-bold transition-all shadow-[0_8px_16px_rgba(249,115,22,0.4),0_4px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_12px_24px_rgba(249,115,22,0.5),0_6px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:translate-y-0 active:shadow-[0_4px_8px_rgba(249,115,22,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)] border-t border-blue-300/50'
                }, "Créer un utilisateur"),
                currentUser.role === 'admin' ? React.createElement('button', {
                    onClick: () => window.openDataImport ? window.openDataImport('users') : alert("Fonction non disponible"),
                    className: 'px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2'
                }, 
                    React.createElement("i", { className: "fas fa-file-import" }),
                    "Import CSV"
                ) : null
            ) : null,
            React.createElement('div', { className: 'flex-1 relative' },
                React.createElement('input', {
                    type: 'text',
                    autoComplete: 'off',
                    placeholder: 'Rechercher par nom ou email...',
                    value: searchQuery,
                    onChange: (e) => setSearchQuery(e.target.value),
                    className: 'w-full px-4 py-2 pl-10 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all',
                    onKeyDown: (e) => { if (e.key === 'Escape') setSearchQuery(''); }
                }),
                React.createElement('i', {
                    className: 'fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                }),
                searchQuery && React.createElement('button', {
                    onClick: () => setSearchQuery(''),
                    className: 'absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                }, React.createElement('i', { className: 'fas fa-times' }))
            )
        ),

        React.createElement('div', { className: 'space-y-4' },
            React.createElement('p', { className: 'text-lg mb-4' },
                (searchQuery ?
                    filteredUsers.length + ' résultat(s) sur ' + (users || []).length :
                    (users || []).length + ' utilisateur(s)'
                )
            ),
            displayedUsers.map(user => {
                const loginStatus = getLastLoginStatus(user.last_login);
                const showLogin = canSeeLastLogin(user);
                
                return React.createElement('div', {
                    key: user.id,
                    className: 'bg-white rounded-lg p-4 border border-gray-200 hover:bg-gray-50 transition-colors'
                },
                    React.createElement('div', { className: 'flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3' },
                        React.createElement('div', { className: 'flex-1' },
                            React.createElement('div', { className: 'flex items-center gap-3 mb-2' },
                                React.createElement('h4', { className: 'font-bold text-lg' }, user.full_name),
                                React.createElement('span', {
                                    className: 'px-3 py-1 rounded-full text-xs font-semibold ' + getRoleBadgeClass(user)
                                }, getRoleLabel(user))
                            ),
                            React.createElement('p', { className: 'text-sm text-gray-600' },
                                React.createElement('i', { className: 'fas fa-envelope mr-2' }),
                                user.email
                            ),
                            React.createElement('p', { className: 'text-xs text-gray-500 mt-1' },
                                React.createElement('i', { className: 'far fa-clock mr-2' }),
                                'Créé le: ' + formatDateEST(user.created_at, false)
                            ),
                            showLogin ? React.createElement('div', { className: "flex flex-col gap-1 mt-2 pt-2 border-t border-gray-200" },
                                React.createElement('div', { className: "flex items-center gap-1.5" },
                                    React.createElement('div', {
                                        className: "w-2 h-2 rounded-full " + loginStatus.dot
                                    }),
                                    React.createElement('span', {
                                        className: "text-xs font-bold " + loginStatus.color
                                    }, loginStatus.status),
                                    loginStatus.time ? React.createElement('span', {
                                        className: "text-xs " + loginStatus.color
                                    }, " - " + loginStatus.time) : null
                                ),
                                user.last_login ? React.createElement('span', { className: "text-xs text-gray-400 ml-3.5" },
                                    "Dernière connexion: " + formatDateEST(user.last_login, true)
                                ) : null
                            ) : null
                        ),
                        React.createElement('div', { className: "flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0" },
                            user.id !== currentUser.id && onOpenMessage ? React.createElement('button', {
                                onClick: () => onOpenMessage({ 
                                    id: user.id, 
                                    full_name: user.full_name, 
                                    role: user.role,
                                    first_name: user.first_name,
                                    last_name: user.last_name,
                                    email: user.email 
                                }),
                                className: "w-full sm:w-auto px-4 py-2.5 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-lg font-bold text-sm transition-all shadow-md border-t border-blue-300/50"
                            },
                                React.createElement('i', { className: "fas fa-comment mr-1" }),
                                "Message"
                            ) : null,
                            ((user.id === currentUser.id) || (user.id !== currentUser.id && !(currentUser.role === 'supervisor' && user.role === 'admin') && currentUser.role !== 'technician')) ? React.createElement(React.Fragment, null,
                                React.createElement('button', {
                                    onClick: () => onEdit(user),
                                className: 'w-full sm:w-auto px-4 py-2.5 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 text-white rounded-lg font-bold text-sm transition-all shadow-md border-t border-blue-300/50'
                            },
                                React.createElement('i', { className: 'fas fa-edit mr-1' }),
                                'Modifier'
                            ),
                            React.createElement('button', {
                                onClick: () => onResetPassword(user.id, user.full_name),
                                className: 'w-full sm:w-auto px-4 py-2.5 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white rounded-lg font-bold text-sm transition-all shadow-md border-t border-yellow-300/50'
                            },
                                React.createElement('i', { className: 'fas fa-key mr-1' }),
                                'MdP'
                            ),
                            user.id !== currentUser.id ? React.createElement('button', {
                                onClick: () => onDelete(user.id, user.full_name),
                                className: 'w-full sm:w-auto px-4 py-2.5 bg-gradient-to-br from-red-400 via-red-500 to-red-600 text-white rounded-lg font-bold text-sm transition-all shadow-md border-t border-red-300/50'
                            },
                                React.createElement('i', { className: 'fas fa-trash mr-1' }),
                                'Supprimer'
                            ) : null
                        ) : null)
                    )
                );
            }),
            
            filteredUsers.length > displayLimit ? React.createElement('button', {
                onClick: () => setDisplayLimit(prev => prev + 20),
                className: 'w-full py-3 mt-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors border-2 border-gray-200 dashed'
            }, 'Charger plus (' + (filteredUsers.length - displayLimit) + ' restants)') : null
        )
    );
};

window.UserList = UserList;
