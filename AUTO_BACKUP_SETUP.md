# ⏰ Configuration Backup Automatique Quotidien

**Auteur**: Salah Khalfi  
**Usage**: Backup automatique tous les jours sans intervention manuelle

---

## 🎯 Pourquoi?

Si tu travailles SEUL sans moi, tu pourrais oublier de faire des backups.  
Cette solution fait des backups **automatiquement chaque jour**.

---

## 🔧 Installation (Une seule fois)

### Étape 1: Ouvrir la configuration cron
```bash
crontab -e
```

### Étape 2: Ajouter cette ligne à la fin du fichier
```bash
# Backup quotidien à 2h du matin
0 2 * * * /home/user/webapp/scripts/auto-backup-cron.sh
```

### Étape 3: Sauvegarder et quitter
- Appuie sur `Ctrl+X`
- Appuie sur `Y` pour confirmer
- Appuie sur `Enter`

---

## ✅ Vérifier que ça fonctionne

### Voir les tâches cron actives:
```bash
crontab -l
```

Tu devrais voir:
```
0 2 * * * /home/user/webapp/scripts/auto-backup-cron.sh
```

### Tester manuellement (sans attendre 2h du matin):
```bash
/home/user/webapp/scripts/auto-backup-cron.sh
```

### Voir les logs des backups automatiques:
```bash
cat /home/user/webapp/.wrangler/backups/auto-backup.log
```

---

## 📅 Horaires de Backup

Le backup automatique s'exécute:
- ⏰ **Tous les jours à 2h00 du matin**
- 💾 Crée un nouveau backup
- 🧹 Garde les 10 derniers
- 📝 Log l'exécution

---

## 🔄 Modifier l'horaire

### Exemples de configurations:

**Toutes les 6 heures:**
```bash
0 */6 * * * /home/user/webapp/scripts/auto-backup-cron.sh
```

**Tous les jours à midi:**
```bash
0 12 * * * /home/user/webapp/scripts/auto-backup-cron.sh
```

**Du lundi au vendredi à 8h:**
```bash
0 8 * * 1-5 /home/user/webapp/scripts/auto-backup-cron.sh
```

**Toutes les heures (pendant les heures de travail 8h-18h):**
```bash
0 8-18 * * * /home/user/webapp/scripts/auto-backup-cron.sh
```

---

## ⚠️ Important

### ✅ Avantages:
- Backups automatiques sans y penser
- Protection même si tu oublies
- Historique quotidien

### ❌ Limitations:
- Ne protège PAS contre les erreurs immédiates
- Si tu perds des données à 10h, le dernier backup est de 2h (8h de perte max)
- **TOUJOURS faire un backup manuel avant modifications importantes!**

---

## 💡 Recommandation Finale

### **Stratégie Hybride (OPTIMAL):**

1. **Backup automatique quotidien** ✅ (cron job - 2h du matin)
2. **Backup manuel AVANT modifications** ✅ (`npm run db:backup`)
3. **Travailler avec Claude quand possible** ✅ (protection maximale)

Comme ça, même si tu oublies le backup manuel, tu as toujours celui de la nuit!

---

## 🆘 Désactiver les Backups Automatiques

Si tu veux arrêter les backups automatiques:

```bash
crontab -e
# Supprimer la ligne avec auto-backup-cron.sh
# Ou commenter avec # devant
```

---

**🎉 Avec ça, tes données sont protégées automatiquement!**
