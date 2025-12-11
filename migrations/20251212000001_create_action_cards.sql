-- Migration: Ajout des Cartes d'Action (Task Management dans le Chat)
-- Date: 2025-12-11
-- Description: Permet de convertir des messages en tickets/tâches avec statut et assignation

CREATE TABLE IF NOT EXISTS chat_action_cards (
    id TEXT PRIMARY KEY, -- UUID (lié au message_id ou indépendant)
    message_id TEXT NOT NULL UNIQUE, -- Le message d'origine qui devient une tâche
    conversation_id TEXT NOT NULL,
    
    -- État de la tâche
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'cancelled')),
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Personnes
    created_by INTEGER NOT NULL, -- Qui a transformé le message en tâche
    assignee_id INTEGER, -- Qui est responsable (NULL = Personne)
    
    -- Meta
    due_date DATETIME, -- Date limite optionnelle
    tags TEXT, -- JSON array de tags (ex: ["panne", "maintenance"])
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    
    FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (assignee_id) REFERENCES users(id)
);

-- Index pour retrouver rapidement les tâches d'une conversation
CREATE INDEX IF NOT EXISTS idx_chat_actions_conv ON chat_action_cards(conversation_id);
-- Index pour retrouver les tâches assignées à quelqu'un
CREATE INDEX IF NOT EXISTS idx_chat_actions_assignee ON chat_action_cards(assignee_id);
-- Index pour le dashboard (tâches ouvertes)
CREATE INDEX IF NOT EXISTS idx_chat_actions_status ON chat_action_cards(status);
