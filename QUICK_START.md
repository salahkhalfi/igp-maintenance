# 🚀 Guide Rapide - Modifications Futures

## ⚠️ RÈGLE D'OR: TOUJOURS FAIRE UN BACKUP AVANT!

```bash
npm run db:backup
```

---

## 🛠️ Workflow Standard

### 1️⃣ Avant de commencer:
```bash
cd /home/user/webapp
npm run db:backup          # 💾 Backup des données
git status                 # Vérifier l'état
```

### 2️⃣ Faire les modifications:
```bash
# Éditer les fichiers dans src/
# ...
```

### 3️⃣ Tester localement:
```bash
npm run build              # Build (timeout 300s)
pm2 restart maintenance-app # Redémarrer
# Tester: https://7000-xxx.sandbox.novita.ai/
```

### 4️⃣ Si ça fonctionne:
```bash
git add -A
git commit -m "Description des changements"
npx wrangler pages deploy dist --project-name webapp --branch main
# Tester: https://mecanique.igpglass.ca
```

### 5️⃣ Si ça casse:
```bash
npm run db:restore         # 🔄 Restaurer les données
git reset --hard HEAD~1    # Annuler le dernier commit
```

---

## 📦 Commandes Backup

| Commande | Description |
|----------|-------------|
| `npm run db:backup` | 💾 Créer un backup |
| `npm run db:restore` | 🔄 Restaurer le dernier backup |
| `npm run db:list-backups` | 📋 Lister les backups |

---

## 🔧 Commandes Utiles

| Commande | Description |
|----------|-------------|
| `npm run build` | 🏗️ Compiler l'application |
| `pm2 restart maintenance-app` | 🔄 Redémarrer le service |
| `pm2 logs --nostream` | 📜 Voir les logs |
| `pm2 list` | 📊 État des services |
| `fuser -k 7000/tcp` | 🧹 Libérer le port 7000 |

---

## ⚡ Commandes Rapides

### Build + Redémarrage:
```bash
cd /home/user/webapp && npm run build && pm2 restart maintenance-app
```

### Backup + Build + Deploy:
```bash
cd /home/user/webapp && npm run db:backup && npm run build && npx wrangler pages deploy dist --project-name webapp --branch main
```

---

## 🚨 En Cas de Page Blanche

**Cause #1: Apostrophes françaises**
```bash
# Chercher les apostrophes problématiques:
grep -n "'" src/index.tsx | grep -v "//"

# Solution: Utiliser DOUBLES guillemets pour les chaînes avec apostrophes
# ❌ 'l\'application'  
# ✅ "l'application"
```

**Cause #2: Erreur JavaScript**
```bash
# Vérifier les logs du navigateur (F12 → Console)
# Regarder les logs PM2:
pm2 logs maintenance-app --nostream
```

**Cause #3: Données perdues après git reset**
```bash
npm run db:restore  # Restaurer le dernier backup
```

---

## 📚 Documentation Complète

- **BACKUP_GUIDE.md** - Guide détaillé backup/restore
- **README.md** - Documentation du projet (si existe)
- **package.json** - Toutes les commandes disponibles

---

**💡 Conseil**: Garde ce fichier ouvert pendant tes modifications!
