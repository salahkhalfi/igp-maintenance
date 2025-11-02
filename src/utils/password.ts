// Utilitaires pour le hashage des mots de passe
// Note: En production, utilisez une bibliothèque comme bcrypt
// Pour Cloudflare Workers, nous utilisons Web Crypto API

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Génération de hash pour les données de seed
// Utilisé pour créer les mots de passe de test
export function generateSeedHash(): string {
  // Hash SHA-256 de "password123" pour les tests
  return 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f';
}
