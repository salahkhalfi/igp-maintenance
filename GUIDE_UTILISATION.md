# 📖 Guide d'Utilisation - Système de Gestion de Maintenance

Guide complet pour utiliser l'application de gestion de maintenance industrielle.

## 🚀 Accès à l'application

### URL de l'application

**Environnement de développement (Sandbox)**:
- URL: https://3000-i99eg52ghw8axx8tockng-cbeee0f9.sandbox.novita.ai
- Accès direct au tableau Kanban
- Données de test préchargées

**Production (après déploiement Cloudflare)**:
- URL: https://maintenance-app.pages.dev (ou votre domaine personnalisé)

## 👥 Connexion

### Comptes de test disponibles

L'application dispose de 4 comptes de test avec différents niveaux d'accès:

| Rôle | Email | Mot de passe | Permissions |
|------|-------|--------------|-------------|
| **Administrateur** | admin@maintenance.com | password123 | Accès complet (gérer machines, utilisateurs, tous tickets) |
| **Technicien** | tech1@maintenance.com | password123 | Créer/modifier tickets, uploader médias |
| **Technicien** | tech2@maintenance.com | password123 | Créer/modifier tickets, uploader médias |
| **Opérateur** | operator@maintenance.com | password123 | Signaler problèmes, consulter tickets |

### Étapes de connexion

1. Ouvrir l'application dans votre navigateur
2. Entrer l'email et le mot de passe
3. Cliquer sur "Se connecter"
4. Vous serez redirigé vers le tableau Kanban

## 🎯 Interface principale - Tableau Kanban

L'interface principale affiche un tableau Kanban avec 6 colonnes représentant les différents états des tickets:

### Les 6 colonnes du Kanban

1. **🟦 Requête Reçue**
   - Nouveaux tickets créés
   - En attente d'assignation
   - Couleur: Bleu

2. **🟨 Diagnostic**
   - Ticket pris en charge
   - Investigation en cours
   - Identification du problème
   - Couleur: Jaune

3. **🟧 En Cours**
   - Intervention active
   - Réparation en cours
   - Couleur: Orange

4. **🟪 En Attente Pièces**
   - Commande de pièces en cours
   - Attente de livraison
   - Couleur: Violet

5. **🟩 Terminé**
   - Intervention complétée
   - Tests validés
   - Prêt pour archivage
   - Couleur: Vert

6. **⬜ Archivé**
   - Tickets fermés définitivement
   - Historique conservé
   - Couleur: Gris

### Informations affichées sur chaque carte

Chaque ticket affiche:
- **ID unique** (ex: IGP-PDE-7500-20231025-001)
- **Badge de priorité** (Critical, High, Medium, Low)
- **Titre** du problème
- **Machine concernée** (type + modèle)
- **Date de création**
- **Barre de couleur** sur le côté gauche indiquant la priorité

### Priorités des tickets

Les tickets ont 4 niveaux de priorité:

- 🔴 **Critical** (Rouge foncé) - Problème bloquant la production
- 🟠 **High** (Orange) - Problème important à traiter rapidement
- 🟡 **Medium** (Jaune) - Problème normal
- 🟢 **Low** (Vert) - Maintenance préventive ou problème mineur

## 📝 Créer un nouveau ticket

### Pour les opérateurs et techniciens

**Actuellement**, la création de tickets se fait via l'API REST (voir API.md).

**À venir** dans une prochaine version:
- Bouton "Nouveau ticket" dans l'interface
- Formulaire avec champs:
  - Titre du problème
  - Description détaillée
  - Sélection de la machine
  - Niveau de priorité
  - Upload de photos/vidéos

### Via l'API (temporaire)

Exemple de création de ticket:

```bash
# 1. Se connecter et obtenir le token
TOKEN=$(curl -s -X POST https://3000-i99eg52ghw8axx8tockng-cbeee0f9.sandbox.novita.ai/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"operator@maintenance.com","password":"password123"}' | jq -r '.token')

# 2. Créer un nouveau ticket
curl -X POST https://3000-i99eg52ghw8axx8tockng-cbeee0f9.sandbox.novita.ai/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Fuite d'\''huile détectée",
    "description": "Fuite importante au niveau du vérin principal. Intervention urgente nécessaire.",
    "machine_id": 1,
    "priority": "high"
  }'
```

## 🔍 Consulter les détails d'un ticket

**Actuellement**, les détails se consultent via l'API (voir API.md).

**À venir**:
- Clic sur une carte pour ouvrir le modal de détails
- Affichage de:
  - Informations complètes
  - Historique (timeline) des actions
  - Photos/vidéos associées
  - Commentaires
  - Technicien assigné

## 🔄 Modifier le statut d'un ticket

**Pour les techniciens et administrateurs**:

Le changement de statut se fait actuellement via l'API:

```bash
# Passer un ticket en "En cours"
curl -X PATCH https://3000-i99eg52ghw8axx8tockng-cbeee0f9.sandbox.novita.ai/api/tickets/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "in_progress",
    "comment": "Début de l'\''intervention"
  }'
```

**À venir**:
- Drag & drop des cartes entre colonnes
- Mise à jour automatique du statut
- Notification aux parties concernées

## 📷 Ajouter des photos/vidéos

Les médias permettent de documenter les problèmes et les réparations.

### Via l'API

```bash
# Upload d'une photo
curl -X POST https://3000-i99eg52ghw8axx8tockng-cbeee0f9.sandbox.novita.ai/api/media/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/photo.jpg" \
  -F "ticket_id=1"
```

**À venir**:
- Bouton d'upload dans le modal de détails
- Prise de photo directe depuis mobile
- Glisser-déposer de fichiers

## 🔔 Fonctionnalités selon les rôles

### 👤 Opérateur
**Peut faire**:
- ✅ Créer de nouveaux tickets (signaler problèmes)
- ✅ Consulter tous les tickets
- ✅ Ajouter des photos/vidéos
- ✅ Voir l'historique des tickets

**Ne peut pas**:
- ❌ Modifier le statut des tickets
- ❌ Assigner des techniciens
- ❌ Gérer les machines
- ❌ Supprimer des tickets

### 🔧 Technicien
**Peut faire**:
- ✅ Tout ce que peut faire un opérateur
- ✅ Modifier le statut des tickets
- ✅ S'assigner des tickets
- ✅ Ajouter des commentaires détaillés
- ✅ Marquer des tickets comme terminés

**Ne peut pas**:
- ❌ Créer/modifier/supprimer des machines
- ❌ Gérer les utilisateurs
- ❌ Supprimer des tickets

### 👑 Administrateur
**Peut faire**:
- ✅ Tout ce que peuvent faire techniciens et opérateurs
- ✅ Créer/modifier/supprimer des machines
- ✅ Gérer les utilisateurs
- ✅ Supprimer des tickets
- ✅ Accéder aux statistiques complètes
- ✅ Configurer le système

## 📊 Tableau de bord et statistiques

**À venir dans une prochaine version**:
- Nombre de tickets par statut
- Temps moyen de résolution
- Tickets par machine
- Tickets par technicien
- Graphiques d'évolution
- Alertes pour tickets urgents

## 🔍 Recherche et filtrage

**Actuellement disponible via API**:
- Filtrer par statut
- Filtrer par priorité
- Filtrer par machine
- Filtrer par date

**À venir dans l'interface**:
- Barre de recherche textuelle
- Filtres multiples combinés
- Tri personnalisé
- Vues sauvegardées

## 💡 Conseils d'utilisation

### Pour les opérateurs
1. **Soyez précis** dans la description du problème
2. **Ajoutez des photos** pour faciliter le diagnostic
3. **Indiquez la machine exacte** concernée
4. **Évaluez correctement la priorité**

### Pour les techniciens
1. **Mettez à jour le statut régulièrement**
2. **Documentez vos interventions** dans les commentaires
3. **Ajoutez des photos avant/après réparation**
4. **Marquez "Terminé" uniquement quand validé**

### Pour les administrateurs
1. **Vérifiez régulièrement les tickets en attente**
2. **Assurez une bonne répartition de la charge**
3. **Analysez les statistiques pour optimiser**
4. **Maintenez à jour le catalogue des machines**

## 📱 Utilisation mobile

L'interface est responsive et s'adapte aux écrans mobiles:
- Navigation tactile optimisée
- Cartes adaptées aux petits écrans
- Upload de photos depuis la caméra (à venir)

## 🆘 Problèmes courants

### Je ne peux pas me connecter
- Vérifiez votre email et mot de passe
- Assurez-vous d'utiliser un compte de test valide
- Contactez l'administrateur si le problème persiste

### Je ne vois pas mes tickets
- Vérifiez que vous êtes bien connecté
- Actualisez la page
- Vérifiez les filtres actifs

### L'upload de fichier échoue
- Vérifiez la taille du fichier (max 100 MB)
- Formats acceptés: JPG, PNG, MP4, etc.
- Vérifiez votre connexion internet

### Les modifications ne sont pas sauvegardées
- Attendez la confirmation de sauvegarde
- Vérifiez votre connexion internet
- Actualisez la page et réessayez

## 📞 Support et assistance

Pour toute question ou problème:
1. Consultez d'abord ce guide
2. Vérifiez la documentation API (API.md)
3. Contactez votre administrateur système
4. Ouvrez un ticket de support si nécessaire

## 🔮 Fonctionnalités à venir

### Prochaine version (v1.1)
- ✨ Drag & drop des tickets entre colonnes
- ✨ Modal de détails complet
- ✨ Formulaire de création de ticket dans l'UI
- ✨ Upload de médias dans l'interface
- ✨ Recherche et filtres avancés

### Versions futures
- 📧 Notifications par email
- 📊 Dashboard statistiques complet
- 📅 Calendrier de maintenance préventive
- 💬 Chat en temps réel pour techniciens
- 📱 Application mobile native
- 🔔 Notifications push
- 📑 Export PDF des rapports
- 🎨 Thèmes personnalisables

## 📚 Ressources supplémentaires

- **README.md** - Vue d'ensemble du projet
- **API.md** - Documentation complète de l'API REST
- **DEPLOYMENT.md** - Guide de déploiement Cloudflare Pages

---

**Version du guide**: 1.0.0  
**Dernière mise à jour**: 2024-11-02  
**Contact support**: admin@maintenance.com
