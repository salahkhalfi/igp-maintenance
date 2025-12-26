# ✅ Checklist de Test Avant Déploiement

**Projet**: IGP - Système de Gestion de Maintenance  
**URL Production**: https://app.igpglass.ca  
**Utilisation**: Cocher chaque élément avant CHAQUE déploiement en production

---

## 📋 Instructions

1. **Avant de tester**: Déployez sur l'environnement de staging/preview
2. **Testez chaque section**: Cochez uniquement si le test PASSE
3. **Si un test échoue**: Notez le bug, corrigez, et recommencez depuis le début
4. **Après tous les tests**: Déployez en production

---

## 🔐 1. Authentification

### Connexion
- [ ] **Admin** - Connexion avec email/password admin réussie
- [ ] **Supervisor** - Connexion avec email/password supervisor réussie  
- [ ] **Technicien** - Connexion avec email/password technicien réussie
- [ ] **Opérateur** - Connexion avec email/password opérateur réussie
- [ ] **Mauvais mot de passe** - Message d'erreur clair affiché
- [ ] **Email inexistant** - Message d'erreur clair affiché
- [ ] **Token JWT** - Token stocké dans localStorage après connexion

### Déconnexion
- [ ] **Bouton déconnexion** - Visible et cliquable
- [ ] **Token supprimé** - localStorage.clear() après déconnexion
- [ ] **Redirection** - Retour automatique à la page de connexion
- [ ] **Accès protégé** - Impossible d'accéder aux pages après déconnexion

---

## 🎫 2. Gestion des Tickets

### Vue Kanban
- [ ] **6 colonnes affichées** - Reçu, Diagnostic, En cours, Attente pièces, Terminé, Archivé
- [ ] **Compteurs corrects** - Nombre de tickets affiché sur chaque colonne
- [ ] **Ordre des tickets** - Plus récents en haut
- [ ] **Cartes lisibles** - Titre, priorité, machine visible

### Création de Demande
- [ ] **Formulaire accessible** - Bouton "Nouvelle Demande" visible
- [ ] **Champs requis** - Titre, description, machine, priorité obligatoires
- [ ] **Validation française** - Messages "Veuillez remplir ce champ." en français
- [ ] **Upload photo** - Possible d'ajouter 1+ photos
- [ ] **Aperçu photo** - Photos affichées avant soumission
- [ ] **Création réussie** - Message de succès + ticket visible dans Kanban
- [ ] **Ticket ID généré** - Format DEM-YYYYMMDD-XXX visible

### Affichage des Tickets
- [ ] **Badges priorité** - Couleurs correctes (🔴 CRIT, 🟠 HAUT, 🟡 MOY, 🟢 BAS)
- [ ] **Icône photos** - 📷 + nombre si photos présentes
- [ ] **Date création** - Format français (ex: "08 nov, 14:30")
- [ ] **Type machine** - Affiché correctement

### Glisser-Déposer (Drag & Drop)
- [ ] **Drag fonctionnel** - Carte suit la souris
- [ ] **Drop dans colonne** - Ticket change de colonne
- [ ] **Statut mis à jour** - Statut sauvegardé en base de données
- [ ] **Animation fluide** - Pas de saccades
- [ ] **Opérateur ne peut pas drag** - Opérateur voit les tickets mais ne peut pas déplacer

### Détails du Ticket (Modal)
- [ ] **Modal s'ouvre** - Clic sur carte ouvre le modal
- [ ] **Toutes les infos** - Titre, description, machine, priorité, dates
- [ ] **Photos visibles** - Galerie de photos affichée
- [ ] **Zoom photo** - Clic sur photo ouvre en grand
- [ ] **Commentaires** - Section commentaires visible
- [ ] **Timeline** - Historique des changements visible
- [ ] **Bouton fermer** - X ou clic extérieur ferme le modal

### Modification de Ticket (Admin/Supervisor)
- [ ] **Mode édition** - Bouton "Modifier" visible pour admin/supervisor
- [ ] **Champs éditables** - Titre, description, priorité, machine modifiables
- [ ] **Sauvegarde** - Modifications enregistrées en base de données
- [ ] **Confirmation** - Message "Ticket mis à jour avec succès"
- [ ] **Affichage actualisé** - Changements visibles immédiatement dans Kanban

### Suppression de Ticket (Admin uniquement)
- [ ] **Bouton supprimer** - Visible uniquement pour admin
- [ ] **Confirmation** - Demande de confirmation avant suppression
- [ ] **Suppression effective** - Ticket disparaît du Kanban
- [ ] **Cascade** - Commentaires et photos aussi supprimés

### Planification de Ticket
- [ ] **Champs planification** - Date et technicien assigné visibles dans modal
- [ ] **Sélection date** - Calendrier fonctionnel
- [ ] **Sélection technicien** - Liste déroulante avec noms (pas IDs!)
- [ ] **Option "Toute l'équipe"** - Disponible dans la liste
- [ ] **Sauvegarde** - Date + technicien enregistrés
- [ ] **Bannière bleue** - ⚠️ **CRITIQUE** Bannière "PLANIFIÉ" visible sur ticket
- [ ] **Nom technicien affiché** - ⚠️ **CRITIQUE** "👤 Brahim" (PAS "Tech #6")
- [ ] **Date affichée** - Format court (ex: "08 nov")
- [ ] **Badge countdown** - Temps restant/retard affiché
- [ ] **Bannière disparaît** - Plus visible après "En cours"

### Filtres et Recherche
- [ ] **Filtre par statut** - Possible de filtrer par colonne
- [ ] **Filtre par priorité** - Possible de filtrer par priorité
- [ ] **Recherche** - Recherche par titre/ticket_id fonctionne
- [ ] **Reset filtres** - Bouton pour effacer tous les filtres

---

## 👥 3. Gestion des Utilisateurs (Admin/Supervisor uniquement)

### Liste des Utilisateurs
- [ ] **Accessible** - Menu "Gestion Utilisateurs" visible pour admin/supervisor
- [ ] **Liste complète** - Tous les utilisateurs affichés
- [ ] **Infos visibles** - Nom, email, rôle pour chaque utilisateur
- [ ] **Rôles français** - "Administrateur", "Chef d'Équipe", etc. (pas "admin", "team_leader")

### Création d'Utilisateur (Admin uniquement)
- [ ] **Formulaire accessible** - Bouton "Nouvel Utilisateur" visible
- [ ] **Champs requis** - Nom, email, rôle, mot de passe obligatoires
- [ ] **14 rôles disponibles** - Tous les rôles dans la liste déroulante
- [ ] **Validation email** - Format email vérifié
- [ ] **Mot de passe fort** - Minimum 8 caractères
- [ ] **Création réussie** - Message de succès + utilisateur visible dans liste
- [ ] **Email unique** - Erreur si email déjà utilisé

### Modification de Rôle
- [ ] **Sélection rôle** - Liste déroulante avec 14 rôles
- [ ] **Changement admin → team_leader** - ⚠️ **CRITIQUE** Fonctionne sans erreur
- [ ] **Changement team_leader → operator** - Fonctionne
- [ ] **Changement operator → admin** - Fonctionne (promotion)
- [ ] **Auto-démotion bloquée** - Admin ne peut pas retirer ses propres droits admin
- [ ] **Sauvegarde** - Nouveau rôle enregistré en base de données
- [ ] **Permissions changent** - ⚠️ **CRITIQUE** Anciennes permissions disparaissent, nouvelles actives

### Suppression d'Utilisateur (Admin uniquement)
- [ ] **Bouton supprimer** - Visible pour admin
- [ ] **Confirmation** - Demande de confirmation
- [ ] **Suppression effective** - Utilisateur disparaît de la liste
- [ ] **Tickets préservés** - Tickets créés par utilisateur restent visibles

---

## 💬 4. Messagerie

### Affichage des Messages
- [ ] **Section messagerie** - Accessible via menu
- [ ] **Liste messages** - Messages publics et privés affichés
- [ ] **Badge notification** - Compteur de non-lus visible
- [ ] **Séparation public/privé** - Messages publics et privés distingués
- [ ] **Ordre chronologique** - Plus récents en haut

### Envoi de Message Public
- [ ] **Formulaire accessible** - Zone de texte visible
- [ ] **Type "Public" sélectionné** - Par défaut ou sélectionnable
- [ ] **Envoi réussi** - Message apparaît immédiatement
- [ ] **Tous voient** - Message visible par tous les utilisateurs connectés
- [ ] **Nom expéditeur** - Nom de l'expéditeur affiché

### Envoi de Message Privé (Admin/Supervisor)
- [ ] **Sélection destinataire** - Liste déroulante avec utilisateurs
- [ ] **Type "Privé" sélectionné** - Option disponible
- [ ] **Envoi réussi** - Message envoyé
- [ ] **Seul destinataire voit** - Message visible uniquement par destinataire
- [ ] **Badge pour destinataire** - Compteur non-lus augmente

### Message Audio (optionnel si activé)
- [ ] **Bouton enregistrement** - Visible et fonctionnel
- [ ] **Permission micro** - Demande de permission navigateur
- [ ] **Enregistrement** - Audio capturé
- [ ] **Lecture audio** - Possible d'écouter avant envoi
- [ ] **Upload réussi** - Message audio envoyé

### Lecture des Messages
- [ ] **Marquer comme lu** - Message marqué lu après ouverture
- [ ] **Badge décrémente** - Compteur non-lus diminue
- [ ] **Technicien peut lire** - ⚠️ **CRITIQUE** Technicien a accès lecture messages
- [ ] **Opérateur peut lire** - ⚠️ **CRITIQUE** Opérateur a accès lecture messages

---

## 🏭 5. Gestion des Machines

### Liste des Machines
- [ ] **Accessible** - Menu "Machines" visible
- [ ] **Liste complète** - Toutes les machines affichées
- [ ] **Infos visibles** - Type, modèle, numéro série, localisation
- [ ] **Filtres** - Possibilité de filtrer par type/localisation

### Ajout de Machine (Admin/Supervisor)
- [ ] **Formulaire accessible** - Bouton "Nouvelle Machine" visible
- [ ] **Champs requis** - Type, modèle, numéro série obligatoires
- [ ] **Création réussie** - Machine visible dans liste
- [ ] **Disponible pour tickets** - Machine apparaît dans formulaire création ticket

### Modification de Machine (Admin/Supervisor)
- [ ] **Mode édition** - Bouton "Modifier" visible
- [ ] **Sauvegarde** - Modifications enregistrées

### Suppression de Machine (Admin uniquement)
- [ ] **Bouton supprimer** - Visible pour admin
- [ ] **Tickets liés** - Vérification si tickets existent
- [ ] **Confirmation** - Demande de confirmation si tickets liés

---

## 🎨 6. Interface Utilisateur

### Navigation
- [ ] **Menu principal** - Visible et fonctionnel
- [ ] **Logo IGP** - Affiché correctement
- [ ] **Nom utilisateur** - Nom + rôle affichés en haut
- [ ] **Liens actifs** - Tous les liens de navigation fonctionnent
- [ ] **Breadcrumbs** - Fil d'Ariane visible (si applicable)

### Responsive Design
- [ ] **Desktop (1920px)** - Affichage correct
- [ ] **Laptop (1366px)** - Affichage correct
- [ ] **Tablet (768px)** - Affichage correct
- [ ] **Mobile (375px)** - Affichage correct et utilisable

### Couleurs Corporatives
- [ ] **Bleu IGP** - #1e40af utilisé correctement
- [ ] **Orange IGP** - #ea580c pour éléments importants
- [ ] **Rouge IGP** - #dc2626 pour urgences/erreurs
- [ ] **Dégradés** - Dégradés violets pour background

### Accessibilité
- [ ] **Contraste** - Texte lisible sur tous les fonds
- [ ] **Taille police** - Lisible sans zoom
- [ ] **Focus keyboard** - Navigation au clavier possible
- [ ] **Messages d'erreur** - Clairs et visibles

---

## ⚡ 7. Performance

### Temps de Chargement
- [ ] **Page connexion** - < 2 secondes
- [ ] **Dashboard Kanban** - < 3 secondes
- [ ] **Liste utilisateurs** - < 2 secondes
- [ ] **Messagerie** - < 2 secondes

### Interactions
- [ ] **Drag & drop fluide** - Pas de lag
- [ ] **Modal rapide** - Ouverture < 500ms
- [ ] **Upload photo** - Feedback immédiat
- [ ] **Sauvegarde** - Confirmation rapide

---

## 🔒 8. Sécurité et Permissions

### Permissions Admin
- [ ] **Voir tous tickets** - ✅ Autorisé
- [ ] **Créer tickets** - ✅ Autorisé
- [ ] **Modifier tickets** - ✅ Autorisé
- [ ] **Supprimer tickets** - ✅ Autorisé
- [ ] **Gérer utilisateurs** - ✅ Autorisé
- [ ] **Gérer machines** - ✅ Autorisé
- [ ] **Messages privés** - ✅ Autorisé

### Permissions Supervisor
- [ ] **Voir tous tickets** - ✅ Autorisé
- [ ] **Créer utilisateurs** - ❌ Refusé
- [ ] **Modifier admin** - ❌ Refusé
- [ ] **Promouvoir en admin** - ❌ Refusé

### Permissions Technicien
- [ ] **Voir tickets** - ✅ Autorisé
- [ ] **Créer tickets** - ✅ Autorisé
- [ ] **Modifier propres tickets** - ✅ Autorisé
- [ ] **Supprimer tickets** - ❌ Refusé
- [ ] **Gérer utilisateurs** - ❌ Refusé
- [ ] **Lire messages** - ⚠️ **CRITIQUE** ✅ Autorisé

### Permissions Opérateur
- [ ] **Voir tickets** - ✅ Autorisé
- [ ] **Créer tickets** - ✅ Autorisé
- [ ] **Drag & drop** - ❌ Refusé (cartes non draggables)
- [ ] **Modifier tickets** - ❌ Refusé
- [ ] **Lire messages** - ⚠️ **CRITIQUE** ✅ Autorisé
- [ ] **Envoyer messages publics** - ✅ Autorisé

---

## 🐛 9. Cas d'Erreur

### Gestion des Erreurs Réseau
- [ ] **API down** - Message d'erreur clair
- [ ] **Timeout** - Message après délai
- [ ] **Token expiré** - Redirection vers connexion

### Gestion des Erreurs Formulaire
- [ ] **Champs vides** - Validation en français
- [ ] **Format invalide** - Message clair (email, date, etc.)
- [ ] **Conflit** - Gestion des doublons (email existant)

### Gestion des Erreurs Upload
- [ ] **Fichier trop gros** - Message d'erreur
- [ ] **Format non supporté** - Message d'erreur
- [ ] **Upload échoué** - Retry ou message clair

---

## 📱 10. Notifications

### Notifications en Temps Réel
- [ ] **Nouveau message** - Badge mis à jour
- [ ] **Ticket assigné** - Notification visible (si implémenté)
- [ ] **Ticket modifié** - Mise à jour automatique Kanban

---

## ✅ Validation Finale

### Avant Déploiement en Production
- [ ] **Tous les tests passent** - Aucun test échoué dans cette checklist
- [ ] **Bugs critiques corrigés** - Aucun bug bloquant identifié
- [ ] **Backup créé** - Backup de la base de données production
- [ ] **Rollback plan** - Plan de retour arrière préparé

### Après Déploiement en Production
- [ ] **Test smoke** - Test rapide des fonctionnalités principales
- [ ] **Logs vérifiés** - Aucune erreur dans les logs Cloudflare
- [ ] **Utilisateurs informés** - Communication des changements (si nécessaire)

---

## 📝 Notes de Test

**Date du test**: _______________  
**Testé par**: _______________  
**Version**: _______________  
**Environnement**: Production / Staging / Local  

**Bugs trouvés**:
1. _________________________________________________________
2. _________________________________________________________
3. _________________________________________________________

**Statut final**: ✅ VALIDÉ / ❌ À CORRIGER

---

## 🚨 Tests Critiques (Ne JAMAIS Oublier)

Ces tests sont **CRITIQUES** et doivent **TOUJOURS** passer:

1. ⚠️ **Bannière planification affiche nom technicien** (pas Tech #X)
2. ⚠️ **Changement de rôle fonctionne pour les 14 rôles**
3. ⚠️ **Permissions changent après changement de rôle**
4. ⚠️ **Technicien peut lire les messages**
5. ⚠️ **Opérateur peut lire les messages**
6. ⚠️ **Opérateur ne peut pas drag & drop**
7. ⚠️ **Admin ne peut pas se retirer ses propres droits**

---

**🎯 Objectif**: Zéro bug en production!  
**📖 Guide**: Suivre cette checklist AVANT chaque déploiement  
**⏱️ Temps estimé**: 30-45 minutes pour checklist complète
