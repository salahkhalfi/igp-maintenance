const AdminRoles = ({ onBack }) => {
    const [roles, setRoles] = React.useState([]);
    const [permissions, setPermissions] = React.useState([]);
    const [activeModules, setActiveModules] = React.useState({ planning: true, statistics: true, notifications: true, messaging: true, machines: true }); // Default all true
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    
    // États pour les modals
    const [showEditModal, setShowEditModal] = React.useState(false);
    const [showViewModal, setShowViewModal] = React.useState(false);
    const [editingRole, setEditingRole] = React.useState(null); // null = mode création, objet = modification
    const [viewingRole, setViewingRole] = React.useState(null);

    const [viewMode, setViewMode] = React.useState('list'); // 'list' or 'grid' - Default to list as requested by user
    const [systemRolesCount, setSystemRolesCount] = React.useState(0);
    const [customRolesCount, setCustomRolesCount] = React.useState(0);

    React.useEffect(() => {
        setSystemRolesCount(roles.filter(r => r.is_system === 1).length);
        setCustomRolesCount(roles.filter(r => r.is_system === 0).length);
    }, [roles]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Parallel fetch with fallback for modules
            const [rolesRes, permsRes, modulesRes] = await Promise.all([
                axios.get(API_URL + '/roles').catch(e => { throw new Error("Impossible de charger les rôles: " + (e.response?.data?.error || e.message)); }),
                axios.get(API_URL + '/roles/permissions/all').catch(e => { throw new Error("Impossible de charger les permissions: " + (e.response?.data?.error || e.message)); }),
                axios.get(API_URL + '/settings/modules').catch(() => ({ data: { planning: true, statistics: true, notifications: true, messaging: true, machines: true } }))
            ]);
            
            setRoles(rolesRes.data.roles || []);
            
            // Handle permissions structure (array or grouped)
            if (permsRes.data.permissions) {
                setPermissions(permsRes.data.permissions);
            } else if (permsRes.data.grouped) {
                const flat = Object.values(permsRes.data.grouped).flat();
                setPermissions(flat);
            } else {
                setPermissions([]);
            }

            if (modulesRes.data) setActiveModules(modulesRes.data);
        } catch (err) {
            console.error("Erreur chargement rôles/permissions:", err);
            setError(err.message || "Une erreur inconnue est survenue");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRole = async (role) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le rôle "${role.name}" ?\n\nCette action est irréversible.`)) {
            return;
        }
        try {
            await axios.delete(API_URL + `/roles/${role.id}`);
            alert(`Rôle "${role.name}" supprimé avec succès`);
            fetchData(); // Recharger la liste
        } catch (err) {
            alert('Erreur suppression: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleEditClick = async (roleId) => {
        try {
            const response = await axios.get(API_URL + '/roles/' + roleId);
            setEditingRole(response.data.role);
            setShowEditModal(true);
        } catch (err) {
            console.error("Error details:", err);
            alert('Impossible de charger les détails du rôle');
        }
    };

    const handleViewClick = async (roleId) => {
        try {
            const response = await axios.get(API_URL + '/roles/' + roleId);
            setViewingRole(response.data.role);
            setShowViewModal(true);
        } catch (err) {
            console.error("Error details:", err);
            alert('Impossible de charger les détails du rôle');
        }
    };

    const handleSaveRole = async (roleData) => {
        try {
            if (editingRole && editingRole.id) {
                await axios.put(API_URL + `/roles/${editingRole.id}`, roleData);
            } else {
                await axios.post(API_URL + '/roles', roleData);
            }
            alert(editingRole ? 'Rôle modifié avec succès' : 'Rôle créé avec succès');
            setShowEditModal(false);
            setEditingRole(null);
            fetchData();
        } catch (err) {
            alert('Erreur sauvegarde: ' + (err.response?.data?.error || err.message));
        }
    };

    if (loading && roles.length === 0) {
        return React.createElement('div', { className: 'flex justify-center items-center h-64' },
            React.createElement('i', { className: 'fas fa-spinner fa-spin fa-3x text-blue-500' }),
            React.createElement('span', { className: 'ml-3 text-gray-600' }, 'Chargement des rôles...')
        );
    }

    if (error) {
        return React.createElement('div', { className: 'min-h-screen bg-white p-8 flex flex-col items-center justify-center' },
            React.createElement('div', { className: 'text-red-500 text-5xl mb-4' }, React.createElement('i', { className: 'fas fa-exclamation-circle' })),
            React.createElement('h2', { className: 'text-2xl font-bold text-gray-800 mb-2' }, 'Erreur de chargement'),
            React.createElement('p', { className: 'text-gray-600 mb-6 text-center max-w-md' }, error),
            React.createElement('button', {
                onClick: onBack,
                className: 'px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md'
            }, 'Retour au menu')
        );
    }

    return React.createElement('div', { className: 'min-h-screen bg-white p-4 md:p-8' },
        // Header Clean
        React.createElement('div', { className: 'flex flex-col md:flex-row justify-between items-center mb-8 border-b pb-4' },
            React.createElement('div', null,
                React.createElement('h1', { className: 'text-2xl font-bold text-gray-900' }, 'Gestion des Rôles'),
                React.createElement('p', { className: 'text-sm text-gray-500 mt-1' }, 'Configuration des accès et permissions (RBAC)')
            ),
            React.createElement('div', { className: 'flex items-center gap-2' },
                React.createElement('div', { className: 'bg-gray-100 p-1 rounded-lg flex items-center mr-4' },
                    React.createElement('button', {
                        onClick: () => setViewMode('list'),
                        className: `px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`
                    }, React.createElement('i', { className: 'fas fa-list' }), 'Liste'),
                    React.createElement('button', {
                        onClick: () => setViewMode('grid'),
                        className: `px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`
                    }, React.createElement('i', { className: 'fas fa-th-large' }), 'Cartes')
                ),
                React.createElement('button', {
                    onClick: onBack,
                    className: 'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center shadow-sm'
                }, React.createElement('i', { className: 'fas fa-arrow-left mr-2' }), 'Retour')
            )
        ),

        // Stats Row (Minimalist)
        React.createElement('div', { className: 'grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8' },
            React.createElement(StatsCard, { title: 'Total Rôles', value: roles.length, icon: 'fa-users' }),
            React.createElement(StatsCard, { title: 'Système', value: systemRolesCount, icon: 'fa-lock' }),
            React.createElement(StatsCard, { title: 'Personnalisés', value: customRolesCount, icon: 'fa-user-edit' }),
            React.createElement(StatsCard, { title: 'Permissions', value: permissions.length, icon: 'fa-key' })
        ),

        // Info Alert (Subtle)
        React.createElement('div', { className: 'bg-blue-50 text-blue-800 px-4 py-3 rounded-lg mb-8 flex items-start text-sm border border-blue-100' },
            React.createElement('i', { className: 'fas fa-info-circle mt-0.5 mr-3 text-blue-500' }),
            React.createElement('p', null, 
                'Les rôles système sont fixes, mais ',
                React.createElement('span', { className: 'font-semibold' }, 'vous pouvez créer des rôles personnalisés'),
                ' avec leurs propres permissions pour répondre à des besoins spécifiques.'
            )
        ),

        // Content - List or Grid
        viewMode === 'list' ? (
            // LIST VIEW (TABLE)
            React.createElement('div', { className: 'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden' },
                React.createElement('div', { className: 'overflow-x-auto' },
                    React.createElement('table', { className: 'min-w-full divide-y divide-gray-200' },
                        React.createElement('thead', { className: 'bg-gray-50' },
                            React.createElement('tr', null,
                                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider' }, 'Rôle'),
                                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider' }, 'Identifiant'),
                                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell' }, 'Description'),
                                React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider' }, 'Type'),
                                React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider' }, 'Permissions'),
                                React.createElement('th', { className: 'px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider' }, 'Actions')
                            )
                        ),
                        React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
                            roles.map(role => {
                                const isSystem = role.is_system === 1;
                                return React.createElement('tr', { key: role.id, className: 'hover:bg-gray-50 transition-colors' },
                                    // Name
                                    React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                                        React.createElement('div', { className: 'text-sm font-bold text-gray-900' }, role.name)
                                    ),
                                    // Slug
                                    React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                                        React.createElement('span', { className: 'px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-mono' }, role.slug)
                                    ),
                                    // Description
                                    React.createElement('td', { className: 'px-6 py-4 hidden md:table-cell' },
                                        React.createElement('div', { className: 'text-sm text-gray-500 line-clamp-1', title: role.description }, role.description || '-')
                                    ),
                                    // Type
                                    React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-center' },
                                        isSystem 
                                            ? React.createElement('span', { className: 'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800 border border-slate-200' }, 'SYSTÈME')
                                            : React.createElement('span', { className: 'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200' }, 'PERSO')
                                    ),
                                    // Permissions Count
                                    React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-center' },
                                        React.createElement('span', { className: 'px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-200' },
                                            role.permissions_count + ' perms'
                                        )
                                    ),
                                    // Actions
                                    React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium' },
                                        React.createElement('div', { className: 'flex items-center justify-end gap-2' },
                                            React.createElement('button', {
                                                onClick: () => handleViewClick(role.id),
                                                className: 'text-gray-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded transition',
                                                title: 'Voir détails'
                                            }, React.createElement('i', { className: 'fas fa-eye' })),
                                            
                                            React.createElement('button', {
                                                onClick: () => handleEditClick(role.id),
                                                className: 'text-gray-400 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded transition',
                                                title: 'Modifier'
                                            }, React.createElement('i', { className: 'fas fa-edit' })),
                                            
                                            !isSystem && React.createElement('button', {
                                                onClick: () => handleDeleteRole(role),
                                                className: 'text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition',
                                                title: 'Supprimer'
                                            }, React.createElement('i', { className: 'fas fa-trash-alt' }))
                                        )
                                    )
                                );
                            })
                        )
                    )
                )
            )
        ) : (
            // GRID VIEW (CARDS)
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' },
                roles.map(role => React.createElement(RoleCard, {
                    key: role.id,
                    role: role,
                    onEdit: () => handleEditClick(role.id),
                    onView: () => handleViewClick(role.id),
                    onDelete: () => handleDeleteRole(role)
                }))
            )
        ),

        // Modals
        showEditModal && React.createElement(RoleEditModal, {
            role: editingRole,
            allPermissions: permissions,
            activeModules: activeModules,
            onClose: () => { setShowEditModal(false); setEditingRole(null); },
            onSave: handleSaveRole
        }),

        showViewModal && React.createElement(RoleViewModal, {
            role: viewingRole,
            activeModules: activeModules,
            onClose: () => { setShowViewModal(false); setViewingRole(null); }
        })
    );
};

// --- Sub-components (Refined Design) ---

const StatsCard = ({ title, value, icon }) => {
    return React.createElement('div', { className: 'bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-sm' },
        React.createElement('div', null,
            React.createElement('p', { className: 'text-xs font-medium text-gray-500 uppercase tracking-wide' }, title),
            React.createElement('p', { className: 'text-2xl font-semibold text-gray-900 mt-1' }, value)
        ),
        React.createElement('div', { className: 'w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400' },
            React.createElement('i', { className: `fas ${icon}` })
        )
    );
};

const RoleCard = ({ role, onEdit, onView, onDelete }) => {
    const isSystem = role.is_system === 1;
    
    // Subtle color coding border - System is now Slate (Dark Gray) instead of Purple
    const colorBorderClass = isSystem ? 'border-l-4 border-slate-600' : 'border-l-4 border-blue-500';

    return React.createElement('div', { className: `bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col ${colorBorderClass}` },
        // Header
        React.createElement('div', { className: 'p-5 pb-0 flex justify-between items-start' },
            React.createElement('div', null,
                React.createElement('h3', { className: 'text-lg font-bold text-gray-900' }, role.name),
                React.createElement('p', { className: 'text-xs text-gray-400 font-mono mt-1' }, role.slug)
            ),
            isSystem && React.createElement('span', { className: 'bg-slate-100 text-slate-700 text-[10px] px-2 py-1 rounded font-semibold uppercase tracking-wide border border-slate-200' }, 'Système')
        ),
        
        // Body
        React.createElement('div', { className: 'p-5 flex-1' },
            React.createElement('p', { className: 'text-gray-600 text-sm line-clamp-2 mb-4 min-h-[2.5rem]' }, role.description || 'Aucune description disponible'),
            
            // Permissions Indicator
            React.createElement('div', { className: 'flex items-center text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-md inline-flex' },
                React.createElement('i', { className: 'fas fa-shield-alt mr-2 text-gray-400' }),
                React.createElement('span', { className: 'font-medium text-gray-700 mr-1' }, role.permissions_count),
                'permissions actives'
            )
        ),
        
        // Footer Actions
        React.createElement('div', { className: 'px-5 py-4 border-t border-gray-100 flex gap-3 bg-gray-50/50' },
            React.createElement('button', { 
                onClick: onEdit,
                className: 'flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition flex justify-center items-center'
            }, [React.createElement('i', { key: 'i', className: 'fas fa-edit mr-2 text-gray-400' }), 'Modifier']),
            
            React.createElement('button', { 
                onClick: onView,
                className: 'px-3 py-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition',
                title: 'Détails'
            }, React.createElement('i', { className: 'fas fa-eye' }))
        )
    );
};

const RoleEditModal = ({ role, allPermissions, activeModules, onClose, onSave }) => {
    const isSystem = role?.is_system === 1;
    // Initial state only - useEffect handles updates from role prop changes
    const [formData, setFormData] = React.useState({
        slug: role?.slug || '',
        name: role?.name || '',
        description: role?.description || '',
        permission_ids: role?.permissions ? role.permissions.map(p => p.id) : []
    });

    const groupedPermissions = React.useMemo(() => {
        const grouped = {};
        allPermissions.forEach(p => {
            if (!grouped[p.resource]) grouped[p.resource] = [];
            grouped[p.resource].push(p);
        });
        return grouped;
    }, [allPermissions]);

    const togglePermission = (id) => {
        setFormData(prev => {
            const newIds = prev.permission_ids.includes(id)
                ? prev.permission_ids.filter(pid => pid !== id)
                : [...prev.permission_ids, id];
            return { ...prev, permission_ids: newIds };
        });
    };

    const selectAll = () => setFormData(prev => ({ ...prev, permission_ids: allPermissions.map(p => p.id) }));
    const deselectAll = () => setFormData(prev => ({ ...prev, permission_ids: [] }));
    const selectReadOnly = () => setFormData(prev => ({ ...prev, permission_ids: allPermissions.filter(p => p.action === 'read').map(p => p.id) }));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    // Reset form data when role changes (crucial for switching between create/edit)
    React.useEffect(() => {
        if (role) {
            setFormData({
                slug: role.slug,
                name: role.name,
                description: role.description,
                permission_ids: role.permissions.map(p => p.id)
            });
        } else {
            setFormData({
                slug: '',
                name: '',
                description: '',
                permission_ids: []
            });
        }
    }, [role]);

    return React.createElement('div', { className: 'fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn' },
        React.createElement('div', { className: 'bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-slideUp' },
            // Modal Header
            React.createElement('div', { className: 'p-6 border-b flex justify-between items-center' },
                React.createElement('div', null,
                    React.createElement('h2', { className: 'text-xl font-bold text-gray-900' }, role ? 'Configuration du Rôle' : 'Nouveau Rôle'),
                    React.createElement('p', { className: 'text-sm text-gray-500' }, role ? `Modification de ${role.name}` : 'Définissez les attributs et permissions')
                ),
                React.createElement('button', { onClick: onClose, className: 'text-gray-400 hover:text-gray-600 transition' }, 
                    React.createElement('i', { className: 'fas fa-times text-xl' })
                )
            ),

            // Modal Body
            React.createElement('div', { className: 'flex-1 overflow-y-auto p-6 bg-gray-50' },
                React.createElement('form', { id: 'roleForm', onSubmit: handleSubmit, className: 'space-y-6' },
                    // Fields Container
                    React.createElement('div', { className: 'bg-white p-6 rounded-lg shadow-sm border border-gray-200' },
                        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
                            React.createElement('div', null,
                                React.createElement('label', { className: 'block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2' }, 'Identifiant Technique (Slug)'),
                                React.createElement('input', {
                                    type: 'text',
                                    value: formData.slug,
                                    onChange: e => setFormData({...formData, slug: e.target.value}),
                                    disabled: isSystem || !!role, 
                                    className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100 disabled:text-gray-500 font-mono',
                                    placeholder: 'ex: data_analyst',
                                    pattern: '[a-z0-9_]+',
                                    required: true
                                }),
                                !role && React.createElement('p', { className: 'text-xs text-gray-500 mt-1' }, 'Format: minuscules_et_underscores')
                            ),
                            React.createElement('div', null,
                                React.createElement('label', { className: 'block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2' }, 'Nom d\'Affichage'),
                                React.createElement('input', {
                                    type: 'text',
                                    value: formData.name,
                                    onChange: e => setFormData({...formData, name: e.target.value}),
                                    className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm',
                                    placeholder: 'ex: Analyste Données',
                                    required: true
                                })
                            ),
                            React.createElement('div', { className: 'col-span-1 md:col-span-2' },
                                React.createElement('label', { className: 'block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2' }, 'Description'),
                                React.createElement('textarea', {
                                    value: formData.description,
                                    onChange: e => setFormData({...formData, description: e.target.value}),
                                    className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm',
                                    rows: 2,
                                    placeholder: 'Décrivez la fonction de ce rôle...',
                                    required: true
                                })
                            )
                        )
                    ),

                    // Permissions Selector
                    React.createElement('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200' },
                        React.createElement('div', { className: 'p-4 border-b bg-gray-50/50 flex justify-between items-center' },
                            React.createElement('h3', { className: 'text-sm font-bold text-gray-800 uppercase tracking-wide' }, 'Permissions d\'accès'),
                            React.createElement('div', { className: 'flex gap-2' },
                                React.createElement('button', { type: 'button', onClick: selectAll, className: 'text-xs px-3 py-1 bg-white border rounded shadow-sm hover:bg-gray-50 text-gray-600' }, 'Tout cocher'),
                                React.createElement('button', { type: 'button', onClick: deselectAll, className: 'text-xs px-3 py-1 bg-white border rounded shadow-sm hover:bg-gray-50 text-gray-600' }, 'Tout décocher')
                            )
                        ),

                        React.createElement('div', { className: 'p-6 space-y-6' },
                            Object.entries(groupedPermissions).map(([resource, perms]) => {
                                // Determine if module is inactive (loose matching for different naming conventions)
                                // Standard keys: planning, machines, notifications, statistics, messaging
                                // Permissions resources: planning, machines, notifications, stats, messaging/messages, etc.
                                let isInactive = false;
                                if (activeModules) {
                                    // Check common mappings
                                    if (resource === 'planning' && activeModules.planning === false) isInactive = true;
                                    if (resource === 'machines' && activeModules.machines === false) isInactive = true;
                                    if (resource === 'notifications' && activeModules.notifications === false) isInactive = true;
                                    if ((resource === 'stats' || resource === 'statistics') && activeModules.statistics === false) isInactive = true;
                                    if ((resource === 'messaging' || resource === 'messages') && activeModules.messaging === false) isInactive = true;
                                }

                                return React.createElement('div', { key: resource, className: isInactive ? 'opacity-60 grayscale' : '' },
                                    React.createElement('div', { className: 'flex items-center justify-between border-b border-blue-100 pb-1 mb-3' },
                                        React.createElement('h4', { className: 'text-xs font-bold text-blue-600 uppercase tracking-wider' }, resource),
                                        isInactive && React.createElement('span', { className: 'text-[10px] font-bold text-white bg-gray-400 px-2 py-0.5 rounded-full' }, 'INACTIF')
                                    ),
                                    React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3' },
                                        perms.map(perm => 
                                            React.createElement('label', { 
                                                key: perm.id, 
                                                className: `flex items-start p-3 rounded border cursor-pointer transition-all ${
                                                    formData.permission_ids.includes(perm.id) 
                                                        ? 'bg-blue-50 border-blue-200' 
                                                        : 'bg-gray-50 border-transparent hover:bg-gray-100'
                                                }`
                                            },
                                                React.createElement('input', {
                                                    type: 'checkbox',
                                                    checked: formData.permission_ids.includes(perm.id),
                                                    onChange: () => togglePermission(perm.id),
                                                    className: 'mt-0.5 mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300'
                                                }),
                                                React.createElement('div', null,
                                                    React.createElement('div', { className: 'text-sm font-medium text-gray-900' }, perm.display_name),
                                                    React.createElement('div', { className: 'text-[10px] text-gray-400 mt-0.5 font-mono' }, `${perm.action}`)
                                                )
                                            )
                                        )
                                    )
                                );
                            })
                        )
                    )
                )
            ),

            // Footer Actions
            React.createElement('div', { className: 'p-4 border-t bg-gray-50 rounded-b-lg flex justify-end gap-3' },
                React.createElement('button', {
                    onClick: onClose,
                    className: 'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition'
                }, 'Annuler'),
                React.createElement('button', {
                    onClick: () => document.getElementById('roleForm').requestSubmit(),
                    className: 'px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition shadow-sm'
                }, 'Enregistrer les modifications')
            )
        )
    );
};

const RoleViewModal = ({ role, activeModules, onClose }) => {
    if (!role) return null;

    const groupedPermissions = React.useMemo(() => {
        const grouped = {};
        role.permissions.forEach(p => {
            if (!grouped[p.resource]) grouped[p.resource] = [];
            grouped[p.resource].push(p);
        });
        return grouped;
    }, [role]);

    return React.createElement('div', { className: 'fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn' },
        React.createElement('div', { className: 'bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-slideUp' },
            React.createElement('div', { className: 'p-6 border-b flex justify-between items-start' },
                React.createElement('div', null,
                    React.createElement('h2', { className: 'text-xl font-bold text-gray-900' }, role.name),
                    React.createElement('div', { className: 'flex items-center mt-2 gap-2' },
                        React.createElement('span', { className: 'px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono' }, `@${role.slug}`),
                        role.is_system === 1 && React.createElement('span', { className: 'px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-bold uppercase' }, 'Système')
                    )
                ),
                React.createElement('button', { onClick: onClose, className: 'text-gray-400 hover:text-gray-600 transition' }, 
                    React.createElement('i', { className: 'fas fa-times text-xl' })
                )
            ),
            React.createElement('div', { className: 'flex-1 overflow-y-auto p-6' },
                React.createElement('div', { className: 'mb-8' },
                    React.createElement('h3', { className: 'text-xs font-bold text-gray-500 uppercase tracking-wide mb-2' }, 'Description'),
                    React.createElement('p', { className: 'text-gray-700 leading-relaxed' }, role.description)
                ),
                
                React.createElement('h3', { className: 'text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 pb-2 border-b' }, 'Permissions Actives'),
                
                React.createElement('div', { className: 'space-y-6' },
                    Object.entries(groupedPermissions).map(([resource, perms]) => {
                        // Determine if module is inactive (same logic as Edit)
                        let isInactive = false;
                        if (activeModules) {
                            if (resource === 'planning' && activeModules.planning === false) isInactive = true;
                            if (resource === 'machines' && activeModules.machines === false) isInactive = true;
                            if (resource === 'notifications' && activeModules.notifications === false) isInactive = true;
                            if ((resource === 'stats' || resource === 'statistics') && activeModules.statistics === false) isInactive = true;
                            if ((resource === 'messaging' || resource === 'messages') && activeModules.messaging === false) isInactive = true;
                        }

                        return React.createElement('div', { key: resource, className: isInactive ? 'opacity-60 grayscale' : '' },
                            React.createElement('div', { className: 'flex items-center justify-between mb-3' },
                                React.createElement('h4', { className: 'text-sm font-bold text-gray-800' }, resource),
                                isInactive && React.createElement('span', { className: 'text-[10px] font-bold text-white bg-gray-400 px-2 py-0.5 rounded-full' }, 'INACTIF')
                            ),
                            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-2' },
                                perms.map(perm => 
                                    React.createElement('div', { key: perm.id, className: 'flex items-center p-2 rounded bg-gray-50' },
                                        React.createElement('i', { className: 'fas fa-check text-green-500 mr-2 text-xs' }),
                                        React.createElement('span', { className: 'text-sm text-gray-700' }, perm.display_name)
                                    )
                                )
                            )
                        );
                    })
                )
            ),
            React.createElement('div', { className: 'p-4 border-t bg-gray-50 rounded-b-lg text-right' },
                React.createElement('button', {
                    onClick: onClose,
                    className: 'px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900'
                }, 'Fermer')
            )
        )
    );
};

// Make it available globally
window.AdminRoles = AdminRoles;