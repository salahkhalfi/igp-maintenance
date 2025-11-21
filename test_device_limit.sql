-- Script de test pour vérifier la limite 5 appareils
-- Ce script peut être exécuté sur la DB locale pour tester la logique

-- 1. Afficher le nombre de souscriptions par utilisateur AVANT
SELECT 
  u.id,
  u.email,
  u.full_name,
  COUNT(ps.id) as device_count,
  GROUP_CONCAT(ps.device_name, ' | ') as devices
FROM users u
LEFT JOIN push_subscriptions ps ON u.id = ps.user_id
WHERE u.id IN (1, 2, 6, 9)  -- Admin, Laurent, Brahim, Technicien
GROUP BY u.id
ORDER BY device_count DESC;

-- 2. Identifier les utilisateurs qui dépassent la limite
SELECT 
  u.id,
  u.email,
  COUNT(ps.id) as device_count,
  COUNT(ps.id) - 5 as excess_devices
FROM users u
LEFT JOIN push_subscriptions ps ON u.id = ps.user_id
GROUP BY u.id
HAVING COUNT(ps.id) > 5
ORDER BY device_count DESC;

-- 3. Voir les appareils les plus anciens par utilisateur (ceux qui seraient supprimés)
SELECT 
  u.id,
  u.email,
  ps.id as subscription_id,
  ps.device_name,
  ps.last_used,
  ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY ps.last_used ASC) as rank
FROM users u
LEFT JOIN push_subscriptions ps ON u.id = ps.user_id
WHERE ps.id IS NOT NULL
ORDER BY u.id, ps.last_used ASC;

-- 4. Simulation: Afficher ce qui serait supprimé pour Admin (user_id=1)
SELECT 
  ps.id,
  ps.device_name,
  ps.device_type,
  ps.last_used,
  'WOULD BE DELETED' as action
FROM push_subscriptions ps
WHERE ps.user_id = 1
  AND ps.id IN (
    SELECT id 
    FROM push_subscriptions 
    WHERE user_id = 1 
    ORDER BY last_used ASC 
    LIMIT (
      (SELECT COUNT(*) FROM push_subscriptions WHERE user_id = 1) - 5
    )
  )
ORDER BY ps.last_used ASC;

-- 5. Statistiques globales
SELECT 
  'Total Subscriptions' as metric,
  COUNT(*) as value
FROM push_subscriptions
UNION ALL
SELECT 
  'Users with Subscriptions',
  COUNT(DISTINCT user_id)
FROM push_subscriptions
UNION ALL
SELECT 
  'Users Exceeding Limit (>5)',
  COUNT(*)
FROM (
  SELECT user_id, COUNT(*) as cnt 
  FROM push_subscriptions 
  GROUP BY user_id 
  HAVING cnt > 5
)
UNION ALL
SELECT 
  'Average Devices per User',
  ROUND(CAST(COUNT(*) AS FLOAT) / COUNT(DISTINCT user_id), 2)
FROM push_subscriptions;
