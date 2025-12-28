#!/bin/bash
# Audit de code mort pour les fichiers JS

echo "=========================================="
echo "🔍 AUDIT CODE MORT - $(date)"
echo "=========================================="

echo ""
echo "📌 1. Variables undefined potentielles dans les composants React:"
for file in public/static/js/components/*.js; do
    # Chercher des références à des variables qui ne sont pas déclarées
    result=$(node --check "$file" 2>&1)
    if [ $? -ne 0 ]; then
        echo "  ❌ $file - Erreur syntaxe"
        echo "     $result"
    fi
done

echo ""
echo "📌 2. Références à window.* non définies:"
grep -rn "window\.[A-Z][a-zA-Z]*" public/static/js/components/*.js 2>/dev/null | \
    grep -v "window.React\|window.axios\|window.showToast\|window.location\|window.open\|window.confirm\|window.alert\|window.localStorage\|window.addEventListener\|window.removeEventListener\|window.innerWidth\|window.innerHeight\|window.scrollTo\|window.matchMedia\|window.navigator\|window.fetch\|window.URL\|window.Blob\|window.FileReader\|window.FormData\|window.setTimeout\|window.setInterval\|window.clearTimeout\|window.clearInterval\|window.requestAnimationFrame\|window.cancelAnimationFrame\|window.getComputedStyle\|window.history\|window.performance\|window.devicePixelRatio\|window.screen\|window.parent\|window.top\|window.self\|window.document\|window.console\|window.JSON\|window.Math\|window.Date\|window.Array\|window.Object\|window.String\|window.Number\|window.Boolean\|window.RegExp\|window.Error\|window.Promise\|window.Symbol\|window.Map\|window.Set\|window.WeakMap\|window.WeakSet\|window.Proxy\|window.Reflect" | \
    head -30

echo ""
echo "📌 3. États React potentiellement inutilisés (useState sans usage):"
for file in public/static/js/components/*.js; do
    # Extraire les noms de states
    states=$(grep -oP "const \[\K[a-zA-Z]+(?=, set)" "$file" 2>/dev/null)
    for state in $states; do
        # Compter les usages (hors déclaration)
        count=$(grep -c "\b$state\b" "$file" 2>/dev/null)
        if [ "$count" -le 2 ]; then
            echo "  ⚠️  $file: '$state' utilisé seulement $count fois"
        fi
    done
done

echo ""
echo "📌 4. Fichiers JS non référencés dans home.ts:"
for file in public/static/js/components/*.js; do
    basename=$(basename "$file" .js)
    if ! grep -q "$basename" src/views/home.ts 2>/dev/null; then
        echo "  ⚠️  $basename.js non référencé dans home.ts"
    fi
done

echo ""
echo "📌 5. Routes API potentiellement obsolètes:"
grep -rn "'/api/" public/static/js/components/*.js 2>/dev/null | \
    grep -oP "'/api/[^']*'" | sort -u | while read route; do
    # Vérifier si la route existe dans src/
    route_clean=$(echo $route | tr -d "'")
    if ! grep -rq "$route_clean" src/ 2>/dev/null; then
        echo "  ⚠️  Route $route peut-être obsolète"
    fi
done

echo ""
echo "=========================================="
echo "✅ Audit terminé"
echo "=========================================="
