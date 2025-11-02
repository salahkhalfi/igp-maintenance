# Changelog - Système de Gestion de Maintenance IGP

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

## [1.7.0] - 2025-11-02

### ✨ Nouvelles fonctionnalités

#### 💬 Système de commentaires collaboratif
- Ajout de commentaires sur tickets existants par opérateurs et techniciens
- Champ "Votre nom" libre (plus de noms fictifs pré-remplis)
- Sélection du rôle (Opérateur/Technicien) pour chaque commentaire
- Timeline chronologique avec horodatage
- Design avec bordure colorée selon le rôle (bleu/orange)
- Zone de commentaires scrollable (max 256px de hauteur)

#### 📸 Upload de médias supplémentaires
- Possibilité d'ajouter photos/vidéos après création du ticket
- Grille de preview pour fichiers sélectionnés
- Bouton de suppression individuelle avant upload
- Upload multiple de fichiers en une seule opération
- Rechargement automatique de la galerie après upload

#### 🗑️ Suppression de tickets
- Bouton poubelle rouge dans l'en-tête du modal de détails
- Dialog de confirmation pour éviter suppressions accidentelles
- Suppression en cascade des médias et commentaires liés
- Rafraîchissement automatique de la liste après suppression

#### 👤 Champs de nom personnalisés
- Champ "Votre nom" obligatoire à la création de ticket
- Plus de noms fictifs (Marie Tremblay, Jean Dubois, etc.)
- Chaque utilisateur entre son vrai nom
- Champ `reporter_name` ajouté à la table `tickets`
- Affichage du nom dans "Rapporté par:" des détails

### 🗄️ Base de données
- **Migration 0002**: Table `ticket_comments` avec index sur `ticket_id` et `created_at`
- **Migration 0003**: Colonnes `reporter_name` et `assignee_name` dans table `tickets`

### 🔌 Nouvelles routes API
- `POST /api/comments` - Ajouter un commentaire
- `GET /api/comments/ticket/:ticketId` - Liste les commentaires d'un ticket

### 🔧 Corrections techniques
- Routes de commentaires protégées par authMiddleware
- DELETE endpoint tickets déjà existant et protégé
- Cascade DELETE configuré sur commentaires via contrainte SQL

---

## [1.6.1] - 2025-11-02

### 🐛 Corrections de bugs

#### 🖼️ Correction chargement des images
- **Problème**: Images uploadées ne s'affichaient pas (erreur 401)
- **Cause**: `<img>` tags ne peuvent pas envoyer headers Authorization
- **Solution**: Endpoint GET `/api/media/:id` rendu public (sans authMiddleware)
- Routes POST/DELETE/LIST restent protégées par authentification
- Sécurité maintenue: IDs non devinables, upload/delete protégés

---

## [1.6.0] - 2025-11-02

### ✨ Nouvelles fonctionnalités

#### 📸 Modal de détails avec galerie de médias
- Clic sur n'importe quel ticket pour voir détails complets
- Grille responsive 2-4 colonnes pour photos/vidéos
- Lightbox plein écran pour visualisation
- Support vidéo avec contrôles de lecture
- Badge indicateur du nombre de médias sur les tickets
- Affichage nom et taille des fichiers

#### 📱 Corrections mobile
- **Scroll complet**: Bouton submit accessible même avec contenu long
- **Modal adaptatif**: Ajustement automatique à toutes tailles d'écran
- **Overflow corrigé**: Contenu long maintenant scrollable sans problème
- **Padding optimisé**: 10px mobile, 20px desktop

### 🔧 Améliorations techniques
- Modal avec `align-items: flex-start` pour meilleur scroll
- `-webkit-overflow-scrolling: touch` pour iOS
- `max-height: 90vh` avec `overflow-y: auto`

---

## [1.5.0] - 2025-11-01

### ✨ Nouvelles fonctionnalités

#### 📸 Upload de photos/vidéos depuis mobile
- Bouton "Prendre une photo ou vidéo" avec accès direct caméra
- Attribut `capture="environment"` pour caméra arrière sur mobile
- Upload multiple de médias par ticket
- Preview en temps réel en grille 3 colonnes
- Barre de progression d'upload
- Suppression individuelle avant envoi
- Support images (JPEG, PNG, WebP) et vidéos (MP4, WebM)

#### 💾 Stockage R2
- Upload sécurisé vers Cloudflare R2
- Organisation par ticket: `tickets/{ticketId}/{timestamp}-{filename}`
- Métadonnées enregistrées en base D1
- URLs publiques pour accès aux médias

---

## [1.4.0] - 2025-10-31

### ✨ Nouvelles fonctionnalités

#### 🖱️ Drag-and-Drop natif (Desktop + Mobile)
- Glisser-déposer avec souris (desktop)
- Glisser-déposer tactile (mobile)
- Curseur intelligent (pointer → grab → grabbing)
- Feedback visuel pendant le drag
- Zones de drop surlignées
- Layout vertical sur mobile pour drag naturel

#### 🎨 Animations et feedback
- Carte semi-transparente en drag avec rotation
- Transitions fluides 0.2s
- Vibration haptique sur mobile
- Menu contextuel (clic droit desktop, appui long mobile)

#### 📐 Design responsive
- Mobile (<640px): Layout vertical
- Tablette (640-1024px): Grille 2 colonnes
- Desktop (>1024px): Grille 6 colonnes

---

## [1.3.0] - 2025-10-30

### ✨ Fonctionnalités de base
- Système d'authentification JWT
- Gestion des tickets avec tableau Kanban
- Génération automatique d'ID tickets
- 6 statuts de workflow
- 4 niveaux de priorité
- Gestion des machines
- Historique des modifications (timeline)
- Interface React avec TailwindCSS
- API REST complète avec Hono
- Base de données Cloudflare D1
- Déploiement Cloudflare Pages

---

## Format

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

### Types de changements
- `✨ Nouvelles fonctionnalités` - Ajout de fonctionnalités
- `🔧 Améliorations` - Améliorations de fonctionnalités existantes
- `🐛 Corrections de bugs` - Corrections de bugs
- `🗄️ Base de données` - Migrations et changements de schéma
- `🔌 API` - Nouvelles routes ou modifications d'API
- `📱 Mobile` - Améliorations spécifiques mobile
- `🔒 Sécurité` - Correctifs de sécurité
- `📚 Documentation` - Mises à jour de documentation
- `⚡ Performance` - Améliorations de performance
