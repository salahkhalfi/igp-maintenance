# 🔧 Système de Gestion de Maintenance Industrielle

[![Application Live](https://img.shields.io/badge/🌐_Application-En_Ligne-success?style=for-the-badge)](https://mecanique.igpglass.ca)
[![Version](https://img.shields.io/badge/version-2.0.0-blue?style=for-the-badge)](https://github.com/salahkhalfi/igp-maintenance/releases)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-orange?style=for-the-badge&logo=cloudflare)](https://mecanique.igpglass.ca)
[![Hono](https://img.shields.io/badge/Hono-Framework-red?style=for-the-badge)](https://hono.dev)

> **🚀 [Accéder à l'application en direct](https://mecanique.igpglass.ca)** - Système de gestion de maintenance déployé sur Cloudflare Pages

Application web complète pour la gestion de la maintenance industrielle avec tableau Kanban, système de tickets et suivi des interventions.

## 📋 Vue d'ensemble du projet

### Objectifs
- **Gestion centralisée** des demandes de maintenance industrielle
- **Suivi en temps réel** des interventions via un tableau Kanban
- **Traçabilité complète** de l'historique des tickets
- **Upload de médias** (photos/vidéos) pour documentation
- **Système d'authentification** avec gestion des rôles

### Statut actuel
✅ **Version 2.0.0 - En Développement**

- Backend API REST complet avec Hono
- Interface utilisateur React avec Kanban drag-and-drop
- Base de données D1 configurée avec migrations
- Système d'authentification JWT fonctionnel
- Gestion des médias avec Cloudflare R2
- **NOUVEAU v2.0.0**: 🎤 Messages audio enregistrables (public + privé) avec interface élégante
- **v1.9.2**: Guide utilisateur simplifié ultra-concis (emoji-based, scannable en 30 sec/section)
- **v1.9.0**: Gestion complète des utilisateurs (CRUD) + Notifications élégantes
- **v1.8.0**: Système de permissions par rôle + Statuts francisés
- Système de commentaires + Upload médias supplémentaires + Suppression de tickets
- Galerie de médias dans les détails de ticket + Scroll mobile corrigé
- Upload de photos/vidéos depuis mobile lors de la création de tickets

## 🚀 Fonctionnalités

### ✅ Fonctionnalités implémentées

#### 🆕 **NOUVEAU v2.0.0** - Messages Audio Enregistrables 🎤

##### 🎙️ Enregistrement Audio Natif
- **Bouton micro** - Accès direct à l'enregistrement audio dans messagerie (public + privé)
- **MediaRecorder API** - Enregistrement natif via navigateur (aucune librairie externe)
- **Multi-format** - Auto-détection: WebM (Chrome/Edge), MP4 (Safari), OGG (Firefox)
- **Timer live** - Affichage du temps d'enregistrement en temps réel (format M:SS)
- **Durée max** - Limite de 5 minutes (300 secondes) par message
- **Optimisations audio** - Echo cancellation, noise suppression, auto gain control
- **Prévisualisation** - Écouter l'audio avant envoi avec lecteur intégré
- **Annulation** - Bouton pour annuler et recommencer l'enregistrement

##### 🎧 Lecture Audio dans Messages
- **Lecteur intégré** - Player HTML5 natif avec contrôles (play, pause, volume, timeline)
- **Badge visuel** - Icône micro 🎤 pour identifier les messages vocaux
- **Durée affichée** - Temps total du message vocal visible
- **Style adaptatif** - Design différent pour messages publics vs privés
- **Cache optimisé** - Headers Cache-Control pour performance (1 an)

##### 📱 Interface Responsive
- **Desktop** - Interface complète avec prévisualisation et contrôles
- **Mobile** - Accès caméra/micro natif avec permissions système
- **Tablette** - Layout adaptatif pour toutes les tailles d'écran
- **Animations** - Point rouge pulsant pendant l'enregistrement
- **Feedback visuel** - Zone d'enregistrement avec dégradé rose/rouge

##### 🔒 Sécurité & Validation
- **Taille maximale** - 10 MB par message audio
- **Durée max** - 300 secondes (5 minutes)
- **Types MIME** - Validation stricte (audio/webm, audio/mp4, audio/mpeg, audio/ogg, audio/wav)
- **Permissions** - Vérification sender/recipient/admin pour accès
- **Authentification** - JWT requis pour upload et lecture
- **Upload sécurisé** - FormData avec validation backend

##### 💾 Stockage R2
- **Organisation** - `messages/audio/{userId}/{timestamp}-{randomId}.{extension}`
- **Métadonnées DB** - Stockage du file_key, durée, taille dans table messages
- **Content-Type** - Détection automatique et stockage du MIME type
- **Streaming** - Lecture en streaming direct depuis R2 (pas de téléchargement)

##### 🛠️ API Audio Messages
- `POST /api/messages/audio` - Upload message vocal (FormData)
  - Body: `audio` (File), `message_type` ('public'/'private'), `duration` (seconds), `recipient_id` (optional)
  - Validation: 10MB max, 300s max, types MIME autorisés
- `GET /api/messages/audio/:fileKey` - Stream audio file
  - Headers: Content-Type, Cache-Control
  - Permissions: Sender, recipient, admin ou message public

##### 📊 Base de Données
**Migration 0006** - Colonnes audio ajoutées à table `messages`:
- `audio_file_key TEXT` - Clé R2 du fichier audio
- `audio_duration INTEGER` - Durée en secondes
- `audio_size INTEGER` - Taille en bytes
- Index pour recherche rapide des messages audio

##### ✅ Tests Effectués
- ✅ Build réussi (459.10 kB)
- ✅ Service démarré avec PM2
- ✅ API backend opérationnelle (401 = auth required)
- ✅ Interface d'enregistrement fonctionnelle
- ✅ Lecteur audio intégré dans messages
- ⏳ À tester: Enregistrement réel + upload + lecture (test utilisateur requis)

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

#### 🆕 **NOUVEAU v1.9.2** - Guide Utilisateur Simplifié

##### 📖 Guide Interactif Ultra-Concis
- **Bouton "Guide"** - Accessible depuis le header pour tous les utilisateurs
- **15 sections complètes** - Démarrage, Connexion, Rôles, Kanban, Tickets, Commentaires, Photos, Recherche, Gestion users, Mobile, Raccourcis, Sécurité, Problèmes, Contact
- **Format "Quick Start"** - Chaque section réduite à 6-8 lignes maximum
- **Ultra-visuel** - Heavy emoji usage (🎯📊📸💬🔍👥📱⌨️🔒🆘📞) pour scan rapide
- **Steps numérotés** - 1️⃣2️⃣3️⃣4️⃣ pour clarté immédiate
- **Bullets contextuels** - ✅❌💡⚡🔴🟠🟢 pour information visuelle
- **Scannable 30 sec** - Parfait pour utilisateurs pressés qui n'ont pas le temps
- **Navigation sidebar** - Menu latéral avec icônes pour accès rapide
- **Escape to close** - Raccourci clavier pour fermeture rapide
- **Design professionnel** - Modal plein écran responsive, élégant, moderne

##### 🎯 Sections du Guide (15)
1. **🎯 Démarrage Rapide** - Vue d'ensemble en 30 secondes
2. **🔐 Se Connecter** - Processus de connexion simplifié
3. **👥 Les 3 Rôles** - Permissions Opérateur/Technicien/Admin
4. **📊 Le Tableau** - Workflow Kanban 6 colonnes
5. **➕ Créer un Ticket** - 4 étapes avec photos
6. **🔍 Voir un Ticket** - Détails, timeline, médias
7. **💬 Commenter** - Ajouter notes et infos
8. **📸 Photos** - Upload et visualisation
9. **🔍 Rechercher** - Filtres et recherche instantanée
10. **👥 Gestion Users** - CRUD utilisateurs (admin)
11. **📱 Sur Mobile** - Utilisation tactile optimisée
12. **⌨️ Raccourcis** - Escape, Tab, Enter
13. **🔒 Sécurité** - Bonnes pratiques
14. **🆘 Problèmes?** - Troubleshooting rapide
15. **📞 Contact** - Support et ressources

#### 🆕 **v1.9.0** - Gestion des Utilisateurs + Notifications Élégantes

##### 👥 Interface de Gestion des Utilisateurs (Admin uniquement)
- **Bouton "Utilisateurs"** - Accès violet dans le header (visible uniquement pour admins)
- **Liste complète** - Affichage de tous les utilisateurs avec badges de rôle colorés
- **Création d'utilisateurs** - Formulaire avec email, nom complet, mot de passe et rôle
- **Modification** - Éditer email, nom et rôle de n'importe quel utilisateur
- **Suppression sécurisée** - Impossible de supprimer son propre compte
- **Réinitialisation mot de passe** - Changer le mot de passe de n'importe quel utilisateur
- **Badges visuels** - 👑 Administrateur (rouge), 🔧 Technicien (bleu), 👷 Opérateur (vert)

##### 🎨 Système de Notifications Modernes
- **Modals élégants** - Remplace les `alert()` et `confirm()` par défaut
- **Notifications de succès** - Modal vert avec icône ✓ (création, modification réussies)
- **Notifications d'erreur** - Modal rouge avec icône ⚠️ (erreurs API)
- **Confirmations** - Modal jaune avec icône △ pour actions sensibles (suppression)
- **Prompt sécurisé** - Modal bleu avec champ mot de passe pour réinitialisation
- **Design professionnel** - Fond semi-transparent, ombres, animations fluides
- **UX améliorée** - Clic sur fond pour fermer, boutons bien visibles

##### 🔒 Sécurité Renforcée
- **Protection admin** - API `/api/users/*` protégée par middleware `adminOnly`
- **Backend validation** - Vérification des permissions côté serveur
- **Isolation UI** - Bouton "Utilisateurs" invisible pour non-admins
- **Auto-protection** - Impossible de modifier/supprimer son propre compte

##### 🛠️ API Utilisateurs Complète
- `GET /api/users` - Liste tous les utilisateurs (admin)
- `POST /api/users` - Créer un utilisateur (admin)
- `PUT /api/users/:id` - Modifier un utilisateur (admin)
- `DELETE /api/users/:id` - Supprimer un utilisateur (admin)
- `POST /api/users/:id/reset-password` - Réinitialiser mot de passe (admin)

#### 🆕 **v1.8.0** - Système de permissions par rôle

##### 🔒 Permissions par Rôle
**Opérateurs** :
- ✅ Créer et voir tous les tickets
- ✅ Modifier/supprimer uniquement LEURS tickets
- ✅ Ajouter commentaires et médias sur tous les tickets
- ❌ NE PEUVENT PAS déplacer les tickets (changer statut)
- ❌ NE PEUVENT PAS modifier/supprimer les tickets d'autres opérateurs

**Techniciens** :
- ✅ Déplacer tous les tickets (drag-and-drop, menu contextuel)
- ✅ Modifier et supprimer tous les tickets
- ✅ Accès complet au workflow

**Administrateurs** :
- ✅ Tous les pouvoirs (accès complet)

##### 🌍 Statuts Francisés
- Affichage en français: "Requête Reçue", "Diagnostic", "En Cours", "En Attente Pièces", "Terminé", "Archivé"
- Traduction automatique avec fonction `getStatusLabel()`
- Labels cohérents dans toute l'interface

##### 🔐 Sécurité Backend
- Vérification des permissions pour modification/suppression
- Opérateur ne peut changer le statut via API
- Erreurs 403 si accès non autorisé
- Protection côté serveur ET client

#### **v1.7.0** - Commentaires, médias supplémentaires et suppression

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
- **✅ Nettoyage R2** - Fichiers images/vidéos supprimés du bucket R2 (prévention fichiers orphelins)
- **✅ Gestion des coûts** - Économise l'espace de stockage et réduit les coûts R2
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
- **NOUVEAU v1.9.0**: Interface admin complète pour gérer les utilisateurs (CRUD)
- **NOUVEAU v1.9.0**: Notifications modernes et élégantes

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
- **✅ NOUVEAU**: Suppression automatique des fichiers R2 lors de la suppression d'un ticket
- **✅ NOUVEAU**: Prévention des fichiers orphelins dans le bucket R2
- **✅ NOUVEAU**: Logging des opérations de suppression pour traçabilité
- **✅ SÉCURITÉ**: Validation stricte des uploads
  - Taille maximale: 10 MB par fichier
  - Types autorisés: JPEG, PNG, WebP, GIF, MP4, WebM, QuickTime
  - Vérification type MIME côté serveur

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

#### Message (NOUVEAU v2.0.0)
```javascript
{
  id: INTEGER,
  sender_id: INTEGER,
  recipient_id: INTEGER,       // NULL pour messages publics
  message_type: ENUM('public', 'private'),
  content: TEXT,
  audio_file_key: TEXT,        // NOUVEAU: Clé R2 du fichier audio
  audio_duration: INTEGER,     // NOUVEAU: Durée en secondes
  audio_size: INTEGER,         // NOUVEAU: Taille en bytes
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
- `DELETE /api/machines/:id` - Supprimer une machine (admin) - **Protégé**: bloqué si des tickets y sont associés

### Médias
- `POST /api/media/upload` - Upload un fichier
- `GET /api/media/:id` - Récupérer un fichier (PUBLIC)
- `GET /api/media/ticket/:ticketId` - Liste les médias d'un ticket
- `DELETE /api/media/:id` - Supprimer un fichier

### Commentaires
- `POST /api/comments` - Ajouter un commentaire à un ticket
- `GET /api/comments/ticket/:ticketId` - Liste les commentaires d'un ticket

### Messages Audio (NOUVEAU v2.0.0)
- `POST /api/messages/audio` - Upload message vocal (multipart/form-data)
  - FormData: `audio` (File), `message_type`, `duration`, `recipient_id` (optional)
  - Validation: 10MB max, 300s max, types MIME autorisés
- `GET /api/messages/audio/:fileKey` - Stream fichier audio depuis R2
  - Permissions: Sender, recipient, admin ou message public
  - Headers: Content-Type, Cache-Control

### Utilisateurs (NOUVEAU v1.9.0)
- `GET /api/users` - Liste tous les utilisateurs (admin)
- `POST /api/users` - Créer un utilisateur (admin)
- `PUT /api/users/:id` - Modifier un utilisateur (admin)
- `DELETE /api/users/:id` - Supprimer un utilisateur (admin) - **Protégé**: bloqué si l'utilisateur a créé des tickets
- `POST /api/users/:id/reset-password` - Réinitialiser mot de passe (admin)

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
│   ├── 0003_add_reporter_name.sql  # Noms libres (v1.7.0)
│   └── 0006_add_audio_messages.sql # Colonnes audio (v2.0.0)
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
- ✅ **Intégrité des données** - Validation des suppressions pour éviter données orphelines
- ⚠️ CORS configuré (à restreindre en production)

## 🛡️ Intégrité des Données (v1.9.3)

### Règles de Suppression

#### 🎫 Suppression de Tickets
✅ **Suppression complète**
- Enregistrements media supprimés (CASCADE)
- Fichiers R2 supprimés (nettoyage automatique)
- Timeline supprimée (CASCADE)
- Commentaires supprimés (CASCADE)
- **Aucune donnée orpheline**

#### 🏭 Suppression de Machines
❌ **BLOQUÉ** si la machine a des tickets associés
```
Erreur: "Impossible de supprimer une machine avec des tickets associés"
```
**Raison**: Préserver l'historique de maintenance

#### 👤 Suppression d'Utilisateurs
❌ **BLOQUÉ** si l'utilisateur a créé des tickets (reported_by)
```
Erreur: "Impossible de supprimer cet utilisateur car il a créé X ticket(s)"
```

✅ **Nettoyage automatique** avant suppression:
- `tickets.assigned_to` → NULL (tickets désassignés)
- `media.uploaded_by` → NULL (médias conservés)
- `ticket_timeline.user_id` → NULL (historique conservé)
- `messages` → Supprimés (CASCADE)

**Raison**: Balance entre traçabilité et flexibilité RH

### Stratégie de Contraintes

| Table | Clé Étrangère | Comportement | Justification |
|-------|---------------|--------------|---------------|
| `tickets` | `machine_id` | **RESTRICT** | Historique de maintenance crucial |
| `tickets` | `reported_by` | **RESTRICT** | Traçabilité de qui a créé le ticket |
| `tickets` | `assigned_to` | **SET NULL** | Permet suppression techniciens |
| `media` | `ticket_id` | **CASCADE** | Médias attachés au ticket |
| `media` | `uploaded_by` | **SET NULL** | Garde les médias après départ |
| `ticket_timeline` | `ticket_id` | **CASCADE** | Timeline du ticket |
| `ticket_timeline` | `user_id` | **SET NULL** | Garde historique après départ |
| `ticket_comments` | `ticket_id` | **CASCADE** | Commentaires du ticket |
| `messages` | `sender_id` | **CASCADE** | Messages supprimés avec utilisateur |
| `messages` | `recipient_id` | **CASCADE** | Messages supprimés avec utilisateur |

## 📝 Notes de développement

### Limitations actuelles
- Le mot de passe utilise SHA-256 (simple) - à remplacer par bcrypt pour la production
- Les URLs R2 sont génériques - configurer un domaine personnalisé
- Les tests unitaires ne sont pas encore implémentés
- **Compression d'images** - Pas encore implémentée (recommandé pour réduire la taille des uploads)

### ✅ Améliorations récentes (v1.9.3)
- **Nettoyage R2 automatique** - Les fichiers media sont maintenant supprimés du bucket R2 lors de la suppression d'un ticket
- **Prévention fichiers orphelins** - Empêche l'accumulation de fichiers inutilisés dans le stockage
- **Réduction des coûts** - Économise l'espace de stockage Cloudflare R2
- **Logging amélioré** - Traçabilité des opérations de suppression de fichiers
- **Intégrité des données** - Protection contre les suppressions qui créeraient des données orphelines
  - ❌ Impossible de supprimer une machine si des tickets y sont associés (RESTRICT)
  - ❌ Impossible de supprimer un utilisateur qui a créé des tickets (RESTRICT)
  - ✅ Les tickets assignés à un utilisateur supprimé sont automatiquement désassignés (SET NULL)
  - ✅ L'historique et les médias conservent leur intégrité même après suppression d'utilisateurs
- **Validation upload sécurisée** - Protection contre fichiers malveillants et surdimensionnés
  - ✅ Taille maximale: 10 MB par fichier
  - ✅ Types autorisés: Images (JPEG, PNG, WebP, GIF) et Vidéos (MP4, WebM, QuickTime)
  - ✅ Messages d'erreur clairs avec détails (taille actuelle, maximum autorisé)

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

**Version**: 2.0.2  
**Dernière mise à jour**: 2025-11-07  
**Statut**: ✅ En Développement - Messages audio + 14 rôles système + Dropdown custom mobile

## 🆕 Nouveautés v2.0.2 (2025-11-07)

### 📱 Dropdown Custom pour Mobile
- **Composant custom RoleDropdown** - Remplace le `<select>` natif HTML
- **Résout fond noir système** - Plus de fond noir non-fermable sur iOS/Android
- **Entièrement responsive** - HTML/CSS personnalisé avec contrôle total
- **Fermeture intelligente** - Clic/tap extérieur ferme le dropdown (événements touch)
- **Variants stylés** - Blue pour création, green pour édition
- **Chevron animé** - Indicateur visuel up/down selon état
- **Catégories sticky** - 5 groupes de rôles avec headers qui restent visibles
- **Option sélectionnée** - Highlight + checkmark ✓
- **Scroll fluide** - Max 60vh avec overflow-y-auto
- **Touch-friendly** - Zones tactiles optimisées (44px minimum)

### 🎯 14 Rôles Système Prédéfinis
- **Direction**: Directeur Général, Administrateur
- **Management Maintenance**: Superviseur, Coordonnateur Maintenance, Planificateur Maintenance
- **Technique**: Technicien Senior, Technicien
- **Production**: Chef Équipe Production, Opérateur Four, Opérateur
- **Support**: Agent Santé & Sécurité, Inspecteur Qualité, Magasinier
- **Transversal**: Lecture Seule

### 🔒 Sécurité Renforcée
- **API bloquante** - Impossible de créer des rôles personnalisés (whitelist stricte)
- **14 rôles système** - Seuls les rôles prédéfinis peuvent être créés
- **Protection production** - Flag `is_system=1` empêche la suppression des rôles système
