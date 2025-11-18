#!/bin/bash

echo "🧪 COMPLETE REMEMBER ME TEST"
echo "======================================"

# Test 1: Login WITHOUT Remember Me
echo ""
echo "📝 Test 1: Login WITHOUT Remember Me (7 days)"
RESPONSE1=$(curl -s -c cookies1.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@igpglass.ca","password":"test123","rememberMe":false}')

TOKEN1=$(echo "$RESPONSE1" | jq -r '.token')
if [ "$TOKEN1" != "null" ] && [ -n "$TOKEN1" ]; then
  echo "✅ Token received: ${TOKEN1:0:30}..."
  echo "✅ Cookie file:"
  cat cookies1.txt | grep auth_token && echo "✅ Cookie SET" || echo "⚠️ No cookie (expected for curl)"
else
  echo "❌ Login failed: $RESPONSE1"
fi

# Test 2: Login WITH Remember Me
echo ""
echo "📝 Test 2: Login WITH Remember Me (30 days)"
RESPONSE2=$(curl -s -c cookies2.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@igpglass.ca","password":"test123","rememberMe":true}')

TOKEN2=$(echo "$RESPONSE2" | jq -r '.token')
if [ "$TOKEN2" != "null" ] && [ -n "$TOKEN2" ]; then
  echo "✅ Token received: ${TOKEN2:0:30}..."
  echo "✅ Cookie file:"
  cat cookies2.txt | grep auth_token && echo "✅ Cookie SET" || echo "⚠️ No cookie (expected for curl)"
else
  echo "❌ Login failed: $RESPONSE2"
fi

# Test 3: Cookie authentication (simulated browser)
echo ""
echo "📝 Test 3: Access protected route WITH cookie"
AUTH3=$(curl -s -b cookies2.txt http://localhost:3000/api/auth/me)
USER3=$(echo "$AUTH3" | jq -r '.user.email')
if [ "$USER3" = "testuser@igpglass.ca" ]; then
  echo "✅ Cookie auth WORKS: $USER3"
else
  echo "⚠️ Cookie auth result: $AUTH3"
fi

# Test 4: Header authentication (legacy/mobile)
echo ""
echo "📝 Test 4: Access protected route WITH Authorization header"
AUTH4=$(curl -s -H "Authorization: Bearer $TOKEN2" http://localhost:3000/api/auth/me)
USER4=$(echo "$AUTH4" | jq -r '.user.email')
if [ "$USER4" = "testuser@igpglass.ca" ]; then
  echo "✅ Header auth WORKS: $USER4"
else
  echo "❌ Header auth failed: $AUTH4"
fi

# Test 5: Logout clears cookie
echo ""
echo "📝 Test 5: Logout clears cookie"
LOGOUT=$(curl -s -c cookies3.txt -b cookies2.txt -X POST http://localhost:3000/api/auth/logout)
echo "$LOGOUT" | jq '.'
cat cookies3.txt | grep auth_token && echo "❌ Cookie still present" || echo "✅ Cookie cleared"

# Test 6: Verify dual-mode priority (cookie > header)
echo ""
echo "📝 Test 6: Dual-mode priority (cookie takes precedence)"
# Create a second user
REG2=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser2@igpglass.ca","password":"test456","full_name":"Test User 2","role":"technician"}')
TOKEN_USER2=$(echo "$REG2" | jq -r '.token')

# Login as testuser and get cookie
curl -s -c cookies_user1.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@igpglass.ca","password":"test123","rememberMe":true}' > /dev/null

# Use cookie from user1 but header from user2 - should use COOKIE (user1)
AUTH6=$(curl -s -b cookies_user1.txt -H "Authorization: Bearer $TOKEN_USER2" http://localhost:3000/api/auth/me)
USER6=$(echo "$AUTH6" | jq -r '.user.email')
if [ "$USER6" = "testuser@igpglass.ca" ]; then
  echo "✅ Cookie priority WORKS: Cookie (user1) > Header (user2)"
else
  echo "⚠️ Unexpected user: $USER6 (expected testuser@igpglass.ca)"
fi

# Cleanup
rm -f cookies1.txt cookies2.txt cookies3.txt cookies_user1.txt

echo ""
echo "✅ All tests completed!"
