export const homeHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MaintenanceOS - Système de Gestion de Maintenance</title>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="icon" type="image/png" href="/icon-192.png">
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#003B73">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="MaintenanceOS">
    <link rel="apple-touch-icon" href="/icon-192.png">
    <link rel="stylesheet" href="/static/styles.css">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://unpkg.com/html5-qrcode" type="text/javascript"></script>
    <script src="/static/js/utils.js"></script>
    <script src="/static/js/components/MessagingSidebar.js?v=3.0.2"></script>
    <script src="/static/js/components/MessagingChatWindow.js?v=3.0.2"></script>
    <script src="/static/js/components/MessagingModal.js?v=3.0.2"></script>
    <script src="/static/js/components/NotificationModal.js"></script>
    <script src="/static/js/components/ConfirmModal.js"></script>
    <script src="/static/js/components/Toast.js"></script>
    <script src="/static/js/components/TicketTimer.js"></script>
    <script src="/static/js/components/ScheduledCountdown.js"></script>
    <script src="/static/js/components/UserGuideModal.js"></script>
    <script src="/static/js/components/PromptModal.js"></script>
    <script src="/static/js/components/LoginForm.js"></script>
    <script src="/static/js/components/MoveTicketBottomSheet.js"></script>
    <script src="/static/js/components/CreateTicketModal.js?v=3.0.4"></script>
    <script src="/static/js/components/TicketDetailsModal_v3.js?v=3.2.0"></script>
    <script src="/static/js/components/ErrorBoundary.js"></script>
    <script src="/static/js/components/MachineManagementModal.js"></script>
    <script src="/static/js/components/RoleDropdown.js"></script>
    <script src="/static/js/components/SystemSettingsModal.js?v=3.0.5"></script>
    <script src="/static/js/components/PerformanceModal.js"></script>
    <script src="/static/js/components/AIChatModal_v4.js?v=3.1.0"></script>
    <script src="/static/js/components/OverdueTicketsModal.js"></script>
    <script src="/static/js/components/PushDevicesModal.js"></script>
    <!-- MISSING SCRIPTS RESTORED -->
    <script src="/static/js/hooks/useTickets.js"></script>
    <script src="/static/js/hooks/useMachines.js"></script>
    <script src="/static/js/components/AppHeader.js"></script>
    <script src="/static/js/components/planning/PlanningNotes_v2.js?v=2.14.182"></script>
    <script src="/static/js/components/planning/PlanningModals_v3.js?v=3.0.0"></script>
    <script src="/static/js/components/ProductionPlanning_v3.js?v=3.0.0"></script>
    <script src="/static/js/components/KanbanBoard.js"></script>
    <script src="/static/js/components/AdminRoles.js"></script>
    <script src="/static/js/components/ManageColumnsModal.js"></script>
    <script src="/static/js/components/TicketComments.js"></script>
    <script src="/static/js/components/TicketAttachments.js"></script>
    <script src="/static/js/components/UserForms.js"></script>
    <script src="/static/js/components/UserList.js"></script>
    <script src="/static/js/components/UserManagementModal.js?v=2.8.3"></script>
    <script src="/static/js/components/VoiceTicketFab.js"></script>
    <script src="/static/js/components/MainApp.js?v=3.0.5"></script>
    <script src="/static/js/components/App.js?v=3.0.5"></script>
    <style>
        /* FIXED BACKGROUND LAYER - Solves mobile/resize glitching */
        #app-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: url(/static/maintenance-bg-premium.jpg);
            background-size: cover;
            background-position: center;
            z-index: -1;
            will-change: transform; /* Hint to GPU */
        }

        body {
            /* Background moved to #app-background */
            min-height: 100vh;
            overflow-x: hidden; /* Prevent horizontal scroll on body */
        }

        .kanban-column {
            min-height: 400px;
            min-width: 260px;
            /* RESTORED backdrop-filter */
            background: rgba(255, 255, 255, 0.60); 
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-radius: 12px;
            padding: 12px;
            box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.8);
            transition: transform 0.2s ease; 
        }

        .kanban-column:hover {
            background: rgba(255, 255, 255, 0.90); /* Slightly more opaque on hover (from 0.95 to 0.90) */
            box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.12);
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
            /* animation: pulse-subtle 3s ease-in-out infinite; */
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

        /* --- MARKDOWN STYLES FOR AI CHAT --- */
        .prose-sm { font-size: 0.95rem; line-height: 1.5; }
        .prose-sm p { margin-bottom: 0.75em; }
        .prose-sm p:last-child { margin-bottom: 0; }
        .prose-sm ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 0.75em; }
        .prose-sm ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 0.75em; }
        .prose-sm li { margin-bottom: 0.25em; }
        .prose-sm strong { font-weight: 700; color: inherit; }
        .prose-sm em { font-style: italic; }
        .prose-sm code { background-color: rgba(0,0,0,0.08); padding: 0.1em 0.3em; border-radius: 0.3em; font-family: monospace; font-size: 0.9em; color: #d63384; }
        .prose-sm pre { background-color: #1e293b; color: #f8fafc; padding: 1em; border-radius: 0.5em; overflow-x: auto; margin-bottom: 1em; font-size: 0.85em; }
        .prose-sm pre code { background-color: transparent; padding: 0; color: inherit; white-space: pre-wrap; word-break: break-all; }
        .prose-sm h1, .prose-sm h2, .prose-sm h3, .prose-sm h4 { font-weight: 700; margin-top: 1.2em; margin-bottom: 0.6em; line-height: 1.3; }
        .prose-sm h1 { font-size: 1.4em; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.3em; }
        .prose-sm h2 { font-size: 1.25em; }
        .prose-sm h3 { font-size: 1.1em; }
        .prose-sm blockquote { border-left: 4px solid #e5e7eb; padding-left: 1em; font-style: italic; color: #4b5563; margin-bottom: 1em; }
        .prose-sm a { color: #3b82f6; text-decoration: underline; }
        .prose-sm a:hover { color: #2563eb; }
        
        /* Table Styles */
        .prose-sm table { width: 100%; border-collapse: collapse; margin-bottom: 1em; font-size: 0.9em; }
        .prose-sm th, .prose-sm td { border: 1px solid #e2e8f0; padding: 0.5em 0.75em; text-align: left; }
        .prose-sm th { background-color: #f8fafc; font-weight: 600; }
        .prose-sm tr:nth-child(even) { background-color: #f1f5f9; }

        /* Dark mode adaptation for user messages */
        .bg-purple-600 .prose-sm code { background-color: rgba(255,255,255,0.2); color: #fff; }
        .bg-purple-600 .prose-sm pre { background-color: rgba(0,0,0,0.3); }
        .bg-purple-600 .prose-sm blockquote { border-left-color: rgba(255,255,255,0.4); color: rgba(255,255,255,0.9); }
        .bg-purple-600 .prose-sm a { color: #bfdbfe; }
        .bg-purple-600 .prose-sm th { background-color: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
        .bg-purple-600 .prose-sm td { border-color: rgba(255,255,255,0.2); }
        .bg-purple-600 .prose-sm tr:nth-child(even) { background-color: rgba(255,255,255,0.05); }

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
    <div id="app-background"></div>
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
        console.log('HOME HTML LOADED v3.0.1 (Stable Ticket Modal)');
        let authToken = localStorage.getItem('auth_token');
        let currentUser = null;

        // Variables globales pour titre et sous-titre personnalisés
        let companyTitle = 'Gestion de la maintenance et des réparations';
        let companySubtitle = 'Système de Maintenance Universel';

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

        // --- TV DASHBOARD MODAL ---
        const TVDashboardModal = ({ isOpen, onClose }) => {
            const [config, setConfig] = React.useState(null);
            const [loading, setLoading] = React.useState(false);
            const [error, setError] = React.useState(null);
            const [copied, setCopied] = React.useState(false);
            const [regenerating, setRegenerating] = React.useState(false);

            React.useEffect(() => {
                if (isOpen) {
                    loadConfig();
                }
            }, [isOpen]);

            const loadConfig = () => {
                setLoading(true);
                setError(null);
                axios.get('/api/tv/admin/config')
                    .then(res => {
                        setConfig(res.data);
                        setLoading(false);
                    })
                    .catch(err => {
                        console.error(err);
                        setError("Impossible de récupérer la configuration TV.");
                        setLoading(false);
                    });
            };

            const copyToClipboard = () => {
                if (!config) return;
                navigator.clipboard.writeText(config.url).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                });
            };

            const handleRegenerate = () => {
                if (!confirm("ATTENTION : Générer une nouvelle clé rendra l'ancien lien invalide. Tous les écrans devront être mis à jour. Continuer ?")) {
                    return;
                }
                
                setRegenerating(true);
                axios.post('/api/tv/admin/regenerate')
                    .then(res => {
                        setConfig({ key: res.data.key, url: res.data.url });
                        alert("Nouvelle clé générée avec succès !");
                    })
                    .catch(err => {
                        alert("Erreur lors de la génération de la clé.");
                        console.error(err);
                    })
                    .finally(() => {
                        setRegenerating(false);
                    });
            };

            if (!isOpen) return null;

            return React.createElement('div', { className: "modal active", style: { zIndex: 1100 } },
                React.createElement('div', { className: "modal-content bg-white rounded-lg shadow-2xl p-6 max-w-lg w-full mx-4" },
                    React.createElement('div', { className: "flex justify-between items-center mb-6" },
                        React.createElement('h2', { className: "text-xl font-bold text-gray-800 flex items-center gap-2" },
                            React.createElement('i', { className: "fas fa-tv text-blue-600" }),
                            "Mode Affichage TV"
                        ),
                        React.createElement('button', { onClick: onClose, className: "text-gray-400 hover:text-gray-600" },
                            React.createElement('i', { className: "fas fa-times text-xl" })
                        )
                    ),
                    
                    loading ? 
                        React.createElement('div', { className: "flex justify-center py-8" },
                            React.createElement('i', { className: "fas fa-spinner fa-spin text-3xl text-blue-500" })
                        ) :
                    error ?
                        React.createElement('div', { className: "bg-red-50 text-red-600 p-4 rounded-lg mb-4" },
                            React.createElement('i', { className: "fas fa-exclamation-circle mr-2" }),
                            error
                        ) :
                        React.createElement('div', { className: "space-y-4" },
                            React.createElement('div', { className: "bg-blue-50 p-4 rounded-lg border border-blue-100" },
                                React.createElement('p', { className: "text-sm text-blue-800 mb-2 font-medium" },
                                    "Lien d'accès sécurisé pour l'écran TV :"
                                ),
                                React.createElement('div', { className: "flex items-center gap-2" },
                                    React.createElement('input', { 
                                        type: "text", 
                                        readOnly: true, 
                                        value: config?.url || '', 
                                        className: "flex-1 p-2 text-sm bg-white border border-blue-200 rounded text-gray-600 font-mono select-all focus:outline-none" 
                                    }),
                                    React.createElement('button', { 
                                        onClick: copyToClipboard,
                                        className: \`p-2 rounded transition-colors \${copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}\`
                                    },
                                        React.createElement('i', { className: \`fas \${copied ? 'fa-check' : 'fa-copy'}\` })
                                    )
                                )
                            ),
                            React.createElement('div', { className: "grid grid-cols-2 gap-4" },
                                React.createElement('a', { 
                                    href: config?.url, 
                                    target: "_blank",
                                    className: "flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group text-decoration-none" 
                                },
                                    React.createElement('i', { className: "fas fa-external-link-alt text-2xl text-gray-400 group-hover:text-blue-500 mb-2" }),
                                    React.createElement('span', { className: "text-sm font-bold text-gray-600 group-hover:text-blue-600" }, "Ouvrir l'affichage")
                                ),
                                React.createElement('button', { 
                                    onClick: handleRegenerate,
                                    disabled: regenerating,
                                    className: "flex flex-col items-center justify-center p-4 border border-gray-200 bg-gray-50 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors group" 
                                },
                                    React.createElement('i', { className: \`fas \${regenerating ? 'fa-spinner fa-spin' : 'fa-sync-alt'} text-2xl text-gray-400 group-hover:text-red-500 mb-2\` }),
                                    React.createElement('span', { className: "text-sm font-bold text-gray-600 group-hover:text-red-600" }, "Régénérer la Clé")
                                )
                            ),
                            React.createElement('div', { className: "text-xs text-gray-400 mt-4 text-center" },
                                React.createElement('i', { className: "fas fa-shield-alt mr-1" }),
                                "Ce lien contient une clé d'accès. Ne le partagez qu'aux personnes autorisées."
                            )
                        )
                )
            );
        };

        // Expose to window for MainApp to use if needed (though we'll inject it into App)
        window.TVDashboardModal = TVDashboardModal;


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
                        overdueWrapper.className = 'px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300 cursor-pointer hover:bg-red-200 transition-colors';
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
