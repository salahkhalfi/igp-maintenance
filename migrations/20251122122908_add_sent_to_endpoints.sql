-- Ajouter colonne pour tracker les endpoints ayant déjà reçu la notification
ALTER TABLE pending_notifications ADD COLUMN sent_to_endpoints TEXT DEFAULT '[]';

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_pending_notifications_created 
ON pending_notifications(created_at);
