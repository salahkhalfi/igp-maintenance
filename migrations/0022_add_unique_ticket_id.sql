-- Migration: Ajouter UNIQUE constraint sur ticket_id
-- Prévient les collisions d'ID en cas de race condition
-- Date: 2024-11-26

-- Vérifier qu'il n'y a pas de doublons existants avant d'ajouter la contrainte
-- Cette requête doit retourner 0 pour que la migration soit sûre
-- SELECT ticket_id, COUNT(*) as count 
-- FROM tickets 
-- GROUP BY ticket_id 
-- HAVING count > 1;

-- Créer un index UNIQUE sur ticket_id
-- Cela empêchera toute insertion de ticket avec un ID déjà existant
-- En cas de collision, l'INSERT échouera avec SQLITE_CONSTRAINT
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_ticket_id ON tickets(ticket_id);

-- Note: Si des doublons existent déjà dans la base, cette migration échouera
-- Dans ce cas, il faudra d'abord nettoyer les doublons manuellement:
-- 1. Identifier les doublons avec la requête ci-dessus
-- 2. Mettre à jour ou supprimer les tickets en doublon
-- 3. Relancer cette migration
