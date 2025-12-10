# 📋 Résumé Contexte - Application IGP Maintenance

**Date de création**: Novembre 2024  
**Auteur**: Salah Khalfi  
**Organisation**: Produits Verriers International (IGP) Inc.  
**Département**: Technologies de l'Information

---

## 🎯 **À LIRE EN PREMIER dans un nouveau chat!**

Ce fichier contient le contexte clé si tu perds l'accès à la conversation originale.

---

## ⚠️ **PIÈGES CRITIQUES À CONNAÎTRE**

### **🔴 #1: APOSTROPHES FRANÇAISES = PAGE BLANCHE!**

**PROBLÈME**: Les apostrophes françaises (`'`) dans les chaînes JavaScript cassent TOUT!

```javascript
// ❌ MAUVAIS (cause page blanche):
'l\'application'        // Backslash échappe mal
'aujourd\'hui'          // Erreur JavaScript

// ✅ BON (utiliser doubles guillemets):
"l'application"         // Fonctionne parfaitement
"aujourd'hui"           // Pas d'erreur
```

**SOLUTION**: Toujours utiliser **DOUBLES GUILLEMETS** pour les textes français!

**FICHIERS SENSIBLES**:
- `src/index.tsx` lignes ~1122, ~2847 (footers)
- Tout texte avec "l'", "d'", "qu'", etc.

---

### **🔴 #2: Backup AVANT Modifications**

**TOUJOURS faire**: `npm run db:backup` AVANT toute modification de code!

**Pourquoi**: Un `git reset --hard` peut effacer la base de données locale.

---

### **🔴 #3: Port 7000 (pas 3000)**

L'application tourne sur le **port 7000** (pas 3000 comme la config de base).

```bash
# Config PM2:
ecosystem.config.cjs → port 7000

# Clean port:
fuser -k 7000/tcp
```

---

### **🔴 #4: Timeout 300s pour npm**

Les commandes npm (build, install) peuvent prendre du temps:

```bash
# TOUJOURS utiliser timeout 300s (5 minutes):
npm run build          # Timeout: 300000ms
npm install            # Timeout: 300000ms
```

---

## 🏗️ **Architecture Technique**

### **Stack:**
- **Framework**: Hono (backend) + React 18 UMD (frontend)
- **Déploiement**: Cloudflare Pages/Workers
- **Base de données**: Cloudflare D1 (SQLite)
- **Storage images**: Cloudflare R2
- **Auth**: JWT avec bcrypt (PBKDF2)
- **Local dev**: PM2 + Wrangler

### **Structure:**
```
webapp/
├── src/index.tsx          # TOUT le code (2800+ lignes)
├── public/               # Assets statiques
├── scripts/              # Backup/restore
├── package.json          # Dépendances
├── wrangler.jsonc        # Config Cloudflare
└── ecosystem.config.cjs  # Config PM2
```

### **Fichier principal: src/index.tsx**
- **Ligne 1-500**: Setup Hono, CORS, middlewares
- **Ligne 500-2300**: API Routes (auth, tickets, users, machines, media)
- **Ligne 2300-2900**: Frontend React (Kanban, modales, etc.)
- **Ligne 2900-3200**: Page /guide (accordéon)

---

## 🎨 **Fonctionnalités Clés**

### **1. Système Kanban:**
- 6 colonnes: Reçue, Diagnostic, En cours, Attente pièces, Terminé, Archivé
- Drag & drop (desktop) + touch events (mobile)
- **Archivé sur 2ème rangée** (desktop seulement)
- Toggle "Voir Archivés" avec compteur badge

### **2. Timer Dynamique:**
- Mise à jour chaque seconde
- Couleurs selon urgence:
  - 🟢 Vert: < 1 jour
  - 🟡 Jaune: 1-2 jours
  - 🟠 Orange: 3-6 jours
  - 🔴 Rouge: 7+ jours

### **3. Rôles Utilisateurs:**
- **Admin**: Tout accès
- **Technicien**: Créer/modifier tickets, commentaires
- **Opérateur**: Lecture seule

### **4. Format Québécois:**
- **Dates**: JJ-MM-AAAA (pas AAAA-MM-JJ)
- **Timezone**: EST (America/Toronto)
- **Heure**: HH:mm (24h)

---

## 🔄 **Workflow Modifications**

### **Standard (avec Claude):**
```bash
1. npm run db:backup              # Backup auto par Claude
2. [Modifications code]
3. npm run build                  # Timeout 300s
4. pm2 restart maintenance-app
5. Test sur sandbox
6. git commit
7. wrangler pages deploy
8. Test sur production
```

### **Commandes Utiles:**
```bash
# Backup/Restore:
npm run db:backup
npm run db:restore
npm run db:list-backups

# Dev:
npm run build
pm2 restart maintenance-app
pm2 logs --nostream

# Déploiement:
npx wrangler pages deploy dist --project-name webapp --branch main

# Nettoyage:
fuser -k 7000/tcp
```

---

## 🐛 **Bugs Corrigés (à ne pas réintroduire!)**

### **1. Toggle Archivés Desktop**
- **Problème**: Colonne invisible même avec `showArchived=true`
- **Cause**: Conflit CSS avec flexbox + overflow-x-auto
- **Solution**: Colonne archivée sur deuxième rangée (pas inline)

### **2. Apostrophes Françaises**
- **Problème**: Page blanche, erreur "missing ) after argument list"
- **Cause**: `'l\'application'` casse le JavaScript
- **Solution**: Utiliser doubles guillemets: `"l'application"`

### **3. Perte Données après git reset**
- **Problème**: `git reset --hard` + rebuild = DB effacée
- **Cause**: `.wrangler/state/` réinitialisé
- **Solution**: Backup AVANT toute opération Git dangereuse

### **4. Badges Overflow Desktop**
- **Problème**: Badges débordaient des colonnes
- **Cause**: Badges sur même ligne que ticket_id
- **Solution**: Badges en dessous du titre

---

## 📦 **Versions Déployées**

- **Production**: https://mecanique.igpglass.ca
- **Domaine Cloudflare**: https://webapp-7t8.pages.dev
- **Database ID**: 6e4d996c-994b-4afc-81d2-d67faab07828
- **Project Name**: webapp

---

## 👥 **Utilisateurs par Défaut**

```
Admin:
  Username: admin
  Password: admin123

(À changer en production!)
```

---

## 💡 **Conseils pour Nouveau Chat**

### **Si tu commences avec un nouveau Claude:**

1. **Upload ces fichiers en premier:**
   - `CONTEXT_RESUME.md` (ce fichier!)
   - `src/index.tsx` (code principal)
   - `QUICK_START.md` (workflow)

2. **Dis-moi:**
   - "Voici mon app IGP Maintenance"
   - "Lis CONTEXT_RESUME.md en premier"
   - "J'ai besoin de [ta demande]"

3. **Je vais:**
   - Lire le contexte (5 minutes)
   - Comprendre la structure
   - Faire un backup automatiquement
   - Modifier selon ta demande

---

## 🔗 **Liens Importants**

- **Cloudflare Dashboard**: https://dash.cloudflare.com/
- **Git Log**: `git log --oneline` (historique complet)
- **Documentation**: `BACKUP_GUIDE.md`, `QUICK_START.md`

---

## ⚡ **Quick Reference**

```bash
# Backup & Safety:
npm run db:backup           # TOUJOURS AVANT modifications

# Build & Deploy:
cd /home/user/webapp
npm run build               # Timeout: 300s
pm2 restart maintenance-app
wrangler pages deploy dist --project-name webapp --branch main

# Troubleshooting:
pm2 logs --nostream         # Voir erreurs
fuser -k 7000/tcp          # Libérer port
npm run db:restore         # Si problème
```

---

## 🎓 **Décisions de Design**

### **Pourquoi Hono?**
- Léger, rapide
- Parfait pour Cloudflare Workers
- Edge-first architecture

### **Pourquoi tout dans index.tsx?**
- Simplicité du déploiement
- Pas de bundling complexe
- Edge Workers = petit bundle

### **Pourquoi scripts manuels (pas interface admin)?**
- Plus fiable (backup système de fichiers)
- Indépendant de l'app
- Restauration atomique garantie

---

**🎉 Avec ce fichier, n'importe quel Claude peut reprendre le projet!**

**Date de dernière mise à jour**: 2024-11-04
