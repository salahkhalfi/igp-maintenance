# 🔧 QUICK FIXES - Actions Immédiates

Ce document liste les corrections prioritaires identifiées lors de l'audit de code.

---

## 🔴 PRIORITÉ HAUTE - À faire maintenant (< 1h)

### 1. ✅ Retirer console.log de debug en production (5 min)

**Fichier:** `src/index.tsx`

**Lignes à modifier:**
- Ligne 351: `console.log('DEBUG audio route - fullPath:', fullPath);`
- Ligne 352: `console.log('DEBUG audio route - fileKey:', fileKey);`
- Ligne 361: `console.log('DEBUG audio route - message found:', !!message);`
- Ligne 1424: `console.log('UserGuideModal render - activeSection:', activeSection, 'currentUser:', currentUser);`

**Action:**
```typescript
// AVANT (ligne 351-352)
console.log('DEBUG audio route - fullPath:', fullPath);
console.log('DEBUG audio route - fileKey:', fileKey);

// APRÈS - Commenter ou retirer
// console.log('DEBUG audio route - fullPath:', fullPath);
// console.log('DEBUG audio route - fileKey:', fileKey);
```

---

### 2. ✅ Standardiser clé localStorage pour token (10 min)

**Problème:** Deux clés utilisées (`auth_token` et `token`)

**Fichier:** `src/index.tsx`

**Ligne à corriger:** 5071

**Action:**
```typescript
// AVANT (ligne 5071)
localStorage.setItem('token', token); // Dupliquer pour compatibilité

// APRÈS - Retirer cette ligne
// La clé 'auth_token' est déjà utilisée partout ailleurs
```

---

### 3. ⚠️ Corriger variable globale currentUser (15 min)

**Problème:** `currentUser` est une variable globale mutée, pas un état React

**Fichier:** `src/index.tsx`

**Lignes concernées:** 1101, 5445, 5471, 5483-5484

**Action:**
```typescript
// AVANT - Variable globale (ligne 1101)
let currentUser = null;
// ...
currentUser = userRes.data.user; // Mutation directe

// APRÈS - État React
const [currentUser, setCurrentUser] = React.useState(null);
// ...
setCurrentUser(userRes.data.user); // Utiliser setter
```

**Modifications nécessaires:**
- Ajouter `useState` pour currentUser dans composant App
- Remplacer toutes les mutations `currentUser = ...` par `setCurrentUser(...)`
- Passer currentUser comme prop aux composants enfants

---

## 🟡 PRIORITÉ MOYENNE - Planifier (2-4h)

### 4. 🔒 Sécuriser les messages audio privés (2-3h)

**Problème:** TODO ligne 367 - Messages audio privés accessibles sans authentification

**Fichier:** `src/index.tsx`

**Ligne:** 367

**Action recommandée:**

**Option A: Signed URLs (préféré)**
```typescript
// Backend - Générer signed URL
app.post('/api/messages/audio/sign', authMiddleware, async (c) => {
  const { audioKey } = await c.req.json();
  const user = c.get('user');
  
  // Vérifier que l'utilisateur peut accéder à ce message
  const message = await c.env.DB.prepare(`
    SELECT sender_id, recipient_id, message_type
    FROM messages WHERE audio_file_key = ?
  `).bind(audioKey).first();
  
  if (!message) return c.json({ error: 'Not found' }, 404);
  
  // Vérifier permission
  const canAccess = message.message_type === 'public' ||
                    message.sender_id === user.userId ||
                    message.recipient_id === user.userId;
  
  if (!canAccess) return c.json({ error: 'Forbidden' }, 403);
  
  // Générer token temporaire
  const token = await generateSignedToken(audioKey, 300); // 5 min
  
  return c.json({ 
    signedUrl: `/api/audio/${audioKey}?token=${token}`,
    expiresIn: 300
  });
});

// Modifier GET /api/audio/* pour vérifier token
app.get('/api/audio/*', async (c) => {
  const token = c.req.query('token');
  const fileKey = c.req.path.replace('/api/audio/', '');
  
  // Vérifier token
  if (!token || !await verifySignedToken(token, fileKey)) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  
  // ... reste du code
});
```

**Option B: Token dans query params (plus simple)**
```typescript
// Frontend - Inclure token dans URL audio
const audioUrl = `/api/audio/${audioKey}?token=${authToken}`;

// Backend - Vérifier token dans query
app.get('/api/audio/*', async (c) => {
  const token = c.req.query('token');
  if (!token) return c.json({ error: 'Token required' }, 401);
  
  // Vérifier JWT
  const decoded = await verifyJWT(token);
  if (!decoded) return c.json({ error: 'Invalid token' }, 401);
  
  // Vérifier permission sur message
  // ... reste du code
});
```

---

### 5. 🧹 Créer wrapper axios pour réduire duplication (1-2h)

**Problème:** 55 appels axios avec pattern dupliqué

**Nouveau fichier:** `src/utils/api.ts`

```typescript
import axios, { AxiosRequestConfig } from 'axios';

const API_URL = 'https://app.igpglass.ca/api';

// Intercepteur pour ajouter token automatiquement
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer erreurs 401
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Wrappers avec gestion d'erreurs
export const apiGet = async <T = any>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await axios.get(`${API_URL}${endpoint}`, config);
    return response.data;
  } catch (error) {
    console.error(`API GET ${endpoint} error:`, error);
    throw error;
  }
};

export const apiPost = async <T = any>(
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await axios.post(`${API_URL}${endpoint}`, data, config);
    return response.data;
  } catch (error) {
    console.error(`API POST ${endpoint} error:`, error);
    throw error;
  }
};

export const apiPut = async <T = any>(
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await axios.put(`${API_URL}${endpoint}`, data, config);
    return response.data;
  } catch (error) {
    console.error(`API PUT ${endpoint} error:`, error);
    throw error;
  }
};

export const apiDelete = async <T = any>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await axios.delete(`${API_URL}${endpoint}`, config);
    return response.data;
  } catch (error) {
    console.error(`API DELETE ${endpoint} error:`, error);
    throw error;
  }
};
```

**Utilisation:**
```typescript
// AVANT
try {
  const response = await axios.get(API_URL + '/tickets');
  setTickets(response.data.tickets);
} catch (error) {
  console.error('Erreur chargement tickets:', error);
}

// APRÈS
try {
  const data = await apiGet('/tickets');
  setTickets(data.tickets);
} catch (error) {
  // Erreur déjà loggée par wrapper
  alert('Erreur chargement tickets');
}
```

---

### 6. 📄 Ajouter pagination aux messages/tickets (2-3h)

**Backend - Example pour messages publics:**

**Fichier:** `src/index.tsx` ligne 393

```typescript
// AVANT
app.get('/api/messages/public', authMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT ... FROM messages ...
    ORDER BY created_at DESC
  `).all();
  return c.json({ messages: results });
});

// APRÈS
app.get('/api/messages/public', authMiddleware, async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = (page - 1) * limit;
  
  const { results } = await c.env.DB.prepare(`
    SELECT ... FROM messages ...
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();
  
  const { count } = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM messages
    WHERE message_type = 'public'
  `).first();
  
  return c.json({ 
    messages: results,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
});
```

**Frontend - Ajouter pagination UI:**
```typescript
const [currentPage, setCurrentPage] = React.useState(1);

const loadMessages = async () => {
  const data = await apiGet(`/messages/public?page=${currentPage}&limit=50`);
  setMessages(data.messages);
  setPagination(data.pagination);
};

// Boutons pagination
<div className="flex justify-center gap-2 mt-4">
  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
    Précédent
  </button>
  <span>Page {currentPage} / {pagination.totalPages}</span>
  <button onClick={() => setCurrentPage(p => p + 1)}>
    Suivant
  </button>
</div>
```

---

## 🟢 PRIORITÉ BASSE - Amélioration continue

### 7. 📝 Ajouter tests unitaires (1 jour)

**Fichiers à tester en priorité:**
- `src/utils/permissions.ts` (logique RBAC critique)
- `src/utils/validation.ts` (validation entrées)
- `src/utils/jwt.ts` (sécurité tokens)

**Installation:**
```bash
npm install -D vitest @vitest/ui
```

**Exemple test:** `src/utils/permissions.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { hasPermission } from './permissions';

describe('hasPermission', () => {
  it('admin should have all permissions', async () => {
    const result = await hasPermission(mockDB, 'admin', 'tickets', 'delete', 'all');
    expect(result).toBe(true);
  });
  
  it('operator should not delete other users tickets', async () => {
    const result = await hasPermission(mockDB, 'operator', 'tickets', 'delete', 'all');
    expect(result).toBe(false);
  });
});
```

---

### 8. 🏗️ Refactoriser architecture (4-6h)

Voir section "ARCHITECTURE" du rapport d'audit principal pour plan complet.

**Étapes:**
1. Créer dossier `src/frontend/`
2. Extraire composants React dans fichiers séparés
3. Garder seulement routes Hono dans `src/index.tsx`
4. Créer point d'entrée frontend séparé

---

## ✅ CHECKLIST D'EXÉCUTION

- [ ] Fix 1: Retirer console.log debug (5 min)
- [ ] Fix 2: Standardiser localStorage token (10 min)
- [ ] Fix 3: Corriger currentUser global → state (15 min)
- [ ] Build + commit + deploy (5 min)
- [ ] Fix 4: Sécuriser audio privés (2-3h)
- [ ] Fix 5: Créer wrapper axios (1-2h)
- [ ] Fix 6: Ajouter pagination (2-3h)
- [ ] Fix 7: Tests unitaires (1 jour)
- [ ] Fix 8: Refactorisation architecture (4-6h)

---

**Total temps estimé:**
- Haute priorité: 30 min
- Moyenne priorité: 5-8h
- Basse priorité: 1-2 jours

**Recommandation:** Commencer par les 3 fixes haute priorité (30 min) et déployer immédiatement.
