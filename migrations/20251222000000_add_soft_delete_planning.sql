-- Migration: Add Soft Delete to Planning Tables
-- Date: 2025-12-22
-- Description: Adding deleted_at column to planning_events for data recovery

-- Add deleted_at to planning_events
ALTER TABLE planning_events ADD COLUMN deleted_at TEXT;

-- Add deleted_at to planner_notes (bonus)
ALTER TABLE planner_notes ADD COLUMN deleted_at TEXT;
