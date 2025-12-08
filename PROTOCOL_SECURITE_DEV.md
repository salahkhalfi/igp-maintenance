# PROTOCOL_SECURITE_DEV.md

> "La chose la plus difficile que les AI font est qu'ils modifient d'autres fonctions inutilement ce qui casse l'intégrité de l'application et cause énormément de gaspillage de temps et d'argent."

Ce protocole est **ÉTERNEL et PERMANENT**. Il doit être consulté et respecté avant CHAQUE modification.

## 1. ANALYSE PRÉALABLE (RÉFLEXION)
Avant de toucher à la moindre ligne de code :
- [ ] **Lire** intégralement la demande.
- [ ] **Évaluer les risques** : Quels fichiers sont touchés ? Quels sont les effets de bord possibles (base de données, autres composants) ?
- [ ] **Identifier les dépendances** : Est-ce que cela touche au système de son ? Aux notifications ? À l'authentification ?
- [ ] **Poser des questions** : S'il y a la moindre ambiguïté (ex: "Audio" = VoIP ou Notification ?), DEMANDER. Ne jamais supposer.

## 2. PLANIFICATION RIGOUREUSE
- [ ] Écrire un plan étape par étape.
- [ ] Ne jamais improviser en cours de route.
- [ ] Vérifier la faisabilité technique (ex: limitations Cloudflare).

## 3. SÉCURISATION (SAFEPOINT)
- [ ] **OBLIGATOIRE** : Créer un commit Git explicite AVANT modification.
- [ ] Message : `PRE-SAFEPOINT: Backup before [Action]`
- [ ] **Garantie de retour** : Être capable de faire `git reset --hard` pour revenir à l'état exact (sans aucun fichier "poubelle" restant).

## 4. CHIRURGIE DU CODE (MODIFICATION)
- [ ] Modifier **UNIQUEMENT** le nécessaire.
- [ ] **INTERDICTION** de reformater/toucher le code adjacent non concerné.
- [ ] Utiliser `Edit` ou `MultiEdit` avec précision chirurgicale.
- [ ] Vérifier que le code modifié respecte les standards existants (Hono, React, Tailwind).

## 5. VÉRIFICATION
- [ ] Compiler (`npm run build`).
- [ ] Vérifier les logs d'erreur.
- [ ] Si échec -> **ROLLBACK IMMÉDIAT** (`git reset --hard`) avant de réfléchir à nouveau. Ne pas "bricoler" une solution sur une base cassée.

---
**ENGAGEMENT** : Je ne sacrifierai jamais la stabilité de l'application pour une nouvelle fonctionnalité. Si je ne suis pas sûr à 100%, je ne fais pas.
