-- ============================================================
-- MIGRATION: Backfill completed_at pour tickets fermés
-- DATE: 2024-12-28
-- AUTEUR: AI Assistant
-- ============================================================
-- 
-- PROBLÈME: Les tickets avec statut 'completed', 'resolved', 'closed'
-- n'ont pas tous un completed_at renseigné, ce qui empêche les rapports
-- IA de calculer le temps de résolution.
--
-- SOLUTION: Utiliser updated_at comme approximation de completed_at
-- pour les tickets fermés qui ont completed_at IS NULL.
--
-- ============================================================
-- 🛟 ROLLBACK (SI PROBLÈME):
-- 
-- UPDATE tickets 
-- SET completed_at = NULL 
-- WHERE completed_at IS NOT NULL 
-- AND status IN ('completed', 'resolved', 'closed')
-- AND date(completed_at) = date('now');
--
-- Note: Le rollback remet à NULL les tickets modifiés aujourd'hui.
-- Si exécuté un autre jour, ajuster la date.
-- ============================================================

-- Backfill: completed_at = updated_at pour tickets fermés sans date de complétion
UPDATE tickets 
SET completed_at = updated_at 
WHERE status IN ('completed', 'resolved', 'closed') 
AND completed_at IS NULL;
