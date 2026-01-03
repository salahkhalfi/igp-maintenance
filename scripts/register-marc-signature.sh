#!/bin/bash
# Script pour enregistrer la signature de Marc Bélanger
# Usage: ./scripts/register-marc-signature.sh <userId>

if [ -z "$1" ]; then
    echo "❌ Usage: $0 <userId>"
    echo ""
    echo "Pour trouver l'ID de Marc Bélanger:"
    echo "  npx wrangler d1 execute maintenance-db --command=\"SELECT id, full_name FROM users WHERE email = 'mbelanger@igpglass.com';\""
    exit 1
fi

USER_ID=$1
echo "📝 Génération du SQL pour userId=$USER_ID..."

# Régénérer le SQL avec le bon ID
node scripts/register-signature.cjs "$USER_ID" "Marc Bélanger" ./signature-marc.png

echo ""
echo "✅ Fichier SQL généré: scripts/signature-$USER_ID.sql"
echo ""
echo "Pour appliquer en production:"
echo "  npx wrangler d1 execute maintenance-db --file=scripts/signature-$USER_ID.sql"
