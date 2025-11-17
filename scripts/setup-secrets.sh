#!/bin/bash

# Script de configuration des secrets Cloudflare Pages
# Usage: bash scripts/setup-secrets.sh

set -e

PROJECT_NAME="webapp-7t8"  # Remplacer par votre nom de projet Cloudflare

echo "=================================================="
echo "🔒 Configuration Secrets Cloudflare Pages"
echo "=================================================="
echo ""
echo "Projet: $PROJECT_NAME"
echo ""

# Générer des suggestions de tokens sécurisés
generate_token() {
  openssl rand -base64 48 | tr -d "=+/" | cut -c1-64
}

echo "💡 Tokens générés automatiquement (recommandés):"
echo ""
JWT_SECRET=$(generate_token)
CRON_SECRET=$(generate_token)
echo "JWT_SECRET:    $JWT_SECRET"
echo "CRON_SECRET:   $CRON_SECRET"
echo ""

echo "=================================================="
echo "📝 Configuration des secrets"
echo "=================================================="
echo ""

# JWT_SECRET
echo "1️⃣  Configuration JWT_SECRET (CRITIQUE)"
echo "----------------------------------------"
echo "Ce secret est utilisé pour signer les tokens JWT."
echo ""
read -p "Utiliser le token généré automatiquement ? (o/N) " use_auto_jwt

if [[ "$use_auto_jwt" =~ ^[Oo]$ ]]; then
  echo "$JWT_SECRET" | npx wrangler pages secret put JWT_SECRET --project-name "$PROJECT_NAME"
  echo "✅ JWT_SECRET configuré avec token auto-généré"
else
  npx wrangler pages secret put JWT_SECRET --project-name "$PROJECT_NAME"
fi
echo ""

# CRON_SECRET
echo "2️⃣  Configuration CRON_SECRET"
echo "----------------------------------------"
echo "Ce secret est utilisé pour authentifier les webhooks CRON."
echo ""
read -p "Utiliser le token généré automatiquement ? (o/N) " use_auto_cron

if [[ "$use_auto_cron" =~ ^[Oo]$ ]]; then
  echo "$CRON_SECRET" | npx wrangler pages secret put CRON_SECRET --project-name "$PROJECT_NAME"
  echo "✅ CRON_SECRET configuré avec token auto-généré"
else
  npx wrangler pages secret put CRON_SECRET --project-name "$PROJECT_NAME"
fi
echo ""

# ADMIN_PASSWORD
echo "3️⃣  Configuration ADMIN_PASSWORD"
echo "----------------------------------------"
echo "Mot de passe pour créer le premier compte admin."
echo ""
npx wrangler pages secret put ADMIN_PASSWORD --project-name "$PROJECT_NAME"
echo "✅ ADMIN_PASSWORD configuré"
echo ""

# CORS_STRICT_MODE
echo "4️⃣  Configuration CORS_STRICT_MODE"
echo "----------------------------------------"
echo "Active le mode CORS strict (recommandé pour production)."
echo ""
echo "true" | npx wrangler pages secret put CORS_STRICT_MODE --project-name "$PROJECT_NAME"
echo "✅ CORS_STRICT_MODE=true activé"
echo ""

echo "=================================================="
echo "✅ Configuration terminée !"
echo "=================================================="
echo ""
echo "Secrets configurés:"
echo "  ✅ JWT_SECRET"
echo "  ✅ CRON_SECRET"
echo "  ✅ ADMIN_PASSWORD"
echo "  ✅ CORS_STRICT_MODE"
echo ""
echo "📝 IMPORTANT: Sauvegardez vos tokens dans un gestionnaire"
echo "   de mots de passe sécurisé (1Password, Bitwarden, etc.)"
echo ""
echo "🚀 Prochaine étape: Déployer l'application"
echo "   npm run deploy:prod"
echo ""
