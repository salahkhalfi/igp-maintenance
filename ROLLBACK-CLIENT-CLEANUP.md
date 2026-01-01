# 🔄 ROLLBACK: Suppression src/client (2026-01-01)

## Contexte

**Date:** 2026-01-01  
**Commit avant suppression:** `c11cb97`  
**Branche backup:** `backup-before-client-cleanup-20260101`

## Ce qui a été supprimé

| Élément | Lignes | Raison |
|---------|--------|--------|
| `src/client/` | ~6000 lignes | Code mort, commenté dans home.ts depuis des mois |
| `vite.client.config.ts` | 32 lignes | Config orpheline |
| `src/views/messenger.ts` | 76 lignes | Ancienne version HTML, jamais importée |

## Ce qui a été modifié

| Fichier | Modification |
|---------|--------------|
| `package.json` | Retiré `build:client` du script `"build"` |
| `.github/workflows/deploy.yml` | Retiré step "Build Client" |

## Procédure de Rollback

### Option 1: Rollback complet (recommandé)

```bash
# Revenir au commit avant suppression
git checkout c11cb97

# OU utiliser la branche backup
git checkout backup-before-client-cleanup-20260101

# Si tu veux remettre main à cet état
git checkout main
git reset --hard c11cb97
git push --force origin main
```

### Option 2: Restaurer uniquement src/client/

```bash
# Restaurer src/client/ depuis le backup
git checkout backup-before-client-cleanup-20260101 -- src/client/

# Restaurer vite.client.config.ts
git checkout backup-before-client-cleanup-20260101 -- vite.client.config.ts

# Restaurer src/views/messenger.ts
git checkout backup-before-client-cleanup-20260101 -- src/views/messenger.ts
```

### Option 3: Restaurer package.json et workflow

```bash
# Restaurer package.json
git checkout backup-before-client-cleanup-20260101 -- package.json

# Restaurer GitHub Actions
git checkout backup-before-client-cleanup-20260101 -- .github/workflows/deploy.yml
```

## Vérification après Rollback

```bash
# Vérifier que src/client existe
ls -la src/client/

# Vérifier que le build fonctionne
npm run build:client

# Vérifier le workflow
cat .github/workflows/deploy.yml | grep "Build Client"
```

## Symptômes qui nécessitent un Rollback

- ❌ Erreur de build sur GitHub Actions
- ❌ Page /messenger ne charge plus
- ❌ Erreur 404 sur des assets
- ❌ Console errors mentionnant "client" ou "main.js"

## Confirmation que tout fonctionne (post-suppression)

Pour confirmer que la suppression n'a rien cassé :

1. **Build local:** `npm run build` doit réussir
2. **GitHub Actions:** Le deploy doit passer
3. **Dashboard:** https://[domain]/ doit fonctionner
4. **Messenger:** https://[domain]/messenger doit fonctionner
5. **Pas d'erreurs console** dans le navigateur

---

**Note:** Ce fichier peut être supprimé après 30 jours si aucun problème n'est détecté.
