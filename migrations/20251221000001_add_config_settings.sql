-- Migration: Add missing config settings for zero-hardcoding policy
-- Date: 2024-12-21
-- Phase 1.2 of modernization plan

-- App branding (if not exists) - NOTE: app_name is dynamically generated from company_short_name + ' Gestion'
INSERT OR IGNORE INTO system_settings (setting_key, setting_value) VALUES 
  ('app_name', 'Gestion Maintenance'),
  ('app_tagline', 'Gestion intelligente de maintenance'),
  ('primary_color', '#10b981'),
  ('secondary_color', '#1f2937'),
  ('support_email', 'support@example.com'),
  ('documentation_url', '/guide');

-- Industry settings
INSERT OR IGNORE INTO system_settings (setting_key, setting_value) VALUES 
  ('industry_type', 'manufacturing'),
  ('industry_vocabulary', '["CNC", "usinage", "maintenance", "panne", "réparation"]');

-- AI Whisper/Transcription context
INSERT OR IGNORE INTO system_settings (setting_key, setting_value) VALUES 
  ('ai_whisper_context', 'Contexte: maintenance industrielle. Langues: Français québécois et anglais. Termes techniques à reconnaître.');

-- AI Analysis prompts
INSERT OR IGNORE INTO system_settings (setting_key, setting_value) VALUES 
  ('ai_ticket_analysis_prompt', 'Analyse ce ticket de maintenance et suggère une priorité et des actions.'),
  ('ai_image_analysis_prompt', 'Analyse cette image dans un contexte de maintenance industrielle. Identifie les problèmes potentiels.'),
  ('ai_summary_prompt', 'Résume cette information de manière concise pour un technicien de maintenance.');

-- Location for weather (TV display)
INSERT OR IGNORE INTO system_settings (setting_key, setting_value) VALUES 
  ('location_latitude', '45.5017'),
  ('location_longitude', '-73.5673'),
  ('location_timezone', 'America/Toronto');
