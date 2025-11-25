-- Fix for technician names showing as "null"
-- This script repairs first_name and last_name values for existing technicians
-- Issue: Migration 0020 didn't update records where first_name/last_name were string "null"

-- Step 1: Fix technicians with literal "null" string values
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
WHERE role = 'technician' 
  AND (first_name = 'null' OR last_name = 'null' OR first_name IS NULL OR last_name IS NULL);

-- Step 2: For seed data, ensure proper formatting
-- Martin Tremblay (id=3)
UPDATE users SET first_name = 'Martin', last_name = 'Tremblay', full_name = 'Martin Tremblay' 
WHERE id = 3 AND email = 'technicien@igpglass.ca';

-- Sophie Gagnon (id=4)
UPDATE users SET first_name = 'Sophie', last_name = 'Gagnon', full_name = 'Sophie Gagnon' 
WHERE id = 4 AND email = 'technicien2@igpglass.ca';

-- Verify results
SELECT id, first_name, last_name, full_name, role 
FROM users 
WHERE role = 'technician' 
ORDER BY id;
