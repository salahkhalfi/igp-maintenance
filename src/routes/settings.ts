// Routes de gestion des paramètres système

import { Hono } from 'hono';
import { adminOnly } from '../middlewares/auth';
import type { Bindings } from '../types';

const settings = new Hono<{ Bindings: Bindings }>();

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

export default settings;
