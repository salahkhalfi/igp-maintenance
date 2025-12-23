# 🛡️ PHASE 1 - ANALYSE DE SÉCURITÉ

**Objectif:** Identifier les actions SAFE qui n'impactent PAS les fonctions vitales.

---

## 📊 MATRICE D'IMPACT

| Action | Voice Ticket | Push | Expert IA | SAFE? |
|--------|--------------|------|-----------|-------|
| 1. Rate Limiting | ⚠️ Potentiel | ✅ Aucun | ⚠️ Potentiel | ❌ RISQUE |
| 2. Centraliser user_cache | ✅ Aucun | ✅ Aucun | ✅ Aucun | ✅ SAFE |
| 3. Pagination tickets | ✅ Aucun | ✅ Aucun | ⚠️ Léger | ⚠️ ATTENTION |
| 4. Audit soft delete | ✅ Aucun | ✅ Aucun | ✅ Déjà OK | ✅ SAFE |

---

## ✅ ACTIONS SAFE (Peuvent être implémentées)

### ACTION 2: Centraliser user_cache
**Risque: AUCUN**

**Justification:**
- `user_cache` est utilisé uniquement côté **Frontend** (localStorage)
- Les fonctions vitales (ai.ts, push.ts) n'utilisent PAS user_cache (0 occurrences)
- Modification limitée aux fichiers JS frontend

**Fichiers à modifier:**
- Créer: `public/static/js/hooks/useCurrentUser.js`
- Modifier: `App.js`, `AppHeader.js`, `CreateTicketModal.js`

**Test de non-régression:** Login/Logout, Avatar display

---

### ACTION 4: Audit soft delete
**Risque: AUCUN** (lecture seule)

**Justification:**
- C'est un AUDIT, pas une modification
- ai.ts utilise DÉJÀ correctement `deleted_at IS NULL` (5 occurrences)
- push.ts n'a pas de requêtes sur tables avec soft delete

**Fichiers à auditer:**
- `src/routes/tickets.ts`
- `src/routes/machines.ts`
- `src/routes/users.ts`
- `src/routes/planning.ts`

**Test:** Aucun test requis (lecture seule)

---

## ⚠️ ACTIONS À REPORTER (Nécessitent plus de prudence)

### ACTION 1: Rate Limiting
**Risque: MOYEN**

**Problème:**
- `/api/ai/analyze-ticket` pourrait être bloqué si rate limit trop strict
- Utilisateurs légitimes pourraient perdre leurs enregistrements vocaux

**Approche recommandée:**
1. Activer SEULEMENT sur `/api/auth/login` et `/api/auth/register`
2. NE PAS activer sur `/api/ai/*` pour l'instant
3. Tester en environnement de dev avant prod

---

### ACTION 3: Pagination tickets
**Risque: LÉGER**

**Problème:**
- `ai.ts` (L489) charge TOUS les tickets actifs pour le contexte IA
- Si pagination, l'Expert IA pourrait perdre de l'information

**Approche recommandée:**
1. Pagination sur `/api/tickets` (frontend)
2. NE PAS modifier les requêtes internes de ai.ts
3. Garder la requête complète pour le contexte IA

---

## 🎯 ORDRE D'EXÉCUTION RECOMMANDÉ

```
1. [SAFE] Audit soft delete (lecture seule)
2. [SAFE] Centraliser user_cache (frontend only)
3. [ATTENTION] Pagination tickets (avec précaution)
4. [REPORTER] Rate limiting (tests requis d'abord)
```

---

## 📋 CHECKLIST PRÉ-IMPLÉMENTATION

Avant CHAQUE modification :
- [ ] Relire `docs/VITAL_FUNCTIONS_MAP.md`
- [ ] Vérifier que le fichier n'est pas SANCTUARISÉ
- [ ] Faire un commit AVANT modification (`git stash` si nécessaire)
- [ ] Tester les 3 fonctions vitales APRÈS modification

---

*Document créé le 2025-12-23*
