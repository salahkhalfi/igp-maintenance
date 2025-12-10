# PROTOCOLE OFFLINE-FIRST (IGP CONNECT)

## 1. Philosophie "Local First"
L'application ne doit JAMAIS considérer le réseau comme acquis.
- **État par défaut** : L'interface réagit immédiatement (Optimistic UI).
- **Synchronisation** : Les données sont envoyées en arrière-plan.
- **Persistance** : Rien n'est perdu si le réseau coupe.

## 2. Architecture Technique

### A. Gestion des Messages (Outbox Pattern)
1. **Saisie** : L'utilisateur tape un message et valide.
2. **Local** : Le message est *immédiatement* ajouté à l'état React (`messages`) et stocké dans `LocalStorage` (`pending_messages`).
3. **Affichage** : Le message apparaît tout de suite avec une icône "En attente" (🕒) ou une opacité réduite.
4. **Réseau** :
   - Si **Online** : Tentative d'envoi immédiat (`fetch`).
     - Succès : Suppression de la queue locale, mise à jour UI.
     - Échec : Maintien dans la queue locale.
   - Si **Offline** : Aucune tentative réseau, reste dans la queue.
5. **Récupération** : Un écouteur `window.addEventListener('online')` déclenche le `flushMessageQueue()` qui vide la queue séquentiellement.

### B. Gestion des Avatars & Assets (Cache-First)
1. **Identification** : Toutes les URLs `/api/auth/avatar/*` et `/api/v2/chat/asset?key=*`.
2. **Versioning** : Utilisation stricte de hash de contenu (`?v=xyz`).
   - 🚫 INTERDIT : `?t=Date.now()` (Casse le cache offline).
3. **Service Worker** :
   - Stratégie : **Cache First** (Priorité Cache).
   - Si en cache : Servir immédiatement (0ms latence).
   - Si Online : Mise à jour en arrière-plan (Stale-While-Revalidate).
   - Si Offline : Servir le cache, sinon échec silencieux (placeholder).

### C. Gestion des API de Lecture (GET)
1. **Stratégie** : **Network First** avec **Fallback Cache Infini**.
2. **Logique** :
   - Tenter le réseau pour avoir les données fraîches.
   - Si succès : Mettre en cache.
   - Si échec (Offline) : Renvoyer le cache (même vieux de 7 jours).
   - Si pas de cache : Renvoyer erreur 503 (Gérée par l'UI "Mode Hors Ligne").

## 3. Implémentation Actuelle (v3.0 - Plane State Proof)

### Service Worker (`service-worker.js`)
- **Assets** : Cache First + Background Update.
- **GET API** : Network First -> Cache Fallback.
- **POST/PUT API** : Network Only (Erreur 503 immédiate pour déclencher la queue locale).

### Frontend (`App.tsx`)
- **Queue** : `pendingMessages` persisté dans `localStorage`.
- **Sync** : Auto-flush au retour du réseau.
- **Avatar** : Suppression des timestamps aléatoires, confiance totale au SW.

---
*Ce document fait foi pour toute modification future du système de messagerie.*
