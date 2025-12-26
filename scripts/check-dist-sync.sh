#!/bin/bash
# Vérifie que dist/ est synchronisé avec les sources

set -e

echo "🔍 Vérification sync dist/..."
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier si dist/_worker.js existe
if [[ ! -f "dist/_worker.js" ]]; then
    echo -e "${RED}❌ ERREUR: dist/_worker.js manquant${NC}"
    echo ""
    echo "Solution:"
    echo "  npm run build:full"
    exit 1
fi

# Timestamps
WORKER_TIME=$(stat -c %Y dist/_worker.js)
MINIFIED_TIME=$(stat -c %Y public/static/js/dist/AppHeader.min.js 2>/dev/null || echo 0)
HOME_TIME=$(stat -c %Y src/views/home.ts)

# Calcul différences (en secondes)
DIFF_WORKER_MINIFIED=$((WORKER_TIME - MINIFIED_TIME))
DIFF_WORKER_HOME=$((WORKER_TIME - HOME_TIME))

echo "📊 Timestamps:"
echo "  • dist/_worker.js:              $(stat -c '%y' dist/_worker.js)"
echo "  • public/.../AppHeader.min.js:  $(stat -c '%y' public/static/js/dist/AppHeader.min.js 2>/dev/null || echo 'N/A')"
echo "  • src/views/home.ts:            $(stat -c '%y' src/views/home.ts)"
echo ""

# Vérifier cohérence (tolérance 2 minutes = 120 secondes)
TOLERANCE=120

if [[ $DIFF_WORKER_MINIFIED -lt -$TOLERANCE ]]; then
    echo -e "${RED}❌ ATTENTION: dist/_worker.js est PLUS ANCIEN que les fichiers minifiés${NC}"
    echo ""
    echo "  dist/_worker.js est $((-DIFF_WORKER_MINIFIED)) secondes en retard"
    echo ""
    echo "Solution:"
    echo "  npm run build:full    # Build complet avec minify"
    echo ""
    exit 1
fi

if [[ $DIFF_WORKER_HOME -lt -$TOLERANCE ]]; then
    echo -e "${YELLOW}⚠️  ATTENTION: dist/_worker.js pourrait être ancien${NC}"
    echo ""
    echo "  Vérifiez si vous avez modifié src/views/home.ts après le build"
    echo ""
fi

# Vérifier hash version
HASH=$(git log --oneline -1 | awk '{print $1}')
VERSION_COUNT=$(grep "?v=$HASH" src/views/home.ts 2>/dev/null | wc -l || echo "0")

echo "🔖 Version cache:"
echo "  • Git commit: $HASH"
echo "  • Occurrences dans home.ts: $VERSION_COUNT"
echo ""

if [[ "$VERSION_COUNT" == "0" ]]; then
    echo -e "${YELLOW}⚠️  Cache version pas à jour${NC}"
    echo ""
    echo "Solution:"
    echo "  sed -i \"s/?v=[a-z0-9]*/?v=$HASH/g\" src/views/home.ts"
    echo ""
fi

echo -e "${GREEN}✅ dist/ semble synchronisé${NC}"
echo ""
echo "📋 Pour garantir la cohérence:"
echo "  npm run build:full     # Build complet"
echo "  npm run deploy:dev     # Build + Start PM2"
