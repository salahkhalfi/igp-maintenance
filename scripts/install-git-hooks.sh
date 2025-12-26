#!/bin/bash
# Installation des Git hooks

echo "🔧 Installation Git Hooks..."
echo ""

# Créer répertoire hooks si nécessaire
mkdir -p .git/hooks

# Pre-commit hook
if [[ -f ".git/hooks/pre-commit" ]]; then
    echo "⚠️  Pre-commit hook existe déjà"
    read -p "Remplacer? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Installation annulée"
        exit 0
    fi
fi

cp scripts/git-hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "✅ Pre-commit hook installé"
echo ""
echo "Ce hook vérifie que dist/ est synchronisé avant chaque commit"
echo ""
echo "Pour désactiver:"
echo "  rm .git/hooks/pre-commit"
echo ""
echo "Pour bypass ponctuellement:"
echo "  git commit --no-verify"
