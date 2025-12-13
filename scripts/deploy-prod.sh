#!/bin/bash
# 🚀 Script de déploiement en PRODUCTION
# Usage: ./scripts/deploy-prod.sh

set -e  # Exit on error

echo "🚀 DÉPLOIEMENT EN PRODUCTION"
echo "================================"
echo ""
echo "⚠️  ATTENTION: Vous allez déployer en PRODUCTION!"
echo ""

# 1. Vérifier qu'on est sur development
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "development" ]; then
    echo "❌ ERREUR: Vous devez être sur la branche 'development' pour commencer"
    echo "   Branche actuelle: $CURRENT_BRANCH"
    exit 1
fi

# 2. Demander confirmation
read -p "Avez-vous testé sur webapp-test? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Annulé. Testez d'abord sur webapp-test!"
    exit 1
fi

echo ""
read -p "Êtes-vous CERTAIN de vouloir déployer en production? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Annulé."
    exit 1
fi

# 3. Créer backup tag
echo ""
echo "🔒 Création du tag de backup..."
CURRENT_COMMIT=$(git rev-parse HEAD)
CURRENT_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_TAG="backup-before-deploy-$CURRENT_DATE"

git tag -a "$BACKUP_TAG" -m "Backup avant déploiement production du $CURRENT_DATE"
echo "   ✅ Tag créé: $BACKUP_TAG"

# 4. Checkout main et merge
echo ""
echo "🔄 Merge development → main..."
git checkout main
git merge development -m "Deploy: Merge development to main for production deployment"

# 5. Build
echo ""
echo "📦 Building..."
npm run build

# 6. Deploy
echo ""
echo "🚀 Deploying to PRODUCTION..."
DEPLOY_OUTPUT=$(npx wrangler pages deploy dist --project-name webapp --branch main 2>&1)

# 7. Extraire l'URL
PROD_URL=$(echo "$DEPLOY_OUTPUT" | grep -oP 'https://[a-z0-9]+\.webapp-[a-z0-9]+\.pages\.dev' | head -1)
DEPLOY_ID=$(echo "$PROD_URL" | grep -oP '[a-z0-9]+(?=\.webapp)')

# 8. Créer tag de version
echo ""
echo "🏷️  Création du tag de version..."
read -p "Numéro de version (ex: 2.0.6): " VERSION
VERSION_TAG="v$VERSION"
git tag -a "$VERSION_TAG" -m "Production deployment v$VERSION - $DEPLOY_ID"
echo "   ✅ Tag créé: $VERSION_TAG"

# 9. Retour sur development
git checkout development

# 10. Afficher résultat
echo ""
echo "✅ DÉPLOIEMENT EN PRODUCTION RÉUSSI!"
echo "================================"
echo ""
echo "🌐 URL Production: https://app.igpglass.ca"
echo "🔗 Deployment URL: $PROD_URL"
echo "🆔 Deployment ID: $DEPLOY_ID"
echo "🏷️  Version Tag: $VERSION_TAG"
echo "🔒 Backup Tag: $BACKUP_TAG"
echo ""
echo "📋 Actions OBLIGATOIRES:"
echo "   1. ✅ Tester: https://app.igpglass.ca"
echo "   2. ✅ Vérifier le login"
echo "   3. ✅ Tester les fonctionnalités"
echo "   4. ⚠️  METTRE À JOUR DEPLOYMENT_CONFIG.md:"
echo "      - Section Production: $PROD_URL"
echo "      - Deployment ID: $DEPLOY_ID"
echo "      - Tag: $VERSION_TAG"
echo "      - Date: $(date +%Y-%m-%d)"
echo "   5. ⚠️  METTRE À JOUR README.md si nécessaire"
echo "   6. 💾 Commit les changements de doc"
echo ""
echo "🔄 Si problème, rollback avec:"
echo "   git checkout main"
echo "   git reset --hard $BACKUP_TAG"
echo "   npm run build"
echo "   npx wrangler pages deploy dist --project-name webapp --branch main"
echo ""
