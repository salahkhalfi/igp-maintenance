-- Ajouter la colonne last_login pour suivre la dernière connexion des utilisateurs
ALTER TABLE users ADD COLUMN last_login DATETIME;

-- Initialiser avec la date de création pour les utilisateurs existants
UPDATE users SET last_login = created_at WHERE last_login IS NULL;
