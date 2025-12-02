// Composant : Modales (Ajout Événement + Gestion Catégories)
const PlanningModals = ({ 
    showAddModal, 
    setShowAddModal, 
    selectedEvent, 
    newEventDate, 
    categories, 
    onSaveEvent, 
    onDeleteEvent,
    showCategoryModal,
    setShowCategoryModal,
    editingCategory,
    onEditCategoryClick,
    onCancelEditCategory,
    onDeleteCategory,
    onSaveCategory
}) => {
    return React.createElement(React.Fragment, null,
        // ADD EVENT MODAL
        showAddModal && React.createElement('div', { className: 'fixed inset-0 z-[200] bg-black/50 overflow-y-auto animate-fadeIn' },
            React.createElement('div', { className: 'flex min-h-full items-center justify-center p-4' },
                React.createElement('div', { className: 'bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn relative' },
                    // Modal Header
                    React.createElement('div', { className: 'bg-slate-50 px-6 py-4 border-b flex justify-between items-center' },
                        React.createElement('h3', { className: 'font-bold text-lg text-slate-800' }, selectedEvent ? 'Modifier l\'Événement' : 'Ajouter un Événement'),
                        React.createElement('button', { 
                            onClick: () => setShowAddModal(false),
                            className: 'text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition'
                        }, React.createElement('i', { className: 'fas fa-times' }))
                    ),
                    // Modal Form
                    React.createElement('form', { onSubmit: onSaveEvent, className: 'p-6 space-y-5' },
                        // Date & Type Row
                        React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4' },
                            React.createElement('div', null,
                                React.createElement('label', { className: 'block text-xs font-bold text-slate-500 uppercase mb-1' }, 'Date'),
                                React.createElement('input', { 
                                    name: 'date', 
                                    type: 'date',
                                    defaultValue: newEventDate,
                                    required: true,
                                    className: 'w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-medium text-slate-700' 
                                })
                            ),
                            React.createElement('div', null,
                                React.createElement('label', { className: 'block text-xs font-bold text-slate-500 uppercase mb-1' }, 'Type'),
                                React.createElement('select', { 
                                    name: 'type', 
                                    defaultValue: selectedEvent ? selectedEvent.type : (categories[0]?.id || ''),
                                    className: 'w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-medium text-slate-700' 
                                },
                                    categories.map(cat => 
                                        React.createElement('option', { key: cat.id, value: cat.id }, cat.label)
                                    )
                                )
                            )
                        ),
                        
                        // Title Input
                        React.createElement('div', null,
                            React.createElement('label', { className: 'block text-xs font-bold text-slate-500 uppercase mb-1' }, 'Titre de l\'événement'),
                            React.createElement('input', { 
                                name: 'title', 
                                type: 'text', 
                                defaultValue: selectedEvent ? selectedEvent.title : '',
                                placeholder: 'Ex: Commande #1234 - Client ABC',
                                required: true,
                                className: 'w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-medium text-slate-700' 
                            })
                        ),

                        // Details Input
                        React.createElement('div', null,
                            React.createElement('label', { className: 'block text-xs font-bold text-slate-500 uppercase mb-1' }, 'Détails / Notes'),
                            React.createElement('textarea', { 
                                name: 'details', 
                                rows: 3,
                                defaultValue: selectedEvent ? selectedEvent.details : '',
                                placeholder: 'Spécifications, contacts, contraintes...',
                                className: 'w-full p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-medium text-slate-700 resize-none' 
                            })
                        ),

                        // Footer Buttons
                        React.createElement('div', { className: 'flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-2' },
                            // Delete Button (Only in Edit Mode)
                            selectedEvent ? React.createElement('button', {
                                type: 'button',
                                onClick: onDeleteEvent,
                                className: 'w-full sm:w-auto text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg font-medium transition text-sm flex items-center justify-center gap-2'
                            }, React.createElement('i', { className: 'fas fa-trash-alt' }), 'Supprimer') : React.createElement('div', { className: 'hidden sm:block' }),

                            React.createElement('div', { className: 'flex w-full sm:w-auto gap-3' },
                                React.createElement('button', { 
                                    type: 'button',
                                    onClick: () => setShowAddModal(false),
                                    className: 'flex-1 sm:flex-none px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition text-center' 
                                }, 'Annuler'),
                                React.createElement('button', { 
                                    type: 'submit',
                                    className: 'flex-1 sm:flex-none px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-200 transition flex items-center justify-center gap-2' 
                                }, React.createElement('i', { className: 'fas fa-check' }), selectedEvent ? 'Enregistrer' : 'Ajouter')
                            )
                        )
                    )
                )
            )
        ),

        // CATEGORY MANAGEMENT MODAL
        showCategoryModal && React.createElement('div', { className: 'fixed inset-0 z-[200] bg-black/50 overflow-y-auto animate-fadeIn' },
            React.createElement('div', { className: 'flex min-h-full items-center justify-center p-4' },
                React.createElement('div', { className: 'bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn relative' },
                    // Header
                    React.createElement('div', { className: 'bg-slate-50 px-6 py-4 border-b flex justify-between items-center' },
                        React.createElement('h3', { className: 'font-bold text-lg text-slate-800' }, 'Gérer les Catégories'),
                        React.createElement('button', { 
                            onClick: () => setShowCategoryModal(false),
                            className: 'text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition'
                        }, React.createElement('i', { className: 'fas fa-times' }))
                    ),
                    
                    // Body
                    React.createElement('div', { className: 'p-6' },
                        // List
                        React.createElement('div', { className: 'space-y-2 mb-6' },
                            React.createElement('label', { className: 'block text-xs font-bold text-slate-500 uppercase mb-2' }, 'Catégories Existantes'),
                            categories.map(cat => 
                                React.createElement('div', { key: cat.id, className: `flex items-center justify-between p-3 rounded-lg border transition ${editingCategory && editingCategory.id === cat.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-slate-50 border-slate-200'}` },
                                    React.createElement('div', { className: 'flex items-center gap-3' },
                                        React.createElement('div', { className: `w-8 h-8 rounded-full flex items-center justify-center bg-${cat.color === 'blue' ? 'blue' : cat.color === 'green' ? 'green' : cat.color === 'red' ? 'red' : cat.color === 'purple' ? 'purple' : cat.color === 'orange' ? 'orange' : 'yellow'}-100 text-${cat.color === 'blue' ? 'blue' : cat.color === 'green' ? 'green' : cat.color === 'red' ? 'red' : cat.color === 'purple' ? 'purple' : cat.color === 'orange' ? 'orange' : 'yellow'}-600` },
                                            React.createElement('i', { className: `fas ${cat.icon}` })
                                        ),
                                        React.createElement('span', { className: 'font-medium text-slate-700' }, cat.label)
                                    ),
                                    React.createElement('div', { className: 'flex items-center gap-1' },
                                        React.createElement('button', {
                                            onClick: () => onEditCategoryClick(cat),
                                            className: 'text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition'
                                        }, React.createElement('i', { className: 'fas fa-pen' })),
                                        React.createElement('button', {
                                            onClick: () => onDeleteCategory(cat.id),
                                            className: 'text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition'
                                        }, React.createElement('i', { className: 'fas fa-trash-alt' }))
                                    )
                                )
                            )
                        ),

                        // Add/Edit Form
                        React.createElement('form', { 
                            key: editingCategory ? editingCategory.id : 'new', // Re-mount to reset default values
                            onSubmit: onSaveCategory, 
                            className: `p-4 rounded-xl border transition ${editingCategory ? 'bg-blue-50 border-blue-200 shadow-md' : 'bg-slate-50 border-slate-200'}` 
                        },
                            React.createElement('div', { className: 'flex justify-between items-center mb-3' },
                                React.createElement('label', { className: `block text-xs font-bold uppercase ${editingCategory ? 'text-blue-800' : 'text-slate-500'}` }, 
                                    editingCategory ? 'Modifier la catégorie' : 'Ajouter une nouvelle catégorie'
                                ),
                                editingCategory && React.createElement('button', {
                                    type: 'button',
                                    onClick: onCancelEditCategory,
                                    className: 'text-xs text-blue-600 hover:underline'
                                }, 'Annuler')
                            ),
                            
                            React.createElement('div', { className: 'space-y-3' },
                                React.createElement('input', { 
                                    name: 'label', 
                                    defaultValue: editingCategory ? editingCategory.label : '',
                                    placeholder: 'Nom (ex: Réunion)', 
                                    required: true, 
                                    className: 'w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                }),
                                React.createElement('div', { className: 'grid grid-cols-2 gap-3' },
                                    React.createElement('select', { 
                                        name: 'icon', 
                                        defaultValue: editingCategory ? editingCategory.icon : 'fa-circle',
                                        className: 'w-full p-2 border border-slate-300 rounded-lg text-sm' 
                                    },
                                        React.createElement('option', { value: 'fa-circle' }, '⚫ Cercle'),
                                        React.createElement('option', { value: 'fa-star' }, '⭐ Étoile'),
                                        React.createElement('option', { value: 'fa-user' }, '👤 Utilisateur'),
                                        React.createElement('option', { value: 'fa-truck' }, '🚚 Camion'),
                                        React.createElement('option', { value: 'fa-tools' }, '🛠️ Outils'),
                                        React.createElement('option', { value: 'fa-bolt' }, '⚡ Éclair'),
                                        React.createElement('option', { value: 'fa-file-alt' }, '📄 Document'),
                                        React.createElement('option', { value: 'fa-exclamation-triangle' }, '⚠️ Attention'),
                                        React.createElement('option', { value: 'fa-ban' }, '🚫 Interdit'),
                                        React.createElement('option', { value: 'fa-info-circle' }, 'ℹ️ Info'),
                                        React.createElement('option', { value: 'fa-check-circle' }, '✅ Valide'),
                                        React.createElement('option', { value: 'fa-clock' }, '🕒 Horloge')
                                    ),
                                    React.createElement('select', { 
                                        name: 'color', 
                                        defaultValue: editingCategory ? editingCategory.color : 'blue',
                                        className: 'w-full p-2 border border-slate-300 rounded-lg text-sm' 
                                    },
                                        React.createElement('option', { value: 'blue' }, '🔵 Bleu'),
                                        React.createElement('option', { value: 'green' }, '🟢 Vert'),
                                        React.createElement('option', { value: 'red' }, '🔴 Rouge'),
                                        React.createElement('option', { value: 'yellow' }, '🟡 Jaune'),
                                        React.createElement('option', { value: 'purple' }, '🟣 Violet'),
                                        React.createElement('option', { value: 'orange' }, '🟠 Orange'),
                                        React.createElement('option', { value: 'gray' }, '⚪ Gris')
                                    )
                                ),
                                React.createElement('button', { 
                                    type: 'submit',
                                    className: `w-full py-2 rounded-lg font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 ${
                                        editingCategory 
                                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                            : 'bg-slate-800 text-white hover:bg-slate-900'
                                    }`
                                }, 
                                    React.createElement('i', { className: editingCategory ? 'fas fa-save' : 'fas fa-plus' }),
                                    editingCategory ? 'Enregistrer les modifications' : 'Ajouter'
                                )
                            )
                        )
                    )
                )
            )
        )
    );
};

// Exposer le composant globalement
window.PlanningModals = PlanningModals;