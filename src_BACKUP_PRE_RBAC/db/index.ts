import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export interface Env {
  DB: D1Database;
}

// Helper to get the database client
export const getDb = (env: Env) => {
  return drizzle(env.DB, { schema });
};

// Type helpers
export type DbClient = ReturnType<typeof getDb>;
