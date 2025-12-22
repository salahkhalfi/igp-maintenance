-- Migration: Add ai_context field to users table
-- Purpose: Allow storing additional context for AI interactions per user
-- This enables personalized AI responses based on user profile (skills, preferences, certifications)
-- SaaS-compliant: Generic field, no hard-coded values

ALTER TABLE users ADD COLUMN ai_context TEXT;

-- Note: This field is optional and can contain free-form text like:
-- - Technical specialties (e.g., "Expert hydraulics", "Electrical certification")
-- - Communication preferences (e.g., "Prefers detailed explanations", "Experienced - concise answers")
-- - Work context (e.g., "Night shift", "Zone B responsible")
