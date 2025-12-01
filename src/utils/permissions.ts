// Utilitaires pour le système RBAC (Role-Based Access Control)

import type { Bindings } from '../types';

/**
 * Format des permissions: resource.action.scope
 * Exemples:
 * - tickets.create.all
 * - tickets.delete.own
 * - users.update.all
 */
export type PermissionString = string;

/**
 * Cache des permissions par rôle (pour optimiser les performances)
 * Structure: { role_name: Set<permission_string> }
 */
const permissionsCache = new Map<string, Set<string>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let lastCacheUpdate = 0;

/**
 * Charger toutes les permissions d'un rôle depuis la base de données
 * @param DB - Instance D1 Database
 * @param roleName - Nom du rôle (admin, supervisor, etc.)
 * @returns Set de permissions au format "resource.action.scope"
 */
export async function loadRolePermissions(DB: D1Database, roleName: string): Promise<Set<string>> {
  try {
    const { results } = await DB.prepare(`
      SELECT p.slug
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN roles r ON rp.role_id = r.id
      WHERE r.slug = ?
    `).bind(roleName).all() as any;

    const permissions = new Set<string>();
    for (const perm of results) {
      // Le slug est déjà au format "resource.action" ou "resource.action.scope"
      // Si le scope est manquant, on suppose "all" par défaut pour la compatibilité
      const parts = perm.slug.split('.');
      if (parts.length === 2) {
        permissions.add(`${perm.slug}.all`);
      } else {
        permissions.add(perm.slug);
      }
    }

    return permissions;
  } catch (error) {
    console.error(`Error loading permissions for role ${roleName}:`, error);
    return new Set();
  }
}

/**
 * Vérifier si un utilisateur a une permission spécifique
 * @param DB - Instance D1 Database
 * @param userRole - Rôle de l'utilisateur
 * @param resource - Ressource (tickets, machines, users, etc.)
 * @param action - Action (create, read, update, delete, etc.)
 * @param scope - Portée (all, own, team, etc.)
 * @returns true si l'utilisateur a la permission
 */
export async function hasPermission(
  DB: D1Database,
  userRole: string,
  resource: string,
  action: string,
  scope: string = 'all'
): Promise<boolean> {
  try {
    // Vérifier le cache
    const now = Date.now();
    if (now - lastCacheUpdate > CACHE_TTL) {
      permissionsCache.clear();
      lastCacheUpdate = now;
    }

    // Charger depuis le cache ou la DB
    let rolePermissions = permissionsCache.get(userRole);
    if (!rolePermissions) {
      rolePermissions = await loadRolePermissions(DB, userRole);
      permissionsCache.set(userRole, rolePermissions);
    }

    // Vérifier la permission exacte
    const exactPermission = `${resource}.${action}.${scope}`;
    if (rolePermissions.has(exactPermission)) {
      return true;
    }

    // Vérifier si le rôle a la permission "all" qui inclut "own"
    if (scope === 'own') {
      const allPermission = `${resource}.${action}.all`;
      if (rolePermissions.has(allPermission)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Vérifier si un utilisateur a AU MOINS UNE des permissions listées
 * @param DB - Instance D1 Database
 * @param userRole - Rôle de l'utilisateur
 * @param permissions - Liste de permissions au format "resource.action.scope"
 * @returns true si l'utilisateur a au moins une permission
 */
export async function hasAnyPermission(
  DB: D1Database,
  userRole: string,
  permissions: PermissionString[]
): Promise<boolean> {
  for (const perm of permissions) {
    const [resource, action, scope] = perm.split('.');
    if (await hasPermission(DB, userRole, resource, action, scope)) {
      return true;
    }
  }
  return false;
}

/**
 * Vérifier si un utilisateur a TOUTES les permissions listées
 * @param DB - Instance D1 Database
 * @param userRole - Rôle de l'utilisateur
 * @param permissions - Liste de permissions au format "resource.action.scope"
 * @returns true si l'utilisateur a toutes les permissions
 */
export async function hasAllPermissions(
  DB: D1Database,
  userRole: string,
  permissions: PermissionString[]
): Promise<boolean> {
  for (const perm of permissions) {
    const [resource, action, scope] = perm.split('.');
    if (!(await hasPermission(DB, userRole, resource, action, scope))) {
      return false;
    }
  }
  return true;
}

/**
 * Récupérer toutes les permissions d'un rôle
 * @param DB - Instance D1 Database
 * @param roleName - Nom du rôle
 * @returns Tableau de permissions au format "resource.action.scope"
 */
export async function getRolePermissions(DB: D1Database, roleName: string): Promise<string[]> {
  const permissions = await loadRolePermissions(DB, roleName);
  return Array.from(permissions);
}

/**
 * Vider le cache des permissions (utile après modification des rôles)
 */
export function clearPermissionsCache(): void {
  permissionsCache.clear();
  lastCacheUpdate = 0;
}
