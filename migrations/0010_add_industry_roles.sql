-- ================================================
-- MIGRATION: Ajout des 10 nouveaux rôles système
-- Date: 2025-11-07
-- Description: Ajout rôles typiques industrie fabrication
-- ================================================
-- 
-- RÔLES AJOUTÉS:
-- 1. director (Directeur Général)
-- 2. coordinator (Coordonnateur Maintenance)
-- 3. planner (Planificateur Maintenance)
-- 4. senior_technician (Technicien Senior)
-- 5. team_leader (Chef Équipe Production)
-- 6. furnace_operator (Opérateur Four)
-- 7. safety_officer (Agent Santé & Sécurité)
-- 8. quality_inspector (Inspecteur Qualité)
-- 9. storekeeper (Magasinier)
-- 10. viewer (Lecture Seule)
--
-- RÔLES EXISTANTS (conservés):
-- - admin
-- - supervisor
-- - technician
-- - operator
-- ================================================

-- ================================================
-- 1. DIRECTOR (Directeur Général / CEO)
-- ================================================
-- Permissions: Lecture complète, aucune modification directe
-- Use case: Vue d'ensemble, indicateurs, pas d'actions techniques

INSERT INTO roles (name, display_name, description, is_system) VALUES
('director', 'Directeur Général', 'Accès lecture complète pour direction exécutive - Vue d''ensemble et indicateurs sans modification', 1);

-- Permissions: Lecture seule tous les modules
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'director'),
  id
FROM permissions
WHERE action = 'read' AND scope = 'all';

-- ================================================
-- 2. COORDINATOR (Coordonnateur Maintenance)
-- ================================================
-- Permissions: Planification + coordination équipes
-- Use case: Interface entre supervision et techniciens

INSERT INTO roles (name, display_name, description, is_system) VALUES
('coordinator', 'Coordonnateur Maintenance', 'Coordination et planification des travaux de maintenance - Interface supervision-techniciens', 1);

-- Permissions tickets: création, lecture all, update (planning), assignation, commentaires, déplacement
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'coordinator'),
  id
FROM permissions
WHERE 
  (resource = 'tickets' AND action = 'create' AND scope = 'all') OR
  (resource = 'tickets' AND action = 'read' AND scope = 'all') OR
  (resource = 'tickets' AND action = 'update' AND scope = 'all') OR
  (resource = 'tickets' AND action = 'assign' AND scope = 'all') OR
  (resource = 'tickets' AND action = 'comment' AND scope = 'all') OR
  (resource = 'tickets' AND action = 'move' AND scope = 'all') OR
  -- Permissions machines: lecture + update (statut)
  (resource = 'machines' AND action = 'read' AND scope = 'all') OR
  (resource = 'machines' AND action = 'update' AND scope = 'all') OR
  -- Permissions messages: lecture + création publics
  (resource = 'messages' AND action = 'read' AND scope = 'all') OR
  (resource = 'messages' AND action = 'create' AND scope = 'public') OR
  -- Permissions media: upload
  (resource = 'media' AND action = 'upload' AND scope = 'all') OR
  -- Permissions users: lecture (pour assignation)
  (resource = 'users' AND action = 'read' AND scope = 'all');

-- ================================================
-- 3. PLANNER (Planificateur Maintenance)
-- ================================================
-- Permissions: Lecture globale + modification planning
-- Use case: Planification arrêts, coordination ressources

INSERT INTO roles (name, display_name, description, is_system) VALUES
('planner', 'Planificateur Maintenance', 'Planification des arrêts et coordination des ressources - Lecture globale avec gestion du planning', 1);

-- Permissions similaires coordinator mais sans delete
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'planner'),
  id
FROM permissions
WHERE 
  (resource = 'tickets' AND action IN ('create', 'read', 'update', 'assign', 'comment', 'move') AND scope = 'all') OR
  (resource = 'machines' AND action = 'read' AND scope = 'all') OR
  (resource = 'messages' AND action = 'read' AND scope = 'all') OR
  (resource = 'messages' AND action = 'create' AND scope = 'public') OR
  (resource = 'media' AND action = 'upload' AND scope = 'all') OR
  (resource = 'users' AND action = 'read' AND scope = 'all');

-- ================================================
-- 4. SENIOR_TECHNICIAN (Technicien Senior)
-- ================================================
-- Permissions: Comme technician + assignation tickets
-- Use case: Technicien principal avec supervision juniors

INSERT INTO roles (name, display_name, description, is_system) VALUES
('senior_technician', 'Technicien Senior', 'Technicien principal avec capacité de supervision et assignation - Expertise technique avancée', 1);

-- Permissions: Toutes celles du technician + assignation
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'senior_technician'),
  id
FROM permissions
WHERE 
  (resource = 'tickets' AND action IN ('create', 'read', 'update', 'assign', 'comment', 'move') AND scope = 'all') OR
  (resource = 'tickets' AND action = 'delete' AND scope = 'own') OR
  (resource = 'machines' AND action IN ('read', 'update') AND scope = 'all') OR
  (resource = 'messages' AND action = 'read' AND scope = 'all') OR
  (resource = 'messages' AND action IN ('create') AND scope IN ('public', 'private')) OR
  (resource = 'messages' AND action = 'delete' AND scope = 'own') OR
  (resource = 'media' AND action = 'upload' AND scope = 'all') OR
  (resource = 'media' AND action = 'delete' AND scope = 'own') OR
  (resource = 'users' AND action = 'read' AND scope = 'all');

-- ================================================
-- 5. TEAM_LEADER (Chef Équipe Production)
-- ================================================
-- Permissions: Création tickets + lecture globale
-- Use case: Interface production-maintenance

INSERT INTO roles (name, display_name, description, is_system) VALUES
('team_leader', 'Chef Équipe Production', 'Interface production-maintenance - Signalement pannes et suivi réparations pour son équipe', 1);

-- Permissions: Création tickets + lecture + commentaires
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'team_leader'),
  id
FROM permissions
WHERE 
  (resource = 'tickets' AND action = 'create' AND scope = 'all') OR
  (resource = 'tickets' AND action = 'read' AND scope = 'all') OR
  (resource = 'tickets' AND action = 'update' AND scope = 'own') OR
  (resource = 'tickets' AND action = 'comment' AND scope = 'all') OR
  (resource = 'machines' AND action = 'read' AND scope = 'all') OR
  (resource = 'messages' AND action = 'read' AND scope = 'all') OR
  (resource = 'messages' AND action = 'create' AND scope = 'public') OR
  (resource = 'media' AND action = 'upload' AND scope = 'all');

-- ================================================
-- 6. FURNACE_OPERATOR (Opérateur Four)
-- ================================================
-- Permissions: Création tickets four (priorité) + lecture
-- Use case: Opérateur équipement critique

INSERT INTO roles (name, display_name, description, is_system) VALUES
('furnace_operator', 'Opérateur Four', 'Opérateur équipement critique (four à verre) - Signalement prioritaire anomalies et suivi réparations', 1);

-- Permissions: Similaire operator mais avec lecture globale pour suivi four
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'furnace_operator'),
  id
FROM permissions
WHERE 
  (resource = 'tickets' AND action = 'create' AND scope = 'all') OR
  (resource = 'tickets' AND action = 'read' AND scope = 'all') OR
  (resource = 'tickets' AND action = 'update' AND scope = 'own') OR
  (resource = 'tickets' AND action = 'comment' AND scope = 'all') OR
  (resource = 'machines' AND action = 'read' AND scope = 'all') OR
  (resource = 'messages' AND action = 'read' AND scope = 'all') OR
  (resource = 'messages' AND action = 'create' AND scope = 'public') OR
  (resource = 'media' AND action = 'upload' AND scope = 'all');

-- ================================================
-- 7. SAFETY_OFFICER (Agent Santé & Sécurité)
-- ================================================
-- Permissions: Lecture complète + création prioritaire + blocage machines
-- Use case: Conformité SST, incidents, blocage équipements dangereux

INSERT INTO roles (name, display_name, description, is_system) VALUES
('safety_officer', 'Agent Santé & Sécurité', 'Responsable conformité SST - Signalement incidents, blocage équipements dangereux, audit sécurité', 1);

-- Permissions: Lecture complète + création tickets + update machines (blocage)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'safety_officer'),
  id
FROM permissions
WHERE 
  (resource = 'tickets' AND action IN ('create', 'read', 'comment') AND scope = 'all') OR
  (resource = 'machines' AND action IN ('read', 'update') AND scope = 'all') OR
  (resource = 'messages' AND action = 'read' AND scope = 'all') OR
  (resource = 'messages' AND action = 'create' AND scope = 'public') OR
  (resource = 'media' AND action = 'upload' AND scope = 'all') OR
  (resource = 'users' AND action = 'read' AND scope = 'all');

-- ================================================
-- 8. QUALITY_INSPECTOR (Inspecteur Qualité)
-- ================================================
-- Permissions: Lecture complète + création tickets qualité
-- Use case: Traçabilité qualité-maintenance

INSERT INTO roles (name, display_name, description, is_system) VALUES
('quality_inspector', 'Inspecteur Qualité', 'Traçabilité qualité-maintenance - Signalement défauts équipements et suivi historique machines', 1);

-- Permissions: Lecture complète + création tickets
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'quality_inspector'),
  id
FROM permissions
WHERE 
  (resource = 'tickets' AND action = 'create' AND scope = 'all') OR
  (resource = 'tickets' AND action = 'read' AND scope = 'all') OR
  (resource = 'tickets' AND action = 'comment' AND scope = 'all') OR
  (resource = 'machines' AND action = 'read' AND scope = 'all') OR
  (resource = 'messages' AND action = 'read' AND scope = 'all') OR
  (resource = 'messages' AND action = 'create' AND scope = 'public') OR
  (resource = 'media' AND action = 'upload' AND scope = 'all');

-- ================================================
-- 9. STOREKEEPER (Magasinier)
-- ================================================
-- Permissions: Lecture tickets + commentaires (disponibilité pièces)
-- Use case: Gestion inventaire pièces

INSERT INTO roles (name, display_name, description, is_system) VALUES
('storekeeper', 'Magasinier', 'Gestion inventaire pièces de rechange - Lecture tickets pour besoins et commentaires disponibilité', 1);

-- Permissions: Lecture tickets/machines + commentaires
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'storekeeper'),
  id
FROM permissions
WHERE 
  (resource = 'tickets' AND action IN ('read', 'comment') AND scope = 'all') OR
  (resource = 'machines' AND action = 'read' AND scope = 'all') OR
  (resource = 'messages' AND action = 'read' AND scope = 'all') OR
  (resource = 'messages' AND action = 'create' AND scope = 'public');

-- ================================================
-- 10. VIEWER (Lecture Seule)
-- ================================================
-- Permissions: Lecture complète, aucune modification
-- Use case: Auditeurs, stagiaires, consultants observateurs

INSERT INTO roles (name, display_name, description, is_system) VALUES
('viewer', 'Lecture Seule', 'Accès lecture seule complet - Pour auditeurs, stagiaires, consultants (aucune modification possible)', 1);

-- Permissions: Toutes les lectures possibles
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'viewer'),
  id
FROM permissions
WHERE action = 'read' AND scope = 'all';

-- ================================================
-- VERIFICATION POST-MIGRATION
-- ================================================
-- Vérifier que tous les rôles ont été créés
-- SELECT name, display_name, is_system FROM roles ORDER BY is_system DESC, name;

-- Compter les permissions par rôle
-- SELECT r.name, r.display_name, COUNT(rp.permission_id) as permissions_count
-- FROM roles r
-- LEFT JOIN role_permissions rp ON r.id = rp.role_id
-- GROUP BY r.id
-- ORDER BY r.is_system DESC, r.name;
