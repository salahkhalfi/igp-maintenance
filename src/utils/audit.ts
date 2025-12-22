/**
 * Audit Logger Utility
 * Centralized logging for all critical actions
 * 
 * Usage:
 *   await logAudit(c.env.DB, {
 *     userId: user.userId,
 *     userEmail: user.email,
 *     userRole: user.role,
 *     action: 'create',
 *     resource: 'ticket',
 *     resourceId: ticketId,
 *     details: { title, priority },
 *     ipAddress: c.req.header('CF-Connecting-IP'),
 *     userAgent: c.req.header('User-Agent')
 *   });
 */

export interface AuditLogEntry {
  userId?: number | null;
  userEmail?: string | null;
  userRole?: string | null;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'import' | 'view' | 'error';
  resource: 'ticket' | 'user' | 'machine' | 'message' | 'conversation' | 'settings' | 'auth' | 'system';
  resourceId?: string | number | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  status?: 'success' | 'failed' | 'error';
  errorMessage?: string | null;
}

/**
 * Log an audit entry to the database
 * Fire-and-forget: errors are caught and logged, not thrown
 */
export async function logAudit(db: D1Database, entry: AuditLogEntry): Promise<void> {
  try {
    await db.prepare(`
      INSERT INTO audit_logs (
        user_id, user_email, user_role,
        action, resource, resource_id,
        details, ip_address, user_agent,
        status, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      entry.userId ?? null,
      entry.userEmail ?? null,
      entry.userRole ?? null,
      entry.action,
      entry.resource,
      entry.resourceId?.toString() ?? null,
      entry.details ? JSON.stringify(entry.details) : null,
      entry.ipAddress ?? null,
      entry.userAgent ?? null,
      entry.status ?? 'success',
      entry.errorMessage ?? null
    ).run();
  } catch (error) {
    // Silent fail - audit logging should never break the app
    console.error('[AUDIT] Failed to log:', error, entry);
  }
}

/**
 * Helper to extract client info from Hono context
 */
export function getClientInfo(c: any): { ipAddress: string | null; userAgent: string | null } {
  return {
    ipAddress: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || null,
    userAgent: c.req.header('User-Agent') || null
  };
}

/**
 * Quick audit helpers for common actions
 */
export const audit = {
  login: (db: D1Database, user: any, clientInfo: ReturnType<typeof getClientInfo>) =>
    logAudit(db, {
      userId: user.userId,
      userEmail: user.email,
      userRole: user.role,
      action: 'login',
      resource: 'auth',
      ...clientInfo
    }),

  logout: (db: D1Database, user: any, clientInfo: ReturnType<typeof getClientInfo>) =>
    logAudit(db, {
      userId: user.userId,
      userEmail: user.email,
      userRole: user.role,
      action: 'logout',
      resource: 'auth',
      ...clientInfo
    }),

  create: (db: D1Database, user: any, resource: AuditLogEntry['resource'], resourceId: string | number, details?: any) =>
    logAudit(db, {
      userId: user.userId,
      userEmail: user.email,
      userRole: user.role,
      action: 'create',
      resource,
      resourceId,
      details
    }),

  update: (db: D1Database, user: any, resource: AuditLogEntry['resource'], resourceId: string | number, details?: any) =>
    logAudit(db, {
      userId: user.userId,
      userEmail: user.email,
      userRole: user.role,
      action: 'update',
      resource,
      resourceId,
      details
    }),

  delete: (db: D1Database, user: any, resource: AuditLogEntry['resource'], resourceId: string | number, details?: any) =>
    logAudit(db, {
      userId: user.userId,
      userEmail: user.email,
      userRole: user.role,
      action: 'delete',
      resource,
      resourceId,
      details
    }),

  error: (db: D1Database, user: any | null, resource: AuditLogEntry['resource'], errorMessage: string, details?: any) =>
    logAudit(db, {
      userId: user?.userId,
      userEmail: user?.email,
      userRole: user?.role,
      action: 'error',
      resource,
      status: 'error',
      errorMessage,
      details
    })
};
