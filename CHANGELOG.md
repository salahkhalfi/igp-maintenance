# Historique des Changements

## [2.14.18] - 2025-12-08 (Guest Push Fix)
### 🐛 Corrections Critiques
- **Push Notifications** : Résolution de l'erreur 500 lors de l'abonnement push pour les utilisateurs invités (Guest).
  - Suppression des contraintes de clé étrangère sur `push_subscriptions` et `pending_notifications` pour supporter les IDs négatifs des invités.
  - Application de la migration `20251208000000_fix_push_subscriptions_fk.sql`.

## [2.14.1] - 2025-12-04 (Diagnostic Update)
### 🔧 Outils
- **Diagnostic Push** : Ajout d'une route API `/api/push/diagnose/:query` pour vérifier l'état des notifications push d'un utilisateur spécifique (abonnements, logs, tests) en temps réel.

## [2.14.0] - 2025-12-04 (Beta 3)
### 🚀 Nouvelles Fonctionnalités
- **Vue TV / Liste** : Nouveau bouton bascule sur la page Planning pour affichage optimisé sur grands écrans (TV) ou liste compacte.
- **Partage Planning** : Possibilité d'envoyer une invitation directe au planning via la messagerie interne.
- **Liens Intelligents** : Détection automatique des liens `/planning` dans les messages avec transformation en bouton d'action "Voir le Planning".

### 🐛 Corrections
- **Stats Technicien** : Résolution de l'erreur 403 pour l'accès aux statistiques du dashboard pour les techniciens.
- **Messagerie** : Correction d'erreurs de référence (ReferenceError) et scripts manquants empêchant l'ouverture de la messagerie.
- **Stabilité** : Correctifs divers pour assurer la non-régression lors du déploiement.

## [2.13.0] - 2025-12-02
### 📦 Architecture SaaS & Modules
- **Feature Flipping** : Activation/désactivation dynamique des modules (Planning, Stats, Notifications).
- **Monétisation** : Gestion des licences par entreprise.
- **Sécurité** : Middleware de blocage pour les modules désactivés.
- **UI Adaptative** : Masquage automatique des éléments d'interface des modules inactifs.
- **Cron Jobs** : Nettoyage automatique des données obsolètes.

## [2.10.7] - 2025-12-01 (Stable Restore Point)
### 🔙 Rétablissement (Rollback)
- **Menu Principal** : Retour à la version classique "boutons individuels" (Utilisateurs, Machines, etc.) pour garantir la compatibilité mobile.
- **Suppression** : Annulation du menu déroulant "Administration" et des grilles CSS complexes qui causaient des bugs sur mobile.
- **Documentation** : Ajout du fichier `FUTURE_REFACTORING_GUIDE.md` pour empêcher toute régression future sur ce sujet.
- **Version** : Marquage officiel de cette version comme "Stable - Legacy Menu".

---

## [2.10.6] - 2025-11-30
### ✨ Améliorations
- **Notifications** : Ajout du support pour les notifications audio personnalisées sur iOS.
- **Performance** : Optimisation des requêtes SQL pour le tableau de bord.

## [2.10.5] - 2025-11-28
### 🐛 Corrections
- **Login** : Correction d'un problème de session expirée non détectée.
- **Interface** : Ajustement des couleurs pour le mode sombre (préparation).
