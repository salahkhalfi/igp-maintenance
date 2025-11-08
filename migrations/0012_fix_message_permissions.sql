-- ================================================
-- MIGRATION: Correction permissions messages
-- Date: 2025-11-08
-- Description: Ajouter permissions messages pour technician et operator
-- Référence: MESSAGE_PERMISSIONS_ANALYSIS.md
-- ================================================

-- CRITIQUE: technician et operator isolés du système de messagerie!

-- ================================================
-- 1. TECHNICIAN - Ajouter lecture messages
-- ================================================
-- Problème: Peut créer messages mais ne peut PAS les lire!
-- Solution: Ajouter messages.read (all)

INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'technician'),
  id
FROM permissions
WHERE resource = 'messages' AND action = 'read' AND scope = 'all';

-- ================================================
-- 2. OPERATOR - Ajouter permissions messages de base
-- ================================================
-- Problème: Aucune permission messages (isolé complètement)
-- Solution: Ajouter read, create public, delete own
-- (Harmoniser avec furnace_operator qui a ces permissions)

INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'operator'),
  id
FROM permissions
WHERE 
  (resource = 'messages' AND action = 'read' AND scope = 'all') OR
  (resource = 'messages' AND action = 'create' AND scope = 'public') OR
  (resource = 'messages' AND action = 'delete' AND scope = 'own');

-- ================================================
-- VERIFICATION POST-MIGRATION
-- ================================================
-- Vérifier les permissions messages:
-- 
-- SELECT r.name, p.action, p.scope 
-- FROM roles r 
-- JOIN role_permissions rp ON r.id = rp.role_id 
-- JOIN permissions p ON rp.permission_id = p.id 
-- WHERE p.resource = 'messages' 
-- AND r.name IN ('technician', 'operator')
-- ORDER BY r.name, p.action, p.scope;
--
-- Résultats attendus:
-- technician: create (private), create (public), delete (own), read (all)
-- operator: create (public), delete (own), read (all)
