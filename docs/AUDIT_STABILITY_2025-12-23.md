# 🔍 AUDIT DE STABILITÉ - MaintenanceOS v3.0.0-beta.4

**Date:** 2025-12-23  
**Auditeur:** Claude AI  
**Scope:** Solidité, Stabilité, Performances, Interactions Globales

---

## 📊 RÉSUMÉ EXÉCUTIF

| Domaine | Score | Statut |
|---------|-------|--------|
| **Architecture Backend** | 8.5/10 | ✅ Solide |
| **Architecture Frontend** | 7/10 | ⚠️ À optimiser |
| **Base de Données** | 8/10 | ✅ Bien structurée |
| **Sécurité** | 8/10 | ✅ Correcte |
| **Performance** | 6.5/10 | ⚠️ Points d'attention |
| **Cohérence Inter-Composants** | 7.5/10 | ⚠️ Quelques frictions |
| **Maintenabilité** | 7/10 | ⚠️ Dette technique |

**Score Global: 7.5/10** - Application fonctionnelle avec des axes d'amélioration identifiés.

---

## 🏗️ 1. ARCHITECTURE BACKEND (Hono + Cloudflare Workers)

### ✅ Points Forts
- **Modularité exemplaire:** 23 fichiers de routes bien séparés (10,856 lignes total)
- **Validation Zod:** Schémas de validation sur les routes critiques (tickets, auth)
- **Gestion d'erreurs:** 222 blocs try/catch, 198 `console.error`, 123 retours 500
- **Middleware RBAC:** Système de permissions granulaire (`requirePermission`, `requireAnyPermission`)
- **Soft Delete:** Implémenté sur users, tickets, machines, planning_events

### ⚠️ Points d'Attention

| Problème | Fichier(s) | Impact | Priorité |
|----------|------------|--------|----------|
| Routes volumineuses | `settings.ts` (1425L), `chat.ts` (1455L), `ai.ts` (898L) | Maintenabilité | Moyenne |
| Mix Drizzle ORM + Raw SQL | Plusieurs routes | Cohérence | Basse |
| Pas de rate limiting actif | `index.tsx` (L163-171) | Sécurité DoS | Haute |

### 📋 Actions Recommandées

1. **[HAUTE] Activer Rate Limiting** - Décommenter les lignes 168-171 de `index.tsx`
2. **[MOYENNE] Refactorer settings.ts** - Découper en sous-modules (company, modules, security, import)
3. **[BASSE] Standardiser ORM** - Migrer les raw SQL restants vers Drizzle

---

## 🎨 2. ARCHITECTURE FRONTEND (React Legacy + Messenger PWA)

### ✅ Points Forts
- **Séparation claire:** MainApp Legacy (12,567L) vs Messenger PWA (5,210L)
- **Composants réutilisables:** 35 composants JS, bien nommés
- **Gestion d'erreurs:** 125 `.catch()` dans le frontend
- **Hooks React:** Utilisation correcte de useState/useEffect (2411 occurrences)

### ⚠️ Points d'Attention

| Problème | Fichier(s) | Impact | Priorité |
|----------|------------|--------|----------|
| Peu d'optimisation React | 41 useCallback/useMemo sur 2411 hooks | Re-renders inutiles | Moyenne |
| Composants volumineux | `SystemSettingsModal.js` (1507L), `AppHeader.js` (881L) | Maintenabilité | Moyenne |
| Duplication `user_cache` | 7 lectures localStorage différentes | Incohérence possible | Haute |
| `window.location.reload()` | 7 occurrences dans SystemSettingsModal | UX brutale | Basse |

### 📋 Actions Recommandées

1. **[HAUTE] Centraliser user_cache** - Créer un hook `useCurrentUser()` unique
2. **[MOYENNE] Ajouter React.memo** - Sur les composants lourds (KanbanBoard, TicketDetailsModal)
3. **[MOYENNE] Refactorer SystemSettingsModal** - Découper en tabs/onglets séparés
4. **[BASSE] Remplacer reload()** - Par des mises à jour d'état React

---

## 🗄️ 3. BASE DE DONNÉES (Cloudflare D1)

### ✅ Points Forts
- **73 migrations** - Historique complet et traçable
- **Indexes bien placés** - 30+ indexes sur les colonnes critiques
- **Schéma Drizzle** - Types TypeScript synchronisés (345 lignes)
- **Soft delete généralisé** - `deleted_at` sur les tables principales

### ⚠️ Points d'Attention

| Problème | Tables | Impact | Priorité |
|----------|--------|--------|----------|
| Filtrage soft delete inconsistant | 10 requêtes sur ~50+ | Données fantômes | Haute |
| Pas de FK sur `chat_participants.user_id` | chat_participants | Intégrité | Moyenne |
| Colonnes TEXT pour dates | Toutes les tables | Tri/comparaison | Basse |

### 📋 Actions Recommandées

1. **[HAUTE] Audit soft delete** - Vérifier TOUTES les requêtes SELECT incluent `deleted_at IS NULL`
2. **[MOYENNE] Créer vue SQL** - `active_users`, `active_tickets` pour simplifier
3. **[BASSE] Migration dates** - Documenter le format ISO 8601 utilisé

---

## 🔒 4. SÉCURITÉ

### ✅ Points Forts
- **JWT avec jose** - Bibliothèque moderne et sécurisée
- **PBKDF2 hashing** - Implémenté dans `password.ts`
- **CORS dynamique** - Accepte `*.pages.dev` automatiquement
- **Middleware Auth** - Dual-mode (Cookie + Header)
- **Headers de sécurité** - X-Frame-Options, X-Content-Type-Options, Referrer-Policy

### ⚠️ Points d'Attention

| Problème | Fichier | Impact | Priorité |
|----------|---------|--------|----------|
| Rate limiting désactivé | `index.tsx` | DoS possible | Haute |
| CORS permissif | `index.tsx` L124 | Toute origine HTTPS acceptée | Moyenne |
| Logs en dev exposent tokens | `auth.ts` L16-17 | Info leak | Basse |

### 📋 Actions Recommandées

1. **[HAUTE] Activer rate limiting** - Au minimum sur `/api/auth/*` et `/api/ai/*`
2. **[MOYENNE] Restreindre CORS** - Limiter aux domaines connus (configurable en DB)
3. **[BASSE] Masquer tokens dans logs** - Remplacer par `***` les 4 derniers caractères

---

## ⚡ 5. PERFORMANCES

### ✅ Points Forts
- **Cache immutable sur JS** - `max-age=31536000` avec hash versioning
- **No-cache sur données dynamiques** - `/`, `/messenger` correctement configurés
- **Polling optimisé Messenger** - 3s messages, 5s conversations (raisonnable)

### ⚠️ Points d'Attention

| Problème | Localisation | Impact | Priorité |
|----------|--------------|--------|----------|
| Polling sans WebSocket | Messenger (2 intervals) | Batterie/réseau | Moyenne |
| N+1 potentiel | `tickets.ts` media_count subquery | Lenteur listes | Moyenne |
| Pas de pagination | GET /api/tickets | Mémoire si >1000 tickets | Haute |
| Frontend non-minifié par défaut | `public/static/js/*.js` | Taille bundle | Basse |

### 📋 Actions Recommandées

1. **[HAUTE] Ajouter pagination** - `?limit=50&offset=0` sur `/api/tickets`
2. **[MOYENNE] Optimiser media_count** - JOIN + GROUP BY au lieu de subquery
3. **[MOYENNE] Évaluer SSE** - Remplacer polling par Server-Sent Events
4. **[BASSE] Automatiser minification** - Intégrer `build:minify` dans le build principal

---

## 🔗 6. COHÉRENCE INTER-COMPOSANTS

### ✅ Points Forts
- **Pattern Avatar unifié** - AppHeader et Messenger utilisent le même pattern (avatar_key check)
- **API auth/me partagée** - Utilisée par les deux frontends
- **localStorage user_cache** - Convention respectée

### ⚠️ Points d'Attention

| Problème | Composants | Impact | Priorité |
|----------|------------|--------|----------|
| 2 systèmes de navigation | Legacy (`window.location`) vs Messenger (React state) | Confusion | Basse |
| Duplication logique rôles | `hasPermission` dans MainApp vs API | Désync possible | Moyenne |
| Styles non-unifiés | Legacy (CDN Tailwind) vs Messenger (Vite build) | Incohérence visuelle | Basse |

### 📋 Actions Recommandées

1. **[MOYENNE] Centraliser permissions** - `hasPermission` côté serveur uniquement, frontend demande
2. **[BASSE] Harmoniser navigation** - Créer utilitaire `navigateTo()` commun
3. **[BASSE] Unifier build CSS** - Même Tailwind config pour Legacy et Messenger

---

## 🧹 7. DETTE TECHNIQUE IDENTIFIÉE

### Fichiers à Surveiller

| Fichier | Lignes | Complexité | Risque |
|---------|--------|------------|--------|
| `src/routes/settings.ts` | 1425 | Très haute | Bugs cachés |
| `src/routes/chat.ts` | 1455 | Très haute | Régression |
| `public/static/js/components/SystemSettingsModal.js` | 1507 | Très haute | Maintenabilité |
| `src/routes/push.ts` | 886 | Haute | Complexité push |

### Code Legacy à Migrer

1. **React.createElement** - 2411 occurrences (pas de JSX)
2. **Variables globales** - `currentUser`, `authToken`, `API_URL`
3. **Inline HTML** - `views/*.ts` avec template strings

---

## 🎯 PLAN D'ACTION PRIORISÉ

### Phase 1: Stabilité Critique (1-2 semaines)

| # | Action | Fichier(s) | Effort | Impact |
|---|--------|------------|--------|--------|
| 1 | Activer rate limiting | `index.tsx` | 1h | 🛡️ Sécurité |
| 2 | Centraliser user_cache | Nouveau `useCurrentUser.js` | 4h | 🔧 Cohérence |
| 3 | Ajouter pagination tickets | `tickets.ts` + Frontend | 4h | ⚡ Performance |
| 4 | Audit soft delete | Toutes routes | 2h | 🗄️ Intégrité |

### Phase 2: Optimisation (2-4 semaines)

| # | Action | Fichier(s) | Effort | Impact |
|---|--------|------------|--------|--------|
| 5 | Refactorer settings.ts | Split en 4 fichiers | 8h | 🧹 Maintenabilité |
| 6 | Optimiser requêtes N+1 | `tickets.ts`, `machines.ts` | 4h | ⚡ Performance |
| 7 | Ajouter React.memo | Composants lourds | 4h | ⚡ Performance |
| 8 | Restreindre CORS | `index.tsx` + DB config | 2h | 🛡️ Sécurité |

### Phase 3: Modernisation (1-2 mois)

| # | Action | Scope | Effort | Impact |
|---|--------|-------|--------|--------|
| 9 | Migrer vers SSE | Messenger polling | 16h | ⚡ Performance |
| 10 | Refactorer SystemSettingsModal | Split composants | 16h | 🧹 Maintenabilité |
| 11 | Ajouter tests unitaires | Routes critiques | 24h | 🛡️ Qualité |
| 12 | Documentation API | OpenAPI/Swagger | 8h | 📚 Maintenabilité |

---

## ✅ CHECKLIST PRÉ-PRODUCTION

### Avant Mise en Production Majeure

- [ ] Rate limiting activé sur auth et AI
- [ ] Pagination sur toutes les listes (tickets, users, messages)
- [ ] Audit soft delete complet
- [ ] Tests de charge (autocannon déjà installé)
- [ ] Backup DB récent
- [ ] Monitoring erreurs configuré

### Tests de Non-Régression

- [ ] Login/Logout (Cookie + Header)
- [ ] Avatar affichage (avec et sans avatar_key)
- [ ] Création ticket (avec pièces jointes)
- [ ] Push notifications (iOS + Android)
- [ ] Messenger (messages, groupes, audio)
- [ ] Planning (création, modification, affichage TV)
- [ ] Permissions RBAC (admin, technicien, opérateur)

---

## 📝 CONCLUSION

L'application MaintenanceOS est **fonctionnelle et globalement stable**. Les principales préoccupations concernent:

1. **Performance** - Pagination manquante sur les listes
2. **Sécurité** - Rate limiting désactivé
3. **Maintenabilité** - Quelques fichiers trop volumineux

Le plan d'action proposé est **incrémental et non-destructif**. Chaque phase peut être déployée indépendamment sans risque de régression majeure.

**Recommandation:** Implémenter la Phase 1 avant tout déploiement client supplémentaire.

---

*Document généré automatiquement - À réviser avec l'équipe technique*
