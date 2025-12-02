-- 0039_add_ticket_delete_permissions.sql
-- Add granular delete permissions for tickets

-- 1. Create permissions
INSERT INTO permissions (name, slug, module, description) VALUES 
('Supprimer Tickets (Tous)', 'tickets.delete', 'tickets', 'Supprimer n''importe quel ticket'),
('Supprimer Ses Tickets', 'tickets.delete.own', 'tickets', 'Supprimer uniquement ses propres tickets');

-- 2. Assign 'tickets.delete' (ALL) to Admin and Supervisor
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.slug IN ('admin', 'supervisor') 
AND p.slug = 'tickets.delete';

-- 3. Assign 'tickets.delete.own' to Operators and other field roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.slug IN ('operator', 'technician', 'team_leader', 'furnace_operator', 'quality_inspector', 'storekeeper') 
AND p.slug = 'tickets.delete.own';

-- Note: Technicians also get 'own' delete, not 'all'. Only Admin/Supervisor can delete others' tickets.
