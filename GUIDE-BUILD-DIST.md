# 📘 GUIDE BUILD & DIST - MaintenanceOS

## ⚠️ PROBLÈME RÉCURRENT : BUILD PAS EFFECTUÉ DANS DIST

### Symptômes
- ✅ Code modifié dans `public/static/js/components/`
- ✅ Minification OK → `public/static/js/dist/*.min.js` à jour
- ✅ Cache bumped → `?v=HASH`
- ❌ **Mais** `dist/_worker.js` reste ANCIEN
- ❌ Production ne voit PAS les changements

---

## 🔍 CAUSE RACINE

```bash
# Workflow actuel (INCOMPLET)
npm run build:minify  # ✅ Minifie public/
                       # ❌ Ne touche PAS dist/_worker.js

npm run build         # ✅ Reconstruit dist/_worker.js
                       # Mais souvent OUBLIÉ
```

**Problème** : `dist/_worker.js` inclut `public/static/js/dist/*.min.js` au moment du build Vite.

Si on minifie APRÈS le build Vite, les changements ne sont PAS inclus.

---

## ✅ SOLUTION DÉFINITIVE

### Option A : Script de déploiement unique (RECOMMANDÉ)

```bash
# UN SEUL SCRIPT POUR TOUT
npm run deploy:dev
```

**Workflow automatisé** :
1. Clean port 3000
2. Build CSS (`npm run build:css`)
3. Minify legacy (`npm run build:minify`)
4. **Bump cache version** (`sed -i "s/?v=.../?v=$HASH/g"`)
5. **Build complet** (`npm run build` → reconstruit `dist/_worker.js`)
6. Vérifier `dist/_worker.js` existe
7. Start PM2
8. Test HTTP 200

**Avantages** :
- ✅ Ordre correct garanti
- ✅ Impossible d'oublier une étape
- ✅ Vérifie `dist/_worker.js` existe
- ✅ Test automatique endpoint

---

### Option B : Modifier `package.json` (Alternative)

```json
{
  "scripts": {
    "prebuild": "npm run build:css && npm run build:minify",
    "build": "npm run build:worker && npm run build:client && npm run build:messenger",
    "postbuild": "echo '✅ Build terminé - dist/_worker.js à jour'"
  }
}
```

**Avantages** :
- Automatique via hooks npm
- Un seul `npm run build`

**Inconvénients** :
- Pas de contrôle sur l'ordre
- Pas de vérification `dist/_worker.js`

---

### Option C : Pre-commit Hook (Git)

```bash
# .git/hooks/pre-commit
#!/bin/bash
if [[ -n $(git diff --name-only public/static/js/components/) ]]; then
    echo "🔄 Composants modifiés - Build requis"
    npm run build || exit 1
fi
```

**Avantages** :
- Bloque commit si build manquant

**Inconvénients** :
- Nécessite installation hook
- Peut être contourné (`git commit --no-verify`)

---

## 🚀 WORKFLOW RECOMMANDÉ

### Développement quotidien

```bash
# 1. Modifier composants
vim public/static/js/components/AppHeader.js

# 2. UN SEUL SCRIPT
npm run deploy:dev
# → Build complet automatique
# → Serveur démarré
# → Test HTTP 200

# 3. Tester localement
curl http://localhost:3000

# 4. Commit + Push
git add -A
git commit -m "✨ Feature: nouveau composant"
git push origin main
```

---

### Déploiement Production

```bash
# Production Cloudflare Pages
npm run deploy:prod
# → Build complet
# → Migrations D1
# → Deploy Cloudflare
```

---

## 📊 TIMESTAMPS - VÉRIFICATION RAPIDE

```bash
# Vérifier cohérence build
stat -c "%y %n" \
  dist/_worker.js \
  public/static/js/dist/AppHeader.min.js \
  src/views/home.ts

# Tous doivent avoir la même heure ±1 minute
```

**Exemple OK** :
```
2025-12-26 12:55:43 dist/_worker.js
2025-12-26 12:55:35 public/static/js/dist/AppHeader.min.js
2025-12-26 12:55:23 src/views/home.ts
```

**Exemple KO** :
```
2025-12-25 15:02:00 dist/_worker.js          ← ANCIEN
2025-12-26 12:55:35 public/static/js/dist/AppHeader.min.js  ← RÉCENT
```

---

## ⚡ COMMANDES RAPIDES

```bash
# Build complet avec démarrage serveur
npm run deploy:dev

# Build production
npm run build

# Nettoyage + rebuild
npm run clean:full && npm run deploy:dev

# Vérifier build actuel
ls -lh dist/_worker.js public/static/js/dist/
```

---

## 🔒 CHECKLIST PRÉ-COMMIT

- [ ] Code modifié dans `public/static/js/components/`
- [ ] `npm run deploy:dev` exécuté
- [ ] `dist/_worker.js` timestamp récent
- [ ] Test local OK (`curl http://localhost:3000`)
- [ ] Cache version bumped (`?v=HASH`)
- [ ] Commit + Push

---

## 📝 NOTES IMPORTANTES

1. **TOUJOURS utiliser `npm run deploy:dev`** après modification composants
2. **VÉRIFIER** `dist/_worker.js` timestamp avant commit
3. **NE JAMAIS** faire seulement `npm run build:minify`
4. **TESTER** localement avant push

---

## ❓ FAQ

**Q : Pourquoi `npm run build:minify` ne suffit pas ?**
R : Parce que `dist/_worker.js` (Vite Worker) doit inclure les `.min.js` au moment du build. Si on minifie après, les changements ne sont pas inclus.

**Q : Puis-je utiliser seulement `npm run build` ?**
R : Oui, MAIS il faut d'abord faire `npm run build:css` et `npm run build:minify`. Mieux vaut utiliser `npm run deploy:dev` qui fait tout dans le bon ordre.

**Q : Comment vérifier rapidement si dist/ est à jour ?**
R : `stat -c "%y" dist/_worker.js` → doit être très récent (< 5 minutes)

---

**✅ RÉSUMÉ : Utiliser `npm run deploy:dev` pour éviter le problème BUILD PAS EFFECTUÉ DANS DIST**
