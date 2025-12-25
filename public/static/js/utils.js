/**
 * Utilitaires de gestion des dates et du temps (Timezone EST/EDT)
 */

// FONCTION UTILITAIRE CENTRALE: Obtenir l'heure EST/EDT configurée
// Lit timezone_offset_hours depuis localStorage (-5 pour EST, -4 pour EDT)
// Cette fonction remplace tous les new Date() pour garantir que tout le monde voit la meme heure
const getNowEST = () => {
    const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
    const nowUTC = new Date();
    return new Date(nowUTC.getTime() + (offset * 60 * 60 * 1000));
};

// FONCTION UTILITAIRE: Vérifier si scheduled_date est valide
// D1 retourne parfois "null" comme string au lieu de null
const hasScheduledDate = (scheduledDate) => {
    return scheduledDate && scheduledDate !== 'null' && scheduledDate !== '';
};

// Fonction pour formater les dates en heure locale de l'appareil
// Format québécois: JJ-MM-AAAA HH:mm
const formatDateEST = (dateString, includeTime = true) => {
    if (!dateString) return '';
    // Convertir le format SQL en ISO pour parsing correct avec Z pour UTC
    const isoDateString = dateString.includes('T') ? dateString : dateString.replace(' ', 'T');
    // Ajouter Z pour forcer interpretation UTC
    const dateUTC = new Date(isoDateString + (isoDateString.includes('Z') ? '' : 'Z'));

    // Obtenir l'offset EST/EDT depuis localStorage
    const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
    // Appliquer le decalage pour obtenir l'heure EST/EDT
    const dateEST = new Date(dateUTC.getTime() + (offset * 60 * 60 * 1000));

    const day = String(dateEST.getUTCDate()).padStart(2, '0');
    // FIX: getUTCMonth is 0-indexed, so Jan = 0. +1 is correct.
    const month = String(dateEST.getUTCMonth() + 1).padStart(2, '0');
    const year = dateEST.getUTCFullYear();

    if (includeTime) {
        const hours = String(dateEST.getUTCHours()).padStart(2, '0');
        const minutes = String(dateEST.getUTCMinutes()).padStart(2, '0');
        return day + '-' + month + '-' + year + ' ' + hours + ':' + minutes;
    }

    return day + '-' + month + '-' + year;
};

/**
 * Convertir datetime-local (format: "2025-11-15T14:30") vers UTC SQL
 * @param {string} localDateTime - Format: "YYYY-MM-DDTHH:MM" (heure locale saisie)
 * @returns {string} Format SQL: "YYYY-MM-DD HH:MM:SS" (en UTC)
 */
const localDateTimeToUTC = (localDateTime) => {
    if (!localDateTime) return null;

    // localDateTime = "2025-11-15T14:30"
    // IMPORTANT: Parser manuellement pour éviter interprétation du fuseau navigateur
    const parts = localDateTime.split('T');
    const dateParts = parts[0].split('-');
    const timeParts = parts[1].split(':');

    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // Mois commence à 0
    const day = parseInt(dateParts[2]);
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);

    // Créer une date UTC avec ces valeurs (sans interprétation timezone)
    const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');

    // Calculer l'heure UTC en soustrayant l'offset
    // offset = -5 signifie "UTC-5", donc pour convertir local → UTC: UTC = local - offset
    // Exemple: 14:30 local avec offset -5 → UTC = 14:30 - (-5) = 14:30 + 5 = 19:30
    const utcHours = hours - offset;

    // Créer la date UTC directement
    const utcDate = new Date(Date.UTC(year, month, day, utcHours, minutes, 0));

    // Format SQL: YYYY-MM-DD HH:MM:SS
    const utcYear = utcDate.getUTCFullYear();
    const utcMonth = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
    const utcDay = String(utcDate.getUTCDate()).padStart(2, '0');
    const utcHoursStr = String(utcDate.getUTCHours()).padStart(2, '0');
    const utcMinutes = String(utcDate.getUTCMinutes()).padStart(2, '0');
    const seconds = '00';

    return utcYear + '-' + utcMonth + '-' + utcDay + ' ' + utcHoursStr + ':' + utcMinutes + ':' + seconds;
};

/**
 * Convertir UTC SQL vers datetime-local (format: "2025-11-15T14:30")
 * @param {string} sqlDateTime - Format: "YYYY-MM-DD HH:MM:SS" (en UTC)
 * @returns {string} Format datetime-local: "YYYY-MM-DDTHH:MM" (heure locale)
 */
const utcToLocalDateTime = (sqlDateTime) => {
    if (!sqlDateTime || sqlDateTime === 'null' || sqlDateTime === '') return '';

    // sqlDateTime = "2025-11-15 19:30:00" (UTC)
    const utcDateStr = sqlDateTime.replace(' ', 'T') + 'Z'; // "2025-11-15T19:30:00Z"
    const utcDate = new Date(utcDateStr);

    // Appliquer l'offset pour obtenir l'heure locale
    // offset = -5 signifie "UTC-5", donc pour convertir UTC → local: local = UTC + offset
    // Exemple: 19:30 UTC avec offset -5 → local = 19:30 + (-5) = 14:30
    const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
    const localDate = new Date(utcDate.getTime() + (offset * 60 * 60 * 1000));

    // Format datetime-local: YYYY-MM-DDTHH:MM (utiliser UTC methods car on a déjà appliqué l'offset)
    const year = localDate.getUTCFullYear();
    const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(localDate.getUTCDate()).padStart(2, '0');
    const hours = String(localDate.getUTCHours()).padStart(2, '0');
    const minutes = String(localDate.getUTCMinutes()).padStart(2, '0');

    return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
};

/**
 * Convertir une date SQL UTC vers un objet Date JavaScript
 * @param {string} sqlDateTime - Format: "YYYY-MM-DD HH:MM:SS" (UTC dans la DB)
 * @returns {Date} Objet Date parsé en UTC
 */
const parseUTCDate = (sqlDateTime) => {
    if (!sqlDateTime || sqlDateTime === 'null' || sqlDateTime === '') return null;
    
    // Convertir "YYYY-MM-DD HH:MM:SS" → "YYYY-MM-DDTHH:MM:SSZ"
    const isoFormat = sqlDateTime.replace(' ', 'T');
    const utcFormat = isoFormat + (isoFormat.includes('Z') ? '' : 'Z');
    return new Date(utcFormat);
};

/**
 * Obtenir le libellé d'un statut
 */
const getStatusLabel = (status) => {
    const statusLabels = {
        'received': 'Requête Reçue',
        'diagnostic': 'Diagnostic',
        'in_progress': 'En Cours',
        'waiting_parts': 'En Attente Pièces',
        'private': '🔒 Privé',
        'completed': 'Terminé',
        'archived': 'Archivé'
    };
    return statusLabels[status] || status;
};

/**
 * Fonction pour calculer le temps écoulé depuis la création
 * Retourne un objet {days, hours, minutes, seconds, color, bgColor}
 */
const getElapsedTime = (createdAt) => {
    const now = getNowEST();
    // Convertir le format SQL "YYYY-MM-DD HH:MM:SS" en format ISO "YYYY-MM-DDTHH:MM:SS"
    // Si la date contient déjà un T, on ne touche pas
    const isoCreatedAt = createdAt.includes('T') ? createdAt : createdAt.replace(' ', 'T');
    // Ajouter Z pour forcer interpretation UTC
    const createdUTC = new Date(isoCreatedAt + (isoCreatedAt.includes('Z') ? '' : 'Z'));
    // Appliquer l'offset EST/EDT
    const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');
    const created = new Date(createdUTC.getTime() + (offset * 60 * 60 * 1000));

    // Si la date est invalide, retourner 0
    if (isNaN(created.getTime())) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, color: 'text-gray-500', bgColor: 'bg-gray-50', icon: '⚪' };
    }

    const diffMs = now - created;

    // Si diffMs est négatif (date future), retourner 0
    if (diffMs < 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, color: 'text-gray-500', bgColor: 'bg-gray-50', icon: '⚪' };
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    // Déterminer la couleur et le fond selon l'urgence
    let color = 'text-green-700';
    let bgColor = 'bg-green-50 border-green-200';
    let icon = '🟢';

    if (days >= 7) {
        color = 'text-red-700 font-bold';
        bgColor = 'bg-red-50 border-red-300';
        icon = '🔴';
    } else if (days >= 3) {
        color = 'text-amber-700 font-semibold';
        bgColor = 'bg-amber-50 border-amber-200';
        icon = '🟠';
    } else if (days >= 1) {
        color = 'text-yellow-700';
        bgColor = 'bg-yellow-50 border-yellow-200';
        icon = '🟡';
    }

    return { days, hours, minutes, seconds, color, bgColor, icon };
};

/**
 * Formater le texte du chronomètre avec secondes
 */
const formatElapsedTime = (elapsed) => {
    if (elapsed.days > 0) {
        return elapsed.days + 'j ' + String(elapsed.hours).padStart(2, '0') + ':' + String(elapsed.minutes).padStart(2, '0');
    } else if (elapsed.hours > 0) {
        return elapsed.hours + 'h ' + String(elapsed.minutes).padStart(2, '0') + ':' + String(elapsed.seconds).padStart(2, '0');
    } else if (elapsed.minutes > 0) {
        return elapsed.minutes + 'min ' + String(elapsed.seconds).padStart(2, '0') + 's';
    } else {
        return elapsed.seconds + 's';
    }
};

// Constantes globales
const API_URL = '/api';
const DEFAULT_COMPANY_TITLE = 'Gestion de la maintenance et des réparations';
const DEFAULT_COMPANY_SUBTITLE = 'Les Produits Verriers International (IGP) Inc.';

/**
 * ============================================
 * SYSTÈME DE NIVEAUX D'ACCÈS (RBAC Simplifié)
 * ============================================
 * 
 * Niveau 4 - SUPER : Accès multi-tenant, gestion modules (support SaaS)
 * Niveau 3 - ADMIN : Configuration complète de son installation
 * Niveau 2 - MANAGER : Gestion équipe, tickets, planning
 * Niveau 1 - WORKER : Ses tickets, consultation
 * Niveau 0 - VIEWER : Lecture seule
 * 
 * IMPORTANT: Ce mapping peut être ajusté sans migration de données.
 * Les rôles existants dans la DB restent inchangés.
 */
const ROLE_LEVELS = {
    // Niveau 4 - Super (SaaS/Support)
    'super_admin': 4,
    'support': 4,
    
    // Niveau 3 - Admin (Client)
    'admin': 3,
    'owner': 3,
    'director': 3,
    
    // Niveau 2 - Manager
    'supervisor': 2,
    'coordinator': 2,
    'planner': 2,
    'foreman': 2,
    'team_leader': 2,
    
    // Niveau 1 - Worker
    'technician': 1,
    'senior_technician': 1,
    'operator': 1,
    'furnace_operator': 1,
    'inspector': 1,
    'quality_inspector': 1,
    'storekeeper': 1,
    'safety_officer': 1,
    
    // Niveau 0 - Viewer
    'viewer': 0,
    'guest': 0,
    'auditor': 0,
    'client': 0
};

/**
 * Obtenir le niveau d'accès d'un rôle
 * @param {string} role - Le slug du rôle (ex: 'admin', 'technician')
 * @returns {number} Niveau 0-4
 */
const getUserLevel = (role) => {
    if (!role) return 0;
    return ROLE_LEVELS[role.toLowerCase()] ?? 0;
};

/**
 * Vérifier si un rôle a le niveau minimum requis
 * @param {string} role - Le slug du rôle
 * @param {number} minLevel - Niveau minimum requis (0-4)
 * @returns {boolean}
 */
const canAccess = (role, minLevel) => {
    return getUserLevel(role) >= minLevel;
};

/**
 * Vérifier si un rôle est admin ou plus
 * Remplace: role === 'admin'
 */
const isAdminOrAbove = (role) => canAccess(role, 3);

/**
 * Vérifier si un rôle est manager ou plus
 * Remplace: role === 'admin' || role === 'supervisor'
 */
const isManagerOrAbove = (role) => canAccess(role, 2);

/**
 * Vérifier si un rôle est worker ou plus (pas viewer/guest)
 */
const isWorkerOrAbove = (role) => canAccess(role, 1);

/**
 * Obtenir le libellé français du niveau
 */
const getLevelLabel = (level) => {
    const labels = {
        4: 'Super Admin',
        3: 'Administrateur',
        2: 'Gestionnaire',
        1: 'Employé',
        0: 'Consultation'
    };
    return labels[level] ?? 'Inconnu';
};

// Debug: Log pour vérification (à retirer en production)
console.log('[RBAC] Système de niveaux chargé. Fonctions disponibles: getUserLevel(), canAccess(), isAdminOrAbove(), isManagerOrAbove()');
