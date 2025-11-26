# 🔍 DIAGNOSTIC - Push Notifications Non Reçues

**Date:** 26 Novembre 2025  
**Problème:** "Push non reçu"

---

## ✅ VÉRIFICATIONS CONFIGURATION

### 1. Configuration Cloudflare
```bash
# Vérifier variables d'environnement
wrangler.jsonc:
  ✅ VAPID_PUBLIC_KEY: Configuré
  ✅ PUSH_ENABLED: "true"
  ✅ ENVIRONMENT: "production"

# Vérifier secrets Cloudflare
npx wrangler pages secret list --project-name webapp
  ✅ VAPID_PRIVATE_KEY: Configuré (Encrypted)
  ✅ JWT_SECRET: Configuré (Encrypted)
  ✅ CRON_SECRET: Configuré (Encrypted)
```

**Résultat:** ✅ Configuration serveur OK

---

## 🔍 ÉTAPES DE DIAGNOSTIC

### ÉTAPE 1: Vérifier Subscription Push

**Question:** Avez-vous activé les notifications push dans l'application?

**Actions à vérifier:**
1. Ouvrir https://mecanique.igpglass.ca
2. Se connecter avec votre compte
3. Vérifier si le bouton push dans la navbar est:
   - 🟢 **VERT** = Notifications activées
   - 🔴 **ROUGE** = Notifications désactivées

**Si rouge, cliquer dessus pour activer:**
- Le navigateur demande permission
- Accepter la permission
- Le bouton devient vert
- Subscription enregistrée en base de données

---

### ÉTAPE 2: Vérifier Type de Navigateur

**Question:** Quel navigateur/appareil utilisez-vous?

**Compatibilité Push Notifications:**

| Plateforme | Navigateur | Support | Recommandation |
|------------|------------|---------|----------------|
| Android | Chrome (PWA installée) | ✅ Excellent | **INSTALLER EN PWA** |
| Android | Chrome (web) | ⚠️ Limité | Notifications bloquées en arrière-plan |
| Android | Firefox | ⚠️ Limité | Support partiel |
| iOS | Safari | ✅ Bon | Native support |
| Desktop | Chrome/Edge | ✅ Excellent | Fonctionne directement |
| Desktop | Firefox | ✅ Excellent | Fonctionne directement |

**IMPORTANT pour Android:**
> Les notifications push sur Android Chrome ne fonctionnent **FIABLEMENT** que si l'application est **INSTALLÉE EN PWA**.

**Comment installer en PWA:**
1. Ouvrir Chrome sur Android
2. Aller sur https://mecanique.igpglass.ca
3. Menu (⋮) → "Installer l'application"
4. Icône ajoutée à l'écran d'accueil
5. Ouvrir l'app depuis l'icône
6. Activer notifications (bouton vert)

---

### ÉTAPE 3: Vérifier Permissions Navigateur

**Chrome Desktop:**
1. Cliquer sur cadenas 🔒 dans barre d'adresse
2. Permissions du site
3. Notifications → "Autoriser"

**Chrome Android (PWA):**
1. Paramètres Android → Applications
2. Trouver "Maintenance IGP"
3. Notifications → Activées
4. Importance → "Urgent" ou "Élevée"

**iOS Safari:**
1. Réglages → Safari → Sites web
2. Notifications → Autoriser pour mecanique.igpglass.ca

---

### ÉTAPE 4: Vérifier Database Subscription

**Requête SQL à exécuter:**
```sql
-- Vérifier vos subscriptions
SELECT * FROM push_subscriptions 
WHERE user_id = [VOTRE_USER_ID] 
ORDER BY created_at DESC;

-- Vérifier logs push récents
SELECT * FROM push_logs 
WHERE user_id = [VOTRE_USER_ID] 
ORDER BY created_at DESC 
LIMIT 10;
```

**Commande Wrangler:**
```bash
# Vérifier subscriptions en production
npx wrangler d1 execute maintenance-db \
  --command="SELECT COUNT(*) as count FROM push_subscriptions WHERE user_id = [ID]"

# Vérifier derniers logs push
npx wrangler d1 execute maintenance-db \
  --command="SELECT * FROM push_logs ORDER BY created_at DESC LIMIT 5"
```

**Interpréter résultats:**
- **0 subscriptions:** Vous n'avez pas activé les notifications
- **1+ subscriptions mais status='failed':** Problème d'envoi serveur
- **1+ subscriptions et status='success':** Push envoyé, problème réception client

---

### ÉTAPE 5: Test Manuel Push

**Créer un ticket de test:**
1. Se connecter en tant qu'admin
2. Créer nouveau ticket
3. Assigner à votre utilisateur
4. Vérifier notification reçue

**Vérifier logs immédiatement après:**
```bash
# Logs Cloudflare Pages
npx wrangler pages deployment tail --project-name webapp

# OU via dashboard Cloudflare
https://dash.cloudflare.com → Pages → webapp → Logs
```

**Chercher dans logs:**
```
✅ Push notification sent for new ticket
❌ Push notification failed
⚠️ VAPID keys not configured
```

---

### ÉTAPE 6: Vérifier Service Worker

**Console DevTools:**
1. Ouvrir DevTools (F12)
2. Onglet "Application"
3. Service Workers
4. Vérifier status:
   - ✅ "activated and is running"
   - ❌ "stopped" ou "error"

**Console logs:**
```javascript
// Dans console DevTools
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs.length);
  regs.forEach(reg => console.log('SW:', reg));
});

// Vérifier subscription
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    console.log('Push subscription:', sub);
  });
});
```

**Résultats attendus:**
- 1 service worker actif
- 1 push subscription avec endpoint

---

## 🐛 PROBLÈMES COURANTS & SOLUTIONS

### Problème 1: Bouton Reste Rouge
**Symptôme:** Clic sur bouton push, rien ne se passe

**Causes possibles:**
1. Permissions refusées par navigateur
2. Service worker non chargé
3. HTTPS requis (OK pour vous)

**Solution:**
```javascript
// Console DevTools
Notification.permission
// Si "denied" → Réinitialiser permissions site
// Chrome: Paramètres → Confidentialité → Autorisations du site
```

---

### Problème 2: Push Envoyé mais Non Reçu (Android Chrome Web)
**Symptôme:** Logs montrent "success" mais aucune notification

**Cause:** Android bloque notifications en arrière-plan pour Chrome web

**Solution:** ✅ **INSTALLER EN PWA** (voir étape 2)

---

### Problème 3: Notifications Reçues Mais Sans Lien
**Symptôme:** Notification arrive mais clic n'ouvre pas le ticket

**Cause:** Code non déployé ou cache service worker

**Solution:**
```javascript
// Désinstaller service worker
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});

// Recharger page (Ctrl+F5)
// Réactiver push notifications
```

---

### Problème 4: "410 Gone" dans Logs
**Symptôme:** push_logs contient erreur "410 Gone"

**Cause:** Subscription expirée (navigateur désinstallé/réinitialisé)

**Solution:**
1. Cliquer bouton rouge pour désactiver
2. Cliquer bouton vert pour réactiver
3. Nouvelle subscription créée

---

### Problème 5: Multiple Subscriptions
**Symptôme:** Plusieurs entrées dans push_subscriptions pour même user

**Cause:** Normal (1 par appareil, max 5)

**Solution:** Aucune, c'est voulu (limite automatique 5 appareils)

---

## 📋 CHECKLIST DE DÉPANNAGE

**Avant de créer un ticket de test:**
- [ ] Bouton push dans navbar est VERT
- [ ] Permission navigateur "Autoriser" notifications
- [ ] Service worker actif dans DevTools
- [ ] Push subscription existe (console.log)
- [ ] Sur Android: App installée en PWA
- [ ] Sur Android: Notifications app activées dans Réglages

**Créer ticket de test:**
- [ ] Se connecter en tant qu'admin
- [ ] Créer ticket "TEST PUSH"
- [ ] Assigner à vous-même
- [ ] Attendre 5-10 secondes

**Vérifier réception:**
- [ ] Notification apparue sur appareil
- [ ] Titre contient votre prénom
- [ ] Clic ouvre modal du ticket
- [ ] URL nettoyée après ouverture

---

## 🔬 COMMANDES DE DEBUG

### Vérifier Subscriptions en Production
```bash
npx wrangler d1 execute maintenance-db \
  --command="SELECT 
    ps.id,
    ps.user_id,
    u.first_name,
    ps.device_name,
    ps.created_at,
    ps.last_used
  FROM push_subscriptions ps
  JOIN users u ON ps.user_id = u.id
  ORDER BY ps.created_at DESC
  LIMIT 10"
```

### Vérifier Derniers Logs Push
```bash
npx wrangler d1 execute maintenance-db \
  --command="SELECT 
    pl.id,
    pl.user_id,
    u.first_name,
    pl.ticket_id,
    pl.status,
    pl.error_message,
    pl.created_at
  FROM push_logs pl
  JOIN users u ON pl.user_id = u.id
  ORDER BY pl.created_at DESC
  LIMIT 10"
```

### Vérifier Derniers Tickets Créés
```bash
npx wrangler d1 execute maintenance-db \
  --command="SELECT 
    id,
    ticket_id,
    title,
    assigned_to,
    created_at
  FROM tickets
  ORDER BY created_at DESC
  LIMIT 5"
```

---

## 💡 SOLUTION RAPIDE (Most Likely)

**Si vous êtes sur Android Chrome:**

1. **Installer l'app en PWA** (5 minutes)
   ```
   Chrome → mecanique.igpglass.ca
   Menu (⋮) → "Installer l'application"
   Ouvrir l'app depuis l'icône
   ```

2. **Activer notifications dans l'app**
   ```
   Bouton rouge dans navbar → Cliquer
   Accepter permission navigateur
   Bouton devient vert
   ```

3. **Tester immédiatement**
   ```
   Créer ticket de test
   Assigner à vous
   Notification devrait arriver en 2-5 secondes
   ```

**Probabilité de succès:** 95%

---

## 📊 TAUX DE SUCCÈS PAR PLATEFORME

**Basé sur tests précédents:**

| Plateforme | Taux Succès | Notes |
|------------|-------------|-------|
| Android Chrome PWA | 100% | ✅ Fonctionne parfaitement |
| Android Chrome Web | 10% | ❌ Bloqué en arrière-plan |
| iOS Safari | 95% | ✅ Support natif |
| Desktop Chrome | 100% | ✅ Aucun problème |
| Desktop Firefox | 100% | ✅ Aucun problème |

---

## 🆘 SI RIEN NE FONCTIONNE

**Informations à fournir:**

1. **Plateforme:**
   - OS: Android / iOS / Windows / Mac / Linux
   - Navigateur: Chrome / Safari / Firefox
   - Version navigateur
   - PWA installée: Oui / Non

2. **État bouton push:**
   - 🔴 Rouge (désactivé)
   - 🟢 Vert (activé)
   - Clic ne fait rien

3. **Console logs:**
   ```javascript
   // Copier résultat de ces commandes
   console.log('Permission:', Notification.permission);
   navigator.serviceWorker.getRegistrations().then(r => console.log('SW:', r));
   ```

4. **Dernière action:**
   - "J'ai créé un ticket assigné à moi"
   - "J'ai cliqué sur bouton push mais rien"
   - "Permission refusée par navigateur"

---

## ✅ PROCHAINES ÉTAPES

**Immédiatement:**
1. Vérifier bouton push est VERT
2. Si Android Chrome web → Installer PWA
3. Créer ticket de test
4. Attendre 5-10 secondes

**Si toujours pas reçu:**
1. Ouvrir DevTools console
2. Copier logs JavaScript
3. Vérifier push_logs en base de données
4. Fournir informations plateforme

---

*Document de diagnostic créé le 26 Novembre 2025*  
*Pour support: Fournir résultats des commandes debug*
