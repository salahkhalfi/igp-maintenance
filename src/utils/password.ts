// Utilitaires pour le hashage des mots de passe
// Version améliorée avec PBKDF2 et rétrocompatibilité SHA-256
// Pour Cloudflare Workers, nous utilisons Web Crypto API

/**
 * SYSTÈME DE HASHAGE AVEC RÉTROCOMPATIBILITÉ
 * 
 * Anciens hashs (SHA-256 sans salt): 64 caractères hexadécimaux
 * Nouveaux hashs (PBKDF2): format "v2:salt:hash" (plus de 64 caractères)
 * 
 * La fonction verifyPassword détecte automatiquement le format
 * et utilise l'algorithme approprié pour la vérification.
 */

// Nombre d'itérations PBKDF2 (100,000 est le minimum recommandé)
const PBKDF2_ITERATIONS = 100000;

/**
 * Hash un mot de passe avec PBKDF2 (nouveau système sécurisé)
 */
export async function hashPasswordPBKDF2(password: string, saltBytes?: Uint8Array): Promise<string> {
  // Générer un salt aléatoire si non fourni
  const salt = saltBytes || crypto.getRandomValues(new Uint8Array(16));
  
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Importer la clé
  const importedKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // Dériver les bits avec PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    importedKey,
    256
  );
  
  // Convertir en hexadécimal
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Format: v2:salt:hash
  return `v2:${saltHex}:${hashHex}`;
}

/**
 * Hash un mot de passe avec SHA-256 (ancien système - pour compatibilité)
 * @deprecated Utilisé uniquement pour la rétrocompatibilité
 */
async function hashPasswordSHA256(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash un mot de passe (utilise le nouveau système PBKDF2)
 */
export async function hashPassword(password: string): Promise<string> {
  return hashPasswordPBKDF2(password);
}

/**
 * Vérifie un mot de passe avec rétrocompatibilité automatique
 * 
 * Détecte le format du hash:
 * - Format "v2:salt:hash" → Utilise PBKDF2
 * - Format de 64 caractères hex → Utilise SHA-256 (ancien)
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Détecter le format du hash
  if (storedHash.startsWith('v2:')) {
    // Nouveau format PBKDF2
    return verifyPasswordPBKDF2(password, storedHash);
  } else {
    // Ancien format SHA-256
    return verifyPasswordSHA256(password, storedHash);
  }
}

/**
 * Vérifie un mot de passe avec PBKDF2
 */
async function verifyPasswordPBKDF2(password: string, storedHash: string): Promise<boolean> {
  try {
    // Parse le format v2:salt:hash
    const parts = storedHash.split(':');
    if (parts.length !== 3 || parts[0] !== 'v2') {
      return false;
    }
    
    const saltHex = parts[1];
    const hashHex = parts[2];
    
    // Convertir le salt hex en bytes
    const salt = new Uint8Array(
      saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    );
    
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // Importer la clé
    const importedKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    // Dériver les bits avec le même salt
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      importedKey,
      256
    );
    
    // Convertir en hex et comparer
    const hashToCheck = Array.from(new Uint8Array(derivedBits))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashToCheck === hashHex;
  } catch (error) {
    console.error('Error verifying PBKDF2 password:', error);
    return false;
  }
}

/**
 * Vérifie un mot de passe avec SHA-256 (ancien système)
 */
async function verifyPasswordSHA256(password: string, storedHash: string): Promise<boolean> {
  const passwordHash = await hashPasswordSHA256(password);
  return passwordHash === storedHash;
}

/**
 * Vérifie si un hash utilise l'ancien système SHA-256
 */
export function isLegacyHash(hash: string): boolean {
  return !hash.startsWith('v2:') && hash.length === 64 && /^[0-9a-f]+$/.test(hash);
}

/**
 * Migre un utilisateur de l'ancien vers le nouveau système de hashage
 * À appeler lors d'une connexion réussie avec un ancien hash
 */
export async function upgradeLegacyHash(password: string): Promise<string> {
  return hashPasswordPBKDF2(password);
}

// Génération de hash pour les données de seed
// Utilisé pour créer les mots de passe de test
export function generateSeedHash(): string {
  // Hash SHA-256 de "password123" pour les tests (ancien format)
  return 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f';
}
