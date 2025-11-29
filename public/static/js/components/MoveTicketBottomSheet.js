// ===== BOTTOM SHEET MOBILE POUR DEPLACER TICKETS =====
const MoveTicketBottomSheet = ({ show, onClose, ticket, onMove, onDelete, currentUser }) => {
    const statuses = [
        { key: 'received', label: 'Requete Recue', icon: '🟦', color: 'bg-blue-50 hover:bg-blue-100 active:bg-blue-200' },
        { key: 'diagnostic', label: 'Diagnostic', icon: '🟨', color: 'bg-yellow-50 hover:bg-yellow-100 active:bg-yellow-200' },
        { key: 'in_progress', label: 'En Cours', icon: '🟧', color: 'bg-orange-50 hover:bg-orange-100 active:bg-orange-200' },
        { key: 'waiting_parts', label: 'En Attente Pieces', icon: '🟪', color: 'bg-purple-50 hover:bg-purple-100 active:bg-purple-200' },
        { key: 'completed', label: 'Termine', icon: '🟩', color: 'bg-green-50 hover:bg-green-100 active:bg-green-200' },
        { key: 'archived', label: 'Archive', icon: '⬜', color: 'bg-gray-50 hover:bg-gray-100 active:bg-gray-200' }
    ];

    if (!show || !ticket) return null;

    // Verifier si ticket est assigné ou planifié (pour affichage info seulement, pas de blocage)
    const isAssigned = ticket.assigned_to !== null && ticket.assigned_to !== undefined;
    const isPlanned = isAssigned && ticket.scheduled_date;

    const handleStatusSelect = async (status) => {
        if (status === ticket.status) {
            onClose();
            return;
        }

        if (navigator.vibrate) {
            navigator.vibrate(30);
        }

        await onMove(ticket, status);
        onClose();
    };

    return React.createElement('div', {
        className: 'fixed inset-0 z-[100] flex items-end bottom-sheet-backdrop no-tap-highlight',
        style: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
        },
        onClick: onClose
    },
        React.createElement('div', {
            className: 'bg-white w-full rounded-t-3xl shadow-2xl bottom-sheet-content',
            style: {
                maxHeight: '80vh'
            },
            onClick: (e) => e.stopPropagation()
        },
            React.createElement('div', {
                className: 'p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100'
            },
                React.createElement('div', { className: 'flex items-center justify-between mb-2' },
                    React.createElement('h3', { className: 'text-lg font-bold text-gray-800' }, 'Deplacer le ticket'),
                    React.createElement('button', {
                        onClick: onClose,
                        className: 'text-gray-500 hover:text-gray-700 text-2xl leading-none p-2 no-tap-highlight',
                        type: 'button'
                    }, '×')
                ),
                React.createElement('div', { className: 'text-sm' },
                    React.createElement('div', { className: 'font-mono text-xs text-gray-600' }, ticket.ticket_id),
                    React.createElement('div', { className: 'font-semibold text-gray-800 mt-1 truncate' }, ticket.title)
                ),
                isAssigned ? React.createElement('div', {
                    className: 'mt-2 text-xs px-2 py-1 rounded ' + (isPlanned
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-orange-100 text-orange-700')
                }, isPlanned
                    ? 'ℹ️ Ticket planifié - Déplacement manuel possible'
                    : 'ℹ️ Ticket assigné - Déplacement manuel possible') : null
            ),

            React.createElement('div', {
                className: 'p-4 space-y-2 overflow-y-auto',
                style: { maxHeight: '50vh' }
            },
                statuses.map(status =>
                    React.createElement('button', {
                        key: status.key,
                        onClick: () => handleStatusSelect(status.key),
                        disabled: status.key === ticket.status,
                        className:
                            'w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between no-tap-highlight ' +
                            (status.key === ticket.status
                                ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
                                : status.color + ' border-transparent'),
                        style: {
                            minHeight: '60px'
                        },
                        type: 'button'
                    },
                        React.createElement('div', { className: 'flex items-center gap-3' },
                            React.createElement('span', {
                                className: 'text-3xl',
                                style: { lineHeight: '1' }
                            }, status.icon),
                            React.createElement('span', {
                                className: 'font-semibold text-gray-800 text-left',
                                style: { fontSize: '16px' }
                            }, status.label)
                        ),
                        status.key === ticket.status &&
                            React.createElement('i', {
                                className: 'fas fa-check text-green-600',
                                style: { fontSize: '20px' }
                            })
                    )
                )
            ),

            React.createElement('div', { className: 'p-4 border-t border-gray-200 space-y-2' },
                // Bouton Supprimer (admin/supervisor/technicien peuvent tout supprimer, opérateur seulement ses propres tickets)
                (() => {
                    const canDelete = currentUser?.role === 'admin' || currentUser?.role === 'supervisor' || currentUser?.role === 'technician' ||
                        (currentUser?.role === 'operator' && ticket.reported_by === currentUser?.id);
                    return canDelete;
                })() ?
                React.createElement('button', {
                    onClick: () => {
                        if (navigator.vibrate) navigator.vibrate(50);
                        onDelete(ticket.id);
                    },
                    className: 'w-full p-3 rounded-xl border-2 border-red-100 bg-red-50 text-red-700 font-semibold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors'
                },
                    React.createElement('i', { className: 'fas fa-trash-alt' }),
                    'Supprimer le ticket'
                ) : null,

                React.createElement('button', {
                    onClick: onClose,
                    className: 'w-full p-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors'
                }, 'Annuler')
            )
        )
    );
};
