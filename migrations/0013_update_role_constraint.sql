-- Migration 0013: Update role constraint to support all 14 industrial roles
-- CRITICAL: The users table currently only allows 4 roles (admin, supervisor, technician, operator)
-- This migration adds support for 10 new roles: director, coordinator, planner, senior_technician,
-- team_leader, furnace_operator, safety_officer, quality_inspector, storekeeper, viewer

-- SQLite requires disabling foreign keys before recreating tables
PRAGMA foreign_keys = OFF;

-- Step 1: Create new table with 14-role constraint
CREATE TABLE users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN (
    'admin', 'director', 'supervisor', 'coordinator', 'planner',
    'senior_technician', 'technician', 'team_leader', 'furnace_operator',
    'operator', 'safety_officer', 'quality_inspector', 'storekeeper', 'viewer'
  )),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- Step 2: Copy all existing data
INSERT INTO users_new (id, email, password_hash, full_name, role, created_at, updated_at, last_login)
SELECT id, email, password_hash, full_name, role, created_at, updated_at, last_login
FROM users;

-- Step 3: Drop old table
DROP TABLE users;

-- Step 4: Rename new table to users
ALTER TABLE users_new RENAME TO users;

-- Step 5: Recreate the unique index on email
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Re-enable foreign keys
PRAGMA foreign_keys = ON;
