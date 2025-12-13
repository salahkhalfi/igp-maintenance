# 🚀 DEPLOYMENT CONFIGURATION - Source de Vérité Unique

**⚠️ CE FICHIER EST LA SOURCE DE VÉRITÉ - Mettre à jour après chaque déploiement**

---

## 📍 URLS ACTUELLES (Mise à jour: 2025-11-08)

### Production
- **URL Principale:** https://app.igpglass.ca
- **Déploiement Cloudflare:** https://f74eb9a8.webapp-7t8.pages.dev
- **Deployment ID:** f74eb9a8-xxxx-xxxx-xxxx-xxxxxxxxxxxx
- **Commit Git:** 6413b44 (main branch)
- **Tag Git:** v2.0.5-blue-badge
- **Version:** v2.0.5
- **Caractéristique:** Badge bleu IGP

### Test (webapp-test)
- **URL Test:** https://ea1b8169.webapp-test-b59.pages.dev
- **Deployment ID:** ea1b8169-xxxx-xxxx-xxxx-xxxxxxxxxxxx
- **Commit Git:** 05d886b (development branch)
- **Version:** v2.0.5
- **Usage:** Tester modifications avant production

### Backup (Version Stable Précédente)
- **URL Backup:** https://feb25e5e.webapp-7t8.pages.dev
- **Deployment ID:** feb25e5e-bc33-4f41-9ba5-db5da1b4ebe3
- **Commit Git:** f092e67
- **Tag Git:** v2.0.4-production-stable
- **Version:** v2.0.4
- **Caractéristique:** Badge orange (BACKUP DE SÉCURITÉ)
- **Rollback Archive:** https://page.gensparksite.com/project_backups/webapp_production_stable_v2.0.4_before_blue_badge.tar.gz

---

## 🔐 IDENTIFIANTS (Tous Environnements)

- **Email Admin:** admin@igpglass.ca
- **Password:** password123

---

## 📊 WORKFLOW DE DÉPLOIEMENT

```
┌─────────────┐
│ development │  ← Modifications ici
└──────┬──────┘
       │
       │ 1. Test local
       ↓
┌─────────────┐
│ webapp-test │  ← Déployer et tester ici TOUJOURS
└──────┬──────┘
       │
       │ 2. Si OK, merge
       ↓
┌─────────────┐
│    main     │  ← Merger ici
└──────┬──────┘
       │
       │ 3. Déployer production
       ↓
┌─────────────┐
│ PRODUCTION  │  ← Vérifier ici
└─────────────┘
```

---

## ✅ CHECKLIST DE DÉPLOIEMENT

### Avant Chaque Déploiement:
- [ ] Code committé sur branch development
- [ ] Build réussi: `npm run build`
- [ ] Déployé sur webapp-test
- [ ] Testé sur webapp-test (URL ci-dessus)
- [ ] Login fonctionne
- [ ] Fonctionnalités principales testées

### Déploiement Production:
- [ ] Tag git créé pour backup: `git tag -a vX.X.X-backup`
- [ ] ProjectBackup créé (si changement majeur)
- [ ] ROLLBACK_INFO.md mis à jour
- [ ] Merge development → main
- [ ] Build: `npm run build`
- [ ] Deploy: `npx wrangler pages deploy dist --project-name webapp --branch main`
- [ ] **Capturer le nouveau deployment ID**
- [ ] **Mettre à jour ce fichier (DEPLOYMENT_CONFIG.md)**
- [ ] Tester production: https://app.igpglass.ca
- [ ] Mettre à jour README.md si nécessaire

### Après Déploiement:
- [ ] Vérifier login production
- [ ] Créer ticket test
- [ ] Vérifier upload média
- [ ] Vérifier messagerie
- [ ] **Mettre à jour les URLs dans ce fichier**
- [ ] Commit DEPLOYMENT_CONFIG.md

---

## 🔄 TEMPLATE DE MISE À JOUR

**Après chaque déploiement production, copier-coller et remplir:**

```markdown
## Déploiement du YYYY-MM-DD

### Production
- URL: https://XXXXXXXX.webapp-7t8.pages.dev
- Commit: XXXXXXX
- Tag: vX.X.X
- Changement: [Description]

### Test  
- URL: https://XXXXXXXX.webapp-test-b59.pages.dev
- Commit: XXXXXXX
- Version: vX.X.X

### Backup Précédent
- URL: https://XXXXXXXX.webapp-7t8.pages.dev
- Tag: vX.X.X-backup
```

---

## 📝 HISTORIQUE DES DÉPLOIEMENTS

### 2025-11-08 - v2.0.5 (Badge Bleu)
- **Production:** f74eb9a8.webapp-7t8.pages.dev
- **Test:** ea1b8169.webapp-test-b59.pages.dev
- **Backup:** feb25e5e (v2.0.4-production-stable)
- **Changement:** Badge "EN DÉVELOPPEMENT" orange → bleu (couleurs IGP)
- **Status:** ✅ Déployé et vérifié

### 2025-11-08 - v2.0.4 (Badge Orange - BACKUP)
- **Production:** feb25e5e.webapp-7t8.pages.dev
- **Commit:** f092e67
- **Tag:** v2.0.4-production-stable
- **Caractéristique:** Version stable de référence

---

## 🚨 EN CAS D'ERREUR

**Si vous ne savez plus quelle version est où:**

1. **Vérifier ce fichier DEPLOYMENT_CONFIG.md**
2. Regarder les URLs ci-dessus
3. Vérifier les tags git: `git tag -l`
4. Lister les déploiements: `npx wrangler pages deployment list --project-name webapp`

**Si quelque chose est cassé:**
- Consulter ROLLBACK_INFO.md
- Utiliser le tag backup: v2.0.4-production-stable

---

**⚠️ IMPORTANT: Toujours mettre à jour ce fichier après un déploiement!**

**Dernière mise à jour:** 2025-11-08 14:00 UTC  
**Mis à jour par:** Claude Code Assistant
