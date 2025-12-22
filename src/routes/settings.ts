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
// ROUTES D'EXPORTATION DE DONNÉES (JSON -> CSV Client)
// ============================================================================

settings.get('/export/users', authMiddleware, adminOnly, async (c) => {
  try {
    const db = getDb(c.env);
    const allUsers = await db.select({
      EMAIL: users.email,
      PRENOM: users.first_name,
      NOM: users.last_name,
      ROLE: users.role
    }).from(users).where(sql`deleted_at IS NULL`).all();
    
    return c.json({ users: allUsers });
  } catch (error: any) {
    return c.json({ error: 'Erreur export users: ' + error.message }, 500);
  }
});

settings.get('/export/machines', authMiddleware, adminOnly, async (c) => {
  try {
    const db = getDb(c.env);
    const allMachines = await db.select({
      TYPE: machines.machine_type,
      MODELE: machines.model,
      MARQUE: machines.manufacturer,
      SERIE: machines.serial_number,
      LIEU: machines.location
    }).from(machines).where(sql`deleted_at IS NULL`).all();
    
    return c.json({ machines: allMachines });
  } catch (error: any) {
    return c.json({ error: 'Erreur export machines: ' + error.message }, 500);
  }
});

// ============================================================================
// ROUTES D'IMPORTATION DE DONNÉES (CSV)
// ============================================================================

/**
 * POST /api/settings/import/users - Importer des utilisateurs en masse
 * Input: { users: [...], updateExisting: boolean }
 */
settings.post('/import/users', authMiddleware, adminOnly, async (c) => {
  try {
    const { users: newUsers, updateExisting } = await c.req.json();
    if (!Array.isArray(newUsers) || newUsers.length === 0) {
      return c.json({ error: 'Données invalides ou vides' }, 400);
    }

    const db = getDb(c.env);
    const defaultPasswordHash = await hashPassword('123456'); // Default password
    const results = { success: 0, updated: 0, ignored: 0, errors: 0 };

    for (const u of newUsers) {
      if (!u.email || !u.role) {
        results.errors++;
        continue;
      }

      try {
        let role = u.role.toLowerCase().trim();
        if (!['admin', 'technician', 'operator', 'supervisor', 'manager'].includes(role)) {
            role = 'operator';
        }

        const userData = {
          email: u.email.trim(),
          full_name: `${u.first_name} ${u.last_name || ''}`.trim(),
          first_name: u.first_name,
          last_name: u.last_name || '',
          role: role,
          updated_at: sql`CURRENT_TIMESTAMP`
        };

        // Insert or Update logic
        let query = db.insert(users).values({
            ...userData,
            password_hash: defaultPasswordHash, // Only used for insert
            created_at: sql`CURRENT_TIMESTAMP`
        });

        if (updateExisting) {
            // Upsert: Update fields but KEEP existing password
            query = query.onConflictDoUpdate({
                target: users.email,
                set: userData // Does not include password_hash
            });
        } else {
            // Insert Only
            query = query.onConflictDoNothing({ target: users.email });
        }

        const res = await query.run();

        if (res.meta.changes > 0) {
            // D1/SQLite returns changes=1 for insert OR update usually.
            // Distinguishing exact action is hard without checking before.
            // We assume Success if something changed.
            if (updateExisting) results.updated++; // Approximation
            else results.success++;
        } else {
            results.ignored++;
        }

      } catch (err) {
        console.error('Import user error:', err);
        results.errors++;
      }
    }

    return c.json({ 
      message: 'Import terminé', 
      stats: results,
      note: 'Les nouveaux utilisateurs ont le mot de passe par défaut : "123456"'
    });

  } catch (error: any) {
    console.error('Import users error:', error);
    return c.json({ error: 'Erreur lors de l\'import: ' + error.message }, 500);
  }
});

/**
 * POST /api/settings/import/machines - Importer des machines en masse
 * Input: { machines: [...], updateExisting: boolean }
 */
settings.post('/import/machines', authMiddleware, adminOnly, async (c) => {
  try {
    const { machines: newMachines, updateExisting } = await c.req.json();
    if (!Array.isArray(newMachines) || newMachines.length === 0) {
      return c.json({ error: 'Données invalides ou vides' }, 400);
    }

    const db = getDb(c.env);
    const results = { success: 0, updated: 0, ignored: 0, errors: 0 };

    for (const m of newMachines) {
      if (!m.type) {
        results.errors++;
        continue;
      }

      try {
        const machineData = {
          machine_type: m.type.trim(),
          model: m.model ? m.model.trim() : null,
          manufacturer: m.manufacturer ? m.manufacturer.trim() : null,
          serial_number: m.serial ? m.serial.trim() : null,
          location: m.location ? m.location.trim() : null,
          updated_at: sql`CURRENT_TIMESTAMP`
        };

        let query = db.insert(machines).values({
            ...machineData,
            status: 'operational', // Default for new
            created_at: sql`CURRENT_TIMESTAMP`
        });
        
        if (machineData.serial_number) {
            if (updateExisting) {
                query = query.onConflictDoUpdate({
                    target: machines.serial_number,
                    set: machineData // Updates details based on Serial
                });
            } else {
                query = query.onConflictDoNothing({ target: machines.serial_number });
            }
        } else {
            // No serial -> Always Insert (Risk of duplicates, but requested behavior for non-serialized items)
            // Cannot update without key.
        }

        const res = await query.run();

        if (res.meta.changes > 0) {
             if (updateExisting && machineData.serial_number) results.updated++;
             else results.success++;
        } else {
            results.ignored++;
        }

      } catch (err) {
        console.error('Import machine error:', err);
        results.errors++;
      }
    }

    return c.json({ message: 'Import terminé', stats: results });

  } catch (error: any) {
    console.error('Import machines error:', error);
    return c.json({ error: 'Erreur lors de l\'import: ' + error.message }, 500);
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
      'company_title',
      'company_subtitle',
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
        ROLE: users.role
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
            await db.update(users)
              .set({
                first_name: firstName,
                last_name: lastName,
                full_name: lastName ? `${firstName} ${lastName}` : firstName,
                role: role,
                updated_at: sql`CURRENT_TIMESTAMP`
              })
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
            role: role
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
        
        // STRATÉGIE 2 : Si pas de SERIE → chercher par clé composite TYPE+MODELE+LIEU
        if (!existing && !serialNumber) {
          const compositeKey = generateCompositeKey(machineType, model, location);
          
          // Recherche par clé composite (case-insensitive)
          existing = await db
            .select({ id: machines.id })
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
          technical_specs: technicalSpecs,
          status: 'operational'
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

export default settings;
