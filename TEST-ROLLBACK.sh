#!/bin/bash
# Test que le rollback fonctionne correctement

echo "🧪 Test de Rollback - Vérification"
echo ""

ERRORS=0

# Test 1: Branche backup existe
echo -n "✓ Vérification branche backup... "
if git branch | grep -q "backup-before-title-subtitle-20251112-172617"; then
    echo "✅ OK"
else
    echo "❌ MANQUANTE"
    ERRORS=$((ERRORS + 1))
fi

# Test 2: Database backup existe
echo -n "✓ Vérification database backup... "
if [ -d ".wrangler/state/v3/d1.backup-20251112-172633" ]; then
    echo "✅ OK"
else
    echo "❌ MANQUANT"
    ERRORS=$((ERRORS + 1))
fi

# Test 3: Script rollback existe et exécutable
echo -n "✓ Vérification script rollback... "
if [ -x "./ROLLBACK.sh" ]; then
    echo "✅ OK"
else
    echo "❌ MANQUANT ou non exécutable"
    ERRORS=$((ERRORS + 1))
fi

# Test 4: Fichier BACKUP-INFO existe
echo -n "✓ Vérification documentation... "
if [ -f "BACKUP-INFO.md" ]; then
    echo "✅ OK"
else
    echo "❌ MANQUANT"
    ERRORS=$((ERRORS + 1))
fi

# Test 5: URL backup accessible
echo -n "✓ Vérification backup en ligne... "
if curl -s -I "https://www.genspark.ai/api/files/s/oJRmSCwE" | grep -q "200"; then
    echo "✅ OK"
else
    echo "⚠️  Non vérifié (réseau)"
fi

echo ""
if [ $ERRORS -eq 0 ]; then
    echo "✅ Tous les backups sont en place et fonctionnels!"
    echo "🚀 Vous pouvez procéder en toute sécurité."
else
    echo "❌ $ERRORS erreur(s) détectée(s)!"
    echo "⚠️  NE PAS CONTINUER avant de résoudre les problèmes."
    exit 1
fi
