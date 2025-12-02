const ProductionPlanning = ({ onClose }) => {
    // État pour le mois affiché (Simulé pour Décembre 2025)
    const currentMonthName = "Décembre 2025";
    const [activeFilter, setActiveFilter] = React.useState('all'); // 'all', 'ship', 'cut', 'maintenance'
    
    // Données du Calendrier
    const calendarEvents = [
        // SEMAINE 1
        { date: 1, type: 'cut', status: 'confirmed', title: 'Coupe: Vitrerie MTL (#4402)', details: '6mm Clair - 50 feuilles' },
        { date: 2, type: 'cut', status: 'confirmed', title: 'Coupe: Projet Gym', details: 'Miroir 6mm - Joint poli' },
        { date: 3, type: 'ship', status: 'confirmed', title: 'LIVRAISON: Tour Condo', details: '2 Chevalets - Camion A' },
        { date: 3, type: 'cut', status: 'tentative', title: 'Coupe: Douches B.Dépôt', details: 'En attente verre 10mm' },
        
        // SEMAINE 2
        { date: 8, type: 'cut', status: 'confirmed', title: 'Coupe: Lot Douches', details: 'Bain Dépôt - Urgent' },
        { date: 9, type: 'maintenance', status: 'confirmed', title: 'ARRÊT FOUR (8h-12h)', details: 'Maint. Préventive' },
        { date: 10, type: 'ship', status: 'confirmed', title: 'LIVRAISON: Vitrerie MTL', details: 'Commande #4402' },
        { date: 11, type: 'reminder', status: 'info', title: 'Arrivage: Caisse Jumbo', details: 'Verre Low-E - Quai 2' },
        { date: 12, type: 'ship', status: 'tentative', title: 'LIVRAISON: Bain Dépôt', details: 'À confirmer avec client' },

        // SEMAINE 3
        { date: 15, type: 'cut', status: 'confirmed', title: 'Coupe: Garde-corps Stade', details: '12mm Trempé - 200mc' },
        { date: 16, type: 'cut', status: 'confirmed', title: 'Coupe: Projet Bureau', details: 'Cloisons verre' },
        { date: 18, type: 'reminder', status: 'info', title: 'Inventaire Fin d\'année', details: 'Préparer feuilles comptage' },
        { date: 19, type: 'ship', status: 'confirmed', title: 'LIVRAISON: Garde-corps', details: 'Chantier Stade Olympique' },
    ];

    // Simulation de charge journalière (0-100%)
    const dailyLoad = {
        1: 85, 2: 90, 3: 110, 4: 40, 5: 60,
        8: 95, 9: 20, 10: 75, 11: 80, 12: 60,
        15: 100, 16: 85, 17: 50, 18: 30, 19: 90
    };

    // Liste "Aide-Mémoire"
    const plannerNotes = [
        { id: 1, text: 'Vérifier dispo chevalets L pour mardi', done: false, priority: 'high' },
        { id: 2, text: 'Confirmer rdv transporteur Projet Mach', done: true, priority: 'medium' },
        { id: 3, text: 'Relancer fournisseur intercalaire noir', done: false, priority: 'high' },
        { id: 4, text: 'Valider séquence trempe avec Superviseur', done: false, priority: 'low' },
    ];

    // Génération de la grille (Semaine de 5 jours - Lundi à Vendredi)
    // On filtre simplement les jours pour ne garder que 1 à 5 (Lundi-Vendredi)
    // Samedi (6) et Dimanche (0) sont exclus de l'affichage
    const daysInMonth = 31;
    const startDayOffset = 0; // Lundi = 0
    const days = Array.from({ length: daysInMonth + startDayOffset }, (_, i) => {
        const dayNum = i - startDayOffset + 1;
        return dayNum > 0 ? dayNum : null;
    });

    // Fonction pour déterminer le jour de la semaine (0=Lundi, 4=Vendredi pour l'affichage)
    // On suppose que le 1er du mois est un Lundi pour la maquette simplifiée
    const getDayOfWeek = (dayNum) => {
        if (!dayNum) return -1;
        return (dayNum - 1) % 7;
    };

    // Filtrer pour n'avoir que les jours de la semaine (0 à 4)
    const workDays = days.filter(d => {
        const dow = getDayOfWeek(d);
        return dow >= 0 && dow <= 4;
    });

    const getEventsForDay = (day) => {
        return calendarEvents.filter(e => {
            if (e.date !== day) return false;
            if (activeFilter === 'all') return true;
            if (activeFilter === 'ship' && e.type === 'ship') return true;
            if (activeFilter === 'cut' && e.type === 'cut') return true;
            if (activeFilter === 'maintenance' && e.type === 'maintenance') return true;
            return false;
        });
    };

    const getTypeStyle = (type, status) => {
        const isTentative = status === 'tentative';
        const baseClass = isTentative ? 'border-dashed opacity-80' : 'border-solid';
        
        switch(type) {
            case 'ship': return `bg-green-50 text-green-900 border-l-4 border-green-600 ${baseClass}`; 
            case 'cut': return `bg-blue-50 text-blue-900 border-l-4 border-blue-600 ${baseClass}`; 
            case 'maintenance': return `bg-red-50 text-red-900 border-l-4 border-red-600 ${baseClass}`; 
            case 'reminder': return `bg-yellow-50 text-yellow-900 border-l-4 border-yellow-500 ${baseClass}`; 
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getIcon = (type) => {
        switch(type) {
            case 'ship': return 'fa-truck';
            case 'cut': return 'fa-layer-group';
            case 'maintenance': return 'fa-tools';
            case 'reminder': return 'fa-info-circle';
            default: return 'fa-circle';
        }
    };

    const getLoadColor = (load) => {
        if (!load) return 'bg-gray-100';
        if (load > 100) return 'bg-red-500'; // Surcharge
        if (load > 80) return 'bg-orange-400'; // Chargé
        return 'bg-green-500'; // OK
    };

    return React.createElement('div', { className: 'fixed inset-0 z-[150] bg-gray-100 flex flex-col animate-fadeIn' },
        // HEADER
        React.createElement('div', { className: 'bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm z-20' },
            React.createElement('div', null,
                React.createElement('h1', { className: 'text-2xl font-bold text-slate-800 flex items-center gap-3' },
                    React.createElement('div', { className: 'bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center shadow-sm' },
                        React.createElement('i', { className: 'far fa-calendar-alt text-lg' })
                    ),
                    'Planning & Production'
                ),
                React.createElement('div', { className: 'flex items-center gap-2 text-xs text-slate-500 mt-1' },
                    React.createElement('span', null, 'IGP Glass'),
                    React.createElement('i', { className: 'fas fa-circle text-[4px] text-slate-300' }),
                    React.createElement('span', null, 'Vue Directeur')
                )
            ),
            React.createElement('div', { className: 'flex items-center gap-3' },
                React.createElement('button', { className: 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition font-semibold flex items-center gap-2' },
                    React.createElement('i', { className: 'fas fa-plus' }),
                    'Nouvel Événement'
                ),
                React.createElement('div', { className: 'h-8 w-px bg-gray-200 mx-1' }),
                React.createElement('button', {
                    onClick: onClose,
                    className: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition shadow-sm'
                }, 'Fermer')
            )
        ),

        // FILTERS & TOOLBAR
        React.createElement('div', { className: 'bg-white border-b px-6 py-2 flex gap-4 items-center shadow-sm z-10' },
            React.createElement('span', { className: 'text-xs font-bold text-slate-400 uppercase tracking-wider mr-2' }, 'Filtres :'),
            
            React.createElement('button', {
                onClick: () => setActiveFilter('all'),
                className: `px-3 py-1.5 rounded-full text-sm font-medium transition border ${activeFilter === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`
            }, 'Tout Voir'),
            
            React.createElement('button', {
                onClick: () => setActiveFilter('ship'),
                className: `px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-2 border ${activeFilter === 'ship' ? 'bg-green-100 text-green-800 border-green-300 shadow-inner' : 'bg-white text-slate-600 border-slate-200 hover:bg-green-50'}`
            }, React.createElement('i', { className: 'fas fa-truck text-xs' }), 'Expéditions'),
            
            React.createElement('button', {
                onClick: () => setActiveFilter('cut'),
                className: `px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-2 border ${activeFilter === 'cut' ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-inner' : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50'}`
            }, React.createElement('i', { className: 'fas fa-layer-group text-xs' }), 'Mise en Prod'),

            React.createElement('button', {
                onClick: () => setActiveFilter('maintenance'),
                className: `px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-2 border ${activeFilter === 'maintenance' ? 'bg-red-100 text-red-800 border-red-300 shadow-inner' : 'bg-white text-slate-600 border-slate-200 hover:bg-red-50'}`
            }, React.createElement('i', { className: 'fas fa-tools text-xs' }), 'Maintenance'),

            React.createElement('div', { className: 'flex-1' }), // Spacer
            
            React.createElement('div', { className: 'flex bg-gray-100 rounded-lg p-1' },
                React.createElement('button', { className: 'w-8 h-8 flex items-center justify-center bg-white shadow-sm rounded text-slate-700' }, React.createElement('i', { className: 'fas fa-chevron-left' })),
                React.createElement('span', { className: 'px-4 flex items-center font-bold text-slate-700 text-sm' }, currentMonthName),
                React.createElement('button', { className: 'w-8 h-8 flex items-center justify-center bg-white shadow-sm rounded text-slate-700' }, React.createElement('i', { className: 'fas fa-chevron-right' }))
            )
        ),

        // MAIN CONTENT (GRID + SIDEBAR)
        React.createElement('div', { className: 'flex-1 flex overflow-hidden' },
            
            // CALENDAR GRID
            React.createElement('div', { className: 'flex-1 flex flex-col bg-slate-50 border-r border-gray-200' },
                // Days Header (5 jours)
                React.createElement('div', { className: 'grid grid-cols-5 border-b bg-white shadow-sm' },
                    ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map(day => 
                        React.createElement('div', { key: day, className: 'py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider' }, day)
                    )
                ),

                // Calendar Cells
                React.createElement('div', { className: 'grid grid-cols-5 flex-1 auto-rows-fr overflow-y-auto p-4 gap-4' },
                    workDays.map((day, idx) => {
                        const dayEvents = day ? getEventsForDay(day) : [];
                        const load = day ? dailyLoad[day] : 0;
                        
                        return React.createElement('div', { 
                            key: idx, 
                            className: `rounded-xl border bg-white border-slate-200 hover:shadow-md hover:border-blue-300 p-3 flex flex-col gap-2 relative transition-all group min-h-[140px]` 
                        },
                            day && React.createElement('div', { className: 'flex justify-between items-start mb-1' },
                                React.createElement('span', { 
                                    className: `text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full ${
                                        day === 3 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 bg-slate-100'
                                    }` 
                                }, day),
                                // Add Button (Visible on Hover)
                                React.createElement('button', { 
                                    className: 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition p-1' 
                                }, React.createElement('i', { className: 'fas fa-plus-circle text-lg' }))
                            ),
                            
                            // Events List
                            day && React.createElement('div', { className: 'flex-1 overflow-y-auto space-y-1 custom-scrollbar' },
                                dayEvents.map((evt, eIdx) => 
                                    React.createElement('div', { 
                                        key: eIdx, 
                                        className: `text-xs p-2 rounded-lg shadow-sm cursor-pointer hover:scale-[1.02] transition-transform border border-transparent ${getTypeStyle(evt.type, evt.status)}`,
                                        title: evt.details
                                    },
                                        React.createElement('div', { className: 'flex items-center justify-between mb-0.5' },
                                            React.createElement('div', { className: 'flex items-center gap-1.5' },
                                                React.createElement('i', { className: `fas ${getIcon(evt.type)}` }),
                                                React.createElement('span', { className: 'font-bold truncate max-w-[80px]' }, evt.type === 'ship' ? 'EXPÉ.' : evt.type === 'cut' ? 'PROD' : '')
                                            ),
                                            evt.status === 'tentative' && React.createElement('i', { className: 'fas fa-question-circle opacity-50' })
                                        ),
                                        React.createElement('div', { className: 'truncate font-medium leading-tight' }, evt.title),
                                        evt.details && React.createElement('div', { className: 'text-[10px] opacity-75 truncate mt-0.5' }, evt.details)
                                    )
                                )
                            ),

                            // Capacity Bar (Load Balancer)
                            day && load > 0 && React.createElement('div', { className: 'mt-auto pt-2' },
                                React.createElement('div', { className: 'flex justify-between text-[10px] text-slate-400 mb-0.5 font-medium' },
                                    React.createElement('span', null, 'Charge'),
                                    React.createElement('span', { className: load > 100 ? 'text-red-500 font-bold' : '' }, `${load}%`)
                                ),
                                React.createElement('div', { className: 'h-1.5 w-full bg-slate-100 rounded-full overflow-hidden' },
                                    React.createElement('div', { 
                                        className: `h-full rounded-full ${getLoadColor(load)}`, 
                                        style: { width: `${Math.min(load, 100)}%` } 
                                    })
                                )
                            )
                        );
                    })
                )
            ),

            // SIDEBAR "AIDE-MÉMOIRE"
            React.createElement('div', { className: 'w-80 bg-white border-l border-gray-200 flex flex-col shadow-xl z-20' },
                React.createElement('div', { className: 'p-5 border-b bg-slate-50' },
                    React.createElement('h3', { className: 'font-bold text-slate-800 flex items-center gap-2' },
                        React.createElement('div', { className: 'w-6 h-6 rounded bg-yellow-100 text-yellow-600 flex items-center justify-center' },
                            React.createElement('i', { className: 'fas fa-sticky-note text-xs' })
                        ),
                        'Notes & Rappels'
                    ),
                    React.createElement('p', { className: 'text-xs text-slate-500 mt-1 pl-8' }, 'Votre To-Do list personnelle')
                ),
                
                React.createElement('div', { className: 'flex-1 overflow-y-auto p-4 space-y-3' },
                    plannerNotes.map(note => 
                        React.createElement('div', { key: note.id, className: 'bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition group animate-slideIn' },
                            React.createElement('div', { className: 'flex items-start gap-3' },
                                React.createElement('div', { 
                                    className: `mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition ${
                                        note.done 
                                            ? 'bg-green-500 border-green-500 text-white' 
                                            : 'border-gray-300 hover:border-blue-400 text-transparent'
                                    }`,
                                }, React.createElement('i', { className: 'fas fa-check text-xs' })),
                                React.createElement('div', { className: 'flex-1' },
                                    React.createElement('p', { className: `text-sm leading-snug font-medium ${note.done ? 'text-gray-400 line-through' : 'text-slate-700'}` }, note.text),
                                    
                                    // Priority Tag
                                    !note.done && React.createElement('div', { className: 'mt-2 flex' },
                                        note.priority === 'high' && React.createElement('span', { className: 'text-[10px] px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-bold uppercase tracking-wide' }, 'Urgent'),
                                        note.priority === 'medium' && React.createElement('span', { className: 'text-[10px] px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full font-bold uppercase tracking-wide' }, 'Normal')
                                    )
                                )
                            )
                        )
                    )
                ),

                // Add Input
                React.createElement('div', { className: 'p-4 border-t' },
                    React.createElement('div', { className: 'relative' },
                        React.createElement('input', { 
                            type: 'text', 
                            placeholder: 'Ajouter une tâche...',
                            className: 'w-full pl-4 pr-10 py-3 text-sm bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition'
                        }),
                        React.createElement('button', { className: 'absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700' },
                            React.createElement('i', { className: 'fas fa-arrow-up' })
                        )
                    )
                )
            )
        )
    );
};
