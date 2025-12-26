#!/bin/bash
# Script de déploiement développement - Garantit cohérence complète
# Usage: npm run deploy:dev

set -e  # Exit on error

echo "🚀 MaintenanceOS - Déploiement Développement"
echo "=============================================="
echo ""

# 1. Variables
HASH=$(git log --oneline -1 | awk '{print $1}')
echo "📌 Commit actuel: $HASH"
echo ""

# 2. Vérifier changements non committés
if [[ -n $(git status -s) ]]; then
    echo "⚠️  ATTENTION: Changements non committés détectés"
    echo ""
    git status -s
    echo ""
    read -p "Continuer quand même? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Déploiement annulé"
        exit 1
    fi
fi

# 3. Clean port
echo "🧹 Nettoyage port 3000..."
fuser -k 3000/tcp 2>/dev/null || true
pm2 delete webapp 2>/dev/null || true
echo "✅ Port nettoyé"
echo ""

# 4. Build CSS
echo "🎨 Build CSS..."
npm run build:css
echo "✅ CSS compilé"
echo ""

# 5. Minify Legacy
echo "📦 Minification composants legacy..."
npm run build:minify
echo "✅ Minification terminée"
echo ""

# 6. Bump cache version dans home.ts
echo "🔄 Mise à jour version cache: $HASH"
sed -i "s/?v=[a-z0-9]*/?v=$HASH/g" src/views/home.ts
COUNT=$(grep -c "?v=$HASH" src/views/home.ts)
echo "✅ $COUNT références mises à jour"
echo ""

# 7. Build complet (worker + client + messenger)
echo "🏗️  Build complet dist/..."
npm run build
echo "✅ Build terminé"
echo ""

# 8. Vérifier dist/
if [[ ! -f "dist/_worker.js" ]]; then
    echo "❌ ERREUR: dist/_worker.js manquant"
    exit 1
fi
echo "✅ dist/_worker.js présent"
echo ""

# 9. Start PM2
echo "🚀 Démarrage serveur PM2..."
pm2 start ecosystem.config.cjs
sleep 5
echo "✅ Serveur démarré"
echo ""

# 10. Test endpoint
echo "🧪 Test endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [[ "$HTTP_CODE" == "200" ]]; then
    echo "✅ Serveur répond (HTTP $HTTP_CODE)"
else
    echo "⚠️  Serveur répond HTTP $HTTP_CODE"
fi
echo ""

# 11. Afficher URLs
echo "🌐 URLs Disponibles:"
echo "  • Local:   http://localhost:3000"
echo "  • Sandbox: https://3000-i99eg52ghw8axx8tockng-18e660f9.sandbox.novita.ai"
echo ""

# 12. Afficher prochaines étapes
echo "📋 Prochaines étapes:"
echo "  1. Tester l'application localement"
echo "  2. git add -A"
echo "  3. git commit -m 'message'"
echo "  4. git push origin main"
echo ""

echo "✅ Déploiement développement terminé!"
