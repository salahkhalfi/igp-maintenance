// Routes pour la gestion des rôles et permissions (Admin uniquement)

import { Hono } from 'hono';
import { clearPermissionsCache } from '../utils/permissions';
import type { Bindings } from '../types';
import { LIMITS } from '../utils/validation';

const roles = new Hono<{ Bindings: Bindings }>();

/**
 * GET /api/roles - Liste tous les rôles
 */
roles.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        r.id,
        r.name,
        r.display_name,
        r.description,
        r.is_system,
        r.created_at,
        r.updated_at,
        COUNT(rp.permission_id) as permissions_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id
      ORDER BY r.is_system DESC, r.name ASC
    `).all();

    return c.json({ roles: results });
  } catch (error) {
    console.error('Get roles error:', error);
    return c.json({ error: 'Erreur lors de la récupération des rôles' }, 500);
  }
});

/**
 * GET /api/roles/:id - Détails d'un rôle avec ses permissions
 */
roles.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // Récupérer le rôle
    const role = await c.env.DB.prepare(`
      SELECT * FROM roles WHERE id = ?
    `).bind(id).first() as any;

    if (!role) {
      return c.json({ error: 'Rôle non trouvé' }, 404);
    }

    // Récupérer les permissions du rôle
    const { results: permissions } = await c.env.DB.prepare(`
      SELECT 
        p.id,
        p.resource,
        p.action,
        p.scope,
        p.display_name,
        p.description
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
      ORDER BY p.resource, p.action, p.scope
    `).bind(id).all();

    return c.json({ 
      role: {
        ...role,
        permissions
      }
    });
  } catch (error) {
    console.error('Get role error:', error);
    return c.json({ error: 'Erreur lors de la récupération du rôle' }, 500);
  }
});

/**
 * GET /api/roles/permissions/all - Liste toutes les permissions disponibles
 */
roles.get('/permissions/all', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        id,
        resource,
        action,
        scope,
        display_name,
        description
      FROM permissions
      ORDER BY resource, action, scope
    `).all();

    // Grouper par ressource pour une meilleure organisation
    const grouped: any = {};
    for (const perm of results) {
      const p = perm as any;
      if (!grouped[p.resource]) {
        grouped[p.resource] = [];
      }
      grouped[p.resource].push(p);
    }

    return c.json({ 
      permissions: results,
      grouped
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    return c.json({ error: 'Erreur lors de la récupération des permissions' }, 500);
  }
});

/**
 * POST /api/roles - Créer un nouveau rôle personnalisé
 */
roles.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { name, display_name, description, permission_ids } = body;

    // Validation des champs requis
    if (!name || !display_name) {
      return c.json({ error: 'Nom et nom d affichage requis' }, 400);
    }

    // Validation du nom (identifiant technique)
    const trimmedName = name.trim();
    
    // 🚧 BLOCAGE TEMPORAIRE: Protection pendant migration RBAC frontend
    // Le frontend contient 63 vérifications hardcodées sur les rôles existants.
    // La création de nouveaux rôles causerait des dysfonctionnements (boutons invisibles, sections bloquées).
    // Voir: ROLE_SYSTEM_SAFETY_ANALYSIS.md et ROLE_MIGRATION_GUIDE.md
    // 
    // Pour activer les nouveaux rôles:
    // 1. Compléter la migration frontend (hooks usePermission)
    // 2. Supprimer ce bloc de code
    // 3. Tester avec un rôle test avant production
    const ALLOWED_ROLES = ['admin', 'supervisor', 'technician', 'operator'];
    if (!ALLOWED_ROLES.includes(trimmedName)) {
      return c.json({ 
        error: 'Création de nouveaux rôles temporairement désactivée',
        reason: 'Migration du système de permissions en cours',
        details: 'Le frontend vérifie actuellement des rôles hardcodés. La création de nouveaux rôles causerait des dysfonctionnements.',
        documentation: 'Voir ROLE_SYSTEM_SAFETY_ANALYSIS.md pour plus de détails',
        allowed_roles: ALLOWED_ROLES,
        status: 'temporary_restriction'
      }, 403);
    }
    if (trimmedName.length < LIMITS.NAME_MIN) {
      return c.json({ error: `Nom trop court (min ${LIMITS.NAME_MIN} caractères)` }, 400);
    }
    if (name.length > LIMITS.NAME_MAX) {
      return c.json({ error: `Nom trop long (max ${LIMITS.NAME_MAX} caractères)` }, 400);
    }
    // Le nom doit être un identifiant valide (lettres, chiffres, underscore, tiret)
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedName)) {
      return c.json({ error: 'Nom invalide. Utilisez uniquement des lettres, chiffres, tirets et underscores' }, 400);
    }

    // Validation du nom d'affichage
    const trimmedDisplayName = display_name.trim();
    if (trimmedDisplayName.length < LIMITS.NAME_MIN) {
      return c.json({ error: `Nom d'affichage trop court (min ${LIMITS.NAME_MIN} caractères)` }, 400);
    }
    if (display_name.length > LIMITS.NAME_MAX) {
      return c.json({ error: `Nom d'affichage trop long (max ${LIMITS.NAME_MAX} caractères)` }, 400);
    }

    // Validation de la description si fournie
    if (description && description.length > LIMITS.DESCRIPTION_MAX) {
      return c.json({ error: `Description trop longue (max ${LIMITS.DESCRIPTION_MAX} caractères)` }, 400);
    }

    // Validation des IDs de permissions
    if (permission_ids && !Array.isArray(permission_ids)) {
      return c.json({ error: 'permission_ids doit être un tableau' }, 400);
    }
    if (permission_ids && permission_ids.some((id: any) => typeof id !== 'number' || id <= 0)) {
      return c.json({ error: 'IDs de permissions invalides' }, 400);
    }

    // Vérifier que le nom n'existe pas déjà
    const existing = await c.env.DB.prepare(
      'SELECT id FROM roles WHERE name = ?'
    ).bind(trimmedName).first();

    if (existing) {
      return c.json({ error: 'Ce nom de rôle existe déjà' }, 409);
    }

    // Créer le rôle avec données nettoyées
    const result = await c.env.DB.prepare(`
      INSERT INTO roles (name, display_name, description, is_system)
      VALUES (?, ?, ?, 0)
    `).bind(trimmedName, trimmedDisplayName, description ? description.trim() : null).run();

    if (!result.success) {
      return c.json({ error: 'Erreur lors de la création du rôle' }, 500);
    }

    const roleId = result.meta.last_row_id;

    // Attribuer les permissions
    if (permission_ids && Array.isArray(permission_ids) && permission_ids.length > 0) {
      for (const permId of permission_ids) {
        await c.env.DB.prepare(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES (?, ?)
        `).bind(roleId, permId).run();
      }
    }

    // Vider le cache des permissions
    clearPermissionsCache();

    // Récupérer le rôle créé avec ses permissions
    const newRole = await c.env.DB.prepare(`
      SELECT * FROM roles WHERE id = ?
    `).bind(roleId).first();

    return c.json({ 
      message: 'Rôle créé avec succès',
      role: newRole
    }, 201);
  } catch (error) {
    console.error('Create role error:', error);
    return c.json({ error: 'Erreur lors de la création du rôle' }, 500);
  }
});

/**
 * PUT /api/roles/:id - Modifier un rôle
 */
roles.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { display_name, description, permission_ids } = body;

    // Validation du nom d'affichage si fourni
    if (display_name) {
      const trimmedDisplayName = display_name.trim();
      if (trimmedDisplayName.length < LIMITS.NAME_MIN) {
        return c.json({ error: `Nom d'affichage trop court (min ${LIMITS.NAME_MIN} caractères)` }, 400);
      }
      if (display_name.length > LIMITS.NAME_MAX) {
        return c.json({ error: `Nom d'affichage trop long (max ${LIMITS.NAME_MAX} caractères)` }, 400);
      }
    }

    // Validation de la description si fournie
    if (description && description.length > LIMITS.DESCRIPTION_MAX) {
      return c.json({ error: `Description trop longue (max ${LIMITS.DESCRIPTION_MAX} caractères)` }, 400);
    }

    // Validation des IDs de permissions si fournis
    if (permission_ids && !Array.isArray(permission_ids)) {
      return c.json({ error: 'permission_ids doit être un tableau' }, 400);
    }
    if (permission_ids && permission_ids.some((id: any) => typeof id !== 'number' || id <= 0)) {
      return c.json({ error: 'IDs de permissions invalides' }, 400);
    }

    // Vérifier que le rôle existe
    const role = await c.env.DB.prepare(
      'SELECT * FROM roles WHERE id = ?'
    ).bind(id).first() as any;

    if (!role) {
      return c.json({ error: 'Rôle non trouvé' }, 404);
    }

    // Empêcher la modification des rôles système (nom et description seulement)
    const trimmedDisplayName = display_name ? display_name.trim() : role.display_name;
    const trimmedDescription = description ? description.trim() : role.description;
    
    if (role.is_system === 1) {
      // Seul display_name et description peuvent être modifiés pour les rôles système
      await c.env.DB.prepare(`
        UPDATE roles 
        SET display_name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(trimmedDisplayName, trimmedDescription, id).run();
    } else {
      // Rôle personnalisé: tout peut être modifié
      await c.env.DB.prepare(`
        UPDATE roles 
        SET display_name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(trimmedDisplayName, trimmedDescription, id).run();
    }

    // Mettre à jour les permissions
    if (permission_ids && Array.isArray(permission_ids)) {
      // Supprimer toutes les permissions actuelles
      await c.env.DB.prepare(`
        DELETE FROM role_permissions WHERE role_id = ?
      `).bind(id).run();

      // Ajouter les nouvelles permissions
      for (const permId of permission_ids) {
        await c.env.DB.prepare(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES (?, ?)
        `).bind(id, permId).run();
      }
    }

    // Vider le cache des permissions
    clearPermissionsCache();

    // Récupérer le rôle mis à jour
    const updatedRole = await c.env.DB.prepare(`
      SELECT * FROM roles WHERE id = ?
    `).bind(id).first();

    return c.json({ 
      message: 'Rôle mis à jour avec succès',
      role: updatedRole
    });
  } catch (error) {
    console.error('Update role error:', error);
    return c.json({ error: 'Erreur lors de la mise à jour du rôle' }, 500);
  }
});

/**
 * DELETE /api/roles/:id - Supprimer un rôle personnalisé
 */
roles.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // Vérifier que le rôle existe
    const role = await c.env.DB.prepare(
      'SELECT * FROM roles WHERE id = ?'
    ).bind(id).first() as any;

    if (!role) {
      return c.json({ error: 'Rôle non trouvé' }, 404);
    }

    // Empêcher la suppression des rôles système
    if (role.is_system === 1) {
      return c.json({ 
        error: 'Impossible de supprimer un rôle système' 
      }, 403);
    }

    // Vérifier si des utilisateurs utilisent ce rôle
    const { results } = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM users WHERE role = ?'
    ).bind(role.name).all() as any;

    if (results[0] && results[0].count > 0) {
      return c.json({ 
        error: `Impossible de supprimer ce rôle car ${results[0].count} utilisateur(s) l'utilisent` 
      }, 400);
    }

    // Supprimer le rôle (CASCADE supprime les role_permissions)
    await c.env.DB.prepare(
      'DELETE FROM roles WHERE id = ?'
    ).bind(id).run();

    // Vider le cache des permissions
    clearPermissionsCache();

    return c.json({ 
      message: 'Rôle supprimé avec succès',
      deleted_role: role
    });
  } catch (error) {
    console.error('Delete role error:', error);
    return c.json({ error: 'Erreur lors de la suppression du rôle' }, 500);
  }
});

export default roles;
