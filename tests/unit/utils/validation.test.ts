import { describe, it, expect } from 'vitest';
import {
  validateName,
  validateEmail,
  validatePassword,
  validateDescription,
  LIMITS,
} from '../../../src/utils/validation';

describe('validation.ts - validateName', () => {
  it('accepte nom valide', () => {
    const result = validateName('John Doe');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejette nom vide', () => {
    const result = validateName('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('requis');
  });

  it('rejette nom trop court', () => {
    const result = validateName('A');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('trop court');
  });

  it('rejette nom trop long', () => {
    const longName = 'A'.repeat(LIMITS.NAME_MAX + 1);
    const result = validateName(longName);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('trop long');
  });

  it('trim les espaces', () => {
    const result = validateName('  John  ');
    expect(result.valid).toBe(true);
  });

  it('rejette que des espaces', () => {
    const result = validateName('   ');
    expect(result.valid).toBe(false);
  });

  it('accepte caractères spéciaux français', () => {
    const result = validateName('François Dépôt');
    expect(result.valid).toBe(true);
  });
});

describe('validation.ts - validateEmail', () => {
  it('accepte email valide', () => {
    const result = validateEmail('test@example.com');
    expect(result.valid).toBe(true);
  });

  it('rejette email sans @', () => {
    const result = validateEmail('testexample.com');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('invalide');
  });

  it('rejette email sans domaine', () => {
    const result = validateEmail('test@');
    expect(result.valid).toBe(false);
  });

  it('rejette email sans partie locale', () => {
    const result = validateEmail('@example.com');
    expect(result.valid).toBe(false);
  });

  it('accepte sous-domaines', () => {
    const result = validateEmail('test@sub.example.com');
    expect(result.valid).toBe(true);
  });

  it('accepte points dans partie locale', () => {
    const result = validateEmail('first.last@example.com');
    expect(result.valid).toBe(true);
  });

  it('rejette email trop long', () => {
    const longEmail = 'a'.repeat(250) + '@example.com';
    const result = validateEmail(longEmail);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('trop long');
  });
});

describe('validation.ts - validatePassword', () => {
  it('accepte mot de passe valide', () => {
    const result = validatePassword('SecurePass123');
    expect(result.valid).toBe(true);
  });

  it('rejette mot de passe trop court', () => {
    const result = validatePassword('12345');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('trop court');
  });

  it('rejette mot de passe vide', () => {
    const result = validatePassword('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('requis');
  });

  it('rejette mot de passe trop long', () => {
    const longPass = 'A'.repeat(LIMITS.PASSWORD_MAX + 1);
    const result = validatePassword(longPass);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('trop long');
  });

  it('accepte caractères spéciaux', () => {
    const result = validatePassword('Pass@123!#');
    expect(result.valid).toBe(true);
  });
});

describe('validation.ts - validateDescription', () => {
  it('accepte description valide', () => {
    const result = validateDescription('Ceci est une description.');
    expect(result.valid).toBe(true);
  });

  it('rejette description vide', () => {
    const result = validateDescription('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('requise');
  });

  it('rejette description trop longue', () => {
    const longDesc = 'A'.repeat(LIMITS.DESCRIPTION_MAX + 1);
    const result = validateDescription(longDesc);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('trop longue');
  });

  it('trim les espaces', () => {
    const result = validateDescription('  Description valide  ');
    expect(result.valid).toBe(true);
  });

  it('accepte sauts de ligne', () => {
    const result = validateDescription('Ligne 1\nLigne 2\nLigne 3');
    expect(result.valid).toBe(true);
  });
});
