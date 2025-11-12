#!/bin/bash
# Script de vérification automatique des pratiques de sécurité

echo "🔍 VÉRIFICATION SÉCURITÉ - Webapp"
echo "=================================="
echo ""

ERRORS=0
WARNINGS=0

# Test 1: Détecter échappement HTML dans backend
echo "1️⃣  Vérification échappement HTML dans backend..."
if grep -rn "replace.*&lt;\|replace.*&gt;\|replace.*&quot;" src/routes/ src/middlewares/ --include="*.ts" 2>/dev/null | grep -v "// .*replace"; then
    echo "   ❌ ERREUR: Échappement HTML trouvé dans le backend!"
    echo "   → Les valeurs doivent être stockées BRUTES en DB"
    echo "   → React échappe automatiquement à l'affichage"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ OK - Pas d'échappement HTML dans backend"
fi
echo ""

# Test 2: Détecter dangerouslySetInnerHTML
echo "2️⃣  Vérification dangerouslySetInnerHTML..."
if grep -rn "dangerouslySetInnerHTML" src/ --include="*.tsx" --include="*.ts" 2>/dev/null; then
    echo "   ⚠️  WARNING: dangerouslySetInnerHTML trouvé!"
    echo "   → Vérifier que DOMPurify est utilisé"
    echo "   → Ou considérer une alternative plus sûre"
    WARNINGS=$((WARNINGS + 1))
else
    echo "   ✅ OK - Pas de dangerouslySetInnerHTML"
fi
echo ""

# Test 3: Détecter innerHTML direct
echo "3️⃣  Vérification innerHTML..."
if grep -rn "\.innerHTML\s*=" src/ --include="*.tsx" --include="*.ts" 2>/dev/null; then
    echo "   ❌ ERREUR: Utilisation de innerHTML détectée!"
    echo "   → Utiliser React.createElement() à la place"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ OK - Pas d'utilisation directe de innerHTML"
fi
echo ""

# Test 4: Détecter concaténation SQL (SQL injection potentielle)
echo "4️⃣  Vérification SQL injection..."
if grep -rn "DB\.prepare.*\${" src/routes/ --include="*.ts" 2>/dev/null | grep -v "// Safe:"; then
    echo "   ❌ ERREUR: Concaténation SQL détectée!"
    echo "   → Utiliser .bind() avec prepared statements"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ OK - Prepared statements utilisés correctement"
fi
echo ""

# Test 5: Vérifier que React.createElement est utilisé pour user input
echo "5️⃣  Vérification affichage user input..."
USER_INPUT_VARS="companyTitle|companySubtitle|ticket\.title|comment\.content"
if grep -rn "$USER_INPUT_VARS" src/index.tsx 2>/dev/null | grep -v "React.createElement\|\.trim()\|\.length" | grep -v "^[0-9]*:\s*//" | head -5; then
    echo "   ⚠️  Vérifier que ces variables sont affichées via React.createElement()"
    WARNINGS=$((WARNINGS + 1))
else
    echo "   ✅ OK - Variables affichées via React"
fi
echo ""

# Test 6: Détecter eval() (très dangereux)
echo "6️⃣  Vérification eval()..."
if grep -rn "eval(" src/ --include="*.tsx" --include="*.ts" 2>/dev/null; then
    echo "   ❌ ERREUR CRITIQUE: eval() détecté!"
    echo "   → eval() est extrêmement dangereux"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ OK - Pas d'utilisation de eval()"
fi
echo ""

# Test 7: Vérifier les secrets ne sont pas hardcodés
echo "7️⃣  Vérification secrets hardcodés..."
if grep -rn "password.*=.*['\"].*['\"]" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "password:" | grep -v "// Example\|// Test" | head -3; then
    echo "   ⚠️  WARNING: Possibles credentials hardcodés"
    echo "   → Utiliser variables d'environnement"
    WARNINGS=$((WARNINGS + 1))
else
    echo "   ✅ OK - Pas de secrets hardcodés"
fi
echo ""

# Résumé
echo "=================================="
echo "📊 RÉSUMÉ"
echo "=================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ Tous les tests passés!"
    echo ""
    echo "🎉 Aucun problème de sécurité détecté"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  $WARNINGS avertissement(s)"
    echo ""
    echo "Vérifier les warnings ci-dessus"
    exit 0
else
    echo "❌ $ERRORS erreur(s), $WARNINGS avertissement(s)"
    echo ""
    echo "CORRECTION REQUISE avant commit/déploiement!"
    exit 1
fi
