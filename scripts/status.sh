#!/bin/bash
# ============================================================
# IGP Maintenance - Script de diagnostic système
# Usage: npm run status
# Auteur: Salah Khalfi
# 
# Ce script est en LECTURE SEULE - il ne modifie rien
# ============================================================

set -e

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Fonction pour afficher ✅ ou ❌
check_mark() {
    if [ "$1" = "ok" ]; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC}"
    fi
}

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║  IGP MAINTENANCE - Diagnostic système                        ║${NC}"
echo -e "${BOLD}╠══════════════════════════════════════════════════════════════╣${NC}"

# 1. Version
VERSION=$(grep '"version"' package.json | head -1 | grep -oP '"\d+\.\d+\.\d+[^"]*"' | tr -d '"')
echo -e "║  📦 Version        ${BLUE}$VERSION${NC}"

# 2. Build - Vérifier si dist existe et sa taille
if [ -f "dist/_worker.js" ]; then
    WORKER_SIZE=$(du -h dist/_worker.js | cut -f1)
    echo -e "║  🏗️  Build          $(check_mark ok) ${GREEN}OK${NC} ($WORKER_SIZE)"
else
    echo -e "║  🏗️  Build          $(check_mark fail) ${RED}Non compilé - npm run build${NC}"
fi

# 3. Base de données - Compter les lignes (estimation locale)
if [ -d ".wrangler/state/v3/d1" ]; then
    # Estimation basée sur la taille des fichiers
    DB_SIZE=$(du -sh .wrangler/state/v3/d1 2>/dev/null | cut -f1 || echo "?")
    echo -e "║  🗄️  DB locale       $(check_mark ok) ${GREEN}$DB_SIZE${NC}"
else
    echo -e "║  🗄️  DB locale       $(check_mark fail) ${YELLOW}Non initialisée${NC}"
fi

# 4. Backups - Compter les backups et vérifier l'âge
BACKUP_COUNT=$(ls -1 .wrangler/backups/maintenance-db_*.tar.gz 2>/dev/null | wc -l || echo "0")
if [ "$BACKUP_COUNT" -gt 0 ]; then
    LAST_BACKUP_FILE=$(ls -t .wrangler/backups/maintenance-db_*.tar.gz 2>/dev/null | head -1)
    # Calculer l'âge du dernier backup en jours
    LAST_BACKUP_TIME=$(stat -c %Y "$LAST_BACKUP_FILE" 2>/dev/null || stat -f %m "$LAST_BACKUP_FILE" 2>/dev/null || echo "0")
    NOW=$(date +%s)
    AGE_DAYS=$(( (NOW - LAST_BACKUP_TIME) / 86400 ))
    
    if [ "$AGE_DAYS" -gt 7 ]; then
        echo -e "║  💾 Backups         $(check_mark fail) ${YELLOW}$BACKUP_COUNT dispo - Dernier: ${RED}il y a ${AGE_DAYS}j${YELLOW} ⚠️${NC}"
    elif [ "$AGE_DAYS" -gt 3 ]; then
        echo -e "║  💾 Backups         $(check_mark ok) ${GREEN}$BACKUP_COUNT dispo${NC} ${YELLOW}(il y a ${AGE_DAYS}j)${NC}"
    else
        echo -e "║  💾 Backups         $(check_mark ok) ${GREEN}$BACKUP_COUNT dispo (il y a ${AGE_DAYS}j)${NC}"
    fi
else
    echo -e "║  💾 Backups         $(check_mark fail) ${YELLOW}Aucun - npm run db:backup${NC}"
fi

# 5. Git - État du repo
GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "?")
GIT_STATUS=$(git status --porcelain 2>/dev/null | wc -l || echo "?")
if [ "$GIT_STATUS" = "0" ]; then
    echo -e "║  📂 Git             $(check_mark ok) ${GREEN}$GIT_BRANCH (propre)${NC}"
else
    echo -e "║  📂 Git             $(check_mark fail) ${YELLOW}$GIT_BRANCH ($GIT_STATUS fichier(s) modifié(s))${NC}"
fi

# 6. Sécurité - Rate limiting (vérifier si le fichier existe)
if grep -q "strictRateLimit" src/routes/auth.ts 2>/dev/null; then
    echo -e "║  🔐 Rate limiting   $(check_mark ok) ${GREEN}Actif sur /auth${NC}"
else
    echo -e "║  🔐 Rate limiting   $(check_mark fail) ${RED}Non configuré${NC}"
fi

# 7. Documentation
if [ -f "CLAUDE.md" ]; then
    echo -e "║  📚 Documentation   $(check_mark ok) ${GREEN}CLAUDE.md présent${NC}"
else
    echo -e "║  📚 Documentation   $(check_mark fail) ${YELLOW}CLAUDE.md manquant${NC}"
fi

# 8. CRON nettoyage (vérifier dans scheduled.ts)
if grep -q "cleanupLogTables" src/scheduled.ts 2>/dev/null; then
    echo -e "║  🧹 Nettoyage auto  $(check_mark ok) ${GREEN}CRON configuré${NC}"
else
    echo -e "║  🧹 Nettoyage auto  $(check_mark fail) ${YELLOW}Non configuré${NC}"
fi

echo -e "${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Commandes utiles
echo -e "${BOLD}Commandes utiles :${NC}"
echo -e "  ${BLUE}npm run build${NC}         Compiler le projet"
echo -e "  ${BLUE}npm run db:backup${NC}     Sauvegarder la base locale"
echo -e "  ${BLUE}npm run dev${NC}           Lancer en développement"
echo -e "  ${BLUE}cat CLAUDE.md${NC}         Lire la documentation"
echo ""
