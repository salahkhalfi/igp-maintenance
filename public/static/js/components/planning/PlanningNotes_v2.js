// Composant : Panneau Latéral "Notes & Rappels"
const PlanningNotes = ({ notes, showMobile, onCloseMobile, onAdd, onUpdate, onToggle, onDelete, notificationPerm, onRequestPerm }) => {
    const [editingNote, setEditingNote] = React.useState(null); // null or note object

    const handleEditSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const text = formData.get('text');
        const time = formData.get('time') || null;
        const end_time = formData.get('end_time') || null;
        const date = formData.get('date') || null;
        // Explicitly cast to boolean for API
        const is_dashboard = formData.get('is_dashboard') === 'on';

        if (editingNote) {
            onUpdate(editingNote.id, { text, time, end_time, date, is_dashboard });
            setEditingNote(null);
        } else {
            // For Add, we need to pass the form data logic or just the values
            // But onAdd expects event e usually? No, ProductionPlanning_v3.js onAdd logic handles formData extraction again
            // BUT, if we want to pass is_dashboard, we must ensure it's in the form or handled.
            // Since onAdd takes (e), and the checkbox IS in the form (e.target), it should work fine.
            onAdd(e);
        }
        e.target.reset();
    };

    // Reset form when canceling edit
    const handleCancelEdit = () => {
        setEditingNote(null);
        // Optional: Reset form fields visually if not controlled
        const form = document.getElementById('note-form');
        if (form) form.reset();
    };

    const handleResetDateTime = () => {
        const form = document.getElementById('note-form');
        if (form) {
            const dateInput = form.querySelector('input[name="date"]');
            const timeInput = form.querySelector('input[name="time"]');
            const endTimeInput = form.querySelector('input[name="end_time"]');
            if (dateInput) dateInput.value = '';
            if (timeInput) timeInput.value = '';
            if (endTimeInput) endTimeInput.value = '';
        }
    };

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
                    // Delete & Edit buttons (visible on hover)
                    React.createElement('div', { className: 'absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition' },
                        React.createElement('button', {
                            onClick: () => setEditingNote(note),
                            className: 'text-gray-300 hover:text-blue-500 p-1'
                        }, React.createElement('i', { className: 'fas fa-pen text-xs' })),
                        React.createElement('button', {
                            onClick: () => onDelete(note.id),
                            className: 'text-gray-300 hover:text-red-500 p-1'
                        }, React.createElement('i', { className: 'fas fa-times text-xs' }))
                    ),

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
                            
                            // Meta info (Time, Date & Priority)
                            React.createElement('div', { className: 'mt-2 flex items-center gap-2 flex-wrap' },
                                (!!note.is_dashboard) && React.createElement('span', { className: 'text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-bold flex items-center gap-1 border border-purple-200' },
                                    React.createElement('i', { className: 'fas fa-tv' }),
                                    'TV'
                                ),
                                note.time && React.createElement('span', { className: `text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${note.notified ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600'}` },
                                    React.createElement('i', { className: 'far fa-clock' }),
                                    note.time
                                ),
                                note.date && React.createElement('span', { className: 'text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 bg-purple-50 text-purple-600' },
                                    React.createElement('i', { className: 'far fa-calendar' }),
                                    new Date(note.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                                ),
                                note.priority === 'high' && !note.done && React.createElement('span', { className: 'text-[10px] px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-bold uppercase tracking-wide' }, 'Urgent')
                            )
                        )
                    )
                )
            )
        ),

        // Add/Edit Input
        React.createElement('div', { className: 'p-4 border-t bg-gray-50' },
            React.createElement('form', { id: 'note-form', onSubmit: handleEditSubmit, className: 'relative flex flex-col gap-2' },
                editingNote && React.createElement('div', { className: 'flex justify-between items-center text-xs text-blue-600 mb-1 font-bold' },
                    'Modification en cours...',
                    React.createElement('button', { type: 'button', onClick: handleCancelEdit, className: 'text-gray-500 hover:text-gray-700 underline' }, 'Annuler')
                ),
                React.createElement('div', { className: 'flex items-center gap-2 px-1 mb-1' },
                    React.createElement('input', {
                        type: 'checkbox',
                        name: 'is_dashboard',
                        id: 'is_dashboard_check',
                        defaultChecked: editingNote ? (!!editingNote.is_dashboard) : false,
                        key: editingNote ? `dashboard-${editingNote.id}-${editingNote.is_dashboard}` : 'dashboard-new',
                        className: 'w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500 border-gray-300'
                    }),
                    React.createElement('label', { htmlFor: 'is_dashboard_check', className: 'text-xs text-slate-600 font-medium select-none cursor-pointer flex items-center gap-1' }, 
                        React.createElement('i', { className: 'fas fa-tv text-slate-400' }),
                        'Diffuser sur TV (selon date/heure)'
                    )
                ),
                React.createElement('input', { 
                    name: 'text',
                    type: 'text', 
                    required: true,
                    defaultValue: editingNote ? editingNote.text : '',
                    key: editingNote ? `edit-${editingNote.id}` : 'new', // Force re-render on switch
                    placeholder: editingNote ? 'Modifier la tâche...' : 'Ajouter une tâche...',
                    className: 'w-full pl-4 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition'
                }),
                React.createElement('div', { className: 'flex flex-col gap-2' },
                    React.createElement('div', { className: 'flex gap-2 items-center' },
                        React.createElement('input', { 
                            name: 'date',
                            type: 'date',
                            defaultValue: editingNote ? editingNote.date : '',
                            key: editingNote ? `date-${editingNote.id}` : 'date-new',
                            className: 'flex-1 px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-600 focus:ring-2 focus:ring-blue-500'
                        }),
                        React.createElement('button', {
                            type: 'button',
                            onClick: handleResetDateTime,
                            title: 'Effacer Date et Heures',
                            className: 'h-9 w-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-red-500 rounded-lg transition border border-gray-200 shadow-sm'
                        }, React.createElement('i', { className: 'fas fa-eraser' }))
                    ),
                    React.createElement('div', { className: 'flex gap-2' },
                        React.createElement('input', { 
                            name: 'time',
                            type: 'time',
                            title: 'Début',
                            placeholder: 'Début',
                            defaultValue: editingNote ? editingNote.time : '',
                            key: editingNote ? `time-${editingNote.id}` : 'time-new',
                            className: 'flex-1 px-2 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-600 focus:ring-2 focus:ring-blue-500'
                        }),
                        React.createElement('input', { 
                            name: 'end_time',
                            type: 'time',
                            title: 'Fin (Optionnel)',
                            placeholder: 'Fin',
                            defaultValue: editingNote ? editingNote.end_time : '',
                            key: editingNote ? `end-time-${editingNote.id}` : 'end-time-new',
                            className: 'flex-1 px-2 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-600 focus:ring-2 focus:ring-blue-500'
                        })
                    ),
                    React.createElement('button', { 
                        type: 'submit',
                        className: `w-full rounded-lg py-2 text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 ${
                            editingNote ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }` 
                    },
                        editingNote ? 'Enregistrer' : 'Ajouter',
                        React.createElement('i', { className: editingNote ? 'fas fa-save' : 'fas fa-plus' })
                    )
                )
            )
        )
    );
};

// Exposer le composant globalement
window.PlanningNotes = PlanningNotes;