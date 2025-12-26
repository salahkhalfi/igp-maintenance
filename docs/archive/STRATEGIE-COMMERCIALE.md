# 🚀 STRATÉGIE COMMERCIALE - PMEAPP.COM

**Document stratégique pour la planification et l'implémentation du SaaS multi-tenant**

---

## 📋 TABLE DES MATIÈRES

1. [Vision et Positionnement](#vision-et-positionnement)
2. [Analyse de Marché](#analyse-de-marché)
3. [Stratégie Produit](#stratégie-produit)
4. [Architecture Technique](#architecture-technique)
5. [Modèles d'Affaires](#modèles-daffaires)
6. [Plan de Développement](#plan-de-développement)
7. [Marketing et Acquisition](#marketing-et-acquisition)
8. [Métriques de Succès](#métriques-de-succès)
9. [Architecture Subdomains](#architecture-subdomains)

---

## 🎯 VISION ET POSITIONNEMENT

### Proposition de Valeur Unique

**PME App** - GMAO/CMMS moderne pour PME manufacturières et industrielles québécoises

**Différenciateurs clés:**
1. ✅ **Interface moderne Kanban** - Visualisation intuitive vs interfaces vieillissantes des concurrents
2. ✅ **Messagerie audio intégrée** - Communication contextuelle directement dans les tickets (UNIQUE)
3. ✅ **PWA + Push Notifications** - Application mobile sans app store, notifications en temps réel
4. ✅ **Prix compétitif** - 40-70% moins cher que concurrents établis
5. ✅ **White-label** - Personnalisation complète (logo, titre, sous-titre)
6. ✅ **Propriété du code** - Déploiement on-premise possible pour clients avec besoins spéciaux
7. ✅ **Support local** - Support en français, compréhension contexte PME québécoises
8. ✅ **Déploiement rapide** - Edge computing Cloudflare = performance mondiale instantanée

### Marché Cible

**Segment primaire:**
- PME manufacturières (10-100 employés)
- Secteurs: transformation métal, plastique, bois, agroalimentaire
- Géographie: Québec (expansion Ontario/Maritimes après validation)

**Persona utilisateur:**
- Directeur maintenance / Superviseur production
- Budget maintenance: $50k-500k/année
- Équipe maintenance: 2-10 techniciens
- Pain points: équipements critiques, downtime coûteux, traçabilité compliance

**Besoins spécifiques PME:**
- Solution abordable (budgets limités vs grandes entreprises)
- Déploiement rapide (pas de ressources TI dédiées)
- Interface intuitive (formation minimale requise)
- Support réactif (pas de contrats enterprise complexes)

---

## 📊 ANALYSE DE MARCHÉ

### Concurrents Directs

#### 1. Fiix (Rockwell Automation)
- **Pricing:** $45-75 USD/user/month
- **Forces:** Intégrations nombreuses, analytics avancés, brand recognition
- **Faiblesses:** Interface complexe, pricing élevé pour PME, support enterprise-focused
- **Part de marché:** Leader PME/mid-market Amérique du Nord

#### 2. UpKeep
- **Pricing:** $20-75 USD/user/month (tiers multiples)
- **Forces:** Mobile-first, UX moderne, adoption rapide
- **Faiblesses:** Features parfois superficielles, support limité en français
- **Part de marché:** Croissance rapide, focus SMB

#### 3. Hippo CMMS
- **Pricing:** $35-70 USD/user/month
- **Forces:** Flexible, customizable, good support
- **Faiblesses:** Interface datée, onboarding lent
- **Part de marché:** Stable, clientèle fidèle

#### 4. Limble CMMS
- **Pricing:** $25-80 USD/user/month
- **Forces:** Ease of use, good mobile app
- **Faiblesses:** Features avancées limitées
- **Part de marché:** Growing SMB segment

### Analyse Comparative - PME App

| Critère | PME App | Fiix | UpKeep | Hippo | Limble |
|---------|---------|------|--------|-------|--------|
| **Prix/user/mois (CAD)** | $15-25 | $60-100 | $25-100 | $45-95 | $30-110 |
| **Interface moderne** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Mobile/PWA** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Audio messaging** | ⭐⭐⭐⭐⭐ | ❌ | ❌ | ❌ | ❌ |
| **Kanban workflow** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Support français** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐ |
| **Déploiement rapide** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **White-label** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐ |
| **Intégrations** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Analytics/Reporting** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

**Avantages compétitifs:**
- Prix 40-70% inférieur
- Features uniques (audio messaging, Kanban moderne)
- Support local français premium
- White-label avancé (rare à ce prix)
- Déploiement edge = performance globale

**Gaps à combler:**
- Intégrations tierces (priorité post-lancement)
- Analytics avancés (suffisants pour PME actuellement)
- Brand recognition (marketing requis)

### Taille de Marché

**Québec:**
- ~8,000 PME manufacturières (10-100 employés)
- Taux adoption GMAO: ~15-20%
- Marché adressable: 1,200-1,600 PME
- Revenus potentiels: $3.6M-8M CAD/année (à 10% penetration)

**Canada:**
- ~30,000 PME manufacturières
- Marché adressable: 4,500-6,000 PME
- Revenus potentiels: $13.5M-30M CAD/année (à 10% penetration)

---

## 🛠️ STRATÉGIE PRODUIT

### Phase 1: Validation Marché (6-12 mois) - EN COURS

**Objectif:** Valider product-market fit avec IGP Glass comme client pilote

**Actions:**
- ✅ Déploiement production IGP (app.igpglass.ca)
- 🔄 Collecte feedback utilisateurs quotidien
- 🔄 Tracking analytics usage features
- 🔄 Identification features critiques vs nice-to-have
- 🔄 Tests charge et stabilité réelle
- ⏳ Documentation pain points et requests

**Métriques de validation:**
- Utilisation quotidienne >80% équipe maintenance
- Réduction temps traitement tickets >30%
- Satisfaction utilisateurs >8/10
- Bugs critiques <2/mois après 3 mois
- Temps réponse <500ms 95% requêtes

**Décision go/no-go commercialisation:**
- ✅ Si IGP adoption strong + ROI démontrable → Fork commercial
- ❌ Si adoption faible ou issues majeures → Re-design nécessaire

### Phase 2: Fork Commercial (Après validation IGP)

**Objectif:** Créer version SaaS propre, refactorée, multi-tenant

**Actions techniques:**
1. **Refactoring architecture** (165-230 heures)
   - Découper index.tsx monolithique (9,685 lignes → modules <500 lignes)
   - Optimiser bundle (787 KB → <400 KB)
   - Implémenter architecture modulaire propre
   - Tests automatisés (unit + integration + e2e)
   - Documentation technique complète

2. **Multi-tenancy foundation**
   - Migration schema DB avec tenant_id partout
   - Subdomain routing (client1.pmeapp.com)
   - Isolation données complète par tenant
   - Admin portal gestion tenants
   - Onboarding automatisé nouveaux clients

3. **White-label avancé**
   - Système thèmes (couleurs, fonts)
   - Custom CSS par tenant (optionnel)
   - Email templates personnalisés
   - Domain personnalisé par client (client.com → CNAME)

4. **Features commerciales**
   - Billing/invoicing automatique (Stripe)
   - Self-service signup + trial 14 jours
   - Tiers pricing avec limits features
   - Usage analytics per tenant
   - Support ticketing system

**Timeline:** 4-6 mois développement à temps plein

**Budget:** $50k-75k (si développeur externe) ou sweat equity si Salah

### Phase 3: Lancement Commercial (Post-fork)

**Objectif:** Acquérir 10 premiers clients payants

**Actions:**
1. **Landing page www.pmeapp.com**
   - Hero section avec value prop claire
   - Démo interactive ou vidéo
   - Pricing transparent
   - Testimonial IGP Glass
   - CTA: "Essai gratuit 14 jours"

2. **Marketing contenu**
   - Blog: "GMAO pour PME québécoises"
   - Études de cas: ROI IGP Glass
   - Guides: "Implanter GMAO en 30 jours"
   - Webinaires mensuels

3. **Outreach direct**
   - LinkedIn targeting directeurs maintenance
   - Email campaigns PME manufacturières
   - Partenariats associations industrielles Québec
   - Trade shows (ex: STIQ, FCCQ)

4. **Stratégie pricing launch**
   - Early adopters: 50% off année 1
   - Referral program: 1 mois gratuit par référence
   - Money-back guarantee 30 jours

**Objectif ventes année 1:**
- 10-15 clients actifs
- MRR: $5k-10k CAD
- CAC recovery: <12 mois
- Churn: <10%

### Roadmap Features Post-Launch

**Q1 (0-3 mois):**
- Intégrations email (notifications avancées)
- Mobile app native iOS/Android (optionnel si PWA suffit)
- Rapports PDF customisables
- Import/export données bulk

**Q2 (3-6 mois):**
- API publique + webhooks
- Intégrations comptabilité (QuickBooks, Sage)
- Planning maintenance préventive avancé
- Dashboard analytics directeur maintenance

**Q3 (6-9 mois):**
- Intégrations IoT sensors (température, vibration)
- Prédictive maintenance (ML basique)
- Multi-sites management
- Conformité ISO 55000 / OSHA

**Q4 (9-12 mois):**
- Marketplace intégrations tierces
- White-label reseller program
- Enterprise features (SSO, RBAC avancé)
- Expansion internationale (traduction EN)

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Stack Actuel (Version IGP)

**Frontend:**
- React via Hono JSX
- TailwindCSS
- Vanilla JavaScript pour interactivité

**Backend:**
- Hono framework (edge runtime)
- TypeScript
- Cloudflare Workers/Pages

**Database:**
- Cloudflare D1 (SQLite distribué)
- 23 migrations existantes
- Schema mature avec 15+ tables

**Storage:**
- Cloudflare R2 (audio messages, attachments)

**Limitations actuelles:**
- ⚠️ Monolithe 9,685 lignes (index.tsx)
- ⚠️ Bundle 787 KB (proche limite 1 MB Workers)
- ⚠️ Pas de tests automatisés
- ⚠️ Documentation technique limitée

### Architecture Cible (Version Commerciale)

**Principes:**
- ✅ Modulaire: <500 lignes par fichier
- ✅ Testable: 80%+ code coverage
- ✅ Scalable: Multi-tenant sans refactor
- ✅ Maintenable: Documentation inline + externe
- ✅ Performant: <300ms p95 response time

**Structure proposée:**
```
maintenance-saas/
├── src/
│   ├── index.tsx                 # Entry point (<200 lignes)
│   ├── middleware/
│   │   ├── tenant.ts             # Tenant resolution & isolation
│   │   ├── auth.ts               # JWT validation
│   │   └── rbac.ts               # Role-based access control
│   ├── routes/
│   │   ├── api/
│   │   │   ├── work-orders.ts    # CRUD work orders
│   │   │   ├── assets.ts         # CRUD assets
│   │   │   ├── users.ts          # User management
│   │   │   ├── tickets.ts        # Ticketing system
│   │   │   └── analytics.ts      # Usage metrics
│   │   ├── admin/
│   │   │   ├── tenants.ts        # Tenant management
│   │   │   ├── billing.ts        # Stripe integration
│   │   │   └── support.ts        # Support portal
│   │   └── public/
│   │       ├── landing.tsx       # Marketing site
│   │       ├── signup.tsx        # Self-service signup
│   │       └── docs.tsx          # Public documentation
│   ├── models/
│   │   ├── work-order.ts         # Business logic
│   │   ├── asset.ts
│   │   ├── user.ts
│   │   └── tenant.ts
│   ├── services/
│   │   ├── db.ts                 # Database utilities
│   │   ├── storage.ts            # R2 storage utilities
│   │   ├── email.ts              # Email service
│   │   ├── billing.ts            # Stripe wrapper
│   │   └── analytics.ts          # Tracking service
│   ├── utils/
│   │   ├── validation.ts         # Input validation
│   │   ├── sanitization.ts       # XSS prevention
│   │   └── date.ts               # Date helpers
│   └── types/
│       ├── bindings.d.ts         # Cloudflare bindings
│       ├── models.d.ts           # Data models
│       └── api.d.ts              # API contracts
├── tests/
│   ├── unit/                     # Jest unit tests
│   ├── integration/              # API integration tests
│   └── e2e/                      # Playwright e2e tests
├── migrations/
│   └── [timestamp]_*.sql         # D1 migrations
├── public/
│   └── static/                   # Static assets
├── docs/
│   ├── API.md                    # API documentation
│   ├── DEPLOYMENT.md             # Deployment guide
│   └── ARCHITECTURE.md           # Technical architecture
├── wrangler.jsonc                # Cloudflare config
├── package.json
└── README.md
```

**Database Schema Multi-tenant:**
```sql
-- Tenants master table
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  subdomain TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  app_title TEXT,
  app_subtitle TEXT,
  plan TEXT NOT NULL, -- 'starter', 'professional', 'enterprise'
  status TEXT NOT NULL, -- 'trial', 'active', 'suspended', 'cancelled'
  trial_ends_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  settings JSON -- white-label config
);

-- User-Tenant mapping (many-to-many)
CREATE TABLE users_tenants (
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, tenant_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Exemple table avec tenant isolation
CREATE TABLE work_orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL, -- ← CRITIQUE
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  assigned_to TEXT,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Index performance critique
CREATE INDEX idx_work_orders_tenant ON work_orders(tenant_id);
CREATE INDEX idx_work_orders_status ON work_orders(tenant_id, status);
CREATE INDEX idx_work_orders_assigned ON work_orders(tenant_id, assigned_to);
```

**Pattern Middleware Tenant Isolation:**
```typescript
// src/middleware/tenant.ts
export async function tenantMiddleware(c: Context, next: Next) {
  const host = c.req.header('host') || '';
  const subdomain = host.split('.')[0];
  
  // Skip tenant resolution for www/marketing site
  if (subdomain === 'www' || subdomain === 'pmeapp') {
    return await next();
  }
  
  // Lookup tenant
  const tenant = await c.env.DB.prepare(
    'SELECT * FROM tenants WHERE subdomain = ? AND status IN (?, ?)'
  ).bind(subdomain, 'trial', 'active').first();
  
  if (!tenant) {
    return c.json({ error: 'Tenant not found or suspended' }, 404);
  }
  
  // Inject tenant in context for all downstream handlers
  c.set('tenant', tenant);
  
  await next();
}

// Usage in routes
app.get('/api/work-orders', async (c) => {
  const tenant = c.get('tenant'); // Always available
  
  const orders = await c.env.DB.prepare(
    'SELECT * FROM work_orders WHERE tenant_id = ? ORDER BY created_at DESC'
  ).bind(tenant.id).all();
  
  return c.json(orders);
});
```

### Infrastructure Cloudflare

**Services utilisés:**
- **Pages** - Frontend + API déploiement
- **Workers** - Edge runtime pour API
- **D1** - Database SQLite distribué
- **R2** - Object storage
- **Email Routing** - Emails professionnels gratuits
- **Analytics** - Usage tracking
- **Access** (futur) - Enterprise SSO

**Limites à considérer:**
- 10ms CPU time/request (free plan) → 30ms (paid)
- 1 MB Worker bundle size max
- 25 MB D1 database max (free) → 10 GB (paid)
- 100k reads/day D1 (free) → unlimited (paid)

**Plan requis commercial:**
- **Workers Paid** ($5/month + usage) - CPU time 30ms, pas de daily limits
- **R2** ($0.015/GB/month storage) - Scaling automatique
- **D1** - Free tier suffit jusqu'à ~20-30 tenants, puis paid plan

**Coût infrastructure estimé:**
```
0-10 tenants:   $5-15/mois
10-50 tenants:  $15-50/mois
50-100 tenants: $50-150/mois
100-500 tenants: $150-500/mois
```

---

## 💰 MODÈLES D'AFFAIRES

### Stratégie Pricing

**Philosophie:**
- Prix simple et transparent
- Value-based pricing (vs cost-plus)
- Compétitif vs marché (40-60% moins cher)
- Self-service avec option support premium

### Option 1: Per-User Pricing (RECOMMANDÉ)

**Tiers:**

#### 🚀 Starter - $15 CAD/user/mois
*Parfait pour petites équipes maintenance (2-5 personnes)*

**Features:**
- ✅ Gestion bons de travail (work orders) illimités
- ✅ Gestion actifs/équipements (max 50 assets)
- ✅ Kanban drag-and-drop
- ✅ Messagerie audio intégrée
- ✅ PWA + Push notifications
- ✅ 3 rôles utilisateurs (Admin, Technicien, Superviseur)
- ✅ Rapports basiques
- ✅ 5 GB storage R2
- ✅ Support email (48h response)
- ✅ White-label (logo + titre)

**Limites:**
- Max 50 assets
- Max 10 users
- 5 GB storage
- Pas d'API access
- Support email uniquement

**Target:** PME 10-30 employés, équipe maintenance 2-5 personnes

#### 💼 Professional - $25 CAD/user/mois
*Pour équipes maintenance moyennes (5-20 personnes)*

**Everything in Starter, plus:**
- ✅ Assets illimités
- ✅ Users illimités
- ✅ 14 rôles RBAC complets
- ✅ Maintenance préventive + calendrier
- ✅ Rapports avancés + exports PDF
- ✅ 50 GB storage R2
- ✅ API access + webhooks
- ✅ Support prioritaire (24h response)
- ✅ White-label avancé (CSS custom)
- ✅ Intégrations email
- ✅ Multi-sites support

**Limites:**
- 50 GB storage
- Standard SLA

**Target:** PME 30-100 employés, équipe maintenance 5-20 personnes

#### 🏢 Enterprise - Prix personnalisé (Sur demande)
*Pour grandes organisations avec besoins spécifiques*

**Everything in Professional, plus:**
- ✅ Storage illimité R2
- ✅ SLA 99.9% uptime
- ✅ Support dédié (4h response)
- ✅ Onboarding personnalisé
- ✅ Training sessions équipe
- ✅ Custom domain (client.com)
- ✅ SSO / SAML integration
- ✅ Audit logs avancés
- ✅ Déploiement on-premise (option)
- ✅ Features custom sur demande
- ✅ Account manager dédié

**Target:** Grandes PME/corporations 100+ employés, multi-sites

### Option 2: Flat-Rate Pricing

**Alternative si complexité per-user trop grande:**

| Plan | Prix/mois | Users | Assets | Storage |
|------|-----------|-------|--------|---------|
| Small | $199 | Max 10 | Max 100 | 10 GB |
| Medium | $399 | Max 25 | Illimités | 50 GB |
| Large | $799 | Max 50 | Illimités | 100 GB |
| Enterprise | Custom | Illimités | Illimités | Illimité |

**Pros flat-rate:**
- Plus simple expliquer/vendre
- Prévisibilité budgétaire client
- Moins de friction expansion équipe

**Cons flat-rate:**
- Moins scalable revenus
- Clients "game" le système (max out users)

### Comparaison ROI Client

**Scénario PME typique:**
- 5 techniciens maintenance
- 50 équipements critiques
- Coût downtime: $500-2000/heure
- Fréquence downtime actuel: 4-8h/mois

**Coûts annuels solutions:**
- **Fiix:** 5 users × $60 USD/mois = $300 USD × 12 = $3,600 USD = ~$4,900 CAD/année
- **UpKeep:** 5 users × $35 USD/mois = $175 USD × 12 = $2,100 USD = ~$2,850 CAD/année
- **PME App Professional:** 5 users × $25 CAD/mois = $125 CAD × 12 = **$1,500 CAD/année**

**ROI PME App (conservative estimates):**
- Réduction downtime: 20% (0.8-1.6h/mois économisées)
- Économies annuelles: $4,800-19,200 CAD
- Coût solution: $1,500 CAD
- **ROI net: $3,300-17,700 CAD/année**
- **Payback period: <1 mois**

### Stratégies Acquisition

#### 1. Freemium (Non recommandé)
**Raisons:**
- Coût serveurs même si free (D1/R2 queries)
- Support burden élevé pour non-payants
- Conversion freemium→paid typiquement <5%
- Distraction focus vs paying customers

#### 2. Trial 14 jours (RECOMMANDÉ)
**Pourquoi:**
- Qualification leads automatique (self-service)
- Pas de carte crédit requise = friction basse
- 14 jours suffisants tester valeur
- Auto-conversion ou suivi ventes facile

**Implémentation:**
- Signup → statut 'trial' dans DB
- Email automation J+7: "Besoin d'aide?"
- Email automation J+12: "2 jours restants"
- J+14: Downgrade vers read-only ou suspension

#### 3. Money-Back Guarantee 30 jours
**Pourquoi:**
- Réduit friction achat (risque perçu zéro)
- Taux refund réels typiquement <5%
- Signal qualité et confiance produit

#### 4. Referral Program
**Mécanique:**
- Client réfère nouveau client
- Récompense: 1 mois gratuit pour les deux
- Code promo unique par client

**Math:**
- CAC typique: $500-1000
- LTV client: $1,500-3,000/année
- Referral cost: $150 (1 mois gratuit)
- Net CAC savings: $350-850 par référence

---

## 📈 PLAN DE DÉVELOPPEMENT

### Timeline Globale

**Phase 0: Validation IGP (6-12 mois) - EN COURS**
- Nov 2024 - Mai 2025: Usage quotidien IGP
- Collecte feedback continu
- Tracking métriques utilisation
- Documentation bugs et requests
- Stabilisation features critiques

**Go/No-Go Decision: Mai 2025**

**Phase 1: Refactoring & Fork (4-6 mois)**
- Juin - Août 2025: Refactoring architecture
- Sept - Oct 2025: Multi-tenancy implementation
- Nov 2025: Features commerciales (billing, signup)
- Déc 2025: Tests + documentation

**Phase 2: Pre-Launch (2-3 mois)**
- Jan 2026: Landing page + marketing site
- Fév 2026: Beta testeurs (3-5 clients pilotes)
- Mars 2026: Ajustements feedback beta

**Phase 3: Launch (3 mois)**
- Avril 2026: Launch public officiel
- Avril-Juin 2026: Push acquisition premiers 10 clients
- Objectif: 10-15 clients paying fin Q2 2026

**Phase 4: Growth (12 mois)**
- Q3 2026: 25-30 clients
- Q4 2026: 40-50 clients
- Q1 2027: 60-75 clients
- Q2 2027: 80-100 clients

### Milestones Techniques Critiques

#### Milestone 1: Refactoring Complete
**Deadline:** Août 2025

**Critères de succès:**
- [ ] index.tsx <500 lignes
- [ ] Bundle <400 KB
- [ ] Tous modules <500 lignes
- [ ] Test coverage >80%
- [ ] Documentation API complète
- [ ] Performance <300ms p95

#### Milestone 2: Multi-Tenancy Live
**Deadline:** Octobre 2025

**Critères de succès:**
- [ ] 5 tenants de test déployés
- [ ] Isolation données 100% validée
- [ ] Subdomain routing fonctionnel
- [ ] Admin portal opérationnel
- [ ] Billing Stripe intégré
- [ ] Tests load 100 concurrent users

#### Milestone 3: Beta Launch
**Deadline:** Mars 2026

**Critères de succès:**
- [ ] 3-5 beta clients actifs
- [ ] Feedback sessions complétées
- [ ] Landing page live
- [ ] Pricing finalisé
- [ ] Legal docs (TOS, Privacy) prêts
- [ ] Support process défini

#### Milestone 4: Public Launch
**Deadline:** Avril 2026

**Critères de succès:**
- [ ] 10+ signups première semaine
- [ ] Conversion trial→paid >20%
- [ ] Churn <10%
- [ ] NPS >40
- [ ] Support response <24h
- [ ] Uptime >99.5%

### Ressources Requises

#### Développement
**Option A: Salah solo (sweat equity)**
- Temps requis: 20-30h/semaine pendant 12 mois
- Coût opportunité: $0 cash, mais temps = $60k-80k valeur
- Timeline: Plus long mais contrôle total

**Option B: Salah + 1 développeur freelance**
- Développeur mid-level: $50-75/heure
- 500 heures refactoring/features: $25k-37.5k
- Timeline: Plus rapide, mais gestion required

**Option C: Salah + agence développement**
- Forfait complet: $75k-150k
- Timeline: Plus rapide, mais moins de contrôle

**Recommandation:** Option A pour Phase 1 (refactoring), Option B pour Phase 2-3 si besoin accélérer

#### Marketing
**Budget année 1 (conservateur):**
- Landing page design: $2k-5k (one-time)
- Contenu marketing: $1k-2k/mois (blog, SEO)
- Ads paid (LinkedIn, Google): $1k-3k/mois
- Trade shows: $5k-10k/année
- Branding (logo, materials): $3k-5k (one-time)

**Total année 1:** $20k-40k marketing

#### Legal & Admin
- Constitution entreprise: $500-1k
- Avocat TOS/Privacy: $2k-5k
- Comptabilité/taxes: $2k-4k/année
- Assurances: $2k-3k/année

**Total année 1:** $6.5k-13k

#### Infrastructure
- Cloudflare Workers Paid: $15-50/mois
- Domain + email: $100/année
- Tools SaaS (analytics, support, etc.): $100-300/mois

**Total année 1:** $1.5k-4k

### Budget Total Lancement

**Scénario conservateur (Salah solo dev):**
- Développement: $0 cash (sweat equity)
- Marketing: $20k
- Legal/Admin: $6.5k
- Infrastructure: $1.5k
- **Total: $28k**

**Scénario accéléré (Salah + freelance):**
- Développement: $30k
- Marketing: $30k
- Legal/Admin: $10k
- Infrastructure: $3k
- **Total: $73k**

### Financement Options

**Option 1: Bootstrapped (RECOMMANDÉ)**
- Pas de dilution ownership
- Croissance organique
- Pression profits immédiate
- Contrôle total décisions

**Option 2: Pré-ventes / Crowdfunding**
- 10 early adopters × $500 (50% off année 1)
- Raise $5k pré-lancement
- Validation marché + cash
- Commitment clients early

**Option 3: Grant gouvernemental Québec**
- Programme ESSOR (PME): $25k-50k
- PARI-CNRC: $500k-1M (si tech innovante)
- Mitacs (si partenariat académique)
- Non-dilutif, mais paperwork lourd

**Option 4: Angel investor / VC**
- Raise $100k-500k
- Dilution 10-25%
- Accélération croissance
- Pression exit/returns

**Recommandation:** Bootstrapped Phase 1-2, puis évaluer growth capital Phase 3 si traction forte

---

## 📣 MARKETING ET ACQUISITION

### Positionnement Message

**Headline:** 
*"GMAO moderne pour PME québécoises - 40% moins cher que les géants"*

**Sous-headline:**
*"Réduisez votre downtime avec une interface Kanban intuitive, messagerie audio intégrée, et support local en français. Essai gratuit 14 jours."*

**Value Props (3 colonnes landing page):**

1. **💰 Prix Accessible**
   - 40-70% moins cher que Fiix/UpKeep
   - Pricing transparent, sans surprises
   - ROI <1 mois garanti

2. **⚡ Déploiement Rapide**
   - Setup en <1 jour
   - Formation minimale requise
   - Interface moderne intuitive

3. **🇨🇦 Support Local**
   - Support en français
   - Compréhension contexte PME québécoises
   - Réponse <24h

### Canaux Acquisition

#### 1. Content Marketing + SEO (Coût: bas, Timeline: long)

**Blog topics prioritaires:**
- "GMAO pour PME: Guide complet 2026"
- "Réduire downtime équipements: 10 stratégies"
- "GMAO vs Excel: Pourquoi upgrader?"
- "Maintenance préventive: ROI calculé"
- "Conformité ISO 55000 pour PME"

**SEO keywords cibles:**
- "gmao québec"
- "logiciel maintenance pme"
- "cmms français canada"
- "gestion maintenance québec"
- "maintenance préventive logiciel"

**Timeline:** 6-12 mois pour traction organique

#### 2. LinkedIn Outreach (Coût: moyen, Timeline: court)

**Target personas:**
- Directeur maintenance
- Superviseur production
- Propriétaire PME manufacturière
- VP opérations

**Stratégie:**
- Posts réguliers (2-3×/semaine) avec tips maintenance
- InMail campaigns ciblés (20-50/semaine)
- LinkedIn Ads ($500-1k/mois budget)
- Engagement groupes LinkedIn (ex: "Maintenance Québec")

**Conversion funnel:**
- LinkedIn profile → Landing page → Trial signup
- Expected conversion: 2-5%

#### 3. Google Ads (Coût: élevé, Timeline: immédiat)

**Campaigns:**
- Search: "logiciel gmao", "cmms canada"
- Display: Retargeting visitors landing page
- Budget: $1k-2k/mois

**Economics:**
- CPC estimé: $3-8
- Conversion rate: 3-7%
- CAC: $100-300

**ROI:** Positif si LTV >$1,500 (12 mois rétention)

#### 4. Partnerships & Affiliates (Coût: variable, Timeline: moyen)

**Partners potentiels:**
- Consultants maintenance industrielle
- Fournisseurs équipements (distributeurs)
- Associations PME (FCCQ, MEQ)
- Intégrateurs ERP (ex: Sage, QuickBooks revendeurs)

**Deal structure:**
- 20% recurring commission sur clients référés
- Co-branding materials fournis
- Lead sharing bidirectionnel

#### 5. Trade Shows & Events (Coût: élevé, Timeline: long)

**Events cibles:**
- STIQ (Société des Techniques Industrielles du Québec)
- FCCQ events
- Salon de l'Industrie Manufacturière
- Congrès Manufacturiers Innovants

**Coût booth:** $3k-8k/event

**ROI:** 5-15 leads qualifiés par event, conversion 20-40%

#### 6. Referral Program (Coût: bas, Timeline: moyen)

**Mécanique:**
- Client réfère → 1 mois gratuit pour les deux
- Badge "Client Fondateur" sur profil
- Featured case study si accepte

**Viral coefficient cible:** 0.3-0.5 (chaque client amène 0.3-0.5 nouveaux clients)

### Landing Page Structure

**Hero Section:**
- Headline + sous-headline
- CTA primaire: "Essai gratuit 14 jours"
- Visuel: Screenshot interface Kanban ou vidéo démo
- Social proof: "Utilisé par IGP Glass et [X] PME québécoises"

**Section 2: Problème/Solution**
- Pain points PME (downtime coûteux, Excel inefficace, solutions trop chères)
- Solution PME App (visuel avant/après)

**Section 3: Features clés (6 blocs)**
- Kanban drag-and-drop
- Messagerie audio
- PWA mobile
- RBAC 14 rôles
- White-label
- Support français

**Section 4: Pricing**
- 3 tiers avec features comparées
- CTA: "Commencer essai gratuit"

**Section 5: Social Proof**
- Testimonial IGP Glass avec photo
- Logos clients (quand disponibles)
- Stats: "X heures downtime économisées"

**Section 6: FAQ**
- "Combien de temps setup?"
- "Quelle formation requise?"
- "Données sécurisées?"
- "Annulation possible?"

**Section 7: CTA Final**
- "Prêt à réduire votre downtime?"
- CTA: "Essai gratuit 14 jours"
- Reassurance: "Sans carte de crédit • Annulation anytime"

### Email Marketing Sequences

**Sequence 1: Trial Onboarding**
- J+0: "Bienvenue! Voici comment démarrer" (getting started guide)
- J+3: "Astuce: Créez votre premier bon de travail en 2 minutes" (feature highlight)
- J+7: "Besoin d'aide? Réservez une démo 1-on-1" (support offer)
- J+10: "Vous utilisez seulement 30% des features - découvrez le reste" (engagement boost)
- J+12: "Votre essai se termine dans 2 jours" (urgency)
- J+14: "Prêt à continuer? Voici votre offre spéciale" (conversion push)

**Sequence 2: Post-Signup Nurture**
- Semaine 1: "Quick wins: 3 façons d'économiser temps dès aujourd'hui"
- Semaine 2: "Étude de cas: Comment IGP a réduit downtime de 30%"
- Semaine 4: "Feature spotlight: Maintenance préventive"
- Semaine 8: "Atteignez-vous vos objectifs? Analysons ensemble"

**Sequence 3: Churn Prevention**
- Trigger: <2 logins/semaine pendant 2 semaines
- "On vous a perdu? Qu'est-ce qu'on peut améliorer?"
- Offre: Session support gratuite ou feature request prioritaire

### Métriques Marketing à Tracker

**Acquisition:**
- Visitors landing page/semaine
- Trial signups/semaine
- Conversion visitor→trial: objectif >3%
- Canaux top performers

**Activation:**
- % trials créant premier work order (objectif >80%)
- % trials invitant team members (objectif >60%)
- Time to first value (objectif <30 min)

**Conversion:**
- Trial→paid conversion rate (objectif >20%)
- Average time to convert (objectif <10 jours)
- CAC par canal

**Rétention:**
- Churn rate mensuel (objectif <5%)
- Churn reasons (survey automatique)
- NPS score (objectif >40)

**Revenue:**
- MRR (Monthly Recurring Revenue)
- ARPU (Average Revenue Per User)
- LTV (Lifetime Value)
- LTV:CAC ratio (objectif >3:1)

---

## 📊 MÉTRIQUES DE SUCCÈS

### North Star Metric

**Métrique principale: Active Maintenance Teams (AMT)**

Définition: Nombre de tenants avec ≥5 work orders créés dans les 30 derniers jours

Pourquoi: Indique usage réel + valeur délivrée (pas juste signups vanity)

**Objectifs:**
- Mois 1-3: 5-10 AMT
- Mois 4-6: 15-25 AMT
- Mois 7-9: 30-50 AMT
- Mois 10-12: 60-100 AMT

### OKRs (Objectives & Key Results)

#### Q1 2026: Foundation Launch

**Objective: Lancer produit commercial avec premiers clients payants**

**KRs:**
1. 15 trial signups
2. 10 paying customers (conversion >20%)
3. MRR $1,500 CAD
4. NPS >40
5. Churn <10%

#### Q2 2026: Product-Market Fit

**Objective: Valider product-market fit et optimiser acquisition**

**KRs:**
1. 40 active customers
2. MRR $5,000 CAD
3. LTV:CAC >3:1
4. Trial→paid conversion >25%
5. ≥2 customer referrals organic

#### Q3 2026: Scale Acquisition

**Objective: Scaler canaux acquisition prouvés**

**KRs:**
1. 75 active customers
2. MRR $10,000 CAD
3. CAC <$500
4. Churn <5%
5. 3+ canaux acquisition validés

#### Q4 2026: Sustainable Growth

**Objective: Croissance durable et profitable**

**KRs:**
1. 100+ active customers
2. MRR $15,000 CAD
3. Profitable (revenus > coûts opérationnels)
4. Team size: 2-3 personnes
5. Roadmap product Q1 2027 défini avec customer input

### Métriques Détaillées par Catégorie

#### Product Metrics

**Engagement:**
- DAU/MAU ratio (Daily/Monthly Active Users): objectif >30%
- Work orders created per tenant per month: objectif >20
- Features adoption rate: objectif >60% utilisant ≥5 features
- Session duration average: objectif >15 min
- Mobile (PWA) vs desktop usage split

**Quality:**
- Bugs reported per week: objectif <5
- P0/P1 bugs open: objectif <2
- Average time to resolve bug: objectif <48h
- API error rate: objectif <0.5%
- Page load time p95: objectif <500ms

#### Business Metrics

**Revenue:**
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- MRR growth rate month-over-month: objectif >15%
- ARPU (Average Revenue Per User): objectif $20-30 CAD
- Revenue per employee (si équipe): objectif >$100k

**Unit Economics:**
- CAC (Customer Acquisition Cost): objectif <$500
- LTV (Lifetime Value): objectif >$1,800
- LTV:CAC ratio: objectif >3:1
- Gross margin: objectif >85%
- Payback period: objectif <12 mois

**Customer Health:**
- NPS (Net Promoter Score): objectif >40
- CSAT (Customer Satisfaction): objectif >4.2/5
- Churn rate mensuel: objectif <5%
- Expansion revenue (upsells): objectif >10% MRR
- Support tickets per customer per month: objectif <2

#### Sales & Marketing Metrics

**Acquisition Funnel:**
- Landing page visitors/mois: objectif >500
- Visitor→trial conversion: objectif >3%
- Trial signups/mois: objectif >15
- Trial→paid conversion: objectif >20%
- Average trial duration: objectif 10-12 jours

**Channel Performance:**
- CAC by channel (SEO, LinkedIn, Google Ads, Referral)
- ROI by channel (ROAS)
- Top performing content (blog posts, landing pages)
- Email open rates: objectif >25%
- Email click-through rates: objectif >5%

### Dashboard & Reporting

**Weekly Dashboard (pour Salah):**
- MRR + growth
- New trials + paying customers
- Churn events
- Top 3 support issues
- Infrastructure costs

**Monthly Board Report (si investors/partenaires):**
- Financial summary (MRR, costs, runway)
- Customer metrics (acquisition, retention, NPS)
- Product progress (features shipped, roadmap)
- Team updates (hires, key decisions)
- Next month priorities

**Quarterly Business Review:**
- OKRs performance vs targets
- Strategic pivots si nécessaire
- Competitive landscape updates
- Customer interviews synthesis
- Financial projections update

---

## 🎯 DÉCISIONS STRATÉGIQUES IMMÉDIATES

### Decision 1: Timing Fork Commercial

**Options:**
1. **Attendre 12 mois validation IGP complète** (conservateur)
2. **Commencer fork après 6 mois si signaux positifs** (balanced)
3. **Fork immédiatement en parallèle IGP** (agressif)

**Recommandation: Option 2 - Fork à 6 mois si:**
- ✅ IGP utilise quotidiennement (>80% équipe)
- ✅ Aucun bug critique récurrent
- ✅ Feedback utilisateurs positif (NPS >40)
- ✅ Salah a temps disponible pour fork

**Rationale:** 6 mois suffisants pour valider core value, mais pas trop long pour perdre momentum marché

### Decision 2: Modèle Pricing

**Options:**
1. **Per-user pricing** (simple, scalable, prévisible)
2. **Flat-rate tiers** (friction basse, mais moins scalable)
3. **Hybrid** (flat base + per-user add-ons)

**Recommandation: Option 1 - Per-user ($15/$25/custom)**

**Rationale:**
- Marché habitué (Fiix, UpKeep, Limble tous per-user)
- Scaling naturel avec croissance client
- Calcul ROI facile pour prospects

### Decision 3: Go-to-Market Strategy

**Options:**
1. **Self-service 100%** (scalable, mais acquisition lente)
2. **Sales-assisted** (conversion haute, mais coûteux)
3. **Hybrid** (self-service + sales outbound ciblé)

**Recommandation: Option 3 - Hybrid**

**Rationale:**
- Trial self-service pour inbound leads (low-touch)
- Sales outreach ciblé pour prospects qualifiés >$3k deal size
- Équilibre scaling vs conversion rate

### Decision 4: Tech Stack Refactoring

**Options:**
1. **Refactor complet** (clean slate, mais 4-6 mois)
2. **Refactor incrémental** (moins de risque, mais dette technique persiste)
3. **Fork sans refactor** (rapide, mais dette technique copiée)

**Recommandation: Option 1 - Refactor complet**

**Rationale:**
- Dette technique actuelle (monolithe 9,685 lignes) non-viable commercial
- Fork = opportunité parfaite pour clean architecture
- Investment 4-6 mois amorti sur 5-10 ans vie produit

### Decision 5: Financement Initial

**Options:**
1. **Bootstrapped 100%** (pas de dilution, croissance organique)
2. **Grant gouvernemental** (non-dilutif, mais paperwork)
3. **Angel investor $100k-250k** (accélération, mais dilution 15-25%)

**Recommandation: Option 1 + Option 2**

**Rationale:**
- Bootstrapping Phase 1 force discipline financière + contrôle
- Grant gouvernemental (ex: ESSOR) = bonus non-dilutif si obtenu
- Réévaluer funding externe si traction forte Q3-Q4 2026

---

## ✅ ACTIONS IMMÉDIATES (Cette Semaine)

### Domaine & Infrastructure (2-3 heures)

1. **Protéger pmeapp.com**
   - [ ] Login registrar domaine
   - [ ] Activer DNSSEC
   - [ ] Activer auto-renewal (2+ ans)
   - [ ] Whois privacy ON
   - [ ] Verrouiller transfert domaine

2. **Setup DNS Cloudflare**
   - [ ] Ajouter domaine à Cloudflare
   - [ ] Configurer DNS records (A, CNAME www, CNAME *)
   - [ ] Activer SSL/TLS Full mode
   - [ ] Configurer Email Routing (contact@, support@)

3. **Custom Domain Cloudflare Pages**
   - [ ] `wrangler pages domain add pmeapp.com --project-name webapp`
   - [ ] `wrangler pages domain add www.pmeapp.com --project-name webapp`
   - [ ] Tester: https://pmeapp.com (devrait pointer vers app IGP temporairement)

### Documentation (1-2 heures)

4. **Sync salah.md dans Hub**
   - [ ] Vérifier version 1.0.2 présente dans GitHub
   - [ ] Re-sync fichier dans Genspark Hub
   - [ ] Test: Lire salah.md dans nouvelle session AI

5. **Créer STRATEGIE-COMMERCIALE.md** (CE FICHIER)
   - [ ] Commit dans Git
   - [ ] Push GitHub
   - [ ] Sync dans Hub aussi

### Validation IGP Continue (ongoing)

6. **Tracker métriques IGP**
   - [ ] Documenter utilisation quotidienne (qui, quoi, quand)
   - [ ] Noter bugs reportés vs features requests
   - [ ] Feedback sessions informels mensuels équipe maintenance

---

## 📝 NOTES FINALES

### Ce Document N'Est PAS

- ❌ Business plan formel pour investisseurs
- ❌ Documentation technique exhaustive
- ❌ Plan marketing détaillé avec budgets exacts
- ❌ Contrat ou commitment légal

### Ce Document EST

- ✅ Guide stratégique pour planification commerciale
- ✅ Synthesis recherche marché + competitive analysis
- ✅ Roadmap flexible avec décisions clés
- ✅ Base discussion Salah + futurs partenaires/advisors
- ✅ Référence pour AI assistants futurs (memory Hub)

### Maintenance Document

- **Éditer ce fichier** quand décisions stratégiques changent
- **Versioning:** Ajouter section "Changelog" si updates majeurs
- **Review:** Réviser trimestriellement (ou après milestones)
- **Sync Hub:** Re-sync après éditions importantes

### Prochaines Étapes

**Court terme (1-3 mois):**
1. Compléter actions immédiates ci-dessus
2. Continuer validation IGP
3. Documenter learnings dans ce fichier

**Moyen terme (3-6 mois):**
1. Go/No-Go decision fork commercial (basé sur IGP metrics)
2. Si GO: Démarrer refactoring architecture
3. Définir roadmap détaillé Phase 2

**Long terme (6-12 mois):**
1. Fork commercial opérationnel
2. Landing page + marketing lancé
3. Premiers 10 clients payants acquis

---

## 🌐 ARCHITECTURE SUBDOMAINS

### Recommandation Structure Complète

**Décision stratégique basée sur analyse SaaS leaders (Slack, Asana, ClickUp)**

#### Structure URLs Production

```
www.pmeapp.com              → Landing page marketing
pmeapp.com                  → Redirect vers www

app.pmeapp.com              → Portail login centralisé + workspace selector
{client}.pmeapp.com         → Application tenant spécifique

admin.pmeapp.com            → Super admin portal (gestion tous tenants)
support.pmeapp.com          → Documentation + FAQ + centre d'aide
status.pmeapp.com           → Status page uptime monitoring

api.pmeapp.com              → API publique (si exposée)
docs.pmeapp.com             → Documentation API pour développeurs
staging.pmeapp.com          → Environnement staging/testing
```

### Pourquoi `app.pmeapp.com` ? (RECOMMANDÉ)

**Pattern Login Centralisé vs Direct Subdomain:**

| Approche | Pattern | Pros | Cons |
|----------|---------|------|------|
| **Login Centralisé** | `app.pmeapp.com` → détecte tenant → redirect `{client}.pmeapp.com` | ✅ UX familière<br>✅ Multi-tenant users support<br>✅ Découverte automatique<br>✅ Onboarding simple | ⚠️ 1 redirect supplémentaire |
| **Direct Subdomain** | User va direct à `{client}.pmeapp.com/login` | ✅ 0 redirect<br>✅ URL courte | ❌ User doit mémoriser subdomain<br>❌ Multi-tenant users compliqué<br>❌ Onboarding confus |

**Recommandation: Login Centralisé** (utilisé par 80% des SaaS modernes)

### Flow Utilisateur Optimal

```
1. User → www.pmeapp.com
2. Clique "Connexion" → app.pmeapp.com
3. Entre email → Système détecte tenant(s) automatiquement
4. Si 1 tenant → Redirect igpglass.pmeapp.com/dashboard
5. Si 2+ tenants → Selector "Choisir espace: IGP Glass, Acme Corp..."
```

### Architecture Routing Code

```typescript
// app.pmeapp.com/login - Portail centralisé
app.post('/login', async (c) => {
  const { email, password } = await c.req.json();
  
  // Authenticate user
  const user = await authenticateUser(email, password);
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }
  
  // Find user's tenant(s)
  const userTenants = await c.env.DB.prepare(`
    SELECT t.subdomain, t.name, t.logo_url, ut.role
    FROM users_tenants ut
    JOIN tenants t ON t.id = ut.tenant_id
    WHERE ut.user_id = ?
    AND t.status IN ('trial', 'active')
    ORDER BY t.name
  `).bind(user.id).all();
  
  if (userTenants.results.length === 0) {
    return c.json({ error: 'No active workspace found' }, 404);
  }
  
  if (userTenants.results.length === 1) {
    // Single tenant → direct redirect
    const tenant = userTenants.results[0];
    const token = generateJWT(user, tenant);
    
    return c.json({ 
      redirect: `https://${tenant.subdomain}.pmeapp.com/dashboard`,
      token: token,
      tenant: tenant
    });
  }
  
  // Multiple tenants → show workspace selector
  return c.json({ 
    tenants: userTenants.results,
    message: 'Select your workspace'
  });
});

// {client}.pmeapp.com - Tenant-specific app
app.use('*', async (c, next) => {
  const host = c.req.header('host') || '';
  const subdomain = host.split('.')[0];
  
  // Skip tenant resolution for special subdomains
  if (['www', 'app', 'admin', 'support', 'status', 'api', 'docs', 'staging'].includes(subdomain)) {
    return await next();
  }
  
  // Lookup tenant by subdomain
  const tenant = await c.env.DB.prepare(
    'SELECT * FROM tenants WHERE subdomain = ? AND status IN (?, ?)'
  ).bind(subdomain, 'trial', 'active').first();
  
  if (!tenant) {
    return c.html('<h1>Workspace not found</h1><p>Please contact support.</p>', 404);
  }
  
  // Inject tenant context for all downstream handlers
  c.set('tenant', tenant);
  
  await next();
});

// All API routes automatically scoped to tenant
app.get('/api/work-orders', async (c) => {
  const tenant = c.get('tenant'); // Always available
  
  const orders = await c.env.DB.prepare(
    'SELECT * FROM work_orders WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 50'
  ).bind(tenant.id).all();
  
  return c.json(orders);
});
```

### Session Management Cross-Subdomain

**JWT Token Strategy:**

```typescript
// Token structure
interface JWTPayload {
  user_id: string;
  tenant_id: string;
  role: string;
  exp: number; // Expiration timestamp
}

// Generate token (app.pmeapp.com)
function generateJWT(user: User, tenant: Tenant): string {
  const payload: JWTPayload = {
    user_id: user.id,
    tenant_id: tenant.id,
    role: user.role_in_tenant,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24h
  };
  
  return jwt.sign(payload, c.env.JWT_SECRET);
}

// Validate token (tenant.pmeapp.com)
app.use('/api/*', async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const decoded = await jwt.verify(token, c.env.JWT_SECRET);
    const tenant = c.get('tenant');
    
    // Verify token belongs to current tenant
    if (decoded.tenant_id !== tenant.id) {
      return c.json({ error: 'Invalid token for this workspace' }, 403);
    }
    
    c.set('user', decoded);
    await next();
  } catch (err) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
});
```

**Cookie Strategy (Alternative):**

```typescript
// Set cookie on app.pmeapp.com with domain=.pmeapp.com
setCookie(c, 'session_token', token, {
  domain: '.pmeapp.com',  // Accessible on all subdomains
  httpOnly: true,
  secure: true,
  sameSite: 'Lax',
  maxAge: 86400  // 24h
});
```

### DNS Configuration Complète

```dns
# Marketing
@               A       192.0.2.1                       Proxied
www             CNAME   webapp.pages.dev                Proxied

# Application
app             CNAME   webapp.pages.dev                Proxied
*               CNAME   webapp.pages.dev                Proxied  # Wildcard tenants

# Admin/Support
admin           CNAME   webapp.pages.dev                Proxied
support         CNAME   webapp.pages.dev                Proxied
status          CNAME   webapp.pages.dev                Proxied
docs            CNAME   webapp.pages.dev                Proxied
api             CNAME   webapp.pages.dev                Proxied
staging         CNAME   webapp-test.pages.dev           Proxied

# Email (Cloudflare Email Routing)
@               MX      route1.mx.cloudflare.net    10  DNS only
@               MX      route2.mx.cloudflare.net    20  DNS only
@               TXT     v=spf1 include:_spf.mx.cloudflare.net ~all
_dmarc          TXT     v=DMARC1; p=quarantine; rua=mailto:admin@pmeapp.com
```

### Wrangler Custom Domains Setup

```bash
# Add all subdomains to Cloudflare Pages
cd /home/user/webapp

# Marketing
npx wrangler pages domain add pmeapp.com --project-name webapp
npx wrangler pages domain add www.pmeapp.com --project-name webapp

# Application
npx wrangler pages domain add app.pmeapp.com --project-name webapp
# Note: Wildcard *.pmeapp.com handled by DNS CNAME * record

# Admin/Support
npx wrangler pages domain add admin.pmeapp.com --project-name webapp
npx wrangler pages domain add support.pmeapp.com --project-name webapp
npx wrangler pages domain add status.pmeapp.com --project-name webapp
npx wrangler pages domain add docs.pmeapp.com --project-name webapp
npx wrangler pages domain add api.pmeapp.com --project-name webapp

# Staging (optional - different project)
npx wrangler pages domain add staging.pmeapp.com --project-name webapp-test

# Verify
npx wrangler pages domain list --project-name webapp
```

### Exemples Concurrents SaaS

| SaaS | Structure | Pattern Utilisé |
|------|-----------|-----------------|
| **Slack** | `app.slack.com` → `{workspace}.slack.com` | Login centralisé ✅ |
| **Asana** | `app.asana.com` → Workspace selector | Login centralisé ✅ |
| **ClickUp** | `app.clickup.com` → Workspace selector | Login centralisé ✅ |
| **Notion** | `notion.so` → `{workspace}.notion.so` | Direct subdomain ⚠️ |
| **Monday** | `{company}.monday.com` | Direct subdomain ⚠️ |
| **Trello** | `trello.com` (board-based, pas subdomain) | Single domain |

**Tendance dominante 2024-2025:** Login centralisé avec `app.` = Meilleure UX

### Branding Examples par Client

**Client: IGP Glass**
```
URL:            igpglass.pmeapp.com
Logo:           Logo IGP Glass
Titre:          "IGP Maintenance"
Sous-titre:     "Système de gestion maintenance"
Email sender:   notifications@pmeapp.com
```

**Client: Acme Industries**
```
URL:            acme.pmeapp.com
Logo:           Logo Acme
Titre:          "Acme GMAO"
Sous-titre:     "Plateforme maintenance industrielle"
Email sender:   notifications@pmeapp.com
```

**Client: MetalFab Inc.**
```
URL:            metalfab.pmeapp.com
Logo:           Logo MetalFab
Titre:          "MetalFab Ops"
Sous-titre:     "Gestion opérations et maintenance"
Email sender:   notifications@pmeapp.com
```

### Email Templates Multi-Tenant

```typescript
// Email service avec branding tenant
async function sendEmail(tenant: Tenant, user: User, template: string, data: any) {
  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .header { 
          background: ${tenant.brand_color || '#3B82F6'}; 
          padding: 20px; 
          text-align: center; 
        }
        .logo { max-width: 150px; }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${tenant.logo_url}" alt="${tenant.name}" class="logo">
        <h1 style="color: white;">${tenant.app_title}</h1>
      </div>
      <div style="padding: 20px;">
        ${renderTemplate(template, data)}
      </div>
      <footer style="text-align: center; color: #666; padding: 20px;">
        <p>${tenant.name} - Propulsé par PME App</p>
        <p><a href="https://${tenant.subdomain}.pmeapp.com">Accéder à l'application</a></p>
      </footer>
    </body>
    </html>
  `;
  
  await sendEmailViaSMTP({
    from: 'notifications@pmeapp.com',
    replyTo: tenant.support_email || 'support@pmeapp.com',
    to: user.email,
    subject: data.subject,
    html: emailHTML
  });
}
```

### Checklist Implémentation

**Phase 1: Infrastructure (Semaine 1)**
- [ ] Acheter/configurer pmeapp.com
- [ ] Setup DNS Cloudflare (A, CNAME, MX, TXT records)
- [ ] Configurer Email Routing
- [ ] SSL wildcard actif
- [ ] Test: `dig app.pmeapp.com`, `dig igpglass.pmeapp.com`

**Phase 2: Code Base (Semaines 2-3)**
- [ ] Refactor routing: séparer app.pmeapp.com vs tenant subdomains
- [ ] Implémenter tenant middleware
- [ ] JWT token generation/validation
- [ ] Session management cross-subdomain
- [ ] Email templates avec branding tenant

**Phase 3: Testing (Semaine 4)**
- [ ] Créer 3 tenants test: test1, test2, test3
- [ ] Tester login centralisé app.pmeapp.com
- [ ] Tester tenant selector (user multi-tenant)
- [ ] Tester isolation données par tenant
- [ ] Tester branding (logo, couleurs, emails)

**Phase 4: Production (Semaine 5)**
- [ ] Migrer IGP vers igpglass.pmeapp.com
- [ ] Update DNS app.igpglass.ca → CNAME vers igpglass.pmeapp.com (ou redirect)
- [ ] Deploy admin.pmeapp.com portal
- [ ] Deploy support.pmeapp.com documentation
- [ ] Monitoring + alertes

### Notes Techniques Importantes

**Cloudflare Pages Wildcard Subdomains:**
- DNS `CNAME * → webapp.pages.dev` handle tous subdomains automatiquement
- Pas besoin ajouter chaque client individuellement dans wrangler
- Routing géré par code (tenant middleware)

**Limites Cloudflare Workers:**
- 1,000 subdomains custom max par projet Pages (largement suffisant)
- Wildcard SSL inclus gratuitement
- Latency subdomain routing: <5ms overhead

**SEO Considerations:**
- `www.pmeapp.com`: Indexé Google (marketing)
- `app.pmeapp.com`: noindex (application)
- `{client}.pmeapp.com`: noindex (données privées clients)
- `support.pmeapp.com`: Indexé (documentation publique)

### Rationale Décision Finale

**Pourquoi cette structure:**

1. **UX Optimale**: Pattern familier utilisateurs SaaS modernes
2. **Multi-tenant Support**: Users appartenant à plusieurs clients (consultants, freelances)
3. **Scalabilité**: 0 configuration par nouveau client (wildcard DNS)
4. **Sécurité**: Isolation complète données par subdomain
5. **SEO**: Séparation claire marketing (indexé) vs app (privé)
6. **Branding**: White-label parfait avec subdomain dédié
7. **Performance**: Edge routing Cloudflare = latency minimale

---

**Version:** 1.0.1  
**Créé:** 2025-11-23  
**Dernière MAJ:** 2025-11-23 (ajout section Architecture Subdomains)  
**Auteur:** Salah Khalfi + AI Assistant  
**Basé sur:** Conversations stratégiques multi-sessions + recherche marché  
**Statut:** ✅ Living Document - Éditer au besoin

**Pour questions ou discussions stratégiques:** Référer ce document en disant "lis stratégie commerciale"
