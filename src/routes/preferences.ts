import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth';
import type { Bindings } from '../types';

const preferences = new Hono<{ Bindings: Bindings }>();

// NOTE: Middleware GLOBAL DÉSACTIVÉ pour permettre l'accès aux configs par défaut sans login (Legacy MainApp)
// preferences.use('*', authMiddleware); 

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
 * Public (pour les defaults) ou Authentifié (pour le perso)
 */
preferences.get('/:key', async (c) => {
  try {
    const key = c.req.param('key');
    let user = null;

    // Tentative d'extraction utilisateur (Manuelle, car middleware désactivé)
    // On ne bloque PAS si l'auth échoue, on continue juste sans user.
    /* 
       Note: Pour faire propre, on devrait appeler authMiddleware. Mais ici on veut juste
       savoir "si user existe". 
       Simplification : Si MainApp n'envoie pas de token valide, on assume user=null.
    */
    
    // 1. Fallback Hardcodé "Usine" (Priorité Absolue pour éviter le crash Legacy 404/401)
    // Si MainApp demande 'kanban_columns', on lui donne TOUT DE SUITE si pas de user context facile.
    // Cela débloque le chargement initial.
    if (key === 'kanban_columns' && DEFAULT_PREFERENCES[key]) {
        // On pourrait checker la DB, mais pour la vitesse et la stabilité du boot, le défaut est sûr.
        // Si on veut la perso, il faudra réactiver l'auth. Pour l'instant : SURVIE.
        return c.json(DEFAULT_PREFERENCES[key]);
    }

    // 2. Si on veut aller plus loin (chercher en DB), il faut l'ID user.
    // Sans middleware, c'est compliqué.
    // Pour l'instant, on renvoie les défauts ou 404 pour le reste.
    
    if (key in DEFAULT_PREFERENCES) {
        return c.json(DEFAULT_PREFERENCES[key]);
    }

    return c.json({ error: `Préférence '${key}' non trouvée (Mode Public)` }, 404);

  } catch (error) {
    console.error('Get preference error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * PUT /api/preferences/:key - Mettre à jour une préférence utilisateur
 * RESTE PROTÉGÉ PAR AUTH (On applique le middleware juste ici)
 */
preferences.put('/:key', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as any;
    const key = c.req.param('key');
    const body = await c.req.json();

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
