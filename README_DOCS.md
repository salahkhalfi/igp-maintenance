# 📚 Documentation du Projet - Index

**Guide complet pour éviter les erreurs et déployer en toute sécurité**

---

## 🎯 DOCUMENTS PAR URGENCE

### 🔥 URGENT - Besoin Immédiat
1. **`QUICK_REFERENCE.md`** - Antisèche déploiement (30 secondes)
2. **`DEPLOYMENT_CONFIG.md`** - URLs actuelles (source de vérité)

### 📋 QUOTIDIEN - Usage Régulier
3. **`ANTI_ERREUR_GUIDE.md`** - Comment éviter les erreurs (lire une fois)
4. **`scripts/deploy-test.sh`** - Script déploiement test
5. **`scripts/deploy-prod.sh`** - Script déploiement production

### 🔒 SÉCURITÉ - En Cas de Problème
6. **`ROLLBACK_INFO.md`** - Procédures de rollback

### 📖 RÉFÉRENCE - Documentation Complète
7. **`README.md`** - Documentation principale du projet
8. **Ce fichier** - Index de tous les documents

---

## 📄 DESCRIPTION DES DOCUMENTS

### 1. QUICK_REFERENCE.md ⚡
**Quand l'utiliser:** Avant chaque déploiement
```bash
npm run info:quick
```
**Contenu:**
- Workflow en 3 étapes
- Commandes essentielles
- Checklist
- Rollback rapide

---

### 2. DEPLOYMENT_CONFIG.md 📍
**Quand l'utiliser:** À chaque fois que vous avez besoin d'une URL
```bash
npm run info:urls
```
**Contenu:**
- URLs production, test, backup
- Deployment IDs
- Commits Git
- Tags de version
- Historique des déploiements

**⚠️ IMPORTANT:** Mettre à jour après CHAQUE déploiement!

---

### 3. ANTI_ERREUR_GUIDE.md 🛡️
**Quand l'utiliser:** Lire une fois pour comprendre le système
```bash
cat ANTI_ERREUR_GUIDE.md
```
**Contenu:**
- Problèmes identifiés (expérience 2025-11-08)
- Solutions mises en place
- Workflow anti-erreur complet
- Règles d'or
- Checklists détaillées

---

### 4. scripts/deploy-test.sh 🧪
**Quand l'utiliser:** Pour déployer sur webapp-test
```bash
npm run deploy:test
```
**Fait:**
- Vérifie branche = development
- Build automatique
- Déploie sur webapp-test
- Affiche URL de test
- Rappelle les étapes suivantes

---

### 5. scripts/deploy-prod.sh 🚀
**Quand l'utiliser:** Pour déployer en production (après test OK)
```bash
npm run deploy:prod
```
**Fait:**
- Demande confirmation
- Crée backup tag
- Merge development → main
- Build et déploie
- Crée tag de version
- Affiche toutes les infos
- Retourne sur development

---

### 6. ROLLBACK_INFO.md 🔄
**Quand l'utiliser:** Si production cassée
```bash
cat ROLLBACK_INFO.md
```
**Contenu:**
- 4 méthodes de rollback
- URLs de backup
- Procédures détaillées
- Checklist post-déploiement

---

### 7. README.md 📖
**Quand l'utiliser:** Pour comprendre le projet
```bash
cat README.md
```
**Contenu:**
- Description du projet
- Fonctionnalités
- Architecture
- API documentation
- Guide utilisateur

---

## 🎯 SCÉNARIOS D'USAGE

### Scénario 1: Je veux déployer une modification
```bash
# 1. Lire le guide rapide
npm run info:quick

# 2. Déployer sur test
npm run deploy:test

# 3. Vérifier l'URL test
npm run info:urls

# 4. Si OK, déployer prod
npm run deploy:prod

# 5. Mettre à jour la doc
# Éditer DEPLOYMENT_CONFIG.md
git add DEPLOYMENT_CONFIG.md
git commit -m "docs: Update deployment info"
```

### Scénario 2: Je ne sais plus quelle URL utiliser
```bash
# Solution rapide
npm run info:urls
```

### Scénario 3: La production est cassée
```bash
# 1. Voir procédures
cat ROLLBACK_INFO.md

# 2. Rollback rapide
git checkout main
git reset --hard v2.0.4-production-stable
npm run build
npx wrangler pages deploy dist --project-name webapp --branch main
```

### Scénario 4: Je débute sur le projet
```bash
# 1. Lire dans cet ordre:
cat README.md                    # Comprendre le projet
cat ANTI_ERREUR_GUIDE.md         # Comprendre le workflow
cat QUICK_REFERENCE.md           # Mémoriser les commandes
cat DEPLOYMENT_CONFIG.md         # Noter les URLs

# 2. Pratiquer:
npm run check:branch             # Vérifier ma branche
npm run info:urls                # Voir les URLs
npm run deploy:test              # Essayer un déploiement test
```

---

## 📊 ARBORESCENCE DE DOCUMENTATION

```
webapp/
├── README.md                    # Documentation principale
├── README_DOCS.md              # Ce fichier (index)
├── DEPLOYMENT_CONFIG.md        # Source de vérité (URLs)
├── QUICK_REFERENCE.md          # Antisèche
├── ANTI_ERREUR_GUIDE.md        # Guide anti-erreur complet
├── ROLLBACK_INFO.md            # Procédures rollback
├── scripts/
│   ├── deploy-test.sh          # Script déploiement test
│   └── deploy-prod.sh          # Script déploiement prod
└── package.json                # Commandes npm
```

---

## 🚀 COMMANDES UTILES

### Déploiement
```bash
npm run deploy:test      # Déployer sur webapp-test
npm run deploy:prod      # Déployer en production
```

### Information
```bash
npm run info            # Config complète
npm run info:urls       # Juste les URLs
npm run info:quick      # Guide rapide
```

### Vérifications
```bash
npm run check:branch    # Quelle branche?
npm run check:version   # Quelle version?
npm run check:deployments  # Liste des déploiements
```

---

## 💡 RÈGLES D'OR

1. ✅ **Toujours consulter DEPLOYMENT_CONFIG.md pour les URLs**
2. ✅ **Toujours tester sur webapp-test avant production**
3. ✅ **Toujours mettre à jour la doc après déploiement**
4. ✅ **Jamais déployer sans backup tag**
5. ✅ **Jamais hésiter à consulter QUICK_REFERENCE.md**

---

## 🆘 EN CAS DE DOUTE

```bash
# Étape 1: Guide rapide
npm run info:quick

# Étape 2: URLs actuelles
npm run info:urls

# Étape 3: Ma branche
npm run check:branch

# Étape 4: Guide complet
cat ANTI_ERREUR_GUIDE.md
```

---

**Ce système de documentation a été créé pour éviter les erreurs et vous donner confiance dans vos déploiements!**

**Dernière mise à jour:** 2025-11-08 15:00 UTC
