# 🚀 QUICK REFERENCE - MaintenanceOS Build & Deploy

## ⚡ COMMANDES RAPIDES

### Développement

```bash
# Build complet + Start serveur (RECOMMANDÉ)
npm run deploy:dev

# Build seulement
npm run build:full

# Vérifier dist/ synchronisé
npm run check:dist

# Dev server Vite (frontend only)
npm run dev
```

### Vérifications

```bash
# Vérifier build sync
npm run check:dist

# Info déploiement
npm info

# URLs actuelles
npm run info:urls

# Branche actuelle
npm run check:branch
```

### Production

```bash
# Deploy Cloudflare Pages
npm run deploy:prod

# Deploy avec tests
npm run deploy:test

# Deploy safe (avec migrations D1)
npm run deploy:safe
```

---

## 📦 WORKFLOW BUILD

### Option 1 : Script tout-en-un (RECOMMANDÉ)

```bash
npm run deploy:dev
```

**Ce qu'il fait** :
1. ✅ Clean port 3000
2. ✅ Build CSS
3. ✅ Minify legacy components
4. ✅ Bump cache version (?v=HASH)
5. ✅ Build complet (worker + client + messenger)
6. ✅ Start PM2
7. ✅ Test HTTP 200

---

### Option 2 : Build manuel

```bash
# 1. Build CSS
npm run build:css

# 2. Minify legacy
npm run build:minify

# 3. Bump cache
HASH=$(git log --oneline -1 | awk '{print $1}')
sed -i "s/?v=[a-z0-9]*/?v=$HASH/g" src/views/home.ts

# 4. Build complet
npm run build

# 5. Start PM2
fuser -k 3000/tcp 2>/dev/null || true
pm2 start ecosystem.config.cjs

# 6. Test
curl http://localhost:3000
```

---

## ⚠️ PROBLÈME RÉCURRENT : BUILD PAS DANS DIST

### Symptômes
- Composant modifié
- Minification OK
- Cache bumped
- **MAIS** changements pas visibles en production

### Cause
`npm run build:minify` ne reconstruit **PAS** `dist/_worker.js`

### Solution
**TOUJOURS** utiliser `npm run build:full` ou `npm run deploy:dev`

---

## 🔍 VÉRIFICATION RAPIDE

```bash
# Vérifier timestamps
npm run check:dist

# Ou manuellement
stat -c "%y" dist/_worker.js public/static/js/dist/AppHeader.min.js
```

**OK si** :
- Timestamps < 2 minutes d'écart
- dist/_worker.js PLUS RÉCENT que .min.js

**KO si** :
- dist/_worker.js PLUS ANCIEN
- Écart > 5 minutes

---

## 🔒 GIT HOOKS (Optionnel)

```bash
# Installer pre-commit hook
bash scripts/install-git-hooks.sh
```

**Ce qu'il fait** :
- Bloque commit si composants modifiés
- Vérifie dist/_worker.js à jour
- Force `npm run build:full` si nécessaire

**Bypass** :
```bash
git commit --no-verify
```

---

## 📝 CHECKLIST PRÉ-COMMIT

- [ ] Code modifié
- [ ] `npm run deploy:dev` exécuté
- [ ] `npm run check:dist` OK
- [ ] Test local réussi
- [ ] Cache version bumped
- [ ] Commit + Push

---

## 🛠️ DEBUGGING

### Serveur ne démarre pas
```bash
# Clean complet
npm run clean:full
npm run deploy:dev
```

### Changements pas visibles
```bash
# Vérifier build
npm run check:dist

# Rebuild complet
npm run build:full
pm2 restart webapp
```

### Cache navigateur
```bash
# Hard refresh
Ctrl + Shift + R

# Ou vérifier version
curl http://localhost:3000/ | grep "?v="
```

---

## 📊 STRUCTURE BUILD

```
Source modifié
    ↓
build:css (TailwindCSS)
    ↓
build:minify (Legacy components)
    ↓
build (Vite Worker + Client)
    ↓
dist/_worker.js (PRODUCTION)
```

**Important** : `dist/_worker.js` DOIT être construit APRÈS `build:minify`

---

## 🎯 RÉSUMÉ

**1 COMMANDE POUR TOUT** :
```bash
npm run deploy:dev
```

**VÉRIFICATION** :
```bash
npm run check:dist
```

**DEBUGGING** :
```bash
npm run clean:full && npm run deploy:dev
```

---

**📘 Documentation complète** : `GUIDE-BUILD-DIST.md`
