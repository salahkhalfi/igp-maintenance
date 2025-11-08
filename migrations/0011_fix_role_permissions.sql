-- ================================================
-- MIGRATION: Corrections permissions rôles industriels
-- Date: 2025-11-08
-- Description: Ajuster permissions pour réalité terrain
-- Référence: ROLE_PERMISSIONS_ANALYSIS.md
-- ================================================

-- IMPORTANT: Cette migration AJOUTE des permissions manquantes
-- Elle ne SUPPRIME rien, donc pas de risque de casser l'existant

-- ================================================
-- 1. TEAM_LEADER - Ajouter autonomie gestion workflow
-- ================================================
-- Problème: Chef d'équipe ne peut pas déplacer/gérer ses tickets
-- Solution: Ajouter move, update all, assign own

INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'team_leader'),
  id
FROM permissions
WHERE 
  (resource = 'tickets' AND action = 'move' AND scope = 'all') OR
  (resource = 'tickets' AND action = 'update' AND scope = 'all') OR
  (resource = 'tickets' AND action = 'assign' AND scope = 'all');

-- ================================================
-- 2. STOREKEEPER - Ajouter création tickets pièces
-- ================================================
-- Problème: Magasinier ne peut pas créer tickets pour pièces défectueuses
-- Solution: Ajouter create tickets + upload media

INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'storekeeper'),
  id
FROM permissions
WHERE 
  (resource = 'tickets' AND action = 'create' AND scope = 'all') OR
  (resource = 'media' AND action = 'upload' AND scope = 'all');

-- ================================================
-- 3. COORDINATOR - Ajouter suppression tickets
-- ================================================
-- Problème: Coordinateur ne peut pas supprimer doublons/erreurs
-- Solution: Ajouter delete tickets

INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'coordinator'),
  id
FROM permissions
WHERE resource = 'tickets' AND action = 'delete' AND scope = 'all';

-- ================================================
-- 4. PLANNER - Ajouter suppression tickets
-- ================================================
-- Problème: Planificateur ne peut pas nettoyer tickets obsolètes
-- Solution: Ajouter delete tickets

INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'planner'),
  id
FROM permissions
WHERE resource = 'tickets' AND action = 'delete' AND scope = 'all';

-- ================================================
-- 5. FURNACE_OPERATOR - Harmoniser avec operator
-- ================================================
-- Problème: Furnace operator moins autonome que operator standard
-- Solution: Ajouter delete own (tickets, messages, media)

INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'furnace_operator'),
  id
FROM permissions
WHERE 
  (resource = 'tickets' AND action = 'delete' AND scope = 'own') OR
  (resource = 'messages' AND action = 'delete' AND scope = 'own') OR
  (resource = 'media' AND action = 'delete' AND scope = 'own');

-- ================================================
-- VERIFICATION POST-MIGRATION
-- ================================================
-- Vérifier les nouveaux comptages de permissions:
-- 
-- SELECT r.name, r.display_name, COUNT(rp.permission_id) as permissions
-- FROM roles r
-- LEFT JOIN role_permissions rp ON r.id = rp.role_id
-- WHERE r.name IN ('team_leader', 'storekeeper', 'coordinator', 'planner', 'furnace_operator')
-- GROUP BY r.id;
--
-- Résultats attendus:
-- - team_leader: 8 → 11 permissions (+3)
-- - storekeeper: 5 → 7 permissions (+2)
-- - coordinator: 12 → 13 permissions (+1)
-- - planner: 11 → 12 permissions (+1)
-- - furnace_operator: 8 → 11 permissions (+3)
