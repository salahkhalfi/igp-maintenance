ALTER TABLE chat_participants ADD COLUMN display_order INTEGER DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_participants_order ON chat_participants(user_id, display_order);
