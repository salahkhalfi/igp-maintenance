-- Migration: Création des tables pour le module Messenger (WhatsApp-style)
-- Date: 2025-12-06
-- Description: Système de chat indépendant avec support groupes et média

-- 1. Conversations (Threads)
CREATE TABLE IF NOT EXISTS chat_conversations (
    id TEXT PRIMARY KEY, -- UUID
    type TEXT NOT NULL CHECK(type IN ('direct', 'group')),
    name TEXT, -- Nom du groupe (NULL pour direct)
    icon TEXT, -- Icône ou Avatar du groupe
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Pour trier par activité récente
    created_by INTEGER, -- ID utilisateur créateur
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 2. Participants (Membres des conversations)
CREATE TABLE IF NOT EXISTS chat_participants (
    conversation_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member')), -- Pour gestion des groupes
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_read_at DATETIME, -- Pour savoir quels messages ont été lus (Blue ticks logic)
    PRIMARY KEY (conversation_id, user_id),
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Messages (Contenu)
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY, -- UUID
    conversation_id TEXT NOT NULL,
    sender_id INTEGER NOT NULL,
    type TEXT DEFAULT 'text' CHECK(type IN ('text', 'image', 'audio', 'video', 'file', 'system')),
    content TEXT, -- Texte du message ou description système
    media_key TEXT, -- Clé R2 pour les fichiers
    media_url TEXT, -- URL signée ou publique (cache)
    media_meta TEXT, -- JSON pour metadata (durée audio, taille fichier, dimensions image)
    reply_to_id TEXT, -- Pour répondre à un message spécifique
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT 0,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (reply_to_id) REFERENCES chat_messages(id)
);

-- Index pour la performance
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_date ON chat_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated ON chat_conversations(updated_at DESC);
