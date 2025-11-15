#!/bin/bash

# Configuration
PROJECT_NAME="webapp"
ACCOUNT_ID="f7534aad3a745e31c833ce64d50e3fd0"
KEEP_COUNT=20

echo "🔍 Récupération de TOUS les déploiements (avec pagination)..."

ALL_DEPLOYMENT_IDS=""
PAGE=1
PER_PAGE=100

while true; do
  echo "📄 Page $PAGE..."
  
  DEPLOYMENTS=$(curl -s -X GET \
    "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments?per_page=${PER_PAGE}&page=${PAGE}" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json")
  
  # Vérifier le succès
  SUCCESS=$(echo "$DEPLOYMENTS" | jq -r '.success' 2>/dev/null)
  if [ "$SUCCESS" != "true" ]; then
    echo "❌ Erreur API:"
    echo "$DEPLOYMENTS" | jq -r '.errors[0].message' 2>/dev/null
    break
  fi
  
  # Extraire les IDs de cette page
  PAGE_IDS=$(echo "$DEPLOYMENTS" | jq -r '.result[].id' 2>/dev/null)
  
  if [ -z "$PAGE_IDS" ]; then
    # Plus de résultats
    break
  fi
  
  COUNT=$(echo "$PAGE_IDS" | wc -l)
  echo "   Trouvés: $COUNT déploiements"
  
  ALL_DEPLOYMENT_IDS="${ALL_DEPLOYMENT_IDS}${PAGE_IDS}"$'\n'
  
  # Si moins de per_page résultats, c'est la dernière page
  if [ "$COUNT" -lt "$PER_PAGE" ]; then
    break
  fi
  
  PAGE=$((PAGE + 1))
done

# Nettoyer les lignes vides
ALL_DEPLOYMENT_IDS=$(echo "$ALL_DEPLOYMENT_IDS" | grep -v '^$')

# Compter le nombre total
TOTAL=$(echo "$ALL_DEPLOYMENT_IDS" | wc -l)
echo ""
echo "📊 Total de déploiements trouvés: $TOTAL"

if [ "$TOTAL" -le "$KEEP_COUNT" ]; then
  echo "✅ Nombre de déploiements OK (≤ $KEEP_COUNT), aucun nettoyage nécessaire"
  exit 0
fi

# Calculer combien supprimer
TO_DELETE=$((TOTAL - KEEP_COUNT))
echo "🗑️  Déploiements à supprimer: $TO_DELETE (garder les $KEEP_COUNT plus récents)"
echo ""

read -p "⚠️  Confirmer la suppression de $TO_DELETE déploiements? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Annulé"
  exit 0
fi

# Garder les N premiers (plus récents) et supprimer le reste
DELETED=0
FAILED=0

echo "$ALL_DEPLOYMENT_IDS" | tail -n +$((KEEP_COUNT + 1)) | while read -r deployment_id; do
  if [ -z "$deployment_id" ]; then
    continue
  fi
  
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
  sleep 0.3
  
  # Afficher progression tous les 10
  if [ $((($DELETED + $FAILED) % 10)) -eq 0 ]; then
    echo "   Progression: $(($DELETED + $FAILED))/$TO_DELETE"
  fi
done

echo ""
echo "✨ Nettoyage terminé!"
echo "   Supprimés: $DELETED"
echo "   Échecs: $FAILED"
echo "   Restants: $KEEP_COUNT"
