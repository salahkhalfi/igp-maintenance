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
 * @param isSuperAdmin - Si l'utilisateur est super administrateur (flag)
 * @returns Set de permissions au format "resource.action.scope"
 */
export async function loadRolePermissions(DB: D1Database, roleName: string, isSuperAdmin: boolean = false): Promise<Set<string>> {
  try {
    // 👑 SUPER ADMIN BYPASS: Le Super Admin (propriétaire) a toujours TOUTES les permissions
    if (isSuperAdmin) {
      try {
        const { results } = await DB.prepare('SELECT slug FROM permissions').all() as any;
        const permissions = new Set<string>();
        for (const perm of results) {
          permissions.add(perm.slug);
          const parts = perm.slug.split('.');
          if (parts.length === 2) {
            permissions.add(`${perm.slug}.all`);
          }
        }
        console.log(`[RBAC] Super Admin Bypass: Loaded ALL ${permissions.size} permissions for super admin (role: '${roleName}')`);
        return permissions;
      } catch (e) {
        console.error('[RBAC] Super Admin Bypass failed to load permissions:', e);
        // Fallback
      }
    }

    if (!DB || typeof DB.prepare !== 'function') {
      console.error('[PERMISSIONS] Invalid DB object passed to loadRolePermissions');
      return new Set();
    }

    const { results } = await DB.prepare(`
      SELECT p.slug
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN roles r ON rp.role_id = r.id
      WHERE r.slug = ?
    `).bind(roleName).all() as any;

    const permissions = new Set<string>();
    for (const perm of results) {
      // 1. Ajouter la permission brute (ex: "tickets.create")
      permissions.add(perm.slug);

      // 2. Gérer la portée implicite (ex: "tickets.create" -> "tickets.create.all")
      const parts = perm.slug.split('.');
      if (parts.length === 2) {
        permissions.add(`${perm.slug}.all`);
      }
    }

    console.log(`[RBAC] Loaded ${permissions.size} permissions for role '${roleName}'`);
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
 * @param isSuperAdmin - Si l'utilisateur est super administrateur
 * @returns true si l'utilisateur a la permission
 */
export async function hasPermission(
  DB: D1Database,
  userRole: string,
  resource: string,
  action: string,
  scope: string = 'all',
  isSuperAdmin: boolean = false
): Promise<boolean> {
  try {
    // 👑 SUPER ADMIN BYPASS: Le Super Admin a toujours accès
    if (isSuperAdmin) {
      return true;
    }

    // Vérifier le cache
    const now = Date.now();
    if (now - lastCacheUpdate > CACHE_TTL) {
      permissionsCache.clear();
      lastCacheUpdate = now;
    }

    // Charger depuis le cache ou la DB
    // Note: On utilise userRole comme clé de cache. Le Super Admin ne passe pas par ici.
    let rolePermissions = permissionsCache.get(userRole);
    if (!rolePermissions) {
      rolePermissions = await loadRolePermissions(DB, userRole, false);
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
 */
export async function hasAnyPermission(
  DB: D1Database,
  userRole: string,
  permissions: PermissionString[],
  isSuperAdmin: boolean = false
): Promise<boolean> {
  if (isSuperAdmin) return true;
  
  for (const perm of permissions) {
    const [resource, action, scope] = perm.split('.');
    if (await hasPermission(DB, userRole, resource, action, scope, isSuperAdmin)) {
      return true;
    }
  }
  return false;
}

/**
 * Vérifier si un utilisateur a TOUTES les permissions listées
 */
export async function hasAllPermissions(
  DB: D1Database,
  userRole: string,
  permissions: PermissionString[],
  isSuperAdmin: boolean = false
): Promise<boolean> {
  if (isSuperAdmin) return true;

  for (const perm of permissions) {
    const [resource, action, scope] = perm.split('.');
    if (!(await hasPermission(DB, userRole, resource, action, scope, isSuperAdmin))) {
      return false;
    }
  }
  return true;
}

/**
 * Récupérer toutes les permissions d'un rôle (pour le frontend)
 */
export async function getRolePermissions(DB: D1Database, roleName: string, isSuperAdmin: boolean = false): Promise<string[]> {
  const permissions = await loadRolePermissions(DB, roleName, isSuperAdmin);
  return Array.from(permissions);
}

/**
 * Synchroniser les permissions de l'administrateur avec les modules actifs
 * Cette fonction est appelée lorsqu'un Super Admin active des modules
 * @param DB - Instance D1 Database
 * @param activeModules - Liste des modules actifs (ex: ['planning', 'notifications'])
 */
export async function syncAdminPermissions(DB: D1Database, activeModules: string[]): Promise<void> {
  try {
    console.log('[RBAC] Syncing Admin permissions with active modules:', activeModules);

    // 1. Trouver l'ID du rôle 'admin'
    const adminRole = await DB.prepare('SELECT id FROM roles WHERE slug = ?').bind('admin').first() as any;
    
    if (!adminRole) {
      console.error('[RBAC] Admin role not found!');
      return;
    }

    // 2. Récupérer les IDs de toutes les permissions liées aux modules actifs
    // Note: La colonne 'module' dans la table permissions correspond au nom du module
    if (activeModules.length === 0) return;

    // Construire la clause IN dynamiquement
    const placeholders = activeModules.map(() => '?').join(',');
    const query = `SELECT id FROM permissions WHERE module IN (${placeholders})`;
    
    const { results } = await DB.prepare(query).bind(...activeModules).all() as any;
    
    if (!results || results.length === 0) {
      console.log('[RBAC] No permissions found for active modules');
      return;
    }

    console.log(`[RBAC] Found ${results.length} permissions to grant to Admin`);

    // 3. Insérer les permissions pour l'admin (INSERT OR IGNORE pour éviter les doublons)
    if (results.length > 0) {
      // D1 Batch limit is typically 128. We use a safe chunk size of 50.
      const CHUNK_SIZE = 50;
      for (let i = 0; i < results.length; i += CHUNK_SIZE) {
        const chunk = results.slice(i, i + CHUNK_SIZE);
        const statements = chunk.map((perm: any) => 
          DB.prepare(`
            INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
            VALUES (?, ?)
          `).bind(adminRole.id, perm.id)
        );
        await DB.batch(statements);
      }
    }

    // 4. Vider le cache pour que les changements soient immédiats
    clearPermissionsCache();
    
    console.log('[RBAC] Admin permissions synchronized successfully');
  } catch (error) {
    console.error('[RBAC] Error syncing admin permissions:', error);
  }
}

/**
 * Vider le cache des permissions (utile après modification des rôles)
 */
export function clearPermissionsCache(): void {
  permissionsCache.clear();
  lastCacheUpdate = 0;
}
