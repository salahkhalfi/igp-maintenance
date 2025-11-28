export const homeHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IGP - Système de Gestion de Maintenance</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="icon" type="image/png" href="/icon-192.png">
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#003B73">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Maintenance IGP">
    <link rel="apple-touch-icon" href="/icon-192.png">
    <link rel="stylesheet" href="/static/styles.css">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js"></script>
    <script src="/static/js/utils.js"></script>
    <script src="/static/js/components/MessagingModal.js"></script>
    <script src="/static/js/components/NotificationModal.js"></script>
    <script src="/static/js/components/ConfirmModal.js"></script>
    <script src="/static/js/components/Toast.js"></script>
    <script src="/static/js/components/TicketTimer.js"></script>
    <script src="/static/js/components/ScheduledCountdown.js"></script>
    <script src="/static/js/components/UserGuideModal.js"></script>
    <script src="/static/js/components/PromptModal.js"></script>
    <script src="/static/js/components/LoginForm.js"></script>
    <script src="/static/js/components/MoveTicketBottomSheet.js"></script>
    <script src="/static/js/components/CreateTicketModal.js"></script>
    <script src="/static/js/components/TicketDetailsModal.js"></script>
    <script src="/static/js/components/MachineManagementModal.js"></script>
    <script src="/static/js/components/RoleDropdown.js"></script>
    <script src="/static/js/components/SystemSettingsModal.js"></script>
    <script src="/static/js/components/PerformanceModal.js"></script>
    <script src="/static/js/components/OverdueTicketsModal.js"></script>
    <script src="/static/js/components/PushDevicesModal.js"></script>
    <script src="/static/js/components/UserManagementModal.js"></script>
    <script src="/static/js/components/MainApp.js"></script>
    <script src="/static/js/components/App.js"></script>
    <style>
        /* Background avec photo d'atelier IGP pour toutes les pages */
        body {
            background-image: url(/static/login-background.jpg);
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            min-height: 100vh;
        }

        .kanban-column {
            min-height: 400px;
            min-width: 260px;
            background: rgba(255, 255, 255, 0.50);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-radius: 12px;
            padding: 12px;
            box-shadow: 0 6px 24px 0 rgba(0, 0, 0, 0.18);
            border: 1px solid rgba(255, 255, 255, 0.5);
            transition: all 0.3s ease;
        }

        .kanban-column:hover {
            background: rgba(255, 255, 255, 0.60);
            box-shadow: 0 8px 28px 0 rgba(0, 0, 0, 0.22);
            transform: translateY(-2px);
        }

        /* Colonnes vides prennent moins de place */
        .kanban-column.empty {
            flex: 0 0 auto;
            width: 200px;
        }

        /* Colonnes avec tickets prennent plus de place */
        .kanban-column.has-tickets {
            flex: 1 1 280px;
            max-width: 320px;
        }

        .ticket-card {
            background: linear-gradient(145deg, #ffffff, #f1f5f9);
            border-radius: 10px;
            padding: 10px;
            margin-bottom: 10px;
            box-shadow:
                6px 6px 16px rgba(71, 85, 105, 0.30),
                -3px -3px 10px rgba(255, 255, 255, 0.9),
                inset 0 1px 0 rgba(255, 255, 255, 0.5),
                0 2px 8px rgba(0, 0, 0, 0.15);
            cursor: grab;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            user-select: none;
            -webkit-user-select: none;
            -webkit-tap-highlight-color: transparent;
            border: 1px solid rgba(203, 213, 225, 0.6);
            border-top: 1px solid rgba(255, 255, 255, 0.8);
            border-left: 1px solid rgba(255, 255, 255, 0.5);
            position: relative;
        }

        .ticket-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg,
                transparent,
                rgba(255, 255, 255, 0.9) 20%,
                rgba(255, 255, 255, 0.9) 80%,
                transparent
            );
            border-radius: 10px 10px 0 0;
        }

        .ticket-card::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 10px;
            padding: 1px;
            background: linear-gradient(145deg,
                rgba(255, 255, 255, 0.4),
                rgba(255, 255, 255, 0.1) 30%,
                transparent 50%,
                rgba(71, 85, 105, 0.1)
            );
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
        }

        .ticket-card:hover {
            box-shadow:
                8px 8px 24px rgba(71, 85, 105, 0.35),
                -4px -4px 14px rgba(255, 255, 255, 1),
                inset 0 1px 0 rgba(255, 255, 255, 0.6),
                0 4px 12px rgba(0, 0, 0, 0.20);
            transform: translateY(-3px) translateZ(10px);
        }
        .ticket-card:active {
            cursor: grabbing;
            box-shadow:
                4px 4px 10px rgba(71, 85, 105, 0.35),
                -2px -2px 8px rgba(255, 255, 255, 0.8),
                0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .ticket-card.dragging {
            opacity: 0.7;
            cursor: grabbing;
            transform: rotate(3deg) scale(1.05);
            box-shadow:
                12px 12px 32px rgba(71, 85, 105, 0.40),
                -6px -6px 18px rgba(255, 255, 255, 0.7),
                0 6px 16px rgba(0, 0, 0, 0.25);
        }
        .ticket-card.long-press-active {
            background: #eff6ff;
            box-shadow: 0 6px 12px rgba(59, 130, 246, 0.3);
        }
        .kanban-column.drag-over {
            background: #dbeafe;
            border: 3px dashed #3b82f6;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), inset 0 0 10px rgba(59, 130, 246, 0.1);
            transform: scale(1.02);
            transition: all 0.2s ease;
        }
        .kanban-column.drag-valid {
            background: #d1fae5;
            border: 2px dashed #10b981;
        }
        .kanban-column.drag-invalid {
            background: #fee2e2;
            border: 2px dashed #ef4444;
        }
        .priority-high {
            border-left: 5px solid #ef4444;
            box-shadow:
                6px 6px 12px rgba(239, 68, 68, 0.15),
                -3px -3px 8px rgba(255, 255, 255, 0.8),
                inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }

        .priority-critical {
            border-left: 5px solid #dc2626;
            box-shadow:
                6px 6px 12px rgba(220, 38, 38, 0.2),
                -3px -3px 8px rgba(255, 255, 255, 0.8),
                inset 0 1px 0 rgba(255, 255, 255, 0.5);
            animation: pulse-subtle 3s ease-in-out infinite;
        }

        @keyframes pulse-subtle {
            0%, 100% {
                box-shadow:
                    6px 6px 12px rgba(220, 38, 38, 0.2),
                    -3px -3px 8px rgba(255, 255, 255, 0.8);
            }
            50% {
                box-shadow:
                    6px 6px 16px rgba(220, 38, 38, 0.3),
                    -3px -3px 8px rgba(255, 255, 255, 0.8);
            }
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .priority-medium {
            border-left: 5px solid #f59e0b;
            box-shadow:
                6px 6px 12px rgba(245, 158, 11, 0.12),
                -3px -3px 8px rgba(255, 255, 255, 0.8),
                inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }

        .priority-low {
            border-left: 5px solid #10b981;
            box-shadow:
                6px 6px 12px rgba(16, 185, 129, 0.1),
                -3px -3px 8px rgba(255, 255, 255, 0.8),
                inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }
        .modal.active {
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 20px 0;
        }
        @media (max-width: 640px) {
            .modal.active {
                padding: 10px 0;
                align-items: flex-start;
            }
        }
        .context-menu {
            position: fixed;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            min-width: 200px;
            padding: 8px 0;
            max-height: calc(100vh - 20px);
            overflow-y: auto;
            overflow-x: hidden;
        }
        .context-menu-item {
            padding: 12px 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: background 0.2s;
            font-size: 15px;
        }
        .context-menu-item:hover {
            background: #f3f4f6;
        }
        .context-menu-item:active {
            background: #e5e7eb;
        }
        .context-menu-item i {
            margin-right: 12px;
            width: 20px;
        }

        /* Line clamp pour limiter les lignes de texte */
        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        /* Scroll horizontal personnalisé */
        .overflow-x-auto {
            overflow-x: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(148, 163, 184, 0.5) transparent;
        }
        .overflow-x-auto::-webkit-scrollbar {
            height: 8px;
        }
        .overflow-x-auto::-webkit-scrollbar-track {
            background: rgba(148, 163, 184, 0.1);
            border-radius: 4px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.5);
            border-radius: 4px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
            background: rgba(148, 163, 184, 0.7);
        }

        /* MOBILE RESPONSIVE STYLES */
        @media (max-width: 1024px) {
            .kanban-grid {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .kanban-column {
                min-height: auto;
                width: 100% !important;
                max-width: none !important;
                flex: none !important;
            }
            .kanban-column.empty,
            .kanban-column.has-tickets {
                width: 100% !important;
            }
            .header-actions {
                flex-direction: column;
                gap: 8px;
                width: 100%;
            }
            .header-actions button {
                width: 100%;
                padding: 12px 16px;
                font-size: 16px;
            }
            .ticket-card {
                padding: 16px;
                font-size: 15px;
                min-height: 44px;
            }
            .context-menu-item {
                padding: 16px 20px;
                font-size: 16px;
                min-height: 48px;
            }
            .modal-content {
                width: 95vw !important;
                max-width: 95vw !important;
                margin: 10px;
            }
        }

        @media (max-width: 640px) {
            .header-title {
                flex-direction: column;
                align-items: flex-start;
            }
            .header-title h1 {
                font-size: 20px;
            }
            .kanban-column-header h3 {
                font-size: 14px;
            }
        }

        /* Titres de colonnes plus visibles */
        .kanban-column-header h3 {
            font-weight: 800;
            font-size: 16px;
            color: #1f2937;
            text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
        }

        .kanban-column-header span {
            font-weight: 700;
            font-size: 14px;
            color: #1f2937;
        }

        .ticket-card {
            color: #1f2937;
        }


        /* Header principal avec meilleure visibilit\u00e9 */
        @media (max-width: 640px) {
            /* Keep empty for structure */
        }

        @keyframes slideUp {
            from {
                transform: translateY(100px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        /* ===== BOTTOM SHEET MOBILE ANIMATIONS ===== */
        @keyframes fadeInBackdrop {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes slideUpSheet {
            from {
                transform: translateY(100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .bottom-sheet-backdrop {
            animation: fadeInBackdrop 0.2s ease-out;
        }

        .bottom-sheet-content {
            animation: slideUpSheet 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }

        .no-tap-highlight {
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
        }
    </style>
</head>
<body>
    <div id="root">
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; flex-direction: column; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div style="text-align: center; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <svg style="width: 80px; height: 80px; margin: 0 auto 20px; animation: spin 1s linear infinite;" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="20" fill="none" stroke="#667eea" stroke-width="4" stroke-dasharray="80" stroke-dashoffset="60" stroke-linecap="round"/>
                </svg>
                <h2 style="font-size: 24px; font-weight: bold; color: #333; margin-bottom: 8px;">Chargement de l'application</h2>
                <p style="color: #666; font-size: 14px;">Veuillez patienter...</p>
            </div>
        </div>
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    </div>

    <script>
        const API_URL = '/api';
        let authToken = localStorage.getItem('auth_token');
        let currentUser = null;

        // Variables globales pour titre et sous-titre personnalisés
        let companyTitle = 'Gestion de la maintenance et des réparations';
        let companySubtitle = 'Les Produits Verriers International (IGP) Inc.';

        // ✅ Configure axios to send cookies with every request (for HttpOnly auth_token)
        axios.defaults.withCredentials = true;

        if (authToken) {
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + authToken;
        }


        // getStatusLabel - DÉPLACÉ VERS /static/js/utils.js


        // FONCTION UTILITAIRE CENTRALE: Obtenir l'heure EST/EDT configurée
        // DÉPLACÉ VERS /static/js/utils.js


        // ============================================================================

        // Fonction pour calculer le temps écoulé depuis la création
        // Retourne un objet {days, hours, minutes, seconds, color, bgColor}
        // getElapsedTime - DÉPLACÉ VERS /static/js/utils.js

        // Formater le texte du chronomètre avec secondes
        // formatElapsedTime - DÉPLACÉ VERS /static/js/utils.js


        // Composant de notification personnalisé
        // NotificationModal - DÉPLACÉ VERS /static/js/components/NotificationModal.js

        // Composant de confirmation personnalisé
        // ConfirmModal - DÉPLACÉ VERS /static/js/components/ConfirmModal.js

        // Composant Toast pour notifications rapides
        // Toast - DÉPLACÉ VERS /static/js/components/Toast.js

        // Composant Chronomètre dynamique (mise à jour chaque seconde)
        // TicketTimer - DÉPLACÉ VERS /static/js/components/TicketTimer.js
        // ScheduledCountdown - DÉPLACÉ VERS /static/js/components/ScheduledCountdown.js

        // Composant Guide Utilisateur
        // UserGuideModal - DÉPLACÉ VERS /static/js/components/UserGuideModal.js
        // PromptModal - DÉPLACÉ VERS /static/js/components/PromptModal.js
        // LoginForm - DÉPLACÉ VERS /static/js/components/LoginForm.js
        // MoveTicketBottomSheet - DÉPLACÉ VERS /static/js/components/MoveTicketBottomSheet.js
        // CreateTicketModal - DÉPLACÉ VERS /static/js/components/CreateTicketModal.js
        // TicketDetailsModal - DÉPLACÉ VERS /static/js/components/TicketDetailsModal.js
        // Composant de gestion des machines (VERSION SIMPLIFIÉE ET ÉLÉGANTE)
        // MachineManagementModal - DÉPLACÉ VERS /static/js/components/MachineManagementModal.js
        // RoleDropdown - DÉPLACÉ VERS /static/js/components/RoleDropdown.js
        // SystemSettingsModal - DÉPLACÉ VERS /static/js/components/SystemSettingsModal.js
        // Composant de performance des techniciens (ÉTAPE 2: VERSION BASIQUE)
        // PerformanceModal - DÉPLACÉ VERS /static/js/components/PerformanceModal.js
        // OverdueTicketsModal - DÉPLACÉ VERS /static/js/components/OverdueTicketsModal.js
        // PushDevicesModal - DÉPLACÉ VERS /static/js/components/PushDevicesModal.js
        // UserManagementModal - DÉPLACÉ VERS /static/js/components/UserManagementModal.js
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
            
            // Placeholder animé avec exemples de mots-clés (versions desktop et mobile)
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

                window.addEventListener('resize', updateDropdownPosition);
                window.addEventListener('orientationchange', updateDropdownPosition);

                return () => {
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

            // Gérer les paramètres URL pour ouvrir automatiquement un ticket
            React.useEffect(() => {
                const urlParams = new URLSearchParams(window.location.search);
                const ticketIdFromUrl = urlParams.get('ticket');
                
                if (ticketIdFromUrl && tickets.length > 0) {
                    const ticketId = parseInt(ticketIdFromUrl, 10);
                    const ticket = tickets.find(t => t.id === ticketId);
                    
                    if (ticket) {
                        console.log('[Push] Opening ticket from URL:', ticketId);
                        setSelectedTicketId(ticketId);
                        setShowDetailsModal(true);
                        
                        // Nettoyer l'URL sans recharger la page
                        window.history.replaceState({}, '', window.location.pathname);
                    }
                }
            }, [tickets]);

            // Écouter les messages du Service Worker (notification click quand app déjà ouverte)
            React.useEffect(() => {
                const handleServiceWorkerMessage = (event) => {
                    console.log('[Push] Service Worker message received:', event.data);
                    
                    if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
                        const { action, data } = event.data;
                        
                        // Ouvrir le ticket si action view_ticket
                        if (action === 'view_ticket' && data.ticketId) {
                            const ticketId = data.ticketId;
                            const ticket = tickets.find(t => t.id === ticketId);
                            
                            if (ticket) {
                                console.log('[Push] Opening ticket from notification click:', ticketId);
                                setSelectedTicketId(ticketId);
                                setShowDetailsModal(true);
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
                            setShowMessagesModal(true);
                        }
                        // Ouvrir conversation privée
                        else if (action === 'new_private_message' && data.senderId) {
                            setShowMessagesModal(true);
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
                    // Positionner le menu au-dessus du curseur
                    y = Math.max(10, y - Math.min(menuHeightEstimate, spaceAbove - 10));
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
                    className: 'shadow-lg border-b-4 border-igp-blue',
                    style: {
                        background: 'rgba(255, 255, 255, 0.40)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        borderBottom: '4px solid #003366',
                        position: 'relative',
                        zIndex: 10
                    }
                },
                    React.createElement('div', { className: 'max-w-[1600px] mx-auto px-4 py-3' },
                        React.createElement('div', { className: 'w-full max-w-md md:max-w-2xl mx-auto mb-4' },
                            React.createElement('div', { className: 'relative w-full', style: { zIndex: 99999 } },
                                React.createElement('input', {
                                    ref: searchInputRef,
                                    type: 'text',
                                    placeholder: searchPlaceholders[placeholderIndex],
                                    className: 'w-full px-3 md:px-4 py-2 pr-14 md:pr-20 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-xs md:text-sm placeholder-gray-400',
                                    value: searchQuery,
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
                                        
                                        // Update dropdown position dynamically
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
                                // Bouton effacer (visible si query non vide)
                                searchQuery && React.createElement('button', {
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        setSearchQuery('');
                                        setShowSearchResults(false);
                                        setSearchResults([]);
                                        setSearchKeywordResults([]);
                                        setSearchTextResults([]);
                                    },
                                    className: 'absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1',
                                    title: 'Effacer la recherche (Esc)'
                                },
                                    React.createElement('i', { className: 'fas fa-times-circle text-lg' })
                                ),
                                React.createElement('i', {
                                    className: 'fas ' + (searchLoading ? 'fa-spinner fa-spin' : 'fa-search') + ' absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                                }),
                                showSearchResults && (searchKeywordResults.length > 0 || searchTextResults.length > 0) && React.createElement('div', {
                                    className: 'md:fixed left-0 right-0 md:left-auto md:right-auto bg-white border-2 border-gray-300 rounded-lg shadow-2xl overflow-y-auto mt-2 md:mt-0',
                                    style: window.innerWidth < 768 ? {
                                        position: 'relative',
                                        zIndex: 100,
                                        maxHeight: '400px'
                                    } : { 
                                        zIndex: 9999999,
                                        top: searchDropdownPosition.top + 'px',
                                        left: searchDropdownPosition.left + 'px',
                                        width: searchDropdownPosition.width + 'px',
                                        minWidth: '320px',
                                        maxWidth: 'none',
                                        maxHeight: 'calc(100vh - ' + searchDropdownPosition.top + 'px - 2rem)',
                                        pointerEvents: 'auto'
                                    }
                                },
                                    // Bouton fermer en haut à droite du dropdown
                                    React.createElement('button', {
                                        onClick: (e) => {
                                            e.stopPropagation();
                                            setShowSearchResults(false);
                                        },
                                        className: 'sticky top-0 right-0 float-right bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-full p-2 m-2 transition-colors shadow-md z-50',
                                        title: 'Fermer les résultats (Esc)',
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
                                ),
                                showSearchResults && searchKeywordResults.length === 0 && searchTextResults.length === 0 && searchQuery.trim().length >= 2 && !searchLoading && React.createElement('div', {
                                    className: 'md:fixed left-0 right-0 md:left-auto md:right-auto bg-white border-2 border-gray-300 rounded-lg shadow-2xl p-4 mt-2 md:mt-0',
                                    style: window.innerWidth < 768 ? {
                                        position: 'relative',
                                        zIndex: 100
                                    } : { 
                                        zIndex: 9999999,
                                        top: searchDropdownPosition.top + 'px',
                                        left: searchDropdownPosition.left + 'px',
                                        width: searchDropdownPosition.width + 'px',
                                        minWidth: '320px',
                                        maxWidth: 'none',
                                        pointerEvents: 'auto'
                                    }
                                },
                                    React.createElement('p', { className: 'text-sm text-gray-500 text-center' },
                                        'Aucun résultat trouvé'
                                    )
                                )
                            )
                        ),
                        React.createElement('div', { className: 'flex flex-col md:flex-row md:justify-between md:items-center gap-6' },
                            React.createElement('div', {
                                className: 'flex items-center space-x-2 md:space-x-3 flex-1 min-w-0',
                                style: {
                                    background: 'linear-gradient(135deg, rgba(240, 249, 255, 0.85) 0%, rgba(224, 242, 254, 0.75) 50%, rgba(186, 230, 253, 0.8) 100%)',
                                    backdropFilter: 'blur(20px) saturate(180%)',
                                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                                    padding: '14px',
                                    borderRadius: '16px',
                                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), 0 4px 16px rgba(0, 51, 102, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.8), inset 0 -2px 4px rgba(186, 230, 253, 0.3)',
                                    border: '2px solid rgba(255, 255, 255, 0.6)',
                                    borderTop: '2px solid rgba(255, 255, 255, 0.9)',
                                    borderLeft: '2px solid rgba(255, 255, 255, 0.8)',
                                    position: 'relative',
                                    width: '100%',
                                    overflow: 'hidden'
                                }
                            },
                                React.createElement('div', {
                                    style: {
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '50%',
                                        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 100%)',
                                        borderRadius: '16px 16px 0 0',
                                        pointerEvents: 'none'
                                    }
                                }),
                                React.createElement('img', {
                                    src: '/api/settings/logo?t=' + Date.now(),
                                    alt: 'IGP Logo',
                                    className: 'h-10 md:h-12 lg:h-16 w-auto object-contain flex-shrink-0',
                                    onError: (e) => {
                                        e.target.src = '/static/logo-igp.png';
                                    }
                                }),
                                React.createElement('div', { 
                                    className: 'pl-2 md:pl-3 flex-1 min-w-0',
                                    style: {
                                        borderLeft: '2px solid rgba(147, 197, 253, 0.5)',
                                        position: 'relative'
                                    }
                                },
                                    React.createElement('h1', {
                                        className: 'text-sm md:text-lg lg:text-xl font-bold break-words',
                                        style: {
                                            wordBreak: 'break-word',
                                            overflowWrap: 'break-word',
                                            color: '#1e3a8a',
                                            fontWeight: '900'
                                        },
                                        title: headerTitle
                                    }, headerTitle),
                                    React.createElement('p', {
                                        className: 'text-xs md:text-sm break-words',
                                        style: {
                                            wordBreak: 'break-word',
                                            overflowWrap: 'break-word',
                                            color: '#1a1a1a',
                                            fontWeight: '800',
                                            textShadow: '2px 2px 6px rgba(255, 255, 255, 1), -2px -2px 6px rgba(255, 255, 255, 1), 2px -2px 6px rgba(255, 255, 255, 1), -2px 2px 6px rgba(255, 255, 255, 1)'
                                        },
                                        title: headerSubtitle
                                    },
                                        headerSubtitle
                                    ),
                                    React.createElement('p', {
                                        className: 'text-xs md:text-sm font-semibold mt-1',
                                        style: {
                                            color: '#047857',
                                            fontWeight: '900',
                                            textShadow: '2px 2px 6px rgba(255, 255, 255, 1), -2px -2px 6px rgba(255, 255, 255, 1), 2px -2px 6px rgba(255, 255, 255, 1), -2px 2px 6px rgba(255, 255, 255, 1)'
                                        }
                                    },
                                        '👋 Bonjour ' + (currentUser?.first_name || currentUser?.email?.split('@')[0] || 'Utilisateur')
                                    ),
                                    React.createElement('div', { className: "flex items-center gap-3 flex-wrap" },
                                        React.createElement('p', {
                                            className: "text-xs font-semibold",
                                            style: {
                                                color: '#1e40af',
                                                fontWeight: '900',
                                                textShadow: '2px 2px 6px rgba(255, 255, 255, 1), -2px -2px 6px rgba(255, 255, 255, 1), 2px -2px 6px rgba(255, 255, 255, 1), -2px 2px 6px rgba(255, 255, 255, 1)'
                                            },
                                            id: 'active-tickets-count'
                                        },
                                            getActiveTicketsCount() + " tickets actifs"
                                        ),
                                        (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') ?
                                        React.createElement('span', {
                                            className: 'px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-300 cursor-pointer hover:bg-orange-200 transition-colors',
                                            id: 'overdue-tickets-badge-wrapper',
                                            title: 'Tickets en retard - Cliquer pour voir détails',
                                            onClick: () => setShowOverdueModal(true)
                                        },
                                            React.createElement('i', { className: 'fas fa-clock mr-1' }),
                                            React.createElement('span', { id: 'overdue-tickets-badge' }, '0 retard')
                                        ) : null,
                                        (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') ?
                                        React.createElement('span', {
                                            className: 'px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300 cursor-pointer hover:bg-blue-200 transition-colors',
                                            id: 'technicians-count-badge-wrapper',
                                            title: 'Techniciens actifs - Cliquer pour voir performance',
                                            onClick: () => setShowPerformanceModal(true)
                                        },
                                            React.createElement('i', { className: 'fas fa-users mr-1' }),
                                            React.createElement('span', { id: 'technicians-count-badge' }, '0 techs')
                                        ) : null,
                                        (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') ?
                                        React.createElement('span', {
                                            className: 'px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-300 cursor-pointer hover:bg-green-200 transition-colors',
                                            id: 'push-devices-badge-wrapper',
                                            title: 'Appareils avec notifications push - Cliquer pour voir liste',
                                            onClick: () => setShowPushDevicesModal(true)
                                        },
                                            React.createElement('i', { className: 'fas fa-mobile-alt mr-1' }),
                                            React.createElement('span', { id: 'push-devices-badge' }, '0 apps')
                                        ) : null,
                                        (currentUser?.role === "technician" || currentUser?.role === "supervisor" || currentUser?.role === "admin" || currentUser?.role === "operator" || currentUser?.role === "furnace_operator") ?
                                        React.createElement('div', {
                                            className: "flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer " + (unreadMessagesCount > 0 ? "bg-igp-red animate-pulse" : "bg-gradient-to-r from-igp-blue to-igp-blue-dark opacity-50"),
                                            onClick: () => setShowMessaging(true),
                                            title: unreadMessagesCount > 0 ? (unreadMessagesCount + " messages non lus") : "Aucun message non lu"
                                        },
                                            React.createElement('i', { className: "fas fa-envelope text-white text-xs" }),
                                            unreadMessagesCount > 0 ? React.createElement('span', { className: "text-white text-xs font-bold" }, unreadMessagesCount) : null
                                        ) : null
                                    )
                                )
                            )
                        ),
                        React.createElement('div', { className: 'flex flex-col md:flex-row md:items-center md:justify-center gap-2 mt-4 header-actions' },
                            // 1. Nouvelle Demande (action primaire)
                            React.createElement('button', {
                                onClick: () => setShowCreateModal(true),
                                className: 'px-3 py-1.5 bg-igp-blue text-white text-sm rounded-md hover:bg-igp-blue-dark font-semibold shadow-md transition-all flex items-center'
                            },
                                React.createElement('i', { className: 'fas fa-plus mr-2' }),
                                'Demande'
                            ),
                            // 2. Messagerie (le plus utilisé quotidiennement)
                            (currentUser?.role === 'technician' || currentUser?.role === 'supervisor' || currentUser?.role === 'admin' || currentUser?.role === 'operator' || currentUser?.role === 'furnace_operator') ?
                            React.createElement('button', {
                                onClick: () => setShowMessaging(true),
                                className: 'px-3 py-1.5 bg-gradient-to-r from-slate-700 to-gray-700 text-white text-sm rounded-md hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md transition-all flex items-center'
                            },
                                React.createElement('i', { className: 'fas fa-comments mr-2' }),
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
                                className: 'px-3 py-1.5 text-sm rounded-md font-semibold shadow-md transition-all flex items-center gap-2 ' +
                                    (showArchived
                                        ? 'bg-gray-600 text-white hover:bg-gray-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300')
                            },
                                React.createElement('i', { className: 'fas fa-' + (showArchived ? 'eye-slash' : 'archive') }),
                                React.createElement('span', {}, showArchived ? 'Masquer' : 'Archivés'),
                                React.createElement('span', {
                                    className: 'px-2 py-0.5 rounded-full text-xs font-bold ' +
                                    (showArchived ? 'bg-gray-500' : 'bg-gray-300 text-gray-700')
                                }, getTicketsByStatus('archived').length)
                            ),
                            // 4. Utilisateurs (gestion admin - moins fréquent)
                            (currentUser?.role === 'technician' || currentUser?.role === 'supervisor' || currentUser?.role === 'admin') ?
                            React.createElement('button', {
                                onClick: () => setShowUserManagement(true),
                                className: "px-3 py-1.5 bg-blue-700 text-white text-sm rounded-md hover:bg-blue-800 font-semibold shadow-md transition-all flex items-center"
                            },
                                React.createElement('i', { className: "fas fa-users-cog mr-2" }),
                                "Utilisateurs"
                            ) : null,
                            // 5. Machines (gestion admin - moins fréquent)
                            (currentUser?.role === 'supervisor' || currentUser?.role === 'admin') ?
                            React.createElement('button', {
                                onClick: () => setShowMachineManagement(true),
                                className: "px-3 py-1.5 bg-teal-600 text-white text-sm rounded-md hover:bg-teal-700 font-semibold shadow-md transition-all flex items-center"
                            },
                                React.createElement('i', { className: "fas fa-cogs mr-2" }),
                                "Machines"
                            ) : null,
                            // 6. Parametres systeme (admin uniquement)
                            (currentUser?.role === 'admin') ?
                            React.createElement('button', {
                                onClick: () => setShowSystemSettings(true),
                                className: "px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 font-semibold shadow-md transition-all flex items-center"
                            },
                                React.createElement('i', { className: "fas fa-sliders-h mr-2" }),
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
                                className: "px-3 py-1.5 bg-gradient-to-r from-blue-700 to-blue-800 text-white text-sm rounded-md hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md transition-all flex items-center",
                                title: 'Gestion des rôles et permissions (Admin)'
                            },
                                React.createElement('i', { className: 'fas fa-shield-alt mr-2' }),
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
                                                // Update button color to green since user is subscribed
                                                if (window.updatePushButtonColor) {
                                                    setTimeout(() => window.updatePushButtonColor(), 100);
                                                }
                                                return;
                                            }

                                            const result = await window.subscribeToPush();
                                            if (result.success) {
                                                if (result.updated) {
                                                    alert('Abonnement push deja actif (mis a jour)');
                                                } else {
                                                    alert('Abonnement push enregistre avec succes!');
                                                }
                                                // Update button color after successful subscribe
                                                if (window.updatePushButtonColor) {
                                                    setTimeout(() => window.updatePushButtonColor(), 500);
                                                }
                                            } else {
                                                alert('Erreur: ' + result.error);
                                            }
                                            return;
                                        }

                                        if (currentPerm === 'denied') {
                                            alert('Les notifications ont ete refusees. Allez dans Parametres Android > Apps > IGP > Notifications pour les activer.');
                                            return;
                                        }

        // MainApp - DÉPLACÉ VERS /static/js/components/MainApp.js
        // App - DÉPLACÉ VERS /static/js/components/App.js


        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App));

        // Simple stats loader - no React state, just direct DOM update
        window.loadSimpleStats = function() {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            axios.get('/api/stats/active-tickets', {
                headers: { 'Authorization': 'Bearer ' + token }
            })
            .then(response => {
                // Update active tickets count
                const activeCount = response.data.activeTickets;
                const activeElement = document.getElementById('active-tickets-count');
                if (activeElement && activeCount !== undefined) {
                    activeElement.textContent = activeCount + ' tickets actifs (Global)';
                }

                // Update overdue tickets badge
                const overdueCount = response.data.overdueTickets;
                const overdueElement = document.getElementById('overdue-tickets-badge');
                const overdueWrapper = document.getElementById('overdue-tickets-badge-wrapper');
                if (overdueElement && overdueCount !== undefined) {
                    overdueElement.textContent = overdueCount + ' retard';
                    // Change color if there are overdue tickets
                    if (overdueWrapper && overdueCount > 0) {
                        overdueWrapper.className = 'px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300 cursor-pointer hover:bg-red-200 transition-colors animate-pulse';
                    } else if (overdueWrapper) {
                        overdueWrapper.className = 'px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-300 cursor-pointer hover:bg-orange-200 transition-colors';
                    }
                }

                // Update technicians count badge
                const techCount = response.data.activeTechnicians;
                const techElement = document.getElementById('technicians-count-badge');
                if (techElement && techCount !== undefined) {
                    techElement.textContent = techCount + ' techs';
                }

                // Update push devices badge
                const pushCount = response.data.pushDevices;
                const pushElement = document.getElementById('push-devices-badge');
                if (pushElement && pushCount !== undefined) {
                    pushElement.textContent = pushCount + ' apps';
                }
            })
            .catch(error => {
                // Silently fail - keep showing local count
                console.log('[Stats] Could not load global stats');
            });
        };

        // Load stats once after a short delay (let app render first)
        setTimeout(() => {
            if (window.loadSimpleStats) {
                window.loadSimpleStats();
            }
        }, 2000);

        // Auto-refresh stats every 60 seconds for real-time updates
        // Uses same technique as unread messages counter (line 8051)
        // Direct DOM manipulation ensures no visual flickering
        setInterval(() => {
            if (window.loadSimpleStats) {
                window.loadSimpleStats();
            }
        }, 60000); // 60 seconds

        // Enregistrer le Service Worker pour PWA
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        // Service Worker enregistré
                    })
                    .catch(error => {
                        // Erreur silencieuse
                    });
            });
        }
    </script>
    <script src="/push-notifications.js"></script>
</body>
</html>
`;
