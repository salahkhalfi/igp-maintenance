# 🚀 Plan de Déploiement Production - scheduled_date Notification Fix

**Date**: 2025-11-21  
**Projet**: webapp (Cloudflare Pages)  
**Database**: maintenance-db (Cloudflare D1)  

---

## 📊 État Actuel Production

### Database
- ✅ Table `webhook_notifications` existe (8 colonnes)
- ❌ Colonne `scheduled_date_notified` **PAS ENCORE** ajoutée
- 📊 **1 notification** en production (envoyée 2025-11-21 07:45 UTC)

### Migrations
- ✅ Migrations 0001-0019: Appliquées
- ⏳ Migration 0020: **EN ATTENTE** (scheduled_date_notified)

### Code
- ✅ Version stable: Beta-1 (commit 1258d37)
- 🆕 Nouvelle version: commit 50e84cd + docs
- 📝 3 commits depuis Beta-1:
  - 50e84cd: Fix scheduled_date tracking
  - 1f3cdc0: Documentation guide
  - 625a756: Timezone verification

---

## ⚠️ RISQUES IDENTIFIÉS

### Risque 1: Migration Database ⚠️ MOYEN
- **Impact**: Ajout colonne + index
- **Downtime**: ~1-2 secondes
- **Rollback**: Difficile (DROP COLUMN pas supporté SQLite)
- **Mitigation**: 1 seule notification existante → impact minimal

### Risque 2: Code Deployment ⚠️ FAIBLE
- **Impact**: Nouveau code CRON/webhooks
- **Downtime**: 0 seconde (déploiement edge progressif)
- **Rollback**: Facile via git checkout Beta-1
- **Mitigation**: Code testé localement, backwards compatible

### Risque 3: CRON Timing ⚠️ FAIBLE
- **Impact**: CRON tourne toutes les 5 minutes
- **Problème potentiel**: CRON en cours pendant déploiement
- **Mitigation**: Déployer entre 2 runs CRON (attendre 6 minutes)

---

## ✅ PLAN DE DÉPLOIEMENT SÉCURISÉ

### **Phase 0: Préparation** (5 minutes)

#### Checkpoint 0.1: Vérification Finale Locale
```bash
# Terminal local
cd /home/user/webapp

# 1. Build local pour vérifier erreurs
npm run build

# 2. Vérifier serveur local fonctionne
curl http://localhost:3000 | head -20

# 3. Vérifier CRON endpoint local
curl -X POST http://localhost:3000/api/cron/check-overdue \
  -H "Authorization: Bearer cron_secret_igp_2025_webhook_notifications" | python3 -m json.tool
```

**✅ Go/No-Go**: Si tout fonctionne → Phase 1

---

### **Phase 1: Migration Database** (2 minutes)

#### Checkpoint 1.1: Backup Notification Existante
```bash
# Sauvegarder l'unique notification en production
npx wrangler d1 execute maintenance-db --remote \
  --command="SELECT * FROM webhook_notifications" > /tmp/webhook_backup.json

# Vérifier backup
cat /tmp/webhook_backup.json
```

**✅ Go/No-Go**: Si backup réussi → 1.2

#### Checkpoint 1.2: Appliquer Migration
```bash
# CRITIQUE: Appliquer migration 0020
npx wrangler d1 migrations apply maintenance-db --remote

# Attendre confirmation "✅"
```

**✅ Go/No-Go**: Si migration appliquée → 1.3

#### Checkpoint 1.3: Vérifier Schema Production
```bash
# Vérifier nouvelle colonne existe
npx wrangler d1 execute maintenance-db --remote \
  --command="PRAGMA table_info(webhook_notifications)" | grep scheduled_date_notified

# Vérifier index créé
npx wrangler d1 execute maintenance-db --remote \
  --command="SELECT name FROM sqlite_master WHERE type='index' AND name='idx_webhook_ticket_scheduled_type'"

# Vérifier notification existante toujours là
npx wrangler d1 execute maintenance-db --remote \
  --command="SELECT COUNT(*) FROM webhook_notifications"
```

**✅ Go/No-Go**: 
- Si colonne existe ✅
- Si index existe ✅  
- Si count = 1 ✅
- → Phase 2

**🔴 ROLLBACK SI PROBLÈME**: 
```bash
# Impossible de rollback migration facilement
# Alternatives:
# 1. Laisser colonne (ne cause pas de problème)
# 2. Ne pas déployer nouveau code (utilise pas la colonne)
```

---

### **Phase 2: Code Deployment** (3 minutes)

#### Checkpoint 2.1: Build Production
```bash
cd /home/user/webapp

# Clean build
rm -rf dist/
npm run build

# Vérifier dist/ créé
ls -lh dist/
ls -lh dist/_worker.js
```

**✅ Go/No-Go**: Si build réussi → 2.2

#### Checkpoint 2.2: Deploy Code
```bash
# Déployer vers Cloudflare Pages
npx wrangler pages deploy dist --project-name webapp

# Noter l'URL de déploiement affichée
# Exemple: https://abc123.webapp.pages.dev
```

**✅ Go/No-Go**: Si déploiement réussi → 2.3

#### Checkpoint 2.3: Attendre Propagation (2 minutes)
```bash
# Cloudflare Pages déploie progressivement sur edge network
# Attendre 2 minutes pour propagation complète
echo "Attente propagation edge network..."
sleep 120
```

---

### **Phase 3: Vérification Production** (5 minutes)

#### Checkpoint 3.1: Test Homepage
```bash
# Vérifier homepage répond
curl -s https://mecanique.igpglass.ca | head -20

# Vérifier aucune erreur JavaScript console (via navigateur)
```

**✅ Go/No-Go**: Si homepage OK → 3.2

#### Checkpoint 3.2: Test CRON Endpoint (MANUEL)
```bash
# ATTENTION: Ne pas appeler directement le CRON endpoint
# Raison: Pourrait envoyer webhooks Pabbly Connect en production

# À la place: Vérifier dans les logs PM2 local que le format est bon
pm2 logs webapp --nostream --lines 50 | grep "CRON"
```

**✅ Go/No-Go**: Si logs OK → 3.3

#### Checkpoint 3.3: Vérifier Database Accessible
```bash
# Vérifier que l'application peut lire la DB
curl -s https://mecanique.igpglass.ca/api/tickets | python3 -m json.tool | head -30

# Devrait retourner liste tickets (ou [])
```

**✅ Go/No-Go**: Si DB accessible → 3.4

#### Checkpoint 3.4: Test Authentification
```bash
# Ouvrir navigateur et tester login
# URL: https://mecanique.igpglass.ca
# 1. Login avec admin@igpglass.ca
# 2. Vérifier dashboard charge
# 3. Vérifier tickets visibles
```

**✅ Go/No-Go**: Si login/dashboard OK → Phase 4

---

### **Phase 4: Monitoring Initial** (10 minutes)

#### Checkpoint 4.1: Surveiller CRON Naturel
```bash
# Le CRON externe tourne toutes les 5 minutes
# Attendre le prochain run naturel (max 5 min)

# Pendant ce temps, vérifier Cloudflare Dashboard:
# https://dash.cloudflare.com
# → Pages → webapp → Deployments
# → Vérifier "Deployment successful"
```

#### Checkpoint 4.2: Vérifier Logs Cloudflare (si disponible)
```bash
# Dans Cloudflare Dashboard:
# → Pages → webapp → Functions
# → Real-time Logs
# → Chercher erreurs JavaScript
```

#### Checkpoint 4.3: Vérifier Aucune Notification Duplicate
```bash
# Après 10 minutes, vérifier combien de notifications en DB
npx wrangler d1 execute maintenance-db --remote \
  --command="SELECT COUNT(*) as count, MAX(sent_at) as last_sent FROM webhook_notifications"

# Si count = 1 → Aucun nouveau ticket expiré (normal)
# Si count > 1 → Vérifier que scheduled_date_notified est rempli
npx wrangler d1 execute maintenance-db --remote \
  --command="SELECT ticket_id, sent_at, scheduled_date_notified FROM webhook_notifications ORDER BY sent_at DESC LIMIT 5"
```

**✅ Go/No-Go**: Si tout normal → SUCCESS ✅

---

## 🔴 ROLLBACK PROCEDURE (Si Problème Critique)

### Rollback Option 1: Code Only (Rapide - 2 minutes)
```bash
cd /home/user/webapp

# 1. Checkout version stable Beta-1
git checkout Beta-1

# 2. Rebuild
npm run build

# 3. Redeploy
npx wrangler pages deploy dist --project-name webapp

# 4. Attendre 2 minutes propagation
sleep 120

# 5. Vérifier site fonctionne
curl -s https://mecanique.igpglass.ca | head -20
```

**Note**: La migration database reste, mais le code Beta-1 ne l'utilise pas → Sans danger

### Rollback Option 2: Full Rollback (Si DB Corrompue - Complexe)
```bash
# ATTENTION: Option nucléaire - à éviter si possible

# 1. Rollback code (comme Option 1)
git checkout Beta-1
npm run build
npx wrangler pages deploy dist --project-name webapp

# 2. Restaurer backup DB (DIFFICILE avec D1)
# Cloudflare D1 ne supporte pas DROP COLUMN
# Solutions:
# A. Laisser colonne (ne cause pas de problème)
# B. Contacter support Cloudflare pour restore
# C. Recréer table sans colonne (perte données!)
```

**Recommandation**: Si problème, utiliser **Rollback Option 1** uniquement.

---

## 📋 CHECKLIST PRÉ-DÉPLOIEMENT

### Vérifications Techniques
- [x] Migration 0020 testée localement ✅
- [x] Build réussi sans erreurs ✅
- [x] Code testé localement ✅
- [x] CRON endpoint fonctionne local ✅
- [x] Timezone vérifiée et cohérente ✅
- [x] Documentation complète créée ✅
- [x] Tag Beta-1 existe pour rollback ✅

### Vérifications Production
- [ ] Backup notification production
- [ ] Migration appliquée en production
- [ ] Schema vérifié en production
- [ ] Code déployé avec succès
- [ ] Homepage accessible
- [ ] Authentication fonctionne
- [ ] Aucune erreur logs

### Vérifications Post-Déploiement
- [ ] 10 minutes de monitoring
- [ ] CRON run naturel observé
- [ ] Aucune régression détectée
- [ ] Aucune notification duplicate

---

## 🎯 CRITÈRES DE SUCCÈS

### Succès Immédiat (Phase 3)
1. ✅ Homepage charge sans erreur
2. ✅ Login fonctionne
3. ✅ Tickets visibles
4. ✅ Database accessible

### Succès à Court Terme (10 minutes)
1. ✅ CRON run sans erreur
2. ✅ Aucune notification duplicate
3. ✅ `scheduled_date_notified` rempli pour nouvelles notifications
4. ✅ Aucune erreur JavaScript console

### Succès à Moyen Terme (24 heures)
1. ✅ Utilisateurs peuvent créer/modifier tickets
2. ✅ Changement scheduled_date déclenche nouvelle notification
3. ✅ Aucune régression fonctionnalités existantes
4. ✅ Performance stable

---

## 📞 CONTACTS D'URGENCE

- **Rollback**: `git checkout Beta-1 && npm run build && deploy`
- **Support Cloudflare**: https://dash.cloudflare.com/support
- **Documentation Fix**: `/home/user/webapp/NOTIFICATION_FIX_GUIDE.md`
- **Timezone Info**: `/home/user/webapp/TIMEZONE_VERIFICATION.md`

---

## 📝 NOTES IMPORTANTES

1. **Migration Database NON RÉVERSIBLE facilement**
   - Cloudflare D1/SQLite ne supporte pas DROP COLUMN
   - Rollback code possible, rollback migration difficile
   - Si problème migration → rollback code suffit

2. **1 Seule Notification Existante**
   - Impact minimal sur données production
   - scheduled_date_notified sera NULL pour cette notification
   - Pas de problème car NULL != 'date_value' en SQL

3. **CRON Externe Tourne Toutes les 5 Minutes**
   - Eviter de déployer exactement à :00, :05, :10, etc.
   - Préférer déployer entre 2 runs (ex: :03, :08, :13)

4. **Timezone Déjà Vérifié**
   - Système cohérent UTC bout en bout
   - Aucun ajustement timezone nécessaire
   - Documentation complète dans TIMEZONE_VERIFICATION.md

---

## ✅ PRÊT POUR DÉPLOIEMENT

**Recommandation**: Procéder phase par phase, vérifier chaque checkpoint avant de continuer.

**Durée Totale Estimée**: 25 minutes (avec monitoring)

**Risque Global**: ⚠️ **FAIBLE** (migration simple, code testé, rollback disponible)
