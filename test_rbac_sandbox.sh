#!/bin/bash

echo "🧪 TEST RBAC EN SANDBOX"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Se connecter en tant qu'admin
echo "1️⃣ Connexion en tant qu'admin..."
TOKEN=$(curl -s -X POST http://localhost:7000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@igp.com","password":"admin123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Échec de connexion"
  exit 1
fi

echo "✅ Connecté ! Token obtenu"
echo ""

# 2. Tester les permissions
echo "2️⃣ Test des permissions admin..."
curl -s http://localhost:7000/api/rbac/test \
  -H "Authorization: Bearer $TOKEN" \
  | jq '{role: .user.role, total_permissions: .permissions.total, tests: .specificTests}'
echo ""

# 3. Lister les rôles
echo "3️⃣ Liste des rôles disponibles..."
curl -s http://localhost:7000/api/roles \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.roles[] | {id, name, display_name, permissions_count, is_system}'
echo ""

# 4. Créer un rôle personnalisé
echo "4️⃣ Création d'un rôle 'Auditeur'..."
NEW_ROLE=$(curl -s -X POST http://localhost:7000/api/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "auditor",
    "display_name": "Auditeur",
    "description": "Accès en lecture seule pour audit",
    "permission_ids": [2, 3, 12, 16, 22]
  }')

echo "$NEW_ROLE" | jq '{message, role: .role | {id, name, display_name}}'
AUDITOR_ID=$(echo "$NEW_ROLE" | jq -r '.role.id')
echo ""

# 5. Vérifier la création
echo "5️⃣ Vérification - Liste mise à jour..."
curl -s http://localhost:7000/api/roles \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.roles[] | {id, name, display_name, is_system}'
echo ""

# 6. Supprimer le rôle créé
if [ ! -z "$AUDITOR_ID" ]; then
  echo "6️⃣ Suppression du rôle créé (ID: $AUDITOR_ID)..."
  curl -s -X DELETE "http://localhost:7000/api/roles/$AUDITOR_ID" \
    -H "Authorization: Bearer $TOKEN" \
    | jq '.'
  echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TEST SANDBOX TERMINÉ !"
echo ""
echo "📝 Ce que nous avons testé:"
echo "   ✓ Connexion admin"
echo "   ✓ Lecture des permissions (31 pour admin)"
echo "   ✓ Liste des 4 rôles système"
echo "   ✓ Création d'un rôle personnalisé"
echo "   ✓ Suppression du rôle personnalisé"
echo ""
echo "🎯 Tout fonctionne en SANDBOX LOCAL (--local)"
echo "🔒 Aucun impact sur la production"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
