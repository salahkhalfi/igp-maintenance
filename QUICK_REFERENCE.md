# ⚡ QUICK REFERENCE - Antisèche Déploiement

**🎯 Utilisez ce guide pour éviter les erreurs!**

---

## 🚀 DÉPLOIEMENT EN 3 ÉTAPES

### 1️⃣ TEST (webapp-test)
```bash
./scripts/deploy-test.sh
```
**OU manuellement:**
```bash
git checkout development
npm run build
npx wrangler pages deploy dist --project-name webapp-test --branch main
```

### 2️⃣ VÉRIFICATION
- Ouvrir: Voir URL dans DEPLOYMENT_CONFIG.md
- Login: admin@igpglass.ca / password123
- Tester les fonctionnalités modifiées

### 3️⃣ PRODUCTION (si OK)
```bash
./scripts/deploy-prod.sh
```
**OU manuellement:**
```bash
# Backup
git tag -a backup-$(date +%Y%m%d) -m "Backup"

# Deploy
git checkout main
git merge development
npm run build
npx wrangler pages deploy dist --project-name webapp --branch main

# Tag version
git tag -a v2.0.X -m "Version 2.0.X"
git checkout development
```

---

## 📍 OÙ TROUVER LES URLS?

### Fichier à Consulter: `DEPLOYMENT_CONFIG.md`
```bash
cat DEPLOYMENT_CONFIG.md | grep "URL"
```

### Commandes Git
```bash
# Voir les tags
git tag -l

# Voir le commit actuel
git log --oneline -1

# Voir la branche actuelle
git branch --show-current
```

### Commandes Cloudflare
```bash
# Lister tous les déploiements
npx wrangler pages deployment list --project-name webapp | head -10

# Lister webapp-test
npx wrangler pages deployment list --project-name webapp-test | head -10
```

---

## 🔄 ROLLBACK RAPIDE

### Si Production Cassée
```bash
git checkout main
git reset --hard v2.0.4-production-stable
npm run build
npx wrangler pages deploy dist --project-name webapp --branch main
```

### URLs de Backup
Voir: `DEPLOYMENT_CONFIG.md` section "Backup"

---

## ✅ CHECKLIST AVANT DÉPLOIEMENT

- [ ] Code committé sur `development`
- [ ] Testé sur `webapp-test`
- [ ] Login vérifié
- [ ] Fonctionnalités testées
- [ ] Backup tag créé
- [ ] DEPLOYMENT_CONFIG.md prêt à être mis à jour

---

## 📝 APRÈS DÉPLOIEMENT

### ⚠️ OBLIGATOIRE - Mettre à jour:
1. `DEPLOYMENT_CONFIG.md` - Nouvelle URL + Deployment ID
2. `README.md` - Si nécessaire
3. Commit: `git commit -m "docs: Update deployment info"`

---

## 🆘 EN CAS DE DOUTE

1. **Vérifier:** `DEPLOYMENT_CONFIG.md`
2. **Lister tags:** `git tag -l`
3. **Voir déploiements:** `npx wrangler pages deployment list --project-name webapp`
4. **Consulter:** `ROLLBACK_INFO.md`

---

## 🎯 RÈGLES D'OR

1. ✅ **TOUJOURS** tester sur webapp-test AVANT production
2. ✅ **TOUJOURS** créer un backup tag avant production
3. ✅ **TOUJOURS** mettre à jour DEPLOYMENT_CONFIG.md après déploiement
4. ✅ **JAMAIS** déployer directement en production sans test
5. ✅ **JAMAIS** oublier de vérifier la branche: `git branch --show-current`

---

## 📊 STRUCTURE DES BRANCHES

```
development  ← Travailler ici
    ↓
webapp-test  ← Tester ici
    ↓
main        ← Merger ici
    ↓
production  ← Déployer depuis ici
```

---

**Dernière mise à jour:** 2025-11-08
