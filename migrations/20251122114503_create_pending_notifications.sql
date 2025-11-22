-- Table pour stocker les notifications en attente (queue)
CREATE TABLE IF NOT EXISTS pending_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon TEXT,
  badge TEXT,
  data TEXT, -- JSON serialized
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index pour recherche rapide par user_id
CREATE INDEX IF NOT EXISTS idx_pending_notifications_user_id 
ON pending_notifications(user_id);
