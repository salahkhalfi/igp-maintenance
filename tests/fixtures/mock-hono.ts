/**
 * Mock Hono Context pour tests intégration routes
 */

import type { Context } from 'hono';
import { MockD1Database } from './mock-db';

export interface MockEnv {
  DB: MockD1Database;
  MEDIA_BUCKET?: any;
  JWT_SECRET?: string;
  CRON_SECRET?: string;
}

export class MockHonoContext {
  public env: MockEnv;
  public req: any;
  public res: any;
  private _json: any = null;
  private _status: number = 200;
  private _headers: Record<string, string> = {};
  private _variables: Map<string, any> = new Map();

  constructor(env: MockEnv, reqOptions?: { method?: string; body?: any; headers?: Record<string, string> }) {
    this.env = env;
    
    // Mock request
    this.req = {
      json: async () => reqOptions?.body || {},
      header: (name: string) => reqOptions?.headers?.[name] || null,
      param: (name: string) => {
        // Extraire param depuis URL ou mock
        return (this.req as any)[`_param_${name}`] || null;
      },
      query: (name: string) => {
        return (this.req as any)[`_query_${name}`] || null;
      },
    };

    // Mock response
    this.res = {};
  }

  // Simuler c.json()
  json(data: any, status: number = 200): any {
    this._json = data;
    this._status = status;
    return {
      status: this._status,
      data: this._json,
    };
  }

  // Simuler c.text()
  text(text: string, status: number = 200): any {
    this._json = text;
    this._status = status;
    return {
      status: this._status,
      data: text,
    };
  }

  // Simuler c.notFound()
  notFound(): any {
    return this.json({ error: 'Not found' }, 404);
  }

  // Simuler c.header()
  header(name: string, value: string): void {
    this._headers[name] = value;
  }

  // Simuler c.status()
  status(code: number): this {
    this._status = code;
    return this;
  }

  // Simuler c.get() - pour récupérer variables middleware
  get(key: string): any {
    return this._variables.get(key);
  }

  // Simuler c.set() - pour stocker variables middleware
  set(key: string, value: any): void {
    this._variables.set(key, value);
  }

  // Helper pour récupérer résultat
  getResponse(): { status: number; data: any; headers: Record<string, string> } {
    return {
      status: this._status,
      data: this._json,
      headers: this._headers,
    };
  }

  // Helper pour ajouter param URL
  setParam(name: string, value: string): void {
    (this.req as any)[`_param_${name}`] = value;
  }

  // Helper pour ajouter query string
  setQuery(name: string, value: string): void {
    (this.req as any)[`_query_${name}`] = value;
  }

  // Helper pour ajouter header request
  setHeader(name: string, value: string): void {
    if (!this.req.headers) {
      this.req.headers = {};
    }
    this.req.headers[name] = value;
  }
}

/**
 * Créer mock context avec DB pré-configurée
 */
export function createMockContext(options?: {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  env?: Partial<MockEnv>;
}): MockHonoContext {
  const defaultEnv: MockEnv = {
    DB: new MockD1Database(),
    JWT_SECRET: 'test_jwt_secret_12345',
    CRON_SECRET: 'test_cron_secret',
  };

  const env = { ...defaultEnv, ...options?.env };

  return new MockHonoContext(env, {
    method: options?.method,
    body: options?.body,
    headers: options?.headers,
  });
}
