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
✅ **Version 1.7.0 - Prêt pour le déploiement**

- Backend API REST complet avec Hono
- Interface utilisateur React avec Kanban drag-and-drop
- Base de données D1 configurée avec migrations
- Système d'authentification JWT fonctionnel
- Gestion des médias avec Cloudflare R2
- **NOUVEAU v1.7.0**: Système de commentaires + Upload médias supplémentaires + Suppression de tickets
- Galerie de médias dans les détails de ticket + Scroll mobile corrigé
- Upload de photos/vidéos depuis mobile lors de la création de tickets

## 🚀 Fonctionnalités

### ✅ Fonctionnalités implémentées

#### 🎯 **NOUVEAU v1.4.0** - Drag-and-Drop natif (Desktop + Mobile)

##### 🖱️ Interface Desktop (Souris)
- **🎯 Drag & Drop natif** - Glisser-déposer les cartes entre colonnes avec la souris
- **Curseur intelligent** - Change automatiquement: pointer → grab → grabbing
- **Feedback visuel** - Carte semi-transparente pendant le drag, rotation légère
- **Zones de drop** - Colonnes surlignées en bleu avec bordure pointillée
- **Clic droit** - Menu contextuel en option pour sélection précise du statut

##### 📱 Interface Mobile/Tactile
- **👆 Touch Drag** - Glisser-déposer avec le doigt
- **Détection intelligente** - Identifie automatiquement la colonne sous le doigt
- **Feedback haptique** - Vibration lors du début du drag
- **Layout vertical** - Colonnes Kanban empilées pour faciliter le drag vertical
- **Boutons agrandis** - Taille minimale de 44px pour accessibilité tactile
- **Modal responsive** - Formulaires adaptés aux petits écrans

##### 🎨 Animations & Feedback
- **Carte en drag** - Opacité 50%, rotation 2°, curseur grabbing
- **Zone survol** - Fond bleu clair + bordure pointillée bleue
- **Transitions fluides** - 0.2s pour tous les changements d'état
- **Ombre dynamique** - Plus prononcée au survol, subtile au repos

##### 📐 Responsive Design
- **Mobile** (< 640px): Layout vertical, drag vertical naturel
- **Tablette** (640px - 1024px): Grille 2 colonnes, drag horizontal/vertical
- **Desktop** (> 1024px): Grille 6 colonnes, drag horizontal optimisé
- **Mouvement libre** - Déplacer vers n'importe quelle colonne en un geste
- **Mise à jour automatique** - Historique (timeline) enregistré à chaque drop

#### 🆕 **NOUVEAU v1.7.0** - Commentaires, médias supplémentaires et suppression

##### 💬 Système de commentaires collaboratif
- **Ajout de commentaires** - Opérateurs et techniciens peuvent ajouter des notes à tout moment
- **Nom libre** - Chaque personne entre son nom (pas de comptes fictifs)
- **Identification par rôle** - Badge visuel pour différencier Opérateur 👨‍💼 et Technicien 🔧
- **Timeline chronologique** - Liste de tous les commentaires avec horodatage
- **Mise en forme** - Bordure colorée selon le rôle (bleu pour opérateur, orange pour technicien)
- **Design responsive** - Zone de commentaires avec scroll indépendant (max 256px)

##### 📸 Upload de médias supplémentaires
- **Ajout ultérieur** - Possibilité d'ajouter photos/vidéos après création du ticket
- **Preview en grille** - Aperçu des fichiers sélectionnés avant upload
- **Suppression pré-upload** - Retirer un fichier de la sélection avant envoi
- **Upload multiple** - Envoyer plusieurs fichiers en une fois
- **Rechargement auto** - Galerie mise à jour automatiquement après upload
- **Stockage unifié** - Médias ajoutés stockés avec les médias originaux du ticket

##### 🗑️ Suppression de tickets
- **Bouton accessible** - Icône poubelle rouge dans l'en-tête du modal de détails
- **Confirmation obligatoire** - Dialog de confirmation pour éviter suppressions accidentelles
- **Suppression en cascade** - Médias et commentaires supprimés automatiquement
- **Rafraîchissement auto** - Liste de tickets mise à jour après suppression
- **Accès contrôlé** - Protégé par authentification JWT

##### 👤 Champ "Votre nom" personnalisé
- **Nom libre** - Plus de noms fictifs pré-remplis, chacun entre son vrai nom
- **Création de ticket** - Champ "Votre nom" obligatoire à la création
- **Commentaires** - Champ "Votre nom" à chaque ajout de commentaire
- **Traçabilité** - Chaque action identifiée par le nom réel de la personne
- **Affichage dans détails** - "Rapporté par: [Nom]" visible dans les informations du ticket

#### **v1.6.0** - Galerie de médias et corrections mobiles

##### 📸 Galerie de médias dans les détails
- **Clic sur ticket** - Cliquer sur n'importe quel ticket pour voir ses détails complets
- **Grille responsive** - Photos/vidéos en grille 2-4 colonnes selon l'écran
- **Lightbox plein écran** - Cliquer sur un média pour l'afficher en grand
- **Support vidéo** - Lecture vidéo avec contrôles intégrés
- **Indicateur de médias** - Badge "X photo(s)/vidéo(s)" sur les tickets avec médias
- **Info fichier** - Nom et taille affichés en overlay

##### 📱 Corrections mobile
- **Scroll complet** - Bouton de soumission maintenant accessible en bas du formulaire
- **Modal adaptatif** - Le modal s'ajuste correctement à toutes les tailles d'écran
- **Overflow corrigé** - Contenu long maintenant scrollable sans problème
- **Padding optimisé** - Espacement adapté pour mobile (10px) et desktop (20px)

#### **v1.5.0** - Upload de photos/vidéos mobile

##### 📸 Capture depuis mobile
- **Accès direct à la caméra** - Bouton "Prendre une photo ou vidéo" avec `capture="environment"`
- **Upload multiple** - Possibilité d'ajouter plusieurs médias à un ticket
- **Preview en temps réel** - Aperçu des photos/vidéos avant envoi
- **Barre de progression** - Indicateur visuel de l'upload en cours
- **Grille de miniatures** - Affichage en grille 3 colonnes avec info de taille
- **Suppression individuelle** - Bouton X au survol pour retirer un média
- **Support formats** - Images (JPEG, PNG, WebP) et vidéos (MP4, WebM)
- **Stockage R2** - Upload sécurisé vers Cloudflare R2 Storage
- **Organisation** - Médias organisés par ticket: `tickets/{ticketId}/{timestamp}-{filename}`

##### 🎯 Interface utilisateur
- **Bouton caméra** - Style IGP avec icône FontAwesome `fa-camera`
- **Bordure pointillée** - Zone de drop visuelle en bleu IGP
- **Preview grid** - Miniatures 24px de hauteur avec object-cover
- **Badges de fichier** - Type (📷/🎥) et taille (KB) affichés sur chaque média
- **Compteur** - Nombre de médias dans le bouton de soumission: "Créer le ticket (2 média(s))"
- **Progress upload** - "Upload: 50%" pendant l'envoi

##### 💡 Utilisation
1. Opérateur clique sur "Nouveau Ticket"
2. Remplit les informations (titre, description, machine, priorité)
3. Clique sur "Prendre une photo ou vidéo"
4. Caméra s'ouvre automatiquement sur mobile
5. Prend photo/vidéo du problème
6. Aperçu s'affiche dans grille 3 colonnes
7. Peut ajouter d'autres médias ou supprimer
8. Soumet le ticket - upload vers R2 en arrière-plan
9. Ticket créé avec médias attachés pour l'équipe maintenance

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
- **Design moderne** avec TailwindCSS
- **100% Responsive** - Desktop, tablette et mobile
- **Gestes tactiles** - Support complet du touch (tap, long-press)
- **Icônes FontAwesome** pour une meilleure lisibilité
- **Tableau Kanban interactif** avec animations fluides
- **Haptic feedback** - Vibration sur mobile pour meilleure UX
- **Auto-ajustement** - Menus et modals s'adaptent automatiquement à l'écran

### 📊 Modèles de données

#### Ticket
```javascript
{
  id: INTEGER,
  ticket_id: "IGP-PDE-7500-20231025-001",
  title: STRING,
  description: STRING,
  reporter_name: STRING,        // NOUVEAU v1.7.0
  machine_id: INTEGER,
  status: ENUM('received', 'diagnostic', 'in_progress', 'waiting_parts', 'completed', 'archived'),
  priority: ENUM('low', 'medium', 'high', 'critical'),
  reported_by: INTEGER,
  assigned_to: INTEGER,
  assignee_name: STRING,        // NOUVEAU v1.7.0
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

#### Comment (NOUVEAU v1.7.0)
```javascript
{
  id: INTEGER,
  ticket_id: INTEGER,
  user_name: STRING,
  user_role: STRING,
  comment: TEXT,
  created_at: DATETIME
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
- `GET /api/media/:id` - Récupérer un fichier (PUBLIC)
- `GET /api/media/ticket/:ticketId` - Liste les médias d'un ticket
- `DELETE /api/media/:id` - Supprimer un fichier

### Commentaires
- `POST /api/comments` - Ajouter un commentaire à un ticket
- `GET /api/comments/ticket/:ticketId` - Liste les commentaires d'un ticket

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
| admin@igpglass.ca | password123 | Admin |
| technicien@igpglass.ca | password123 | Technicien Martin Tremblay |
| technicien2@igpglass.ca | password123 | Technicienne Sophie Gagnon |
| operateur@igpglass.ca | password123 | Opérateur Jean Dubois |

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
│   ├── 0001_initial_schema.sql  # Schéma de base de données
│   ├── 0002_add_comments.sql    # Table des commentaires (v1.7.0)
│   └── 0003_add_reporter_name.sql  # Noms libres (v1.7.0)
├── public/                    # Fichiers statiques
├── seed.sql                   # Données de test
├── wrangler.jsonc             # Configuration Cloudflare
├── package.json               # Dépendances
├── ecosystem.config.cjs       # Configuration PM2
└── README.md                  # Documentation
```

## 🎯 Prochaines étapes recommandées

### Améliorations prioritaires
1. **Compression d'images client-side** - Réduire la taille avant upload pour économiser bande passante
2. **Validation de taille de fichiers** - Limiter les uploads à 10MB par fichier
3. **Notifications** - Alertes pour nouveaux tickets et changements de statut
4. **Statistiques** - Dashboard avec métriques de maintenance
5. **Export PDF** - Génération de rapports d'intervention avec photos intégrées
6. **Recherche et filtres** - Recherche par ID, machine, priorité

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
- **Compression d'images** - Pas encore implémentée (recommandé pour réduire la taille des uploads)
- **Validation de taille** - Pas de limite sur la taille des fichiers uploadés

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

### Tester sur mobile

#### Méthode 1: Utiliser le mode responsive du navigateur
```
1. Ouvrir l'application dans Chrome/Firefox
2. Appuyer sur F12 (DevTools)
3. Cliquer sur l'icône "Toggle device toolbar" (Ctrl+Shift+M)
4. Sélectionner un appareil mobile (iPhone 14, Galaxy S21, etc.)
5. Tester les interactions tactiles
```

#### Méthode 2: Accès depuis un appareil mobile réel
```
1. S'assurer que l'ordinateur et le mobile sont sur le même réseau
2. Trouver l'adresse IP locale: `ifconfig` (Mac/Linux) ou `ipconfig` (Windows)
3. Sur mobile, ouvrir le navigateur et accéder à: http://[IP]:3000
4. Tester le tap simple et l'appui long sur les cartes
```

#### Fonctionnalités mobiles à tester
- ✅ **Tap simple** sur une carte → Déplace vers colonne suivante
- ✅ **Appui long (500ms)** sur une carte → Ouvre menu contextuel
- ✅ **Vibration** lors de l'ouverture du menu contextuel
- ✅ **Menu contextuel** positionné dans les limites de l'écran
- ✅ **Formulaire création** responsive en plein écran
- ✅ **Header buttons** empilés verticalement sur mobile
- ✅ **Layout Kanban** en colonnes verticales sur mobile

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

**Version**: 1.7.0  
**Dernière mise à jour**: 2025-11-02  
**Statut**: ✅ Production Ready - Commentaires collaboratifs + Upload médias supplémentaires + Suppression tickets + Noms personnalisés
