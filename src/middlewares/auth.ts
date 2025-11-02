// Middleware d'authentification

import { Context, Next } from 'hono';
import { extractToken, verifyToken } from '../utils/jwt';
import type { Bindings } from '../types';

export async function authMiddleware(c: Context<{ Bindings: Bindings }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = extractToken(authHeader);

  if (!token) {
    return c.json({ error: 'Token manquant' }, 401);
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return c.json({ error: 'Token invalide ou expiré' }, 401);
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
