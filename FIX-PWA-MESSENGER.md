# 🔧 FIX - Installation PWA Messenger Séparée

## ❌ PROBLÈME IDENTIFIÉ

Le téléphone détectait l'app principale et le messenger comme **LA MÊME APPLICATION** lors de l'installation PWA.

### Causes
1. **Service Worker partagé**: Les deux apps utilisaient `/service-worker.js`
2. **Scope conflictuel**: Pas d'isolation entre les deux PWA
3. **Manifest ID manquant**: L'app principale n'avait pas d'`id` unique

---

## ✅ SOLUTION IMPLÉMENTÉE

### 1. Service Worker Dédié pour Messenger
**Fichier créé**: `public/messenger/service-worker-messenger.js`
- Service worker séparé avec scope `/messenger/`
- Cache dédié: `connect-messenger-v1.0.0`
- Enregistrement dans `/messenger/` uniquement

### 2. Manifests Distincts avec ID Unique

**App Principale** (`/manifest.json`):
```json
{
  "id": "/?source=pwa",
  "name": "MaintenanceOS",
  "start_url": "/?source=pwa",
  "scope": "/"
}
```

**Messenger** (`/messenger/manifest.messenger.json`):
```json
{
  "id": "/messenger/",
  "name": "Connect",
  "start_url": "/messenger/",
  "scope": "/messenger/"
}
```

### 3. Enregistrement SW Modifié
**Fichier modifié**: `src/messenger/index.html` (ligne 62-71)
```javascript
navigator.serviceWorker.register('/messenger/service-worker-messenger.js', {
    scope: '/messenger/'
})
```

---

## 📁 FICHIERS MODIFIÉS

| Fichier | Changement |
|---------|-----------|
| `public/messenger/service-worker-messenger.js` | ✅ **CRÉÉ** - SW dédié |
| `public/manifest.json` | ✅ Ajout `id: "/?source=pwa"` |
| `src/messenger/index.html` | ✅ SW + manifest path corrigés |

---

## 🧪 TESTS EFFECTUÉS

```bash
# ✅ App principale
curl -I http://localhost:3000/manifest.json
# id: "/?source=pwa", scope: "/"

# ✅ Messenger
curl -I http://localhost:3000/messenger/manifest.messenger.json
# id: "/messenger/", scope: "/messenger/"

# ✅ Service Workers séparés
curl -I http://localhost:3000/service-worker.js              # App principale
curl -I http://localhost:3000/messenger/service-worker-messenger.js  # Messenger
```

---

## 📱 PROCÉDURE D'INSTALLATION (Utilisateur)

### Désinstaller les anciennes versions
1. Sur Android:
   - Paramètres → Apps → MaintenanceOS → Désinstaller
   - Paramètres → Apps → Connect → Désinstaller
2. Sur iOS:
   - Maintenir l'icône → Supprimer l'app

### Installer les nouvelles versions
1. **App Principale**: Ouvrir `https://votre-domaine.com/`
   - Menu → Ajouter à l'écran d'accueil
   - Vérifier l'icône: **MaintenanceOS** (bleu)

2. **Messenger**: Ouvrir `https://votre-domaine.com/messenger/`
   - Menu → Ajouter à l'écran d'accueil
   - Vérifier l'icône: **Connect** (vert)

---

## 🎯 RÉSULTAT

- ✅ Deux PWA **complètement séparées**
- ✅ Icônes différentes
- ✅ Noms différents (MaintenanceOS vs Connect)
- ✅ Service Workers isolés
- ✅ Cache indépendants
- ✅ Installations indépendantes

---

## 🚀 DÉPLOIEMENT

```bash
# Build
npm run build

# Vérifier que le SW messenger est copié
ls -la dist/messenger/service-worker-messenger.js

# Déployer
npm run deploy:safe
```

---

## ⚠️ NOTES IMPORTANTES

1. **Ne pas utiliser `/service-worker.js` dans le messenger**
2. **Ne pas modifier le scope des manifests**
3. **Vérifier que `id` est unique entre les deux PWA**
4. **Copier le SW messenger dans dist après chaque build**

---

## 📚 RÉFÉRENCES

- PWA Identity: https://web.dev/learn/pwa/app-design#identity
- Service Worker Scope: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
- Manifest ID: https://www.w3.org/TR/appmanifest/#id-member

---

**Date**: 2025-12-25  
**Version**: 3.0.0-beta.4  
**Statut**: ✅ RÉSOLU
