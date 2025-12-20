-- Revoke planning permissions from Technician role
DELETE FROM role_permissions 
WHERE role_id = (SELECT id FROM roles WHERE slug = 'technician')
AND permission_id IN (
    SELECT id FROM permissions WHERE slug IN ('planning.read', 'planning.manage')
);
