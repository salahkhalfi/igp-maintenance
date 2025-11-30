const MainApp = ({ tickets, machines, currentUser, onLogout, onRefresh, showCreateModal, setShowCreateModal, onTicketCreated, unreadMessagesCount, onRefreshMessages, headerTitle, headerSubtitle }) => {
    const [contextMenu, setContextMenu] = React.useState(null);
    const [selectedTicketId, setSelectedTicketId] = React.useState(null);
    const [showDetailsModal, setShowDetailsModal] = React.useState(false);
    const [showUserManagement, setShowUserManagement] = React.useState(false);
    const [showMachineManagement, setShowMachineManagement] = React.useState(false);
    const [showSystemSettings, setShowSystemSettings] = React.useState(false);
    const [showUserGuide, setShowUserGuide] = React.useState(false);
    const [showArchived, setShowArchived] = React.useState(false);
    const [showMessaging, setShowMessaging] = React.useState(false);
    const [messagingContact, setMessagingContact] = React.useState(null);
    const [messagingTab, setMessagingTab] = React.useState("public");
    const [showScrollTop, setShowScrollTop] = React.useState(false);
    const [showPerformanceModal, setShowPerformanceModal] = React.useState(false);
    const [showOverdueModal, setShowOverdueModal] = React.useState(false);
    const [showPushDevicesModal, setShowPushDevicesModal] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState([]);
    const [showSearchResults, setShowSearchResults] = React.useState(false);
    const [searchLoading, setSearchLoading] = React.useState(false);
    const searchTimeoutRef = React.useRef(null);
    const searchInputRef = React.useRef(null);
    const [searchDropdownPosition, setSearchDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });
    const [searchKeywordResults, setSearchKeywordResults] = React.useState([]);
    const [searchTextResults, setSearchTextResults] = React.useState([]);
    const [searchIsKeyword, setSearchIsKeyword] = React.useState(false);
    const [searchKeywordType, setSearchKeywordType] = React.useState(null);
    const [showMobileMenu, setShowMobileMenu] = React.useState(false);
    
    // Push Notification State
    const [pushSubscribed, setPushSubscribed] = React.useState(false);
    const [pushPermission, setPushPermission] = React.useState(Notification.permission);
    
    React.useEffect(() => {
        const checkPushStatus = async () => {
            if (typeof Notification !== 'undefined') {
                setPushPermission(Notification.permission);
            }
            if (window.isPushSubscribed) {
                try {
                    const sub = await window.isPushSubscribed();
                    setPushSubscribed(sub);
                } catch (e) {
                    console.error('Error checking push status:', e);
                }
            }
        };
        
        checkPushStatus();
        
        const handlePushChange = () => checkPushStatus();
        window.addEventListener('push-notification-changed', handlePushChange);
        
        return () => {
            window.removeEventListener('push-notification-changed', handlePushChange);
        };
    }, []);

    const searchPlaceholdersDesktop = [
        'Essayez: "retard" pour voir les tickets en retard',
        'Essayez: "urgent" pour voir les priorités critiques',
        'Essayez: "commentaire" pour voir les tickets avec notes',
        'Essayez: "haute" pour voir les haute priorité',
        'Ou cherchez par machine, lieu, ticket...'
    ];
    const searchPlaceholdersMobile = [
        'Ex: "retard" tickets en retard',
        'Ex: "urgent" tickets critiques',
        'Ex: "commentaire" avec notes',
        'Ex: "haute" haute priorité',
        'Machine, lieu, ticket...'
    ];
    const isMobile = window.innerWidth < 768;
    const searchPlaceholders = isMobile ? searchPlaceholdersMobile : searchPlaceholdersDesktop;
    const [placeholderIndex, setPlaceholderIndex] = React.useState(0);
    
    // Rotation automatique du placeholder toutes les 4 secondes
    React.useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % searchPlaceholders.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    // Détection du scroll pour afficher/masquer le bouton "Retour en haut"
    React.useEffect(() => {
        const handleScroll = () => {
            // Afficher le bouton seulement si on a scrollé plus de 300px ET que les archives sont affichées
            setShowScrollTop(window.scrollY > 300 && showArchived);
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Vérifier immédiatement

        return () => window.removeEventListener('scroll', handleScroll);
    }, [showArchived]);

    // Recalculer la position du dropdown lors du redimensionnement
    React.useEffect(() => {
        const updateDropdownPosition = () => {
            if (searchInputRef.current && showSearchResults) {
                const rect = searchInputRef.current.getBoundingClientRect();
                setSearchDropdownPosition({
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width
                });
            }
        };

        // Ajouter event listener 'scroll' pour mettre à jour la position en temps réel
        window.addEventListener('scroll', updateDropdownPosition);
        window.addEventListener('resize', updateDropdownPosition);
        window.addEventListener('orientationchange', updateDropdownPosition);

        return () => {
            window.removeEventListener('scroll', updateDropdownPosition);
            window.removeEventListener('resize', updateDropdownPosition);
            window.removeEventListener('orientationchange', updateDropdownPosition);
        };
    }, [showSearchResults]);

    const allStatuses = [
        { key: 'received', label: 'Requête Reçue', icon: 'inbox', color: 'blue' },
        { key: 'diagnostic', label: 'Diagnostic', icon: 'search', color: 'yellow' },
        { key: 'in_progress', label: 'En Cours', icon: 'wrench', color: 'orange' },
        { key: 'waiting_parts', label: 'En Attente Pièces', icon: 'clock', color: 'purple' },
        { key: 'completed', label: 'Terminé', icon: 'check-circle', color: 'green' },
        { key: 'archived', label: 'Archivé', icon: 'archive', color: 'gray' }
    ];

    // Séparer les colonnes actives, terminées et archivées
    const workflowStatuses = allStatuses.filter(s => s.key !== 'archived' && s.key !== 'completed');
    const completedStatus = allStatuses.find(s => s.key === 'completed');
    const archivedStatus = allStatuses.find(s => s.key === 'archived');

    // Fonction pour calculer le nombre de tickets actifs (excluant terminés et archivés)
    const getActiveTicketsCount = () => {
        // Filtrer les tickets actifs: NOT completed AND NOT archived
        let activeTickets = tickets.filter(t => t.status !== 'completed' && t.status !== 'archived');

        // Pour les opérateurs: seulement leurs propres tickets
        if (currentUser && currentUser.role === 'operator') {
            activeTickets = activeTickets.filter(t => t.reported_by === currentUser.id);
        }

        return activeTickets.length;
    };


    React.useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    // Gérer les paramètres URL pour ouvrir automatiquement un ticket ou la messagerie
    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const ticketIdFromUrl = urlParams.get('ticket');
        const autoAction = urlParams.get('auto_action');
        const openMessagesSenderId = urlParams.get('openMessages');
        const openAudioMessageId = urlParams.get('openAudioMessage');
        const senderIdFromAudio = urlParams.get('sender');
        
        // Cas 1: Ouvrir un ticket
        if (ticketIdFromUrl) {
            const ticketId = parseInt(ticketIdFromUrl, 10);
            
            // ALWAYS open modal if ID exists
            console.log('[Push] Opening ticket from URL:', ticketId);
            setSelectedTicketId(ticketId);
            setShowDetailsModal(true);
            
            // Attempt auto-action if ticket is in loaded list
            if (tickets.length > 0) {
                const ticket = tickets.find(t => t.id === ticketId);
                if (ticket) {
                    // Quick Action: "J'y vais !"
                    if (autoAction === 'acknowledge' && ticket.status === 'received') {
                        console.log('[Push] Auto-acknowledging ticket:', ticketId);
                        setTimeout(() => {
                            moveTicketToStatus(ticket, 'in_progress');
                        }, 1500);
                    }
                }
            }
        }
        // Cas 2: Ouvrir la messagerie privée
        else if (openMessagesSenderId) {
            const senderId = parseInt(openMessagesSenderId, 10);
            console.log('[Push] Opening messaging from URL for sender:', senderId);
            setMessagingContact({ id: senderId, first_name: 'Chargement...', role: 'unknown' });
            setMessagingTab('private');
            setShowMessaging(true);
            
            // Nettoyer l'URL
            window.history.replaceState({}, '', window.location.pathname);
        }
        // Cas 3: Ouvrir message audio spécifique
        else if (openAudioMessageId && senderIdFromAudio) {
            const senderId = parseInt(senderIdFromAudio, 10);
            console.log('[Push] Opening audio message from URL:', openAudioMessageId);
            setMessagingContact({ id: senderId, first_name: 'Chargement...', role: 'unknown' });
            setMessagingTab('private');
            setShowMessaging(true);
            
            // Nettoyer l'URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [tickets]);

    // Écouter les messages du Service Worker (notification click quand app déjà ouverte)
    React.useEffect(() => {
        const handleServiceWorkerMessage = (event) => {
            console.log('[Push] Service Worker message received:', event.data);
            
            if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
                const { action, data } = event.data;
                const autoAction = data.auto_action;
                
                // Ouvrir le ticket si action view_ticket ou actions rapides
                if ((action === 'view_ticket' || action === 'view' || action === 'acknowledge') && data.ticketId) {
                    const ticketId = data.ticketId;
                    const ticket = tickets.find(t => t.id === ticketId);
                    
                    if (ticket) {
                        console.log('[Push] Opening ticket from notification click:', ticketId);
                        setSelectedTicketId(ticketId);
                        setShowDetailsModal(true);
                        
                        // Quick Action: "J'y vais !"
                        if (autoAction === 'acknowledge' && ticket.status === 'received') {
                            console.log('[Push] Auto-acknowledging ticket from click:', ticketId);
                            // Delay status update to ensure modal opens smoothly first
                            setTimeout(() => {
                                moveTicketToStatus(ticket, 'in_progress');
                            }, 1500);
                        }
                    } else {
                        console.log('[Push] Ticket not found, reloading data...');
                        // Ticket pas encore chargé, recharger les données
                        loadData().then(() => {
                            const foundTicket = tickets.find(t => t.id === ticketId);
                            if (foundTicket) {
                                setSelectedTicketId(ticketId);
                                setShowDetailsModal(true);
                            }
                        });
                    }
                }
                // Ouvrir messagerie pour messages audio
                else if (action === 'new_audio_message' && data.messageId) {
                    console.log('[Push] Opening audio message from click');
                    if (data.senderId) {
                        setMessagingContact({ id: data.senderId, first_name: data.senderName || 'Utilisateur', role: 'unknown' });
                        setMessagingTab('private');
                    }
                    setShowMessaging(true);
                }
                // Ouvrir conversation privée
                else if (action === 'new_private_message' && data.senderId) {
                    console.log('[Push] Opening private messaging from click:', data.senderId);
                    setMessagingContact({ id: data.senderId, first_name: data.senderName || 'Utilisateur', role: 'unknown' });
                    setMessagingTab('private');
                    setShowMessaging(true);
                }
            }
        };
        
        navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        
        return () => {
            navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
        };
    }, [tickets]);

    const getTicketsByStatus = (status) => {
        let filteredTickets = tickets.filter(t => t.status === status);

        // Opérateurs voient uniquement leurs propres tickets
        if (currentUser && currentUser.role === 'operator') {
            filteredTickets = filteredTickets.filter(t => t.reported_by === currentUser.id);
        }

        // Appliquer le tri selon l'option sélectionnée
        if (sortBy === 'urgency') {
            // Tri par urgence (priorité + temps écoulé)
            const priorityOrder = { critical: 400, high: 300, medium: 200, low: 100 };
            filteredTickets.sort((a, b) => {
                const now = new Date();
                const hoursA = (now - new Date(a.created_at)) / (1000 * 60 * 60);
                const hoursB = (now - new Date(b.created_at)) / (1000 * 60 * 60);
                const scoreA = priorityOrder[a.priority] + hoursA;
                const scoreB = priorityOrder[b.priority] + hoursB;
                return scoreB - scoreA; // Score le plus élevé en premier
            });
        } else if (sortBy === 'oldest') {
            // Tri par ancienneté (plus ancien en premier)
            filteredTickets.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        } else if (sortBy === 'scheduled') {
            // Tri par date planifiée (aujourd'hui/proche en premier)
            filteredTickets.sort((a, b) => {
                const hasScheduledA = a.scheduled_date && a.scheduled_date !== 'null';
                const hasScheduledB = b.scheduled_date && b.scheduled_date !== 'null';

                // Tickets planifiés en premier
                if (hasScheduledA && !hasScheduledB) return -1;
                if (!hasScheduledA && hasScheduledB) return 1;
                if (!hasScheduledA && !hasScheduledB) return 0;

                // Comparer les dates planifiées
                const dateA = parseUTCDate(a.scheduled_date);
                const dateB = parseUTCDate(b.scheduled_date);
                return dateA - dateB; // Plus proche en premier
            });
        }
        // sortBy === 'default' : pas de tri, ordre original

        return filteredTickets;
    };

    // 🔊 Play celebration sound using Web Audio API (0 KB - synthesized)
    const playCelebrationSound = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create three-note ascending ding (C-E-G chord)
            const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
            const now = audioContext.currentTime;
            
            notes.forEach((freq, i) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'sine'; // Smooth tone
                
                // Volume envelope: quick fade in/out
                gainNode.gain.setValueAtTime(0, now + i * 0.08);
                gainNode.gain.linearRampToValueAtTime(0.15, now + i * 0.08 + 0.02); // Low volume
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.3);
                
                oscillator.start(now + i * 0.08);
                oscillator.stop(now + i * 0.08 + 0.3);
            });
        } catch (error) {
            // Silent fail - sound is optional
            console.log('Audio not available:', error);
        }
    };

    const moveTicketToStatus = async (ticket, newStatus) => {
        if (ticket.status === newStatus) return;

        try {
            await axios.patch(API_URL + '/tickets/' + ticket.id, {
                status: newStatus,
                comment: 'Changement de statut: ' + ticket.status + ' → ' + newStatus
            });
            onTicketCreated(); // Refresh
            
            // 🎉 Confetti celebration when ticket is completed!
            // Launch asynchronously to not block UI thread
            if (newStatus === 'completed') {
                // Use requestAnimationFrame for smooth animation
                requestAnimationFrame(() => {
                    // Visual: Confetti (non-blocking, fast animation)
                    if (typeof confetti !== 'undefined') {
                        confetti({
                            particleCount: 100,
                            spread: 70,
                            origin: { y: 0.6 },
                            colors: ['#003B73', '#FFD700', '#C0C0C0', '#4CAF50', '#FF6B6B'],
                            ticks: 120,      // Reduce lifetime (default: 200) - faster disappear
                            gravity: 1.5,    // Increase gravity (default: 1) - faster fall
                            scalar: 0.9      // Smaller particles - lighter, faster
                        });
                    }
                    
                    // Audio: Pleasant "ding" sound (non-blocking)
                    setTimeout(() => playCelebrationSound(), 0);
                });
            }
        } catch (error) {
            alert('Erreur lors du déplacement: ' + (error.response?.data?.error || 'Erreur inconnue'));
        }
    };

    const moveTicketToNext = async (ticket, e) => {
        e.stopPropagation();
        const statusFlow = ['received', 'diagnostic', 'in_progress', 'waiting_parts', 'completed', 'archived'];
        const currentIndex = statusFlow.indexOf(ticket.status);

        if (currentIndex === -1 || currentIndex === statusFlow.length - 1) {
            return; // Déjà au dernier statut
        }

        const nextStatus = statusFlow[currentIndex + 1];
        await moveTicketToStatus(ticket, nextStatus);
    };

    const handleTicketClick = (e, ticket) => {

        if (e.type === 'click' && !e.defaultPrevented) {
            setSelectedTicketId(ticket.id);
            setShowDetailsModal(true);
        }
    };

    const handleContextMenu = (e, ticket) => {
        e.preventDefault();
        e.stopPropagation();

        // Bloquer le menu contextuel uniquement pour les opérateurs
        if (currentUser && currentUser.role === 'operator') {
            return;
        }


        const menuWidth = 200;
        const menuHeightEstimate = 350; // Estimation hauteur menu (ajuster si besoin)
        // Use clientX/clientY instead of pageX/pageY for position:fixed portal
        let x = e.clientX || (e.touches && e.touches[0].clientX);
        let y = e.clientY || (e.touches && e.touches[0].clientY);
        let openUpward = false;

        // Ajuster horizontalement si déborde à droite
        if (x + menuWidth > window.innerWidth) {
            x = window.innerWidth - menuWidth - 10;
        }

        // Vérifier si assez d'espace en bas
        const spaceBelow = window.innerHeight - y;
        const spaceAbove = y;

        // Si pas assez d'espace en bas mais plus d'espace en haut, ouvrir vers le haut
        if (spaceBelow < menuHeightEstimate && spaceAbove > spaceBelow) {
            openUpward = true;
            // Positionner le menu au-dessus du curseur en évitant le header
            // Header height mobile ~110px (logo + search), desktop ~70px. Using safe margin.
            const headerMargin = window.innerWidth < 768 ? 120 : 85;
            y = Math.max(headerMargin, y - Math.min(menuHeightEstimate, spaceAbove - headerMargin));
        } else {
            // Ouvrir vers le bas normalement, mais limiter à l'espace disponible
            y = Math.min(y, window.innerHeight - 60); // Laisser 60px marge minimale
        }

        setContextMenu({
            x: x,
            y: y,
            ticket: ticket,
            openUpward: openUpward
        });
    };


    const [draggedTicket, setDraggedTicket] = React.useState(null);
    const [dragOverColumn, setDragOverColumn] = React.useState(null);
    const [sortBy, setSortBy] = React.useState('default'); // default, priority, date, machine


    const handleDragStart = (e, ticket) => {

        if (currentUser && currentUser.role === 'operator') {
            e.preventDefault();
            return;
        }

        setDraggedTicket(ticket);
        e.currentTarget.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', ticket.id);

        // Désactiver temporairement le scroll horizontal pendant le drag
        const scrollContainer = document.querySelector('.overflow-x-auto');
        if (scrollContainer) {
            scrollContainer.style.overflowX = 'hidden';
        }
    };

    const handleDragEnd = (e) => {
        e.currentTarget.classList.remove('dragging');
        setDraggedTicket(null);
        setDragOverColumn(null);

        // Réactiver le scroll horizontal après le drag
        const scrollContainer = document.querySelector('.overflow-x-auto');
        if (scrollContainer) {
            scrollContainer.style.overflowX = 'auto';
        }
    };

    const handleDragOver = (e, status) => {
        e.preventDefault();
        e.stopPropagation(); // Empêcher la propagation pour meilleure précision
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumn(status);
    };

    const handleDragLeave = (e) => {
        // Ne retirer l'indicateur que si on quitte vraiment la colonne
        // (pas juste en passant sur un ticket enfant)
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;

        // Si le curseur est encore dans les limites de la colonne, ne rien faire
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            return;
        }

        setDragOverColumn(null);
    };

    const handleDrop = async (e, targetStatus) => {
        e.preventDefault();
        setDragOverColumn(null);

        if (!draggedTicket) return;

        if (draggedTicket.status !== targetStatus) {
            await moveTicketToStatus(draggedTicket, targetStatus);
        }

        setDraggedTicket(null);
    };


    // === NOUVEAUX ETATS POUR BOTTOM SHEET (isoles) ===
    const [showMoveModal, setShowMoveModal] = React.useState(false);
    const [ticketToMove, setTicketToMove] = React.useState(null);
    const longPressTimer = React.useRef(null);

    const touchDragStart = React.useRef(null);
    const touchDragTicket = React.useRef(null);

    const handleTouchStart = (e, ticket) => {

        if (currentUser && currentUser.role === 'operator') {
            return;
        }

        const touch = e.touches[0];
        touchDragStart.current = { x: touch.clientX, y: touch.clientY };
        touchDragTicket.current = ticket;

        // === LONG PRESS POUR BOTTOM SHEET ===
        // Vibration legere au debut du touch
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }

        // Demarrer timer long press (500ms)
        longPressTimer.current = setTimeout(() => {
            // Vibration forte pour confirmer long press
            if (navigator.vibrate) {
                navigator.vibrate([50, 30, 50]);
            }

            // Ouvrir bottom sheet
            setTicketToMove(ticket);
            setShowMoveModal(true);

            // Annuler le drag classique pour ne pas interferer
            touchDragStart.current = null;
            touchDragTicket.current = null;
        }, 500);
    };

    const handleTouchMove = (e) => {
        // Annuler timer long press si utilisateur bouge (scroll intent)
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
                const status = column.getAttribute('data-status');
                setDragOverColumn(status);
            }
        }
    };

    const handleTouchEnd = async (e) => {
        // Annuler timer long press si utilisateur relache avant 500ms
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }

        if (draggedTicket && dragOverColumn && draggedTicket.status !== dragOverColumn) {
            await moveTicketToStatus(draggedTicket, dragOverColumn);
        }

        touchDragStart.current = null;
        touchDragTicket.current = null;
        setDraggedTicket(null);
        setDragOverColumn(null);
    };

    return React.createElement('div', { className: 'min-h-screen' },

        React.createElement(CreateTicketModal, {
            show: showCreateModal,
            onClose: () => setShowCreateModal(false),
            machines: machines,
            onTicketCreated: onTicketCreated,
            currentUser: currentUser
        }),


        React.createElement(TicketDetailsModal, {
            show: showDetailsModal,
            onClose: () => {
                setShowDetailsModal(false);
                setSelectedTicketId(null);
            },
            ticketId: selectedTicketId,
            currentUser: currentUser,
            onTicketDeleted: () => {
                setShowDetailsModal(false);
                setSelectedTicketId(null);
                onTicketCreated(); // Refresh ticket list
            }
        }),


        React.createElement(PerformanceModal, {
            show: showPerformanceModal,
            onClose: () => setShowPerformanceModal(false)
        }),


        React.createElement(OverdueTicketsModal, {
            show: showOverdueModal,
            onClose: () => setShowOverdueModal(false),
            currentUser: currentUser
        }),


        React.createElement(PushDevicesModal, {
            show: showPushDevicesModal,
            onClose: () => setShowPushDevicesModal(false)
        }),


        React.createElement(UserManagementModal, {
            show: showUserManagement,
            onClose: () => setShowUserManagement(false),
            currentUser: currentUser,
            onOpenMessage: (user) => {
                setShowUserManagement(false);
                setMessagingContact(user);
                setMessagingTab("private");
                setShowMessaging(true);
            }
        }),

        React.createElement(SystemSettingsModal, {
            show: showSystemSettings,
            onClose: () => setShowSystemSettings(false),
            currentUser: currentUser
        }),

        React.createElement(MachineManagementModal, {
            show: showMachineManagement,
            onClose: () => setShowMachineManagement(false),
            currentUser: currentUser,
            machines: machines,
            onRefresh: onRefresh
        }),

        React.createElement(MessagingModal, {
            show: showMessaging,
            onClose: () => {
                setShowMessaging(false);
                setMessagingContact(null);
                setMessagingTab("public");
                if (onRefreshMessages) onRefreshMessages();
            },
            currentUser: currentUser,
            initialContact: messagingContact,
            initialTab: messagingTab
        }),

        React.createElement(UserGuideModal, {
            show: showUserGuide,
            onClose: () => setShowUserGuide(false),
            currentUser: currentUser
        }),

        React.createElement(MoveTicketBottomSheet, {
            show: showMoveModal,
            onClose: () => {
                setShowMoveModal(false);
                setTicketToMove(null);
            },
            ticket: ticketToMove,
            onMove: moveTicketToStatus,
            onDelete: async (ticketId) => {
                const confirmed = window.confirm('Supprimer ce ticket definitivement ? Cette action est irreversible.');
                if (!confirmed) return;

                try {
                    await axios.delete(API_URL + '/tickets/' + ticketId);
                    // Recharger les données AVANT d'afficher le message de succès
                    await onRefresh();
                    alert('Ticket supprime avec succes');
                } catch (error) {
                    alert('Erreur lors de la suppression: ' + (error.response?.data?.error || 'Erreur inconnue'));
                }
            },
            currentUser: currentUser
        }),


        React.createElement('header', {
            className: 'sticky top-0 z-50',
            style: {
                background: 'rgba(255, 255, 255, 0.75)', // Plus clair, plus uniforme
                backdropFilter: 'blur(25px) saturate(180%)', // Flou plus intense type iOS
                WebkitBackdropFilter: 'blur(25px) saturate(180%)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)', // Ombre très douce
                borderBottom: '1px solid rgba(0, 0, 0, 0.05)', // Bordure ultra-fine
                transition: 'all 0.3s ease'
            }
        },
            React.createElement('div', { className: 'max-w-[1600px] mx-auto px-4 py-2' },
                React.createElement('div', { className: 'flex flex-col md:flex-row md:justify-between md:items-center gap-3' },
                    // BLOC LOGO ET TITRE (Nettoyé : plus de cadre, plus de dégradé de fond)
                    React.createElement('div', {
                        className: 'flex items-center min-w-0 group'
                    },
                        React.createElement('div', { className: 'flex items-center' },
                            React.createElement('img', {
                                src: '/api/settings/logo?t=' + Date.now(),
                                alt: 'IGP Logo',
                                className: 'h-8 md:h-10 w-auto object-contain flex-shrink-0 transition-transform duration-300 group-hover:scale-105',
                                onError: (e) => {
                                    e.target.src = '/static/logo-igp.png';
                                }
                            }),
                            React.createElement('div', { 
                                className: 'pl-3 flex flex-col justify-center',
                                style: {
                                    borderLeft: '1px solid rgba(0, 0, 0, 0.1)',
                                    marginLeft: '12px'
                                }
                            },
                                React.createElement('h1', {
                                    className: 'text-sm md:text-base font-bold leading-none tracking-tight text-slate-800',
                                    title: headerTitle
                                }, headerTitle),
                                React.createElement('p', {
                                    className: 'text-[10px] md:text-xs font-medium text-slate-500 mt-0.5',
                                }, headerSubtitle),
                                React.createElement('p', {
                                    className: 'text-[10px] font-semibold text-blue-600 mt-0.5 block sm:hidden',
                                }, '👋 ' + ((currentUser && currentUser.first_name) || 'Utilisateur'))
                            )
                        ),
                        // Bonjour version Desktop
                        React.createElement('div', {
                            className: 'hidden md:flex items-center ml-4 px-3 py-1 rounded-full bg-blue-50/50 border border-blue-100/50'
                        },
                            React.createElement('span', { className: 'text-xs font-medium text-blue-700' },
                                '👋 Bonjour ' + ((currentUser && currentUser.first_name) || (currentUser && currentUser.email && currentUser.email.split('@')[0]) || 'Utilisateur')
                            )
                        )
                    ),

                        // BARRE DE RECHERCHE INTEGRÉE
                        React.createElement('div', { className: 'relative w-full md:flex-1 md:mx-4 order-3 md:order-none mt-1.5 md:mt-0', style: { zIndex: 50 } },
                            React.createElement('div', { className: 'relative flex items-center w-full' },
                                React.createElement('input', {
                                    ref: searchInputRef,
                                    type: 'text',
                                    placeholder: searchPlaceholders[placeholderIndex],
                                    className: 'w-full px-3 md:px-4 py-1.5 md:py-2 pr-20 md:pr-24 border-2 border-blue-200/50 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-xs md:text-sm placeholder-gray-500 bg-white/80 backdrop-blur-sm transition-all shadow-inner',
                                    value: searchQuery,
                                    // ... existing props ...
                                    onKeyDown: (e) => {
                                        if (e.key === 'Escape') {
                                            setSearchQuery('');
                                            setShowSearchResults(false);
                                            e.target.blur();
                                        }
                                    },
                                    onFocus: () => {
                                        if (searchInputRef.current) {
                                            const rect = searchInputRef.current.getBoundingClientRect();
                                            setSearchDropdownPosition({
                                                top: rect.bottom + window.scrollY,
                                                left: rect.left + window.scrollX,
                                                width: rect.width
                                            });
                                        }
                                    },
                                    onChange: (e) => {
                                        const query = e.target.value;
                                        setSearchQuery(query);
                                        
                                        if (searchInputRef.current) {
                                            const rect = searchInputRef.current.getBoundingClientRect();
                                            setSearchDropdownPosition({
                                                top: rect.bottom + window.scrollY,
                                                left: rect.left + window.scrollX,
                                                width: rect.width
                                            });
                                        }
                                        
                                        if (searchTimeoutRef.current) {
                                            clearTimeout(searchTimeoutRef.current);
                                        }
                                        if (query.trim().length >= 2) {
                                            setSearchLoading(true);
                                            searchTimeoutRef.current = setTimeout(async () => {
                                                try {
                                                    const response = await fetch('/api/search?q=' + encodeURIComponent(query), {
                                                        headers: {
                                                            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                                                        }
                                                    });
                                                    const data = await response.json();
                                                    setSearchResults(data.results || []);
                                                    setSearchKeywordResults(data.keywordResults || []);
                                                    setSearchTextResults(data.textResults || []);
                                                    setSearchIsKeyword(data.isKeywordSearch || false);
                                                    setSearchKeywordType(data.keyword || null);
                                                    setShowSearchResults(true);
                                                } catch (err) {
                                                    console.error('Erreur recherche:', err);
                                                } finally {
                                                    setSearchLoading(false);
                                                }
                                            }, 300);
                                        } else {
                                            setSearchResults([]);
                                            setShowSearchResults(false);
                                            setSearchLoading(false);
                                        }
                                    },
                                    onBlur: () => setTimeout(() => setShowSearchResults(false), 200)
                                }),
                                searchQuery && React.createElement('button', {
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        setSearchQuery('');
                                        setShowSearchResults(false);
                                    },
                                    className: 'absolute right-16 md:right-20 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1',
                                    title: 'Effacer'
                                },
                                    React.createElement('i', { className: 'fas fa-times-circle text-lg' })
                                ),
                                React.createElement('i', {
                                    className: 'fas ' + (searchLoading ? 'fa-spinner fa-spin' : 'fa-search') + ' absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500'
                                })
                            )
                        ),

                        React.createElement('div', { className: "flex items-center gap-2 flex-wrap justify-between w-full md:w-auto md:justify-start mt-2 md:mt-0 flex-shrink-0" },
                            React.createElement('div', { className: "flex items-center gap-2 flex-wrap" },
                            React.createElement('p', {
                                className: "text-xs font-semibold hidden lg:block",
                                style: {
                                    color: '#1e40af',
                                    fontWeight: '900',
                                    textShadow: '2px 2px 6px rgba(255, 255, 255, 1), -2px -2px 6px rgba(255, 255, 255, 1), 2px -2px 6px rgba(255, 255, 255, 1), -2px 2px 6px rgba(255, 255, 255, 1)'
                                },
                                id: 'active-tickets-count'
                            },
                                getActiveTicketsCount() + " actifs"
                            ),
                            (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') ?
                            React.createElement('span', {
                                className: 'px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-300 cursor-pointer hover:bg-orange-200 transition-colors',
                                id: 'overdue-tickets-badge-wrapper',
                                title: 'Tickets en retard',
                                onClick: () => setShowOverdueModal(true)
                            },
                                React.createElement('i', { className: 'fas fa-clock mr-1' }),
                                React.createElement('span', { id: 'overdue-tickets-badge' }, '0')
                            ) : null,
                            (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') ?
                            React.createElement('span', {
                                className: 'px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300 cursor-pointer hover:bg-blue-200 transition-colors',
                                title: 'Techniciens actifs',
                                onClick: () => setShowPerformanceModal(true)
                            },
                                React.createElement('i', { className: 'fas fa-users-cog mr-1' }),
                                React.createElement('span', { id: 'technicians-count-badge' }, '0 techs')
                            ) : null,
                            (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') ?
                            React.createElement('span', {
                                className: 'px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-300 cursor-pointer hover:bg-purple-200 transition-colors',
                                title: 'Appareils Push Connectés',
                                onClick: () => setShowPushDevicesModal(true)
                            },
                                React.createElement('i', { className: 'fas fa-mobile-alt mr-1' }),
                                React.createElement('span', { id: 'push-devices-badge' }, '0 apps')
                            ) : null,
                            (currentUser?.role === "technician" || currentUser?.role === "supervisor" || currentUser?.role === "admin" || currentUser?.role === "operator" || currentUser?.role === "furnace_operator") ?
                            React.createElement('div', {
                                className: "flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer " + (unreadMessagesCount > 0 ? "bg-igp-red animate-pulse" : "bg-gradient-to-r from-igp-blue to-igp-blue-dark opacity-50"),
                                onClick: () => setShowMessaging(true),
                                title: unreadMessagesCount > 0 ? (unreadMessagesCount + " messages non lus") : "Messages"
                            },
                                React.createElement('i', { className: "fas fa-envelope text-white text-xs" }),
                                unreadMessagesCount > 0 ? React.createElement('span', { className: "text-white text-xs font-bold" }, unreadMessagesCount) : null
                            ) : null,
                            ), // Fermeture du div des badges
                            React.createElement('div', { className: "flex items-center gap-2 flex-1 md:flex-none justify-end" },
                            // BOUTON CRÉATION TICKET MOBILE (Supprimé du header pour être en FAB)
                            React.createElement('button', {
                                onClick: () => setShowCreateModal(true),
                                className: 'md:hidden flex-1 px-3 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center active:scale-95 border border-blue-500/30 mx-2',
                            },
                                React.createElement('i', { className: 'fas fa-plus mr-2' }),
                                'Nouvelle Demande'
                            ),

                            // BOUTON MENU MOBILE (Hamburger)
                            React.createElement('button', {
                                className: 'md:hidden ml-0 px-3 py-2.5 bg-white text-blue-600 rounded-lg shadow-md hover:bg-blue-50 transition-all active:scale-95 border border-blue-100 flex-shrink-0',
                                onClick: () => setShowMobileMenu(!showMobileMenu)
                            },
                                React.createElement('i', { className: 'fas ' + (showMobileMenu ? 'fa-times' : 'fa-bars') + ' text-xl' })
                            )
                            ) // Fermeture du div du bouton + menu
                        )
                    )
                ),
                
                // PORTAL DES RÉSULTATS DE RECHERCHE (Rendu dans document.body pour z-index absolu)
                showSearchResults && (searchKeywordResults.length > 0 || searchTextResults.length > 0) && typeof ReactDOM !== 'undefined' && ReactDOM.createPortal ? ReactDOM.createPortal(
                    React.createElement('div', {
                        className: 'search-results-portal bg-white border-2 border-gray-300 rounded-lg shadow-2xl overflow-y-auto',
                        style: { 
                            position: 'absolute',
                            zIndex: 99999,
                            top: (searchDropdownPosition.top + 2) + 'px',
                            left: searchDropdownPosition.left + 'px',
                            width: searchDropdownPosition.width + 'px',
                            minWidth: '320px',
                            maxHeight: '400px',
                            pointerEvents: 'auto'
                        },
                        onMouseDown: (e) => e.stopPropagation() // Prevent blur when clicking inside
                    },
                        // Bouton fermer
                        React.createElement('button', {
                            onClick: (e) => {
                                e.stopPropagation();
                                setShowSearchResults(false);
                            },
                            className: 'sticky top-0 right-0 float-right bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-full p-2 m-2 transition-colors shadow-md z-50',
                            style: { marginLeft: 'auto' }
                        },
                            React.createElement('i', { className: 'fas fa-times text-sm' })
                        ),
                        // Section 1: Résultats par mot-clé
                        searchIsKeyword && searchKeywordResults.length > 0 && React.createElement('div', {},
                            React.createElement('div', { className: 'bg-gradient-to-r from-red-50 to-orange-50 px-4 py-2 border-b-2 border-red-200 sticky top-0 z-10' },
                                React.createElement('div', { className: 'flex items-center gap-2' },
                                    React.createElement('span', { className: 'text-xs font-bold text-red-700 uppercase' },
                                        searchKeywordType === 'retard' || searchKeywordType === 'retards' || searchKeywordType === 'overdue' ? '🔴 TICKETS EN RETARD' :
                                        searchKeywordType === 'urgent' || searchKeywordType === 'critique' || searchKeywordType === 'critical' ? '🔴 TICKETS CRITIQUES' :
                                        searchKeywordType === 'haute' || searchKeywordType === 'high' ? '🟠 HAUTE PRIORITÉ' :
                                        searchKeywordType === 'commentaire' || searchKeywordType === 'commentaires' || searchKeywordType === 'note' ? '💬 AVEC COMMENTAIRES' :
                                        '🎯 RÉSULTATS CIBLÉS'
                                    ),
                                    React.createElement('span', { className: 'text-xs font-semibold text-gray-600 bg-white px-2 py-0.5 rounded-full' },
                                        searchKeywordResults.length
                                    )
                                )
                            ),
                            searchKeywordResults.map((result) =>
                                React.createElement('div', {
                                    key: 'kw-' + result.id,
                                    className: 'p-3 md:p-4 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 cursor-pointer border-b border-gray-200 last:border-b-0 transition-all duration-200 hover:shadow-sm',
                                    onClick: () => {
                                        setSelectedTicketId(result.id);
                                        setShowDetailsModal(true);
                                        setSearchQuery('');
                                        setShowSearchResults(false);
                                    }
                                },
                                    React.createElement('div', { className: 'flex justify-end mb-2' },
                                        React.createElement('span', { className: 'text-xs text-gray-400 font-mono tracking-wide' }, result.ticket_id)
                                    ),
                                    React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                        React.createElement('span', { className: 'px-2 py-1 rounded-md text-xs font-bold bg-gradient-to-br from-red-600 to-red-700 text-white shadow-sm flex-shrink-0' },
                                            searchKeywordType === 'retard' || searchKeywordType === 'retards' ? '⏰' :
                                            searchKeywordType === 'urgent' || searchKeywordType === 'critique' ? '🔴' :
                                            searchKeywordType === 'haute' ? '🟠' : '💬'
                                        ),
                                        React.createElement('span', { className: 'font-semibold text-gray-900 text-sm md:text-base leading-tight' }, result.title)
                                    ),
                                    React.createElement('div', { className: 'text-xs text-gray-500 ml-8 md:ml-10 truncate flex items-center gap-1' },
                                        React.createElement('i', { className: 'fas fa-cog text-gray-400' }),
                                        React.createElement('span', {}, result.machine_type + ' - ' + result.model)
                                    ),
                                    React.createElement('div', { className: 'flex items-center gap-2 mt-2 ml-8 md:ml-10 flex-wrap' },
                                        result.location && React.createElement('span', { className: 'text-xs text-gray-500 truncate flex items-center gap-1' },
                                            React.createElement('i', { className: 'fas fa-map-marker-alt text-gray-400 text-[10px]' }),
                                            React.createElement('span', {}, result.location)
                                        ),
                                        result.comments_count > 0 && React.createElement('span', { className: 'text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium flex items-center gap-1 shadow-sm flex-shrink-0' },
                                            React.createElement('i', { className: 'fas fa-comment text-[10px]' }),
                                            React.createElement('span', {}, result.comments_count)
                                        )
                                    )
                                )
                            )
                        ),
                        // Section 2: Résultats textuels
                        searchIsKeyword && searchTextResults.length > 0 && React.createElement('div', {},
                            React.createElement('div', { className: 'bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2 border-b border-gray-300 sticky top-0 z-10' },
                                React.createElement('div', { className: 'flex items-center gap-2' },
                                    React.createElement('span', { className: 'text-xs font-bold text-gray-600 uppercase' },
                                        '📄 AUTRES RÉSULTATS'
                                    ),
                                    React.createElement('span', { className: 'text-xs font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-full' },
                                        searchTextResults.length
                                    )
                                )
                            ),
                            searchTextResults.map((result) =>
                                React.createElement('div', {
                                    key: 'txt-' + result.id,
                                    className: 'p-3 md:p-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 cursor-pointer border-b border-gray-200 last:border-b-0 transition-all duration-200 hover:shadow-sm',
                                    onClick: () => {
                                        setSelectedTicketId(result.id);
                                        setShowDetailsModal(true);
                                        setSearchQuery('');
                                        setShowSearchResults(false);
                                    }
                                },
                                    React.createElement('div', { className: 'flex justify-end mb-2' },
                                        React.createElement('span', { className: 'text-xs text-gray-400 font-mono tracking-wide' }, result.ticket_id)
                                    ),
                                    React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                        React.createElement('span', { className: 'px-2 py-1 rounded-md text-xs font-bold bg-gradient-to-br from-gray-500 to-gray-600 text-white shadow-sm flex-shrink-0' }, '📝'),
                                        React.createElement('span', { className: 'font-semibold text-gray-900 text-sm md:text-base leading-tight' }, result.title)
                                    ),
                                    React.createElement('div', { className: 'text-xs text-gray-500 ml-8 md:ml-10 truncate flex items-center gap-1' },
                                        React.createElement('i', { className: 'fas fa-cog text-gray-400' }),
                                        React.createElement('span', {}, result.machine_type + ' - ' + result.model)
                                    ),
                                    React.createElement('div', { className: 'flex items-center gap-2 mt-2 ml-8 md:ml-10 flex-wrap' },
                                        result.location && React.createElement('span', { className: 'text-xs text-gray-500 truncate flex items-center gap-1' },
                                            React.createElement('i', { className: 'fas fa-map-marker-alt text-gray-400 text-[10px]' }),
                                            React.createElement('span', {}, result.location)
                                        ),
                                        result.comments_count > 0 && React.createElement('span', { className: 'text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium flex items-center gap-1 shadow-sm flex-shrink-0' },
                                            React.createElement('i', { className: 'fas fa-comment text-[10px]' }),
                                            React.createElement('span', {}, result.comments_count)
                                        )
                                    )
                                )
                            )
                        ),
                        // Section unique: Recherche textuelle pure
                        !searchIsKeyword && searchKeywordResults.length > 0 && searchKeywordResults.map((result) =>
                            React.createElement('div', {
                                key: result.id,
                                className: 'p-3 md:p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer border-b border-gray-200 last:border-b-0 transition-all duration-200 hover:shadow-sm',
                                onClick: () => {
                                    setSelectedTicketId(result.id);
                                    setShowDetailsModal(true);
                                    setSearchQuery('');
                                    setShowSearchResults(false);
                                }
                            },
                                React.createElement('div', { className: 'flex justify-end mb-2' },
                                    React.createElement('span', { className: 'text-xs text-gray-400 font-mono tracking-wide' }, result.ticket_id)
                                ),
                                React.createElement('div', { className: 'mb-2' },
                                    React.createElement('span', { className: 'font-semibold text-gray-900 text-sm md:text-base leading-tight' }, result.title)
                                ),
                                React.createElement('div', { className: 'text-xs text-gray-500 truncate flex items-center gap-1' },
                                    React.createElement('i', { className: 'fas fa-cog text-gray-400' }),
                                    React.createElement('span', {}, result.machine_type + ' - ' + result.model)
                                ),
                                React.createElement('div', { className: 'flex items-center gap-2 mt-2 flex-wrap' },
                                    result.location && React.createElement('span', { className: 'text-xs text-gray-500 truncate flex items-center gap-1' },
                                        React.createElement('i', { className: 'fas fa-map-marker-alt text-gray-400 text-[10px]' }),
                                        React.createElement('span', {}, result.location)
                                    ),
                                    result.comments_count > 0 && React.createElement('span', { className: 'text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium flex items-center gap-1 shadow-sm flex-shrink-0' },
                                        React.createElement('i', { className: 'fas fa-comment text-[10px]' }),
                                        React.createElement('span', {}, result.comments_count + ' commentaire' + (result.comments_count > 1 ? 's' : ''))
                                    )
                                )
                            )
                        )
                    ), document.body
                ) : null,

                // PORTAL POUR MESSAGE "AUCUN RÉSULTAT"
                showSearchResults && searchKeywordResults.length === 0 && searchTextResults.length === 0 && searchQuery.trim().length >= 2 && !searchLoading && typeof ReactDOM !== 'undefined' && ReactDOM.createPortal ? ReactDOM.createPortal(
                    React.createElement('div', {
                        className: 'search-no-results-portal bg-white border-2 border-gray-300 rounded-lg shadow-2xl p-4',
                        style: {
                            position: 'absolute',
                            zIndex: 99999,
                            top: (searchDropdownPosition.top + 2) + 'px',
                            left: searchDropdownPosition.left + 'px',
                            width: searchDropdownPosition.width + 'px',
                            minWidth: '320px',
                            pointerEvents: 'auto'
                        },
                        onMouseDown: (e) => e.stopPropagation()
                    },
                        React.createElement('p', { className: 'text-sm text-gray-500 text-center' },
                            'Aucun résultat trouvé'
                        )
                    ), document.body
                ) : null,

                React.createElement('div', { 
                    className: 'header-actions md:flex md:flex-row md:items-center md:justify-center gap-2 mt-4 transition-all duration-300 ease-in-out ' + 
                    (showMobileMenu 
                        ? 'flex flex-col p-4 mx-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 ring-1 ring-black/5' 
                        : 'hidden')
                },
                    // 1. Nouvelle Demande (Desktop uniquement - caché sur mobile car présent en haut)
                    React.createElement('button', {
                        onClick: () => setShowCreateModal(true),
                        className: 'hidden md:flex px-3 py-1.5 bg-igp-blue text-white text-sm rounded-md hover:bg-igp-blue-dark font-semibold shadow-md transition-all items-center'
                    },
                        React.createElement('i', { className: 'fas fa-plus mr-2' }),
                        'Demande'
                    ),
                    // 2. Messagerie (le plus utilisé quotidiennement)
                    (currentUser?.role === 'technician' || currentUser?.role === 'supervisor' || currentUser?.role === 'admin' || currentUser?.role === 'operator' || currentUser?.role === 'furnace_operator') ?
                    React.createElement('button', {
                        onClick: () => setShowMessaging(true),
                        className: 'px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md border border-gray-200 hover:bg-gray-50 hover:text-blue-600 font-semibold shadow-sm hover:shadow transition-all flex items-center'
                    },
                        React.createElement('i', { className: 'fas fa-comments mr-2 text-blue-500' }),
                        'Messagerie'
                    ) : null,
                    // 3. Archives (consultation fréquente)
                    React.createElement('button', {
                        onClick: () => {
                            setShowArchived(!showArchived);
                            // Si on affiche les archives, scroller vers la section après un court délai
                            if (!showArchived) {
                                setTimeout(() => {
                                    const archivedSection = document.getElementById('archived-section');
                                    if (archivedSection) {
                                        archivedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                }, 100);
                            }
                        },
                        className: 'px-3 py-1.5 text-sm rounded-md font-semibold shadow-sm hover:shadow transition-all flex items-center gap-2 border border-gray-200 ' +
                            (showArchived
                                ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-blue-600')
                    },
                        React.createElement('i', { className: 'fas fa-' + (showArchived ? 'eye-slash' : 'archive') + (showArchived ? '' : ' text-gray-500') }),
                        React.createElement('span', {}, showArchived ? 'Masquer' : 'Archivés'),
                        React.createElement('span', {
                            className: 'px-2 py-0.5 rounded-full text-xs font-bold ' +
                            (showArchived ? 'bg-gray-300 text-gray-700' : 'bg-gray-100 text-gray-600')
                        }, getTicketsByStatus('archived').length)
                    ),
                    // 4. Utilisateurs (gestion admin - moins fréquent)
                    (currentUser?.role === 'technician' || currentUser?.role === 'supervisor' || currentUser?.role === 'admin') ?
                    React.createElement('button', {
                        onClick: () => setShowUserManagement(true),
                        className: "px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md border border-gray-200 hover:bg-gray-50 hover:text-blue-600 font-semibold shadow-sm hover:shadow transition-all flex items-center"
                    },
                        React.createElement('i', { className: "fas fa-users-cog mr-2 text-indigo-500" }),
                        "Utilisateurs"
                    ) : null,
                    // 5. Machines (gestion admin - moins fréquent)
                    (currentUser?.role === 'supervisor' || currentUser?.role === 'admin') ?
                    React.createElement('button', {
                        onClick: () => setShowMachineManagement(true),
                        className: "px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md border border-gray-200 hover:bg-gray-50 hover:text-teal-600 font-semibold shadow-sm hover:shadow transition-all flex items-center"
                    },
                        React.createElement('i', { className: "fas fa-cogs mr-2 text-teal-500" }),
                        "Machines"
                    ) : null,
                    // 6. Parametres systeme (admin uniquement)
                    (currentUser?.role === 'admin') ?
                    React.createElement('button', {
                        onClick: () => setShowSystemSettings(true),
                        className: "px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md border border-gray-200 hover:bg-gray-50 hover:text-purple-600 font-semibold shadow-sm hover:shadow transition-all flex items-center"
                    },
                        React.createElement('i', { className: "fas fa-sliders-h mr-2 text-purple-500" }),
                        "Parametres"
                    ) : null,
                    // 7. Rôles (admin uniquement - rare)
                    (currentUser?.role === 'admin') ?
                    React.createElement('button', {
                        onClick: () => {
                            // S'assurer que le token est bien dans localStorage avant la redirection
                            const token = localStorage.getItem('auth_token');
                            if (token) {
                                window.location.href = '/admin/roles';
                            } else {
                                alert('Session expirée. Veuillez vous reconnecter.');
                                window.location.href = '/';
                            }
                        },
                        className: "px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md border border-gray-200 hover:bg-gray-50 hover:text-blue-700 font-semibold shadow-sm hover:shadow transition-all flex items-center",
                        title: 'Gestion des rôles et permissions (Admin)'
                    },
                        React.createElement('i', { className: 'fas fa-shield-alt mr-2 text-blue-600' }),
                        'Rôles'
                    ) : null,
                    // 7. Activer notifications push (PWA)
                    // DEBUG: Temporarily remove condition to always show button
                    React.createElement('button', {
                        onClick: async () => {
                            try {
                                if (!('Notification' in window)) {
                                    alert('Votre navigateur ne supporte pas les notifications push.');
                                    return;
                                }

                                const currentPerm = Notification.permission;

                                if (currentPerm === 'granted') {
                                    if (!window.subscribeToPush || !window.isPushSubscribed) {
                                        alert('Chargement en cours... Reessayez dans 1 seconde.');
                                        return;
                                    }

                                    // Check if already subscribed for THIS user
                                    const isAlreadySubscribed = await window.isPushSubscribed();
                                    if (isAlreadySubscribed) {
                                        alert('Vous etes deja abonne aux notifications push!');
                                        window.dispatchEvent(new CustomEvent('push-notification-changed'));
                                        return;
                                    }

                                    const result = await window.subscribeToPush();
                                    if (result.success) {
                                        if (result.updated) {
                                            alert('Abonnement push deja actif (mis a jour)');
                                        } else {
                                            alert('Abonnement push enregistre avec succes!');
                                        }
                                        window.dispatchEvent(new CustomEvent('push-notification-changed'));
                                    } else {
                                        alert('Erreur: ' + result.error);
                                    }
                                    return;
                                }

                                if (currentPerm === 'denied') {
                                    alert('Les notifications ont ete refusees. Allez dans Parametres Android > Apps > IGP > Notifications pour les activer.');
                                    return;
                                }

                                const perm = await Notification.requestPermission();

                                if (perm === 'granted') {
                                    alert('Notifications activees avec succes!');
                                    if (window.initPushNotifications) {
                                        setTimeout(() => window.initPushNotifications(), 1000);
                                    }
                                    window.location.reload();
                                } else {
                                    alert('Notifications refusees.');
                                    window.location.reload();
                                }
                            } catch (e) {
                                alert('Erreur: ' + e.message);
                            }
                        },
                        className: (pushPermission === 'granted' && pushSubscribed)
                            ? 'px-3 py-1.5 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 shadow-md transition-all flex items-center'
                            : (pushPermission === 'denied')
                                ? 'px-3 py-1.5 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 shadow-md transition-all animate-pulse flex items-center'
                                : 'px-3 py-1.5 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 shadow-md transition-all animate-pulse-orange-red flex items-center',
                        style: { minWidth: '155px' }
                    },
                        React.createElement('i', {
                            className: 'fas ' + ((pushPermission === 'granted' && pushSubscribed) ? 'fa-bell' : 'fa-bell-slash') + ' mr-2'
                        }),
                        (pushPermission === 'granted' && pushSubscribed) ? 'Activé' : 'Notifications'
                    ),
                    // 8. Actualiser (utile mais auto-refresh disponible)
                    React.createElement('button', {
                        onClick: onRefresh,
                        className: 'px-3 py-1.5 bg-igp-blue text-white text-sm rounded-md hover:bg-blue-800 shadow-md transition-all flex items-center'
                    },
                        React.createElement('i', { className: 'fas fa-sync-alt mr-2' }),
                        'Actualiser'
                    ),
                    // 9. Déconnexion (action de sortie - toujours à la fin)
                    React.createElement('button', {
                        onClick: onLogout,
                        className: 'px-3 py-1.5 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 shadow-md transition-all flex items-center'
                    },
                        React.createElement('i', { className: 'fas fa-sign-out-alt mr-2' }),
                        'Déconnexion'
                    ),
                    // 9. Guide (aide contextuelle - toujours accessible)
                    React.createElement('a', {
                        href: '/guide',
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 font-bold shadow-lg transition-all inline-flex items-center justify-center text-lg self-center',
                        title: 'Guide utilisateur - Aide'
                    },
                        '?'
                    )
                )
        ),


        React.createElement('div', {
            className: 'max-w-[1600px] mx-auto px-4 py-6'
        },
            React.createElement('div', { className: 'space-y-4' },
                // Première ligne: colonnes de workflow (Reçue, Diagnostic, En cours, Attente pièces)
                React.createElement('div', { className: 'overflow-x-auto pb-4' },
                    React.createElement('div', { className: 'kanban-grid flex gap-3' },
                    workflowStatuses.map(status => {
                    const isDragOver = dragOverColumn === status.key;
                    const ticketsInColumn = getTicketsByStatus(status.key);
                    const hasTickets = ticketsInColumn.length > 0;
                    const columnClass = 'kanban-column' +
                        (isDragOver ? ' drag-over' : '') +
                        (hasTickets ? ' has-tickets' : ' empty');

                    return React.createElement('div', {
                        key: status.key,
                        className: columnClass,
                        'data-status': status.key,
                        onDragOver: (e) => handleDragOver(e, status.key),
                        onDragLeave: handleDragLeave,
                        onDrop: (e) => handleDrop(e, status.key)
                    },
                        React.createElement('div', { className: 'mb-3 flex items-center justify-between kanban-column-header' },
                            React.createElement('div', { className: 'flex items-center min-w-0 flex-1' },
                                React.createElement('i', { className: 'fas fa-' + status.icon + ' text-' + status.color + '-500 mr-1.5 text-sm' }),
                                React.createElement('h3', { className: 'font-bold text-gray-700 text-sm truncate' }, status.label)
                            ),
                            React.createElement('span', {
                                className: 'bg-' + status.color + '-100 text-' + status.color + '-800 text-xs font-semibold px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0'
                            }, getTicketsByStatus(status.key).length)
                        ),
                        // Dropdown de tri (visible uniquement si plus de 2 tickets)
                        ticketsInColumn.length > 2 ? React.createElement('div', { className: 'mb-3 flex items-center gap-2' },
                            React.createElement('label', {
                                className: 'text-xs text-gray-600 font-medium whitespace-nowrap flex items-center gap-1',
                                htmlFor: 'sort-select-' + status.key
                            },
                                React.createElement('i', { className: 'fas fa-sort text-sm' }),
                                React.createElement('span', { className: 'hidden sm:inline' }, 'Trier:')
                            ),
                            React.createElement('select', {
                                id: 'sort-select-' + status.key,
                                value: sortBy,
                                onChange: (e) => setSortBy(e.target.value),
                                className: 'flex-1 text-sm sm:text-xs px-3 py-2.5 sm:py-1.5 border-2 border-gray-300 rounded-lg bg-white text-gray-700 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer touch-manipulation min-h-[44px] sm:min-h-0',
                                onClick: (e) => e.stopPropagation()
                            },
                                React.createElement('option', { value: 'default' }, 'Par défaut'),
                                React.createElement('option', { value: 'urgency' }, '🔥 Urgence (priorité + temps)'),
                                React.createElement('option', { value: 'oldest' }, '⏰ Plus ancien'),
                                React.createElement('option', { value: 'scheduled' }, '📅 Planifié')
                            )
                        ) : null,
                        React.createElement('div', { className: 'space-y-2' },
                            getTicketsByStatus(status.key).map(ticket => {
                                return React.createElement('div', {
                                    key: ticket.id,
                                    className: 'ticket-card priority-' + ticket.priority + (draggedTicket?.id === ticket.id ? ' dragging' : ''),
                                    draggable: currentUser && currentUser.role !== 'operator',
                                    onClick: (e) => handleTicketClick(e, ticket),
                                    onDragStart: (e) => handleDragStart(e, ticket),
                                    onDragEnd: handleDragEnd,
                                    onTouchStart: (e) => handleTouchStart(e, ticket),
                                    onTouchMove: handleTouchMove,
                                    onTouchEnd: handleTouchEnd,
                                    onContextMenu: (e) => handleContextMenu(e, ticket),
                                    title: currentUser && currentUser.role === 'operator'
                                        ? 'Cliquer pour détails | Clic droit: menu'
                                        : 'Cliquer pour détails | Glisser pour déplacer | Clic droit: menu'
                                },
                                    // Banniere pour tickets assignés ou planifiés (assignation requise, date optionnelle)
                                    // CRITICAL: Check !== null (not falsy) because 0 is valid (team assignment)
                                    ((ticket.assigned_to !== null && ticket.assigned_to !== undefined) && (ticket.status !== 'completed' && ticket.status !== 'archived')) ? React.createElement('div', {
                                        className: 'mb-2 -mx-3 -mt-3 px-2 py-1.5 flex items-center gap-1.5 rounded-t-lg overflow-hidden ' + (hasScheduledDate(ticket.scheduled_date)
                                            ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 shadow-[0_4px_12px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] border-b-2 border-green-400'
                                            : 'bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 shadow-[0_4px_12px_rgba(51,65,85,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] border-b-2 border-cyan-400'),
                                        style: { fontSize: '11px' }
                                    },
                                        React.createElement('div', { className: 'flex items-center gap-1 px-1.5 py-0.5 rounded flex-shrink-0 ' + (ticket.scheduled_date
                                            ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-[0_2px_8px_rgba(34,197,94,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] border border-green-300'
                                            : 'bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-[0_2px_8px_rgba(6,182,212,0.6),inset_0_1px_0_rgba(255,255,255,0.3)] border border-cyan-300')
                                        },
                                            React.createElement('i', { className: 'text-white drop-shadow-lg text-[9px] ' + (hasScheduledDate(ticket.scheduled_date) ? 'fas fa-calendar-check' : 'fas fa-user-check') }),
                                            React.createElement('span', { className: 'text-white font-extrabold tracking-wide drop-shadow-md' }, hasScheduledDate(ticket.scheduled_date) ? "PLANIFIÉ" : "ASSIGNÉ")
                                        ),
                                        React.createElement('span', { className: 'text-white font-bold text-center flex-1 min-w-0 px-1.5 py-0.5 rounded shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)] border truncate ' + (hasScheduledDate(ticket.scheduled_date) ? 'bg-blue-800/60 border-blue-500/40' : 'bg-slate-800/70 border-cyan-500/50') },
                                            ticket.assigned_to !== null && ticket.assigned_to !== undefined && ticket.assigned_to !== ''
                                                ? (ticket.assigned_to === 0 ? "👥 Équipe" : "👤 " + (ticket.assignee_name || 'Tech #' + ticket.assigned_to))
                                                : "⚠️ Non assigné"
                                        ),
                                        (ticket.scheduled_date && ticket.scheduled_date !== 'null') ? React.createElement('span', { className: 'text-white font-bold bg-gradient-to-br from-blue-800 to-blue-900 px-1.5 py-0.5 rounded shadow-[0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] border border-blue-600 whitespace-nowrap flex-shrink-0' },
                                            parseUTCDate(ticket.scheduled_date).toLocaleDateString('fr-FR', {
                                                day: '2-digit',
                                                month: 'short'
                                            })
                                        ) : null
                                    ) : null,

                                    React.createElement('div', { className: 'mb-1' },
                                        React.createElement('span', { className: 'text-xs text-gray-500 font-mono' }, ticket.ticket_id)
                                    ),
                                    React.createElement('h4', { className: 'font-bold text-gray-900 mb-1 text-sm line-clamp-2' }, ticket.title),
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
                                            ticket.priority === 'medium' ? '🟡 MOY' :
                                            '🟢 BAS'
                                        ),
                                        React.createElement('span', { className: 'text-xs text-gray-600 truncate flex-1' }, ticket.machine_type + ' ' + ticket.model)
                                    ),


                                    // Badge "Rapporté par" pour TOUS les tickets
                                    React.createElement('div', {
                                        className: 'text-xs text-gray-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mb-1 overflow-hidden pointer-events-none'
                                    },
                                        React.createElement('i', { className: 'fas fa-user mr-1 text-blue-600' }),
                                        React.createElement('span', { className: 'font-semibold' }, 'Rapporté par ' + (ticket.reporter_name || 'N/A'))
                                    ),
                                    // Badge de planification (si ticket planifié ET pas terminé/archivé)
                                    (ticket.scheduled_date && ticket.status !== 'completed' && ticket.status !== 'archived') ? React.createElement('div', { className: 'flex flex-col gap-1 mb-1' },
                                        React.createElement('div', { className: 'flex items-center gap-1' },
                                            React.createElement(ScheduledCountdown, { scheduledDate: ticket.scheduled_date })
                                        ),
                                    ) : null,

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
                            })
                        )
                    );
                })
                )
            ),

            // Deuxième ligne: colonne Terminé
            completedStatus ? React.createElement('div', { className: 'overflow-x-auto pb-4' },
                React.createElement('div', { className: 'kanban-grid flex gap-3' },
                    (() => {
                        const status = completedStatus;
                        const isDragOver = dragOverColumn === status.key;
                        const ticketsInColumn = getTicketsByStatus(status.key);
                        // Limit completed tickets to prevent browser freezing
                        const isCompleted = status.key === 'completed';
                        const displayTickets = isCompleted ? ticketsInColumn.slice(0, 20) : ticketsInColumn;
                        const hasTickets = ticketsInColumn.length > 0;
                        const columnClass = 'kanban-column' +
                            (isDragOver ? ' drag-over' : '') +
                            (hasTickets ? ' has-tickets' : ' empty');

                        return React.createElement('div', {
                            key: status.key,
                            className: columnClass,
                            'data-status': status.key,
                            onDragOver: (e) => handleDragOver(e, status.key),
                            onDragLeave: handleDragLeave,
                            onDrop: (e) => handleDrop(e, status.key)
                        },
                            React.createElement('div', { className: 'mb-3 flex items-center justify-between kanban-column-header' },
                                React.createElement('div', { className: 'flex items-center min-w-0 flex-1' },
                                    React.createElement('i', { className: 'fas fa-' + status.icon + ' text-' + status.color + '-500 mr-1.5 text-sm' }),
                                    React.createElement('h3', { className: 'font-bold text-gray-700 text-sm truncate' }, status.label)
                                ),
                                React.createElement('span', {
                                    className: 'bg-' + status.color + '-100 text-' + status.color + '-800 text-xs font-semibold px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0'
                                }, ticketsInColumn.length)
                            ),
                            // Dropdown de tri (visible uniquement si plus de 2 tickets)
                            ticketsInColumn.length > 2 ? React.createElement('div', { className: 'mb-2 flex items-center gap-2' },
                                React.createElement('label', {
                                    className: 'text-xs text-gray-600 font-medium whitespace-nowrap',
                                    htmlFor: 'sort-select-' + status.key
                                },
                                    React.createElement('i', { className: 'fas fa-sort mr-1' }),
                                    'Trier:'
                                ),
                                React.createElement('select', {
                                    id: 'sort-select-' + status.key,
                                    value: sortBy,
                                    onChange: (e) => setSortBy(e.target.value),
                                    className: 'flex-1 text-xs px-2 py-1 border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer',
                                    onClick: (e) => e.stopPropagation()
                                },
                                    React.createElement('option', { value: 'default' }, 'Par défaut'),
                                    React.createElement('option', { value: 'urgency' }, '🔥 Urgence (priorité + temps)'),
                                    React.createElement('option', { value: 'oldest' }, '⏰ Plus ancien'),
                                    React.createElement('option', { value: 'scheduled' }, '📅 Planifié')
                                )
                            ) : null,
                            React.createElement('div', { className: 'space-y-2' },
                                displayTickets.map(ticket => {
                                    return React.createElement('div', {
                                        key: ticket.id,
                                        className: 'ticket-card priority-' + ticket.priority + (draggedTicket?.id === ticket.id ? ' dragging' : ''),
                                        draggable: currentUser && currentUser.role !== 'operator',
                                        onClick: (e) => handleTicketClick(e, ticket),
                                        onDragStart: (e) => handleDragStart(e, ticket),
                                        onDragEnd: handleDragEnd,
                                        onTouchStart: (e) => handleTouchStart(e, ticket),
                                        onTouchMove: handleTouchMove,
                                        onTouchEnd: handleTouchEnd,
                                        onContextMenu: (e) => handleContextMenu(e, ticket),
                                        title: currentUser && currentUser.role === 'operator'
                                            ? 'Cliquer pour détails | Clic droit: menu'
                                            : 'Cliquer pour détails | Glisser pour déplacer | Clic droit: menu'
                                    },
                                        // Banniere pour tickets assignés ou planifiés (assignation requise, date optionnelle)
                                        // CRITICAL: Check !== null (not falsy) because 0 is valid (team assignment)
                                        // Si scheduled_date existe: affiche PLANIFIÉ (bleu), sinon affiche ASSIGNÉ (orange)
                                        ((ticket.assigned_to !== null && ticket.assigned_to !== undefined) && (ticket.status !== 'completed' && ticket.status !== 'archived')) ? React.createElement('div', {
                                            className: 'mb-2 -mx-3 -mt-3 px-2 py-1.5 flex items-center gap-1.5 rounded-t-lg overflow-hidden ' +
                                            (ticket.scheduled_date
                                                ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 shadow-[0_4px_12px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] border-b-2 border-green-400'
                                                : 'bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 shadow-[0_4px_12px_rgba(234,88,12,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] border-b-2 border-yellow-400'),
                                            style: { fontSize: '11px' }
                                        },
                                            React.createElement('div', { className: 'flex items-center gap-1 px-1.5 py-0.5 rounded flex-shrink-0 ' +
                                                (ticket.scheduled_date
                                                    ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-[0_2px_8px_rgba(34,197,94,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] border border-green-300'
                                                    : 'bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-[0_2px_8px_rgba(234,179,8,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] border border-yellow-300')
                                            },
                                                React.createElement('i', { className: 'text-white drop-shadow-lg text-[9px] ' + (hasScheduledDate(ticket.scheduled_date) ? 'fas fa-calendar-check' : 'fas fa-user-check') }),
                                                React.createElement('span', { className: 'text-white font-extrabold tracking-wide drop-shadow-md' }, hasScheduledDate(ticket.scheduled_date) ? "PLANIFIÉ" : "ASSIGNÉ")
                                            ),
                                            React.createElement('span', { className: 'text-white font-bold text-center flex-1 min-w-0 px-1.5 py-0.5 rounded shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)] border truncate ' +
                                                (hasScheduledDate(ticket.scheduled_date) ? 'bg-blue-800/60 border-blue-500/40' : 'bg-orange-800/60 border-orange-500/40') },
                                                ticket.assigned_to !== null && ticket.assigned_to !== undefined && ticket.assigned_to !== ''
                                                    ? (ticket.assigned_to === 0 ? '👥 Équipe' : '👤 ' + (ticket.assignee_name || 'Tech #' + ticket.assigned_to))
                                                    : '⚠️ Non assigné'
                                            ),
                                            hasScheduledDate(ticket.scheduled_date) ? React.createElement('span', { className: 'text-white font-bold bg-gradient-to-br from-blue-800 to-blue-900 px-1.5 py-0.5 rounded shadow-[0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] border border-blue-600 whitespace-nowrap flex-shrink-0' },
                                                parseUTCDate(ticket.scheduled_date).toLocaleDateString('fr-FR', {
                                                    day: '2-digit',
                                                    month: 'short'
                                                })
                                            ) : null
                                        ) : null,

                                        React.createElement('div', { className: 'mb-1' },
                                            React.createElement('span', { className: 'text-xs text-gray-500 font-mono' }, ticket.ticket_id)
                                        ),
                                        React.createElement('h4', { className: 'font-bold text-gray-900 mb-1 text-sm line-clamp-2' }, ticket.title),
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
                                                ticket.priority === 'medium' ? '🟡 MOY' :
                                                '🟢 BAS'
                                            ),
                                            React.createElement('span', { className: 'text-xs text-gray-600 truncate flex-1' }, ticket.machine_type + ' ' + ticket.model)
                                        ),


                                        // Badge "Rapporté par" pour TOUS les tickets
                                        React.createElement('div', {
                                            className: 'text-xs text-gray-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mb-1 overflow-hidden pointer-events-none'
                                        },
                                            React.createElement('i', { className: 'fas fa-user mr-1 text-blue-600' }),
                                            React.createElement('span', { className: 'font-semibold' }, 'Rapporté par ' + (ticket.reporter_name || 'N/A'))
                                        ),
                                        // Badge de planification (si ticket planifié ET pas terminé/archivé)
                                        (ticket.scheduled_date && ticket.status !== 'completed' && ticket.status !== 'archived') ? React.createElement('div', { className: 'flex flex-col gap-1 mb-1' },
                                            React.createElement('div', { className: 'flex items-center gap-1' },
                                                React.createElement(ScheduledCountdown, { scheduledDate: ticket.scheduled_date })
                                            ),
                                        ) : null,

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
                                })
                            )
                        );
                    })()
                )
            ) : null,

            showArchived ? React.createElement('div', { id: 'archived-section', className: 'overflow-x-auto pb-4' },
                React.createElement('div', { className: 'kanban-grid flex gap-3' },
                    React.createElement('div', {
                        key: archivedStatus.key,
                        className: 'kanban-column' +
                            (dragOverColumn === archivedStatus.key ? ' drag-over' : '') +
                            (getTicketsByStatus(archivedStatus.key).length > 0 ? ' has-tickets' : ' empty'),
                        'data-status': archivedStatus.key,
                        onDragOver: (e) => handleDragOver(e, archivedStatus.key),
                        onDragLeave: handleDragLeave,
                        onDrop: (e) => handleDrop(e, archivedStatus.key)
                    },
                        React.createElement('div', { className: 'mb-3 flex items-center justify-between kanban-column-header' },
                            React.createElement('div', { className: 'flex items-center min-w-0 flex-1' },
                                React.createElement('i', { className: 'fas fa-' + archivedStatus.icon + ' text-' + archivedStatus.color + '-500 mr-1.5 text-sm' }),
                                React.createElement('h3', { className: 'font-bold text-gray-700 text-sm truncate' }, archivedStatus.label)
                            ),
                            React.createElement('span', {
                                className: 'bg-' + archivedStatus.color + '-100 text-' + archivedStatus.color + '-800 text-xs font-semibold px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0'
                            }, getTicketsByStatus(archivedStatus.key).length)
                        ),
                        React.createElement('div', { className: 'space-y-2' },
                            getTicketsByStatus(archivedStatus.key).map(ticket => {
                                return React.createElement('div', {
                                    key: ticket.id,
                                    className: 'ticket-card priority-' + ticket.priority + (draggedTicket?.id === ticket.id ? ' dragging' : ''),
                                    draggable: currentUser && currentUser.role !== 'operator',
                                    onClick: (e) => handleTicketClick(e, ticket),
                                    onDragStart: (e) => handleDragStart(e, ticket),
                                    onDragEnd: handleDragEnd,
                                    onTouchStart: (e) => handleTouchStart(e, ticket),
                                    onTouchMove: handleTouchMove,
                                    onTouchEnd: handleTouchEnd,
                                    onContextMenu: (e) => handleContextMenu(e, ticket),
                                    title: currentUser && currentUser.role === 'operator'
                                        ? "Cliquer pour détails | Clic droit: menu"
                                        : "Cliquer pour détails | Glisser pour déplacer | Clic droit: menu"
                                },
                                    // Banniere pour tickets assignés ou planifiés (assignation requise, date optionnelle)
                                    // CRITICAL: Check !== null (not falsy) because 0 is valid (team assignment)
                                    // Si scheduled_date existe: affiche PLANIFIÉ (bleu), sinon affiche ASSIGNÉ (orange)
                                    ((ticket.assigned_to !== null && ticket.assigned_to !== undefined)) ? React.createElement('div', {
                                        className: 'mb-2 -mx-3 -mt-3 px-3 py-1.5 text-white text-xs font-bold flex items-center gap-2 rounded-t-lg ' +
                                        (ticket.scheduled_date
                                            ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 shadow-[0_2px_8px_rgba(37,99,235,0.4)] border-b-2 border-green-400'
                                            : 'bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 shadow-[0_2px_8px_rgba(234,88,12,0.4)] border-b-2 border-yellow-400')
                                    },
                                        React.createElement('i', { className: hasScheduledDate(ticket.scheduled_date) ? 'fas fa-calendar-check' : 'fas fa-user-check' }),
                                        React.createElement('span', {}, hasScheduledDate(ticket.scheduled_date) ? 'PLANIFIÉ' : 'ASSIGNÉ')
                                    ) : null,

                                    React.createElement('div', { className: 'mb-1' },
                                        React.createElement('span', { className: 'text-xs text-gray-500 font-mono' }, ticket.ticket_id)
                                    ),
                                    React.createElement('h4', { className: 'font-bold text-gray-900 mb-1 text-sm line-clamp-2' }, ticket.title),
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
                                            ticket.priority === 'medium' ? '🟡 MOY' :
                                            '🟢 BAS'
                                        ),
                                        React.createElement('span', { className: 'text-xs text-gray-600 truncate flex-1' }, ticket.machine_type + ' ' + ticket.model)
                                    ),


                                    // Badge "Rapporté par" pour TOUS les tickets
                                    React.createElement('div', {
                                        className: 'text-xs text-gray-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mb-1 overflow-hidden pointer-events-none'
                                    },
                                        React.createElement('i', { className: 'fas fa-user mr-1 text-blue-600' }),
                                        React.createElement('span', { className: 'font-semibold' }, 'Rapporté par ' + (ticket.reporter_name || 'N/A'))
                                    ),
                                    // Badge de planification (si ticket planifié ET pas terminé/archivé)
                                    (ticket.scheduled_date && ticket.status !== 'completed' && ticket.status !== 'archived') ? React.createElement('div', { className: 'flex flex-col gap-1 mb-1' },
                                        React.createElement('div', { className: 'flex items-center gap-1' },
                                            React.createElement(ScheduledCountdown, { scheduledDate: ticket.scheduled_date })
                                        ),
                                    ) : null,

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
                            })
                        )
                    )
                )
            ) : null,

            // Bouton "Retour en haut" premium (visible uniquement après scroll de 300px dans archives)
            showScrollTop ? React.createElement('button', {
                onClick: () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                },
                className: 'fixed bottom-8 right-8 z-50 group',
                style: {
                    animation: 'fadeInUp 0.3s ease-out'
                },
                title: 'Retour en haut'
            },
                React.createElement('div', {
                    className: 'relative'
                },
                    // Glow effect background
                    React.createElement('div', {
                        className: 'absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300',
                        style: { transform: 'scale(1.1)' }
                    }),
                    // Main button
                    React.createElement('div', {
                        className: 'relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white rounded-full p-4 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 group-hover:scale-110 flex items-center justify-center backdrop-blur-sm',
                        style: {
                            boxShadow: '0 20px 40px -15px rgba(139, 92, 246, 0.5), 0 0 30px rgba(139, 92, 246, 0.3)',
                            border: '2px solid rgba(255, 255, 255, 0.2)'
                        }
                    },
                        React.createElement('i', {
                            className: 'fas fa-arrow-up text-xl group-hover:animate-bounce'
                        })
                    )
                )
            ) : null,

            // NOUVEAU BOUTON FLOTTANT (FAB) POUR CRÉATION TICKET - MOBILE ONLY
            /*
            React.createElement('button', {
                onClick: () => setShowCreateModal(true),
                className: 'md:hidden fixed bottom-6 right-6 z-50 group animate-bounce-subtle',
                title: 'Nouvelle Demande'
            },
                React.createElement('div', {
                    className: 'relative'
                },
                    // Glow effect
                    React.createElement('div', {
                        className: 'absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-300',
                    }),
                    // Main button content (Pill shape)
                    React.createElement('div', {
                        className: 'relative bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 border border-blue-400/30 backdrop-blur-sm',
                        style: {
                            boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.5), 0 8px 10px -6px rgba(37, 99, 235, 0.1)'
                        }
                    },
                        React.createElement('i', { className: 'fas fa-plus text-lg' }),
                        React.createElement('span', { className: 'font-bold text-sm tracking-wide' }, 'Nouvelle Demande')
                    )
                )
            )
            */
            null
            )
        ),

        React.createElement('footer', {
            className: 'mt-12 py-6 text-center border-t-4 border-igp-blue',
            style: {
                background: 'rgba(255, 255, 255, 0.40)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 -8px 32px 0 rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                borderTop: '4px solid #003366'
            }
        },
            React.createElement('div', { className: 'max-w-[1600px] mx-auto px-4' },
                React.createElement('p', {
                    className: 'text-sm mb-2',
                    style: {
                        color: '#1a1a1a',
                        fontWeight: '700',
                        textShadow: '2px 2px 6px rgba(255, 255, 255, 1), -2px -2px 6px rgba(255, 255, 255, 1), 2px -2px 6px rgba(255, 255, 255, 1), -2px 2px 6px rgba(255, 255, 255, 1)'
                    }
                },
                    React.createElement('i', {
                        className: 'fas fa-code mr-2',
                        style: { color: '#003366' }
                    }),
                    'Application conçue et développée par ',
                    React.createElement('span', {
                        style: {
                            fontWeight: '900',
                            color: '#003366',
                            textShadow: '2px 2px 6px rgba(255, 255, 255, 1), -2px -2px 6px rgba(255, 255, 255, 1), 2px -2px 6px rgba(255, 255, 255, 1), -2px 2px 6px rgba(255, 255, 255, 1)'
                        }
                    }, "Le département des Technologies de l'Information")
                ),
                React.createElement('div', { className: 'flex items-center justify-center gap-4 flex-wrap' },
                    React.createElement('p', {
                        className: 'text-xs',
                        style: {
                            color: '#1a1a1a',
                            fontWeight: '700',
                            textShadow: '2px 2px 6px rgba(255, 255, 255, 1), -2px -2px 6px rgba(255, 255, 255, 1), 2px -2px 6px rgba(255, 255, 255, 1), -2px 2px 6px rgba(255, 255, 255, 1)'
                        }
                    },
                        '© ' + new Date().getFullYear() + ' - Produits Verriers International (IGP) Inc.'
                    ),
                    React.createElement('span', {
                        style: {
                            color: '#666666',
                            fontWeight: '700'
                        }
                    }, '|'),
                    React.createElement('a', {
                        href: '/changelog',
                        className: 'text-xs flex items-center gap-1 transition-colors',
                        style: {
                            color: '#1e40af',
                            fontWeight: '800',
                            textShadow: '2px 2px 6px rgba(255, 255, 255, 1), -2px -2px 6px rgba(255, 255, 255, 1), 2px -2px 6px rgba(255, 255, 255, 1), -2px 2px 6px rgba(255, 255, 255, 1)'
                        }
                    },
                        React.createElement('i', { className: 'fas fa-history' }),
                        React.createElement('span', {}, 'v2.8.1 - Historique')
                    )
                )
            )
        ),

        contextMenu && typeof ReactDOM !== 'undefined' && ReactDOM.createPortal ? ReactDOM.createPortal(
            React.createElement('div', {
                style: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    zIndex: 9999
                },
                onClick: () => setContextMenu(null)
            },
                React.createElement('div', {
                    className: 'context-menu',
                    style: {
                        position: 'fixed',
                        top: contextMenu.y + 'px',
                        left: contextMenu.x + 'px',
                        zIndex: 10000
                    },
                    onClick: (e) => e.stopPropagation()
                },
                React.createElement('div', { className: 'font-bold text-xs text-gray-500 px-3 py-2 border-b' },
                    'Déplacer vers:'
                ),
                allStatuses.map(status => {
                    const isCurrentStatus = status.key === contextMenu.ticket.status;
                    return React.createElement('div', {
                        key: status.key,
                        className: 'context-menu-item' + (isCurrentStatus ? ' bg-gray-100 cursor-not-allowed' : ''),
                        onClick: (e) => {
                            e.stopPropagation();
                            if (!isCurrentStatus) {
                                moveTicketToStatus(contextMenu.ticket, status.key);
                                setContextMenu(null);
                            }
                        }
                    },
                        React.createElement('i', {
                            className: 'fas fa-' + status.icon + ' text-' + status.color + '-500 mr-2'
                        }),
                        status.label,
                        isCurrentStatus ? React.createElement('span', { className: 'ml-2 text-xs text-gray-400' }, '(actuel)') : null
                    );
                }),
                // Séparateur avant Supprimer
                React.createElement('div', { className: 'border-t my-1' }),
                // Bouton Supprimer dans le menu contextuel (admin/supervisor/technicien, ou opérateur pour ses propres tickets)
                (currentUser?.role === 'admin' || currentUser?.role === 'supervisor' || currentUser?.role === 'technician' ||
                 (currentUser?.role === 'operator' && contextMenu.ticket.reported_by === currentUser?.id)) ?
                React.createElement('div', {
                    className: 'context-menu-item text-red-600 hover:bg-red-50 font-semibold',
                    onClick: async (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        // Sauvegarder le ticket ID et fermer le menu AVANT la confirmation
                        const ticketId = contextMenu.ticket.id;
                        setContextMenu(null);

                        // Délai pour fermer le menu avant la confirmation
                        await new Promise(resolve => setTimeout(resolve, 100));

                        const confirmed = window.confirm('Supprimer ce ticket definitivement ? Cette action est irreversible.');
                        if (!confirmed) return;

                        try {
                            await axios.delete(API_URL + '/tickets/' + ticketId);
                            // Recharger les données AVANT d'afficher le message de succès
                            await onRefresh();
                            alert('Ticket supprime avec succes');
                        } catch (error) {
                            alert('Erreur lors de la suppression: ' + (error.response?.data?.error || 'Erreur inconnue'));
                        }
                    }
                },
                    React.createElement('i', { className: 'fas fa-trash-alt mr-2' }),
                    'Supprimer le ticket'
                ) : null,
                // Bouton Annuler
                React.createElement('div', { className: 'border-t mt-1' }),
                React.createElement('div', {
                    className: 'context-menu-item text-gray-600 hover:bg-gray-100 font-semibold text-center',
                    onClick: (e) => {
                        e.stopPropagation();
                        setContextMenu(null);
                    }
                },
                    React.createElement('i', { className: 'fas fa-times mr-2' }),
                    'Annuler'
                )
                )
            ),
            document.body
        ) : null
    );
};
