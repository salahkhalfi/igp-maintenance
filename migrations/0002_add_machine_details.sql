-- Add new columns to machines table for enhanced AI context
ALTER TABLE machines ADD COLUMN manufacturer TEXT;
ALTER TABLE machines ADD COLUMN year INTEGER;
ALTER TABLE machines ADD COLUMN technical_specs TEXT;
