-- Table des paramètres système (logo personnalisé, etc.)
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index pour recherche rapide par clé
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- Valeur par défaut: logo IGP
INSERT INTO system_settings (setting_key, setting_value) 
VALUES ('company_logo_url', '/static/logo-igp.png')
ON CONFLICT(setting_key) DO NOTHING;
