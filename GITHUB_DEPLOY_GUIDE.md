# 🚀 Guide de Déploiement GitHub

## 📋 Situation Actuelle

Le repository GitHub a été configuré :
- **URL**: https://github.com/salahkhalfi/igp-maintenance.git
- **Remote**: `origin` ajouté avec succès
- **Branche**: `main`
- **Status**: ⚠️ En attente d'authentification

---

## 🔐 Méthodes d'Authentification

### Méthode 1 : Via Interface Sandbox (Recommandé)

1. **Accédez à l'onglet #github** dans l'interface du sandbox
2. **Autorisez GitHub** :
   - GitHub App authorization
   - OAuth authorization
3. **Une fois configuré**, exécutez dans le terminal :
   ```bash
   cd /home/user/webapp
   git push -u origin main --tags
   ```

### Méthode 2 : Personal Access Token (PAT)

Si vous avez un Personal Access Token GitHub :

1. **Créer un PAT** (si vous n'en avez pas) :
   - Allez sur https://github.com/settings/tokens
   - Generate new token (classic)
   - Sélectionnez scopes : `repo` (accès complet)
   - Copiez le token généré

2. **Pousser avec le token** :
   ```bash
   cd /home/user/webapp
   git push https://TOKEN@github.com/salahkhalfi/igp-maintenance.git main --tags
   ```
   Remplacez `TOKEN` par votre token GitHub

### Méthode 3 : GitHub CLI

Si GitHub CLI est configuré :

```bash
cd /home/user/webapp
gh auth login
git push -u origin main --tags
```

---

## 📦 Ce Qui Sera Poussé

### Statistiques
- **Commits**: 89 commits au total
- **Tags**: 7 tags (versions)
- **Branches**: 1 branche (main)
- **Taille**: ~910 KB

### Derniers Commits
```
152b20b - 📅 CORRECTION DES DATES - 2025
58e3166 - 📋 CHANGELOG v1.8.2 - Domaine igpglass.ca
56603f3 - 📝 DOCUMENTATION MISE À JOUR - v1.8.2
9d6fb42 - ✅ R2 BUCKET ACTIVÉ - Déploiement complet
a49a3ac - 🚀 DÉPLOYÉ EN PRODUCTION - v1.8.1
```

### Tags à Pousser
```
v1.8.2-final-2025           ← Version actuelle
v1.8.2-domain-igpglass.ca
v1.8.1-production-complete
v1.8.1-production
v1.8.1-3d-pro
v1.8.0-stable
v1.9.0-premium
```

### Fichiers Principaux
```
src/index.tsx              (Application complète)
migrations/                (3 fichiers SQL)
wrangler.jsonc            (Configuration Cloudflare)
package.json              (Dépendances)
DEPLOYMENT.md             (Guide de déploiement)
CHANGELOG_v1.8.2.md       (Notes de version)
README.md                 (Documentation)
```

---

## ✅ Commandes de Vérification

### Vérifier le remote
```bash
cd /home/user/webapp
git remote -v
```

### Vérifier les commits à pousser
```bash
cd /home/user/webapp
git log --oneline -10
```

### Vérifier les tags
```bash
cd /home/user/webapp
git tag -l
```

### Vérifier le statut
```bash
cd /home/user/webapp
git status
```

---

## 🔄 Commandes de Push

### Push de la branche principale
```bash
cd /home/user/webapp
git push -u origin main
```

### Push des tags
```bash
cd /home/user/webapp
git push origin --tags
```

### Push en une seule commande
```bash
cd /home/user/webapp
git push -u origin main --tags
```

### Force push (si nécessaire)
⚠️ **Attention** : Utiliser seulement si le repository est vide ou si vous êtes sûr
```bash
cd /home/user/webapp
git push -f origin main --tags
```

---

## 🌐 Après le Push

### Vérifier sur GitHub
1. Allez sur https://github.com/salahkhalfi/igp-maintenance
2. Vérifiez que tous les fichiers sont présents
3. Vérifiez les tags : https://github.com/salahkhalfi/igp-maintenance/tags
4. Vérifiez les commits : https://github.com/salahkhalfi/igp-maintenance/commits/main

### Configurer la Description du Repo
Sur GitHub, ajoutez une description :
```
🔧 Système de Gestion de Maintenance Industrielle - Application Kanban avec React, Hono, Cloudflare Pages, D1, et R2
```

### Ajouter des Topics
Suggestions de topics pour le repository :
```
cloudflare-pages
cloudflare-workers
hono
react
maintenance
kanban
d1-database
r2-storage
typescript
industrial-management
```

### Configurer GitHub Pages (Optionnel)
Si vous voulez afficher la documentation :
1. Settings > Pages
2. Source : Deploy from a branch
3. Branch : main / docs (si vous avez un dossier docs)

---

## 📊 Structure du Repository

```
igp-maintenance/
├── src/
│   └── index.tsx              # Application complète (1600+ lignes)
├── migrations/
│   ├── 0001_initial_schema.sql
│   ├── 0002_add_comments.sql
│   └── 0003_add_reporter_name.sql
├── public/                    # Assets statiques (si présents)
├── wrangler.jsonc            # Config Cloudflare
├── package.json
├── tsconfig.json
├── ecosystem.config.cjs      # Config PM2
├── seed.sql                  # Données de test
├── DEPLOYMENT.md             # Guide déploiement
├── CHANGELOG_v1.8.2.md       # Notes de version
├── GITHUB_DEPLOY_GUIDE.md    # Ce fichier
└── README.md                 # Documentation principale
```

---

## 🛡️ Sécurité

### Fichiers à NE PAS pousser
Le `.gitignore` est déjà configuré pour exclure :
- `node_modules/`
- `.env`
- `.wrangler/`
- `dist/`
- `*.log`
- `.DS_Store`

### Secrets
⚠️ **Ne jamais pousser** :
- Tokens API Cloudflare
- JWT_SECRET
- Mots de passe
- Clés privées

Les secrets doivent être configurés via :
- Cloudflare Dashboard (pour production)
- `.dev.vars` (pour développement local, dans .gitignore)

---

## 💡 Conseils

### README.md sur GitHub
Le README.md sera automatiquement affiché sur la page principale du repository avec :
- Description du projet
- Fonctionnalités
- Guide d'installation
- Captures d'écran (si ajoutées)

### Branches Protégées (Recommandé)
Une fois le code poussé :
1. Settings > Branches
2. Add branch protection rule
3. Branch name pattern : `main`
4. Cochez :
   - Require pull request reviews before merging
   - Require status checks to pass before merging

### GitHub Actions (Futur)
Vous pourrez ajouter CI/CD avec GitHub Actions :
```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - run: npx wrangler pages deploy dist
```

---

## 🆘 Problèmes Courants

### Erreur : "Authentication failed"
**Solution** : Utilisez un Personal Access Token ou configurez GitHub via l'interface

### Erreur : "Updates were rejected"
**Solution** : Le repository distant a des commits que vous n'avez pas
```bash
git pull origin main --rebase
git push -u origin main --tags
```

### Erreur : "Repository not found"
**Solution** : Vérifiez que le repository existe et que vous avez les permissions
```bash
# Vérifier l'URL
git remote -v

# Changer l'URL si nécessaire
git remote set-url origin https://github.com/salahkhalfi/igp-maintenance.git
```

---

## 📞 Support

**Développeur** : Salah Khalfi  
**Repository** : https://github.com/salahkhalfi/igp-maintenance  
**Production** : https://5e61f01a.webapp-7t8.pages.dev  
**Date** : 2 novembre 2025

---

**© 2025 - Salah Khalfi - IGP Système de Gestion de Maintenance**
