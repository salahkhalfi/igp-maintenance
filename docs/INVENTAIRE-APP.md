# 📋 INVENTAIRE COMPLET - Application Maintenance IGP

> **Date:** 2025-12-24
> **But:** Base pour créer le guide utilisateur

---

## 🌐 PAGES PRINCIPALES

| URL | Nom | Accès | Description |
|-----|-----|-------|-------------|
| `/` | Dashboard | Tous | Page principale avec Kanban |
| `/messenger` | Messagerie | Tous | Chat d'équipe |
| `/guide` | Guide | Tous | Documentation utilisateur |
| `/historique` | Historique | Tous | Journal des actions |
| `/changelog` | Changelog | Tous | Nouveautés |
| `/tv` | Affichage TV | Clé spéciale | Dashboard pour écran usine |
| `/admin/tv` | Admin TV | Admin | Gérer messages TV |
| `/admin/roles` | Rôles | Admin | Gérer permissions |
| `/admin/ai-settings` | Config IA | Admin | Paramètres Expert IA |

---

## 👥 RÔLES UTILISATEURS

| Rôle | Code | Niveau |
|------|------|--------|
| Administrateur | `admin` | Accès total |
| Superviseur | `supervisor` | Gestion équipe |
| Technicien | `technician` | Travail terrain |
| Opérateur | `operator` | Accès limité |

---

## 🔐 PERMISSIONS UI

| Permission | Fonction |
|------------|----------|
| `tickets.create` | Créer des tickets |
| `users.read` | Voir les utilisateurs |
| `machines.read` | Voir les machines |
| `planning.read` | Voir le planning |
| `roles.read` | Voir les rôles |
| `settings.manage` | Gérer paramètres |

---

## 🪟 MODALES (Fenêtres popup)

### Tickets
| Modal | Fichier | Fonction |
|-------|---------|----------|
| CreateTicketModal | `CreateTicketModal.js` | Créer un ticket |
| TicketDetailsModal | `TicketDetailsModal_v3.js` | Voir/éditer ticket |
| MoveTicketBottomSheet | `MoveTicketBottomSheet.js` | Déplacer ticket (mobile) |

### Utilisateurs
| Modal | Fichier | Fonction |
|-------|---------|----------|
| UserManagementModal | `UserManagementModal.js` | Gérer utilisateurs |
| UserGuideModal | `UserGuideModal.js` | Aide contextuelle |

### Machines
| Modal | Fichier | Fonction |
|-------|---------|----------|
| MachineManagementModal | `MachineManagementModal.js` | Gérer équipements |

### Paramètres
| Modal | Fichier | Fonction |
|-------|---------|----------|
| SystemSettingsModal | `SystemSettingsModal.js` | Paramètres système |
| ManageColumnsModal | `ManageColumnsModal.js` | Gérer colonnes Kanban |
| AdminRoles | `AdminRoles.js` | Gérer rôles/permissions |
| PushDevicesModal | `PushDevicesModal.js` | Appareils connectés |

### Planning
| Modal | Fichier | Fonction |
|-------|---------|----------|
| ProductionPlanning_v3 | `ProductionPlanning_v3.js` | Calendrier production |
| PlanningModals_v3 | `PlanningModals_v3.js` | Créer événements |
| PlanningNotes_v2 | `PlanningNotes_v2.js` | Notes planning |

### Outils
| Modal | Fichier | Fonction |
|-------|---------|----------|
| AIChatModal_v4 | `AIChatModal_v4.js` | Expert IA |
| PerformanceModal | `PerformanceModal.js` | Statistiques |
| OverdueTicketsModal | `OverdueTicketsModal.js` | Tickets en retard |
| DataImportModal | `DataImportModal.js` | Import données |
| BarcodeScanner | `BarcodeScanner.js` | Scanner QR/Barcode |

### Utilitaires
| Modal | Fichier | Fonction |
|-------|---------|----------|
| ConfirmModal | `ConfirmModal.js` | Confirmation action |
| PromptModal | `PromptModal.js` | Saisie texte |
| NotificationModal | `NotificationModal.js` | Alertes |
| Toast | `Toast.js` | Messages temporaires |

---

## 🧩 COMPOSANTS PRINCIPAUX

| Composant | Fichier | Fonction |
|-----------|---------|----------|
| MainApp | `MainApp.js` | Conteneur principal |
| AppHeader | `AppHeader.js` | Barre de navigation |
| KanbanBoard | `KanbanBoard.js` | Tableau des tickets |
| LoginForm | `LoginForm.js` | Connexion |
| VoiceTicketFab | `VoiceTicketFab.js` | Bouton vocal flottant |
| OfflineBanner | `OfflineBanner.js` | Alerte hors-ligne |
| ErrorBoundary | `ErrorBoundary.js` | Gestion erreurs |

### Sous-composants Tickets
| Composant | Fonction |
|-----------|----------|
| TicketAttachments | Pièces jointes |
| TicketHistory | Historique modifications |
| TicketComments | Commentaires |
| TicketTimer | Chronomètre intervention |
| ScheduledCountdown | Compte à rebours planifié |

---

## 🔘 BOUTONS HEADER (Barre navigation)

| Icône | Action | Permission requise |
|-------|--------|-------------------|
| 🔔 `fa-bell` | Notifications push | `notifications` module |
| 📱 `fa-mobile-alt` | Appareils connectés | Admin |
| 🤖 `fa-robot` | Expert IA | Tous |
| 💬 `fa-comments` | Messagerie | Tous |
| 👥 `fa-users` | Utilisateurs | `users.read` |
| 🛡️ `fa-shield-alt` | Rôles | Admin + `roles.read` |
| ⚙️ `fa-cogs` | Machines | `machines.read` |
| 🔧 `fa-sliders-h` | Paramètres | Admin + `settings.manage` |
| 📺 `fa-tv` | Mode TV | Admin + `settings.manage` |
| ☰ `fa-bars` | Menu mobile | Tous |

---

## 🎨 ICÔNES UTILISÉES (132 total)

### Navigation
- `fa-home` - Accueil
- `fa-bars` - Menu
- `fa-chevron-left/right/up/down` - Flèches
- `fa-arrow-left` - Retour
- `fa-search` - Recherche

### Actions
- `fa-plus` / `fa-plus-circle` - Ajouter
- `fa-edit` / `fa-pen` - Modifier
- `fa-trash` / `fa-trash-alt` - Supprimer
- `fa-save` - Sauvegarder
- `fa-check` / `fa-check-circle` - Valider
- `fa-times` / `fa-times-circle` - Fermer/Annuler
- `fa-undo` - Annuler action
- `fa-sync` / `fa-sync-alt` - Rafraîchir

### Tickets
- `fa-inbox` - Requête reçue
- `fa-search` - Diagnostic
- `fa-wrench` - En cours
- `fa-clock` - En attente
- `fa-check-circle` - Terminé
- `fa-archive` - Archivé
- `fa-exclamation-triangle` - Urgent
- `fa-fire` - Critique
- `fa-bomb` - Bloquant

### Communication
- `fa-bell` / `fa-bell-slash` - Notifications
- `fa-comment` / `fa-comments` - Messages
- `fa-paper-plane` - Envoyer
- `fa-microphone` / `fa-microphone-alt` - Audio
- `fa-phone` - Appel
- `fa-envelope` - Email

### Utilisateurs
- `fa-user` - Utilisateur
- `fa-users` - Équipe
- `fa-user-cog` - Admin utilisateur
- `fa-user-check` - Assigné
- `fa-user-edit` - Modifier profil

### Équipements
- `fa-cogs` / `fa-cog` - Machines
- `fa-tools` - Outils
- `fa-industry` - Usine
- `fa-hard-hat` - Sécurité
- `fa-plug` - Électrique
- `fa-server` - Serveur

### Médias
- `fa-camera` - Photo
- `fa-image` / `fa-images` - Images
- `fa-video` - Vidéo
- `fa-file-alt` - Document
- `fa-upload` / `fa-download` - Transfert
- `fa-barcode` - Code-barres

### Temps
- `fa-calendar` / `fa-calendar-alt` - Calendrier
- `fa-calendar-check` - Date confirmée
- `fa-calendar-times` - Date annulée
- `fa-clock` - Heure
- `fa-hourglass-half` - En attente

### IA & Tech
- `fa-robot` - IA
- `fa-brain` - Intelligence
- `fa-magic` - Auto-génération
- `fa-lightbulb` - Suggestion

---

## 📊 COLONNES KANBAN (par défaut)

| Ordre | Clé | Label | Icône | Couleur |
|-------|-----|-------|-------|---------|
| 1 | `received` | Requête Reçue | `fa-inbox` | Bleu |
| 2 | `diagnostic` | Diagnostic | `fa-search` | Jaune |
| 3 | `in_progress` | En Cours | `fa-wrench` | Orange |
| 4 | `waiting_parts` | En Attente Pièces | `fa-clock` | Violet |
| 5 | `completed` | Terminé | `fa-check-circle` | Vert |
| 6 | `archived` | Archivé | `fa-archive` | Gris |

---

## 🎤 FONCTIONNALITÉS VOCALES

| Fonction | Description |
|----------|-------------|
| VoiceTicketFab | Bouton flottant microphone |
| Transcription | Groq Whisper → OpenAI fallback |
| Auto-remplissage | Analyse IA du texte → champs ticket |

---

## 📱 RESPONSIVE

| Breakpoint | Comportement |
|------------|--------------|
| Mobile (<768px) | Menu hamburger, cartes empilées |
| Tablet (768-1024px) | 2 colonnes Kanban |
| Desktop (>1024px) | Toutes colonnes visibles |

---

## 🔔 NOTIFICATIONS PUSH

| Type | Déclencheur |
|------|-------------|
| Nouveau ticket | Ticket créé et assigné |
| Ticket modifié | Changement statut/priorité |
| Message | Nouveau message chat |
| Rappel | Ticket planifié proche |

---

## 📁 FICHIERS JS (81 fichiers)

### Composants principaux (37)
Voir section "Modales" et "Composants"

### Dist/minifiés (38)
Versions .min.js pour production

### Hooks (2)
- `useTickets.js` - Gestion état tickets
- `useMachines.js` - Gestion état machines

### Utils (1)
- `utils.js` - Fonctions utilitaires

### Planning (3)
- `ProductionPlanning_v3.js`
- `PlanningModals_v3.js`
- `PlanningNotes_v2.js`

---

## 📝 PROCHAINE ÉTAPE

Créer le guide utilisateur basé sur cet inventaire :

1. **Parcours débutant** - Premier jour
2. **Tâches quotidiennes** - Usage normal
3. **Fonctions avancées** - Power users
4. **Admin** - Gestion système

---

*Inventaire généré le 2025-12-24*
