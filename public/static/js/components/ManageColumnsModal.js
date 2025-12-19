const ManageColumnsModal = ({ show, onClose, columns, onSave }) => {
    const [localColumns, setLocalColumns] = React.useState([]);
    const [newColumnName, setNewColumnName] = React.useState('');

    // Labels en français pour les couleurs
    const COLOR_LABELS = {
        'blue': 'Bleu',
        'green': 'Vert',
        'red': 'Rouge',
        'yellow': 'Jaune',
        'orange': 'Orange',
        'purple': 'Violet',
        'gray': 'Gris',
        'indigo': 'Indigo',
        'pink': 'Rose',
        'teal': 'Turquoise'
    };

    React.useEffect(() => {
        if (show && columns) {
            setLocalColumns(JSON.parse(JSON.stringify(columns))); // Deep copy
        }
    }, [show, columns]);

    const handleAddColumn = (e) => {
        e.preventDefault();
        if (!newColumnName.trim()) return;
        
        // Generate safe key
        const key = newColumnName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
        
        const newCol = {
            key: key,
            label: newColumnName,
            icon: 'circle',
            color: 'gray'
        };
        
        // Insert before 'completed' if possible, otherwise at end
        const completedIdx = localColumns.findIndex(c => c.key === 'completed');
        const newCols = [...localColumns];
        if (completedIdx !== -1) {
            newCols.splice(completedIdx, 0, newCol);
        } else {
            newCols.push(newCol);
        }
        
        setLocalColumns(newCols);
        setNewColumnName('');
    };

    const handleDelete = (key) => {
        if (['received', 'completed', 'archived'].includes(key)) {
            alert("Ce statut système ne peut pas être supprimé.");
            return;
        }

        // --- SAFETY CHECK: PREVENT ORPHANED TICKETS ---
        // Check if there are tickets in this column currently
        // We use window.MainApp.tickets if available (global state hack for modal)
        // Or simply warn the user strongly. Ideally we check the prop passed down but we don't have tickets prop here.
        // Let's assume the user knows, but we enforce a stronger warning.
        
        // BETTER: Ask the user to confirm there are NO tickets.
        if (confirm("ATTENTION : Avez-vous vérifié que cette colonne est VIDE ?\n\nSi vous supprimez une colonne contenant des tickets, ils deviendront INVISIBLES (fantômes) mais resteront dans la base de données.\n\nÊtes-vous sûr de vouloir continuer ?")) {
             setLocalColumns(localColumns.filter(c => c.key !== key));
        }
    };

    const handleMove = (index, direction) => {
        const newCols = [...localColumns];
        if (direction === 'up' && index > 0) {
            [newCols[index], newCols[index - 1]] = [newCols[index - 1], newCols[index]];
        } else if (direction === 'down' && index < newCols.length - 1) {
            [newCols[index], newCols[index + 1]] = [newCols[index + 1], newCols[index]];
        }
        setLocalColumns(newCols);
    };

    const handleChange = (index, field, value) => {
        const newCols = [...localColumns];
        newCols[index] = { ...newCols[index], [field]: value };
        setLocalColumns(newCols);
    };

    const handleSave = () => {
        onSave(localColumns);
        onClose();
    };

    if (!show) return null;

    return React.createElement('div', { className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-2 sm:p-4' },
        React.createElement('div', { className: 'bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col' },
            // Header
            React.createElement('div', { className: 'p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl' },
                React.createElement('h3', { className: 'font-bold text-lg' }, 'Gérer les Colonnes'),
                React.createElement('button', { onClick: onClose }, React.createElement('i', { className: 'fas fa-times' }))
            ),
            
            // Body
            React.createElement('div', { className: 'p-2 sm:p-4 overflow-y-auto flex-1' },
                // List
                React.createElement('div', { className: 'space-y-3 sm:space-y-2' },
                    localColumns.map((col, index) => 
                        React.createElement('div', { 
                            key: col.key, 
                            className: 'flex flex-wrap sm:flex-nowrap items-center gap-2 p-3 bg-gray-50 border rounded-lg shadow-sm sm:shadow-none' 
                        },
                            // Label input (Full width on mobile, flex on desktop) - ORDER 1 (Mobile Top) / 3 (Desktop Middle)
                            React.createElement('input', {
                                type: 'text',
                                value: col.label,
                                onChange: (e) => handleChange(index, 'label', e.target.value),
                                className: 'w-full sm:w-auto sm:flex-1 px-2 py-1.5 text-base sm:text-sm border rounded font-bold order-1 sm:order-3 bg-white',
                                placeholder: 'Nom de la colonne'
                            }),

                            // Drag/Move handles - ORDER 2 (Mobile Left) / 1 (Desktop Left)
                            React.createElement('div', { className: 'flex sm:flex-col gap-2 sm:gap-1 order-2 sm:order-1 mr-2 sm:mr-0' },
                                React.createElement('button', { 
                                    disabled: index === 0,
                                    onClick: () => handleMove(index, 'up'),
                                    className: 'p-1 bg-white border rounded sm:border-none sm:bg-transparent text-gray-400 hover:text-blue-600 disabled:opacity-30'
                                }, React.createElement('i', { className: 'fas fa-chevron-up text-sm sm:text-xs' })),
                                React.createElement('button', { 
                                    disabled: index === localColumns.length - 1,
                                    onClick: () => handleMove(index, 'down'),
                                    className: 'p-1 bg-white border rounded sm:border-none sm:bg-transparent text-gray-400 hover:text-blue-600 disabled:opacity-30'
                                }, React.createElement('i', { className: 'fas fa-chevron-down text-sm sm:text-xs' }))
                            ),
                            
                            // Icon input - ORDER 3 (Mobile Middle) / 2 (Desktop Left)
                            React.createElement('div', { className: 'w-[40%] sm:w-32 order-3 sm:order-2' },
                                React.createElement('input', {
                                    type: 'text',
                                    value: col.icon,
                                    onChange: (e) => handleChange(index, 'icon', e.target.value),
                                    className: 'w-full px-2 py-1.5 text-sm border rounded bg-white',
                                    placeholder: 'fa-icon'
                                }),
                                React.createElement('div', { className: 'text-[10px] text-gray-500 text-center mt-0.5 hidden sm:block' }, 
                                    React.createElement('i', { className: 'fas fa-' + col.icon })
                                )
                            ),

                            // Color input - ORDER 4 (Mobile Middle) / 2 (Desktop Left)
                            React.createElement('select', {
                                value: col.color,
                                onChange: (e) => handleChange(index, 'color', e.target.value),
                                className: 'w-[40%] sm:w-auto px-2 py-1.5 text-sm border rounded font-bold text-' + col.color + '-800 bg-' + col.color + '-100 order-4 sm:order-2'
                            },
                                Object.entries(COLOR_LABELS).map(([key, label]) => 
                                    React.createElement('option', { key: key, value: key }, label)
                                )
                            ),

                            // Delete action - ORDER 5 (Mobile Right) / 4 (Desktop Right)
                            React.createElement('button', {
                                onClick: () => handleDelete(col.key),
                                disabled: ['received', 'completed', 'archived'].includes(col.key),
                                className: 'p-2 ml-auto sm:ml-0 text-red-500 hover:bg-red-100 rounded disabled:opacity-30 disabled:cursor-not-allowed order-5 sm:order-4'
                            }, React.createElement('i', { className: 'fas fa-trash' })),

                            // Key (hidden on mobile, visible on desktop tooltip)
                            React.createElement('span', { className: 'hidden sm:block text-xs text-gray-400 font-mono w-24 truncate order-last', title: col.key }, col.key)
                        )
                    )
                ),

                // Add new
                React.createElement('form', { onSubmit: handleAddColumn, className: 'mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100' },
                    React.createElement('h4', { className: 'font-bold text-sm text-blue-800 mb-2' }, 'Ajouter une colonne'),
                    React.createElement('div', { className: 'flex flex-col sm:flex-row gap-2' },
                        React.createElement('input', {
                            type: 'text',
                            value: newColumnName,
                            onChange: (e) => setNewColumnName(e.target.value),
                            placeholder: 'Nom de la colonne...',
                            className: 'flex-1 px-3 py-2 border rounded-lg'
                        }),
                        React.createElement('button', {
                            type: 'submit',
                            className: 'px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 w-full sm:w-auto'
                        }, 'Ajouter')
                    )
                )
            ),

            // Footer
            React.createElement('div', { className: 'p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-2' },
                React.createElement('button', {
                    onClick: onClose,
                    className: 'px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg'
                }, 'Annuler'),
                React.createElement('button', {
                    onClick: handleSave,
                    className: 'px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md'
                }, 'Enregistrer')
            )
        )
    );
};

window.ManageColumnsModal = ManageColumnsModal;
