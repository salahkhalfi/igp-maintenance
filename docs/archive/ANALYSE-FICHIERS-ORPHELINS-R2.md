# 🔍 Analyse : Détection des Fichiers Orphelins R2

## 📅 Date
**2025-11-13**

## 🎯 Problématique

Après une restauration de backup DB, comment identifier les **fichiers orphelins** dans R2 ?

```
Définition: Fichier orphelin = Fichier dans R2 SANS référence dans DB
```

## 📊 Sources de Références Médias

### 1. **Table `machines`** (Logos)
```sql
SELECT logo_url 
FROM machines 
WHERE logo_url IS NOT NULL;
```
**Format**: `https://pub-xxx.r2.dev/maintenance-media/machine-{id}-{timestamp}.jpg`

### 2. **Table `tickets`** (Photos de problèmes)
```sql
SELECT photo_url 
FROM tickets 
WHERE photo_url IS NOT NULL;
```
**Format**: `https://pub-xxx.r2.dev/maintenance-media/ticket-{id}-{timestamp}.jpg`

### 3. **Table `messages`** (Pièces jointes)
```sql
SELECT attachment_url 
FROM messages 
WHERE attachment_url IS NOT NULL;
```
**Format**: `https://pub-xxx.r2.dev/maintenance-media/message-{id}-{timestamp}.{ext}`

### 4. **Table `system_settings`** (Logo entreprise)
```sql
SELECT setting_value 
FROM system_settings 
WHERE setting_key = 'company_logo';
```
**Format**: URL complète Cloudflare

---

## 🔄 Scénarios Temporels

### Scénario A : Média uploadé AVANT backup
```
09h00  BACKUP DB créé
       ├─ machines: logo_url="photo1.jpg"  ✅ Référencé
       └─ R2: photo1.jpg existe            ✅ Fichier présent

11h00  RESTORE backup 09h00
       
RÉSULTAT:
├─ DB: Référence "photo1.jpg"             ✅
└─ R2: Fichier "photo1.jpg" présent       ✅
   → PAS ORPHELIN
```

### Scénario B : Média uploadé APRÈS backup
```
09h00  BACKUP DB créé
       └─ machines: (aucune référence photo2.jpg)

09h30  User uploade photo2.jpg
       ├─ R2: photo2.jpg créé              ✅
       └─ DB: machines.logo_url="photo2.jpg" ✅

11h00  RESTORE backup 09h00
       
RÉSULTAT:
├─ DB: AUCUNE référence "photo2.jpg"      ❌
└─ R2: Fichier "photo2.jpg" présent       ✅
   → FICHIER ORPHELIN ⚠️
```

### Scénario C : Média supprimé APRÈS backup
```
09h00  BACKUP DB créé
       └─ machines: logo_url="photo3.jpg"  ✅

09h30  User supprime machine
       ├─ DB: Enregistrement supprimé      ❌
       └─ R2: photo3.jpg RESTE présent     ✅ (jamais supprimé)

11h00  RESTORE backup 09h00
       
RÉSULTAT:
├─ DB: Référence "photo3.jpg"             ✅
└─ R2: Fichier "photo3.jpg" présent       ✅
   → PAS ORPHELIN (référence restaurée)
```

---

## 🛠️ Solution : Endpoint d'Audit

### Nouvelle Route API

```typescript
// src/routes/admin.ts

app.get('/api/admin/media/orphans', authMiddleware, superAdminOnly, async (c) => {
  const env = c.env;
  
  try {
    // 1. Récupérer TOUTES les références DB
    const referencedFiles = new Set<string>();
    
    // Machines
    const machines = await env.DB.prepare(
      'SELECT logo_url FROM machines WHERE logo_url IS NOT NULL'
    ).all();
    machines.results.forEach(m => {
      const filename = extractFilename(m.logo_url);
      if (filename) referencedFiles.add(filename);
    });
    
    // Tickets
    const tickets = await env.DB.prepare(
      'SELECT photo_url FROM tickets WHERE photo_url IS NOT NULL'
    ).all();
    tickets.results.forEach(t => {
      const filename = extractFilename(t.photo_url);
      if (filename) referencedFiles.add(filename);
    });
    
    // Messages
    const messages = await env.DB.prepare(
      'SELECT attachment_url FROM messages WHERE attachment_url IS NOT NULL'
    ).all();
    messages.results.forEach(m => {
      const filename = extractFilename(m.attachment_url);
      if (filename) referencedFiles.add(filename);
    });
    
    // System Settings
    const settings = await env.DB.prepare(
      `SELECT setting_value FROM system_settings 
       WHERE setting_key = 'company_logo' AND setting_value IS NOT NULL`
    ).all();
    settings.results.forEach(s => {
      const filename = extractFilename(s.setting_value);
      if (filename) referencedFiles.add(filename);
    });
    
    // 2. Lister TOUS les fichiers R2
    const listed = await env.R2.list({ prefix: 'maintenance-media/' });
    const allFiles = listed.objects.map(obj => obj.key);
    
    // 3. Identifier les orphelins
    const orphans = allFiles.filter(file => {
      const filename = file.split('/').pop();
      return filename && !referencedFiles.has(filename);
    });
    
    // 4. Calculer statistiques
    const totalSize = orphans.reduce((sum, key) => {
      const obj = listed.objects.find(o => o.key === key);
      return sum + (obj?.size || 0);
    }, 0);
    
    return c.json({
      summary: {
        total_files: allFiles.length,
        referenced_files: referencedFiles.size,
        orphan_files: orphans.length,
        orphan_size_bytes: totalSize,
        orphan_size_mb: (totalSize / 1024 / 1024).toFixed(2)
      },
      orphans: orphans.map(key => {
        const obj = listed.objects.find(o => o.key === key);
        return {
          key: key,
          filename: key.split('/').pop(),
          size_bytes: obj?.size || 0,
          uploaded: obj?.uploaded || null
        };
      })
    });
    
  } catch (error) {
    console.error('Erreur audit médias:', error);
    return c.json({ error: 'Erreur lors de l\'audit' }, 500);
  }
});

// Fonction helper
function extractFilename(url: string | null): string | null {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.split('/').pop() || null;
  } catch {
    return null;
  }
}
```

### Exemple de Réponse

```json
{
  "summary": {
    "total_files": 127,
    "referenced_files": 119,
    "orphan_files": 8,
    "orphan_size_bytes": 2458624,
    "orphan_size_mb": "2.34"
  },
  "orphans": [
    {
      "key": "maintenance-media/ticket-456-1699876543210.jpg",
      "filename": "ticket-456-1699876543210.jpg",
      "size_bytes": 307456,
      "uploaded": "2025-01-13T10:15:43.210Z"
    },
    {
      "key": "maintenance-media/message-789-1699876600000.mp3",
      "filename": "message-789-1699876600000.mp3",
      "size_bytes": 1048576,
      "uploaded": "2025-01-13T10:16:40.000Z"
    }
  ]
}
```

---

## 🎨 Interface Utilisateur

### Ajout dans SystemSettingsModal

```javascript
// Section "Gestion des Médias"
React.createElement('div', { className: 'border-t pt-4 mt-4' },
  React.createElement('h3', { 
    className: 'text-lg font-semibold text-gray-800 mb-3' 
  }, '📁 Gestion des Médias'),
  
  React.createElement('button', {
    onClick: checkOrphans,
    className: 'w-full bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600'
  }, '🔍 Analyser les Fichiers Orphelins'),
  
  orphanResults && React.createElement('div', { 
    className: 'mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded' 
  },
    React.createElement('p', { className: 'font-semibold' },
      `📊 Résultats: ${orphanResults.summary.orphan_files} fichiers orphelins`
    ),
    React.createElement('p', { className: 'text-sm text-gray-600' },
      `Espace total: ${orphanResults.summary.orphan_size_mb} MB`
    ),
    orphanResults.orphans.length > 0 && React.createElement('div', { 
      className: 'mt-2 max-h-40 overflow-y-auto' 
    },
      React.createElement('ul', { className: 'text-xs space-y-1' },
        orphanResults.orphans.map((orphan, idx) =>
          React.createElement('li', { key: idx, className: 'text-gray-700' },
            `${orphan.filename} (${(orphan.size_bytes / 1024).toFixed(0)} KB)`
          )
        )
      )
    )
  )
)
```

---

## 🔧 Actions Possibles

### Option 1 : Information Seulement (Recommandé)
- Afficher la liste des orphelins
- Laisser les fichiers en place (pas de risque)
- Coût: Quelques cents/mois de stockage R2

### Option 2 : Nettoyage Manuel
```typescript
app.delete('/api/admin/media/cleanup-orphans', authMiddleware, superAdminOnly, async (c) => {
  // Liste orphelins
  // Demande confirmation user
  // Supprime via env.R2.delete(key)
  // Log dans audit
});
```

### Option 3 : Archivage
```typescript
app.post('/api/admin/media/archive-orphans', authMiddleware, superAdminOnly, async (c) => {
  // Déplace vers bucket séparé "maintenance-media-archive"
  // Garde backup pendant 90 jours
  // Suppression automatique après délai
});
```

---

## ⚖️ Recommandations

### ✅ À Implémenter Maintenant
1. **Endpoint d'audit** `/api/admin/media/orphans`
   - Détection automatique
   - Rapport détaillé
   - Pas de modification destructive

2. **Interface UI** dans SystemSettingsModal
   - Bouton "Analyser les médias"
   - Affichage résultats

### 🔮 À Considérer Plus Tard
3. **Nettoyage optionnel** (si l'espace devient un problème)
   - Coût R2 très faible (0.015 $/GB/mois)
   - Risque minime de garder les orphelins

4. **Détection proactive** (optionnel)
   - Cron job hebdomadaire
   - Email au super admin si >100 orphelins

---

## 📊 Estimation Coût

### Scénario Réaliste
```
Application PME avec 5 techniciens:
- 200 tickets/mois
- 2 photos moyenne/ticket
- 400 photos/mois × 500 KB = 200 MB/mois
- 12 mois = 2.4 GB stockage total

Taux orphelins estimé: 5% (mauvaises manips, tests)
= 120 MB orphelins/an

Coût R2: 120 MB × 0.000015 $/MB/mois = 0.0018 $/mois
= 2 cents/an pour les orphelins
```

**Conclusion**: Le coût des orphelins est NÉGLIGEABLE, pas besoin de nettoyage agressif.

---

## 🎯 Réponse à la Question Initiale

> "Est-ce qu'il y a un moyen de connaître l'existence de fichiers orphelins à part les logos ?"

**OUI**, en implémentant l'endpoint d'audit qui:

1. ✅ Scanne **toutes les tables** (machines, tickets, messages, system_settings)
2. ✅ Compare avec **tous les fichiers R2**
3. ✅ Identifie les orphelins (présents dans R2 mais pas dans DB)
4. ✅ Fournit rapport détaillé (nombre, taille, noms)

**Cas d'usage pratique:**
- Lancer l'audit APRÈS chaque restauration de backup
- Vérifier si des médias récents ont été "perdus"
- Décider si nettoyage nécessaire (rare)

---

## 🚀 Plan d'Implémentation

### Temps estimé: **1 heure**

1. **30 min** - Créer endpoint `/api/admin/media/orphans`
2. **20 min** - Ajouter section UI dans SystemSettingsModal
3. **10 min** - Tests et validation

### Inclure dans Phase 1 ?

**OUI**, car:
- Utile indépendamment du backup/restore
- Permet audit régulier de l'espace R2
- Temps minimal (+1h sur les 3h prévues)

**Total Phase 1 révisé: 4 heures** (backup + audit médias)
