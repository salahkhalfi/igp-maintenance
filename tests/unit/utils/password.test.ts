import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  isLegacyHash,
  upgradeLegacyHash,
} from '../../../src/utils/password';

describe('password.ts - hashPassword', () => {
  it('hash un mot de passe', async () => {
    const password = 'MySecurePassword123';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(50);
  });

  it('génère hash différent à chaque fois (salt)', async () => {
    const password = 'SamePassword';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
  });

  it('hash commence par version identifier', async () => {
    const hash = await hashPassword('test');
    // Format: v2:salt:hash (PBKDF2)
    expect(hash).toMatch(/^v2:/);
  });
});

describe('password.ts - verifyPassword', () => {
  it('vérifie mot de passe correct', async () => {
    const password = 'CorrectPassword';
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('rejette mot de passe incorrect', async () => {
    const password = 'CorrectPassword';
    const hash = await hashPassword(password);

    const isValid = await verifyPassword('WrongPassword', hash);
    expect(isValid).toBe(false);
  });

  it('rejette hash vide', async () => {
    const isValid = await verifyPassword('password', '');
    expect(isValid).toBe(false);
  });

  it('rejette mot de passe vide', async () => {
    const hash = await hashPassword('test');
    const isValid = await verifyPassword('', hash);
    expect(isValid).toBe(false);
  });
});

describe('password.ts - isLegacyHash', () => {
  it('détecte hash legacy (64 hex chars)', () => {
    // Format SHA-256: 64 caractères hexadécimaux
    const legacyHash = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f';
    expect(isLegacyHash(legacyHash)).toBe(true);
  });

  it('détecte hash moderne (v2:)', () => {
    const modernHash = 'v2:abc123def456:hash_value_here';
    expect(isLegacyHash(modernHash)).toBe(false);
  });

  it('rejette hash trop court', () => {
    expect(isLegacyHash('tooshort')).toBe(false);
  });

  it('rejette hash avec caractères invalides', () => {
    const invalidHash = 'g'.repeat(64); // 'g' pas hexadécimal
    expect(isLegacyHash(invalidHash)).toBe(false);
  });
});

describe('password.ts - upgradeLegacyHash', () => {
  it('upgrade hash legacy vers moderne', async () => {
    const password = 'UserPassword123';
    const legacyHash = 'somelegacyhashvalue';

    const newHash = await upgradeLegacyHash(password);

    expect(newHash).toBeDefined();
    expect(newHash).not.toBe(legacyHash);
    expect(isLegacyHash(newHash)).toBe(false);
  });

  it('hash upgradé vérifie le mot de passe original', async () => {
    const password = 'OriginalPassword';
    const newHash = await upgradeLegacyHash(password);

    const isValid = await verifyPassword(password, newHash);
    expect(isValid).toBe(true);
  });
});

describe('password.ts - Workflow complet', () => {
  it('cycle complet: hash → verify → correct', async () => {
    const password = 'WorkflowTest123!';

    // 1. Hash
    const hash = await hashPassword(password);
    expect(hash).toBeDefined();

    // 2. Verify correct
    const isCorrect = await verifyPassword(password, hash);
    expect(isCorrect).toBe(true);

    // 3. Verify incorrect
    const isWrong = await verifyPassword('WrongPass', hash);
    expect(isWrong).toBe(false);
  });

  it('upgrade legacy puis verify', async () => {
    const password = 'LegacyUserPassword';

    // 1. Simuler hash legacy (64 hex chars)
    const legacyHash = 'a'.repeat(64); // SHA-256 format
    expect(isLegacyHash(legacyHash)).toBe(true);

    // 2. Upgrade vers v2
    const newHash = await upgradeLegacyHash(password);
    expect(isLegacyHash(newHash)).toBe(false);
    expect(newHash).toMatch(/^v2:/);

    // 3. Verify avec nouveau hash
    const isValid = await verifyPassword(password, newHash);
    expect(isValid).toBe(true);
  });
});
