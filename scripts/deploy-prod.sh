#!/bin/bash

# Arrêter en cas d'erreur
set -e

echo "🚀 Démarrage du déploiement séquentiel (Anti-Crash)..."

# 1. Compilation du Client Principal
echo "📦 Étape 1/3 : Compilation Client (Est: ~10s)..."
npm run build:client
echo "✅ Client terminé."
echo "💤 Pause refroidissement (2s)..."
sleep 2

# 2. Compilation du Messenger
echo "💬 Étape 2/3 : Compilation Messenger (ATTENTION: Est: ~2 min)..."
npm run build:messenger
echo "✅ Messenger terminé."
echo "💤 Pause refroidissement (2s)..."
sleep 2

# 3. Compilation du Worker (Backend)
echo "⚙️ Étape 3/3 : Compilation Worker (Est: ~45s)..."
npm run build:worker
echo "✅ Worker terminé."

# 4. Vérification avant envoi
if [ ! -d "dist" ]; then
  echo "❌ Erreur : Le dossier dist est manquant !"
  exit 1
fi

# 5. Déploiement
echo "☁️ Envoi vers Cloudflare..."
npx wrangler pages deploy dist --project-name webapp --branch main --commit-dirty=true

echo "✨ Déploiement terminé avec succès !"
