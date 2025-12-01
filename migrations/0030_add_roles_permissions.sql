-- 1. Add roles management permissions
INSERT INTO permissions (name, slug, module, description) VALUES
('Voir Rôles', 'roles.read', 'roles', 'Voir la liste des rôles'),
('Gérer Rôles', 'roles.write', 'roles', 'Créer/Modifier/Supprimer des rôles');

-- 2. Assign to Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE slug = 'admin'), id FROM permissions WHERE slug IN ('roles.read', 'roles.write');
