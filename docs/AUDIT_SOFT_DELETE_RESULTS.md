# 🔍 AUDIT SOFT DELETE - RÉSULTATS

**Date:** 2025-12-23  
**Auditeur:** Claude AI  
**Méthode:** Analyse statique du code (grep + lecture manuelle)

---

## 📊 RÉSUMÉ EXÉCUTIF

| Catégorie | Nombre |
|-----------|--------|
| Tables avec soft delete | 4 (users, tickets, machines, planning_events) |
| Routes correctement filtrées | 9 |
| Routes avec problèmes | 3 |
| Requêtes à corriger | 6 |

---

## ✅ ROUTES CORRECTEMENT FILTRÉES

| Route | Occurrences `deleted_at IS NULL` | Status |
|-------|----------------------------------|--------|
| `ai.ts` | 5 | ✅ OK |
| `users.ts` | 4 | ✅ OK |
| `settings.ts` | 4 | ✅ OK |
| `tickets.ts` | 2 | ✅ OK |
| `planning.ts` | 1 | ✅ OK |
| `technicians.ts` | 1 | ✅ OK |
| `tv.ts` | 1 | ✅ OK |
| `chat.ts` | 1 | ✅ OK |

---

## ❌ ROUTES AVEC PROBLÈMES

### 1. `machines.ts` - CRITIQUE

**Problème:** 3 requêtes SELECT sans filtre `deleted_at`

| Ligne | Requête | Impact |
|-------|---------|--------|
| L27-30 | `GET /api/machines` (liste) | Machines supprimées visibles |
| L46-50 | `GET /api/machines/:id` (détail) | Machine supprimée accessible |
| L200-204 | `DELETE /api/machines/:id` (count tickets) | Compte tickets de machines supprimées |

**Code actuel (L27-30):**
```typescript
const results = await db
  .select()
  .from(machines)
  .where(and(...conditions))  // ❌ Manque deleted_at
```

**Note:** L146 a le filtre pour les tickets, mais PAS pour les machines.

---

### 2. `search.ts` - MODÉRÉ

**Problème:** Requêtes SQL raw sans filtre `deleted_at` sur tickets

| Ligne | Requête | Impact |
|-------|---------|--------|
| L75-91 | Recherche avec commentaires | Tickets supprimés dans résultats |
| L95-113 | Recherche tickets en retard | Tickets supprimés dans résultats |
| L117-143 | Recherche par mot-clé | Tickets supprimés dans résultats |
| L146-159 | Recherche textuelle | Tickets supprimés dans résultats |

**Mitigation actuelle:** Filtre `t.status != 'archived'` présent, mais ce n'est PAS la même chose que `deleted_at IS NULL`.

**Risque:** Faible - Les tickets sont généralement archivés avant d'être soft-deleted.

---

### 3. `stats.ts` - MODÉRÉ

**Problème:** Requêtes SQL raw sans filtre `deleted_at`

| Ligne | Requête | Impact |
|-------|---------|--------|
| L27-31 | Count active tickets | Compte potentiellement tickets supprimés |
| L34-40 | Count overdue tickets | Idem |
| L43-48 | Count technicians | Compte utilisateurs supprimés |

**Code actuel (L27-31):**
```sql
SELECT COUNT(*) as count
FROM tickets
WHERE status NOT IN ('completed', 'cancelled', 'archived')
-- ❌ Manque: AND deleted_at IS NULL
```

**Risque:** Les stats peuvent être légèrement faussées.

---

## 🔧 CORRECTIONS REQUISES

### Priorité HAUTE (machines.ts)

```typescript
// L29 - GET /api/machines
.where(and(...conditions, sql`${machines.deleted_at} IS NULL`))

// L49 - GET /api/machines/:id  
.where(and(eq(machines.id, id), sql`${machines.deleted_at} IS NULL`))
```

### Priorité MOYENNE (stats.ts)

```sql
-- L31
AND deleted_at IS NULL

-- L40
AND deleted_at IS NULL

-- L48
AND deleted_at IS NULL
```

### Priorité BASSE (search.ts)

Ajouter dans chaque WHERE clause:
```sql
AND t.deleted_at IS NULL
```

---

## 📋 CHECKLIST DE CORRECTION

### Phase 1B (Immédiat)
- [ ] `machines.ts` L29: Ajouter filtre sur GET /
- [ ] `machines.ts` L49: Ajouter filtre sur GET /:id

### Phase 2 (Court terme)
- [ ] `stats.ts` L31: Ajouter filtre tickets
- [ ] `stats.ts` L40: Ajouter filtre overdue
- [ ] `stats.ts` L48: Ajouter filtre users

### Phase 3 (Moyen terme)
- [ ] `search.ts`: 4 requêtes à modifier

---

## ⚠️ TABLES SANS SOFT DELETE (Conception)

Ces tables n'ont PAS de colonne `deleted_at` et utilisent le hard delete :

| Table | Raison |
|-------|--------|
| `ticket_comments` | Historique, jamais supprimé |
| `ticket_timeline` | Audit trail, jamais supprimé |
| `media` | Cascade delete avec ticket |
| `push_subscriptions` | Nettoyé automatiquement |
| `messages` | Historique, jamais supprimé |
| `chat_messages` | Historique, jamais supprimé |

**Verdict:** Design intentionnel, pas de problème.

---

## ✅ CONCLUSION

**Impact global:** FAIBLE à MODÉRÉ

Le problème principal est `machines.ts` où des machines supprimées peuvent apparaître dans la liste. Les autres routes ont des mitigations partielles (filtres status).

**Recommandation:** Procéder à la Phase 1B pour corriger `machines.ts` immédiatement.

---

*Audit terminé - Prêt pour Phase 1B*
