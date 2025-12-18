import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth';
import type { Bindings } from '../types';

const preferences = new Hono<{ Bindings: Bindings }>();

// Middleware d'authentification pour toutes les routes de préférences
preferences.use('*', authMiddleware);

/**
 * GET /api/preferences/:key - Récupérer une préférence utilisateur
 */
preferences.get('/:key', async (c) => {
  try {
    const user = c.get('user') as any;
    const key = c.req.param('key');

    const result = await c.env.DB.prepare(`
      SELECT pref_value FROM user_preferences 
      WHERE user_id = ? AND pref_key = ?
    `).bind(user.userId, key).first();

    if (!result) {
      // Retourner null ou 404 ? 
      // Pour éviter les erreurs frontend, on peut retourner null ou un objet vide
      // Mais le frontend s'attend peut-être à une 404 s'il veut utiliser des valeurs par défaut
      return c.json({ error: 'Préférence non trouvée' }, 404);
    }

    try {
      // Tenter de parser le JSON si possible
      const value = JSON.parse(result.pref_value as string);
      return c.json(value);
    } catch (e) {
      // Si ce n'est pas du JSON valide, retourner la chaîne brute
      return c.json({ value: result.pref_value });
    }
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
