
import { Context, Next } from 'hono';

export interface Modules {
  planning: boolean;
  statistics: boolean;
  notifications: boolean;
  messaging: boolean;
  machines: boolean;
}

const MODULE_LABELS: Record<keyof Modules, string> = {
  planning: 'Planning de Production',
  statistics: 'Statistiques & Rapports',
  notifications: 'Notifications Push',
  messaging: 'Collaboration Pro',
  machines: 'Gestion Machines'
};

/**
 * Middleware factory to check if a module is enabled.
 * Features are enabled by default if the setting is missing (backward compatibility).
 */
export const checkModule = (moduleName: keyof Modules) => {
  return async (c: Context, next: Next) => {
    try {
      const result = await c.env.DB.prepare(`
        SELECT setting_value FROM system_settings WHERE setting_key = 'active_modules'
      `).first();

      // Default to true if setting not found (legacy support / SaaS transition)
      let modules: Modules = { 
        planning: true,
        statistics: true,
        notifications: true,
        messaging: true,
        machines: true
      };
      
      if (result && result.setting_value) {
        try {
          modules = { ...modules, ...JSON.parse(result.setting_value as string) };
        } catch (e) {
          // keep defaults on parse error
        }
      }

      if (modules[moduleName] === false) {
        return c.json({ 
          error: `Module "${MODULE_LABELS[moduleName]}" non activé. Veuillez contacter l'administrateur pour souscrire à ce module.`,
          code: 'MODULE_DISABLED' 
        }, 403);
      }

      await next();
    } catch (error) {
      console.error('Module check error:', error);
      // Fail safe: allow access if DB check fails to avoid blocking the app
      await next(); 
    }
  };
};
