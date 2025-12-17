-- Migration: Add Soft Delete Columns
-- Date: 2025-12-17
-- Description: Adding deleted_at column to users, machines, and tickets for safety.

-- 1. Add deleted_at to users
ALTER TABLE users ADD COLUMN deleted_at TEXT;

-- 2. Add deleted_at to machines
ALTER TABLE machines ADD COLUMN deleted_at TEXT;

-- 3. Add deleted_at to tickets
ALTER TABLE tickets ADD COLUMN deleted_at TEXT;
