# 🔓 Mise à jour des Permissions - Paramètres Système

**Date**: 2025-11-12  
**Commit**: c692a1d

## 📋 Changement Effectué

Les permissions pour modifier le **logo**, **titre** et **sous-titre** de l'application ont été **étendues** de "Super Admin uniquement" à "Tous les administrateurs".

---

## 🔄 Avant vs Après

### ❌ **AVANT** (Super Admin uniquement)

| Fonctionnalité | Accès | Utilisateurs Autorisés |
|----------------|-------|------------------------|
| Modifier le titre | 🔐 Super Admin | Salah Khalfi uniquement |
| Modifier le sous-titre | 🔐 Super Admin | Salah Khalfi uniquement |
| Uploader un logo | 🔐 Super Admin | Salah Khalfi uniquement |
| Supprimer le logo | 🔐 Super Admin | Salah Khalfi uniquement |

### ✅ **APRÈS** (Tous les admins)

| Fonctionnalité | Accès | Utilisateurs Autorisés |
|----------------|-------|------------------------|
| Modifier le titre | 🔧 Admin | **Salah Khalfi, Marc Bélanger, Administrateur IGP** |
| Modifier le sous-titre | 🔧 Admin | **Salah Khalfi, Marc Bélanger, Administrateur IGP** |
| Uploader un logo | 🔧 Admin | **Salah Khalfi, Marc Bélanger, Administrateur IGP** |
| Supprimer le logo | 🔧 Admin | **Salah Khalfi, Marc Bélanger, Administrateur IGP** |

---

## 🛠️ Modifications Techniques

### Fichier modifié: `src/routes/settings.ts`

**4 routes mises à jour:**

1. **POST `/api/settings/upload-logo`**
   - Ancien: `authMiddleware` + vérification `is_super_admin === 1`
   - Nouveau: `authMiddleware` + `adminOnly` middleware

2. **DELETE `/api/settings/logo`**
   - Ancien: `authMiddleware` + vérification `is_super_admin === 1`
   - Nouveau: `authMiddleware` + `adminOnly` middleware

3. **PUT `/api/settings/title`**
   - Ancien: `authMiddleware` + vérification `is_super_admin === 1`
   - Nouveau: `authMiddleware` + `adminOnly` middleware

4. **PUT `/api/settings/subtitle`**
   - Ancien: `authMiddleware` + vérification `is_super_admin === 1`
   - Nouveau: `authMiddleware` + `adminOnly` middleware

**Code supprimé** (37 lignes - 4x répétition):
```typescript
// PROTECTION: Seul le super admin peut changer le logo/titre/sous-titre
const userInfo = await c.env.DB.prepare(`
  SELECT is_super_admin FROM users WHERE id = ?
`).bind(user.userId).first() as any;

if (!userInfo || userInfo.is_super_admin !== 1) {
  return c.json({ error: 'Action réservée au super administrateur' }, 403);
}
```

**Code ajouté** (1x par route):
```typescript
settings.post('/upload-logo', authMiddleware, adminOnly, async (c) => {
  // Le middleware adminOnly vérifie automatiquement user.role === 'admin'
```

---

## ✅ Tests Effectués

### Test 1: Admin Standard peut modifier
```bash
# Connexion avec admin@igpglass.ca
✅ Modification du titre: SUCCÈS
✅ Modification du sous-titre: SUCCÈS
```

### Test 2: Technicien ne peut PAS modifier
```bash
# Connexion avec technicien@igpglass.ca
❌ Tentative modification titre: REJETÉ
   Erreur: "Accès réservé aux administrateurs"
```

---

## 🎯 Impact en Production

### Administrateurs en Production (après déploiement):

| ID | Nom | Email | Rôle | Peut modifier logo/titre/sous-titre |
|----|-----|-------|------|-------------------------------------|
| 5 | Salah Khalfi | salah@khalfi.com | Admin ⭐ Super | ✅ OUI |
| 1 | Administrateur IGP | admin@igpglass.ca | Admin | ✅ OUI |
| 5 | Marc Bélanger | mbelanger@igpglass.com | Admin | ✅ OUI |

---

## 📊 Matrice des Permissions Complète

| Fonctionnalité | Opérateur | Technicien | Superviseur | Admin | Super Admin |
|----------------|-----------|------------|-------------|-------|-------------|
| **Voir titre/sous-titre** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Modifier titre/sous-titre** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Upload logo** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Supprimer logo** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Modifier fuseau horaire** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Gérer utilisateurs** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Gérer tickets** | Voir | ✅ | ✅ | ✅ | ✅ |
| **Gérer machines** | ❌ | ✅ | ✅ | ✅ | ✅ |

---

## 🚀 Déploiement

### Environnement Local ✅
- Build réussi: `npm run build`
- Service redémarré: `pm2 restart webapp`
- Tests passés: ✅

### Environnement Production ⏳
Pour déployer ces changements en production:

```bash
# 1. Build le projet
npm run build

# 2. Déployer sur Cloudflare Pages
npx wrangler pages deploy dist --project-name webapp

# 3. Vérifier le déploiement
curl https://webapp.pages.dev
```

---

## 📝 Notes Importantes

1. **Pas de changement dans la DB** - Aucune migration nécessaire
2. **Compatibilité totale** - Salah Khalfi conserve tous ses accès
3. **Sécurité maintenue** - Techniciens/Opérateurs/Superviseurs toujours bloqués
4. **Code plus simple** - Utilisation du middleware `adminOnly` existant
5. **Plus flexible** - Facilite la délégation des tâches administratives

---

## 🔍 Justification du Changement

**Demandé par**: Utilisateur  
**Raison**: Permettre à Marc Bélanger et aux autres admins de personnaliser l'identité de l'application sans dépendre du Super Admin

**Avantages**:
- ✅ Plus d'autonomie pour les admins
- ✅ Meilleure répartition des responsabilités
- ✅ Code plus maintenable (moins de duplication)
- ✅ Utilisation des middlewares existants

**Risques**: 
- ⚠️ Plusieurs admins peuvent modifier simultanément → Bonne communication requise
- ✅ Mitigé par: Interface utilisateur avec feedback en temps réel

---

## 📞 Contact

Pour toute question concernant cette mise à jour, contactez l'équipe de développement.

**Documentation mise à jour**: 2025-11-12
