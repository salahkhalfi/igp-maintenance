-- Migration: Remove Foreign Key constraints on user_id to allow Guests (negative IDs)
-- Date: 2025-12-08

PRAGMA foreign_keys=OFF;

-- 1. Fix push_subscriptions
CREATE TABLE new_push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_type TEXT,
  device_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(endpoint)
  -- Removed FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO new_push_subscriptions SELECT id, user_id, endpoint, p256dh, auth, device_type, device_name, created_at, last_used FROM push_subscriptions;
DROP TABLE push_subscriptions;
ALTER TABLE new_push_subscriptions RENAME TO push_subscriptions;
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_last_used ON push_subscriptions(last_used);

-- 2. Fix pending_notifications
CREATE TABLE new_pending_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon TEXT,
  badge TEXT,
  data TEXT, -- JSON serialized
  sent_to_endpoints TEXT DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  -- Removed FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO new_pending_notifications SELECT id, user_id, title, body, icon, badge, data, sent_to_endpoints, created_at FROM pending_notifications;
DROP TABLE pending_notifications;
ALTER TABLE new_pending_notifications RENAME TO pending_notifications;
CREATE INDEX idx_pending_notifications_user_id ON pending_notifications(user_id);
CREATE INDEX idx_pending_notifications_created ON pending_notifications(created_at);

PRAGMA foreign_keys=ON;
