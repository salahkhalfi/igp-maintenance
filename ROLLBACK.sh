#!/bin/bash
# Script de rollback pour annuler les modifications titre/sous-titre
# Créé le: 2025-11-12 17:26

echo "🔄 ROLLBACK - Retour à l'état avant titre/sous-titre personnalisé"
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -d ".git" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis /home/user/webapp"
    exit 1
fi

echo "📋 Options de rollback disponibles:"
echo ""
echo "1. Rollback GIT COMPLET (recommandé)"
echo "   - Retour à la branche backup-before-title-subtitle-20251112-172617"
echo "   - Annule TOUTES les modifications de code"
echo ""
echo "2. Rollback BASE DE DONNÉES LOCALE uniquement"
echo "   - Restaure .wrangler/state/v3/d1.backup-20251112-172633"
echo "   - Garde les modifications de code"
echo ""
echo "3. Rollback COMPLET (git + database)"
echo "   - Restaure code ET base de données"
echo ""
echo "4. Télécharger backup complet"
echo "   - URL: https://www.genspark.ai/api/files/s/oJRmSCwE"
echo "   - Backup tar.gz complet du projet"
echo ""

read -p "Choisissez une option (1-4) ou 'q' pour quitter: " choice

case $choice in
    1)
        echo ""
        echo "🔄 Rollback GIT en cours..."
        git checkout backup-before-title-subtitle-20251112-172617
        echo "✅ Code restauré à l'état avant modifications"
        echo "⚠️  N'oubliez pas de rebuild: npm run build"
        ;;
    2)
        echo ""
        echo "🔄 Rollback DATABASE en cours..."
        rm -rf .wrangler/state/v3/d1
        cp -r .wrangler/state/v3/d1.backup-20251112-172633 .wrangler/state/v3/d1
        echo "✅ Base de données locale restaurée"
        ;;
    3)
        echo ""
        echo "🔄 Rollback COMPLET en cours..."
        git checkout backup-before-title-subtitle-20251112-172617
        rm -rf .wrangler/state/v3/d1
        cp -r .wrangler/state/v3/d1.backup-20251112-172633 .wrangler/state/v3/d1
        echo "✅ Code ET base de données restaurés"
        echo "⚠️  N'oubliez pas de rebuild: npm run build"
        ;;
    4)
        echo ""
        echo "📦 Backup complet disponible à:"
        echo "https://www.genspark.ai/api/files/s/oJRmSCwE"
        echo ""
        echo "Pour restaurer manuellement:"
        echo "1. Téléchargez le fichier"
        echo "2. Extrayez: tar -xzf webapp-before-title-subtitle-feature.tar.gz"
        echo "3. Le projet sera restauré avec son chemin absolu"
        ;;
    q|Q)
        echo "Annulé."
        exit 0
        ;;
    *)
        echo "❌ Option invalide"
        exit 1
        ;;
esac

echo ""
echo "✅ Rollback terminé!"
