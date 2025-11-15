#!/bin/bash

# Configuration
PROJECT_NAME="webapp"
ACCOUNT_ID="f7534aad3a745e31c833ce64d50e3fd0"
KEEP_COUNT=20

echo "🔍 Récupération de tous les déploiements..."

# Récupérer tous les déploiements via l'API Cloudflare
DEPLOYMENTS=$(curl -s -X GET \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json")

# Extraire les IDs de déploiement (triés du plus récent au plus ancien)
DEPLOYMENT_IDS=$(echo "$DEPLOYMENTS" | jq -r '.result[].id' 2>/dev/null)

if [ -z "$DEPLOYMENT_IDS" ]; then
  echo "❌ Erreur: Impossible de récupérer les déploiements"
  echo "Réponse API: $DEPLOYMENTS"
  exit 1
fi

# Compter le nombre total
TOTAL=$(echo "$DEPLOYMENT_IDS" | wc -l)
echo "📊 Total de déploiements trouvés: $TOTAL"

if [ "$TOTAL" -le "$KEEP_COUNT" ]; then
  echo "✅ Nombre de déploiements OK (≤ $KEEP_COUNT), aucun nettoyage nécessaire"
  exit 0
fi

# Calculer combien supprimer
TO_DELETE=$((TOTAL - KEEP_COUNT))
echo "🗑️  Déploiements à supprimer: $TO_DELETE (garder les $KEEP_COUNT plus récents)"

# Garder les N premiers (plus récents) et supprimer le reste
DELETED=0
FAILED=0

echo "$DEPLOYMENT_IDS" | tail -n +$((KEEP_COUNT + 1)) | while read -r deployment_id; do
  echo -n "Suppression de $deployment_id... "
  
  RESPONSE=$(curl -s -X DELETE \
    "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments/${deployment_id}" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json")
  
  SUCCESS=$(echo "$RESPONSE" | jq -r '.success' 2>/dev/null)
  
  if [ "$SUCCESS" = "true" ]; then
    echo "✅"
    ((DELETED++))
  else
    echo "❌"
    ((FAILED++))
    ERROR=$(echo "$RESPONSE" | jq -r '.errors[0].message' 2>/dev/null)
    echo "  Erreur: $ERROR"
  fi
  
  # Pause pour éviter le rate limiting
  sleep 0.5
done

echo ""
echo "✨ Nettoyage terminé!"
echo "   Supprimés: $DELETED"
echo "   Échecs: $FAILED"
echo "   Restants: $KEEP_COUNT"
