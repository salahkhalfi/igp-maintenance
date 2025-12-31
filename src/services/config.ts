/**
 * ConfigService - Centralized configuration management
 * 
 * All business values must come from DB (system_settings) or ENV.
 * ZERO hardcoding policy - app name is dynamically generated from company_short_name.
 * 
 * Usage:
 *   const config = new ConfigService(c.env.DB);
 *   const appName = await config.get('app_name', 'Gestion Maintenance');
 *   const aiPrompt = await config.get('ai_identity_block');
 */

import { D1Database } from '@cloudflare/workers-types';

// Default values (generic, not business-specific)
// NOTE: app_name should be dynamically built as: company_short_name + ' Gestion'
const DEFAULTS: Record<string, string> = {
  // App branding - Generic defaults, override via DB
  app_name: 'Gestion Maintenance',
  app_tagline: 'Gestion intelligente de maintenance',
  app_base_url: 'https://example.com',
  primary_color: '#10b981',
  secondary_color: '#1f2937',
  company_short_name: 'IGP',
  
  // AI defaults
  ai_expert_name: 'Expert IGP',
  ai_whisper_context: 'Industrial maintenance context',
  
  // Timezone
  timezone_offset_hours: '-5',
  
  // Industry
  industry_type: 'general',
};

export class ConfigService {
  private db: D1Database;
  private cache: Map<string, { value: string; expiry: number }> = new Map();
  private cacheTTL = 60000; // 1 minute cache

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Get a single config value
   */
  async get(key: string, defaultValue?: string): Promise<string> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }

    // Query DB
    try {
      const result = await this.db.prepare(
        'SELECT setting_value FROM system_settings WHERE setting_key = ?'
      ).bind(key).first<{ setting_value: string }>();

      const value = result?.setting_value ?? defaultValue ?? DEFAULTS[key] ?? '';
      
      // Cache result
      this.cache.set(key, { value, expiry: Date.now() + this.cacheTTL });
      
      return value;
    } catch (error) {
      console.error(`ConfigService.get(${key}) error:`, error);
      return defaultValue ?? DEFAULTS[key] ?? '';
    }
  }

  /**
   * Get multiple config values at once (single DB query)
   */
  async getMany(keys: string[]): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    const uncachedKeys: string[] = [];

    // Check cache first
    for (const key of keys) {
      const cached = this.cache.get(key);
      if (cached && cached.expiry > Date.now()) {
        result[key] = cached.value;
      } else {
        uncachedKeys.push(key);
      }
    }

    // Query DB for uncached keys
    if (uncachedKeys.length > 0) {
      try {
        const placeholders = uncachedKeys.map(() => '?').join(',');
        const rows = await this.db.prepare(
          `SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN (${placeholders})`
        ).bind(...uncachedKeys).all<{ setting_key: string; setting_value: string }>();

        const dbValues = new Map(rows.results?.map(r => [r.setting_key, r.setting_value]) ?? []);

        for (const key of uncachedKeys) {
          const value = dbValues.get(key) ?? DEFAULTS[key] ?? '';
          result[key] = value;
          this.cache.set(key, { value, expiry: Date.now() + this.cacheTTL });
        }
      } catch (error) {
        console.error('ConfigService.getMany error:', error);
        // Fill with defaults on error
        for (const key of uncachedKeys) {
          result[key] = DEFAULTS[key] ?? '';
        }
      }
    }

    return result;
  }

  /**
   * Get all config values with a prefix (e.g., 'ai_' for all AI settings)
   */
  async getByPrefix(prefix: string): Promise<Record<string, string>> {
    try {
      const rows = await this.db.prepare(
        'SELECT setting_key, setting_value FROM system_settings WHERE setting_key LIKE ?'
      ).bind(`${prefix}%`).all<{ setting_key: string; setting_value: string }>();

      const result: Record<string, string> = {};
      for (const row of rows.results ?? []) {
        result[row.setting_key] = row.setting_value;
        this.cache.set(row.setting_key, { value: row.setting_value, expiry: Date.now() + this.cacheTTL });
      }
      return result;
    } catch (error) {
      console.error(`ConfigService.getByPrefix(${prefix}) error:`, error);
      return {};
    }
  }

  /**
   * Set a config value (for admin use)
   */
  async set(key: string, value: string): Promise<boolean> {
    try {
      const existing = await this.db.prepare(
        'SELECT id FROM system_settings WHERE setting_key = ?'
      ).bind(key).first();

      if (existing) {
        await this.db.prepare(
          'UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?'
        ).bind(value, key).run();
      } else {
        await this.db.prepare(
          'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)'
        ).bind(key, value).run();
      }

      // Update cache
      this.cache.set(key, { value, expiry: Date.now() + this.cacheTTL });
      return true;
    } catch (error) {
      console.error(`ConfigService.set(${key}) error:`, error);
      return false;
    }
  }

  /**
   * Clear cache (useful after bulk updates)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get app base URL (commonly needed)
   */
  async getBaseUrl(): Promise<string> {
    return this.get('app_base_url', 'https://example.com');
  }

  /**
   * Get timezone offset (commonly needed)
   */
  async getTimezoneOffset(): Promise<number> {
    const value = await this.get('timezone_offset_hours', '-5');
    return parseInt(value, 10) || -5;
  }

  /**
   * Get all AI-related settings
   */
  async getAIConfig(): Promise<Record<string, string>> {
    return this.getByPrefix('ai_');
  }
}

// Factory function for easy instantiation
export function createConfigService(db: D1Database): ConfigService {
  return new ConfigService(db);
}
