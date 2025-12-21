/**
 * Dashboard V2 - HTML Template
 * 
 * Page HTML pour le nouveau dashboard moderne.
 * Design glassmorphism identique au legacy
 */

export const dashboardV2HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard V2 - MaintenanceOS</title>
    <link rel="icon" type="image/png" href="/static/logo-igp.png">
    <meta name="theme-color" content="#003B73">
    <meta name="mobile-web-app-capable" content="yes">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'emerald': {
                            50: '#ecfdf5',
                            100: '#d1fae5',
                            200: '#a7f3d0',
                            300: '#6ee7b7',
                            400: '#34d399',
                            500: '#10b981',
                            600: '#059669',
                            700: '#047857',
                            800: '#065f46',
                            900: '#064e3b',
                        }
                    }
                }
            }
        }
    </script>
    
    <!-- Font Awesome Icons -->
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    
    <style>
        /* ============================
         * GLASSMORPHISM DESIGN SYSTEM
         * ============================ */
        
        :root {
            --glass-bg: rgba(255, 255, 255, 0.60);
            --glass-bg-hover: rgba(255, 255, 255, 0.90);
            --glass-blur: 16px;
            --glass-border: rgba(255, 255, 255, 0.8);
            --shadow-soft: 0 4px 12px 0 rgba(0, 0, 0, 0.1);
            --shadow-hover: 0 6px 16px 0 rgba(0, 0, 0, 0.12);
            
            --priority-critical: #dc2626;
            --priority-high: #ef4444;
            --priority-medium: #f59e0b;
            --priority-low: #10b981;
        }

        /* === FIXED BACKGROUND LAYER === */
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
            will-change: transform;
        }

        /* === GLASSMORPHISM CARD === */
        .glass-card {
            background: var(--glass-bg);
            backdrop-filter: blur(var(--glass-blur));
            -webkit-backdrop-filter: blur(var(--glass-blur));
            border-radius: 12px;
            padding: 12px;
            box-shadow: var(--shadow-soft);
            border: 1px solid var(--glass-border);
            transition: all 0.2s ease;
        }

        .glass-card:hover {
            background: var(--glass-bg-hover);
            box-shadow: var(--shadow-hover);
            transform: translateY(-2px);
        }

        /* === KANBAN COLUMN === */
        .kanban-column {
            min-height: 400px;
            min-width: 260px;
            background: var(--glass-bg);
            backdrop-filter: blur(var(--glass-blur));
            -webkit-backdrop-filter: blur(var(--glass-blur));
            border-radius: 12px;
            padding: 12px;
            box-shadow: var(--shadow-soft);
            border: 1px solid var(--glass-border);
            transition: all 0.2s ease;
        }

        .kanban-column:hover {
            background: var(--glass-bg-hover);
            box-shadow: var(--shadow-hover);
            transform: translateY(-2px);
        }

        .kanban-column.empty {
            flex: 0 0 auto;
            width: 200px;
        }

        .kanban-column.has-tickets {
            flex: 1 1 280px;
            max-width: 320px;
        }

        .kanban-column.drag-over {
            background: #dbeafe;
            border: 3px dashed #3b82f6;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
            transform: scale(1.02);
        }

        /* === TICKET CARD - NEUMORPHISM PREMIUM === */
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
            border: 1px solid rgba(203, 213, 225, 0.6);
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

        .ticket-card:hover {
            box-shadow:
                8px 8px 24px rgba(71, 85, 105, 0.35),
                -4px -4px 14px rgba(255, 255, 255, 1),
                inset 0 1px 0 rgba(255, 255, 255, 0.6),
                0 4px 12px rgba(0, 0, 0, 0.20);
            transform: translateY(-3px);
        }

        .ticket-card.dragging {
            opacity: 0.7;
            cursor: grabbing;
            transform: rotate(3deg) scale(1.05);
        }

        /* === PRIORITY STYLES === */
        .priority-critical {
            border-left: 5px solid var(--priority-critical);
        }

        .priority-high {
            border-left: 5px solid var(--priority-high);
        }

        .priority-medium {
            border-left: 5px solid var(--priority-medium);
        }

        .priority-low {
            border-left: 5px solid var(--priority-low);
        }

        /* === BADGES === */
        .badge {
            display: inline-flex;
            align-items: center;
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
        }

        .badge-critical {
            background: rgba(220, 38, 38, 0.15);
            color: #dc2626;
            border: 1px solid rgba(220, 38, 38, 0.3);
        }

        .badge-high {
            background: rgba(239, 68, 68, 0.15);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .badge-medium {
            background: rgba(245, 158, 11, 0.15);
            color: #d97706;
            border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .badge-low {
            background: rgba(16, 185, 129, 0.15);
            color: #059669;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }

        /* === HEADER GLASS === */
        .header-glass {
            background: rgba(0, 59, 115, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* === ANIMATIONS === */
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

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .animate-spin {
            animation: spin 1s linear infinite;
        }

        .animate-fade-in {
            animation: fadeInUp 0.3s ease-out;
        }

        /* === SCROLLBAR CUSTOM === */
        .custom-scroll {
            overflow-x: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(148, 163, 184, 0.5) transparent;
        }

        .custom-scroll::-webkit-scrollbar {
            height: 8px;
        }

        .custom-scroll::-webkit-scrollbar-track {
            background: rgba(148, 163, 184, 0.1);
            border-radius: 4px;
        }

        .custom-scroll::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.5);
            border-radius: 4px;
        }

        /* === UTILITIES === */
        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
    </style>
</head>
<body class="min-h-screen overflow-x-hidden">
    <!-- React Root -->
    <div id="dashboard-v2-root">
        <!-- Loading placeholder with glassmorphism -->
        <div id="app-background"></div>
        <div class="min-h-screen flex items-center justify-center">
            <div class="glass-card text-center p-8">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                <p class="mt-4 text-gray-700">Chargement Dashboard V2...</p>
            </div>
        </div>
    </div>
    
    <!-- React Bundle -->
    <script type="module" src="/static/dashboard-v2/main.js"></script>
</body>
</html>`;
