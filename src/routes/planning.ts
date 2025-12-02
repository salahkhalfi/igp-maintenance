import { Hono } from 'hono';
import { Bindings } from '../types';
import { checkModule } from '../utils/modules';
import { requirePermission } from '../middlewares/auth';

const app = new Hono<{ Bindings: Bindings }>();

// Middleware: Check if Planning Module is enabled
app.use('*', checkModule('planning'));

// GET ALL DATA (Events, Categories, Notes)
app.get('/', async (c) => {
    const user = c.get('user');
    // console.log('Planning User:', user); // Debug log

    // Disable caching for this critical data
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate');

    try {
        const { results: events } = await c.env.DB.prepare('SELECT * FROM planning_events ORDER BY date ASC').all();
        const { results: categories } = await c.env.DB.prepare('SELECT * FROM planning_categories').all();
        
        // Filter notes by logged-in user ID
        // If user is not found (should not happen due to authMiddleware), return empty or shared notes?
        // Safe approach: return empty if no user, otherwise filter by user.id
        const userId = user ? user.id : 0;
        
        const { results: notes } = await c.env.DB.prepare(
            'SELECT * FROM planner_notes WHERE user_id = ? ORDER BY priority DESC, created_at DESC'
        ).bind(userId).all();

        return c.json({
            events: events || [],
            categories: categories || [],
            notes: notes || []
        });
    } catch (error) {
        return c.json({ error: 'Error fetching planning data' }, 500);
    }
});

// --- EVENTS ---

// CREATE EVENT
app.post('/events', requirePermission('planning', 'manage'), async (c) => {
    const body = await c.req.json();
    const { date, type, status, title, details } = body;

    try {
        const result = await c.env.DB.prepare(
            'INSERT INTO planning_events (date, type, status, title, details) VALUES (?, ?, ?, ?, ?)'
        ).bind(date, type, status || 'confirmed', title, details).run();

        return c.json({ id: result.meta.last_row_id, ...body }, 201);
    } catch (error) {
        return c.json({ error: 'Error creating event' }, 500);
    }
});

// UPDATE EVENT
app.put('/events/:id', requirePermission('planning', 'manage'), async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { date, type, status, title, details } = body;

    try {
        // Dynamic update based on provided fields
        const updates = [];
        const values = [];
        if (date !== undefined) { updates.push('date = ?'); values.push(date); }
        if (type !== undefined) { updates.push('type = ?'); values.push(type); }
        if (status !== undefined) { updates.push('status = ?'); values.push(status); }
        if (title !== undefined) { updates.push('title = ?'); values.push(title); }
        if (details !== undefined) { updates.push('details = ?'); values.push(details); }

        if (updates.length === 0) return c.json({ message: 'No updates provided' });

        values.push(id);
        const query = `UPDATE planning_events SET ${updates.join(', ')} WHERE id = ?`;
        
        await c.env.DB.prepare(query).bind(...values).run();

        return c.json({ id, ...body });
    } catch (error) {
        return c.json({ error: 'Error updating event' }, 500);
    }
});

// DELETE EVENT
app.delete('/events/:id', requirePermission('planning', 'manage'), async (c) => {
    const id = c.req.param('id');
    try {
        await c.env.DB.prepare('DELETE FROM planning_events WHERE id = ?').bind(id).run();
        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Error deleting event' }, 500);
    }
});

// --- CATEGORIES ---

// CREATE CATEGORY
app.post('/categories', requirePermission('planning', 'categories'), async (c) => {
    const body = await c.req.json();
    const { id, label, icon, color } = body;

    try {
        // Use provided ID or generate one if needed (though frontend usually provides one like 'cat_123')
        // But here we strictly expect what frontend sends or we could generate.
        // The migration uses TEXT PRIMARY KEY.
        
        await c.env.DB.prepare(
            'INSERT INTO planning_categories (id, label, icon, color) VALUES (?, ?, ?, ?)'
        ).bind(id, label, icon, color).run();

        return c.json(body, 201);
    } catch (error) {
        return c.json({ error: 'Error creating category' }, 500);
    }
});

// UPDATE CATEGORY
app.put('/categories/:id', requirePermission('planning', 'categories'), async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { label, icon, color } = body;

    try {
        await c.env.DB.prepare(
            'UPDATE planning_categories SET label = ?, icon = ?, color = ? WHERE id = ?'
        ).bind(label, icon, color, id).run();

        return c.json({ id, ...body });
    } catch (error) {
        return c.json({ error: 'Error updating category' }, 500);
    }
});

// DELETE CATEGORY
app.delete('/categories/:id', requirePermission('planning', 'categories'), async (c) => {
    const id = c.req.param('id');
    try {
        await c.env.DB.prepare('DELETE FROM planning_categories WHERE id = ?').bind(id).run();
        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Error deleting category' }, 500);
    }
});

// --- NOTES ---

// CREATE NOTE
app.post('/notes', async (c) => {
    const user = c.get('user');
    const body = await c.req.json();
    const { text, time, done, priority, notified } = body;
    
    // Security: Ensure user is logged in
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    try {
        const result = await c.env.DB.prepare(
            'INSERT INTO planner_notes (text, time, done, priority, notified, user_id) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(text, time, done ? 1 : 0, priority, notified ? 1 : 0, user.id).run();

        return c.json({ id: result.meta.last_row_id, ...body, user_id: user.id }, 201);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Error creating note' }, 500);
    }
});

// UPDATE NOTE
app.put('/notes/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();
    const { text, time, done, priority, notified } = body;

    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    try {
        // Verify ownership before update
        const existing = await c.env.DB.prepare('SELECT user_id FROM planner_notes WHERE id = ?').bind(id).first();
        
        if (!existing) return c.json({ error: 'Note not found' }, 404);
        
        // IMPORTANT: Only allow update if the note belongs to the user
        // OR if user is admin? For personal notes, strict privacy is usually better.
        // Let's check if user_id matches.
        // Note: existing.user_id might be null for legacy notes created before this feature.
        // Strategy: If null, allow anyone (or first claimer). If set, must match.
        if (existing.user_id !== null && existing.user_id !== user.id) {
            return c.json({ error: 'Forbidden' }, 403);
        }

        const updates = [];
        const values = [];
        if (text !== undefined) { updates.push('text = ?'); values.push(text); }
        if (time !== undefined) { updates.push('time = ?'); values.push(time); }
        if (done !== undefined) { updates.push('done = ?'); values.push(done ? 1 : 0); }
        if (priority !== undefined) { updates.push('priority = ?'); values.push(priority); }
        if (notified !== undefined) { updates.push('notified = ?'); values.push(notified ? 1 : 0); }

        // Optionally claim ownership if it was null?
        // updates.push('user_id = ?'); values.push(user.id); 

        if (updates.length === 0) return c.json({ message: 'No updates provided' });

        values.push(id);
        const query = `UPDATE planner_notes SET ${updates.join(', ')} WHERE id = ?`;

        await c.env.DB.prepare(query).bind(...values).run();

        return c.json({ id, ...body });
    } catch (error) {
        return c.json({ error: 'Error updating note' }, 500);
    }
});

// DELETE NOTE
app.delete('/notes/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    try {
        // Verify ownership
        const existing = await c.env.DB.prepare('SELECT user_id FROM planner_notes WHERE id = ?').bind(id).first();
        if (!existing) return c.json({ error: 'Note not found' }, 404);
        
        if (existing.user_id !== null && existing.user_id !== user.id) {
            return c.json({ error: 'Forbidden' }, 403);
        }

        await c.env.DB.prepare('DELETE FROM planner_notes WHERE id = ?').bind(id).run();
        return c.json({ success: true });
    } catch (error) {
        return c.json({ error: 'Error deleting note' }, 500);
    }
});

export default app;
