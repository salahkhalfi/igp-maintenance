# 🚀 Guide de Déploiement

Guide complet pour déployer l'application de gestion de maintenance sur Cloudflare Pages.

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir:

- ✅ Un compte [Cloudflare](https://dash.cloudflare.com/sign-up) (gratuit ou payant)
- ✅ [Node.js 18+](https://nodejs.org/) installé
- ✅ [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- ✅ [Git](https://git-scm.com/) pour le versioning
- ✅ [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (installé automatiquement via npm)

## 🔑 Configuration initiale

### 1. Authentification Cloudflare

```bash
# Se connecter à Cloudflare
npx wrangler login

# Vérifier l'authentification
npx wrangler whoami
```

Cette commande ouvrira votre navigateur pour autoriser Wrangler à accéder à votre compte Cloudflare.

### 2. Cloner le projet

```bash
git clone <repository-url>
cd webapp
npm install
```

## 💾 Configuration de la base de données D1

### 1. Créer la base de données en production

```bash
npx wrangler d1 create maintenance-db
```

**Output exemple**:
```
✅ Successfully created DB 'maintenance-db'!

[[d1_databases]]
binding = "DB"
database_name = "maintenance-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 2. Mettre à jour wrangler.jsonc

Copiez le `database_id` retourné et mettez à jour `wrangler.jsonc`:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "maintenance-db",
      "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  // ← Votre ID ici
    }
  ]
}
```

### 3. Appliquer les migrations

```bash
# Appliquer les migrations en production
npm run db:migrate:prod

# Vérifier que les tables ont été créées
npx wrangler d1 execute maintenance-db --command="SELECT name FROM sqlite_master WHERE type='table'"
```

### 4. Créer un utilisateur admin (optionnel)

```bash
# Créer un compte admin via l'API après le premier déploiement
# Ou insérer directement dans D1:
npx wrangler d1 execute maintenance-db --command="
INSERT INTO users (email, password_hash, full_name, role) 
VALUES ('admin@votre-domaine.com', 'hash-du-mot-de-passe', 'Admin Principal', 'admin')
"
```

## 📦 Configuration du stockage R2

### 1. Créer le bucket R2

```bash
npx wrangler r2 bucket create maintenance-media
```

### 2. Vérifier la configuration dans wrangler.jsonc

```jsonc
{
  "r2_buckets": [
    {
      "binding": "MEDIA_BUCKET",
      "bucket_name": "maintenance-media"
    }
  ]
}
```

### 3. Configurer l'accès public (optionnel)

Pour permettre l'accès public aux médias:

```bash
# Connecter le bucket à un domaine personnalisé
npx wrangler r2 bucket domain add maintenance-media --domain media.votre-domaine.com
```

Ou utiliser le domaine R2 par défaut: `https://<account-id>.r2.cloudflarestorage.com/<bucket-name>/`

## 🏗️ Build et déploiement

### 1. Build du projet

```bash
# Build de production
npm run build
```

Ce qui créera le dossier `dist/` avec:
- `_worker.js` - Application Hono compilée
- `_routes.json` - Configuration des routes
- Fichiers statiques depuis `public/`

### 2. Créer le projet Cloudflare Pages

```bash
npx wrangler pages project create maintenance-app --production-branch main
```

**Important**: Le nom `maintenance-app` sera utilisé dans l'URL finale: `https://maintenance-app.pages.dev`

### 3. Premier déploiement

```bash
# Déployer vers production
npm run deploy

# Ou avec wrangler directement
npx wrangler pages deploy dist --project-name maintenance-app
```

**Output exemple**:
```
✨ Compiled Worker successfully
🌍 Uploading... (3/3)

✨ Success! Deployed to https://maintenance-app.pages.dev
```

Votre application est maintenant live! 🎉

### 4. Déploiements suivants

```bash
# Simples déploiements
npm run deploy

# Ou build + deploy séparément
npm run build
npx wrangler pages deploy dist --project-name maintenance-app
```

## 🔐 Configuration des secrets

Pour les variables sensibles (JWT secret, clés API, etc.):

### Variables d'environnement

```bash
# Ajouter un secret
npx wrangler pages secret put JWT_SECRET --project-name maintenance-app

# Quand demandé, entrer la valeur secrète
? Enter a secret value: ›

# Lister les secrets
npx wrangler pages secret list --project-name maintenance-app

# Supprimer un secret
npx wrangler pages secret delete JWT_SECRET --project-name maintenance-app
```

### Fichier .dev.vars (développement local)

Pour le développement local, créez `.dev.vars`:

```ini
JWT_SECRET=your-local-secret-key-for-development
```

**⚠️ Important**: Ne jamais commiter `.dev.vars` dans git!

## 🌐 Configuration du domaine personnalisé

### 1. Ajouter un domaine personnalisé

Dans le [Dashboard Cloudflare Pages](https://dash.cloudflare.com/):

1. Allez dans **Workers & Pages** → **maintenance-app**
2. Onglet **Custom domains**
3. Cliquez sur **Set up a custom domain**
4. Entrez votre domaine: `maintenance.votre-domaine.com`
5. Suivez les instructions DNS

### 2. Ou via CLI

```bash
npx wrangler pages domain add maintenance.votre-domaine.com --project-name maintenance-app
```

## 🔄 CI/CD avec GitHub Actions

### Configuration automatique du déploiement

Créer `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: maintenance-app
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### Secrets GitHub à configurer

Dans GitHub: **Settings** → **Secrets and variables** → **Actions**

Ajouter:
- `CLOUDFLARE_API_TOKEN`: Token API Cloudflare
- `CLOUDFLARE_ACCOUNT_ID`: ID de compte Cloudflare

## 📊 Monitoring et logs

### Voir les logs en temps réel

```bash
# Logs des Workers
npx wrangler pages deployment tail --project-name maintenance-app
```

### Dashboard Cloudflare

- **Analytics**: Statistiques de trafic, requêtes, erreurs
- **Real-time logs**: Logs en temps réel des requêtes
- **Workers Analytics**: Métriques spécifiques aux Workers

URL: https://dash.cloudflare.com/pages/maintenance-app

## 🧪 Environnements de preview

Cloudflare Pages crée automatiquement des environnements de preview pour chaque branche:

```bash
# Déployer une branche de test
git checkout -b feature/nouvelle-fonctionnalite
git push origin feature/nouvelle-fonctionnalite

# URL automatique: https://feature-nouvelle-fonctionnalite.maintenance-app.pages.dev
```

## 🐛 Troubleshooting

### Erreur: "Database not found"

```bash
# Vérifier que la base existe
npx wrangler d1 list

# Vérifier l'ID dans wrangler.jsonc
cat wrangler.jsonc | grep database_id
```

### Erreur: "R2 bucket not accessible"

```bash
# Vérifier que le bucket existe
npx wrangler r2 bucket list

# Vérifier le binding dans wrangler.jsonc
cat wrangler.jsonc | grep MEDIA_BUCKET
```

### Erreur: "Build failed"

```bash
# Nettoyer et rebuilder
rm -rf dist/ node_modules/
npm install
npm run build
```

### Logs de débogage

```bash
# Voir les logs de déploiement
npx wrangler pages deployment list --project-name maintenance-app

# Tail des logs en production
npx wrangler pages deployment tail --project-name maintenance-app --environment production
```

## 🔄 Rollback

En cas de problème avec un déploiement:

### Via Dashboard

1. Allez dans **Pages** → **maintenance-app** → **Deployments**
2. Trouvez le déploiement stable
3. Cliquez sur **...** → **Rollback to this deployment**

### Via CLI

```bash
# Lister les déploiements
npx wrangler pages deployment list --project-name maintenance-app

# Promouvoir un ancien déploiement
npx wrangler pages deployment promote <deployment-id> --project-name maintenance-app
```

## 📈 Optimisations production

### 1. Activer la compression

Cloudflare compresse automatiquement les assets, mais vous pouvez optimiser:

```bash
# Build avec optimisation
NODE_ENV=production npm run build
```

### 2. Caching

Les fichiers statiques sont automatiquement mis en cache par Cloudflare CDN.

### 3. Performance

- Les Workers s'exécutent sur 300+ datacenters mondiaux
- Latence < 50ms dans la plupart des régions
- Auto-scaling automatique

## 🔒 Sécurité en production

### Checklist de sécurité

- ✅ Changer le `JWT_SECRET` par défaut
- ✅ Activer HTTPS only (automatique avec Cloudflare)
- ✅ Configurer les CORS correctement
- ✅ Limiter l'accès admin
- ✅ Utiliser des mots de passe forts
- ✅ Activer 2FA sur Cloudflare
- ✅ Monitorer les logs de sécurité

### Headers de sécurité

Ajoutés automatiquement par Cloudflare:
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `X-XSS-Protection`

## 💰 Coûts estimés

### Plan Free Cloudflare

- ✅ 100,000 requêtes/jour gratuites
- ✅ 500 builds/mois
- ✅ Bande passante illimitée
- ✅ 1 build concurrent
- ✅ D1: 5 GB de stockage gratuit
- ✅ R2: 10 GB de stockage gratuit

### Plan Paid ($20/mois)

- ✅ Builds illimités
- ✅ 5 builds concurrents
- ✅ Advanced analytics
- ✅ + de ressources D1 et R2

Pour la plupart des cas d'usage, **le plan Free est suffisant**.

## 📚 Ressources supplémentaires

- [Documentation Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Documentation Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Documentation Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Documentation Wrangler](https://developers.cloudflare.com/workers/wrangler/)
- [Hono Documentation](https://hono.dev/)

## 🆘 Support

En cas de problème:

1. Consultez les [Cloudflare Community](https://community.cloudflare.com/)
2. Ouvrez un ticket sur [Cloudflare Support](https://dash.cloudflare.com/support)
3. Documentation officielle: https://developers.cloudflare.com/

---

**Version**: 1.0.0  
**Dernière mise à jour**: 2024-11-02  
**Auteur**: Équipe de développement
