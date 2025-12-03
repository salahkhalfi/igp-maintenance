import { User } from '../shared/types';

/**
 * Utility to safely format a user's name, handling "Undefined", null, or missing values.
 * Implements a fallback strategy: First Name -> Last Name -> Full Name -> Email -> Default Label.
 */
export const formatUserName = (
  user: Partial<User> | null | undefined, 
  defaultLabel: string = 'Utilisateur'
): string => {
  if (!user) return defaultLabel;

  // Helper to check if a string is effectively "empty" or explicitly "Undefined"
  const isValid = (str: string | undefined | null): boolean => {
    if (!str) return false;
    const s = str.trim();
    if (s === '') return false;
    // Nuclear check: case-insensitive match for "undefined", "null"
    if (/^undefined$/i.test(s)) return false;
    if (/^null$/i.test(s)) return false;
    return true;
  };

  if (isValid(user.first_name)) return user.first_name!;
  if (isValid(user.last_name)) return user.last_name!;
  if (isValid(user.full_name)) return user.full_name!;
  if (isValid(user.email)) return user.email!.split('@')[0];

  return defaultLabel;
};

/**
 * Helper specifically for raw name strings retrieved from DB where we might not have a full User object
 * or when handling legacy "assignee_name" fields.
 */
export const formatNameString = (
  name: string | null | undefined, 
  fallback: string | null | undefined,
  defaultLabel: string = 'Inconnu'
): string => {
  const isValid = (str: string | undefined | null) => {
    if (!str) return false;
    const s = str.trim();
    return s !== '' && !/^undefined$/i.test(s) && !/^null$/i.test(s);
  };

  if (isValid(name)) return name!;
  if (isValid(fallback)) return fallback!;
  
  return defaultLabel;
};
