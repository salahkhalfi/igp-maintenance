# 🏭 Rôles Typiques pour Industrie de Fabrication de Verre

**Contexte**: IGP Glass (Produits Verriers International) - Fabrication industrielle de verre  
**Type d'application**: Système de gestion de maintenance et réparations d'équipements

---

## 🎯 Rôles Actuels (4 rôles système)

| Rôle | Niveau | Utilisateurs Typiques | Permissions Actuelles |
|------|--------|----------------------|----------------------|
| **Admin** | Direction | Directeur TI, CEO | Accès complet, gestion rôles |
| **Supervisor** | Supervision | Chef maintenance, Contremaître | Gestion complète sauf rôles |
| **Technician** | Exécution | Techniciens maintenance, Mécaniciens | Gestion tickets + lecture |
| **Operator** | Opération | Opérateurs machines, Production | Tickets propres uniquement |

---

## 🏭 Rôles Recommandés pour Industrie Verre

### Hiérarchie Typique dans Usine de Verre

```
DIRECTION (Stratégique)
├── Directeur Général / CEO
├── Directeur Technique
└── Directeur Production

MANAGEMENT (Tactique)  
├── Gestionnaire Maintenance
├── Coordonnateur Maintenance
├── Superviseur Production
└── Contremaître d'Équipe

TECHNIQUE (Opérationnel)
├── Technicien Maintenance Senior
├── Technicien Maintenance
├── Électricien Industriel
├── Mécanicien Industriel
└── Technicien Instruments & Contrôles

PRODUCTION (Exécution)
├── Opérateur Four (Spécialisé)
├── Opérateur Production
├── Préposé Qualité
└── Aide-Opérateur

SUPPORT (Transversal)
├── Planificateur Maintenance
├── Magasinier (Pièces)
├── Agent Santé & Sécurité
└── Consultant Externe
```

---

## 📋 Rôles Recommandés par Catégorie

### 🔴 DIRECTION (Accès Stratégique)

#### 1. **Directeur Général / CEO**
**Profil**: Président, Directeur Général  
**Besoins**:
- Vue d'ensemble des opérations
- Indicateurs de performance (KPI)
- Validation budgets maintenance importants
- Accès rapports exécutifs

**Permissions suggérées**:
- Lecture complète (tous tickets, machines, rapports)
- Approbation tickets critiques (>50K$)
- Gestion utilisateurs (délégation)
- Pas de création/modification directe

**Mapping actuel**: → `admin` (trop de permissions) ou nouveau rôle `director`

---

#### 2. **Directeur Technique**
**Profil**: VP Opérations, Directeur Usine  
**Besoins**:
- Gestion complète maintenance
- Planification stratégique équipements
- Budget maintenance annuel
- Supervision équipes techniques

**Permissions suggérées**:
- Gestion complète tickets/machines
- Création/modification utilisateurs techniques
- Accès rapports avancés
- Validation achats équipements

**Mapping actuel**: → `admin` ou `supervisor` (proche mais manque accès budgétaire)

---

### 🟡 MANAGEMENT (Accès Tactique)

#### 3. **Gestionnaire Maintenance / Maintenance Manager**
**Profil**: Chef maintenance, Responsable maintenance  
**Besoins**:
- Coordination équipes techniques
- Planification maintenance préventive
- Gestion inventaire pièces
- Suivi performance équipements

**Permissions suggérées**:
- Gestion complète tickets (création, assignation, clôture)
- Modification machines (statut, priorité)
- Gestion équipe (techniciens, opérateurs)
- Accès rapports maintenance

**Mapping actuel**: → `supervisor` ✅ (bon match)

---

#### 4. **Coordonnateur Maintenance / Maintenance Coordinator**
**Profil**: Planificateur, Coordonnateur travaux  
**Besoins**:
- Planification hebdomadaire/mensuelle
- Coordination arrêts machines
- Suivi commandes pièces
- Interface production-maintenance

**Permissions suggérées**:
- Création/modification tickets planifiés
- Lecture tous tickets (coordination)
- Commentaires tickets (communication)
- Modification priorités

**Mapping actuel**: → Entre `supervisor` et `technician` → **NOUVEAU RÔLE NÉCESSAIRE**

---

#### 5. **Superviseur Production**
**Profil**: Contremaître, Chef d'équipe production  
**Besoins**:
- Signalement pannes machines
- Suivi statut réparations urgentes
- Communication avec maintenance
- Pas de gestion technique directe

**Permissions suggérées**:
- Création tickets (signalement pannes)
- Lecture tickets (suivi équipe)
- Commentaires (urgences)
- Pas de modification techniques

**Mapping actuel**: → Entre `operator` et `technician` → **NOUVEAU RÔLE NÉCESSAIRE**

---

### 🔵 TECHNIQUE (Accès Opérationnel)

#### 6. **Technicien Maintenance Senior / Lead Technician**
**Profil**: Technicien principal, Technicien spécialisé  
**Besoins**:
- Gestion tickets complexes
- Supervision juniors
- Diagnostic avancé
- Validation travaux

**Permissions suggérées**:
- Gestion tickets assignés + non-assignés
- Modification machines (diagnostic)
- Assignation tickets à juniors
- Clôture tous tickets techniques

**Mapping actuel**: → `technician` (proche mais manque supervision) → **EXTENSION NÉCESSAIRE**

---

#### 7. **Technicien Maintenance / Maintenance Technician**
**Profil**: Mécanicien, Électricien, Technicien généraliste  
**Besoins**:
- Exécution tickets assignés
- Mise à jour statut travaux
- Demandes pièces
- Rapports interventions

**Permissions suggérées**:
- Modification tickets propres
- Lecture tickets équipe (context)
- Commentaires/photos
- Demandes pièces

**Mapping actuel**: → `technician` ✅ (bon match actuel)

---

#### 8. **Électricien Industriel / Electrician**
**Profil**: Électricien maintenance, Technicien électrique  
**Besoins**:
- Tickets électriques uniquement
- Isolation électrique (lockout)
- Diagnostics instruments
- Conformité électrique

**Permissions suggérées**:
- Tickets catégorie "Électrique" seulement
- Modification machines (statut électrique)
- Lecture autres catégories (context)
- Pas d'accès mécanique

**Mapping actuel**: → `technician` (trop large) → **FILTRAGE PAR CATÉGORIE NÉCESSAIRE**

---

#### 9. **Mécanicien Industriel / Mechanic**
**Profil**: Mécanicien maintenance, Technicien mécanique  
**Besoins**:
- Tickets mécaniques uniquement
- Entretien équipements rotatifs
- Alignement, graissage
- Réparations mécaniques

**Permissions suggérées**:
- Tickets catégorie "Mécanique" seulement
- Modification machines (statut mécanique)
- Lecture autres catégories (context)
- Pas d'accès électrique

**Mapping actuel**: → `technician` (trop large) → **FILTRAGE PAR CATÉGORIE NÉCESSAIRE**

---

### 🟢 PRODUCTION (Accès Exécution)

#### 10. **Opérateur Four / Furnace Operator**
**Profil**: Opérateur four à verre (équipement critique)  
**Besoins**:
- Signalement anomalies four (critique)
- Suivi réparations four (priorité)
- Pas d'autres équipements
- Communication urgente maintenance

**Permissions suggérées**:
- Création tickets four uniquement (priorité haute auto)
- Lecture tickets four
- Commentaires urgents
- Notification temps réel

**Mapping actuel**: → `operator` (trop limité pour criticité four) → **NOUVEAU RÔLE NÉCESSAIRE**

---

#### 11. **Opérateur Production / Production Operator**
**Profil**: Opérateur machines, Production générale  
**Besoins**:
- Signalement pannes équipe
- Suivi tickets propres
- Lecture seule autres tickets
- Pas de modification

**Permissions suggérées**:
- Création tickets équipe
- Lecture tickets propres
- Commentaires basiques
- Pas de modification

**Mapping actuel**: → `operator` ✅ (bon match)

---

#### 12. **Préposé Qualité / Quality Inspector**
**Profil**: Inspecteur qualité, Contrôleur  
**Besoins**:
- Signalement défauts équipements
- Traçabilité problèmes qualité
- Lecture historique machines
- Pas d'intervention technique

**Permissions suggérées**:
- Création tickets qualité (catégorie spéciale)
- Lecture tous tickets (traçabilité)
- Pas de modification
- Rapports qualité

**Mapping actuel**: → `operator` (manque accès lecture globale) → **NOUVEAU RÔLE NÉCESSAIRE**

---

### 🟣 SUPPORT (Accès Transversal)

#### 13. **Planificateur Maintenance / Maintenance Planner**
**Profil**: Planificateur travaux, Scheduleur  
**Besoins**:
- Vue globale calendrier
- Planification arrêts machines
- Coordination ressources
- Pas d'exécution technique

**Permissions suggérées**:
- Lecture tous tickets (planification)
- Modification dates/priorités
- Assignation techniciens
- Création tickets planifiés

**Mapping actuel**: → Entre `supervisor` et `technician` → **NOUVEAU RÔLE NÉCESSAIRE**

---

#### 14. **Magasinier / Storekeeper**
**Profil**: Responsable pièces, Inventaire  
**Besoins**:
- Lecture tickets (demandes pièces)
- Suivi consommation pièces
- Pas de création tickets
- Commentaires disponibilité

**Permissions suggérées**:
- Lecture tous tickets (besoins pièces)
- Commentaires (disponibilité/délais)
- Pas de création/modification
- Accès inventaire (futur module)

**Mapping actuel**: → Aucun rôle approprié → **NOUVEAU RÔLE NÉCESSAIRE**

---

#### 15. **Agent Santé & Sécurité / Safety Officer**
**Profil**: Responsable SST, Agent sécurité  
**Besoins**:
- Création tickets sécurité (priorité)
- Lecture tous tickets (risques)
- Blocage machines dangereuses
- Rapports incidents

**Permissions suggérées**:
- Création tickets sécurité (priorité forcée haute)
- Lecture complète (audit sécurité)
- Blocage machines (statut "Dangereux")
- Rapports SST

**Mapping actuel**: → `supervisor` (trop large) ou nouveau rôle `safety_officer`

---

#### 16. **Consultant Externe / External Contractor**
**Profil**: Technicien fournisseur, Consultant spécialisé  
**Besoins**:
- Accès tickets spécifiques uniquement
- Pas d'accès données sensibles
- Lecture équipements assignés
- Durée limitée (temporaire)

**Permissions suggérées**:
- Lecture tickets assignés seulement
- Modification tickets propres
- Pas d'accès utilisateurs/rôles
- Expiration compte automatique

**Mapping actuel**: → `technician` (trop d'accès) → **NOUVEAU RÔLE + RESTRICTIONS NÉCESSAIRE**

---

#### 17. **Lecture Seule / Read-Only Viewer**
**Profil**: Auditeur, Stagiaire, Consultant observateur  
**Besoins**:
- Vue complète en lecture seule
- Aucune modification
- Aucune création
- Rapports/exports

**Permissions suggérées**:
- Lecture complète (tous tickets, machines, utilisateurs)
- Aucune modification
- Aucune création
- Exports rapports

**Mapping actuel**: → Aucun rôle → **NOUVEAU RÔLE NÉCESSAIRE**

---

## 📊 Matrice Comparaison: Actuel vs Recommandé

| Besoin Métier | Rôle Actuel | Adequation | Rôle Recommandé |
|---------------|-------------|------------|-----------------|
| Président/CEO | admin | ⚠️ Trop permissif | `director` ou `executive` |
| Directeur Technique | admin | ⚠️ Trop permissif | `technical_director` |
| Chef Maintenance | supervisor | ✅ Bon | `supervisor` (garder) |
| Coordonnateur | - | ❌ Manquant | `coordinator` (nouveau) |
| Chef Équipe Production | - | ❌ Manquant | `team_leader` (nouveau) |
| Technicien Senior | technician | ⚠️ Manque supervision | `senior_technician` (nouveau) |
| Technicien | technician | ✅ Bon | `technician` (garder) |
| Électricien | technician | ⚠️ Trop large | `electrician` (filtré) |
| Mécanicien | technician | ⚠️ Trop large | `mechanic` (filtré) |
| Opérateur Four | operator | ⚠️ Manque criticité | `furnace_operator` (nouveau) |
| Opérateur | operator | ✅ Bon | `operator` (garder) |
| Inspecteur Qualité | - | ❌ Manquant | `quality_inspector` (nouveau) |
| Planificateur | - | ❌ Manquant | `planner` (nouveau) |
| Magasinier | - | ❌ Manquant | `storekeeper` (nouveau) |
| Agent SST | supervisor | ⚠️ Trop large | `safety_officer` (nouveau) |
| Consultant | technician | ⚠️ Trop d'accès | `contractor` (nouveau) |
| Lecture Seule | - | ❌ Manquant | `viewer` (nouveau) |

---

## 🎯 Recommandations Prioritaires

### Phase 1: Rôles Critiques (3 nouveaux rôles)

#### 1. **coordinator** (Coordonnateur Maintenance) 🔴
**Justification**: Manque critique - besoin quotidien de planification  
**Permissions**: Entre supervisor et technician  
**Impact**: Améliore coordination équipes

#### 2. **planner** (Planificateur Maintenance) 🔴
**Justification**: Rôle spécialisé essentiel en maintenance  
**Permissions**: Lecture globale + modification planning  
**Impact**: Optimisation arrêts machines

#### 3. **viewer** (Lecture Seule) 🟡
**Justification**: Auditeurs, stagiaires, consultants  
**Permissions**: Lecture complète, aucune modification  
**Impact**: Transparence et formation

---

### Phase 2: Rôles Spécialisés (4 nouveaux rôles)

#### 4. **senior_technician** (Technicien Senior)
**Justification**: Reconnaissance expertise + supervision  
**Permissions**: technician + assignation tickets  
**Impact**: Meilleure organisation équipes

#### 5. **team_leader** (Chef Équipe Production)
**Justification**: Interface production-maintenance  
**Permissions**: operator + lecture globale  
**Impact**: Communication améliorée

#### 6. **safety_officer** (Agent Sécurité)
**Justification**: Priorité sécurité + conformité  
**Permissions**: Création prioritaire + blocage machines  
**Impact**: Amélioration SST

#### 7. **storekeeper** (Magasinier)
**Justification**: Gestion inventaire pièces  
**Permissions**: Lecture tickets + commentaires  
**Impact**: Meilleure disponibilité pièces

---

### Phase 3: Rôles Avancés (3 nouveaux rôles)

#### 8. **director** (Direction Exécutive)
**Justification**: Accès stratégique sans risque modification  
**Permissions**: Lecture complète + approbations  
**Impact**: Visibilité direction

#### 9. **quality_inspector** (Inspecteur Qualité)
**Justification**: Traçabilité qualité-maintenance  
**Permissions**: Lecture complète + création tickets qualité  
**Impact**: Amélioration qualité

#### 10. **contractor** (Consultant Externe)
**Justification**: Sécurité données avec externes  
**Permissions**: Accès restreint + temporaire  
**Impact**: Sécurité renforcée

---

## 📐 Matrice Permissions Recommandée

| Rôle | Tickets Create | Tickets Read | Tickets Update | Tickets Delete | Machines Update | Users Manage |
|------|:--------------:|:------------:|:--------------:|:--------------:|:---------------:|:------------:|
| **director** | ❌ | ✅ All | ⚠️ Approbations | ❌ | ❌ | ⚠️ View only |
| **supervisor** | ✅ | ✅ All | ✅ All | ✅ All | ✅ | ✅ Non-admin |
| **coordinator** | ✅ | ✅ All | ✅ Planning | ❌ | ⚠️ Status only | ❌ |
| **planner** | ✅ Scheduled | ✅ All | ✅ Dates/Priority | ❌ | ❌ | ❌ |
| **senior_technician** | ✅ | ✅ Team | ✅ Team | ⚠️ Own | ⚠️ Status | ❌ |
| **technician** | ✅ | ✅ Team | ✅ Own | ⚠️ Own | ⚠️ Status | ❌ |
| **team_leader** | ✅ | ✅ Team | ⚠️ Own | ❌ | ❌ | ❌ |
| **operator** | ✅ | ✅ Own | ⚠️ Own | ❌ | ❌ | ❌ |
| **safety_officer** | ✅ Priority | ✅ All | ⚠️ Safety | ❌ | ⚠️ Block | ❌ |
| **quality_inspector** | ✅ Quality | ✅ All | ❌ | ❌ | ❌ | ❌ |
| **storekeeper** | ❌ | ✅ All | ❌ | ❌ | ❌ | ❌ |
| **viewer** | ❌ | ✅ All | ❌ | ❌ | ❌ | ❌ |
| **contractor** | ⚠️ Assigned | ⚠️ Assigned | ⚠️ Assigned | ❌ | ❌ | ❌ |

**Légende**: ✅ Complet | ⚠️ Partiel/Conditionnel | ❌ Aucun

---

## 🚀 Plan d'Implémentation Recommandé

### Étape 1: Finaliser Phase 1 Protection (COMPLÉTÉE ✅)
- ✅ Blocage création rôles
- ✅ Infrastructure RBAC frontend
- ✅ Documentation complète

### Étape 2: Migration Frontend (2-3 semaines)
- Remplacer 63 vérifications hardcodées
- Utiliser hooks usePermission()
- Tests avec rôles existants

### Étape 3: Déblocage + Rôles Phase 1 (1 semaine)
- Retirer blocage création rôles
- Créer: coordinator, planner, viewer
- Tests approfondis

### Étape 4: Rôles Phase 2 (2 semaines)
- Créer 4 rôles spécialisés
- Tests utilisateurs réels
- Formation équipes

### Étape 5: Rôles Phase 3 (1 semaine)
- Créer 3 rôles avancés
- Documentation utilisateur finale
- Déploiement production

**Durée totale estimée**: 6-7 semaines

---

## 💡 Recommandations Spécifiques IGP Glass

### Priorités Court Terme (1 mois)
1. **coordinator** - Besoin immédiat coordination maintenance
2. **planner** - Optimisation planification arrêts
3. **viewer** - Transparence audits/stagiaires

### Priorités Moyen Terme (2-3 mois)
4. **senior_technician** - Reconnaissance expertise
5. **team_leader** - Interface production-maintenance
6. **safety_officer** - Conformité SST

### Optionnel Long Terme (6+ mois)
7. Rôles spécialisés par métier (électricien, mécanicien)
8. Rôles direction (director, executive)
9. Rôles externes (contractor, vendor)

---

## 📚 Ressources Additionnelles

### Standards Industrie
- NFPA 70E (Sécurité électrique)
- ISO 55000 (Gestion d'actifs)
- OSHA 1910 (Sécurité machines)
- CMMS Best Practices

### Documentation Interne
- `ROLE_SYSTEM_SAFETY_ANALYSIS.md` - Analyse technique
- `ROLE_MIGRATION_GUIDE.md` - Guide implémentation
- `REPONSE_FINALE_UTILISATEUR.md` - État actuel

---

**Conclusion**: Votre application gagnerait **10 nouveaux rôles** pour couvrir tous les besoins typiques d'une usine de fabrication de verre moderne.

**Prochaine étape**: Valider les 3 rôles Phase 1 avec votre équipe, puis planifier migration frontend.
