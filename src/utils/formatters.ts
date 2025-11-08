/**
 * 🎨 Utilitaires de Formatage
 * 
 * Ce fichier centralise TOUTES les fonctions de formatage utilisées dans l'application.
 * 
 * ✅ AVANTAGES:
 * - Une seule source de vérité pour chaque format
 * - Facile à tester
 * - Réutilisable partout
 * - Évite la duplication de code
 * - Cohérence garantie
 * 
 * ⚠️ IMPORTANT:
 * - Toujours utiliser ces fonctions au lieu de dupliquer la logique
 * - Si vous modifiez une fonction, tous les usages sont mis à jour automatiquement
 */

// ============================================================================
// 👤 FORMATAGE DES UTILISATEURS ET ASSIGNÉS
// ============================================================================

/**
 * Formate le nom de l'utilisateur assigné à un ticket
 * 
 * @param ticket - Le ticket avec assigned_to et assignee_name
 * @returns Texte formaté pour affichage
 * 
 * @example
 * formatAssigneeName({ assigned_to: null }) 
 * // => "⚠️ Non assigné"
 * 
 * formatAssigneeName({ assigned_to: 'all' }) 
 * // => "👥 Équipe complète"
 * 
 * formatAssigneeName({ assigned_to: 6, assignee_name: 'Brahim' }) 
 * // => "👤 Brahim"
 * 
 * formatAssigneeName({ assigned_to: 6, assignee_name: null }) 
 * // => "👤 Tech #6" (fallback)
 */
export function formatAssigneeName(ticket: any): string {
  // Cas 1: Pas d'assigné
  if (!ticket.assigned_to) {
    return '⚠️ Non assigné';
  }
  
  // Cas 2: Assigné à toute l'équipe
  if (ticket.assigned_to === 'all') {
    return '👥 Équipe complète';
  }
  
  // Cas 3: Assigné à un technicien spécifique
  // Utiliser assignee_name si disponible, sinon fallback sur ID
  return '👤 ' + (ticket.assignee_name || 'Tech #' + ticket.assigned_to);
}

/**
 * Version courte pour modal (sans emoji)
 */
export function formatAssigneeNameShort(ticket: any): string {
  if (!ticket.assigned_to) return 'Non assigné';
  if (ticket.assigned_to === 'all') return 'Toute équipe';
  return ticket.assignee_name || 'Technicien #' + ticket.assigned_to;
}

/**
 * Formate le nom du reporter (celui qui a créé la demande)
 */
export function formatReporterName(ticket: any): string {
  return ticket.reporter_name || 'N/A';
}

// ============================================================================
// 📅 FORMATAGE DES DATES
// ============================================================================

/**
 * Formate une date en français avec ou sans heure
 * 
 * @param dateStr - Date au format ISO ou SQL (YYYY-MM-DD HH:MM:SS)
 * @param includeTime - Inclure l'heure (défaut: true)
 * @returns Date formatée en français
 * 
 * @example
 * formatDate('2025-11-08 14:30:00', true)
 * // => "08 nov, 14:30"
 * 
 * formatDate('2025-11-08 14:30:00', false)
 * // => "08 nov"
 */
export function formatDate(dateStr: string, includeTime: boolean = true): string {
  if (!dateStr) return 'N/A';
  
  // Remplacer l'espace par T pour compatibilité ISO
  const date = new Date(dateStr.replace(' ', 'T'));
  
  if (isNaN(date.getTime())) {
    return 'Date invalide';
  }
  
  if (includeTime) {
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short'
  });
}

/**
 * Formate une date pour le badge de la bannière de planification
 * Format court: "08 nov"
 */
export function formatScheduledDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  
  const date = new Date(dateStr.replace(' ', 'T'));
  
  if (isNaN(date.getTime())) {
    return 'Invalid';
  }
  
  return date.toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: 'short'
  });
}

/**
 * Formate une date complète pour affichage détaillé
 * Format: "vendredi 8 novembre 2025 à 14:30"
 */
export function formatDateLong(dateStr: string): string {
  if (!dateStr) return 'N/A';
  
  const date = new Date(dateStr.replace(' ', 'T'));
  
  if (isNaN(date.getTime())) {
    return 'Date invalide';
  }
  
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calcule le temps relatif (il y a X minutes/heures/jours)
 */
export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return 'N/A';
  
  const date = new Date(dateStr.replace(' ', 'T'));
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  
  return formatDate(dateStr, false);
}

// ============================================================================
// 🎫 FORMATAGE DES TICKETS
// ============================================================================

/**
 * Formate le badge de priorité avec emoji et couleur
 * 
 * @returns Object avec text, className, et emoji
 */
export function formatPriorityBadge(priority: string): { text: string; className: string; emoji: string } {
  const priorities = {
    critical: { text: 'CRIT', className: 'bg-red-100 text-red-700', emoji: '🔴' },
    high: { text: 'HAUT', className: 'bg-amber-100 text-amber-700', emoji: '🟠' },
    medium: { text: 'MOY', className: 'bg-yellow-100 text-yellow-700', emoji: '🟡' },
    low: { text: 'BAS', className: 'bg-green-100 text-green-700', emoji: '🟢' }
  };
  
  return priorities[priority as keyof typeof priorities] || priorities.medium;
}

/**
 * Formate le texte de priorité complet
 */
export function formatPriorityText(priority: string): string {
  const priorities = {
    critical: '🔴 Critique',
    high: '🟠 Haute',
    medium: '🟡 Moyenne',
    low: '🟢 Basse'
  };
  
  return priorities[priority as keyof typeof priorities] || '🟡 Moyenne';
}

/**
 * Formate le statut du ticket en français
 */
export function formatStatus(status: string): string {
  const statuses = {
    received: 'Reçu',
    diagnostic: 'Diagnostic',
    in_progress: 'En cours',
    waiting_parts: 'Attente pièces',
    completed: 'Terminé',
    archived: 'Archivé'
  };
  
  return statuses[status as keyof typeof statuses] || status;
}

/**
 * Formate l'information de la machine
 */
export function formatMachineInfo(ticket: any): string {
  if (!ticket.machine_type) return 'N/A';
  
  return `${ticket.machine_type} ${ticket.model || ''}`.trim();
}

// ============================================================================
// 👥 FORMATAGE DES RÔLES
// ============================================================================

/**
 * Traduit un rôle technique en français
 * 
 * @example
 * formatRole('admin') => "Administrateur"
 * formatRole('team_leader') => "Chef d'Équipe de Production"
 */
export function formatRole(role: string): string {
  const roles: Record<string, string> = {
    admin: 'Administrateur',
    director: 'Directeur',
    supervisor: 'Superviseur',
    coordinator: 'Coordinateur',
    planner: 'Planificateur',
    senior_technician: 'Technicien Senior',
    technician: 'Technicien',
    team_leader: 'Chef d\'Équipe de Production',
    furnace_operator: 'Opérateur de Four',
    operator: 'Opérateur',
    safety_officer: 'Agent de Sécurité',
    quality_inspector: 'Inspecteur Qualité',
    storekeeper: 'Magasinier',
    viewer: 'Observateur'
  };
  
  return roles[role] || role;
}

/**
 * Version courte du rôle (pour badges)
 */
export function formatRoleShort(role: string): string {
  const roles: Record<string, string> = {
    admin: 'Admin',
    director: 'Directeur',
    supervisor: 'Super.',
    coordinator: 'Coord.',
    planner: 'Plan.',
    senior_technician: 'Tech. Sr',
    technician: 'Tech.',
    team_leader: 'Chef Éq.',
    furnace_operator: 'Op. Four',
    operator: 'Opér.',
    safety_officer: 'Sécurité',
    quality_inspector: 'Qualité',
    storekeeper: 'Magasin',
    viewer: 'Observ.'
  };
  
  return roles[role] || role;
}

// ============================================================================
// 🎨 FORMATAGE DES COULEURS ET STYLES
// ============================================================================

/**
 * Retourne la classe CSS pour une priorité
 */
export function getPriorityColorClass(priority: string): string {
  const colors: Record<string, string> = {
    critical: 'text-red-600 bg-red-50',
    high: 'text-amber-600 bg-amber-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-green-600 bg-green-50'
  };
  
  return colors[priority] || colors.medium;
}

/**
 * Retourne la classe CSS pour un statut
 */
export function getStatusColorClass(status: string): string {
  const colors: Record<string, string> = {
    received: 'text-blue-600 bg-blue-50',
    diagnostic: 'text-purple-600 bg-purple-50',
    in_progress: 'text-yellow-600 bg-yellow-50',
    waiting_parts: 'text-orange-600 bg-orange-50',
    completed: 'text-green-600 bg-green-50',
    archived: 'text-gray-600 bg-gray-50'
  };
  
  return colors[status] || colors.received;
}

// ============================================================================
// 📊 FORMATAGE DES NOMBRES
// ============================================================================

/**
 * Formate un nombre avec séparateurs de milliers
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('fr-FR');
}

/**
 * Formate une taille de fichier (bytes → KB/MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

/**
 * Formate une durée en secondes vers format lisible
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  if (mins === 0) return `${secs}s`;
  return `${mins}min ${secs}s`;
}

// ============================================================================
// 🔤 FORMATAGE DU TEXTE
// ============================================================================

/**
 * Tronque un texte à une longueur maximale
 */
export function truncate(text: string, maxLength: number = 100): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Capitalise la première lettre
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Formate un email pour affichage (masque partiellement)
 */
export function formatEmailPartial(email: string): string {
  if (!email) return 'N/A';
  
  const [local, domain] = email.split('@');
  if (local.length <= 3) return email;
  
  return local.substring(0, 3) + '***@' + domain;
}

// ============================================================================
// 📝 VALIDATION ET HELPERS
// ============================================================================

/**
 * Vérifie si une date est dans le passé
 */
export function isPast(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr.replace(' ', 'T'));
  return date.getTime() < Date.now();
}

/**
 * Vérifie si une date est aujourd'hui
 */
export function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr.replace(' ', 'T'));
  const today = new Date();
  
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

/**
 * Vérifie si une date est demain
 */
export function isTomorrow(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr.replace(' ', 'T'));
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return date.getDate() === tomorrow.getDate() &&
         date.getMonth() === tomorrow.getMonth() &&
         date.getFullYear() === tomorrow.getFullYear();
}
