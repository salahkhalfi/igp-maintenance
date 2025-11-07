# 🎨 Schéma de Couleurs - Corporate Premium

**Version**: 2.0.4  
**Date**: 2025-11-07  
**Style**: Corporate Professionnel pour Industrie

---

## 🎯 Philosophie

L'application est destinée à une **industrie de production (verre)**. Les couleurs doivent refléter:
- ✅ Professionnalisme
- ✅ Fiabilité
- ✅ Sobriété
- ✅ Lisibilité
- ❌ PAS de couleurs vives/enfantines
- ❌ PAS de rainbow colors

---

## 🎨 Palette Corporate

### Couleurs Primaires

**Bleu Marine Profond** (Primaire)
- Usage: Headers, boutons principaux, liens
- Tailwind: `slate-800`, `slate-900`
- Gradients: `from-slate-800 to-slate-900`
- Hex: #1e293b → #0f172a

**Gris Anthracite** (Secondaire)
- Usage: Texte secondaire, borders subtiles
- Tailwind: `gray-700`, `gray-800`
- Hex: #374151 → #1f2937

**Bleu Professionnel** (Accent)
- Usage: Actions principales, états actifs
- Tailwind: `blue-600`, `blue-700`
- Hex: #2563eb → #1d4ed8

### Couleurs Fonctionnelles

**Success** (Vert Sobre)
- Usage: Confirmations, statuts positifs
- Tailwind: `emerald-600`, `emerald-700`
- Hex: #059669 → #047857

**Warning** (Ambre Professionnel)
- Usage: Avertissements, priorités moyennes
- Tailwind: `amber-600`, `amber-700`
- Hex: #d97706 → #b45309

**Danger** (Rouge Sobre)
- Usage: Suppressions, erreurs critiques
- Tailwind: `red-600`, `red-700`
- Hex: #dc2626 → #b91c1c

**Info** (Bleu Ciel Sobre)
- Usage: Informations, help text
- Tailwind: `sky-600`, `sky-700`
- Hex: #0284c7 → #0369a1

### Neutres

**Backgrounds**
- Principal: `bg-gray-50` (#f9fafb)
- Cards: `bg-white`
- Hover: `bg-gray-100` (#f3f4f6)
- Disabled: `bg-gray-200` (#e5e7eb)

**Borders**
- Subtiles: `border-gray-200` (#e5e7eb)
- Normales: `border-gray-300` (#d1d5db)
- Emphasis: `border-gray-400` (#9ca3af)

**Text**
- Primary: `text-gray-900` (#111827)
- Secondary: `text-gray-700` (#374151)
- Tertiary: `text-gray-600` (#4b5563)
- Disabled: `text-gray-400` (#9ca3af)

---

## 🔄 Remplacement des Couleurs

### À REMPLACER (Trop vives)

| Ancienne | Nouvelle | Raison |
|----------|----------|--------|
| `purple-600` | `slate-800` | Trop enfantin → Corporate |
| `indigo-600` | `slate-700` | Trop vif → Sobre |
| `pink-500` | `rose-800` | Trop ludique → Professionnel |
| `orange-500` | `amber-600` | Trop vif → Sobre |
| `green-500` | `emerald-600` | Trop flashy → Professionnel |
| `red-500` | `red-600` | OK mais plus sobre |

### Gradients Corporate

**Headers & Sections Principales**
```
Ancien: from-purple-600 to-indigo-600
Nouveau: from-slate-800 to-slate-900
```

**Boutons Primaires**
```
Ancien: from-blue-500 to-blue-600
Nouveau: from-blue-600 to-blue-700
```

**Boutons Success**
```
Ancien: from-green-400 to-green-600
Nouveau: from-emerald-600 to-emerald-700
```

**Boutons Warning**
```
Ancien: from-orange-400 to-orange-600
Nouveau: from-amber-600 to-amber-700
```

**Boutons Danger**
```
Ancien: from-red-400 to-red-600
Nouveau: from-red-600 to-red-700
```

---

## 📍 Applications Spécifiques

### Header Principal
```css
Ancien: bg-gradient-to-r from-purple-600 to-indigo-600
Nouveau: bg-gradient-to-r from-slate-800 to-slate-900
```

### Modals Headers
```css
Ancien: bg-gradient-to-r from-purple-600 to-purple-800
Nouveau: bg-gradient-to-r from-slate-800 to-slate-900
```

### Bouton "Nouveau Ticket"
```css
Ancien: from-orange-400 to-orange-600
Nouveau: from-blue-600 to-blue-700
```

### Statuts Tickets

**Requête Reçue**
- Ancien: `bg-blue-100 text-blue-800 border-blue-300`
- Nouveau: `bg-sky-50 text-sky-800 border-sky-300`

**Diagnostic**
- Ancien: `bg-yellow-100 text-yellow-800 border-yellow-300`
- Nouveau: `bg-amber-50 text-amber-800 border-amber-300`

**En Cours**
- Ancien: `bg-orange-100 text-orange-800 border-orange-300`
- Nouveau: `bg-blue-50 text-blue-800 border-blue-300`

**Attente Pièces**
- Ancien: `bg-purple-100 text-purple-800 border-purple-300`
- Nouveau: `bg-slate-50 text-slate-800 border-slate-300`

**Terminé**
- Ancien: `bg-green-100 text-green-800 border-green-300`
- Nouveau: `bg-emerald-50 text-emerald-800 border-emerald-300`

**Archivé**
- Ancien: `bg-gray-100 text-gray-800 border-gray-300`
- Nouveau: (inchangé - déjà sobre)

### Rôles Badges

**Admin**
- Ancien: `bg-red-100 text-red-800`
- Nouveau: `bg-slate-100 text-slate-800`

**Superviseur**
- Ancien: `bg-yellow-100 text-yellow-800`
- Nouveau: `bg-blue-50 text-blue-700`

**Technicien**
- Ancien: `bg-blue-100 text-blue-800`
- Nouveau: (inchangé - déjà sobre)

**Opérateur**
- Ancien: `bg-green-100 text-green-800`
- Nouveau: `bg-emerald-50 text-emerald-700`

---

## ✅ Checklist de Migration

- [ ] Headers (main app, modals, sections)
- [ ] Boutons (primaires, secondaires, danger)
- [ ] Badges (statuts, rôles, priorités)
- [ ] Gradients (backgrounds, buttons)
- [ ] Borders (cards, sections)
- [ ] Icons colors
- [ ] Hover states
- [ ] Active states
- [ ] Focus rings

---

## 🎯 Résultat Attendu

**Avant**: Application colorée, ludique, "startup"  
**Après**: Application sobre, professionnelle, industrielle, corporate

**Inspiration**: SAP, Oracle, Salesforce, Microsoft Dynamics - interfaces enterprise
