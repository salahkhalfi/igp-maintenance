# 🔒 ROLLBACK INFORMATION - Production Stable

**Date:** 2025-11-08 13:30 UTC  
**Status:** BACKUP AVANT DÉPLOIEMENT BADGE BLEU

---

## 📦 Version Production Actuelle (STABLE)

### Git Information
- **Commit:** f092e67
- **Tag:** v2.0.4-production-stable
- **Branch:** main
- **Message:** "Fix: Display assignee name (Brahim) instead of ID (Tech #6) in planned tasks banner and modal"

### Cloudflare Deployment
- **Deployment ID:** feb25e5e-bc33-4f41-9ba5-db5da1b4ebe3
- **URL:** https://feb25e5e.webapp-7t8.pages.dev
- **Production URL:** https://app.igpglass.ca
- **Environment:** Production
- **Branch:** main
- **Source:** f092e67
- **Status:** ✅ STABLE ET FONCTIONNEL

### Backup Archives
- **ProjectBackup:** https://page.gensparksite.com/project_backups/webapp_production_stable_v2.0.4_before_blue_badge.tar.gz
- **Size:** 15.7 MB
- **Description:** Production stable - Badge orange AVANT changement bleu

---

## 🔄 PROCÉDURE DE ROLLBACK (Si Besoin)

### Option 1: Rollback Git (Le Plus Simple) ⭐
```bash
cd /home/user/webapp
git checkout main
git reset --hard v2.0.4-production-stable
npm run build
npx wrangler pages deploy dist --project-name webapp --branch main
```

### Option 2: Rollback Cloudflare Direct (Ultra Rapide)
```bash
# Cloudflare garde automatiquement l'ancien déploiement
# Il suffit de retourner sur l'ancien déploiement ID dans le dashboard
# URL: https://dash.cloudflare.com/...pages/view/webapp/feb25e5e...
# Ou rediriger le domaine vers l'ancien déploiement
```

### Option 3: Restaurer depuis ProjectBackup
```bash
cd /home/user
wget https://page.gensparksite.com/project_backups/webapp_production_stable_v2.0.4_before_blue_badge.tar.gz
tar -xzf webapp_production_stable_v2.0.4_before_blue_badge.tar.gz
cd webapp
npm run build
npx wrangler pages deploy dist --project-name webapp --branch main
```

### Option 4: Checkout du Commit Directement
```bash
cd /home/user/webapp
git checkout f092e67
npm run build
npx wrangler pages deploy dist --project-name webapp --branch main
```

---

## 🎯 Nouveau Déploiement (Badge Bleu)

### Changement
- **Description:** Badge "EN DÉVELOPPEMENT" passe d'orange à bleu (couleurs IGP)
- **Fichier modifié:** src/index.tsx (ligne 2093)
- **Changement:** `from-amber-500 to-amber-600` → `from-blue-600 to-blue-700`
- **Commit:** 05d886b
- **Testé sur:** webapp-test (https://ea1b8169.webapp-test-b59.pages.dev)

---

## ✅ Checklist de Vérification Post-Déploiement

- [ ] Badge bleu visible sur page login
- [ ] Bon contraste texte blanc sur bleu
- [ ] Login fonctionne
- [ ] Création de ticket fonctionne
- [ ] Upload média fonctionne
- [ ] Messagerie fonctionne
- [ ] Gestion utilisateurs fonctionne (admin)

---

## 🚨 EN CAS DE PROBLÈME

**SI QUELQUE CHOSE NE MARCHE PAS:**
1. ⚠️ **NE PANIQUEZ PAS**
2. 🔄 Utilisez Option 1 (Rollback Git) ci-dessus
3. ✅ Vous serez de retour à la version stable en 2 minutes
4. 🔒 Aucune donnée perdue (base de données D1 inchangée)

---

**Créé le:** 2025-11-08 13:30 UTC  
**Par:** Claude Code Assistant  
**Raison:** Déploiement modification badge bleu
