-- Disable foreign keys during migration to avoid issues with re-creating tables
PRAGMA foreign_keys=OFF;

-- 0. Clean up legacy RBAC tables (from 0008/0010 conflicts)
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;

-- 1. Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id integer PRIMARY KEY AUTOINCREMENT,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  is_system integer DEFAULT 0,
  created_at text DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id integer PRIMARY KEY AUTOINCREMENT,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  module text NOT NULL,
  description text
);

-- 3. Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id integer NOT NULL,
  permission_id integer NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 4. Add role_id to users table (if not exists)
-- Since SQLite doesn't support IF NOT EXISTS for columns, we'll check if it fails or use a recreation strategy if needed.
-- Ideally, we just add the column. 
ALTER TABLE users ADD COLUMN role_id integer REFERENCES roles(id);

-- 5. Seed Base Roles (System Roles - Cannot be deleted)
-- Using specific slugs to match existing codebase
INSERT INTO roles (name, slug, description, is_system) VALUES 
('👑 Administrateur', 'admin', 'Accès complet au système', 1),
('📊 Directeur Général', 'director', 'Vision globale de l''usine', 1),
('⭐ Superviseur', 'supervisor', 'Gestion des équipes et tickets', 1),
('🎯 Coordonnateur Maintenance', 'coordinator', 'Planification et coordination', 1),
('📅 Planificateur Maintenance', 'planner', 'Gestion calendrier préventif', 1),
('🔧 Électromécanicien Senior', 'senior_technician', 'Technicien expert', 1),
('🔧 Électromécanicien', 'technician', 'Maintenance générale', 1),
('👔 Chef Équipe Production', 'team_leader', 'Responsable de ligne', 1),
('🔥 Opérateur Four', 'furnace_operator', 'Spécialiste Trempe', 1),
('👷 Opérateur Production', 'operator', 'Opérateur machine standard', 1),
('🛡️ Préventionniste SST', 'safety_officer', 'Santé et Sécurité au Travail', 1),
('✓ Inspecteur Qualité', 'quality_inspector', 'Contrôle qualité verre', 1),
('📦 Magasinier Technique', 'storekeeper', 'Gestion pièces de rechange', 1),
('👁️ Lecture Seule', 'viewer', 'Accès invité', 1);

-- 6. Migrate existing users to link to role_id
UPDATE users SET role_id = (SELECT id FROM roles WHERE slug = users.role);

-- 7. Fallback: if role not found, default to 'operator'
UPDATE users SET role_id = (SELECT id FROM roles WHERE slug = 'operator') WHERE role_id IS NULL;

-- 8. Seed Basic Permissions (Example set for future use)
INSERT INTO permissions (name, slug, module, description) VALUES
('Voir Utilisateurs', 'users.read', 'users', 'Voir la liste des utilisateurs'),
('Créer Utilisateurs', 'users.create', 'users', 'Créer un nouvel utilisateur'),
('Modifier Utilisateurs', 'users.update', 'users', 'Modifier un utilisateur existant'),
('Supprimer Utilisateurs', 'users.delete', 'users', 'Supprimer un utilisateur'),
('Voir Tickets', 'tickets.read', 'tickets', 'Voir les tickets'),
('Créer Tickets', 'tickets.create', 'tickets', 'Créer un ticket'),
('Assigner Tickets', 'tickets.assign', 'tickets', 'Assigner un ticket à un technicien'),
('Fermer Tickets', 'tickets.close', 'tickets', 'Fermer/Résoudre un ticket');

-- 9. Assign Permissions to Admin (All)
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE slug = 'admin'), id FROM permissions;

PRAGMA foreign_keys=ON;
