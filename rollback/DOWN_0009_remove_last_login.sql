-- Rollback migration 0009
-- À exécuter SEULEMENT en cas de problème

ALTER TABLE users DROP COLUMN IF EXISTS last_login;
