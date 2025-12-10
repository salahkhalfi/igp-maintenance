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

## 4. DÉVELOPPEMENT (Loi de l'Hygiène)
*   **Code Mort** : Si c'est commenté, ça dégage. Git est là pour l'historique.
*   **Explicite > Implicite** : Pas de variables `x` ou `data`. Nommer pour le futur lecteur.
*   **Clean Build** : Le projet doit tourner avec `npm install && npm run build` sur une machine vierge.

## 5. DÉPLOIEMENT & SÉCURITÉ (Loi du Mouvement)
*   **Preview First** : Toujours proposer un déploiement sur une branche temporaire (ex: `feature-xxx`) avant de toucher à `main`.
*   **Prod = Confirmation** : Ne jamais pousser sur `main` sans un "GO" explicite de l'utilisateur pour la "Production".
*   **Rollback Ready** : Le code doit être "Stateless" par rapport à la DB. Séparer strictement les mises à jour de code (sans risque) des migrations de données (risque élevé).

## 6. MÉTHODOLOGIE (Loi de l'Impact)
*   **Effet Papillon** : Mapper les impacts (Mobile ? Push ? TV ?) avant de coder.
*   **Better Safe than Sorry** : Dans le doute, on simule ou on pose la question.
*   **Isolation** : Ne pas refactoriser tout le système pour corriger un bug mineur.

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
*   **[Identité Corporative]** : Le logo ou le nom de l'entreprise est un élément de réassurance (Sécurité). Il doit être présent sur les écrans critiques (Login) et le Dashboard principal (sous l'identifiant), visible mais discret (hiérarchie secondaire), pour confirmer à l'utilisateur qu'il est "au bon endroit".
