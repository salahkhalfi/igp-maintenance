/**
 * Mock D1Database pour tests unitaires
 * Simule le comportement de Cloudflare D1
 */

export interface MockD1Result {
  results: any[];
  success: boolean;
  meta: any;
}

export class MockD1Database implements Partial<D1Database> {
  private data: Map<string, any[]> = new Map();

  constructor(initialData?: Record<string, any[]>) {
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        this.data.set(key, value);
      });
    }
  }

  prepare(query: string): D1PreparedStatement {
    return new MockD1PreparedStatement(query, this.data) as any;
  }

  // Helper pour ajouter des données de test
  addTestData(key: string, data: any[]): void {
    this.data.set(key, data);
  }

  // Helper pour réinitialiser
  reset(): void {
    this.data.clear();
  }
}

class MockD1PreparedStatement {
  private query: string;
  private data: Map<string, any[]>;
  private boundParams: any[] = [];

  constructor(query: string, data: Map<string, any[]>) {
    this.query = query;
    this.data = data;
  }

  bind(...params: any[]): D1PreparedStatement {
    this.boundParams = params;
    return this as any;
  }

  async all(): Promise<D1Result> {
    // Simuler requête permissions RBAC
    if (this.query.includes('role_permissions') && this.query.includes('roles')) {
      const roleName = this.boundParams[0];
      const permissions = this.data.get(`permissions_${roleName}`) || [];
      
      return {
        results: permissions,
        success: true,
        meta: { duration: 0, rows_read: permissions.length, rows_written: 0 },
      } as any;
    }

    // Simuler requête users
    if (this.query.includes('FROM users')) {
      const users = this.data.get('users') || [];
      return {
        results: users,
        success: true,
        meta: { duration: 0, rows_read: users.length, rows_written: 0 },
      } as any;
    }

    // Simuler requête tickets
    if (this.query.includes('FROM tickets')) {
      const tickets = this.data.get('tickets') || [];
      return {
        results: tickets,
        success: true,
        meta: { duration: 0, rows_read: tickets.length, rows_written: 0 },
      } as any;
    }

    // Défaut: résultats vides
    return {
      results: [],
      success: true,
      meta: { duration: 0, rows_read: 0, rows_written: 0 },
    } as any;
  }

  async first<T = any>(): Promise<T | null> {
    const result = await this.all();
    return (result.results[0] as T) || null;
  }

  async run(): Promise<D1Result> {
    return {
      results: [],
      success: true,
      meta: { duration: 0, rows_read: 0, rows_written: 1, last_row_id: 1 },
    } as any;
  }
}

/**
 * Créer mock DB avec permissions RBAC pour tests
 */
export function createMockDBWithPermissions(): MockD1Database {
  const db = new MockD1Database();

  // Permissions admin (toutes permissions)
  db.addTestData('permissions_admin', [
    { resource: 'tickets', action: 'create', scope: 'all' },
    { resource: 'tickets', action: 'read', scope: 'all' },
    { resource: 'tickets', action: 'update', scope: 'all' },
    { resource: 'tickets', action: 'delete', scope: 'all' },
    { resource: 'users', action: 'create', scope: 'all' },
    { resource: 'users', action: 'read', scope: 'all' },
    { resource: 'users', action: 'update', scope: 'all' },
    { resource: 'users', action: 'delete', scope: 'all' },
  ]);

  // Permissions technician (limitées)
  db.addTestData('permissions_technician', [
    { resource: 'tickets', action: 'read', scope: 'all' },
    { resource: 'tickets', action: 'update', scope: 'own' },
    { resource: 'users', action: 'read', scope: 'all' },
  ]);

  // Permissions operator (lecture seule)
  db.addTestData('permissions_operator', [
    { resource: 'tickets', action: 'create', scope: 'all' },
    { resource: 'tickets', action: 'read', scope: 'all' },
  ]);

  return db;
}
