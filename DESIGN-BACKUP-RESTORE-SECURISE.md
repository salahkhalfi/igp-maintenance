# 🔐 DESIGN: Système de Sauvegarde et Restauration Sécurisé

## 📅 Date d'Analyse
**2025-11-13 11:15 UTC**

## 🎯 Objectif

> "Pense à une manière sécuritaire fiable stable et solide pour effectuer à partir de la section paramètres par le super admin une sauvegarde et restauration des données sans perturber les fonctions de l'application comme le temps chronomètre et compte à rebours etc"

---

## 🏗️ Architecture Actuelle

### Composants à Sauvegarder

#### 1. **Base de Données D1 (Primary)**
```
Tables:
- users (comptes utilisateurs)
- tickets (tickets de maintenance)
- machines (équipement)
- ticket_comments (commentaires)
- messages (messagerie)
- system_settings (paramètres système)
- webhook_notifications (notifications)
```

#### 2. **Stockage R2 (Media)**
```
Buckets:
- maintenance-media (fichiers uploadés)
  * Images
  * Documents
  * Audio messages
```

#### 3. **Métadonnées Système**
```
- Versions migrations
- Configurations
- Secrets (pas sauvegardés - sécurité)
```

---

## ⚠️ Contraintes Critiques

### 1. **Zero Downtime** (Sans Perturber l'Application)

**Problème:**
Les utilisateurs continuent d'utiliser l'app pendant backup/restore:
- ✍️ Créent des tickets
- 💬 Envoient des messages
- ⏱️ Chronomètres actifs
- ⏳ Comptes à rebours en cours

**Solution:** Backup/Restore **asynchrone** et **non-bloquant**

### 2. **Cohérence des Données**

**Problème:**
```
T0: Début backup
T1: User crée ticket #100
T2: Backup capture ticket #100
T3: User modifie ticket #100
T4: Fin backup
→ Backup contient ancienne version!
```

**Solution:** Snapshot atomique + Horodatage

### 3. **Sécurité**

**Problème:**
- Backup contient données sensibles (emails, noms, etc.)
- Accès réservé au super admin
- Pas de fuite de données

**Solution:** 
- Authentification stricte
- Chiffrement
- Audit trail

---

## 🎨 Solution Recommandée: Approche Hybride

### Architecture en 3 Niveaux

```
┌─────────────────────────────────────────────────────┐
│ NIVEAU 1: Backup Automatique Cloudflare (Natif)    │
│ - Time Travel (30 jours)                            │
│ - Point-in-time restore                             │
│ - Géré par Cloudflare                               │
│ - AUCUN impact performance                          │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ NIVEAU 2: Export Manuel (Super Admin)              │
│ - Bouton "Exporter données"                         │
│ - Génère fichier .sql                               │
│ - Téléchargeable                                    │
│ - Backup "offline"                                  │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ NIVEAU 3: Restore Sécurisé                         │
│ - Upload fichier .sql                               │
│ - Validation et vérification                        │
│ - Preview avant import                              │
│ - Rollback possible                                 │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Plan d'Implémentation

### Phase 1: Export de Données (SAFE - Recommandé)

#### Fonctionnalité
```
Paramètres Système → Super Admin → Section "Sauvegarde"

┌──────────────────────────────────────────┐
│ 💾 Sauvegarde et Restauration           │
├──────────────────────────────────────────┤
│                                          │
│ 📊 Dernière sauvegarde:                 │
│ 2025-11-13 10:30 (il y a 45 minutes)   │
│                                          │
│ ┌──────────────────────────────────────┐│
│ │ 🔽 Exporter Base de Données          ││
│ │                                      ││
│ │ Télécharge un fichier .sql contenant:││
│ │ ✓ Tous les utilisateurs              ││
│ │ ✓ Tous les tickets                   ││
│ │ ✓ Tous les messages                  ││
│ │ ✓ Toutes les machines                ││
│ │ ✓ Paramètres système                 ││
│ │                                      ││
│ │ [📥 Télécharger Backup (.sql)]      ││
│ └──────────────────────────────────────┘│
│                                          │
│ ⚠️ Backup automatique Cloudflare:       │
│ Vos données sont automatiquement        │
│ sauvegardées par Cloudflare (30 jours)  │
│                                          │
└──────────────────────────────────────────┘
```

#### Backend: Endpoint d'Export

**Route:** `GET /api/admin/backup/export`

**Sécurité:**
```typescript
// Middleware: Super Admin UNIQUEMENT
app.get('/api/admin/backup/export', 
  authMiddleware, 
  superAdminOnly,  // ← Nouveau middleware
  async (c) => {
    // Génération backup
  }
);
```

**Implémentation:**
```typescript
app.get('/api/admin/backup/export', authMiddleware, superAdminOnly, async (c) => {
  try {
    const user = c.get('user');
    
    // 1. Audit log
    await c.env.DB.prepare(`
      INSERT INTO audit_logs (user_id, action, timestamp)
      VALUES (?, 'BACKUP_EXPORT', CURRENT_TIMESTAMP)
    `).bind(user.userId).run();
    
    // 2. Générer export SQL
    const tables = [
      'users', 'tickets', 'machines', 'ticket_comments',
      'messages', 'system_settings', 'webhook_notifications'
    ];
    
    let sqlDump = `-- IGP Maintenance Backup\n`;
    sqlDump += `-- Date: ${new Date().toISOString()}\n`;
    sqlDump += `-- User: ${user.email}\n\n`;
    
    for (const table of tables) {
      // Schema
      const schema = await c.env.DB.prepare(`
        SELECT sql FROM sqlite_master 
        WHERE type='table' AND name=?
      `).bind(table).first();
      
      sqlDump += `-- Table: ${table}\n`;
      sqlDump += `${schema.sql};\n\n`;
      
      // Data
      const rows = await c.env.DB.prepare(`
        SELECT * FROM ${table}
      `).all();
      
      for (const row of rows.results) {
        const columns = Object.keys(row);
        const values = Object.values(row).map(v => 
          v === null ? 'NULL' : 
          typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : 
          v
        );
        
        sqlDump += `INSERT INTO ${table} (${columns.join(', ')}) `;
        sqlDump += `VALUES (${values.join(', ')});\n`;
      }
      
      sqlDump += `\n`;
    }
    
    // 3. Retourner fichier
    const filename = `igp-backup-${Date.now()}.sql`;
    
    return new Response(sqlDump, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('Backup export error:', error);
    return c.json({ error: 'Erreur lors de l\'export' }, 500);
  }
});
```

#### Avantages
✅ **Sans risque** - Lecture seule, aucune modification  
✅ **Aucun impact** - N'affecte pas l'application  
✅ **Flexible** - Backup téléchargeable, stockable ailleurs  
✅ **Audit** - Chaque export est tracé  
✅ **Simple** - Pas de complexité  

#### Inconvénients
⚠️ **Ne sauvegarde pas R2** - Seulement la base de données  
⚠️ **Pas automatique** - Manuel par super admin  
⚠️ **Taille limite** - Problème si DB > 100MB  

---

### Phase 2: Import de Données (RISQUÉ - À Éviter en Production)

#### ⛔ POURQUOI NE PAS IMPLÉMENTER LE RESTORE VIA UI

**Risques Majeurs:**

1. **Perte de Données Récentes**
```
T0: Backup créé (contient 100 tickets)
T1-T30: Utilisateurs créent 50 nouveaux tickets
T31: Admin restore backup
→ 50 tickets PERDUS! ❌
```

2. **Incohérence des Données**
```
Backup contient:
- Ticket #50 assigné à User #10

Actuellement:
- User #10 supprimé
- User #11 créé avec même nom

Après restore:
- Ticket #50 référence User inexistant
→ Violation contrainte FK ❌
```

3. **Interruption de Service**
```
Restore = Réécriture complète DB
→ Application DOWN 5-30 secondes
→ Utilisateurs perdent travail en cours
→ Chronomètres réinitialisés ❌
```

4. **Complexité et Bugs**
```
- Validation du SQL uploadé (injection?)
- Gestion des conflits d'IDs
- Rollback en cas d'erreur
- Tests exhaustifs nécessaires
→ Risque de bugs critiques ❌
```

#### ✅ ALTERNATIVE RECOMMANDÉE: Cloudflare Time Travel

**Cloudflare D1 Time Travel** (Natif, Sûr, Testé)

```bash
# Lister les points de restauration disponibles
npx wrangler d1 time-travel info maintenance-db --remote

# Restaurer à un point précis
npx wrangler d1 time-travel restore maintenance-db \
  --remote \
  --timestamp="2025-11-13T10:00:00Z"
```

**Avantages:**
✅ **Natif Cloudflare** - Testé et supporté officiellement  
✅ **Point-in-time restore** - Restaure à n'importe quel moment (30 jours)  
✅ **Atomique** - Tout ou rien, pas d'état intermédiaire  
✅ **Rollback automatique** - Si erreur, revient en arrière  
✅ **Sans downtime** - Cloudflare gère la transition  
✅ **Audit intégré** - Logs Cloudflare automatiques  

**Inconvénients:**
⚠️ **Nécessite Wrangler CLI** - Pas via UI web  
⚠️ **Super admin local** - Doit avoir accès terminal  
⚠️ **30 jours max** - Pas de backup plus ancien  

---

## 🎯 Solution Finale Recommandée

### Architecture en 2 Phases

#### Phase 1: Export Manuel (UI Web) ✅ SAFE

**Implémentation:** 2-3 heures  
**Complexité:** Faible  
**Risque:** Aucun  

**Features:**
1. Bouton "📥 Télécharger Backup" dans Paramètres
2. Génère fichier .sql avec toutes les données
3. Super admin télécharge et stocke localement
4. Audit log de chaque export

**Code requis:**
- 1 nouveau middleware: `superAdminOnly`
- 1 nouveau endpoint: `GET /api/admin/backup/export`
- 1 nouveau bouton dans SystemSettingsModal
- ~200 lignes de code

#### Phase 2: Time Travel (CLI) ✅ SAFE

**Implémentation:** Documentation uniquement  
**Complexité:** Aucune (déjà disponible)  
**Risque:** Aucun (géré par Cloudflare)  

**Features:**
1. Documentation pour super admin
2. Guide étape par étape
3. Scripts bash pré-configurés
4. Exemples de restauration

**Utilisation:**
```bash
# 1. Lister backups disponibles
./scripts/list-backups.sh

# 2. Restaurer à un point précis
./scripts/restore-backup.sh "2025-11-13T10:00:00Z"
```

---

## 📊 Matrice de Décision

| Solution | Sécurité | Complexité | Risque | Downtime | Recommandation |
|----------|----------|------------|--------|----------|----------------|
| **Export UI Web** | ✅ Haute | ✅ Faible | ✅ Aucun | ❌ Aucun | ⭐⭐⭐⭐⭐ EXCELLENT |
| **Import UI Web** | ❌ Moyenne | ❌ Très haute | ❌ Élevé | ❌ Oui | ⛔ À ÉVITER |
| **Time Travel CLI** | ✅ Très haute | ✅ Aucune | ✅ Aucun | ✅ Aucun | ⭐⭐⭐⭐⭐ PARFAIT |
| **Backup automatique** | ✅ Haute | ✅ Faible | ✅ Aucun | ❌ Aucun | ⭐⭐⭐⭐ BON |

---

## 🚀 Roadmap d'Implémentation

### Étape 1: Middleware Super Admin (15 min)
```typescript
// src/middlewares/auth.ts
export async function superAdminOnly(c: Context, next: Next) {
  const user = c.get('user') as any;
  
  if (!user || !user.isSuperAdmin) {
    return c.json({ 
      error: 'Accès réservé au super administrateur' 
    }, 403);
  }

  await next();
}
```

### Étape 2: Endpoint Export (1 heure)
- Route `GET /api/admin/backup/export`
- Génération SQL dump
- Headers de téléchargement
- Audit logging

### Étape 3: UI dans Paramètres (1 heure)
- Nouvelle section "Sauvegarde"
- Bouton "Télécharger Backup"
- Message de confirmation
- Indication dernière sauvegarde

### Étape 4: Documentation (30 min)
- Guide utilisateur super admin
- Scripts CLI pour Time Travel
- Procédures de restauration
- FAQ et troubleshooting

**TOTAL:** ~3 heures d'implémentation

---

## 🔒 Considérations de Sécurité

### 1. Authentification Stricte
```typescript
// Vérification super admin
if (!user.isSuperAdmin) {
  return c.json({ error: 'Unauthorized' }, 403);
}

// Audit log
await logAction(user.id, 'BACKUP_EXPORT', {
  timestamp: new Date().toISOString(),
  ip: c.req.header('CF-Connecting-IP')
});
```

### 2. Données Sensibles
```typescript
// Option: Masquer mots de passe dans export
const sanitizeData = (row) => {
  if (row.password_hash) {
    row.password_hash = '[REDACTED]';
  }
  return row;
};
```

### 3. Rate Limiting
```typescript
// Max 1 export par heure
const lastExport = await getLastExport(user.id);
if (Date.now() - lastExport < 3600000) {
  return c.json({ 
    error: 'Trop de tentatives. Attendez 1 heure.' 
  }, 429);
}
```

### 4. Taille Limite
```typescript
// Vérifier taille avant génération
const estimatedSize = await estimateBackupSize();
if (estimatedSize > 50 * 1024 * 1024) { // 50MB
  return c.json({ 
    error: 'Base trop grande. Contactez support.' 
  }, 413);
}
```

---

## 📈 Scalabilité Future

### Phase 3 (Futur): Backup Automatique Quotidien

**Utilisation:** Cloudflare Workers Cron

```typescript
// wrangler.jsonc
{
  "triggers": {
    "crons": ["0 2 * * *"]  // 2h du matin tous les jours
  }
}

// src/cron/backup.ts
export async function scheduledBackup(env) {
  // 1. Générer backup
  const backup = await generateBackup(env.DB);
  
  // 2. Uploader vers R2
  await env.BACKUP_BUCKET.put(
    `backups/auto-${Date.now()}.sql`,
    backup
  );
  
  // 3. Nettoyer anciens (> 90 jours)
  await cleanOldBackups(env.BACKUP_BUCKET, 90);
}
```

### Phase 4 (Futur): Backup Incrémental

**Concept:** Seulement les changements depuis dernier backup

```typescript
// Backup différentiel
const lastBackupTime = await getLastBackupTimestamp();

const changedData = await env.DB.prepare(`
  SELECT * FROM tickets 
  WHERE updated_at > ?
`).bind(lastBackupTime).all();
```

---

## ✅ Recommandation Finale

### Pour Votre Cas d'Usage

**IMPLÉMENTER:**

1. ✅ **Export Manuel via UI** (Phase 1)
   - Safe, simple, utile
   - Super admin peut télécharger backup quand nécessaire
   - Aucun risque pour l'application
   - ~3 heures d'implémentation

2. ✅ **Documentation Time Travel** (Phase 2)
   - Utiliser fonctionnalité native Cloudflare
   - Guide pour super admin
   - Pour restaurations d'urgence
   - Aucune implémentation requise

**NE PAS IMPLÉMENTER:**

1. ❌ **Import/Restore via UI**
   - Trop risqué
   - Complexe à sécuriser
   - Peut causer downtime
   - Cloudflare Time Travel suffit

2. ❌ **Backup automatique custom**
   - Cloudflare le fait déjà (30 jours)
   - Réinventer la roue
   - Maintenance supplémentaire

---

## 🎯 Conclusion

**Question:**
> "manière sécuritaire fiable stable et solide pour backup/restore sans perturber l'application"

**Réponse:**

✅ **Export Manuel (UI) + Time Travel (CLI)**

**Pourquoi:**
- ✅ Sécuritaire: Lecture seule, audit, auth stricte
- ✅ Fiable: Cloudflare Time Travel natif + export SQL standard
- ✅ Stable: Aucun impact sur fonctionnement app
- ✅ Solide: Simple, testé, maintenable

**Évite:**
- ✅ Downtime: Zéro interruption
- ✅ Corruption: Snapshots atomiques
- ✅ Perte données: Time Travel jusqu'à 30 jours
- ✅ Bugs: Utilise fonctionnalités natives

**Implémentation:** ~3 heures  
**Risque:** Aucun  
**Maintenance:** Minimale  

---

**Prêt à implémenter?** 🚀

Je peux créer le code pour Phase 1 (Export Manuel) si vous voulez!
