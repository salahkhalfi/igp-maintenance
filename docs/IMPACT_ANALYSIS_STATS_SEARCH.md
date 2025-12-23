# 🔬 ANALYSE D'IMPACT - stats.ts & search.ts

**Date:** 2025-12-23  
**Objectif:** Vérifier que l'ajout de `deleted_at IS NULL` ne casse rien

---

## 📊 STATS.TS

### Consommateurs Identifiés
| Endpoint | Appelé par | Usage |
|----------|------------|-------|
| `/api/stats/active-tickets` | **Aucun frontend direct** | Peut-être appelé mais non trouvé |
| `/api/stats/technicians-performance` | `PerformanceModal.js` L15 | Dashboard performance |

### Requêtes à Modifier

#### 1. Active Tickets Count (L27-31)
```sql
-- ACTUEL
SELECT COUNT(*) as count FROM tickets
WHERE status NOT IN ('completed', 'cancelled', 'archived')

-- APRÈS
SELECT COUNT(*) as count FROM tickets
WHERE status NOT IN ('completed', 'cancelled', 'archived')
  AND deleted_at IS NULL
```

**Impact:** Le compteur affichera MOINS de tickets (exclut les supprimés)
**Risque:** ✅ AUCUN - Comportement attendu et correct

#### 2. Overdue Tickets Count (L34-40)
```sql
-- APRÈS: Ajouter AND deleted_at IS NULL
```
**Impact:** Idem - compteur plus précis
**Risque:** ✅ AUCUN

#### 3. Technicians Count (L43-48)
```sql
-- APRÈS: Ajouter AND deleted_at IS NULL
```
**Impact:** Techniciens supprimés non comptés
**Risque:** ✅ AUCUN

#### 4. Technicians Performance (L81-97)
```sql
-- APRÈS: Ajouter u.deleted_at IS NULL dans WHERE
```
**Impact:** Techniciens supprimés exclus du top 3
**Risque:** ✅ AUCUN

### ✅ VERDICT STATS.TS: SAFE À MODIFIER

---

## 🔍 SEARCH.TS

### Consommateurs Identifiés
| Endpoint | Appelé par | Usage |
|----------|------------|-------|
| `/api/search?q=...` | `AppHeader.js` L271 | Barre de recherche principale |

### Requêtes à Modifier

#### 1. Recherche avec commentaires (L75-91)
```sql
-- ACTUEL
WHERE t.status != 'archived' AND EXISTS(...)

-- APRÈS  
WHERE t.status != 'archived' AND t.deleted_at IS NULL AND EXISTS(...)
```

#### 2. Recherche tickets en retard (L95-113)
```sql
-- ACTUEL
WHERE t.status NOT IN ('completed', 'cancelled', 'archived') AND ...

-- APRÈS
WHERE t.status NOT IN (...) AND t.deleted_at IS NULL AND ...
```

#### 3. Recherche par mot-clé (L117-143)
```sql
-- APRÈS: Ajouter AND t.deleted_at IS NULL
```

#### 4. Recherche textuelle (L146+)
```sql
-- APRÈS: Ajouter AND t.deleted_at IS NULL
```

### Impact Fonctionnel
- **Avant:** Tickets soft-deleted pouvaient apparaître dans recherche
- **Après:** Seuls les tickets actifs apparaissent

**Risque:** ✅ AUCUN - Comportement attendu

### ✅ VERDICT SEARCH.TS: SAFE À MODIFIER

---

## 🛡️ VÉRIFICATION CROISÉE - FONCTIONS VITALES

| Fonction Vitale | Dépend de stats.ts? | Dépend de search.ts? |
|-----------------|---------------------|----------------------|
| 🎤 Voice Ticket | ❌ Non | ❌ Non |
| 🔔 Push Notifications | ❌ Non | ❌ Non |
| 🧠 Expert IA | ❌ Non | ❌ Non |
| 📋 Kanban Board | ❌ Non | ❌ Non |
| 📅 Planning | ❌ Non | ❌ Non |
| 💬 Messenger | ❌ Non | ❌ Non |

### ✅ AUCUNE FONCTION VITALE IMPACTÉE

---

## 📋 PLAN DE MODIFICATION

### Ordre d'Exécution
1. Modifier `stats.ts` (4 requêtes)
2. Modifier `search.ts` (4 requêtes)
3. Commit atomique
4. Test manuel: recherche dans AppHeader

### Rollback si Problème
```bash
git revert HEAD
```

---

## ✅ CONCLUSION

**Les modifications sont SAFE car:**
1. Aucune fonction vitale n'est impactée
2. Le comportement change de "montrer tout" à "montrer seulement actifs" (correct)
3. Les consommateurs (PerformanceModal, AppHeader) continueront de fonctionner
4. Rollback facile si problème

**Recommandation:** PROCÉDER avec les modifications.
