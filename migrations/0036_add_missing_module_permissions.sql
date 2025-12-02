-- Add missing module permissions for RBAC
-- Supports Planning, Machines, and Statistics

-- 1. Insert Permissions
INSERT INTO permissions (name, slug, module, description) VALUES
-- Planning
('Voir Planning', 'planning.read', 'planning', 'Voir le calendrier de production'),
('Gérer Planning', 'planning.manage', 'planning', 'Créer, modifier et supprimer des événements'),
('Gérer Catégories', 'planning.categories', 'planning', 'Gérer les catégories du planning'),

-- Machines
('Voir Machines', 'machines.read', 'machines', 'Voir la liste des machines'),
('Créer Machines', 'machines.create', 'machines', 'Ajouter une nouvelle machine'),
('Modifier Machines', 'machines.update', 'machines', 'Modifier les détails d''une machine'),
('Supprimer Machines', 'machines.delete', 'machines', 'Supprimer une machine'),

-- Statistics
('Voir Statistiques', 'stats.read', 'statistics', 'Voir les tableaux de bord statistiques');

-- 2. Assign Permissions to Roles

-- ADMIN: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE slug = 'admin'), id 
FROM permissions 
WHERE slug IN (
  'planning.read', 'planning.manage', 'planning.categories',
  'machines.read', 'machines.create', 'machines.update', 'machines.delete',
  'stats.read'
);

-- SUPERVISOR: Planning (All), Machines (Read/Update), Stats (Read)
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE slug = 'supervisor'), id 
FROM permissions 
WHERE slug IN (
  'planning.read', 'planning.manage', 'planning.categories',
  'machines.read', 'machines.update',
  'stats.read'
);

-- TECHNICIAN: Planning (Manage), Machines (Read/Update)
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE slug = 'technician'), id 
FROM permissions 
WHERE slug IN (
  'planning.read', 'planning.manage',
  'machines.read', 'machines.update'
);

-- OPERATOR (and others): Read Only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.slug IN ('operator', 'team_leader', 'furnace_operator', 'quality_inspector', 'storekeeper') 
AND p.slug IN ('planning.read', 'machines.read');
