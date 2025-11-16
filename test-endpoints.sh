#!/bin/bash
echo "=== TESTS ENDPOINTS CRITIQUES ==="
echo ""

# Test 1: Page principale
echo "1. Page principale (/):"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ OK (200)"
else
    echo "   ❌ ERREUR ($HTTP_CODE)"
fi

# Test 2: Page guide
echo "2. Page guide (/guide):"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/guide)
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ OK (200)"
else
    echo "   ❌ ERREUR ($HTTP_CODE)"
fi

# Test 3: Page changelog
echo "3. Page changelog (/changelog):"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/changelog)
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ OK (200)"
else
    echo "   ❌ ERREUR ($HTTP_CODE)"
fi

# Test 4: Static assets
echo "4. Logo IGP (/logo-igp.png):"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/logo-igp.png)
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ OK (200)"
else
    echo "   ❌ ERREUR ($HTTP_CODE)"
fi

# Test 5: PWA manifest
echo "5. Manifest PWA (/manifest.json):"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/manifest.json)
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ OK (200)"
else
    echo "   ❌ ERREUR ($HTTP_CODE)"
fi

# Test 6: Service Worker
echo "6. Service Worker (/service-worker.js):"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/service-worker.js)
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ OK (200)"
else
    echo "   ❌ ERREUR ($HTTP_CODE)"
fi

echo ""
echo "=== RÉSUMÉ ==="
echo "Tests critiques terminés"
