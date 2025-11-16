/**
 * Hook pour obtenir l'affichage d'un rôle (icône, label, couleur)
 * Compatible avec les nouveaux rôles personnalisés via fallback
 */

export interface RoleDisplayConfig {
  icon: string;
  label: string;
  labelShort: string;
  color: string;
  description: string;
}

/**
 * Configuration d'affichage pour les rôles système
 */
const ROLE_DISPLAY_CONFIG: Record<string, RoleDisplayConfig> = {
  admin: {
    icon: '👑',
    label: 'Administrateur',
    labelShort: 'Admin',
    color: 'bg-red-100 text-red-800',
    description: 'Accès complet - Peut tout faire'
  },
  supervisor: {
    icon: '⭐',
    label: 'Superviseur',
    labelShort: 'Superviseur',
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Gestion complète sauf rôles/permissions'
  },
  technician: {
    icon: '🔧',
    label: 'Technicien',
    labelShort: 'Technicien',
    color: 'bg-blue-100 text-blue-800',
    description: 'Gestion tickets + lecture'
  },
  operator: {
    icon: '👤',
    label: 'Opérateur',
    labelShort: 'Opérateur',
    color: 'bg-gray-100 text-gray-800',
    description: 'Tickets propres uniquement'
  },
  // Fallback pour les rôles personnalisés
  default: {
    icon: '👤',
    label: 'Utilisateur',
    labelShort: 'User',
    color: 'bg-purple-100 text-purple-800',
    description: 'Rôle personnalisé'
  }
};

/**
 * Hook pour obtenir la configuration d'affichage d'un rôle
 * @param role - Nom du rôle (admin, supervisor, technician, operator, ou personnalisé)
 * @returns Configuration d'affichage du rôle
 *
 * @example
 * const roleDisplay = useRoleDisplay(currentUser.role);
 * return <span className={roleDisplay.color}>
 *   {roleDisplay.icon} {roleDisplay.labelShort}
 * </span>
 */
export function useRoleDisplay(role: string): RoleDisplayConfig {
  return ROLE_DISPLAY_CONFIG[role] || ROLE_DISPLAY_CONFIG.default;
}

/**
 * Fonction helper pour obtenir uniquement l'icône d'un rôle
 * @param role - Nom du rôle
 * @returns Icône emoji du rôle
 */
export function getRoleIcon(role: string): string {
  const config = ROLE_DISPLAY_CONFIG[role] || ROLE_DISPLAY_CONFIG.default;
  return config.icon;
}

/**
 * Fonction helper pour obtenir uniquement la couleur d'un rôle
 * @param role - Nom du rôle
 * @returns Classes Tailwind pour le badge
 */
export function getRoleColor(role: string): string {
  const config = ROLE_DISPLAY_CONFIG[role] || ROLE_DISPLAY_CONFIG.default;
  return config.color;
}

/**
 * Fonction helper pour obtenir uniquement le label d'un rôle
 * @param role - Nom du rôle
 * @param short - Utiliser le label court ou complet
 * @returns Label du rôle
 */
export function getRoleLabel(role: string, short: boolean = false): string {
  const config = ROLE_DISPLAY_CONFIG[role] || ROLE_DISPLAY_CONFIG.default;
  return short ? config.labelShort : config.label;
}
