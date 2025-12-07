ALTER TABLE planning_events ADD COLUMN image_url TEXT;
ALTER TABLE planning_events ADD COLUMN display_duration INTEGER DEFAULT 15;
ALTER TABLE planning_events ADD COLUMN is_popup BOOLEAN DEFAULT 0;
