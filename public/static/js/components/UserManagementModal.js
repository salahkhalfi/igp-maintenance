// Composant de gestion des utilisateurs (VERSION SIMPLIFIÉE)
const UserManagementModal = ({ show, onClose, currentUser, onOpenMessage }) => {
    const [users, setUsers] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showCreateForm, setShowCreateForm] = React.useState(false);
    const [newEmail, setNewEmail] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [newFirstName, setNewFirstName] = React.useState('');
    const [newLastName, setNewLastName] = React.useState('');
    const [newRole, setNewRole] = React.useState('operator');
    const [editingUser, setEditingUser] = React.useState(null);
    const [editEmail, setEditEmail] = React.useState('');
    const [editFirstName, setEditFirstName] = React.useState('');
    const [editLastName, setEditLastName] = React.useState('');
    const [editRole, setEditRole] = React.useState('operator');
    const [notification, setNotification] = React.useState({ show: false, message: '', type: 'info' });
    const [confirmDialog, setConfirmDialog] = React.useState({ show: false, message: '', onConfirm: null });
    const [promptDialog, setPromptDialog] = React.useState({ show: false, message: '', onConfirm: null });
    const [toast, setToast] = React.useState({ show: false, message: '', type: 'success' });
    const [searchQuery, setSearchQuery] = React.useState('');
    const [buttonLoading, setButtonLoading] = React.useState(null);

    React.useEffect(() => {
        if (show) {
            loadUsers(); // Chargement initial

            // Polling toutes les 2 minutes pour rafraichir les statuts last_login
            const interval = setInterval(() => {
                loadUsers(true); // true = silent refresh (sans loading spinner)
            }, 120000); // 2 minutes (au lieu de 30 secondes)

            return () => clearInterval(interval);
        }
    }, [show]);

    // Reset edit form states when modal is closed
    React.useEffect(() => {
        if (!show) {
            // Modal is closed - reset all edit form states
            setEditingUser(null);
            setEditEmail('');
            setEditFirstName('');
            setEditLastName('');
            setEditRole('operator');
            setShowCreateForm(false);
        }
    }, [show]);

    React.useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                if (promptDialog.show) {
                    setPromptDialog({ show: false, message: '', onConfirm: null });
                } else if (confirmDialog.show) {
                    setConfirmDialog({ show: false, message: '', onConfirm: null });
                } else if (notification.show) {
                    setNotification({ show: false, message: '', type: 'info' });
                } else if (editingUser) {
                    setEditingUser(null);
                } else if (showCreateForm) {
                    setShowCreateForm(false);
                } else if (show) {
                    onClose();
                }
            }
        };

        if (show) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [show, promptDialog.show, confirmDialog.show, notification.show, editingUser, showCreateForm]);

    const loadUsers = async (silent = false) => {
        try {
            // Ne pas afficher le spinner si refresh automatique (silent mode)
            if (!silent) {
                setLoading(true);
            }
            // Tous les utilisateurs utilisent la route /api/users/team pour voir tous les utilisateurs
            const endpoint = '/users/team';
            const response = await axios.get(API_URL + endpoint);
            // CRITICAL FIX: Ensure users is always an array to prevent crash
            setUsers(Array.isArray(response.data.users) ? response.data.users : []);
        } catch (error) {
            // En mode silent, ne pas afficher les erreurs (éviter notifications spam)
            if (!silent) {
                console.error("Erreur chargement utilisateurs:", error);
                setNotification({ show: true, message: 'Erreur chargement: ' + (error.response?.data?.error || error.message || 'Erreur'), type: 'error' });
            }
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    };

    const handleCreateUser = React.useCallback(async (e) => {
        e.preventDefault();
        setButtonLoading('create');
        try {
            await axios.post(API_URL + '/users', {
                email: newEmail,
                password: newPassword,
                first_name: newFirstName,
                last_name: newLastName,
                role: newRole
            });
            setToast({ show: true, message: 'Utilisateur cree avec succes!', type: 'success' });
            setNewEmail('');
            setNewPassword('');
            setNewFirstName('');
            setNewLastName('');
            setNewRole('operator');
            setShowCreateForm(false);
            loadUsers();
        } catch (error) {
            setNotification({ show: true, message: 'Erreur: ' + (error.response?.data?.error || 'Erreur'), type: 'error' });
        } finally {
            setButtonLoading(null);
        }
    }, [newEmail, newPassword, newFirstName, newLastName, newRole, loadUsers]);

    // Gestionnaires validation formulaires admin
    const handleInvalidAdminField = (e) => {
        e.target.setCustomValidity("Veuillez remplir ce champ.");
    };

    const handleInputAdminEmail = (e, setter) => {
        e.target.setCustomValidity("");
        setter(e.target.value);
    };

    // Fonctions utilitaires mémorisées
    const ROLE_LABELS = React.useMemo(() => ({
        // Direction
        'admin': '👑 Administrateur',
        'director': '📊 Directeur Général',
        // Management Maintenance
        'supervisor': '⭐ Superviseur',
        'coordinator': '🎯 Coordonnateur Maintenance',
        'planner': '📅 Planificateur Maintenance',
        // Technique
        'senior_technician': '🔧 Technicien Senior',
        'technician': '🔧 Technicien',
        // Production
        'team_leader': '👔 Chef Équipe Production',
        'furnace_operator': '🔥 Opérateur Four',
        'operator': '👷 Opérateur',
        // Support
        'safety_officer': '🛡️ Agent Santé & Sécurité',
        'quality_inspector': '✓ Inspecteur Qualité',
        'storekeeper': '📦 Magasinier',
        // Transversal
        'viewer': '👁️ Lecture Seule'
    }), []);

    const ROLE_BADGE_COLORS = React.useMemo(() => ({
        // Direction - Rouge
        'admin': 'bg-red-100 text-red-800',
        'director': 'bg-red-50 text-red-700',
        // Management - Jaune/Orange
        'supervisor': 'bg-yellow-100 text-yellow-800',
        'coordinator': 'bg-amber-100 text-amber-800',
        'planner': 'bg-amber-100 text-amber-800',
        // Technique - Bleu
        'senior_technician': 'bg-blue-100 text-blue-800',
        'technician': 'bg-blue-50 text-blue-700',
        // Production - Vert
        'team_leader': 'bg-emerald-100 text-emerald-800',
        'furnace_operator': 'bg-green-100 text-green-800',
        'operator': 'bg-green-50 text-green-700',
        // Support - Indigo/Violet
        'safety_officer': 'bg-indigo-100 text-indigo-800',
        'quality_inspector': 'bg-slate-100 text-slate-700',
        'storekeeper': 'bg-violet-100 text-violet-800',
        // Transversal - Gris
        'viewer': 'bg-gray-100 text-gray-800'
    }), []);

    const getRoleLabel = React.useCallback((role) => {
        return ROLE_LABELS[role] || '👤 ' + role;
    }, [ROLE_LABELS]);

    const getRoleBadgeClass = React.useCallback((role) => {
        return ROLE_BADGE_COLORS[role] || 'bg-gray-100 text-gray-800';
    }, [ROLE_BADGE_COLORS]);

    const getLastLoginStatus = React.useCallback((lastLogin) => {
        if (!lastLogin) return {
            color: "text-gray-500",
            icon: "fa-circle",
            status: "Jamais connecte",
            time: "",
            dot: "bg-gray-400"
        };

        const now = getNowEST();
        const loginISO = lastLogin.includes('T') ? lastLogin : lastLogin.replace(' ', 'T');
        // Ajouter Z pour forcer interpretation UTC
        const loginUTC = new Date(loginISO + (loginISO.includes('Z') ? '' : 'Z'));
        // Appliquer l'offset EST/EDT
        const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
        const loginDate = new Date(loginUTC.getTime() + (offset * 60 * 60 * 1000));
        const diffMs = now - loginDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 5) {
            return {
                color: "text-green-600",
                icon: "fa-circle",
                status: "En ligne",
                time: "Actif maintenant",
                dot: "bg-green-500"
            };
        } else if (diffMins < 60) {
            return {
                color: "text-yellow-600",
                icon: "fa-circle",
                status: "Actif recemment",
                time: "Il y a " + diffMins + " min",
                dot: "bg-yellow-500"
            };
        } else if (diffHours < 24) {
            return {
                color: "text-blue-700",
                icon: "fa-circle",
                status: "Actif aujourd'hui",
                time: "Il y a " + diffHours + "h",
                dot: "bg-amber-600"
            };
        } else if (diffDays === 1) {
            return {
                color: "text-red-600",
                icon: "fa-circle",
                status: "Inactif",
                time: "Hier",
                dot: "bg-red-500"
            };
        } else {
            return {
                color: "text-red-600",
                icon: "fa-circle",
                status: "Inactif",
                time: "Il y a " + diffDays + " jours",
                dot: "bg-red-500"
            };
        }
    }, []);

    const canSeeLastLogin = React.useCallback((targetUser) => {
        // Admin voit tout le monde
        if (currentUser.role === "admin") return true;
        // Superviseur voit seulement les techniciens
        if (currentUser.role === "supervisor" && targetUser.role === "technician") return true;
        // Autres cas: non visible
        return false;
    }, [currentUser.role]);

    const handleDeleteUser = React.useCallback((userId, userName) => {
        setConfirmDialog({
            show: true,
            message: 'Etes-vous sur de vouloir supprimer ' + userName + ' ?',
            onConfirm: async () => {
                setConfirmDialog({ show: false, message: '', onConfirm: null });
                setButtonLoading('delete-' + userId);
                try {
                    await axios.delete(API_URL + '/users/' + userId);
                    setToast({ show: true, message: 'Utilisateur supprime avec succes!', type: 'success' });
                    loadUsers();
                } catch (error) {
                    setNotification({ show: true, message: 'Erreur: ' + (error.response?.data?.error || 'Erreur'), type: 'error' });
                } finally {
                    setButtonLoading(null);
                }
            }
        });
    }, [loadUsers]);

    const handleEditUser = React.useCallback((user) => {
        setEditingUser(user);
        setEditEmail(user.email);
        setEditFirstName(user.first_name || '');
        setEditLastName(user.last_name || '');
        setEditRole(user.role);
    }, []);

    const handleUpdateUser = React.useCallback(async (e) => {
        e.preventDefault();
        setButtonLoading('update');
        try {
            await axios.put(API_URL + '/users/' + editingUser.id, {
                email: editEmail,
                first_name: editFirstName,
                last_name: editLastName,
                role: editRole
            });
            setToast({ show: true, message: 'Utilisateur modifie avec succes!', type: 'success' });
            setEditingUser(null);
            loadUsers();
        } catch (error) {
            setNotification({ show: true, message: 'Erreur: ' + (error.response?.data?.error || 'Erreur'), type: 'error' });
        } finally {
            setButtonLoading(null);
        }
    }, [editingUser, editEmail, editFirstName, editLastName, editRole, loadUsers]);

    const handleResetPassword = React.useCallback((userId, userName) => {
        setPromptDialog({
            show: true,
            message: 'Nouveau mot de passe pour ' + userName + ':',
            onConfirm: async (newPass) => {
                setPromptDialog({ show: false, message: '', onConfirm: null });
                if (!newPass || newPass.length < 6) {
                    setNotification({ show: true, message: 'Mot de passe invalide (minimum 6 caracteres)', type: 'error' });
                    return;
                }
                try {
                    await axios.post(API_URL + '/users/' + userId + '/reset-password', {
                        new_password: newPass
                    });
                    setToast({ show: true, message: 'Mot de passe reinitialise avec succes!', type: 'success' });
                } catch (error) {
                    setNotification({ show: true, message: 'Erreur: ' + (error.response?.data?.error || 'Erreur'), type: 'error' });
                }
            }
        });
    }, []);

    if (!show || !currentUser) return null;

    return React.createElement('div', {
        className: 'fixed inset-0 bg-gradient-to-br from-slate-900/40 via-gray-900/40 to-slate-800/40 backdrop-blur-sm flex items-center justify-center z-[60] p-2 sm:p-4',
        onClick: onClose
    },
        React.createElement('div', {
            className: 'bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-5xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col',
            onClick: (e) => e.stopPropagation()
        },
            React.createElement('div', { className: 'sticky top-0 bg-gradient-to-r from-slate-700 to-gray-700 text-white p-3 sm:p-5 flex justify-between items-center shadow-xl z-10' },
                React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3 min-w-0' },
                    React.createElement('i', { className: 'fas fa-users-cog text-xl sm:text-2xl flex-shrink-0' }),
                    React.createElement('h2', { className: 'text-lg sm:text-2xl font-bold truncate' },
                        currentUser.role === 'technician' ? "Liste Équipe" : "Gestion des Utilisateurs"
                    )
                ),
                React.createElement('button', {
                    onClick: onClose,
                    className: 'text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all flex-shrink-0'
                },
                    React.createElement('i', { className: 'fas fa-times text-lg sm:text-xl' })
                )
            ),
            React.createElement('div', { className: 'flex-1 overflow-y-auto p-3 sm:p-6' },

            React.createElement('div', { className: 'mb-4 flex flex-col sm:flex-row gap-3' },
                // Bouton creer utilisateur (visible seulement pour admin/superviseur)
                (currentUser.role === 'admin' || currentUser.role === 'supervisor') ? React.createElement('button', {
                    onClick: () => setShowCreateForm(true),
                    className: 'px-6 py-3 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-xl font-bold transition-all shadow-[0_8px_16px_rgba(249,115,22,0.4),0_4px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_12px_24px_rgba(249,115,22,0.5),0_6px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:translate-y-0 active:shadow-[0_4px_8px_rgba(249,115,22,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)] border-t border-blue-300/50'
                }, "Créer un utilisateur") : null,
                React.createElement('div', { className: 'flex-1 relative' },
                    React.createElement('input', {
                        type: 'text',
                        id: 'userSearch',
                        name: 'userSearch',
                        autoComplete: 'off',
                        placeholder: 'Rechercher par nom ou email...',
                        value: searchQuery,
                        onChange: (e) => setSearchQuery(e.target.value),
                        className: 'w-full px-4 py-2 pl-10 bg-white/95 border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all',
                        onKeyDown: (e) => {
                            if (e.key === 'Escape') {
                                setSearchQuery('');
                            }
                        }
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

            showCreateForm ? React.createElement('div', {
                className: 'mb-6 p-6 bg-gradient-to-br from-blue-50/90 to-gray-50/90 backdrop-blur-sm rounded-xl shadow-lg border-2 border-blue-200/50 scroll-mt-4',
                ref: (el) => el && el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            },
                React.createElement('h3', { className: 'text-xl font-bold mb-4' }, 'Nouvel utilisateur'),
                React.createElement('form', { onSubmit: handleCreateUser },
                    React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4' },
                        React.createElement('div', {},
                            React.createElement('label', { className: 'block font-bold mb-2', htmlFor: 'newEmail' }, 'Email'),
                            React.createElement('input', {
                                type: 'email',
                                id: 'newEmail',
                                name: 'new_user_email',
                                autoComplete: 'off',
                                'data-lpignore': 'true',
                                value: newEmail,
                                onChange: (e) => handleInputAdminEmail(e, setNewEmail),
                                onInvalid: handleInvalidAdminField,
                                className: 'w-full px-3 py-2 bg-white/95 border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all',
                                required: true,
                                autoFocus: true
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', { className: 'block font-bold mb-2', htmlFor: 'newFirstName' }, 'Prénom'),
                            React.createElement('input', {
                                type: 'text',
                                id: 'newFirstName',
                                name: 'newFirstName',
                                autoComplete: 'off',
                                value: newFirstName,
                                onChange: (e) => handleInputAdminEmail(e, setNewFirstName),
                                onInvalid: handleInvalidAdminField,
                                className: 'w-full px-3 py-2 bg-white/95 border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all',
                                placeholder: 'Jean',
                                required: true
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', { className: 'block font-bold mb-2', htmlFor: 'newLastName' }, 'Nom (optionnel)'),
                            React.createElement('input', {
                                type: 'text',
                                id: 'newLastName',
                                name: 'newLastName',
                                autoComplete: 'off',
                                value: newLastName,
                                onChange: (e) => handleInputAdminEmail(e, setNewLastName),
                                onInvalid: handleInvalidAdminField,
                                className: 'w-full px-3 py-2 bg-white/95 border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all',
                                placeholder: 'Dupont'
                            })
                        )
                    ),
                    React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4' },
                        React.createElement('div', {},
                            React.createElement('label', { className: 'block font-bold mb-2', htmlFor: 'newPassword' }, 'Mot de passe'),
                            React.createElement('input', {
                                type: 'password',
                                id: 'newPassword',
                                name: 'new_user_password',
                                autoComplete: 'new-password',
                                'data-lpignore': 'true',
                                value: newPassword,
                                onChange: (e) => handleInputAdminEmail(e, setNewPassword),
                                onInvalid: handleInvalidAdminField,
                                className: 'w-full px-3 py-2 bg-white/95 border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all',
                                required: true,
                                minLength: 6
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', { className: 'block font-bold mb-2' }, "Rôle"),
                            React.createElement(RoleDropdown, {
                                value: newRole,
                                onChange: (e) => setNewRole(e.target.value),
                                disabled: false,
                                currentUserRole: currentUser.role
                            })
                        )
                    ),
                    React.createElement('div', { className: 'flex gap-4' },
                        React.createElement('button', {
                            type: 'button',
                            onClick: () => setShowCreateForm(false),
                            className: 'px-6 py-3 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 text-gray-800 rounded-xl font-bold transition-all shadow-[0_6px_12px_rgba(0,0,0,0.15),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(0,0,0,0.1)] border-t border-white/60'
                        }, 'Annuler'),
                        React.createElement('button', {
                            type: 'submit',
                            disabled: buttonLoading === 'create',
                            className: 'px-6 py-3 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-xl font-bold transition-all shadow-[0_8px_16px_rgba(249,115,22,0.4),0_4px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_12px_24px_rgba(249,115,22,0.5),0_6px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:translate-y-0 active:shadow-[0_4px_8px_rgba(249,115,22,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2 justify-center border-t border-blue-300/50'
                        },
                            buttonLoading === 'create' && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                            "Créer"
                        )
                    )
                )
            ) : null,

            editingUser ? React.createElement('div', {
                className: 'mb-6 p-6 bg-gradient-to-br from-green-50/90 to-emerald-50/90 backdrop-blur-sm rounded-xl shadow-lg border-2 border-green-200/50 scroll-mt-4',
                ref: (el) => el && el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            },
                React.createElement('h3', { className: 'text-xl font-bold mb-4' }, 'Modifier: ' + editingUser.full_name),
                React.createElement('form', { onSubmit: handleUpdateUser },
                    React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4' },
                        React.createElement('div', {},
                            React.createElement('label', { className: 'block font-bold mb-2', htmlFor: 'editEmail' }, 'Email'),
                            React.createElement('input', {
                                type: 'email',
                                id: 'editEmail',
                                name: 'editEmail',
                                autoComplete: 'off',
                                value: editEmail,
                                onChange: (e) => handleInputAdminEmail(e, setEditEmail),
                                onInvalid: handleInvalidAdminField,
                                className: 'w-full px-3 py-2 bg-white/95 border-2 border-gray-300 rounded-lg shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all',
                                required: true,
                                autoFocus: true
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', { className: 'block font-bold mb-2', htmlFor: 'editFirstName' }, 'Prénom'),
                            React.createElement('input', {
                                type: 'text',
                                id: 'editFirstName',
                                name: 'editFirstName',
                                autoComplete: 'off',
                                value: editFirstName,
                                onChange: (e) => handleInputAdminEmail(e, setEditFirstName),
                                onInvalid: handleInvalidAdminField,
                                className: 'w-full px-3 py-2 bg-white/95 border-2 border-gray-300 rounded-lg shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all',
                                placeholder: 'Jean',
                                required: true
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', { className: 'block font-bold mb-2', htmlFor: 'editLastName' }, 'Nom (optionnel)'),
                            React.createElement('input', {
                                type: 'text',
                                id: 'editLastName',
                                name: 'editLastName',
                                autoComplete: 'off',
                                value: editLastName,
                                onChange: (e) => handleInputAdminEmail(e, setEditLastName),
                                onInvalid: handleInvalidAdminField,
                                className: 'w-full px-3 py-2 bg-white/95 border-2 border-gray-300 rounded-lg shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all',
                                placeholder: 'Dupont'
                            })
                        )
                    ),
                    React.createElement('div', { className: 'mb-4' },
                        React.createElement('label', { className: 'block font-bold mb-2' }, "Rôle"),
                        React.createElement(RoleDropdown, {
                            value: editRole,
                            onChange: (e) => setEditRole(e.target.value),
                            disabled: editingUser?.id === currentUser.id || (currentUser.role === 'supervisor' && editingUser?.role === 'admin'),
                            currentUserRole: currentUser.role,
                            variant: 'green'
                        })
                    ),
                    React.createElement('div', { className: 'flex gap-4' },
                        React.createElement('button', {
                            type: 'button',
                            onClick: () => setEditingUser(null),
                            className: 'px-6 py-3 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 text-gray-800 rounded-xl font-bold transition-all shadow-[0_6px_12px_rgba(0,0,0,0.15),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(0,0,0,0.1)] border-t border-white/60'
                        }, 'Annuler'),
                        React.createElement('button', {
                            type: 'submit',
                            disabled: buttonLoading === 'update',
                            className: 'px-6 py-3 bg-gradient-to-br from-green-400 via-green-500 to-green-600 text-white rounded-xl font-bold transition-all shadow-[0_8px_16px_rgba(34,197,94,0.4),0_4px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_12px_24px_rgba(34,197,94,0.5),0_6px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:translate-y-0 active:shadow-[0_4px_8px_rgba(34,197,94,0.3),inset_0_2px_4px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2 justify-center border-t border-green-300/50'
                        },
                            buttonLoading === 'update' && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                            'Enregistrer'
                        )
                    )
                )
            ) : null,

            loading ? React.createElement('p', { className: 'text-center py-8' }, 'Chargement...') :
            React.createElement('div', { className: 'space-y-4' },
                React.createElement('p', { className: 'text-lg mb-4' },
                    (searchQuery ?
                        (users || []).filter(u =>
                            (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
                        ).length + ' résultat(s) sur ' + (users || []).length :
                        (users || []).length + ' utilisateur(s)'
                    )
                ),
                (users || [])
                    .filter(user => !searchQuery ||
                        (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (user.email || '').toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(user =>
                    React.createElement('div', {
                        key: user.id,
                        className: 'bg-white/95 rounded-xl p-4 shadow-md border-2 border-gray-200/50 hover:border-blue-400 hover:shadow-lg transition-shadow duration-200'
                    },
                        React.createElement('div', { className: 'flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3' },
                            React.createElement('div', { className: 'flex-1' },
                                React.createElement('div', { className: 'flex items-center gap-3 mb-2' },
                                    React.createElement('h4', { className: 'font-bold text-lg' }, user.full_name),
                                    React.createElement('span', {
                                        className: 'px-3 py-1 rounded-full text-xs font-semibold ' + getRoleBadgeClass(user.role)
                                    }, getRoleLabel(user.role))
                                ),
                                React.createElement('p', { className: 'text-sm text-gray-600' },
                                    React.createElement('i', { className: 'fas fa-envelope mr-2' }),
                                    user.email
                                ),
                                React.createElement('p', { className: 'text-xs text-gray-500 mt-1' },
                                    React.createElement('i', { className: 'far fa-clock mr-2' }),
                                    'Créé le: ' + formatDateEST(user.created_at, false)
                                ),
                                canSeeLastLogin(user) ? React.createElement('div', { className: "flex flex-col gap-1 mt-2 pt-2 border-t border-gray-200" },
                                    React.createElement('div', { className: "flex items-center gap-1.5" },
                                        React.createElement('div', {
                                            className: "w-2 h-2 rounded-full " + getLastLoginStatus(user.last_login).dot
                                        }),
                                        React.createElement('span', {
                                            className: "text-xs font-bold " + getLastLoginStatus(user.last_login).color
                                        }, getLastLoginStatus(user.last_login).status),
                                        getLastLoginStatus(user.last_login).time ? React.createElement('span', {
                                            className: "text-xs " + getLastLoginStatus(user.last_login).color
                                        }, " - " + getLastLoginStatus(user.last_login).time) : null
                                    ),
                                    user.last_login ? React.createElement('span', { className: "text-xs text-gray-400 ml-3.5" },
                                        "Derniere connexion: " + formatDateEST(user.last_login, true)
                                    ) : null
                                ) : null
                            ),
                            React.createElement('div', { className: "flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0" },
                                user.id !== currentUser.id && onOpenMessage ? React.createElement('button', {
                                    onClick: () => onOpenMessage({ id: user.id, full_name: user.full_name, role: user.role }),
                                    className: "w-full sm:w-auto px-4 py-2.5 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-lg font-bold text-sm transition-all shadow-[0_6px_12px_rgba(99,102,241,0.35),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_8px_16px_rgba(99,102,241,0.45),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_3px_6px_rgba(99,102,241,0.3),inset_0_2px_4px_rgba(0,0,0,0.15)] border-t border-blue-300/50"
                                },
                                    React.createElement('i', { className: "fas fa-comment mr-1" }),
                                    "Message"
                                ) : null,
                                // Permettre de modifier son propre profil OU les autres utilisateurs (avec restrictions)
                                ((user.id === currentUser.id) || (user.id !== currentUser.id && !(currentUser.role === 'supervisor' && user.role === 'admin') && currentUser.role !== 'technician')) ? React.createElement(React.Fragment, null,
                                    React.createElement('button', {
                                        onClick: () => handleEditUser(user),
                                    className: 'w-full sm:w-auto px-4 py-2.5 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 text-white rounded-lg font-bold text-sm transition-all shadow-[0_6px_12px_rgba(59,130,246,0.35),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_8px_16px_rgba(59,130,246,0.45),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_3px_6px_rgba(59,130,246,0.3),inset_0_2px_4px_rgba(0,0,0,0.15)] border-t border-blue-300/50'
                                },
                                    React.createElement('i', { className: 'fas fa-edit mr-1' }),
                                    'Modifier'
                                ),
                                React.createElement('button', {
                                    onClick: () => handleResetPassword(user.id, user.full_name),
                                    className: 'w-full sm:w-auto px-4 py-2.5 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white rounded-lg font-bold text-sm transition-all shadow-[0_6px_12px_rgba(234,179,8,0.35),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_8px_16px_rgba(234,179,8,0.45),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_3px_6px_rgba(234,179,8,0.3),inset_0_2px_4px_rgba(0,0,0,0.15)] border-t border-yellow-300/50'
                                },
                                    React.createElement('i', { className: 'fas fa-key mr-1' }),
                                    'MdP'
                                ),
                                // Ne pas permettre de supprimer son propre compte
                                user.id !== currentUser.id ? React.createElement('button', {
                                    onClick: () => handleDeleteUser(user.id, user.full_name),
                                    className: 'w-full sm:w-auto px-4 py-2.5 bg-gradient-to-br from-red-400 via-red-500 to-red-600 text-white rounded-lg font-bold text-sm transition-all shadow-[0_6px_12px_rgba(239,68,68,0.35),0_3px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_8px_16px_rgba(239,68,68,0.45),0_4px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_3px_6px_rgba(239,68,68,0.3),inset_0_2px_4px_rgba(0,0,0,0.15)] border-t border-red-300/50'
                                },
                                    React.createElement('i', { className: 'fas fa-trash mr-1' }),
                                    'Supprimer'
                                ) : null
                            ) : null)
                        )
                    )
                )
            ),
            React.createElement(NotificationModal, {
                show: notification.show,
                message: notification.message,
                type: notification.type,
                onClose: () => setNotification({ show: false, message: '', type: 'info' })
            }),
            React.createElement(ConfirmModal, {
                show: confirmDialog.show,
                message: confirmDialog.message,
                onConfirm: confirmDialog.onConfirm,
                onCancel: () => setConfirmDialog({ show: false, message: '', onConfirm: null })
            }),
            React.createElement(PromptModal, {
                show: promptDialog.show,
                message: promptDialog.message,
                onConfirm: promptDialog.onConfirm,
                onCancel: () => setPromptDialog({ show: false, message: '', onConfirm: null })
            }),
            React.createElement(Toast, {
                show: toast.show,
                message: toast.message,
                type: toast.type,
                onClose: () => setToast({ show: false, message: '', type: 'success' })
            })
            )
        )
    );
};
