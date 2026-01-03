# CLAUDE.md - Guide pour l'assistant IA

> Ce fichier aide les assistants IA à comprendre rapidement le projet sans exploration extensive.
> **Dernière mise à jour** : 2 janvier 2026

---

## Aperçu du projet

**Nom** : IGP Maintenance App  
**Version** : 3.0.0-beta.4  
**Description** : Système de gestion de maintenance industrielle pour Les Produits Verriers International (IGP) Inc.  
**Langue** : Français québécois (toute l'interface et les messages)  
**Auteur** : Salah-Eddine KHALFI  

---

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| **Backend** | Hono.js (Cloudflare Workers) |
| **Base de données** | Cloudflare D1 (SQLite) |
| **ORM** | Drizzle ORM |
| **Validation** | Zod |
| **Storage fichiers** | Cloudflare R2 |
| **Frontend Legacy** | React via CDN (pas de bundler) |
| **Frontend Messenger** | Vite + React + TypeScript |
| **CSS** | Tailwind CSS |
| **Auth** | JWT + Cookies HttpOnly |
| **Déploiement** | Cloudflare Pages |

---

## Structure des dossiers

```
/src
├── /routes          # API endpoints (Hono)
│   ├── ai.ts        # Secrétaire IA, analyse tickets
│   ├── auth.ts      # Login, logout, JWT
│   ├── chat.ts      # Chat temps réel
│   ├── machines.ts  # CRUD machines
│   ├── tickets.ts   # CRUD tickets
│   ├── users.ts     # Gestion utilisateurs
│   ├── settings.ts  # Paramètres système
│   └── ...
├── /ai
│   └── /secretary
│       ├── /brains  # Cerveaux spécialisés
│       │   ├── correspondance.ts  # Lettres officielles
│       │   ├── rapports.ts        # Rapports maintenance
│       │   ├── rh.ts              # Documents RH
│       │   ├── technique.ts       # Documentation technique
│       │   ├── subventions.ts     # Demandes subventions
│       │   └── creatif.ts         # Communications
│       ├── shared.ts   # Fonctions partagées (buildCompanyBlock, etc.)
│       └── types.ts    # Types TypeScript
├── /db
│   ├── schema.ts    # Schéma Drizzle (tables)
│   └── index.ts     # Connexion DB
├── /schemas         # Validation Zod
│   ├── users.ts
│   ├── tickets.ts
│   ├── machines.ts
│   └── ...
├── /middlewares
│   └── auth.ts      # authMiddleware, adminOnly, supervisorOrAdmin, etc.
├── /services        # Services métier (RoleService, etc.)
├── /utils           # Utilitaires (jwt, password, permissions)
├── /views           # Templates HTML (SSR)
│   └── home.ts      # Page principale
├── /messenger       # App Messenger (Vite)
│   ├── /components
│   └── index.tsx
└── index.ts         # Point d'entrée Hono

/public
├── /static
│   ├── /js
│   │   ├── /components  # Composants React legacy (.js)
│   │   └── /dist        # Fichiers minifiés (.min.js)
│   └── styles.css       # CSS compilé (Tailwind)
└── /messenger           # Assets PWA Messenger

/migrations              # Migrations SQL D1
/dist                    # Build output (ne pas modifier)
```

---

## Commandes essentielles

```bash
# Développement
npm run dev              # Serveur Vite (frontend seulement)
npm run dev:sandbox      # Serveur complet avec Wrangler (port 3000)

# Build
npm run build            # Build worker + messenger
npm run build:full       # CSS + minify + build complet

# Base de données
npm run db:migrate:local # Appliquer migrations localement
npm run db:migrate:prod  # Appliquer migrations en production
npm run db:seed          # Seed data initiale

# Déploiement
npm run deploy:safe      # Build + migrations + deploy Cloudflare
```

---

## Conventions importantes

### Langue
- **Toujours en français** pour les messages utilisateur
- Messages d'erreur Zod en français : `"Format email invalide"`, `"Prénom trop court"`
- Commentaires code : français ou anglais acceptés

### Validation Zod
- Toujours utiliser `.nullable()` si le frontend peut envoyer `null`
- Exemple : `ai_context: z.string().optional().nullable().or(z.literal(''))`

### Authentification
- JWT stocké dans cookie HttpOnly `auth_token`
- Fallback : header `Authorization: Bearer <token>`
- Middlewares : `authMiddleware`, `adminOnly`, `supervisorOrAdmin`

### Rôles système (14 rôles)
```typescript
const validRoles = [
  'admin', 'director', 'supervisor', 'coordinator', 'planner',
  'senior_technician', 'technician', 'team_leader', 'furnace_operator',
  'operator', 'safety_officer', 'quality_inspector', 'storekeeper', 'viewer'
];
```

### Frontend Legacy
- Fichiers dans `/public/static/js/components/*.js`
- Utilise React via CDN (pas d'import/export)
- Composants exposés sur `window` : `window.CreateUserForm = CreateUserForm`
- **Toujours minifier après modification** : `npm run build:minify`

---

## Points d'attention

### Ne jamais faire
- Modifier directement les fichiers dans `/dist/`
- Oublier de rebuild après modification de `/src/`
- Envoyer `null` sans `.nullable()` dans les schémas Zod
- Utiliser `console.log` en production (préférer logs conditionnels)

### Toujours faire
- Tester le build avant commit : `npm run build`
- Vérifier les messages d'erreur en français
- Mettre à jour ce fichier si architecture change

---

## Base de données (tables principales)

| Table | Description |
|-------|-------------|
| `users` | Utilisateurs (auth, rôles, soft delete) |
| `tickets` | Tickets de maintenance |
| `machines` | Parc machines |
| `ticket_timeline` | Historique des actions sur tickets |
| `chat_conversations` | Conversations messenger |
| `chat_messages` | Messages |
| `roles` | Rôles RBAC |
| `permissions` | Permissions granulaires |
| `role_permissions` | Association rôles-permissions |
| `system_settings` | Paramètres (company_name, logo, etc.) |

---

## Paramètres système importants

Stockés dans `system_settings` (clé/valeur) :

| Clé | Description |
|-----|-------------|
| `company_name` | Nom officiel de l'entreprise |
| `company_subtitle` | Sous-titre / slogan |
| `company_address` | Adresse postale |
| `company_phone` | Téléphone |
| `company_email` | Email de contact |
| `app_base_url` | URL de base (https://app.igpglass.ca) |
| `ai_provider` | Provider IA (deepseek/openai) |
| `deepseek_api_key` | Clé API DeepSeek |
| `openai_api_key` | Clé API OpenAI |

---

## URLs de production

- **App principale** : https://app.igpglass.ca
- **Messenger** : https://app.igpglass.ca/messenger/
- **API** : https://app.igpglass.ca/api/*

---

## Dépannage courant

### Erreur 400 sur création utilisateur
→ Vérifier que tous les champs Zod acceptent `null` si nécessaire

### Frontend ne se met pas à jour
→ Vider cache navigateur + vérifier que `npm run build` a été fait

### Erreur D1 en production
→ Vérifier que les migrations sont appliquées : `npm run db:migrate:prod`

---

## Fichiers de documentation existants

| Fichier | Contenu |
|---------|---------|
| `README.md` | Documentation générale (très longue) |
| `BIBLE.md` | Règles métier et conventions |
| `CHANGELOG.md` | Historique des versions |
| `GUIDE-BUILD-DIST.md` | Guide de build |

---

## Maintenance quotidienne

### Commande rapide
```bash
npm run status    # Diagnostic complet en 3 secondes
```

Affiche :
- Version actuelle
- État du build
- Taille de la base locale
- Nombre de backups disponibles
- État Git (branche, fichiers modifiés)
- Sécurité (rate limiting actif ?)
- Documentation (CLAUDE.md présent ?)
- Nettoyage automatique (CRON configuré ?)

### Backups

```bash
npm run db:backup        # Sauvegarder la base locale
npm run db:list-backups  # Voir les backups disponibles
npm run db:restore       # Restaurer (avec confirmation)
./scripts/backup-db-remote.sh  # Sauvegarder la production
```

**Politique de rétention** :
- Backups locaux : 10 fichiers conservés
- Backups distants : 5 fichiers conservés

### Nettoyage automatique (CRON)

Le nettoyage s'exécute automatiquement chaque jour à 02:00 UTC :

| Table | Rétention |
|-------|-----------|
| `push_logs` | 7 jours |
| `pending_notifications` | 7 jours |
| `webhook_notifications` | 30 jours |
| `audit_logs` | 90 jours |
| `ticket_timeline` | 180 jours |
| `chat_messages` (médias) | 30 jours |
| `chat_messages` (texte) | 365 jours |

### Monitoring

```bash
# Statistiques d'utilisation DB (en production)
curl https://app.igpglass.ca/api/cron/storage-stats

# Forcer le nettoyage manuellement
curl -X POST https://app.igpglass.ca/api/cron/cleanup-logs
```

---

## Contact

Pour toute question sur le projet, contacter l'auteur : salah [at] khalfi [dot] com
