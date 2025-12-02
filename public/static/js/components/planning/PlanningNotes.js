// Composant : Panneau Latéral "Notes & Rappels"
const PlanningNotes = ({ notes, showMobile, onCloseMobile, onAdd, onToggle, onDelete, notificationPerm, onRequestPerm }) => {
    return React.createElement('div', { className: `${showMobile ? 'absolute inset-0 z-50' : 'hidden'} lg:relative lg:flex lg:w-80 bg-white border-l border-gray-200 flex-col shadow-xl transition-all` },
        React.createElement('div', { className: 'p-5 border-b bg-slate-50 flex justify-between items-center' },
            React.createElement('h3', { className: 'font-bold text-slate-800 flex items-center gap-2' },
                React.createElement('div', { className: 'w-6 h-6 rounded bg-yellow-100 text-yellow-600 flex items-center justify-center' },
                    React.createElement('i', { className: 'fas fa-sticky-note text-xs' })
                ),
                'Notes & Rappels'
            ),
            // Notification Toggle
            React.createElement('button', {
                onClick: onRequestPerm,
                title: notificationPerm === 'granted' ? 'Notifications actives' : 'Activer les notifications',
                className: `w-8 h-8 rounded-full flex items-center justify-center transition ${
                    notificationPerm === 'granted' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200 animate-pulse'
                }`
            }, React.createElement('i', { className: `fas ${notificationPerm === 'granted' ? 'fa-bell' : 'fa-bell-slash'}` })),

            // Close Button Mobile Only
            React.createElement('button', { 
                onClick: onCloseMobile,
                className: 'lg:hidden text-slate-400 hover:text-slate-600 ml-2'
            }, React.createElement('i', { className: 'fas fa-times text-lg' }))
        ),
        React.createElement('p', { className: 'text-xs text-slate-500 px-5 pb-2 border-b border-slate-100 lg:border-none lg:pb-0 lg:px-0 lg:pl-14 lg:-mt-4' }, 'Votre To-Do list personnelle'),
        
        React.createElement('div', { className: 'flex-1 overflow-y-auto p-4 space-y-3' },
            notes.map(note => 
                React.createElement('div', { key: note.id, className: 'bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition group animate-slideIn relative' },
                    // Delete button (visible on hover)
                    React.createElement('button', {
                        onClick: () => onDelete(note.id),
                        className: 'absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition'
                    }, React.createElement('i', { className: 'fas fa-times' })),

                    React.createElement('div', { className: 'flex items-start gap-3' },
                        React.createElement('div', { 
                            onClick: () => onToggle(note.id),
                            className: `mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition ${
                                note.done 
                                    ? 'bg-green-500 border-green-500 text-white' 
                                    : 'border-gray-300 hover:border-blue-400 text-transparent'
                            }`,
                        }, React.createElement('i', { className: 'fas fa-check text-xs' })),
                        React.createElement('div', { className: 'flex-1 pr-4' },
                            React.createElement('p', { className: `text-sm leading-snug font-medium ${note.done ? 'text-gray-400 line-through' : 'text-slate-700'}` }, note.text),
                            
                            // Meta info (Time & Priority)
                            React.createElement('div', { className: 'mt-2 flex items-center gap-2' },
                                note.time && React.createElement('span', { className: `text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${note.notified ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600'}` },
                                    React.createElement('i', { className: 'far fa-clock' }),
                                    note.time
                                ),
                                note.priority === 'high' && !note.done && React.createElement('span', { className: 'text-[10px] px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-bold uppercase tracking-wide' }, 'Urgent')
                            )
                        )
                    )
                )
            )
        ),

        // Add Input
        React.createElement('div', { className: 'p-4 border-t bg-gray-50' },
            React.createElement('form', { onSubmit: onAdd, className: 'relative flex flex-col gap-2' },
                React.createElement('input', { 
                    name: 'text',
                    type: 'text', 
                    required: true,
                    placeholder: 'Ajouter une tâche...',
                    className: 'w-full pl-4 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition'
                }),
                React.createElement('div', { className: 'flex gap-2' },
                    React.createElement('input', { 
                        name: 'time',
                        type: 'time',
                        className: 'w-24 px-2 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-600 focus:ring-2 focus:ring-blue-500'
                    }),
                    React.createElement('button', { 
                        type: 'submit',
                        className: 'flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-xs font-bold transition shadow-sm flex items-center justify-center gap-2' 
                    },
                        'Ajouter',
                        React.createElement('i', { className: 'fas fa-plus' })
                    )
                )
            )
        )
    );
};

// Exposer le composant globalement
window.PlanningNotes = PlanningNotes;