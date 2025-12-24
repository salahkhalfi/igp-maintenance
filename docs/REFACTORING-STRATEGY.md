# 🏗️ Stratégie de Refactoring - PME App

> **Version:** 1.1
> **Date:** 2025-12-24
> **Auteur:** AI Assistant + Salah
> **Status:** ⚠️ REPORTÉ - Prochaine étape = Guide Utilisateur

---

## 🚨 DÉCISION NO BULLSHIT (2025-12-24)

**Ce plan est REPORTÉ indéfiniment.**

**Pourquoi :**
- L'app FONCTIONNE en production (IGP l'utilise)
- 160-330h de refactoring = ROI négatif sans 2e client
- Refactorer avant de vendre = procrastination déguisée

**Prochaine vraie priorité :**
1. ✅ Guide utilisateur débutant (mode d'emploi)
2. 🎯 Trouver 1 client payant
3. ⏳ Refactorer SEULEMENT si ça bloque une vente

**Règle :** Ne pas toucher ce document tant qu'un 2e client n'est pas signé.

---

## 📊 État actuel du code (pour référence)

### Backend (src/)
| Fichier | Lignes | Priorité refactoring |
|---------|--------|---------------------|
| `routes/chat.ts` | 1,502 | 🔴 HAUTE |
| `routes/settings.ts` | 1,425 | 🔴 HAUTE |
| `routes/ai.ts` | 898 | 🟡 MOYENNE |
| `routes/push.ts` | 828 | 🟡 MOYENNE |
| `routes/messages.ts` | 784 | 🟡 MOYENNE |
| `routes/tickets.ts` | 633 | 🟢 BASSE |
| `routes/auth.ts` | 548 | 🟢 BASSE |
| `routes/users.ts` | 542 | 🟢 BASSE |
| **Total backend** | ~8,500 | |

### Frontend (public/static/js/)
| Fichier | Lignes | Priorité refactoring |
|---------|--------|---------------------|
| `SystemSettingsModal.js` | 1,507 | 🔴 HAUTE |
| `AppHeader.js` | 882 | 🟡 MOYENNE |
| `ProductionPlanning_v3.js` | 848 | 🟡 MOYENNE |
| `DataImportModal.js` | 694 | 🟢 BASSE |
| `TicketDetailsModal.js` | 654 | 🟢 BASSE |
| **Total frontend** | ~13,600 | |

### Views (src/views/)
| Fichier | Lignes | Priorité refactoring |
|---------|--------|---------------------|
| `changelog.ts` | 2,118 | 🟢 BASSE (statique) |
| `tv.ts` | 1,830 | 🟡 MOYENNE |
| `guide.ts` | 1,770 | 🟢 BASSE (statique) |
| `home.ts` | 880 | 🟡 MOYENNE |
| **Total views** | ~8,200 | |

### Bundle
| Métrique | Actuel | Cible |
|----------|--------|-------|
| `_worker.js` | 827 KB | <400 KB |
| Limite Cloudflare | 1 MB | - |
| Marge restante | 173 KB | - |

---

## 🎯 Principe : "Strangler Fig Pattern"

> **Ne jamais réécrire from scratch.** On encapsule l'ancien code et on le remplace progressivement, comme un figuier étrangleur qui enveloppe un arbre.

### Pourquoi pas de réécriture complète ?
1. **Risque de régression** : Le code actuel fonctionne en production
2. **Connaissance tacite** : Des edge cases sont gérés sans documentation
3. **Temps** : Une réécriture prend 3x plus longtemps qu'estimé
4. **Motivation** : Voir des progrès incrémentaux maintient le moral

---

## 📋 Plan en 4 Phases

### Phase 1 : Stabilisation (2-3 semaines)
**Objectif : Créer un filet de sécurité AVANT de toucher au code**

#### 1.1 Tests de non-régression
- [ ] Documenter les 20 parcours utilisateurs critiques
- [ ] Créer des tests E2E basiques (Playwright)
- [ ] Capturer les réponses API actuelles comme "golden files"

#### 1.2 Métriques baseline
- [ ] Bundle size actuel : 827 KB
- [ ] Temps de réponse API (p50, p95, p99)
- [ ] Nombre de requêtes DB par page

#### 1.3 Documentation des dépendances
- [ ] Cartographier qui appelle quoi
- [ ] Identifier le code "mort" vs "vivant"
- [ ] Lister les variables globales partagées

**Livrable :** Document "État des lieux" + suite de tests minimale

---

### Phase 2 : Extraction Backend (4-6 semaines)
**Objectif : Découper les gros fichiers routes sans casser l'API**

#### Priorité 1 : Les plus gros fichiers

**chat.ts (1502 lignes) → 3 modules :**
- [ ] `chat/messages.ts` - Envoi/réception messages
- [ ] `chat/ai.ts` - Intégration IA
- [ ] `chat/utils.ts` - Fonctions utilitaires

**settings.ts (1425 lignes) → 3 modules :**
- [ ] `settings/system.ts` - Config système
- [ ] `settings/tenant.ts` - Config tenant/white-label
- [ ] `settings/ui.ts` - Préférences UI

**ai.ts (898 lignes) → 3 modules :**
- [ ] `ai/whisper.ts` - Transcription audio
- [ ] `ai/chat.ts` - Chat IA
- [ ] `ai/utils.ts` - Fonctions partagées

#### Technique : "Extract & Delegate"
```typescript
// AVANT: chat.ts (1500 lignes)
app.post('/api/chat/send', async (c) => {
  // 200 lignes de logique...
});

// APRÈS: chat.ts (100 lignes) - devient un "router"
import { handleSendMessage } from './chat/messages';
import { handleAIResponse } from './chat/ai';

app.post('/api/chat/send', handleSendMessage);
app.post('/api/chat/ai', handleAIResponse);
```

---

### Phase 3 : Extraction Frontend (4-6 semaines)
**Objectif : Moderniser le JS legacy progressivement**

#### Priorité : Les modales géantes

**SystemSettingsModal.js (1507 lignes) → tabs séparés :**
- [ ] `settings/GeneralTab.js`
- [ ] `settings/UsersTab.js`
- [ ] `settings/MachinesTab.js`
- [ ] `settings/NotificationsTab.js`
- [ ] `SystemSettingsModal.js` (orchestrateur ~200 lignes)

**AppHeader.js (882 lignes) → composants :**
- [ ] `header/NotificationsDropdown.js`
- [ ] `header/UserMenu.js`
- [ ] `header/SearchBar.js`
- [ ] `AppHeader.js` (orchestrateur ~200 lignes)

---

### Phase 4 : Optimisation Bundle (2-3 semaines)
**Objectif : Passer sous 400 KB**

- [ ] Tree shaking - Identifier le code mort
- [ ] Code splitting - Charger les modales à la demande
- [ ] Lazy loading - Views non-critiques (changelog, guide)
- [ ] Audit des dépendances npm

---

## ⚠️ Analyse des Risques

### 🔴 Risques CRITIQUES

#### R1: Régression en production
| Aspect | Détail |
|--------|--------|
| **Probabilité** | HAUTE (70%) |
| **Impact** | CRITIQUE - Utilisateurs IGP bloqués |
| **Cause** | Code spaghetti avec dépendances cachées |
| **Mitigation** | Tests E2E AVANT refactoring, rollback <5min |
| **Contingence** | `git revert` immédiat, feature flags |

#### R2: Bundle dépasse 1 MB
| Aspect | Détail |
|--------|--------|
| **Probabilité** | MOYENNE (40%) |
| **Impact** | CRITIQUE - Déploiement impossible |
| **Cause** | Ajout de modules sans tree shaking |
| **Mitigation** | Monitoring taille à chaque commit |
| **Contingence** | Code splitting urgent, lazy loading |

#### R3: Perte de fonctionnalité non documentée
| Aspect | Détail |
|--------|--------|
| **Probabilité** | HAUTE (60%) |
| **Impact** | MAJEUR - Features cassées silencieusement |
| **Cause** | Edge cases gérés sans commentaires |
| **Mitigation** | Golden files API, tests utilisateurs IGP |
| **Contingence** | Restaurer ancien code, documenter |

---

### 🟡 Risques MOYENS

#### R4: Timeline dépassée
| Aspect | Détail |
|--------|--------|
| **Probabilité** | HAUTE (80%) |
| **Impact** | MOYEN - Retard commercialisation |
| **Cause** | Complexité sous-estimée, scope creep |
| **Mitigation** | Phases courtes, revues hebdomadaires |
| **Contingence** | Prioriser, couper le scope |

#### R5: Motivation / Burnout
| Aspect | Détail |
|--------|--------|
| **Probabilité** | MOYENNE (50%) |
| **Impact** | MOYEN - Abandon du projet |
| **Cause** | Travail ingrat sans résultats visibles |
| **Mitigation** | Petites victoires, métriques visibles |
| **Contingence** | Pause, déléguer, réduire scope |

#### R6: Conflits de merge
| Aspect | Détail |
|--------|--------|
| **Probabilité** | MOYENNE (40%) |
| **Impact** | MOYEN - Temps perdu en résolution |
| **Cause** | Refactoring pendant que features ajoutées |
| **Mitigation** | Feature freeze strict pendant refactoring |
| **Contingence** | Branches courtes, merge fréquent |

---

### 🟢 Risques FAIBLES

#### R7: Performance dégradée
| Aspect | Détail |
|--------|--------|
| **Probabilité** | BASSE (20%) |
| **Impact** | MOYEN - UX ralentie |
| **Cause** | Plus de modules = plus d'imports |
| **Mitigation** | Benchmarks avant/après |
| **Contingence** | Optimisation ciblée |

#### R8: Dette technique transférée
| Aspect | Détail |
|--------|--------|
| **Probabilité** | MOYENNE (50%) |
| **Impact** | FAIBLE - Même problème, fichiers différents |
| **Cause** | Copier-coller sans refactorer la logique |
| **Mitigation** | Revue de code, règle 500 lignes max |
| **Contingence** | Phase 2 de refactoring |

---

## 🛡️ Matrice des Risques

```
IMPACT
  ^
  |  R2        R1,R3
  |  (Bundle)  (Régression)
C |
R |
I |     R4,R5,R6    R7
T |     (Timeline)  (Perf)
I |
Q |          R8
U |          (Dette)
E |
  +-------------------------> PROBABILITÉ
     BASSE    MOYENNE    HAUTE
```

---

## 🚨 Règles de Survie

### 1. Jamais de "Big Bang"
```
❌ "Je vais réécrire tout le système d'auth ce weekend"
✅ "Je vais extraire la fonction validateToken dans auth/tokens.ts"
```

### 2. Un changement = Un commit = Un test
```
❌ Commit: "Refactored everything"
✅ Commit: "Extract: chat/messages.ts from chat.ts (handleSendMessage)"
```

### 3. Feature Freeze pendant refactoring
```
❌ "Tant qu'on y est, ajoutons cette feature..."
✅ "On stabilise d'abord, features après"
```

### 4. Rollback facile
```
- Garder l'ancien code commenté pendant 1 semaine
- Si ça casse en prod → git revert immédiat
- Branches de feature courtes (<3 jours)
```

### 5. Métriques obligatoires
```
Avant chaque merge:
- [ ] Bundle size < précédent ou justifié
- [ ] Tests passent
- [ ] Pas de console.log oublié
- [ ] Fichier < 500 lignes
```

---

## 📅 Timeline Réaliste

| Phase | Durée | Effort/semaine | Heures totales |
|-------|-------|----------------|----------------|
| Phase 1: Stabilisation | 2-3 sem | 10-15h | 20-45h |
| Phase 2: Backend | 4-6 sem | 15-20h | 60-120h |
| Phase 3: Frontend | 4-6 sem | 15-20h | 60-120h |
| Phase 4: Bundle | 2-3 sem | 10-15h | 20-45h |
| **Total** | **12-18 sem** | **~15h/sem** | **160-330h** |

---

## ✅ Checklist de Démarrage

### Avant de commencer Phase 1
- [ ] Ce document est relu et approuvé
- [ ] IGP est prévenu (possible instabilité mineure)
- [ ] Backup complet de la DB production
- [ ] Branch `refactoring/phase-1` créée
- [ ] Métriques baseline capturées

### Critères de succès Phase 1
- [ ] 20 parcours critiques documentés
- [ ] 10+ tests E2E fonctionnels
- [ ] Golden files API générées
- [ ] Carte des dépendances créée
- [ ] Zéro régression en production

---

## 📝 Journal de Refactoring

### [Date] - Entrée template
```
**Phase:** X
**Fichier:** example.ts
**Action:** Extract function X to module Y
**Lignes avant:** XXX
**Lignes après:** XXX
**Tests:** ✅ Passent / ❌ Échec
**Bundle:** XXX KB (+/- X KB)
**Notes:** ...
```

---

## 🔗 Références

- [Strangler Fig Pattern](https://martinfowler.com/bliki/StranglerFigApplication.html)
- [Working Effectively with Legacy Code](https://www.oreilly.com/library/view/working-effectively-with/0131177052/)
- [Refactoring: Improving the Design of Existing Code](https://refactoring.com/)

---

*Ce document doit être mis à jour à chaque phase complétée.*
