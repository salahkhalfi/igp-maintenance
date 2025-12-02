-- 0040_add_messages_delete_permissions.sql
-- Add granular delete permissions for messages (Chat Moderation)

-- 1. Create permissions
INSERT INTO permissions (name, slug, module, description) VALUES 
('Supprimer Messages (Tous)', 'messages.delete', 'messages', 'Supprimer n''importe quel message (Modération)'),
('Supprimer Ses Messages', 'messages.delete.own', 'messages', 'Supprimer uniquement ses propres messages');

-- 2. Assign 'messages.delete' (ALL) to Admin and Supervisor
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.slug IN ('admin', 'supervisor') 
AND p.slug = 'messages.delete';

-- 3. Assign 'messages.delete.own' to ALL roles (Chat standard behavior)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE p.slug = 'messages.delete.own';
