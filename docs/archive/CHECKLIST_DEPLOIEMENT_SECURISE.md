# ✅ Checklist de Déploiement Sécurisé

## AVANT le Déploiement (15 minutes)

### 1. Backup de la Base de Données ⏱️ 2 min
```bash
# Créer un snapshot complet
npx wrangler d1 export maintenance-db --output backup-$(date +%Y%m%d-%H%M%S).sql

# Vérifier que le fichier existe
ls -lh backup-*.sql
```

### 2. Tester Localement ⏱️ 5 min
```bash
# Reconstruire complètement
npm run build

# Redémarrer le service
pm2 delete webapp 2>/dev/null || true
pm2 start ecosystem.config.cjs

# Tester tous les endpoints critiques
curl http://localhost:3000/api/tickets
curl http://localhost:3000/api/users
curl http://localhost:3000/api/messages

# Vérifier les logs
pm2 logs webapp --nostream
```

### 3. Vérifier les Migrations ⏱️ 3 min
```bash
# Lister toutes les migrations
ls -1 migrations/*.sql

# Vérifier qu'il n'y a pas de conflits de numérotation
# (pas deux fichiers 0006_*.sql par exemple)

# Tester les migrations sur DB locale
npm run db:reset
npm run db:migrate:local
```

### 4. Valider la Configuration ⏱️ 2 min
```bash
# Vérifier wrangler.jsonc
cat wrangler.jsonc

# S'assurer que :
# - database_id existe
# - bucket_name est correct
# - name du projet est correct
```

### 5. Authentification Cloudflare ⏱️ 1 min
```bash
# Vérifier l'authentification
npx wrangler whoami

# Si erreur, reconfigurer :
# setup_cloudflare_api_key (outil AI)
```

### 6. Créer un Tag Git ⏱️ 2 min
```bash
# Marquer cette version
git add .
git commit -m "Pre-deployment: Ready for production v1.X"
git tag -a v1.X -m "Version stable avant déploiement $(date +%Y-%m-%d)"

# En cas de problème, on peut revenir à ce tag
```

---

## PENDANT le Déploiement (10 minutes)

### 7. Appliquer les Migrations ⏱️ 3 min
```bash
# Dry-run : voir quelles migrations seront appliquées
npx wrangler d1 migrations list maintenance-db

# Appliquer les nouvelles migrations
npx wrangler d1 migrations apply maintenance-db

# Vérifier qu'il n'y a pas d'erreurs
```

### 8. Déployer le Code ⏱️ 5 min
```bash
# Build de production
npm run build

# Déployer
npx wrangler pages deploy dist --project-name maintenance-app

# Noter l'URL de déploiement
# Exemple : https://abc123.maintenance-app.pages.dev
```

### 9. Tests Immédiats ⏱️ 2 min
```bash
# URL du nouveau déploiement (remplacer par votre URL)
NEW_URL="https://abc123.maintenance-app.pages.dev"

# Tester les endpoints
curl $NEW_URL/api/tickets
curl $NEW_URL/api/users

# Tester dans le navigateur
# Se connecter avec compte admin
# Créer un ticket
# Envoyer un message
# Enregistrer un audio
```

---

## APRÈS le Déploiement (5 minutes)

### 10. Validation Complète ⏱️ 3 min

**Tests Fonctionnels :**
- [ ] Connexion admin fonctionne
- [ ] Créer un ticket
- [ ] Modifier un ticket
- [ ] Déplacer un ticket dans Kanban
- [ ] Envoyer message texte
- [ ] Envoyer message audio
- [ ] Télécharger un fichier
- [ ] Créer un utilisateur

**Tests Performance :**
```bash
# Temps de réponse
curl -w "@curl-format.txt" -o /dev/null -s $NEW_URL/api/tickets
```

### 11. Promouvoir en Production ⏱️ 1 min
```bash
# Si tout fonctionne, promouvoir ce déploiement
npx wrangler pages deployment list --project-name maintenance-app

# Copier le deployment-id du dernier déploiement
npx wrangler pages deployment promote <deployment-id> --project-name maintenance-app
```

### 12. Documentation ⏱️ 1 min
```bash
# Noter dans README.md
echo "## Dernière Version Stable" >> README.md
echo "- **Version** : v1.X" >> README.md
echo "- **Date** : $(date +%Y-%m-%d)" >> README.md
echo "- **Déploiement ID** : <deployment-id>" >> README.md
echo "- **Backup DB** : backup-YYYYMMDD-HHMMSS.sql" >> README.md

git add README.md
git commit -m "Update: Production deployment v1.X"
```

---

## 🚨 ROLLBACK en Cas de Problème

### Rollback Code (30 secondes)
```bash
# Lister les déploiements
npx wrangler pages deployment list --project-name maintenance-app

# Promouvoir l'ancien déploiement stable
npx wrangler pages deployment promote <old-deployment-id> --project-name maintenance-app
```

### Rollback Base de Données (2 minutes)
```bash
# Option 1 : Restaurer le backup complet
npx wrangler d1 execute maintenance-db --file=backup-YYYYMMDD-HHMMSS.sql

# Option 2 : Exécuter migration DOWN spécifique
npx wrangler d1 execute maintenance-db --file=./migrations/DOWN_0009_remove_last_login.sql
```

### Vérification Post-Rollback
```bash
# Tester que l'ancienne version fonctionne
curl https://maintenance-app.pages.dev/api/tickets

# Vérifier les logs Cloudflare
npx wrangler pages deployment tail --project-name maintenance-app
```

---

## 📊 Temps Total Estimé

| Phase | Temps |
|-------|-------|
| Préparation | 15 min |
| Déploiement | 10 min |
| Validation | 5 min |
| **TOTAL** | **30 min** |

---

## 🔗 Liens Rapides

- **Dashboard Cloudflare** : https://dash.cloudflare.com
- **Pages Deployments** : https://dash.cloudflare.com/?to=/:account/pages/view/maintenance-app
- **D1 Database** : https://dash.cloudflare.com/?to=/:account/d1
- **R2 Buckets** : https://dash.cloudflare.com/?to=/:account/r2

---

## 📞 Support en Cas de Problème

1. **Vérifier les logs** : `npx wrangler pages deployment tail`
2. **Contacter l'assistant AI** : Fournir logs d'erreur
3. **Rollback immédiat** : Suivre procédure ci-dessus
4. **Cloudflare Support** : https://support.cloudflare.com (plans payants)

---

✅ **Cette checklist garantit un déploiement sécurisé avec possibilité de rollback instantané**
