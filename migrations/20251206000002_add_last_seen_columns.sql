-- Migration: Ajout de la colonne last_seen pour le suivi en ligne
-- Date: 2025-12-06

ALTER TABLE users ADD COLUMN last_seen DATETIME;
ALTER TABLE chat_guests ADD COLUMN last_seen DATETIME;
