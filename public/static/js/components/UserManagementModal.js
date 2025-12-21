// Composant de gestion des utilisateurs (OPTIMISÉ POUR PERFORMANCES CHROME/MAC)
const UserManagementModal = ({ show, onClose, currentUser, onOpenMessage }) => {
    const [users, setUsers] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showCreateForm, setShowCreateForm] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState(null);
    
    const [notification, setNotification] = React.useState({ show: false, message: '', type: 'info' });
    const [confirmDialog, setConfirmDialog] = React.useState({ show: false, message: '', onConfirm: null });
    const [promptDialog, setPromptDialog] = React.useState({ show: false, message: '', onConfirm: null });
    const [toast, setToast] = React.useState({ show: false, message: '', type: 'success' });

    React.useEffect(() => {
        if (show) {
            loadUsers(); 
            // Polling toutes les 2 minutes
            const interval = setInterval(() => {
                loadUsers(true); 
            }, 120000); 

            return () => clearInterval(interval);
        }
    }, [show]);

    // Reset edit form states when modal is closed
    React.useEffect(() => {
        if (!show) {
            setEditingUser(null);
            setShowCreateForm(false);
        }
    }, [show]);

    React.useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                if (promptDialog.show) setPromptDialog({ show: false, message: '', onConfirm: null });
                else if (confirmDialog.show) setConfirmDialog({ show: false, message: '', onConfirm: null });
                else if (notification.show) setNotification({ show: false, message: '', type: 'info' });
                else if (editingUser) setEditingUser(null);
                else if (showCreateForm) setShowCreateForm(false);
                else if (show) onClose();
            }
        };

        if (show) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [show, promptDialog.show, confirmDialog.show, notification.show, editingUser, showCreateForm]);

    const loadUsers = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const endpoint = '/users/team';
            const response = await axios.get(API_URL + endpoint);
            setUsers(Array.isArray(response.data.users) ? response.data.users : []);
        } catch (error) {
            if (!silent) {
                console.error("Erreur chargement utilisateurs:", error);
                setNotification({ show: true, message: 'Erreur chargement: ' + (error.response?.data?.error || error.message || 'Erreur'), type: 'error' });
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleCreateSuccess = () => {
        setToast({ show: true, message: 'Utilisateur créé avec succès!', type: 'success' });
        setShowCreateForm(false);
        loadUsers();
    };

    const handleUpdateSuccess = () => {
        setToast({ show: true, message: 'Utilisateur modifié avec succès!', type: 'success' });
        setEditingUser(null);
        loadUsers();
    };

    const handleDeleteUser = React.useCallback((userId, userName) => {
        setConfirmDialog({
            show: true,
            message: 'Êtes-vous sûr de vouloir supprimer ' + userName + ' ?',
            onConfirm: async () => {
                setConfirmDialog({ show: false, message: '', onConfirm: null });
                try {
                    await axios.delete(API_URL + '/users/' + userId);
                    setToast({ show: true, message: 'Utilisateur supprimé avec succès!', type: 'success' });
                    loadUsers();
                } catch (error) {
                    setNotification({ show: true, message: 'Erreur: ' + (error.response?.data?.error || 'Erreur'), type: 'error' });
                }
            }
        });
    }, [loadUsers]);

    const handleResetPassword = React.useCallback((userId, userName) => {
        setPromptDialog({
            show: true,
            message: 'Nouveau mot de passe pour ' + userName + ':',
            onConfirm: async (newPass) => {
                setPromptDialog({ show: false, message: '', onConfirm: null });
                if (!newPass || newPass.length < 6) {
                    setNotification({ show: true, message: 'Mot de passe invalide (minimum 6 caractères)', type: 'error' });
                    return;
                }
                try {
                    await axios.post(API_URL + '/users/' + userId + '/reset-password', {
                        new_password: newPass
                    });
                    setToast({ show: true, message: 'Mot de passe réinitialisé avec succès!', type: 'success' });
                } catch (error) {
                    setNotification({ show: true, message: 'Erreur: ' + (error.response?.data?.error || 'Erreur'), type: 'error' });
                }
            }
        });
    }, []);

    if (!show || !currentUser) return null;

    return React.createElement('div', {
        className: 'fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[60] p-2 sm:p-4',
        onClick: onClose
    },
        React.createElement('div', {
            className: 'bg-white rounded-xl shadow-lg w-full max-w-5xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col',
            onClick: (e) => e.stopPropagation()
        },
            React.createElement('div', { className: 'sticky top-0 bg-slate-800 text-white p-3 sm:p-5 flex justify-between items-center z-10' },
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
                showCreateForm ? React.createElement(CreateUserForm, {
                    onCancel: () => setShowCreateForm(false),
                    onSuccess: handleCreateSuccess,
                    currentUserRole: currentUser.role
                }) : null,

                editingUser ? React.createElement(EditUserForm, {
                    user: editingUser,
                    onCancel: () => setEditingUser(null),
                    onSuccess: handleUpdateSuccess,
                    currentUserRole: currentUser.role,
                    currentUserId: currentUser.id
                }) : null,

                loading ? React.createElement('p', { className: 'text-center py-8' }, 'Chargement...') :
                React.createElement(UserList, {
                    users: users,
                    currentUser: currentUser,
                    onEdit: setEditingUser,
                    onDelete: handleDeleteUser,
                    onResetPassword: handleResetPassword,
                    onOpenMessage: onOpenMessage,
                    onCreate: () => setShowCreateForm(true)
                })
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
    );
};
