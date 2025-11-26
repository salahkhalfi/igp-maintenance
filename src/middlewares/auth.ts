// Middleware d'authentification

import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { extractToken, verifyToken } from '../utils/jwt';
import { hasPermission, hasAnyPermission, type PermissionString } from '../utils/permissions';
import type { Bindings } from '../types';

export async function authMiddleware(c: Context<{ Bindings: Bindings }>, next: Next) {
  // ✅ DUAL-MODE AUTHENTICATION: Cookie (browser) OU Authorization header (API/mobile)
  const cookieToken = getCookie(c, 'auth_token');
  const authHeader = c.req.header('Authorization');
  
  // Development logging only
  if (c.env.ENVIRONMENT !== 'production') {
    console.log('[AUTH-MIDDLEWARE] Cookie token:', cookieToken ? `${cookieToken.substring(0, 20)}... (length: ${cookieToken.length})` : 'NULL');
    console.log('[AUTH-MIDDLEWARE] Authorization header:', authHeader ? `Bearer ${authHeader.substring(7, 27)}...` : 'NULL');
  }

  // Priorité: Cookie d'abord (secure), puis Authorization header (backward compat)
  const token = cookieToken || extractToken(authHeader);
  
  if (c.env.ENVIRONMENT !== 'production') {
    console.log('[AUTH-MIDDLEWARE] Token source:', cookieToken ? 'COOKIE (secure)' : authHeader ? 'HEADER (legacy)' : 'NONE');
    console.log('[AUTH-MIDDLEWARE] Token extracted:', token ? `${token.substring(0, 20)}... (length: ${token.length})` : 'NULL');
  }

  if (!token) {
    if (c.env.ENVIRONMENT !== 'production') {
      console.log('[AUTH-MIDDLEWARE] REJECTING: Token manquant');
    }
    return c.json({ error: 'Token manquant' }, 401);
  }

  const payload = await verifyToken(token);
  
  if (c.env.ENVIRONMENT !== 'production') {
    console.log('[AUTH-MIDDLEWARE] Token verification result:', payload ? 'VALID' : 'INVALID');
  }

  if (!payload) {
    if (c.env.ENVIRONMENT !== 'production') {
      console.log('[AUTH-MIDDLEWARE] REJECTING: Token invalide ou expiré');
    }
    return c.json({ error: 'Token invalide ou expiré' }, 401);
  }

  if (c.env.ENVIRONMENT !== 'production') {
    console.log('[AUTH-MIDDLEWARE] SUCCESS: User authenticated:', payload.userId, payload.email, payload.role);
  }

  // Stocker les informations utilisateur dans le contexte
  c.set('user', payload);
  await next();
}

export async function adminOnly(c: Context<{ Bindings: Bindings }>, next: Next) {
  const user = c.get('user') as any;

  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Accès réservé aux administrateurs' }, 403);
  }

  await next();
}

export async function technicianOrAdmin(c: Context<{ Bindings: Bindings }>, next: Next) {
  const user = c.get('user') as any;

  if (!user || (user.role !== 'admin' && user.role !== 'technician')) {
    return c.json({ error: 'Accès réservé aux techniciens et administrateurs' }, 403);
  }

  await next();
}

// Middleware pour superviseur et admin (mêmes permissions sauf gestion des admins)
export async function supervisorOrAdmin(c: Context<{ Bindings: Bindings }>, next: Next) {
  const user = c.get('user') as any;

  if (!user || (user.role !== 'admin' && user.role !== 'supervisor')) {
    return c.json({ error: 'Accès réservé aux superviseurs et administrateurs' }, 403);
  }

  await next();
}

// Middleware pour technicien, superviseur et admin
export async function technicianSupervisorOrAdmin(c: Context<{ Bindings: Bindings }>, next: Next) {
  const user = c.get('user') as any;

  if (!user || (user.role !== 'admin' && user.role !== 'supervisor' && user.role !== 'technician')) {
    return c.json({ error: 'Accès réservé aux techniciens, superviseurs et administrateurs' }, 403);
  }

  await next();
}

/**
 * 🆕 NOUVEAU MIDDLEWARE RBAC
 * Vérifie qu'un utilisateur a UNE permission spécifique
 *
 * @param resource - Ressource (tickets, machines, users, etc.)
 * @param action - Action (create, read, update, delete, etc.)
 * @param scope - Portée (all, own, team, etc.) - défaut: 'all'
 *
 * @example
 * app.post('/api/tickets', authMiddleware, requirePermission('tickets', 'create', 'all'), async (c) => {...})
 */
export function requirePermission(resource: string, action: string, scope: string = 'all') {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const user = c.get('user') as any;

    if (!user) {
      return c.json({ error: 'Non authentifié' }, 401);
    }

    const allowed = await hasPermission(c.env.DB, user.role, resource, action, scope);

    if (!allowed) {
      return c.json({
        error: `Permission refusée: ${resource}.${action}.${scope}`,
        required_permission: `${resource}.${action}.${scope}`,
        user_role: user.role
      }, 403);
    }

    await next();
  };
}

/**
 * 🆕 NOUVEAU MIDDLEWARE RBAC
 * Vérifie qu'un utilisateur a AU MOINS UNE des permissions listées
 *
 * @param permissions - Liste de permissions au format "resource.action.scope"
 *
 * @example
 * app.get('/api/tickets', authMiddleware, requireAnyPermission([
 *   'tickets.read.all',
 *   'tickets.read.own'
 * ]), async (c) => {...})
 */
export function requireAnyPermission(permissions: PermissionString[]) {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const user = c.get('user') as any;

    if (!user) {
      return c.json({ error: 'Non authentifié' }, 401);
    }

    const allowed = await hasAnyPermission(c.env.DB, user.role, permissions);

    if (!allowed) {
      return c.json({
        error: 'Permission refusée: aucune des permissions requises',
        required_permissions: permissions,
        user_role: user.role
      }, 403);
    }

    await next();
  };
}
