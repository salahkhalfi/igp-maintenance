-- Migration: Ajout de la table pour les Invités Messenger (Externes)
-- Date: 2025-12-06
-- Description: Permet l'accès au chat pour des utilisateurs externes sans polluer la table users principale

CREATE TABLE IF NOT EXISTS chat_guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    company TEXT, -- Pour identifier (ex: "Fournisseur X")
    role TEXT DEFAULT 'guest', -- Toujours 'guest'
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index pour recherche rapide lors du login
CREATE INDEX IF NOT EXISTS idx_chat_guests_email ON chat_guests(email);
