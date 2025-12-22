# 🔍 AUDIT CODE MORT - MaintenanceOS v3.0.8
> **Date**: 2025-12-22
> **Auditeur**: Claude AI
> **Statut**: ANALYSE UNIQUEMENT (pas de suppression)

---

## ⚠️ LEÇON APPRISE

### Incident du 2025-12-22
Routes dupliquées supprimées dans `settings.ts` SANS vérification du comportement de Hono.

**Découverte**: Dans Hono, la PREMIÈRE route déclarée gagne (contrairement à Express).

**Conséquence**: Les routes supprimées étaient en fait les routes ACTIVES.

**Résultat**: Par chance, la nouvelle route active était MEILLEURE (corrigeait un bug de mot de passe).

**Leçon**: TOUJOURS tester le comportement réel avant de supprimer du "code mort".

---

## 📋 INVENTAIRE DES COMPOSANTS SUSPECTS

### 1. BarcodeScanner.js
| Aspect | Valeur |
|--------|--------|
| **Fichier** | `public/static/js/components/BarcodeScanner.js` |
| **Chargé dans home.ts** | ❌ NON |
| **Références dans le code** | 0 (seulement le fichier lui-même) |
| **Dépendance externe** | `html5-qrcode` (chargé en async) |
| **Verdict** | ⚠️ **CODE MORT PROBABLE** |
| **Action recommandée** | NE PAS SUPPRIMER - Peut être une fonctionnalité future prévue |
| **Risque de suppression** | Faible mais incertain |

### 2. TicketDetailsModal.js vs TicketDetailsModal_v3.js
| Aspect | Valeur |
|--------|--------|
| **Fichier actif** | `TicketDetailsModal_v3.min.js` (chargé dans home.ts ligne 70) |
| **Fichier potentiellement mort** | `TicketDetailsModal.js` (641 lignes) |
| **Les deux exposent** | `window.TicketDetailsModal` |
| **Différences** | 118 lignes de diff |
| **Verdict** | ⚠️ **CONFLIT POTENTIEL** - v3 est chargé, mais les deux fichiers existent |
| **Action recommandée** | VÉRIFIER si TicketDetailsModal.js (sans v3) a une utilité |
| **Risque de suppression** | MOYEN - Besoin de comprendre pourquoi les deux existent |

### 3. TicketHistory.js
| Aspect | Valeur |
|--------|--------|
| **Fichier** | `public/static/js/components/TicketHistory.js` |
| **Chargé dans home.ts** | ❌ NON (mais .min.js existe) |
| **Utilisé dans** | Possiblement dans TicketDetailsModal |
| **Verdict** | ⚠️ **À VÉRIFIER** |
| **Action recommandée** | Chercher si `TicketHistory` est appelé dynamiquement |

### 4. AIChatModal_v4.js ✅
| Aspect | Valeur |
|--------|--------|
| **Fichier** | `public/static/js/components/AIChatModal_v4.js` |
| **Chargé dans home.ts** | ✅ OUI (ligne 77) |
| **Utilisé dans** | MainApp.js, TicketDetailsModal.js |
| **Verdict** | ✅ **ACTIF** |

### 5. UserForms.js ✅
| Aspect | Valeur |
|--------|--------|
| **Fichier** | `public/static/js/components/UserForms.js` |
| **Chargé dans home.ts** | ✅ OUI (ligne 92) |
| **Verdict** | ✅ **ACTIF** |

---

## 📊 ROUTES BACKEND - ANALYSE

### Routes Import/Export (settings.ts)
| Route | Ligne | Statut |
|-------|-------|--------|
| `GET /export/users` | 1078 | ✅ ACTIVE |
| `GET /export/machines` | 1105 | ✅ ACTIVE |
| `POST /import/users` | 1156 | ✅ ACTIVE |
| `POST /import/machines` | 1269 | ✅ ACTIVE |

**Note**: Les anciennes routes dupliquées (lignes 925-1076) ont été supprimées le 2025-12-22.

---

## ✅ PROTOCOLE DE SUPPRESSION DE CODE MORT

### Avant de supprimer quoi que ce soit :

1. **GREP GLOBAL**
   ```bash
   grep -rn "NomDuComposant" --include="*.js" --include="*.ts" src/ public/ dist/
   ```

2. **VÉRIFIER LE CHARGEMENT**
   ```bash
   grep "NomDuComposant" src/views/home.ts
   ```

3. **VÉRIFIER LE COMPORTEMENT DU FRAMEWORK**
   - Hono: PREMIÈRE route gagne
   - Express: DERNIÈRE route gagne

4. **TESTER EN PRODUCTION**
   - Ouvrir la fonctionnalité dans le navigateur
   - Vérifier la console pour les erreurs

5. **DOCUMENTER AVANT DE SUPPRIMER**
   - Ajouter une entrée dans ce fichier
   - Expliquer POURQUOI c'est du code mort
   - Obtenir validation de l'utilisateur

6. **COMMIT SÉPARÉ**
   - Un commit par suppression
   - Message clair expliquant ce qui est supprimé

---

## 🚫 NE PAS SUPPRIMER SANS VALIDATION

Les composants suivants sont suspects mais NE DOIVENT PAS être supprimés sans validation explicite :

1. `BarcodeScanner.js` - Fonctionnalité future potentielle
2. `TicketDetailsModal.js` (sans v3) - Relation avec v3 à clarifier
3. `TicketHistory.js` - Utilisation dynamique possible

---

## 📝 HISTORIQUE DES SUPPRESSIONS

| Date | Fichier/Code | Raison | Validé par |
|------|--------------|--------|------------|
| 2025-12-22 | Routes settings.ts lignes 925-1076 | Routes dupliquées (la 2ème version était meilleure) | Post-facto (erreur) |

---

## 🔄 MISES À JOUR

- **2025-12-22**: Création du document après incident de suppression de routes
