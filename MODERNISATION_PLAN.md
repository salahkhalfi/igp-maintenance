# Plan de Modernisation MaintenanceOS (Post-Bridge)
**Date :** 20 décembre 2025
**Statut actuel :** Stable (v3.1.0-stable-bridge)
**Contexte :** L'application fonctionne grâce à un "Bridge" qui fait cohabiter le code Legacy (JS/CDN) et le code Moderne (TS/Vite).

---

## 🚨 Diagnostic : L'Architecture "Split-Brain"

Nous avons actuellement deux cœurs qui battent :
1.  **Legacy (`public/static/js`)** : Gère l'affichage principal (Kanban, Header). Non typé, fragile.
2.  **Moderne (`src/client`)** : Gère les nouvelles modales (Users, Machines). Typé, robuste.

**Dette Technique Critique :**
- Utilisation mixte de `fetch()` manuel (dangereux) et `client.api` (sûr).
- Dépendance à `window` pour la communication entre composants.
- Risque élevé de régression à chaque modification du Legacy.

---

## 🗺️ Roadmap de Modernisation (Méthode de l'Étrangleur)

L'objectif est de remplacer le Legacy morceau par morceau jusqu'à suppression totale du Bridge.

### ✅ Phase 0 : Stabilisation (FAIT)
- [x] Sécuriser le fetching de données (Array checks).
- [x] Isoler le Legacy dans un composant Bridge.
- [x] Moderniser User & Machine Management.

### 🏗️ Phase 1 : Standardisation de la Donnée (PRIORITÉ 1)
**Objectif :** Supprimer tous les `fetch()` manuels du frontend.
- [ ] Créer des Hooks React Query typés pour chaque ressource (Tickets, Machines, Users).
- [ ] Utiliser exclusivement `client` (Hono RPC) dans ces hooks.
- [ ] Valider les réponses API avec Zod (Schémas partagés).

### 🧱 Phase 2 : Migration des Composants UI
**Objectif :** Remplacer les composants visuels Legacy par des versions React/TS.
1.  **AppHeader** : Migrer `AppHeader.js` -> `src/client/components/AppHeader.tsx`.
2.  **Filtres & Toggles** : Migrer la logique de filtre hors de `MainApp.js`.
3.  **KanbanBoard** : Le gros morceau. Réécrire en utilisant `@dnd-kit` ou garder la logique actuelle mais en TSX.

### 🧹 Phase 3 : Suppression du Legacy
**Objectif :** `App.tsx` devient le seul point d'entrée.
- [ ] Supprimer `MainApp.js`.
- [ ] Supprimer le "Bridge" dans `App.tsx`.
- [ ] Nettoyer `index.html` (retirer les balises `<script>` CDN).
- [ ] Supprimer le dossier `public/static/js`.

### ✅ Phase 4 : Intelligence Dynamique & SaaS-ification (FAIT)
**Objectif :** Rendre l'IA (Expert & Création Ticket) totalement agnostique et pilotée par la base de données. Aucune constante métier dans le code.

1.  **Context Injection (RAG léger) :**
    - [x] Les routes API (`src/routes/ai.ts`, `src/routes/chat.ts`) lisent le contexte avant d'appeler le LLM.
    - [x] **Process :** Construction du *System Prompt* via `buildDynamicContext(c.env.DB)`.
    - [x] **Zéro Hardcoding :** Utilisation de `getAiConfig` pour les prompts stockés en DB.

2.  **Gestion des Clés API (BYOK - Bring Your Own Key) :**
    - [x] Implémentation de `getApiKeys` pour prioriser les clés DB (`system_settings`) sur les vars d'environnement.
    - [x] Création des endpoints `/api/settings/api-keys` pour la gestion admin sécurisée.

3.  **Zéro Hardcoding :**
    - [x] Tout texte spécifique (Règles, Identité IA) est chargé depuis `system_settings`.

---

## 📝 Guide pour le Prochain Agent

**Si vous devez travailler sur ce projet :**

1.  **NE TOUCHEZ PAS À `MainApp.js`** sauf urgence absolue. C'est du code Legacy fragile.
2.  **Pour toute nouvelle feature :** Créez-la dans `src/client/components`.
3.  **Pour modifier l'existant :** Vérifiez si le composant existe déjà en version moderne. Si non, migrez-le d'abord.
4.  **Data Fetching :**
    *   ❌ INTERDIT : `const res = await fetch('/api/...')`
    *   ✅ OBLIGATOIRE : `const res = await client.api.resource.$get()`

**Commande de départ recommandée :**
`"Commence la Phase 1 du plan MODERNISATION_PLAN.md : Standardisation des Hooks de données."`

---

## 🔥 PROTOCOL_PHOENIX (Activation de la Phase Finale)

Si l'utilisateur invoque `"PROTOCOL_PHOENIX"`, voici la procédure stricte à suivre pour terminer la modernisation sans casser la production.

### 1. État des Lieux (Le "Mur")
Nous avons buté sur deux obstacles majeurs lors de la dernière tentative :
1.  **Régression Visuelle du Kanban :** Le nouveau Kanban React était "plat" et moche comparé au Legacy (Glassmorphism, ombres).
2.  **Le Composant Fantôme (`TicketDetailsModal.tsx`) :** Ce fichier existe et semble complet (IA, Vocal), mais il a échoué silencieusement lors de l'intégration. Cause probable : services (`ticketService.ts`) déconnectés ou buggés.

### 2. Plan d'Attaque (Ordre Immuable)

#### Étape A : Réparation du "Cadavre" (TicketDetailsModal)
Ne pas l'intégrer tant qu'il n'est pas testé.
1.  Vérifier/Créer `src/client/hooks/useTicketDetails.ts` (en utilisant `client` RPC, pas `fetch`).
2.  Remplacer les appels à `ticketService` dans `TicketDetailsModal.tsx` par ce nouveau hook.
3.  Créer une route de test (`/test-modal`) pour valider le composant isolément avant de le brancher sur le Kanban.

#### Étape B : Kanban "High Fidelity"
1.  Recréer `KanbanBoard.tsx` et `TicketCard.tsx` en copiant **strictement** les classes CSS du fichier `styles.css` global (ne pas essayer de tout traduire en Tailwind).
2.  Utiliser `className="ticket-card ..."` pour hériter automatiquement du style Legacy.

#### Étape C : Bascule (Switch)
1.  Une fois A et B validés, réactiver `hideKanban={true}` dans le Bridge.
2.  Afficher le nouveau Kanban.

---

## 🧠 Phase 4 : Intelligence Dynamique & SaaS-ification (CRITIQUE)

**Objectif :** Rendre l'IA (Expert & Création Ticket) totalement agnostique et pilotée par la base de données. Aucune constante métier dans le code.

1.  **Context Injection (RAG léger) :**
    *   Les routes API (`src/routes/ai.ts`, `src/routes/chat.ts`) DOIVENT lire le contexte avant d'appeler le LLM.
    *   **Input :** `company_title`, `ai_custom_context` (règles métier), liste simplifiée des machines.
    *   **Process :** Construire le *System Prompt* dynamiquement à chaque requête.
    *   ❌ INTERDIT : `const SYSTEM_PROMPT = "Tu es un expert chez IGP..."`
    *   ✅ OBLIGATOIRE : `const systemPrompt = await buildDynamicContext(c.env.DB);`

2.  **Gestion des Clés API (BYOK - Bring Your Own Key) :**
    *   Préparer une table sécurisée (`api_keys`) ou utiliser `system_settings` (crypté) pour stocker les clés OpenAI/DeepSeek/Groq des clients.
    *   L'application ne doit plus dépendre des variables d'environnement (`.dev.vars`) pour la production multi-tenant.

3.  **Zéro Hardcoding :**
    *   Tout texte spécifique à une entreprise (Titre, Slogan, Règles de sécurité) doit être une entrée dans `system_settings`.
    *   L'UI et l'IA doivent consommer ces valeurs via les Hooks RPC (`useSettings`).

---

## 🎨 Design & UI (LESSONS LEARNED)

**⚠️ ATTENTION : RÈGLE D'OR POUR LA MIGRATION UI**

Lors de la tentative de migration du Kanban (Phase 3), une régression visuelle majeure a été constatée. Le code moderne (Tailwind standard) est apparu "plat" et "froid" comparé au code Legacy "Premium".

**Règles strictes pour les futures migrations :**

1.  **Glassmorphism Obligatoire :** Ne JAMAIS remplacer les styles CSS custom (`backdrop-filter`, `rgba(255,255,255,0.6)`) par des classes utilitaires simples (`bg-white`). L'effet de transparence/flou est l'identité visuelle de l'app.
2.  **Classes CSS Legacy :** Les composants React DOIVENT réutiliser les classes existantes (`.ticket-card`, `.kanban-column`) définies dans `styles.css` plutôt que de tout réécrire en Tailwind pur.
3.  **Poids des Icônes :** Les icônes `Lucide` (filaires/fines) ne rendent pas aussi bien que `FontAwesome` (pleines/lourdes) dans ce contexte industriel.
    *   *Solution :* Soit garder FontAwesome, soit styliser Lucide avec `stroke-width={2.5}` et des couleurs vives pour matcher l'impact visuel.
4.  **Respecter les Ombres :** Les ombres portées du Legacy (`box-shadow` complexes) donnent la profondeur. Ne pas les simplifier.

**En résumé :** Moderniser le *Code* (React/TS), pas le *Look* (CSS). Le design actuel est validé et apprécié.
