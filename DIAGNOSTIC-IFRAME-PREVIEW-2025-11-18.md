# 🔍 Diagnostic - Application bloquée dans Preview GenSpark

**Date**: 2025-11-18 21:00 UTC  
**Problème**: L'application fonctionne dans une fenêtre séparée mais reste bloquée sur "Loading..." dans la preview iframe GenSpark  
**Screenshot**: https://share.salah.uk/i/RR8xbn

---

## ❌ **CAUSE RACINE IDENTIFIÉE**

### **Cookies HttpOnly bloqués dans les iframes cross-origin**

**Configuration actuelle** (`src/routes/auth.ts`, ligne 145-151):
```typescript
setCookie(c, 'auth_token', token, {
  httpOnly: true,                    // ✅ Sécurité XSS
  secure: true,                      // ✅ HTTPS seulement
  sameSite: 'Lax',                   // ❌ PROBLÈME: Bloqué dans iframes
  maxAge: expiresInSeconds,          
  path: '/'                          
});
```

**`sameSite: 'Lax'`** signifie :
- ✅ Cookie envoyé pour les navigations top-level (fenêtre normale)
- ❌ Cookie **bloqué** dans les iframes cross-origin (GenSpark preview)

---

## 🔄 **FLUX D'AUTHENTIFICATION ACTUEL**

### **Fenêtre Normale (Fonctionne)** ✅

```
1. Login → POST /api/auth/login
2. Backend: Set-Cookie: auth_token=xxx; SameSite=Lax
3. Frontend: localStorage.setItem('auth_token', token)
4. Frontend: axios.defaults.headers.common['Authorization'] = 'Bearer ' + token
5. Rechargement → authToken récupéré de localStorage
6. Requêtes API → Cookie + Authorization header envoyés
7. Backend: Authentification réussie ✅
```

### **Preview Iframe GenSpark (Bloqué)** ❌

```
1. Login → POST /api/auth/login
2. Backend: Set-Cookie: auth_token=xxx; SameSite=Lax
3. ⚠️ Navigateur BLOQUE le cookie (iframe cross-origin)
4. Frontend: localStorage.setItem('auth_token', token) ✅
5. Frontend: axios.defaults.headers.common['Authorization'] = 'Bearer ' + token ✅
6. Rechargement → authToken récupéré de localStorage ✅
7. Requêtes API → Authorization header envoyé, MAIS PAS de cookie ❌
8. Backend: authMiddleware vérifie le cookie en priorité
9. Si cookie absent → Vérifie Authorization header
10. ⚠️ MAIS axios.defaults.withCredentials = true force l'envoi de cookies
11. Navigateur refuse d'envoyer le cookie → Erreur CORS ou 401
12. App bloquée sur "Loading..." ❌
```

---

## 🔍 **VÉRIFICATION DU CODE BACKEND**

### Middleware d'Authentification (`src/middlewares/authMiddleware.ts`)

**Ordre de vérification** :
1. Cookie HttpOnly (`auth_token`)
2. Header Authorization (`Bearer token`)

**Code actuel** (ligne 11-40):
```typescript
export const authMiddleware: MiddlewareHandler = async (c, next) => {
  try {
    // 1. Vérifier cookie HttpOnly en priorité
    const cookieToken = getCookie(c, 'auth_token');
    
    // 2. Fallback sur Authorization header
    let token = cookieToken || c.req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return c.json({ error: 'Non authentifié' }, 401);
    }

    // Vérifier et décoder le token
    const payload = await verifyToken(token, c.env.JWT_SECRET);
    
    // Stocker l'utilisateur dans le contexte
    c.set('user', {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      isSuperAdmin: payload.isSuperAdmin
    });

    await next();
  } catch (error) {
    return c.json({ error: 'Token invalide ou expiré' }, 401);
  }
};
```

**Conclusion**: Le backend **supporte déjà** l'authentification par Authorization header ! Le problème est dans la configuration du frontend.

---

## 🔍 **VÉRIFICATION DU CODE FRONTEND**

### Configuration Axios (`src/index.tsx`, ligne 706):
```javascript
axios.defaults.withCredentials = true;
```

**Problème**: `withCredentials: true` force axios à :
1. Inclure les cookies dans les requêtes
2. Vérifier les headers CORS stricts
3. **Échouer si les cookies ne peuvent pas être envoyés** (iframe cross-origin)

### Initialisation du Token (`src/index.tsx`, ligne 698-710):
```javascript
let authToken = localStorage.getItem('auth_token');

axios.defaults.withCredentials = true;

if (authToken) {
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + authToken;
}
```

**Analyse**:
- ✅ Le token est récupéré de localStorage
- ✅ Le header Authorization est configuré
- ❌ MAIS `withCredentials: true` cause des problèmes CORS dans l'iframe

---

## ✅ **SOLUTIONS PROPOSÉES**

### **Solution 1: Désactiver `withCredentials` si dans iframe** (RECOMMANDÉ)

**Détection d'iframe**:
```javascript
const isInIframe = () => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

// Configuration conditionnelle
if (!isInIframe()) {
  axios.defaults.withCredentials = true;
}
```

**Avantages**:
- ✅ Fenêtre normale utilise les cookies HttpOnly (sécurité maximale)
- ✅ Iframe utilise uniquement Authorization header (fonctionne)
- ✅ Pas de changement backend nécessaire

**Inconvénient**:
- ⚠️ Dans l'iframe, pas de protection HttpOnly (mais GenSpark est un environnement de dev)

---

### **Solution 2: Changer `sameSite: 'Lax'` en `sameSite: 'None'`**

**Modification** (`src/routes/auth.ts`):
```typescript
setCookie(c, 'auth_token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'None',  // ← Permet cookies dans iframes
  maxAge: expiresInSeconds,
  path: '/'
});
```

**Avantages**:
- ✅ Cookies fonctionnent dans les iframes
- ✅ Pas de détection d'iframe nécessaire

**Inconvénients**:
- ⚠️ Réduit la protection CSRF
- ⚠️ Nécessite `secure: true` (HTTPS obligatoire)
- ⚠️ Peut ne pas fonctionner dans tous les navigateurs pour cross-origin

---

### **Solution 3: Ajouter endpoint `/api/auth/validate-token`** (HYBRIDE)

**Nouveau endpoint** pour valider le token localStorage :
```typescript
auth.get('/validate-token', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return c.json({ valid: false }, 401);
  }
  
  try {
    const payload = await verifyToken(token, c.env.JWT_SECRET);
    return c.json({ valid: true, user: payload });
  } catch (error) {
    return c.json({ valid: false }, 401);
  }
});
```

**Frontend** (initialisation):
```javascript
// Au chargement, valider le token localStorage
if (authToken && isInIframe()) {
  // Dans iframe: valider avec Authorization header seulement
  axios.get(API_URL + '/auth/validate-token')
    .then(response => {
      // Token valide
      setIsLoggedIn(true);
    })
    .catch(error => {
      // Token invalide
      localStorage.removeItem('auth_token');
      authToken = null;
    });
}
```

**Avantages**:
- ✅ Sécurité maximale (HttpOnly cookies en fenêtre normale)
- ✅ Fonctionne dans iframes (Authorization header)
- ✅ Validation explicite du token au chargement

---

## 🎯 **RECOMMANDATION FINALE**

### **Implémenter Solution 1 (Détection d'iframe)**

**Pourquoi** :
1. ✅ Changement minimal (frontend seulement)
2. ✅ Pas de régression pour les utilisateurs normaux
3. ✅ Fonctionne immédiatement dans GenSpark preview
4. ✅ Pas de compromis de sécurité en production

**Code à ajouter** (`src/index.tsx`, après ligne 697):
```javascript
const API_URL = '/api';

// Détection d'iframe pour configuration conditionnelle
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
})();

let authToken = localStorage.getItem('auth_token');
let currentUser = null;

// Variables globales pour titre et sous-titre personnalisés
let companyTitle = 'Gestion de la maintenance et des réparations';
let companySubtitle = 'Les Produits Verriers International (IGP) Inc.';

// ✅ Configure axios conditionally based on iframe context
if (!isInIframe) {
  // Fenêtre normale: utiliser cookies HttpOnly
  axios.defaults.withCredentials = true;
} else {
  // Iframe: utiliser uniquement Authorization header
  console.log('[AUTH] Running in iframe - using Authorization header only');
}

if (authToken) {
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + authToken;
}
```

---

## 🧪 **TEST APRÈS FIX**

### **Vérification dans Preview GenSpark**:
1. Ouvrir l'application dans la preview iframe
2. Se connecter avec identifiants valides
3. Vérifier que l'app charge correctement (pas de "Loading..." infini)
4. Rafraîchir la page
5. Vérifier que la session persiste

### **Vérification en Fenêtre Normale**:
1. Ouvrir l'application dans une nouvelle fenêtre
2. Se connecter
3. Vérifier que le cookie HttpOnly est présent (DevTools → Application → Cookies)
4. Vérifier que les requêtes incluent le cookie

---

## 📝 **NOTES TECHNIQUES**

### **Pourquoi `withCredentials: true` cause des problèmes ?**

Quand `axios.defaults.withCredentials = true` :
- Le navigateur essaie d'inclure les cookies dans chaque requête
- Dans un contexte iframe cross-origin, le navigateur **bloque** les cookies avec `sameSite: 'Lax'`
- Axios détecte que les cookies ne peuvent pas être envoyés
- La requête **échoue** avec une erreur CORS ou est envoyée sans credentials
- Le backend répond 401 (car ni cookie ni Authorization header valide)

### **Pourquoi Authorization header seul fonctionne ?**

- Le header Authorization **n'est pas affecté** par les restrictions de cookies
- Il fonctionne dans **tous les contextes** (fenêtre, iframe, cross-origin)
- Le backend vérifie le header en fallback si le cookie est absent

---

## 🔒 **IMPACT SÉCURITÉ**

### **Fenêtre Normale** (Production):
- ✅ HttpOnly cookies (protection XSS maximale)
- ✅ `withCredentials: true` (sécurité CORS)
- ✅ Aucun changement de comportement

### **Iframe Preview** (Développement):
- ⚠️ Pas de HttpOnly cookie (token dans localStorage)
- ⚠️ Vulnérable à XSS dans le contexte iframe
- ✅ Acceptable pour environnement de développement GenSpark
- ✅ Production non affectée

---

## 💡 **CONCLUSION**

**Problème**: `sameSite: 'Lax'` + `withCredentials: true` = Cookies bloqués dans iframe

**Solution**: Détection d'iframe + désactivation conditionnelle de `withCredentials`

**Impact**: Frontend seulement, pas de changement backend, pas de régression

**Temps d'implémentation**: 5 minutes

**Voulez-vous que j'implémente le fix maintenant ?**
