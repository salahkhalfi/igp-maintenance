# 🚀 STRESS TEST RESULTS - v2.9.14 (SAFE)
**Date**: 27/11/2025 17:31:24  
**URL Testée**: http://localhost:3000 (LOCAL - Safe)  
**Version**: v2.9.14 (with indexes)  
**Baseline**: v2.9.13 (no indexes)

---

## 📊 COMPARAISON v2.9.13 → v2.9.14

### API Tickets (CRITIQUE)
| Version | Latence Moyenne | P95 | P99 | Amélioration |
|---------|-----------------|-----|-----|--------------|
| **v2.9.13** | 2,562ms | - | 5,303ms | Baseline |
| **v2.9.14** | 137.98ms | undefinedms | 847ms | **94.6%** ✅ |

### API Machines (CRITIQUE)
| Version | Latence Moyenne | P95 | P99 | Amélioration |
|---------|-----------------|-----|-----|--------------|
| **v2.9.13** | 2,320ms | - | 4,652ms | Baseline |
| **v2.9.14** | 359.66ms | undefinedms | 4897ms | **84.5%** ✅ |

---

## 📈 DÉTAILS PAR TEST

### Test 1: Page Principale

**Requêtes**: 1,857 (185.70 req/s)

**Latence**:
- Moyenne: 269.46ms
- P50: 263ms
- P95: undefinedms
- P99: 535ms
- Max: 716ms

**Erreurs**: 0 | **Timeouts**: 0

---

### Test 2: API Tickets

**Requêtes**: 6,420 (428.00 req/s)

**Latence**:
- Moyenne: 137.98ms
- P50: 88ms
- P95: undefinedms
- P99: 847ms
- Max: 2714ms

**Erreurs**: 0 | **Timeouts**: 0

---

### Test 3: API Machines

**Requêtes**: 1,970 (197.00 req/s)

**Latence**:
- Moyenne: 359.66ms
- P50: 87ms
- P95: undefinedms
- P99: 4897ms
- Max: 6220ms

**Erreurs**: 0 | **Timeouts**: 0

---

### Test 4: API Stats

**Requêtes**: 261 (26.10 req/s)

**Latence**:
- Moyenne: 3314.24ms
- P50: 1355ms
- P95: undefinedms
- P99: 7817ms
- Max: 7818ms

**Erreurs**: 0 | **Timeouts**: 0

---

## 🏆 CONCLUSION

**Gain Réel Mesuré**:
- API Tickets: 94.6% amélioration
- API Machines: 84.5% amélioration

**Objectif**: -40% à -60% latence  
**Atteint**: ✅ OUI

**Status**: ✅ Optimisation RÉUSSIE
