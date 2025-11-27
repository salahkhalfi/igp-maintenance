-- ==================================================================================
-- Migration 0027: Add Performance Indexes
-- Date: 2025-11-27
-- Version: v2.9.14
-- ==================================================================================
--
-- OBJECTIF: Optimiser les performances des requêtes fréquentes
-- 
-- CONTEXTE:
--   - Stress test v2.9.13 a révélé:
--     * API Tickets: 2,562ms latence moyenne (5x l'objectif de 500ms)
--     * API Machines: 2,320ms latence moyenne (8x l'objectif de 300ms)
--   - Analyse SQL montre que GET /api/tickets utilise DÉJÀ des JOINs optimisés
--   - PROBLÈME: Absence d'indexes sur les foreign keys utilisées dans JOINs
--
-- SOLUTION: Ajouter indexes sur:
--   1. Foreign keys (tickets.machine_id, tickets.reported_by, tickets.assigned_to)
--   2. Colonnes de filtrage (tickets.status, tickets.priority)
--   3. Colonnes de tri (tickets.created_at)
--
-- GAIN ESTIMÉ: 40-60% réduction latence (2,500ms → 1,000-1,500ms)
--
-- SÉCURITÉ:
--   - IF NOT EXISTS: Pas d'erreur si index existe déjà
--   - Indexes = lecture plus rapide, écriture légèrement plus lente (acceptable)
--   - Rollback: DROP INDEX si problème (voir procédure en fin de fichier)
--
-- ==================================================================================

-- ==================================================================================
-- 1. INDEXES SUR FOREIGN KEYS (Optimiser JOINs)
-- ==================================================================================

-- Index pour tickets.machine_id (JOIN avec machines)
-- Impact: Ligne 23 tickets.ts: LEFT JOIN machines m ON t.machine_id = m.id
CREATE INDEX IF NOT EXISTS idx_tickets_machine_id ON tickets(machine_id);

-- Index pour tickets.reported_by (JOIN avec users pour reporter_name)
-- Impact: Ligne 24 tickets.ts: LEFT JOIN users u1 ON t.reported_by = u1.id
CREATE INDEX IF NOT EXISTS idx_tickets_reported_by ON tickets(reported_by);

-- Index pour tickets.assigned_to (JOIN avec users pour assignee_name)
-- Impact: Ligne 25 tickets.ts: LEFT JOIN users u2 ON t.assigned_to = u2.id
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);

-- ==================================================================================
-- 2. INDEXES SUR COLONNES DE FILTRAGE (Optimiser WHERE clauses)
-- ==================================================================================

-- Index pour tickets.status (Filtrage très fréquent)
-- Impact: Lignes 31-33 tickets.ts: WHERE t.status = ?
-- Exemples: status='in_progress', status='completed', etc.
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- Index pour tickets.priority (Filtrage occasionnel)
-- Impact: Lignes 36-38 tickets.ts: WHERE t.priority = ?
-- Exemples: priority='high', priority='urgent'
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);

-- ==================================================================================
-- 3. INDEX SUR COLONNE DE TRI (Optimiser ORDER BY)
-- ==================================================================================

-- Index pour tickets.created_at (Tri par défaut)
-- Impact: Ligne 41 tickets.ts: ORDER BY t.created_at DESC
-- Note: DESC important pour optimiser le tri descendant
CREATE INDEX IF NOT EXISTS idx_tickets_created_at_desc ON tickets(created_at DESC);

-- ==================================================================================
-- 4. INDEXES POUR TIMELINE (Optimiser historique tickets)
-- ==================================================================================

-- Index pour ticket_timeline.ticket_id (Récupérer timeline d'un ticket)
-- Impact: Ligne 85+ tickets.ts: SELECT ... FROM ticket_timeline WHERE ticket_id = ?
CREATE INDEX IF NOT EXISTS idx_timeline_ticket_id ON ticket_timeline(ticket_id);

-- Index pour ticket_timeline.created_at (Tri chronologique timeline)
-- Impact: ORDER BY created_at DESC dans queries timeline
CREATE INDEX IF NOT EXISTS idx_timeline_created_at_desc ON ticket_timeline(created_at DESC);

-- ==================================================================================
-- 5. INDEX POUR MEDIA (Optimiser chargement fichiers attachés)
-- ==================================================================================

-- Index pour media.ticket_id (Récupérer médias d'un ticket)
-- Impact: Ligne 80-81 tickets.ts: SELECT * FROM media WHERE ticket_id = ?
-- Impact: Ligne 21 tickets.ts: COUNT(*) FROM media WHERE media.ticket_id = t.id
CREATE INDEX IF NOT EXISTS idx_media_ticket_id ON media(ticket_id);

-- Index composite pour media (ticket_id + created_at DESC)
-- Impact: Ligne 81: ORDER BY created_at DESC dans queries media
CREATE INDEX IF NOT EXISTS idx_media_ticket_created ON media(ticket_id, created_at DESC);

-- ==================================================================================
-- 6. INDEXES POUR USERS (Optimiser lookups utilisateurs)
-- ==================================================================================

-- Index pour users.email (Login + lookups fréquents)
-- Note: Vérifie si existe déjà (migrations précédentes)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index pour users.role (Filtrage par rôle dans admin)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ==================================================================================
-- 7. INDEXES POUR MACHINES (Optimiser gestion parc)
-- ==================================================================================

-- Index pour machines.location (Filtrage par emplacement)
CREATE INDEX IF NOT EXISTS idx_machines_location ON machines(location);

-- Index pour machines.machine_type (Filtrage par type)
CREATE INDEX IF NOT EXISTS idx_machines_type ON machines(machine_type);

-- ==================================================================================
-- VÉRIFICATION POST-MIGRATION
-- ==================================================================================

-- Commande pour vérifier les indexes créés:
-- 
-- Local:
--   npx wrangler d1 execute webapp-production --local --command="
--     SELECT name, tbl_name, sql 
--     FROM sqlite_master 
--     WHERE type='index' AND name LIKE 'idx_%' 
--     ORDER BY tbl_name, name;
--   "
--
-- Production:
--   npx wrangler d1 execute webapp-production --command="
--     SELECT name, tbl_name, sql 
--     FROM sqlite_master 
--     WHERE type='index' AND name LIKE 'idx_%' 
--     ORDER BY tbl_name, name;
--   "

-- ==================================================================================
-- ROLLBACK PROCEDURE (En cas de problème)
-- ==================================================================================
--
-- Si les indexes causent des problèmes (peu probable), les supprimer:
--
-- DROP INDEX IF EXISTS idx_tickets_machine_id;
-- DROP INDEX IF EXISTS idx_tickets_reported_by;
-- DROP INDEX IF EXISTS idx_tickets_assigned_to;
-- DROP INDEX IF EXISTS idx_tickets_status;
-- DROP INDEX IF EXISTS idx_tickets_priority;
-- DROP INDEX IF EXISTS idx_tickets_created_at_desc;
-- DROP INDEX IF EXISTS idx_timeline_ticket_id;
-- DROP INDEX IF EXISTS idx_timeline_created_at_desc;
-- DROP INDEX IF EXISTS idx_media_ticket_id;
-- DROP INDEX IF EXISTS idx_media_ticket_created;
-- DROP INDEX IF EXISTS idx_users_email;
-- DROP INDEX IF EXISTS idx_users_role;
-- DROP INDEX IF EXISTS idx_machines_location;
-- DROP INDEX IF EXISTS idx_machines_type;
--
-- ==================================================================================
-- FIN MIGRATION 0027
-- ==================================================================================
