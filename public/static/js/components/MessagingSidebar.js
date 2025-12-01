const MessagingSidebar = ({ 
    conversations, 
    availableUsers, 
    selectedContact, 
    onSelectContact 
}) => {
    const getRoleBadgeClass = (role) => {
        const colors = {
            'admin': 'bg-red-100 text-red-700', 'director': 'bg-red-50 text-red-600',
            'supervisor': 'bg-yellow-100 text-yellow-700', 'coordinator': 'bg-amber-100 text-amber-700', 'planner': 'bg-amber-100 text-amber-700',
            'senior_technician': 'bg-blue-100 text-blue-700', 'technician': 'bg-blue-50 text-blue-600',
            'team_leader': 'bg-emerald-100 text-emerald-700', 'furnace_operator': 'bg-green-100 text-green-700', 'operator': 'bg-green-50 text-green-600',
            'safety_officer': 'bg-blue-100 text-blue-700', 'quality_inspector': 'bg-slate-100 text-slate-700', 'storekeeper': 'bg-violet-100 text-violet-700',
            'viewer': 'bg-gray-100 text-gray-700'
        };
        return colors[role] || 'bg-gray-100 text-gray-700';
    };

    const getRoleLabel = (role) => {
        const labels = {
            'admin': 'Admin', 'director': 'Directeur', 'supervisor': 'Superviseur', 'coordinator': 'Coordonnateur', 'planner': 'Planificateur',
            'senior_technician': 'Tech. Senior', 'technician': 'Technicien', 'team_leader': 'Chef Équipe', 'furnace_operator': 'Op. Four', 'operator': 'Opérateur',
            'safety_officer': 'Agent SST', 'quality_inspector': 'Insp. Qualité', 'storekeeper': 'Magasinier', 'viewer': 'Lecture Seule'
        };
        return labels[role] || role;
    };

    return React.createElement('div', { className: (selectedContact ? 'hidden sm:flex ' : 'flex ') + 'w-full sm:w-80 md:w-96 border-r border-gray-200 flex-col bg-gray-50 flex-shrink-0' },
        React.createElement('div', { className: 'p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50 shadow-sm' },
            React.createElement('h3', { className: 'font-semibold text-gray-700 text-sm sm:text-base mb-2 flex items-center gap-2' },
                React.createElement('i', { className: 'fas fa-address-book text-indigo-600' }),
                'Contacts'
            ),
            React.createElement('select', {
                onChange: (e) => {
                    const userId = parseInt(e.target.value);
                    if (!userId) {
                        e.target.value = '';
                        return;
                    }
                    const user = availableUsers.find(u => u.id === userId);
                    if (user) {
                        onSelectContact(user);
                    }
                    e.target.value = '';
                },
                className: "w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border-2 border-blue-300 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all hover:shadow-xl cursor-pointer font-semibold text-xs sm:text-sm appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%236366f1%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22M6 8l4 4 4-4%22/%3E%3C/svg%3E')] bg-[position:right_0.5rem_center] bg-[size:1.5em_1.5em] bg-no-repeat pr-10",
                style: { boxShadow: '0 6px 20px rgba(99, 102, 241, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.5)' },
                value: ''
            },
                React.createElement('option', { value: '', disabled: true }, '📝 Nouvelle conversation...'),
                React.createElement('option', { value: '0' }, '❌ Fermer ce menu'),
                availableUsers.map(user => React.createElement('option', {
                    key: user.id,
                    value: user.id
                }, user.full_name + ' (' + getRoleLabel(user.role) + ')'))
            )
        ),
        React.createElement('div', { className: 'flex-1 overflow-y-auto' },
            conversations.length === 0 ? React.createElement('div', {
                className: 'text-center text-gray-500 py-8 px-4'
            },
                React.createElement('i', { className: 'fas fa-comments text-5xl mb-3 text-gray-300' }),
                React.createElement('p', { className: 'text-sm font-semibold mb-2' }, 'Aucune conversation'),
                React.createElement('p', { className: 'text-xs text-gray-400' },
                    'Utilisez le menu ci-dessus pour démarrer une nouvelle conversation'
                ),
                React.createElement('div', { className: 'mt-3 text-indigo-600' },
                    React.createElement('i', { className: 'fas fa-arrow-up mr-1' }),
                    React.createElement('span', { className: 'text-xs font-semibold' }, 'Nouvelle conversation...')
                )
            ) : conversations.map(conv => React.createElement('div', {
                key: conv.contact_id,
                onClick: () => {
                    onSelectContact({ id: conv.contact_id, first_name: conv.contact_name, role: conv.contact_role });
                },
                className: 'p-2 sm:p-3 border-b border-gray-200 cursor-pointer hover:bg-indigo-50 transition-all active:scale-95 ' +
                    (selectedContact?.id === conv.contact_id ? 'bg-indigo-100 border-l-4 border-l-indigo-600 shadow-sm' : 'bg-white hover:border-l-4 hover:border-l-indigo-300')
            },
                React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                    React.createElement('div', {
                        className: 'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0 shadow-md'
                    }, conv.contact_name ? conv.contact_name.charAt(0).toUpperCase() : '?'),
                    React.createElement('div', { className: 'flex-1 min-w-0' },
                        React.createElement('div', { className: 'flex items-center gap-1 sm:gap-2' },
                            React.createElement('span', { className: 'font-semibold text-xs sm:text-sm text-gray-800 truncate' }, conv.contact_name),
                            conv.unread_count > 0 ? React.createElement('span', {
                                className: 'bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 animate-pulse'
                            }, conv.unread_count) : null
                        ),
                        React.createElement('p', {
                            className: 'text-xs text-gray-500 truncate'
                        }, conv.last_message || 'Commencer la conversation')
                    )
                )
            ))
        )
    );
};

window.MessagingSidebar = MessagingSidebar;
