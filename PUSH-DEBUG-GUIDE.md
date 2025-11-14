# Guide de Debug Push Notifications

## Deployment Info
- **URL de test**: https://3d1e884b.webapp-7t8.pages.dev
- **Branch**: main
- **Date**: 2025-11-14

## Changements Deployes

### 1. Debug Logging Frontend (push-notifications.js)
Ajout de logs detailles pour tracer chaque etape:

```
[SUBSCRIBE] Debut subscription push
[SUBSCRIBE] window.axios existe? true/false
[SUBSCRIBE] localStorage accessible? true/false
[SUBSCRIBE] axios.defaults.headers.common.Authorization: EXISTS/NULL
[SUBSCRIBE] Auth token from axios.defaults (length: X)
[SUBSCRIBE] Auth token from localStorage (length: X)
[SUBSCRIBE] Token trouve, longueur: X
[SUBSCRIBE] Attente service worker...
[SUBSCRIBE] Service worker ready
[SUBSCRIBE] Fetching VAPID public key avec Authorization header...
[SUBSCRIBE] Auth header sera: Bearer xxx...
[SUBSCRIBE] VAPID key recu, status: 200
[SUBSCRIBE] Public key: BCX42...
[SUBSCRIBE] Creating browser push subscription...
[SUBSCRIBE] Browser subscription created
[SUBSCRIBE] Endpoint: https://fcm.googleapis.com/...
[SUBSCRIBE] Device info: {deviceType, deviceName}
[SUBSCRIBE] Sending subscription to /api/push/subscribe...
[SUBSCRIBE] SUCCESS! Push notifications activees
```

### 2. Debug Logging Backend (auth middleware)
Ajout de logs dans l'authentification:

```
[AUTH-MIDDLEWARE] Authorization header: Bearer xxx...
[AUTH-MIDDLEWARE] Token extracted: xxx... (length: X)
[AUTH-MIDDLEWARE] Token verification result: VALID/INVALID
[AUTH-MIDDLEWARE] SUCCESS: User authenticated: userId email role
```

### 3. Gestion d'Erreurs Amelioree
Detection specifique erreur 401:

```javascript
if (error.response.status === 401) {
  console.error('[SUBSCRIBE] ERREUR 401 AUTHENTICATION!');
  console.error('[SUBSCRIBE] Le token auth est probablement invalide ou expire');
  alert('Erreur authentication (401). Reconnectez-vous.');
}
```

## Instructions de Test

### Etape 1: Ouvrir Console Developpeur
1. Aller sur https://3d1e884b.webapp-7t8.pages.dev
2. Appuyer F12 pour ouvrir DevTools
3. Aller sur l'onglet **Console**
4. **IMPORTANT**: Garder la console ouverte pendant tout le test

### Etape 2: Se Connecter
1. Se connecter avec votre compte
2. Verifier dans la console qu'il y a:
   ```
   [SUBSCRIBE] window.axios existe? true
   [SUBSCRIBE] localStorage accessible? true
   ```

### Etape 3: Cliquer Bouton Notifications
1. Cliquer sur le bouton "Activer Notifications Push"
2. Si demande permission navigateur: **Autoriser**
3. Observer TOUS les messages dans la console

### Etape 4: Copier Logs Complets
1. Faire clic-droit dans la console
2. Choisir "Save as..." ou copier tout le texte
3. M'envoyer les logs complets

## Ce que je cherche

### Scenario 1: Token Manquant
Si vous voyez:
```
[SUBSCRIBE] localStorage.auth_token est NULL
[SUBSCRIBE] ERREUR: Token auth manquant
```
**Probleme**: Le token n'est pas stocke apres login
**Solution**: Verifier le code de login

### Scenario 2: Token Present Mais 401
Si vous voyez:
```
[SUBSCRIBE] Token trouve, longueur: 250
[SUBSCRIBE] Fetching VAPID public key...
[AUTH-MIDDLEWARE] Authorization header: Bearer xxx...
[AUTH-MIDDLEWARE] Token verification result: INVALID
[SUBSCRIBE] ERREUR 401 AUTHENTICATION!
```
**Probleme**: Le token est expire ou invalide
**Solution**: Se reconnecter ou verifier JWT_SECRET

### Scenario 3: Token Present Et Valide Mais Erreur Apres
Si vous voyez:
```
[SUBSCRIBE] Token trouve, longueur: 250
[SUBSCRIBE] VAPID key recu, status: 200
[SUBSCRIBE] Browser subscription created
[SUBSCRIBE] Sending subscription to /api/push/subscribe...
[SUBSCRIBE] ERREUR 401 AUTHENTICATION!
```
**Probleme**: Le token fonctionne pour /vapid-public-key mais pas pour /subscribe
**Solution**: Verifier coherence auth middleware

### Scenario 4: Success!
Si vous voyez:
```
[SUBSCRIBE] SUCCESS! Push notifications activees
```
Et un alert "Abonnement push enregistre avec succes!"
**Probleme**: Aucun! Ca marche!
**Verification**: `SELECT COUNT(*) FROM push_subscriptions` doit retourner 1+

## Commandes Verification Backend

### Verifier Subscriptions
```bash
npx wrangler d1 execute webapp-production --command="SELECT COUNT(*) FROM push_subscriptions"
```

### Voir Dernieres Subscriptions
```bash
npx wrangler d1 execute webapp-production --command="SELECT id, user_id, device_type, created_at FROM push_subscriptions ORDER BY created_at DESC LIMIT 5"
```

### Tester Envoi Push
```bash
# Remplacer USER_ID par votre ID utilisateur
curl -X POST https://3d1e884b.webapp-7t8.pages.dev/api/push/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": [USER_ID],
    "title": "Test Push",
    "body": "Test notification",
    "icon": "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f514.png"
  }'
```

## Prochaines Etapes

Selon les resultats:

1. **Si token manquant**: Corriger le flux login
2. **Si token invalide**: Verifier JWT_SECRET et expiration
3. **Si erreur apres VAPID**: Debugger route /subscribe specifiquement
4. **Si success**: Tester envoi notifications reel

## Notes Techniques

### Architecture Auth
```
Frontend (push-notifications.js)
  ↓ Authorization: Bearer TOKEN
Backend (authMiddleware)
  ↓ extractToken()
  ↓ verifyToken()
  ↓ c.set('user', payload)
Route Handler (/api/push/*)
```

### Points Critiques
- Token stocke dans `localStorage.auth_token` ET `axios.defaults.headers.common['Authorization']`
- Middleware auth applique sur TOUS les `/api/push/*` routes
- JWT expire apres 7 jours
- Service worker doit etre actif AVANT subscription

## Contact
Si probleme persiste ou logs incomprehensibles, m'envoyer:
1. Screenshot console complete
2. Copie texte logs
3. URL exacte testee
4. Navigateur utilise (Chrome/Firefox/Safari/Edge)
