# 🚀 INSTRUCTIONS DE DÉPLOIEMENT EN PRODUCTION

**Date:** 2025-11-13  
**Version:** Datetime/Calendar avec sélection d'heure  
**Statut tests:** ✅ VALIDÉ (7/7 tests réussis)  
**Branche:** `feature/mobile-bottom-sheet-v2`  
**Commits clés:**
- `dfed999` - Documentation et validation tests
- `7735b5d` - Correction logique conversion timezone
- `d44ee53` - Activation sélection heures + correction fuseau horaire

---

## 📋 PRÉ-REQUIS

### Vérifications Avant Déploiement

- ✅ **Tests locaux validés** (7/7)
- ✅ **Build réussi** (`npm run build` sans erreur)
- ✅ **Git backup créé** (tag `backup-before-datetime-calendar`)
- ✅ **Documentation complète** (TEST-REPORT, TIMEZONE-FIX-EXPLANATION)
- ⚠️ **Système CRON** sera testé en production (webhook Pabbly)

### Fichiers Modifiés

```
src/index.tsx                        - Code principal (conversion timezone)
migrations/0017_*.sql                - Migration titre/sous-titre (corrigée)
src/routes/settings.ts               - Permissions admin étendues
TEST-REPORT-DATETIME-CALENDAR.md     - Rapport de tests
TIMEZONE-FIX-EXPLANATION.md          - Documentation technique
DEPLOYMENT-INSTRUCTIONS.md           - Ce document
```

---

## 🔐 ÉTAPE 1: CONFIGURATION CLOUDFLARE (Si pas déjà fait)

### 1.1 Vérifier l'Authentification

```bash
# Appeler setup_cloudflare_api_key d'abord
# Puis vérifier l'authentification
npx wrangler whoami
```

**Résultat attendu:**
```
👋 You are logged in with an OAuth Token, associated with the email '<votre-email>'.
```

Si échec: Aller dans l'onglet **Deploy** et configurer votre clé API Cloudflare.

---

## 🏗️ ÉTAPE 2: BUILD DE PRODUCTION

### 2.1 Nettoyer l'Environnement

```bash
cd /home/user/webapp

# Nettoyer les anciens builds
rm -rf dist/
rm -rf .wrangler/
```

### 2.2 Build Production

```bash
npm run build
```

**Résultat attendu:**
```
✓ built in 1.07s
dist/_worker.js  670.82 kB
```

**⚠️ Si erreurs:**
- Vérifier les dépendances: `npm install`
- Vérifier la syntaxe TypeScript
- Consulter les logs d'erreur

---

## 📦 ÉTAPE 3: DÉPLOIEMENT CLOUDFLARE PAGES

### 3.1 Lire le Nom du Projet

```bash
# Utiliser meta_info pour lire le nom du projet
# (devrait être défini lors des déploiements précédents)
```

**Nom du projet attendu:** À vérifier via `meta_info`

### 3.2 Déployer sur Cloudflare Pages

```bash
# Utiliser le nom du projet depuis meta_info
npx wrangler pages deploy dist --project-name <cloudflare_project_name>
```

**⚠️ Important:**
- Remplacer `<cloudflare_project_name>` par le nom réel du projet
- Utiliser `--branch main` si nécessaire
- Le déploiement prend environ 30-60 secondes

**Résultat attendu:**
```
✨ Deployment complete! Take a peek over at
   https://<random-id>.<project-name>.pages.dev
```

### 3.3 Mettre à Jour meta_info (CRITIQUE)

```bash
# Après déploiement réussi, sauvegarder le nom du projet
# Utiliser meta_info pour écrire cloudflare_project_name
```

---

## 🧪 ÉTAPE 4: TESTS POST-DÉPLOIEMENT

### 4.1 Accéder à l'Application

**URL Production:** `https://<votre-domaine>.pages.dev`

**Login:**
- Email: `admin@igpglass.ca`
- Mot de passe: (votre mot de passe production)

### 4.2 Test Rapide de Création de Ticket

1. **Créer un nouveau ticket:**
   - Cliquez "Nouvelle Requête"
   - Sélectionnez une machine
   - Titre: "TEST PROD - DateTime"
   - **Date et heure:** Sélectionnez **demain à 14:30**
   - Soumettez

2. **Vérifier l'affichage:**
   - Ouvrez le ticket créé
   - **L'heure doit afficher 14:30** (et NON 19:30)
   - Vérifiez le countdown

3. **Vérifier la base de données:**
   ```bash
   # Depuis le sandbox ou localement
   npx wrangler d1 execute maintenance-db --remote \
     --command="SELECT ticket_id, title, scheduled_date FROM tickets ORDER BY id DESC LIMIT 1"
   ```
   
   **Résultat attendu:**
   - `scheduled_date` = `19:30 UTC` (si saisi 14:30 EST)

### 4.3 Test CRON (Important!)

**Le test CRON est CRITIQUE car c'est la seule fonctionnalité non testée en local.**

1. **Créer un ticket test pour CRON:**
   - Titre: "TEST CRON PROD"
   - **Date et heure:** Heure actuelle + 5 minutes
   - Statut: "received"

2. **Attendre 10 minutes**

3. **Vérifier les notifications:**
   ```bash
   npx wrangler d1 execute maintenance-db --remote \
     --command="SELECT * FROM webhook_notifications ORDER BY id DESC LIMIT 3"
   ```

4. **Vérifier Pabbly:**
   - Accéder au workflow Pabbly
   - Vérifier que le webhook a reçu les données
   - Confirmer que le format datetime est correct

**⚠️ Si pas de notification:**
- Vérifier que le webhook Pabbly est actif
- Vérifier les logs Cloudflare Pages
- Vérifier le format des données envoyées

### 4.4 Test Compatibilité Anciens Tickets

1. **Ouvrir un ancien ticket** (créé avant cette mise à jour)
2. **Vérifier:**
   - Affichage correct de l'heure
   - Pas de crash
   - Modification possible

---

## 🔍 ÉTAPE 5: MONITORING POST-DÉPLOIEMENT

### 5.1 Surveiller les Premiers 30 Minutes

**Vérifier:**
- ✅ Création de tickets fonctionne
- ✅ Affichage des heures correct
- ✅ Countdown timers fonctionnent
- ✅ Modifications de tickets fonctionnent
- ✅ Pas d'erreurs JavaScript dans la console navigateur

### 5.2 Surveiller les Notifications (24h)

**Actions:**
1. Créer 2-3 tickets avec différentes heures d'expiration
2. Vérifier que les notifications arrivent **au bon moment**
3. Vérifier le contenu des notifications (heure locale correcte)

### 5.3 Logs Cloudflare

```bash
# Consulter les logs en temps réel
npx wrangler pages deployment tail --project-name <cloudflare_project_name>
```

**Surveiller:**
- Erreurs 500
- Erreurs de base de données
- Timeout
- Erreurs de conversion datetime

---

## 🚨 PLAN DE ROLLBACK

### Si Problème Critique Détecté

**Critères de rollback:**
- ❌ Impossible de créer des tickets
- ❌ Heures affichées incorrectes (>1h de décalage)
- ❌ Notifications ne se déclenchent pas
- ❌ Erreurs 500 fréquentes
- ❌ Perte de données

### Procédure de Rollback

#### Option A: Rollback Git (Recommandé)

```bash
cd /home/user/webapp

# 1. Retourner au tag de backup
git reset --hard backup-before-datetime-calendar

# 2. Rebuild
npm run build

# 3. Redéployer
npx wrangler pages deploy dist --project-name <cloudflare_project_name>

# 4. Vérifier
curl https://<votre-domaine>.pages.dev
```

#### Option B: Rollback via Dashboard Cloudflare

1. Aller sur **Cloudflare Dashboard**
2. **Workers & Pages** → Votre projet
3. **Deployments**
4. Trouver le déploiement précédent (avant cette mise à jour)
5. Cliquer **"Rollback to this deployment"**

### Après Rollback

1. **Informer les utilisateurs** (si nécessaire)
2. **Analyser les logs** pour identifier la cause
3. **Créer un issue** avec les détails du problème
4. **Corriger en local** et retester avant redéploiement

---

## 📊 CHECKLIST FINALE

### Avant de Déployer

- [ ] Tests locaux validés (7/7)
- [ ] Build production réussi
- [ ] Tag git backup créé
- [ ] Authentification Cloudflare vérifiée
- [ ] Nom du projet confirmé (meta_info)

### Pendant le Déploiement

- [ ] Build `npm run build` sans erreur
- [ ] Deploy Cloudflare réussi
- [ ] URL de production accessible
- [ ] meta_info mis à jour avec project_name

### Après le Déploiement

- [ ] Login fonctionnel
- [ ] Création de ticket test réussie
- [ ] Affichage heure correct (ex: 14:30)
- [ ] Countdown timer fonctionne
- [ ] Test CRON planifié (ticket + 5 min)
- [ ] Ancien ticket accessible et modifiable

### Monitoring (24h)

- [ ] Notifications CRON arrivent au bon moment
- [ ] Pas d'erreurs dans les logs Cloudflare
- [ ] Utilisateurs ne rapportent pas de problèmes
- [ ] Heures affichées cohérentes

---

## 🎯 CRITÈRES DE SUCCÈS

**Le déploiement est considéré réussi si:**

1. ✅ **Tickets créés avec heure spécifique** s'affichent correctement
2. ✅ **Countdown timers** calculent correctement le temps restant
3. ✅ **Notifications CRON** se déclenchent au bon moment (±5 min)
4. ✅ **Anciens tickets** restent accessibles et modifiables
5. ✅ **Aucune erreur critique** dans les logs pendant 24h

---

## 📞 SUPPORT

### En Cas de Problème

**Questions techniques:**
- Consulter `TEST-REPORT-DATETIME-CALENDAR.md`
- Consulter `TIMEZONE-FIX-EXPLANATION.md`
- Vérifier les commits: `d44ee53`, `7735b5d`, `dfed999`

**Rollback immédiat:**
- Utiliser tag: `backup-before-datetime-calendar`
- Ou rollback via Dashboard Cloudflare

**Analyse post-mortem:**
- Extraire les logs: `npx wrangler pages deployment tail`
- Vérifier la DB: `npx wrangler d1 execute maintenance-db --remote`
- Vérifier Pabbly webhook history

---

## ✅ VALIDATION POST-DÉPLOIEMENT

**Après 24h de monitoring sans problème:**

1. **Marquer le déploiement comme réussi**
2. **Supprimer le tag de backup** (optionnel, après 1 semaine)
3. **Planifier Phase 2:** Traduction française de l'interface calendrier
4. **Documenter les leçons apprises**

---

## 🎊 PROCHAINES ÉTAPES (Phase 2)

**Traduction Française de l'Interface Calendrier:**

- [ ] Traduire les labels "Date et heure de maintenance"
- [ ] Traduire les messages d'aide "(heure locale EST/EDT)"
- [ ] Gérer correctement les caractères spéciaux et apostrophes
- [ ] Tester l'affichage dans différents navigateurs

**Estimé:** 30-60 minutes de développement

---

**Document créé le:** 2025-11-13  
**Dernière mise à jour:** 2025-11-13  
**Auteur:** Assistant AI  
**Statut:** ✅ PRÊT POUR PRODUCTION
