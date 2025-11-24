-- Migration: Split full_name into first_name and last_name
-- Date: 2025-11-23
-- Rollback: Revert to full_name (keep as backup for now)

-- Step 1: Add new columns (nullable for now)
ALTER TABLE users ADD COLUMN first_name TEXT;
ALTER TABLE users ADD COLUMN last_name TEXT;

-- Step 2: Parse full_name into first_name and last_name
-- Logic: Split on first space
-- "Marc Bélanger" → first="Marc", last="Bélanger"
-- "Laurent" → first="Laurent", last=""
-- "👥 Toute l'équipe" → first="👥 Toute l'équipe", last="" (system user, keep as-is)

UPDATE users 
SET 
  first_name = CASE 
    WHEN INSTR(full_name, ' ') > 0 THEN SUBSTR(full_name, 1, INSTR(full_name, ' ') - 1)
    ELSE full_name
  END,
  last_name = CASE 
    WHEN INSTR(full_name, ' ') > 0 THEN TRIM(SUBSTR(full_name, INSTR(full_name, ' ') + 1))
    ELSE ''
  END
WHERE first_name IS NULL OR last_name IS NULL;

-- Step 3: Make columns NOT NULL (all users now have values)
-- SQLite doesn't support ALTER COLUMN, so we need to recreate table
-- But for safety, we'll keep them nullable for now and enforce in application

-- Step 4: Keep full_name column for now (rollback safety)
-- Will remove in future migration after validation

-- Step 5: Create index for search performance
CREATE INDEX IF NOT EXISTS idx_users_first_name ON users(first_name);
CREATE INDEX IF NOT EXISTS idx_users_last_name ON users(last_name);
