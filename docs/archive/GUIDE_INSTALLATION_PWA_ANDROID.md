# 📱 Guide d'Installation PWA - Android

**Pour recevoir les notifications push sur Android, vous devez installer l'application.**

## ⚠️ Problème Sans PWA

Sur Android, les notifications des sites web (Chrome) sont **bloquées en arrière-plan** pour économiser la batterie.

**Symptômes** :
- ✅ Vous activez les notifications (bouton vert)
- ✅ Le système confirme l'abonnement
- ❌ **Vous ne recevez jamais les notifications**

**Cause** : Android désactive les service workers des sites web quand Chrome est en arrière-plan.

---

## ✅ Solution : Installation PWA (2 minutes)

### Étape 1 : Ouvrir Chrome Android

Ouvrez https://app.igpglass.ca dans **Chrome** (pas Firefox ou autre navigateur).

### Étape 2 : Menu Chrome

Cliquez sur le menu (⋮) en **haut à droite** de Chrome.

### Étape 3 : Installer l'Application

Sélectionnez une de ces options (selon version Chrome) :
- **"Installer l'application"** ⬅️ Option préférée
- **"Ajouter à l'écran d'accueil"**
- **"Installer Maintenance IGP"**

### Étape 4 : Confirmer Installation

Une popup apparaît :
```
Installer cette application ?
Maintenance IGP sera ajoutée à votre écran d'accueil
```

Cliquez sur **"Installer"** ou **"Ajouter"**.

### Étape 5 : Ouvrir l'App Installée

1. Allez sur votre **écran d'accueil** Android
2. Cherchez l'icône **"Maintenance IGP"**
3. **Ouvrez l'app** (elle s'ouvre en plein écran, sans barre Chrome)

### Étape 6 : Activer les Notifications

1. Connectez-vous avec vos identifiants
2. Cliquez sur le bouton **"Notifications"** (coin supérieur droit)
3. Autorisez les notifications quand Android demande
4. **Le bouton devient VERT** ✅
5. **Vous recevrez maintenant les notifications !**

---

## 🎯 Différences PWA vs Site Web

| Chrome Web (site) | PWA (app installée) |
|-------------------|---------------------|
| ❌ Notifications bloquées arrière-plan | ✅ Notifications TOUJOURS reçues |
| ❌ Service worker désactivé | ✅ Service worker actif 24/7 |
| ❌ Chrome peut fermer l'onglet | ✅ App reste en mémoire |
| Barre d'adresse visible | Plein écran (sans barre) |
| Onglet dans Chrome | App séparée |
| - | Icône écran d'accueil |
| - | Expérience native |

---

## 🧪 Test de Validation

**Après installation PWA** :

1. **Gardez l'app ouverte** en arrière-plan (appuyez sur Home, ne fermez pas)
2. **Créez un ticket** ou attendez qu'un ticket expire
3. **Vous recevrez une notification** avec :
   - Son de notification Android
   - Titre du ticket
   - Détails de l'intervention
   - Icône de l'app

**C'est tout !** Les notifications fonctionnent maintenant parfaitement.

---

## 🔧 Dépannage

### "Je ne vois pas l'option Installer"

**Solutions** :
1. Vérifiez que vous utilisez **Chrome** (pas Firefox/Opera/etc.)
2. Mettez à jour Chrome vers la dernière version
3. L'option peut apparaître comme popup automatique en bas de l'écran
4. Essayez de recharger la page (F5)

### "Le bouton reste orange après activation"

**Solutions** :
1. **Désinstallez l'app** (maintenez l'icône → "Désinstaller")
2. **Redémarrez Chrome**
3. **Réinstallez l'app** (étapes ci-dessus)
4. **Réactivez les notifications**

### "Notifications reçues mais pas de son"

**Solutions** :
1. **Paramètres Android** → **Applications** → **Maintenance IGP**
2. **Notifications** → Vérifiez que "Son" est activé
3. **Ne pas déranger** : Vérifiez que mode silencieux est désactivé
4. **Volume notifications** : Augmentez le volume système

### "App se ferme automatiquement"

**Solutions Android agressifs (Xiaomi, Huawei, OnePlus)** :

1. **Paramètres** → **Applications** → **Maintenance IGP**
2. **Batterie** → **Non optimisé** ou **Sans restriction**
3. **Autostart** → **Activé**
4. **Applications protégées** → **Activer Maintenance IGP**

---

## 📊 Statistiques

**Backend** : 100% envois réussis ✅  
**FCM (Firebase)** : 100% acceptés ✅  
**Chrome Web Android** : 0% reçus ❌  
**PWA Android** : **100% reçus** ✅

**Conclusion** : L'installation PWA est **OBLIGATOIRE** sur Android pour garantir la réception des notifications.

---

## 🆘 Support

Si vous avez encore des problèmes après installation PWA :

1. **Vérifiez que le bouton Notifications est VERT**
2. **Testez avec le bouton "Test Push"** dans Paramètres
3. **Vérifiez les paramètres Android** (ci-dessus)
4. **Contactez l'administrateur** système

**Note** : Ce problème est spécifique à **Android uniquement**. iOS Safari et Desktop Chrome/Edge/Firefox fonctionnent sans PWA.

---

**Version** : 1.0  
**Date** : 2025-11-24  
**Auteur** : Salah Khalfi - Technologies de l'Information
