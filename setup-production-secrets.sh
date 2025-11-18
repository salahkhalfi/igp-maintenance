#!/bin/bash

# 🔒 Script de Configuration des Secrets de Production
# Ce script doit être exécuté AVANT le premier déploiement en production

set -e

echo "🔒 CONFIGURATION DES SECRETS DE PRODUCTION"
echo "=========================================="
echo ""

# Vérifier que wrangler est installé
if ! command -v npx &> /dev/null; then
    echo "❌ Erreur: npx n'est pas installé"
    exit 1
fi

# 1. Générer JWT_SECRET si nécessaire
echo "1️⃣ Génération du JWT_SECRET..."
echo ""
echo "Un secret JWT fort va être généré (64 caractères base64)."
echo ""

# Générer un secret fort
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo "✅ Secret JWT généré: ${JWT_SECRET:0:20}...${JWT_SECRET: -10}"
echo ""

# 2. Sauvegarder dans un fichier temporaire
echo "$JWT_SECRET" > /tmp/jwt_secret.txt
echo "💾 Secret sauvegardé dans: /tmp/jwt_secret.txt"
echo ""

# 3. Instructions pour configurer en production
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 INSTRUCTIONS POUR CONFIGURER EN PRODUCTION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Exécute la commande suivante pour configurer le secret:"
echo ""
echo "  npx wrangler secret put JWT_SECRET --project-name webapp"
echo ""
echo "Puis colle le secret suivant quand demandé:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat /tmp/jwt_secret.txt
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT: Garde ce secret en lieu sûr!"
echo "⚠️  Tu en auras besoin si tu déploies sur un autre projet."
echo ""

# 4. Demander confirmation
read -p "Veux-tu configurer le secret maintenant? (o/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Oo]$ ]]; then
    echo ""
    echo "🚀 Configuration du secret en production..."
    echo ""
    echo "Quand wrangler demande le secret, colle celui ci-dessus."
    echo ""
    
    # Copier dans le presse-papier si possible
    if command -v xclip &> /dev/null; then
        cat /tmp/jwt_secret.txt | xclip -selection clipboard
        echo "📋 Secret copié dans le presse-papier!"
        echo ""
    fi
    
    # Exécuter wrangler
    npx wrangler secret put JWT_SECRET --project-name webapp
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ JWT_SECRET configuré avec succès!"
        echo ""
    else
        echo ""
        echo "❌ Erreur lors de la configuration."
        echo "Le secret est toujours disponible dans: /tmp/jwt_secret.txt"
        echo ""
    fi
else
    echo ""
    echo "⏭️  Configuration reportée."
    echo "Le secret reste disponible dans: /tmp/jwt_secret.txt"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Configuration terminée!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Prochaines étapes:"
echo "  1. Vérifier que JWT_SECRET est configuré"
echo "  2. Déployer en production: npm run deploy:prod"
echo "  3. Tester la connexion sur le site de production"
echo ""
