-- Add permissions for Settings, Notifications and Messages
-- Standardization of RBAC across all modules

-- 1. Insert Permissions
INSERT INTO permissions (name, slug, module, description) VALUES
-- Settings
('Gérer Paramètres', 'settings.manage', 'settings', 'Modifier la configuration du système'),

-- Notifications
('Gérer Notifications', 'notifications.manage', 'notifications', 'Envoyer et gérer les notifications push'),

-- Messages (Collaboration)
('Utiliser Messagerie', 'messages.use', 'messages', 'Envoyer et recevoir des messages');

-- 2. Assign Permissions to Roles

-- ADMIN: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE slug = 'admin'), id 
FROM permissions 
WHERE slug IN ('settings.manage', 'notifications.manage', 'messages.use');

-- SUPERVISOR: Notifications, Messages
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE slug = 'supervisor'), id 
FROM permissions 
WHERE slug IN ('notifications.manage', 'messages.use');

-- TECHNICIAN: Messages
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE slug = 'technician'), id 
FROM permissions 
WHERE slug IN ('messages.use');

-- ALL OTHER ROLES (Operators, etc): Messages
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.slug NOT IN ('admin', 'supervisor', 'technician')
AND p.slug = 'messages.use';
