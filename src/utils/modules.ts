
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

      // 1. Vérifier la LICENCE (Super Admin control)
      // Default to true if setting not found (legacy support / SaaS transition)
      let licenses: Modules = { 
        planning: true,
        statistics: true,
        notifications: true,
        messaging: true,
        machines: true
      };
      
      if (result && result.setting_value) {
        try {
          licenses = { ...licenses, ...JSON.parse(result.setting_value as string) };
        } catch (e) {
          // keep defaults on parse error
        }
      }

      // Si la licence n'est pas active, c'est bloqué définitivement (403 Forbidden)
      if (licenses[moduleName] === false) {
        return c.json({ 
          error: `Module "${MODULE_LABELS[moduleName]}" non inclus dans votre abonnement. Contactez l'administrateur.`,
          code: 'MODULE_NOT_LICENSED' 
        }, 403);
      }

      // 2. Vérifier la PRÉFÉRENCE CLIENT (Client Admin control)
      // Si le client a masqué ce module volontairement, on le bloque aussi (mais message différent)
      const prefResult = await c.env.DB.prepare(`
        SELECT setting_value FROM system_settings WHERE setting_key = 'client_module_preferences'
      `).first();

      if (prefResult && prefResult.setting_value) {
        try {
          const prefs = JSON.parse(prefResult.setting_value as string);
          // Si la préférence est explicitement false (et que la licence était true), c'est masqué
          if (prefs[moduleName] === false) {
             return c.json({ 
              error: `Module "${MODULE_LABELS[moduleName]}" désactivé dans vos paramètres.`,
              code: 'MODULE_DISABLED_BY_USER' 
            }, 403);
          }
        } catch (e) {
          // ignore parse error
        }
      }

      await next();
    } catch (error) {
      console.error('Module check error:', error);
      // Fail safe: allow access if DB check fails to avoid blocking the app
      await next(); 
    }
  };
};
