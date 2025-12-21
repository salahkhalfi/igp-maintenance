/**
 * Génère une version optimisée de home.ts avec :
 * - Fichiers minifiés depuis /static/js/dist/
 * - Preload pour les scripts critiques
 * - Cache busting avec hash
 * 
 * Usage: node scripts/generate-optimized-home.cjs
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HOME_PATH = path.join(__dirname, '../src/views/home.ts');
const DIST_DIR = path.join(__dirname, '../public/static/js/dist');

// Générer un hash court pour cache busting
const VERSION = crypto.randomBytes(4).toString('hex');

// Mapping des fichiers originaux vers minifiés
const SCRIPT_MAPPINGS = {
    // Utils
    '/static/js/utils.js': `/static/js/dist/utils.min.js?v=${VERSION}`,
    
    // Composants (dans l'ordre de chargement)
    '/static/js/components/NotificationModal.js': `/static/js/dist/NotificationModal.min.js?v=${VERSION}`,
    '/static/js/components/ConfirmModal.js': `/static/js/dist/ConfirmModal.min.js?v=${VERSION}`,
    '/static/js/components/Toast.js': `/static/js/dist/Toast.min.js?v=${VERSION}`,
    '/static/js/components/TicketTimer.js': `/static/js/dist/TicketTimer.min.js?v=${VERSION}`,
    '/static/js/components/ScheduledCountdown.js': `/static/js/dist/ScheduledCountdown.min.js?v=${VERSION}`,
    '/static/js/components/UserGuideModal.js': `/static/js/dist/UserGuideModal.min.js?v=${VERSION}`,
    '/static/js/components/PromptModal.js': `/static/js/dist/PromptModal.min.js?v=${VERSION}`,
    '/static/js/components/LoginForm.js': `/static/js/dist/LoginForm.min.js?v=${VERSION}`,
    '/static/js/components/MoveTicketBottomSheet.js': `/static/js/dist/MoveTicketBottomSheet.min.js?v=${VERSION}`,
    '/static/js/components/CreateTicketModal.js': `/static/js/dist/CreateTicketModal.min.js?v=${VERSION}`,
    '/static/js/components/TicketDetailsModal_v3.js': `/static/js/dist/TicketDetailsModal_v3.min.js?v=${VERSION}`,
    '/static/js/components/ErrorBoundary.js': `/static/js/dist/ErrorBoundary.min.js?v=${VERSION}`,
    '/static/js/components/MachineManagementModal.js': `/static/js/dist/MachineManagementModal.min.js?v=${VERSION}`,
    '/static/js/components/RoleDropdown.js': `/static/js/dist/RoleDropdown.min.js?v=${VERSION}`,
    '/static/js/components/SystemSettingsModal.js': `/static/js/dist/SystemSettingsModal.min.js?v=${VERSION}`,
    '/static/js/components/PerformanceModal.js': `/static/js/dist/PerformanceModal.min.js?v=${VERSION}`,
    '/static/js/components/AIChatModal_v4.js': `/static/js/dist/AIChatModal_v4.min.js?v=${VERSION}`,
    '/static/js/components/OverdueTicketsModal.js': `/static/js/dist/OverdueTicketsModal.min.js?v=${VERSION}`,
    '/static/js/components/PushDevicesModal.js': `/static/js/dist/PushDevicesModal.min.js?v=${VERSION}`,
    '/static/js/components/AppHeader.js': `/static/js/dist/AppHeader.min.js?v=${VERSION}`,
    '/static/js/components/ProductionPlanning_v3.js': `/static/js/dist/ProductionPlanning_v3.min.js?v=${VERSION}`,
    '/static/js/components/KanbanBoard.js': `/static/js/dist/KanbanBoard.min.js?v=${VERSION}`,
    '/static/js/components/AdminRoles.js': `/static/js/dist/AdminRoles.min.js?v=${VERSION}`,
    '/static/js/components/ManageColumnsModal.js': `/static/js/dist/ManageColumnsModal.min.js?v=${VERSION}`,
    '/static/js/components/TicketComments.js': `/static/js/dist/TicketComments.min.js?v=${VERSION}`,
    '/static/js/components/TicketAttachments.js': `/static/js/dist/TicketAttachments.min.js?v=${VERSION}`,
    '/static/js/components/UserForms.js': `/static/js/dist/UserForms.min.js?v=${VERSION}`,
    '/static/js/components/UserList.js': `/static/js/dist/UserList.min.js?v=${VERSION}`,
    '/static/js/components/UserManagementModal.js': `/static/js/dist/UserManagementModal.min.js?v=${VERSION}`,
    '/static/js/components/VoiceTicketFab.js': `/static/js/dist/VoiceTicketFab.min.js?v=${VERSION}`,
    '/static/js/components/MainApp.js': `/static/js/dist/MainApp.min.js?v=${VERSION}`,
    '/static/js/components/App.js': `/static/js/dist/App.min.js?v=${VERSION}`,
};

// Scripts critiques à preload (chargés en premier)
const CRITICAL_SCRIPTS = [
    `/static/js/dist/utils.min.js?v=${VERSION}`,
    `/static/js/dist/App.min.js?v=${VERSION}`,
    `/static/js/dist/LoginForm.min.js?v=${VERSION}`,
    `/static/js/dist/KanbanBoard.min.js?v=${VERSION}`,
    `/static/js/dist/AppHeader.min.js?v=${VERSION}`,
];

function main() {
    console.log('🔧 Génération de home.ts optimisé...\n');
    
    let content = fs.readFileSync(HOME_PATH, 'utf8');
    let replacements = 0;
    
    // Remplacer les scripts par leurs versions minifiées
    for (const [original, minified] of Object.entries(SCRIPT_MAPPINGS)) {
        // Match avec ou sans version query string
        const regex = new RegExp(
            original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\?v=[^"]*)?',
            'g'
        );
        
        if (content.match(regex)) {
            content = content.replace(regex, minified);
            replacements++;
        }
    }
    
    // Ajouter preload pour scripts critiques (après les meta tags)
    const preloadTags = CRITICAL_SCRIPTS.map(src => 
        `    <link rel="preload" href="${src}" as="script">`
    ).join('\n');
    
    // Insérer après la ligne du manifest
    content = content.replace(
        '<link rel="manifest" href="/manifest.json">',
        `<link rel="manifest" href="/manifest.json">\n    <!-- Preload critical scripts -->\n${preloadTags}`
    );
    
    // Sauvegarder
    fs.writeFileSync(HOME_PATH, content);
    
    console.log(`✅ ${replacements} scripts remplacés par versions minifiées`);
    console.log(`✅ ${CRITICAL_SCRIPTS.length} scripts critiques en preload`);
    console.log(`✅ Version cache: ${VERSION}`);
    console.log('\n📁 Fichier mis à jour: src/views/home.ts');
}

main();
