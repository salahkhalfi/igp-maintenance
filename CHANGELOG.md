# Changelog - Système de Gestion de Maintenance

Toutes les modifications importantes de ce projet seront documentées dans ce fichier.

## [1.2.1] - 2024-11-02

### 🐛 Corrigé
- **Problème de connexion infinie** - Middleware d'authentification corrigé
- **Routes /api/machines 404** - Configuration des routes machines réparée
- **Route /api/auth/me non protégée** - Middleware appliqué correctement
- **Ordre des middlewares** - Middleware doit être défini AVANT les routes

### 🔧 Technique
- Réorganisation de l'ordre des middlewares et routes
- Middleware sur `/api/auth/me` appliqué avant `app.route()`
- Utilisation correcte de `app.route()` pour les sous-applications

## [1.2.0] - 2024-11-02

### ✨ Ajouté
- **Formulaire de création de tickets** avec modal élégant
- **Bouton "Nouvelle Demande"** dans le header
- **Sélection de machine** depuis liste déroulante
- **Choix de priorité** avec 4 niveaux (Low, Medium, High, Critical)
- **Compteur de tickets** dans le header
- **Chargement des machines** au démarrage

### 🔧 Corrigé
- **Page blanche** - Drag & drop temporairement désactivé
- **Interface opérationnelle** - Version simplifiée stable
- **Workflow complet** pour les opérateurs

## [1.1.0] - 2024-11-02

### ✨ Ajouté
- **Drag & Drop fonctionnel** sur le tableau Kanban
  - Déplacer les cartes entre colonnes avec la souris
  - Mise à jour automatique du statut des tickets
  - Animation visuelle lors du survol des colonnes
  - Feedback visuel pendant le déplacement (shadow et curseur)
  - Mise à jour optimiste de l'interface (pas d'attente du serveur)
  - Rollback automatique en cas d'erreur serveur

### 🔧 Améliorations
- Intégration de `@hello-pangea/dnd` v16.5.0
- Curseur `grab`/`grabbing` sur les cartes
- Highlight bleu des colonnes lors du survol avec une carte
- Transitions fluides pour les animations
- Gestion d'erreur robuste avec rollback

### 📝 Technique
- État local des tickets synchronisé avec le serveur
- `handleDragEnd` pour gérer le drop
- `handleDragStart` pour l'état de dragging
- API PATCH `/tickets/:id` pour la mise à jour du statut
- Ajout automatique d'un commentaire dans la timeline

### 🎯 Utilisation
Pour déplacer un ticket:
1. Cliquez et maintenez sur une carte
2. Glissez vers la colonne de destination
3. Relâchez pour déposer
4. Le statut est mis à jour automatiquement

## [1.0.0] - 2024-11-02

### 🎉 Release initiale

#### Fonctionnalités principales
- **Backend API REST complet** avec Hono
- **Base de données D1** avec migrations SQL
- **Authentification JWT** avec 3 rôles (Admin, Technicien, Opérateur)
- **Interface React** avec tableau Kanban 6 colonnes
- **Upload de médias** vers Cloudflare R2
- **Historique des tickets** (timeline)
- **Génération automatique d'ID** (Format: IGP-TYPE-MODEL-DATE-SEQ)

#### API REST
- Routes d'authentification (login, register, me)
- CRUD complet des tickets avec filtres
- CRUD des machines (admin only)
- Upload/download de médias
- Route de santé (/api/health)

#### Interface utilisateur
- Design TailwindCSS moderne et responsive
- 6 colonnes Kanban: Reçue, Diagnostic, En Cours, En Attente Pièces, Terminé, Archivé
- 4 niveaux de priorité: Critical, High, Medium, Low
- Badges colorés et icônes FontAwesome
- Login/logout fonctionnel
- Bouton d'actualisation

#### Base de données
- 8 tables relationnelles complètes
- Migrations versionnées
- Données de test (5 tickets, 5 machines, 4 utilisateurs)
- Index optimisés pour les performances

#### Documentation
- README.md complet (9.7 KB)
- API.md - Documentation API REST (13.4 KB)
- DEPLOYMENT.md - Guide de déploiement (10.5 KB)
- GUIDE_UTILISATION.md - Guide utilisateur (9.3 KB)

#### Stack technique
- **Backend**: Hono + Cloudflare Workers
- **Frontend**: React 18 + TailwindCSS
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Auth**: JWT (jose)
- **Build**: Vite
- **Process Manager**: PM2 (dev)

## Prochaines versions prévues

### [1.2.0] - À venir
- [ ] Modal de détails des tickets
- [ ] Formulaire de création de ticket dans l'UI
- [ ] Interface d'upload de médias
- [ ] Recherche et filtres avancés
- [ ] Notifications en temps réel

### [2.0.0] - Futur
- [ ] Dashboard statistiques
- [ ] Calendrier de maintenance préventive
- [ ] Chat temps réel pour techniciens
- [ ] Notifications email/push
- [ ] Application mobile React Native
- [ ] Export PDF des rapports
- [ ] Scan QR Code des machines

---

**Format**: Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)
**Versioning**: Ce projet suit le [Semantic Versioning](https://semver.org/lang/fr/)
