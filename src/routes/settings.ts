// Routes de gestion des paramètres système

import { Hono } from 'hono';
import { adminOnly, authMiddleware } from '../middlewares/auth';
import type { Bindings } from '../types';

const settings = new Hono<{ Bindings: Bindings }>();

// Configuration pour l'upload du logo
const MAX_LOGO_SIZE = 500 * 1024; // 500 KB
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const RECOMMENDED_WIDTH = 200;
const RECOMMENDED_HEIGHT = 80;

// ============================================================================
// ROUTES SPÉCIFIQUES (DOIVENT ÊTRE DÉCLARÉES AVANT LES ROUTES GÉNÉRIQUES)
// ============================================================================

/**
 * POST /api/settings/trigger-cleanup - Déclenchement manuel du "Concierge"
 * Accès: Administrateurs (admin role) uniquement
 * Proxy vers la logique de nettoyage (Janitor)
 */
settings.post('/trigger-cleanup', authMiddleware, adminOnly, async (c) => {
  try {
    const now = new Date();
    console.log('🧹 MANUAL Janitor Triggered by Admin:', now.toISOString());

    // Note: Idéalement, on factoriserait la logique de nettoyage dans un service partagé (utils/cleanup.ts)
    // pour éviter la duplication avec cron.ts. Pour l'instant, on duplique pour la rapidité du fix.
    
    // 1. Nettoyer les événements de planning passés (> 3 mois)
    const planningResult = await c.env.DB.prepare(`
      DELETE FROM planning_events 
      WHERE date < date('now', '-3 months')
    `).run();
    
    // 2. Nettoyer les notes personnelles terminées (> 30 jours)
    const notesResult = await c.env.DB.prepare(`
      DELETE FROM planner_notes 
      WHERE done = 1 
      AND created_at < datetime('now', '-30 days')
    `).run();

    // 3. Optimisation de la base de données (VACUUM)
    await c.env.DB.prepare('PRAGMA optimize').run();

    return c.json({
        success: true,
        message: "Nettoyage manuel terminé avec succès",
        deleted: {
            planning_events: planningResult.meta.changes,
            notes: notesResult.meta.changes
        },
        timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('❌ Manual Janitor Error:', error);
    return c.json({ error: 'Erreur lors du nettoyage manuel', details: error instanceof Error ? error.message : 'Unknown' }, 500);
  }
});

/**
 * POST /api/settings/upload-logo - Upload du logo de l'entreprise
 * Accès: Administrateurs (admin role)
 * Dimensions recommandées: 200x80 pixels (ratio 2.5:1)
 * Formats acceptés: PNG, JPEG, WEBP
 * Taille max: 500 KB
 */
settings.post('/upload-logo', authMiddleware, adminOnly, async (c) => {
  try {
    const user = c.get('user') as any;

    const formData = await c.req.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      return c.json({ error: 'Aucun fichier fourni' }, 400);
    }

    // Validation du type de fichier
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      return c.json({
        error: `Type de fichier non autorisé. Formats acceptés: ${ALLOWED_LOGO_TYPES.join(', ')}`
      }, 400);
    }

    // Validation de la taille
    if (file.size > MAX_LOGO_SIZE) {
      return c.json({
        error: `Fichier trop volumineux (max ${MAX_LOGO_SIZE / 1024} KB)`
      }, 400);
    }

    // Générer une clé unique pour le fichier
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop() || 'png';
    const fileKey = `logos/company-logo-${timestamp}-${randomStr}.${extension}`;

    // Upload vers R2
    const arrayBuffer = await file.arrayBuffer();
    await c.env.MEDIA_BUCKET.put(fileKey, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    console.log(`✅ Logo uploadé dans R2: ${fileKey}`);

    // Construire l'URL du logo (via la route GET /api/settings/logo)
    const logoUrl = `/api/settings/logo?t=${timestamp}`;

    // Mettre à jour la DB avec la clé du fichier R2
    const existing = await c.env.DB.prepare(`
      SELECT id FROM system_settings WHERE setting_key = 'company_logo_key'
    `).first();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE system_settings
        SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = 'company_logo_key'
      `).bind(fileKey).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO system_settings (setting_key, setting_value)
        VALUES ('company_logo_key', ?)
      `).bind(fileKey).run();
    }

    console.log(`✅ Logo enregistré dans DB: ${fileKey}`);

    return c.json({
      message: 'Logo uploadé avec succès',
      logoUrl,
      fileKey,
      recommendations: {
        width: RECOMMENDED_WIDTH,
        height: RECOMMENDED_HEIGHT,
        formats: ALLOWED_LOGO_TYPES,
        maxSize: `${MAX_LOGO_SIZE / 1024} KB`
      }
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    return c.json({ error: 'Erreur lors de l\'upload du logo' }, 500);
  }
});

/**
 * GET /api/settings/logo - Récupérer le logo actuel depuis R2
 * Accès: Public (pour affichage)
 *
 * NOTE: Cette route DOIT être déclarée AVANT la route générique GET /:key
 * sinon Hono matchera /logo comme /:key avec key="logo"
 */
settings.get('/logo', async (c) => {
  try {
    // Récupérer la clé du logo depuis la DB
    const setting = await c.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'company_logo_key'
    `).first() as any;

    if (!setting || !setting.setting_value) {
      // Pas de logo personnalisé, retourner le logo par défaut
      return c.redirect('/static/logo-igp.png');
    }

    const fileKey = setting.setting_value;

    // Récupérer le fichier depuis R2
    const object = await c.env.MEDIA_BUCKET.get(fileKey);

    if (!object) {
      console.error(`Logo non trouvé dans R2: ${fileKey}`);
      // Fallback sur le logo par défaut
      return c.redirect('/static/logo-igp.png');
    }

    // Retourner le logo avec cache
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'image/png',
        'Cache-Control': 'public, max-age=3600', // Cache 1 heure
      },
    });
  } catch (error) {
    console.error('Get logo error:', error);
    // Fallback sur le logo par défaut en cas d'erreur
    return c.redirect('/static/logo-igp.png');
  }
});

/**
 * DELETE /api/settings/logo - Supprimer le logo personnalisé et revenir au logo par défaut
 * Accès: Administrateurs (admin role)
 */
settings.delete('/logo', authMiddleware, adminOnly, async (c) => {
  try {
    const user = c.get('user') as any;

    // Récupérer la clé du logo depuis la DB
    const setting = await c.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'company_logo_key'
    `).first() as any;

    if (setting && setting.setting_value) {
      // Supprimer le fichier du bucket R2
      try {
        await c.env.MEDIA_BUCKET.delete(setting.setting_value);
        console.log(`✅ Logo supprimé du R2: ${setting.setting_value}`);
      } catch (deleteError) {
        console.error(`Erreur suppression R2 ${setting.setting_value}:`, deleteError);
      }
    }

    // Supprimer l'entrée de la DB
    await c.env.DB.prepare(`
      DELETE FROM system_settings WHERE setting_key = 'company_logo_key'
    `).run();

    return c.json({
      message: 'Logo supprimé avec succès. Le logo par défaut sera utilisé.',
      defaultLogo: '/static/logo-igp.png'
    });
  } catch (error) {
    console.error('Delete logo error:', error);
    return c.json({ error: 'Erreur lors de la suppression du logo' }, 500);
  }
});

/**
 * PUT /api/settings/title - Mettre à jour le titre de l'application
 * Accès: Administrateurs (admin role)
 * Validation: Max 100 caractères, échappement HTML, UTF-8
 */
settings.put('/title', authMiddleware, adminOnly, async (c) => {
  try {
    const user = c.get('user') as any;

    const body = await c.req.json();
    const { value } = body;

    if (!value || typeof value !== 'string') {
      return c.json({ error: 'Titre invalide' }, 400);
    }

    // Validation stricte
    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
      return c.json({ error: 'Le titre ne peut pas être vide' }, 400);
    }

    if (trimmedValue.length > 100) {
      return c.json({ error: 'Le titre ne peut pas dépasser 100 caractères' }, 400);
    }

    // ⚠️ IMPORTANT: Pas d'échappement HTML ici!
    // React.createElement() échappe automatiquement le contenu à l'affichage.
    // On stocke la valeur BRUTE en DB (best practice).
    // Cela permet d'afficher correctement "Test & Co" au lieu de "Test &amp; Co".
    // Protection XSS: React échappe automatiquement dans createElement()

    // Mettre à jour la DB avec la valeur brute (trimmed uniquement)
    await c.env.DB.prepare(`
      UPDATE system_settings
      SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
      WHERE setting_key = 'company_title'
    `).bind(trimmedValue).run();

    console.log(`✅ Titre modifié par user ${user.userId}: "${trimmedValue}"`);

    return c.json({
      message: 'Titre mis à jour avec succès',
      setting_value: trimmedValue
    });
  } catch (error) {
    console.error('Update title error:', error);
    return c.json({ error: 'Erreur lors de la mise à jour du titre' }, 500);
  }
});

/**
 * PUT /api/settings/subtitle - Mettre à jour le sous-titre de l'application
 * Accès: Administrateurs (admin role)
 * Validation: Max 150 caractères, échappement HTML, UTF-8
 */
settings.put('/subtitle', authMiddleware, adminOnly, async (c) => {
  try {
    const user = c.get('user') as any;

    const body = await c.req.json();
    const { value } = body;

    if (!value || typeof value !== 'string') {
      return c.json({ error: 'Sous-titre invalide' }, 400);
    }

    // Validation stricte
    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
      return c.json({ error: 'Le sous-titre ne peut pas être vide' }, 400);
    }

    if (trimmedValue.length > 150) {
      return c.json({ error: 'Le sous-titre ne peut pas dépasser 150 caractères' }, 400);
    }

    // ⚠️ IMPORTANT: Pas d'échappement HTML ici!
    // React.createElement() échappe automatiquement le contenu à l'affichage.
    // On stocke la valeur BRUTE en DB (best practice).
    // Cela permet d'afficher correctement "Test & Co" au lieu de "Test &amp; Co".
    // Protection XSS: React échappe automatiquement dans createElement()

    // Mettre à jour la DB avec la valeur brute (trimmed uniquement)
    await c.env.DB.prepare(`
      UPDATE system_settings
      SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
      WHERE setting_key = 'company_subtitle'
    `).bind(trimmedValue).run();

    console.log(`✅ Sous-titre modifié par user ${user.userId}: "${trimmedValue}"`);

    return c.json({
      message: 'Sous-titre mis à jour avec succès',
      setting_value: trimmedValue
    });
  } catch (error) {
    console.error('Update subtitle error:', error);
    return c.json({ error: 'Erreur lors de la mise à jour du sous-titre' }, 500);
  }
});

/**
 * GET /api/settings/modules - Récupérer l'état des modules (Licence)
 * Accès: Authentifié
 */
settings.get('/modules', authMiddleware, async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'active_modules'
    `).first();

    // Valeurs par défaut (Tout activé pour commencer)
    const defaultModules = {
      planning: true,
      statistics: true,
      notifications: true
    };

    if (!result || !result.setting_value) {
      return c.json(defaultModules);
    }

    try {
      return c.json({ ...defaultModules, ...JSON.parse(result.setting_value as string) });
    } catch (e) {
      return c.json(defaultModules);
    }
  } catch (error) {
    console.error('Get modules error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * PUT /api/settings/modules - Mettre à jour les licences (Feature Flipping)
 * Accès: Admin Only
 */
settings.put('/modules', authMiddleware, adminOnly, async (c) => {
  try {
    const body = await c.req.json();
    const value = JSON.stringify(body); // Stockage JSON string

    // Upsert logic
    const existing = await c.env.DB.prepare(`
      SELECT id FROM system_settings WHERE setting_key = 'active_modules'
    `).first();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = 'active_modules'
      `).bind(value).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO system_settings (setting_key, setting_value) VALUES ('active_modules', ?)
      `).bind(value).run();
    }

    return c.json({ success: true, modules: body });
  } catch (error) {
    console.error('Update modules error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// ============================================================================
// ROUTES GÉNÉRIQUES (DOIVENT ÊTRE DÉCLARÉES APRÈS LES ROUTES SPÉCIFIQUES)
// ============================================================================

/**
 * GET /api/settings/:key - Obtenir une valeur de paramètre
 * Accès: Tous les utilisateurs authentifiés
 *
 * Utilisé pour: timezone_offset_hours, etc.
 * NOTE: Cette route est déclarée APRÈS les routes spécifiques (/logo, /upload-logo)
 * pour éviter qu'elle ne les capture
 */
settings.get('/:key', async (c) => {
  try {
    const key = c.req.param('key');

    const result = await c.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = ?
    `).bind(key).first();

    if (!result) {
      return c.json({ error: 'Paramètre non trouvé' }, 404);
    }

    return c.json({ setting_value: result.setting_value });
  } catch (error) {
    console.error('Get setting error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/settings/modules/status - Récupérer l'état des modules (Licence)
 * Accès: Authentifié
 */
settings.get('/modules/status', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'active_modules'
    `).first();

    // Valeurs par défaut (Tout activé pour commencer)
    const defaultModules = {
      planning: true,
      analytics: true,
      notifications: true
    };

    if (!result || !result.setting_value) {
      return c.json(defaultModules);
    }

    try {
      return c.json({ ...defaultModules, ...JSON.parse(result.setting_value as string) });
    } catch (e) {
      return c.json(defaultModules);
    }
  } catch (error) {
    console.error('Get modules error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * PUT /api/settings/modules/status - Mettre à jour les licences (Feature Flipping)
 * Accès: Admin Only
 */
settings.put('/modules/status', authMiddleware, adminOnly, async (c) => {
  try {
    const body = await c.req.json();
    const value = JSON.stringify(body); // Stockage JSON string

    // Upsert logic
    const existing = await c.env.DB.prepare(`
      SELECT id FROM system_settings WHERE setting_key = 'active_modules'
    `).first();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = 'active_modules'
      `).bind(value).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO system_settings (setting_key, setting_value) VALUES ('active_modules', ?)
      `).bind(value).run();
    }

    return c.json({ success: true, modules: body });
  } catch (error) {
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * PUT /api/settings/:key - Mettre à jour une valeur de paramètre
 * Accès: Admin uniquement
 *
 * Utilisé pour: timezone_offset_hours, etc.
 */
settings.put('/:key', adminOnly, async (c) => {
  try {
    const key = c.req.param('key');
    const body = await c.req.json();
    const { value } = body;

    if (value === undefined) {
      return c.json({ error: 'Valeur requise' }, 400);
    }

    // Vérifier si le paramètre existe
    const existing = await c.env.DB.prepare(`
      SELECT id FROM system_settings WHERE setting_key = ?
    `).bind(key).first();

    if (existing) {
      // Mise à jour
      await c.env.DB.prepare(`
        UPDATE system_settings
        SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = ?
      `).bind(value, key).run();
    } else {
      // Création
      await c.env.DB.prepare(`
        INSERT INTO system_settings (setting_key, setting_value)
        VALUES (?, ?)
      `).bind(key, value).run();
    }

    return c.json({ message: 'Paramètre mis à jour avec succès', setting_value: value });
  } catch (error) {
    console.error('Update setting error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

export default settings;