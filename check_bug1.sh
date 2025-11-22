#!/bin/bash
echo "============================================"
echo "🔍 BUG #1 TEST - État après création ticket"
echo "============================================"
echo ""

npx wrangler d1 execute maintenance-db --remote --command="
SELECT '=== PUSH_LOGS (derniers 5 pour Brahim) ===' as info;
SELECT id, user_id, ticket_id, status, created_at 
FROM push_logs 
WHERE user_id = 6 
ORDER BY created_at DESC 
LIMIT 5;

SELECT '';
SELECT '=== PENDING_NOTIFICATIONS (Brahim) ===' as info;
SELECT id, user_id, title, body, sent_to_endpoints, created_at 
FROM pending_notifications 
WHERE user_id = 6;

SELECT '';
SELECT '=== SUBSCRIPTIONS (Brahim) ===' as info;
SELECT COUNT(*) as count FROM push_subscriptions WHERE user_id = 6;
"
