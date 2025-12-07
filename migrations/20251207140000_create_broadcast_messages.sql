CREATE TABLE IF NOT EXISTS broadcast_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image_text', 'gallery'
  title TEXT,
  content TEXT,
  media_urls TEXT, -- JSON array of URLs
  display_duration INTEGER DEFAULT 15, -- seconds
  start_date DATETIME,
  end_date DATETIME,
  is_active BOOLEAN DEFAULT 1,
  priority INTEGER DEFAULT 0,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
