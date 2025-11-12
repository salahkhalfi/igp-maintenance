# 🚀 Guide de Déploiement Production - Système Webhook Notifications

**Date**: 12 novembre 2025  
**Commit**: 3ac9dfc  
**Status**: ✅ PRODUCTION READY

---

## ✅ CE QUI EST SÛR

### Vos données sont 100% PROTÉGÉES :

| Table | Status | Modifications |
|-------|--------|---------------|
| `users` | ✅ INTACTE | Aucune |
| `machines` | ✅ INTACTE | Aucune |
| `tickets` | ✅ INTACTE | Aucune |
| `ticket_comments` | ✅ INTACTE | Aucune |
| `media` | ✅ INTACTE | Aucune |
| `messages` | ✅ INTACTE | Aucune |
| `webhook_notifications` | ➕ NOUVELLE | Table ajoutée |

**GARANTIE**: Redéployer le code ne touche PAS la base de données existante.

---

## 📋 ÉTAPES DE DÉPLOIEMENT

### 1️⃣ Appliquer la migration en production

```bash
cd /home/user/webapp
npx wrangler d1 migrations apply maintenance-db --remote
```

**Attendu** : Message "✅ Migration 0014_add_webhook_notifications.sql applied"

### 2️⃣ Vérifier que la migration est appliquée

```bash
npx wrangler d1 execute maintenance-db --remote --command="SELECT name FROM sqlite_master WHERE name='webhook_notifications'"
```

**Attendu** : `{ "name": "webhook_notifications" }`

### 3️⃣ Build du code

```bash
npm run build
```

**Attendu** : `✓ built in XXXms`

### 4️⃣ Déployer vers production

```bash
npm run deploy
# OU
npx wrangler pages deploy dist --project-name webapp
```

**Attendu** :
```
✨ Success! Uploaded X files
✨ Deployment complete!
  https://webapp-xxx.pages.dev
```

### 5️⃣ Vérifier le déploiement

1. Allez sur votre URL de production
2. Connectez-vous
3. Vérifiez que l'application fonctionne normalement
4. **NE PAS** créer de ticket expiré tout de suite

---

## 🧪 TEST EN PRODUCTION (PRUDENT)

### Phase 1: Créer UN ticket test expiré

1. Créez un ticket normal
2. Assignez-le à quelqu'un
3. Planifiez-le pour **hier** (ex: 11 novembre 2025)
4. Attendez **5-10 minutes** maximum

### Phase 2: Vérifier l'email

**Si vous recevez l'email :**
- ✅ Le système fonctionne !
- ✅ Vérifiez que les données du ticket sont correctes
- ✅ Attendez 5 minutes et vérifiez qu'il n'y a PAS de doublon (protection 24h)

**Si vous ne recevez PAS l'email après 10 minutes :**
- ⚠️ Consultez les logs Cloudflare Workers
- ⚠️ Vérifiez Pabbly Connect Task History

### Phase 3: Vérifier les logs Cloudflare

1. Allez sur Cloudflare Dashboard
2. Workers & Pages > webapp
3. Onglet "Logs" (Real-time Logs)
4. Cherchez : `🔔 CRON démarré`

**Logs attendus :**
```
🔔 CRON démarré: 2025-11-12T09:XX:XXZ
📋 CRON: 1 ticket(s) expiré(s) trouvé(s)
✅ CRON: Webhook envoyé pour XXX (status: 200)
🎉 CRON terminé: 1/1 notification(s) envoyée(s)
```

---

## 🔙 PLAN DE ROLLBACK (SI PROBLÈME)

### Option 1: Via Cloudflare Dashboard (RECOMMANDÉ - 30 secondes)

1. Allez sur **Cloudflare Pages Dashboard**
2. Sélectionnez votre projet **webapp**
3. Onglet **"Deployments"**
4. Trouvez le déploiement **précédent** (celui d'avant)
5. Cliquez sur les **3 points** → **"Rollback to this deployment"**
6. Confirmez

**✅ Vos données restent INTACTES pendant le rollback !**

### Option 2: Via Git (2-3 minutes)

```bash
# Voir les derniers commits
git log --oneline -5

# Revenir au commit précédent (avant les webhooks)
git checkout <commit-hash-precedent>

# Redéployer
npm run build
npm run deploy
```

### Option 3: Désactiver seulement le CRON

Si le problème vient du CRON mais le reste fonctionne :

```bash
# Éditer wrangler.jsonc
# Commentez ou supprimez la section triggers:
# "triggers": {
#   "crons": ["*/5 * * * *"]
# }

# Redéployer
npm run build
npm run deploy
```

---

## 📊 MONITORING POST-DÉPLOIEMENT

### Première heure :

- [ ] Vérifier que l'application charge normalement
- [ ] Tester création/modification de tickets
- [ ] Tester messagerie
- [ ] Vérifier gestion des utilisateurs
- [ ] Créer 1 ticket expiré test
- [ ] Attendre 10 minutes
- [ ] Vérifier email reçu

### Premier jour :

- [ ] Vérifier Cloudflare Workers Logs (chercher erreurs)
- [ ] Vérifier Pabbly Connect Task History
- [ ] Compter nombre d'emails reçus vs tickets expirés
- [ ] Vérifier qu'il n'y a pas de doublons (protection 24h)

### Première semaine :

- [ ] Analyser volume d'emails
- [ ] Vérifier que les tickets non expirés ne génèrent PAS d'alertes
- [ ] Vérifier que les tickets en cours ne génèrent PAS d'alertes
- [ ] Confirmer que limite 24h fonctionne

---

## 🚨 INDICATEURS DE PROBLÈME

### ⚠️ Problème MINEUR (pas urgent) :

- Emails reçus mais données manquantes/incorrectes
- Délai > 10 minutes pour recevoir email
- Un ticket n'a pas généré d'email

**Action** : Monitorer, noter les détails, corriger dans prochaine version

### 🔴 Problème MAJEUR (rollback immédiat) :

- Application ne charge plus
- Erreurs 500 généralisées
- Impossibilité de créer/modifier tickets
- Base de données corrompue (très improbable)
- Flood d'emails (100+ emails d'un coup)

**Action** : ROLLBACK IMMÉDIATEMENT via Cloudflare Dashboard

---

## 📞 SUPPORT & DEBUGGING

### Vérifier table webhook_notifications en production :

```bash
npx wrangler d1 execute maintenance-db --remote --command="SELECT COUNT(*) as total FROM webhook_notifications"
```

### Voir les dernières notifications envoyées :

```bash
npx wrangler d1 execute maintenance-db --remote --command="SELECT wn.id, t.ticket_id, wn.sent_at, wn.response_status FROM webhook_notifications wn INNER JOIN tickets t ON wn.ticket_id = t.id ORDER BY wn.sent_at DESC LIMIT 10"
```

### Voir les tickets actuellement expirés :

```bash
npx wrangler d1 execute maintenance-db --remote --command="SELECT ticket_id, title, scheduled_date, status, assigned_to FROM tickets WHERE assigned_to IS NOT NULL AND scheduled_date IS NOT NULL AND scheduled_date != 'null' AND status IN ('received', 'diagnostic') AND datetime(scheduled_date) < datetime('now') ORDER BY scheduled_date ASC"
```

### Forcer un CRON manuellement (si vraiment nécessaire) :

Via Cloudflare Dashboard :
1. Workers & Pages > webapp
2. Onglet "Triggers"
3. Section "Cron Triggers"
4. Bouton "Trigger" à côté de `*/5 * * * *`

---

## ✅ CHECKLIST FINALE AVANT DÉPLOIEMENT

- [x] Route `/api/test-cron` retirée
- [x] Code commité (commit 3ac9dfc)
- [x] Migration préparée (0014_add_webhook_notifications.sql)
- [x] Documentation complète
- [x] Plan de rollback défini
- [ ] Migration appliquée en production (`--remote`)
- [ ] Build réussi (`npm run build`)
- [ ] Déploiement effectué (`npm run deploy`)
- [ ] Test avec 1 ticket expiré
- [ ] Email reçu confirmé
- [ ] Monitoring actif premier jour

---

## 📈 MÉTRIQUES DE SUCCÈS

**Après 24h :**
- ✅ Tous les tickets expirés ont généré un email
- ✅ Aucun doublon reçu (protection 24h OK)
- ✅ Aucune erreur dans logs Cloudflare
- ✅ Application fonctionne normalement

**Si ces 4 points sont OK → Déploiement RÉUSSI ! 🎉**

---

**Bonne chance avec le déploiement! Le système est prêt et sûr. 🚀**
