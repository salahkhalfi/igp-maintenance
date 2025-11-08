#!/bin/bash
# 📊 Script de Mesure de Taille
# Usage: bash scripts/measure-size.sh

echo "╔════════════════════════════════════════════════════════╗"
echo "║       📊 MESURE DE LA TAILLE DE L'APPLICATION         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo "=== 📁 AVANT BUILD (Source) ==="
echo ""
echo "Total src/:"
du -sh src/
echo ""
echo "index.tsx:"
du -h src/index.tsx
echo ""
echo "Composants communs:"
if [ -d "src/components/common" ]; then
  du -sh src/components/common
  ls -lh src/components/common/*.tsx 2>/dev/null | awk '{print "  " $9 ": " $5}'
else
  echo "  (pas encore créés)"
fi
echo ""

echo "=== 📦 LIGNES DE CODE ==="
echo ""
echo "index.tsx:"
wc -l src/index.tsx | awk '{print "  " $1 " lignes"}'
echo ""
echo "Composants communs:"
if [ -d "src/components/common" ]; then
  find src/components/common -name "*.tsx" -exec wc -l {} + | tail -1 | awk '{print "  " $1 " lignes"}'
else
  echo "  0 lignes (pas encore créés)"
fi
echo ""

echo "=== 🔧 BUILD EN COURS... ==="
echo ""
npm run build 2>&1 | grep -E "built in|dist/_worker.js"
echo ""

if [ -f "dist/_worker.js" ]; then
  echo "=== 📦 APRÈS BUILD ==="
  echo ""
  echo "Build final:"
  ls -lh dist/_worker.js | awk '{print "  dist/_worker.js: " $5}'
  echo ""
  
  echo "=== 📊 COMPARAISON ==="
  echo ""
  SRC_SIZE=$(du -sk src/ | cut -f1)
  BUILD_SIZE=$(ls -lk dist/_worker.js | awk '{print $5}')
  
  echo "  Source totale:   ${SRC_SIZE} KB"
  echo "  Build final:     ${BUILD_SIZE} KB"
  
  # Calcul du ratio
  RATIO=$((BUILD_SIZE * 100 / SRC_SIZE))
  echo "  Ratio:           ${RATIO}%"
  echo ""
  
  # Évaluation
  if [ $BUILD_SIZE -lt 300 ]; then
    echo "  ✅ EXCELLENT - Build < 300 KB"
  elif [ $BUILD_SIZE -lt 400 ]; then
    echo "  ✅ BON - Build < 400 KB"
  elif [ $BUILD_SIZE -lt 500 ]; then
    echo "  ⚠️  MOYEN - Build < 500 KB (optimisation recommandée)"
  else
    echo "  🔴 LOURD - Build > 500 KB (optimisation nécessaire!)"
  fi
  echo ""
else
  echo "❌ Build échoué - dist/_worker.js non trouvé"
  echo ""
fi

echo "╔════════════════════════════════════════════════════════╗"
echo "║                     FIN DE MESURE                      ║"
echo "╚════════════════════════════════════════════════════════╝"
