-- Migration 0008: Système RBAC (Role-Based Access Control)
-- Permet la gestion flexible des rôles et permissions

-- ========================================
-- TABLE: roles
-- ========================================
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,                    -- Nom technique: admin, supervisor, etc.
  display_name TEXT NOT NULL,                   -- Nom affiché: Administrateur, Superviseur, etc.
  description TEXT,                             -- Description du rôle
  is_system INTEGER DEFAULT 0,                  -- 1 = rôle système (non supprimable), 0 = personnalisé
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLE: permissions
-- ========================================
CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource TEXT NOT NULL,                       -- tickets, machines, users, messages, media, roles
  action TEXT NOT NULL,                         -- create, read, update, delete, assign, move, upload, etc.
  scope TEXT NOT NULL,                          -- all, own, team, public, private
  display_name TEXT NOT NULL,                   -- Nom affiché pour l'UI
  description TEXT,                             -- Description détaillée
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(resource, action, scope)               -- Évite les doublons
);

-- ========================================
-- TABLE: role_permissions (many-to-many)
-- ========================================
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- ========================================
-- INDEX pour améliorer les performances
-- ========================================
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- ========================================
-- INSERTION DES RÔLES SYSTÈME
-- ========================================
INSERT INTO roles (name, display_name, description, is_system) VALUES
  ('admin', 'Administrateur', 'Accès complet au système, gestion des utilisateurs et des rôles', 1),
  ('supervisor', 'Superviseur', 'Gestion des tickets, machines et équipe (sauf admins)', 1),
  ('technician', 'Technicien', 'Intervention sur les tickets, déplacement et modification', 1),
  ('operator', 'Opérateur', 'Création et suivi de ses propres tickets uniquement', 1);

-- ========================================
-- INSERTION DES PERMISSIONS
-- ========================================

-- Permissions Tickets
INSERT INTO permissions (resource, action, scope, display_name, description) VALUES
  ('tickets', 'create', 'all', 'Créer des tickets', 'Permet de créer des tickets de maintenance'),
  ('tickets', 'read', 'all', 'Voir tous les tickets', 'Accès en lecture à tous les tickets'),
  ('tickets', 'read', 'own', 'Voir ses tickets', 'Accès uniquement à ses propres tickets'),
  ('tickets', 'update', 'all', 'Modifier tous les tickets', 'Modification complète de tous les tickets'),
  ('tickets', 'update', 'own', 'Modifier ses tickets', 'Modification uniquement de ses propres tickets'),
  ('tickets', 'delete', 'all', 'Supprimer tous les tickets', 'Suppression de n importe quel ticket'),
  ('tickets', 'delete', 'own', 'Supprimer ses tickets', 'Suppression uniquement de ses propres tickets'),
  ('tickets', 'assign', 'all', 'Assigner des tickets', 'Assigner des tickets à des techniciens'),
  ('tickets', 'move', 'all', 'Déplacer des tickets', 'Changer le statut/colonne des tickets'),
  ('tickets', 'comment', 'all', 'Commenter les tickets', 'Ajouter des commentaires sur les tickets');

-- Permissions Machines
INSERT INTO permissions (resource, action, scope, display_name, description) VALUES
  ('machines', 'create', 'all', 'Créer des machines', 'Ajouter de nouvelles machines au système'),
  ('machines', 'read', 'all', 'Voir les machines', 'Accès en lecture aux machines'),
  ('machines', 'update', 'all', 'Modifier les machines', 'Modification des informations machines'),
  ('machines', 'delete', 'all', 'Supprimer les machines', 'Suppression de machines (si aucun ticket)');

-- Permissions Users
INSERT INTO permissions (resource, action, scope, display_name, description) VALUES
  ('users', 'create', 'all', 'Créer des utilisateurs', 'Ajouter de nouveaux utilisateurs'),
  ('users', 'read', 'all', 'Voir les utilisateurs', 'Liste et détails des utilisateurs'),
  ('users', 'update', 'all', 'Modifier les utilisateurs', 'Modification email, nom, rôle'),
  ('users', 'delete', 'all', 'Supprimer les utilisateurs', 'Suppression d utilisateurs'),
  ('users', 'reset_password', 'all', 'Réinitialiser mots de passe', 'Changer le mot de passe d autres utilisateurs');

-- Permissions Messages
INSERT INTO permissions (resource, action, scope, display_name, description) VALUES
  ('messages', 'create', 'public', 'Messages publics', 'Envoyer des messages publics à l équipe'),
  ('messages', 'create', 'private', 'Messages privés', 'Envoyer des messages privés'),
  ('messages', 'read', 'all', 'Lire les messages', 'Accès aux messages publics et privés'),
  ('messages', 'delete', 'own', 'Supprimer ses messages', 'Supprimer ses propres messages'),
  ('messages', 'delete', 'all', 'Supprimer tous les messages', 'Supprimer n importe quel message');

-- Permissions Media
INSERT INTO permissions (resource, action, scope, display_name, description) VALUES
  ('media', 'upload', 'all', 'Uploader des médias', 'Ajouter photos/vidéos aux tickets'),
  ('media', 'delete', 'own', 'Supprimer ses médias', 'Supprimer ses propres uploads'),
  ('media', 'delete', 'all', 'Supprimer tous les médias', 'Supprimer n importe quel média');

-- Permissions Roles (super-admin)
INSERT INTO permissions (resource, action, scope, display_name, description) VALUES
  ('roles', 'create', 'all', 'Créer des rôles', 'Créer de nouveaux rôles personnalisés'),
  ('roles', 'read', 'all', 'Voir les rôles', 'Liste des rôles et permissions'),
  ('roles', 'update', 'all', 'Modifier les rôles', 'Modifier les permissions des rôles'),
  ('roles', 'delete', 'custom', 'Supprimer rôles personnalisés', 'Supprimer rôles non-système');

-- ========================================
-- ATTRIBUTION DES PERMISSIONS PAR RÔLE
-- ========================================

-- ADMIN: Toutes les permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin';

-- SUPERVISOR: Gestion complète sauf rôles/permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'supervisor'
  AND p.resource != 'roles'
  AND NOT (p.resource = 'users' AND p.action IN ('delete', 'reset_password'));

-- TECHNICIAN: Tickets complets, messages, media
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'technician'
  AND (
    (p.resource = 'tickets') OR
    (p.resource = 'machines' AND p.action = 'read') OR
    (p.resource = 'messages' AND p.scope != 'all') OR
    (p.resource = 'media' AND p.action IN ('upload', 'delete') AND p.scope = 'own') OR
    (p.resource = 'users' AND p.action = 'read')
  );

-- OPERATOR: Tickets limités (own), lecture machines, upload media
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'operator'
  AND (
    (p.resource = 'tickets' AND p.action IN ('create', 'read', 'update', 'delete', 'comment') AND p.scope IN ('all', 'own')) OR
    (p.resource = 'machines' AND p.action = 'read') OR
    (p.resource = 'media' AND p.action = 'upload') OR
    (p.resource = 'users' AND p.action = 'read')
  );
