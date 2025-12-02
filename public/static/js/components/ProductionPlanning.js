const ProductionPlanning = ({ onClose }) => {
    // Données simulées pour l'Industrie du Verre (IGP Glass)
    const machines = [
        { id: 1, name: 'Table de Coupe (Jumbo)', category: 'cut' },
        { id: 2, name: 'Façonnage Rectiligne', category: 'edge' },
        { id: 3, name: 'Centre Usinage (CNC)', category: 'cnc' },
        { id: 4, name: 'Four de Trempe', category: 'temp' },
        { id: 5, name: 'Ligne Thermos (IGU)', category: 'igu' },
        { id: 6, name: 'Quai Expédition', category: 'ship' },
    ];

    const hours = Array.from({ length: 13 }, (_, i) => i + 6); // 06:00 à 18:00

    // Simulation de Planning de Production + Impact Maintenance
    const events = [
        // --- MAINTENANCE (Le bloquant) ---
        { machineId: 4, start: 8, duration: 3, type: 'maintenance', title: 'Arrêt : Remplacement Rouleaux Céramique', color: 'bg-red-600 border-red-800 pattern-diagonal' },
        
        // --- PRODUCTION (Le flux) ---
        
        // COUPE
        { machineId: 1, start: 6, duration: 4, type: 'prod', title: 'PO#4402 - Vitrerie MTL - 6mm Clair (50 feuilles)', color: 'bg-blue-600', client: 'Vitrerie MTL' },
        { machineId: 1, start: 11, duration: 5, type: 'prod', title: 'PO#4405 - Construction B - 10mm Low-E', color: 'bg-blue-500', client: 'Const. B' },

        // FAÇONNAGE
        { machineId: 2, start: 7, duration: 6, type: 'prod', title: 'PO#4402 - Polissage Joint Plat', color: 'bg-indigo-500', client: 'Vitrerie MTL' },

        // CNC (Usinage)
        { machineId: 3, start: 9, duration: 4, type: 'prod', title: 'PO#4399 - Douches (Encoches Charnières)', color: 'bg-purple-600', client: 'Bain Dépôt' },

        // TREMPE (Bloqué partiellement par maintenance)
        { machineId: 4, start: 6, duration: 2, type: 'prod', title: 'PO#4390 - Garde-corps 12mm', color: 'bg-orange-600', client: 'Rampes Express' },
        // ... trou de 8h à 11h à cause de la maintenance ...
        { machineId: 4, start: 11.5, duration: 4, type: 'prod', title: 'PO#4399 - Portes de Douche (Suite)', color: 'bg-orange-500', client: 'Bain Dépôt' },

        // LIGNE THERMOS (IGU)
        { machineId: 5, start: 7, duration: 8, type: 'prod', title: 'PO#4400 - Projet Tour Condo (Argon/Intercalaire Noir)', color: 'bg-teal-600', client: 'Groupe Mach' },

        // EXPÉDITION
        { machineId: 6, start: 10, duration: 1, type: 'ship', title: 'Chargement Camion A - Tour Condo', color: 'bg-green-600', client: 'Groupe Mach' },
        { machineId: 6, start: 14, duration: 1, type: 'ship', title: 'Ramassage Client - Vitrerie MTL', color: 'bg-green-700', client: 'Vitrerie MTL' },
    ];

    return React.createElement('div', { className: 'fixed inset-0 z-[150] bg-gray-50 flex flex-col animate-fadeIn' },
        // Header
        React.createElement('div', { className: 'bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm' },
            React.createElement('div', null,
                React.createElement('div', { className: 'flex items-center gap-3' },
                    React.createElement('div', { className: 'bg-blue-600 text-white p-2 rounded-lg' },
                        React.createElement('i', { className: 'fas fa-industry' })
                    ),
                    React.createElement('div', null,
                        React.createElement('h1', { className: 'text-xl font-bold text-slate-800' }, 'Planning Maître de Production'),
                        React.createElement('p', { className: 'text-xs text-slate-500' }, 'Vue consolidée : Commandes Clients vs Capacité Machine')
                    )
                )
            ),
            React.createElement('button', {
                onClick: onClose,
                className: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition shadow-sm text-sm'
            }, 'Fermer')
        ),

        // KPIs / Légende
        React.createElement('div', { className: 'bg-white border-b px-6 py-3 flex gap-6 items-center text-sm overflow-x-auto' },
            React.createElement('div', { className: 'flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full' },
                React.createElement('i', { className: 'fas fa-cut text-blue-600' }),
                React.createElement('span', { className: 'font-bold text-blue-900' }, 'Coupe : 850m²')
            ),
            React.createElement('div', { className: 'flex items-center gap-2 px-3 py-1 bg-orange-50 border border-orange-100 rounded-full' },
                React.createElement('i', { className: 'fas fa-fire text-orange-600' }),
                React.createElement('span', { className: 'font-bold text-orange-900' }, 'Trempe : 320 pcs')
            ),
            React.createElement('div', { className: 'h-6 w-px bg-gray-200' }),
            React.createElement('div', { className: 'flex items-center gap-2' },
                React.createElement('div', { className: 'w-3 h-3 bg-red-600 rounded-sm' }),
                React.createElement('span', { className: 'text-gray-600' }, 'Arrêt Maintenance')
            ),
            React.createElement('div', { className: 'flex items-center gap-2' },
                React.createElement('div', { className: 'w-3 h-3 bg-green-600 rounded-sm' }),
                React.createElement('span', { className: 'text-gray-600' }, 'Expédition')
            )
        ),

        // Main Gantt Area
        React.createElement('div', { className: 'flex-1 overflow-auto p-6' },
            React.createElement('div', { className: 'bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-w-[1200px]' },
                
                // Timeline Header
                React.createElement('div', { className: 'grid grid-cols-[250px_repeat(13,1fr)] border-b bg-slate-50 text-slate-600' },
                    React.createElement('div', { className: 'p-3 font-bold text-xs uppercase tracking-wide border-r flex items-center' }, 'Poste de Charge'),
                    hours.map(h => 
                        React.createElement('div', { key: h, className: 'p-3 text-center text-xs font-mono border-r last:border-r-0' }, `${h}:00`)
                    )
                ),

                // Rows
                machines.map((machine, mIdx) => 
                    React.createElement('div', { key: machine.id, className: `grid grid-cols-[250px_repeat(13,1fr)] border-b last:border-b-0 hover:bg-slate-50 transition ${mIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}` },
                        // Machine Name
                        React.createElement('div', { className: 'p-4 border-r flex flex-col justify-center' },
                            React.createElement('span', { className: 'font-bold text-slate-700 text-sm' }, machine.name),
                            React.createElement('span', { className: 'text-xs text-slate-400' }, `Capacité: 100%`)
                        ),
                        
                        // Grid Cells
                        React.createElement('div', { className: 'col-span-13 grid grid-cols-13 relative h-20' },
                            // Vertical Lines (Heures)
                            Array.from({ length: 13 }).map((_, i) => 
                                React.createElement('div', { key: i, className: 'border-r border-slate-100 h-full pointer-events-none' })
                            ),

                            // Events
                            events.filter(e => e.machineId === machine.id).map((evt, idx) => 
                                React.createElement('div', {
                                    key: idx,
                                    className: `absolute top-2 bottom-2 rounded-md shadow-sm flex flex-col justify-center px-3 text-white text-xs cursor-pointer hover:brightness-110 transition overflow-hidden ${evt.color}`,
                                    style: {
                                        left: `${(evt.start - 6) * (100/13)}%`,
                                        width: `${evt.duration * (100/13)}%`,
                                        opacity: evt.type === 'maintenance' ? 1 : 0.9
                                    },
                                    title: evt.title
                                }, 
                                    evt.type === 'maintenance' && React.createElement('div', { className: 'flex items-center gap-1 font-bold text-yellow-200 mb-0.5' },
                                        React.createElement('i', { className: 'fas fa-exclamation-triangle' }),
                                        'MAINTENANCE'
                                    ),
                                    React.createElement('span', { className: 'font-bold truncate' }, evt.title),
                                    evt.client && React.createElement('span', { className: 'text-[10px] opacity-90 truncate' }, evt.client)
                                )
                            )
                        )
                    )
                )
            )
        )
    );
};
