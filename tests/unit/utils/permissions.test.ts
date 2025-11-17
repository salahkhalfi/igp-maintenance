import { describe, it, expect, beforeEach } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  clearPermissionsCache,
} from '../../../src/utils/permissions';
import { createMockDBWithPermissions } from '../../fixtures/mock-db';

describe('permissions.ts - hasPermission', () => {
  let mockDB: any;

  beforeEach(() => {
    mockDB = createMockDBWithPermissions();
    clearPermissionsCache();
  });

  it('admin a permission tickets.create.all', async () => {
    const result = await hasPermission(mockDB, 'admin', 'tickets', 'create', 'all');
    expect(result).toBe(true);
  });

  it('admin a permission users.delete.all', async () => {
    const result = await hasPermission(mockDB, 'admin', 'users', 'delete', 'all');
    expect(result).toBe(true);
  });

  it('technician a permission tickets.read.all', async () => {
    const result = await hasPermission(mockDB, 'technician', 'tickets', 'read', 'all');
    expect(result).toBe(true);
  });

  it('technician a permission tickets.update.own', async () => {
    const result = await hasPermission(mockDB, 'technician', 'tickets', 'update', 'own');
    expect(result).toBe(true);
  });

  it('technician N\'A PAS permission tickets.delete.all', async () => {
    const result = await hasPermission(mockDB, 'technician', 'tickets', 'delete', 'all');
    expect(result).toBe(false);
  });

  it('operator a permission tickets.create.all', async () => {
    const result = await hasPermission(mockDB, 'operator', 'tickets', 'create', 'all');
    expect(result).toBe(true);
  });

  it('operator N\'A PAS permission tickets.delete.all', async () => {
    const result = await hasPermission(mockDB, 'operator', 'tickets', 'delete', 'all');
    expect(result).toBe(false);
  });

  it('permission "all" inclut "own"', async () => {
    // Admin a tickets.update.all, donc aussi tickets.update.own
    const result = await hasPermission(mockDB, 'admin', 'tickets', 'update', 'own');
    expect(result).toBe(true);
  });

  it('rôle inconnu n\'a aucune permission', async () => {
    const result = await hasPermission(mockDB, 'unknown_role', 'tickets', 'read', 'all');
    expect(result).toBe(false);
  });
});

describe('permissions.ts - hasAnyPermission', () => {
  let mockDB: any;

  beforeEach(() => {
    mockDB = createMockDBWithPermissions();
    clearPermissionsCache();
  });

  it('technician a AU MOINS UNE des permissions listées', async () => {
    const permissions = [
      'tickets.delete.all', // N'a pas
      'tickets.read.all',   // A cette permission ✓
      'users.delete.all',   // N'a pas
    ];
    const result = await hasAnyPermission(mockDB, 'technician', permissions);
    expect(result).toBe(true);
  });

  it('operator N\'A AUCUNE des permissions admin', async () => {
    const permissions = [
      'users.create.all',
      'users.update.all',
      'users.delete.all',
    ];
    const result = await hasAnyPermission(mockDB, 'operator', permissions);
    expect(result).toBe(false);
  });

  it('admin a toutes les permissions', async () => {
    const permissions = [
      'tickets.create.all',
      'users.update.all',
      'tickets.delete.all',
    ];
    const result = await hasAnyPermission(mockDB, 'admin', permissions);
    expect(result).toBe(true);
  });
});

describe('permissions.ts - hasAllPermissions', () => {
  let mockDB: any;

  beforeEach(() => {
    mockDB = createMockDBWithPermissions();
    clearPermissionsCache();
  });

  it('admin a TOUTES les permissions listées', async () => {
    const permissions = [
      'tickets.create.all',
      'tickets.read.all',
      'users.update.all',
    ];
    const result = await hasAllPermissions(mockDB, 'admin', permissions);
    expect(result).toBe(true);
  });

  it('technician N\'A PAS toutes les permissions admin', async () => {
    const permissions = [
      'tickets.read.all',   // A ✓
      'tickets.delete.all', // N'a pas ✗
    ];
    const result = await hasAllPermissions(mockDB, 'technician', permissions);
    expect(result).toBe(false);
  });

  it('operator a permissions création/lecture tickets', async () => {
    const permissions = [
      'tickets.create.all',
      'tickets.read.all',
    ];
    const result = await hasAllPermissions(mockDB, 'operator', permissions);
    expect(result).toBe(true);
  });
});

describe('permissions.ts - getRolePermissions', () => {
  let mockDB: any;

  beforeEach(() => {
    mockDB = createMockDBWithPermissions();
    clearPermissionsCache();
  });

  it('récupère toutes permissions admin', async () => {
    const permissions = await getRolePermissions(mockDB, 'admin');
    expect(permissions).toContain('tickets.create.all');
    expect(permissions).toContain('users.delete.all');
    expect(permissions.length).toBeGreaterThan(0);
  });

  it('récupère permissions limitées technician', async () => {
    const permissions = await getRolePermissions(mockDB, 'technician');
    expect(permissions).toContain('tickets.read.all');
    expect(permissions).toContain('tickets.update.own');
    expect(permissions).not.toContain('tickets.delete.all');
  });

  it('rôle inconnu retourne array vide', async () => {
    const permissions = await getRolePermissions(mockDB, 'unknown_role');
    expect(permissions).toEqual([]);
  });
});

describe('permissions.ts - Cache', () => {
  let mockDB: any;

  beforeEach(() => {
    mockDB = createMockDBWithPermissions();
    clearPermissionsCache();
  });

  it('cache fonctionne après premier appel', async () => {
    // Premier appel - chargement depuis DB
    const result1 = await hasPermission(mockDB, 'admin', 'tickets', 'create', 'all');
    expect(result1).toBe(true);

    // Modifier mock DB (simuler changement)
    mockDB.addTestData('permissions_admin', []);

    // Deuxième appel - devrait utiliser cache (pas les nouvelles données vides)
    const result2 = await hasPermission(mockDB, 'admin', 'tickets', 'create', 'all');
    expect(result2).toBe(true); // Toujours true grâce au cache
  });

  it('clearCache force rechargement', async () => {
    // Premier appel
    const result1 = await hasPermission(mockDB, 'admin', 'tickets', 'create', 'all');
    expect(result1).toBe(true);

    // Modifier DB
    mockDB.addTestData('permissions_admin', []);

    // Clear cache
    clearPermissionsCache();

    // Rechargement depuis DB (nouvelles données vides)
    const result2 = await hasPermission(mockDB, 'admin', 'tickets', 'create', 'all');
    expect(result2).toBe(false); // Maintenant false car cache vidé
  });
});
