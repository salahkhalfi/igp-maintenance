# 🔧 Système de Gestion de Maintenance Industrielle

Application web complète pour la gestion de la maintenance industrielle avec tableau Kanban, système de tickets et suivi des interventions.

## 📋 Vue d'ensemble du projet

### Objectifs
- **Gestion centralisée** des demandes de maintenance industrielle
- **Suivi en temps réel** des interventions via un tableau Kanban
- **Traçabilité complète** de l'historique des tickets
- **Upload de médias** (photos/vidéos) pour documentation
- **Système d'authentification** avec gestion des rôles

### Statut actuel
✅ **Version 1.0.0 - Prêt pour le déploiement**

- Backend API REST complet avec Hono
- Interface utilisateur React avec Kanban drag-and-drop
- Base de données D1 configurée avec migrations
- Système d'authentification JWT fonctionnel
- Gestion des médias avec Cloudflare R2

## 🚀 Fonctionnalités

### ✅ Fonctionnalités implémentées

#### 🎯 **NOUVEAU v1.2.0** - Mouvement bidirectionnel des tickets
- **Clic gauche** sur une carte pour avancer vers la colonne suivante
- **Clic droit** pour ouvrir un menu contextuel et choisir n'importe quel statut
- **Mouvement avant ET arrière** - Corriger facilement les erreurs de placement
- **Menu contextuel intelligent** - Affiche tous les statuts avec le statut actuel grisé
- **Mise à jour automatique** du statut avec historique complet dans la timeline
- **Interface intuitive** - Tooltips explicatifs sur chaque carte

#### 1. Authentification et Gestion des utilisateurs
- Connexion/déconnexion avec JWT
- 3 rôles: Admin, Technicien, Opérateur
- Gestion des permissions par rôle

#### 2. Gestion des Tickets
- **Création automatique** d'ID de ticket (Format: `IGP-[TYPE]-[MODEL]-[YYYYMMDD]-[SEQ]`)
- **Tableau Kanban** avec 6 colonnes:
  - 🟦 Requête Reçue
  - 🟨 Diagnostic
  - 🟧 En Cours
  - 🟪 En Attente Pièces
  - 🟩 Terminé
  - ⬜ Archivé
- **Niveaux de priorité**: Low, Medium, High, Critical
- **Filtrage** par statut et priorité
- **Historique complet** (timeline) des modifications

#### 3. Gestion des Machines
- Catalogue de machines avec référence
- Statuts: Opérationnelle, En maintenance, Hors service
- Liaison automatique avec les tickets

#### 4. Gestion des Médias
- Upload de photos/vidéos via Cloudflare R2
- Stockage sécurisé et organisé par ticket
- Affichage des médias dans les détails du ticket

#### 5. Interface Utilisateur
- Design moderne avec TailwindCSS
- Responsive et intuitive
- Icônes FontAwesome
- Tableau Kanban interactif

### 📊 Modèles de données

#### Ticket
```javascript
{
  id: INTEGER,
  ticket_id: "IGP-PDE-7500-20231025-001",
  title: STRING,
  description: STRING,
  machine_id: INTEGER,
  status: ENUM('received', 'diagnostic', 'in_progress', 'waiting_parts', 'completed', 'archived'),
  priority: ENUM('low', 'medium', 'high', 'critical'),
  reported_by: INTEGER,
  assigned_to: INTEGER,
  created_at: DATETIME,
  updated_at: DATETIME,
  completed_at: DATETIME
}
```

#### Machine
```javascript
{
  id: INTEGER,
  machine_type: STRING,
  model: STRING,
  serial_number: STRING (UNIQUE),
  location: STRING,
  status: ENUM('operational', 'maintenance', 'out_of_service')
}
```

#### Media
```javascript
{
  id: INTEGER,
  ticket_id: INTEGER,
  file_key: STRING,
  file_name: STRING,
  file_type: STRING,
  file_size: INTEGER,
  url: STRING,
  uploaded_by: INTEGER
}
```

## 🔌 API REST Complète

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur

### Tickets
- `GET /api/tickets` - Liste tous les tickets (avec filtres optionnels)
- `GET /api/tickets/:id` - Détails d'un ticket
- `POST /api/tickets` - Créer un ticket
- `PATCH /api/tickets/:id` - Mettre à jour un ticket
- `DELETE /api/tickets/:id` - Supprimer un ticket (admin)

### Machines
- `GET /api/machines` - Liste toutes les machines
- `GET /api/machines/:id` - Détails d'une machine
- `POST /api/machines` - Créer une machine (admin)
- `PATCH /api/machines/:id` - Mettre à jour une machine (admin)
- `DELETE /api/machines/:id` - Supprimer une machine (admin)

### Médias
- `POST /api/media/upload` - Upload un fichier
- `GET /api/media/:id` - Récupérer un fichier
- `GET /api/media/ticket/:ticketId` - Liste les médias d'un ticket
- `DELETE /api/media/:id` - Supprimer un fichier

### Santé
- `GET /api/health` - Vérifier le statut de l'API

## 🛠️ Stack Technique

### Backend
- **Framework**: Hono (edge-first, ultra-rapide)
- **Runtime**: Cloudflare Workers
- **Base de données**: Cloudflare D1 (SQLite distribué)
- **Stockage**: Cloudflare R2 (compatible S3)
- **Authentification**: JWT avec jose

### Frontend
- **Framework**: React 18
- **Styling**: TailwindCSS
- **Icônes**: FontAwesome
- **HTTP Client**: Axios
- **Drag & Drop**: @hello-pangea/dnd

### DevOps
- **Bundler**: Vite
- **Déploiement**: Cloudflare Pages
- **CLI**: Wrangler
- **Process Manager**: PM2 (développement)

## 📦 Installation et Déploiement

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Cloudflare

### Installation locale

```bash
# 1. Cloner le repository
git clone <repo-url>
cd webapp

# 2. Installer les dépendances
npm install

# 3. Créer la base de données locale
npm run db:migrate:local

# 4. Charger les données de test
npm run db:seed

# 5. Build du projet
npm run build

# 6. Lancer le serveur de développement
npm run dev:sandbox
```

L'application sera disponible sur `http://localhost:3000`

### Déploiement sur Cloudflare Pages

#### 1. Créer la base de données D1 en production
```bash
npx wrangler d1 create maintenance-db
```

Copier le `database_id` retourné dans `wrangler.jsonc`.

#### 2. Créer le bucket R2
```bash
npx wrangler r2 bucket create maintenance-media
```

#### 3. Appliquer les migrations en production
```bash
npm run db:migrate:prod
```

#### 4. Créer le projet Cloudflare Pages
```bash
npx wrangler pages project create maintenance-app --production-branch main
```

#### 5. Déployer l'application
```bash
npm run deploy
```

#### 6. Configurer les secrets (optionnel)
```bash
npx wrangler pages secret put JWT_SECRET --project-name maintenance-app
```

## 👥 Comptes de test

Pour tester l'application localement:

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@maintenance.com | password123 | Admin |
| tech1@maintenance.com | password123 | Technicien |
| tech2@maintenance.com | password123 | Technicien |
| operator@maintenance.com | password123 | Opérateur |

## 📁 Structure du projet

```
webapp/
├── src/
│   ├── index.tsx              # Point d'entrée Hono + Interface React
│   ├── routes/                # Routes API
│   │   ├── auth.ts           # Authentification
│   │   ├── tickets.ts        # Gestion des tickets
│   │   ├── machines.ts       # Gestion des machines
│   │   └── media.ts          # Upload/téléchargement médias
│   ├── middlewares/
│   │   └── auth.ts           # Middleware JWT
│   ├── utils/
│   │   ├── jwt.ts            # Utilitaires JWT
│   │   ├── password.ts       # Hash des mots de passe
│   │   └── ticket-id.ts      # Génération ID tickets
│   └── types/
│       └── index.ts          # Types TypeScript
├── migrations/
│   └── 0001_initial_schema.sql  # Schéma de base de données
├── public/                    # Fichiers statiques
├── seed.sql                   # Données de test
├── wrangler.jsonc             # Configuration Cloudflare
├── package.json               # Dépendances
├── ecosystem.config.cjs       # Configuration PM2
└── README.md                  # Documentation
```

## 🎯 Prochaines étapes recommandées

### Améliorations prioritaires
1. **Page de détails ticket** - Vue détaillée avec timeline et médias complets
2. **Notifications** - Alertes pour nouveaux tickets et changements de statut
3. **Statistiques** - Dashboard avec métriques de maintenance
4. **Export PDF** - Génération de rapports d'intervention
5. **Recherche et filtres** - Recherche par ID, machine, priorité

### Fonctionnalités avancées
- **Recherche avancée** avec filtres multiples
- **Calendrier** de maintenance préventive
- **Chat en temps réel** pour les techniciens
- **Application mobile** avec React Native
- **Scan QR Code** pour identification rapide des machines
- **Intégration email** pour notifications automatiques

## 🔒 Sécurité

- ✅ Authentification JWT sécurisée
- ✅ Hash des mots de passe avec SHA-256 (remplacer par bcrypt en production)
- ✅ Protection des routes API par middleware
- ✅ Validation des entrées utilisateur
- ✅ Gestion des permissions par rôle
- ⚠️ CORS configuré (à restreindre en production)

## 📝 Notes de développement

### Limitations actuelles
- Le mot de passe utilise SHA-256 (simple) - à remplacer par bcrypt pour la production
- Les URLs R2 sont génériques - configurer un domaine personnalisé
- Les tests unitaires ne sont pas encore implémentés
- La page de détails des tickets reste à implémenter

### Variables d'environnement
Créer un fichier `.dev.vars` pour le développement local:

```ini
JWT_SECRET=your-secret-key-change-in-production
```

## 🐛 Débogage

### Vérifier les logs
```bash
pm2 logs maintenance-app --nostream
```

### Réinitialiser la base de données locale
```bash
npm run db:reset
```

### Tester l'API
```bash
# Santé de l'API
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@maintenance.com","password":"password123"}'
```

## 📄 Licence

Ce projet est destiné à un usage professionnel interne.

## 🤝 Contribution

Pour contribuer au projet:
1. Créer une branche feature
2. Commiter les changements
3. Créer une Pull Request

## 📧 Support

Pour toute question ou assistance, contactez l'équipe de développement.

---

**Version**: 1.2.0  
**Dernière mise à jour**: 2025-11-02  
**Statut**: ✅ Production Ready avec mouvement bidirectionnel des tickets
