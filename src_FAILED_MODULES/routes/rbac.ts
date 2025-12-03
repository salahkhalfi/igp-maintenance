// Routes RBAC - Test et vérification des permissions

import { Hono } from 'hono';
import { authMiddleware, requirePermission, requireAnyPermission } from '../middlewares/auth';
import { hasPermission, getRolePermissions } from '../utils/permissions';
import type { Bindings } from '../types';

const rbac = new Hono<{ Bindings: Bindings }>();

// Route de test RBAC (accessible à tous les utilisateurs authentifiés)
rbac.get('/test', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;

    // Récupérer toutes les permissions du rôle de l'utilisateur
    const userPermissions = await getRolePermissions(c.env.DB, user.role);

    // Tester quelques permissions spécifiques
    const tests = {
      canCreateTickets: await hasPermission(c.env.DB, user.role, 'tickets', 'create', 'all'),
      canDeleteAllTickets: await hasPermission(c.env.DB, user.role, 'tickets', 'delete', 'all'),
      canDeleteOwnTickets: await hasPermission(c.env.DB, user.role, 'tickets', 'delete', 'own'),
      canCreateMachines: await hasPermission(c.env.DB, user.role, 'machines', 'create', 'all'),
      canCreateUsers: await hasPermission(c.env.DB, user.role, 'users', 'create', 'all'),
      canManageRoles: await hasPermission(c.env.DB, user.role, 'roles', 'create', 'all'),
    };

    return c.json({
      message: 'Test RBAC réussi',
      user: {
        id: user.userId,
        email: user.email,
        role: user.role
      },
      permissions: {
        total: userPermissions.length,
        list: userPermissions
      },
      specificTests: tests,
      interpretation: {
        role: user.role,
        description:
          user.role === 'admin' ? 'Accès complet - Peut tout faire' :
          user.role === 'supervisor' ? 'Gestion complète sauf rôles/permissions' :
          user.role === 'technician' ? 'Gestion tickets + lecture' :
          user.role === 'operator' ? 'Tickets propres uniquement' :
          'Rôle personnalisé'
      }
    });
  } catch (error) {
    console.error('RBAC test error:', error);
    return c.json({ error: 'Erreur lors du test RBAC' }, 500);
  }
});

/**
 * GET /api/rbac/check - Vérifier une permission simple
 * Query params: resource, action, scope (défaut: 'all')
 * Retourne: { allowed: boolean }
 */
rbac.get('/check', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;
    const resource = c.req.query('resource');
    const action = c.req.query('action');
    const scope = c.req.query('scope') || 'all';

    if (!resource || !action) {
      return c.json({
        error: 'Paramètres manquants',
        required: ['resource', 'action'],
        optional: ['scope (défaut: all)']
      }, 400);
    }

    const allowed = await hasPermission(c.env.DB, user.role, resource, action, scope);

    return c.json({
      allowed,
      permission: `${resource}.${action}.${scope}`,
      user_role: user.role
    });
  } catch (error) {
    console.error('RBAC check error:', error);
    return c.json({ error: 'Erreur vérification permission' }, 500);
  }
});

/**
 * GET /api/rbac/check-any - Vérifier plusieurs permissions (AU MOINS UNE)
 * Query param: permissions (CSV: "resource.action.scope,resource2.action2.scope2")
 * Retourne: { allowed: boolean, matched?: string }
 */
rbac.get('/check-any', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;
    const permsParam = c.req.query('permissions');

    if (!permsParam) {
      return c.json({
        error: 'Paramètre manquant',
        required: 'permissions (CSV format: "resource.action.scope,...")'
      }, 400);
    }

    const permissions = permsParam.split(',');

    // Vérifier chaque permission jusqu'à trouver une correspondance
    for (const perm of permissions) {
      const parts = perm.trim().split('.');
      if (parts.length < 2) continue;

      const [resource, action, scope = 'all'] = parts;
      const allowed = await hasPermission(c.env.DB, user.role, resource, action, scope);

      if (allowed) {
        return c.json({
          allowed: true,
          matched: perm.trim(),
          user_role: user.role
        });
      }
    }

    return c.json({
      allowed: false,
      checked: permissions,
      user_role: user.role
    });
  } catch (error) {
    console.error('RBAC check-any error:', error);
    return c.json({ error: 'Erreur vérification permissions' }, 500);
  }
});

/**
 * GET /api/rbac/check-all - Vérifier plusieurs permissions (TOUTES)
 * Query param: permissions (CSV: "resource.action.scope,resource2.action2.scope2")
 * Retourne: { allowed: boolean, failed?: string[] }
 */
rbac.get('/check-all', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;
    const permsParam = c.req.query('permissions');

    if (!permsParam) {
      return c.json({
        error: 'Paramètre manquant',
        required: 'permissions (CSV format: "resource.action.scope,...")'
      }, 400);
    }

    const permissions = permsParam.split(',');
    const failed: string[] = [];

    // Vérifier toutes les permissions
    for (const perm of permissions) {
      const parts = perm.trim().split('.');
      if (parts.length < 2) {
        failed.push(perm.trim() + ' (format invalide)');
        continue;
      }

      const [resource, action, scope = 'all'] = parts;
      const allowed = await hasPermission(c.env.DB, user.role, resource, action, scope);

      if (!allowed) {
        failed.push(perm.trim());
      }
    }

    const allAllowed = failed.length === 0;

    return c.json({
      allowed: allAllowed,
      checked: permissions,
      ...(failed.length > 0 && { failed }),
      user_role: user.role
    });
  } catch (error) {
    console.error('RBAC check-all error:', error);
    return c.json({ error: 'Erreur vérification permissions' }, 500);
  }
});

// Route de test avec middleware requirePermission
rbac.get('/test-permission',
  authMiddleware,
  requirePermission('tickets', 'read', 'all'),
  async (c) => {
    return c.json({
      message: 'Permission accordée!',
      requiredPermission: 'tickets.read.all'
    });
  }
);

// Route de test avec middleware requireAnyPermission
rbac.get('/test-any-permission',
  authMiddleware,
  requireAnyPermission(['tickets.read.all', 'tickets.read.own']),
  async (c) => {
    return c.json({
      message: 'Au moins une permission accordée!',
      requiredPermissions: ['tickets.read.all', 'tickets.read.own']
    });
  }
);

export default rbac;
