#!/bin/bash
# Script de déploiement automatique quand Cloudflare sera rétabli
# Usage: bash deploy-when-cloudflare-ready.sh

echo "🔍 Vérification de l'état de Cloudflare..."

# Exporter le token
export CLOUDFLARE_API_TOKEN=$(grep CLOUDFLARE_API_TOKEN /home/user/.bashrc | cut -d'"' -f2)

# Vérifier l'authentification
if ! npx wrangler whoami > /dev/null 2>&1; then
    echo "❌ Token Cloudflare invalide. Configurez avec: setup_cloudflare_api_key"
    exit 1
fi

echo "✅ Token Cloudflare valide"
echo ""
echo "📦 Nettoyage et build..."

# Clean et build
rm -rf dist .wrangler node_modules/.cache
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build échoué"
    exit 1
fi

echo "✅ Build réussi ($(du -h dist/_worker.js | cut -f1))"
echo ""
echo "🚀 Déploiement sur Cloudflare Pages..."

# Déployer
npx wrangler pages deploy dist --project-name webapp

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ =========================================="
    echo "✅ DÉPLOIEMENT RÉUSSI !"
    echo "✅ =========================================="
    echo ""
    echo "🔗 Testez votre application :"
    echo "   https://webapp-7t8.pages.dev"
    echo ""
    echo "📊 Vérifications recommandées :"
    echo "   curl https://webapp-7t8.pages.dev/api/health"
    echo "   curl https://webapp-7t8.pages.dev/api/users (avec token)"
    echo ""
else
    echo ""
    echo "❌ =========================================="
    echo "❌ DÉPLOIEMENT ÉCHOUÉ"
    echo "❌ =========================================="
    echo ""
    echo "Cloudflare est peut-être encore down."
    echo "Réessayez plus tard avec:"
    echo "   bash deploy-when-cloudflare-ready.sh"
    echo ""
    exit 1
fi
