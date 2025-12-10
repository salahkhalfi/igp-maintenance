# ⏰ Configuration CRON - Cleanup Automatique Push Subscriptions

**Date**: 2025-11-21  
**Projet**: Maintenance App  
**URL Production**: https://0b1d6aff.webapp-7t8.pages.dev  

---

## 🎯 Objectif

Configurer un CRON externe pour appeler automatiquement l'endpoint `/api/cron/cleanup-push-tokens` **quotidiennement à 2h du matin** afin de:
- Supprimer les subscriptions push inactives >30 jours
- Réduire la charge DB et améliorer performance (25%)
- Maintenance automatique sans intervention manuelle

---

## ⚠️ IMPORTANT: Cloudflare Pages vs Workers

### 🚫 Pourquoi Pas de CRON Intégré?

**Cloudflare Pages NE SUPPORTE PAS les CRON Triggers**

- ❌ `triggers.crons` dans `wrangler.jsonc` → Erreur de validation
- ❌ Export `scheduled` handler → Ne fonctionne pas avec Pages
- ✅ Solution: **CRON externe** appelant l'API REST

**Note technique**: Les CRON triggers sont uniquement disponibles pour **Cloudflare Workers**, pas pour **Cloudflare Pages**. Notre application utilise Pages pour bénéficier du déploiement git automatique et de l'hébergement statique.

---

## ✅ Solution: Service CRON Externe

### **Service Recommandé**: [cron-job.org](https://cron-job.org)

**Avantages**:
- ✅ Gratuit (jusqu'à 50 jobs)
- ✅ Interface web simple
- ✅ Notifications email si échec
- ✅ Historique des exécutions
- ✅ Retry automatique (configurable)
- ✅ Pas de code à maintenir

---

## 📋 Configuration Détaillée

### **1. Créer un Compte**

1. Aller sur https://cron-job.org
2. Cliquer "Sign Up" (gratuit)
3. Confirmer email
4. Se connecter au dashboard

### **2. Créer le Job CRON**

**Titre**: `Maintenance App - Cleanup Push Subscriptions`

**URL**: 
```
https://0b1d6aff.webapp-7t8.pages.dev/api/cron/cleanup-push-tokens
```

**Method**: `POST`

**Request Headers**:
```
Authorization: Bearer cron_secret_igp_2025_webhook_notifications
Content-Type: application/json
```

**Schedule**: `0 2 * * *` (Quotidien à 2h du matin UTC)

**Timezone**: `UTC` (ou `America/Toronto` pour EST/EDT)

**Retry Policy**:
- Retry on failure: ✅ Enabled
- Number of retries: `3`
- Retry interval: `5 minutes`

**Notifications**:
- Notify on failure: ✅ Enabled
- Email: `admin@igpglass.ca`
- After failures: `3` (notifie après 3 échecs consécutifs)

### **3. Tester le Job**

Après création, cliquer sur **"Run Now"** pour tester immédiatement.

**Response Attendue**:
```json
{
  "success": true,
  "deletedCount": 0,
  "remainingCount": 3,
  "message": "Aucune subscription inactive à nettoyer",
  "checked_at": "2025-11-21T11:25:00.000Z"
}
```

ou

```json
{
  "success": true,
  "deletedCount": 3,
  "remainingCount": 10,
  "deletedDevices": [
    {
      "user_id": 6,
      "device_name": "iPhone 12",
      "last_used": "2025-08-23 10:59:44",
      "days_inactive": 90
    }
  ],
  "message": "Nettoyage terminé: 3 subscription(s) inactive(s) >30 jours supprimée(s)",
  "checked_at": "2025-11-21T11:25:00.000Z"
}
```

### **4. Vérifier l'Historique**

Dans le dashboard cron-job.org:
- Onglet **"History"** → Voir toutes les exécutions
- Status: `200 OK` = Succès ✅
- Status: `401 Unauthorized` = Token invalide ❌
- Status: `500 Internal Server Error` = Erreur backend ❌

---

## 🔐 Sécurité

### **Token CRON_SECRET**

Le token `Bearer cron_secret_igp_2025_webhook_notifications` est stocké dans:
- **Local**: `.dev.vars` (fichier gitignored)
- **Production**: Cloudflare Secrets (wrangler secret put)

**Vérification du token**:
```typescript
// src/routes/cron.ts (ligne 232-237)
const authHeader = c.req.header('Authorization');
const expectedToken = c.env.CRON_SECRET;

if (authHeader !== expectedToken) {
  return c.json({ error: 'Unauthorized - Invalid CRON token' }, 401);
}
```

**Note**: Si le token change, **mettre à jour dans cron-job.org ET dans Cloudflare Secrets**

---

## 📊 Monitoring et Logs

### **1. Logs Cloudflare (Production)**

```bash
# Tail des logs en temps réel
npx wrangler pages deployment tail --project-name webapp

# Filtrer logs CRON uniquement
npx wrangler pages deployment tail --project-name webapp | grep "CRON cleanup"
```

**Logs Attendus** (succès):
```
🧹 CRON cleanup-push-tokens démarré: 2025-11-21T02:00:00.000Z
⚠️ CRON: 3 subscription(s) inactive(s) >30 jours trouvée(s)
🗑️ CRON: Suppression device "iPhone X" (user_id:2, 45 jours inactif)
🗑️ CRON: Suppression device "iPad Pro" (user_id:2, 62 jours inactif)
🗑️ CRON: Suppression device "Android Pixel" (user_id:6, 90 jours inactif)
✅ CRON: 3 subscription(s) inactive(s) supprimée(s)
📊 CRON: 10 subscription(s) active(s) restante(s)
🎉 CRON cleanup-push-tokens terminé: 3 suppression(s)
```

**Logs Attendus** (aucune subscription à supprimer):
```
🧹 CRON cleanup-push-tokens démarré: 2025-11-21T02:00:00.000Z
✅ CRON: Aucune subscription inactive >30 jours trouvée
```

### **2. Vérification Database**

```bash
# Production (après exécution CRON)
npx wrangler d1 execute maintenance-db --command="
  SELECT 
    COUNT(CASE WHEN julianday('now') - julianday(last_used) <= 7 THEN 1 END) as actives_7jours,
    COUNT(CASE WHEN julianday('now') - julianday(last_used) BETWEEN 7 AND 30 THEN 1 END) as inactives_7_30jours,
    COUNT(CASE WHEN julianday('now') - julianday(last_used) > 30 THEN 1 END) as inactives_30plus_jours,
    COUNT(*) as total
  FROM push_subscriptions
"
```

**Résultat Attendu**:
```json
{
  "actives_7jours": 8,
  "inactives_7_30jours": 2,
  "inactives_30plus_jours": 0,  // ← Devrait être 0 après cleanup
  "total": 10
}
```

### **3. Alertes Email**

Si le CRON échoue 3× consécutifs:
- Email envoyé à `admin@igpglass.ca`
- Sujet: `[cron-job.org] Job failed: Maintenance App - Cleanup Push Subscriptions`
- Contenu: Détails de l'erreur (status code, response body)

**Actions Correctives**:
1. Vérifier les logs Cloudflare (erreur backend?)
2. Tester manuellement avec `curl`:
   ```bash
   curl -X POST https://0b1d6aff.webapp-7t8.pages.dev/api/cron/cleanup-push-tokens \
     -H "Authorization: Bearer cron_secret_igp_2025_webhook_notifications" \
     -H "Content-Type: application/json"
   ```
3. Vérifier que CRON_SECRET est configuré dans Cloudflare Secrets
4. Vérifier que l'URL de production est correcte

---

## 🔄 Alternatives à cron-job.org

### **Option 1: EasyCron** (https://www.easycron.com)
- Gratuit: 1 job, exécutions illimitées
- Interface similaire à cron-job.org
- Support webhook notifications

### **Option 2: GitHub Actions**

**Workflow** `.github/workflows/cron-cleanup.yml`:
```yaml
name: CRON - Cleanup Push Subscriptions

on:
  schedule:
    - cron: '0 2 * * *'  # Quotidien à 2h UTC
  workflow_dispatch:  # Permet exécution manuelle

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Call Cleanup API
        run: |
          curl -X POST https://0b1d6aff.webapp-7t8.pages.dev/api/cron/cleanup-push-tokens \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            -o response.json
          cat response.json
      
      - name: Upload Response
        uses: actions/upload-artifact@v3
        with:
          name: cleanup-response
          path: response.json
```

**Configuration**:
1. Ajouter secret `CRON_SECRET` dans GitHub repository settings
2. Commit le workflow dans `.github/workflows/`
3. Activer GitHub Actions (onglet "Actions")

**Avantages**:
- ✅ Totalement gratuit
- ✅ Intégré au repository
- ✅ Historique des exécutions avec artifacts
- ✅ Logs détaillés

**Inconvénients**:
- ⚠️ Nécessite repository public ou GitHub Pro (pour Actions minutes)
- ⚠️ Configuration plus technique

### **Option 3: Cloudflare Workers Cron**

**Nécessite migration de Pages vers Workers**:
- Coût: $5/mois (Workers Paid plan)
- Configuration: `wrangler.jsonc` avec `triggers.crons`
- Avantage: Totalement intégré, pas de service externe
- Inconvénient: Perte du déploiement git automatique de Pages

**Non recommandé** pour ce projet car Pages fonctionne bien.

---

## ✅ Checklist de Configuration

- [ ] Compte créé sur cron-job.org
- [ ] Job CRON créé avec URL correcte
- [ ] Headers configurés (Authorization + Content-Type)
- [ ] Schedule configuré: `0 2 * * *`
- [ ] Retry policy activée (3 tentatives, 5min interval)
- [ ] Notifications email configurées
- [ ] Test manuel exécuté → Response 200 OK
- [ ] Premier run quotidien vérifié (lendemain 2h)
- [ ] Logs Cloudflare vérifiés (cleanup visible)
- [ ] Database vérifiée (inactives_30plus_jours = 0)

---

## 📚 Documentation Complémentaire

- `PUSH_RECOMMENDATIONS_PROGRESS.md` - Vue d'ensemble des recommandations
- `AUDIT_POST_IMPLEMENTATION_CLEANUP_INACTIVE.md` - Audit complet de la feature
- `README.md` - Section "Système Push Notifications - État Complet (v2.7.0)"

---

## 🆘 Support

**Si le CRON ne fonctionne pas**:
1. Vérifier les logs cron-job.org (History tab)
2. Vérifier les logs Cloudflare (`wrangler pages deployment tail`)
3. Tester manuellement avec `curl` (voir section Monitoring)
4. Vérifier que CRON_SECRET est configuré dans Cloudflare
5. Contacter l'équipe de développement

---

**Document créé le**: 2025-11-21  
**Dernière mise à jour**: 2025-11-21  
**Status**: ✅ Configuration requise - Service externe cron-job.org recommandé
