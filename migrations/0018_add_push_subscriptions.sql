-- Migration: Ajouter table push_subscriptions pour notifications PWA
-- Date: 2025-11-14
-- Description: Stocke les tokens push pour notifications instantanées

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_type TEXT,
  device_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(endpoint)
);

-- Index pour recherche rapide par utilisateur
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id 
ON push_subscriptions(user_id);

-- Index pour nettoyage tokens expirés
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_last_used 
ON push_subscriptions(last_used);
