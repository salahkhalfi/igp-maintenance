const ProductionPlanning = ({ onClose }) => {
    // Données factices pour la démo
    const machines = [
        { id: 1, name: 'Ligne Coupe A', status: 'production' },
        { id: 2, name: 'Four Trempe 1', status: 'maintenance' },
        { id: 3, name: 'CNC Verticale', status: 'idle' },
        { id: 4, name: 'Ligne Assemblage', status: 'production' },
        { id: 5, name: 'Laveuse Horiz.', status: 'production' },
    ];

    const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 07:00 à 19:00

    // Simulation de données (Conflits et Jobs)
    const events = [
        // Maintenance (Rouge/Orange)
        { machineId: 2, start: 8, duration: 4, type: 'maintenance', title: 'Changement Résistances', color: 'bg-red-500' },
        { machineId: 3, start: 14, duration: 2, type: 'preventive', title: 'Graissage Hebdo', color: 'bg-orange-400' },
        
        // Production (Bleu)
        { machineId: 1, start: 7, duration: 8, type: 'production', title: 'Cmd #4052 - Vitrage Tours', color: 'bg-blue-600' },
        { machineId: 4, start: 9, duration: 6, type: 'production', title: 'Cmd #4055 - Garde-corps', color: 'bg-blue-600' },
        { machineId: 5, start: 8, duration: 5, type: 'production', title: 'Cmd #4060 - Miroirs', color: 'bg-blue-600' },
    ];

    const getEventStyle = (start, duration) => {
        return {
            gridColumnStart: start - 6, // Offset par rapport à 7h
            gridColumnEnd: `span ${duration}`,
        };
    };

    return React.createElement('div', { className: 'fixed inset-0 z-[150] bg-gray-100 flex flex-col animate-fadeIn' },
        // Header
        React.createElement('div', { className: 'bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm' },
            React.createElement('div', null,
                React.createElement('h1', { className: 'text-2xl font-bold text-slate-800 flex items-center gap-3' },
                    React.createElement('i', { className: 'fas fa-calendar-alt text-blue-600' }),
                    'Planning Maître de Production'
                ),
                React.createElement('p', { className: 'text-sm text-slate-500 mt-1' }, 'Vue unifiée Maintenance / Production (Maquette)')
            ),
            React.createElement('button', {
                onClick: onClose,
                className: 'bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition'
            }, 'Fermer')
        ),

        // Toolbar
        React.createElement('div', { className: 'bg-white border-b px-6 py-3 flex gap-4 items-center' },
            React.createElement('button', { className: 'px-3 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 text-sm font-bold' }, 'Aujourd\'hui'),
            React.createElement('div', { className: 'h-6 w-px bg-gray-300 mx-2' }),
            React.createElement('div', { className: 'flex items-center gap-2' },
                React.createElement('span', { className: 'w-3 h-3 rounded-full bg-red-500' }),
                React.createElement('span', { className: 'text-xs font-medium text-gray-600' }, 'Arrêt Critique')
            ),
            React.createElement('div', { className: 'flex items-center gap-2' },
                React.createElement('span', { className: 'w-3 h-3 rounded-full bg-orange-400' }),
                React.createElement('span', { className: 'text-xs font-medium text-gray-600' }, 'Préventif')
            ),
            React.createElement('div', { className: 'flex items-center gap-2' },
                React.createElement('span', { className: 'w-3 h-3 rounded-full bg-blue-600' }),
                React.createElement('span', { className: 'text-xs font-medium text-gray-600' }, 'Production Planifiée')
            ),
        ),

        // Main Gantt Area
        React.createElement('div', { className: 'flex-1 overflow-auto p-6' },
            React.createElement('div', { className: 'bg-white rounded-xl shadow border border-slate-200 overflow-hidden min-w-[1000px]' },
                
                // Timeline Header
                React.createElement('div', { className: 'grid grid-cols-[200px_repeat(12,1fr)] border-b bg-slate-50' },
                    React.createElement('div', { className: 'p-4 font-bold text-slate-700 border-r' }, 'Machine'),
                    hours.map(h => 
                        React.createElement('div', { key: h, className: 'p-4 text-center text-sm font-mono text-slate-500 border-r last:border-r-0' }, `${h}:00`)
                    )
                ),

                // Rows
                machines.map(machine => 
                    React.createElement('div', { key: machine.id, className: 'grid grid-cols-[200px_repeat(12,1fr)] border-b last:border-b-0 hover:bg-slate-50 transition' },
                        // Machine Name
                        React.createElement('div', { className: 'p-4 font-medium text-slate-700 border-r flex items-center justify-between' },
                            machine.name,
                            machine.status === 'maintenance' && React.createElement('i', { className: 'fas fa-wrench text-red-500 text-xs' })
                        ),
                        
                        // Grid Cells (Background)
                        React.createElement('div', { className: 'col-span-12 grid grid-cols-12 relative h-16' },
                            // Vertical Lines
                            Array.from({ length: 12 }).map((_, i) => 
                                React.createElement('div', { key: i, className: 'border-r h-full pointer-events-none' })
                            ),

                            // Events
                            events.filter(e => e.machineId === machine.id).map((evt, idx) => 
                                React.createElement('div', {
                                    key: idx,
                                    className: `absolute top-2 bottom-2 rounded-md shadow-sm flex items-center px-2 text-white text-xs font-bold truncate cursor-pointer hover:brightness-110 transition ${evt.color}`,
                                    style: {
                                        left: `${(evt.start - 7) * (100/12)}%`,
                                        width: `${evt.duration * (100/12)}%`
                                    },
                                    title: evt.title
                                }, evt.title)
                            )
                        )
                    )
                )
            )
        )
    );
};
