-- Ensure General Group exists to prevent auto-join FK errors
INSERT OR IGNORE INTO chat_conversations (id, type, name, created_by)
VALUES ('general-group-uuid', 'group', 'Général', 1);

-- Ensure Admin is a member
INSERT OR IGNORE INTO chat_participants (conversation_id, user_id, role)
VALUES ('general-group-uuid', 1, 'admin');
