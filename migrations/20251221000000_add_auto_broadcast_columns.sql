-- Add columns for auto-generated TV broadcasts (machine down alerts)
-- These alerts bypass admin and are created automatically when a machine is marked as down
-- Note: Using CREATE TABLE to check columns (SQLite doesn't have ADD COLUMN IF NOT EXISTS)

-- Check if columns exist, if not add them (wrapped in exception handling via application)
-- Since SQLite doesn't support ADD COLUMN IF NOT EXISTS, we rely on the migration system
-- to track what's applied. These columns may already exist from manual application.

-- Skipping ALTER TABLE - columns already exist in production
-- Original commands (kept for documentation):
-- ALTER TABLE broadcast_messages ADD COLUMN is_auto_generated BOOLEAN DEFAULT 0;
-- ALTER TABLE broadcast_messages ADD COLUMN source_ticket_id INTEGER;
-- ALTER TABLE broadcast_messages ADD COLUMN source_machine_id INTEGER;

-- Index for quick lookup when removing auto-alerts
CREATE INDEX IF NOT EXISTS idx_broadcast_auto_machine ON broadcast_messages(is_auto_generated, source_machine_id);
