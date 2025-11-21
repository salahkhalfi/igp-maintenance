-- =============================================================================
-- DONNÉES DE TEST: Cleanup des Subscriptions Inactives >30 Jours
-- =============================================================================
-- Objectif: Créer des subscriptions de test avec différents niveaux d'inactivité
-- =============================================================================

-- Insertion de subscriptions de test avec dates variées
-- Note: On utilise datetime('now', '-X days') pour créer des dates dans le passé

-- 1. Subscription ACTIVE (2 jours d'inactivité) - NE DOIT PAS être supprimée
INSERT OR IGNORE INTO push_subscriptions 
(user_id, endpoint, p256dh, auth, device_type, device_name, created_at, last_used)
VALUES (
  1,
  'https://fcm.googleapis.com/fcm/send/test-active-2days',
  'test_p256dh_active_2days',
  'test_auth_active_2days',
  'mobile',
  'TEST: Active 2 jours',
  datetime('now', '-2 days'),
  datetime('now', '-2 days')
);

-- 2. Subscription INACTIF 15 jours - NE DOIT PAS être supprimée (< 30 jours)
INSERT OR IGNORE INTO push_subscriptions 
(user_id, endpoint, p256dh, auth, device_type, device_name, created_at, last_used)
VALUES (
  1,
  'https://fcm.googleapis.com/fcm/send/test-inactive-15days',
  'test_p256dh_inactive_15days',
  'test_auth_inactive_15days',
  'mobile',
  'TEST: Inactif 15 jours',
  datetime('now', '-15 days'),
  datetime('now', '-15 days')
);

-- 3. Subscription INACTIF 35 jours - DOIT être supprimée (> 30 jours)
INSERT OR IGNORE INTO push_subscriptions 
(user_id, endpoint, p256dh, auth, device_type, device_name, created_at, last_used)
VALUES (
  2,
  'https://fcm.googleapis.com/fcm/send/test-inactive-35days',
  'test_p256dh_inactive_35days',
  'test_auth_inactive_35days',
  'desktop',
  'TEST: Inactif 35 jours',
  datetime('now', '-35 days'),
  datetime('now', '-35 days')
);

-- 4. Subscription INACTIF 60 jours - DOIT être supprimée (> 30 jours)
INSERT OR IGNORE INTO push_subscriptions 
(user_id, endpoint, p256dh, auth, device_type, device_name, created_at, last_used)
VALUES (
  2,
  'https://fcm.googleapis.com/fcm/send/test-inactive-60days',
  'test_p256dh_inactive_60days',
  'test_auth_inactive_60days',
  'mobile',
  'TEST: Inactif 60 jours',
  datetime('now', '-60 days'),
  datetime('now', '-60 days')
);

-- 5. Subscription INACTIF 90 jours - DOIT être supprimée (> 30 jours)
INSERT OR IGNORE INTO push_subscriptions 
(user_id, endpoint, p256dh, auth, device_type, device_name, created_at, last_used)
VALUES (
  6,
  'https://fcm.googleapis.com/fcm/send/test-inactive-90days',
  'test_p256dh_inactive_90days',
  'test_auth_inactive_90days',
  'desktop',
  'TEST: Inactif 90 jours',
  datetime('now', '-90 days'),
  datetime('now', '-90 days')
);

-- VÉRIFICATION: Afficher toutes les subscriptions avec leur statut
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

-- RÉSULTAT ATTENDU:
-- ✅ 2 subscriptions actives (2 et 15 jours) - NE SERONT PAS supprimées
-- 🗑️ 3 subscriptions inactives (35, 60, 90 jours) - SERONT supprimées
