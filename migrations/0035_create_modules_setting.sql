-- Initialisation des modules actifs (Feature Flipping)
INSERT INTO system_settings (setting_key, setting_value) 
VALUES ('active_modules', '{"planning": true, "statistics": true, "notifications": true}')
ON CONFLICT(setting_key) DO NOTHING;
