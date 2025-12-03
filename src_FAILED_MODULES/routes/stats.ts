
import { Hono } from 'hono';
import { authMiddleware, requirePermission } from '../middlewares/auth';
import { checkModule } from '../utils/modules';
import type { Bindings } from '../types';

const stats = new Hono<{ Bindings: Bindings }>();

// Middleware: Check if Statistics Module is enabled
stats.use('*', checkModule('statistics'));

// ========================================
// STATS API - Simple active tickets count
// ========================================
stats.get('/active-tickets', authMiddleware, requirePermission('stats', 'read'), async (c) => {
  try {
    // Count active tickets (not completed, not cancelled, not archived)
    const activeResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM tickets
      WHERE status NOT IN ('completed', 'cancelled', 'archived')
    `).first();

    // Count overdue tickets (scheduled_date in the past)
    const overdueResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM tickets
      WHERE status NOT IN ('completed', 'cancelled', 'archived')
        AND scheduled_date IS NOT NULL
        AND datetime(scheduled_date) < datetime('now')
    `).first();

    // Count active technicians (only real technicians, exclude system team account)
    const techniciansResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'technician'
      AND id != 0
    `).first();

    // Count registered push notification devices
    const pushDevicesResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM push_subscriptions
    `).first();

    return c.json({
      activeTickets: (activeResult as any)?.count || 0,
      overdueTickets: (overdueResult as any)?.count || 0,
      activeTechnicians: (techniciansResult as any)?.count || 0,
      pushDevices: (pushDevicesResult as any)?.count || 0
    });
  } catch (error) {
    console.error('[Stats API] Error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// ========================================
// STATS API - Technicians Performance
// ========================================
stats.get('/technicians-performance', authMiddleware, requirePermission('stats', 'read'), async (c) => {
  try {
    // Get top 3 technicians by completed tickets (last 30 days)
    const topTechnicians = await c.env.DB.prepare(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.full_name,
        COUNT(t.id) as completed_count
      FROM users u
      LEFT JOIN tickets t ON t.assigned_to = u.id 
        AND t.status = 'completed'
        AND t.completed_at >= datetime('now', '-30 days')
      WHERE u.role = 'technician' 
        AND u.id != 0
      GROUP BY u.id
      ORDER BY completed_count DESC
      LIMIT 3
    `).all();

    return c.json({
      topTechnicians: topTechnicians.results || []
    });
  } catch (error) {
    console.error('[Performance Stats API] Error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

export default stats;
