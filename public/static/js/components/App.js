const App = () => {
    const [isLoggedIn, setIsLoggedIn] = React.useState(!!authToken);
    const [currentUserState, setCurrentUserState] = React.useState(currentUser);
    const [tickets, setTickets] = React.useState([]);
    const [machines, setMachines] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showCreateModal, setShowCreateModal] = React.useState(false);
    const [contextMenu, setContextMenu] = React.useState(null);
    const [unreadMessagesCount, setUnreadMessagesCount] = React.useState(0);
    const [headerTitle, setHeaderTitle] = React.useState(companyTitle);
    const [headerSubtitle, setHeaderSubtitle] = React.useState(companySubtitle);

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
            const [ticketsRes, machinesRes, userRes] = await Promise.all([
                axios.get(API_URL + '/tickets'),
                axios.get(API_URL + '/machines'),
                axios.get(API_URL + '/auth/me')
            ]);
            setTickets(ticketsRes.data.tickets);
            setMachines(machinesRes.data.machines);
            currentUser = userRes.data.user;
            setCurrentUserState(userRes.data.user);

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
            if (currentUser) {
                const response = await axios.get(API_URL + "/messages/unread-count");
                setUnreadMessagesCount(response.data.count || 0);
            }
        } catch (error) {
            // Erreur silencieuse
        }
    };

    const login = async (email, password, rememberMe = false) => {
        try {
            const response = await axios.post(API_URL + '/auth/login', { email, password, rememberMe });
            authToken = response.data.token;
            currentUser = response.data.user;
            setCurrentUserState(response.data.user);
            
            // ✅ Pour backward compatibility: garder le token en localStorage pour API calls
            localStorage.setItem('auth_token', authToken);
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
        React.createElement(MainApp, {
            tickets,
            machines,
            currentUser: currentUserState,
            onLogout: logout,
            onRefresh: loadData,
            showCreateModal,
            setShowCreateModal,
            onTicketCreated: loadData,
            unreadMessagesCount: unreadMessagesCount,
            onRefreshMessages: loadUnreadMessagesCount,
            headerTitle: headerTitle,
            headerSubtitle: headerSubtitle
        })
    );
};