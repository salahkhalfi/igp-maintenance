/**
 * 🎭 RoleService - Centralized Role Management
 * 
 * SaaS-ready role service that reads from the existing `roles` table.
 * Uses the RBAC roles table which already exists with:
 *   - slug: System ID (admin, team_leader, chef_boulanger)
 *   - name: Display name with emoji ("👑 Administrateur", "Chef Boulanger")
 * 
 * Architecture:
 * - Database table `roles` is the source of truth (already exists!)
 * - In-memory cache with 5-minute TTL for performance
 * - Fallback to hardcoded defaults if DB unavailable
 * - Supports custom roles created by admins via existing /admin/roles UI
 */

// ============================================================================
// Types
// ============================================================================

export interface Role {
  id: number;
  slug: string;           // System ID: 'chef_boulanger'
  name: string;           // Display name: '👨‍🍳 Chef Boulanger'
  description: string | null;
  is_system: boolean;
}

// ============================================================================
// Default Roles (Fallback when DB unavailable)
// Matches existing data in production DB
// ============================================================================

const DEFAULT_ROLES: Role[] = [
  // Management
  { id: 1, slug: 'admin', name: '👑 Administrateur', description: 'Accès complet au système', is_system: true },
  { id: 2, slug: 'director', name: '📊 Directeur Général', description: 'Vision globale', is_system: true },
  { id: 3, slug: 'supervisor', name: '⭐ Superviseur', description: 'Gestion des équipes et tickets', is_system: true },
  { id: 4, slug: 'coordinator', name: '🎯 Coordonnateur', description: 'Planification et coordination des tâches', is_system: true },
  { id: 5, slug: 'planner', name: '📅 Planificateur', description: 'Gestion du calendrier et planification', is_system: true },
  // Technical
  { id: 6, slug: 'senior_technician', name: '🔧 Technicien Senior', description: 'Technicien expérimenté', is_system: true },
  { id: 7, slug: 'technician', name: '🔧 Technicien', description: 'Technicien de maintenance', is_system: true },
  // Production
  { id: 8, slug: 'team_leader', name: '👔 Chef d\'Équipe', description: 'Responsable d\'équipe', is_system: true },
  { id: 10, slug: 'operator', name: '👷 Opérateur', description: 'Opérateur de production', is_system: true },
  // Quality & Safety
  { id: 11, slug: 'safety_officer', name: '🛡️ Responsable Sécurité', description: 'Santé et Sécurité au Travail', is_system: true },
  { id: 12, slug: 'quality_inspector', name: '✓ Contrôle Qualité', description: 'Inspection et contrôle qualité', is_system: true },
  { id: 13, slug: 'storekeeper', name: '📦 Magasinier', description: 'Gestion des stocks et inventaire', is_system: true },
  // External
  { id: 14, slug: 'viewer', name: '👁️ Lecture Seule', description: 'Accès en lecture uniquement', is_system: true },
  { id: 15, slug: 'guest', name: '🔗 Invité Externe', description: 'Accès limité pour clients et partenaires', is_system: true },
];

// ============================================================================
// Cache
// ============================================================================

interface RoleCache {
  roles: Role[];
  rolesBySlug: Map<string, Role>;
  timestamp: number;
}

let cache: RoleCache | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isCacheValid(): boolean {
  if (!cache) return false;
  return Date.now() - cache.timestamp < CACHE_TTL_MS;
}

function buildCache(roles: Role[]): RoleCache {
  const rolesBySlug = new Map<string, Role>();
  for (const role of roles) {
    rolesBySlug.set(role.slug, role);
  }
  return {
    roles,
    rolesBySlug,
    timestamp: Date.now()
  };
}

// Build default cache immediately
const defaultCache = buildCache(DEFAULT_ROLES);

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Load all roles from database
 * Falls back to defaults if DB unavailable
 */
export async function loadRoles(db: D1Database): Promise<Role[]> {
  if (isCacheValid() && cache) {
    return cache.roles;
  }

  try {
    const result = await db.prepare(`
      SELECT id, slug, name, description, is_system
      FROM roles 
      ORDER BY id ASC
    `).all();

    if (result.results && result.results.length > 0) {
      const roles = result.results.map((r: any) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        description: r.description,
        is_system: Boolean(r.is_system)
      }));
      cache = buildCache(roles);
      return roles;
    }
  } catch (error) {
    console.warn('[RoleService] DB unavailable, using defaults:', error);
  }

  // Fallback to defaults
  return DEFAULT_ROLES;
}

/**
 * Get role display name (full version with emoji)
 * Synchronous - uses cache or defaults
 * 
 * @example
 * getRoleDisplayName('admin') => "👑 Administrateur"
 * getRoleDisplayName('team_leader') => "👔 Chef Équipe Production"
 */
export function getRoleDisplayName(roleSlug: string): string {
  if (!roleSlug) return '';
  
  const role = (cache?.rolesBySlug || defaultCache.rolesBySlug).get(roleSlug.toLowerCase());
  return role?.name || roleSlug;
}

/**
 * Get role display name WITHOUT emoji (for cleaner display)
 * 
 * @example
 * getRoleDisplayNameClean('admin') => "Administrateur"
 * getRoleDisplayNameClean('team_leader') => "Chef Équipe Production"
 */
export function getRoleDisplayNameClean(roleSlug: string): string {
  const name = getRoleDisplayName(roleSlug);
  // Remove leading emoji (handles various emoji types including compound emojis)
  return name.replace(/^[\p{Emoji}\p{Emoji_Component}\s]+/u, '').trim() || name;
}

/**
 * Get role display name (short version for badges)
 * Extracts first meaningful word after emoji
 */
export function getRoleDisplayNameShort(roleSlug: string): string {
  if (!roleSlug) return '';
  
  const name = getRoleDisplayNameClean(roleSlug);
  
  // For short names, take first word or abbreviate
  const words = name.split(' ');
  if (words.length === 1) return name;
  
  // Special cases for better abbreviations
  const shortMap: Record<string, string> = {
    'admin': 'Admin',
    'director': 'Directeur',
    'supervisor': 'Super.',
    'coordinator': 'Coord.',
    'planner': 'Plan.',
    'senior_technician': 'Tech. Sr',
    'technician': 'Tech.',
    'team_leader': 'Chef Éq.',
    'operator': 'Opér.',
    'safety_officer': 'Sécurité',
    'quality_inspector': 'Qualité',
    'storekeeper': 'Magasin',
    'viewer': 'Lecture',
    'guest': 'Invité',
  };
  
  return shortMap[roleSlug.toLowerCase()] || words[0];
}

/**
 * Get full role object by slug
 */
export function getRoleBySlug(roleSlug: string): Role | undefined {
  return (cache?.rolesBySlug || defaultCache.rolesBySlug).get(roleSlug.toLowerCase());
}

/**
 * Get all active roles (from cache or defaults)
 */
export function getAllRoles(): Role[] {
  return cache?.roles || DEFAULT_ROLES;
}

/**
 * Clear cache (call after role updates)
 */
export function clearRoleCache(): void {
  cache = null;
}

// ============================================================================
// Role ID Generation (for creating new roles)
// ============================================================================

/**
 * Generate a system-compatible role slug from display name
 * 
 * @example
 * generateRoleSlug("Chef Boulanger") => "chef_boulanger"
 * generateRoleSlug("Maître Pâtissier") => "maitre_patissier"
 * generateRoleSlug("Responsable R&D") => "responsable_r_d"
 */
export function generateRoleSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents: É → E
    .replace(/[^a-z0-9]+/g, '_')     // Replace non-alphanumeric with _
    .replace(/^_+|_+$/g, '')         // Trim leading/trailing underscores
    .replace(/_+/g, '_');            // Collapse multiple underscores
}

/**
 * Validate role slug format
 */
export function isValidRoleSlug(slug: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(slug);
}
