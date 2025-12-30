const KanbanBoard = ({ 
    tickets, 
    currentUser, 
    columns,
    showArchived, 
    onTicketClick, 
    onTicketMove, 
    onTicketDelete 
}) => {
    // États locaux (exclusifs au tableau)
    const [draggedTicket, setDraggedTicket] = React.useState(null);
    const [dragOverColumn, setDragOverColumn] = React.useState(null);
    const [sortBy, setSortBy] = React.useState('default');
    const [contextMenu, setContextMenu] = React.useState(null);
    
    // États pour le Drag & Drop Mobile (Long Press)
    const [showMoveModal, setShowMoveModal] = React.useState(false);
    const [ticketToMove, setTicketToMove] = React.useState(null);
    const longPressTimer = React.useRef(null);
    const touchDragStart = React.useRef(null);
    const touchDragTicket = React.useRef(null);

    const workflowStatuses = columns.filter(s => s.key !== 'archived' && s.key !== 'completed');
    const completedStatus = columns.find(s => s.key === 'completed');
    const archivedStatus = columns.find(s => s.key === 'archived');

    // --- DETECT ORPHANED TICKETS ---
    // Tickets whose status does not match any visible column
    // Excludes 'cancelled' (hidden by design)
    const columnKeys = new Set(columns.map(c => c.key));
    const orphanedTickets = tickets.filter(t => 
        !columnKeys.has(t.status) && 
        t.status !== 'cancelled'
    );

    // Nettoyage du menu contextuel au clic global
    React.useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    // --- LOGIQUE DE TRI ET FILTRAGE ---
    const getTicketsByStatus = (status) => {
        let filteredTickets = tickets.filter(t => t.status === status);

        // Opérateurs voient uniquement leurs propres tickets
        if (currentUser && currentUser.role === 'operator') {
            filteredTickets = filteredTickets.filter(t => t.reported_by === currentUser.id);
        }

        if (sortBy === 'urgency') {
            const priorityOrder = { critical: 400, high: 300, medium: 200, low: 100 };
            filteredTickets.sort((a, b) => {
                const now = new Date();
                const hoursA = (now - new Date(a.created_at)) / (1000 * 60 * 60);
                const hoursB = (now - new Date(b.created_at)) / (1000 * 60 * 60);
                const scoreA = priorityOrder[a.priority] + hoursA;
                const scoreB = priorityOrder[b.priority] + hoursB;
                return scoreB - scoreA;
            });
        } else if (sortBy === 'oldest') {
            filteredTickets.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        } else if (sortBy === 'scheduled') {
            filteredTickets.sort((a, b) => {
                const hasScheduledA = a.scheduled_date && a.scheduled_date !== 'null';
                const hasScheduledB = b.scheduled_date && b.scheduled_date !== 'null';
                if (hasScheduledA && !hasScheduledB) return -1;
                if (!hasScheduledA && hasScheduledB) return 1;
                if (!hasScheduledA && !hasScheduledB) return 0;
                return parseUTCDate(a.scheduled_date) - parseUTCDate(b.scheduled_date);
            });
        }
        return filteredTickets;
    };

    // --- GESTION DRAG & DROP SOURIS ---
    const handleDragStart = (e, ticket) => {
        if (currentUser && currentUser.role === 'operator') {
            e.preventDefault();
            return;
        }
        setDraggedTicket(ticket);
        e.currentTarget.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', ticket.id);
        
        // Désactiver scroll horizontal pour fluidité
        const scrollContainer = document.querySelector('.overflow-x-auto');
        if (scrollContainer) scrollContainer.style.overflowX = 'hidden';
    };

    const handleDragEnd = (e) => {
        e.currentTarget.classList.remove('dragging');
        setDraggedTicket(null);
        setDragOverColumn(null);
        const scrollContainer = document.querySelector('.overflow-x-auto');
        if (scrollContainer) scrollContainer.style.overflowX = 'auto';
    };

    const handleDragOver = (e, status) => {
        if (status === 'orphaned') return; // Prevent dropping into orphaned column
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumn(status);
    };

    const handleDragLeave = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return;
        setDragOverColumn(null);
    };

    const handleDrop = (e, targetStatus) => {
        e.preventDefault();
        setDragOverColumn(null);
        if (!draggedTicket) return;
        if (draggedTicket.status !== targetStatus) {
            onTicketMove(draggedTicket, targetStatus);
        }
        setDraggedTicket(null);
    };

    // --- GESTION TOUCH MOBILE ---
    const handleTouchStart = (e, ticket) => {
        if (currentUser && currentUser.role === 'operator') return;
        const touch = e.touches[0];
        touchDragStart.current = { x: touch.clientX, y: touch.clientY };
        touchDragTicket.current = ticket;

        if (navigator.vibrate) navigator.vibrate(10);

        longPressTimer.current = setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
            setTicketToMove(ticket);
            setShowMoveModal(true);
            touchDragStart.current = null;
            touchDragTicket.current = null;
        }, 500);
    };

    const handleTouchMove = (e) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        if (!touchDragStart.current || !touchDragTicket.current) return;

        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchDragStart.current.x);
        const deltaY = Math.abs(touch.clientY - touchDragStart.current.y);

        if (deltaX > 10 || deltaY > 10) {
            e.preventDefault();
            setDraggedTicket(touchDragTicket.current);
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            const column = element?.closest('.kanban-column');
            if (column) {
                setDragOverColumn(column.getAttribute('data-status'));
            }
        }
    };

    const handleTouchEnd = (e) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        if (draggedTicket && dragOverColumn && draggedTicket.status !== dragOverColumn) {
            onTicketMove(draggedTicket, dragOverColumn);
        }
        touchDragStart.current = null;
        touchDragTicket.current = null;
        setDraggedTicket(null);
        setDragOverColumn(null);
    };

    // --- MENU CONTEXTUEL ---
    const handleContextMenu = (e, ticket) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentUser && currentUser.role === 'operator') return;

        const menuWidth = 200;
        const menuHeightEstimate = 350;
        let x = e.clientX || (e.touches && e.touches[0].clientX);
        let y = e.clientY || (e.touches && e.touches[0].clientY);
        let openUpward = false;

        if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
        
        const spaceBelow = window.innerHeight - y;
        const spaceAbove = y;
        const headerMargin = window.innerWidth < 768 ? 120 : 85;

        if (spaceBelow < menuHeightEstimate && spaceAbove > spaceBelow) {
            openUpward = true;
            y = Math.max(headerMargin, y - Math.min(menuHeightEstimate, spaceAbove - headerMargin));
        } else {
            y = Math.min(y, window.innerHeight - 60);
        }

        setContextMenu({ x, y, ticket, openUpward });
    };

    // --- RENDER HELPERS ---
    const renderTicketCard = (ticket) => {
        const hasAssigned = ticket.assigned_to !== null && ticket.assigned_to !== undefined;
        const isScheduled = hasScheduledDate(ticket.scheduled_date);
        const isArchived = ticket.status === 'archived'; // Bannière masquée uniquement pour archivés
        const isCompletedOrArchived = ticket.status === 'completed' || ticket.status === 'archived'; // Pour le countdown

        return React.createElement('div', {
            key: ticket.id,
            className: 'ticket-card priority-' + ticket.priority + (draggedTicket?.id === ticket.id ? ' dragging' : ''),
            draggable: currentUser && currentUser.role !== 'operator',
            onClick: (e) => {
                if (e.type === 'click' && !e.defaultPrevented) onTicketClick(ticket.id);
            },
            onDragStart: (e) => handleDragStart(e, ticket),
            onDragEnd: handleDragEnd,
            onTouchStart: (e) => handleTouchStart(e, ticket),
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
            onContextMenu: (e) => handleContextMenu(e, ticket),
            title: currentUser && currentUser.role === 'operator' ? 'Détails' : 'Détails | Glisser | Clic droit',
            role: 'article',
            'aria-label': 'Ticket ' + ticket.ticket_id + ': ' + ticket.title + ', Priorité ' + ticket.priority,
            tabIndex: 0
        },
            // BANNIÈRE ASSIGNATION/PLANIFICATION (visible même si terminé, masquée si archivé)
            (hasAssigned && !isArchived) ? React.createElement('div', {
                className: 'mb-2 -mx-3 -mt-3 px-2 py-1.5 flex items-center gap-1.5 rounded-t-lg overflow-hidden ' + (isScheduled
                    ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 shadow-sm border-b-2 border-green-400'
                    : 'bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 shadow-sm border-b-2 border-cyan-400'),
                style: { fontSize: '11px' }
            },
                React.createElement('div', { className: 'flex items-center gap-1 px-1.5 py-0.5 rounded flex-shrink-0 ' + (isScheduled
                    ? 'bg-gradient-to-br from-green-500 to-green-600 border border-green-300'
                    : 'bg-gradient-to-br from-cyan-500 to-cyan-600 border border-cyan-300')
                },
                    React.createElement('i', { className: 'text-white drop-shadow-lg text-[9px] ' + (isScheduled ? 'fas fa-calendar-check' : 'fas fa-user-check') }),
                    React.createElement('span', { className: 'text-white font-extrabold tracking-wide drop-shadow-md' }, isScheduled ? "PLANIFIÉ" : "ASSIGNÉ")
                ),
                React.createElement('span', { className: 'text-white font-bold text-center flex-1 min-w-0 px-1.5 py-0.5 rounded border truncate ' + (isScheduled ? 'bg-blue-800/60 border-blue-500/40' : 'bg-slate-800/70 border-cyan-500/50') },
                    ticket.assigned_to === 0 ? "👥 Équipe" : "👤 " + (ticket.assignee_name || 'Tech #' + ticket.assigned_to)
                ),
                (ticket.scheduled_date && ticket.scheduled_date !== 'null') ? React.createElement('span', { className: 'text-white font-bold bg-gradient-to-br from-blue-800 to-blue-900 px-1.5 py-0.5 rounded border border-blue-600 whitespace-nowrap flex-shrink-0' },
                    parseUTCDate(ticket.scheduled_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                ) : null
            ) : null,

            // ID & TITRE
            React.createElement('div', { className: 'mb-1' },
                React.createElement('span', { className: 'text-xs text-gray-500 font-mono' }, ticket.ticket_id)
            ),
            React.createElement('h4', { className: 'font-bold text-gray-900 mb-1 text-sm line-clamp-2' }, ticket.title),
            
            // PRIORITÉ & MACHINE
            React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                React.createElement('span', {
                    className: 'inline-block text-xs px-1.5 py-0.5 rounded font-semibold whitespace-nowrap ' +
                    (ticket.priority === 'critical' ? 'bg-red-100 text-igp-red' :
                     ticket.priority === 'high' ? 'bg-amber-100 text-igp-yellow' :
                     ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                     'bg-green-100 text-igp-green')
                },
                    ticket.priority === 'critical' ? '🔴 CRIT' :
                    ticket.priority === 'high' ? '🟠 HAUT' :
                    ticket.priority === 'medium' ? '🟡 MOY' : '🟢 BAS'
                ),
                React.createElement('span', { className: 'text-xs text-gray-600 truncate flex-1' }, 
                    ticket.machine_type + (ticket.model ? ' ' + ticket.model : '')
                )
            ),

            // RAPPORTEUR
            React.createElement('div', {
                className: 'text-xs text-gray-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mb-1 overflow-hidden pointer-events-none'
            },
                React.createElement('i', { className: 'fas fa-user mr-1 text-blue-600' }),
                React.createElement('span', { className: 'font-semibold' }, 'Rapporté par ' + (ticket.reporter_name || 'N/A'))
            ),

            // COMPTE A REBOURS PLANIFIÉ
            (ticket.scheduled_date && !isCompletedOrArchived) ? React.createElement('div', { className: 'flex flex-col gap-1 mb-1' },
                React.createElement('div', { className: 'flex items-center gap-1' },
                    React.createElement(ScheduledCountdown, { scheduledDate: ticket.scheduled_date })
                )
            ) : null,

            // FOOTER CARTE (Date, Medias, Timer)
            React.createElement('div', { className: 'flex items-center justify-between gap-2 text-xs' },
                React.createElement('div', { className: 'flex items-center text-gray-500' },
                    React.createElement('i', { className: 'far fa-clock mr-1' }),
                    React.createElement('span', {}, formatDateEST(ticket.created_at, false))
                ),
                ticket.media_count > 0 ? React.createElement('div', { className: 'flex items-center text-igp-blue font-semibold' },
                    React.createElement('i', { className: 'fas fa-camera mr-1' }),
                    React.createElement('span', {}, ticket.media_count)
                ) : null
            ),
            React.createElement(TicketTimer, {
                createdAt: ticket.created_at,
                status: ticket.status
            })
        );
    };

    const renderColumn = (status, ticketList) => {
        // Limiter affichage pour terminé/archivé pour perf
        const displayTickets = (status.key === 'completed' || status.key === 'archived') 
            ? ticketList.slice(0, 20) 
            : ticketList;
        
        const isDragOver = dragOverColumn === status.key;
        const hasTickets = ticketList.length > 0;
        
        return React.createElement('div', {
            key: status.key,
            className: 'kanban-column' + (isDragOver ? ' drag-over' : '') + (hasTickets ? ' has-tickets' : ' empty'),
            'data-status': status.key,
            onDragOver: (e) => handleDragOver(e, status.key),
            onDragLeave: handleDragLeave,
            onDrop: (e) => handleDrop(e, status.key),
            role: 'region',
            'aria-label': status.label + ' - ' + ticketList.length + ' tickets',
            'aria-dropeffect': isDragOver ? 'move' : 'none'
        },
            React.createElement('div', { className: 'mb-3 flex items-center justify-between kanban-column-header' },
                React.createElement('div', { className: 'flex items-center min-w-0 flex-1' },
                    React.createElement('i', { className: 'fas fa-' + status.icon + ' text-' + status.color + '-500 mr-1.5 text-sm' }),
                    React.createElement('h3', { className: 'font-bold text-gray-700 text-sm truncate' }, status.label)
                ),
                React.createElement('span', {
                    className: 'bg-' + status.color + '-100 text-' + status.color + '-800 text-xs font-semibold px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0'
                }, ticketList.length)
            ),
            // Dropdown de tri
            ticketList.length > 2 ? React.createElement('div', { className: 'mb-3 flex items-center gap-2' },
                React.createElement('label', { className: 'text-xs text-gray-600 font-medium whitespace-nowrap' }, 'Trier:'),
                React.createElement('select', {
                    value: sortBy,
                    onChange: (e) => setSortBy(e.target.value),
                    className: 'flex-1 text-xs px-2 py-1 border rounded bg-white cursor-pointer'
                },
                    React.createElement('option', { value: 'default' }, 'Défaut'),
                    React.createElement('option', { value: 'urgency' }, '🔥 Urgence'),
                    React.createElement('option', { value: 'oldest' }, '⏰ Ancien'),
                    React.createElement('option', { value: 'scheduled' }, '📅 Planifié')
                )
            ) : null,
            React.createElement('div', { className: 'space-y-2' },
                displayTickets.map(renderTicketCard)
            )
        );
    };

    // --- RENDU PRINCIPAL ---
    return React.createElement('div', {},
        React.createElement(MoveTicketBottomSheet, {
            show: showMoveModal,
            onClose: () => { setShowMoveModal(false); setTicketToMove(null); },
            ticket: ticketToMove,
            onMove: onTicketMove,
            onDelete: onTicketDelete,
            currentUser: currentUser
        }),

        // PORTAL MENU CONTEXTUEL
        contextMenu && typeof ReactDOM !== 'undefined' && ReactDOM.createPortal ? ReactDOM.createPortal(
            React.createElement('div', {
                style: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 9999 },
                onClick: () => setContextMenu(null)
            },
                React.createElement('div', {
                    className: 'context-menu',
                    style: { position: 'fixed', top: contextMenu.y + 'px', left: contextMenu.x + 'px', zIndex: 10000 },
                    onClick: (e) => e.stopPropagation()
                },
                    React.createElement('div', { className: 'font-bold text-xs text-gray-500 px-3 py-2 border-b' }, 'Déplacer vers:'),
                    columns.map(status => {
                        const isCurrent = status.key === contextMenu.ticket.status;
                        return React.createElement('div', {
                            key: status.key,
                            className: 'context-menu-item' + (isCurrent ? ' bg-gray-100 cursor-not-allowed' : ''),
                            onClick: () => {
                                if (!isCurrent) {
                                    onTicketMove(contextMenu.ticket, status.key);
                                    setContextMenu(null);
                                }
                            }
                        },
                            React.createElement('i', { className: 'fas fa-' + status.icon + ' text-' + status.color + '-500 mr-2' }),
                            status.label
                        );
                    }),
                    (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') ? React.createElement('div', {
                        className: 'context-menu-item text-red-600 border-t mt-1',
                        onClick: () => {
                            onTicketDelete(contextMenu.ticket.id);
                            setContextMenu(null);
                        }
                    }, 
                        React.createElement('i', { className: 'fas fa-trash mr-2' }), 'Supprimer'
                    ) : null
                )
            ), document.body
        ) : null,

        // GRILLE KANBAN
        React.createElement('div', { className: 'space-y-4' },
            // 1. FLUX PRINCIPAL UNIFIÉ (Workflow + Terminés)
            // Correction Desktop : "Terminé" est maintenant dans la même ligne que les autres
            React.createElement('div', { className: 'overflow-x-auto pb-4', style: { minHeight: '500px' } }, // MinHeight pour confort
                React.createElement('div', { className: 'kanban-grid flex gap-3 items-start' }, // items-start pour alignement propre
                    
                    // A. Workflow (Reçue -> En Cours...)
                    workflowStatuses.map(status => renderColumn(status, getTicketsByStatus(status.key))),
                    
                    // B. Terminés (Maintenant à droite du flux, pas en dessous)
                    completedStatus ? renderColumn(completedStatus, getTicketsByStatus('completed')) : null,

                    // C. Orphelins (Toujours à la fin si présents)
                    orphanedTickets.length > 0 ? renderColumn({
                        key: 'orphaned',
                        label: '⚠️ Non classés',
                        icon: 'exclamation-triangle',
                        color: 'red'
                    }, orphanedTickets) : null
                )
            ),

            // 2. Archivés (Section séparée en bas)
            (showArchived && archivedStatus) ? React.createElement('div', { id: 'archived-section', className: 'mt-8 border-t-2 border-dashed border-gray-200 pt-6' },
                React.createElement('div', { className: 'flex items-center gap-2 mb-4 px-2' },
                    React.createElement('i', { className: 'fas fa-archive text-gray-400' }),
                    React.createElement('h3', { className: 'text-gray-500 font-bold uppercase tracking-wider text-xs' }, 'Zone d\'Archives')
                ),
                React.createElement('div', { className: 'overflow-x-auto pb-4' },
                    React.createElement('div', { className: 'kanban-grid flex gap-3' },
                        renderColumn(archivedStatus, getTicketsByStatus('archived'))
                    )
                )
            ) : null
        )
    );
};