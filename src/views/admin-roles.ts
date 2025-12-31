export const adminRolesHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestion des Rôles - Admin</title>
    <link rel="stylesheet" href="/static/styles.css">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        .permission-card{transition:all .2s}.permission-card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.1)}.permission-checkbox:checked+label{background-color:#3b82f6;color:#fff}.role-card{transition:all .3s}.role-card:hover{transform:translateY(-4px);box-shadow:0 8px 24px rgba(0,0,0,.15)}.modal{display:none;position:fixed;z-index:50;left:0;top:0;width:100%;height:100%;background-color:rgba(0,0,0,.5);animation:fadeIn .3s}.modal.active{display:flex;align-items:center;justify-content:center}@keyframes fadeIn{from{opacity:0}to{opacity:1}}.modal-content{animation:slideUp .3s}@keyframes slideUp{from{transform:translateY(50px);opacity:0}to{transform:translateY(0);opacity:1}}
    </style>
</head>
<body class="bg-gray-50">
    <header class="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div class="container mx-auto px-4 sm:px-6 py-4">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div class="flex items-center space-x-3 sm:space-x-4">
                    <i class="fas fa-shield-alt text-2xl sm:text-3xl"></i>
                    <div>
                        <h1 class="text-xl sm:text-2xl font-bold">Gestion des Rôles</h1>
                        <p class="text-blue-200 text-xs sm:text-sm">Système RBAC - Administration</p>
                    </div>
                </div>
                <div class="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                    <button onclick="window.history.back()" class="bg-white text-blue-600 px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-50 transition text-sm sm:text-base whitespace-nowrap">
                        <i class="fas fa-arrow-left mr-1 sm:mr-2"></i>Retour
                    </button>
                </div>
            </div>
        </div>
    </header>

    <main class="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div class="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
            <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div class="flex-1">
                    <h2 class="text-lg sm:text-xl font-bold text-gray-800 mb-1">Rôles Système Prédéfinis</h2>
                    <p class="text-gray-600 text-xs sm:text-sm">14 rôles spécialisés pour l'industrie du verre - Permissions configurées par le système</p>
                </div>
                <div class="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded-lg w-full lg:w-auto lg:max-w-md">
                    <div class="flex items-start">
                        <i class="fas fa-info-circle text-blue-500 text-base sm:text-lg mt-0.5 mr-2 sm:mr-3 flex-shrink-0"></i>
                        <div>
                            <p class="text-xs sm:text-sm font-semibold text-blue-800 mb-1">Rôles système uniquement</p>
                            <p class="text-xs text-blue-700">Les 14 rôles prédéfinis couvrent tous les besoins de l'industrie. La création de rôles personnalisés n'est plus nécessaire.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-4 sm:p-6">
                <div class="flex items-center justify-between">
                    <div><p class="text-blue-100 text-xs sm:text-sm">Total Rôles</p><p class="text-2xl sm:text-3xl font-bold" id="statsTotal">-</p></div>
                    <i class="fas fa-users text-2xl sm:text-4xl text-blue-200"></i>
                </div>
            </div>
            <div class="bg-gradient-to-br from-slate-500 to-slate-600 text-white rounded-lg shadow-md p-4 sm:p-6">
                <div class="flex items-center justify-between">
                    <div><p class="text-slate-100 text-xs sm:text-sm">Rôles Système</p><p class="text-2xl sm:text-3xl font-bold" id="statsSystem">-</p></div>
                    <i class="fas fa-lock text-2xl sm:text-4xl text-slate-200"></i>
                </div>
            </div>
            <div class="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-md p-4 sm:p-6">
                <div class="flex items-center justify-between">
                    <div><p class="text-green-100 text-xs sm:text-sm">Rôles Actifs</p><p class="text-2xl sm:text-3xl font-bold" id="statsCustom">-</p></div>
                    <i class="fas fa-check-circle text-2xl sm:text-4xl text-green-200"></i>
                </div>
            </div>
            <div class="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg shadow-md p-4 sm:p-6">
                <div class="flex items-center justify-between">
                    <div><p class="text-amber-100 text-xs sm:text-sm">Permissions</p><p class="text-2xl sm:text-3xl font-bold" id="statsPermissions">31</p></div>
                    <i class="fas fa-key text-2xl sm:text-4xl text-amber-200"></i>
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

    <!-- Modal de Modification -->
    <div id="roleModal" class="modal">
        <div class="modal-content bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
            <div class="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl z-10">
                <div class="flex items-center justify-between">
                    <h2 id="modalTitle" class="text-lg sm:text-2xl font-bold">Modifier le Rôle</h2>
                    <button onclick="closeModal()" class="text-white hover:text-gray-200 text-xl sm:text-2xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <div class="p-4 sm:p-6">
                <!-- Formulaire -->
                <div class="space-y-6 mb-6">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            <i class="fas fa-tag text-blue-500 mr-2"></i>Nom Technique *
                        </label>
                        <input type="text" id="roleName"
                               placeholder="ex: data_analyst"
                               class="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                               pattern="[a-z0-9_]+"
                               required>
                        <p class="text-xs text-gray-500 mt-1">Minuscules, chiffres et underscores uniquement</p>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            <i class="fas fa-text-width text-green-500 mr-2"></i>Nom d'Affichage *
                        </label>
                        <input type="text" id="roleDisplayName"
                               placeholder="ex: Analyste de Données"
                               class="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                               required>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            <i class="fas fa-align-left text-purple-500 mr-2"></i>Description *
                        </label>
                        <textarea id="roleDescription"
                                  rows="3"
                                  placeholder="Décrivez le rôle et ses responsabilités..."
                                  class="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                  required></textarea>
                    </div>
                </div>

                <!-- Permissions -->
                <div class="border-t pt-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-bold text-gray-800">
                            <i class="fas fa-key text-purple-500 mr-2"></i>
                            Permissions (<span id="selectedCount">0</span> sélectionnées)
                        </h3>
                        <div class="flex flex-wrap gap-2">
                            <button onclick="selectAllPermissions()" class="text-xs bg-blue-100 text-blue-700 px-2 sm:px-3 py-1 rounded-lg hover:bg-blue-200">
                                <i class="fas fa-check-double mr-1"></i><span class="hidden sm:inline">Tout </span>Sélect.
                            </button>
                            <button onclick="selectReadOnly()" class="text-xs bg-green-100 text-green-700 px-2 sm:px-3 py-1 rounded-lg hover:bg-green-200">
                                <i class="fas fa-eye mr-1"></i>Lecture
                            </button>
                            <button onclick="deselectAllPermissions()" class="text-xs bg-gray-100 text-gray-700 px-2 sm:px-3 py-1 rounded-lg hover:bg-gray-200">
                                <i class="fas fa-times mr-1"></i><span class="hidden sm:inline">Tout </span>Désel.
                            </button>
                        </div>
                    </div>

                    <div id="permissionsContainer" class="space-y-4 max-h-96 overflow-y-auto">
                        <!-- Les permissions seront chargées ici -->
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 mt-6 pt-6 border-t">
                    <button onclick="closeModal()" class="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm sm:text-base">
                        <i class="fas fa-times mr-2"></i>Annuler
                    </button>
                    <button onclick="saveRole()" class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-md text-sm sm:text-base">
                        <i class="fas fa-save mr-2"></i>Enregistrer
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal de Visualisation -->
    <div id="viewModal" class="modal">
        <div class="modal-content bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
            <div class="sticky top-0 bg-gradient-to-r from-slate-600 to-slate-800 text-white p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl z-10">
                <div class="flex items-center justify-between">
                    <h2 id="viewModalTitle" class="text-lg sm:text-2xl font-bold">Détails du Rôle</h2>
                    <button onclick="closeViewModal()" class="text-white hover:text-gray-200 text-xl sm:text-2xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <div id="viewModalContent" class="p-4 sm:p-6">
                <!-- Le contenu sera chargé dynamiquement -->
            </div>
        </div>
    </div>

    <script>
        // Vérifier l'authentification AVANT de charger le JS
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (!token) {
            console.error('❌ Aucun token trouvé dans localStorage');
            alert('Vous devez être connecté pour accéder à cette page.');
            window.location.href = '/';
        } else {
            console.log('✅ Token trouvé:', token.substring(0, 30) + '...');
            // S'assurer que les deux clés existent pour compatibilité
            localStorage.setItem('auth_token', token);
            localStorage.setItem('token', token);
        }
    </script>
    <script src="/static/admin-roles.js"></script>
</body>
</html>`;
