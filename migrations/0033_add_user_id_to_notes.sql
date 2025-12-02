-- Add user_id to planner_notes table
ALTER TABLE planner_notes ADD COLUMN user_id INTEGER;

-- Create index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_planner_notes_user_id ON planner_notes(user_id);
