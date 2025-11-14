# 🔄 Guide de Rollback PWA

**Si quelque chose ne fonctionne pas, voici comment revenir en arrière rapidement.**

---

## 🚨 Scénarios et Solutions

### Scénario 1: Push ne fonctionne pas mais app OK
**Symptôme**: App fonctionne, mais notifications push échouent  
**Solution**: Désactiver push (30 secondes)

```bash
# Désactiver push sans toucher au reste
npx wrangler pages secret put PUSH_ENABLED --project-name igp-maintenance-app
# Quand demandé, entrer: false

# Vérifier
curl https://mecanique.igpglass.ca

# Résultat: App fonctionne normalement, pas de push
# Système Pabbly/WhatsApp continue à fonctionner
```

### Scénario 2: App ne démarre plus
**Symptôme**: Erreur 500, app ne charge pas  
**Solution**: Rollback commit (5 minutes)

```bash
cd /home/user/webapp

# Voir les commits récents
git log --oneline -5

# Revenir au commit avant PWA
git reset --hard pre-pwa-backup

# Rebuilder
npm run build

# Redéployer
npx wrangler pages deploy dist --project-name igp-maintenance-app

# Résultat: App exactement comme avant PWA
```

### Scénario 3: Bugs bizarres, veux garder git history
**Symptôme**: Comportement étrange, préfère annuler proprement  
**Solution**: Git revert (5 minutes)

```bash
cd /home/user/webapp

# Annuler le commit PWA (garde l'historique)
git revert HEAD

# Résoudre conflits si demandés (généralement aucun)

# Rebuilder
npm run build

# Redéployer
npx wrangler pages deploy dist --project-name igp-maintenance-app

# Résultat: PWA annulée, historique git préservé
```

### Scénario 4: Rollback local uniquement (tests)
**Symptôme**: Veux tester rollback sans toucher production  
**Solution**: Rollback local

```bash
cd /home/user/webapp

# Rollback code
git reset --hard pre-pwa-backup

# Rebuild local
npm run build

# Restart PM2
fuser -k 3000/tcp 2>/dev/null || true
pm2 restart webapp

# Test local
curl http://localhost:3000

# Résultat: Local revenu en arrière, production inchangée
```

---

## ✅ Vérifier que Rollback a Réussi

Après rollback, vérifier:

```bash
# 1. App accessible
curl -s -o /dev/null -w "%{http_code}" https://mecanique.igpglass.ca
# Doit afficher: 200

# 2. Connexion fonctionne
# Aller sur mecanique.igpglass.ca
# Login avec compte test
# Créer un ticket → Doit fonctionner

# 3. Pas de notifications push
# Dans DevTools Console (F12)
# Ne doit PAS voir: "Service Worker enregistré"
# Doit voir app normale qui fonctionne

# 4. Pabbly/WhatsApp continue
# Système de notifications externe non affecté
```

---

## 📊 Commandes Utiles

### Voir l'état actuel:
```bash
cd /home/user/webapp
git log --oneline -5
git tag
git status
```

### Comparer avec backup:
```bash
cd /home/user/webapp
git diff pre-pwa-backup HEAD --stat
```

### Lister les fichiers PWA:
```bash
cd /home/user/webapp
git diff pre-pwa-backup HEAD --name-only
```

---

## 🛟 En Cas de Panique

**Si complètement perdu:**

```bash
# 1. Stopper le service
pm2 delete webapp

# 2. Cloner repo frais
cd /home/user
mv webapp webapp-backup-$(date +%Y%m%d-%H%M%S)
git clone <URL_REPO> webapp

# 3. Checkout commit pre-PWA
cd webapp
git checkout pre-pwa-backup

# 4. Installer et builder
npm install
npm run build

# 5. Restart
pm2 start ecosystem.config.cjs

# 6. Déployer
npx wrangler pages deploy dist --project-name igp-maintenance-app
```

---

## 📞 Aide

**Si rollback ne fonctionne pas après 30 minutes:**

1. **NE PAS paniquer** - l'app peut rester en l'état actuel
2. **Prendre screenshot** des erreurs
3. **Email**: support@igpglass.ca avec:
   - Scénario tenté
   - Erreurs rencontrées
   - Logs (pm2 logs --nostream)

**Temporisation d'urgence:**
```bash
# Afficher message maintenance
# (À implémenter si nécessaire)
```

---

## ✅ Garantie Rollback

**Promis:**
- ✅ Tag git "pre-pwa-backup" existe et fonctionne
- ✅ Rollback testé en local (fonctionne)
- ✅ Aucune modification de données (seulement code)
- ✅ Système Pabbly/WhatsApp totalement indépendant
- ✅ Maximum 5 minutes de downtime pour rollback

**En pratique:**
- Scénario 1 (désactiver push): 30 secondes
- Scénario 2 (rollback): 5 minutes
- Scénario 3 (revert): 5 minutes
