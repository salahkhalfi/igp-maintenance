#!/bin/bash
# Script de backup de la base de données D1 PRODUCTION (remote)
# Auteur: Salah Khalfi
# Usage: ./scripts/backup-db-remote.sh
#
# Ce script exporte les données de la BD de production vers un fichier SQL

set -e

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/remote"
BACKUP_NAME="maintenance-db-prod_${TIMESTAMP}.sql"
DB_NAME="maintenance-db"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📦 Backup de la base de données PRODUCTION${NC}"
echo "================================================"

# Créer le dossier de backup s'il n'existe pas
mkdir -p "$BACKUP_DIR"

# Vérifier que wrangler est disponible
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Erreur: wrangler n'est pas installé${NC}"
    exit 1
fi

# Liste des tables à exporter
TABLES=(
    "users"
    "tickets"
    "ticket_timeline"
    "machines"
    "comments"
    "media"
    "chat_conversations"
    "chat_participants"
    "chat_messages"
    "system_settings"
    "roles"
    "permissions"
    "role_permissions"
    "push_subscriptions"
    "notification_preferences"
    "planning_events"
)

echo -e "${YELLOW}📊 Export des tables...${NC}"

# Fichier de sortie
OUTPUT_FILE="$BACKUP_DIR/$BACKUP_NAME"
echo "-- Backup de maintenance-db (production)" > "$OUTPUT_FILE"
echo "-- Date: $(date)" >> "$OUTPUT_FILE"
echo "-- Tables: ${#TABLES[@]}" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Exporter chaque table
for TABLE in "${TABLES[@]}"; do
    echo -n "  - $TABLE... "
    
    # Compter les lignes
    COUNT=$(npx wrangler d1 execute "$DB_NAME" --remote --command="SELECT COUNT(*) as c FROM $TABLE" 2>/dev/null | grep -oP '"c":\s*\K\d+' || echo "0")
    
    if [ "$COUNT" != "0" ]; then
        # Exporter les données en JSON
        echo "-- Table: $TABLE ($COUNT rows)" >> "$OUTPUT_FILE"
        npx wrangler d1 execute "$DB_NAME" --remote --command="SELECT * FROM $TABLE" --json >> "$OUTPUT_FILE" 2>/dev/null || true
        echo "" >> "$OUTPUT_FILE"
        echo -e "${GREEN}$COUNT lignes${NC}"
    else
        echo -e "${YELLOW}vide${NC}"
    fi
done

# Compresser le fichier
echo -e "${YELLOW}📦 Compression...${NC}"
gzip -f "$OUTPUT_FILE"
COMPRESSED_FILE="${OUTPUT_FILE}.gz"

# Afficher les statistiques
SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
echo ""
echo -e "${GREEN}✅ Backup terminé avec succès!${NC}"
echo "================================================"
echo -e "📁 Fichier: ${GREEN}$COMPRESSED_FILE${NC}"
echo -e "📦 Taille: ${GREEN}$SIZE${NC}"
echo ""
echo "Pour restaurer: gunzip $COMPRESSED_FILE"

# Garder seulement les 5 derniers backups remote
echo -e "${YELLOW}🧹 Nettoyage des anciens backups...${NC}"
ls -t "$BACKUP_DIR"/maintenance-db-prod_*.sql.gz 2>/dev/null | tail -n +6 | xargs -r rm
REMAINING=$(ls "$BACKUP_DIR"/maintenance-db-prod_*.sql.gz 2>/dev/null | wc -l)
echo -e "📁 Backups conservés: ${GREEN}$REMAINING${NC}"
