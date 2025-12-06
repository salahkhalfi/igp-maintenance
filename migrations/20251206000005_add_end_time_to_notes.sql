-- Migration: Add end_time to planner_notes for TV broadcast duration control
ALTER TABLE planner_notes ADD COLUMN end_time TEXT;
