# 🔒 Informations de Sauvegarde - Titre/Sous-titre Personnalisé

**Date de création:** 2025-11-12 17:26:33  
**État sauvegardé:** Code stable avec logo upload + file input français

---

## ✅ Sauvegardes Créées

### 1️⃣ Branche Git de Backup
```bash
Branch: backup-before-title-subtitle-20251112-172617
Commande pour revenir: git checkout backup-before-title-subtitle-20251112-172617
```

### 2️⃣ Backup Complet Projet (tar.gz)
```
URL: https://www.genspark.ai/api/files/s/oJRmSCwE
Nom: webapp-before-title-subtitle-feature.tar.gz
Taille: 28.5 MB
Contenu: Code source + git history + configurations
```

### 3️⃣ Backup Base de Données Locale
```bash
Emplacement: .wrangler/state/v3/d1.backup-20251112-172633
Type: Copie complète de la database SQLite locale
```

---

## 🔄 Comment Revenir en Arrière

### Option A: Utiliser le Script Automatique (RECOMMANDÉ)
```bash
cd /home/user/webapp
./ROLLBACK.sh
# Suivez les instructions à l'écran
```

### Option B: Rollback Manuel Git
```bash
cd /home/user/webapp
git checkout backup-before-title-subtitle-20251112-172617
npm run build
pm2 restart webapp
```

### Option C: Rollback Manuel Database
```bash
cd /home/user/webapp
rm -rf .wrangler/state/v3/d1
cp -r .wrangler/state/v3/d1.backup-20251112-172633 .wrangler/state/v3/d1
```

### Option D: Restauration Complète depuis Tar.gz
```bash
# 1. Télécharger depuis: https://www.genspark.ai/api/files/s/oJRmSCwE
# 2. Extraire
tar -xzf webapp-before-title-subtitle-feature.tar.gz
# 3. Le projet est restauré à /home/user/webapp avec tout son contenu
```

---

## 📋 État du Code Avant Modifications

### Fonctionnalités Opérationnelles ✅
- Logo personnalisé (upload R2)
- File input en français
- Super admin (salah@khalfi.com)
- Système de permissions RBAC
- Gestion des tickets
- Messagerie interne
- Upload media avec preview

### Derniers Commits
```
0113915 - UX: Franciser le sélecteur de fichier et améliorer le responsive
```

### Déploiement Production Actuel
```
URL: https://db0e3945.webapp-7t8.pages.dev
Status: ✅ Stable
Build: 646.63 kB
```

---

## ⚠️ À NE PAS FAIRE

❌ **NE PAS** supprimer les fichiers de backup:
- `.wrangler/state/v3/d1.backup-20251112-172633/`
- Branche `backup-before-title-subtitle-20251112-172617`

❌ **NE PAS** merge la branche de travail dans main tant que non testé

❌ **NE PAS** déployer en production sans tests complets

---

## 📞 En Cas de Problème

Si quelque chose ne fonctionne pas après les modifications:

1. **STOP** immédiatement
2. Exécutez `./ROLLBACK.sh` 
3. Choisissez l'option 3 (rollback complet)
4. Rebuild: `npm run build`
5. Redémarrez: `pm2 restart webapp`

---

## 🎯 Modifications Prévues

Les changements suivants vont être implémentés:

1. ✏️ Migration SQL: Ajouter `company_title` et `company_subtitle` dans `system_settings`
2. 🔐 Route API: `/api/settings/title` et `/api/settings/subtitle` (super admin only)
3. 🎨 Interface UI: Section dans modal Paramètres Système
4. 🔄 Frontend: Lecture dynamique au chargement
5. ✅ Validation: Max 100/150 caractères, échappement HTML, UTF-8

**Impact estimé:** FAIBLE - seulement 2 lignes de texte modifiées dans l'UI

---

**Créé par:** AI Assistant  
**Validé par:** Salah Khalfi  
**Version:** Pre-Title-Subtitle-Feature
