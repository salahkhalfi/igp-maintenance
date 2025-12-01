const ManageColumnsModal = ({ show, onClose, columns, onSave }) => {
    const [localColumns, setLocalColumns] = React.useState([]);
    const [newColumnName, setNewColumnName] = React.useState('');

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
        if (confirm("Supprimer cette colonne ? Les tickets associés ne seront plus visibles dans le tableau principal (sauf si vous recréez une colonne avec le même statut).")) {
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

    return React.createElement('div', { className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4' },
        React.createElement('div', { className: 'bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col' },
            // Header
            React.createElement('div', { className: 'p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl' },
                React.createElement('h3', { className: 'font-bold text-lg' }, 'Gérer les Colonnes'),
                React.createElement('button', { onClick: onClose }, React.createElement('i', { className: 'fas fa-times' }))
            ),
            
            // Body
            React.createElement('div', { className: 'p-4 overflow-y-auto flex-1' },
                // List
                React.createElement('div', { className: 'space-y-2' },
                    localColumns.map((col, index) => 
                        React.createElement('div', { key: col.key, className: 'flex items-center gap-2 p-2 bg-gray-50 border rounded-lg' },
                            // Drag/Move handles
                            React.createElement('div', { className: 'flex flex-col gap-1' },
                                React.createElement('button', { 
                                    disabled: index === 0,
                                    onClick: () => handleMove(index, 'up'),
                                    className: 'text-gray-400 hover:text-blue-600 disabled:opacity-30'
                                }, React.createElement('i', { className: 'fas fa-chevron-up text-xs' })),
                                React.createElement('button', { 
                                    disabled: index === localColumns.length - 1,
                                    onClick: () => handleMove(index, 'down'),
                                    className: 'text-gray-400 hover:text-blue-600 disabled:opacity-30'
                                }, React.createElement('i', { className: 'fas fa-chevron-down text-xs' }))
                            ),
                            
                            // Icon input
                            React.createElement('div', { className: 'w-32' },
                                React.createElement('input', {
                                    type: 'text',
                                    value: col.icon,
                                    onChange: (e) => handleChange(index, 'icon', e.target.value),
                                    className: 'w-full px-2 py-1 text-sm border rounded',
                                    placeholder: 'fa-icon'
                                }),
                                React.createElement('div', { className: 'text-[10px] text-gray-500 text-center mt-0.5' }, 
                                    React.createElement('i', { className: 'fas fa-' + col.icon })
                                )
                            ),

                            // Color input
                            React.createElement('select', {
                                value: col.color,
                                onChange: (e) => handleChange(index, 'color', e.target.value),
                                className: 'px-2 py-1 text-sm border rounded font-bold text-' + col.color + '-800 bg-' + col.color + '-100'
                            },
                                ['blue', 'green', 'red', 'yellow', 'orange', 'purple', 'gray', 'indigo', 'pink', 'teal'].map(c => 
                                    React.createElement('option', { key: c, value: c }, c)
                                )
                            ),

                            // Label input
                            React.createElement('input', {
                                type: 'text',
                                value: col.label,
                                onChange: (e) => handleChange(index, 'label', e.target.value),
                                className: 'flex-1 px-2 py-1 text-sm border rounded font-bold'
                            }),

                            // Key (readonly)
                            React.createElement('span', { className: 'text-xs text-gray-400 font-mono w-24 truncate', title: col.key }, col.key),

                            // Delete action
                            React.createElement('button', {
                                onClick: () => handleDelete(col.key),
                                disabled: ['received', 'completed', 'archived'].includes(col.key),
                                className: 'p-2 text-red-500 hover:bg-red-100 rounded disabled:opacity-30 disabled:cursor-not-allowed'
                            }, React.createElement('i', { className: 'fas fa-trash' }))
                        )
                    )
                ),

                // Add new
                React.createElement('form', { onSubmit: handleAddColumn, className: 'mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100' },
                    React.createElement('h4', { className: 'font-bold text-sm text-blue-800 mb-2' }, 'Ajouter une colonne'),
                    React.createElement('div', { className: 'flex gap-2' },
                        React.createElement('input', {
                            type: 'text',
                            value: newColumnName,
                            onChange: (e) => setNewColumnName(e.target.value),
                            placeholder: 'Nom de la colonne...',
                            className: 'flex-1 px-3 py-2 border rounded-lg'
                        }),
                        React.createElement('button', {
                            type: 'submit',
                            className: 'px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700'
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
