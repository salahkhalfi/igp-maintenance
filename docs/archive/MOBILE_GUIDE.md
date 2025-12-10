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

### 🎯 **PRINCIPAL** - Drag & Drop (Glisser-Déposer)

#### Sur Mobile 👆
- **Action**: Toucher et MAINTENIR (100-200ms) puis GLISSER
- **Effet**: 
  - La carte devient semi-transparente
  - Les colonnes se surlignent en bleu au survol
  - Drop sur la colonne désirée
- **Usage**: Méthode **recommandée** pour déplacer les tickets

#### Sur Desktop 🖱️
- **Action**: Cliquer et MAINTENIR puis GLISSER avec la souris
- **Effet**: 
  - Curseur change: grab → grabbing
  - Carte semi-transparente + rotation
  - Colonnes surlignées au survol
- **Usage**: Méthode **recommandée** pour déplacer les tickets

### 🔄 **ALTERNATIF** - Menu contextuel (Clic droit)

#### Desktop uniquement
- **Action**: Clic droit sur une carte
- **Effet**: Menu avec 6 options de statut
- **Usage**: Pour sélection précise ou correction rapide

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

### 2. 🎯 **NOUVEAU** - Déplacer un ticket avec Drag & Drop

#### Sur Mobile (Doigt) 👆

```
1. Toucher et MAINTENIR le doigt sur une carte pendant 100-200ms
2. La carte devient semi-transparente (vous pouvez la "soulever")
3. GLISSER le doigt vers le haut ou le bas
4. La colonne sous votre doigt se surligne en bleu
5. RELÂCHER le doigt sur la colonne désirée
6. Le ticket se déplace automatiquement
```

**Feedback visuel**:
- 🟦 **Carte en drag**: Opacité 50%, légèrement tournée
- 🟦 **Colonne de destination**: Fond bleu clair + bordure pointillée
- ✅ **Drop réussi**: Animation douce, mise à jour immédiate

**Astuces**:
- Glisser **vers le haut** pour les colonnes précédentes
- Glisser **vers le bas** pour les colonnes suivantes
- Si vous ratez, recommencez simplement le geste

#### Sur Desktop (Souris) 🖱️

```
1. Cliquer et MAINTENIR le bouton de la souris sur une carte
2. Le curseur change en icône "main qui attrape" (grab)
3. DÉPLACER la souris vers la colonne désirée
4. La colonne survole se surligne en bleu
5. RELÂCHER le bouton de la souris
6. Le ticket se déplace automatiquement
```

**Curseurs**:
- 👆 **Au repos**: Curseur pointer (main avec doigt)
- ✊ **En train de saisir**: Curseur grab (main ouverte)
- 👊 **En train de déplacer**: Curseur grabbing (main fermée)

**Raccourcis clavier** (à venir):
- `Ctrl + Drag`: Dupliquer le ticket
- `Shift + Drag`: Archiver automatiquement

---

### 3. Menu contextuel (Option alternative)

Si le drag-and-drop ne fonctionne pas ou pour une sélection précise :

#### Desktop
```
1. CLIC DROIT sur une carte
2. Un menu contextuel apparaît avec les 6 statuts
3. Cliquer sur le statut désiré
4. Le ticket se déplace vers ce statut
```

#### Mobile
```
(Non disponible sur mobile - Utiliser le drag & drop)
```

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

### Feedback visuel - Drag & Drop
- **Carte en drag**: Opacité 50%, rotation 2°, ombre légère
- **Zone de drop**: Fond bleu clair + bordure pointillée bleue
- **Curseur desktop**: pointer → grab → grabbing
- **Animation drop**: Transition fluide 0.2s
- **Hover effect**: Ombre plus prononcée sur survol

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

### Le drag ne fonctionne pas (Mobile)
**Cause**: Mouvement trop rapide ou navigateur incompatible
**Solution**: 
- Maintenir le doigt **100-200ms** avant de glisser
- Glisser lentement et délibérément
- Utiliser Chrome ou Safari pour meilleure compatibilité

### La carte ne "colle" pas lors du drag (Desktop)
**Cause**: Mouvement trop rapide de la souris
**Solution**: 
- Cliquer et MAINTENIR 100ms avant de bouger
- Déplacer la souris plus lentement
- Vérifier que le curseur change en "grab"

### Le drop ne fonctionne pas
**Cause**: Relâché en dehors d'une colonne valide
**Solution**: 
- Vérifier que la colonne est **surlignée en bleu**
- Relâcher uniquement quand la zone est colorée
- Si échec, recommencer le drag depuis le début

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
1. **Utilisez le drag-and-drop** pour déplacer rapidement les tickets entre colonnes
2. **Clic droit (desktop)** pour correction précise de statut
3. **Gardez l'app ouverte** pendant les interventions pour mise à jour en temps réel
4. **Ajoutez l'app à l'écran d'accueil** pour un accès rapide (PWA à venir)

### Pour les opérateurs
1. **Glissez-déposez** les tickets pour les faire avancer dans le workflow
2. **Vérifiez la priorité** avant de créer un ticket (rouge = critique)
3. **Utilisez le drag vertical** sur mobile pour navigation intuitive
4. **Actualisez régulièrement** pour voir les mises à jour des techniciens

### Pour les administrateurs
1. **Drag multi-colonnes** pour réorganiser massivement les tickets
2. **Menu contextuel** pour sélection précise du statut
3. **Archivez par drag** les tickets terminés vers "Archivé"
4. **Surveillez visuellement** les colonnes "En Attente Pièces" et "Diagnostic"

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

### ✅ Récemment ajouté (v1.4.0)
- [x] **Drag & Drop natif** - Glisser-déposer desktop + mobile ✨
- [x] **Touch drag** - Détection intelligente du doigt
- [x] **Feedback visuel** - Animations fluides et colonnes surlignées
- [x] **Curseurs dynamiques** - grab/grabbing sur desktop

### En cours de développement
- [ ] **Raccourcis drag** - Ctrl+Drag dupliquer, Shift+Drag archiver
- [ ] **Drag multi-sélection** - Déplacer plusieurs tickets à la fois
- [ ] **Progressive Web App (PWA)** - Installation sur écran d'accueil
- [ ] **Mode hors ligne** - Sync automatique quand connexion revient
- [ ] **Upload photos** - Prendre photo directement depuis camera
- [ ] **Notifications push** - Alertes pour nouveaux tickets assignés
- [ ] **Scan QR/Barcode** - Identification rapide des machines
- [ ] **Dark mode** - Économie batterie et confort visuel

### Idées futures
- [ ] Drag entre espaces de travail
- [ ] Géolocalisation pour tickets terrain
- [ ] Signature électronique pour clôture
- [ ] Temps de travail chronométré
- [ ] Partage de position entre techniciens

---

**Version**: 1.4.0  
**Dernière mise à jour**: 2025-11-02  
**Statut**: ✅ Drag-and-Drop natif Desktop & Mobile complet
