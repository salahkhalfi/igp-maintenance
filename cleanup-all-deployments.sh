#!/bin/bash

# Configuration
PROJECT_NAME="webapp"
ACCOUNT_ID="f7534aad3a745e31c833ce64d50e3fd0"
KEEP_COUNT=20

echo "🔍 Récupération de TOUS les déploiements..."

# Première requête pour obtenir le total
FIRST_PAGE=$(curl -s -X GET \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json")

TOTAL_COUNT=$(echo "$FIRST_PAGE" | jq -r '.result_info.total_count')
TOTAL_PAGES=$(echo "$FIRST_PAGE" | jq -r '.result_info.total_pages')

echo "📊 Total de déploiements: $TOTAL_COUNT (sur $TOTAL_PAGES pages)"

if [ "$TOTAL_COUNT" -le "$KEEP_COUNT" ]; then
  echo "✅ Nombre de déploiements OK (≤ $KEEP_COUNT), aucun nettoyage nécessaire"
  exit 0
fi

# Calculer combien supprimer
TO_DELETE=$((TOTAL_COUNT - KEEP_COUNT))
echo "🗑️  Déploiements à supprimer: $TO_DELETE (garder les $KEEP_COUNT plus récents)"
echo ""

# Récupérer tous les IDs
echo "📥 Récupération de tous les IDs..."
ALL_DEPLOYMENT_IDS=""

for ((page=1; page<=TOTAL_PAGES; page++)); do
  echo -n "  Page $page/$TOTAL_PAGES... "
  
  PAGE_DATA=$(curl -s -X GET \
    "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments?page=${page}" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json")
  
  PAGE_IDS=$(echo "$PAGE_DATA" | jq -r '.result[].id')
  COUNT=$(echo "$PAGE_IDS" | wc -l)
  echo "$COUNT déploiements"
  
  ALL_DEPLOYMENT_IDS="${ALL_DEPLOYMENT_IDS}${PAGE_IDS}"$'\n'
done

# Nettoyer les lignes vides
ALL_DEPLOYMENT_IDS=$(echo "$ALL_DEPLOYMENT_IDS" | grep -v '^$')

# Vérifier le total récupéré
RETRIEVED=$(echo "$ALL_DEPLOYMENT_IDS" | wc -l)
echo ""
echo "✅ Total récupéré: $RETRIEVED déploiements"
echo ""
echo "⚠️  ATTENTION: Vous allez supprimer $TO_DELETE déploiements"
echo "   Les $KEEP_COUNT plus récents seront conservés"
echo ""

read -p "Confirmer la suppression? (tapez 'OUI' en majuscules pour confirmer): " -r
if [ "$REPLY" != "OUI" ]; then
  echo "❌ Annulé"
  exit 0
fi

echo ""
echo "🗑️  Début de la suppression..."

# Garder les N premiers (plus récents) et supprimer le reste
DELETED=0
FAILED=0
COUNTER=0

echo "$ALL_DEPLOYMENT_IDS" | tail -n +$((KEEP_COUNT + 1)) | while read -r deployment_id; do
  if [ -z "$deployment_id" ]; then
    continue
  fi
  
  ((COUNTER++))
  echo -n "[$COUNTER/$TO_DELETE] $deployment_id... "
  
  RESPONSE=$(curl -s -X DELETE \
    "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments/${deployment_id}" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json")
  
  SUCCESS=$(echo "$RESPONSE" | jq -r '.success' 2>/dev/null)
  
  if [ "$SUCCESS" = "true" ]; then
    echo "✅"
  else
    echo "❌"
    ERROR=$(echo "$RESPONSE" | jq -r '.errors[0].message' 2>/dev/null)
    echo "    Erreur: $ERROR"
  fi
  
  # Pause pour éviter le rate limiting
  sleep 0.2
done

echo ""
echo "✨ Nettoyage terminé!"
echo "   Vérifiez dans le dashboard Cloudflare que $KEEP_COUNT déploiements restent"
