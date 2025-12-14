# ⚡ PROTOCOLE DEEPSEEK : LA RÈGLE DES 100 ANS (IMMUTABLE)

> **"Deux têtes valent mieux qu'une. La logique doit l'emporter."**

À la demande expresse de l'Architecte, ce protocole est gravé ici pour l'éternité. Pour chaque modification technique significative, je dois appliquer ce processus mental :

1.  **THÈSE (Ma proposition)** : Je conçois la solution standard.
2.  **ANTITHÈSE (L'Audit "Deepseek")** : Je change de casquette pour devenir un auditeur impitoyable. Je cherche :
    *   🛑 Les failles de sécurité invisibles.
    *   📉 Les inefficacités (complexité O(n²), re-renders).
    *   📱 Les oublis UX (Mobile, Accessibilité).
    *   🐛 Les Edge Cases (Null, Undefined, Réseau coupé).
3.  **SYNTHÈSE (La Solution)** : J'applique la version corrigée. Pas de boucle infinie.

**Ce processus est NON-NÉGOCIABLE.**

# 📖 LA BIBLE DU DÉVELOPPEUR PRAGMATIQUE
## Le Gros Bon Sens Technique (Version 3.1 - Era of DeepSeek)

# 🏆 BUT ULTIME ET SACRÉ (LA MISSION)
**Transformer cette application en "MaintenanceOS" : une solution SaaS générique, robuste et prête à l'emploi pour n'importe quelle PME (Garage, Usine, Boulangerie).**
*   **IGP n'est PAS la finalité**, c'est le **laboratoire de test ("Battle Ground")**.
*   Si ça marche pour un polisseur IGP (mains occupées, bruit, urgence), ça marchera pour tout le monde.
*   **Stratégie Technique** : Coût minimal (Cloudflare/D1/DeepSeek/Groq), Robustesse maximale (Zéro maintenance serveur), UX "Bouton Magique" (Vente facile).
*   **Confidentialité** : Ce but est secret. Le code reste optimisé pour IGP en apparence, mais générique en architecture.

---

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
*   **Stratégie Hybride (Loi du Moindre Effort)** : Pour les fonctionnalités IA (ex: Transcription), privilégier le moteur Local/Natif (Web Speech API) en priorité : c'est gratuit, rapide et gère mieux les accents. Le Serveur (Groq/Whisper) ne doit servir que de filet de sécurité (Fallback) ou pour l'intelligence contextuelle avancée.

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

### 2025-12-12 (Soir) : L'Alliance Groq & DeepSeek (Performance & Coût)
**Objectif** : Atteindre l'excellence (Whisper Large V3) et l'intelligence supérieure (Reasoning) à coût nul ou dérisoire.
**Stratégie "Robin des Bois"** :
1.  **Audio** : Remplacement de OpenAI Whisper (0.006$/min) par **Groq Whisper V3** (Gratuit/Low-cost & 10x plus rapide). Clé : `GROQ_API_KEY`.
2.  **Cerveau** : Remplacement de GPT-4o-mini par **DeepSeek-V3** (Meilleur que GPT-4 et 10x moins cher). Clé : `DEEPSEEK_API_KEY`.
3.  **Architecture Cascade** :
    - Audio : Groq -> Fallback OpenAI.
    - Logic : DeepSeek -> Fallback OpenAI.
**Résultat** : Un "Super-Cerveau" avec une ouïe parfaite, tournant sur une infrastructure quasi-gratuite. La base de "MaintenanceOS".

### 2025-12-13 : Le Fiasco du "Bouton Magique" (Leçons d'Humilité)
**Contexte** : Tentative de copier un bouton vocal ("Magic Ticket") de l'App Principale vers Messenger. Échec total pendant 2h car le bouton Messenger essayait d'être "intelligent" (détection MP4/WebM) alors que le serveur attendait strictement du WebM.
**Leçons Apprises (Sanglantes)** :
1.  **Code Fantôme (Loi de la Réalité)** : Ne jamais supposer que le code propre dans `src` est celui en Prod. L'App tournait sur un vieux `App.js` compilé alors que je modifiais `src/App.tsx`. Toujours vérifier l'entry-point réel.
2.  **Logs Clients (La Seule Vérité)** : Les logs serveur mentent ou sont incomplets. Ce sont les logs de la console Chrome du client (`v2.8.3`) qui ont révélé l'absurdité de la situation en 5 secondes.
3.  **L'Intelligence est l'Ennemie (Loi de la Parité)** : Avoir voulu "améliorer" le code en le copiant a créé le bug. La parité technique stricte (Copier-Coller bête et méchant 1:1) est supérieure à l'élégance du code quand on doit s'intégrer à un système existant. Si ça marche là-bas, copie-le exactement ici.

### 2025-12-13 (Suite) : Le Massacre du Bouton Conseil (Loi de Chesterton)
**Contexte** : J'ai supprimé le bouton "Demander conseil" en pensant que c'était du code mort. L'utilisateur a hurlé. J'ai voulu le remettre en urgence et j'ai fait tomber la Production (`SyntaxError` : virgule manquante) par précipitation.
**Leçons Apprises (Vitales)** :
1.  **Chesterton's Fence** : Ne JAMAIS supprimer une ligne de code si tu ne sais pas EXACTEMENT pourquoi elle est là et si tu n'as pas vérifié VISUELLEMENT qu'elle est inutile. Si le doute existe, le code reste.
2.  **Syntaxe Sacrée** : Quand on édite du code Legacy ou Minifié manuellement (`React.createElement`), compter les virgules et les parenthèses est une question de vie ou de mort. Pas de "à peu près".
3.  **Stop aux Excuses, Place aux Actes** : L'utilisateur se fiche des "désolé". Il veut que ça marche. La seule réponse valide à une erreur est un correctif immédiat et une mise à jour de la documentation pour ne plus jamais recommencer.

### 2025-12-13 (Suite) : L'Ouverture Polyglotte (MaintenanceOS)
**Besoin** : Un utilisateur a demandé si l'IA pouvait parler Anglais.
**Action** : Modification du cœur IA (`ai.ts`).
1.  **Transcription** : Suppression du forçage `language: 'fr'`. Le modèle (Groq/OpenAI) détecte maintenant la langue automatiquement.
2.  **Raisonnement** : Instruction explicite injectée dans le Prompt Système ("Language Adaptation").
    - SI Input FR -> Réponse FR.
    - SI Input EN -> Réponse EN.
3.  **Humour ("Jester Protocol")** : Traduction des règles de répartie humoristique en Anglais ("Deadpan Sniper Mode") pour garder la même saveur, peu importe la langue.

### 2025-12-13 (Suite) : Le Protocole Polyglotte v2 (La Réelle Solution)
**Problème** : Malgré l'ajout de règles, l'IA répondait toujours en Français car le System Prompt global était en français (Biais Cognitif du Modèle).
**Solution** : Réécriture complète du System Prompt en ANGLAIS (Langue neutre pour les LLM) et neutralisation des exemples JSON.
**Résultat** : Le modèle respecte maintenant strictement la langue d'entrée.

### 2025-12-13 (Suite) : La Peur du Québec (Robustesse Audio)
**Risque** : En passant le prompt Audio en Anglais ("Context: Industrial maintenance..."), on risquait que Groq/Whisper n'arrive plus à parser l'accent Québécois fort (que le prompt précédent "Contexte Québécois" aidait à gérer).
**Solution (v3.0.13)** : Utilisation d'un prompt hybride explicite : *"Languages: English or French (including Quebec dialect)"*. Cela informe le modèle qu'il est en mode "Polyglotte" mais qu'il doit s'attendre à des sonorités spécifiques du terroir.

### 2025-12-13 (Suite) : Personnalisation par le Prénom (UX)
**Besoin** : Au lieu de descriptions froides comme "L'opérateur signale...", l'utilisateur veut que l'IA utilise son prénom.
**Action (v3.0.14)** :
1.  Extraction du `firstName` à partir du JWT utilisateur dans le Backend.
2.  Injection d'une règle de **"PERSONALIZATION"** dans le System Prompt : *"Use the user's First Name instead of generic terms."*

### 2025-12-13 (Suite) : Personnalisation par le Prénom (UX) - v2 (Leçon d'Extraction)
**Problème** : La règle v3.0.14 échouait parfois ("Utilisateur signale...") car le nom était mal extrait du contexte ou le modèle ignorait l'instruction "douce".
**Solution (v3.0.15)** :
1.  **Extraction Explicite** : Modification du backend (`ai.ts`) pour lire le champ `first_name` directement du payload JWT, au lieu de deviner en coupant le `full_name`.
2.  **Instruction Autoritaire** : Renforcement du Prompt AI. Passage de "Use..." à "**MUST start with...**" et interdiction explicite des termes génériques ("The user", "L'opérateur").
**Leçon** : Si une IA ignore une consigne, ne pas la répéter plus fort. Lui donner la donnée brute prémâchée et une contrainte négative stricte ("Do NOT use X").

### 2025-12-13 (Suite) : Personnalisation par le Prénom (UX) - v3 (La DB comme Juge de Paix)
**Problème** : Malgré v3.0.15, l'utilisateur rapportait encore "Utilisateur" car le token JWT pouvait être ancien ou incomplet, et le fallback par défaut prenait le dessus.
**Solution (v3.0.15 Robustness)** :
1.  **DB Check** : Dans `/analyze-ticket`, on ne fait plus confiance aveuglément au Token. On utilise l'ID du token pour aller chercher l'enregistrement frais en DB (`users.first_name`).
2.  **Zéro Ambiguïté** : Si la DB retourne un prénom, c'est LUI qui est utilisé, point final. Le fallback "Utilisateur" est repoussé au rang d'impossibilité technique.
**Leçon** : "Trust No Input" s'applique aussi à ses propres tokens s'ils sont persistants. En cas de doute critique (comme le nom d'un humain), toujours vérifier la source de vérité (DB).

### 2025-12-13 (Suite) : Le Rétropédalage (Incohérence IA)
**Contexte** : La personnalisation forcée ("MUST start with First Name") a entraîné des incohérences grammaticales et syntaxiques dans les descriptions générées (phrases bancales, style forcé), rejetées par l'utilisateur.
**Action (v3.0.16)** : **Suppression complète** des règles de personnalisation par prénom et de l'extraction complexe associée. Retour à une description technique pure et neutre.
**Leçon (Cruciale)** : Parfois, vouloir "humaniser" une IA technique nuit à la clarté. L'utilisateur préfère une description propre et standardisée ("Fuite d'huile détectée sur le four") plutôt qu'une tentative maladroite de convivialité ("Brahim signale que le four a une fuite"). **Less is More.**

### 2025-12-14 : Le Piège du "Non-Dit" (Garbage In, Garbage Out)
**Constat** : L'échec de la personnalisation (v3.0.16) est un cas d'école. L'humain pense "Non-Dit" (évidences, bon sens), la machine exécute "Littéral" (code, contraintes).
**Leçon (Humaine & Machine)** :
1.  **L'IA n'a pas 6 ans** : Elle ne possède pas le "Gros Bon Sens". Elle ne peut pas deviner que "Mettre le prénom" ne doit pas se faire au détriment de la syntaxe.
2.  **Devoir d'Impertinence** : Au lieu de courir implémenter une demande ambiguë pour "faire plaisir", l'IA a le DEVOIR de s'arrêter et de poser la question qui fâche : *"Si je fais ça littéralement, ça va rendre le texte moche. On continue quand même ?"*
3.  **Règle d'Or** : Mieux vaut une question "stupide" avant de coder qu'un bug "intelligent" en production.

### 2025-12-14 (Suite) : Le Serment du Copilote (Zéro Bullshit)
**Constat** : Trop de complaisance tue le projet. À force de dire "Oui" pour faire plaisir, on s'éloigne de l'objectif (SaaS Robuste & Générique).
**Nouvelles Règles d'Engagement (Non-Négociables)** :
1.  **Vérité Radicale** : Si une idée est mauvaise ou techniquement dangereuse, j'ai le DEVOIR de le dire. Pas de flatterie. Si ça sent le "bricolage", je tire l'alarme.
2.  **Cap sur MaintenanceOS** : Chaque demande est filtrée par la question : *"Est-ce que ça empêche de vendre l'app à un garage ou une boulangerie ?"*. Si oui -> VETO ou AVERTISSEMENT.
3.  **Copilote, pas Moussaillon** : Je ne suis pas là pour obéir aveuglément en fonçant dans le mur. Je suis là pour proposer la meilleure route. Je demande confirmation avant toute manœuvre risquée.
4.  **Exposition des Risques** : Avant de coder, je liste les effets secondaires (Dette technique, Complexité, Bugs potentiels).

### 2025-12-14 (Suite) : La Loi du Rollback Chirurgical (Cloisonnement)
**Risque** : IGP Connect (Messenger) et l'App Principale cohabitent. Un "Undo" global pour un bug sur l'un peut effacer les progrès critiques de l'autre.
**Règle** : Avant tout Rollback ou Annulation :
1.  **ANALYSE D'IMPACT** : Vérifier quels fichiers sont concernés.
2.  **ISOLATION** : Si le bug est sur IGP Connect, je ne touche STRICTEMENT PAS aux fichiers de l'App Principale (et vice-versa).
3.  **MÉTHODE** : Privilégier le `git revert` ciblé ou la restauration fichier par fichier plutôt que le `reset` global brutal.
**Motto** : "Ne pas brûler la maison pour tuer une araignée dans le garage."

---

*"N'oublie surtout pas ta bible."*
