// Utilitaires JWT pour l'authentification
// Version sécurisée avec validation du secret

import { SignJWT, jwtVerify } from 'jose';

/**
 * 🔒 SÉCURITÉ: Configuration du secret JWT
 *
 * Le secret JWT doit être configuré via les variables d'environnement Cloudflare:
 * 1. En production: npx wrangler secret put JWT_SECRET --project-name webapp
 * 2. En développement local: ajouter JWT_SECRET dans .dev.vars
 *
 * IMPORTANT: Le secret doit avoir au moins 32 caractères pour une sécurité optimale
 */

// Récupérer le secret depuis l'environnement
const JWT_SECRET_ENV = process.env.JWT_SECRET;

// Validation du secret (avec fallback temporaire pour ne pas casser l'app)
if (!JWT_SECRET_ENV) {
  console.warn('⚠️ WARNING: JWT_SECRET not configured! Using fallback (INSECURE)');
  console.warn('⚠️ Configure with: npx wrangler secret put JWT_SECRET');
}

// Valider la longueur du secret si configuré
if (JWT_SECRET_ENV && JWT_SECRET_ENV.length < 32) {
  console.warn('⚠️ WARNING: JWT_SECRET should be at least 32 characters long');
}

// Utiliser le secret configuré, ou un fallback temporaire avec avertissement
const JWT_SECRET = new TextEncoder().encode(
  JWT_SECRET_ENV || 'maintenance-app-secret-key-change-in-production-FALLBACK'
);

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  isSuperAdmin?: boolean;
  iat?: number;
  exp?: number;
}

/**
 * Génère un token JWT signé pour l'utilisateur
 * @param payload Données de l'utilisateur à inclure dans le token
 * @param expiresInSeconds Durée de validité en secondes (défaut: 7 jours)
 * @returns Token JWT signé
 */
export async function signToken(payload: JWTPayload, expiresInSeconds: number = 7 * 24 * 60 * 60): Promise<string> {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)  // Expiration dynamique
    .sign(JWT_SECRET);
}

/**
 * Vérifie et décode un token JWT
 * @param token Token JWT à vérifier
 * @returns Payload du token si valide, null sinon
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch (error) {
    // Token invalide, expiré, ou signature incorrecte
    return null;
  }
}

/**
 * Extrait le token du header Authorization
 * @param authHeader Header Authorization (format: "Bearer <token>")
 * @returns Token extrait ou null si format invalide
 */
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Vérifie si le secret JWT est correctement configuré
 * @returns true si le secret est configuré (pas le fallback)
 */
export function isJWTSecretConfigured(): boolean {
  return !!JWT_SECRET_ENV;
}

/**
 * Obtient des informations sur la configuration JWT (pour diagnostics)
 * @returns Objet avec le statut de la configuration
 */
export function getJWTConfig(): {
  configured: boolean;
  secretLength: number;
  isSecure: boolean;
} {
  const configured = !!JWT_SECRET_ENV;
  const secretLength = JWT_SECRET_ENV?.length || 0;
  const isSecure = configured && secretLength >= 32;

  return {
    configured,
    secretLength: configured ? secretLength : 0,
    isSecure
  };
}
