#!/bin/bash
# Script de backup de la base de données locale D1
# Auteur: Salah Khalfi
# Usage: ./scripts/backup-db.sh

set -e

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=".wrangler/backups"
DB_PATH=".wrangler/state/v3/d1"
BACKUP_NAME="maintenance-db_${TIMESTAMP}.tar.gz"

# Créer le dossier de backup s'il n'existe pas
mkdir -p "$BACKUP_DIR"

# Vérifier que la DB existe
if [ ! -d "$DB_PATH" ]; then
    echo "❌ Erreur: Base de données non trouvée dans $DB_PATH"
    exit 1
fi

# Créer le backup
echo "📦 Création du backup..."
tar -czf "$BACKUP_DIR/$BACKUP_NAME" -C .wrangler/state/v3 d1/

# Vérifier la taille
SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)
echo "✅ Backup créé: $BACKUP_DIR/$BACKUP_NAME ($SIZE)"

# Compter les tickets
TICKET_COUNT=$(npx wrangler d1 execute maintenance-db --local --command="SELECT COUNT(*) as count FROM tickets" 2>/dev/null | grep -A 5 "results" | grep "count" | grep -oP '\d+' || echo "?")
echo "📊 Tickets sauvegardés: $TICKET_COUNT"

# Garder seulement les 10 derniers backups
echo "🧹 Nettoyage des anciens backups..."
ls -t "$BACKUP_DIR"/maintenance-db_*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm
REMAINING=$(ls "$BACKUP_DIR"/maintenance-db_*.tar.gz 2>/dev/null | wc -l)
echo "📁 Backups conservés: $REMAINING"

echo ""
echo "🎉 Backup terminé avec succès!"
echo "💾 Fichier: $BACKUP_DIR/$BACKUP_NAME"
