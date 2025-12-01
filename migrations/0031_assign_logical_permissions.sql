-- Configuration logique des permissions par métier

-- 1. Nettoyage préalable (sauf Admin) pour éviter les doublons
DELETE FROM role_permissions WHERE role_id != (SELECT id FROM roles WHERE slug = 'admin');

-- 2. DIRECTEUR & LECTURE SEULE (Vision Globale)
-- Peut tout voir (Tickets, Utilisateurs, Rôles) mais ne rien modifier
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.slug IN ('director', 'viewer') 
AND p.slug LIKE '%.read';

-- 3. SUPERVISEUR, COORDONNATEUR, PLANIFICATEUR (Gestion Maintenance)
-- Accès complet aux Tickets (Créer, Assigner, Fermer) + Voir les utilisateurs
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.slug IN ('supervisor', 'coordinator', 'planner') 
AND (p.module = 'tickets' OR p.slug = 'users.read');

-- 4. TECHNICIENS (Exécution)
-- Voir, Créer (signalement) et Fermer (résolution) les tickets
-- Note: Ils ne peuvent pas "Assigner" (rôle du superviseur)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.slug IN ('technician', 'senior_technician') 
AND p.slug IN ('tickets.read', 'tickets.create', 'tickets.close');

-- 5. PRODUCTION & SUPPORT (Signalement)
-- Opérateurs, Qualité, Sécurité, Magasinier
-- Peuvent uniquement Voir et Créer des tickets (signaler un problème)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.slug IN ('operator', 'team_leader', 'furnace_operator', 'safety_officer', 'quality_inspector', 'storekeeper') 
AND p.slug IN ('tickets.read', 'tickets.create');
