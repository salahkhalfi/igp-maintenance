# Documentation de Déploiement - IGP Maintenance

## Version Actuelle
**v1.9.0 - Sécurité Maximale** (2025-11-02)

## 🌐 URLs de Production

### URL Principale (Domaine Personnalisé)
- **Production**: https://mecanique.igpglass.ca
- **API**: https://mecanique.igpglass.ca/api/*

### URL Cloudflare (Dernière Version Sécurisée)
- **Déploiement e6493742**: https://e6493742.webapp-7t8.pages.dev

## 🔒 Corrections de Sécurité Appliquées

### v1.9.0 (2025-11-02) - CRITIQUE
✅ **Suppression des identifiants hardcodés**
- Les champs email et mot de passe sont maintenant complètement vides par défaut
- Avant: `React.useState('admin@igpglass.ca')` et `React.useState('password123')`
- Après: `React.useState('')` et `React.useState('')`
- **Impact**: Les identifiants ne sont plus visibles ou pré-remplis

### v1.8.4 (2025-11-02)
✅ **Désactivation de l'auto-complétion navigateur**
- Ajout de `autoComplete='off'` sur le formulaire
- Ajout de `autoComplete='new-password'` sur le champ mot de passe

### v1.8.3 (2025-11-02)
✅ **Suppression de l'affichage des comptes de test**
- Suppression de la section "Comptes de test:" visible publiquement

## 📊 Historique des Déploiements

| Version | Hash | Date | Status | Notes |
|---------|------|------|--------|-------|
| v1.9.0 | e6493742 | 2025-11-02 | ✅ ACTIF | Identifiants hardcodés supprimés |
| v1.8.4 | 71e98938 | 2025-11-02 | ⚠️ OBSOLÈTE | Auto-complétion désactivée |
| v1.8.3 | 38bbed9e | 2025-11-02 | ⚠️ OBSOLÈTE | Affichage test supprimé |
| v1.8.2 | 2ced545d | 2025-11-02 | 🔴 INSECURE | Comptes visibles |
| v1.8.1 | 98a3ffaf | 2025-11-02 | 🔴 INSECURE | Comptes visibles |
| v1.8.0 | 5e61f01a | 2025-11-02 | 🔴 INSECURE | Comptes visibles |

## ⚠️ Actions Requises pour Sécurité Complète

### 1. Supprimer les Anciens Déploiements (CRITIQUE)
Les anciennes URLs sont toujours accessibles et contiennent les vulnérabilités :

**À faire manuellement sur Cloudflare Dashboard** :
1. Aller sur https://dash.cloudflare.com/
2. Pages → **webapp** → **Deployments**
3. **Supprimer ces déploiements** :
   - ❌ 71e98938 (champs pré-remplis)
   - ❌ 38bbed9e (champs pré-remplis)
   - ❌ 2ced545d (affichage + pré-remplissage)
   - ❌ 98a3ffaf (affichage + pré-remplissage)
   - ❌ 5e61f01a (affichage + pré-remplissage)
4. **Garder uniquement** : ✅ e6493742 (version sécurisée)

### 2. Vider le Cache Navigateur
Pour les utilisateurs finaux :
```
1. Ctrl+Shift+Delete (ou Cmd+Shift+Delete sur Mac)
2. Cocher "Images et fichiers en cache"
3. Vider
4. OU utiliser mode incognito/privé
```

### 3. Vérifier la Sécurité
Une fois les anciennes versions supprimées :
```bash
# Test: Les anciennes URLs doivent retourner 404
curl -I https://71e98938.webapp-7t8.pages.dev
curl -I https://5e61f01a.webapp-7t8.pages.dev

# Test: Le domaine principal doit afficher la version sécurisée
curl -s https://mecanique.igpglass.ca | grep "React.useState('')"
```

## 🚀 Déploiement Futur

### Pour Déployer une Nouvelle Version
```bash
# 1. Build
npm run build

# 2. Deploy
npx wrangler pages deploy dist --project-name webapp --commit-dirty=true

# 3. Commit et push
git add .
git commit -m "Description des changements"
git push origin main
```

## 📝 Configuration DNS

### Configuration CNAME (Cloudflare DNS)
```
Type: CNAME
Nom: mecanique
Cible: webapp-7t8.pages.dev
Proxy: Activé (nuage orange)
```

## 🔐 Variables d'Environnement

Les variables d'environnement sont configurées via Cloudflare :
- `CLOUDFLARE_API_TOKEN` : Configuré via `setup_cloudflare_api_key`
- Bindings D1 : `DB` → base de données de maintenance
- Bindings R2 : `BUCKET` → stockage média

## 📱 Contact & Support

Pour toute question sur ce déploiement :
- **GitHub**: https://github.com/salahkhalfi/igp-maintenance
- **Commit actuel**: 3f493df

---
*Dernière mise à jour : 2025-11-02*
