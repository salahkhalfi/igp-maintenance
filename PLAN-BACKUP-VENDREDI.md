# 📅 Plan d'Implémentation : Système de Sauvegarde DB

## Date Cible
**Vendredi 2025-11-15** (dans 2 jours)

---

## 🎯 Objectif

Implémenter système de **sauvegarde/restauration de la base de données** pour super admin.

### Scope Confirmé

✅ **INCLUS :**
- Export SQL complet de toutes les tables DB
- Interface UI dans Paramètres Système
- Middleware `superAdminOnly` pour sécurité
- Documentation Cloudflare Time Travel (restauration)
- Audit des fichiers orphelins R2

❌ **EXCLU (pour l'instant) :**
- Refactoring architecture (reporté)
- i18n internationalisation (reporté)
- Sauvegarde fichiers R2 (pas nécessaire - voir analyse)
- Import/restauration via UI (on utilise Time Travel)

---

## ⏱️ Estimation Temps

**Total : 3 heures**

1. **Middleware superAdminOnly** - 15 min
2. **Endpoint export SQL** - 1h30
3. **Endpoint audit médias orphelins** - 45 min
4. **Interface UI dans SystemSettingsModal** - 30 min
5. **Documentation Time Travel** - 15 min

---

## 🔧 Implémentation Technique

### 1. Middleware SuperAdminOnly

**Fichier :** `src/routes/admin.ts` (NOUVEAU)

```typescript
import { Hono } from 'hono';
import { authMiddleware } from './auth';

const admin = new Hono();

// Middleware pour vérifier super admin
const superAdminOnly = async (c, next) => {
  const user = c.get('user');
  
  if (!user || !user.isSuperAdmin) {
    return c.json({ error: 'Accès refusé. Super admin requis.' }, 403);
  }
  
  await next();
};

// Toutes les routes admin protégées
admin.use('*', authMiddleware);
admin.use('*', superAdminOnly);

export default admin;
```

---

### 2. Endpoint Export SQL

**Route :** `GET /api/admin/backup/export`

**Fonctionnalité :**
- Génère dump SQL de toutes les tables
- Inclut structure + données
- Format téléchargeable (.sql)
- Nom fichier : `igp-backup-{timestamp}.sql`

**Tables exportées :**
```typescript
const tables = [
  'users',
  'tickets', 
  'machines',
  'ticket_comments',
  'messages',
  'system_settings',
  'webhook_notifications'
];
```

**Code :**
```typescript
admin.get('/backup/export', async (c) => {
  const env = c.env;
  
  try {
    let sqlDump = `-- IGP Maintenance Database Backup\n`;
    sqlDump += `-- Generated: ${new Date().toISOString()}\n`;
    sqlDump += `-- Application: webapp v2.0.12\n\n`;
    
    const tables = [
      'users', 'tickets', 'machines', 'ticket_comments',
      'messages', 'system_settings', 'webhook_notifications'
    ];
    
    for (const table of tables) {
      sqlDump += `\n-- Table: ${table}\n`;
      
      // Récupérer toutes les données
      const result = await env.DB.prepare(`SELECT * FROM ${table}`).all();
      
      if (result.results.length > 0) {
        // Générer INSERT statements
        for (const row of result.results) {
          const columns = Object.keys(row).join(', ');
          const values = Object.values(row).map(v => {
            if (v === null) return 'NULL';
            if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
            return v;
          }).join(', ');
          
          sqlDump += `INSERT INTO ${table} (${columns}) VALUES (${values});\n`;
        }
      } else {
        sqlDump += `-- No data in ${table}\n`;
      }
    }
    
    // Log de l'export (audit)
    await env.DB.prepare(`
      INSERT INTO system_settings (setting_key, setting_value, updated_at)
      VALUES ('last_backup_export', ?, datetime('now'))
      ON CONFLICT(setting_key) DO UPDATE SET 
        setting_value = excluded.setting_value,
        updated_at = excluded.updated_at
    `).bind(new Date().toISOString()).run();
    
    return new Response(sqlDump, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="igp-backup-${Date.now()}.sql"`
      }
    });
    
  } catch (error) {
    console.error('Erreur export backup:', error);
    return c.json({ error: 'Erreur lors de l\'export' }, 500);
  }
});
```

---

### 3. Endpoint Audit Médias Orphelins

**Route :** `GET /api/admin/media/orphans`

**Fonctionnalité :**
- Scanne toutes les tables pour références médias
- Liste tous les fichiers R2
- Identifie orphelins (R2 mais pas DB)
- Retourne rapport détaillé

**Code :**
```typescript
admin.get('/media/orphans', async (c) => {
  const env = c.env;
  
  try {
    // 1. Collecter toutes les références DB
    const referencedFiles = new Set<string>();
    
    // Machines logos
    const machines = await env.DB.prepare(
      'SELECT logo_url FROM machines WHERE logo_url IS NOT NULL'
    ).all();
    machines.results.forEach(m => {
      const filename = extractFilename(m.logo_url);
      if (filename) referencedFiles.add(filename);
    });
    
    // Tickets photos
    const tickets = await env.DB.prepare(
      'SELECT photo_url FROM tickets WHERE photo_url IS NOT NULL'
    ).all();
    tickets.results.forEach(t => {
      const filename = extractFilename(t.photo_url);
      if (filename) referencedFiles.add(filename);
    });
    
    // Messages attachments
    const messages = await env.DB.prepare(
      'SELECT attachment_url FROM messages WHERE attachment_url IS NOT NULL'
    ).all();
    messages.results.forEach(m => {
      const filename = extractFilename(m.attachment_url);
      if (filename) referencedFiles.add(filename);
    });
    
    // System logo
    const settings = await env.DB.prepare(
      `SELECT setting_value FROM system_settings 
       WHERE setting_key = 'company_logo' AND setting_value IS NOT NULL`
    ).all();
    settings.results.forEach(s => {
      const filename = extractFilename(s.setting_value);
      if (filename) referencedFiles.add(filename);
    });
    
    // 2. Lister tous les fichiers R2
    const listed = await env.R2.list({ prefix: 'maintenance-media/' });
    const allFiles = listed.objects.map(obj => obj.key);
    
    // 3. Identifier orphelins
    const orphans = allFiles.filter(file => {
      const filename = file.split('/').pop();
      return filename && !referencedFiles.has(filename);
    });
    
    // 4. Calculer stats
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

// Helper function
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

---

### 4. Interface UI

**Modification :** Ajouter section dans `SystemSettingsModal` (dans `src/index.tsx`)

**Emplacement :** Après la section "Gestion des Utilisateurs"

**Code à ajouter :**

```javascript
// État pour backup
const [isExporting, setIsExporting] = React.useState(false);
const [exportStatus, setExportStatus] = React.useState('');
const [orphanResults, setOrphanResults] = React.useState(null);
const [isAnalyzing, setIsAnalyzing] = React.useState(false);

// Fonction export backup
const exportDatabase = async () => {
  setIsExporting(true);
  setExportStatus('Export en cours...');
  
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(API_URL + '/admin/backup/export', {
      headers: { 'Authorization': `Bearer ${token}` },
      responseType: 'blob'
    });
    
    // Télécharger le fichier
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `igp-backup-${Date.now()}.sql`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    
    setExportStatus('✅ Export réussi !');
  } catch (error) {
    console.error('Erreur export:', error);
    setExportStatus('❌ Erreur lors de l\'export');
  } finally {
    setIsExporting(false);
    setTimeout(() => setExportStatus(''), 3000);
  }
};

// Fonction analyse médias
const analyzeMedia = async () => {
  setIsAnalyzing(true);
  
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(API_URL + '/admin/media/orphans', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    setOrphanResults(response.data);
  } catch (error) {
    console.error('Erreur analyse:', error);
    alert('Erreur lors de l\'analyse des médias');
  } finally {
    setIsAnalyzing(false);
  }
};

// UI Section Backup
React.createElement('div', { className: 'border-t pt-4 mt-4' },
  React.createElement('h3', { 
    className: 'text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2' 
  },
    React.createElement('i', { className: 'fas fa-database' }),
    'Sauvegarde et Restauration'
  ),
  
  // Export Database
  React.createElement('div', { className: 'mb-4' },
    React.createElement('button', {
      onClick: exportDatabase,
      disabled: isExporting,
      className: `w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`
    }, 
      isExporting 
        ? React.createElement('span', {},
            React.createElement('i', { className: 'fas fa-spinner fa-spin mr-2' }),
            'Export en cours...'
          )
        : React.createElement('span', {},
            React.createElement('i', { className: 'fas fa-download mr-2' }),
            'Exporter la Base de Données'
          )
    ),
    exportStatus && React.createElement('p', { 
      className: `mt-2 text-sm ${exportStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}` 
    }, exportStatus)
  ),
  
  // Analyse Médias
  React.createElement('div', { className: 'mb-4' },
    React.createElement('button', {
      onClick: analyzeMedia,
      disabled: isAnalyzing,
      className: `w-full bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 transition ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`
    },
      isAnalyzing
        ? React.createElement('span', {},
            React.createElement('i', { className: 'fas fa-spinner fa-spin mr-2' }),
            'Analyse en cours...'
          )
        : React.createElement('span', {},
            React.createElement('i', { className: 'fas fa-search mr-2' }),
            'Analyser les Médias Orphelins'
          )
    )
  ),
  
  // Résultats analyse
  orphanResults && React.createElement('div', { 
    className: 'mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded' 
  },
    React.createElement('p', { className: 'font-semibold text-gray-800' },
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
  ),
  
  // Note explicative
  React.createElement('div', { className: 'mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm' },
    React.createElement('p', { className: 'font-semibold text-blue-800 mb-1' },
      'ℹ️ Restauration'
    ),
    React.createElement('p', { className: 'text-blue-700' },
      'Pour restaurer, utilisez Cloudflare Time Travel (voir documentation)'
    )
  )
)
```

---

### 5. Intégration dans src/index.tsx

**Modifications nécessaires :**

1. **Importer la route admin** (ligne ~50)
```typescript
import admin from './routes/admin';
```

2. **Monter la route** (ligne ~280)
```typescript
app.route('/api/admin', admin);
```

3. **Ajouter la section UI** dans `SystemSettingsModal`
   - Voir code UI ci-dessus
   - Insérer après section "Gestion des Utilisateurs"

---

### 6. Documentation Time Travel

**Fichier :** `GUIDE-CLOUDFLARE-TIME-TRAVEL.md` (NOUVEAU)

```markdown
# 📖 Guide : Restauration avec Cloudflare Time Travel

## Qu'est-ce que Time Travel ?

Cloudflare D1 garde automatiquement **30 jours d'historique** de votre base de données.

Vous pouvez restaurer à n'importe quel point dans le temps sans backup manuel.

## Cas d'Usage

- ❌ Suppression accidentelle de données
- ❌ Bug qui corrompt la base
- ❌ Mauvaise mise à jour
- ❌ Tests qui tournent mal en production

## Comment Restaurer ?

### Via Dashboard Cloudflare (Simple)

1. Allez sur https://dash.cloudflare.com
2. **Storage & Databases** → **D1**
3. Sélectionnez `webapp-production`
4. Onglet **Time Travel**
5. Sélectionnez date/heure de restauration
6. Cliquez **Restore**

### Via CLI Wrangler (Avancé)

```bash
# Voir l'historique disponible
npx wrangler d1 time-travel list webapp-production

# Restaurer à un timestamp spécifique
npx wrangler d1 time-travel restore webapp-production \
  --timestamp 2025-11-15T10:30:00Z

# Restaurer à l'état d'il y a 2 heures
npx wrangler d1 time-travel restore webapp-production \
  --before 2h
```

## Combinaison avec Export SQL

**Stratégie optimale :**

1. **Export SQL quotidien** = Backup long terme (>30 jours)
2. **Time Travel** = Restauration rapide (<30 jours)

**Exemple scénario :**

```
Jour 1 (Lundi)    : Export SQL sauvegardé
Jour 3 (Mercredi) : Erreur détectée à 14h00
Jour 3 (Mercredi) : Time Travel → Restaurer à 13h45
                    (2 minutes pour restaurer)

Jour 45 (2 mois après) : Besoin de données anciennes
                         Time Travel ne peut pas (>30 jours)
                         → Utiliser export SQL du Jour 1
```

## Bonnes Pratiques

✅ Faire export SQL avant changements majeurs  
✅ Tester Time Travel en environnement dev d'abord  
✅ Vérifier état DB après restauration  
✅ Noter le timestamp exact avant modifications  

## Limitations

⚠️ Time Travel disponible **30 jours seulement**  
⚠️ Ne restaure PAS les fichiers R2 (seulement DB)  
⚠️ Restauration complète (pas sélective par table)  

## Support

Pour problèmes : https://developers.cloudflare.com/d1/platform/backups/
```

---

## 🧪 Tests à Effectuer

### Test 1 : Export SQL
```bash
1. Login en tant que super admin
2. Ouvrir Paramètres Système
3. Section "Sauvegarde et Restauration"
4. Cliquer "Exporter la Base de Données"
5. Vérifier téléchargement fichier .sql
6. Ouvrir fichier → Vérifier contenu SQL valide
```

### Test 2 : Audit Médias
```bash
1. Login en tant que super admin
2. Ouvrir Paramètres Système
3. Cliquer "Analyser les Médias Orphelins"
4. Attendre résultats
5. Vérifier statistiques affichées
6. Si orphelins, vérifier liste détaillée
```

### Test 3 : Sécurité
```bash
1. Login en tant que technicien (NON super admin)
2. Essayer accès direct : GET /api/admin/backup/export
3. Vérifier erreur 403 Forbidden
4. Vérifier message "Super admin requis"
```

### Test 4 : Restauration Time Travel (Optionnel)
```bash
1. Créer un ticket de test
2. Noter l'heure exacte
3. Supprimer le ticket
4. Utiliser Time Travel (dashboard ou CLI)
5. Restaurer à l'heure notée
6. Vérifier que le ticket réapparaît
```

---

## 📦 Checklist Vendredi

### Préparation (15 min)
- [ ] Lire ce document complet
- [ ] Vérifier environnement dev fonctionnel
- [ ] Avoir accès Cloudflare Dashboard

### Développement (2h30)
- [ ] Créer `src/routes/admin.ts`
- [ ] Implémenter middleware `superAdminOnly`
- [ ] Implémenter endpoint `/api/admin/backup/export`
- [ ] Implémenter endpoint `/api/admin/media/orphans`
- [ ] Ajouter section UI dans `SystemSettingsModal`
- [ ] Intégrer routes dans `src/index.tsx`

### Tests (30 min)
- [ ] Test export SQL (super admin)
- [ ] Test audit médias
- [ ] Test sécurité (accès refusé non-admin)
- [ ] Test téléchargement et validité fichier SQL

### Documentation (15 min)
- [ ] Créer `GUIDE-CLOUDFLARE-TIME-TRAVEL.md`
- [ ] Mettre à jour README.md avec infos backup

### Déploiement (15 min)
- [ ] Build : `npm run build`
- [ ] Test local : `pm2 restart webapp`
- [ ] Vérifier fonctionnement complet
- [ ] Commit git avec message descriptif
- [ ] Push vers GitHub
- [ ] Deploy Cloudflare : `npm run deploy:prod`

---

## 🎯 Critères de Succès

✅ Super admin peut exporter la DB en 1 clic  
✅ Fichier SQL téléchargé contient toutes les données  
✅ Audit médias identifie correctement les orphelins  
✅ Non-admin ne peut PAS accéder aux endpoints  
✅ Documentation Time Travel claire et complète  

---

## 📞 Support

Si besoin d'aide vendredi :
- Relire documents d'analyse créés aujourd'hui
- `DESIGN-BACKUP-RESTORE-SECURISE.md`
- `ANALYSE-FICHIERS-ORPHELINS-R2.md`

Bonne chance pour vendredi ! 🚀
