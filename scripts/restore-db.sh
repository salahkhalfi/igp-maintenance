#!/bin/bash
# Script de restauration de la base de données locale D1
# Auteur: Salah Khalfi
# Usage: ./scripts/restore-db.sh [fichier_backup.tar.gz]

set -e

BACKUP_DIR=".wrangler/backups"
DB_PATH=".wrangler/state/v3"

# Si aucun fichier spécifié, prendre le plus récent
if [ -z "$1" ]; then
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/maintenance-db_*.tar.gz 2>/dev/null | head -1)
    if [ -z "$BACKUP_FILE" ]; then
        echo "❌ Aucun backup trouvé dans $BACKUP_DIR"
        echo "Usage: $0 [fichier_backup.tar.gz]"
        exit 1
    fi
    echo "📁 Aucun fichier spécifié, utilisation du backup le plus récent:"
    echo "   $BACKUP_FILE"
else
    BACKUP_FILE="$1"
fi

# Vérifier que le fichier existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Fichier non trouvé: $BACKUP_FILE"
    exit 1
fi

# Demander confirmation
echo ""
echo "⚠️  ATTENTION: Cette opération va REMPLACER la base de données actuelle!"
echo "📦 Backup à restaurer: $BACKUP_FILE"
echo ""
read -p "Continuer? (oui/non): " CONFIRM

if [ "$CONFIRM" != "oui" ]; then
    echo "❌ Restauration annulée"
    exit 0
fi

# Arrêter PM2 si actif
echo "🛑 Arrêt du service PM2..."
pm2 stop maintenance-app 2>/dev/null || true

# Backup de la DB actuelle avant restauration
if [ -d "$DB_PATH/d1" ]; then
    SAFETY_BACKUP="$BACKUP_DIR/safety_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    echo "💾 Backup de sécurité de la DB actuelle..."
    tar -czf "$SAFETY_BACKUP" -C "$DB_PATH" d1/
    echo "✅ Sauvegarde de sécurité: $SAFETY_BACKUP"
fi

# Supprimer l'ancienne DB
echo "🗑️  Suppression de la DB actuelle..."
rm -rf "$DB_PATH/d1"

# Restaurer le backup
echo "📂 Restauration du backup..."
tar -xzf "$BACKUP_FILE" -C "$DB_PATH"

# Vérifier la restauration
if [ -d "$DB_PATH/d1" ]; then
    echo "✅ Base de données restaurée avec succès!"
    
    # Compter les tickets
    TICKET_COUNT=$(npx wrangler d1 execute maintenance-db --local --command="SELECT COUNT(*) as count FROM tickets" 2>/dev/null | grep -A 5 "results" | grep "count" | grep -oP '\d+' || echo "?")
    echo "📊 Tickets restaurés: $TICKET_COUNT"
else
    echo "❌ Erreur lors de la restauration!"
    exit 1
fi

# Redémarrer PM2
echo "🚀 Redémarrage du service..."
cd /home/user/webapp && pm2 restart maintenance-app

echo ""
echo "🎉 Restauration terminée avec succès!"
