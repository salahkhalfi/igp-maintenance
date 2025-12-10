# ⚠️ STRESS TEST SAFETY GUIDE
**Date**: 2025-11-27  
**Version**: v2.9.14  
**Context**: Rate Limiting & Ban Prevention

---

## 🚨 RISQUES IDENTIFIÉS

### **1. Cloudflare Rate Limiting**

#### **Limites Cloudflare Pages**
| Plan | Limite | Risque Stress Test |
|------|--------|-------------------|
| **Free** | 100,000 req/jour | 🟡 **MODÉRÉ** |
| **Burst** | ~1,000 req/min | 🔴 **ÉLEVÉ** |
| **DDoS Protection** | Auto-détection | 🔴 **ÉLEVÉ** |

**Notre Stress Test v2.9.13**:
- **8,100 requêtes** en 98 secondes
- **~4,950 req/min** (burst peak)
- **🔴 5x la limite burst normale**

#### **Conséquences Possibles**
1. **Soft Ban** (15-60 min)
   - HTTP 429 (Too Many Requests)
   - IP temporairement bloquée
   - Cloudflare Challenge (CAPTCHA)

2. **Hard Ban** (rare mais possible)
   - IP blacklistée 24h
   - Domaine signalé comme suspect
   - Nécessite contact Cloudflare Support

---

### **2. GenSpark Sandbox Limits**

#### **Limites Sandbox**
| Ressource | Limite | Risque |
|-----------|--------|--------|
| **CPU** | Partagé | 🟡 Ralentissement |
| **RAM** | ~2GB | 🟡 OOM possible |
| **Network** | Partagé | 🟡 Throttling |
| **Durée Session** | 1h (service URL) | 🟢 OK |

**Impact Stress Test**:
- CPU 100% pendant 98s
- RAM 45-60 MB stable
- **🟡 Risque MODÉRÉ** (ralentit autres users)

---

### **3. Production Database (D1)**

#### **Limites D1 Database**
| Plan | Limite Lectures | Limite Écritures |
|------|----------------|------------------|
| **Free** | 5M req/jour | 100K req/jour |
| **Paid** | 25M req/jour | 50M req/jour |

**Notre Test**:
- 8,100 lectures (queries SELECT)
- 0 écritures
- **🟢 Risque FAIBLE** (0.16% quota journalier)

---

## ✅ STRATÉGIES SÛRES

### **Option A: Test Progressif (RECOMMANDÉE)**

**Principe**: Augmenter charge graduellement

```bash
# Test 1: Warm-up (100 req, 10 connections)
npx autocannon -c 10 -d 10 https://mecanique.igpglass.ca

# Attendre 5 minutes

# Test 2: Light load (500 req, 25 connections)
npx autocannon -c 25 -d 10 https://mecanique.igpglass.ca/api/tickets

# Attendre 10 minutes

# Test 3: Medium load (1000 req, 50 connections)
npx autocannon -c 50 -d 10 https://mecanique.igpglass.ca/api/tickets
```

**Avantages**:
- ✅ Reste sous limites burst
- ✅ Détecte rate limiting tôt
- ✅ Moins risqué pour production

**Durée**: 30 minutes (avec pauses)

---

### **Option B: Test Local + Extrapolation**

**Principe**: Tester sur sandbox, extrapoler pour production

```bash
# 1. Test sur sandbox local (localhost:3000)
cd /home/user/webapp
node stress-test.cjs

# 2. Mesurer latence moyenne
# Exemple: 150ms avec indexes vs 2,500ms avant

# 3. Calculer gain réel
# Gain = (2500 - 150) / 2500 = 94% reduction ✅

# 4. Tester 1 seul endpoint production (safe)
curl -w "@curl-format.txt" https://mecanique.igpglass.ca/api/tickets
```

**Avantages**:
- ✅ 0 risque Cloudflare ban
- ✅ Mesure gain réel
- ✅ Validation rapide

**Durée**: 5 minutes

---

### **Option C: Monitoring Passif 48h**

**Principe**: Utiliser métriques production réelles

**Où regarder**:
1. **Cloudflare Analytics**
   - https://dash.cloudflare.com → Pages → webapp → Analytics
   - Latence P50/P95/P99
   - Taux d'erreur
   - Débit req/s

2. **Users Réels**
   - Feedback subjectif: "C'est plus rapide"
   - Temps chargement observé
   - Anomalies signalées

**Avantages**:
- ✅ 0 risque
- ✅ Métriques production réelles
- ✅ Validation organique

**Inconvénient**:
- 🟡 Nécessite 48h d'attente

---

## 🎯 MA RECOMMANDATION

### **Option B + C Combinées** (MEILLEUR COMPROMIS)

**Phase 1: Test Local Immédiat (5 min)**
```bash
# 1. Redémarrer sandbox avec indexes
cd /home/user/webapp
pm2 restart webapp

# 2. Stress test LOCAL (safe)
node stress-test.cjs

# 3. Comparer résultats
# v2.9.13: API Tickets 2,562ms
# v2.9.14: API Tickets ???ms (espéré <1,500ms)
```

**Phase 2: Test Unique Production (1 min)**
```bash
# Tester 1 endpoint avec 10 requêtes séquentielles (safe)
for i in {1..10}; do
  curl -s -w "Request $i: %{time_total}s\n" \
    -o /dev/null https://mecanique.igpglass.ca/api/tickets
  sleep 2  # Pause 2s entre requêtes
done

# Calculer moyenne manuelle
```

**Phase 3: Monitoring Passif 48h**
- Observer Cloudflare Analytics
- Collecter feedback users
- Valider gain réel

---

## 📊 COMPARAISON OPTIONS

| Option | Durée | Risque Ban | Précision | Effort |
|--------|-------|------------|-----------|--------|
| **A: Progressif** | 30 min | 🟡 Modéré | Haute | Moyen |
| **B: Local** | 5 min | 🟢 Aucun | Moyenne | Faible |
| **C: Passif** | 48h | 🟢 Aucun | Haute | Aucun |
| **B+C (Recommandé)** | 48h | 🟢 Aucun | Haute | Faible |

---

## ⚠️ SIGNAUX D'ALERTE

### **Si vous voyez ça, ARRÊTEZ immédiatement:**

1. **HTTP 429** (Too Many Requests)
   ```
   Error 429: Rate limit exceeded
   ```
   → Arrêter stress test
   → Attendre 15-30 min

2. **Cloudflare Challenge**
   ```
   Checking your browser before accessing...
   ```
   → IP marquée suspecte
   → Attendre 1h

3. **HTTP 503** (Service Unavailable)
   ```
   Error 503: Service temporarily unavailable
   ```
   → Database overload possible
   → Arrêter immédiatement

4. **Latence explosive**
   ```
   Request timeout (>30s)
   ```
   → Système surchargé
   → Rollback si persistant

---

## 🛡️ PROTECTION PRÉVENTIVE

### **Avant Stress Test**

1. **Prévenir Cloudflare** (optionnel mais recommandé)
   - Ajouter note dans Cloudflare: "Performance testing v2.9.14"
   - Désactiver temporairement DDoS Protection (si accès)
   - Whitelister IP sandbox (si possible)

2. **Monitoring Temps Réel**
   ```bash
   # Terminal 1: Stress test
   node stress-test.cjs
   
   # Terminal 2: Monitor logs
   pm2 logs webapp --lines 50
   
   # Terminal 3: Monitor DB
   # (Si erreurs DB, arrêter test)
   ```

3. **Rate Limiting Manuel**
   ```javascript
   // Dans stress-test.cjs
   const result = await autocannon({
     url: BASE_URL,
     connections: 10,        // ⬇️ Réduire de 100 → 10
     duration: 5,            // ⬇️ Réduire de 15s → 5s
     pipelining: 1,          // Garder 1 (pas de pipeline)
     maxConnectionRequests: 10, // ✅ Limiter req/connection
     maxOverallRequests: 100    // ✅ Limiter total
   });
   ```

---

## 🎯 ACTION IMMÉDIATE RECOMMANDÉE

**Je vous propose:**

### **Test Safe en 3 Étapes (10 minutes total)**

1. **Test Local Sandbox** (5 min)
   - Stress test sur localhost:3000
   - Mesure gain réel avec indexes
   - 0 risque Cloudflare

2. **Test Production Léger** (3 min)
   - 10 requêtes séquentielles (2s pause)
   - Mesure latence réelle production
   - Très faible risque

3. **Documentation** (2 min)
   - Comparer v2.9.13 vs v2.9.14
   - Calculer gain réel (%)
   - Documenter résultats

**Puis**: Monitoring passif 48h pour validation finale

---

## 📋 DÉCISION

**Voulez-vous que je lance:**

**Option 1**: Test Local Safe (5 min, 0 risque) ✅ **RECOMMANDÉ**
- Stress test localhost:3000
- Mesure gain avec indexes
- Puis 10 req production séquentielles

**Option 2**: Monitoring Passif Seulement (48h, 0 risque) ✅ **ULTRA-SAFE**
- Cloudflare Analytics
- Feedback users
- Validation organique

**Option 3**: Attendre et ne rien faire ⏸️
- Laisser production tourner
- Optimisations déjà déployées
- Gain estimé -40% à -60% suffit

---

**Votre choix ?** 🤔

**Mon avis**: **Option 1** (Test Local + 10 req prod) est le meilleur compromis entre:
- ✅ Validation gain réel
- ✅ Risque minimal
- ✅ Rapide (10 min)

Qu'en pensez-vous ?
