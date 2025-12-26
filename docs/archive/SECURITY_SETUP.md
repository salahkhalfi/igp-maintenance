# 🔒 Guide de Configuration Sécurité - Phase 4

**Version**: 2.5.0  
**Date**: 2025-11-17  
**Status**: ⚠️ Configuration requise avant production

---

## ✅ Checklist Sécurité

### **Secrets Cloudflare** (CRITIQUE)

- [ ] JWT_SECRET configuré
- [ ] CRON_SECRET configuré  
- [ ] ADMIN_PASSWORD configuré
- [ ] CORS_STRICT_MODE activé

### **Code Sécurité**

- [ ] Headers HTTP sécurité ajoutés
- [ ] Audit npm dependencies passé
- [ ] Tests sécurité validés

### **Cloudflare Dashboard** (Recommandé)

- [ ] Rate limiting configuré
- [ ] WAF activé
- [ ] Bot protection activée

---

## 🚀 Configuration Rapide (15 minutes)

### **Méthode 1 : Script Automatique** (Recommandé)

```bash
# Exécuter le script de configuration
bash scripts/setup-secrets.sh

# Suivre les instructions à l'écran
```

Le script va :
1. ✅ Générer des tokens sécurisés aléatoires
2. ✅ Configurer JWT_SECRET automatiquement
3. ✅ Configurer CRON_SECRET automatiquement
4. ✅ Demander ADMIN_PASSWORD
5. ✅ Activer CORS_STRICT_MODE

---

### **Méthode 2 : Configuration Manuelle**

#### **1. JWT_SECRET** (CRITIQUE ⭐⭐⭐⭐⭐)

```bash
# Générer un token aléatoire sécurisé
openssl rand -base64 48 | tr -d "=+/" | cut -c1-64

# Configurer le secret (copier le token généré)
npx wrangler pages secret put JWT_SECRET --project-name webapp-7t8
# Coller le token quand demandé
```

**Pourquoi c'est critique ?**
- Signe tous les tokens JWT utilisateurs
- Si compromis = accès complet à tous les comptes
- Doit être unique et non-devinable

---

#### **2. CRON_SECRET** (Important ⭐⭐⭐⭐)

```bash
# Générer un token aléatoire
openssl rand -base64 48 | tr -d "=+/" | cut -c1-64

# Configurer le secret
npx wrangler pages secret put CRON_SECRET --project-name webapp-7t8
# Coller le token quand demandé
```

**Pourquoi c'est important ?**
- Protège les endpoints CRON
- Empêche exécution non-autorisée
- Utilisé pour webhooks Make.com

**Configuration Make.com** :
```
1. Aller dans Make.com scenario
2. Trouver le module HTTP Request
3. Ajouter header : Authorization: [VOTRE_CRON_SECRET]
```

---

#### **3. ADMIN_PASSWORD** (Important ⭐⭐⭐⭐)

```bash
# Configurer le mot de passe admin initial
npx wrangler pages secret put ADMIN_PASSWORD --project-name webapp-7t8
# Entrer un mot de passe sécurisé (min 8 caractères)
```

**Utilisation** :
- Utilisé pour créer le premier compte admin
- Après création, ce secret peut être supprimé
- Ne pas utiliser de mot de passe simple !

**Recommandations** :
- Minimum 12 caractères
- Mélange majuscules/minuscules/chiffres/symboles
- Ne pas réutiliser un mot de passe existant

---

#### **4. CORS_STRICT_MODE** (Recommandé ⭐⭐⭐⭐)

```bash
# Activer CORS strict pour production
npx wrangler pages secret put CORS_STRICT_MODE --project-name webapp-7t8
# Entrer : true
```

**Effet** :
Seules ces origines seront autorisées :
- `https://app.igpglass.ca` (production)
- `https://webapp-7t8.pages.dev` (Cloudflare Pages)
- `http://localhost:3000` (développement local)

Toutes autres origines seront **BLOQUÉES** ❌

---

## 🔍 Vérification Configuration

### **Lister les secrets configurés**

```bash
npx wrangler pages secret list --project-name webapp-7t8
```

**Output attendu** :
```
JWT_SECRET          (configured)
CRON_SECRET         (configured)
ADMIN_PASSWORD      (configured)
CORS_STRICT_MODE    (configured)
```

---

### **Tester JWT_SECRET**

Après déploiement :
```bash
# Login doit fonctionner
curl -X POST https://app.igpglass.ca/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@igpglass.ca","password":"[ADMIN_PASSWORD]"}'

# Doit retourner un token JWT valide
```

---

### **Tester CRON_SECRET**

```bash
# Test avec bon token (doit fonctionner)
curl -X POST https://app.igpglass.ca/api/cron/check-overdue \
  -H "Authorization: [VOTRE_CRON_SECRET]"

# Test sans token (doit échouer 401)
curl -X POST https://app.igpglass.ca/api/cron/check-overdue
```

---

### **Tester CORS_STRICT_MODE**

```bash
# Test depuis origine non-autorisée (doit échouer)
curl -X GET https://app.igpglass.ca/api/tickets \
  -H "Origin: https://malicious-site.com" \
  -H "Authorization: Bearer [TOKEN]"

# Doit retourner erreur CORS
```

---

## 🛡️ Headers de Sécurité (Implémenté dans le code)

Les headers suivants sont automatiquement ajoutés à toutes les réponses :

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy: [Politique stricte]
```

**Aucune configuration requise** - c'est dans le code ! ✅

---

## 📊 Rate Limiting Cloudflare (Optionnel mais recommandé)

### **Configuration dans Cloudflare Dashboard**

1. Aller sur : https://dash.cloudflare.com
2. Sélectionner domaine `igpglass.ca`
3. Onglet **Security** → **WAF** → **Rate Limiting Rules**
4. Créer 3 règles :

#### **Règle 1 : Protection Login**
```yaml
Name: Protect Login Endpoint
If:
  - URI Path contains "/api/auth/login"
Then:
  - Rate: 10 requests per 5 minutes
  - Action: Block (429 Too Many Requests)
  - Apply to: All IPs
```

#### **Règle 2 : Protection API Générale**
```yaml
Name: Protect API Endpoints
If:
  - URI Path contains "/api/"
Then:
  - Rate: 300 requests per minute
  - Action: Managed Challenge
  - Apply to: All IPs
```

#### **Règle 3 : Protection CRON**
```yaml
Name: Protect CRON Endpoints
If:
  - URI Path contains "/api/cron/"
Then:
  - Rate: 10 requests per hour
  - Action: Block
  - Apply to: All IPs
```

**Temps estimé** : 15 minutes

---

## 🔐 Sauvegarde des Secrets

### **CRITIQUE : Sauvegarder vos tokens !**

Les secrets Cloudflare ne peuvent **PAS être récupérés** après configuration. Vous devez les sauvegarder !

**Recommandations** :

1. **1Password / Bitwarden / LastPass**
   - Créer un coffre "IGP Production Secrets"
   - Stocker JWT_SECRET, CRON_SECRET, etc.

2. **Fichier .env.production.local** (NE PAS COMMIT)
   ```env
   JWT_SECRET=xxx
   CRON_SECRET=xxx
   ADMIN_PASSWORD=xxx
   CORS_STRICT_MODE=true
   ```
   Stocker dans un endroit sécurisé (pas Git !)

3. **Documentation équipe**
   - Partager avec lead dev / admin sys
   - Protocole de rotation des secrets

---

## ⚠️ Secrets Compromis ?

### **En cas de fuite de JWT_SECRET**

**URGENT** - Action immédiate :

```bash
# 1. Générer nouveau secret
openssl rand -base64 48 | tr -d "=+/" | cut -c1-64

# 2. Mettre à jour
npx wrangler pages secret put JWT_SECRET --project-name webapp-7t8

# 3. Redéployer
npm run deploy:prod

# 4. TOUS les utilisateurs devront se reconnecter
```

**Impact** : Tous les tokens JWT existants deviennent invalides.

---

### **En cas de fuite de CRON_SECRET**

```bash
# 1. Générer nouveau secret
openssl rand -base64 48 | tr -d "=+/" | cut -c1-64

# 2. Mettre à jour Cloudflare
npx wrangler pages secret put CRON_SECRET --project-name webapp-7t8

# 3. Mettre à jour Make.com
# Aller dans Make.com → HTTP Request module
# Changer Authorization header

# 4. Redéployer
npm run deploy:prod
```

**Impact** : Webhooks Make.com arrêtent de fonctionner jusqu'à mise à jour.

---

## ✅ Validation Finale

### **Checklist avant production**

```bash
# 1. Vérifier secrets configurés
npx wrangler pages secret list --project-name webapp-7t8

# 2. Build production
npm run build

# 3. Tests locaux
npm test

# 4. Déploiement
npm run deploy:prod

# 5. Test login production
curl https://app.igpglass.ca/api/health

# 6. Test CORS strict
# Tenter accès depuis origine non-autorisée

# 7. Monitor logs Cloudflare
# Vérifier aucune erreur 5xx
```

---

## 📚 Ressources

- [Cloudflare Pages Secrets](https://developers.cloudflare.com/pages/platform/functions/bindings/#secrets)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Cloudflare WAF](https://developers.cloudflare.com/waf/)

---

## 🆘 Support

En cas de problème :
1. Vérifier logs Cloudflare Dashboard
2. Vérifier `wrangler pages deployment list`
3. Rollback si nécessaire : déployer version précédente
4. Contacter équipe de développement

---

**Dernière mise à jour** : 2025-11-17  
**Version** : Phase 4 - Sécurité Production
