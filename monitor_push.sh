#!/bin/bash

echo "============================================"
echo "🔔 PUSH NOTIFICATION MONITOR"
echo "============================================"
echo ""

DB_PATH=$(find .wrangler/state/v3/d1/miniflare-D1DatabaseObject -name "*.sqlite" 2>/dev/null | head -1)

if [ -z "$DB_PATH" ]; then
  echo "❌ Database not found! Is wrangler running?"
  exit 1
fi

echo "📂 Database: $DB_PATH"
echo ""

# Function to display table
print_section() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "$1"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 1. Latest push_logs for Brahim
print_section "📊 LATEST PUSH LOGS (Brahim - user_id=6)"
sqlite3 -column -header "$DB_PATH" <<SQL
SELECT 
  id,
  user_id,
  ticket_id,
  status,
  substr(error_message, 1, 50) as error,
  created_at
FROM push_logs
WHERE user_id = 6
ORDER BY created_at DESC
LIMIT 10;
SQL

# 2. Pending notifications for Brahim
print_section "📬 PENDING NOTIFICATIONS (Brahim - user_id=6)"
sqlite3 -column -header "$DB_PATH" <<SQL
SELECT 
  id,
  user_id,
  substr(title, 1, 30) as title,
  substr(body, 1, 40) as body,
  created_at
FROM pending_notifications
WHERE user_id = 6
ORDER BY created_at DESC;
SQL

# 3. Active subscriptions for Brahim
print_section "📱 ACTIVE SUBSCRIPTIONS (Brahim - user_id=6)"
sqlite3 -column -header "$DB_PATH" <<SQL
SELECT 
  id,
  user_id,
  device_type,
  device_name,
  substr(endpoint, 1, 50) as endpoint,
  last_used
FROM push_subscriptions
WHERE user_id = 6
ORDER BY last_used DESC;
SQL

# 4. Latest tickets assigned to Brahim
print_section "🎫 LATEST TICKETS (assigned to Brahim)"
sqlite3 -column -header "$DB_PATH" <<SQL
SELECT 
  id,
  ticket_id,
  substr(title, 1, 30) as title,
  status,
  priority,
  assigned_to,
  created_at
FROM tickets
WHERE assigned_to = 6
ORDER BY created_at DESC
LIMIT 5;
SQL

# 5. Push logs count by status
print_section "📈 PUSH LOGS STATISTICS"
sqlite3 -column -header "$DB_PATH" <<SQL
SELECT 
  status,
  COUNT(*) as count
FROM push_logs
WHERE user_id = 6
GROUP BY status;
SQL

echo ""
echo "============================================"
echo "⏱️  Last updated: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
