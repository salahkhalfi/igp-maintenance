// État global
let allPermissions = [];
let allRoles = [];
let currentEditingRoleId = null;
const API_BASE = '';

// Utilitaires
function getToken() {
    // Priorité 1: Token injecté par le serveur (le plus fiable)
    if (window.__AUTH_TOKEN__) {
        return window.__AUTH_TOKEN__;
    }
    // Priorité 2: localStorage (fallback)
    return localStorage.getItem('auth_token') || localStorage.getItem('token');
}

function showError(message) {
    alert('❌ ' + message);
}

function showSuccess(message) {
    alert('✅ ' + message);
}

// Chargement initial
document.addEventListener('DOMContentLoaded', async () => {
    // Vérifier l'authentification
    const token = getToken();
    if (!token) {
        console.error('❌ Aucun token trouvé');
        alert('Session expirée. Veuillez vous reconnecter.');
        window.location.href = '/';
        return;
    }
    
    console.log('✅ Token détecté:', token.substring(0, 20) + '...');
    
    // Afficher l'email de l'utilisateur si disponible
    if (window.__CURRENT_USER__) {
        const emailElement = document.getElementById('currentUserEmail');
        if (emailElement) {
            emailElement.textContent = window.__CURRENT_USER__.email;
        }
    }

    // Charger les données
    await loadPermissions();
    await loadRoles();
});

// Charger toutes les permissions
async function loadPermissions() {
    try {
        const response = await fetch(API_BASE + '/api/roles/permissions/all', {
            headers: { 'Authorization': 'Bearer ' + getToken() }
        });
        
        if (!response.ok) throw new Error('Erreur chargement permissions');
        
        const data = await response.json();
        allPermissions = data.permissions;
        
        console.log('✅ Permissions chargées:', allPermissions.length);
    } catch (error) {
        console.error('Erreur:', error);
        showError('Impossible de charger les permissions');
    }
}

// Charger tous les rôles
async function loadRoles() {
    try {
        const response = await fetch(API_BASE + '/api/roles', {
            headers: { 'Authorization': 'Bearer ' + getToken() }
        });
        
        if (!response.ok) {
            // Tenter de récupérer le message d'erreur du serveur
            let errorDetails = 'Erreur inconnue';
            try {
                const errorJson = await response.json();
                errorDetails = errorJson.error || JSON.stringify(errorJson);
            } catch (e) {
                errorDetails = `Status ${response.status} ${response.statusText}`;
            }
            throw new Error(`Erreur chargement rôles: ${errorDetails}`);
        }
        
        const data = await response.json();
        allRoles = data.roles;
        
        // Mettre à jour les stats
        updateStats();
        
        // Afficher les rôles
        displayRoles();
        
        console.log('✅ Rôles chargés:', allRoles.length);
    } catch (error) {
        console.error('Erreur:', error);
        showError('Impossible de charger les rôles');
    }
}

// Mettre à jour les statistiques
function updateStats() {
    const systemRoles = allRoles.filter(r => r.is_system === 1);
    const customRoles = allRoles.filter(r => r.is_system === 0);
    
    document.getElementById('statsTotal').textContent = allRoles.length;
    document.getElementById('statsSystem').textContent = systemRoles.length;
    document.getElementById('statsCustom').textContent = customRoles.length;
}

// Afficher les rôles
function displayRoles() {
    const container = document.getElementById('rolesContainer');
    
    if (allRoles.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">Aucun rôle trouvé</p>
            </div>
        `;
        return;
    }
    
    // Séparer rôles système et personnalisés
    const systemRoles = allRoles.filter(r => r.is_system === 1);
    const customRoles = allRoles.filter(r => r.is_system === 0);
    
    let html = '';
    
    // Rôles système
    systemRoles.forEach(role => {
        html += createRoleCard(role, true);
    });
    
    // Rôles personnalisés
    customRoles.forEach(role => {
        html += createRoleCard(role, false);
    });
    
    container.innerHTML = html;
}

// Créer une carte de rôle
function createRoleCard(role, isSystem) {
    const iconMap = {
        'admin': 'fa-crown',
        'supervisor': 'fa-user-tie',
        'technician': 'fa-wrench',
        'operator': 'fa-headset'
    };
    
    const colorMap = {
        'admin': 'from-red-500 to-red-600',
        'supervisor': 'from-purple-500 to-purple-600',
        'technician': 'from-blue-500 to-blue-600',
        'operator': 'from-green-500 to-green-600'
    };
    
    const icon = iconMap[role.slug] || 'fa-user-cog';
    const color = isSystem ? (colorMap[role.slug] || 'from-gray-500 to-gray-600') : 'from-indigo-500 to-indigo-600';
    
    return `
        <div class="role-card bg-white rounded-xl shadow-md overflow-hidden">
            <!-- Header avec gradient -->
            <div class="bg-gradient-to-r ${color} p-6 text-white">
                <div class="flex items-start justify-between mb-4">
                    <div class="bg-white bg-opacity-20 rounded-lg p-3">
                        <i class="fas ${icon} text-2xl"></i>
                    </div>
                    ${isSystem ? 
                        '<span class="bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs font-semibold"><i class="fas fa-lock mr-1"></i>Système</span>' :
                        '<span class="bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs font-semibold"><i class="fas fa-star mr-1"></i>Personnalisé</span>'
                    }
                </div>
                <h3 class="text-xl font-bold mb-1">${role.name}</h3>
                <p class="text-xs text-white text-opacity-80">@${role.slug}</p>
            </div>
            
            <!-- Body -->
            <div class="p-6">
                <p class="text-gray-600 text-sm mb-4 line-clamp-2">${role.description || 'Aucune description'}</p>
                
                <!-- Stats -->
                <div class="flex items-center justify-between mb-4 text-sm">
                    <div class="flex items-center text-gray-700">
                        <i class="fas fa-key text-blue-500 mr-2"></i>
                        <span class="font-semibold">${role.permissions_count}</span>
                        <span class="ml-1 text-gray-500">permissions</span>
                    </div>
                    <div class="text-xs text-gray-500">
                        <i class="far fa-calendar mr-1"></i>
                        ${new Date(role.created_at).toLocaleDateString('fr-FR')}
                    </div>
                </div>
                
                <!-- Actions -->
                <div class="flex items-center gap-2">
                    <button onclick="viewRole(${role.id})" class="flex-1 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition text-sm font-medium">
                        <i class="fas fa-eye mr-2"></i>Voir
                    </button>
                    ${!isSystem ? `
                        <button onclick="editRole(${role.id})" class="flex-1 bg-green-50 text-green-600 px-4 py-2 rounded-lg hover:bg-green-100 transition text-sm font-medium">
                            <i class="fas fa-edit mr-2"></i>Modifier
                        </button>
                        <button onclick="deleteRole(${role.id}, '${role.name}')" class="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition text-sm">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : `
                        <button disabled class="flex-1 bg-gray-100 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed text-sm font-medium">
                            <i class="fas fa-lock mr-2"></i>Protégé
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;
}

// Ouvrir le modal de création
function openCreateModal() {
    currentEditingRoleId = null;
    
    document.getElementById('modalTitle').textContent = 'Créer un Nouveau Rôle';
    document.getElementById('roleName').value = '';
    document.getElementById('roleDisplayName').value = '';
    document.getElementById('roleDescription').value = '';
    
    renderPermissionsSelection();
    deselectAllPermissions();
    
    document.getElementById('roleModal').classList.add('active');
}

// Modifier un rôle
async function editRole(roleId) {
    try {
        const response = await fetch(API_BASE + `/api/roles/${roleId}`, {
            headers: { 'Authorization': 'Bearer ' + getToken() }
        });
        
        if (!response.ok) throw new Error('Erreur chargement rôle');
        
        const data = await response.json();
        const role = data.role;
        
        currentEditingRoleId = roleId;
        
        document.getElementById('modalTitle').textContent = 'Modifier le Rôle';
        document.getElementById('roleName').value = role.slug;
        document.getElementById('roleName').disabled = true; // Ne pas modifier le nom technique
        document.getElementById('roleDisplayName').value = role.name;
        document.getElementById('roleDescription').value = role.description;
        
        renderPermissionsSelection();
        
        // Sélectionner les permissions existantes
        role.permissions.forEach(perm => {
            const checkbox = document.getElementById(`perm-${perm.id}`);
            if (checkbox) checkbox.checked = true;
        });
        
        updateSelectedCount();
        
        document.getElementById('roleModal').classList.add('active');
        
    } catch (error) {
        console.error('Erreur:', error);
        showError('Impossible de charger le rôle');
    }
}

// Voir les détails d'un rôle
async function viewRole(roleId) {
    try {
        const response = await fetch(API_BASE + `/api/roles/${roleId}`, {
            headers: { 'Authorization': 'Bearer ' + getToken() }
        });
        
        if (!response.ok) throw new Error('Erreur chargement rôle');
        
        const data = await response.json();
        const role = data.role;
        
        document.getElementById('viewModalTitle').textContent = role.name;
        
        // Grouper permissions par ressource
        const grouped = {};
        role.permissions.forEach(perm => {
            if (!grouped[perm.resource]) grouped[perm.resource] = [];
            grouped[perm.resource].push(perm);
        });
        
        let html = `
            <div class="mb-6">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h3 class="text-lg font-bold text-gray-800">${role.name}</h3>
                        <p class="text-sm text-gray-500">@${role.slug}</p>
                    </div>
                    ${role.is_system === 1 ? 
                        '<span class="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold"><i class="fas fa-lock mr-1"></i>Rôle Système</span>' :
                        '<span class="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold"><i class="fas fa-star mr-1"></i>Rôle Personnalisé</span>'
                    }
                </div>
                <p class="text-gray-600">${role.description}</p>
            </div>
            
            <div class="border-t pt-6">
                <h4 class="font-bold text-gray-800 mb-4">
                    <i class="fas fa-key text-purple-500 mr-2"></i>
                    Permissions (${role.permissions.length})
                </h4>
        `;
        
        for (const [resource, perms] of Object.entries(grouped)) {
            html += `
                <div class="mb-6">
                    <h5 class="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
                        📦 ${resource}
                    </h5>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            `;
            
            perms.forEach(perm => {
                const scopeColor = perm.scope === 'all' ? 'text-green-600' : 'text-blue-600';
                html += `
                    <div class="flex items-center bg-gray-50 rounded-lg px-3 py-2">
                        <i class="fas fa-check-circle ${scopeColor} mr-2"></i>
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-800">${perm.display_name}</p>
                            <p class="text-xs text-gray-500">${perm.action}.${perm.scope}</p>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        
        document.getElementById('viewModalContent').innerHTML = html;
        document.getElementById('viewModal').classList.add('active');
        
    } catch (error) {
        console.error('Erreur:', error);
        showError('Impossible de charger les détails du rôle');
    }
}

// Supprimer un rôle
async function deleteRole(roleId, roleName) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le rôle "${roleName}" ?\n\nCette action est irréversible.`)) {
        return;
    }
    
    try {
        const response = await fetch(API_BASE + `/api/roles/${roleId}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + getToken() }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur suppression');
        }
        
        showSuccess(`Rôle "${roleName}" supprimé avec succès`);
        await loadRoles();
        
    } catch (error) {
        console.error('Erreur:', error);
        showError(error.message);
    }
}

// Rendre la sélection des permissions
function renderPermissionsSelection() {
    const container = document.getElementById('permissionsContainer');
    
    // Grouper par ressource
    const grouped = {};
    allPermissions.forEach(perm => {
        if (!grouped[perm.resource]) grouped[perm.resource] = [];
        grouped[perm.resource].push(perm);
    });
    
    let html = '';
    
    for (const [resource, perms] of Object.entries(grouped)) {
        html += `
            <div class="border border-gray-200 rounded-lg p-4">
                <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                    <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm mr-2">
                        ${perms.length}
                    </span>
                    📦 ${resource.toUpperCase()}
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        `;
        
        perms.forEach(perm => {
            const scopeColor = perm.scope === 'all' ? 'border-green-200' : 'border-blue-200';
            html += `
                <div class="permission-card border ${scopeColor} rounded-lg p-3">
                    <label class="flex items-start cursor-pointer">
                        <input type="checkbox" 
                               id="perm-${perm.id}" 
                               value="${perm.id}" 
                               onchange="updateSelectedCount()"
                               class="mt-1 mr-3 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-800">${perm.display_name}</p>
                            <p class="text-xs text-gray-500 mt-1">
                                <span class="font-mono bg-gray-100 px-2 py-0.5 rounded">${perm.action}.${perm.scope}</span>
                            </p>
                            ${perm.description ? `<p class="text-xs text-gray-500 mt-1">${perm.description}</p>` : ''}
                        </div>
                    </label>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Mettre à jour le compteur de sélection
function updateSelectedCount() {
    const checkboxes = document.querySelectorAll('#permissionsContainer input[type="checkbox"]:checked');
    document.getElementById('selectedCount').textContent = checkboxes.length;
}

// Sélectionner toutes les permissions
function selectAllPermissions() {
    const checkboxes = document.querySelectorAll('#permissionsContainer input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
    updateSelectedCount();
}

// Désélectionner toutes les permissions
function deselectAllPermissions() {
    const checkboxes = document.querySelectorAll('#permissionsContainer input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    updateSelectedCount();
}

// Sélectionner uniquement les permissions de lecture
function selectReadOnly() {
    deselectAllPermissions();
    allPermissions.forEach(perm => {
        if (perm.action === 'read') {
            const checkbox = document.getElementById(`perm-${perm.id}`);
            if (checkbox) checkbox.checked = true;
        }
    });
    updateSelectedCount();
}

// Sauvegarder le rôle
async function saveRole() {
    const name = document.getElementById('roleName').value.trim();
    const displayName = document.getElementById('roleDisplayName').value.trim();
    const description = document.getElementById('roleDescription').value.trim();
    
    // Validation
    if (!name || !displayName || !description) {
        showError('Veuillez remplir tous les champs obligatoires');
        return;
    }
    
    // Validation du nom technique
    if (!/^[a-z0-9_]+$/.test(name)) {
        showError('Le nom technique doit contenir uniquement des lettres minuscules, chiffres et underscores');
        return;
    }
    
    // Récupérer les permissions sélectionnées
    const checkboxes = document.querySelectorAll('#permissionsContainer input[type="checkbox"]:checked');
    const permissionIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if (permissionIds.length === 0) {
        showError('Veuillez sélectionner au moins une permission');
        return;
    }
    
    const roleData = {
        slug: name,
        name: displayName,
        description,
        permission_ids: permissionIds
    };
    
    try {
        const url = currentEditingRoleId 
            ? API_BASE + `/api/roles/${currentEditingRoleId}`
            : API_BASE + '/api/roles';
        
        const method = currentEditingRoleId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': 'Bearer ' + getToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(roleData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur sauvegarde');
        }
        
        const result = await response.json();
        
        showSuccess(currentEditingRoleId ? 'Rôle modifié avec succès' : 'Rôle créé avec succès');
        
        closeModal();
        await loadRoles();
        
    } catch (error) {
        console.error('Erreur:', error);
        showError(error.message);
    }
}

// Fermer le modal
function closeModal() {
    document.getElementById('roleModal').classList.remove('active');
    document.getElementById('roleName').disabled = false;
    currentEditingRoleId = null;
}

// Fermer le modal de détails
function closeViewModal() {
    document.getElementById('viewModal').classList.remove('active');
}

// Fermer les modals en cliquant à l'extérieur
window.onclick = function(event) {
    const roleModal = document.getElementById('roleModal');
    const viewModal = document.getElementById('viewModal');
    
    if (event.target === roleModal) {
        closeModal();
    }
    if (event.target === viewModal) {
        closeViewModal();
    }
}
