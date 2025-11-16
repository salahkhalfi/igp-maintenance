// Composant de gestion des utilisateurs
// Ce fichier sera importé dans index.tsx

export const UserManagementModal = ({ show, onClose, currentUser, API_URL, axios, React }: any) => {
    const [users, setUsers] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showCreateForm, setShowCreateForm] = React.useState(false);

    // Formulaire de création
    const [newEmail, setNewEmail] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [newFullName, setNewFullName] = React.useState('');
    const [newRole, setNewRole] = React.useState('operator');

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
        } catch (error: any) {
            alert('Erreur: ' + (error.response?.data?.error || 'Erreur inconnue'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: any) => {
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

            alert('Utilisateur créé avec succès');
            setNewEmail('');
            setNewPassword('');
            setNewFullName('');
            setNewRole('operator');
            setShowCreateForm(false);
            loadUsers();
        } catch (error: any) {
            alert('Erreur: ' + (error.response?.data?.error || 'Erreur inconnue'));
        }
    };

    const handleDeleteUser = async (user: any) => {
        if (!confirm(`Supprimer ${user.full_name} (${user.email}) ?`)) {
            return;
        }

        try {
            await axios.delete(API_URL + '/users/' + user.id);
            alert('Utilisateur supprimé');
            loadUsers();
        } catch (error: any) {
            alert('Erreur: ' + (error.response?.data?.error || 'Erreur inconnue'));
        }
    };

    if (!show) return null;

    return React.createElement('div', {
        className: 'modal active',
        onClick: onClose
    },
        React.createElement('div', {
            className: 'bg-white rounded-lg p-6 max-w-4xl w-full mx-4 my-auto',
            onClick: (e: any) => e.stopPropagation(),
            style: { maxHeight: '90vh', overflowY: 'auto' }
        },
            // Header
            React.createElement('div', { className: 'flex justify-between items-center mb-6' },
                React.createElement('h2', { className: 'text-2xl font-bold text-igp-blue' },
                    React.createElement('i', { className: 'fas fa-users mr-2' }),
                    'Gestion des Utilisateurs'
                ),
                React.createElement('button', {
                    onClick: onClose,
                    className: 'text-gray-500 hover:text-gray-700'
                },
                    React.createElement('i', { className: 'fas fa-times fa-2x' })
                )
            ),

            // Bouton créer
            !showCreateForm ? React.createElement('div', { className: 'mb-6' },
                React.createElement('button', {
                    onClick: () => setShowCreateForm(true),
                    className: 'px-6 py-3 bg-igp-orange text-white rounded-md hover:bg-orange-700 font-semibold'
                },
                    React.createElement('i', { className: 'fas fa-user-plus mr-2' }),
                    'Créer un utilisateur'
                )
            ) : null,

            // Formulaire création
            showCreateForm ? React.createElement('div', { className: 'mb-6 bg-blue-50 p-6 rounded-lg' },
                React.createElement('h3', { className: 'text-xl font-bold mb-4' }, 'Nouvel utilisateur'),
                React.createElement('form', { onSubmit: handleCreateUser },
                    React.createElement('div', { className: 'grid grid-cols-2 gap-4 mb-4' },
                        React.createElement('div', {},
                            React.createElement('label', { className: 'block mb-2' }, 'Email'),
                            React.createElement('input', {
                                type: 'email',
                                value: newEmail,
                                onChange: (e: any) => setNewEmail(e.target.value),
                                className: 'w-full px-3 py-2 border rounded-md',
                                required: true
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', { className: 'block mb-2' }, 'Nom complet'),
                            React.createElement('input', {
                                type: 'text',
                                value: newFullName,
                                onChange: (e: any) => setNewFullName(e.target.value),
                                className: 'w-full px-3 py-2 border rounded-md',
                                required: true
                            })
                        )
                    ),
                    React.createElement('div', { className: 'grid grid-cols-2 gap-4 mb-4' },
                        React.createElement('div', {},
                            React.createElement('label', { className: 'block mb-2' }, 'Mot de passe'),
                            React.createElement('input', {
                                type: 'password',
                                value: newPassword,
                                onChange: (e: any) => setNewPassword(e.target.value),
                                className: 'w-full px-3 py-2 border rounded-md',
                                required: true,
                                minLength: 6
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', { className: 'block mb-2' }, 'Rôle'),
                            React.createElement('select', {
                                value: newRole,
                                onChange: (e: any) => setNewRole(e.target.value),
                                className: 'w-full px-3 py-2 border rounded-md'
                            },
                                React.createElement('option', { value: 'operator' }, 'Opérateur'),
                                React.createElement('option', { value: 'technician' }, 'Technicien'),
                                React.createElement('option', { value: 'admin' }, 'Administrateur')
                            )
                        )
                    ),
                    React.createElement('div', { className: 'flex justify-end gap-4' },
                        React.createElement('button', {
                            type: 'button',
                            onClick: () => setShowCreateForm(false),
                            className: 'px-6 py-2 border rounded-md'
                        }, 'Annuler'),
                        React.createElement('button', {
                            type: 'submit',
                            className: 'px-6 py-2 bg-igp-orange text-white rounded-md'
                        }, 'Créer')
                    )
                )
            ) : null,

            // Liste des utilisateurs
            loading ? React.createElement('p', {}, 'Chargement...') :
            React.createElement('div', { className: 'space-y-4' },
                React.createElement('h3', { className: 'text-lg font-bold mb-4' },
                    'Utilisateurs (' + users.length + ')'
                ),
                users.map((user: any) =>
                    React.createElement('div', {
                        key: user.id,
                        className: 'bg-gray-50 rounded-lg p-4 flex justify-between items-center'
                    },
                        React.createElement('div', {},
                            React.createElement('h4', { className: 'font-bold' }, user.full_name),
                            React.createElement('p', { className: 'text-sm text-gray-600' }, user.email),
                            React.createElement('p', { className: 'text-sm' },
                                'Rôle: ' + user.role
                            )
                        ),
                        currentUser.userId !== user.id ? React.createElement('button', {
                            onClick: () => handleDeleteUser(user),
                            className: 'px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600'
                        },
                            React.createElement('i', { className: 'fas fa-trash mr-1' }),
                            'Supprimer'
                        ) : null
                    )
                )
            )
        )
    );
};
