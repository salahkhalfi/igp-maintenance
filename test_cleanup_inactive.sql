-- =============================================================================
-- SCRIPT DE TEST: Cleanup des Subscriptions Inactives >30 Jours
-- =============================================================================
-- Date: 2025-11-21
-- Objectif: Tester la logique de cleanup avant implémentation en production
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. État actuel: Toutes les subscriptions avec calcul jours d'inactivité
-- -----------------------------------------------------------------------------
SELECT 
  id,
  user_id,
  device_name,
  created_at,
  last_used,
  julianday('now') - julianday(last_used) as days_inactive,
  CASE 
    WHEN julianday('now') - julianday(last_used) > 30 THEN '🗑️ À SUPPRIMER'
    WHEN julianday('now') - julianday(last_used) > 7 THEN '⚠️ INACTIF 7+ jours'
    ELSE '✅ ACTIF'
  END as status
FROM push_subscriptions
ORDER BY last_used ASC;

-- -----------------------------------------------------------------------------
-- 2. Identifier les subscriptions qui SERAIENT supprimées (>30 jours)
-- -----------------------------------------------------------------------------
SELECT 
  id,
  user_id,
  device_name,
  created_at,
  last_used,
  julianday('now') - julianday(last_used) as days_inactive
FROM push_subscriptions
WHERE julianday('now') - julianday(last_used) > 30
ORDER BY last_used ASC;

-- -----------------------------------------------------------------------------
-- 3. Compter les subscriptions par catégorie
-- -----------------------------------------------------------------------------
SELECT 
  COUNT(CASE WHEN julianday('now') - julianday(last_used) <= 7 THEN 1 END) as actives_7jours,
  COUNT(CASE WHEN julianday('now') - julianday(last_used) BETWEEN 7 AND 30 THEN 1 END) as inactives_7_30jours,
  COUNT(CASE WHEN julianday('now') - julianday(last_used) > 30 THEN 1 END) as inactives_30plus_jours,
  COUNT(*) as total
FROM push_subscriptions;

-- -----------------------------------------------------------------------------
-- 4. Détail par utilisateur
-- -----------------------------------------------------------------------------
SELECT 
  u.id,
  u.email,
  COUNT(ps.id) as total_devices,
  COUNT(CASE WHEN julianday('now') - julianday(ps.last_used) > 30 THEN 1 END) as devices_a_supprimer,
  MIN(julianday('now') - julianday(ps.last_used)) as min_days_inactive,
  MAX(julianday('now') - julianday(ps.last_used)) as max_days_inactive
FROM users u
LEFT JOIN push_subscriptions ps ON u.id = ps.user_id
WHERE ps.id IS NOT NULL
GROUP BY u.id
ORDER BY devices_a_supprimer DESC, total_devices DESC;

-- -----------------------------------------------------------------------------
-- 5. TEST DE SUPPRESSION (DRY-RUN) - Simulation sans suppression réelle
-- -----------------------------------------------------------------------------
-- Cette requête montre CE QUI SERAIT SUPPRIMÉ sans le faire réellement
SELECT 
  'SIMULATION: Suppression de ' || COUNT(*) || ' subscription(s) inactive(s) >30 jours' as action,
  GROUP_CONCAT(device_name || ' (user_id:' || user_id || ', ' || 
    CAST(julianday('now') - julianday(last_used) AS INT) || ' jours)', ', ') as devices_concernés
FROM push_subscriptions
WHERE julianday('now') - julianday(last_used) > 30;

-- -----------------------------------------------------------------------------
-- 6. COMMANDE DE SUPPRESSION RÉELLE (À UTILISER AVEC PRÉCAUTION)
-- -----------------------------------------------------------------------------
-- ⚠️ ATTENTION: Cette commande SUPPRIME réellement les données!
-- ⚠️ À n'utiliser qu'après validation du résultat de la requête #5
-- 
-- DELETE FROM push_subscriptions 
-- WHERE julianday('now') - julianday(last_used) > 30;
-- 
-- -- Vérifier le nombre de lignes supprimées:
-- SELECT changes() as rows_deleted;

-- -----------------------------------------------------------------------------
-- 7. Vérification post-cleanup (à exécuter APRÈS la suppression)
-- -----------------------------------------------------------------------------
-- SELECT 
--   'Vérification post-cleanup: ' || COUNT(*) || ' subscription(s) restante(s)' as status
-- FROM push_subscriptions;
-- 
-- SELECT 
--   id, user_id, device_name, last_used,
--   julianday('now') - julianday(last_used) as days_inactive
-- FROM push_subscriptions
-- ORDER BY last_used ASC;

-- =============================================================================
-- NOTES D'UTILISATION:
-- =============================================================================
-- 1. Exécuter les requêtes 1-5 pour analyser l'état AVANT cleanup
-- 2. Vérifier que les devices à supprimer sont bien inactifs >30 jours
-- 3. Si OK, décommenter et exécuter la requête #6 (suppression réelle)
-- 4. Exécuter la requête #7 pour vérifier l'état post-cleanup
-- 
-- SEUIL DE DÉCISION:
-- - Si aucune subscription >30 jours: Pas de cleanup nécessaire (normal)
-- - Si <5 subscriptions >30 jours: Cleanup manuel acceptable
-- - Si >5 subscriptions >30 jours: Cleanup automatique justifié
-- =============================================================================
