# Guide de Test - Interface Graphique de Gestion des Utilisateurs

## 📱 URL d'Accès

**URL de Test (Sandbox):** https://7000-i99eg52ghw8axx8tockng-cbeee0f9.sandbox.novita.ai

## 🔐 Connexion

1. **Ouvrez l'URL** dans votre navigateur
2. **Connectez-vous avec un compte administrateur:**
   - **Email:** `admin@igpglass.ca`
   - **Mot de passe:** `password123`

## 👥 Accès à la Gestion des Utilisateurs

Une fois connecté en tant qu'administrateur, vous verrez un nouveau bouton dans l'en-tête:

**🔵 Bouton "Gérer les Utilisateurs"** (couleur violet/pourpre)
- Situé entre le bouton "Actualiser" et "Déconnexion"
- Visible uniquement pour les administrateurs

## ✅ Fonctionnalités à Tester

### 1. **Visualiser la Liste des Utilisateurs**
- Cliquez sur le bouton "Gérer les Utilisateurs"
- Une fenêtre modale s'ouvre avec la liste de tous les utilisateurs
- Chaque utilisateur affiche:
  - ✅ Nom complet
  - ✅ Email
  - ✅ Rôle (👑 Administrateur, 🔧 Technicien, 👷 Opérateur)
  - ✅ Type de hash (🔒 PBKDF2 ou ⚠️ Legacy)
  - ✅ Date de création

### 2. **Créer un Nouvel Utilisateur**
- Cliquez sur le bouton orange "Créer un nouvel utilisateur"
- Remplissez le formulaire:
  - **Email:** `test@igpglass.ca`
  - **Nom complet:** `Utilisateur Test`
  - **Mot de passe:** `test123456` (minimum 6 caractères)
  - **Rôle:** Sélectionnez un rôle (Opérateur, Technicien, ou Administrateur)
- Cliquez sur "Créer l'utilisateur"
- ✅ Vérifiez que le message "✅ Utilisateur créé avec succès !" s'affiche
- ✅ Vérifiez que le nouvel utilisateur apparaît dans la liste

### 3. **Modifier un Utilisateur**
- Dans la liste, cliquez sur le bouton bleu "Modifier" d'un utilisateur
- Le formulaire d'édition s'ouvre (fond jaune)
- Vous pouvez modifier:
  - Email
  - Nom complet
  - Rôle
  - Mot de passe (optionnel - laissez vide pour ne pas changer)
- Exemple: Changez le nom de "Utilisateur Test" en "Test Modifié"
- Cliquez sur "Enregistrer les modifications"
- ✅ Vérifiez que le message "✅ Utilisateur modifié avec succès !" s'affiche
- ✅ Vérifiez que les modifications apparaissent dans la liste

### 4. **Réinitialiser le Mot de Passe**
- Cliquez sur le bouton jaune "Mot de passe" d'un utilisateur
- Une boîte de dialogue s'ouvre pour entrer le nouveau mot de passe
- Entrez un mot de passe (minimum 6 caractères)
- ✅ Vérifiez que le message "✅ Mot de passe réinitialisé avec succès" s'affiche

### 5. **Supprimer un Utilisateur**
- Cliquez sur le bouton rouge "Supprimer" d'un utilisateur
- ⚠️ **Note:** Vous ne pouvez PAS supprimer votre propre compte (le bouton est caché)
- Une confirmation s'affiche: "Êtes-vous sûr de vouloir supprimer..."
- Cliquez sur "OK" pour confirmer
- ✅ Vérifiez que le message "✅ Utilisateur supprimé avec succès" s'affiche
- ✅ Vérifiez que l'utilisateur disparaît de la liste

### 6. **Protections de Sécurité à Tester**

#### Test 1: Auto-suppression Interdite
- ✅ Vérifiez que le bouton "Supprimer" est ABSENT pour votre propre compte
- C'est une protection pour éviter de vous supprimer vous-même

#### Test 2: Retrait des Droits Admin Interdit (pour soi-même)
- Essayez de modifier votre propre compte pour changer votre rôle
- ✅ Vous devriez voir un message d'erreur:
  - "❌ Erreur: Vous ne pouvez pas retirer vos propres droits administrateur"

#### Test 3: Dernier Admin ne Peut Pas Être Supprimé
- Si vous êtes le seul administrateur:
- Créez un autre utilisateur avec le rôle "Administrateur"
- Essayez de supprimer le premier admin
- ✅ Vous devriez voir un message d'erreur:
  - "❌ Erreur: Impossible de supprimer le dernier administrateur du système"

#### Test 4: Validation d'Email
- Essayez de créer un utilisateur avec un email invalide (ex: "test")
- ✅ Le formulaire devrait afficher une erreur de validation HTML5

#### Test 5: Validation de Mot de Passe
- Essayez de créer un utilisateur avec un mot de passe trop court (moins de 6 caractères)
- ✅ Le formulaire devrait afficher une erreur: "Le mot de passe doit contenir au moins 6 caractères"

### 7. **Types de Hash de Mot de Passe**
- Les nouveaux utilisateurs créés auront le badge **🔒 PBKDF2** (sécurisé)
- Les anciens utilisateurs ont le badge **⚠️ Legacy** (SHA-256)
- Quand un utilisateur Legacy se connecte, son hash est automatiquement migré vers PBKDF2

## 📋 Scénario de Test Complet

1. ✅ **Connexion** → admin@igpglass.ca
2. ✅ **Ouvrir la gestion** → Cliquer sur "Gérer les Utilisateurs"
3. ✅ **Créer un utilisateur** → test1@igpglass.ca, mot de passe: test123456, rôle: Opérateur
4. ✅ **Créer un deuxième** → test2@igpglass.ca, mot de passe: test123456, rôle: Technicien
5. ✅ **Modifier test1** → Changer le nom et le rôle en "Technicien"
6. ✅ **Réinitialiser mot de passe** → test2, nouveau mot de passe: newpassword123
7. ✅ **Supprimer test1** → Confirmer la suppression
8. ✅ **Vérifier auto-suppression** → Votre compte n'a pas de bouton "Supprimer"
9. ✅ **Fermer la fenêtre** → Cliquer sur la croix (X) ou en dehors
10. ✅ **Réouvrir** → Vérifier que test2 est toujours dans la liste

## 🎨 Éléments Visuels à Vérifier

- **Bouton "Gérer les Utilisateurs":** Couleur violet/pourpre avec icône 🔧 (fa-users-cog)
- **Formulaire de création:** Fond bleu clair avec bordure bleue
- **Formulaire d'édition:** Fond jaune clair avec bordure jaune
- **Cartes utilisateurs:** Fond gris avec bordure qui devient bleue au survol
- **Badges de rôle:**
  - 👑 Administrateur: Rouge
  - 🔧 Technicien: Bleu
  - 👷 Opérateur: Vert
- **Badges de hash:**
  - 🔒 PBKDF2: Vert (sécurisé)
  - ⚠️ Legacy: Jaune (ancien)
- **Boutons d'action:**
  - Modifier: Bleu
  - Mot de passe: Jaune
  - Supprimer: Rouge

## ❌ Problèmes Potentiels

Si vous rencontrez des problèmes:

1. **Le bouton n'apparaît pas:**
   - Vérifiez que vous êtes connecté en tant qu'administrateur
   - Le bouton est visible uniquement pour les admins

2. **Erreur "401 Unauthorized":**
   - Reconnectez-vous
   - Vérifiez que le token JWT est valide

3. **Erreur "500 Server Error":**
   - Vérifiez les logs du serveur
   - La base de données doit être initialisée

4. **La fenêtre ne s'ouvre pas:**
   - Vérifiez la console du navigateur (F12) pour les erreurs JavaScript
   - Vérifiez que axios est chargé

## 📊 État Actuel

- ✅ Backend API complet (6 endpoints)
- ✅ Interface graphique intégrée
- ✅ Bouton admin dans le header
- ✅ Toutes les opérations CRUD fonctionnelles
- ✅ Protections de sécurité actives
- ✅ Validation des données
- ✅ Déployé en environnement de test

## 🚀 Prochaines Étapes

Après validation réussie:
1. Déployer sur l'environnement de production
2. Configurer le JWT_SECRET en production
3. Activer le mode CORS strict
4. Tester avec l'URL de production: https://mecanique.igpglass.ca

---

**Date:** 2025-11-03  
**Version:** 1.0  
**Status:** ✅ Prêt pour les tests
