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
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Maintenance IGP">
    <link rel="apple-touch-icon" href="/icon-192.png">
    <link rel="stylesheet" href="/static/styles.css">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js"></script>
    <script src="https://unpkg.com/html5-qrcode" type="text/javascript"></script>
    <script src="/static/js/utils.js"></script>
    <script src="/static/js/components/MessagingSidebar.js"></script>
    <script src="/static/js/components/MessagingChatWindow.js"></script>
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
    <script src="/static/js/components/TicketAttachments.js?v=2.8.3"></script>
    <script src="/static/js/components/TicketHistory.js?v=2.8.3"></script>
    <script src="/static/js/components/TicketComments.js?v=2.8.3"></script>
    <script src="/static/js/components/TicketDetailsModal.js"></script>
    <script src="/static/js/components/ErrorBoundary.js"></script>
    <script src="/static/js/components/MachineManagementModal.js"></script>
    <script src="/static/js/components/RoleDropdown.js"></script>
    <script src="/static/js/components/SystemSettingsModal.js"></script>
    <script src="/static/js/components/PerformanceModal.js"></script>
    <script src="/static/js/components/OverdueTicketsModal.js"></script>
    <script src="/static/js/components/PushDevicesModal.js"></script>
    <script src="/static/js/components/UserManagementModal.js?v=2.8.3"></script>
    <script src="/static/js/components/AppHeader.js?v=2.8.3"></script>
    <script src="/static/js/components/AdminRoles.js?v=2.8.3"></script>
    <script src="/static/js/hooks/useTickets.js?v=2.8.3"></script>
    <script src="/static/js/hooks/useMachines.js?v=2.8.3"></script>
    <script src="/static/js/components/KanbanBoard.js?v=2.8.3"></script>
    <script src="/static/js/components/MainApp.js?v=2.8.3"></script>
    <script src="/static/js/components/App.js?v=2.8.3"></script>
    <style>
        /* Background avec photo d'atelier IGP pour toutes les pages */
        body {
            background-image: url(/static/maintenance-bg-premium.jpg);
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
        // API_URL est défini dans utils.js
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
    <!-- MODERN FRONTEND INTEGRATION -->
    <div id="react-root"></div>
    <script type="module" src="/static/client/main.js"></script>
</body>
</html>
`;
