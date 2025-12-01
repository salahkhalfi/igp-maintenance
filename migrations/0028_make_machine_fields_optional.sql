PRAGMA foreign_keys=OFF;

-- 1. Backup and Drop Tickets (referencing table) to allow modifying Machines
CREATE TABLE IF NOT EXISTS tickets_temp AS SELECT * FROM tickets;
DROP TABLE IF EXISTS tickets;

-- 2. Create new Machines table
CREATE TABLE machines_new (
  id integer PRIMARY KEY AUTOINCREMENT,
  machine_type text NOT NULL,
  model text,
  serial_number text,
  location text,
  status text DEFAULT 'operational',
  created_at text DEFAULT CURRENT_TIMESTAMP,
  updated_at text DEFAULT CURRENT_TIMESTAMP
);

-- 3. Migrate data
INSERT INTO machines_new (id, machine_type, model, serial_number, location, status, created_at, updated_at)
SELECT id, machine_type, model, serial_number, location, status, created_at, updated_at FROM machines;

-- 4. Swap tables
DROP TABLE machines;
ALTER TABLE machines_new RENAME TO machines;
CREATE UNIQUE INDEX IF NOT EXISTS machines_serial_number_unique ON machines (serial_number);

-- 5. Recreate Tickets table (Schema from 0022 + updates)
CREATE TABLE tickets (
  id integer PRIMARY KEY AUTOINCREMENT,
  ticket_id text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  machine_id integer NOT NULL REFERENCES machines(id),
  status text NOT NULL DEFAULT 'received',
  priority text NOT NULL DEFAULT 'medium',
  reported_by integer NOT NULL REFERENCES users(id),
  assigned_to integer REFERENCES users(id),
  reporter_name text,
  assignee_name text,
  scheduled_date text,
  created_at text DEFAULT CURRENT_TIMESTAMP,
  updated_at text DEFAULT CURRENT_TIMESTAMP,
  completed_at text
);

CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_machine ON tickets(machine_id);
CREATE INDEX idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX idx_tickets_created ON tickets(created_at);

-- 6. Restore Tickets data
INSERT INTO tickets SELECT * FROM tickets_temp;
DROP TABLE tickets_temp;

PRAGMA foreign_keys=ON;
