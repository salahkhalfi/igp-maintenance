# 🚀 Informations de déploiement - IGP Maintenance System v1.5.0

## 📱 URLs de l'application

### Développement (Sandbox)
- **URL principale**: https://3000-i99eg52ghw8axx8tockng-cbeee0f9.sandbox.novita.ai
- **API Base**: https://3000-i99eg52ghw8axx8tockng-cbeee0f9.sandbox.novita.ai/api
- **Statut**: ✅ En ligne et fonctionnel

### Production (À déployer)
- **Commande**: `npm run deploy`
- **URL prévue**: `https://[project-name].pages.dev`
- **Statut**: ⏳ Pas encore déployé

## 👥 Comptes de test

| Email | Mot de passe | Rôle | Permissions |
|-------|-------------|------|-------------|
| admin@igpglass.ca | password123 | Administrateur | Tous les droits |
| technicien@igpglass.ca | password123 | Technicien Martin Tremblay | Modifier tickets, upload médias |
| technicien2@igpglass.ca | password123 | Technicienne Sophie Gagnon | Modifier tickets, upload médias |
| operateur@igpglass.ca | password123 | Opérateur Jean Dubois | Créer tickets, upload médias |

**Recommandation**: Utiliser `operateur@igpglass.ca` pour tester la création de tickets et l'upload de photos.

## 🎯 Fonctionnalités v1.5.0

### ✅ Implémenté
1. **Upload de photos/vidéos mobile** 📸
   - Accès direct à la caméra arrière
   - Support multi-fichiers
   - Preview en grille 3 colonnes
   - Barre de progression d'upload
   - Stockage sécurisé dans Cloudflare R2
   
2. **Drag-and-Drop natif** (Desktop + Mobile) 🎯
   - Souris pour desktop
   - Touch pour mobile
   - Feedback visuel complet
   
3. **Branding IGP** 🎨
   - Logo Les Produits Verriers International
   - Palette de couleurs corporative
   - Identité visuelle complète
   
4. **Localisation française** 🇫🇷
   - Priorités: CRITIQUE, HAUTE, MOYENNE, FAIBLE
   - Interface en français
   - Format de date FR
   
5. **Emails @igpglass.ca** ✉️
   - Migration complète du domaine
   - Tous les comptes de test mis à jour

### ⏳ En cours / Prochain sprint
6. **Page de détails avec galerie** - Afficher les photos/vidéos uploadées
7. **Compression d'images** - Réduire la taille avant upload
8. **Validation de taille** - Limiter à 10MB par fichier

## 📖 Documentation disponible

### Guides utilisateur
- **README.md** - Documentation complète du projet
- **TESTING_MEDIA_UPLOAD.md** - Guide de test pour l'upload de médias
- **DEPLOYMENT_INFO.md** - Ce document (informations de déploiement)

### Documentation technique
- **IMPLEMENTATION_SUMMARY.md** - Résumé technique détaillé de l'implémentation

## 🔧 Commandes utiles

### Développement
```bash
# Démarrer le serveur de développement
npm run dev:sandbox

# Ou avec PM2 (recommandé)
npm run build
pm2 start ecosystem.config.cjs

# Vérifier les logs
pm2 logs maintenance-app --nostream

# Redémarrer après modification
npm run build
pm2 restart maintenance-app
```

### Base de données
```bash
# Réinitialiser la base de données locale
npm run db:reset

# Appliquer les migrations
npm run db:migrate:local

# Charger les données de test
npm run db:seed

# Console D1 locale
npm run db:console:local
```

### Tests
```bash
# Test de connexion
curl http://localhost:3000

# Test API
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"operateur@igpglass.ca","password":"password123"}'
```

### Git
```bash
# Statut
git status

# Historique
git log --oneline -10

# Créer un commit
git add .
git commit -m "feat: votre message"
```

## 🧪 Scénario de test rapide

### 1. Connexion
1. Ouvrir: https://3000-i99eg52ghw8axx8tockng-cbeee0f9.sandbox.novita.ai
2. Email: `operateur@igpglass.ca`
3. Mot de passe: `password123`
4. ✅ Vous devriez voir le tableau Kanban IGP

### 2. Création de ticket avec photo
1. Cliquer "**+ Nouveau Ticket**"
2. Remplir:
   - Titre: "Test upload mobile"
   - Description: "Courroie usée sur PDE-7500"
   - Machine: Sélectionner une machine
   - Priorité: HAUTE
3. Cliquer "**📷 Prendre une photo ou vidéo**"
4. Sur mobile: Caméra arrière s'ouvre
5. Prendre une photo (ou sélectionner depuis galerie)
6. ✅ Preview s'affiche dans la grille
7. Cliquer "**Créer le ticket (1 média(s))**"
8. ✅ Ticket créé avec succès!

### 3. Drag-and-drop
1. Sélectionner un ticket dans "**Requête Reçue**"
2. Desktop: Glisser avec la souris vers "**Diagnostic**"
3. Mobile: Toucher et glisser vers "**Diagnostic**"
4. ✅ Ticket déplacé automatiquement

## 📊 État du projet

### Code
- ✅ Build sans erreurs
- ✅ TypeScript compilation réussie
- ✅ Bundle size: ~109KB
- ✅ Git repository à jour (5 commits pour v1.5.0)

### Base de données
- ✅ Migrations appliquées
- ✅ Données de test chargées
- ✅ Table `media` créée et fonctionnelle
- ✅ Relations FK configurées

### Infrastructure
- ✅ Cloudflare D1 configuré (local)
- ✅ Cloudflare R2 configuré (local)
- ✅ PM2 process manager actif
- ✅ Wrangler CLI fonctionnel
- ⏳ Production R2 bucket à créer
- ⏳ Production D1 database à créer

## 💾 Sauvegarde

**Backup créé**: igp-maintenance-v1.5.0-media-upload.tar.gz
**Taille**: 576 KB
**URL**: https://page.gensparksite.com/project_backups/igp-maintenance-v1.5.0-media-upload.tar.gz
**Contenu**: 
- Code source complet
- Configuration Cloudflare
- Migrations de base de données
- Documentation complète
- Historique Git

## 🚀 Prochaines étapes recommandées

### Priorité 1 (Cette semaine)
1. **Tester sur appareils réels** - iPhone + Android
2. **Créer la page de détails** - Galerie de photos/vidéos
3. **Déployer en production** - Cloudflare Pages

### Priorité 2 (Prochain sprint)
4. **Compression d'images** - Canvas API
5. **Validation de taille** - Max 10MB
6. **Statistiques** - Dashboard maintenance

### Priorité 3 (Futur)
7. **Notifications** - Email/SMS pour nouveaux tickets
8. **Export PDF** - Rapports avec photos
9. **Scan QR Code** - Identification machines

## 🐛 Support et dépannage

### Problèmes connus
1. **Logo parfois lent à charger** - Cache CDN, normal
2. **Upload lent sur 3G** - Compression à implémenter
3. **Pas de galerie** - À développer prochainement

### Obtenir de l'aide
1. Consulter `/README.md` pour documentation complète
2. Consulter `/TESTING_MEDIA_UPLOAD.md` pour guide de test
3. Consulter `/IMPLEMENTATION_SUMMARY.md` pour détails techniques
4. Vérifier les logs PM2: `pm2 logs maintenance-app --nostream`
5. Contacter l'équipe de développement

## 📧 Contacts

**Client**: Les Produits Verriers International (IGP) Inc.  
**Domaine email**: @igpglass.ca  
**Projet**: Système de Gestion de Maintenance Industrielle  
**Version**: 1.5.0  
**Date**: 2025-11-02  
**Statut**: ✅ Prêt pour tests QA

---

**Note importante**: Ce système est optimisé pour les appareils mobiles. Testez prioritairement sur smartphone pour valider la capture photo/vidéo.
