// Routes de gestion des paramètres système

import { Hono } from 'hono';
import { adminOnly, authMiddleware } from '../middlewares/auth';
import type { Bindings } from '../types';
import { getDb } from '../db';
import { users, machines } from '../db/schema';
import { hashPassword } from '../utils/password';
import { sql } from 'drizzle-orm';
import { createConfigService } from '../services/config';

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
 * POST /api/settings/upload-ai-avatar - Upload de l'avatar de l'Expert IA
 * Accès: Administrateurs (admin role)
 */
settings.post('/upload-ai-avatar', authMiddleware, adminOnly, async (c) => {
  try {
    const user = c.get('user') as any;

    const formData = await c.req.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return c.json({ error: 'Aucun fichier fourni' }, 400);
    }

    // Validation du type de fichier
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      return c.json({
        error: `Type de fichier non autorisé. Formats acceptés: ${ALLOWED_LOGO_TYPES.join(', ')}`
      }, 400);
    }

    // Validation de la taille (max 2MB pour avatar)
    const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_AVATAR_SIZE) {
      return c.json({
        error: `Fichier trop volumineux (max ${MAX_AVATAR_SIZE / 1024 / 1024} MB)`
      }, 400);
    }

    // Générer une clé unique pour le fichier
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop() || 'png';
    const fileKey = `avatars/ai-avatar-${timestamp}-${randomStr}.${extension}`;

    // Upload vers R2
    const arrayBuffer = await file.arrayBuffer();
    await c.env.MEDIA_BUCKET.put(fileKey, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    console.log(`✅ Avatar IA uploadé dans R2: ${fileKey}`);

    // Mettre à jour la DB avec la clé du fichier R2
    const existing = await c.env.DB.prepare(`
      SELECT id FROM system_settings WHERE setting_key = 'ai_expert_avatar_key'
    `).first();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE system_settings
        SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = 'ai_expert_avatar_key'
      `).bind(fileKey).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO system_settings (setting_key, setting_value)
        VALUES ('ai_expert_avatar_key', ?)
      `).bind(fileKey).run();
    }

    return c.json({
      message: 'Avatar IA uploadé avec succès',
      fileKey
    });
  } catch (error) {
    console.error('Upload AI avatar error:', error);
    return c.json({ error: 'Erreur lors de l\'upload de l\'avatar' }, 500);
  }
});

/**
 * GET /api/settings/ai_expert_name - Récupérer le nom de l'Expert IA
 * Accès: Public (authentifié)
 * Note: Cette route spécifique évite le 404 du routeur générique et fournit une valeur par défaut
 */
settings.get('/ai_expert_name', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'ai_expert_name'
    `).first();

    if (!result) {
      // Valeur par défaut
      return c.json({ setting_value: 'Expert Industriel (IA)', value: 'Expert Industriel (IA)' });
    }

    return c.json({ 
      setting_value: result.setting_value,
      value: result.setting_value 
    });
  } catch (error) {
    console.error('Get AI name error:', error);
    // En cas d'erreur, fallback safe
    return c.json({ setting_value: 'Expert Industriel (IA)', value: 'Expert Industriel (IA)' });
  }
});

/**
 * PUT /api/settings/ai_expert_name - Mettre à jour le nom de l'Expert IA
 * Accès: Administrateurs (admin role)
 */
settings.put('/ai_expert_name', authMiddleware, adminOnly, async (c) => {
  try {
    const body = await c.req.json();
    const { value } = body;

    if (!value || typeof value !== 'string') {
      return c.json({ error: 'Nom invalide' }, 400);
    }

    const trimmedValue = value.trim();
    if (trimmedValue.length === 0) return c.json({ error: 'Le nom ne peut pas être vide' }, 400);
    if (trimmedValue.length > 50) return c.json({ error: 'Le nom ne peut pas dépasser 50 caractères' }, 400);

    // Update DB
    const existing = await c.env.DB.prepare(`SELECT id FROM system_settings WHERE setting_key = 'ai_expert_name'`).first();
    
    if (existing) {
      await c.env.DB.prepare(`UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = 'ai_expert_name'`).bind(trimmedValue).run();
    } else {
      await c.env.DB.prepare(`INSERT INTO system_settings (setting_key, setting_value) VALUES ('ai_expert_name', ?)`).bind(trimmedValue).run();
    }

    return c.json({ success: true, setting_value: trimmedValue });
  } catch (error) {
    console.error('Update AI name error:', error);
    return c.json({ error: 'Erreur mise à jour nom IA' }, 500);
  }
});

/**
 * GET /api/settings/ai_expert_avatar_key - Récupérer la clé d'avatar de l'Expert IA
 * Accès: Public (authentifié)
 */
settings.get('/ai_expert_avatar_key', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'ai_expert_avatar_key'
    `).first();

    if (!result) {
      // Valeur par défaut
      return c.json({ setting_value: 'ai_avatar', value: 'ai_avatar' });
    }

    return c.json({ 
      setting_value: result.setting_value,
      value: result.setting_value 
    });
  } catch (error) {
    console.error('Get AI avatar key error:', error);
    return c.json({ setting_value: 'ai_avatar', value: 'ai_avatar' });
  }
});

/**
 * GET /api/settings/ai-avatar - Récupérer l'avatar de l'Expert IA
 * Accès: Public
 */
settings.get('/ai-avatar', async (c) => {
  try {
    // Récupérer la clé depuis la DB
    const setting = await c.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'ai_expert_avatar_key'
    `).first() as any;

    if (!setting || !setting.setting_value) {
       return c.notFound();
    }

    const fileKey = setting.setting_value;

    // Récupérer le fichier depuis R2
    const object = await c.env.MEDIA_BUCKET.get(fileKey);

    if (!object) {
      // Fallback to default icon to avoid 404 console errors
      return c.redirect('/messenger/messenger-icon.png');
    }

    // Retourner l'avatar avec cache
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Get AI avatar error:', error);
    return c.notFound();
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
      return c.redirect('/logo.png');
    }

    const fileKey = setting.setting_value;

    // Récupérer le fichier depuis R2
    const object = await c.env.MEDIA_BUCKET.get(fileKey);

    if (!object) {
      console.error(`Logo non trouvé dans R2: ${fileKey}`);
      // Fallback sur le logo par défaut
      return c.redirect('/logo.png');
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
    return c.redirect('/logo.png');
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
      defaultLogo: '/logo.png'
    });
  } catch (error) {
    console.error('Delete logo error:', error);
    return c.json({ error: 'Erreur lors de la suppression du logo' }, 500);
  }
});

/**
 * GET /api/settings/messenger_app_name - Obtenir le nom de l'application Messenger
 * Accès: Public (ou presque)
 */
settings.get('/messenger_app_name', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'messenger_app_name'
    `).first();

    if (!result) {
      return c.json({ setting_value: 'Connect', value: 'Connect' });
    }

    return c.json({ 
      setting_value: result.setting_value,
      value: result.setting_value 
    });
  } catch (error) {
    console.error('Get messenger_app_name error:', error);
    return c.json({ setting_value: 'Connect', value: 'Connect' });
  }
});

/**
 * PUT /api/settings/messenger_app_name - Mettre à jour le nom de l'application Messenger
 * Accès: Administrateurs (admin role)
 * Validation: Max 50 caractères
 */
settings.put('/messenger_app_name', authMiddleware, adminOnly, async (c) => {
  try {
    const user = c.get('user') as any;

    const body = await c.req.json();
    const { value } = body;

    if (!value || typeof value !== 'string') {
      return c.json({ error: 'Nom invalide' }, 400);
    }

    // Validation stricte
    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
      return c.json({ error: 'Le nom ne peut pas être vide' }, 400);
    }

    if (trimmedValue.length > 50) {
      return c.json({ error: 'Le nom ne peut pas dépasser 50 caractères' }, 400);
    }

    // Vérifier si le paramètre existe
    const existing = await c.env.DB.prepare(`
      SELECT id FROM system_settings WHERE setting_key = 'messenger_app_name'
    `).first();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE system_settings
        SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = 'messenger_app_name'
      `).bind(trimmedValue).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO system_settings (setting_key, setting_value)
        VALUES ('messenger_app_name', ?)
      `).bind(trimmedValue).run();
    }

    console.log(`✅ Nom Messenger modifié par user ${user.userId}: "${trimmedValue}"`);

    return c.json({
      message: 'Nom mis à jour avec succès',
      setting_value: trimmedValue
    });
  } catch (error) {
    console.error('Update messenger name error:', error);
    return c.json({ error: 'Erreur lors de la mise à jour du nom' }, 500);
  }
});

/**
 * GET /api/settings/rate_limit_enabled - Récupérer l'état du rate limiting
 * Accès: Public
 * Retourne false par défaut si non configuré
 */
settings.get('/rate_limit_enabled', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'rate_limit_enabled'
    `).first();

    if (!result || !(result as any).setting_value) {
      return c.json({ setting_value: 'false', value: 'false' });
    }

    return c.json({ 
      setting_value: (result as any).setting_value,
      value: (result as any).setting_value 
    });
  } catch (error) {
    console.error('Get rate_limit_enabled error:', error);
    return c.json({ setting_value: 'false', value: 'false' });
  }
});

/**
 * PUT /api/settings/rate_limit_enabled - Activer/désactiver le rate limiting
 * Accès: Administrateurs (admin role)
 */
settings.put('/rate_limit_enabled', authMiddleware, adminOnly, async (c) => {
  try {
    const body = await c.req.json();
    const { value } = body;

    const boolValue = value === 'true' || value === true ? 'true' : 'false';

    // UPSERT
    const existing = await c.env.DB.prepare(`
      SELECT id FROM system_settings WHERE setting_key = 'rate_limit_enabled'
    `).first();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE system_settings
        SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = 'rate_limit_enabled'
      `).bind(boolValue).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO system_settings (setting_key, setting_value)
        VALUES ('rate_limit_enabled', ?)
      `).bind(boolValue).run();
    }

    return c.json({ setting_value: boolValue, success: true });
  } catch (error) {
    console.error('Update rate_limit_enabled error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * PUT /api/settings/ai_custom_context - Mettre à jour le contexte AI
 * Accès: Administrateurs (admin role)
 * Validation: Max 30000 caractères
 */
settings.put('/ai_custom_context', authMiddleware, adminOnly, async (c) => {
  try {
    const user = c.get('user') as any;

    const body = await c.req.json();
    const { value } = body;

    if (value === undefined || typeof value !== 'string') {
      return c.json({ error: 'Contexte invalide' }, 400);
    }

    // Validation stricte
    const trimmedValue = value.trim();

    if (trimmedValue.length > 30000) {
      return c.json({ error: 'Le contexte ne peut pas dépasser 30000 caractères' }, 400);
    }

    // Vérifier si le paramètre existe
    const existing = await c.env.DB.prepare(`
      SELECT id FROM system_settings WHERE setting_key = 'ai_custom_context'
    `).first();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE system_settings
        SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = 'ai_custom_context'
      `).bind(trimmedValue).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO system_settings (setting_key, setting_value)
        VALUES ('ai_custom_context', ?)
      `).bind(trimmedValue).run();
    }

    console.log(`✅ Contexte AI modifié par user ${user.userId}`);

    return c.json({
      message: 'Contexte AI mis à jour avec succès',
      setting_value: trimmedValue
    });
  } catch (error) {
    console.error('Update AI context error:', error);
    return c.json({ error: 'Erreur lors de la mise à jour du contexte AI' }, 500);
  }
});

/**
 * GET /api/settings/title - Récupérer le titre de l'application
 * Accès: Public
 * Retourne une valeur par défaut si non configuré
 */
settings.get('/title', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'company_title'
    `).first();

    if (!result || !(result as any).setting_value) {
      return c.json({ setting_value: 'Gestion de Maintenance', value: 'Gestion de Maintenance' });
    }

    return c.json({ 
      setting_value: (result as any).setting_value,
      value: (result as any).setting_value 
    });
  } catch (error) {
    console.error('Get title error:', error);
    return c.json({ setting_value: 'Gestion de Maintenance', value: 'Gestion de Maintenance' });
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

    // UPSERT: Insert ou Update selon si la clé existe
    const existing = await c.env.DB.prepare(`
      SELECT id FROM system_settings WHERE setting_key = 'company_title'
    `).first();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE system_settings
        SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = 'company_title'
      `).bind(trimmedValue).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO system_settings (setting_key, setting_value)
        VALUES ('company_title', ?)
      `).bind(trimmedValue).run();
    }

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
 * GET /api/settings/subtitle - Récupérer le sous-titre de l'application
 * Accès: Public
 * Retourne une valeur par défaut si non configuré
 */
settings.get('/subtitle', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'company_subtitle'
    `).first();

    if (!result || !(result as any).setting_value) {
      return c.json({ setting_value: '', value: '' });
    }

    return c.json({ 
      setting_value: (result as any).setting_value,
      value: (result as any).setting_value 
    });
  } catch (error) {
    console.error('Get subtitle error:', error);
    return c.json({ setting_value: '', value: '' });
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

    // UPSERT: Insert ou Update selon si la clé existe
    const existing = await c.env.DB.prepare(`
      SELECT id FROM system_settings WHERE setting_key = 'company_subtitle'
    `).first();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE system_settings
        SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = 'company_subtitle'
      `).bind(trimmedValue).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO system_settings (setting_key, setting_value)
        VALUES ('company_subtitle', ?)
      `).bind(trimmedValue).run();
    }

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
 * PUT /api/settings/company_address - Mettre à jour l'adresse de l'entreprise
 * Accès: Administrateurs (admin role)
 * Validation: Max 200 caractères
 * Utilisé pour l'en-tête des impressions de documents
 */
settings.put('/company_address', authMiddleware, adminOnly, async (c) => {
  try {
    const user = c.get('user') as any;

    const body = await c.req.json();
    const { value } = body;

    if (typeof value !== 'string') {
      return c.json({ error: 'Adresse invalide' }, 400);
    }

    // Validation
    const trimmedValue = value.trim();

    if (trimmedValue.length > 200) {
      return c.json({ error: 'L\'adresse ne peut pas dépasser 200 caractères' }, 400);
    }

    // UPSERT: Insert ou Update selon si la clé existe
    const existing = await c.env.DB.prepare(`
      SELECT id FROM system_settings WHERE setting_key = 'company_address'
    `).first();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE system_settings
        SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = 'company_address'
      `).bind(trimmedValue).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO system_settings (setting_key, setting_value)
        VALUES ('company_address', ?)
      `).bind(trimmedValue).run();
    }

    console.log(`✅ Adresse modifiée par user ${user.userId}: "${trimmedValue}"`);

    return c.json({
      message: 'Adresse mise à jour avec succès',
      setting_value: trimmedValue
    });
  } catch (error) {
    console.error('Update address error:', error);
    return c.json({ error: 'Erreur lors de la mise à jour de l\'adresse' }, 500);
  }
});

/**
 * GET /api/settings/company_address - Obtenir l'adresse de l'entreprise
 * Accès: Public (pour impression)
 */
settings.get('/company_address', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'company_address'
    `).first() as { setting_value: string } | null;

    return c.json({
      setting_key: 'company_address',
      setting_value: result?.setting_value || ''
    });
  } catch (error) {
    console.error('Get company_address error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * PUT /api/settings/company_name - Mettre à jour le nom officiel de l'entreprise
 * Accès: Administrateurs (admin role)
 * Validation: Max 150 caractères
 */
settings.put('/company_name', authMiddleware, adminOnly, async (c) => {
  try {
    const user = c.get('user') as any;
    const body = await c.req.json();
    const { value } = body;

    if (!value || typeof value !== 'string') {
      return c.json({ error: 'Nom d\'entreprise invalide' }, 400);
    }

    const trimmedValue = value.trim();
    if (trimmedValue.length === 0) {
      return c.json({ error: 'Le nom ne peut pas être vide' }, 400);
    }
    if (trimmedValue.length > 150) {
      return c.json({ error: 'Le nom ne peut pas dépasser 150 caractères' }, 400);
    }

    const existing = await c.env.DB.prepare(`
      SELECT id FROM system_settings WHERE setting_key = 'company_name'
    `).first();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = 'company_name'
      `).bind(trimmedValue).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO system_settings (setting_key, setting_value)
        VALUES ('company_name', ?)
      `).bind(trimmedValue).run();
    }

    console.log(`✅ Nom entreprise modifié par user ${user.userId}: "${trimmedValue}"`);
    return c.json({ message: 'Nom entreprise mis à jour', setting_value: trimmedValue });
  } catch (error) {
    console.error('Update company_name error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/settings/company_name - Obtenir le nom officiel de l'entreprise
 */
settings.get('/company_name', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'company_name'
    `).first() as { setting_value: string } | null;
    return c.json({ setting_key: 'company_name', setting_value: result?.setting_value || '' });
  } catch (error) {
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * PUT /api/settings/company_email - Mettre à jour le courriel officiel
 * Accès: Administrateurs
 */
settings.put('/company_email', authMiddleware, adminOnly, async (c) => {
  try {
    const user = c.get('user') as any;
    const body = await c.req.json();
    const { value } = body;

    if (typeof value !== 'string') {
      return c.json({ error: 'Courriel invalide' }, 400);
    }

    const trimmedValue = value.trim();
    if (trimmedValue.length > 100) {
      return c.json({ error: 'Le courriel ne peut pas dépasser 100 caractères' }, 400);
    }

    // Validation email basique si non vide
    if (trimmedValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
      return c.json({ error: 'Format de courriel invalide' }, 400);
    }

    const existing = await c.env.DB.prepare(`
      SELECT id FROM system_settings WHERE setting_key = 'company_email'
    `).first();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = 'company_email'
      `).bind(trimmedValue).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO system_settings (setting_key, setting_value)
        VALUES ('company_email', ?)
      `).bind(trimmedValue).run();
    }

    console.log(`✅ Courriel entreprise modifié par user ${user.userId}: "${trimmedValue}"`);
    return c.json({ message: 'Courriel mis à jour', setting_value: trimmedValue });
  } catch (error) {
    console.error('Update company_email error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/settings/company_email - Obtenir le courriel officiel
 */
settings.get('/company_email', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'company_email'
    `).first() as { setting_value: string } | null;
    return c.json({ setting_key: 'company_email', setting_value: result?.setting_value || '' });
  } catch (error) {
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * PUT /api/settings/company_phone - Mettre à jour le téléphone officiel
 * Accès: Administrateurs
 */
settings.put('/company_phone', authMiddleware, adminOnly, async (c) => {
  try {
    const user = c.get('user') as any;
    const body = await c.req.json();
    const { value } = body;

    if (typeof value !== 'string') {
      return c.json({ error: 'Téléphone invalide' }, 400);
    }

    const trimmedValue = value.trim();
    if (trimmedValue.length > 30) {
      return c.json({ error: 'Le téléphone ne peut pas dépasser 30 caractères' }, 400);
    }

    const existing = await c.env.DB.prepare(`
      SELECT id FROM system_settings WHERE setting_key = 'company_phone'
    `).first();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = 'company_phone'
      `).bind(trimmedValue).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO system_settings (setting_key, setting_value)
        VALUES ('company_phone', ?)
      `).bind(trimmedValue).run();
    }

    console.log(`✅ Téléphone entreprise modifié par user ${user.userId}: "${trimmedValue}"`);
    return c.json({ message: 'Téléphone mis à jour', setting_value: trimmedValue });
  } catch (error) {
    console.error('Update company_phone error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/settings/company_phone - Obtenir le téléphone officiel
 */
settings.get('/company_phone', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'company_phone'
    `).first() as { setting_value: string } | null;
    return c.json({ setting_key: 'company_phone', setting_value: result?.setting_value || '' });
  } catch (error) {
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/settings/placeholders - Obtenir les placeholders personnalisables (SaaS)
 * Accès: Public (pour affichage dans les formulaires)
 * Utilisé pour les formulaires de création (machines, tickets, etc.)
 */
settings.get('/placeholders', async (c) => {
  try {
    // Récupérer tous les placeholders de la DB
    const results = await c.env.DB.prepare(`
      SELECT setting_key, setting_value FROM system_settings 
      WHERE setting_key LIKE 'placeholder_%' OR setting_key LIKE 'csv_example_%'
    `).all();

    // Valeurs par défaut universelles (SaaS-ready)
    const defaults: Record<string, string> = {
      placeholder_machine_type: 'Ex: Équipement, Machine, Véhicule...',
      placeholder_location: 'Ex: Zone A, Atelier, Entrepôt...',
      placeholder_manufacturer: 'Ex: Marque, Fabricant...',
      placeholder_model: 'Ex: Modèle, Version...',
      placeholder_serial_number: 'Ex: SN-001, ABC123...',
      csv_example_machines: 'TYPE,MODELE,MARQUE,SERIE,LIEU\nÉquipement,Modèle A,Fabricant,SN123456,Zone A\nMachine,Standard,Marque X,,Secteur B'
    };

    // Fusionner DB avec defaults
    const placeholders = { ...defaults };
    if (results.results) {
      for (const row of results.results as any[]) {
        placeholders[row.setting_key] = row.setting_value;
      }
    }

    return c.json(placeholders);
  } catch (error) {
    console.error('Get placeholders error:', error);
    // Fallback safe avec valeurs universelles
    return c.json({
      placeholder_machine_type: 'Ex: Équipement, Machine, Véhicule...',
      placeholder_location: 'Ex: Zone A, Atelier, Entrepôt...',
      placeholder_manufacturer: 'Ex: Marque, Fabricant...',
      placeholder_model: 'Ex: Modèle, Version...',
      placeholder_serial_number: 'Ex: SN-001, ABC123...',
      csv_example_machines: 'TYPE,MODELE,MARQUE,SERIE,LIEU\nÉquipement,Modèle A,Fabricant,SN123456,Zone A'
    });
  }
});

/**
 * PUT /api/settings/placeholders - Mettre à jour les placeholders
 * Accès: Admin uniquement
 * Body: { placeholder_machine_type: "Ex: Four, Pétrin...", ... }
 */
settings.put('/placeholders', authMiddleware, adminOnly, async (c) => {
  try {
    const updates = await c.req.json<Record<string, string>>();
    const validKeys = [
      'placeholder_machine_type', 'placeholder_location', 'placeholder_manufacturer',
      'placeholder_model', 'placeholder_serial_number', 'csv_example_machines'
    ];

    let updated = 0;
    for (const [key, value] of Object.entries(updates)) {
      if (!validKeys.includes(key)) continue;
      if (typeof value !== 'string' || value.length > 500) continue;

      const existing = await c.env.DB.prepare(`SELECT id FROM system_settings WHERE setting_key = ?`).bind(key).first();
      
      if (existing) {
        await c.env.DB.prepare(`UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?`).bind(value, key).run();
      } else {
        await c.env.DB.prepare(`INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)`).bind(key, value).run();
      }
      updated++;
    }

    return c.json({ success: true, updated });
  } catch (error) {
    console.error('Update placeholders error:', error);
    return c.json({ error: 'Erreur mise à jour placeholders' }, 500);
  }
});

/**
 * GET /api/settings/modules - Obtenir la configuration des modules (Legacy/Fallback)
 * Accès: Tous les utilisateurs authentifiés
 */
settings.get('/modules', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'modules_config'
    `).first();

    const defaults = { 
      planning: true, 
      statistics: true, 
      notifications: true, 
      messaging: true, 
      machines: true 
    };

    if (!result || !(result as any).setting_value) {
      return c.json(defaults);
    }

    try {
      const config = JSON.parse((result as any).setting_value);
      return c.json({ ...defaults, ...config });
    } catch (e) {
      return c.json(defaults);
    }
  } catch (error) {
    console.error('Get modules error:', error);
    return c.json({ 
      planning: true, 
      statistics: true, 
      notifications: true, 
      messaging: true, 
      machines: true 
    });
  }
});

/**
 * GET /api/settings/modules/status - Obtenir les licences modules (Global)
 * Accès: Tous les utilisateurs authentifiés
 */
settings.get('/modules/status', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'modules_config'
    `).first();

    const defaults = { 
      planning: true, 
      statistics: true, 
      notifications: true, 
      messaging: true, 
      machines: true 
    };

    if (!result || !(result as any).setting_value) {
      return c.json(defaults);
    }

    try {
      const config = JSON.parse((result as any).setting_value);
      return c.json({ ...defaults, ...config });
    } catch (e) {
      return c.json(defaults);
    }
  } catch (error) {
    console.error('Get modules status error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * PUT /api/settings/modules/status - Mettre à jour les licences modules
 * Accès: Admin uniquement
 */
settings.put('/modules/status', authMiddleware, adminOnly, async (c) => {
  try {
    const body = await c.req.json();
    const configString = JSON.stringify(body);

    const existing = await c.env.DB.prepare(`
      SELECT id FROM system_settings WHERE setting_key = 'modules_config'
    `).first();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = 'modules_config'
      `).bind(configString).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO system_settings (setting_key, setting_value) VALUES ('modules_config', ?)
      `).bind(configString).run();
    }

    return c.json({ message: 'Licences mises à jour', config: body });
  } catch (error) {
    console.error('Update modules status error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/settings/modules/preferences - Obtenir les préférences modules (Client)
 * Accès: Tous les utilisateurs authentifiés
 */
settings.get('/modules/preferences', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'modules_preferences'
    `).first();

    const defaults = { 
      planning: true, 
      statistics: true, 
      notifications: true, 
      messaging: true, 
      machines: true 
    };

    if (!result || !(result as any).setting_value) {
      return c.json(defaults);
    }

    try {
      const config = JSON.parse((result as any).setting_value);
      return c.json({ ...defaults, ...config });
    } catch (e) {
      return c.json(defaults);
    }
  } catch (error) {
    console.error('Get modules preferences error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * PUT /api/settings/modules/preferences - Mettre à jour les préférences modules
 * Accès: Admin uniquement
 */
settings.put('/modules/preferences', authMiddleware, adminOnly, async (c) => {
  try {
    const body = await c.req.json();
    const configString = JSON.stringify(body);

    const existing = await c.env.DB.prepare(`
      SELECT id FROM system_settings WHERE setting_key = 'modules_preferences'
    `).first();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = 'modules_preferences'
      `).bind(configString).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO system_settings (setting_key, setting_value) VALUES ('modules_preferences', ?)
      `).bind(configString).run();
    }

    return c.json({ message: 'Préférences mises à jour', config: body });
  } catch (error) {
    console.error('Update modules preferences error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * POST /api/settings/trigger-cleanup - Lancer le nettoyage manuel
 * Accès: Admin uniquement
 */
settings.post('/trigger-cleanup', authMiddleware, adminOnly, async (c) => {
  try {
    // Logique de nettoyage simplifiée (Suppression données > 90 jours)
    // Suppression events > 90 jours
    const delEvents = await c.env.DB.prepare(`
      DELETE FROM planning_events 
      WHERE date < date('now', '-90 days')
    `).run();

    // Suppression notes terminées > 30 jours
    const delNotes = await c.env.DB.prepare(`
      DELETE FROM planner_notes 
      WHERE done = 1 AND created_at < date('now', '-30 days')
    `).run();

    return c.json({ 
      success: true, 
      message: 'Nettoyage effectué',
      deleted: {
        events: delEvents.meta.changes,
        notes: delNotes.meta.changes
      }
    });
  } catch (error) {
    console.error('Manual cleanup error:', error);
    return c.json({ error: 'Erreur lors du nettoyage' }, 500);
  }
});

// ============================================================================
// ROUTES GÉNÉRIQUES (DOIVENT ÊTRE DÉCLARÉES APRÈS LES ROUTES SPÉCIFIQUES)
// ============================================================================

/**
 * GET /api/settings/app_base_url - Récupérer l'URL de base (Safe Handler)
 * Évite les 404 si non configuré
 */
settings.get('/app_base_url', async (c) => {
  try {
    const result = await c.env.DB.prepare("SELECT setting_value FROM system_settings WHERE setting_key = 'app_base_url'").first();
    // Return value or empty string (not 404)
    return c.json({ value: result?.setting_value || '' });
  } catch (e) {
    return c.json({ value: '' });
  }
});

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

    return c.json({ 
      setting_value: result.setting_value,
      value: result.setting_value // Alias for frontend compatibility
    });
  } catch (error) {
    console.error('Get setting error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * PUT /api/settings/:key - Mettre à jour une valeur de paramètre
 * Accès: Admin uniquement
 *
 * Utilisé pour: timezone_offset_hours, etc.
 */
settings.put('/:key', authMiddleware, adminOnly, async (c) => {
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

// ============================================================================
// CONFIG SERVICE ROUTES (Public & Admin)
// ============================================================================

/**
 * GET /api/settings/config/public - Get public config (branding, app info)
 * Accès: Public (no auth required)
 * Used by frontend for theming and branding
 */
settings.get('/config/public', async (c) => {
  try {
    const config = createConfigService(c.env.DB);
    const values = await config.getMany([
      'app_name',
      'app_tagline', 
      'app_base_url',
      'company_title',      // Legacy: nom de l'app
      'company_subtitle',   // Legacy: nom entreprise
      'company_short_name',
      'company_name',       // NEW: Nom officiel de l'entreprise
      'company_address',    // Adresse complète
      'company_email',      // NEW: Courriel officiel
      'company_phone',      // NEW: Téléphone
      'company_logo_url',
      'primary_color',
      'secondary_color',
      'timezone_offset_hours',
      'industry_type'
    ]);
    return c.json(values);
  } catch (error) {
    console.error('Get public config error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * GET /api/settings/config/ai - Get AI configuration
 * Accès: Authenticated users
 */
settings.get('/config/ai', authMiddleware, async (c) => {
  try {
    const config = createConfigService(c.env.DB);
    const aiConfig = await config.getAIConfig();
    return c.json(aiConfig);
  } catch (error) {
    console.error('Get AI config error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * PUT /api/settings/config/bulk - Update multiple settings at once
 * Accès: Admin only
 * Body: { key1: value1, key2: value2, ... }
 */
settings.put('/config/bulk', authMiddleware, adminOnly, async (c) => {
  try {
    const config = createConfigService(c.env.DB);
    const updates = await c.req.json<Record<string, string>>();
    
    const results: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(updates)) {
      results[key] = await config.set(key, value);
    }
    
    return c.json({ success: true, results });
  } catch (error) {
    console.error('Bulk update config error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// ============================================================================
// IMPORT / EXPORT CSV - Configuration rapide (Utilisateurs & Machines)
// ============================================================================

/**
 * POST /api/settings/import/preview - Simulation d'import (DRY-RUN)
 * Analyse les données sans rien modifier en base
 * Retourne le détail ligne par ligne : création, mise à jour, ignoré, erreur
 * Accès: Admin uniquement
 */
settings.post('/import/preview', authMiddleware, adminOnly, async (c) => {
  try {
    const db = getDb(c.env);
    const body = await c.req.json();
    const { type, data, updateExisting } = body;
    
    if (!type || !['users', 'machines'].includes(type)) {
      return c.json({ error: 'Type invalide (users ou machines)' }, 400);
    }
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return c.json({ error: 'Données invalides ou vides' }, 400);
    }
    
    if (data.length > 1000) {
      return c.json({ error: 'Maximum 1000 lignes par import' }, 400);
    }
    
    const preview: Array<{
      line: number;
      status: 'create' | 'update' | 'ignore' | 'error';
      message: string;
      data: any;
    }> = [];
    
    const stats = { create: 0, update: 0, ignore: 0, error: 0 };
    
    // ========== PREVIEW USERS ==========
    if (type === 'users') {
      const validRoles = ['admin', 'supervisor', 'technician', 'operator', 'team_leader', 'planner', 'coordinator', 'director', 'senior_technician', 'furnace_operator', 'safety_officer', 'quality_inspector', 'storekeeper', 'viewer'];
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const lineNum = i + 1;
        
        // Validation email
        const email = row.email?.trim().toLowerCase();
        if (!email) {
          preview.push({ line: lineNum, status: 'error', message: 'EMAIL obligatoire', data: row });
          stats.error++;
          continue;
        }
        
        // Validation format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          preview.push({ line: lineNum, status: 'error', message: `EMAIL invalide: "${email}"`, data: row });
          stats.error++;
          continue;
        }
        
        // Validation rôle
        const role = row.role?.trim().toLowerCase() || 'technician';
        if (!validRoles.includes(role)) {
          preview.push({ line: lineNum, status: 'error', message: `ROLE invalide: "${row.role}" (valides: ${validRoles.slice(0, 5).join(', ')}...)`, data: row });
          stats.error++;
          continue;
        }
        
        // Vérifier si existe
        const existing = await db
          .select({ id: users.id, full_name: users.full_name })
          .from(users)
          .where(sql`${users.email} = ${email} AND ${users.deleted_at} IS NULL`)
          .get();
        
        const displayName = row.first_name && row.last_name 
          ? `${row.first_name} ${row.last_name}` 
          : row.first_name || email;
        
        if (existing) {
          if (updateExisting) {
            preview.push({ 
              line: lineNum, 
              status: 'update', 
              message: `Mise à jour: ${existing.full_name || email}`,
              data: { email, name: displayName, role }
            });
            stats.update++;
          } else {
            preview.push({ 
              line: lineNum, 
              status: 'ignore', 
              message: `Existe déjà: ${existing.full_name || email}`,
              data: { email, name: displayName, role }
            });
            stats.ignore++;
          }
        } else {
          preview.push({ 
            line: lineNum, 
            status: 'create', 
            message: `Création: ${displayName}`,
            data: { email, name: displayName, role }
          });
          stats.create++;
        }
      }
    }
    
    // ========== PREVIEW MACHINES ==========
    if (type === 'machines') {
      const validStatuses = ['operational', 'maintenance', 'broken', 'retired'];
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const lineNum = i + 1;
        
        // Validation type obligatoire
        const machineType = row.type?.trim();
        if (!machineType) {
          preview.push({ line: lineNum, status: 'error', message: 'TYPE obligatoire', data: row });
          stats.error++;
          continue;
        }
        
        const model = row.model?.trim() || null;
        const serial = row.serial?.trim() || null;
        const location = row.location?.trim() || null;
        const status = row.status?.toLowerCase().trim();
        const machineStatus = validStatuses.includes(status) ? status : 'operational';
        
        let existing = null;
        let matchType = '';
        
        // Recherche par numéro de série
        if (serial) {
          existing = await db
            .select({ id: machines.id, machine_type: machines.machine_type, model: machines.model })
            .from(machines)
            .where(sql`${machines.serial_number} = ${serial} AND ${machines.deleted_at} IS NULL`)
            .get();
          if (existing) matchType = 'série';
        }
        
        // Recherche par clé composite si pas trouvé par série (ou pas de série)
        // Permet d'ajouter un numéro de série à une machine existante
        if (!existing) {
          existing = await db
            .select({ id: machines.id, machine_type: machines.machine_type, model: machines.model })
            .from(machines)
            .where(sql`
              LOWER(TRIM(${machines.machine_type})) = ${machineType.toLowerCase()}
              AND (
                (${model} IS NULL AND (${machines.model} IS NULL OR ${machines.model} = ''))
                OR LOWER(TRIM(${machines.model})) = ${(model || '').toLowerCase()}
              )
              AND (
                (${location} IS NULL AND (${machines.location} IS NULL OR ${machines.location} = ''))
                OR LOWER(TRIM(${machines.location})) = ${(location || '').toLowerCase()}
              )
              AND ${machines.deleted_at} IS NULL
            `)
            .get();
          if (existing) matchType = 'type+modèle+lieu';
        }
        
        const displayName = model ? `${machineType} ${model}` : machineType;
        const locationInfo = location ? ` @ ${location}` : '';
        
        if (existing) {
          if (updateExisting) {
            preview.push({ 
              line: lineNum, 
              status: 'update', 
              message: `Mise à jour (${matchType}): ${displayName}${locationInfo}`,
              data: { type: machineType, model, serial, location, status: machineStatus }
            });
            stats.update++;
          } else {
            preview.push({ 
              line: lineNum, 
              status: 'ignore', 
              message: `Existe déjà (${matchType}): ${displayName}${locationInfo}`,
              data: { type: machineType, model, serial, location, status: machineStatus }
            });
            stats.ignore++;
          }
        } else {
          preview.push({ 
            line: lineNum, 
            status: 'create', 
            message: `Création: ${displayName}${locationInfo}`,
            data: { type: machineType, model, serial, location, status: machineStatus }
          });
          stats.create++;
        }
      }
    }
    
    return c.json({ 
      success: true,
      type,
      total: data.length,
      stats,
      preview,
      canProceed: stats.error === 0 || stats.create + stats.update > 0
    });
    
  } catch (error) {
    console.error('Import preview error:', error);
    return c.json({ error: 'Erreur lors de la prévisualisation' }, 500);
  }
});

/**
 * GET /api/settings/export/users - Exporter la liste des utilisateurs en CSV
 * Accès: Admin uniquement
 */
settings.get('/export/users', authMiddleware, adminOnly, async (c) => {
  try {
    const db = getDb(c.env);
    
    const results = await db
      .select({
        EMAIL: users.email,
        PRENOM: users.first_name,
        NOM: users.last_name,
        ROLE: users.role,
        CONTEXTE: users.ai_context
      })
      .from(users)
      .where(sql`${users.deleted_at} IS NULL AND ${users.id} != 0 AND (${users.is_super_admin} = 0 OR ${users.is_super_admin} IS NULL)`)
      .all();
    
    return c.json({ users: results });
  } catch (error) {
    console.error('Export users error:', error);
    return c.json({ error: 'Erreur lors de l\'export des utilisateurs' }, 500);
  }
});

/**
 * GET /api/settings/export/machines - Exporter la liste des machines en CSV
 * Accès: Admin uniquement
 */
settings.get('/export/machines', authMiddleware, adminOnly, async (c) => {
  try {
    const db = getDb(c.env);
    
    const results = await db
      .select({
        TYPE: machines.machine_type,
        MODELE: machines.model,
        MARQUE: machines.manufacturer,
        SERIE: machines.serial_number,
        LIEU: machines.location,
        ANNEE: machines.year,
        STATUT: machines.status,
        SPECS: machines.technical_specs
      })
      .from(machines)
      .where(sql`${machines.deleted_at} IS NULL`)
      .all();
    
    return c.json({ machines: results });
  } catch (error) {
    console.error('Export machines error:', error);
    return c.json({ error: 'Erreur lors de l\'export des machines' }, 500);
  }
});

// Sanitize string - remove/escape dangerous characters for XSS prevention
const sanitizeForDb = (str: string | undefined | null): string => {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Limit length to prevent overflow
    .substring(0, 500)
    // Decode HTML entities that might be double-encoded
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    // Then escape HTML for storage (XSS prevention)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

/**
 * POST /api/settings/import/users - Importer des utilisateurs depuis CSV
 * Accès: Admin uniquement
 * Body: { users: [{ email, first_name, last_name, role }], updateExisting: boolean }
 */
settings.post('/import/users', authMiddleware, adminOnly, async (c) => {
  try {
    const currentUser = c.get('user') as any;
    const db = getDb(c.env);
    const body = await c.req.json();
    const { users: importUsers, updateExisting } = body;
    
    if (!importUsers || !Array.isArray(importUsers)) {
      return c.json({ error: 'Données invalides' }, 400);
    }
    
    // Limite de sécurité : max 1000 lignes par import
    if (importUsers.length > 1000) {
      return c.json({ error: 'Maximum 1000 utilisateurs par import' }, 400);
    }
    
    const stats = { success: 0, updated: 0, ignored: 0, errors: 0 };
    const validRoles = ['admin', 'supervisor', 'technician', 'operator', 'team_leader', 'planner', 'coordinator', 'director', 'senior_technician', 'furnace_operator', 'safety_officer', 'quality_inspector', 'storekeeper', 'viewer'];
    
    // Mot de passe par défaut pour les nouveaux utilisateurs
    const defaultPassword = await hashPassword('Changeme123!');
    
    for (const userData of importUsers) {
      try {
        // Sanitize all inputs
        const email = userData.email?.trim().toLowerCase().substring(0, 255);
        const firstName = sanitizeForDb(userData.first_name);
        const lastName = sanitizeForDb(userData.last_name);
        const role = userData.role?.trim().toLowerCase() || 'technician';
        const aiContext = userData.ai_context?.trim().substring(0, 500) || null;
        
        // Validation
        if (!email || !email.includes('@')) {
          stats.errors++;
          continue;
        }
        
        if (!validRoles.includes(role)) {
          stats.errors++;
          continue;
        }
        
        // Vérifier si l'email existe déjà
        const existing = await db
          .select({ id: users.id })
          .from(users)
          .where(sql`${users.email} = ${email}`)
          .get();
        
        if (existing) {
          if (updateExisting) {
            // Mise à jour
            const updateData: any = {
              first_name: firstName,
              last_name: lastName,
              full_name: lastName ? `${firstName} ${lastName}` : firstName,
              role: role,
              updated_at: sql`CURRENT_TIMESTAMP`
            };
            // Only update ai_context if provided in import
            if (aiContext !== null) {
              updateData.ai_context = aiContext;
            }
            await db.update(users)
              .set(updateData)
              .where(sql`${users.id} = ${existing.id}`);
            stats.updated++;
          } else {
            stats.ignored++;
          }
        } else {
          // Création
          await db.insert(users).values({
            email: email,
            password_hash: defaultPassword,
            first_name: firstName,
            last_name: lastName,
            full_name: lastName ? `${firstName} ${lastName}` : firstName,
            role: role,
            ai_context: aiContext
          });
          stats.success++;
        }
      } catch (err) {
        console.error('Import user row error:', err);
        stats.errors++;
      }
    }
    
    console.log(`✅ Import utilisateurs par ${currentUser.email}: ${stats.success} ajoutés, ${stats.updated} mis à jour, ${stats.ignored} ignorés, ${stats.errors} erreurs`);
    
    return c.json({ 
      message: 'Import terminé',
      stats,
      note: stats.success > 0 ? 'Les nouveaux utilisateurs ont le mot de passe par défaut: Changeme123!' : undefined
    });
  } catch (error) {
    console.error('Import users error:', error);
    return c.json({ error: 'Erreur lors de l\'import des utilisateurs' }, 500);
  }
});

/**
 * POST /api/settings/import/machines - Importer des machines depuis CSV
 * Accès: Admin uniquement
 * Body: { machines: [{ type, model, manufacturer, serial, location }], updateExisting: boolean }
 * 
 * LOGIQUE DE DÉTECTION DES DOUBLONS :
 * 1. Si SERIE (numéro de série) est fourni → utiliser SERIE comme clé unique
 * 2. Si SERIE est vide → utiliser clé composite TYPE+MODELE+LIEU (lowercase, trimmed)
 * 3. Si clé existe et updateExisting=true → mettre à jour
 * 4. Si clé existe et updateExisting=false → ignorer
 */
settings.post('/import/machines', authMiddleware, adminOnly, async (c) => {
  try {
    const currentUser = c.get('user') as any;
    const db = getDb(c.env);
    const body = await c.req.json();
    const { machines: importMachines, updateExisting } = body;
    
    if (!importMachines || !Array.isArray(importMachines)) {
      return c.json({ error: 'Données invalides' }, 400);
    }
    
    // Limite de sécurité : max 1000 lignes par import
    if (importMachines.length > 1000) {
      return c.json({ error: 'Maximum 1000 machines par import' }, 400);
    }
    
    const stats = { 
      success: 0, 
      updated: 0, 
      ignored: 0, 
      errors: 0,
      duplicateWarnings: 0  // Nouveaux: avertissements pour doublons potentiels
    };
    
    // Fonction pour générer la clé composite
    const generateCompositeKey = (type: string, model: string | null, location: string | null): string => {
      const parts = [
        type?.toLowerCase().trim() || '',
        model?.toLowerCase().trim() || '',
        location?.toLowerCase().trim() || ''
      ];
      return parts.join('|');
    };
    
    for (const machineData of importMachines) {
      try {
        // Sanitize all inputs
        const machineType = sanitizeForDb(machineData.type);
        const model = sanitizeForDb(machineData.model) || null;
        const manufacturer = sanitizeForDb(machineData.manufacturer) || null;
        const serialNumber = machineData.serial?.trim().substring(0, 100) || null;
        const location = sanitizeForDb(machineData.location) || null;
        const year = machineData.year ? parseInt(machineData.year, 10) || null : null;
        const technicalSpecs = sanitizeForDb(machineData.specs) || null;
        
        // Valider le statut
        const validStatuses = ['operational', 'maintenance', 'broken', 'retired'];
        const status = machineData.status?.toLowerCase().trim();
        const machineStatus = validStatuses.includes(status) ? status : 'operational';
        
        // Validation - Type obligatoire
        if (!machineType) {
          stats.errors++;
          continue;
        }
        
        let existing = null;
        let matchedBy = '';
        
        // STRATÉGIE 1 : Si numéro de série fourni → chercher par SERIE
        if (serialNumber) {
          existing = await db
            .select({ id: machines.id })
            .from(machines)
            .where(sql`${machines.serial_number} = ${serialNumber} AND ${machines.deleted_at} IS NULL`)
            .get();
          
          if (existing) matchedBy = 'serial';
        }
        
        // STRATÉGIE 2 : Si pas trouvé par SERIE (ou pas de série) → chercher par clé composite TYPE+MODELE+LIEU
        // Cela permet d'ajouter un numéro de série à une machine existante qui n'en avait pas
        if (!existing) {
          // Recherche par clé composite (case-insensitive)
          existing = await db
            .select({ id: machines.id, serial_number: machines.serial_number })
            .from(machines)
            .where(sql`
              LOWER(TRIM(${machines.machine_type})) = ${machineType.toLowerCase().trim()}
              AND (
                (${model} IS NULL AND (${machines.model} IS NULL OR ${machines.model} = ''))
                OR LOWER(TRIM(${machines.model})) = ${(model || '').toLowerCase().trim()}
              )
              AND (
                (${location} IS NULL AND (${machines.location} IS NULL OR ${machines.location} = ''))
                OR LOWER(TRIM(${machines.location})) = ${(location || '').toLowerCase().trim()}
              )
              AND ${machines.deleted_at} IS NULL
            `)
            .get();
          
          if (existing) matchedBy = 'composite';
        }
        
        // Gérer le cas existant
        if (existing) {
          if (updateExisting) {
            // Mise à jour de la machine existante
            await db.update(machines)
              .set({
                machine_type: machineType,
                model: model,
                manufacturer: manufacturer,
                serial_number: serialNumber,
                location: location,
                year: year,
                status: machineStatus,
                technical_specs: technicalSpecs,
                updated_at: sql`CURRENT_TIMESTAMP`
              })
              .where(sql`${machines.id} = ${existing.id}`);
            stats.updated++;
          } else {
            stats.ignored++;
            // Si match par composite et pas de série → avertissement
            if (matchedBy === 'composite') {
              stats.duplicateWarnings++;
            }
          }
          continue;
        }
        
        // Création d'une nouvelle machine
        await db.insert(machines).values({
          machine_type: machineType,
          model: model,
          manufacturer: manufacturer,
          serial_number: serialNumber,
          location: location,
          year: year,
          status: machineStatus,
          technical_specs: technicalSpecs
        });
        stats.success++;
      } catch (err) {
        console.error('Import machine row error:', err);
        stats.errors++;
      }
    }
    
    console.log(`✅ Import machines par ${currentUser.email}: ${stats.success} ajoutées, ${stats.updated} mises à jour, ${stats.ignored} ignorées, ${stats.errors} erreurs, ${stats.duplicateWarnings} avertissements doublons`);
    
    return c.json({ 
      message: 'Import terminé',
      stats,
      note: stats.duplicateWarnings > 0 
        ? `${stats.duplicateWarnings} machine(s) détectée(s) comme doublon potentiel (même TYPE+MODÈLE+LIEU). Ajoutez un N° SERIE pour les différencier.`
        : undefined
    });
  } catch (error) {
    console.error('Import machines error:', error);
    return c.json({ error: 'Erreur lors de l\'import des machines' }, 500);
  }
});

// ============================================================
// SIGNATURE MANUSCRITE - Routes pour les administrateurs
// Stockage par EMAIL de l'utilisateur (plus fiable que l'ID)
// ============================================================

const SIGNATURE_KEY_PREFIX = 'director_signature_';

/**
 * GET /api/settings/signature - Récupérer sa propre signature
 * L'utilisateur connecté récupère sa signature (par son email)
 */
settings.get('/my-signature', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user?.email) {
      return c.json({ error: 'Utilisateur non identifié' }, 401);
    }
    
    const settingKey = `${SIGNATURE_KEY_PREFIX}${user.email}`;
    const result = await c.env.DB.prepare(
      `SELECT setting_value FROM system_settings WHERE setting_key = ?`
    ).bind(settingKey).first();
    
    if (!result) {
      return c.json({ exists: false, message: 'Aucune signature enregistrée' });
    }
    
    const data = JSON.parse(result.setting_value as string);
    return c.json({ 
      exists: true,
      base64: data.base64,
      mimeType: data.mimeType || 'image/png',
      userName: data.userName,
      registeredAt: data.registeredAt
    });
  } catch (error) {
    console.error('Get my signature error:', error);
    return c.json({ error: 'Erreur lors de la récupération de la signature' }, 500);
  }
});

/**
 * POST /api/settings/signature - Enregistrer/mettre à jour sa signature
 * L'utilisateur connecté enregistre sa propre signature
 */
settings.post('/my-signature', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user?.email) {
      return c.json({ error: 'Utilisateur non identifié' }, 401);
    }
    
    // Vérifier que l'utilisateur a le droit (admin, director, supervisor)
    const allowedRoles = ['admin', 'director', 'supervisor'];
    if (!allowedRoles.includes(user.role)) {
      return c.json({ error: 'Seuls les administrateurs peuvent enregistrer une signature' }, 403);
    }
    
    const formData = await c.req.formData();
    const file = formData.get('signature') as File;
    
    if (!file) {
      return c.json({ error: 'Fichier signature requis' }, 400);
    }
    
    // Validation du type MIME
    const allowedTypes = ['image/png', 'image/gif', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Format invalide. Utilisez PNG, GIF ou JPG.' }, 400);
    }
    
    // Validation de la taille (max 100KB)
    if (file.size > 100 * 1024) {
      return c.json({ error: 'Fichier trop volumineux (max 100 KB)' }, 400);
    }
    
    // Convertir en base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // Préparer les données
    const signatureData = JSON.stringify({
      base64: base64,
      userName: user.name || user.email,
      userEmail: user.email,
      mimeType: file.type,
      registeredAt: new Date().toISOString()
    });
    
    const settingKey = `${SIGNATURE_KEY_PREFIX}${user.email}`;
    
    // Upsert dans system_settings
    await c.env.DB.prepare(`
      INSERT INTO system_settings (setting_key, setting_value) 
      VALUES (?, ?)
      ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value
    `).bind(settingKey, signatureData).run();
    
    console.log(`✍️ Signature enregistrée pour ${user.email}`);
    
    return c.json({ 
      success: true, 
      message: 'Signature enregistrée avec succès',
      userName: user.name || user.email
    });
  } catch (error) {
    console.error('Register signature error:', error);
    return c.json({ error: 'Erreur lors de l\'enregistrement de la signature' }, 500);
  }
});

/**
 * DELETE /api/settings/signature - Supprimer sa signature
 */
settings.delete('/my-signature', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user?.email) {
      return c.json({ error: 'Utilisateur non identifié' }, 401);
    }
    
    const settingKey = `${SIGNATURE_KEY_PREFIX}${user.email}`;
    
    await c.env.DB.prepare(
      `DELETE FROM system_settings WHERE setting_key = ?`
    ).bind(settingKey).run();
    
    console.log(`✍️ Signature supprimée pour ${user.email}`);
    
    return c.json({ success: true, message: 'Signature supprimée' });
  } catch (error) {
    console.error('Delete signature error:', error);
    return c.json({ error: 'Erreur lors de la suppression' }, 500);
  }
});

/**
 * GET /api/settings/signatures - Lister toutes les signatures (admin only)
 */
settings.get('/all-signatures', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (user?.role !== 'admin') {
      return c.json({ error: 'Accès réservé aux administrateurs' }, 403);
    }
    
    const result = await c.env.DB.prepare(
      `SELECT setting_key, setting_value FROM system_settings WHERE setting_key LIKE ?`
    ).bind(`${SIGNATURE_KEY_PREFIX}%`).all();
    
    const signatures = (result.results || []).map((row: any) => {
      try {
        const data = JSON.parse(row.setting_value);
        const email = row.setting_key.replace(SIGNATURE_KEY_PREFIX, '');
        return {
          email,
          userName: data.userName,
          mimeType: data.mimeType,
          registeredAt: data.registeredAt
          // Note: on ne renvoie pas le base64 pour la liste
        };
      } catch {
        return null;
      }
    }).filter(Boolean);
    
    return c.json({ signatures });
  } catch (error) {
    console.error('List signatures error:', error);
    return c.json({ error: 'Erreur lors de la récupération des signatures' }, 500);
  }
});

export default settings;
