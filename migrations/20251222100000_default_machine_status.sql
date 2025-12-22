-- Set default status for all machines without status
UPDATE machines SET status = 'operational' WHERE status IS NULL OR status = '';
