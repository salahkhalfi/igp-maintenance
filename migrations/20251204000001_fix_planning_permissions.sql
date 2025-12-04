-- Assign planning.manage permission to Admin (1) and Director (2)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions 
WHERE slug = 'planning.manage' 
AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = 1 AND permission_id = permissions.id);

INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions 
WHERE slug = 'planning.manage' 
AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = 2 AND permission_id = permissions.id);
