import { describe, it, expect, beforeEach } from 'vitest';
import auth from '../../../src/routes/auth';
import { createMockContext } from '../../fixtures/mock-hono';
import { hashPassword } from '../../../src/utils/password';

describe('routes/auth.ts - POST /register', () => {
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = createMockContext();
  });

  it('crée utilisateur avec données valides', async () => {
    const registerData = {
      email: 'test@example.com',
      password: 'SecurePass123',
      full_name: 'Test User',
      role: 'technician',
    };

    mockCtx.req.json = async () => registerData;

    // Mock DB responses
    mockCtx.env.DB.addTestData('users_check', []); // Aucun utilisateur existant
    mockCtx.env.DB.addTestData('users_created', [{
      id: 1,
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'technician',
      is_super_admin: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]);

    const handler = auth.routes.find(r => r.path === '/register' && r.method === 'POST');
    
    if (!handler) {
      throw new Error('Route /register not found');
    }

    const response = await handler.handler(mockCtx as any);
    
    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('token');
    expect(response.data.user.email).toBe('test@example.com');
  });

  it('rejette si email manquant', async () => {
    mockCtx.req.json = async () => ({
      password: 'test',
      full_name: 'Test',
      role: 'technician',
    });

    const handler = auth.routes.find(r => r.path === '/register' && r.method === 'POST');
    const response = await handler!.handler(mockCtx as any);

    expect(response.status).toBe(400);
    expect(response.data.error).toContain('requis');
  });

  it('rejette si email déjà utilisé', async () => {
    const registerData = {
      email: 'existing@example.com',
      password: 'test',
      full_name: 'Test',
      role: 'technician',
    };

    mockCtx.req.json = async () => registerData;

    // Mock: utilisateur existant
    mockCtx.env.DB.addTestData('users_check', [{ id: 999 }]);

    const handler = auth.routes.find(r => r.path === '/register' && r.method === 'POST');
    const response = await handler!.handler(mockCtx as any);

    expect(response.status).toBe(409);
    expect(response.data.error).toContain('déjà utilisé');
  });
});

describe('routes/auth.ts - POST /login', () => {
  let mockCtx: any;

  beforeEach(async () => {
    mockCtx = createMockContext();

    // Créer utilisateur test dans mock DB
    const passwordHash = await hashPassword('Password123');
    mockCtx.env.DB.addTestData('users', [{
      id: 1,
      email: 'user@example.com',
      password_hash: passwordHash,
      full_name: 'Test User',
      role: 'technician',
      is_super_admin: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]);
  });

  it('authentifie avec identifiants valides', async () => {
    mockCtx.req.json = async () => ({
      email: 'user@example.com',
      password: 'Password123',
    });

    const handler = auth.routes.find(r => r.path === '/login' && r.method === 'POST');
    
    if (!handler) {
      throw new Error('Route /login not found');
    }

    const response = await handler.handler(mockCtx as any);

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('token');
    expect(response.data.user.email).toBe('user@example.com');
  });

  it('rejette avec email invalide', async () => {
    mockCtx.req.json = async () => ({
      email: 'wrong@example.com',
      password: 'Password123',
    });

    const handler = auth.routes.find(r => r.path === '/login' && r.method === 'POST');
    const response = await handler!.handler(mockCtx as any);

    expect(response.status).toBe(401);
    expect(response.data.error).toContain('invalides');
  });

  it('rejette avec mot de passe invalide', async () => {
    mockCtx.req.json = async () => ({
      email: 'user@example.com',
      password: 'WrongPassword',
    });

    const handler = auth.routes.find(r => r.path === '/login' && r.method === 'POST');
    const response = await handler!.handler(mockCtx as any);

    expect(response.status).toBe(401);
    expect(response.data.error).toContain('invalides');
  });

  it('rejette si champs manquants', async () => {
    mockCtx.req.json = async () => ({
      email: 'user@example.com',
      // password manquant
    });

    const handler = auth.routes.find(r => r.path === '/login' && r.method === 'POST');
    const response = await handler!.handler(mockCtx as any);

    expect(response.status).toBe(400);
    expect(response.data.error).toContain('requis');
  });
});

describe('routes/auth.ts - GET /me', () => {
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = createMockContext();

    // Mock utilisateur authentifié (via middleware)
    mockCtx.set('user', {
      userId: 1,
      email: 'user@example.com',
      role: 'technician',
    });

    mockCtx.env.DB.addTestData('users', [{
      id: 1,
      email: 'user@example.com',
      full_name: 'Test User',
      role: 'technician',
      is_super_admin: 0,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]);
  });

  it('retourne infos utilisateur authentifié', async () => {
    const handler = auth.routes.find(r => r.path === '/me' && r.method === 'GET');
    
    if (!handler) {
      throw new Error('Route /me not found');
    }

    const response = await handler.handler(mockCtx as any);

    expect(response.status).toBe(200);
    expect(response.data.email).toBe('user@example.com');
    expect(response.data.role).toBe('technician');
  });

  it('rejette si utilisateur non trouvé', async () => {
    // Vider les utilisateurs
    mockCtx.env.DB.addTestData('users', []);

    const handler = auth.routes.find(r => r.path === '/me' && r.method === 'GET');
    const response = await handler!.handler(mockCtx as any);

    expect(response.status).toBe(404);
    expect(response.data.error).toContain('non trouvé');
  });
});
