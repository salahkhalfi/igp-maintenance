import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth';
import type { Bindings } from '../types';

const preferences = new Hono<{ Bindings: Bindings }>();

// Middleware d'authentification pour toutes les routes de préférences
preferences.use('*', authMiddleware);

// Valeurs par défaut robustes pour garantir la stabilité même sans DB initialisée
const DEFAULT_PREFERENCES: Record<string, any> = {
  'kanban_columns': [
    { id: 'received', title: 'Nouveau', color: 'blue' },
    { id: 'diagnostic', title: 'En Diagnostic', color: 'purple' },
    { id: 'waiting_parts', title: 'En Attente Pièces', color: 'yellow' },
    { id: 'in_progress', title: 'En Cours', color: 'orange' },
    { id: 'completed', title: 'Terminé', color: 'green' }
  ],
  'theme': 'light',
  'notifications': true
};

/**
 * GET /api/preferences/:key - Récupérer une préférence utilisateur
 */
preferences.get('/:key', async (c) => {
  try {
    const user = c.get('user') as any;
    const key = c.req.param('key');

    // 1. Chercher la personnalisation utilisateur (Priorité 1)
    const result = await c.env.DB.prepare(`
      SELECT pref_value FROM user_preferences 
      WHERE user_id = ? AND pref_key = ?
    `).bind(user.userId, key).first();

    if (result) {
      try {
        return c.json(JSON.parse(result.pref_value as string));
      } catch (e) {
        return c.json({ value: result.pref_value });
      }
    }

    // 2. Chercher la configuration système globale (Priorité 2)
    const sysSetting = await c.env.DB.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = ?
    `).bind(key).first();

    if (sysSetting) {
       try {
           return c.json(JSON.parse(sysSetting.setting_value as string));
       } catch {
           return c.json({ value: sysSetting.setting_value });
       }
    }

    // 3. Fallback Hardcodé "Usine" (Priorité 3 - Filet de sécurité)
    // Garantit que l'UI ne plante jamais pour les clés critiques
    if (key in DEFAULT_PREFERENCES) {
        console.log(`[Preferences] Serving default value for ${key}`);
        return c.json(DEFAULT_PREFERENCES[key]);
    }

    // 4. Vrai 404 (Si la clé est inconnue au bataillon)
    return c.json({ error: `Préférence '${key}' inexistante.` }, 404);

  } catch (error) {
    console.error('Get preference error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * PUT /api/preferences/:key - Mettre à jour une préférence utilisateur
 */
preferences.put('/:key', async (c) => {
  try {
    const user = c.get('user') as any;
    const key = c.req.param('key');
    const body = await c.req.json();

    // On stocke le body entier comme valeur JSON
    const value = JSON.stringify(body);

    const existing = await c.env.DB.prepare(`
      SELECT user_id FROM user_preferences 
      WHERE user_id = ? AND pref_key = ?
    `).bind(user.userId, key).first();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE user_preferences 
        SET pref_value = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE user_id = ? AND pref_key = ?
      `).bind(value, user.userId, key).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO user_preferences (user_id, pref_key, pref_value) 
        VALUES (?, ?, ?)
      `).bind(user.userId, key, value).run();
    }

    return c.json({ success: true, key, value: body });
  } catch (error) {
    console.error('Update preference error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

export default preferences;
