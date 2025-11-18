# 🔧 Guide de récupération - Webapp v2.5.0

## 🚨 Si les utilisateurs ont disparu

```bash
# 1. Réappliquer les migrations
npx wrangler d1 migrations apply maintenance-db --local

# 2. Restaurer les 11 utilisateurs
npx wrangler d1 execute maintenance-db --local --file=./seed-users.sql

# 3. Redémarrer le serveur
pm2 restart webapp

# 4. Vérifier
npx wrangler d1 execute maintenance-db --local --command="SELECT COUNT(*) FROM users"
```

## 🔄 Si le serveur local ne démarre pas

```bash
# 1. Nettoyer complètement
cd /home/user/webapp
pm2 delete all
fuser -k 3000/tcp 2>/dev/null || true
rm -rf .wrangler node_modules/.cache

# 2. Rebuild
npm run build

# 3. Relancer PM2
pm2 start ecosystem.config.cjs

# 4. Tester
sleep 5 && curl http://localhost:3000/api/health
```

## ☁️ Déploiement Cloudflare (quand Cloudflare est stable)

```bash
# Utiliser le script automatique
bash deploy-when-cloudflare-ready.sh

# OU manuellement:
export CLOUDFLARE_API_TOKEN=$(grep CLOUDFLARE_API_TOKEN /home/user/.bashrc | cut -d'"' -f2)
npx wrangler pages deploy dist --project-name webapp
```

## 🔑 Utilisateurs par défaut

| ID | Email | Rôle | Notes |
|----|-------|------|-------|
| 0 | system.team@igpglass.ca | technician | Utilisateur système |
| 1 | admin@igpglass.ca | admin | Admin principal |
| 2 | technicien@igpglass.ca | technician | Laurent |
| 4 | operateur@igpglass.ca | operator | Salah |
| 5 | mbelanger@igpglass.com | admin | Marc Bélanger |
| 6 | brahim@igpglass.ca | technician | Brahim |
| 7 | superviseur@igpglass.com | supervisor | Yves |
| 8 | mounir@igpglass.ca | team_leader | Mounir Sayad |
| 9 | technicien1@igpglass.ca | technician | Deuxieme Technicien |
| 10 | ali@igpglass.ca | furnace_operator | Ali |
| 11 | salah@khalfi.com | admin | Salah Khalfi (super_admin) |

**Mot de passe par défaut**: `admin123` (pour admin@igpglass.ca)

## 🧹 Problème "spinner infini" dans le navigateur

**Cause**: Token localStorage avec utilisateur inexistant

**Solution**:
1. Ouvrir en navigation privée, OU
2. DevTools (F12) → Console → Taper: `localStorage.clear()` → F5

## 📦 Backup base de données production

```bash
# Exporter depuis production
npx wrangler d1 execute maintenance-db --remote --command="SELECT * FROM users" --json > users_backup.json

# Exporter toutes les tables
npx wrangler d1 execute maintenance-db --remote --command="SELECT * FROM tickets" --json > tickets_backup.json
npx wrangler d1 execute maintenance-db --remote --command="SELECT * FROM machines" --json > machines_backup.json
```

## 🔍 Commandes de diagnostic

```bash
# État du serveur
pm2 list
pm2 logs webapp --nostream --lines 50

# État de la base locale
npx wrangler d1 execute maintenance-db --local --command="SELECT name FROM sqlite_master WHERE type='table'"

# État de la base production
npx wrangler d1 execute maintenance-db --remote --command="SELECT COUNT(*) FROM users"

# Tester les routes API
curl http://localhost:3000/api/health
curl https://webapp-7t8.pages.dev/api/health
```

## 📝 Versions importantes

- **Application**: v2.5.0 stable
- **Build size**: 700.93 kB
- **Node.js**: 20.x
- **Wrangler**: 4.45.3+
- **PM2**: pre-installé

## 🌐 URLs de l'application

### Serveur local (sandbox)
```
https://3000-i99eg52ghw8axx8tockng-5185f4aa.sandbox.novita.ai
```

### Production Cloudflare
```
https://webapp-7t8.pages.dev
https://1501d44a.webapp-7t8.pages.dev (dernier déploiement)
```

---

**Dernière mise à jour**: 2025-11-18
**Version**: v2.5.0 stable
**Status**: ✅ Serveur local fonctionnel | ⏳ Cloudflare en incident
