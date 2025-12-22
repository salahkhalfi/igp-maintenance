const App = () => {
    const [isLoggedIn, setIsLoggedIn] = React.useState(!!authToken);
    const [currentUserState, setCurrentUserState] = React.useState(() => {
        // Try to load cached user from localStorage
        try {
            const cached = localStorage.getItem('user_cache');
            if (cached) return JSON.parse(cached);
        } catch (e) {}
        return currentUser; // Fallback to global var (likely null)
    });
    const { tickets, loading: ticketsLoading, fetchTickets, moveTicket, deleteTicket } = useTickets();
    const { machines, loading: machinesLoading, fetchMachines } = useMachines();
    const [loading, setLoading] = React.useState(true); // Global loading for initial load
    const [showCreateModal, setShowCreateModal] = React.useState(false);
    const [initialDescription, setInitialDescription] = React.useState('');
    const [initialImageUrl, setInitialImageUrl] = React.useState('');
    // NEW: Deep Link State Support
    const [initialTitle, setInitialTitle] = React.useState('');
    const [initialPriority, setInitialPriority] = React.useState('medium');
    const [initialMachineId, setInitialMachineId] = React.useState('');
    const [initialAssignedToId, setInitialAssignedToId] = React.useState(null);
    const [initialScheduledDate, setInitialScheduledDate] = React.useState('');
    const [contextMenu, setContextMenu] = React.useState(null);
    const [unreadMessagesCount, setUnreadMessagesCount] = React.useState(0);
    const [headerTitle, setHeaderTitle] = React.useState(companyTitle);
    const [headerSubtitle, setHeaderSubtitle] = React.useState(companySubtitle);
    
    // Modal states for User and Machine Management
    const [showUserModal, setShowUserModal] = React.useState(false);
    const [showMachineModal, setShowMachineModal] = React.useState(false);
    
    // Expose modal openers to window for MainApp buttons
    React.useEffect(() => {
        window.openUserManagement = () => setShowUserModal(true);
        window.openMachineManagement = () => setShowMachineModal(true);
    }, []);

    React.useEffect(() => {
        if (isLoggedIn) {
            // Charger le timezone_offset_hours depuis l'API seulement si pas deja dans localStorage
            // Ceci evite d'ecraser la valeur quand l'utilisateur vient de la changer
            const existingOffset = localStorage.getItem('timezone_offset_hours');
            if (!existingOffset) {
                axios.get(API_URL + '/settings/timezone_offset_hours')
                    .then(response => {
                        localStorage.setItem('timezone_offset_hours', response.data.setting_value || '-5');
                    })
                    .catch(error => {
                        // Valeur par defaut si erreur
                        localStorage.setItem('timezone_offset_hours', '-5');
                    });
            }

            // Gestion Deep Link: Création de ticket depuis URL
            const params = new URLSearchParams(window.location.search);
            if (params.get('createTicket') === 'true') {
                console.log("Deep Link detected: createTicket");
                const desc = params.get('description');
                const img = params.get('imageUrl');
                const title = params.get('title');
                const priority = params.get('priority');
                const machineId = params.get('machineId');
                const assignedToId = params.get('assignedToId');
                const scheduledDate = params.get('scheduledDate');
                
                if (desc) setInitialDescription(desc);
                if (img) setInitialImageUrl(img);
                if (title) setInitialTitle(title);
                if (priority) setInitialPriority(priority);
                if (machineId) setInitialMachineId(machineId);
                if (assignedToId) setInitialAssignedToId(assignedToId);
                if (scheduledDate) setInitialScheduledDate(scheduledDate);
                
                setShowCreateModal(true);
                
                // Nettoyage URL différé pour laisser le temps au state de se propager
                setTimeout(() => {
                    window.history.replaceState({}, '', '/');
                }, 1000);
            }

            loadData();
            loadUnreadMessagesCount();

            // Rafraichir le compteur de messages non lus toutes les 60 secondes (optimisé pour performance Chrome)
            const messagesInterval = setInterval(() => {
                loadUnreadMessagesCount();
            }, 60000);

            return () => {
                clearInterval(messagesInterval);
            };
        } else {
            // CRITICAL FIX: If not logged in, stop loading immediately to show login form
            setLoading(false);
        }
    }, [isLoggedIn]);

    const loadData = async () => {
        try {
            // 1. Fetch user first to check role (Security & Redirection)
            const userRes = await axios.get(API_URL + '/auth/me');
            
            const apiUser = userRes.data.user;
            const apiPermissions = userRes.data.permissions || [];
            
            // CRITICAL: Redirect GUEST users to Messenger immediately
            // This prevents guests from accessing the maintenance dashboard
            if (apiUser.role === 'guest' || apiUser.isGuest) {
                window.location.href = '/messenger';
                return;
            }

            // 2. Fetch operational data only for internal users
            // Use hooks to fetch data, but keep global loading management here for now
            const [ticketsData, machinesData] = await Promise.all([
                fetchTickets(),
                fetchMachines()
            ]);
            
            // currentUser global assignment (legacy compatibility)
            // CRITICAL FIX: Merge permissions and ensure userId exists
            const normalizedUser = {
                ...apiUser,
                userId: apiUser.id, // Ensure userId is present
                permissions: apiPermissions
            };

            currentUser = normalizedUser;
            setCurrentUserState(normalizedUser);
            // Cache user for offline access
            localStorage.setItem('user_cache', JSON.stringify(normalizedUser));

            // Charger titre et sous-titre personnalisés (public)
            try {
                const titleRes = await axios.get(API_URL + '/settings/company_title');
                if (titleRes.data.setting_value) {
                    companyTitle = titleRes.data.setting_value;
                    setHeaderTitle(titleRes.data.setting_value);
                }
            } catch (error) {
                // Titre par défaut
            }

            try {
                const subtitleRes = await axios.get(API_URL + '/settings/company_subtitle');
                if (subtitleRes.data.setting_value) {
                    companySubtitle = subtitleRes.data.setting_value;
                    setHeaderSubtitle(subtitleRes.data.setting_value);
                }
            } catch (error) {
                // Sous-titre par défaut
            }

            setLoading(false);
            
            // Update push button color after data is loaded and UI is ready
            setTimeout(() => {
                if (window.updatePushButtonColor) {
                    window.updatePushButtonColor();
                }
            }, 500);

            // Force reload unread messages after user data is confirmed loaded
            loadUnreadMessagesCount();

            // Update stats badges immediately after data refresh
            // This ensures all badges (overdue, technicians, push devices) are instantly updated
            // when tickets/machines/users change, maintaining consistency with active tickets count
            setTimeout(() => {
                if (window.loadSimpleStats) {
                    window.loadSimpleStats();
                }
            }, 600);
        } catch (error) {
            console.error("Error in loadData:", error);
            if (error.response?.status === 401) {
                logout();
            }
            // CRITICAL FIX: Force loading false on error to prevent infinite spinner
            setLoading(false);
        }
    };

    const loadUnreadMessagesCount = async () => {
        try {
            // Charger pour tous les utilisateurs connectés - le backend gère la sécurité
            // Retrait de la vérification currentUser qui causait une race condition au chargement
            const response = await axios.get(API_URL + "/messages/unread-count");
            setUnreadMessagesCount(response.data.count || 0);
        } catch (error) {
            // Erreur silencieuse mais loguée pour debug
            console.warn("Erreur chargement messages:", error);
        }
    };

    const login = async (email, password, rememberMe = false) => {
        try {
            const response = await axios.post(API_URL + '/auth/login', { email, password, rememberMe });
            authToken = response.data.token;
            
            // Merge user and permissions
            const userData = {
                ...response.data.user,
                permissions: response.data.permissions || []
            };
            
            // CRITICAL: Redirect GUEST users to Messenger immediately
            if (userData.role === 'guest' || userData.isGuest) {
                // Also cache guest user!
                localStorage.setItem('user_cache', JSON.stringify(userData));
                window.location.href = '/messenger';
                return;
            }
            
            currentUser = userData;
            setCurrentUserState(userData);
            
            // ✅ Pour backward compatibility: garder le token en localStorage pour API calls
            localStorage.setItem('auth_token', authToken);
            // Cache user for offline access
            localStorage.setItem('user_cache', JSON.stringify(userData));
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + authToken;
            
            setIsLoggedIn(true);

            // ✅ LAW #10: Fire-and-forget pattern (100% non-blocking)
            // Demande permissions notifications en arrière-plan, ne bloque JAMAIS le login
            initPushNotificationsSafely();
            
            // Update push button color after login to reflect ownership
            setTimeout(() => {
                if (window.updatePushButtonColor) {
                    window.updatePushButtonColor();
                }
            }, 3000);
        } catch (error) {
            alert('Erreur de connexion: ' + (error.response?.data?.error || 'Erreur inconnue'));
        }
    };

    // ✅ Initialiser l'état des notifications push après login (SANS demander permission)
    // Cette fonction vérifie uniquement l'état actuel et met à jour le bouton
    // L'utilisateur doit cliquer manuellement sur "Notifications" pour s'abonner
    const initPushNotificationsSafely = () => {
        setTimeout(() => {
            // Vérifier que l'API existe
            if (!('Notification' in window)) {
                console.log('[PUSH] Notification API non disponible');
                return;
            }
            
            // Appeler initPushNotifications qui vérifie l'état et met à jour le bouton
            // (ne demande PLUS automatiquement la permission)
            if (window.initPushNotifications) {
                console.log('[PUSH] Initialisation état push (vérification uniquement)');
                setTimeout(() => window.initPushNotifications(), 2000);
            }
                
        }, 100);  // Petit délai pour garantir que le login est terminé
    };

    const logout = async () => {
        try {
            // ✅ Appeler l'endpoint backend pour effacer le cookie HttpOnly
            await axios.post(API_URL + '/auth/logout');
        } catch (error) {
            // Erreur non-bloquante
        }
        
        // Nettoyage local
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_cache'); // Clear user cache on logout
        delete axios.defaults.headers.common['Authorization'];
        authToken = null;
        currentUser = null;
        setCurrentUserState(null);
        setIsLoggedIn(false);
    };

    if (!isLoggedIn) {
        return React.createElement(LoginForm, { onLogin: login });
    }

    if (loading) {
        return React.createElement('div', { className: 'flex items-center justify-center h-screen' },
            React.createElement('div', { className: 'text-center' },
                React.createElement('i', { className: 'fas fa-spinner fa-spin fa-3x text-blue-500 mb-4' }),
                React.createElement('p', { className: 'text-gray-600' }, 'Chargement...')
            )
        );
    }

    return React.createElement(ErrorBoundary, null,
        React.createElement(React.Fragment, null,
            // Offline Banner - Premium notification when connection is lost
            React.createElement(OfflineBanner),
            // Main Application
            React.createElement(MainApp, {
                tickets,
                machines,
                currentUser: currentUserState,
                onLogout: logout,
                onRefresh: loadData,
                showCreateModal,
                setShowCreateModal,
                onTicketCreated: loadData,
                initialDescription: initialDescription,
                initialImageUrl: initialImageUrl,
                initialTitle: initialTitle,
                initialPriority: initialPriority,
                initialMachineId: initialMachineId,
                initialAssignedToId: initialAssignedToId,
                initialScheduledDate: initialScheduledDate,
                unreadMessagesCount: unreadMessagesCount,
                onRefreshMessages: loadUnreadMessagesCount,
                headerTitle: headerTitle,
                headerSubtitle: headerSubtitle,
                // Pass actions down
                moveTicket: moveTicket,
                deleteTicket: deleteTicket
            }),
            // User Management Modal
            React.createElement(UserManagementModal, {
                show: showUserModal,
                onClose: () => setShowUserModal(false),
                currentUser: currentUserState
            }),
            // Machine Management Modal
            React.createElement(MachineManagementModal, {
                show: showMachineModal,
                onClose: () => setShowMachineModal(false),
                currentUser: currentUserState,
                machines: machines,
                onRefresh: fetchMachines
            })
        )
    );
};