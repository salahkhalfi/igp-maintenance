-- Migration: Ajout de la colonne transcription pour les messages audio
-- Date: 2025-12-12
ALTER TABLE chat_messages ADD COLUMN transcription TEXT;
