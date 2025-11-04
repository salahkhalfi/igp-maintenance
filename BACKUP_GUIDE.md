# 🛡️ Guide de Sauvegarde et Restauration

**Auteur**: Salah Khalfi  
**Organisation**: Produits Verriers International (IGP) Inc.

## ⚠️ IMPORTANT: Toujours faire un backup AVANT toute modification!

---

## 📦 Créer un Backup

### Commande rapide:
```bash
npm run db:backup
```

### Ce que ça fait:
- ✅ Crée un backup horodaté de la base de données
- ✅ Sauvegarde dans `.wrangler/backups/`
- ✅ Affiche le nombre de tickets sauvegardés
- ✅ Garde automatiquement les 10 derniers backups
- ✅ Supprime les anciens backups automatiquement

### Exemple de sortie:
```
✅ Backup créé: .wrangler/backups/maintenance-db_20251104_125031.tar.gz (8.0K)
📊 Tickets sauvegardés: 47
```

---

## 📋 Lister les Backups Disponibles

```bash
npm run db:list-backups
```

### Exemple de sortie:
```
-rw-r--r-- 1 user user 12K Nov  4 15:30 maintenance-db_20251104_153045.tar.gz
-rw-r--r-- 1 user user 11K Nov  4 12:50 maintenance-db_20251104_125031.tar.gz
-rw-r--r-- 1 user user 10K Nov  3 18:22 maintenance-db_20251103_182215.tar.gz
```

---

## 🔄 Restaurer un Backup

### Restaurer le backup le plus récent:
```bash
npm run db:restore
```

### Restaurer un backup spécifique:
```bash
npm run db:restore -- .wrangler/backups/maintenance-db_20251104_125031.tar.gz
```

### Ce que ça fait:
1. ⚠️ **Demande confirmation** (tape `oui` pour continuer)
2. 🛑 Arrête le service PM2
3. 💾 Crée un backup de sécurité de la DB actuelle
4. 🗑️ Supprime la DB actuelle
5. 📂 Restaure le backup choisi
6. ✅ Vérifie la restauration
7. 🚀 Redémarre le service

---

## 🎯 Workflow Recommandé

### Avant CHAQUE session de modifications:

```bash
# 1. Créer un backup
npm run db:backup

# 2. Noter le nom du fichier créé
# (au cas où tu devrais restaurer plus tard)

# 3. Faire tes modifications de code
# ...

# 4. Tester localement
npm run build
pm2 restart maintenance-app

# 5. Si tout fonctionne, déployer
npm run deploy
```

### Si quelque chose casse:

```bash
# Option 1: Restaurer le dernier backup
npm run db:restore

# Option 2: Restaurer un backup spécifique
npm run db:list-backups
npm run db:restore -- .wrangler/backups/[nom_du_fichier].tar.gz
```

---

## 📁 Structure des Backups

```
webapp/
├── .wrangler/
│   ├── backups/              ← Dossier des backups
│   │   ├── maintenance-db_20251104_153045.tar.gz
│   │   ├── maintenance-db_20251104_125031.tar.gz
│   │   └── safety_backup_20251104_120000.tar.gz  ← Backups auto avant restore
│   └── state/
│       └── v3/
│           └── d1/           ← Base de données active
└── scripts/
    ├── backup-db.sh          ← Script de backup
    └── restore-db.sh         ← Script de restauration
```

---

## 🔒 Sécurité

### Backups inclus dans .gitignore:
Les backups sont **automatiquement exclus** de Git pour ne pas surcharger le dépôt.

### Backups conservés localement:
- ✅ 10 derniers backups automatiques
- ✅ Tous les backups de sécurité (avant restore)
- ✅ Nettoyage automatique des anciens

---

## 💡 Conseils

### Quand faire un backup:
- ✅ **AVANT** chaque session de développement
- ✅ **AVANT** un `git reset` ou `git checkout`
- ✅ **AVANT** de modifier la structure de la DB
- ✅ **AVANT** de tester des nouvelles fonctionnalités
- ✅ **APRÈS** avoir entré beaucoup de données importantes

### Fréquence recommandée:
- 📅 **Quotidien** si utilisation active
- 📅 **Avant/Après** chaque session de développement
- 📅 **Après** entrée de données importantes

### Backup externe (optionnel):
```bash
# Copier les backups vers un autre emplacement
cp -r .wrangler/backups/ ~/Documents/igp-backups/
```

---

## ❓ Questions Fréquentes

**Q: Les backups prennent-ils beaucoup d'espace?**  
R: Non! Un backup compressé fait environ 8-20 KB selon le nombre de tickets.

**Q: Puis-je restaurer un backup sur un autre ordinateur?**  
R: Oui! Copie simplement le fichier `.tar.gz` dans `.wrangler/backups/` sur l'autre machine et lance `npm run db:restore`.

**Q: Les backups incluent-ils les images?**  
R: Non, seulement les données de la DB. Les images sont dans Cloudflare R2 (cloud).

**Q: Combien de temps garder les backups?**  
R: Les scripts gardent automatiquement les 10 derniers. Pour archivage long terme, copie-les ailleurs.

---

## 🆘 En Cas de Problème

Si la restauration échoue:
1. Vérifie que le fichier backup existe
2. Vérifie les permissions: `chmod +x scripts/*.sh`
3. Regarde les logs pour les erreurs
4. Contacte le département TI IGP

---

**🎉 Avec ces outils, tes données sont en sécurité!**
