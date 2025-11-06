export const adminRolesHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestion des Rôles - IGP Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        .permission-card{transition:all .2s}.permission-card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.1)}.permission-checkbox:checked+label{background-color:#3b82f6;color:#fff}.role-card{transition:all .3s}.role-card:hover{transform:translateY(-4px);box-shadow:0 8px 24px rgba(0,0,0,.15)}.modal{display:none;position:fixed;z-index:50;left:0;top:0;width:100%;height:100%;background-color:rgba(0,0,0,.5);animation:fadeIn .3s}.modal.active{display:flex;align-items:center;justify-content:center}@keyframes fadeIn{from{opacity:0}to{opacity:1}}.modal-content{animation:slideUp .3s}@keyframes slideUp{from{transform:translateY(50px);opacity:0}to{transform:translateY(0);opacity:1}}
    </style>
</head>
<body class="bg-gray-50">
    <header class="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div class="container mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <i class="fas fa-shield-alt text-3xl"></i>
                    <div>
                        <h1 class="text-2xl font-bold">Gestion des Rôles</h1>
                        <p class="text-blue-200 text-sm">Système RBAC - Administration IGP</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="text-right">
                        <p class="text-sm text-blue-200">Connecté en tant que</p>
                        <p class="font-semibold" id="currentUserEmail">admin@igp.com</p>
                    </div>
                    <button onclick="window.history.back()" class="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition">
                        <i class="fas fa-arrow-left mr-2"></i>Retour
                    </button>
                </div>
            </div>
        </div>
    </header>

    <main class="container mx-auto px-6 py-8">
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-xl font-bold text-gray-800 mb-1">Rôles Utilisateurs</h2>
                    <p class="text-gray-600 text-sm">Gérez les rôles et permissions du système</p>
                </div>
                <button onclick="openCreateModal()" class="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition shadow-md">
                    <i class="fas fa-plus mr-2"></i>Créer un Nouveau Rôle
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-6">
                <div class="flex items-center justify-between">
                    <div><p class="text-blue-100 text-sm">Total Rôles</p><p class="text-3xl font-bold" id="statsTotal">-</p></div>
                    <i class="fas fa-users text-4xl text-blue-200"></i>
                </div>
            </div>
            <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-md p-6">
                <div class="flex items-center justify-between">
                    <div><p class="text-purple-100 text-sm">Rôles Système</p><p class="text-3xl font-bold" id="statsSystem">-</p></div>
                    <i class="fas fa-lock text-4xl text-purple-200"></i>
                </div>
            </div>
            <div class="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-md p-6">
                <div class="flex items-center justify-between">
                    <div><p class="text-green-100 text-sm">Rôles Personnalisés</p><p class="text-3xl font-bold" id="statsCustom">-</p></div>
                    <i class="fas fa-user-cog text-4xl text-green-200"></i>
                </div>
            </div>
            <div class="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-md p-6">
                <div class="flex items-center justify-between">
                    <div><p class="text-orange-100 text-sm">Permissions Totales</p><p class="text-3xl font-bold" id="statsPermissions">31</p></div>
                    <i class="fas fa-key text-4xl text-orange-200"></i>
                </div>
            </div>
        </div>

        <div id="rolesContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="col-span-full text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-500">Chargement des rôles...</p>
            </div>
        </div>
    </main>

    <div id="roleModal" class="modal"></div>
    <div id="viewModal" class="modal"></div>

    <script>
        // Vérifier l'authentification AVANT de charger le JS
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (!token) {
            console.error('❌ Aucun token trouvé dans localStorage');
            alert('Vous devez être connecté pour accéder à cette page.');
            window.location.href = '/';
        } else {
            console.log('✅ Token trouvé:', token.substring(0, 30) + '...');
            // S'assurer que les deux clés existent
            localStorage.setItem('auth_token', token);
            localStorage.setItem('token', token);
        }
    </script>
    <script src="/static/admin-roles.js"></script>
</body>
</html>`;
