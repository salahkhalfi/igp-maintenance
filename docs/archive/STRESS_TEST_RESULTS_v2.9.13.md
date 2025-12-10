# 🔥 STRESS TEST RESULTS - v2.9.13
**Date**: 27/11/2025 16:45:06  
**URL Testée**: http://localhost:3000  
**Version**: v2.9.13

---

## 📊 RÉSUMÉ EXÉCUTIF

| Test | Requêtes Totales | Latence Moyenne | P95 | P99 | Erreurs |
|------|------------------|-----------------|-----|-----|--------|
| Page Principale (GET /) | 1,931 | 260.66ms | undefinedms | 503ms | 0 |
| API Stats Active Tickets | 5,530 | 270.67ms | undefinedms | 6709ms | 0 |
| API Tickets (GET) | 411 | 2562.61ms | undefinedms | 5303ms | 0 |
| API Machines (GET) | 228 | 2320.01ms | undefinedms | 4652ms | 0 |
| Fichiers Statiques (favicon.ico) | 0 | 0ms | undefinedms | 0ms | 970 |
| Charge Mixte (6 endpoints) | 0 | 0ms | undefinedms | 0ms | 191 |

---

## 📈 DÉTAILS PAR TEST

### Test 1: Page Principale (GET /)

**Durée**: 10.29s

#### Requêtes
- **Total**: 1,931
- **Moyenne/sec**: 193.10
- **Mean**: 193.10

#### Latence
- **Moyenne**: 260.66ms
- **P50 (médiane)**: 257ms
- **P95**: undefinedms
- **P99**: 503ms
- **P99.9**: undefinedms
- **Max**: 903ms

#### Débit
- **Moyen**: 99.88 MB/s
- **Total**: 998.82 MB

#### Erreurs
- **Erreurs**: 0
- **Timeouts**: 0
- **Non-2xx**: 0

---

### Test 2: API Stats Active Tickets

**Durée**: 15.19s

#### Requêtes
- **Total**: 5,530
- **Moyenne/sec**: 368.67
- **Mean**: 368.67

#### Latence
- **Moyenne**: 270.67ms
- **P50 (médiane)**: 105ms
- **P95**: undefinedms
- **P99**: 6709ms
- **P99.9**: undefinedms
- **Max**: 9015ms

#### Débit
- **Moyen**: 0.11 MB/s
- **Total**: 1.58 MB

#### Erreurs
- **Erreurs**: 0
- **Timeouts**: 0
- **Non-2xx**: 5530

---

### Test 3: API Tickets (GET)

**Durée**: 15.51s

#### Requêtes
- **Total**: 411
- **Moyenne/sec**: 27.40
- **Mean**: 27.40

#### Latence
- **Moyenne**: 2562.61ms
- **P50 (médiane)**: 2348ms
- **P95**: undefinedms
- **P99**: 5303ms
- **P99.9**: undefinedms
- **Max**: 5430ms

#### Débit
- **Moyen**: 0.01 MB/s
- **Total**: 0.12 MB

#### Erreurs
- **Erreurs**: 0
- **Timeouts**: 0
- **Non-2xx**: 411

---

### Test 4: API Machines (GET)

**Durée**: 10.31s

#### Requêtes
- **Total**: 228
- **Moyenne/sec**: 22.80
- **Mean**: 22.80

#### Latence
- **Moyenne**: 2320.01ms
- **P50 (médiane)**: 2058ms
- **P95**: undefinedms
- **P99**: 4652ms
- **P99.9**: undefinedms
- **Max**: 4909ms

#### Débit
- **Moyen**: 0.01 MB/s
- **Total**: 0.07 MB

#### Erreurs
- **Erreurs**: 0
- **Timeouts**: 0
- **Non-2xx**: 228

---

### Test 5: Fichiers Statiques (favicon.ico)

**Durée**: 14.13s

#### Requêtes
- **Total**: 0
- **Moyenne/sec**: 0.00
- **Mean**: 0.00

#### Latence
- **Moyenne**: 0ms
- **P50 (médiane)**: 0ms
- **P95**: undefinedms
- **P99**: 0ms
- **P99.9**: undefinedms
- **Max**: 0ms

#### Débit
- **Moyen**: 0.00 MB/s
- **Total**: 0.00 MB

#### Erreurs
- **Erreurs**: 970
- **Timeouts**: 970
- **Non-2xx**: 0

---

### Test 6: Charge Mixte (6 endpoints)

**Durée**: 29.72s

#### Requêtes
- **Total**: 0
- **Moyenne/sec**: 0.00
- **Mean**: 0.00

#### Latence
- **Moyenne**: 0ms
- **P50 (médiane)**: 0ms
- **P95**: undefinedms
- **P99**: 0ms
- **P99.9**: undefinedms
- **Max**: 0ms

#### Débit
- **Moyen**: 0.00 MB/s
- **Total**: 0.00 MB

#### Erreurs
- **Erreurs**: 191
- **Timeouts**: 191
- **Non-2xx**: 0

---

## 🎯 ANALYSE ET RECOMMANDATIONS

### Performance Globale
- **Latence minimale**: 0.00ms
- **Latence maximale**: 2562.61ms
- **Ratio**: Infinityx

### Seuils de Performance
| Catégorie | Seuil | Statut |
|-----------|-------|--------|
| Page Principale (GET /) | 260.66ms | 🟡 Acceptable |
| API Stats Active Tickets | 270.67ms | 🟡 Acceptable |
| API Tickets (GET) | 2562.61ms | 🔴 Critique |
| API Machines (GET) | 2320.01ms | 🔴 Critique |
| Fichiers Statiques (favicon.ico) | 0ms | ✅ Excellent |
| Charge Mixte (6 endpoints) | 0ms | ✅ Excellent |

### Recommandations

- ⚠️ **Erreurs détectées**: Investiguer les endpoints avec erreurs
- 🟠 **Latence élevée**: Optimiser les endpoints >500ms

---

## 🏆 CONCLUSION

Version **v2.9.13** testée sous charge.

**Métriques Clés**:
- ✅ Total requêtes traitées: 8,100
- ✅ Latence moyenne globale: 902.33ms
- ✅ Taux d'erreur: 90.494%
