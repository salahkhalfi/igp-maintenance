#!/bin/bash
# Backup automatique quotidien
# Auteur: Salah Khalfi
# À ajouter dans crontab pour exécution automatique

cd /home/user/webapp
npm run db:backup

# Log l'exécution
echo "[$(date)] Backup automatique exécuté" >> /home/user/webapp/.wrangler/backups/auto-backup.log
