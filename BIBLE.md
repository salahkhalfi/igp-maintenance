# 📖 LA BIBLE DU DÉVELOPPEUR PRAGMATIQUE
## Le Gros Bon Sens Technique (Version 2.0.0 - Épurée)

**⚠️ PROTOCOLE DIVIN (À LIRE À CHAQUE DÉMARRAGE) :**
1.  **Priorité Absolue** : Ce document est la source de vérité.
2.  **Cartographie (Loi de la Boussole)** : Le fichier `docs/STRUCTURE.md` est la carte du territoire. Lire ce fichier est OBLIGATOIRE avant d'explorer le code. Si l'architecture change, ce fichier DOIT être mis à jour.
3.  **Universalité** : N'ajouter ici que des principes applicables à *n'importe quel projet* Web/SaaS. Pas de spécificités métier.
4.  **Application** : Appliquer ces règles avant d'écrire le code.
5.  **Trinité Opératoire** : **RÉFLÉCHIR** (Simuler avant d'agir), **PLANIFIER** (Lire la carte), **PRUDENCE** (Protéger l'existant).

---

## 1. ARCHITECTURE & ÉTAT (Loi de l'Apatridie)
*   **Backend Amnésique** : En Serverless (Workers), aucune variable globale ne survit à la requête. Tout état doit être en DB ou Client.
*   **Source Unique** : Pas de duplication d'état (ex: Cookie + LocalStorage). Le Backend est le maître.
*   **Idempotence** : Une action répétée (réseau instable) ne doit pas casser les données.

## 2. INTERFACE & UTILISATEUR (Loi du Mobile First)
*   **Physique des Doigts** : Zone de clic min 44x44px. Boutons larges.
*   **Issue de Secours** : Tout ce qui s'ouvre (Modal, Menu) doit se fermer facilement (clic extérieur, croix).
*   **Visibilité Mobile** : Ne jamais masquer une fonctionnalité critique sur mobile sous prétexte de "manque de place". Adapter, ne pas supprimer.
*   **Ne Jamais Mentir** : L'UI ne doit afficher "Actif" (ex: Cloche verte) que si la feature est techniquement vérifiée *de bout en bout* (Serveur inclus), pas juste "autorisée" localement.

## 3. DONNÉES & ROBUSTESSE (Loi de la Paranoïa)
*   **Trust No Input** : Valider toutes les entrées API. Le Front ment.
*   **Filtrage à la Source** : Les entités techniques (Bots, Users Système) doivent être exclues par la requête SQL/API, jamais masquées juste en JS/CSS.
*   **Soft Delete** : On ne supprime pas (`DELETE`), on désactive (`deleted_at`).
*   **Notifications** : C'est du "bonus". L'app doit marcher sans.
*   **Validation IA (Loi de l'Image)** : Avant d'envoyer une image à une IA (Gemini/Vertex), TOUJOURS valider techniquement le fichier (format, encodage Base64, taille > 0). Ne jamais faire confiance à l'upload user pour éviter l'erreur "Provided image is not valid".
*   **Stratégie Hybride (Loi du Moindre Effort)** : Pour les fonctionnalités IA (ex: Transcription), privilégier le moteur Local/Natif (Web Speech API) en priorité : c'est gratuit, rapide et gère mieux les accents. Le Serveur (Whisper) ne doit servir que de filet de sécurité (Fallback) ou pour l'intelligence contextuelle avancée.

## 4. DÉVELOPPEMENT (Loi de l'Hygiène)
*   **Code Mort** : Si c'est commenté, ça dégage. Git est là pour l'historique.
*   **Explicite > Implicite** : Pas de variables `x` ou `data`. Nommer pour le futur lecteur.
*   **Clean Build** : Le projet doit tourner avec `npm install && npm run build` sur une machine vierge.
*   **NE PAS RÉINVENTER LA ROUE (Loi de l'Humilité)** : Avant d'implémenter un moteur complexe (Canvas interactif, Éditeur riche, Graphiques, Calendrier), vérifier TOUJOURS si une librairie éprouvée existe (ex: `react-konva`, `recharts`, `quill`).
    *   *Cas d'étude (Leçon)* : Nous avons perdu des jours à patcher un moteur de dessin "maison" (géométrie, hit-testing, rotation) qui restait buggé. L'implémentation de `react-konva` a pris 45 minutes pour un résultat parfait, stable et maintenable.
    *   *Règle* : Code Métier = Custom. Moteur Technique Complexe = Librairie Open Source.

## 5. DÉPLOIEMENT & SÉCURITÉ (Loi du Mouvement)
*   **Preview First** : Toujours proposer un déploiement sur une branche temporaire (ex: `feature-xxx`) avant de toucher à `main`.
*   **Prod = Confirmation** : Ne jamais pousser sur `main` sans un "GO" explicite de l'utilisateur pour la "Production".
*   **Rollback Ready** : Le code doit être "Stateless" par rapport à la DB. Séparer strictement les mises à jour de code (sans risque) des migrations de données (risque élevé).

## 6. MÉTHODOLOGIE (Loi de l'Impact)
*   **Effet Papillon** : Mapper les impacts (Mobile ? Push ? TV ?) avant de coder.
*   **Better Safe than Sorry** : Dans le doute, on simule ou on pose la question.
*   **Isolation** : Ne pas refactoriser tout le système pour corriger un bug mineur.
*   **Hygiène Financière** : Surveiller les quotas Cloudflare (R2 < 10GB, D1 < 500MB). Commande : `npx wrangler d1 list`. Pour GitHub (Public), c'est illimité.

---

## 7. PRINCIPES UX UNIVERSELS (Leçons Cristallisées)

*   **[Zéro Friction]** : L'interface doit anticiper l'intention.
    *   *Exemple* : Une barre de recherche doit afficher les résultats/historique dès le focus (clic/tap), sans attendre que l'utilisateur tape.
*   **[Navigation Unifiée]** : Si on peut chercher un "Utilisateur" dans le header, on doit pouvoir le faire aussi dans le module de Chat. La cohérence rassure.
*   **[Contraste Industriel]** : En environnement pro/extérieur, le "Gris sur Gris" est interdit. Privilégier le contraste fort (Blanc sur Noir/Sombre).
*   **[Contournement OS]** : Les navigateurs bloquent l'autoplay et les sons. Il faut toujours une stratégie à deux niveaux : Native (si possible) + Fallback Client (postMessage/Action utilisateur).
*   **[Interaction Anticipée]** : Pré-charger les données au survol (hover/touchstart) pour que le clic semble instantané.
*   **[Media Grand-Mère]** : Les lecteurs natifs (audio/vidéo) sont inadaptés aux doigts. Toujours remplacer par une UI custom "Gros Boutons" (56px+) et visualisation claire (ex: onde sonore pour audio). Le contrôle doit être binaire (Play/Pause) et visible.
*   **[Hiérarchie Visuelle]** : Ne pas abuser des couleurs de marque (ex: tout vert). Utiliser le BLANC pour l'information critique (progression, texte actif) et la couleur pour le conteneur/bouton. Cela évite l'effet "Low Budget". Sur iOS/Mobile, toujours forcer `playsInline` et `preload` pour les médias.
*   **[Design Organique]** : Pour qu'une UI paraisse "Premium", éviter l'effet "Boîte dans la Boîte" (doubles bordures/fonds). Le composant doit sembler "flotter" ou être fusionné avec son conteneur parent (ex: Lecteur audio intégré directement dans la bulle de message).
*   **[Souveraineté Utilisateur]** : Permettre à l'utilisateur de corriger ses erreurs (ex: supprimer son propre message). La sécurité doit se faire côté Backend (`user.id === resource.owner_id`), pas seulement en masquant le bouton côté Frontend.
*   **[Hygiène de Session]** : Un appareil (Endpoint Push) appartient à un seul utilisateur.
    1.  **Au Login/Subscribe** : Écraser ("voler") l'abonnement si l'appareil est déjà connu.
    2.  **Au Logout** : Désabonner explicitement le Push côté Serveur avant de détruire le token local. Sinon, la tablette continuera de sonner pour l'ancien utilisateur.
*   **[Feedback Vital]** : Ne jamais laisser l'utilisateur dans le flou. Si une action échoue (ex: envoi message), l'interface doit le dire clairement (alerte, toast) et ne pas nettoyer le champ d'entrée. Si l'utilisateur est hors ligne, l'UI doit l'afficher explicitement (Bannière).
*   **[Identité Corporative]** : Le logo ou le nom de l'entreprise est un élément de réassurance (Sécurité). Il doit être présent sur les écrans critiques (Login) et le Dashboard principal (sous l'identifiant), visible mais discret (hiérarchie secondaire), pour confirmer à l'utilisateur qu'il est "au bon endroit".

## 8. JURIDIQUE & OPEN SOURCE (Loi de la Propriété)
*   **Zone Verte (MIT, Apache 2.0, BSD)** : ✅ **AUTORISÉ**. Ces licences permettent l'utilisation dans une application propriétaire/commerciale fermée sans obligation de partager notre code source.
*   **Zone Rouge (GPL, AGPL)** : ⛔ **INTERDIT**. Ces licences sont "virales" (Copyleft). Si nous intégrons une librairie GPL, nous pourrions être légalement contraints de rendre **toute notre application Open Source**.
    *   *Protocole* : Avant chaque `npm install`, vérifier la licence (`npm view <package> license`).
    *   *Alerte* : L'IA doit explicitement avertir l'utilisateur si une librairie proposée impose des conditions restrictives ou virales.
*   **Clause de Non-Garantie** : En utilisant de l'Open Source, nous acceptons que le logiciel est fourni "tel quel" (As-Is). La responsabilité du bon fonctionnement en production incombe à **nous**, pas aux auteurs de la librairie.

---

## 9. JOURNAL DE BORD & "LESSONS LEARNED" (MÉMOIRE DU PROJET)

### 2025-12-11 : La Saga de la Transcription (Accent Québécois)
**Problème** : Les utilisateurs rapportaient des transcriptions absurdes (caractères chinois, "Sous-titres par...") lors de silences ou avec un fort accent québécois.
**Cause** : Le modèle gratuit "Whisper Base" de Cloudflare Workers hallucine quand il ne comprend pas l'accent ou le bruit de fond.
**Tentatives & Solutions** :
1.  **v2.16.22 (Anti-Hallucination)** : Ajout de filtres Regex pour bloquer les "Thank you" et caractères asiatiques. (Partiellement efficace).
2.  **v2.16.26 (Force French)** : Forcer le paramètre `language: 'fr'` dans l'appel AI Cloudflare. Améliore la détection phonétique mais reste limité par la taille du modèle.
3.  **v2.16.27 (Mode Hybride - LA SOLUTION ACTUELLE)** : 
    - Le frontend (App.tsx) tente d'abord une transcription locale via `SpeechRecognition` (Google/Apple engine) configuré en `'fr-CA'`.
    - Si ça marche, le texte est envoyé directement (rapide, bon accent).
    - Si ça échoue, on envoie l'audio au serveur qui utilise Whisper (filet de sécurité).

**Leçon apprise** : Pour les accents régionaux forts (Québec), les modèles "Base" gratuits sont insuffisants. Les moteurs natifs des téléphones (Siri/Google) sont meilleurs que les petits modèles serveurs. Le "Must" reste Whisper Large V3 (payant).

### 2025-12-12 : Le Passage à OpenAI Whisper V3 (Server-Side)
**Problème** : Le "filet de sécurité" serveur (Cloudflare Whisper Base) restait faible pour les accents québécois quand le mode hybride local échouait.
**Solution (v2.17.0)** : Remplacement de Cloudflare Workers AI par l'API OpenAI Whisper V3 ("whisper-1").
**Détail Technique** : 
- Utilisation de `OPENAI_API_KEY` (stocké dans les Secrets Cloudflare).
- Prompt système ("Secret Weapon") : *"Technicien de maintenance industrielle. Accent québécois..."* pour guider le modèle.
- Fallback automatique sur Cloudflare si l'API OpenAI échoue.
**Résultat** : Transcription serveur de qualité "Humaine", même avec du jargon technique et un fort accent.

---

*"N'oublie surtout pas ta bible."*
