-- Add columns for auto-generated TV broadcasts (machine down alerts)
-- These alerts bypass admin and are created automatically when a machine is marked as down

ALTER TABLE broadcast_messages ADD COLUMN is_auto_generated BOOLEAN DEFAULT 0;
ALTER TABLE broadcast_messages ADD COLUMN source_ticket_id INTEGER;
ALTER TABLE broadcast_messages ADD COLUMN source_machine_id INTEGER;

-- Index for quick lookup when removing auto-alerts
CREATE INDEX IF NOT EXISTS idx_broadcast_auto_machine ON broadcast_messages(is_auto_generated, source_machine_id);
