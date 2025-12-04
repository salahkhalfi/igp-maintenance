-- Disable foreign keys to allow table reconstruction
PRAGMA foreign_keys=OFF;

-- 1. Create new table without CHECK constraint on status
CREATE TABLE tickets_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  machine_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'received', -- Constraint removed
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
  reported_by INTEGER NOT NULL,
  assigned_to INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  reporter_name TEXT,
  assignee_name TEXT,
  scheduled_date DATETIME,
  FOREIGN KEY (machine_id) REFERENCES machines(id),
  FOREIGN KEY (reported_by) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- 2. Copy data from old table
INSERT INTO tickets_new (id, ticket_id, title, description, machine_id, status, priority, reported_by, assigned_to, created_at, updated_at, completed_at, reporter_name, assignee_name, scheduled_date)
SELECT id, ticket_id, title, description, machine_id, status, priority, reported_by, assigned_to, created_at, updated_at, completed_at, reporter_name, assignee_name, scheduled_date FROM tickets;

-- 3. Drop old table
DROP TABLE tickets;

-- 4. Rename new table
ALTER TABLE tickets_new RENAME TO tickets;

-- 5. Recreate indexes
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_machine ON tickets(machine_id);
CREATE INDEX idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX idx_tickets_created ON tickets(created_at);

-- Re-enable foreign keys
PRAGMA foreign_keys=ON;
