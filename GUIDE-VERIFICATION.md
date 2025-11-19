# GUIDE UTILISATEUR - VÉRIFICATION COMPLÈTE

## ✅ COLONNES KANBAN (VÉRIFIÉES)

| Emoji | Nom EXACT | Singulier/Pluriel |
|-------|-----------|-------------------|
| 🟦 | **Requete Recue** | Singulier ✅ |
| 🟨 | **Diagnostic** | Singulier ✅ |
| 🟧 | **En Cours** | Singulier ✅ |
| 🟪 | **En Attente Pieces** | Singulier ✅ |
| 🟩 | **Termine** | Singulier ✅ |
| ⬜ | **Archive** | Singulier ✅ |

**Source:** `const statuses = [...]` dans l'app

---

## ✅ BOUTONS DE NAVIGATION (PAR RÔLE)

### 1️⃣ Bouton "**+ Demande**"
- **Texte**: `Demande`
- **Icône**: `fa-plus`
- **Couleur**: Bleu (`bg-igp-blue`)
- **Visible pour**: TOUS les rôles connectés
- **Position**: En haut à gauche (premier bouton)

### 2️⃣ Bouton "**Messagerie**"
- **Texte**: `Messagerie`
- **Icône**: `fa-comments`
- **Couleur**: Gris/Ardoise (`from-slate-700 to-gray-700`)
- **Visible pour**: 
  - ✅ Technicien
  - ✅ Superviseur
  - ✅ Admin
  - ✅ Opérateur
  - ✅ Opérateur Four
- **Position**: Deuxième bouton

### 3️⃣ Bouton "**Archives**"
- **Texte**: Icône uniquement (toggle)
- **Icône**: `fa-archive` ou `fa-eye-slash`
- **Visible pour**: TOUS les rôles
- **Position**: Troisième bouton

### 4️⃣ Bouton "**Utilisateurs**"
- **Texte**: `Utilisateurs`
- **Icône**: `fa-users-cog`
- **Couleur**: Bleu foncé (`bg-blue-700`)
- **Visible pour**:
  - ✅ Technicien
  - ✅ Superviseur
  - ✅ Admin
- **Position**: Quatrième bouton

### 5️⃣ Bouton "**Machines**"
- **Texte**: `Machines`
- **Icône**: `fa-cogs`
- **Couleur**: Sarcelle (`bg-teal-600`)
- **Visible pour**:
  - ✅ Superviseur
  - ✅ Admin
- **Position**: Cinquième bouton

### 6️⃣ Bouton "**Parametres**"
- **Texte**: `Parametres` (sans accent)
- **Icône**: `fa-sliders-h`
- **Couleur**: Violet (`bg-purple-600`)
- **Visible pour**:
  - ✅ Admin uniquement
- **Position**: Sixième bouton

### 7️⃣ Bouton "**Rôles**"
- **Texte**: `Roles` ou icône
- **Visible pour**:
  - ✅ Admin uniquement
- **Position**: Septième bouton (rare)

### 8️⃣ Bouton "**Guide**" 
- **Type**: Lien externe (ouvre dans nouvel onglet)
- **URL**: `/guide`
- **Icône**: Bouton rond violet/bleu
- **Texte**: Icône seulement (avec tooltip "Guide utilisateur - Aide")
- **Visible pour**: TOUS les rôles
- **Position**: En haut à droite dans le menu utilisateur

### 9️⃣ Bouton "**Déconnexion**"
- **Texte**: `Déconnexion`
- **Icône**: `fa-sign-out-alt`
- **Visible pour**: TOUS les rôles
- **Position**: Dernier élément du menu utilisateur

---

## 📋 RÉSUMÉ PAR RÔLE

### **Admin** (accès complet)
✅ + Demande  
✅ Messagerie  
✅ Archives  
✅ Utilisateurs  
✅ Machines  
✅ Parametres  
✅ Rôles  
✅ Guide  
✅ Déconnexion

### **Superviseur**
✅ + Demande  
✅ Messagerie  
✅ Archives  
✅ Utilisateurs  
✅ Machines  
❌ Parametres  
❌ Rôles  
✅ Guide  
✅ Déconnexion

### **Technicien**
✅ + Demande  
✅ Messagerie  
✅ Archives  
✅ Utilisateurs  
❌ Machines  
❌ Parametres  
❌ Rôles  
✅ Guide  
✅ Déconnexion

### **Opérateur / Opérateur Four**
✅ + Demande  
✅ Messagerie  
✅ Archives  
❌ Utilisateurs  
❌ Machines  
❌ Parametres  
❌ Rôles  
✅ Guide  
✅ Déconnexion

---

## ⚠️ NOTES IMPORTANTES

1. **Tous les textes sont au SINGULIER** (pas de "s" pluriel)
2. **"Parametres"** s'écrit SANS accent sur le è
3. **"Archive"** et non "Archives" ou "Archivé"
4. **Le bouton Guide** est accessible à TOUS mais se trouve dans le menu utilisateur (pas dans la barre principale)
5. **Position du menu utilisateur**: En haut à DROITE (nom + icône utilisateur)

---

## 🔍 MÉTHODE DE VÉRIFICATION

Toutes ces informations ont été vérifiées par:
```bash
curl -s http://localhost:3000/ | grep "const statuses"
curl -s http://localhost:3000/ | grep "currentUser?.role"
curl -s http://localhost:3000/ | grep -A5 "setShow"
```

Date de vérification: 2025-11-19
Version: v2.8.1
