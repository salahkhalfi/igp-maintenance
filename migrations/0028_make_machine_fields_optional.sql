PRAGMA foreign_keys=OFF;

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

INSERT INTO machines_new (id, machine_type, model, serial_number, location, status, created_at, updated_at)
SELECT id, machine_type, model, serial_number, location, status, created_at, updated_at FROM machines;

DROP TABLE machines;

ALTER TABLE machines_new RENAME TO machines;

CREATE UNIQUE INDEX IF NOT EXISTS machines_serial_number_unique ON machines (serial_number);

PRAGMA foreign_keys=ON;
