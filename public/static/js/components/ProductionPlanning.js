const ProductionPlanning = ({ onClose }) => {
    // État pour le mois affiché (Simulé pour Décembre 2025)
    const currentMonthName = "Décembre 2025";
    
    // Données du Calendrier (Les "Post-it" virtuels du planificateur)
    const calendarEvents = [
        // SEMAINE 1
        { date: 1, type: 'cut', title: 'Lancer Coupe: Vitrerie MTL (PO#4402)', client: 'Vitrerie MTL' },
        { date: 3, type: 'ship', title: 'LIVRAISON: Projet Tour Condo', client: 'Groupe Mach', details: '2 Chevalets - Camion A' },
        { date: 4, type: 'reminder', title: 'Commander: 19mm Extra-Clair', details: 'Pour projet Lobby' },
        
        // SEMAINE 2
        { date: 8, type: 'cut', title: 'Lancer Coupe: Douches Bain Dépôt', client: 'Bain Dépôt' },
        { date: 9, type: 'maintenance', title: 'ARRÊT FOUR PRÉVU (8h-12h)', details: 'Technicien Externe' },
        { date: 10, type: 'ship', title: 'LIVRAISON: Vitrerie MTL', client: 'Vitrerie MTL' },
        { date: 12, type: 'ship', title: 'LIVRAISON: Bain Dépôt (Lot 1)', client: 'Bain Dépôt' },

        // SEMAINE 3
        { date: 15, type: 'cut', title: 'Lancer Coupe: Garde-corps Stade', client: 'Const. B' },
        { date: 18, type: 'reminder', title: 'Inventaire Fin d\'année', details: 'Préparer feuilles comptage' },
        { date: 19, type: 'ship', title: 'LIVRAISON: Garde-corps Stade', client: 'Const. B' },
    ];

    // Liste "Aide-Mémoire" (To-Do List du Planificateur)
    const plannerNotes = [
        { id: 1, text: 'Vérifier disponibilité chevalets L pour mardi', done: false },
        { id: 2, text: 'Confirmer rdv transporteur Projet Mach', done: true },
        { id: 3, text: 'Relancer fournisseur pour délai intercalaire noir', done: false },
        { id: 4, text: 'Valider séquence trempe avec Superviseur', done: false },
    ];

    // Génération de la grille du calendrier (Mois fictif commençant un Lundi)
    const daysInMonth = 31;
    const startDayOffset = 0; // Lundi = 0
    const days = Array.from({ length: daysInMonth + startDayOffset }, (_, i) => {
        const dayNum = i - startDayOffset + 1;
        return dayNum > 0 ? dayNum : null;
    });

    const getEventsForDay = (day) => calendarEvents.filter(e => e.date === day);

    const getTypeStyle = (type) => {
        switch(type) {
            case 'ship': return 'bg-green-100 text-green-800 border-l-4 border-green-600'; // L'argent rentre
            case 'cut': return 'bg-blue-100 text-blue-800 border-l-4 border-blue-600'; // L'action commence
            case 'maintenance': return 'bg-red-100 text-red-800 border-l-4 border-red-600'; // Blocage
            case 'reminder': return 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500'; // Note
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getIcon = (type) => {
        switch(type) {
            case 'ship': return 'fa-truck-loading';
            case 'cut': return 'fa-layer-group';
            case 'maintenance': return 'fa-tools';
            case 'reminder': return 'fa-sticky-note';
            default: return 'fa-circle';
        }
    };

    return React.createElement('div', { className: 'fixed inset-0 z-[150] bg-gray-100 flex flex-col animate-fadeIn' },
        // HEADER
        React.createElement('div', { className: 'bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm flex-shrink-0' },
            React.createElement('div', null,
                React.createElement('h1', { className: 'text-2xl font-bold text-slate-800 flex items-center gap-3' },
                    React.createElement('i', { className: 'far fa-calendar-alt text-blue-600' }),
                    'Planning & Échéancier'
                ),
                React.createElement('p', { className: 'text-sm text-slate-500 mt-1' }, 'Vue globale des mises en production et expéditions')
            ),
            React.createElement('div', { className: 'flex items-center gap-4' },
                React.createElement('div', { className: 'flex bg-gray-100 rounded-lg p-1' },
                    React.createElement('button', { className: 'px-4 py-1.5 bg-white shadow-sm rounded-md text-sm font-bold text-slate-700' }, 'Mois'),
                    React.createElement('button', { className: 'px-4 py-1.5 text-slate-500 text-sm font-medium hover:bg-gray-200 rounded-md transition' }, 'Semaine')
                ),
                React.createElement('button', {
                    onClick: onClose,
                    className: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition shadow-sm text-sm'
                }, 'Fermer')
            )
        ),

        // MAIN CONTENT (GRID + SIDEBAR)
        React.createElement('div', { className: 'flex-1 flex overflow-hidden' },
            
            // CALENDAR GRID (Left - 75%)
            React.createElement('div', { className: 'flex-1 flex flex-col bg-white border-r border-gray-200' },
                // Month Navigation
                React.createElement('div', { className: 'p-4 flex justify-between items-center border-b' },
                    React.createElement('button', { className: 'text-slate-400 hover:text-slate-700' }, React.createElement('i', { className: 'fas fa-chevron-left text-xl' })),
                    React.createElement('h2', { className: 'text-xl font-bold text-slate-800' }, currentMonthName),
                    React.createElement('button', { className: 'text-slate-400 hover:text-slate-700' }, React.createElement('i', { className: 'fas fa-chevron-right text-xl' }))
                ),
                
                // Days Header
                React.createElement('div', { className: 'grid grid-cols-7 border-b bg-slate-50' },
                    ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(day => 
                        React.createElement('div', { key: day, className: 'p-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wide' }, day)
                    )
                ),

                // Calendar Cells
                React.createElement('div', { className: 'grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto' },
                    days.map((day, idx) => {
                        const dayEvents = day ? getEventsForDay(day) : [];
                        return React.createElement('div', { 
                            key: idx, 
                            className: `min-h-[120px] border-b border-r p-2 hover:bg-slate-50 transition flex flex-col gap-1 ${!day ? 'bg-slate-50/50' : ''}` 
                        },
                            day && React.createElement('span', { className: `text-sm font-bold mb-1 ${[6,7,13,14,20,21,27,28].includes(idx+1) ? 'text-red-400' : 'text-slate-700'}` }, day),
                            dayEvents.map((evt, eIdx) => 
                                React.createElement('div', { 
                                    key: eIdx, 
                                    className: `text-xs p-1.5 rounded shadow-sm mb-1 cursor-pointer hover:brightness-95 ${getTypeStyle(evt.type)}`,
                                    title: evt.details || evt.title
                                },
                                    React.createElement('div', { className: 'flex items-center gap-1.5 font-bold' },
                                        React.createElement('i', { className: `fas ${getIcon(evt.type)} text-[10px] opacity-70` }),
                                        React.createElement('span', { className: 'truncate' }, evt.type === 'ship' ? 'EXP:' : evt.type === 'cut' ? 'PROD:' : '')
                                    ),
                                    React.createElement('div', { className: 'truncate mt-0.5' }, evt.title),
                                    evt.client && React.createElement('div', { className: 'text-[10px] opacity-80 truncate' }, evt.client)
                                )
                            )
                        );
                    })
                )
            ),

            // SIDEBAR "AIDE-MÉMOIRE" (Right - 25%)
            React.createElement('div', { className: 'w-80 bg-slate-50 border-l border-gray-200 flex flex-col shadow-inner z-10' },
                React.createElement('div', { className: 'p-5 bg-white border-b' },
                    React.createElement('h3', { className: 'font-bold text-slate-800 flex items-center gap-2' },
                        React.createElement('i', { className: 'fas fa-clipboard-list text-yellow-500' }),
                        'Aide-Mémoire'
                    ),
                    React.createElement('p', { className: 'text-xs text-slate-500 mt-1' }, 'Notes rapides et tâches planning')
                ),
                
                React.createElement('div', { className: 'flex-1 overflow-y-auto p-4 space-y-3' },
                    plannerNotes.map(note => 
                        React.createElement('div', { key: note.id, className: 'bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex gap-3 items-start group hover:border-blue-300 transition' },
                            React.createElement('div', { 
                                className: `mt-1 w-4 h-4 rounded border flex items-center justify-center cursor-pointer ${note.done ? 'bg-green-500 border-green-500' : 'border-gray-300'}`,
                            }, note.done && React.createElement('i', { className: 'fas fa-check text-white text-xs' })),
                            React.createElement('span', { className: `text-sm leading-snug ${note.done ? 'text-gray-400 line-through' : 'text-gray-700'}` }, note.text)
                        )
                    ),
                    
                    // Add Note Input
                    React.createElement('div', { className: 'mt-4 pt-4 border-t border-gray-200' },
                        React.createElement('div', { className: 'relative' },
                            React.createElement('input', { 
                                type: 'text', 
                                placeholder: 'Ajouter une note...',
                                className: 'w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
                            }),
                            React.createElement('button', { className: 'absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700' },
                                React.createElement('i', { className: 'fas fa-plus-circle' })
                            )
                        )
                    )
                ),

                // Legend
                React.createElement('div', { className: 'p-4 border-t bg-white text-xs text-gray-500 space-y-2' },
                    React.createElement('p', { className: 'font-bold mb-2 text-gray-700' }, 'Légende :'),
                    React.createElement('div', { className: 'flex items-center gap-2' },
                        React.createElement('div', { className: 'w-3 h-3 bg-green-100 border border-green-600 rounded' }),
                        'Livraison / Expédition ($)'
                    ),
                    React.createElement('div', { className: 'flex items-center gap-2' },
                        React.createElement('div', { className: 'w-3 h-3 bg-blue-100 border border-blue-600 rounded' }),
                        'Mise en Production'
                    ),
                    React.createElement('div', { className: 'flex items-center gap-2' },
                        React.createElement('div', { className: 'w-3 h-3 bg-red-100 border border-red-600 rounded' }),
                        'Arrêt Maintenance'
                    )
                )
            )
        )
    );
};
