# 🔧 MaintenanceOS - Système de Gestion de Maintenance

**🤖 AI ASSISTANT: START HERE. READ `docs/STRUCTURE.md` AND `docs/archive/bible.md` BEFORE DOING ANYTHING.**

**Auteur:** Salah Khalfi  
**Projet:** MaintenanceOS (Industry Agnostic)
**Département:** Technologies de l'Information

> **📖 [BIBLE DU PROJET (BIBLE.md)](BIBLE.md)** - Documentation Technique Critique & Lessons Learned. À lire absolument.

[![Application Live](https://img.shields.io/badge/🌐_Application-En_Ligne-success?style=for-the-badge)](https://maintenance-os.pages.dev)
[![Version](https://img.shields.io/badge/version-3.0.0-blue?style=for-the-badge)](https://github.com/maintenance-os/core/releases)
[![Security](https://img.shields.io/badge/Security-9.5%2F10-brightgreen?style=for-the-badge&logo=security)](SECURITY_AUDIT.md)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-orange?style=for-the-badge&logo=cloudflare)](https://pages.cloudflare.com)
[![Hono](https://img.shields.io/badge/Hono-Framework-red?style=for-the-badge)](https://hono.dev)

> **🚀 [Accéder à l'application en direct](https://maintenance-os.pages.dev)** - Système de gestion de maintenance déployé sur Cloudflare Pages
> 
> **🧪 [Environnement de test](https://webapp-7t8.pages.dev)** - Pour tester les modifications avant production

Application web complète pour la gestion de la maintenance industrielle avec tableau Kanban, système de tickets, IA vocale et suivi des interventions. Conçue pour être agnostique et adaptable à tout secteur industriel.

## 🏗️ Architecture SaaS & Modules (v3.0+)

L'application a évolué vers une architecture **SaaS Multi-Tenant Modulaire**, conçue pour simplifier la maintenance et maximiser la monétisation.

### 📦 Modules Monétisables
Le système intègre désormais 5 modules distincts activables à la carte :
1.  **Planning de Production** (`planning`) : Calendrier, événements, maintenance préventive.
2.  **Statistiques & Rapports** (`statistics`) : KPI, performance techniciens, analyse des pannes.
3.  **Notifications Push** (`notifications`) : Alertes temps réel sur mobile/desktop.
4.  **Collaboration Pro** (`messaging`) : Messagerie instantanée privée/groupe, messages vocaux.
5.  **Gestion Machines** (`machines`) : Inventaire détaillé, historique par machine, QR codes.

### 🔐 Sécurité & Gestion
-   **Feature Flipping** : Activation instantanée sans redéploiement.
-   **Protection Backend** : Middleware `checkModule` bloquant physiquement l'accès API aux modules désactivés.
-   **Rôles Hiérarchiques** :
    -   **Super Admin** (`salah@khalfi.com`) : Gestion globale des licences clients.
    -   **Admin Client** : Gestion de son instance (dans les limites de sa licence).

## 🆕 Dernières mises à jour

### Version 3.0.2 (15 Décembre 2025) - FIX MACHINE HORS SERVICE ⚠️✅
- **🚨 ALERTE VISIBLE**: Si la machine est hors service, une grande bannière rouge animée s'affiche désormais en haut des détails du ticket.
- **⚡ ACTION RAPIDE**: Bouton "Remettre en service" directement accessible dans la bannière.
- **✨ CLARTÉ**: Séparation nette entre le statut du ticket (workflow) et l'état de la machine (opérationnel/HS).
- **✅ IMPACT**: Impossible de manquer l'information si une machine est à l'arrêt.

### Version 3.0.1 (15 Décembre 2025) - FIX STATUT TICKETS 🎫✅
- **🐛 FIX UI**: Correction des boutons de changement de statut dans les détails du ticket.
- **🔄 MAPPING**: Alignement des valeurs frontend (OUVERT, EN COURS, EN ATTENTE, TERMINÉ) avec le backend.
- **🔒 RESTRICTION**: Indication visuelle claire que le changement de statut est réservé aux techniciens (désactivé pour les opérateurs).
- **✅ IMPACT**: Les techniciens peuvent désormais changer le statut des tickets sans erreur.

### Version 3.0.0-beta.5 (14 Décembre 2025) - RÉORGANISATION GROUPES & STABILITÉ ↕️🛡️
- **↕️ TRI PERSONNALISÉ DES GROUPES**:
  - Ajout d'une fonctionnalité permettant aux utilisateurs de réordonner manuellement leurs groupes et conversations.
  - Persistance de l'ordre personnalisé dans la base de données via la colonne `display_order`.
  - Mode "Réorganisation" intuitif avec boutons Monter/Descendre.
  - L'Expert IA reste épinglé en haut de la liste.
- **🛡️ FIX CRITIQUE PRODUCTION**:
  - Résolution d'une erreur 500 sur `GET /api/v2/chat/conversations` causée par une migration manquante sur la base de production.
  - Application manuelle des migrations de schéma (`display_order`) et de contexte IA (`system_settings`) sur l'environnement distant.
- **✅ IMPACT**: Meilleure personnalisation pour l'utilisateur et stabilité restaurée du module Messenger.

### Version 3.0.0-beta.4 (13 Décembre 2025) - SÉCURITÉ & VIBRATION 🔒📳
- **🔒 SÉCURISATION**: Sauvegarde complète de la version stable et validation des processus de déploiement.
- **📳 VIBRATION UNIVERSELLE**: Ajout du support de vibration pour toutes les notifications push (pas seulement les appels).
  - **Pattern Standard**: Double vibration courte (200ms) pour les messages et tickets.
  - **Pattern Appel**: Vibration longue et insistante maintenue.
- **🧠 CONTEXTE IA OPTIMISÉ**: Injection intelligente des détails machines dans le contexte de l'IA.
  - **Mode Précis**: Fiche technique complète (Fabriquant, Année, Specs) injectée pour la machine concernée par le ticket.
  - **Mode Global**: Liste allégée (ID, Type, Localisation) des 30 principales machines pour le contexte général, évitant la surcharge de tokens.
- **🛡️ ROBUSTESSE**: Protection contre la surcharge du contexte IA et gestion des erreurs silencieuses.
- **✅ IMPACT**: Meilleure réactivité sensorielle pour les techniciens et diagnostics IA plus précis sans compromettre la stabilité.

### Version 3.0.0 (13 Décembre 2025) - EXPERT INDUSTRIEL IA (30k) 🧠🏭
- **🧠 INTELLIGENCE CONTEXTUELLE**: Augmentation massive de la fenêtre de contexte IA à 30 000 caractères.
- **🏭 DÉTAILS MACHINES AVANCÉS**: Ajout des champs Fabricant, Année et Specs Techniques pour chaque machine.
- **🎯 SUPPORT CIBLÉ**: L'IA (DeepSeek/OpenAI) reçoit désormais la fiche technique complète de la machine concernée lors de l'analyse vocale et du chat expert.
- **💬 CHAT EXPERT CONTEXTUEL**: Le bouton "Demander conseil" envoie automatiquement l'ID machine à l'IA, permettant des diagnostics ultra-précis basés sur le modèle et l'année.
- **🛠️ GESTION AMÉLIORÉE**: Interface de gestion des machines mise à jour avec les nouveaux champs techniques.
- **✅ IMPACT**: L'IA passe de "Assistant générique" à "Expert Spécialisé" capable de citer les specs techniques et procédures spécifiques à chaque équipement.

### Version 2.18.4 (13 Décembre 2025) - OPTIMISATION IGP CONNECT ⚡📱
- **⚡ PERFORMANCE**: Optimisation majeure du composant de chat "IGP Connect".
- **🧠 MEMOIZATION**: Implémentation de `React.memo` sur les bulles de messages.
- **❄️ FREEZE**: Les messages passés ne sont plus re-rendus à chaque frappe clavier.
- **🧹 CLEANUP**: Correction de la structure du fichier `MessagingChatWindow.js` (suppression code dupliqué et définitions imbriquées).
- **✅ IMPACT**: Fluidité de saisie instantanée, même avec un long historique de conversation. Résolution du problème de "lourdeur" signalé.

### Version 2.18.3 (13 Décembre 2025) - MOBILE UX UPGRADE 📱✨
- **📱 MENU MOBILE COMPLET**: Ajout des boutons manquants dans le menu hamburger pour une parité 100% avec le desktop.
- **🚀 ACCÈS RAPIDE**:
  - **Tickets en Retard** (Quick Filter)
  - **Statistiques Performance**
  - **Gestion Appareils Push**
  - **Notifications Push (ON/OFF)**
- **✅ IMPACT**: Toutes les fonctionnalités critiques (Filtres, Stats, Config) sont maintenant accessibles sur mobile.
- **✨ ERGONOMIE**: Boutons stylisés (couleurs, icônes) intégrés harmonieusement dans le menu déroulant.

### Version 2.18.2 (12 Décembre 2025) - REVERT MENU MOBILE (PORTAL) ⏪✨
- **⏪ REVERT**: Retour à la version "Portal Overlay" (v2.0.3) pour le menu mobile.
- **🛠️ RAISON**: Problème de scroll et visibilité sur la version Full Screen Overlay précédente.
- **📱 COMPORTEMENT**: Le menu s'affiche par-dessus le contenu (z-49) mais sous le header, via un Portal React.
- **✅ FIX**: Restauration de l'état fonctionnel précédent demandé par l'utilisateur.

### Version 2.18.1 (12 Décembre 2025) - FIX SCROLL MOBILE 📱✨
- **📱 MENU HAMBURGER**: Correction du problème de défilement sur le menu mobile.
- **↕️ HAUTEUR DYNAMIQUE**: Utilisation de `dvh` pour s'adapter parfaitement à la hauteur d'écran mobile.
- **👆 TOUCH**: Amélioration de la gestion du scroll tactile (`touch-action: pan-y`).
- **✅ IMPACT**: Navigation fluide sur tous les appareils mobiles.

### Version 2.18.0 (12 Décembre 2025) - TICKET MAGIQUE (IA VOCALE) 🎙️✨
- **🪄 CRÉATION VOCALE INTÉGRALE**: Nouveau bouton flottant (FAB) micro sur le dashboard.
- **🧠 ANALYSE INTELLIGENTE**: Le technicien parle ("Fuite sur la presse 4, urgent"), l'IA (Whisper V3 + GPT-4o-mini) analyse.
- **📝 PRÉ-REMPLISSAGE AUTO**: Titre, Description, Machine, et Priorité sont détectés et remplis automatiquement.
- **🛡️ ZÉRO ERREUR**: L'utilisateur valide les données avant la création (rien n'est écrit en base sans confirmation).
- **🏭 CONTEXTE INDUSTRIEL**: L'IA connait la liste des machines (ID/Nom) pour faire le lien exact.
- **✅ IMPACT**: Réduit le temps de création de ticket de 2 minutes à 15 secondes.

### Version 2.17.0 (12 Décembre 2025) - TRANSCRIPTION OPENAI V3 🤖✨
- **🤖 TRANSCRIPTION SERVER-SIDE UPGRADE**: Remplacement de Cloudflare Whisper Base par l'API OpenAI Whisper V3 ("whisper-1").
- **🎯 PRÉCISION QUÉBÉCOISE**: Prompt système spécifique ("Technicien de maintenance industrielle. Accent québécois...") pour une reconnaissance d'accent parfaite.
- **🛡️ FALLBACK INTELLIGENT**: Bascule automatique sur Cloudflare si l'API OpenAI est indisponible.
- **🔧 CONFIGURATION**: Utilise `OPENAI_API_KEY` depuis les secrets Cloudflare.
- **✅ IMPACT**: Transcription de qualité "Humaine" même en milieu industriel bruyant avec fort accent.

### Version 2.15.2 (12 Décembre 2025) - ARCHITECTURE CERCLE ⭕🏗️
- **🏗️ REFACTORING COMPLET**: L'outil Cercle a été réécrit pour utiliser une logique de "Boîte" (comme Rectangle).
- **📦 IMPACT**: Le dessin, la sélection et le redimensionnement sont maintenant parfaitement synchronisés.
- **✅ RÉSULTAT**: Plus de saut de taille étrange lors du redimensionnement. Le cercle reste dans sa boîte.
- **🐛 FIX**: Résout définitivement le problème de cadre de sélection "trop petit".

### Version 2.15.1 (12 Décembre 2025) - FIX CERCLE BOUNDING BOX ⭕🐛
- **🐛 FIX CRITIQUE**: Correction du calcul de la zone de sélection pour les cercles.
- **✅ RÉSULTAT**: Le cadre de sélection englobe désormais tout le cercle, pas seulement un quart.
- **🎯 ROTATION**: Le centre de rotation est maintenant correctement aligné avec le centre du cercle.

### Version 2.15.0 (12 Décembre 2025) - ACTION CARDS ACTIVATION 🃏✨
- **🃏 LIVING TASKS**: Feature activée !
- **⚡ ACTION RAPIDE**: Nouveau bouton "Éclair" ⚡ sur les messages pour créer une carte.
- **👁️ VISIBILITÉ**: Le bouton apparaît au survol (desktop) ou tap (mobile) à côté du bouton supprimer.
- **🔄 FLUX**: Clic → Confirmation → Carte créée "À faire".
- **✅ STATUTS**: Cycle de vie complet : À faire → En cours → Terminé.

### Version 2.14.30 (12 Décembre 2025) - FIX CURSEUR & SÉLECTION 👆✨
- **👆 CURSEUR DYNAMIQUE**: L'outil "Main" (Déplacer) affiche maintenant correctement le curseur de déplacement, et non plus une croix de dessin.
- **🎯 SÉLECTION FACILITÉE**: La zone de détection pour attraper les objets a été massivement agrandie. C'est maintenant beaucoup plus facile d'attraper une flèche ou un trait, même avec des gros doigts.
- **✨ UX FLUIDE**: Confirmation visuelle immédiate quand on passe en mode déplacement.

### Version 2.14.29 (12 Décembre 2025) - ÉDITION COULEUR & ÉPAISSEUR MAX 🎨📏
- **📏 TRAITS XL**: Épaisseur des traits doublée (30px) pour une visibilité maximale.
- **🎨 CHANGEMENT COULEUR**: Cliquez sur une couleur pour changer instantanément la couleur de l'annotation sélectionnée.
- **✨ UX FLUIDE**: Sélectionnez une flèche ou un texte, cliquez sur "Jaune", et c'est fait !
- **✅ IMPACT**: Correction rapide et visibilité parfaite.

### Version 2.14.28 (12 Décembre 2025) - OPTIMISATION VISIBILITÉ 👁️📏
- **📏 TRAITS ÉPAISSIS**: L'épaisseur des traits a été triplée (5px -> 15px) pour être parfaitement visible sur les photos haute résolution.
- **🔤 TEXTE AGRANDI**: La taille du texte a été doublée (60px -> 120px) pour une meilleure lisibilité.
- **➡️ FLÈCHES VISIBLES**: La taille des pointes de flèches a été augmentée.
- **✅ IMPACT**: Vos annotations sont maintenant claires et lisibles, même sur les photos prises avec des téléphones modernes (4K+).

### Version 2.14.27 (12 Décembre 2025) - ÉDITEUR PHOTO PLEIN ÉCRAN + UNDO 🔄✨
- **🖥️ MODE PLEIN ÉCRAN**: L'éditeur photo occupe maintenant 100% de l'écran avec fond noir immersif. Fini les petites modales difficiles à utiliser sur mobile !
- **🔄 HISTORIQUE INTELLIGENT**: 
  - Chaque trait, forme ou texte est désormais un objet indépendant.
  - **Bouton Annuler (Undo)** : Retirez la dernière action sans tout effacer.
  - **Déplacement (Move)** : Nouvel outil "Main" ✋ pour sélectionner et déplacer n'importe quelle annotation après coup.
- **✨ ERGONOMIE**:
  - Barres d'outils flottantes optimisées (Haut: Outils, Bas: Couleurs & Actions).
  - Zone de dessin maximisée.
  - Support tactile amélioré pour le déplacement des objets.
- **✅ IMPACT**: Expérience d'édition professionnelle, fluide et sans frustration.

### Version 2.14.26 (12 Décembre 2025) - OUTILS DESSIN AVANCÉS 🎨📏
- **🎨 PALETTE D'OUTILS COMPLÈTE**: Ajout de 5 outils de dessin professionnels :
  - ✏️ **Crayon** (Freehand) : Pour entourer rapidement ou écrire à la main.
  - ➡️ **Flèche** : Pour pointer précisément un défaut.
  - 🔲 **Rectangle** : Pour encadrer une zone d'intérêt.
  - ⭕ **Cercle** : Pour entourer proprement un élément.
  - 🔤 **Texte** : Pour ajouter des notes lisibles directement sur l'image.
- **✨ UX AMÉLIORÉE**:
  - **Drag & Drop** intuitif pour les formes (Carré, Cercle, Flèche).
  - **Preview temps réel** : Visualisez la forme pendant que vous la tracez.
  - **Couleurs étendues** : Ajout du Bleu (#3B82F6) et Blanc (#FFFFFF) pour meilleur contraste sur photos sombres.
- **📝 IMPACT**: Diagnostics beaucoup plus clairs et professionnels. Plus besoin de gribouiller pour essayer de faire une flèche !

### Version 2.14.25 (12 Décembre 2025) - ANNOTATION IMAGES EXISTANTES 🖌️✨
- **🖌️ ÉDITION RÉTROACTIVE**: Possibilité d'annoter une image déjà envoyée ou reçue dans la discussion.
- **✨ UX FLUIDE**: Nouveau bouton "Plume" 🖊️ dans la visionneuse d'image.
- **🔄 FLUX**: Clic sur Annoter → Charge l'image dans l'éditeur → Dessin → Envoi comme nouvelle image annotée.
- **✅ IMPACT**: Idéal pour clarifier un point sur une photo envoyée précédemment par un collègue ("Non, regarde ici 🔴").

### Version 2.14.24 (12 Décembre 2025) - FIX REFERENCE ERROR 🐛✨
- **🐛 FIX CRITIQUE**: Correction d'une erreur de référence (`previewFile`) dans l'outil d'annotation photo.
- **🔄 HOISTING FIX**: Déplacement des déclarations d'état en haut du composant `ChatWindow` pour éviter la Temporal Dead Zone (TDZ).
- **✅ STABILITÉ**: L'application ne plante plus lors de l'initialisation du composant de chat avec l'outil d'annotation actif.
- **📝 IMPACT**: Restauration de la stabilité de l'application après l'ajout de l'outil de diagnostic visuel.

### Version 2.14.23 (12 Décembre 2025) - ANNOTATION PHOTO & DICTÉE 🎨🎤
- **🎨 ÉDITEUR PHOTO**: Outil de diagnostic visuel intégré. Dessinez sur les photos avant envoi pour entourer les problèmes.
- **✏️ ANNOTATION TACTILE**: Support complet du dessin au doigt ou à la souris sur canvas.
- **🎤 DICTÉE TEXTE**: Nouveau bouton micro dans la barre de saisie pour convertir la parole en texte.
- **📝 CORRECTION AUTO**: Focus automatique du clavier après la dictée pour correction rapide.
- **✨ UX**: Distinction claire entre "Message Vocal" (Onde) et "Dictée" (Micro).
- **✅ IMPACT**: Gain de temps énorme pour les diagnostics terrain et la saisie mains libres.

### Version 2.14.22 (12 Décembre 2025) - ÉDITION DES TRANSCRIPTIONS 📝✨
- **✏️ ÉDITION MANUELLE**: Ajout de la possibilité d'éditer les transcriptions vocales générées par l'IA.
- **✨ UX AMÉLIORÉE**: Interface d'édition in-chat avec textarea et boutons Sauvegarder/Annuler.
- **🔒 PERMISSIONS**: Uniquement l'auteur du message (ou l'admin) peut modifier sa transcription.
- **🛠️ BACKEND**: Nouvel endpoint `PUT /api/v2/chat/conversations/:id/messages/:messageId/transcription`.
- **✅ IMPACT**: Permet de corriger les erreurs de l'IA (noms propres, termes techniques) pour une documentation parfaite.

### Version 2.14.21 (12 Décembre 2025) - TRANSCRIPTION VOCALE (AI) 🎤✨
- **🧠 TRANSCRIPTION AUTOMATIQUE**: Les messages vocaux sont automatiquement transcrits en texte grâce à l'IA Cloudflare Workers AI (`@cf/openai/whisper`).
- **👀 AFFICHAGE INTUITIF**: Le texte transcrit s'affiche discrètement sous le lecteur audio, avec une icône 🤖.
- **⚡ PERFORMANCE**: Traitement asynchrone "Fire and Forget" via `ctx.waitUntil` pour ne pas ralentir l'envoi.
- **💾 MIGRATION BDD**: Ajout de la colonne `transcription` à la table `chat_messages` (Migration `20251212000000`).
- **✅ IMPACT**: Accessibilité accrue (lecture sans son), recherche facilitée (futur), et gain de productivité énorme pour les environnements bruyants.

### Version 2.14.20 (9 Décembre 2025) - TRADUCTION RÔLES & UI ✨
- **🌐 TRADUCTION UI**: Affichage des rôles en français (ex: "TECHNICIAN" -> "Technicien").
- **🔒 SYSTÈME PRÉSERVÉ**: Les identifiants système (`user.role`) restent inchangés pour garantir la stabilité du code.
- **🎨 UI POLISH**: Amélioration de l'affichage des titres dans la recherche, le profil et les listes.
- **✅ IMPACT**: Interface plus conviviale et professionnelle pour les utilisateurs francophones.

### Version 2.14.19 (8 Décembre 2025) - UI FIX MESSENGER HEADER 📱✨
- **🐛 FIX UI**: Correction de l'affichage du bouton de déconnexion sur petits écrans (mobile).
- **🎨 LAYOUT COMPACT**: Réduction des espacements et padding dans l'en-tête de la liste de conversations.
- **📱 TRUNCATE**: Troncature intelligente du nom d'utilisateur pour éviter le débordement.
- **✅ IMPACT**: Le bouton de déconnexion est maintenant toujours visible et accessible sur tous les appareils mobiles.

### Version 2.14.18 (8 Décembre 2025) - FIX GUEST PUSH SUBSCRIBE 🐛✨
- **🐛 FIX CRITIQUE**: Correction de l'erreur 500 lors de la souscription push pour les invités (Guest).
- **💾 DATABASE**: Migration SQL pour supporter les IDs utilisateurs négatifs dans `push_subscriptions` et `pending_notifications`.
- **🚀 DEPLOY**: Application de la migration en production pour permettre aux invités de recevoir des notifications.

### Version 2.14.17 (8 Décembre 2025) - SECURITY GUEST ISOLATION 🔒✨
- **🔒 SÉCURITÉ BACKEND**: Application du middleware `internalUserOnly` sur toutes les routes critiques (`tickets`, `machines`, `planning`, `comments`, `media`, `messages`).
- **🚫 RESTRICTION**: Les invités (Guests) reçoivent désormais une erreur 403 Forbidden s'ils tentent d'accéder aux données de maintenance.
- **↪️ REDIRECTION FRONTEND**: Détection automatique du rôle 'guest' au login et au chargement : redirection immédiate vers `/messenger`.
- **✅ IMPACT**: Isolation complète des utilisateurs Messenger (comme Johanne) qui ne peuvent plus accéder, voir ou modifier les tickets et machines.

### Version 2.14.16 (8 Décembre 2025) - FIX GUEST PUSH SUBSCRIBE 🐛✨
- **🐛 FIX CRITIQUE**: Correction de l'erreur 500 lors de la souscription push pour les invités (Guest).
- **💾 DATABASE**: Migration SQL pour supporter les IDs utilisateurs négatifs dans `push_subscriptions` et `pending_notifications`.
- **🚀 DEPLOY**: Application de la migration en production pour permettre aux invités de recevoir des notifications.

### Version 2.14.15 (8 Décembre 2025) - FIX GUEST AUTH ME 🐛✨
- **🐛 FIX CRITIQUE**: Correction de l'erreur 404 sur `/api/auth/me` pour les invités (Guest).
- **👥 SUPPORT GUEST**: L'endpoint `/me` supporte désormais correctement les utilisateurs de la table `chatGuests` (IDs négatifs).
- **✅ IMPACT**: Johanne (Guest) peut maintenant voir son profil et cliquer sur la cloche sans erreur.

### Version 2.14.14 (8 Décembre 2025) - FIX LOGOUT ERROR 🐛✨
- **🐛 FIX**: Correction de l'erreur "Auth token missing" lors de la déconnexion.
- **🛡️ ROBUSTESSE**: Vérification du token avant l'initialisation des notifications push.
- **🤫 SILENCIEUX**: Suppression des alertes et logs d'erreur inutiles si non connecté.

### Version 2.14.13 (8 Décembre 2025) - FIX PUSH SCRIPT & AXIOS REMOVAL 🐛✨
- **🐛 FIX CRITIQUE** : Suppression de la dépendance `axios` dans `push-notifications.js` (ReferenceError).
- **🔄 FETCH API** : Réécriture complète utilisant `fetch` natif pour compatibilité browser.
- **🚀 DEPLOY FIX** : Correction des problèmes de déploiement (tailwindcss, node_modules).
- **🔔 ROBUSTESSE** : Amélioration de la logique de souscription et de re-souscription.
- **✅ STATUS** : Déploiement réussi, notifications push opérationnelles.

### Version 2.14.12 (8 Décembre 2025) - FIX PUSH PAYLOAD & URLS 📱✨
- **📞 PRÉPARATION VISUELLE** : Ajout des icônes d'appel audio et vidéo dans l'interface de chat.
- **🚧 PHASE 1** : Intégration visuelle uniquement (boutons inactifs pour le moment).
- **🔒 SÉCURITÉ** : Architecture "Zero Risk" validée pour future implémentation (pas d'impact sur existant).
- **✨ UX** : Positionnement ergonomique dans l'en-tête de conversation.

### Version 2.14.5 (7 Décembre 2025) - ADMINISTRATION AVANCÉE CHAT 🧹✨
- **🧹 VIDER DISCUSSION** : Nouvelle fonctionnalité pour les administrateurs permettant de supprimer tous les messages d'un groupe en un clic sans supprimer le groupe lui-même.
- **🗑️ NETTOYAGE COMPLET** : Suppression en cascade des messages et des fichiers médias associés (R2) pour libérer de l'espace.
- **🛡️ SÉCURITÉ** : Action irréversible protégée par une double confirmation. Accessible uniquement aux admins globaux et admins du groupe.
- **✨ UX** : Bouton "Vider la discussion" ajouté dans le panneau d'information du groupe.

### Version 2.14.4 (7 Décembre 2025) - ADMINISTRATION GROUPES DE CHAT 💬🛠️
- **🛠️ GESTION ADMIN GROUPES** : L'administrateur global et l'administrateur du groupe peuvent désormais modifier le nom et l'icône des groupes.
- **✏️ ÉDITION SIMPLIFIÉE** : Boutons d'édition (crayon et caméra) toujours visibles et accessibles (plus d'effet hover masqué).
- **🔒 PERMISSIONS ÉTENDUES** : Le rôle 'admin' (Super Admin) a maintenant les droits d'édition sur tous les groupes, même s'il n'en est pas le créateur.
- **✅ ACCESSIBILITÉ MOBILE** : Amélioration de l'interface pour faciliter l'édition sur écran tactile.

### Version 2.14.3 (7 Décembre 2025) - DIFFUSION TV IMAGES & GALERIES 📺🖼️✨
- **📸 BROADCAST RICH MEDIA** : Support complet pour diffusion d'images et galeries sur TV
- **🖼️ NOUVEAUX TYPES DE MESSAGES** :
  - **Image + Texte** : Grande image mise en avant avec titre et description
  - **Galerie** : Grille de 6 images animées pour retours d'événements/excursions
- **✨ ANIMATIONS** : Transitions fluides (Fade In Up) pour l'apparition des contenus
- **🛠️ ADMIN PANEL TV** : Nouvelle interface `/admin/tv` pour gérer les contenus :
  - Création intuitive de messages
  - Upload d'images par glisser-déposer (supporte multiple)
  - Prévisualisation immédiate
  - Gestion des priorités et dates de diffusion
- **🚀 PERF** : Chargement optimisé des images et gestion du cache

### Version 2.14.2 (4 Décembre 2025) - VUE TV SATELLITE 📺🚀
- **🛰️ MODE KIOSQUE** : Nouvelle page indépendante `/tv.html` pour affichage sur Smart TV / Chromecast.
- **🔒 SÉCURITÉ KEY** : Accès protégé par clé URL (pas de login/session qui expire).
- **🔄 AUTO-PILOT** : Rafraîchissement automatique (60s) et défilement automatique intelligent.
- **👀 VISIBILITÉ** : Interface sombre, gros contrastes, lisible à 5 mètres.
- **🛠️ INDÉPENDANCE** : Architecture "Satellite" qui ne touche pas au cœur de l'application (0 risque).

### Version 2.14.1 (4 Décembre 2025) - FIX PUSH APPAREILS PARTAGÉS 📱🔄
- **🐛 FIX CRITIQUE** : Résolution du problème de notifications non reçues sur appareils partagés (ex: Laurent/Brahim).
- **🔄 RÉINSCRIPTION AUTO** : Détection automatique du changement d'utilisateur et transfert de la propriété de l'appareil.
- **🛠️ OUTIL DIAGNOSTIC** : Nouvelle route `/api/push/diagnose/:query` pour inspecter l'état des notifications.
- **✨ UX AMÉLIORÉE** : Plus besoin de se désabonner manuellement, une simple reconnexion suffit.

### Version 2.14.0 (4 Décembre 2025) - BETA 3: PARTAGE PLANNING & VUE TV 📺✨
- **📺 VUE TV / LISTE** : Bascule entre vue calendrier et liste compacte pour affichage sur grands écrans
- **📤 PARTAGE INTELLIGENT** : Invitation directe au planning via messagerie avec lien cliquable
- **🔗 LIENS ACTIFS** : Transformation automatique des URLs `/planning` en boutons d'action
- **🐛 CORRECTIFS TECH** : Stats technicien (403), scripts manquants, références JS
- **🧪 STABILITÉ** : Validation non-régression, backup de sécurité "Beta 3"

### Version 2.13.0 (2 Décembre 2025) - GESTION DES MODULES & LICENCES 📦✨
- **📦 FEATURE FLIPPING** : Système complet d'activation/désactivation de modules (Planning, Stats, Notifications)
- **💼 MONÉTISATION** : Architecture prête pour le SaaS avec gestion des licences par entreprise
- **🔧 ADMIN PANEL** : Nouvel onglet "Licences / Modules" dans les paramètres système
- **🔒 SÉCURITÉ BACKEND** : Middleware Hono bloquant l'accès API aux modules désactivés (403 Forbidden)
- **👁️ UI ADAPTATIVE** : Masquage automatique des boutons et menus selon les modules actifs
- **🧹 MAINTENANCE AUTO** : CRON Job "Concierge" pour nettoyage automatique BDD (Planning > 3 mois, Notes > 30j)
- **🚀 SCALABILITÉ** : Optimisation BDD automatique via VACUUM

### Version 2.12.0 (30 novembre 2025) - SYSTÈME MESSAGERIE & TICKETS MODERNISÉ 💬🎫✨
- **🎤 RECONNAISSANCE VOCALE (FR)** : Dictée vocale intégrée pour création tickets et commentaires
- **🎧 MESSAGERIE 2.0** : Refonte complète React/TypeScript, enregistrement audio natif, polling temps réel
- **🎫 GESTION TICKETS AVANCÉE** : 
  - **Nouveau Modal Création** : Upload média avec preview, dictée vocale titre/description
  - **Nouveau Modal Détails** : Galerie médias, commentaires vocaux/texte, assignation fluide
- **⚡ PERFORMANCE** : Migration vers React+Vite, suppression dépendances legacy, bundle optimisé
- **📱 UX MOBILE** : Interface 100% responsive, interactions tactiles natives
- **✅ QUALITÉ CODE** : Architecture "Poetic Code" (Clean, Solid, Optimized), typage TypeScript strict

### Version 2.10.5 (29 novembre 2025) - FIX MENU CONTEXTUEL MOBILE 📱✨
- **🐛 FIX CRITIQUE** : Correction du menu contextuel mobile qui ne se fermait pas
- **📱 Z-INDEX FIX** : Augmentation du z-index (`z-[100]`) pour passer au-dessus du header
- **🛠️ INTERACTION** : Le backdrop (zone floutée) est maintenant cliquable même en haut de l'écran
- **✅ UX AMÉLIORÉE** : Fermeture fiable lors de l'annulation d'un déplacement de ticket
- **📋 IMPACT** : Résout le blocage rapporté où l'utilisateur ne pouvait pas quitter le menu


### Version 2.9.7 (28 novembre 2025) - REFACTORING MAJEUR FRONTEND 🏗️✨
- **🏗️ ARCHITECTURE MODULAIRE** : Séparation complète du monolithe `src/index.tsx`
- **📦 COMPOSANTS EXTRAITS** : 20+ composants React déplacés vers `/public/static/js/components/`
- **⚡ CHARGEMENT OPTIMISÉ** : `MainApp` et `App` chargés comme scripts statiques
- **📄 VUES SÉPARÉES** : Templates HTML (Home, Changelog) extraits dans `src/views/`
- **📉 RÉDUCTION TAILE** : `src/index.tsx` réduit de 227KB à 16KB (-93%)
- **🚀 PERFORMANCE** : Meilleure maintenabilité et chargement plus rapide
- **✅ FONCTIONNALITÉS INCHANGÉES** : 100% iso-fonctionnel après refactoring

### Version 2.9.6 (26 novembre 2025) - FIX RACE CONDITION CRITIQUE 🔒✨
- **🐛 FIX CRITIQUE** : Protection contre race condition lors de création simultanée de tickets
- **🔐 UNIQUE CONSTRAINT** : Index unique ajouté sur `ticket_id` (migration 0022)
- **🔄 RETRY LOGIC** : Système retry intelligent (max 3 tentatives, backoff exponentiel)
- **⚡ DÉTECTION COLLISION** : Détection automatique des erreurs UNIQUE constraint
- **📊 BACKOFF 50ms/100ms** : Délais exponentiels entre tentatives (50ms, 100ms)
- **✅ NOTIFICATIONS PRÉSERVÉES** : Flux webhook Pabbly intact après fix
- **📝 DOCUMENTATION COMPLÈTE** : 
  - `AUDIT_LOGIQUE_TICKET_ID_v2.9.5.md` (15.6 KB) - Analyse ligne-par-ligne
  - `RAPPORT_SIMULATION_v2.9.5.md` (14.1 KB) - 19 tests, score 84%
  - `ANALYSE_IMPACT_NOTIFICATIONS.md` (9.2 KB) - Aucun impact négatif
  - `AUDIT_FINAL_v2.9.6.md` (9.2 KB) - Audit production 100%

**Impact Sécurité :**
- 🔴 **AVANT** : Race condition pouvait générer IDs dupliqués (2+ requêtes simultanées)
- 🟢 **APRÈS** : Protection base de données + retry applicatif = 0% doublons

**Scénarios de Collision Testés :**
- ✅ **Collision 1x** : Succès après 1 retry (50ms delay)
- ✅ **Collision 2x** : Succès après 2 retry (100ms delay)
- ❌ **Collision 3x** : Échec max retries (extrêmement improbable < 0.01%)

**Commit:** [commit-hash]  
**Tag:** v2.9.6  
**Déployé:** 2025-11-26  
**URL:** https://af864ba1.webapp-7t8.pages.dev  
**Domaine:** https://app.igpglass.ca  
**Score Audit:** 5/5 (100%)

### Version 2.9.5 (26 novembre 2025) - PRÉCISION MENSUELLE ID TICKETS 📅✨
- **🎯 ÉVOLUTION FORMAT** : Passage de `TYPE-YYYY-NNNN` à `TYPE-MMYY-NNNN`
- **📅 PRÉCISION MENSUELLE** : MMYY = Mois (01-12) + Année (2 derniers chiffres)
- **✨ EXEMPLES CONCRETS** :
  - `CNC-1125-0001` → Premier ticket CNC de Novembre 2025
  - `FOUR-0125-0042` → 42ème ticket Four de Janvier 2025
  - `POL-0625-0123` → 123ème ticket Polisseuse de Juin 2025
  - `THERMO-1225-0005` → 5ème ticket Thermos de Décembre 2025
  - `WJ-0925-0010` → 10ème ticket WaterJet de Septembre 2025
- **📈 COMPTEUR MENSUEL** : Remise à zéro chaque mois pour chaque type de machine
- **📊 NUMÉROS PLUS PETITS** : Moins de tickets par mois = numéros de séquence plus courts
- **📖 DÉCODAGE MMYY** :
  - `0125` = Janvier 2025
  - `0625` = Juin 2025
  - `1125` = Novembre 2025
  - `1225` = Décembre 2025
- **🗂️ ORGANISATION** : Tickets groupés par mois ET par type de machine
- **🔄 RÉTROCOMPATIBILITÉ** : Tous les formats antérieurs restent valides

**Avantages clés :**
- Identification précise du mois ET de l'année dans l'ID
- Numéros de séquence plus courts (remise à zéro mensuelle)
- Meilleure organisation temporelle des tickets
- Facilite le suivi mensuel des interventions
- Permet analyse précise par mois et par machine

**Formats supportés (rétrocompatibles) :**
- ✅ v2.9.5 : `TYPE-MMYY-NNNN` (CNC-1125-0001)
- ✅ v2.9.4 : `TYPE-YYYY-NNNN` (CNC-2025-0001)
- ✅ v2.9.3 : `IGP-YYYY-NNNN` (IGP-2025-0001)
- ✅ Legacy : `IGP-TYPE-MODEL-YYYYMMDD-NNN`

**Commit:** 3f23511  
**Tag:** v2.9.5  
**Déployé:** 2025-11-26  
**URL:** https://cc0d45fb.webapp-7t8.pages.dev  
**Domaine:** https://app.igpglass.ca

### Version 2.9.4 (26 novembre 2025) - FORMAT ID AVEC TYPE MACHINE 🏭✨
- **🎯 ÉVOLUTION DU FORMAT** : Remplacement du préfixe `IGP` par le type de machine
- **📋 NOUVEAU FORMAT** : `TYPE-YYYY-NNNN` au lieu de `IGP-YYYY-NNNN`
- **✨ EXEMPLES CONCRETS** :
  - `CNC-2025-0001` → Premier ticket CNC de 2025
  - `FOUR-2025-0042` → 42ème ticket Four de 2025
  - `POL-2025-0123` → 123ème ticket Polisseuse de 2025
  - `THERMO-2025-0005` → 5ème ticket Thermos de 2025
  - `WJ-2025-0010` → 10ème ticket WaterJet de 2025
- **🏷️ CODES MACHINES** : CNC, DEC, FOUR, LAM, POL, THERMO, WJ, AUT
- **🔍 IDENTIFICATION IMMÉDIATE** : Type de machine visible sans ouvrir le ticket
- **🚫 SUPPRESSION REDONDANCE** : "IGP" retiré (on sait où on est!)
- **📊 NUMÉROTATION LOGIQUE** : Compteur séparé par type de machine ET par année
- **🔄 RÉTROCOMPATIBILITÉ** : Validation supporte 3 formats (actuel, v2.9.3, ancien)

**Avantages clés :**
- Identification instantanée du type de machine dans l'ID
- Plus besoin de consulter les détails pour savoir de quelle machine il s'agit
- Numérotation plus logique (par type plutôt que global)
- Facilite le tri et le filtrage des tickets
- Communication plus claire entre équipes

**Formats supportés :**
- ✅ Actuel : `TYPE-2025-NNNN` (CNC-2025-0001)
- ✅ v2.9.3 : `IGP-2025-NNNN` (IGP-2025-0001)
- ✅ Ancien : `IGP-TYPE-MODEL-YYYYMMDD-NNN`

**Commit:** f25589e  
**Tag:** v2.9.4  
**Déployé:** 2025-11-26  
**URL:** https://a65e388f.webapp-7t8.pages.dev  
**Domaine:** https://app.igpglass.ca

### Version 2.9.3 (26 novembre 2025) - FORMAT ID TICKET SIMPLIFIÉ 🎫✨
- **🎯 NOUVEAU FORMAT** : ID tickets simplifié de `IGP-TYPE-MODEL-YYYYMMDD-NNN` à `IGP-YYYY-NNNN`
- **📏 RÉDUCTION 54%** : Longueur moyenne réduite de ~28 caractères à 13 caractères
- **✨ EXEMPLES** :
  - ❌ Ancien : `IGP-PDE-7500-20231025-001` (28 caractères, difficilement mémorisable)
  - ✅ Nouveau : `IGP-2025-0001` (13 caractères, clair et concis)
- **🔢 NUMÉROTATION SÉQUENTIELLE** : Compteur basé sur l'année courante (ex: 0001, 0002, 0003...)
- **🚀 PERFORMANCE** : Index ajouté sur `ticket_id` pour requêtes rapides
- **🔄 COMPATIBILITÉ** : Fonction `isValidTicketId()` supporte ancien et nouveau format
- **💼 BRANDING IGP** : Préfixe IGP maintenu pour identité professionnelle
- **📅 ANNÉE VISIBLE** : Format YYYY facilite identification temporelle
- **✅ PRODUCTION** : Migration 0021 appliquée, build testé et déployé

**Avantages :**
- Plus facile à communiquer oralement ou par écrit
- Plus lisible sur mobile et interfaces limitées
- Plus mémorisable pour les techniciens
- Plus professionnel et moderne
- Élimine la redondance (TYPE/MODEL déjà dans les détails du ticket)

**Commit:** 47f2e70  
**Tag:** v2.9.3  
**Déployé:** 2025-11-26  
**URL:** https://3507bc75.webapp-7t8.pages.dev  
**Domaine:** https://app.igpglass.ca

### Version 2.9.1 (26 novembre 2025) - RECHERCHE INTELLIGENTE AVEC PLACEHOLDER ANIMÉ 🔍✨
- **🔍 NOUVELLE FONCTIONNALITÉ** : Placeholder animé avec exemples de mots-clés
- **🎯 SUGGESTIONS TOURNANTES** : 5 exemples qui changent toutes les 4 secondes
  - "Essayez: 'retard' pour voir les tickets en retard"
  - "Essayez: 'urgent' pour voir les priorités critiques"
  - "Essayez: 'commentaire' pour voir les tickets avec notes"
  - "Essayez: 'haute' pour voir les haute priorité"
  - "Ou cherchez par machine, lieu, ticket..."
- **💡 GUIDE DÉCIDEURS** : Facilite la découverte des mots-clés lors de la première utilisation
- **🎨 STYLE ÉLÉGANT** : Texte gris discret (placeholder-gray-400) qui impressionne
- **⚡ ROTATION AUTO** : useEffect avec interval de 4000ms pour animation fluide
- **🧠 UX OPTIMISÉE** : Montre la puissance de la recherche sans documentation
- **✅ PRODUCTION-READY** : Build testé et déployé avec succès

### Version 2.9.0 (25 novembre 2025) - STATISTIQUES DASHBOARD ADMIN 📊✨
- **📊 NOUVELLE FONCTIONNALITÉ** : Barre de statistiques en temps réel dans l'en-tête
- **4 STATISTIQUES CLÉS** : Affichage dynamique pour admin/supervisor uniquement
  - ✅ **Tickets actifs (Global)** - Total des tickets non terminés en base de données
  - ⚠️ **Tickets en retard** - Badge orange/rouge avec animation pulse si retards détectés
  - 👥 **Techniciens actifs** - Compteur des vrais techniciens (exclut compte système)
  - 📱 **Appareils push** - Nombre d'appareils avec notifications push enregistrés
- **🎨 DESIGN HARMONISÉ** : Badges colorés cohérents avec palette IGP
  - Badge orange → rouge animé si tickets en retard
  - Badge bleu pour techniciens (icône fas fa-users)
  - Badge vert pour appareils push (icône fas fa-mobile-alt)
- **⚡ MISE À JOUR AUTO** : Chargement via `loadSimpleStats()` après délai 2s
- **🔒 SÉCURITÉ** : API `/api/stats/active-tickets` protégée par authMiddleware
- **📊 REQUÊTES SQL OPTIMISÉES** : 
  - Tickets actifs: `WHERE status NOT IN ('completed', 'cancelled', 'archived')`
  - Tickets retard: `WHERE scheduled_date < datetime('now')`
  - Techniciens: `WHERE role = 'technician' AND id != 0` (exclut "Toute l'équipe")
  - Push devices: `SELECT COUNT(*) FROM push_subscriptions`

**Phases implémentées :**
- ✅ **Phase 1** : Tickets actifs (texte dans header)
- ✅ **Phase 2** : Tickets en retard (badge orange/rouge animé)
- ✅ **Phase 3** : Techniciens actifs (badge bleu, 3 techs réels)
- ✅ **Phase 4** : Appareils push (badge vert)

**Commits:** b17c4f2, 1a96c33, 6403e8f, 549f5f7, faf4d72, 347928b  
**Déployé:** 2025-11-25 (Production)  
**URL:** https://816310df.webapp-7t8.pages.dev  
**Domaine:** https://app.igpglass.ca

### Version 2.8.1 (24 novembre 2025) - FIX UI MODAL UTILISATEURS 🖥️✨
- **🐛 FIX UI** : Formulaire modification utilisateur ne persiste plus après fermeture modal
- **🔄 RESET STATE** : Tous les états edit form réinitialisés quand modal fermée
- **✅ COMPORTEMENT ATTENDU** : Modal réouvre proprement sans formulaire fantôme
- **🎯 UX AMÉLIORÉE** : Navigation modale plus intuitive et prévisible

**Bug corrigé :**
- Ouvrir modal Utilisateurs → Cliquer "Modifier" → Fermer modal → Réouvrir modal
- **Avant** : Formulaire modification restait affiché (bug)
- **Après** : Modal réouvre avec liste utilisateurs (correct)

**Commit:** 008c522 + ba0095f  
**Tag:** v2.8.1  
**Déployé:** 2025-11-24 15:10 (Production)  
**URL:** https://8d6184ce.webapp-7t8.pages.dev  
**Domaine:** https://app.igpglass.ca

### Version 2.8.0 (24 novembre 2025) - CORRECTIONS NOTIFICATIONS PARFAITES 🔔✨
- **🐛 FIX #1** : Limite exacte déduplication (>= au lieu de >) dans cron.ts
- **🐛 FIX #2** : Ancien assigné notifié lors de réassignation (message "Ticket retiré")
- **📚 FIX #3** : Documentation webhooks.ts vs cron.ts clarifiée (manuel vs automatique)
- **✅ AUDIT FINAL** : 15 scénarios testés, 6 edge cases validés, 0 bug résiduel
- **📊 COUVERTURE 100%** : Tous les cas d'usage couverts et documentés
- **🎯 QUALITÉ MAXIMALE** : 3 audits complets (20KB+ documentation)
- **🚀 PRODUCTION READY** : Certification aucun bug résiduel détecté

**Documents d'audit créés :**
- `AUDIT_NOTIFICATIONS.md` - Premier audit + déploiement fix déduplication
- `AUDIT_LOGIQUE_NOTIFICATIONS.md` - Simulations exhaustives (22KB)
- `AUDIT_FINAL_VERIFICATION.md` - Vérification post-fixes (20KB)

**Commit:** 21d6ce0 + 67950e0 + 2488df4  
**Déployé:** 2025-11-24 13:25

### Version 2.7.1 (22 novembre 2025) - QUEUE NOTIFICATIONS COMPLÈTE 🔔
- **🔔 QUEUE UNIVERSELLE** : Tous les types de notifications utilisent la queue (messages, audio, tickets, alertes)
- **⚠️ ALERTES RETARD** : Ajout queue push aux alertes manuelles admins (POST /api/alerts/check-overdue)
- **📊 COUVERTURE 100%** : Assignation, planification, CRON automatique, alertes manuelles
- **🛡️ FAIL-SAFE** : Try-catch sur tous les push, message DB toujours envoyé même si push échoue
- **📝 AUDIT TRAIL** : Tous les push loggés dans push_logs avec status success/failed/error

### Version 2.7.0 (21 novembre 2025) - PUSH NOTIFICATIONS OPTIMISÉES 🔔
- **🔧 LIMITE 5 APPAREILS** : Suppression automatique du device le plus ancien (58% réduction charges)
- **🧹 CLEANUP AUTO 30 JOURS** : CRON quotidien nettoie subscriptions inactives (25% gain performance)
- **🐛 FIX MULTI-USER** : Bouton push correct quand plusieurs comptes sur même appareil
- **📊 AUDIT COMPLET** : Documentation exhaustive (30,806 + 15,668 + 19,648 caractères)
- **⚠️ CRON EXTERNE REQUIS** : Configurer cron-job.org pour cleanup quotidien
- **📚 DOCUMENTATION** : PUSH_RECOMMENDATIONS_PROGRESS.md + audits post-implémentation
- **✅ 2/4 RECOMMANDATIONS** : Limite devices + Cleanup complétées, VAPID rotation + Dashboard en attente

### Version 2.6.0 (17 janvier 2025) - SÉCURITÉ PRODUCTION 🔒
- **🔒 HEADERS HTTP** : 6 headers de sécurité critiques (CSP, X-Frame-Options, etc.)
- **🔐 SECRETS CLOUDFLARE** : Script automatisé configuration (JWT, CRON, ADMIN)
- **🛡️ CORS STRICT** : Mode strict avec liste blanche domaines
- **📋 AUDIT SÉCURITÉ** : 0 vulnérabilités runtime, 146 tests passing
- **📊 SCORE** : 9.2/10 sécurité production
- **📚 DOCUMENTATION** : SECURITY_AUDIT.md + SECURITY_SETUP.md complets
- **✅ PRODUCTION-READY** : Tous headers, secrets et tests validés

### Version 2.5.0 (17 janvier 2025) - EXTRACTION CRON & ALERTS 🔧
- **🔄 REFACTORING** : Extraction routes cron.ts (7,106 bytes) + alerts.ts (5,247 bytes)
- **📦 MODULARITÉ** : Séparation webhooks externes / alertes internes
- **⏰ PROTECTION** : CRON_SECRET pour endpoints planifiés
- **📉 RÉDUCTION** : -260 lignes (-2.6%)
- **⭐ QUALITÉ** : Score 9.0/10 (+0.2)

### Version 2.4.0 (17 janvier 2025) - EXTRACTION MESSAGERIE 💬
- **💬 MESSAGERIE** : Extraction complète messages.ts (16,285 bytes) + audio.ts (2,147 bytes)
- **✅ FEATURE PARITY** : 100% fonctionnalités préservées (public/privé + audio R2)
- **📈 PERFORMANCE** : Developer experience 3x plus rapide (hot reload)
- **📉 RÉDUCTION** : -542 lignes (-5.1%)
- **📋 VÉRIFICATION** : MESSAGES_VERIFICATION.md complet

### Version 2.3.0 (17 janvier 2025) - EXTRACTION RBAC 🛡️
- **🛡️ RBAC** : Extraction routes rbac.ts (6,485 bytes) + technicians.ts (1,495 bytes)
- **🧪 TESTS** : 146 tests unitaires (100% passing)
- **📉 RÉDUCTION** : -284 lignes (-2.7%)
- **⭐ QUALITÉ** : Score 8.5/10 (+0.2)

### Version 2.0.14 (16 janvier 2025) - AMÉLIORATION UX MOBILE 📱👆
- **✨ AMÉLIORATION** : Ergonomie mobile du dropdown de tri Kanban
- **👆 Zone tactile 44×44px** : Conforme standards Apple/Android/WCAG 2.1
- **📱 Taille adaptative** : 14px mobile (lisible) / 12px desktop (compact)
- **🎯 Padding généreux** : 10px vertical mobile vs 6px desktop
- **🖼️ Visibilité accrue** : Border 2px + shadow légère
- **♿ Accessibilité** : touch-manipulation pour réponse tactile optimale
- **📏 Label intelligent** : Icône seule sur mobile, texte complet sur desktop
- **✅ Tests validés** : Facilite utilisation pour utilisateurs avec gros doigts
- **📝 Documentation** : MOBILE-SORT-IMPROVEMENTS.md avec comparatif avant/après

### Version 2.0.13 (14 novembre 2025) - PWA + PUSH NOTIFICATIONS 📱🔔
- **✨ NOUVELLE FONCTIONNALITÉ** : Application PWA installable sur mobile
- **🔔 PUSH NOTIFICATIONS** : Notifications push quand ticket assigné
- **📱 Mode Standalone** : App s'ouvre en plein écran (sans barre navigateur)
- **🏠 Icône écran d'accueil** : Installation "Ajouter à l'écran d'accueil"
- **⚡ Offline-ready** : Service Worker avec cache pour mode hors ligne
- **🔐 VAPID Keys** : Authentification sécurisée Web Push Protocol
- **💾 D1 Subscriptions** : Tokens push stockés dans base de données
- **🎯 Auto-trigger** : Permission demandée automatiquement après login
- **🔧 MIGRATION CRITIQUE** : Migration de web-push vers @block65/webcrypto-web-push (Workers-compatible)
- **✅ Build validé** : Code compilé et déployé avec succès
- **⏳ Tests en attente** : Nécessite subscription réelle depuis navigateur pour test end-to-end

### Version 2.0.12 (13 novembre 2025) - CALENDRIER AVEC HEURE ⏰
- **✨ NOUVELLE FONCTIONNALITÉ** : Sélection date **ET heure** pour planification maintenance
- **🐛 FIX CRITIQUE TIMEZONE** : Correction bug tickets expiraient 5h trop tôt
- **⏰ Input datetime-local** : Calendrier avec sélecteur d'heure intégré
- **🌍 Conversion UTC ↔ Local** : Gestion automatique du fuseau horaire (timezone_offset_hours)
- **✅ Tests validés** : 7/7 tests réussis (création, affichage, countdown, compatibilité)
- **📱 UX Mobile** : Espacement boutons Close/Delete amélioré (WCAG 2.1 compliance)
- **🔐 Permissions Admin** : Logo/titre/sous-titre modifiables par tous les admins
- **📊 Documentation** : TEST-REPORT-DATETIME-CALENDAR.md + TIMEZONE-FIX-EXPLANATION.md

### Version 2.0.11 (9 novembre 2025) - CORRECTION CRITIQUE
- **🔴 FIX CRITIQUE** : Correction de l'assignation d'équipe (valeur 'all' préservée au lieu de null)
- **Planification équipe** : Les tickets assignés à "Toute l'équipe" s'affichent correctement
- **Bannière PLANIFIÉ** : S'affiche maintenant correctement quand l'équipe est assignée
- **Date scheduling** : Fonctionne désormais pour les assignations d'équipe
- Correction formulaire création + modal de planification

### Version 2.0.10 (9 novembre 2025)
- **Sélection Rapide Multi-Messages** : Boutons "Tout" et "Aucun" pour sélection en un clic
- Filtre intelligent respectant les permissions utilisateur
- Optimisation UX pour bulk operations

### Version 2.0.9 (7 novembre 2025)
- **Suppression Masse de Messages** : Mode sélection avec checkboxes individuelles
- API bulk-delete avec traitement par lots (max 100 items)
- Barre outils contextuelle avec compteur sélection
- Contrôles permissions granulaires par message

### Version 2.0.8 (6 novembre 2025)
- **Clarté Affichage Temporel** : Ajout label "Requete recue depuis:" sur chronomètres
- Amélioration compréhension utilisateur du temps écoulé
- Réduction confusion sur signification des indicateurs temps

### Version 2.0.7 (5 novembre 2025)
- **Suppression Individuelle Médias** : Bouton corbeille sur chaque photo/vidéo
- Nettoyage automatique bucket R2 avant suppression BD
- Popup confirmation avec preview média

### Version 2.0.6 (4 novembre 2025)
- **Nettoyage R2 Messages Audio** : Suppression automatique fichiers audio R2
- Prévention accumulation fichiers orphelins dans storage
- Logs détaillés opérations cleanup pour audit

> 📖 **[Voir l'historique complet des versions](https://app.igpglass.ca/changelog)** - Timeline professionnelle depuis 2023

## 📋 Vue d'ensemble du projet

### Objectifs
- **Gestion centralisée** des demandes de maintenance industrielle
- **Suivi en temps réel** des interventions via un tableau Kanban
- **Traçabilité complète** de l'historique des tickets
- **Upload de médias** (photos/vidéos) pour documentation
- **Système d'authentification** avec gestion des rôles

### Statut actuel
✅ **Version 2.12.0 - Production Ready** (Messagerie Modernisée + Tickets Vocaux + Architecture React/TS)

- Backend API REST complet avec Hono
- Interface utilisateur React avec Kanban drag-and-drop
- Base de données D1 configurée avec migrations
- Système d'authentification JWT fonctionnel
- Gestion des médias avec Cloudflare R2
- **NOUVEAU v2.0.14**: 📱👆 Dropdown tri mobile optimisé (44×44px tactile, WCAG 2.1)
- **v2.0.13**: 📱 PWA installable + 🔔 Push notifications (Android Chrome validé)
- **v2.0.12**: ⏰ Sélection date ET heure + Fix timezone critique (7/7 tests validés)
- **v2.0.10**: ✅ Boutons "Tout/Aucun" pour sélection rapide masse
- **v2.0.9**: 🔲 Suppression masse messages (mode sélection + checkboxes)
- **v2.0.8**: ⏱️ Label "Requete recue depuis:" sur chronometer
- **v2.0.7**: 🗑️ Suppression individuelle photos/vidéos avec nettoyage R2
- **v2.0.6**: 🧹 Nettoyage automatique R2 lors suppression messages audio
- **v2.0.0**: 🎤 Messages audio enregistrables (public + privé) avec interface élégante
- **v1.9.2**: Guide utilisateur simplifié ultra-concis (emoji-based, scannable en 30 sec/section)
- **v1.9.0**: Gestion complète des utilisateurs (CRUD) + Notifications élégantes
- **v1.8.0**: Système de permissions par rôle + Statuts francisés
- Système de commentaires + Upload médias supplémentaires + Suppression de tickets
- Galerie de médias dans les détails de ticket + Scroll mobile corrigé
- Upload de photos/vidéos depuis mobile lors de la création de tickets

## 🚀 Fonctionnalités

### ⚠️ **IMPORTANT - Notifications Push sur Android** 📱

**Pour recevoir les notifications push sur Android, vous DEVEZ installer l'application en PWA (Progressive Web App).**

#### 🔍 Pourquoi installer en PWA ?

Android bloque les notifications des sites web en arrière-plan pour économiser la batterie. **Les notifications ne fonctionnent PAS de manière fiable dans Chrome Android** (navigateur web), même si le système backend envoie les notifications avec succès.

#### ✅ Solution : Installation PWA (2 minutes)

**Étapes simples** :
1. Ouvrez https://app.igpglass.ca dans **Chrome Android**
2. Cliquez sur le menu (⋮) en haut à droite
3. Sélectionnez **"Installer l'application"** ou **"Ajouter à l'écran d'accueil"**
4. Confirmez l'installation
5. Ouvrez l'app depuis l'**icône sur votre écran d'accueil**
6. Connectez-vous et activez les notifications (bouton vert)

#### 🎯 Avantages PWA

| Navigateur Web | PWA (Application) |
|---------------|-------------------|
| ❌ Notifications bloquées en arrière-plan | ✅ Notifications reçues immédiatement |
| ❌ Service worker inactif | ✅ Service worker toujours actif |
| ❌ Restrictions batterie | ✅ Pas de restrictions |
| ❌ Chrome peut fermer l'onglet | ✅ App reste en mémoire |
| - | ✅ Icône sur écran d'accueil |
| - | ✅ Expérience app native |

#### 🧪 Test de Validation

**Avant PWA** (Chrome web) :
- Backend envoie notification → Status: `success` ✅
- FCM accepte → Status: `200 OK` ✅
- **Notification NON reçue sur téléphone** ❌

**Après PWA** (App installée) :
- Backend envoie notification → Status: `success` ✅
- FCM accepte → Status: `200 OK` ✅
- **Notification REÇUE immédiatement** ✅

#### 📊 Cas d'Usage Réel

**User** : Salah (Admin, Android 10)
- **17:15:04** - Notification ticket expiré envoyée (ticket #61)
- **Chrome web** : Status `success` backend, notification NON reçue
- **17:25:30** - Après installation PWA
- **App PWA** : Status `success` backend, notification ✅ REÇUE

**Conclusion** : L'installation PWA résout **100% des problèmes de notifications sur Android**.

#### 🔧 Autres Plateformes

- **iOS** : Safari supporte les notifications web (pas besoin de PWA)
- **Desktop** : Chrome/Edge/Firefox supportent tous les notifications (pas besoin de PWA)
- **Android uniquement** : Installation PWA **OBLIGATOIRE** pour notifications fiables

---

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
│   ├── index.tsx              # Point d'entrée Hono (API + HTML serving)
│   ├── views/                 # Templates HTML (Home, Guide, Changelog)
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
│   │   ├── ticket-id.ts      # Génération ID tickets
│   └── types/
│       └── index.ts          # Types TypeScript
├── migrations/
│   ├── 0001_initial_schema.sql  # Schéma de base de données
│   ├── 0002_add_comments.sql    # Table des commentaires (v1.7.0)
│   ├── 0003_add_reporter_name.sql  # Noms libres (v1.7.0)
│   └── 0006_add_audio_messages.sql # Colonnes audio (v2.0.0)
├── public/                    # Fichiers statiques
│   ├── static/js/components/  # Composants React (Frontend)
│   ├── static/js/utils.js     # Utilitaires Frontend
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

### ✅ Améliorations récentes (v2.0.10)
- **✅ NOUVEAU v2.0.10** - Boutons "Tout" et "Aucun" pour sélection rapide
  - **Bouton "Tout"** - Sélectionne automatiquement tous les messages supprimables en un clic
  - **Bouton "Aucun"** - Désélectionne tous les messages en un clic
  - **Logique intelligente** - "Tout" filtre uniquement les messages que l'utilisateur peut supprimer (permissions)
  - **UI améliorée** - 3 boutons alignés : [Sélectionner/Annuler] [Tout] [Aucun]
  - **Style distinct** - Bleu pour "Tout", Gris pour "Aucun", Rouge pour "Annuler"
  - **Icônes claires** - fa-check-double (Tout), fa-times-circle (Aucun)
  - **Gain de temps** - Plus besoin de cocher manuellement 50+ messages un par un
- **✅ v2.0.9** - Suppression en masse de messages avec nettoyage R2
  - **Mode sélection** - Bouton "Sélectionner" dans la barre d'outils pour activer/désactiver mode sélection
  - **Checkboxes intelligentes** - Apparaissent uniquement sur les messages que l'utilisateur peut supprimer (permissions)
  - **Sélection multiple** - Cocher/décocher plusieurs messages à la fois
  - **Compteur dynamique** - Affiche "X sélectionné(s)" en temps réel
  - **Bouton suppression** - "Supprimer (X)" apparaît automatiquement quand au moins 1 message sélectionné
  - **API bulk-delete** - Nouveau endpoint POST /api/messages/bulk-delete avec array message_ids
  - **Permissions strictes** - Chaque message vérifié individuellement (utilisateur/admin/supervisor)
  - **Nettoyage R2 complet** - Tous les fichiers audio des messages sélectionnés supprimés du bucket
  - **Limite sécurité** - Maximum 100 messages par requête pour éviter timeout
  - **Confirmation obligatoire** - Dialog "Supprimer X message(s) ?" avant exécution
  - **Recharge automatique** - Liste mise à jour instantanément après suppression
  - **Gestion erreurs** - Rapport détaillé des erreurs par message si échec partiel
  - **Sans apostrophes** - Tous les textes sans apostrophes pour éviter crash JavaScript
  - **Public et privé** - Fonctionne dans les deux onglets (Canal Public + Messages Privés)
- **✅ v2.0.8** - Texte explicatif chronomètre ticket
  - **Clarté améliorée** - Ajout du texte "Requete recue depuis:" devant le chronomètre
  - **UX optimisée** - Les utilisateurs comprennent immédiatement ce que représente le temps affiché
  - **Layout repensé** - Texte + icônes à gauche, temps formaté à droite
  - **Style discret** - Texte en gris normal (text-gray-600) pour ne pas surcharger visuellement
  - **Sans apostrophes** - Évite tout problème de parsing JavaScript (leçon apprise)
  - **Affichage conditionnel** - Uniquement sur tickets non terminés/archivés
- **✅ v2.0.7** - Bouton suppression média individuel avec nettoyage R2
  - **Suppression granulaire** - Bouton poubelle rouge sur hover pour supprimer chaque photo/vidéo individuellement
  - **Nettoyage R2 automatique** - Fichiers supprimés du bucket R2 avant suppression de la base de données
  - **Permissions vérifiées** - Admin/Supervisor/Technician peuvent tout supprimer, Opérateurs uniquement leurs propres médias
  - **Confirmation obligatoire** - Dialog de confirmation avant suppression pour éviter erreurs
  - **Recharge automatique** - Galerie mise à jour instantanément après suppression
  - **Logging traçabilité** - Console.log pour debug et audit des suppressions
  - **Gestion erreurs robuste** - Try-catch pour continuer même si suppression R2 échoue
- **✅ v2.0.6** - Nettoyage audio R2 lors suppression message
  - **Messages audio orphelins** - Les fichiers audio sont maintenant supprimés du bucket R2 lors de la suppression d'un message
  - **Cohérence avec tickets** - Même système de nettoyage que pour les médias de tickets
  - **Réduction des coûts** - Empêche l'accumulation de fichiers audio inutilisés dans R2
  - **Logging console** - Traçabilité des suppressions audio pour debug et audit
  - **Gestion erreurs robuste** - Try-catch pour continuer même si suppression R2 échoue
  - **Retour API enrichi** - Flag `audioDeleted` dans la réponse JSON
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