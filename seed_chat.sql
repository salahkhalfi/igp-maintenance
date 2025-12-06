-- Données de test pour Messenger (IGP Chat) - CORRIGÉ pour users existants (1, 2, 4, 7)
-- Doit être exécuté APRÈS la création des tables chat_...

-- 1. Création d'un groupe "Général"
INSERT OR IGNORE INTO chat_conversations (id, type, name, created_by) 
VALUES ('general-group-uuid', 'group', 'Général Maintenance', 1);

-- 2. Ajout des utilisateurs au groupe "Général"
INSERT OR IGNORE INTO chat_participants (conversation_id, user_id, role) VALUES 
('general-group-uuid', 1, 'admin'),   -- Admin
('general-group-uuid', 2, 'member'),  -- Laurent
('general-group-uuid', 4, 'member'),  -- Salah
('general-group-uuid', 7, 'member');  -- Yves

-- 3. Messages de test dans le groupe Général
INSERT OR IGNORE INTO chat_messages (id, conversation_id, sender_id, type, content, created_at) VALUES 
('msg-1', 'general-group-uuid', 1, 'text', 'Bienvenue sur le nouveau système de messagerie IGP !', datetime('now', '-1 hour')),
('msg-2', 'general-group-uuid', 2, 'text', 'Super, c''est beaucoup mieux que les courriels.', datetime('now', '-55 minutes')),
('msg-3', 'general-group-uuid', 7, 'text', 'Est-ce qu''on peut envoyer des photos ?', datetime('now', '-50 minutes')),
('msg-4', 'general-group-uuid', 1, 'text', 'Oui, photos et messages audio sont supportés.', datetime('now', '-45 minutes'));

-- 4. Conversation privée (Direct) entre Admin et Laurent
INSERT OR IGNORE INTO chat_conversations (id, type, name, created_by) 
VALUES ('dm-admin-laurent', 'direct', NULL, 1);

INSERT OR IGNORE INTO chat_participants (conversation_id, user_id, role) VALUES 
('dm-admin-laurent', 1, 'member'),
('dm-admin-laurent', 2, 'member');

INSERT OR IGNORE INTO chat_messages (id, conversation_id, sender_id, type, content, created_at) VALUES 
('msg-dm-1', 'dm-admin-laurent', 1, 'text', 'Laurent, as-tu vérifié la polisseuse ?', datetime('now', '-30 minutes')),
('msg-dm-2', 'dm-admin-laurent', 2, 'text', 'Oui, je suis dessus en ce moment.', datetime('now', '-10 minutes'));
