#!/bin/bash

echo "🧪 TEST REMEMBER ME FEATURE"
echo "================================"

# Test 1: Login WITHOUT Remember Me (should get 7-day token)
echo ""
echo "📝 Test 1: Login WITHOUT Remember Me"
RESPONSE1=$(curl -s -c cookies1.txt -b cookies1.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tech1@igpglass.ca","password":"test123","rememberMe":false}')

echo "$RESPONSE1" | jq '.token' | head -c 50
echo "..."
echo "Cookie set (check cookies1.txt):"
cat cookies1.txt | grep auth_token || echo "❌ No cookie found!"

# Test 2: Login WITH Remember Me (should get 30-day token)
echo ""
echo "📝 Test 2: Login WITH Remember Me"
RESPONSE2=$(curl -s -c cookies2.txt -b cookies2.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tech1@igpglass.ca","password":"test123","rememberMe":true}')

echo "$RESPONSE2" | jq '.token' | head -c 50
echo "..."
echo "Cookie set (check cookies2.txt):"
cat cookies2.txt | grep auth_token || echo "❌ No cookie found!"

# Test 3: Verify cookie authentication works
echo ""
echo "📝 Test 3: Access protected route with COOKIE (no Authorization header)"
TOKEN2=$(echo "$RESPONSE2" | jq -r '.token')
AUTH_RESPONSE=$(curl -s -b cookies2.txt http://localhost:3000/api/auth/me)
echo "$AUTH_RESPONSE" | jq '.user.email' || echo "❌ Cookie auth failed!"

# Test 4: Verify Authorization header still works (backward compatibility)
echo ""
echo "📝 Test 4: Access protected route with Authorization HEADER (legacy)"
HEADER_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN2" http://localhost:3000/api/auth/me)
echo "$HEADER_RESPONSE" | jq '.user.email' || echo "❌ Header auth failed!"

# Test 5: Test logout clears cookie
echo ""
echo "📝 Test 5: Logout clears cookie"
LOGOUT_RESPONSE=$(curl -s -c cookies3.txt -b cookies2.txt -X POST http://localhost:3000/api/auth/logout)
echo "$LOGOUT_RESPONSE" | jq '.'
echo "Cookie after logout:"
cat cookies3.txt | grep auth_token || echo "✅ Cookie cleared successfully!"

# Cleanup
rm -f cookies1.txt cookies2.txt cookies3.txt

echo ""
echo "✅ Tests completed!"
