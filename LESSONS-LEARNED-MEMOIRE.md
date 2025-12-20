# MÉMOIRE TECHNIQUE DU PROJET (V5.2-STABLE)
*Dernière mise à jour : 20 Décembre 2025*

## ⚠️ DOCUMENT D'HISTORIQUE UNIQUEMENT
**POUR LES RÈGLES ET PROCÉDURES, CONSULTER IMPÉRATIVEMENT `BIBLE.md` À LA RACINE.**
**CE FICHIER NE CONTIENT QUE DES DÉTAILS D'IMPLÉMENTATION SPÉCIFIQUES.**

---

## 1. Architecture "Soft Delete" (Protection des Données)
- **Règle :** Ne jamais utiliser `DELETE FROM` sur les tables `users`, `tickets`, ou `machines`.
- **Mécanisme :** Utiliser `UPDATE table SET deleted_at = CURRENT_TIMESTAMP`.
- **Conséquence Chat :** Les requêtes SQL dans `chat.ts` filtrent explicitement `WHERE deleted_at IS NULL` pour éviter les utilisateurs fantômes.
- **Conséquence IA :** Le contexte injecté dans l'IA (`ai.ts`) filtre également les données supprimées pour éviter les hallucinations.

## 2. Intelligence Artificielle & Chat
- **Transcription Audio :** 
  - Chat vocal : Utilise **Groq** (Whisper V3) pour la rapidité instantanée.
  - Tickets vocaux : Utilise une logique similaire mais séparée dans `ai.ts`.
- **Traduction des Statuts :**
  - L'IA ne doit pas inventer de statuts. Elle utilise un mapping strict aligné sur les colonnes Kanban du frontend :
    - `received` -> "Nouveau"
    - `diagnostic` -> "En diagnostic"
    - `waiting_parts` -> "En attente de pièces"
    - `in_progress` -> "En cours"
    - `completed` -> "Terminé"

## 3. Sécurité Frontend (Pare-feu Anti-Hallucination)
- **Problème :** L'IA a tendance à générer des liens absolus hallucinés comme `https://api/media/27` ou `https://igpglass.com/api/...`.
- **Solution (NE PAS RETIRER) :** Le composant `AIChatModal.tsx` contient une regex agressive qui force le remplacement de tout domaine précédant `/api/media` par un chemin relatif simple.
- **Backend Media :** Les routes médias (`media.ts`) nettoient et encodent les noms de fichiers (UTF-8) pour éviter les erreurs 503 sur les headers HTTP.

## 4. Pipeline de Déploiement Sécurisé
- **Commande obligatoire :** Toujours utiliser `npm run deploy:safe`.
- **Pourquoi :** Cette commande force la migration de la base de données (`wrangler d1 migrations apply`) AVANT de déployer le code. Cela empêche le déploiement de code qui cherche des colonnes inexistantes.

## 5. État Actuel
- **Version :** v5.1-beta (Stabilisée)
- **URL Prod :** https://c2814c09.webapp-7t8.pages.dev
- **Base de données :** Synchronisée (production & locale).
