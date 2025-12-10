# 📋 Documentation des Routes et Pages

**Date de dernière mise à jour**: 2025-11-07  
**Version**: 2.0.4

## 🎯 Objectif
Ce document liste TOUTES les routes et pages de l'application pour éviter de perdre/oublier des pages lors des mises à jour.

---

## 📍 Routes Principales

### 🏠 Page d'Accueil
- **Route**: `/`
- **Fichier**: `src/index.tsx` (ligne ~6800)
- **Type**: React App (SPA)
- **Description**: Application principale avec tableau Kanban, gestion tickets, messagerie
- **Contenu**:
  - Authentification (login/logout)
  - Tableau Kanban (6 colonnes)
  - Gestion des tickets (CRUD)
  - Gestion des machines (admin)
  - Messagerie équipe (publique + privée)
  - Gestion des utilisateurs (admin)
  - Messages audio (enregistrement + lecture)

---

### 📖 Guide Utilisateur (Page Statique HTML)
- **Route**: `/guide`
- **Fichier**: `src/index.tsx` (lignes 5992-6300+)
- **Type**: Page HTML statique avec accordéons
- **Description**: Guide complet pour les utilisateurs
- **⚠️ IMPORTANT**: Cette page est SÉPARÉE du modal UserGuideModal!

**Sections du guide /guide**:
1. 🎯 Démarrage Rapide
2. ➕ Créer un Ticket
3. ✏️ Modifier un Ticket
4. 👥 Les 14 Rôles Système ⭐ (MIS À JOUR 2025-11-07)
5. 📊 Le Tableau Kanban
6. 📱 Sur Mobile
7. 💬 Messagerie Équipe ⭐ (AJOUTÉ 2025-11-07)
8. 📞 Contact & Support

**Version affichée**: 2.0.4 Optimisée

---

### 📖 Modal Guide Utilisateur (Composant React)
- **Route**: Modal ouvert via bouton "Guide" dans header
- **Fichier**: `src/index.tsx` (lignes 1586-1935)
- **Type**: Composant React (UserGuideModal)
- **Description**: Guide interactif avec menu latéral
- **⚠️ IMPORTANT**: Différent de la page `/guide`!

**Sections du modal UserGuideModal**:
1. 🎯 Démarrage Rapide (introduction)
2. 🔐 Se Connecter (connexion)
3. 👥 Les 14 Rôles Système (roles) ⭐ (MIS À JOUR 2025-11-07)
4. 📊 Le Tableau (kanban)
5. ➕ Créer un Ticket (creer_ticket)
6. 🔍 Voir un Ticket (details_ticket)
7. 💬 Commenter (commentaires)
8. 📸 Photos (medias)
9. 🔍 Rechercher (recherche)
10. 👥 Gestion Users (gestion_users)
11. 📱 Sur Mobile (mobile)
12. ⌨️ Raccourcis (raccourcis)
13. 🔒 Sécurité (securite)
14. ⚡ Nouveautés v2.0.4 (optimisations) ⭐ (AJOUTÉ 2025-11-07)
15. 🆘 Problèmes? (problemes)
16. 📞 Contact (contact)

**Version affichée**: ✨ v2.0.4 - Mise à jour 2025-11-07

---

### 🔧 Page Admin Rôles (Vue statique TypeScript)
- **Route**: `/admin/roles`
- **Fichier**: `src/views/admin-roles.ts`
- **Type**: Template HTML dans fichier TypeScript
- **Description**: Gestion des rôles système (admin uniquement)
- **Contenu**:
  - Liste des 14 rôles système prédéfinis
  - Permissions par rôle
  - Modal de modification de rôle (pas de création - rôles système uniquement)
  - Statistiques: Rôles Système, Rôles Actifs, Permissions Totales

**⚠️ NOTE**: Le bouton "Créer un Nouveau Rôle" a été SUPPRIMÉ (2025-11-07) car seuls les 14 rôles système sont autorisés.

---

## 🔌 API Routes

### Authentification (`src/routes/auth.ts`)
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur

### Tickets (`src/routes/tickets.ts`)
- `GET /api/tickets` - Liste tickets
- `GET /api/tickets/:id` - Détails ticket
- `POST /api/tickets` - Créer ticket
- `PATCH /api/tickets/:id` - Modifier ticket
- `DELETE /api/tickets/:id` - Supprimer ticket

### Machines (`src/routes/machines.ts`)
- `GET /api/machines` - Liste machines
- `POST /api/machines` - Créer machine (admin)
- `PATCH /api/machines/:id` - Modifier machine (admin)
- `DELETE /api/machines/:id` - Supprimer machine (admin)

### Médias (`src/routes/media.ts`)
- `POST /api/media/upload` - Upload fichier
- `GET /api/media/:id` - Récupérer fichier
- `GET /api/media/ticket/:ticketId` - Liste médias ticket
- `DELETE /api/media/:id` - Supprimer fichier

### Commentaires (`src/routes/comments.ts`)
- `POST /api/comments` - Ajouter commentaire
- `GET /api/comments/ticket/:ticketId` - Liste commentaires ticket

### Utilisateurs (`src/routes/users.ts`)
- `GET /api/users` - Liste utilisateurs (admin)
- `POST /api/users` - Créer utilisateur (admin)
- `PUT /api/users/:id` - Modifier utilisateur (admin)
- `DELETE /api/users/:id` - Supprimer utilisateur (admin)
- `POST /api/users/:id/reset-password` - Réinitialiser MDP (admin)

### Rôles (`src/routes/roles.ts`)
- `GET /api/roles` - Liste rôles
- `GET /api/roles/:id` - Détails rôle
- `POST /api/roles` - Créer rôle (système uniquement - whitelist 14 rôles)
- `PATCH /api/roles/:id` - Modifier rôle
- `DELETE /api/roles/:id` - Supprimer rôle (sauf rôles système)

### Messages (`src/routes/messages.ts`)
- `GET /api/messages/public` - Messages publics
- `GET /api/messages/private/:userId` - Messages privés avec user
- `POST /api/messages` - Envoyer message texte
- `POST /api/messages/audio` - Envoyer message vocal
- `GET /api/messages/audio/:fileKey` - Stream audio
- `DELETE /api/messages/:id` - Supprimer message

### Santé
- `GET /api/health` - Statut API

---

## 📂 Fichiers Critiques à Ne Jamais Oublier

### Pages Frontend (HTML/React)
1. ✅ `src/index.tsx` - Application React principale (lignes 1-6900+)
2. ✅ `src/index.tsx` - Route `/guide` statique (lignes 5992-6300+)
3. ✅ `src/index.tsx` - Modal UserGuideModal (lignes 1586-1935)
4. ✅ `src/views/admin-roles.ts` - Page admin rôles

### Routes API
1. ✅ `src/routes/auth.ts` - Authentification
2. ✅ `src/routes/tickets.ts` - Tickets
3. ✅ `src/routes/machines.ts` - Machines
4. ✅ `src/routes/media.ts` - Médias
5. ✅ `src/routes/comments.ts` - Commentaires
6. ✅ `src/routes/users.ts` - Utilisateurs
7. ✅ `src/routes/roles.ts` - Rôles
8. ✅ `src/routes/messages.ts` - Messages

---

## 🔄 Processus de Mise à Jour

### Avant TOUTE modification de contenu:

1. **Vérifier ce fichier ROUTES.md**
2. **Identifier TOUTES les pages/routes concernées**
3. **Mettre à jour TOUTES les occurrences**
4. **Tester TOUTES les pages**

### Exemple: Mise à jour du nombre de rôles

**❌ ERREUR COMMISE (2025-11-07)**:
- On a mis à jour le modal UserGuideModal (lignes 1586-1935)
- On a OUBLIÉ la page `/guide` statique (lignes 5992-6300+)
- Résultat: Incohérence entre les deux guides

**✅ BONNE PRATIQUE**:
1. Consulter ROUTES.md
2. Identifier: Modal UserGuideModal ET page `/guide`
3. Mettre à jour les DEUX
4. Vérifier dans le navigateur les DEUX

---

## 📝 Checklist de Mise à Jour de Contenu

Lorsqu'on met à jour du contenu (texte, version, features), vérifier:

- [ ] Modal UserGuideModal (src/index.tsx lignes 1586-1935)
- [ ] Page /guide statique (src/index.tsx lignes 5992-6300+)
- [ ] Page /admin/roles (src/views/admin-roles.ts)
- [ ] README.md (version, features)
- [ ] Package.json (version si nécessaire)
- [ ] Commentaires de code pertinents

---

## 🚨 Pages qui Existent en DOUBLE

### Guide Utilisateur (2 versions!)

1. **Modal React** (bouton "Guide" vert dans header)
   - Fichier: `src/index.tsx` lignes 1586-1935
   - Composant: `UserGuideModal`
   - Navigation: Menu latéral + sections détaillées
   - Footer: Badge version avec couleur

2. **Page HTML statique** (route `/guide`)
   - Fichier: `src/index.tsx` lignes 5992-6300+
   - Route: `app.get('/guide', ...)`
   - Navigation: Accordéons
   - Footer: Texte version simple

**⚠️ TOUJOURS mettre à jour les DEUX!**

---

## 💡 Améliorations Futures Recommandées

1. **Centraliser le contenu du guide**
   - Créer un fichier `src/content/guide-content.ts`
   - Les deux guides (modal + page) utilisent la même source
   - Une seule mise à jour = les deux synchronisés

2. **Script de validation**
   - Script qui vérifie la cohérence entre les versions
   - Alerte si "Les X Rôles" diffère entre modal et page
   - Vérifie que la version est identique partout

3. **Documentation automatique**
   - Script qui scanne tous les `app.get()`, `app.post()` etc.
   - Génère automatiquement ce fichier ROUTES.md
   - Exécuté avant chaque build

---

## 📊 Statistiques

- **Routes Frontend**: 2 (/, /guide)
- **Routes API**: ~30
- **Composants Modaux**: 8+ (UserGuideModal, Messagerie, UserManagement, etc.)
- **Pages Admin**: 1 (/admin/roles)
- **Fichiers de routes API**: 8

---

## 🔗 Liens Utiles

- **Production**: https://mecanique.igpglass.ca
- **Dernière preview**: https://daa187da.webapp-7t8.pages.dev
- **GitHub**: [À configurer]
- **Backup**: https://page.gensparksite.com/project_backups/

---

**Dernière vérification complète**: 2025-11-07  
**Par**: Assistant IA  
**Statut**: ✅ Toutes les routes identifiées et documentées
