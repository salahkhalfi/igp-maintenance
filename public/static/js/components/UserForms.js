const CreateUserForm = ({ onCancel, onSuccess, currentUserRole }) => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [firstName, setFirstName] = React.useState('');
    const [lastName, setLastName] = React.useState('');
    const [role, setRole] = React.useState('operator');
    const [aiContext, setAiContext] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const payload = {
            email,
            password,
            first_name: firstName,
            last_name: lastName,
            role,
            ai_context: aiContext || ''  // Envoyer chaîne vide au lieu de null
        };
        
        try {
            await axios.post(API_URL + '/users', payload);
            // Reset form is not strictly needed as component will likely be unmounted
            onSuccess();
        } catch (error) {
            const errMsg = error.response?.data?.error || 'Erreur lors de la création';
            const errField = error.response?.data?.field || '';
            alert('Erreur: ' + errMsg + (errField ? ` (champ: ${errField})` : ''));
        } finally {
            setLoading(false);
        }
    };

    const handleInvalidField = (e) => e.target.setCustomValidity("Veuillez remplir ce champ.");
    const handleInput = (e, setter) => {
        e.target.setCustomValidity("");
        setter(e.target.value);
    };

    return React.createElement('div', {
        className: 'mb-6 p-6 bg-gradient-to-br from-blue-50 to-gray-50 rounded-xl shadow-lg border-2 border-blue-200/50 scroll-mt-4',
        ref: (el) => el && el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    },
        React.createElement('h3', { className: 'text-xl font-bold mb-4' }, 'Nouvel utilisateur'),
        React.createElement('form', { onSubmit: handleSubmit },
            React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4' },
                React.createElement('div', {},
                    React.createElement('label', { className: 'block font-bold mb-2', htmlFor: 'newEmail' }, 'Email'),
                    React.createElement('input', {
                        type: 'email',
                        id: 'newEmail',
                        name: 'new_user_email',
                        autoComplete: 'off',
                        'data-lpignore': 'true',
                        value: email,
                        onChange: (e) => handleInput(e, setEmail),
                        onInvalid: handleInvalidField,
                        className: 'w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all',
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
                        value: firstName,
                        onChange: (e) => handleInput(e, setFirstName),
                        onInvalid: handleInvalidField,
                        className: 'w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all',
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
                        value: lastName,
                        onChange: (e) => handleInput(e, setLastName),
                        onInvalid: handleInvalidField,
                        className: 'w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all',
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
                        value: password,
                        onChange: (e) => handleInput(e, setPassword),
                        onInvalid: handleInvalidField,
                        className: 'w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all',
                        required: true,
                        minLength: 8,
                        placeholder: 'Min. 8 caractères'
                    })
                ),
                React.createElement('div', {},
                    React.createElement('label', { className: 'block font-bold mb-2' }, "Rôle"),
                    React.createElement(RoleDropdown, {
                        value: role,
                        onChange: (e) => setRole(e.target.value),
                        disabled: false,
                        currentUserRole: currentUserRole
                    })
                )
            ),
            // Champ Informations complémentaires (pour IA)
            React.createElement('div', { className: 'mb-4' },
                React.createElement('label', { className: 'block font-bold mb-2', htmlFor: 'newAiContext' }, 
                    React.createElement('span', {}, 'Informations complémentaires '),
                    React.createElement('span', { className: 'text-gray-400 font-normal text-sm' }, '(optionnel)')
                ),
                React.createElement('textarea', {
                    id: 'newAiContext',
                    name: 'newAiContext',
                    value: aiContext,
                    onChange: (e) => setAiContext(e.target.value),
                    className: 'w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none',
                    placeholder: 'Ex: Expert hydraulique, Certification BR, Travaille de nuit...',
                    rows: 2,
                    maxLength: 500
                }),
                React.createElement('p', { className: 'text-xs text-gray-400 mt-1' }, `Ces informations permettent de personnaliser les interactions avec l'assistant.`)
            ),
            React.createElement('div', { className: 'flex gap-4' },
                React.createElement('button', {
                    type: 'button',
                    onClick: onCancel,
                    className: 'px-6 py-3 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 text-gray-800 rounded-xl font-bold transition-all shadow-md border-t border-white/60'
                }, 'Annuler'),
                React.createElement('button', {
                    type: 'submit',
                    disabled: loading,
                    className: 'px-6 py-3 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-xl font-bold transition-all shadow-md border-t border-blue-300/50 flex items-center gap-2 justify-center'
                },
                    loading && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                    "Créer"
                )
            )
        )
    );
};

const EditUserForm = ({ user, onCancel, onSuccess, currentUserRole, currentUserId }) => {
    const [email, setEmail] = React.useState(user.email);
    const [firstName, setFirstName] = React.useState(user.first_name || '');
    const [lastName, setLastName] = React.useState(user.last_name || '');
    const [role, setRole] = React.useState(user.role);
    const [aiContext, setAiContext] = React.useState(user.ai_context || '');
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.put(API_URL + '/users/' + user.id, {
                email,
                first_name: firstName,
                last_name: lastName,
                role,
                ai_context: aiContext || ''  // Envoyer chaîne vide au lieu de null
            });
            onSuccess();
        } catch (error) {
            alert('Erreur: ' + (error.response?.data?.error || 'Erreur'));
        } finally {
            setLoading(false);
        }
    };

    const handleInvalidField = (e) => e.target.setCustomValidity("Veuillez remplir ce champ.");
    const handleInput = (e, setter) => {
        e.target.setCustomValidity("");
        setter(e.target.value);
    };

    return React.createElement('div', {
        className: 'mb-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg border-2 border-green-200/50 scroll-mt-4',
        ref: (el) => el && el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    },
        React.createElement('h3', { className: 'text-xl font-bold mb-4' }, 'Modifier: ' + user.full_name),
        React.createElement('form', { onSubmit: handleSubmit },
            React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4' },
                React.createElement('div', {},
                    React.createElement('label', { className: 'block font-bold mb-2', htmlFor: 'editEmail' }, 'Email'),
                    React.createElement('input', {
                        type: 'email',
                        id: 'editEmail',
                        name: 'editEmail',
                        autoComplete: 'off',
                        value: email,
                        onChange: (e) => handleInput(e, setEmail),
                        onInvalid: handleInvalidField,
                        className: 'w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all',
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
                        value: firstName,
                        onChange: (e) => handleInput(e, setFirstName),
                        onInvalid: handleInvalidField,
                        className: 'w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all',
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
                        value: lastName,
                        onChange: (e) => handleInput(e, setLastName),
                        onInvalid: handleInvalidField,
                        className: 'w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all',
                        placeholder: 'Dupont'
                    })
                )
            ),
            React.createElement('div', { className: 'mb-4' },
                React.createElement('label', { className: 'block font-bold mb-2' }, "Rôle"),
                React.createElement(RoleDropdown, {
                    value: role,
                    onChange: (e) => setRole(e.target.value),
                    disabled: user.id === currentUserId || (currentUserRole === 'supervisor' && user.role === 'admin'),
                    currentUserRole: currentUserRole,
                    variant: 'green'
                })
            ),
            // Champ Informations complémentaires (pour IA)
            React.createElement('div', { className: 'mb-4' },
                React.createElement('label', { className: 'block font-bold mb-2', htmlFor: 'editAiContext' }, 
                    React.createElement('span', {}, 'Informations complémentaires '),
                    React.createElement('span', { className: 'text-gray-400 font-normal text-sm' }, '(optionnel)')
                ),
                React.createElement('textarea', {
                    id: 'editAiContext',
                    name: 'editAiContext',
                    value: aiContext,
                    onChange: (e) => setAiContext(e.target.value),
                    className: 'w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all resize-none',
                    placeholder: 'Ex: Expert hydraulique, Certification BR, Travaille de nuit...',
                    rows: 2,
                    maxLength: 500
                }),
                React.createElement('p', { className: 'text-xs text-gray-400 mt-1' }, `Ces informations permettent de personnaliser les interactions avec l'assistant.`)
            ),
            React.createElement('div', { className: 'flex gap-4' },
                React.createElement('button', {
                    type: 'button',
                    onClick: onCancel,
                    className: 'px-6 py-3 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 text-gray-800 rounded-xl font-bold transition-all shadow-md border-t border-white/60'
                }, 'Annuler'),
                React.createElement('button', {
                    type: 'submit',
                    disabled: loading,
                    className: 'px-6 py-3 bg-gradient-to-br from-green-400 via-green-500 to-green-600 text-white rounded-xl font-bold transition-all shadow-md border-t border-green-300/50 flex items-center gap-2 justify-center'
                },
                    loading && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
                    'Enregistrer'
                )
            )
        )
    );
};

window.CreateUserForm = CreateUserForm;
window.EditUserForm = EditUserForm;
