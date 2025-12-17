-- Ensure Expert AI conversation exists to prevent FK errors
INSERT OR IGNORE INTO chat_conversations (id, type, name, created_by)
VALUES ('expert_ai', 'direct', 'Expert IA', 1);

-- Ensure Admin is a participant (optional but good for consistency)
INSERT OR IGNORE INTO chat_participants (conversation_id, user_id, role)
VALUES ('expert_ai', 1, 'admin');
