# 🤖 TODO: Chatbot DeepSeek pour Support Utilisateurs

## 📋 Objectif
Créer un chatbot IA pour aider les utilisateurs de l'application de maintenance

## 🌟 Technologie Choisie: DeepSeek V3
- **API:** https://api.deepseek.com/v1/chat/completions
- **Modèle:** deepseek-chat
- **Coût:** ~$0.27 par million de tokens (ultra économique)
- **Qualité:** Comparable GPT-4, excellent en français
- **Compatible:** OpenAI SDK format

## 🎯 Fonctionnalités Proposées

### Version Simple (30-45 min)
- [ ] Widget chat flottant bas droite
- [ ] Questions/réponses sur l'application
- [ ] Contexte: Comment utiliser tickets, messagerie, etc.
- [ ] Stockage clé API dans Cloudflare Secret

### Version Complète (1-2h)
- [ ] Historique conversations dans D1
- [ ] Contexte enrichi (statistiques, état système)
- [ ] Suggestions intelligentes basées sur rôle utilisateur
- [ ] Bouton aide contextuel sur chaque page

### Version Avancée (2-3h)
- [ ] Accès lecture données (tickets, machines)
- [ ] Actions possibles (créer ticket guidé)
- [ ] Intégration avec notifications
- [ ] Analytics conversations

## 📝 Cas d'Usage
- "Comment créer un ticket?"
- "Qu'est-ce qu'un ticket planifié?"
- "Comment assigner un ticket à l'équipe?"
- "Explique-moi les rôles utilisateurs"
- "Comment fonctionne la messagerie?"
- "Quelle est la différence entre EST et EDT?"

## 🔧 Architecture Technique

```
Frontend (React)
  ├─ ChatWidget.tsx (nouveau composant)
  └─ FloatingChatButton (icône bas droite)
       ↓
Backend API
  ├─ /api/chatbot/message (POST)
  ├─ /api/chatbot/history (GET)
  └─ routes/chatbot.ts (nouveau fichier)
       ↓
Cloudflare Secret
  └─ DEEPSEEK_API_KEY
       ↓
DeepSeek API
  └─ https://api.deepseek.com/v1/chat/completions
       ↓
Database D1
  └─ chat_conversations (nouvelle table)
     ├─ id
     ├─ user_id
     ├─ message
     ├─ response
     ├─ created_at
```

## 🔐 Configuration Requise

### 1. Obtenir Clé API DeepSeek
- Créer compte: https://platform.deepseek.com
- Générer API key
- Budget recommandé: $10-20 (dure longtemps!)

### 2. Configurer Cloudflare Secret
```bash
npx wrangler secret put DEEPSEEK_API_KEY
# Entrer la clé quand demandé
```

### 3. Créer Table D1 (Migration)
```sql
CREATE TABLE chat_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  model VARCHAR(50) DEFAULT 'deepseek-chat',
  tokens_used INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_chat_user_id ON chat_conversations(user_id);
CREATE INDEX idx_chat_created_at ON chat_conversations(created_at DESC);
```

## 💰 Estimation Coûts

**Usage mensuel estimé (100 utilisateurs):**
- 1000 questions/mois
- ~500 tokens/question (prompt + réponse)
- Total: 500,000 tokens/mois
- **Coût: ~$0.14/mois** 🎉

**Comparaison:**
- GPT-4: $15/mois
- Claude Sonnet: $1.50/mois
- DeepSeek: $0.14/mois ✅

## 📚 Contexte à Fournir au Bot

Le bot devra connaître:
1. Structure application (tickets, machines, users, messagerie)
2. Rôles utilisateurs (admin, supervisor, technician, operator)
3. Workflow tickets (received → diagnostic → in_progress → completed)
4. Fonctionnalités clés (planification, assignation, chronomètres)
5. Système messagerie (public/privé, audio)
6. Fuseaux horaires (EST/EDT, changement manuel)

## 🎨 Design Interface

**Widget Chat:**
- Position: Fixe bas droite
- Icône: 💬 ou 🤖
- Couleurs: Bleu IGP
- Animation: Pulse sur nouveau message
- Responsive: Plein écran mobile

**Interface:**
- Header: "Assistant IGP" + Fermer
- Zone messages: Scroll auto
- Input: Textarea + Bouton envoyer
- États: Typing indicator, erreurs

## ⚡ Optimisations

1. **Cache réponses communes** (FAQ)
2. **Rate limiting** (10 messages/min par user)
3. **Streaming responses** (affichage progressif)
4. **Fallback** si API down
5. **Analytics** conversations populaires

## 🚀 Déploiement

1. Développement local avec `--local` flag
2. Test avec vraie clé API
3. Validation réponses en français québécois
4. Deploy Cloudflare Pages
5. Monitoring coûts API

## 🔧 EXTENSION: Base de Connaissances Machines (RAG)

### 🎯 Objectif Supplémentaire
Le chatbot doit aider à réparer les machines en fournissant:
- Manuels d'utilisation et maintenance
- Procédures de réparation pas-à-pas
- Diagnostic guidé des problèmes
- Numéros de pièces et références
- Informations techniques spécifiques

### 📋 Architecture RAG (Retrieval-Augmented Generation)

```
User Question: "Comment réparer courroie CNC?"
       ↓
1. Identifier Machine (CNC Biesse Rover)
       ↓
2. Recherche Vectorielle dans machine_documentation
   - Manuels PDF indexés
   - Procédures communes
   - Historique tickets similaires
       ↓
3. Contexte enrichi → DeepSeek API
   - Prompt système + Documentation trouvée
   - Génération réponse personnalisée
       ↓
4. Réponse structurée à l'utilisateur
   - Procédure étape par étape
   - Références pièces
   - Liens vers manuels complets
```

### 🗄️ Nouvelles Tables D1

```sql
-- Documentation des machines
CREATE TABLE machine_documentation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_id INTEGER NOT NULL,
  doc_type VARCHAR(50) NOT NULL, -- 'manual', 'procedure', 'troubleshooting', 'parts', 'video'
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Texte complet indexé pour recherche
  file_url TEXT, -- Lien vers PDF/vidéo si applicable
  section VARCHAR(100), -- Section du manuel (ex: "7.3 Lubrification")
  tags TEXT, -- Mots-clés séparés par virgules: "courroie,vibration,bruit"
  language VARCHAR(10) DEFAULT 'fr',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (machine_id) REFERENCES machines(id)
);

-- Problèmes communs et solutions
CREATE TABLE common_issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_id INTEGER NOT NULL,
  symptom TEXT NOT NULL, -- "Bruit de grincement au démarrage"
  diagnosis TEXT NOT NULL, -- "Rail X mal lubrifié ou roulement usé"
  solution TEXT NOT NULL, -- Procédure complète de résolution
  parts_needed TEXT, -- "Graisse lithium ref: BR-GR-50, Roulement SKF 6206-2RS"
  tools_needed TEXT, -- "Clé Allen 8mm, Jauge tension courroie"
  difficulty VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard', 'expert'
  time_estimate INTEGER, -- Temps en minutes
  safety_warnings TEXT, -- Précautions de sécurité
  success_count INTEGER DEFAULT 0, -- Nombre de fois que cette solution a aidé
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (machine_id) REFERENCES machines(id)
);

-- Pièces détachées et références
CREATE TABLE machine_parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_id INTEGER NOT NULL,
  part_name TEXT NOT NULL,
  part_number TEXT NOT NULL,
  manufacturer VARCHAR(100),
  category VARCHAR(50), -- 'electrical', 'mechanical', 'hydraulic', 'pneumatic'
  description TEXT,
  supplier TEXT,
  price DECIMAL(10,2),
  stock_location TEXT, -- Emplacement dans l'inventaire
  last_ordered DATE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (machine_id) REFERENCES machines(id)
);

-- Index pour recherche rapide
CREATE INDEX idx_machine_doc_machine ON machine_documentation(machine_id);
CREATE INDEX idx_machine_doc_type ON machine_documentation(doc_type);
CREATE INDEX idx_machine_doc_tags ON machine_documentation(tags);
CREATE INDEX idx_common_issues_machine ON common_issues(machine_id);
CREATE INDEX idx_machine_parts_machine ON machine_parts(machine_id);
CREATE INDEX idx_machine_parts_number ON machine_parts(part_number);
```

### 📚 Structure Documentation par Machine

**Template à remplir pour chaque machine:**

```markdown
## Machine: [Nom] - [Type]
**Marque:** [Ex: Bavelloni]
**Modèle:** [Ex: Top 851-S]
**Année:** [Ex: 2015]
**Numéro série:** [Si applicable]

### 📄 Documentation Disponible
- [ ] Manuel d'utilisation (PDF)
- [ ] Guide maintenance préventive (PDF)
- [ ] Schémas électriques (PDF)
- [ ] Schémas hydrauliques/pneumatiques (PDF)
- [ ] Catalogue pièces détachées (PDF)
- [ ] Vidéos formation (liens YouTube/internes)

### ⚙️ Spécifications Techniques
- Puissance: [kW]
- Voltage: [V]
- Dimensions: [L x l x h]
- Poids: [kg]
- Capacité: [selon type]

### 🔧 Maintenance Préventive
**Quotidienne:**
- [ ] Vérification X
- [ ] Vérification Y

**Hebdomadaire:**
- [ ] Maintenance A
- [ ] Maintenance B

**Mensuelle:**
- [ ] Maintenance C

**Annuelle:**
- [ ] Révision complète

### 🚨 Problèmes Fréquents

#### Problème 1: [Symptôme]
**Diagnostic:** [Cause probable]
**Solution:**
1. Étape 1
2. Étape 2
3. Étape 3

**Pièces:** [Liste références]
**Outils:** [Liste outils]
**Temps:** [XX minutes]
**Difficulté:** [Facile/Moyen/Difficile]

### 📦 Pièces Critiques
| Pièce | Référence | Fournisseur | Prix | Stock |
|-------|-----------|-------------|------|-------|
| Courroie principale | BA-851-BELT-001 | Bavelloni | $120 | Magasin A3 |
| Roulement principal | SKF 6206-2RS | SKF | $45 | Magasin B2 |

### 📞 Contacts Support
- **Fabricant:** [Nom] - [Téléphone] - [Email]
- **Distributeur local:** [Nom] - [Téléphone]
- **Technicien spécialisé:** [Nom] - [Contact]

### 📝 Notes Internes
- Tips & tricks de l'équipe
- Modifications/adaptations faites
- Historique des réparations majeures
```

### 🤖 Exemples Interactions Bot avec RAG

#### Exemple 1: Recherche Procédure
```
User: "Comment changer la courroie de la polisseuse Bavelloni?"

Bot: 🔍 Recherche dans documentation Bavelloni Top 851-S...

🔧 REMPLACEMENT COURROIE - Bavelloni Top 851-S

⚠️ SÉCURITÉ: 
- Débrancher alimentation principale (disjoncteur D4)
- Verrouiller en position OFF
- Attendre 5 minutes (décharge condensateurs)

🛠️ Outils nécessaires:
• Clé Allen 8mm
• Clé à molette 19mm  
• Jauge tension courroie (BA-GAUGE-001)
• Gants de protection

📋 PROCÉDURE (30 min - Difficulté: Moyenne):

1️⃣ Retrait carter protection
   - Dévisser 4 vis M6 (face avant)
   - Soulever délicatement le carter

2️⃣ Desserrage moteur
   - Localiser boulons tension (gauche moteur)
   - Desserrer 2 boulons de 13mm
   - Pousser moteur vers courroie

3️⃣ Retrait ancienne courroie
   - Faire glisser hors des poulies
   - Inspecter poulies (usure/fissures)

4️⃣ Installation nouvelle courroie
   - Pièce: BA-851-BELT-001 ($120)
   - Stock: Magasin A3, étagère 2
   - Positionner sur poulie moteur puis poulie entraînée

5️⃣ Tension courroie
   - Tirer moteur jusqu'à tension
   - Mesure: 50-60 Hz avec jauge
   - Serrer boulons à 25 Nm

6️⃣ Vérification
   - Test rotation manuelle (doit tourner librement)
   - Réinstaller carter (4 vis)
   - Rebrancher alimentation
   - Test à vide 2 minutes

📄 Référence: Manuel maintenance section 6.4, page 67
📎 [Télécharger schéma courroie PDF]
📹 [Voir vidéo tutoriel] (si disponible)

✅ Voulez-vous que je crée un ticket de suivi pour cette maintenance?
```

#### Exemple 2: Diagnostic Guidé
```
User: "La CNC fait un bruit bizarre"

Bot: 🔍 Diagnostic - CNC Biesse Rover

Je vais vous aider à identifier le problème.

🎵 Type de bruit:
1️⃣ Grincement (friction métallique)
2️⃣ Claquement (chocs répétés)
3️⃣ Sifflement (air/fluide)
4️⃣ Vibration excessive
5️⃣ Autre

Sélectionnez le numéro correspondant:

[User répond: 1]

Bot: 🔧 GRINCEMENT - Causes probables:

Basé sur l'historique des tickets CNC:
• 67% - Rail X/Y mal lubrifié ⭐ PLUS FRÉQUENT
• 22% - Roulement broche usé
• 11% - Courroie mal tendue

📋 DIAGNOSTIC ÉTAPE PAR ÉTAPE:

Étape 1: Localisation
Où se produit le bruit?
1️⃣ Lors déplacement X/Y (rails)
2️⃣ Rotation broche (tête)
3️⃣ Zone moteurs (arrière machine)

[User continue le diagnostic guidé...]

Bot: ✅ DIAGNOSTIC: Rail Y mal lubrifié

📖 SOLUTION (Manuel section 7.3):
1. Nettoyer rail Y (dégraissant)
2. Appliquer graisse lithium BR-GR-50
3. Cycles lubrification: 10 A/R lents
4. Vérifier patins guidage (usure)

🎫 Je peux créer automatiquement:
• Ticket maintenance "Lubrification rail Y CNC"
• Assigné à: Équipe maintenance
• Priorité: Moyenne
• Pièces: BR-GR-50 (stock: Magasin C1)

Créer le ticket?
```

#### Exemple 3: Recherche Pièce
```
User: "Référence filtre hydraulique pour la CNC"

Bot: 🔍 Filtres hydrauliques - CNC Biesse Rover

📦 Pièces disponibles:

1️⃣ Filtre hydraulique principal
   • Référence: BR-FH-050
   • Fournisseur: Biesse Parts
   • Prix: $45 CAD
   • Stock: 2 unités (Magasin D2)
   • Changement: Tous les 6 mois
   • Dernier changement: 2024-08-15

2️⃣ Filtre hydraulique retour
   • Référence: BR-FH-025
   • Fournisseur: Biesse Parts
   • Prix: $32 CAD
   • Stock: 3 unités (Magasin D2)
   • Changement: Tous les 12 mois

3️⃣ Cartouche filtre pompe
   • Référence: BR-FP-100
   • Fournisseur: Biesse Parts
   • Prix: $67 CAD
   • Stock: 0 unités ⚠️ À commander
   • Délai livraison: 2-3 semaines

📋 Procédure changement filtre principal:
📄 Manuel section 8.2, page 89
⏱️ Temps: 15 minutes

Besoin de la procédure complète?
```

### 📊 Phase de Déploiement

#### Phase 1: Préparation Documentation (1-2 semaines)
**Collecte d'information:**
- [ ] Identifier 3-5 machines prioritaires (plus de tickets)
- [ ] Rassembler manuels PDF existants
- [ ] Lister problèmes communs par machine
- [ ] Compiler notes internes équipe
- [ ] Photographier emplacements pièces

**Assistant lit et indexe:**
- [ ] Extraction texte des PDFs
- [ ] Identification sections importantes
- [ ] Création base vectorielle pour recherche sémantique
- [ ] Structuration en format base de données

#### Phase 2: Implémentation RAG (2-3h dev)
- [ ] Système recherche vectorielle
- [ ] Intégration avec DeepSeek
- [ ] Templates réponses structurées
- [ ] UI améliorée (images, schémas)

#### Phase 3: Enrichissement Continu
- [ ] Après chaque ticket résolu → Bot apprend
- [ ] Feedback utilisateurs (👍👎 sur réponses)
- [ ] Ajout nouvelles machines progressivement
- [ ] Mise à jour docs quand modifications

### 💰 Coûts Additionnels RAG

**Recherche vectorielle:**
- OpenAI Embeddings: $0.0001 per 1K tokens
- Ou utiliser embeddings locaux gratuits

**Exemple mensuel (100 users, avec RAG):**
- Questions: 1000/mois
- Recherche doc: +200 tokens/question
- Total tokens: 700,000/mois
- **Coût DeepSeek: ~$0.19/mois** 
- **Coût embeddings: ~$0.03/mois**
- **TOTAL: ~$0.22/mois** 🎉

### 🎯 Machines Prioritaires à Documenter

**À remplir par utilisateur:**
1. [ ] Machine #1: _________________ (Type: _______)
2. [ ] Machine #2: _________________ (Type: _______)
3. [ ] Machine #3: _________________ (Type: _______)
4. [ ] Machine #4: _________________ (Type: _______)
5. [ ] Machine #5: _________________ (Type: _______)

**Pour chaque machine, fournir:**
- Marque/Modèle exact
- Manuels PDF (si disponibles)
- Top 5 problèmes fréquents
- Pièces critiques avec références
- Notes/tricks de l'équipe

### 📞 Prochaines Étapes RAG

**Quand prêt pour cette extension:**
1. Fournir clé API DeepSeek
2. Lister 3-5 machines prioritaires
3. Partager manuels PDF (je les lis)
4. 2-3h développement RAG
5. 1-2 semaines remplissage données
6. Tests et ajustements
7. Déploiement progressif

**Temps total:** 
- Dev: 2-3h
- Préparation docs: 2-3h par machine
- Formation équipe: 1h

---

## 📞 Contact Quand Prêt

Dire à l'assistant:
- "Je veux implémenter le chatbot DeepSeek maintenant"
- Fournir clé API
- Choisir version (simple/complète/avancée/+RAG)
- Temps estimé: 30 min - 3h selon version (+ temps préparation docs pour RAG)

---

**Date création:** 2025-11-11
**Dernière mise à jour:** 2025-11-11
**Status:** 📝 Planifié - En attente clé API DeepSeek + Documentation machines
**Priorité:** Moyenne (Base) / Haute (avec RAG pour maintenance)
