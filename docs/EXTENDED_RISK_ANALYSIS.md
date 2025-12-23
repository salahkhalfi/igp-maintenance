# 🔬 ANALYSE ÉTENDUE DES RISQUES - TOUTES FONCTIONS

**Date:** 2025-12-23  
**Version:** 1.0  
**Scope:** Kanban, Planning, Messenger, Machines, Users, Tickets

---

## 📊 MATRICE GLOBALE DES FONCTIONS

| Fonction | Complexité | Dépendances | Risque Modification | Priorité Business |
|----------|------------|-------------|---------------------|-------------------|
| 🎤 Voice Ticket | Haute | 3 APIs externes | 🔴 CRITIQUE | ⭐⭐⭐⭐⭐ |
| 🔔 Push Notifications | Haute | VAPID, Service Worker | 🔴 CRITIQUE | ⭐⭐⭐⭐⭐ |
| 🧠 Expert IA | Très haute | 3 APIs + DB Config | 🔴 CRITIQUE | ⭐⭐⭐⭐⭐ |
| 📋 Kanban Board | Moyenne | localStorage, API | 🟡 MODÉRÉ | ⭐⭐⭐⭐ |
| 📅 Planning | Moyenne | DB, Push | 🟡 MODÉRÉ | ⭐⭐⭐⭐ |
| 💬 Messenger | Haute | Polling, R2, Push | 🟠 ÉLEVÉ | ⭐⭐⭐⭐ |
| 🔧 Machines | Basse | DB simple | 🟢 FAIBLE | ⭐⭐⭐ |
| 👥 Users | Moyenne | Auth, RBAC | 🟡 MODÉRÉ | ⭐⭐⭐ |
| 🎫 Tickets | Haute | Push, Webhook, Timeline | 🟠 ÉLEVÉ | ⭐⭐⭐⭐⭐ |

---

## 1. 📋 KANBAN BOARD

### Architecture
```
[KanbanBoard.js] ←→ [API /api/tickets] ←→ [tickets.ts] ←→ [D1 Database]
      ↓
[localStorage: kanban_columns]
      ↓
[API /api/preferences/kanban_columns]
```

### Fichiers Impliqués
| Fichier | Lignes | Rôle |
|---------|--------|------|
| `public/static/js/components/KanbanBoard.js` | 449 | UI Drag & Drop |
| `public/static/js/components/MainApp.js` | 465 | Parent, état columns |
| `src/routes/tickets.ts` | 606 | CRUD tickets |
| `src/routes/preferences.ts` | 102 | Sauvegarde colonnes |

### Dépendances Critiques
- **localStorage:** `kanban_columns`, `user_cache`
- **API:** `/api/tickets`, `/api/preferences/kanban_columns`
- **Props:** `tickets`, `columns`, `currentUser`

### Points de Fragilité
1. **Colonnes dynamiques** - Config sauvée en localStorage ET en DB
2. **Drag & Drop** - Complexe sur mobile (long press)
3. **Filtrage par rôle** - Opérateurs voient seulement leurs tickets (L47-50)
4. **Orphaned tickets** - Détection tickets sans colonne valide (L30-34)

### ⚠️ Risques si Modification
| Action | Impact Kanban | Risque |
|--------|---------------|--------|
| Centraliser user_cache | ✅ Aucun | SAFE |
| Pagination tickets | ⚠️ Peut casser affichage | ATTENTION |
| Modifier colonnes default | ⚠️ Sync localStorage/DB | ATTENTION |
| Soft delete audit | ✅ Aucun (déjà OK) | SAFE |

### Tests de Non-Régression
- [ ] Drag & Drop desktop (souris)
- [ ] Drag & Drop mobile (long press)
- [ ] Changement de colonnes personnalisées
- [ ] Filtrage opérateur (voir seulement ses tickets)
- [ ] Tri par urgence/date/planifié

---

## 2. 📅 PLANNING (Production)

### Architecture
```
[ProductionPlanning_v3.js] ←→ [API /api/planning] ←→ [planning.ts] ←→ [D1]
                                      ↓
                              [sendPushNotification]
                                      ↓
                              [API /api/tv] → [TV Display]
```

### Fichiers Impliqués
| Fichier | Lignes | Rôle |
|---------|--------|------|
| `public/static/js/components/ProductionPlanning_v3.js` | 841 | UI Calendrier |
| `src/routes/planning.ts` | 351 | CRUD événements |
| `src/routes/tv.ts` | 434 | Affichage TV |

### Tables DB
- `planning_events` (id, date, type, status, title, details, show_on_tv, deleted_at)
- `planning_categories` (id, label, icon, color)
- `planner_notes` (id, text, date, done, user_id)

### Dépendances Critiques
- **Push:** Partage planning envoie notification (L47-56 planning.ts)
- **Soft Delete:** Utilisé correctement (L85, L190)
- **Permissions RBAC:** `requirePermission('planning', 'read')`

### Points de Fragilité
1. **Catégories dynamiques** - Chargées depuis DB
2. **Affichage TV** - Route séparée, doit rester sync
3. **Notes par utilisateur** - Filtrage user_id (L92-100)
4. **Soft delete** - ✅ Correctement implémenté

### ⚠️ Risques si Modification
| Action | Impact Planning | Risque |
|--------|-----------------|--------|
| Centraliser user_cache | ✅ Aucun | SAFE |
| Pagination | ✅ Aucun (pas de liste longue) | SAFE |
| Modifier push | ⚠️ Partage planning cassé | ATTENTION |
| Rate limiting | ✅ Aucun | SAFE |

### Tests de Non-Régression
- [ ] Créer/modifier/supprimer événement
- [ ] Filtrer par catégorie
- [ ] Partager planning (notification push)
- [ ] Affichage TV synchronisé
- [ ] Notes personnelles

---

## 3. 💬 MESSENGER (IGP Connect)

### Architecture
```
[App.tsx] → [ConversationList.tsx] → [ChatWindow.tsx]
                    ↓                        ↓
            [Polling 5s]              [Polling 3s]
                    ↓                        ↓
            [/api/v2/chat/*]          [/api/v2/chat/messages]
                    ↓                        ↓
            [chat.ts 1455L]           [R2 Media Storage]
                    ↓
            [Push Notifications]
```

### Fichiers Impliqués (PWA)
| Fichier | Lignes | Rôle |
|---------|--------|------|
| `src/messenger/App.tsx` | 215 | Entry point |
| `src/messenger/components/ConversationList.tsx` | 728 | Liste conversations |
| `src/messenger/components/ChatWindow.tsx` | 695 | Fenêtre de chat |
| `src/messenger/components/MessageInput.tsx` | 376 | Input + Audio |
| `src/messenger/components/MessageList.tsx` | 495 | Liste messages |
| `src/routes/chat.ts` | 1455 | Backend API |

### Dépendances Critiques
- **Polling:** ConversationList (5s), ChatWindow (3s)
- **R2 Storage:** Images, Audio, Avatars
- **Push:** Nouveaux messages
- **Vision IA:** Analyse images (OpenAI)
- **Guests:** Table séparée `chat_guests`

### Points de Fragilité
1. **Polling double** - 2 intervals simultanés (performance)
2. **Audio recording** - MediaRecorder API
3. **Vision analysis** - OpenAI pour images
4. **Guest auth** - Système parallèle aux users
5. **Action Cards** - Messages avec actions

### ⚠️ Risques si Modification
| Action | Impact Messenger | Risque |
|--------|------------------|--------|
| Centraliser user_cache | ✅ Aucun (utilise auth_token) | SAFE |
| Rate limiting sur chat | 🔴 Casse polling | CRITIQUE |
| Modifier R2 paths | 🔴 Images cassées | CRITIQUE |
| Pagination messages | ⚠️ Déjà implémenté (scroll infini) | ATTENTION |
| Soft delete audit | ⚠️ chat.ts L443 utilise deleted_at | ATTENTION |

### Tests de Non-Régression
- [ ] Envoyer message texte
- [ ] Envoyer message audio (enregistrement)
- [ ] Envoyer image (avec preview)
- [ ] Recevoir notification push
- [ ] Créer groupe
- [ ] Ajouter/retirer participant
- [ ] Guest login et chat
- [ ] Vision IA sur image

---

## 4. 🔧 MACHINES

### Architecture
```
[MachineManagementModal.js] ←→ [API /api/machines] ←→ [machines.ts] ←→ [D1]
```

### Fichiers Impliqués
| Fichier | Lignes | Rôle |
|---------|--------|------|
| `public/static/js/components/MachineManagementModal.js` | 566 | UI CRUD |
| `src/routes/machines.ts` | 221 | Backend API |

### ⚠️ PROBLÈME DÉTECTÉ: Soft Delete Manquant
```typescript
// machines.ts L26-30 - PAS de filtre deleted_at !
const results = await db
  .select()
  .from(machines)
  .where(and(...conditions))  // ❌ Manque deleted_at IS NULL
  .orderBy(machines.location, machines.machine_type);
```

### Risques si Modification
| Action | Impact Machines | Risque |
|--------|-----------------|--------|
| Ajouter soft delete filter | ⚠️ Machines supprimées disparaissent | ATTENTION |
| Centraliser user_cache | ✅ Aucun | SAFE |
| Pagination | ✅ Liste courte généralement | SAFE |

### 🔧 ACTION REQUISE
Ajouter filtre `deleted_at IS NULL` sur GET /api/machines

---

## 5. 👥 USERS

### Architecture
```
[UserManagementModal.js] ←→ [API /api/users] ←→ [users.ts] ←→ [D1]
       ↓
[UserList.js, UserForms.js]
```

### Fichiers Impliqués
| Fichier | Lignes | Rôle |
|---------|--------|------|
| `public/static/js/components/UserManagementModal.js` | 194 | Container |
| `public/static/js/components/UserList.js` | 245 | Liste |
| `public/static/js/components/UserForms.js` | 287 | Formulaires |
| `src/routes/users.ts` | 542 | Backend API |

### Soft Delete Status
- ✅ L45, L51, L126, L134: Filtre `deleted_at IS NULL` présent
- ✅ L450: Soft delete implémenté

### Risques si Modification
| Action | Impact Users | Risque |
|--------|--------------|--------|
| Centraliser user_cache | ⚠️ Utilisé pour affichage | ATTENTION |
| Pagination | ⚠️ Si beaucoup d'utilisateurs | ATTENTION |
| Rate limiting | ✅ Aucun | SAFE |

---

## 6. 🎫 TICKETS

### Architecture
```
[CreateTicketModal.js] → [API POST /api/tickets] → [tickets.ts]
         ↓                                              ↓
[VoiceTicketFab.js]                              [sendPushNotification]
         ↓                                              ↓
[/api/ai/analyze-ticket]                         [sendWebhook]
                                                        ↓
                                                 [Timeline entry]
```

### Fichiers Impliqués
| Fichier | Lignes | Rôle |
|---------|--------|------|
| `public/static/js/components/CreateTicketModal.js` | 590 | Création UI |
| `public/static/js/components/TicketDetailsModal.js` | 654 | Détails |
| `public/static/js/components/TicketDetailsModal_v3.js` | 637 | Version 3 |
| `src/routes/tickets.ts` | 606 | Backend CRUD |

### Dépendances Critiques
- **Push:** Notification à l'assigné (L240-284)
- **Webhook:** Envoi externe (L311-315)
- **Timeline:** Historique actions
- **Voice:** Via ai.ts
- **Machine status:** Auto-update si machine_down

### Soft Delete Status
- ✅ L58, L102: Filtre présent
- ✅ L585: Soft delete implémenté

### ⚠️ Risques si Modification
| Action | Impact Tickets | Risque |
|--------|----------------|--------|
| Pagination | ⚠️ Expert IA charge tout (ai.ts L489) | ATTENTION |
| Modifier push | 🔴 Notifications cassées | CRITIQUE |
| Modifier webhook | ⚠️ Intégrations externes cassées | ATTENTION |
| Rate limiting sur POST | ⚠️ Création vocale limitée | ATTENTION |

---

## 📊 RÉSUMÉ: CLÉS localStorage UTILISÉES

| Clé | Fichiers | Usage | Risque Centralisation |
|-----|----------|-------|----------------------|
| `auth_token` | 8 fichiers | Authentification | 🟡 Moyen (critique) |
| `user_cache` | 3 fichiers | Cache utilisateur | 🟢 Faible (isolé) |
| `kanban_columns` | 4 fichiers | Config colonnes | 🟢 Faible |
| `timezone_offset_hours` | 3 fichiers | Timezone | 🟢 Faible |
| `search_history` | 1 fichier | Historique recherche | 🟢 Faible |
| `token` | 2 fichiers | Legacy auth | 🟡 Moyen |

---

## 🎯 PLAN D'ACTION RÉVISÉ (Ultra-Prudent)

### PHASE 1A: Actions 100% SAFE (Aucun risque)
1. ✅ **Audit soft delete** - Lecture seule
2. ✅ **Documenter timers/intervals** - Lecture seule

### PHASE 1B: Actions SAFE avec Précautions
3. ⚠️ **Ajouter soft delete sur machines.ts** - Impact minimal
   - Fichier: `src/routes/machines.ts` L26-30
   - Ajouter: `.where(sql\`deleted_at IS NULL\`)`
   - Test: Vérifier liste machines après

### PHASE 2: Actions Modérées (Tests requis)
4. ⚠️ **Centraliser user_cache** - Frontend only
   - Créer hook `useCurrentUser.js`
   - Modifier progressivement chaque composant
   - Tester login/logout/avatar

### PHASE 3: Actions Sensibles (Environnement test d'abord)
5. ⚠️ **Pagination tickets** - NE PAS toucher ai.ts
   - Modifier seulement tickets.ts et frontend
   - Garder requête complète pour Expert IA

### PHASE 4: Actions Reportées (Analyse approfondie requise)
6. 🔴 **Rate limiting** - Risque sur Voice Ticket
7. 🔴 **Optimiser polling Messenger** - Risque stabilité

---

## ✅ CHECKLIST AVANT TOUTE MODIFICATION

```
[ ] 1. Lire le fichier ENTIER
[ ] 2. Identifier les dépendances (grep)
[ ] 3. Vérifier si fonction vitale impactée
[ ] 4. Commit AVANT modification
[ ] 5. Modification minimale et isolée
[ ] 6. Tester fonctions vitales:
    [ ] - Voice Ticket (enregistrer → analyser → créer)
    [ ] - Push (créer ticket → recevoir notif)
    [ ] - Expert IA (envoyer message → réponse)
[ ] 7. Tester fonction modifiée
[ ] 8. Commit APRÈS avec message explicite
```

---

*Document créé le 2025-12-23 - Mise à jour requise après chaque modification*
