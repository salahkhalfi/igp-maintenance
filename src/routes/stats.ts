import { Hono } from 'hono';
import type { Bindings } from '../types';

const stats = new Hono<{ Bindings: Bindings }>();

// ========================================
// STATS API - Simple active tickets count
// ========================================
stats.get('/active-tickets', async (c) => {
  try {
    const user = c.get('user') as any;
    
    // Allow access to dashboard stats for most roles
    const allowedRoles = ['admin', 'supervisor', 'director', 'coordinator', 'planner', 'senior_technician', 'technician', 'team_leader'];
    
    if (!user || !allowedRoles.includes(user.role)) {
      // For other roles (operators, etc.), return 0 counts instead of 403 to avoid console errors
      return c.json({
        activeTickets: 0,
        overdueTickets: 0,
        activeTechnicians: 0,
        pushDevices: 0
      });
    }

    // Count active tickets (not completed, not cancelled, not archived)
    // AUDIT FIX: Exclure les tickets soft-deleted
    const activeResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM tickets
      WHERE status NOT IN ('completed', 'cancelled', 'archived')
        AND tickets.deleted_at IS NULL
    `).first();

    // Count overdue tickets (scheduled_date in the past)
    // AUDIT FIX: Exclure les tickets soft-deleted
    const overdueResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM tickets
      WHERE status NOT IN ('completed', 'cancelled', 'archived')
        AND tickets.deleted_at IS NULL
        AND scheduled_date IS NOT NULL
        AND datetime(scheduled_date) < datetime('now')
    `).first();

    // Count active technicians (only real technicians, exclude system team account)
    // AUDIT FIX: Exclure les utilisateurs soft-deleted
    const techniciansResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'technician'
        AND id != 0
        AND users.deleted_at IS NULL
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
stats.get('/technicians-performance', async (c) => {
  try {
    const user = c.get('user') as any;
    
    // Only admins and supervisors can see performance stats
    if (!user || (user.role !== 'admin' && user.role !== 'supervisor')) {
      return c.json({ error: 'Accès refusé' }, 403);
    }

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
        AND u.deleted_at IS NULL
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

// ========================================
// STATS API - Online Users Count
// ========================================
stats.get('/online-users', async (c) => {
  try {
    // Pas besoin d'authentification - c'est une info publique
    
    // Compter les utilisateurs connectés aujourd'hui (dernières 24h)
    const todayResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE last_login IS NOT NULL
        AND datetime(last_login) > datetime('now', '-24 hours')
        AND deleted_at IS NULL
        AND id != 0
    `).first();

    // Compter les utilisateurs actifs dans les 2 dernières minutes (basé sur last_seen heartbeat)
    const activeResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE last_seen IS NOT NULL
        AND datetime(last_seen) > datetime('now', '-2 minutes')
        AND deleted_at IS NULL
        AND id != 0
    `).first();

    // Compter les appareils avec push actifs (bonne indication d'utilisateurs actifs)
    const pushDevicesResult = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM push_subscriptions
      WHERE last_used IS NOT NULL
        AND datetime(last_used) > datetime('now', '-24 hours')
    `).first();

    return c.json({
      today: (todayResult as any)?.count || 0,
      active: (activeResult as any)?.count || 0,
      withPush: (pushDevicesResult as any)?.count || 0
    });
  } catch (error) {
    console.error('[Online Users API] Error:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

export default stats;
