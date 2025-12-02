-- Create planning_categories table
CREATE TABLE IF NOT EXISTS planning_categories (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT OR IGNORE INTO planning_categories (id, label, icon, color) VALUES 
('cut', 'Mise en Prod', 'fa-layer-group', 'blue'),
('ship', 'Expéditions', 'fa-truck', 'green'),
('maintenance', 'Maintenance', 'fa-tools', 'red'),
('reminder', 'Rappel / Note', 'fa-info-circle', 'yellow'),
('blocked', 'Bloqué', 'fa-ban', 'red');

-- Create planning_events table
CREATE TABLE IF NOT EXISTS planning_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'confirmed',
    title TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (type) REFERENCES planning_categories(id)
);

-- Create planner_notes table
CREATE TABLE IF NOT EXISTS planner_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    time TEXT,
    done BOOLEAN DEFAULT 0,
    priority TEXT DEFAULT 'medium',
    notified BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups by date
CREATE INDEX IF NOT EXISTS idx_planning_events_date ON planning_events(date);
