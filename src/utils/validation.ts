/**
 * Utilitaires de validation pour l'application
 * Améliore la sécurité et l'expérience utilisateur
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Limites de longueur
export const LIMITS = {
  // Noms et identifiants
  NAME_MIN: 2,
  NAME_MAX: 100,
  DESCRIPTION_MAX: 2000,
  COMMENT_MAX: 1000,
  MESSAGE_MAX: 500,
  
  // Données techniques
  SERIAL_NUMBER_MAX: 50,
  EMAIL_MAX: 254, // RFC 5321
  PASSWORD_MIN: 6,
  PASSWORD_MAX: 128,
  
  // Fichiers
  FILE_SIZE_MAX: 10 * 1024 * 1024, // 10 MB
};

/**
 * Valider un nom (machine, utilisateur, etc.)
 */
export function validateName(name: string, fieldName: string = 'Nom'): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: `${fieldName} requis` };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < LIMITS.NAME_MIN) {
    return { valid: false, error: `${fieldName} trop court (min ${LIMITS.NAME_MIN} caractères)` };
  }
  
  if (trimmed.length > LIMITS.NAME_MAX) {
    return { valid: false, error: `${fieldName} trop long (max ${LIMITS.NAME_MAX} caractères)` };
  }
  
  // Vérifier qu'il n'y a pas que des espaces ou caractères spéciaux
  if (!/\w/.test(trimmed)) {
    return { valid: false, error: `${fieldName} doit contenir au moins une lettre ou un chiffre` };
  }
  
  return { valid: true };
}

/**
 * Valider une description ou commentaire
 */
export function validateDescription(description: string, maxLength: number = LIMITS.DESCRIPTION_MAX): ValidationResult {
  if (!description || typeof description !== 'string') {
    return { valid: false, error: 'Description requise' };
  }
  
  const trimmed = description.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Description ne peut pas être vide' };
  }
  
  if (trimmed.length > maxLength) {
    return { valid: false, error: `Description trop longue (max ${maxLength} caractères)` };
  }
  
  return { valid: true };
}

/**
 * Valider un email
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email requis' };
  }
  
  const trimmed = email.trim().toLowerCase();
  
  if (trimmed.length > LIMITS.EMAIL_MAX) {
    return { valid: false, error: 'Email trop long' };
  }
  
  // Regex RFC 5322 simplifié
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Format email invalide' };
  }
  
  return { valid: true };
}

/**
 * Valider un mot de passe
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Mot de passe requis' };
  }
  
  if (password.length < LIMITS.PASSWORD_MIN) {
    return { valid: false, error: `Mot de passe trop court (min ${LIMITS.PASSWORD_MIN} caractères)` };
  }
  
  if (password.length > LIMITS.PASSWORD_MAX) {
    return { valid: false, error: 'Mot de passe trop long' };
  }
  
  return { valid: true };
}

/**
 * Valider un numéro de série
 */
export function validateSerialNumber(serial: string): ValidationResult {
  if (!serial || typeof serial !== 'string') {
    return { valid: false, error: 'Numéro de série requis' };
  }
  
  const trimmed = serial.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Numéro de série ne peut pas être vide' };
  }
  
  if (trimmed.length > LIMITS.SERIAL_NUMBER_MAX) {
    return { valid: false, error: `Numéro de série trop long (max ${LIMITS.SERIAL_NUMBER_MAX} caractères)` };
  }
  
  return { valid: true };
}

/**
 * Valider une priorité de ticket
 */
export function validatePriority(priority: string): ValidationResult {
  const validPriorities = ['low', 'medium', 'high', 'critical'];
  
  if (!validPriorities.includes(priority)) {
    return { valid: false, error: 'Priorité invalide (low, medium, high, critical)' };
  }
  
  return { valid: true };
}

/**
 * Valider un statut de ticket
 */
export function validateStatus(status: string): ValidationResult {
  const validStatuses = ['received', 'diagnostic', 'in_progress', 'waiting_parts', 'completed', 'archived'];
  
  if (!validStatuses.includes(status)) {
    return { valid: false, error: 'Statut invalide' };
  }
  
  return { valid: true };
}

/**
 * Valider un rôle utilisateur
 */
export function validateRole(role: string): ValidationResult {
  const validRoles = ['admin', 'supervisor', 'technician', 'operator'];
  
  if (!validRoles.includes(role)) {
    // Si ce n'est pas un rôle système, on accepte (rôle personnalisé)
    // Mais on valide le format
    if (!/^[a-z0-9_]+$/.test(role)) {
      return { valid: false, error: 'Nom de rôle invalide (lettres minuscules, chiffres et underscores uniquement)' };
    }
  }
  
  return { valid: true };
}

/**
 * Nettoyer une chaîne (trim + normalisation des espaces)
 */
export function sanitizeString(str: string): string {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .trim()
    .replace(/\s+/g, ' ') // Remplacer plusieurs espaces par un seul
    .substring(0, LIMITS.DESCRIPTION_MAX); // Limiter la longueur max
}

/**
 * Valider un ID numérique
 */
export function validateId(id: any, fieldName: string = 'ID'): ValidationResult {
  const numId = parseInt(id);
  
  if (isNaN(numId) || numId <= 0) {
    return { valid: false, error: `${fieldName} invalide` };
  }
  
  return { valid: true };
}

/**
 * Valider un tableau d'IDs
 */
export function validateIdArray(ids: any[], fieldName: string = 'IDs'): ValidationResult {
  if (!Array.isArray(ids)) {
    return { valid: false, error: `${fieldName} doit être un tableau` };
  }
  
  if (ids.length === 0) {
    return { valid: false, error: `${fieldName} ne peut pas être vide` };
  }
  
  for (const id of ids) {
    const result = validateId(id, fieldName);
    if (!result.valid) {
      return result;
    }
  }
  
  return { valid: true };
}

/**
 * Valider les données d'une machine
 */
export function validateMachineData(data: any): ValidationResult {
  // Machine type
  const typeResult = validateName(data.machine_type, 'Type de machine');
  if (!typeResult.valid) return typeResult;
  
  // Model
  const modelResult = validateName(data.model, 'Modèle');
  if (!modelResult.valid) return modelResult;
  
  // Serial number
  const serialResult = validateSerialNumber(data.serial_number);
  if (!serialResult.valid) return serialResult;
  
  // Location
  const locationResult = validateName(data.location, 'Localisation');
  if (!locationResult.valid) return locationResult;
  
  return { valid: true };
}

/**
 * Valider les données d'un ticket
 */
export function validateTicketData(data: any): ValidationResult {
  // Title
  const titleResult = validateName(data.title, 'Titre');
  if (!titleResult.valid) return titleResult;
  
  // Description
  const descResult = validateDescription(data.description);
  if (!descResult.valid) return descResult;
  
  // Priority
  if (data.priority) {
    const priorityResult = validatePriority(data.priority);
    if (!priorityResult.valid) return priorityResult;
  }
  
  // Machine ID
  const machineResult = validateId(data.machine_id, 'ID Machine');
  if (!machineResult.valid) return machineResult;
  
  return { valid: true };
}

/**
 * Valider les données d'un utilisateur
 */
export function validateUserData(data: any, isUpdate: boolean = false): ValidationResult {
  // Email
  const emailResult = validateEmail(data.email);
  if (!emailResult.valid) return emailResult;
  
  // Full name
  const nameResult = validateName(data.full_name, 'Nom complet');
  if (!nameResult.valid) return nameResult;
  
  // Password (seulement pour création ou si fourni)
  if (!isUpdate || data.password) {
    const passwordResult = validatePassword(data.password);
    if (!passwordResult.valid) return passwordResult;
  }
  
  // Role
  const roleResult = validateRole(data.role);
  if (!roleResult.valid) return roleResult;
  
  return { valid: true };
}

/**
 * Valider les données d'un rôle RBAC
 */
export function validateRoleData(data: any): ValidationResult {
  // Name (nom technique)
  if (!data.name || typeof data.name !== 'string') {
    return { valid: false, error: 'Nom technique requis' };
  }
  
  if (!/^[a-z0-9_]+$/.test(data.name)) {
    return { valid: false, error: 'Nom technique invalide (lettres minuscules, chiffres et underscores uniquement)' };
  }
  
  if (data.name.length < 2 || data.name.length > 50) {
    return { valid: false, error: 'Nom technique doit faire entre 2 et 50 caractères' };
  }
  
  // Display name
  const displayResult = validateName(data.display_name, 'Nom affiché');
  if (!displayResult.valid) return displayResult;
  
  // Description
  if (!data.description || data.description.trim().length === 0) {
    return { valid: false, error: 'Description requise' };
  }
  
  if (data.description.length > LIMITS.DESCRIPTION_MAX) {
    return { valid: false, error: 'Description trop longue' };
  }
  
  // Permission IDs
  const permResult = validateIdArray(data.permission_ids, 'IDs permissions');
  if (!permResult.valid) return permResult;
  
  return { valid: true };
}

/**
 * Valider les données d'upload de fichier
 */
export function validateFileUpload(file: File): ValidationResult {
  if (!file) {
    return { valid: false, error: 'Fichier requis' };
  }
  
  // Taille
  if (file.size > LIMITS.FILE_SIZE_MAX) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const maxMB = (LIMITS.FILE_SIZE_MAX / (1024 * 1024)).toFixed(0);
    return { valid: false, error: `Fichier trop volumineux (${sizeMB}MB). Maximum: ${maxMB}MB` };
  }
  
  // Type MIME
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `Type de fichier non autorisé: ${file.type}. Acceptés: images et vidéos` };
  }
  
  return { valid: true };
}
