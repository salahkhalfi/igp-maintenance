# 🚀 Déploiement Correctif v2.9.17

**Date :** 27/11/2025  
**Version :** v2.9.17  
**Type :** Fix Bug (Affichage Noms Messagerie)  
**Statut :** ✅ PRODUCTION ACTIVE

---

## 🛠️ Correction Appliquée

### ⚠️ Problème Signalé
- Dans la messagerie privée, la liste des utilisateurs affichait `undefined (Admin)`, `undefined (Technicien)`, etc.
- Les prénoms/noms étaient manquants.

### 🔍 Cause Technique
- Le frontend (`src/index.tsx`) attendait la propriété `user.full_name`.
- L'API (`GET /api/messages/available-users`) ne retournait que `first_name`, `role`, `email`. Le champ `full_name` était absent de la requête SQL.

### ✅ Solution (v2.9.17)
- Modification de `src/routes/messages.ts` pour inclure explicitement `full_name` dans la sélection SQL.

```typescript
// AVANT
SELECT id, first_name, role, email ...

// APRÈS
SELECT id, first_name, full_name, role, email ...
```

---

## 📝 Instructions pour l'Utilisateur

1. **Rafraîchissez la page** (F5).
2. Ouvrez la messagerie privée.
3. La liste déroulante "Nouvelle conversation" devrait maintenant afficher les noms corrects (ex: "Marc Bélanger (Admin)").

---

## 📦 Détails Techniques

- **Deploy ID :** cd518252
- **Build Size :** 908.16 KB
- **Git Commit :** aff702e
- **Rollback :** v2.9.16 (Deploy ID: f154d24d)

**Conclusion :** Problème d'affichage résolu.
