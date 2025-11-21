# ⏰ Mise à Jour CRON Externe - Ajouter Cleanup Push Subscriptions

**Date**: 2025-11-21  
**Objectif**: Ajouter un deuxième appel CRON pour nettoyer les subscriptions push inactives  
**Service**: cron-job.org (existant)  

---

## 📋 Contexte

Vous avez **déjà un CRON configuré** sur cron-job.org qui appelle:
```
POST /api/cron/check-overdue
```

Il faut maintenant **ajouter un deuxième job CRON** pour appeler:
```
POST /api/cron/cleanup-push-tokens
```

---

## ✅ Deux Routes CRON Disponibles

### **Route #1**: Vérification Tickets Expirés (Existant)
```
POST /api/cron/check-overdue
```
**Fonction**: Envoie webhooks Pabbly + push notifications pour tickets expirés  
**Fréquence**: Déjà configurée (probablement toutes les 5-15 minutes)  
**Status**: ✅ Déjà actif

### **Route #2**: Cleanup Push Subscriptions (Nouveau) ⭐
```
POST /api/cron/cleanup-push-tokens
```
**Fonction**: Supprime subscriptions push inactives >30 jours  
**Fréquence**: **Quotidien à 2h du matin**  
**Status**: ⚠️ À CONFIGURER

---

## 🔧 Instructions de Configuration

### **Option A: Ajouter un 2ème Job CRON** (RECOMMANDÉ)

Créer un nouveau job séparé dans cron-job.org:

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

**Timezone**: `UTC` (ou `America/Toronto` pour heure locale)

**Retry**:
- Enabled: ✅
- Retries: 3
- Interval: 5 minutes

**Notifications**:
- Email on failure: ✅
- After: 3 consecutive failures

---

### **Option B: Appeler les Deux Routes dans un Seul Job**

Si vous préférez un seul job qui appelle les deux routes séquentiellement:

⚠️ **Limitation**: cron-job.org ne supporte qu'une seule URL par job

**Solutions alternatives**:
1. Créer 2 jobs séparés (Option A - RECOMMANDÉ)
2. Utiliser GitHub Actions (voir ci-dessous)
3. Créer un endpoint proxy qui appelle les deux

---

### **Option C: GitHub Actions** (Alternative Complète)

Si vous voulez gérer les 2 routes dans un seul workflow:

**Fichier**: `.github/workflows/cron-jobs.yml`

```yaml
name: CRON Jobs - Maintenance App

on:
  schedule:
    # check-overdue: Toutes les 15 minutes
    - cron: '*/15 * * * *'
    # cleanup-push-tokens: Quotidien à 2h UTC
    - cron: '0 2 * * *'
  workflow_dispatch:  # Permet exécution manuelle

jobs:
  check-overdue:
    # Exécuter toutes les 15 minutes (ou selon votre schedule actuel)
    if: github.event.schedule == '*/15 * * * *' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - name: Call check-overdue API
        run: |
          curl -X POST https://0b1d6aff.webapp-7t8.pages.dev/api/cron/check-overdue \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            -o check-overdue-response.json
          cat check-overdue-response.json
      
      - name: Upload Response
        uses: actions/upload-artifact@v3
        with:
          name: check-overdue-response
          path: check-overdue-response.json

  cleanup-push-tokens:
    # Exécuter quotidien à 2h UTC
    if: github.event.schedule == '0 2 * * *' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - name: Call cleanup-push-tokens API
        run: |
          curl -X POST https://0b1d6aff.webapp-7t8.pages.dev/api/cron/cleanup-push-tokens \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            -o cleanup-response.json
          cat cleanup-response.json
      
      - name: Upload Response
        uses: actions/upload-artifact@v3
        with:
          name: cleanup-push-tokens-response
          path: cleanup-response.json
```

**Configuration GitHub**:
1. Aller dans Settings → Secrets → Actions
2. Ajouter secret `CRON_SECRET`: `Bearer cron_secret_igp_2025_webhook_notifications`
3. Commit le workflow dans `.github/workflows/`
4. Activer GitHub Actions

---

## 📊 Vérification Configuration

### **1. Test Manuel du Nouveau Endpoint**

```bash
curl -X POST https://0b1d6aff.webapp-7t8.pages.dev/api/cron/cleanup-push-tokens \
  -H "Authorization: Bearer cron_secret_igp_2025_webhook_notifications" \
  -H "Content-Type: application/json"
```

**Response Attendue**:
```json
{
  "success": true,
  "deletedCount": 0,
  "remainingCount": 3,
  "message": "Aucune subscription inactive à nettoyer",
  "checked_at": "2025-11-21T11:30:00.000Z"
}
```

### **2. Vérifier les Deux Jobs dans cron-job.org**

Dashboard → Jobs:
- ✅ `Maintenance App - Check Overdue Tickets` (existant)
- ✅ `Maintenance App - Cleanup Push Subscriptions` (nouveau)

### **3. Vérifier Historique Exécutions**

Après 24h, vérifier:
- History → check-overdue: Exécutions toutes les X minutes
- History → cleanup-push-tokens: 1 exécution à 2h du matin

### **4. Vérifier Logs Cloudflare**

```bash
npx wrangler pages deployment tail --project-name webapp | grep "CRON"
```

**Logs Attendus**:
```
🔔 CRON externe démarré: 2025-11-21T12:00:00.000Z  (check-overdue)
🧹 CRON cleanup-push-tokens démarré: 2025-11-21T02:00:00.000Z  (cleanup)
```

---

## 🎯 Récapitulatif

| Route | Fréquence | Fonction | Status |
|-------|-----------|----------|--------|
| `/api/cron/check-overdue` | Toutes les 5-15min | Tickets expirés + webhooks | ✅ Actif |
| `/api/cron/cleanup-push-tokens` | Quotidien à 2h | Cleanup push >30j | ⚠️ À configurer |

**Action Requise**: 
1. Se connecter sur cron-job.org
2. Créer nouveau job "Cleanup Push Subscriptions"
3. Configurer URL, headers, schedule (voir Option A)
4. Tester avec "Run Now"
5. Vérifier le lendemain à 2h

---

## ⏱️ Temps Estimé

- Configuration nouveau job: **5 minutes**
- Test manuel: **2 minutes**
- Vérification lendemain: **2 minutes**

**Total**: 10 minutes de configuration

---

## 📞 Support

**Si vous ne trouvez pas le CRON existant sur cron-job.org**:

1. Vérifier vos emails pour confirmation cron-job.org
2. Chercher dans dashboard cron-job.org: "Maintenance App"
3. Alternative: Créer les 2 jobs depuis zéro
4. Alternative: Utiliser GitHub Actions (Option C)

**Si problème d'authentification** (401 Unauthorized):

Le token doit être exact:
```
Authorization: Bearer cron_secret_igp_2025_webhook_notifications
```

Vérifier dans `.dev.vars` (local) ou Cloudflare Secrets (production):
```bash
npx wrangler pages secret list --project-name webapp
```

---

**Document créé le**: 2025-11-21  
**Dernière mise à jour**: 2025-11-21  
**Status**: Configuration requise - Ajouter 2ème job CRON
