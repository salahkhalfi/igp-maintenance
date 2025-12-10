# STRUCTURE DU PROJET (IGP MAINTENANCE)

Ce document est la carte de référence pour l'architecture du projet.
**Source de vérité absolue pour tout développement.**

**⚖️ LOI & RÈGLES :** `docs/archive/bible.md` (À LIRE ABSOLUMENT)

---

## 1. VUE D'ENSEMBLE

Le projet est un écosystème d'applications servi par un Backend unique (Cloudflare Pages/Hono).

| Application | URL | Type | Entrée (Source) | Build / Serveur |
| :--- | :--- | :--- | :--- | :--- |
| **Maintenance (Core)** | `/` | SPA (Legacy React) | `src/views/home.ts` + `public/static/js/components/MainApp.js` | Hono (HTML String) |
| **IGP Connect (Messenger)** | `/messenger/` | PWA (Vite + React) | `src/messenger/index.html` | Vite Build (`dist/messenger`) |
| **TV Broadcast** | `/tv` | Page Statique | `src/views/tv.ts` + `public/tv.html` | Hono (HTML String) |
| **Planning & Production** | `/planning` (Virtuel) | Module (Modal) | `ProductionPlanning_v3.js` dans Main App | Intégré dans Maintenance (Core) |

---

## 2. DÉTAILS DES COMPOSANTES

### A. Maintenance (Core App)
L'application principale pour les techniciens et superviseurs.
*   **Technologie** : React (Global scope, sans bundler moderne), chargé via `<script>` dans `homeHTML`.
*   **Fichier Maître** : `src/views/home.ts` (Définit le HTML shell et les chargements de scripts).
*   **Point d'Entrée JS** : `public/static/js/components/MainApp.js`.
*   **Composants** : `public/static/js/components/*.js`.
*   **Routing** : Géré par `MainApp.js` (État React) et non par URL (sauf deep linking basique `?ticket=...`).
*   **Note** : Le dossier `src/client/` contient une version "Refonte Moderne" (Vite) qui n'est **PAS** active en production sur la racine `/`.

### B. IGP Connect (Messenger)
Module de communication isolé et moderne.
*   **Technologie** : React + Vite + TypeScript.
*   **Source** : `src/messenger/`.
*   **Build** : `npm run build:messenger`.
*   **Sortie** : `dist/messenger/`.
*   **Assets** : Utilise `public/messenger/` pour les icônes (copiés manuellement au build).

### C. Planning & Production
Outil de planification intégré.
*   **Type** : "Module" (Grosse Modale) intégré dans l'App Maintenance.
*   **Source** : `public/static/js/components/ProductionPlanning_v3.js`.
*   **Affichage** : Activé par le bouton "Planning" dans `AppHeader.js`.
*   **Données** : API `src/routes/planning.ts`.

### D. TV Broadcast
Affichage passif pour écrans d'usine.
*   **Source** : `src/views/tv.ts` (Logique Hono) et `src/views/tv-admin.ts`.
*   **Frontend** : `public/tv.html` (JS vanilla intégré).

---

## 3. STRUCTURE DES FICHIERS CLÉS

```
/home/user/webapp/
├── public/                  # Fichiers statiques (servis tels quels)
│   ├── static/js/           # JS de l'App Legacy (Maintenance)
│   │   └── components/      # Composants React Legacy (MainApp.js, KanbanBoard.js...)
│   ├── messenger/           # Assets pour IGP Connect
│   └── tv.html              # Vue TV
│
├── src/                     # Code Source Backend & Modern Frontend
│   ├── index.tsx            # Routeur Hono Principal (API + Views)
│   ├── views/               # Vues HTML (home.ts, guide.ts...)
│   ├── routes/              # API Routes (tickets.ts, planning.ts, chat.ts...)
│   ├── messenger/           # Source IGP Connect (PWA Moderne)
│   └── client/              # Source Maintenance V2 (Non déployé en prod)
│
├── dist/                    # Dossier de Production (Généré par Build)
│   ├── static/              # Assets copiés
│   ├── messenger/           # PWA compilée
│   ├── _worker.js           # Backend compilé
│   └── _routes.json         # config Cloudflare
│
├── package.json             # Scripts de build (build:messenger vital)
├── vite.messenger.config.ts # Config build IGP Connect
└── wrangler.jsonc           # Config Cloudflare Pages
```

## 4. PIPELINE DE DÉPLOIEMENT

1.  **Build** : `npm run build`
    *   Compile le Backend Hono (`_worker.js`).
    *   Compile IGP Connect (`build:messenger`).
    *   Copie les assets statiques.
2.  **Attention Spéciale (Messenger)** :
    *   Le script doit copier explicitement `public/messenger/messenger-icon*.png` vers `dist/messenger/`.
3.  **Déploiement** : `wrangler pages deploy dist`.

---
**Dernière mise à jour** : 2025-12-10 (Validation Architecture Complète)
