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
        r.slug,
        r.description,
        r.is_system,
        r.created_at,
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
    const { results: rawPermissions } = await c.env.DB.prepare(`
      SELECT
        p.id,
        p.name,
        p.slug,
        p.module,
        p.description
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
      ORDER BY p.module, p.slug
    `).bind(id).all();

    // Map permissions to expected format
    const permissions = rawPermissions.map((p: any) => {
      const parts = p.slug.split('.');
      const action = parts.length > 1 ? parts[1] : p.slug;
      const scope = parts.length > 2 ? parts[2] : 'all';

      return {
        id: p.id,
        resource: p.module,
        action: action,
        scope: scope,
        display_name: p.name,
        description: p.description,
        slug: p.slug
      };
    });

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
        name,
        slug,
        module,
        description
      FROM permissions
      ORDER BY module, slug
    `).all();

    // Map and Group
    const grouped: any = {};
    const mappedResults = results.map((p: any) => {
        const parts = p.slug.split('.');
        const action = parts.length > 1 ? parts[1] : p.slug;
        const scope = parts.length > 2 ? parts[2] : 'all';

        const mapped = {
            id: p.id,
            resource: p.module,
            action: action,
            scope: scope,
            display_name: p.name,
            description: p.description,
            slug: p.slug
        };

        if (!grouped[mapped.resource]) {
            grouped[mapped.resource] = [];
        }
        grouped[mapped.resource].push(mapped);

        return mapped;
    });

    return c.json({
      permissions: mappedResults,
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
    // Mapping: name (from frontend form) -> slug, display_name (from frontend form) -> name
    // The DB has: slug (technical), name (UI)
    const { slug, name, description, permission_ids } = body;

    // Fallback for old frontend requests sending 'name' as slug and 'display_name' as name
    const roleSlug = slug || body.name;
    const roleName = name || body.display_name;

    // Validation des champs requis
    if (!roleSlug || !roleName) {
      return c.json({ error: 'Slug et nom requis' }, 400);
    }

    // Validation du slug (identifiant technique)
    const trimmedSlug = roleSlug.trim();

    // 🔒 BLOCAGE CRÉATION RÔLES: Seuls les rôles système prédéfinis sont autorisés
    // L'application supporte 14 rôles système spécialement conçus pour l'industrie.
    // Ces rôles ont des permissions prédéfinies et testées.
    //
    // Raison du blocage:
    // - Le frontend contient 63 vérifications hardcodées sur les rôles
    // - Créer des rôles personnalisés causerait des dysfonctionnements UI
    // - Les 14 rôles système couvrent tous les besoins typiques industrie
    //
    // Voir: ROLES_INDUSTRIE_RECOMMANDES.md pour la liste complète
    const SYSTEM_ROLES = [
      'admin', 'supervisor', 'technician', 'operator',           // Rôles originaux
      'director', 'coordinator', 'planner', 'senior_technician',  // Management & Technique
      'team_leader', 'furnace_operator',                          // Production
      'safety_officer', 'quality_inspector', 'storekeeper',       // Support
      'viewer'                                                     // Lecture seule
    ];

    if (!SYSTEM_ROLES.includes(trimmedSlug)) {
      return c.json({
        error: 'Seuls les rôles système prédéfinis peuvent être créés',
        reason: 'Application avec rôles système spécialisés pour l\'industrie',
        details: 'Les 14 rôles système couvrent tous les besoins typiques. Les rôles personnalisés ne sont pas supportés pour éviter des dysfonctionnements UI.',
        documentation: 'Voir ROLES_INDUSTRIE_RECOMMANDES.md pour détails des rôles',
        system_roles: SYSTEM_ROLES,
        status: 'system_roles_only'
      }, 403);
    }
    if (trimmedSlug.length < LIMITS.NAME_MIN) {
      return c.json({ error: `Slug trop court (min ${LIMITS.NAME_MIN} caractères)` }, 400);
    }
    if (roleSlug.length > LIMITS.NAME_MAX) {
      return c.json({ error: `Slug trop long (max ${LIMITS.NAME_MAX} caractères)` }, 400);
    }
    // Le slug doit être un identifiant valide (lettres, chiffres, underscore, tiret)
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedSlug)) {
      return c.json({ error: 'Slug invalide. Utilisez uniquement des lettres, chiffres, tirets et underscores' }, 400);
    }

    // Validation du nom d'affichage
    const trimmedName = roleName.trim();
    if (trimmedName.length < LIMITS.NAME_MIN) {
      return c.json({ error: `Nom trop court (min ${LIMITS.NAME_MIN} caractères)` }, 400);
    }
    if (roleName.length > LIMITS.NAME_MAX) {
      return c.json({ error: `Nom trop long (max ${LIMITS.NAME_MAX} caractères)` }, 400);
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

    // Vérifier que le slug n'existe pas déjà
    const existing = await c.env.DB.prepare(
      'SELECT id FROM roles WHERE slug = ?'
    ).bind(trimmedSlug).first();

    if (existing) {
      return c.json({ error: 'Ce slug de rôle existe déjà' }, 409);
    }

    // Créer le rôle avec données nettoyées
    const result = await c.env.DB.prepare(`
      INSERT INTO roles (name, slug, description, is_system)
      VALUES (?, ?, ?, 0)
    `).bind(trimmedName, trimmedSlug, description ? description.trim() : null).run();

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
    // Mapping: name (from frontend form) -> slug, display_name (from frontend form) -> name
    const { slug, name, description, permission_ids } = body;

    const roleName = name || body.display_name;

    // Validation du nom d'affichage si fourni
    if (roleName) {
      const trimmedName = roleName.trim();
      if (trimmedName.length < LIMITS.NAME_MIN) {
        return c.json({ error: `Nom trop court (min ${LIMITS.NAME_MIN} caractères)` }, 400);
      }
      if (roleName.length > LIMITS.NAME_MAX) {
        return c.json({ error: `Nom trop long (max ${LIMITS.NAME_MAX} caractères)` }, 400);
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
    const trimmedName = roleName ? roleName.trim() : role.name;
    const trimmedDescription = description ? description.trim() : role.description;

    // Update: name (UI), description
    // slug cannot be changed
    await c.env.DB.prepare(`
      UPDATE roles
      SET name = ?, description = ?
      WHERE id = ?
    `).bind(trimmedName, trimmedDescription, id).run();

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
    // Check against 'slug' which is stored in users table
    const { results } = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM users WHERE role = ?'
    ).bind(role.slug).all() as any;

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