-- Migration: Remove Foreign Key constraints on user_id/sender_id to allow Guests (negative IDs)
-- Date: 2025-12-06

PRAGMA foreign_keys=OFF;

-- 1. Fix chat_participants
CREATE TABLE new_chat_participants (
    conversation_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member')),
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_read_at DATETIME,
    PRIMARY KEY (conversation_id, user_id),
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
    -- Removed FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO new_chat_participants SELECT * FROM chat_participants;
DROP TABLE chat_participants;
ALTER TABLE new_chat_participants RENAME TO chat_participants;
CREATE INDEX idx_chat_participants_user ON chat_participants(user_id);

-- 2. Fix chat_messages
CREATE TABLE new_chat_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id INTEGER NOT NULL,
    type TEXT DEFAULT 'text' CHECK(type IN ('text', 'image', 'audio', 'video', 'file', 'system')),
    content TEXT,
    media_key TEXT,
    media_url TEXT,
    media_meta TEXT,
    reply_to_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT 0,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    -- Removed FOREIGN KEY (sender_id) REFERENCES users(id)
    FOREIGN KEY (reply_to_id) REFERENCES chat_messages(id)
);

INSERT INTO new_chat_messages SELECT * FROM chat_messages;
DROP TABLE chat_messages;
ALTER TABLE new_chat_messages RENAME TO chat_messages;
CREATE INDEX idx_chat_messages_conv_date ON chat_messages(conversation_id, created_at DESC);

PRAGMA foreign_keys=ON;
