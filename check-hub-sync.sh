#!/bin/bash
# Script de vérification de synchronisation Hub
# Usage: ./check-hub-sync.sh

echo "🔍 Vérification de l'état de synchronisation Hub..."
echo ""

# Extraire la version actuelle du document
VERSION=$(grep -m1 "^\*\*Version:\*\*" LESSONS-LEARNED-MEMOIRE.md | sed 's/.*Version:\*\* \(.*\)/\1/')
LAST_UPDATE=$(grep -m1 "^\*\*Dernière mise à jour:\*\*" LESSONS-LEARNED-MEMOIRE.md | sed 's/.*jour:\*\* \(.*\)/\1/')

echo "📄 Document: LESSONS-LEARNED-MEMOIRE.md"
echo "📌 Version: $VERSION"
echo "📅 Dernière mise à jour: $LAST_UPDATE"
echo ""

# Vérifier les commits depuis la dernière mise à jour
COMMITS_SINCE=$(git log --oneline --since="$LAST_UPDATE" -- LESSONS-LEARNED-MEMOIRE.md | wc -l)

if [ "$COMMITS_SINCE" -gt 0 ]; then
    echo "⚠️  ATTENTION: $COMMITS_SINCE commit(s) depuis la dernière mise à jour"
    echo "📝 Commits récents:"
    git log --oneline --since="$LAST_UPDATE" -- LESSONS-LEARNED-MEMOIRE.md
    echo ""
    echo "🔔 RAPPEL: Pensez à synchroniser le Hub!"
    echo "   Téléchargez depuis:"
    echo "   https://raw.githubusercontent.com/salahkhalfi/igp-maintenance/main/LESSONS-LEARNED-MEMOIRE.md"
else
    echo "✅ Document à jour - Pas de nouveaux commits"
fi

echo ""
echo "📊 Statistiques du document:"
LINES=$(wc -l < LESSONS-LEARNED-MEMOIRE.md)
SOLUTIONS=$(grep -c "^### [0-9]" LESSONS-LEARNED-MEMOIRE.md)
echo "   - $LINES lignes"
echo "   - $SOLUTIONS catégories de solutions"
echo ""

# Vérifier si le document existe sur GitHub
echo "🌐 Vérification GitHub:"
if curl -s "https://raw.githubusercontent.com/salahkhalfi/igp-maintenance/main/LESSONS-LEARNED-MEMOIRE.md" | head -n 1 | grep -q "MÉMOIRE COLLECTIVE"; then
    echo "   ✅ Document disponible sur GitHub"
else
    echo "   ❌ Erreur d'accès GitHub"
fi

echo ""
echo "✨ Vérification terminée"
