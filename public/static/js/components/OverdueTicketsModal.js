// Composant modal des tickets en retard
const OverdueTicketsModal = ({ show, onClose, currentUser }) => {
    const [loading, setLoading] = React.useState(true);
    const [overdueTickets, setOverdueTickets] = React.useState([]);
    const [ticketComments, setTicketComments] = React.useState({});

    React.useEffect(() => {
        if (show) {
            loadOverdueTickets();
        }
    }, [show]);

    const loadOverdueTickets = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/tickets', {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                }
            });
            const data = await response.json();
            
            // Filter overdue tickets
            const now = new Date();
            const overdue = (data.tickets || []).filter(ticket => {
                if (ticket.status === 'completed' || ticket.status === 'cancelled' || ticket.status === 'archived') {
                    return false;
                }
                // Handle both null and string "null" from database
                if (!ticket.scheduled_date || ticket.scheduled_date === 'null') {
                    return false;
                }
                // CRITICAL FIX: Force UTC interpretation to avoid timezone issues
                // Replace space with 'T' and add 'Z' for consistent ISO 8601 UTC format
                // "2025-11-25 10:16:00" → "2025-11-25T10:16:00Z"
                const isoDate = ticket.scheduled_date.replace(' ', 'T') + 'Z';
                const scheduledDate = new Date(isoDate);
                return scheduledDate < now;
            });
            
            // Sort by scheduled date (oldest first)
            overdue.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
            
            setOverdueTickets(overdue);
            
            // Load comments for all overdue tickets IN PARALLEL (10x faster)
            if (overdue.length > 0) {
                // OPTIMIZATION v2.9.16: Load all comments in parallel with 5s timeout
                const commentPromises = overdue.map(async (ticket) => {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    
                    try {
                        const commentsResponse = await fetch('/api/comments/ticket/' + ticket.id, {
                            headers: {
                                'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                            },
                            signal: controller.signal
                        });
                        clearTimeout(timeoutId);
                        const commentsData = await commentsResponse.json();
                        return { id: ticket.id, comments: commentsData.comments || [] };
                    } catch (err) {
                        clearTimeout(timeoutId);
                        console.warn('Timeout/Error loading comments for ticket ' + ticket.id, err);
                        return { id: ticket.id, comments: [] };
                    }
                });

                const results = await Promise.all(commentPromises);
                const commentsMap = {};
                results.forEach(result => {
                    commentsMap[result.id] = result.comments;
                });
                setTicketComments(commentsMap);
            }
        } catch (error) {
            console.error('Erreur chargement tickets en retard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDaysOverdue = (scheduledDate) => {
        const now = new Date();
        const scheduled = new Date(scheduledDate);
        const diffTime = Math.abs(now - scheduled);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'critical': 'bg-red-100 text-red-800 border-red-300',
            'high': 'bg-orange-100 text-orange-800 border-orange-300',
            'medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'low': 'bg-green-100 text-green-800 border-green-300'
        };
        return colors[priority] || colors.medium;
    };

    const getPriorityLabel = (priority) => {
        const labels = {
            'critical': 'Critique',
            'high': 'Haute',
            'medium': 'Moyenne',
            'low': 'Basse'
        };
        return labels[priority] || priority;
    };

    if (!show) return null;

    return React.createElement('div', {
        className: 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4',
        onClick: onClose
    },
        React.createElement('div', {
            className: 'bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden',
            onClick: (e) => e.stopPropagation()
        },
            // Header
            React.createElement('div', { 
                className: 'bg-gradient-to-r from-rose-800 to-rose-900 text-white p-4 sm:p-6'
            },
                React.createElement('div', { className: 'flex justify-between items-center' },
                    React.createElement('div', {},
                        React.createElement('h2', { className: 'text-lg sm:text-2xl font-bold flex items-center gap-2' },
                            React.createElement('i', { className: 'fas fa-exclamation-triangle' }),
                            'Tickets en Retard'
                        ),
                        React.createElement('p', { className: 'text-rose-200 text-xs sm:text-sm mt-1' }, 
                            'Interventions nécessitant une attention immédiate'
                        )
                    ),
                    React.createElement('button', {
                        className: 'text-white hover:bg-white hover:bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center transition-colors',
                        onClick: onClose
                    }, React.createElement('i', { className: 'fas fa-times' }))
                )
            ),

            // Content
            React.createElement('div', { className: 'p-3 sm:p-6 overflow-y-auto max-h-[calc(90vh-100px)] sm:max-h-[calc(90vh-120px)]' },
                loading ? 
                    React.createElement('div', { className: 'text-center py-12' },
                        React.createElement('i', { className: 'fas fa-spinner fa-spin text-4xl text-rose-600 mb-4' }),
                        React.createElement('p', { className: 'text-gray-600' }, 'Chargement des tickets...')
                    ) :
                    overdueTickets.length > 0 ?
                        React.createElement('div', { className: 'space-y-3 sm:space-y-4' },
                            // Stats summary
                            React.createElement('div', { className: 'bg-rose-50 border border-rose-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6' },
                                React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                    React.createElement('i', { className: 'fas fa-info-circle text-rose-700' }),
                                    React.createElement('h4', { className: 'font-semibold text-gray-800' }, 'Résumé')
                                ),
                                React.createElement('p', { className: 'text-sm text-gray-700' },
                                    React.createElement('span', { className: 'font-bold text-rose-800' }, overdueTickets.length),
                                    ' ticket(s) en retard nécessitant une action urgente.'
                                )
                            ),

                            // Tickets list
                            overdueTickets.map((ticket) =>
                                React.createElement('div', {
                                    key: ticket.id,
                                    className: 'border-2 border-rose-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow bg-white'
                                },
                                    React.createElement('div', { className: 'flex flex-col sm:flex-row justify-between items-start mb-3 gap-2' },
                                        React.createElement('div', { className: 'flex-1' },
                                            React.createElement('h3', { className: 'font-bold text-gray-800 mb-1' }, ticket.title),
                                            React.createElement('p', { className: 'text-sm text-gray-600 mb-2' }, ticket.ticket_id)
                                        ),
                                        React.createElement('div', { className: 'flex flex-col items-end gap-2' },
                                            React.createElement('span', { 
                                                className: 'px-3 py-1 rounded-full text-xs font-bold border-2 ' + getPriorityColor(ticket.priority)
                                            }, getPriorityLabel(ticket.priority)),
                                            React.createElement('span', { 
                                                className: 'px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border-2 border-red-300'
                                            }, 
                                                React.createElement('i', { className: 'fas fa-clock mr-1' }),
                                                getDaysOverdue(ticket.scheduled_date) + ' jours'
                                            )
                                        )
                                    ),
                                    React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm' },
                                        React.createElement('div', { className: 'flex flex-wrap' },
                                            React.createElement('span', { className: 'text-gray-500' }, 'Machine: '),
                                            React.createElement('span', { className: 'font-medium ml-1' }, ticket.machine_type + ' - ' + ticket.model)
                                        ),
                                        React.createElement('div', { className: 'flex flex-wrap' },
                                            React.createElement('span', { className: 'text-gray-500' }, 'Assigné à: '),
                                            React.createElement('span', { className: 'font-medium ml-1 break-all' }, ticket.assignee_name || 'Non assigné')
                                        ),
                                        React.createElement('div', { className: 'flex flex-wrap' },
                                            React.createElement('span', { className: 'text-gray-500' }, 'Date prévue: '),
                                            React.createElement('span', { className: 'font-medium text-red-600 ml-1' }, 
                                                new Date(ticket.scheduled_date.replace(' ', 'T') + 'Z').toLocaleDateString('fr-FR')
                                            )
                                        ),
                                        React.createElement('div', { className: 'flex flex-wrap' },
                                            React.createElement('span', { className: 'text-gray-500' }, 'Lieu: '),
                                            React.createElement('span', { className: 'font-medium ml-1' }, ticket.location)
                                        )
                                    ),
                                    // Comments section
                                    ticketComments[ticket.id] && ticketComments[ticket.id].length > 0 && 
                                    React.createElement('div', { className: 'mt-3 pt-3 border-t border-rose-100' },
                                        React.createElement('h4', { className: 'text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1' },
                                            React.createElement('i', { className: 'fas fa-comment text-rose-600' }),
                                            'Commentaires (' + ticketComments[ticket.id].length + ')'
                                        ),
                                        React.createElement('div', { className: 'space-y-2 max-h-32 overflow-y-auto' },
                                            ticketComments[ticket.id].map((comment, idx) =>
                                                React.createElement('div', { 
                                                    key: idx,
                                                    className: 'bg-gray-50 rounded p-2 text-xs'
                                                },
                                                    React.createElement('div', { className: 'font-semibold text-rose-700 mb-1' },
                                                        'Commentaire de ' + comment.user_name + ':'
                                                    ),
                                                    React.createElement('div', { className: 'text-gray-700' },
                                                        comment.comment
                                                    )
                                                )
                                            )
                                        )
                                    )
                                )
                            )
                        ) :
                        React.createElement('div', {
                            className: 'text-center py-12 bg-gray-50 rounded-lg'
                        },
                            React.createElement('i', { className: 'fas fa-check-circle text-5xl text-green-500 mb-4' }),
                            React.createElement('p', { className: 'text-gray-600 font-medium' }, 
                                'Aucun ticket en retard !'
                            ),
                            React.createElement('p', { className: 'text-sm text-gray-500 mt-2' }, 
                                'Toutes les interventions sont à jour.'
                            )
                        )
            )
        )
    );
};
