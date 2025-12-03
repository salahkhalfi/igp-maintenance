import { sqliteTable, integer, text, index, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ... (Existing imports)

// --- NEW RBAC TABLES ---

export const roles = sqliteTable('roles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),      // ex: 'Électromécanicien'
  slug: text('slug').notNull().unique(),      // ex: 'electromecanicien' (pour usage interne)
  description: text('description'),           // ex: 'Responsable de la maintenance électrique'
  is_system: integer('is_system').default(0), // 1 = Impossible à supprimer (ex: Admin)
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const permissions = sqliteTable('permissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),      // ex: 'users.create', 'tickets.delete'
  description: text('description').notNull(), // ex: 'Créer un utilisateur'
  module: text('module').notNull(),           // ex: 'users', 'tickets', 'machines'
});

export const rolePermissions = sqliteTable('role_permissions', {
  role_id: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permission_id: integer('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.role_id, t.permission_id] }),
}));

// ... (Rest of the schema)