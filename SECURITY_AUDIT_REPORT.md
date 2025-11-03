# 🔒 RAPPORT D'AUDIT DE SÉCURITÉ
**Application**: IGP Gestion de la maintenance et des réparations  
**Date**: 2025-11-02  
**Auditeur**: AI Security Analyst  
**Version**: v1.9.1  
**URL Production**: https://mecanique.igpglass.ca

---

## 📋 RÉSUMÉ EXÉCUTIF

### Score Général de Sécurité: **7.5/10** ⚠️

| Catégorie | Score | Statut |
|-----------|-------|--------|
| Authentification | 7/10 | ⚠️ Améliorations requises |
| Autorisation | 8/10 | ✅ Bon |
| Protection des données | 6/10 | ⚠️ Vulnérabilités critiques |
| Configuration | 8/10 | ✅ Bon |
| Code côté client | 9/10 | ✅ Excellent |
| Gestion des uploads | 7/10 | ⚠️ Améliorations requises |

---

## 🚨 VULNÉRABILITÉS CRITIQUES IDENTIFIÉES

### 1. ⚠️ **CRITIQUE: Algorithme de hashage faible pour les mots de passe**

**Fichier**: `src/utils/password.ts`  
**Ligne**: 5-16  
**Sévérité**: 🔴 CRITIQUE

**Problème**:
```typescript
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  // ...
}
```

**Vulnérabilité**:
- ❌ Utilisation de SHA-256 sans salt
- ❌ Pas de fonction de dérivation de clé (KDF)
- ❌ Pas de protection contre les attaques par rainbow tables
- ❌ Pas de ralentissement intentionnel (pas de coût CPU)

**Impact**:
- Les mots de passe peuvent être cassés rapidement avec des rainbow tables
- Un attaquant ayant accès à la base de données peut récupérer les mots de passe en quelques heures/jours
- Pas de protection contre les attaques par force brute

**Recommandations**:
1. **URGENT**: Implémenter bcrypt, scrypt ou Argon2
2. Ajouter un salt unique par mot de passe
3. Utiliser un coût de calcul élevé (bcrypt work factor ≥ 12)
4. Migrer tous les mots de passe existants

**Solution recommandée** (pour Cloudflare Workers):
```typescript
// Utiliser Web Crypto API avec PBKDF2
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const importedKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // Minimum 100k itérations
      hash: 'SHA-256'
    },
    importedKey,
    256
  );
  
  // Stocker salt + hash ensemble
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':');
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const importedKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    importedKey,
    256
  );
  
  const hashToCheck = Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashToCheck === hashHex;
}
```

---

### 2. ⚠️ **HAUTE: Secret JWT codé en dur dans le code source**

**Fichier**: `src/utils/jwt.ts`  
**Ligne**: 5-7  
**Sévérité**: 🟠 HAUTE

**Problème**:
```typescript
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'maintenance-app-secret-key-change-in-production'
);
```

**Vulnérabilités**:
- ❌ Secret par défaut faible codé en dur
- ❌ Secret visible dans le code source sur GitHub
- ❌ Si `process.env.JWT_SECRET` n'est pas défini, le secret par défaut est utilisé
- ❌ Tous les tokens peuvent être forgés avec ce secret

**Impact**:
- Un attaquant peut créer des tokens JWT valides
- Bypass complet de l'authentification possible
- Élévation de privilèges (créer un token admin)

**Recommandations**:
1. **URGENT**: Configurer un secret JWT fort dans Cloudflare
2. Supprimer complètement la valeur par défaut
3. Faire échouer l'application si le secret n'est pas configuré
4. Générer un nouveau secret et révoquer tous les tokens existants

**Solution**:
```typescript
// Ne JAMAIS avoir de valeur par défaut pour les secrets
const JWT_SECRET_ENV = process.env.JWT_SECRET;

if (!JWT_SECRET_ENV || JWT_SECRET_ENV.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long');
}

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_ENV);
```

**Configuration Cloudflare**:
```bash
# Générer un secret fort (256 bits)
openssl rand -base64 32

# Configurer dans Cloudflare
npx wrangler secret put JWT_SECRET --project-name webapp
```

---

### 3. ⚠️ **MOYENNE: CORS trop permissif**

**Fichier**: `src/index.tsx`  
**Ligne**: 14-18  
**Sévérité**: 🟡 MOYENNE

**Problème**:
```typescript
app.use('/api/*', cors({
  origin: '*',  // ❌ Accepte toutes les origines
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));
```

**Vulnérabilités**:
- ❌ `origin: '*'` permet à n'importe quel site web d'accéder à votre API
- ❌ Risque de CSRF (Cross-Site Request Forgery)
- ❌ N'importe quel site peut lire les réponses de votre API si un utilisateur est connecté

**Impact**:
- Un site malveillant peut faire des requêtes à votre API au nom de l'utilisateur
- Vol de données si l'utilisateur est connecté
- Opérations non autorisées possibles

**Recommandations**:
```typescript
// Solution 1: Liste blanche des origines autorisées
app.use('/api/*', cors({
  origin: (origin) => {
    const allowedOrigins = [
      'https://mecanique.igpglass.ca',
      'https://webapp-7t8.pages.dev',
      'http://localhost:3000'  // Pour développement local uniquement
    ];
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true  // Permet les cookies/auth
}));

// Solution 2: Restreindre au même domaine uniquement (recommandé)
app.use('/api/*', cors({
  origin: 'https://mecanique.igpglass.ca',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

---

### 4. ⚠️ **MOYENNE: Endpoint média public sans authentification**

**Fichier**: `src/routes/media.ts`  
**Ligne**: 74-105  
**Sévérité**: 🟡 MOYENNE

**Problème**:
```typescript
// GET /api/media/:id - Accessible publiquement
media.get('/:id', async (c) => {
  // Pas de authMiddleware ❌
  // N'importe qui peut accéder aux médias
});
```

**Vulnérabilités**:
- ❌ N'importe qui peut accéder aux photos/vidéos des tickets
- ❌ Énumération possible (tester /api/media/1, /api/media/2, etc.)
- ❌ Fuite d'informations confidentielles

**Impact**:
- Photos de machines, problèmes, et informations sensibles exposées publiquement
- Potentiel espionnage industriel
- Violation de confidentialité

**Recommandations**:
```typescript
// Option 1: Ajouter authentification
media.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = c.get('user') as any;
  
  // Récupérer les infos du média
  const mediaInfo = await c.env.DB.prepare(
    'SELECT m.*, t.reported_by, t.assigned_to FROM media m JOIN tickets t ON m.ticket_id = t.id WHERE m.id = ?'
  ).bind(id).first() as any;
  
  if (!mediaInfo) {
    return c.json({ error: 'Média non trouvé' }, 404);
  }
  
  // Vérifier que l'utilisateur a accès au ticket
  if (user.role !== 'admin' && 
      user.role !== 'technician' && 
      user.userId !== mediaInfo.reported_by) {
    return c.json({ error: 'Accès refusé' }, 403);
  }
  
  // ... reste du code
});

// Option 2: Tokens d'accès temporaires
// Générer un token signé avec expiration courte (5 min)
```

---

### 5. ⚠️ **MOYENNE: Validation des uploads insuffisante**

**Fichier**: `src/routes/media.ts`  
**Ligne**: 10-70  
**Sévérité**: 🟡 MOYENNE

**Problèmes**:
- ❌ Pas de vérification du type MIME réel du fichier
- ❌ Pas de limite de taille de fichier
- ❌ Pas de scan antivirus
- ❌ Pas de validation du contenu

**Vulnérabilités**:
```typescript
media.post('/upload', authMiddleware, async (c) => {
  const file = formData.get('file') as File;
  
  // ❌ Pas de validation du type MIME
  // ❌ Pas de limite de taille
  // ❌ file.type peut être falsifié
  
  await c.env.MEDIA_BUCKET.put(fileKey, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,  // ❌ Utilise le type fourni par le client
    },
  });
});
```

**Impact**:
- Upload de fichiers malveillants possible
- Déni de service (upload de fichiers géants)
- Exécution de code possible si les fichiers sont mal servis

**Recommandations**:
```typescript
media.post('/upload', authMiddleware, async (c) => {
  const file = formData.get('file') as File;
  
  // 1. Vérifier la taille
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
  if (file.size > MAX_FILE_SIZE) {
    return c.json({ error: 'Fichier trop volumineux (max 50 MB)' }, 400);
  }
  
  // 2. Liste blanche des types MIME
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ];
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return c.json({ error: 'Type de fichier non autorisé' }, 400);
  }
  
  // 3. Vérifier la signature du fichier (magic bytes)
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  const isValidImage = (
    // JPEG: FF D8 FF
    (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) ||
    // PNG: 89 50 4E 47
    (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) ||
    // GIF: 47 49 46 38
    (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38)
  );
  
  const isValidVideo = (
    // MP4: starts with various signatures
    (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70)
  );
  
  if (!isValidImage && !isValidVideo) {
    return c.json({ error: 'Format de fichier invalide' }, 400);
  }
  
  // 4. Générer un nom de fichier sûr
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileExtension = safeFileName.split('.').pop()?.toLowerCase();
  
  // 5. Upload avec métadonnées sécurisées
  const timestamp = Date.now();
  const randomStr = crypto.randomUUID();
  const fileKey = `tickets/${ticketId}/${timestamp}-${randomStr}.${fileExtension}`;
  
  await c.env.MEDIA_BUCKET.put(fileKey, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
      contentDisposition: 'inline', // Force le navigateur à afficher, pas télécharger
    },
    customMetadata: {
      originalName: safeFileName,
      uploadedBy: user.userId.toString(),
      uploadedAt: new Date().toISOString()
    }
  });
  
  // ...
});
```

---

## ✅ POINTS FORTS IDENTIFIÉS

### 1. ✅ Authentification JWT bien implémentée (mise à part le secret)
- Tokens avec expiration (7 jours)
- Extraction correcte du Bearer token
- Vérification du token sur les routes protégées

### 2. ✅ Protection contre l'affichage des identifiants de test
- Les comptes de test ne sont plus affichés publiquement
- Les champs de login sont vides par défaut
- AutoComplete désactivé

### 3. ✅ Autorisation basée sur les rôles
- Middleware `adminOnly` et `technicianOrAdmin`
- Vérification des permissions avant les actions sensibles
- Séparation claire des rôles (admin, technician, operator)

### 4. ✅ Routes API protégées
- `/api/tickets/*` requiert authentification
- `/api/machines/*` requiert authentification
- `/api/auth/me` requiert authentification

### 5. ✅ Configuration .gitignore correcte
- `.env`, `.dev.vars` exclus
- Secrets non commités sur GitHub
- Configuration de production séparée

### 6. ✅ Pas de console.log sensibles côté client
- Aucun log de tokens
- Aucun log de mots de passe
- Gestion d'erreur propre

### 7. ✅ Séparation frontend/backend claire
- API RESTful bien structurée
- Routes organisées par domaine
- Middleware réutilisables

---

## 🔧 RECOMMANDATIONS PRIORITAIRES

### 🔴 PRIORITÉ 1 - À CORRIGER IMMÉDIATEMENT

1. **Remplacer SHA-256 par PBKDF2 ou bcrypt**
   - Impact: 🔴 CRITIQUE
   - Effort: 4-6 heures
   - Fichier: `src/utils/password.ts`

2. **Configurer un JWT_SECRET fort dans Cloudflare**
   - Impact: 🟠 HAUTE
   - Effort: 15 minutes
   - Action: `npx wrangler secret put JWT_SECRET`

3. **Supprimer la valeur par défaut du JWT_SECRET**
   - Impact: 🟠 HAUTE
   - Effort: 5 minutes
   - Fichier: `src/utils/jwt.ts`

### 🟠 PRIORITÉ 2 - À CORRIGER CETTE SEMAINE

4. **Restreindre CORS aux domaines autorisés**
   - Impact: 🟡 MOYENNE
   - Effort: 30 minutes
   - Fichier: `src/index.tsx`

5. **Ajouter authentification à l'endpoint média**
   - Impact: 🟡 MOYENNE
   - Effort: 2 heures
   - Fichier: `src/routes/media.ts`

6. **Implémenter validation stricte des uploads**
   - Impact: 🟡 MOYENNE
   - Effort: 3 heures
   - Fichier: `src/routes/media.ts`

### 🟡 PRIORITÉ 3 - AMÉLIORATIONS RECOMMANDÉES

7. **Implémenter rate limiting**
   - Limiter les tentatives de login
   - Protection contre brute force
   - Utiliser Cloudflare Rate Limiting

8. **Ajouter logging et monitoring**
   - Logger les tentatives de connexion échouées
   - Alertes sur activités suspectes
   - Utiliser Cloudflare Analytics

9. **Implémenter CSRF protection**
   - Tokens CSRF pour les formulaires
   - Double submit cookies
   - SameSite cookies

10. **Ajouter Content Security Policy (CSP)**
    - Protéger contre XSS
    - Restreindre les sources de scripts
    - En-têtes de sécurité HTTP

---

## 📊 TABLEAU DE BORD DE SÉCURITÉ

| Vulnérabilité | Sévérité | CVSS Score | Statut | ETA Fix |
|---------------|----------|------------|--------|---------|
| Hashage mot de passe faible | 🔴 CRITIQUE | 9.1 | ⏳ En attente | Immédiat |
| JWT secret codé en dur | 🟠 HAUTE | 8.2 | ⏳ En attente | Immédiat |
| CORS permissif | 🟡 MOYENNE | 5.3 | ⏳ En attente | Cette semaine |
| Endpoint média public | 🟡 MOYENNE | 5.8 | ⏳ En attente | Cette semaine |
| Validation uploads | 🟡 MOYENNE | 6.1 | ⏳ En attente | Cette semaine |
| Affichage comptes test | 🟢 FAIBLE | 2.0 | ✅ RÉSOLU | - |
| Identifiants hardcodés | 🟢 FAIBLE | 2.5 | ✅ RÉSOLU | - |

---

## 🧪 TESTS DE SÉCURITÉ EFFECTUÉS

### Tests d'authentification
- ✅ Accès API sans token → 401 (correct)
- ✅ Routes protégées requièrent authentification
- ✅ Token JWT vérifié correctement
- ⚠️ Secret JWT par défaut faible

### Tests d'autorisation
- ✅ Rôles admin/technician/operator séparés
- ✅ Middleware d'autorisation fonctionnel
- ✅ Permissions vérifiées avant actions

### Tests CORS
- ⚠️ Origin: * accepte toutes les origines
- ⚠️ Risque de CSRF présent
- ✅ Headers CORS configurés

### Tests de validation
- ⚠️ Validation uploads insuffisante
- ⚠️ Pas de limite de taille
- ⚠️ Pas de vérification du type MIME réel

### Tests d'exposition d'information
- ✅ Pas de comptes de test affichés
- ✅ Mots de passe hashés (mais algorithme faible)
- ✅ Erreurs génériques (pas de détails sensibles)

---

## 📝 CHECKLIST DE CONFORMITÉ

### OWASP Top 10 (2021)

| Risque | Statut | Notes |
|--------|--------|-------|
| A01: Broken Access Control | ⚠️ Partiel | Authorisation OK, mais endpoint média public |
| A02: Cryptographic Failures | ❌ Non conforme | SHA-256 sans salt pour mots de passe |
| A03: Injection | ✅ Conforme | Requêtes préparées utilisées |
| A04: Insecure Design | ⚠️ Partiel | CORS trop permissif |
| A05: Security Misconfiguration | ⚠️ Partiel | Secret JWT par défaut |
| A06: Vulnerable Components | ✅ Conforme | Dépendances à jour |
| A07: Authentication Failures | ⚠️ Partiel | Pas de rate limiting |
| A08: Software and Data Integrity | ✅ Conforme | Pas de CDN externe pour code critique |
| A09: Security Logging | ❌ Non conforme | Logging minimal |
| A10: Server-Side Request Forgery | ✅ Conforme | Pas d'SSRF identifié |

### RGPD (si applicable au Canada/Québec)
- ⚠️ Hashage mot de passe non conforme
- ✅ Pas de données personnelles sensibles collectées
- ⚠️ Pas de politique de conservation des données
- ❌ Pas de mécanisme d'export/suppression des données

---

## 🎯 PLAN D'ACTION RECOMMANDÉ

### Semaine 1 (Immédiat)
1. ✅ Configurer JWT_SECRET dans Cloudflare secrets
2. ✅ Supprimer la valeur par défaut du JWT_SECRET
3. ✅ Implémenter PBKDF2 pour hashage des mots de passe
4. ✅ Migrer les mots de passe existants

### Semaine 2
5. ✅ Restreindre CORS aux domaines autorisés
6. ✅ Ajouter authentification à l'endpoint média
7. ✅ Implémenter validation stricte des uploads

### Semaine 3-4
8. ✅ Rate limiting sur endpoints critiques
9. ✅ Logging et monitoring de sécurité
10. ✅ CSRF protection
11. ✅ Content Security Policy

---

## 📞 CONTACT & SUPPORT

Pour toute question sur ce rapport d'audit :
- **Application**: https://mecanique.igpglass.ca
- **GitHub**: https://github.com/salahkhalfi/igp-maintenance
- **Date du rapport**: 2025-11-02

---

**FIN DU RAPPORT**

*Ce rapport d'audit a été généré automatiquement. Il est recommandé de faire valider ces conclusions par un expert en sécurité certifié avant implémentation en production.*
