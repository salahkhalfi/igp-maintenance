#!/bin/bash
API_URL="https://8672c339.webapp-7t8.pages.dev"
EMAIL="stress@igp.com"
PASS="stress"
HASH="f43dc8790ed6215684924d362753e3864cb66c0f06084e89ad36b57e15986c6e"

echo "1. Creating Stress Admin User..."
npx wrangler d1 execute maintenance-db --remote --command="INSERT INTO users (email, password_hash, full_name, role) VALUES ('$EMAIL', '$HASH', 'Stress Admin', 'admin')"

echo "2. Logging in..."
LOGIN_RES=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")

TOKEN=$(echo $LOGIN_RES | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login Failed:"
  echo $LOGIN_RES
  
  echo "Cleaning up user..."
  npx wrangler d1 execute maintenance-db --remote --command="DELETE FROM users WHERE email='$EMAIL'"
  exit 1
fi

echo "✅ Login Success! Token acquired."

echo "3. Running Stress Test..."
echo "----------------------------------------"
curl -s -X POST "$API_URL/api/v2/chat/stress-test" \
  -H "Authorization: Bearer $TOKEN" \
  | jq .
echo "----------------------------------------"

echo "4. Cleaning up..."
npx wrangler d1 execute maintenance-db --remote --command="DELETE FROM users WHERE email='$EMAIL'"
echo "Done."
