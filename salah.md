# salah.md - Guide de Travail Unique
**Version:** 1.0.5  
**Date:** 2025-11-24  
**Statut:** Guide opérationnel permanent

---

## 📖 INSTRUCTION DE LECTURE (POUR L'IA)

**Quand Salah dit "lis salah" → Lire CE fichier EN ENTIER (pas juste 100 lignes)**

Commande: `hub_files_tool(action="read", file_name="salah.md", limit=800)`

---

## 🎯 OBJECTIF DE CE FICHIER

**UN SEUL fichier** qui synthétise TOUT ce qui est critique pour travailler efficacement sans erreurs ni contradictions.

**Basé sur:** Lecture des 210 fichiers .md existants (LESSONS-LEARNED-*, ANTI_ERREUR_GUIDE, PREVENTION-GUIDE, HUB-MEMORY-GUIDE, README.md)

---

## 📋 RÈGLES DE TRAVAIL (LE "DEAL")

### 1. PAS DE BULLSHIT DIPLOMATIQUE
- Dire cash ce qui est vrai
- Stop "vous avez raison" automatique si faux
- Si erreur → admettre direct
- Si pas sûr → dire "pas sûr" (pas inventer)

### 2. READ FIRST = LOI ABSOLUE
**Avant TOUTE modification de fichier:**
```
[ ] Read fichier complet
[ ] Grep feature similaire existe?
[ ] Identifier lignes exactes changer
[ ] Plan minimal
[ ] Edit précis (old_string du Read)
[ ] Test immédiat
```

**Probabilité casser si skip Read: 80%+** → INACCEPTABLE

### 3. ÉCONOMIE TOKENS = OBLIGATION
**Format réponse:**
- Action (1 ligne)
- Commande (bash)
- Lien test (clickable)
- "Détails?" (optionnel)

**Red flag:** >50 lignes sans demande = verbeux = coût élevé

### 4. UN FICHIER, PAS 210
**Ce fichier existe pour éviter:**
- ❌ Créer nouveau fichier au lieu mettre à jour existant
- ❌ Contradictions entre fichiers multiples
- ❌ Oubli qu'un guide existe déjà

**Règle:** Si mise à jour nécessaire → Edit CE fichier, pas créer nouveau

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Stack Cloudflare Pages (Edge)
- **Hono Framework** - Backend léger
- **D1 Database** (`maintenance-db`) - SQLite distribué
- **R2 Storage** (`maintenance-media`) - Fichiers
- **React 18** (via CDN) - Frontend
- **Push Notifications** - `@block65/webcrypto-web-push` (PAS web-push)

### Limitations Cloudflare Workers
- ❌ NO Node.js APIs (`fs`, `path`, `crypto`, `child_process`)
- ❌ NO file system access runtime
- ❌ NO native CRON (utilise cron-job.org externe)
- ❌ NO WebSockets
- ✅ Web Standard APIs uniquement

### Systèmes Critiques
**CRON externe:**
- URL: `mecanique.igpglass.ca` (PAS preview URLs)
- Auth: `Authorization: cron_secret_igp_2025_webhook_notifications` (SANS "Bearer")
- Fréquence: toutes les 5 min
- Appelle: `/api/cron/*`

**Timezone:**
- Dates stockées EN UTC dans DB (via `localDateTimeToUTC()` frontend)
- Webhooks Pabbly reçoivent dates CONVERTIES en local (via `convertToLocalTime()`)
- `getTimezoneOffset()` utilisé (cron.ts, webhooks.ts)
- `getCurrentLocalTime()` JAMAIS utilisée
- UI utilise `parseUTCDate()` pour affichage (ajoute 'Z' suffix)

**Push Notifications:**
- Queue: table `pending_notifications` (users offline)
- Cleanup: CRON externe requis
- Admin push: code dans `cron.ts` L188-296 (PAS dans scheduled.ts)

---

## ⚠️ ERREURS À JAMAIS REFAIRE

### 1. Apostrophes Non Échappées
**Symptôme:** SyntaxError dans JSX  
**Cause:** `'C'est un problème'` → casse le code  
**Solution:** Template literals TOUJOURS
```javascript
// ✅ CORRECT
`C'est la solution`
`L'application fonctionne`
```

### 2. DB Locale Manquante
**Symptôme:** Chargement infini, `no such table`  
**Cause:** `rm -rf .wrangler` efface DB locale  
**Solution:**
```bash
npm run db:reset
pm2 restart webapp
```

### 3. Double Échappement HTML
**Règle:** React échappe AUTOMATIQUEMENT  
**Action:** Stocker valeurs BRUTES en DB
```typescript
// ❌ FAUX - échapper avant stockage
const escaped = value.replace(/</g, '&lt;');
await db.insert(escaped);

// ✅ CORRECT - stocker brut
await db.insert(value.trim());
// React.createElement() échappe à l'affichage
```

### 4. Oubli Déploiement
**Pattern d'erreur:** Build local OK, oubli `wrangler pages deploy`  
**Impact:** Code fonctionne local, cassé prod  
**Solution:** Checklist stricte (voir section DÉPLOIEMENT)

### 5. Modifications sur Mauvaise Version
**Erreur:** Travailler sur preview URL obsolète au lieu production  
**Solution:** Vérifier URLs avec scripts
```bash
npm run info:urls  # Affiche URLs depuis docs
```

### 6. Requêtes N+1
**Symptôme:** 100 users = 101 requêtes DB  
**Solution:** JOIN SQL ou IN clause (1-2 requêtes max)
```typescript
// ❌ FAUX
for (const user of users) {
  const posts = await db.query('SELECT * WHERE user_id = ?', [user.id]);
}

// ✅ CORRECT
const posts = await db.query('SELECT * WHERE user_id IN (?)', [userIds]);
```

### 7. Node.js APIs dans Edge
**Erreur:** `fs`, `path`, `crypto` (Node) dans Cloudflare Workers  
**Solution:** Web APIs uniquement
```typescript
// ❌ FAUX
import { readFileSync } from 'fs';

// ✅ CORRECT
const response = await fetch('/static/file.txt');
```

### 8. Android Push Notifications (Chrome Web)
**Symptôme:** Backend logs "success" mais notifications NON reçues sur Android  
**Cause:** Android bloque notifications des sites web en arrière-plan (économie batterie)  
**Impact:** 0% notifications reçues sur Chrome Android web  
**Solution:** Installation PWA (Progressive Web App) OBLIGATOIRE

**Étapes installation PWA:**
1. Chrome Android → mecanique.igpglass.ca
2. Menu (⋮) → "Installer l'application"
3. Ouvrir app depuis écran d'accueil
4. Activer notifications (bouton vert)

**Résultat:** 100% notifications reçues après PWA

**Documentation:**
- `/home/user/webapp/GUIDE_INSTALLATION_PWA_ANDROID.md`
- `/home/user/webapp/SESSION_ANDROID_PWA_FIX.md`
- README.md section "Android/PWA"

**Note:** iOS Safari et Desktop Chrome/Edge fonctionnent SANS PWA (Android uniquement)

---

## 🚀 DÉPLOIEMENT

### Workflow Strict
```
main → build → test (webapp-test) → deploy production
Pas de branches multiples (tout sur main)
```

### Scripts Automatisés
```bash
# Test (sur webapp-test)
npm run deploy:test

# Production (sur mecanique.igpglass.ca)
npm run deploy:prod
```

### Mise à Jour Production (Simple)
**Quand utilisateur dit "mettre à jour prod" / "push to prod":**
```bash
# 2 commandes, ZÉRO question
cd /home/user/webapp && npm run build
cd /home/user/webapp && npx wrangler pages deploy dist --project-name webapp
```

**❌ NE PAS poser questions sur:**
- Authentication Cloudflare (déjà configurée)
- Clés API (déjà en place)
- Setup DB (déjà créée)
- Création projet (existe déjà)

### Nouveau Déploiement (Complet)
**Seulement si "premier déploiement" / "créer nouveau projet":**
1. `setup_cloudflare_api_key`
2. Créer DB/projet si nécessaire
3. Build + deploy
4. Configurer secrets

### Checklist Pré-Déploiement
```
[ ] Build fonctionne: npm run build
[ ] Tests passent (si applicable)
[ ] Commit + push vers GitHub
[ ] Documentation à jour
[ ] Test sur webapp-test ✅
```

### Après Déploiement
```
[ ] Tester production: https://mecanique.igpglass.ca
[ ] Mettre à jour README.md et docs
[ ] Commit documentation
[ ] ProjectBackup si changement majeur
```

---

## 📦 GARBAGE IDENTIFIÉ (NON SUPPRIMÉ)

### Backups (6 fichiers - 3.3MB)
```
./src/index*.backup*
```
**Décision:** Attendre 1-2 semaines stabilité avant suppression

### scheduled.ts (14KB)
**Raison inutilisé:** Cloudflare Pages ne supporte pas CRON natifs  
**Décision:** Suppression non urgente

### Fonctions Timezone Inutilisées
- `getCurrentLocalTime()` - ❌ Jamais appelée

**Action:** AUCUNE pour l'instant (pas prioritaire)

---

## 💾 GIT & GITHUB

### Workflow Git
```bash
# Projet utilise UNIQUEMENT main branch
git add .
git commit -m "type: description"
git push origin main
```

**Types commit:** feat, fix, docs, style, refactor, test, chore

### GitHub Integration
**AVANT tout push GitHub:**
```bash
# Configurer auth d'abord
setup_github_environment
```

**Si échec:** Guide user vers #github tab pour autorisation

### .gitignore Essentiel
```
node_modules/
.env
.wrangler/
*.backup
*.bak
*.tar.gz
```

---

## 🗄️ BASE DE DONNÉES (D1)

### Configuration wrangler.jsonc
```jsonc
{
  "name": "webapp",
  "d1_databases": [{
    "binding": "DB",
    "database_name": "maintenance-db",
    "database_id": "votre-id-production"
  }]
}
```

### Développement Local (--local Mode)
```bash
# Migrations
npx wrangler d1 migrations apply maintenance-db --local

# Dev server avec D1
npx wrangler pages dev dist --d1=maintenance-db --local --ip 0.0.0.0 --port 3000

# Reset DB locale
rm -rf .wrangler/state/v3/d1
npm run db:migrate:local
```

### Route Debug Push (Salah)
```bash
# Test push immédiat user_id 11 (Salah)
curl https://mecanique.igpglass.ca/api/push/send-test-to-salah

# Retourne:
# - success: true/false
# - subscriptionsCount: nombre devices
# - subscriptions: liste endpoints
# - pushResult: sentCount/failedCount
```

**Fichier:** `src/routes/push.ts` lignes 509-561  
**Auth:** PUBLIC (pas de middleware)  
**Usage:** Diagnostic push rapide

### Production
```bash
# Migrations prod
npx wrangler d1 migrations apply maintenance-db

# Deploy
npm run build
npx wrangler pages deploy dist --project-name webapp
```

---

## 🔧 DÉVELOPPEMENT

### Bash Tool - CRITICAL
**Bash TOUJOURS start cwd = `/home/user`**

**Règle:** TOUJOURS utiliser `cd` dans commandes
```bash
# ❌ FAUX
npm install

# ✅ CORRECT
cd /home/user/webapp && npm install
```

### Commandes Timeouts
**Utiliser 300s+ timeout pour:**
- `npm create` (création projet)
- `npm install` (première installation)
- `npm run build` (build initial lourd)

**Timeout défaut 120s OK pour:**
- Builds incrémentaux
- Restart services
- Tests

### Port Management
```bash
# Nettoyer port 3000 avant start
fuser -k 3000/tcp 2>/dev/null || true
```

### PM2 (Services)
```bash
# Start
pm2 start ecosystem.config.cjs

# Logs (safe)
pm2 logs --nostream

# Restart
fuser -k 3000/tcp 2>/dev/null || true
pm2 restart webapp

# Delete
pm2 delete webapp
```

### Service Startup Workflow
```bash
# 1. Kill existing
fuser -k 3000/tcp 2>/dev/null || true

# 2. Build (REQUIRED première fois)
cd /home/user/webapp && npm run build

# 3. Start avec PM2
cd /home/user/webapp && pm2 start ecosystem.config.cjs

# 4. Test
curl http://localhost:3000

# 5. Logs si besoin
pm2 logs --nostream
```

---

## 📝 DOCUMENTATION

### README.md Standards
**DOIT inclure:**
1. Features complétées actuellement
2. URIs fonctionnels (paths + params)
3. Features non implémentées
4. Prochaines étapes recommandées
5. URLs production (mecanique.igpglass.ca)
6. Data models/storage services utilisés
7. Guide utilisateur simple
8. Statut déploiement

**Mettre à jour après changements majeurs**

### Documents Créés (2025-11-24)
**Audit et documentation Android PWA:**
1. `AUDIT_LOGIQUE_GENERALE.md` - Audit complet 2,269 lignes code (100/100 score)
2. `SESSION_ANDROID_PWA_FIX.md` - Diagnostic Android push (22 min, résolu)
3. `GUIDE_INSTALLATION_PWA_ANDROID.md` - Guide utilisateur PWA (154 lignes)
4. `AUDIT_SYSTEME_NOTIFICATIONS_COMPLET.md` - Section 8.5 Android ajoutée
5. `README.md` - Section Android/PWA warnings (60 lignes)

**Total:** 1,318 lignes documentation créées

### Ce Fichier (.AI-CONTEXT.md)
**Mettre à jour:**
- Nouvelles erreurs critiques découvertes
- Solutions validées importantes
- Changements architecture
- Décisions techniques majeures

**NE PAS:**
- Créer nouveau fichier au lieu éditer celui-ci
- Dupliquer infos déjà ici
- Ajouter détails projet-spécifiques temporaires

---

## 🧠 MÉMOIRE HUB

### Synchronisation Hub ↔ GitHub
**Quand sync:**
- 🔴 Critique: Erreur majeure résolue → Dans l'heure
- 🟡 Important: 3+ nouvelles solutions → Fin session
- 🟢 Normal: Ajustements mineurs → Hebdomadaire

**Comment sync:**
```bash
# Vérifier version actuelle
npm run check:version

# Télécharger depuis GitHub
# https://raw.githubusercontent.com/salahkhalfi/igp-maintenance/main/LESSONS-LEARNED-MEMOIRE.md

# Uploader dans Hub interface Genspark
```

**Test nouvelle session:**
> "Quelle version de LESSONS-LEARNED as-tu en mémoire?"

---

## 🎯 STANDARDS CODE

### React - Échappement Auto
**React.createElement() est SAFE:**
```javascript
// ✅ React échappe automatiquement
React.createElement('h1', {}, userInput)
<h1>{userInput}</h1>  // Safe auto
```

**Dangereux:**
```javascript
// ❌ ÉVITER
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Si nécessaire, sanitize avec DOMPurify
```

### serveStatic - Cloudflare Pages
```typescript
// ✅ CORRECT pour Cloudflare Pages
import { serveStatic } from 'hono/cloudflare-workers'

// ❌ FAUX - Node.js seulement
import { serveStatic } from '@hono/node-server/serve-static'
```

### Validation SQL
```typescript
// ✅ Prepared statements TOUJOURS
db.prepare('SELECT * WHERE id = ?').bind(id).first()

// ❌ JAMAIS concaténation
db.query(`SELECT * WHERE id = ${id}`)  // SQL Injection!
```

---

## 📊 ÉTAT ACTUEL SYSTÈME

### Versions
- **Production:** mecanique.igpglass.ca
- **Test:** webapp-test.pages.dev
- **Version app:** v2.8.1
- **Déploiements:** 350+ (normal, aucun problème)

### Ce Qui Fonctionne
✅ Push notifications (admin + users)  
✅ CRON externe (tickets expirés)  
✅ Timezone (dates locales DB)  
✅ Webhooks Pabbly (emails)  
✅ Queue notifications (pending_notifications)  
✅ D1 Database (maintenance-db)  
✅ R2 Storage (maintenance-media)  
✅ Auth système (14 rôles)  
✅ Kanban + Tickets + Messagerie + Audio  

### Non-Problèmes Confirmés
- 348 déploiements Cloudflare → Aucun coût, aucun impact
- Multiples branches preview → Normal Cloudflare Pages

---

## 🔍 DIAGNOSTIC RAPIDE

### Erreurs Courantes
```bash
# Chargement infini
→ DB locale manquante (voir section DB)

# SyntaxError bizarre
→ Apostrophes non échappées (template literals)

# Push admin absent
→ Code dans cron.ts (pas scheduled.ts)

# Dates converties en local pour webhooks
→ convertToLocalTime() appliqué (cron.ts, webhooks.ts)

# Build marche local, pas prod
→ Oubli wrangler pages deploy
```

### Commandes Utiles
```bash
# Vérifier branche
git branch

# Voir logs
pm2 logs --nostream

# Test API
curl http://localhost:3000/api/health

# Vérifier déploiements
npx wrangler pages deployment list --project-name webapp

# Voir URLs
npm run info:urls
```

---

## ⚡ QUICK REFERENCE

### Développement
```bash
cd /home/user/webapp
npm install  # Avec timeout 300s+
npm run build
pm2 start ecosystem.config.cjs
curl http://localhost:3000
```

### Déploiement Test
```bash
npm run deploy:test
# Tester URL affichée
```

### Déploiement Prod
```bash
npm run deploy:prod
# Tester https://mecanique.igpglass.ca
# Mettre à jour DEPLOYMENT_CONFIG.md
```

### Rollback
```bash
git checkout main
git reset --hard [tag-stable]
npm run build
npx wrangler pages deploy dist --project-name webapp
```

### DB Reset
```bash
rm -rf .wrangler/state/v3/d1
npx wrangler d1 migrations apply maintenance-db --local
pm2 restart webapp
```

---

## 📋 CHECKLIST MENTALE (AI)

**Avant toute action:**
```
[ ] Ai-je lu le fichier concerné?
[ ] Cette feature existe-t-elle déjà?
[ ] C'est une mise à jour prod (simple) ou nouveau déploiement (complet)?
[ ] Ma réponse est-elle <50 lignes (sauf si demandé)?
[ ] Utilise-t-elle cd dans Bash commands?
```

**Si doute:**
- Consulter ce fichier (.AI-CONTEXT.md)
- Grep dans codebase
- Demander clarification à user

---

## 🚫 ANTI-PATTERNS

1. ❌ Modifier sans Read
2. ❌ Créer nouveau fichier au lieu edit existant
3. ❌ Poser questions auth pour mise à jour prod
4. ❌ Stocker données échappées en DB
5. ❌ Bash commands sans `cd`
6. ❌ Réponses >50 lignes sans demande
7. ❌ Supposer structure code sans vérifier
8. ❌ Node.js APIs dans edge runtime

---

## 🌐 DOMAINE PMEAPP.COM - SETUP TECHNIQUE

**⚠️ IMPORTANT:** Cette section contient UNIQUEMENT actions techniques domaine.

**Pour stratégie commerciale complète → Lire STRATEGIE-COMMERCIALE.md**

### Actions Techniques Immédiates

#### 1. Protéger le Domaine
```bash
# Dans panneau registrar (Namecheap/Cloudflare/GoDaddy):
✅ Activer DNSSEC
✅ Activer auto-renewal (minimum 2 ans)
✅ Whois privacy protection
✅ Email catch-all → pour recevoir *@pmeapp.com
✅ Verrouiller transfert domaine
```

#### 2. Setup DNS Cloudflare
```dns
# Type  | Name | Content                          | Proxy
A       | @    | <Cloudflare Pages IP>            | ✅ Proxied
CNAME   | www  | webapp.pages.dev                 | ✅ Proxied
CNAME   | *    | webapp.pages.dev                 | ✅ Proxied
MX      | @    | route1.mx.cloudflare.net         | ❌ DNS only
MX      | @    | route2.mx.cloudflare.net         | ❌ DNS only
TXT     | @    | v=spf1 include:_spf.mx.cloudflare.net ~all
```

#### 3. Email Professionnel (Cloudflare Email Routing)
```bash
# Email Routing → Destination addresses:
contact@pmeapp.com   → salah@igpglass.ca
support@pmeapp.com   → salah@igpglass.ca
demo@pmeapp.com      → salah@igpglass.ca

# Catch-all: *@pmeapp.com → salah@igpglass.ca
```

#### 4. Custom Domain Cloudflare Pages
```bash
cd /home/user/webapp
npx wrangler pages domain add pmeapp.com --project-name webapp
npx wrangler pages domain add www.pmeapp.com --project-name webapp
npx wrangler pages domain list --project-name webapp
```

### Multi-Tenancy Code Patterns (Pour Fork)

**Database schema:**
```sql
CREATE TABLE work_orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,  -- ← OBLIGATOIRE partout
  -- autres colonnes...
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX idx_work_orders_tenant ON work_orders(tenant_id);
```

**Subdomain routing:**
```typescript
app.use('*', async (c, next) => {
  const subdomain = c.req.header('host')?.split('.')[0];
  const tenant = await c.env.DB.prepare(
    'SELECT * FROM tenants WHERE subdomain = ?'
  ).bind(subdomain).first();
  c.set('tenant', tenant);
  await next();
});
```

**⚠️ Pour détails stratégie commerciale, marketing, pricing, roadmap:**
**→ Lire `/home/user/webapp/STRATEGIE-COMMERCIALE.md`**

---

## 📌 NOTES FINALES

### Ce Fichier N'Est PAS
- ❌ Documentation exhaustive projet
- ❌ Tutorial complet technologies
- ❌ Liste tous bugs possibles

### Ce Fichier EST
- ✅ Guide opérationnel anti-erreur
- ✅ Mémoire collective leçons apprises
- ✅ Source vérité décisions techniques
- ✅ Checklist éviter erreurs connues

### Maintenance
- Éditer CE fichier (pas créer nouveau)
- Commit après ajout important
- Sync Hub si changements critiques

---

**Fin du guide. Si contradiction trouvée entre ce fichier et autres docs → Ce fichier prime.**

**Version:** 1.0.5  
**Créé:** 2025-11-23  
**Dernière MAJ:** 2025-11-24  
**Changements v1.0.5:**
- ✅ Android PWA obligatoire (erreur #8 ajoutée)
- ✅ Route debug `/api/push/send-test-to-salah`
- ✅ Version app → 2.8.1
- ✅ 5 documents audit créés aujourd'hui
- ✅ Limite lecture → 800 lignes

**Basé sur:** 210+ fichiers .md analysés  
**Statut:** ✅ Opérationnel
