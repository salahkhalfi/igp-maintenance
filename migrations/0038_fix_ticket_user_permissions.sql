-- Fix missing permissions for Tickets and Users
-- 1. Add tickets.update
INSERT INTO permissions (name, slug, module, description) VALUES
('Modifier Tickets', 'tickets.update', 'tickets', 'Modifier les détails d''un ticket (titre, description)');

-- 2. Assign tickets.update
-- Admin, Supervisor, Technician
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.slug IN ('admin', 'supervisor', 'technician') 
AND p.slug = 'tickets.update';

-- 3. Give users.read to Technicians (so they can see the team)
INSERT INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE slug = 'technician'), id 
FROM permissions 
WHERE slug = 'users.read';

-- 4. Assign tickets.update to Operators (Own tickets only - logical check in code, but need base perm)
-- Actually, let's keeping Operators without specific update permission and rely on "tickets.create" implies ownership management?
-- No, let's give them tickets.update but the code limits to "own".
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.slug IN ('operator', 'team_leader', 'furnace_operator', 'quality_inspector', 'storekeeper') 
AND p.slug = 'tickets.update';
