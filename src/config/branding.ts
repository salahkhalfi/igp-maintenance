/**
 * ⚠️ CENTRALIZED BRANDING CONFIG - SINGLE SOURCE OF TRUTH
 * 
 * ALL app names, domains, emails MUST come from here or system_settings DB.
 * NEVER hardcode these values anywhere else in the codebase.
 * 
 * For multi-tenant: These become DEFAULTS, overridden by tenant settings.
 */

// =============================================================================
// 🚨 FORBIDDEN PATTERNS - NEVER USE THESE DIRECTLY IN CODE
// =============================================================================
// These patterns trigger pre-commit hook failure:
// - app.igpglass.ca (use getBrandingConfig().domain or system_settings)
// - igpglass.com (use getBrandingConfig().domain or system_settings)
// - MaintenanceOS (use getBrandingConfig().appName or system_settings)
// - IGP Glass (use getBrandingConfig().companyName or system_settings)
// - support@maintenance-app.com (use getBrandingConfig().supportEmail)
// =============================================================================

export interface BrandingConfig {
  // App identity
  appName: string;
  appTagline: string;
  version: string;
  
  // Company (SaaS vendor)
  vendorName: string;
  supportEmail: string;
  
  // URLs (defaults, overridden by system_settings per tenant)
  defaultDomain: string;
  
  // UI defaults
  defaultExpertName: string;
  defaultExpertAvatar: string;
  
  // Push notification defaults
  pushDefaultTitle: string;
  pushDefaultIcon: string;
}

/**
 * Default branding config (SaaS vendor defaults)
 * For tenant-specific values, use system_settings from DB
 */
export const DEFAULT_BRANDING: BrandingConfig = {
  // App identity
  appName: 'MaintenanceOS',
  appTagline: 'Système de Gestion de Maintenance',
  version: '3.0.0',
  
  // Vendor (us)
  vendorName: 'MaintenanceOS',
  supportEmail: 'support@maintenance-app.com',
  
  // Default domain (tenant can override via custom domain)
  defaultDomain: 'maintenance-app.com',
  
  // AI Expert defaults (tenant overrides via system_settings)
  defaultExpertName: 'Expert',
  defaultExpertAvatar: '/static/default-expert.png',
  
  // Push defaults
  pushDefaultTitle: 'Notification',
  pushDefaultIcon: '/icon-192.png',
};

/**
 * Get branding config with optional tenant overrides from system_settings
 * 
 * Usage in routes:
 * ```ts
 * const branding = await getBrandingFromDB(c.env.DB);
 * const title = branding.appName; // Uses DB value if exists, else default
 * ```
 */
export async function getBrandingFromDB(db: D1Database): Promise<BrandingConfig> {
  const config = { ...DEFAULT_BRANDING };
  
  try {
    const settings = await db.prepare(`
      SELECT key, value FROM system_settings 
      WHERE key IN ('app_title', 'app_subtitle', 'support_email', 'ai_expert_name', 'ai_expert_avatar')
    `).all();
    
    for (const setting of settings.results || []) {
      const s = setting as { key: string; value: string };
      switch (s.key) {
        case 'app_title':
          config.appName = s.value || config.appName;
          break;
        case 'app_subtitle':
          config.appTagline = s.value || config.appTagline;
          break;
        case 'support_email':
          config.supportEmail = s.value || config.supportEmail;
          break;
        case 'ai_expert_name':
          config.defaultExpertName = s.value || config.defaultExpertName;
          break;
        case 'ai_expert_avatar':
          config.defaultExpertAvatar = s.value || config.defaultExpertAvatar;
          break;
      }
    }
  } catch (error) {
    console.warn('Failed to load branding from DB, using defaults:', error);
  }
  
  return config;
}

/**
 * Get current domain from request headers
 * Used for generating absolute URLs in notifications, emails, etc.
 */
export function getDomainFromRequest(request: Request): string {
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  return host ? `${protocol}://${host}` : `https://${DEFAULT_BRANDING.defaultDomain}`;
}

// Type for D1Database (Cloudflare)
type D1Database = {
  prepare: (query: string) => {
    all: () => Promise<{ results: unknown[] }>;
    bind: (...args: unknown[]) => { all: () => Promise<{ results: unknown[] }> };
  };
};
