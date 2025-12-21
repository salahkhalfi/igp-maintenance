/**
 * Dashboard V2 - HTML Template
 * 
 * Page HTML pour le nouveau dashboard moderne.
 * Charge le bundle React depuis /static/dashboard-v2/main.js
 */

export const dashboardV2HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard V2 - MaintenanceOS</title>
    <link rel="icon" type="image/png" href="/static/logo-igp.png">
    
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
        /* Smooth transitions */
        * {
            transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
        }
        
        /* Loading spinner */
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .animate-spin {
            animation: spin 1s linear infinite;
        }
    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    <!-- React Root -->
    <div id="dashboard-v2-root">
        <!-- Loading placeholder (replaced by React) -->
        <div class="min-h-screen flex items-center justify-center">
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p class="mt-4 text-gray-600">Chargement Dashboard V2...</p>
            </div>
        </div>
    </div>
    
    <!-- React Bundle -->
    <script type="module" src="/static/dashboard-v2/main.js"></script>
</body>
</html>`;
