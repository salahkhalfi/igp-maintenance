-- Table pour logger les tentatives d'envoi push
CREATE TABLE IF NOT EXISTS push_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  ticket_id INTEGER,
  status TEXT NOT NULL, -- 'success', 'failed', 'no_subscription'
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_push_logs_user_id ON push_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_push_logs_created_at ON push_logs(created_at);
