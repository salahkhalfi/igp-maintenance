/**
 * Rate Limiting Middleware pour Cloudflare Workers
 * 
 * Utilise un cache en mémoire par Worker instance.
 * Note: En environnement distribué (multiple Workers), chaque instance
 * a son propre cache. Pour un rate limiting global strict, utiliser KV.
 * 
 * Cette implémentation est suffisante pour:
 * - Protéger contre les abus évidents (spam, scripts)
 * - Limiter les coûts API (IA, etc.)
 * - Éviter les attaques DDoS basiques
 */

import { Context, Next } from 'hono';
import type { Bindings } from '../types';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Cache en mémoire (par instance Worker)
const rateLimitCache = new Map<string, RateLimitEntry>();

// Nettoyage périodique du cache (évite memory leak)
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60000; // 1 minute

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  lastCleanup = now;
  for (const [key, entry] of rateLimitCache.entries()) {
    if (entry.resetTime < now) {
      rateLimitCache.delete(key);
    }
  }
}

interface RateLimitConfig {
  /** Nombre max de requêtes par fenêtre */
  limit: number;
  /** Durée de la fenêtre en secondes */
  windowSeconds: number;
  /** Clé pour identifier le client (défaut: IP) */
  keyGenerator?: (c: Context) => string;
  /** Message d'erreur personnalisé */
  message?: string;
  /** Skip rate limit pour certaines conditions */
  skip?: (c: Context) => boolean;
}

/**
 * Créer un middleware de rate limiting
 * 
 * @example
 * // 100 requêtes par minute
 * app.use('/api/*', rateLimit({ limit: 100, windowSeconds: 60 }));
 * 
 * // 10 requêtes par minute pour l'IA (plus restrictif)
 * app.use('/api/ai/*', rateLimit({ limit: 10, windowSeconds: 60 }));
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    limit,
    windowSeconds,
    keyGenerator = defaultKeyGenerator,
    message = 'Too many requests. Please try again later.',
    skip,
  } = config;

  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    // Skip si condition remplie
    if (skip && skip(c)) {
      return next();
    }

    // Nettoyage périodique
    cleanupExpiredEntries();

    const key = keyGenerator(c);
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    // Récupérer ou créer l'entrée
    let entry = rateLimitCache.get(key);
    
    if (!entry || entry.resetTime < now) {
      // Nouvelle fenêtre
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    entry.count++;
    rateLimitCache.set(key, entry);

    // Headers de rate limit (standard)
    const remaining = Math.max(0, limit - entry.count);
    const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);
    
    c.header('X-RateLimit-Limit', String(limit));
    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(resetSeconds));

    // Vérifier si limite dépassée
    if (entry.count > limit) {
      c.header('Retry-After', String(resetSeconds));
      return c.json(
        { 
          error: 'Rate limit exceeded',
          message,
          retryAfter: resetSeconds 
        },
        429
      );
    }

    return next();
  };
}

/**
 * Générateur de clé par défaut: IP + User-Agent
 * Combine IP et User-Agent pour éviter le bypass par rotation d'IP
 */
function defaultKeyGenerator(c: Context): string {
  const ip = c.req.header('cf-connecting-ip') 
    || c.req.header('x-forwarded-for')?.split(',')[0]
    || 'unknown';
  const ua = c.req.header('user-agent') || 'unknown';
  
  // Hash simple pour réduire la taille de la clé
  return `${ip}:${simpleHash(ua)}`;
}

/**
 * Hash simple pour réduire la taille des clés
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Générateur de clé par utilisateur authentifié
 * Utiliser pour les routes authentifiées
 */
export function userKeyGenerator(c: Context): string {
  const user = c.get('user');
  if (user?.id) {
    return `user:${user.id}`;
  }
  // Fallback sur IP si non authentifié
  return defaultKeyGenerator(c);
}

/**
 * Presets de configuration courants
 */
export const RateLimitPresets = {
  /** API standard: 100 req/min */
  standard: { limit: 100, windowSeconds: 60 },
  
  /** API stricte: 30 req/min */
  strict: { limit: 30, windowSeconds: 60 },
  
  /** API IA: 10 req/min (coûteux) */
  ai: { limit: 10, windowSeconds: 60 },
  
  /** Auth: 5 tentatives/min (anti-bruteforce) */
  auth: { limit: 5, windowSeconds: 60 },
  
  /** Upload: 20 req/min */
  upload: { limit: 20, windowSeconds: 60 },
} as const;
