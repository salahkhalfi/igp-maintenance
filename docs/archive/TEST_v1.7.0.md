# 🧪 Guide de Test - Version 1.7.0

## 📋 Checklist des fonctionnalités à tester

### ✅ Fonctionnalités v1.7.0 (Nouvelles)

#### 1. 👤 Champ "Votre nom" personnalisé
- [ ] **Création de ticket**
  - [ ] Ouvrir "Nouveau Ticket"
  - [ ] Vérifier présence du champ "Votre nom *"
  - [ ] Essayer de soumettre sans nom → Devrait bloquer (requis)
  - [ ] Entrer un nom (ex: "Marc Leblanc")
  - [ ] Soumettre le ticket
  - [ ] Cliquer sur le ticket créé
  - [ ] Vérifier "Rapporté par: Marc Leblanc" dans les détails

#### 2. 💬 Système de commentaires
- [ ] **Ouvrir un ticket existant**
  - [ ] Cliquer sur n'importe quel ticket
  - [ ] Scroller vers le bas
  - [ ] Voir section "Commentaires et Notes (X)"

- [ ] **Ajouter un commentaire**
  - [ ] Remplir "Votre nom" (ex: "Sophie Gagnon")
  - [ ] Sélectionner rôle: Opérateur ou Technicien
  - [ ] Taper un commentaire (ex: "Pièce commandée, livraison jeudi")
  - [ ] Cliquer "Publier le commentaire"
  - [ ] Vérifier que le commentaire apparaît dans la liste
  - [ ] Vérifier la bordure colorée (bleu = Opérateur, orange = Technicien)
  - [ ] Vérifier le badge du rôle
  - [ ] Vérifier l'horodatage

- [ ] **Ajouter plusieurs commentaires**
  - [ ] Ajouter 2-3 commentaires avec noms différents
  - [ ] Alterner entre Opérateur et Technicien
  - [ ] Vérifier l'ordre chronologique (plus ancien en haut)
  - [ ] Si > 3 commentaires, vérifier le scroll (max 256px)

#### 3. 📸 Upload de médias supplémentaires
- [ ] **Ouvrir un ticket avec médias existants**
  - [ ] Cliquer sur un ticket ayant déjà des photos/vidéos
  - [ ] Voir la galerie existante en haut
  - [ ] Scroller vers "Ajouter des photos/vidéos supplémentaires"

- [ ] **Sélectionner de nouveaux fichiers**
  - [ ] Cliquer sur "Cliquer pour sélectionner des fichiers"
  - [ ] Sélectionner 2-3 images ou vidéos
  - [ ] Vérifier les previews en grille 2-4 colonnes
  - [ ] Vérifier le nom de fichier en overlay

- [ ] **Supprimer un fichier avant upload**
  - [ ] Cliquer sur le bouton X rouge sur un preview
  - [ ] Vérifier que le fichier disparaît de la sélection

- [ ] **Uploader les fichiers**
  - [ ] Cliquer "Uploader ces fichiers"
  - [ ] Vérifier message "Upload en cours..."
  - [ ] Attendre fin de l'upload
  - [ ] Vérifier message "Médias ajoutés avec succès !"
  - [ ] Vérifier que les nouveaux médias apparaissent dans la galerie en haut
  - [ ] Vérifier que la zone de sélection est vidée

- [ ] **Ouvrir un ticket sans médias**
  - [ ] Cliquer sur un ticket n'ayant pas de photos
  - [ ] Voir message "Aucune photo ou vidéo attachée"
  - [ ] Scroller vers "Ajouter des photos/vidéos supplémentaires"
  - [ ] Uploader 1-2 fichiers
  - [ ] Vérifier que la galerie apparaît maintenant en haut

#### 4. 🗑️ Suppression de tickets
- [ ] **Créer un ticket de test**
  - [ ] Créer un nouveau ticket (ex: "TEST - À supprimer")
  - [ ] Ajouter une photo si possible
  - [ ] Ajouter un commentaire

- [ ] **Supprimer le ticket**
  - [ ] Cliquer sur le ticket de test
  - [ ] Dans l'en-tête du modal, à côté du bouton fermer
  - [ ] Voir l'icône poubelle 🗑️ rouge
  - [ ] Cliquer sur l'icône poubelle
  - [ ] Vérifier dialog de confirmation avec message
  - [ ] Cliquer "Annuler" → Modal reste ouvert
  - [ ] Re-cliquer sur poubelle
  - [ ] Cliquer "OK" pour confirmer
  - [ ] Vérifier message "Ticket supprimé avec succès"
  - [ ] Vérifier que le modal se ferme
  - [ ] Vérifier que le ticket a disparu du tableau Kanban

---

### ✅ Fonctionnalités v1.6.x (Validation)

#### 5. 📸 Galerie de médias
- [ ] **Cliquer sur un ticket avec médias**
  - [ ] Voir grille 2-4 colonnes selon écran
  - [ ] Icônes 📷 pour photos, 🎥 pour vidéos
  - [ ] Hover → effet zoom et border bleue

- [ ] **Lightbox**
  - [ ] Cliquer sur une photo → Plein écran
  - [ ] Cliquer sur X blanc → Ferme
  - [ ] Cliquer sur fond noir → Ferme
  - [ ] Cliquer sur une vidéo → Lecture avec contrôles

#### 6. 📱 Scroll mobile
- [ ] **Sur mobile/petit écran**
  - [ ] Ouvrir "Nouveau Ticket"
  - [ ] Remplir tous les champs
  - [ ] Vérifier que le bouton submit est accessible en scrollant
  - [ ] Pas de contenu coupé

---

### ✅ Fonctionnalités v1.5.0 (Validation)

#### 7. 📸 Upload lors de création
- [ ] **Nouveau ticket avec photos**
  - [ ] Cliquer "Nouveau Ticket"
  - [ ] Cliquer "Prendre une photo ou vidéo"
  - [ ] Sur mobile → Caméra s'ouvre
  - [ ] Sélectionner 1-2 fichiers
  - [ ] Voir previews en grille
  - [ ] Voir compteur dans bouton: "Créer le ticket (2 média(s))"
  - [ ] Soumettre
  - [ ] Vérifier que les médias sont attachés au ticket

---

### ✅ Fonctionnalités v1.4.0 (Validation)

#### 8. 🖱️ Drag-and-Drop Desktop
- [ ] **Avec souris**
  - [ ] Survoler un ticket → Curseur devient 🖐️ (grab)
  - [ ] Cliquer et maintenir → Curseur devient ✊ (grabbing)
  - [ ] Glisser vers une autre colonne
  - [ ] Colonne cible → Fond bleu clair + bordure pointillée
  - [ ] Relâcher → Ticket change de colonne
  - [ ] Vérifier historique mis à jour

#### 9. 📱 Drag-and-Drop Mobile
- [ ] **Avec doigt**
  - [ ] Appuyer et maintenir un ticket
  - [ ] Vibration au début du drag (si supporté)
  - [ ] Glisser vers colonne différente
  - [ ] Relâcher → Ticket déplacé

#### 10. 🖱️ Menu contextuel
- [ ] **Desktop**: Clic droit sur ticket → Menu avec tous les statuts
- [ ] **Mobile**: Appui long (500ms) → Menu contextuel + vibration
- [ ] Sélectionner un statut → Ticket change de colonne

---

## 🌐 URL de Test

**Application**: https://3000-i99eg52ghw8axx8tockng-cbeee0f9.sandbox.novita.ai

**Comptes de test**:
- **Admin**: admin@igpglass.ca / password123
- **Technicien**: technicien@igpglass.ca / password123
- **Opérateur**: operateur@igpglass.ca / password123

---

## 📊 Résultats Attendus

### ✅ Succès si:
1. ✅ Champ "Votre nom" obligatoire et sauvegardé
2. ✅ Commentaires ajoutés avec nom/rôle/horodatage
3. ✅ Médias supplémentaires uploadés et visibles
4. ✅ Tickets supprimés avec confirmation
5. ✅ Galerie de médias fonctionnelle
6. ✅ Scroll mobile sans coupure
7. ✅ Drag-and-drop fluide desktop + mobile
8. ✅ Menu contextuel accessible

### ❌ Échec si:
- ❌ Erreurs 401, 403, 404, 500 dans la console
- ❌ Commentaires ne s'affichent pas
- ❌ Upload de médias échoue
- ❌ Suppression ne fonctionne pas
- ❌ Boutons inaccessibles sur mobile
- ❌ Drag-and-drop ne répond pas

---

## 🐛 Signalement de bugs

Si vous trouvez un bug, noter:
1. **Étape à reproduire** (ex: "Cliquer sur Nouveau Ticket puis...")
2. **Résultat attendu** (ex: "Modal devrait s'ouvrir")
3. **Résultat obtenu** (ex: "Erreur 500 dans console")
4. **Navigateur/Device** (ex: "Chrome 120 sur iPhone 14")
5. **Screenshot** si possible

---

**Version testée**: 1.7.0  
**Date**: 2025-11-02  
**Testeur**: _______________
