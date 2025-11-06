-- Migration: Ajout support messages audio
-- Date: 2025-11-06
-- Description: Ajoute colonnes pour stocker les messages vocaux

-- Ajouter colonnes audio à la table messages
ALTER TABLE messages ADD COLUMN audio_file_key TEXT;
ALTER TABLE messages ADD COLUMN audio_duration INTEGER; -- en secondes
ALTER TABLE messages ADD COLUMN audio_size INTEGER; -- en bytes

-- Index pour recherche rapide des messages audio
CREATE INDEX IF NOT EXISTS idx_messages_audio ON messages(audio_file_key) WHERE audio_file_key IS NOT NULL;
