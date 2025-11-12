-- Migration pour ajouter le système de notifications webhook pour tickets expirés
-- Date: 2024-11-12

-- Table pour tracer les notifications webhook envoyées
CREATE TABLE IF NOT EXISTS webhook_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  webhook_url TEXT NOT NULL,
  sent_at DATETIME NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- Index pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_webhook_notifications_ticket_id ON webhook_notifications(ticket_id);
CREATE INDEX IF NOT EXISTS idx_webhook_notifications_type ON webhook_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_webhook_notifications_sent_at ON webhook_notifications(sent_at);

-- Index composite pour vérifier si notification déjà envoyée dans les 24h
CREATE INDEX IF NOT EXISTS idx_webhook_ticket_type_sent ON webhook_notifications(ticket_id, notification_type, sent_at);
