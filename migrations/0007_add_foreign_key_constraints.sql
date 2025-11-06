-- Migration 0007: Ajouter les contraintes de clés étrangères appropriées
-- SQLite ne supporte pas ALTER FOREIGN KEY directement, donc on doit recréer les tables

-- Stratégie de suppression:
-- 1. MACHINES -> RESTRICT (on ne peut pas supprimer une machine si elle a des tickets)
-- 2. USERS (reported_by) -> RESTRICT (on garde la traçabilité de qui a créé le ticket)
-- 3. USERS (assigned_to) -> SET NULL (le ticket reste mais perd son assigné)

-- NOTE: SQLite nécessite de recréer les tables pour modifier les contraintes FK
-- Cette migration sera appliquée lors de la prochaine réinitialisation de DB
-- Pour la production, nous ajouterons des validations dans l'API

-- Documentation des contraintes souhaitées:
-- tickets.machine_id -> ON DELETE RESTRICT (empêche suppression machine si tickets existent)
-- tickets.reported_by -> ON DELETE RESTRICT (empêche suppression user qui a créé des tickets)
-- tickets.assigned_to -> ON DELETE SET NULL (permet suppression user, met NULL dans tickets)
-- media.uploaded_by -> ON DELETE SET NULL (permet suppression user, garde les médias)
-- ticket_timeline.user_id -> ON DELETE SET NULL (permet suppression user, garde l'historique)

-- IMPORTANT: Comme SQLite ne permet pas ALTER CONSTRAINT facilement,
-- nous implémentons ces règles via validation dans les endpoints API
-- DELETE /api/machines/:id et DELETE /api/users/:id
