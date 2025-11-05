-- Ajouter le rôle 'supervisor' aux rôles autorisés
-- Note: SQLite ne supporte pas ALTER TABLE ... ALTER COLUMN directement
-- On va utiliser une approche de recréation de table

-- Créer une nouvelle table temporaire avec le nouveau CHECK
CREATE TABLE users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'supervisor', 'technician', 'operator')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copier les données existantes
INSERT INTO users_new (id, email, password_hash, full_name, role, created_at, updated_at)
SELECT id, email, password_hash, full_name, role, created_at, updated_at FROM users;

-- Supprimer l'ancienne table
DROP TABLE users;

-- Renommer la nouvelle table
ALTER TABLE users_new RENAME TO users;

-- Recréer l'index
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
