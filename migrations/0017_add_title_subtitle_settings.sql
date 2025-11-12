-- Migration: Ajouter titre et sous-titre personnalisés
-- Date: 2025-11-12
-- Description: Permet au super admin de personnaliser le titre et sous-titre de l'application
-- Impact: FAIBLE - Ajout de 2 entrées dans system_settings uniquement

-- Vérifier que la table system_settings existe (créée dans migration 0016)
-- Si cette migration échoue, vérifier que 0016_create_system_settings.sql a été appliquée

-- Insérer le titre par défaut
INSERT INTO system_settings (setting_key, setting_value, description, updated_at) 
VALUES (
  'company_title',
  'Gestion de la maintenance et des réparations',
  'Titre principal de l''application (personnalisable par super admin)',
  CURRENT_TIMESTAMP
)
ON CONFLICT(setting_key) DO NOTHING;

-- Insérer le sous-titre par défaut
INSERT INTO system_settings (setting_key, setting_value, description, updated_at) 
VALUES (
  'company_subtitle',
  'Les Produits Verriers International (IGP) Inc.',
  'Sous-titre de l''application (personnalisable par super admin)',
  CURRENT_TIMESTAMP
)
ON CONFLICT(setting_key) DO NOTHING;

-- Vérification: Afficher les nouvelles entrées (pour debug)
-- SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('company_title', 'company_subtitle');
