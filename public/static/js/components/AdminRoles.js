const AdminRoles = ({ onBack }) => {
    const [roles, setRoles] = React.useState([]);
    const [permissions, setPermissions] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    
    // États pour les modals
    const [showEditModal, setShowEditModal] = React.useState(false);
    const [showViewModal, setShowViewModal] = React.useState(false);
    const [editingRole, setEditingRole] = React.useState(null); // null = mode création, objet = modification
    const [viewingRole, setViewingRole] = React.useState(null);

    // Stats
    const systemRolesCount = roles.filter(r => r.is_system === 1).length;
    const customRolesCount = roles.filter(r => r.is_system === 0).length;

    React.useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [rolesRes, permsRes] = await Promise.all([
                axios.get(API_URL + '/roles'),
                axios.get(API_URL + '/roles/permissions/all')
            ]);
            setRoles(rolesRes.data.roles);
            setPermissions(permsRes.data.permissions);
        } catch (err) {
            console.error("Erreur chargement rôles/permissions:", err);
            setError(err.response?.data?.error || err.message);
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

    return React.createElement('div', { className: 'min-h-screen bg-gray-50 p-4 md:p-6' },
        // Header
        React.createElement('div', { className: 'bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 mb-8 text-white' },
            React.createElement('div', { className: 'flex flex-col md:flex-row justify-between items-start md:items-center gap-4' },
                React.createElement('div', { className: 'flex items-center gap-4' },
                    React.createElement('div', { className: 'bg-white/20 p-3 rounded-lg' },
                        React.createElement('i', { className: 'fas fa-shield-alt text-3xl' })
                    ),
                    React.createElement('div', null,
                        React.createElement('h1', { className: 'text-2xl font-bold' }, 'Gestion des Rôles'),
                        React.createElement('p', { className: 'text-blue-100 text-sm' }, 'Système RBAC - Administration IGP')
                    )
                ),
                React.createElement('button', {
                    onClick: onBack,
                    className: 'bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition flex items-center backdrop-blur-sm border border-white/30'
                }, React.createElement('i', { className: 'fas fa-arrow-left mr-2' }), 'Retour au Tableau de Bord')
            )
        ),

        // Stats Cards
        React.createElement('div', { className: 'grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8' },
            StatsCard({ title: 'Total Rôles', value: roles.length, icon: 'fa-users', color: 'blue' }),
            StatsCard({ title: 'Rôles Système', value: systemRolesCount, icon: 'fa-lock', color: 'slate' }),
            StatsCard({ title: 'Rôles Actifs', value: customRolesCount, icon: 'fa-check-circle', color: 'green' }),
            StatsCard({ title: 'Permissions', value: permissions.length, icon: 'fa-key', color: 'amber' })
        ),

        // Info Banner
        React.createElement('div', { className: 'bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-8 flex items-start' },
            React.createElement('i', { className: 'fas fa-info-circle text-blue-500 text-xl mt-0.5 mr-3 flex-shrink-0' }),
            React.createElement('div', null,
                React.createElement('h3', { className: 'text-sm font-bold text-blue-800' }, 'Architecture RBAC Fixe'),
                React.createElement('p', { className: 'text-sm text-blue-700 mt-1' }, 
                    'Les 14 rôles système sont fixes mais ',
                    React.createElement('b', null, 'leurs permissions sont modifiables'),
                    '. La création de nouveaux rôles est désactivée pour garantir l\'intégrité du système.'
                )
            )
        ),

        // Roles Grid
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' },
            roles.map(role => React.createElement(RoleCard, {
                key: role.id,
                role: role,
                onEdit: () => handleEditClick(role.id),
                onView: () => handleViewClick(role.id),
                onDelete: () => handleDeleteRole(role)
            }))
        ),

        // Modals
        showEditModal && React.createElement(RoleEditModal, {
            role: editingRole,
            allPermissions: permissions,
            onClose: () => { setShowEditModal(false); setEditingRole(null); },
            onSave: handleSaveRole
        }),

        showViewModal && React.createElement(RoleViewModal, {
            role: viewingRole,
            onClose: () => { setShowViewModal(false); setViewingRole(null); }
        })
    );
};

// --- Sub-components ---

const StatsCard = ({ title, value, icon, color }) => {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600 text-blue-100',
        slate: 'from-slate-500 to-slate-600 text-slate-100',
        green: 'from-green-500 to-green-600 text-green-100',
        amber: 'from-amber-500 to-amber-600 text-amber-100'
    };
    
    return React.createElement('div', { className: `bg-gradient-to-br ${colorClasses[color]} rounded-xl shadow-md p-5 text-white` },
        React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('div', null,
                React.createElement('p', { className: 'text-xs font-medium opacity-80 uppercase tracking-wide' }, title),
                React.createElement('p', { className: 'text-3xl font-bold mt-1' }, value)
            ),
            React.createElement('i', { className: `fas ${icon} text-4xl opacity-30` })
        )
    );
};

const RoleCard = ({ role, onEdit, onView, onDelete }) => {
    const isSystem = role.is_system === 1;
    const iconMap = {
        'admin': 'fa-crown',
        'supervisor': 'fa-user-tie',
        'technician': 'fa-wrench',
        'operator': 'fa-headset'
    };
    
    const colorMap = {
        'admin': 'from-red-500 to-red-600',
        'supervisor': 'from-purple-500 to-purple-600',
        'technician': 'from-blue-500 to-blue-600',
        'operator': 'from-green-500 to-green-600'
    };
    
    const icon = iconMap[role.slug] || 'fa-user-cog';
    const colorClass = isSystem ? (colorMap[role.slug] || 'from-gray-500 to-gray-600') : 'from-indigo-500 to-indigo-600';

    return React.createElement('div', { className: 'bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1' },
        // Card Header
        React.createElement('div', { className: `bg-gradient-to-r ${colorClass} p-6 text-white` },
            React.createElement('div', { className: 'flex justify-between items-start mb-4' },
                React.createElement('div', { className: 'bg-white/20 p-3 rounded-lg' },
                    React.createElement('i', { className: `fas ${icon} text-2xl` })
                ),
                React.createElement('span', { className: 'bg-white/20 px-3 py-1 rounded-full text-xs font-bold flex items-center' },
                    React.createElement('i', { className: `fas ${isSystem ? 'fa-lock' : 'fa-star'} mr-1` }),
                    isSystem ? 'Système' : 'Personnalisé'
                )
            ),
            React.createElement('h3', { className: 'text-xl font-bold' }, role.name),
            React.createElement('p', { className: 'text-xs opacity-80 mt-1' }, '@' + role.slug)
        ),
        
        // Card Body
        React.createElement('div', { className: 'p-6' },
            React.createElement('p', { className: 'text-gray-600 text-sm mb-6 line-clamp-2 h-10' }, role.description || 'Aucune description'),
            
            // Permissions Count
            React.createElement('div', { className: 'flex justify-between items-center mb-6 text-sm' },
                React.createElement('div', { className: 'flex items-center text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full' },
                    React.createElement('i', { className: 'fas fa-key text-blue-500 mr-2' }),
                    React.createElement('span', { className: 'font-bold mr-1' }, role.permissions_count),
                    React.createElement('span', { className: 'text-gray-500' }, 'permissions')
                ),
                React.createElement('div', { className: 'text-xs text-gray-400' },
                    new Date(role.created_at).toLocaleDateString('fr-FR')
                )
            ),
            
            // Actions
            React.createElement('div', { className: 'flex gap-2' },
                React.createElement('button', { 
                    onClick: onView,
                    className: 'bg-blue-50 text-blue-600 p-2.5 rounded-lg hover:bg-blue-100 transition flex-1 flex justify-center items-center',
                    title: 'Voir détails'
                }, React.createElement('i', { className: 'fas fa-eye' })),
                
                React.createElement('button', { 
                    onClick: onEdit,
                    className: 'bg-green-50 text-green-600 px-4 py-2.5 rounded-lg hover:bg-green-100 transition flex-[2] flex justify-center items-center font-medium text-sm'
                }, [React.createElement('i', { key: 'icon', className: 'fas fa-edit mr-2' }), 'Modifier']),
                
                !isSystem ? React.createElement('button', { 
                    onClick: onDelete,
                    className: 'bg-red-50 text-red-600 p-2.5 rounded-lg hover:bg-red-100 transition flex-1 flex justify-center items-center',
                    title: 'Supprimer'
                }, React.createElement('i', { className: 'fas fa-trash' })) : 
                React.createElement('button', { 
                    disabled: true,
                    className: 'bg-gray-100 text-gray-300 p-2.5 rounded-lg cursor-not-allowed flex-1 flex justify-center items-center'
                }, React.createElement('i', { className: 'fas fa-lock' }))
            )
        )
    );
};

const RoleEditModal = ({ role, allPermissions, onClose, onSave }) => {
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

    return React.createElement('div', { className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn' },
        React.createElement('div', { className: 'bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-slideUp' },
            // Modal Header
            React.createElement('div', { className: 'p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-2xl text-white' },
                React.createElement('h2', { className: 'text-2xl font-bold' }, role ? 'Modifier le Rôle' : 'Créer un Rôle'),
                React.createElement('button', { onClick: onClose, className: 'hover:text-gray-200 transition' }, 
                    React.createElement('i', { className: 'fas fa-times text-2xl' })
                )
            ),

            // Modal Body
            React.createElement('div', { className: 'flex-1 overflow-y-auto p-6' },
                React.createElement('form', { id: 'roleForm', onSubmit: handleSubmit, className: 'space-y-6' },
                    // Fields
                    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
                        React.createElement('div', null,
                            React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' }, 'Nom Technique'),
                            React.createElement('input', {
                                type: 'text',
                                value: formData.slug,
                                onChange: e => setFormData({...formData, slug: e.target.value}),
                                disabled: isSystem || !!role, // Désactivé si système ou modification
                                className: 'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500',
                                placeholder: 'ex: data_analyst',
                                pattern: '[a-z0-9_]+',
                                required: true
                            }),
                            !role && React.createElement('p', { className: 'text-xs text-gray-500 mt-1' }, 'Minuscules, chiffres et underscores uniquement')
                        ),
                        React.createElement('div', null,
                            React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' }, 'Nom d\'Affichage'),
                            React.createElement('input', {
                                type: 'text',
                                value: formData.name,
                                onChange: e => setFormData({...formData, name: e.target.value}),
                                className: 'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500',
                                placeholder: 'ex: Analyste Données',
                                required: true
                            })
                        ),
                        React.createElement('div', { className: 'col-span-1 md:col-span-2' },
                            React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' }, 'Description'),
                            React.createElement('textarea', {
                                value: formData.description,
                                onChange: e => setFormData({...formData, description: e.target.value}),
                                className: 'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500',
                                rows: 2,
                                placeholder: 'Description du rôle...',
                                required: true
                            })
                        )
                    ),

                    // Permissions Selector
                    React.createElement('div', { className: 'border-t pt-6' },
                        React.createElement('div', { className: 'flex flex-wrap justify-between items-center mb-4 gap-3' },
                            React.createElement('h3', { className: 'text-lg font-bold flex items-center' },
                                React.createElement('i', { className: 'fas fa-key text-purple-500 mr-2' }),
                                'Permissions',
                                React.createElement('span', { className: 'ml-2 text-sm font-normal bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full' }, 
                                    `${formData.permission_ids.length} sélectionnées`
                                )
                            ),
                            React.createElement('div', { className: 'flex gap-2' },
                                React.createElement('button', { type: 'button', onClick: selectAll, className: 'text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200' }, 'Tout'),
                                React.createElement('button', { type: 'button', onClick: selectReadOnly, className: 'text-xs px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200' }, 'Lecture'),
                                React.createElement('button', { type: 'button', onClick: deselectAll, className: 'text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200' }, 'Aucun')
                            )
                        ),

                        React.createElement('div', { className: 'space-y-4' },
                            Object.entries(groupedPermissions).map(([resource, perms]) => 
                                React.createElement('div', { key: resource, className: 'border rounded-lg p-4 bg-gray-50/50' },
                                    React.createElement('h4', { className: 'font-bold text-gray-700 mb-3 uppercase text-xs tracking-wider flex items-center' },
                                        React.createElement('span', { className: 'w-2 h-2 bg-blue-500 rounded-full mr-2' }),
                                        resource
                                    ),
                                    React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3' },
                                        perms.map(perm => 
                                            React.createElement('label', { 
                                                key: perm.id, 
                                                className: `flex items-start p-3 rounded-lg border cursor-pointer transition-all ${
                                                    formData.permission_ids.includes(perm.id) 
                                                        ? 'bg-blue-50 border-blue-200 shadow-sm' 
                                                        : 'bg-white border-gray-200 hover:border-blue-300'
                                                }`
                                            },
                                                React.createElement('input', {
                                                    type: 'checkbox',
                                                    checked: formData.permission_ids.includes(perm.id),
                                                    onChange: () => togglePermission(perm.id),
                                                    className: 'mt-1 mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500'
                                                }),
                                                React.createElement('div', null,
                                                    React.createElement('div', { className: 'text-sm font-medium text-gray-900' }, perm.display_name),
                                                    React.createElement('div', { className: 'text-xs text-gray-500 mt-0.5 font-mono' }, `${perm.action}.${perm.scope}`)
                                                )
                                            )
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            ),

            // Footer Actions
            React.createElement('div', { className: 'p-6 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-3' },
                React.createElement('button', {
                    onClick: onClose,
                    className: 'px-6 py-2 border border-gray-300 rounded-lg hover:bg-white transition text-gray-700'
                }, 'Annuler'),
                React.createElement('button', {
                    onClick: () => document.getElementById('roleForm').requestSubmit(),
                    className: 'px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md'
                }, 'Enregistrer')
            )
        )
    );
};

const RoleViewModal = ({ role, onClose }) => {
    if (!role) return null;

    const groupedPermissions = React.useMemo(() => {
        const grouped = {};
        role.permissions.forEach(p => {
            if (!grouped[p.resource]) grouped[p.resource] = [];
            grouped[p.resource].push(p);
        });
        return grouped;
    }, [role]);

    return React.createElement('div', { className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn' },
        React.createElement('div', { className: 'bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-slideUp' },
            React.createElement('div', { className: 'p-6 border-b flex justify-between items-center bg-slate-800 rounded-t-2xl text-white' },
                React.createElement('h2', { className: 'text-2xl font-bold' }, role.name),
                React.createElement('button', { onClick: onClose, className: 'hover:text-gray-300 transition' }, 
                    React.createElement('i', { className: 'fas fa-times text-2xl' })
                )
            ),
            React.createElement('div', { className: 'flex-1 overflow-y-auto p-6' },
                React.createElement('div', { className: 'mb-8' },
                    React.createElement('p', { className: 'text-gray-600 text-lg leading-relaxed' }, role.description),
                    React.createElement('div', { className: 'mt-4 flex gap-2' },
                        React.createElement('span', { className: 'px-3 py-1 bg-gray-100 rounded-full text-sm font-mono text-gray-600' }, `@${role.slug}`),
                        role.is_system === 1 && React.createElement('span', { className: 'px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold' }, 'Système')
                    )
                ),
                
                React.createElement('h3', { className: 'text-lg font-bold text-gray-800 mb-4 flex items-center' },
                    React.createElement('i', { className: 'fas fa-check-circle text-green-500 mr-2' }),
                    'Permissions Actives'
                ),
                
                React.createElement('div', { className: 'space-y-4' },
                    Object.entries(groupedPermissions).map(([resource, perms]) => 
                        React.createElement('div', { key: resource, className: 'bg-gray-50 rounded-lg p-4' },
                            React.createElement('h4', { className: 'font-bold text-gray-700 mb-3 uppercase text-xs tracking-wider border-b pb-2' }, resource),
                            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-3' },
                                perms.map(perm => 
                                    React.createElement('div', { key: perm.id, className: 'flex items-center' },
                                        React.createElement('i', { className: `fas fa-check text-xs mr-2 ${perm.scope === 'all' ? 'text-green-500' : 'text-blue-500'}` }),
                                        React.createElement('span', { className: 'text-sm text-gray-700' }, perm.display_name)
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    );
};
