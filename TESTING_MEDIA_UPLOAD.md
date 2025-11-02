# 📸 Guide de test - Upload de photos/vidéos mobile (v1.5.0)

## 🎯 Objectif
Tester la fonctionnalité d'upload de photos et vidéos depuis un appareil mobile lors de la création d'un ticket de maintenance.

## 📱 URL de test
**Application de développement**: https://3000-i99eg52ghw8axx8tockng-cbeee0f9.sandbox.novita.ai

## 👥 Comptes de test

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| operateur@igpglass.ca | password123 | Opérateur (recommandé pour test) |
| technicien@igpglass.ca | password123 | Technicien |
| admin@igpglass.ca | password123 | Admin |

## 🧪 Scénario de test principal

### 1️⃣ Connexion
1. Ouvrir l'URL sur un **appareil mobile** (smartphone ou tablette)
2. Se connecter avec: `operateur@igpglass.ca` / `password123`
3. Vérifier que le tableau Kanban s'affiche correctement

### 2️⃣ Création d'un nouveau ticket
1. Cliquer sur le bouton **"+ Nouveau Ticket"** en haut à droite
2. Remplir les champs:
   - **Titre**: "Test upload photo - Courroie usée"
   - **Description**: "La courroie de transmission montre des signes d'usure avancée"
   - **Machine**: Sélectionner une machine dans la liste
   - **Priorité**: Sélectionner "HAUTE"

### 3️⃣ Upload de photo/vidéo
1. Cliquer sur le bouton bleu **"📷 Prendre une photo ou vidéo"**
2. L'appareil devrait demander l'autorisation d'accès à la caméra
3. **Sur mobile**: La caméra arrière (rear camera) devrait s'ouvrir automatiquement
4. Prendre une photo du problème (ou sélectionner une photo existante)
5. **Vérifications**:
   - ✅ L'aperçu (preview) s'affiche dans une grille 3 colonnes
   - ✅ Le type de fichier est indiqué (📷 pour image, 🎥 pour vidéo)
   - ✅ La taille du fichier est affichée en KB
   - ✅ Un bouton X rouge apparaît au survol pour supprimer

### 4️⃣ Ajout de plusieurs médias (optionnel)
1. Cliquer à nouveau sur **"📷 Prendre une photo ou vidéo"**
2. Ajouter une 2ème photo ou vidéo
3. **Vérifications**:
   - ✅ Les deux médias s'affichent dans la grille
   - ✅ Le bouton de soumission indique: **"Créer le ticket (2 média(s))"**

### 5️⃣ Suppression d'un média (optionnel)
1. Survoler/toucher une miniature
2. Cliquer sur le bouton **X** rouge
3. **Vérifications**:
   - ✅ Le média est retiré de la grille
   - ✅ Le compteur est mis à jour: **"Créer le ticket (1 média(s))"**

### 6️⃣ Soumission du ticket
1. Cliquer sur le bouton **"Créer le ticket (X média(s))"**
2. **Vérifications**:
   - ✅ Le texte change en **"Création..."** pendant la création du ticket
   - ✅ Puis change en **"Upload: X%"** pendant l'upload des médias
   - ✅ Une alerte de succès s'affiche: **"Ticket créé avec succès !"**
   - ✅ Le modal se ferme automatiquement
   - ✅ Le nouveau ticket apparaît dans la colonne **"🟦 Requête Reçue"**

### 7️⃣ Vérification backend (avancé)
Pour vérifier que les médias sont bien stockés dans R2:

```bash
# Lister les médias d'un ticket (remplacer {ticketId} par l'ID réel)
curl -X GET http://localhost:3000/api/media/ticket/{ticketId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Devrait retourner:
[
  {
    "id": 1,
    "ticket_id": 123,
    "file_key": "tickets/123/1730562000000-abc123-photo.jpg",
    "file_name": "photo.jpg",
    "file_type": "image/jpeg",
    "file_size": 245678,
    "url": "/api/media/1",
    "created_at": "2025-11-02T16:00:00Z"
  }
]
```

## ✅ Critères de succès

### Fonctionnel
- [ ] La caméra s'ouvre sur mobile avec le bouton "Prendre une photo"
- [ ] L'attribut `capture="environment"` active la caméra arrière
- [ ] Les aperçus s'affichent correctement (images + vidéos)
- [ ] Plusieurs médias peuvent être ajoutés
- [ ] Les médias peuvent être supprimés individuellement
- [ ] La barre de progression s'affiche pendant l'upload
- [ ] Le compteur de médias est correct
- [ ] Les médias sont uploadés vers R2 après la création du ticket
- [ ] Le ticket est créé avec succès

### Interface utilisateur
- [ ] Le bouton caméra a le style IGP (bleu avec icône)
- [ ] La grille de preview est responsive (3 colonnes)
- [ ] Les miniatures ont une hauteur fixe de 24px
- [ ] Les badges (type + taille) sont lisibles
- [ ] Le bouton X apparaît au survol/touch
- [ ] Les animations sont fluides
- [ ] Pas d'erreur JavaScript dans la console

### Performance
- [ ] L'upload ne bloque pas l'interface
- [ ] Les grosses images/vidéos sont acceptées
- [ ] Le temps d'upload est raisonnable (<10s par média)
- [ ] Pas de ralentissement avec 5+ médias

## 🐛 Problèmes connus

### Limitations actuelles
1. **Pas de compression** - Les images sont uploadées en taille originale (peut être lent)
2. **Pas de limite de taille** - Aucune validation côté client pour les fichiers >10MB
3. **Pas de galerie** - Les médias ne sont pas encore affichables dans la vue détaillée du ticket

### Prochaines améliorations (v1.6.0)
- Compression d'images client-side avant upload
- Validation de taille maximale (ex: 10MB par fichier)
- Page de détails avec galerie de médias
- Support du zoom sur les photos
- Lecture vidéo en plein écran

## 📊 Format de rapport de bug

Si vous rencontrez un problème, merci de fournir:

```
**Titre**: [Bref descriptif du problème]

**Appareil**: iPhone 14 / Samsung Galaxy S21 / etc.
**Navigateur**: Safari 17.1 / Chrome Mobile 119 / etc.
**Version iOS/Android**: iOS 17.1 / Android 13

**Étapes pour reproduire**:
1. ...
2. ...
3. ...

**Résultat attendu**: ...
**Résultat obtenu**: ...

**Capture d'écran**: [Joindre si possible]
**Message d'erreur console**: [F12 > Console > copier les erreurs]
```

## 🔧 Dépannage

### La caméra ne s'ouvre pas
- **Cause**: Permissions refusées
- **Solution**: Aller dans Paramètres > Safari/Chrome > Autorisations > Autoriser caméra

### L'upload reste bloqué à 0%
- **Cause**: Connexion internet faible ou serveur injoignable
- **Solution**: Vérifier la connexion, réessayer

### Les aperçus ne s'affichent pas
- **Cause**: Fichier corrompu ou format non supporté
- **Solution**: Essayer avec un autre fichier image/vidéo

### Erreur 500 lors de l'upload
- **Cause**: Problème serveur R2 ou bindings non configurés
- **Solution**: Vérifier les logs PM2: `pm2 logs maintenance-app --nostream`

## 📞 Contact
Pour toute question ou assistance technique, contactez l'équipe de développement.

---

**Document créé**: 2025-11-02  
**Version testée**: 1.5.0  
**Statut**: ✅ Prêt pour tests
