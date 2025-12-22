-- Migration: Add audit_logs table for complete traceability
-- Date: 2025-12-22
-- Purpose: Track all critical actions for compliance and debugging

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Who performed the action
  user_id INTEGER,
  user_email TEXT,
  user_role TEXT,
  
  -- What action was performed
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout', 'export', 'import'
  resource TEXT NOT NULL, -- 'ticket', 'user', 'machine', 'message', 'conversation', 'settings'
  resource_id TEXT, -- ID of the affected resource
  
  -- Details
  details TEXT, -- JSON with additional context (old_value, new_value, etc.)
  ip_address TEXT,
  user_agent TEXT,
  
  -- Metadata
  status TEXT DEFAULT 'success', -- 'success', 'failed', 'error'
  error_message TEXT,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource, resource_id);
