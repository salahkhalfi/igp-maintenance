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

/**
 * GET /api/settings/:key - Obtenir une valeur de paramètre
 * Accès: Tous les utilisateurs authentifiés
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
 * PUT /api/settings/:key - Mettre à jour une valeur de paramètre
 * Accès: Admin uniquement
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

/**
 * POST /api/settings/upload-logo - Upload du logo de l'entreprise
 * Accès: Admin uniquement (avec vérification super admin recommandée)
 * Dimensions recommandées: 200x80 pixels (ratio 2.5:1)
 * Formats acceptés: PNG, JPEG, WEBP
 * Taille max: 500 KB
 */
settings.post('/upload-logo', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;
    
    // PROTECTION: Seul le super admin peut changer le logo
    // Vérifier dans la DB si l'utilisateur est super admin
    const userInfo = await c.env.DB.prepare(`
      SELECT is_super_admin FROM users WHERE id = ?
    `).bind(user.userId).first() as any;
    
    if (!userInfo || userInfo.is_super_admin !== 1) {
      return c.json({ error: 'Action réservée au super administrateur' }, 403);
    }
    
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
 * Accès: Super admin uniquement
 */
settings.delete('/logo', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;
    
    // PROTECTION: Seul le super admin peut supprimer le logo
    const userInfo = await c.env.DB.prepare(`
      SELECT is_super_admin FROM users WHERE id = ?
    `).bind(user.userId).first() as any;
    
    if (!userInfo || userInfo.is_super_admin !== 1) {
      return c.json({ error: 'Action réservée au super administrateur' }, 403);
    }
    
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

export default settings;
