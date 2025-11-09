#!/bin/bash
# 🧪 Script de déploiement sur webapp-test
# Usage: ./scripts/deploy-test.sh

set -e  # Exit on error

echo "🧪 DÉPLOIEMENT SUR WEBAPP-TEST"
echo "================================"
echo ""

# 1. Vérifier qu'on est sur development
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "development" ]; then
    echo "❌ ERREUR: Vous devez être sur la branche 'development'"
    echo "   Branche actuelle: $CURRENT_BRANCH"
    echo ""
    echo "   Exécutez: git checkout development"
    exit 1
fi

# 2. Vérifier s'il y a des modifications non committées
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  ATTENTION: Vous avez des modifications non committées"
    echo ""
    read -p "Voulez-vous continuer quand même? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 3. Build
echo "📦 Building..."
npm run build

# 4. Deploy
echo ""
echo "🚀 Deploying to webapp-test..."
DEPLOY_OUTPUT=$(npx wrangler pages deploy dist --project-name webapp-test --branch main 2>&1)

# 5. Extraire l'URL
TEST_URL=$(echo "$DEPLOY_OUTPUT" | grep -oP 'https://[a-z0-9]+\.webapp-test-[a-z0-9]+\.pages\.dev' | head -1)

# 6. Afficher résultat
echo ""
echo "✅ DÉPLOIEMENT RÉUSSI!"
echo "================================"
echo ""
echo "🧪 URL de test: $TEST_URL"
echo ""
echo "📋 Actions recommandées:"
echo "   1. Tester cette URL: $TEST_URL"
echo "   2. Vérifier le login"
echo "   3. Tester les fonctionnalités modifiées"
echo "   4. Si OK, mettre à jour DEPLOYMENT_CONFIG.md"
echo "   5. Si OK, déployer en production: ./scripts/deploy-prod.sh"
echo ""
echo "⚠️  N'oubliez pas de mettre à jour:"
echo "   - DEPLOYMENT_CONFIG.md (section Test)"
echo "   - README.md si nécessaire"
echo ""
