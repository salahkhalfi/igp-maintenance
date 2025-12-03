/**
 * User Formatter Utility
 * Centralizes logic for displaying user names to avoid "Undefined" issues.
 */

interface NameParts {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email?: string | null;
}

/**
 * Formats a user's name with a strict waterfall logic.
 * Priority: First Name > Last Name > Full Name > Email > Fallback
 * 
 * @param user - User object containing name parts
 * @param fallback - Default string to return if no name is found (default: 'Utilisateur')
 * @returns A clean, displayable name string
 */
export function formatUserName(user: NameParts | null | undefined, fallback: string = 'Utilisateur'): string {
  if (!user) {
    return fallback;
  }

  // 1. Try First Name (ignore 'Undefined' string)
  if (isValidName(user.first_name)) {
    return user.first_name!;
  }

  // 2. Try Last Name
  if (isValidName(user.last_name)) {
    return user.last_name!;
  }

  // 3. Try Full Name
  if (isValidName(user.full_name)) {
    return user.full_name!;
  }

  // 4. Try Email (username part)
  if (isValidName(user.email)) {
    return user.email!.split('@')[0];
  }

  return fallback;
}

/**
 * Helper to validate if a name string is usable.
 * Checks for null, undefined, empty string, and "undefined"/"Undefined" strings.
 */
function isValidName(name: string | null | undefined): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (trimmed === '') return false;
  if (trimmed.toLowerCase() === 'undefined') return false;
  if (trimmed.toLowerCase() === 'null') return false;
  return true;
}
