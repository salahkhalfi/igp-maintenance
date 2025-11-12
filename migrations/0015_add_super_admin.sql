-- Migration 0015: Ajout du Super Admin invisible
-- Date: 2025-11-12
-- Description: Crée un super admin avec pouvoirs illimités et invisible aux autres utilisateurs

-- 1. Ajouter colonne is_super_admin à la table users
ALTER TABLE users ADD COLUMN is_super_admin INTEGER DEFAULT 0 NOT NULL;

-- 2. Créer l'index pour performance
CREATE INDEX IF NOT EXISTS idx_users_is_super_admin ON users(is_super_admin);

-- 3. Créer le super admin (mot de passe: "password123" hashé SHA-256)
-- Hash: ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
INSERT INTO users (email, password_hash, full_name, role, is_super_admin, created_at, updated_at) 
VALUES (
  'salah@khalfi.com',
  'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
  'Salah Khalfi',
  'admin',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Note: Le super admin sera filtré de toutes les listes d'utilisateurs
-- et protégé contre modification/suppression par le code applicatif
