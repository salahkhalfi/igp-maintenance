/**
 * Rate Limiting Middleware
 * Simple in-memory rate limiter for Cloudflare Workers
 * 
 * Note: Uses a simple sliding window approach
 * For production, consider using Cloudflare Rate Limiting or KV
 */

import { Context, Next } from 'hono';
import type { Bindings } from '../types';

// In-memory store (resets on worker restart, but good for basic protection)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  windowMs?: number;      // Time window in milliseconds (default: 60000 = 1 minute)
  maxRequests?: number;   // Max requests per window (default: 60)
  keyGenerator?: (c: Context) => string;  // Custom key generator
  message?: string;       // Custom error message
}

/**
 * Create a rate limiting middleware
 * 
 * @example
 * // Limit login attempts to 5 per minute
 * app.post('/login', rateLimit({ maxRequests: 5, windowMs: 60000 }), async (c) => {...})
 * 
 * // Limit API calls to 100 per minute per user
 * app.use('/api/*', rateLimit({ maxRequests: 100 }))
 */
export function rateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = 60000,
    maxRequests = 60,
    keyGenerator = defaultKeyGenerator,
    message = 'Trop de requêtes. Veuillez réessayer dans quelques instants.'
  } = options;

  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const key = keyGenerator(c);
    const now = Date.now();

    // Get or create entry
    let entry = requestCounts.get(key);
    
    if (!entry || now > entry.resetAt) {
      // Create new window
      entry = { count: 1, resetAt: now + windowMs };
      requestCounts.set(key, entry);
    } else {
      // Increment count
      entry.count++;
    }

    // Check limit
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      
      return c.json({
        error: message,
        retryAfter
      }, 429, {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(entry.resetAt / 1000).toString()
      });
    }

    // Add rate limit headers
    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count).toString());
    c.header('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000).toString());

    await next();
  };
}

/**
 * Default key generator: IP + User ID (if authenticated)
 */
function defaultKeyGenerator(c: Context): string {
  const ip = c.req.header('CF-Connecting-IP') || 
             c.req.header('X-Forwarded-For')?.split(',')[0] || 
             'unknown';
  const user = c.get('user') as any;
  const userId = user?.userId || 'anon';
  const path = new URL(c.req.url).pathname;
  
  return `${ip}:${userId}:${path}`;
}

/**
 * Strict rate limit for sensitive routes (login, register, password reset)
 */
export const strictRateLimit = rateLimit({
  windowMs: 60000,      // 1 minute
  maxRequests: 5,       // 5 attempts
  message: 'Trop de tentatives. Veuillez patienter 1 minute.'
});

/**
 * Standard rate limit for API routes
 */
export const standardRateLimit = rateLimit({
  windowMs: 60000,      // 1 minute
  maxRequests: 100,     // 100 requests
  message: 'Limite de requêtes atteinte. Veuillez réessayer.'
});

/**
 * Relaxed rate limit for read-only routes
 */
export const relaxedRateLimit = rateLimit({
  windowMs: 60000,      // 1 minute
  maxRequests: 300,     // 300 requests
  message: 'Trop de requêtes. Veuillez ralentir.'
});

// Note: Cleanup happens on each request check (no setInterval in Cloudflare Workers)
// Old entries are automatically overwritten when their window expires
