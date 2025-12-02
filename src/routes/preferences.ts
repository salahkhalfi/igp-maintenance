import { Hono } from 'hono';
import { Bindings } from '../types';
import { authMiddleware } from '../middlewares/auth';

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', authMiddleware);

// Get all preferences for current user
app.get('/', async (c) => {
    const user = c.get('user');
    const { results } = await c.env.DB.prepare(
        'SELECT pref_key, pref_value FROM user_preferences WHERE user_id = ?'
    ).bind(user.id).all();
    
    const prefs = {};
    if (results) {
        results.forEach(row => {
            try {
                prefs[row.pref_key] = JSON.parse(row.pref_value as string);
            } catch (e) {
                prefs[row.pref_key] = row.pref_value;
            }
        });
    }
    
    return c.json(prefs);
});

// Get specific preference
app.get('/:key', async (c) => {
    const user = c.get('user');
    const key = c.req.param('key');
    
    const result = await c.env.DB.prepare(
        'SELECT pref_value FROM user_preferences WHERE user_id = ? AND pref_key = ?'
    ).bind(user.id, key).first();
    
    if (!result) {
        return c.json({ value: null });
    }
    
    try {
        return c.json({ value: JSON.parse(result.pref_value as string) });
    } catch (e) {
        return c.json({ value: result.pref_value });
    }
});

// Save preference
app.put('/:key', async (c) => {
    const user = c.get('user');
    const key = c.req.param('key');
    const body = await c.req.json();
    
    const valueStr = JSON.stringify(body.value);
    
    await c.env.DB.prepare(
        `INSERT INTO user_preferences (user_id, pref_key, pref_value, updated_at)
         VALUES (?, ?, ?, datetime('now'))
         ON CONFLICT(user_id, pref_key) DO UPDATE SET
         pref_value = excluded.pref_value,
         updated_at = excluded.updated_at`
    ).bind(user.id, key, valueStr).run();
    
    return c.json({ success: true });
});

export default app;
