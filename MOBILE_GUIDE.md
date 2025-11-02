# 📱 Guide d'utilisation Mobile - Système de Maintenance

## 🎯 Aperçu

L'application de gestion de maintenance est **100% responsive** et optimisée pour une utilisation sur appareils mobiles (smartphones et tablettes). Ce guide explique comment utiliser toutes les fonctionnalités sur mobile.

---

## 🚀 Accéder à l'application sur mobile

### Option 1: Depuis Internet (Production)
```
1. Ouvrir le navigateur mobile (Chrome, Safari, Firefox)
2. Accéder à l'URL de production: https://your-app.pages.dev
3. Se connecter avec vos identifiants
```

### Option 2: Depuis réseau local (Développement)
```
1. Assurez-vous que le mobile et l'ordinateur sont sur le même réseau Wi-Fi
2. Sur l'ordinateur, trouvez l'adresse IP locale:
   - Mac/Linux: `ifconfig | grep inet`
   - Windows: `ipconfig`
3. Sur mobile, ouvrir le navigateur et accéder à: http://[IP]:3000
   Exemple: http://192.168.1.100:3000
4. Se connecter avec les identifiants de test
```

---

## 📲 Gestes tactiles

### 1. **Navigation dans le Kanban**

#### Tap simple (clic court)
- **Action**: Toucher brièvement une carte de ticket
- **Effet**: Déplace le ticket vers la **colonne suivante**
- **Usage**: Pour faire avancer rapidement un ticket dans le workflow

#### Appui long (Long Press)
- **Action**: Maintenir le doigt sur une carte pendant **500ms**
- **Effet**: 
  - Vibration haptique (si supportée)
  - Ouverture du **menu contextuel**
- **Usage**: Pour choisir n'importe quel statut (avancer OU reculer)

---

## 🎨 Interface Mobile

### Layout Responsive

#### 📱 Smartphone (< 640px)
```
┌─────────────────────┐
│  Header (empilé)    │
│  ┌───────────────┐  │
│  │ 🟦 Reçue     │  │  ← Scroll vertical
│  ├───────────────┤  │
│  │ 🟨 Diagnostic│  │
│  ├───────────────┤  │
│  │ 🟧 En cours  │  │
│  ├───────────────┤  │
│  │ 🟪 Attente   │  │
│  ├───────────────┤  │
│  │ 🟩 Terminé   │  │
│  ├───────────────┤  │
│  │ ⬜ Archivé   │  │
│  └───────────────┘  │
└─────────────────────┘
```

#### 📱 Tablette (640px - 1024px)
```
┌─────────────────────────────┐
│        Header               │
├──────────────┬──────────────┤
│ 🟦 Reçue     │ 🟨 Diagnostic│
├──────────────┼──────────────┤
│ 🟧 En cours  │ 🟪 Attente   │
├──────────────┼──────────────┤
│ 🟩 Terminé   │ ⬜ Archivé   │
└──────────────┴──────────────┘
```

#### 💻 Desktop (> 1024px)
```
┌───────────────────────────────────────────────────┐
│                    Header                          │
├────┬────┬────┬────┬────┬────┐
│ 🟦 │ 🟨 │ 🟧 │ 🟪 │ 🟩 │ ⬜ │  ← 6 colonnes
│Reçu│Diag│Cour│Att │Term│Arch│
└────┴────┴────┴────┴────┴────┘
```

---

## 🔧 Fonctionnalités détaillées

### 1. Créer un nouveau ticket

```
1. Toucher le bouton "Nouvelle Demande" (vert) dans le header
2. Remplir le formulaire modal en plein écran:
   - Titre du problème
   - Description détaillée
   - Machine concernée (menu déroulant)
   - Priorité (4 boutons: Faible, Moyenne, Haute, Critique)
3. Toucher "Créer le ticket"
4. Le ticket apparaît dans la colonne "Requête Reçue"
```

**Astuce mobile**: Les champs de formulaire sont agrandis (16px) pour éviter le zoom automatique sur iOS.

---

### 2. Déplacer un ticket (avancer)

```
1. Toucher brièvement une carte dans n'importe quelle colonne
2. Le ticket se déplace automatiquement vers la colonne suivante
3. Un enregistrement est ajouté dans l'historique du ticket
```

**Flux de progression**:
```
Requête Reçue → Diagnostic → En Cours → En Attente Pièces → Terminé → Archivé
```

---

### 3. Choisir un statut spécifique (avancer ou reculer)

```
1. Maintenir le doigt sur une carte pendant 500ms
2. Sentir la vibration (si supportée par l'appareil)
3. La carte se surligne en bleu clair
4. Un menu contextuel apparaît avec les 6 statuts
5. Toucher le statut désiré
6. Le ticket se déplace vers ce statut
```

**Exemple d'utilisation**:
- Un ticket est par erreur passé à "Terminé" → Long press → Sélectionner "En Cours"
- Un ticket nécessite un diagnostic approfondi → Long press → Sélectionner "Diagnostic"

**Menu contextuel**:
```
┌─────────────────────────┐
│  Déplacer vers:         │
├─────────────────────────┤
│ 📥 Requête Reçue        │
│ 🔍 Diagnostic           │
│ 🔧 En Cours (actuel)    │ ← Grisé
│ ⏰ En Attente Pièces    │
│ ✅ Terminé              │
│ 📦 Archivé              │
└─────────────────────────┘
```

---

### 4. Actualiser les données

```
1. Toucher le bouton "Actualiser" (bleu) dans le header
2. Les tickets sont rechargés depuis le serveur
3. L'affichage se met à jour automatiquement
```

**Astuce**: Utiliser cette fonction après qu'un collègue a modifié des tickets.

---

### 5. Se déconnecter

```
1. Toucher le bouton "Déconnexion" (rouge) dans le header
2. Retour à l'écran de connexion
3. Les informations de session sont supprimées
```

---

## 🎯 Tailles tactiles optimisées

Pour garantir une **excellente expérience tactile**, tous les éléments interactifs respectent les standards d'accessibilité:

| Élément | Taille minimale | Standard |
|---------|----------------|----------|
| Boutons header | 44px × 44px | ✅ Apple HIG |
| Cartes de ticket | 44px hauteur min | ✅ Apple HIG |
| Menu contextuel items | 48px × 48px | ✅ Material Design |
| Champs de formulaire | 44px hauteur | ✅ WCAG 2.1 |

---

## 🔔 Notifications visuelles et haptiques

### Vibration haptique
- **Quand**: Lors de l'ouverture du menu contextuel (appui long)
- **Durée**: 50ms
- **Compatibilité**: 
  - ✅ Android: Chrome, Firefox, Samsung Internet
  - ✅ iOS 13+: Safari, Chrome
  - ❌ iOS < 13: Non supporté (pas d'erreur)

### Feedback visuel
- **Carte surbrillance**: Bleu clair pendant l'appui long
- **Animation**: Légère réduction (scale 0.98) lors du tap
- **Hover effect**: Ombre plus prononcée sur desktop

---

## 📊 Performances sur mobile

### Optimisations appliquées
- ✅ **Pas de bibliothèques lourdes**: React UMD léger (< 150KB)
- ✅ **CSS optimisé**: TailwindCSS via CDN avec purge automatique
- ✅ **Lazy loading**: Tickets chargés à la demande
- ✅ **Gestion mémoire**: Pas de listeners qui fuient
- ✅ **Touch events**: Optimisés avec preventDefault et stopPropagation

### Temps de chargement typiques
| Connexion | Première visite | Visites suivantes |
|-----------|----------------|-------------------|
| 4G | 2-3 secondes | < 1 seconde |
| 3G | 4-6 secondes | 1-2 secondes |
| WiFi | < 1 seconde | < 500ms |

---

## 🐛 Résolution de problèmes

### Le menu contextuel ne s'ouvre pas
**Cause**: Appui long trop court ou mouvement du doigt
**Solution**: Maintenir le doigt **immobile** pendant au moins 500ms

### La vibration ne fonctionne pas
**Cause**: Navigateur ou système non compatible
**Solution**: Fonctionnalité optionnelle - l'application fonctionne normalement sans vibration

### Le formulaire zoom automatiquement (iOS)
**Cause**: Champs < 16px déclenchent le zoom sur iOS
**Solution**: ✅ Déjà corrigé - tous les champs font 16px minimum

### Les boutons sont trop petits
**Cause**: Viewport non configuré
**Solution**: Vérifier la balise `<meta name="viewport">` dans le HTML (déjà présente)

### Le tap déplace immédiatement alors que je veux le menu
**Solution**: Utiliser **l'appui long** (500ms) au lieu d'un tap simple

---

## 📱 Compatibilité navigateurs

### ✅ Entièrement supporté
- **Chrome Android** 90+
- **Safari iOS** 13+
- **Samsung Internet** 14+
- **Firefox Android** 88+
- **Edge Mobile** 90+

### ⚠️ Support partiel
- **Safari iOS** < 13: Pas de vibration haptique
- **UC Browser**: Menu contextuel peut nécessiter un tap supplémentaire

### ❌ Non supporté
- **Internet Explorer Mobile**: Obsolète
- Navigateurs très anciens (< 2019)

---

## 💡 Conseils d'utilisation

### Pour les techniciens
1. **Utilisez l'appui long** pour corriger rapidement un ticket mal placé
2. **Gardez l'app ouverte** pendant les interventions pour mise à jour en temps réel
3. **Ajoutez l'app à l'écran d'accueil** pour un accès rapide (PWA à venir)

### Pour les opérateurs
1. **Utilisez le tap simple** pour créer et avancer les tickets rapidement
2. **Vérifiez la priorité** avant de créer un ticket (rouge = critique)
3. **Actualisez régulièrement** pour voir les mises à jour des techniciens

### Pour les administrateurs
1. **Utilisez le menu contextuel** pour gérer le flux de tickets
2. **Archivez les tickets terminés** en les déplaçant à "Archivé"
3. **Surveillez les tickets "En Attente Pièces"** pour planifier les achats

---

## 🔐 Sécurité sur mobile

### Bonnes pratiques
- ✅ Toujours se **déconnecter** après utilisation
- ✅ Ne pas enregistrer le mot de passe dans le navigateur (appareils partagés)
- ✅ Utiliser le mode **navigation privée** sur appareils partagés
- ✅ Verrouiller le téléphone après utilisation

### Session
- **Durée**: 24 heures par défaut
- **Expiration**: Se déconnecte automatiquement après inactivité
- **Token**: Stocké dans localStorage (effacé à la déconnexion)

---

## 📞 Support

### Problèmes techniques
- Vérifier la connexion internet
- Vider le cache du navigateur
- Redémarrer l'application
- Contacter l'administrateur système

### Demandes de fonctionnalités
- Mode hors ligne (PWA)
- Notifications push
- Upload de photos depuis mobile
- Scan QR code pour machines

---

## 🚀 Prochaines améliorations mobiles

### En cours de développement
- [ ] **Progressive Web App (PWA)** - Installation sur écran d'accueil
- [ ] **Mode hors ligne** - Sync automatique quand connexion revient
- [ ] **Upload photos** - Prendre photo directement depuis camera
- [ ] **Notifications push** - Alertes pour nouveaux tickets assignés
- [ ] **Scan QR/Barcode** - Identification rapide des machines
- [ ] **Dark mode** - Économie batterie et confort visuel

### Idées futures
- [ ] Géolocalisation pour tickets terrain
- [ ] Signature électronique pour clôture
- [ ] Temps de travail chronométré
- [ ] Partage de position entre techniciens

---

**Version**: 1.3.0  
**Dernière mise à jour**: 2025-11-02  
**Statut**: ✅ Pleinement fonctionnel sur mobile
