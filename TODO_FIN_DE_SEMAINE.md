# 📋 TODO - Fin de Semaine

**Date**: 2025-11-21  
**Projet**: Maintenance App - https://mecanique.igpglass.ca

---

## 🎯 Tâches Planifiées

### 1. **CRON: Rotation Automatique Clés VAPID** ⭐ HIGH PRIORITY
- **Objectif**: Rotation clés VAPID tous les 90 jours pour sécurité
- **Endpoint**: `/api/cron/rotate-vapid-keys`
- **Fréquence**: Mensuel
- **Effort**: 1-2 jours
- **Documentation**: PUSH_RECOMMENDATIONS_PROGRESS.md (ligne 69-92)

**Bénéfices**:
- ✅ Sécurité renforcée contre compromission clés
- ✅ Conformité best practices Web Push Protocol
- ✅ Re-subscription automatique des clients

---

### 2. **CSS: Refactoring Classes TailwindCSS** 🎨 MEDIUM PRIORITY
- **Objectif**: Extraire classes répétées dans `src/styles.css`
- **Effort**: 1-2 heures
- **Impact**: Modal utilisateurs + autres composants lourds

**Actions**:
1. Créer classes réutilisables dans `src/styles.css`:
   - `.btn-primary` (bouton bleu principal)
   - `.btn-secondary` (bouton gris)
   - `.btn-danger` (bouton rouge)
   - `.btn-success` (bouton vert)
   - `.btn-warning` (bouton jaune)
   - `.user-card` (carte utilisateur)
   - `.form-input` (input standardisé)

2. Remplacer dans le code:
   ```javascript
   // Avant (385 caractères):
   className: 'w-full sm:w-auto px-4 py-2.5 bg-gradient-to-br from-blue-600...'
   
   // Après (12 caractères):
   className: 'btn-primary'
   ```

3. Tester modal utilisateurs et autres pages

**Bénéfices**:
- ✅ Code 10x plus lisible et maintenable
- ✅ Performance légèrement meilleure (moins de parsing CSS)
- ✅ Cohérence visuelle garantie
- ✅ Modifications futures plus rapides

**Composants à refactorer**:
- Modal Gestion Utilisateurs (4600-4920)
- Formulaires création/édition
- Autres modals si temps disponible

---

### 3. **CRON Optionnels** (Si Temps Disponible)
- Backup automatique DB (hebdomadaire)
- Purge anciens tickets complétés >6 mois (mensuel)
- Rapport statistiques email (hebdomadaire)
- Cleanup médias R2 orphelins (mensuel)

---

## 📝 Notes Importantes

### Ordre de Priorité Recommandé:
1. **CSS Refactoring** (1-2h) - Quick win, amélioration immédiate
2. **CRON VAPID** (1-2 jours) - Important pour sécurité

### Avant de Commencer:
- ✅ Lire INSTRUCTIONS_SESSION_MARC.md (si créé)
- ✅ Créer backup git: `git commit -m "Avant travaux fin de semaine"`
- ✅ Tester sur environnement local avant déploiement

### Après Chaque Tâche:
- ✅ Commit git avec message descriptif
- ✅ Tester fonctionnalité modifiée
- ✅ Déployer sur production
- ✅ Vérifier sur https://mecanique.igpglass.ca

---

## 🔗 Références

- **PUSH_RECOMMENDATIONS_PROGRESS.md** - Détails CRON VAPID
- **CRON_COMPLETE_CONFIGURATION.md** - Config CRON existants
- **README.md** - État général du projet

---

**Dernière mise à jour**: 2025-11-21
