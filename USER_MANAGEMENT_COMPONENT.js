// COMPOSANT DE GESTION DES UTILISATEURS
// À intégrer dans src/index.tsx

// Ce code doit être ajouté AVANT le composant MainApp

const UserManagementModal = ({ show, onClose, currentUser }) => {
    const [users, setUsers] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showCreateForm, setShowCreateForm] = React.useState(false);
    const [showEditForm, setShowEditForm] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState(null);
    
    // Formulaire de création
    const [newEmail, setNewEmail] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [newFullName, setNewFullName] = React.useState('');
    const [newRole, setNewRole] = React.useState('operator');
    
    // Formulaire d'édition
    const [editEmail, setEditEmail] = React.useState('');
    const [editFullName, setEditFullName] = React.useState('');
    const [editRole, setEditRole] = React.useState('');
    const [editPassword, setEditPassword] = React.useState('');
    
    React.useEffect(() => {
        if (show) {
            loadUsers();
        }
    }, [show]);
    
    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(API_URL + '/users');
            setUsers(response.data.users);
        } catch (error) {
            alert('Erreur lors du chargement des utilisateurs: ' + (error.response?.data?.error || 'Erreur inconnue'));
        } finally {
            setLoading(false);
        }
    };
    
    const handleCreateUser = async (e) => {
        e.preventDefault();
        
        if (!newEmail || !newPassword || !newFullName || !newRole) {
            alert('Tous les champs sont requis');
            return;
        }
        
        try {
            await axios.post(API_URL + '/users', {
                email: newEmail,
                password: newPassword,
                full_name: newFullName,
                role: newRole
            });
            
            alert('✅ Utilisateur créé avec succès !');
            setNewEmail('');
            setNewPassword('');
            setNewFullName('');
            setNewRole('operator');
            setShowCreateForm(false);
            loadUsers();
        } catch (error) {
            alert('❌ Erreur: ' + (error.response?.data?.error || 'Erreur inconnue'));
        }
    };
    
    const handleEditUser = async (e) => {
        e.preventDefault();
        
        if (!selectedUser) return;
        
        const updates = {};
        if (editEmail && editEmail !== selectedUser.email) updates.email = editEmail;
        if (editFullName && editFullName !== selectedUser.full_name) updates.full_name = editFullName;
        if (editRole && editRole !== selectedUser.role) updates.role = editRole;
        if (editPassword) updates.password = editPassword;
        
        if (Object.keys(updates).length === 0) {
            alert('Aucune modification détectée');
            return;
        }
        
        try {
            await axios.put(API_URL + '/users/' + selectedUser.id, updates);
            alert('✅ Utilisateur modifié avec succès !');
            setShowEditForm(false);
            setSelectedUser(null);
            setEditEmail('');
            setEditFullName('');
            setEditRole('');
            setEditPassword('');
            loadUsers();
        } catch (error) {
            alert('❌ Erreur: ' + (error.response?.data?.error || 'Erreur inconnue'));
        }
    };
    
    const handleDeleteUser = async (user) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.full_name}" (${user.email}) ?\n\nCette action est irréversible.`)) {
            return;
        }
        
        try {
            await axios.delete(API_URL + '/users/' + user.id);
            alert('✅ Utilisateur supprimé avec succès');
            loadUsers();
        } catch (error) {
            alert('❌ Erreur: ' + (error.response?.data?.error || 'Erreur inconnue'));
        }
    };
    
    const handleResetPassword = async (user) => {
        const newPassword = prompt(`Nouveau mot de passe pour ${user.full_name}:\n\n(minimum 6 caractères)`);
        
        if (!newPassword) return;
        
        if (newPassword.length < 6) {
            alert('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }
        
        try {
            await axios.post(API_URL + '/users/' + user.id + '/reset-password', {
                new_password: newPassword
            });
            alert('✅ Mot de passe réinitialisé avec succès');
        } catch (error) {
            alert('❌ Erreur: ' + (error.response?.data?.error || 'Erreur inconnue'));
        }
    };
    
    const openEditForm = (user) => {
        setSelectedUser(user);
        setEditEmail(user.email);
        setEditFullName(user.full_name);
        setEditRole(user.role);
        setEditPassword('');
        setShowEditForm(true);
        setShowCreateForm(false);
    };
    
    const getRoleBadgeClass = (role) => {
        if (role === 'admin') return 'bg-red-100 text-red-800';
        if (role === 'technician') return 'bg-blue-100 text-blue-800';
        return 'bg-green-100 text-green-800';
    };
    
    const getRoleLabel = (role) => {
        if (role === 'admin') return '👑 Administrateur';
        if (role === 'technician') return '🔧 Technicien';
        return '👷 Opérateur';
    };
    
    if (!show) return null;
    
    return React.createElement('div', {
        className: 'modal active',
        onClick: onClose
    },
        React.createElement('div', {
            className: 'bg-white rounded-lg p-6 max-w-6xl w-full mx-4 my-auto',
            onClick: (e) => e.stopPropagation(),
            style: { maxHeight: '90vh', overflowY: 'auto' }
        },
            // Header
            React.createElement('div', { className: 'flex justify-between items-center mb-6 border-b-2 border-igp-blue pb-4' },
                React.createElement('h2', { className: 'text-2xl font-bold text-igp-blue' },
                    React.createElement('i', { className: 'fas fa-users mr-2 text-igp-orange' }),
                    'Gestion des Utilisateurs'
                ),
                React.createElement('button', {
                    onClick: onClose,
                    className: 'text-gray-500 hover:text-gray-700'
                },
                    React.createElement('i', { className: 'fas fa-times fa-2x' })
                )
            ),
            
            // Actions
            !showCreateForm && !showEditForm ? React.createElement('div', { className: 'mb-6' },
                React.createElement('button', {
                    onClick: () => {
                        setShowCreateForm(true);
                        setShowEditForm(false);
                    },
                    className: 'px-6 py-3 bg-igp-orange text-white rounded-md hover:bg-orange-700 font-semibold shadow-md transition-all'
                },
                    React.createElement('i', { className: 'fas fa-user-plus mr-2' }),
                    'Créer un nouvel utilisateur'
                )
            ) : null,
            
            // Formulaire de création
            showCreateForm ? React.createElement('div', { className: 'mb-6 bg-blue-50 p-6 rounded-lg border-2 border-igp-blue' },
                React.createElement('h3', { className: 'text-xl font-bold text-igp-blue mb-4' },
                    React.createElement('i', { className: 'fas fa-user-plus mr-2' }),
                    'Créer un nouvel utilisateur'
                ),
                React.createElement('form', { onSubmit: handleCreateUser },
                    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4' },
                        React.createElement('div', {},
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' }, 'Email *'),
                            React.createElement('input', {
                                type: 'email',
                                value: newEmail,
                                onChange: (e) => setNewEmail(e.target.value),
                                className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue',
                                placeholder: 'utilisateur@igpglass.ca',
                                required: true
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' }, 'Nom complet *'),
                            React.createElement('input', {
                                type: 'text',
                                value: newFullName,
                                onChange: (e) => setNewFullName(e.target.value),
                                className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue',
                                placeholder: 'Jean Tremblay',
                                required: true
                            })
                        )
                    ),
                    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4' },
                        React.createElement('div', {},
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' }, 'Mot de passe *'),
                            React.createElement('input', {
                                type: 'password',
                                value: newPassword,
                                onChange: (e) => setNewPassword(e.target.value),
                                className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue',
                                placeholder: 'Minimum 6 caractères',
                                required: true,
                                minLength: 6
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' }, 'Rôle *'),
                            React.createElement('select', {
                                value: newRole,
                                onChange: (e) => setNewRole(e.target.value),
                                className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-igp-blue',
                                required: true
                            },
                                React.createElement('option', { value: 'operator' }, '👷 Opérateur'),
                                React.createElement('option', { value: 'technician' }, '🔧 Technicien'),
                                React.createElement('option', { value: 'admin' }, '👑 Administrateur')
                            )
                        )
                    ),
                    React.createElement('div', { className: 'flex justify-end space-x-4' },
                        React.createElement('button', {
                            type: 'button',
                            onClick: () => setShowCreateForm(false),
                            className: 'px-6 py-2 border-2 border-gray-300 rounded-md text-gray-700 hover:bg-gray-100'
                        },
                            React.createElement('i', { className: 'fas fa-times mr-2' }),
                            'Annuler'
                        ),
                        React.createElement('button', {
                            type: 'submit',
                            className: 'px-6 py-2 bg-igp-orange text-white rounded-md hover:bg-orange-700 font-semibold'
                        },
                            React.createElement('i', { className: 'fas fa-check mr-2' }),
                            'Créer l\'utilisateur'
                        )
                    )
                )
            ) : null,
            
            // Formulaire d'édition
            showEditForm && selectedUser ? React.createElement('div', { className: 'mb-6 bg-yellow-50 p-6 rounded-lg border-2 border-yellow-400' },
                React.createElement('h3', { className: 'text-xl font-bold text-yellow-800 mb-4' },
                    React.createElement('i', { className: 'fas fa-user-edit mr-2' }),
                    'Modifier l\'utilisateur: ' + selectedUser.email
                ),
                React.createElement('form', { onSubmit: handleEditUser },
                    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4' },
                        React.createElement('div', {},
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' }, 'Email'),
                            React.createElement('input', {
                                type: 'email',
                                value: editEmail,
                                onChange: (e) => setEditEmail(e.target.value),
                                className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400'
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' }, 'Nom complet'),
                            React.createElement('input', {
                                type: 'text',
                                value: editFullName,
                                onChange: (e) => setEditFullName(e.target.value),
                                className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400'
                            })
                        )
                    ),
                    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4' },
                        React.createElement('div', {},
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' }, 'Nouveau mot de passe (optionnel)'),
                            React.createElement('input', {
                                type: 'password',
                                value: editPassword,
                                onChange: (e) => setEditPassword(e.target.value),
                                className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400',
                                placeholder: 'Laisser vide pour ne pas changer',
                                minLength: 6
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', { className: 'block text-gray-700 text-sm font-bold mb-2' }, 'Rôle'),
                            React.createElement('select', {
                                value: editRole,
                                onChange: (e) => setEditRole(e.target.value),
                                className: 'w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400'
                            },
                                React.createElement('option', { value: 'operator' }, '👷 Opérateur'),
                                React.createElement('option', { value: 'technician' }, '🔧 Technicien'),
                                React.createElement('option', { value: 'admin' }, '👑 Administrateur')
                            )
                        )
                    ),
                    React.createElement('div', { className: 'flex justify-end space-x-4' },
                        React.createElement('button', {
                            type: 'button',
                            onClick: () => {
                                setShowEditForm(false);
                                setSelectedUser(null);
                            },
                            className: 'px-6 py-2 border-2 border-gray-300 rounded-md text-gray-700 hover:bg-gray-100'
                        },
                            React.createElement('i', { className: 'fas fa-times mr-2' }),
                            'Annuler'
                        ),
                        React.createElement('button', {
                            type: 'submit',
                            className: 'px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-semibold'
                        },
                            React.createElement('i', { className: 'fas fa-save mr-2' }),
                            'Enregistrer les modifications'
                        )
                    )
                )
            ) : null,
            
            // Liste des utilisateurs
            loading ? React.createElement('div', { className: 'text-center py-8' },
                React.createElement('i', { className: 'fas fa-spinner fa-spin fa-3x text-igp-blue mb-4' }),
                React.createElement('p', { className: 'text-gray-600' }, 'Chargement...')
            ) : React.createElement('div', { className: 'space-y-4' },
                React.createElement('h3', { className: 'text-lg font-bold text-gray-800 mb-4' },
                    React.createElement('i', { className: 'fas fa-list mr-2' }),
                    'Liste des utilisateurs (' + users.length + ')'
                ),
                users.map(user =>
                    React.createElement('div', {
                        key: user.id,
                        className: 'bg-gray-50 rounded-lg p-4 border-2 border-gray-200 hover:border-igp-blue transition-all'
                    },
                        React.createElement('div', { className: 'flex justify-between items-start' },
                            React.createElement('div', { className: 'flex-1' },
                                React.createElement('div', { className: 'flex items-center mb-2' },
                                    React.createElement('h4', { className: 'text-lg font-bold text-gray-800 mr-3' }, user.full_name),
                                    React.createElement('span', { className: 'px-3 py-1 rounded-full text-xs font-semibold ' + getRoleBadgeClass(user.role) },
                                        getRoleLabel(user.role)
                                    ),
                                    user.hash_type === 'PBKDF2' 
                                        ? React.createElement('span', { className: 'ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs' }, '🔒 PBKDF2')
                                        : React.createElement('span', { className: 'ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs' }, '⚠️ Legacy')
                                ),
                                React.createElement('p', { className: 'text-sm text-gray-600 mb-1' },
                                    React.createElement('i', { className: 'fas fa-envelope mr-2' }),
                                    user.email
                                ),
                                React.createElement('p', { className: 'text-xs text-gray-500' },
                                    React.createElement('i', { className: 'far fa-clock mr-2' }),
                                    'Créé le: ' + new Date(user.created_at).toLocaleDateString('fr-FR')
                                )
                            ),
                            React.createElement('div', { className: 'flex flex-col space-y-2 ml-4' },
                                React.createElement('button', {
                                    onClick: () => openEditForm(user),
                                    className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm'
                                },
                                    React.createElement('i', { className: 'fas fa-edit mr-1' }),
                                    'Modifier'
                                ),
                                React.createElement('button', {
                                    onClick: () => handleResetPassword(user),
                                    className: 'px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm'
                                },
                                    React.createElement('i', { className: 'fas fa-key mr-1' }),
                                    'Mot de passe'
                                ),
                                currentUser.userId !== user.id ? React.createElement('button', {
                                    onClick: () => handleDeleteUser(user),
                                    className: 'px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm'
                                },
                                    React.createElement('i', { className: 'fas fa-trash mr-1' }),
                                    'Supprimer'
                                ) : null
                            )
                        )
                    )
                )
            )
        )
    );
};
