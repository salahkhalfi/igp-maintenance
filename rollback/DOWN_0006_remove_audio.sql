-- Rollback migration 0006 (audio messages)
-- À exécuter SEULEMENT en cas de problème

DROP INDEX IF EXISTS idx_messages_audio;
ALTER TABLE messages DROP COLUMN IF EXISTS audio_file_key;
ALTER TABLE messages DROP COLUMN IF EXISTS audio_duration;
ALTER TABLE messages DROP COLUMN IF EXISTS audio_size;
