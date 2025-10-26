-- Migration 001: Initial Audit Trail Schema
-- Applied: TIMESTAMP will be set automatically

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Main audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  -- Primary identification
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Operation metadata
  operation_type TEXT NOT NULL CHECK (operation_type IN ('create', 'update', 'delete', 'import', 'restore')),
  operation_status TEXT NOT NULL CHECK (operation_status IN ('success', 'failure', 'partial')),
  operation_id TEXT,

  -- Template identification
  template_slug TEXT,
  template_name TEXT NOT NULL,

  -- State snapshots (stored as JSON)
  state_before TEXT,
  state_after TEXT,

  -- Change details
  changes_summary TEXT,

  -- User context
  user_identifier TEXT,

  -- Error tracking
  error_message TEXT,
  error_details TEXT,

  -- Import/Bulk operation metadata
  bulk_operation INTEGER DEFAULT 0 CHECK (bulk_operation IN (0, 1)),
  bulk_total_count INTEGER,
  bulk_success_count INTEGER,
  bulk_failure_count INTEGER,

  -- Searchability
  search_text TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_template_name ON audit_logs(template_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation_type ON audit_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation_id ON audit_logs(operation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_search ON audit_logs(search_text);
CREATE INDEX IF NOT EXISTS idx_audit_logs_composite ON audit_logs(operation_type, created_at DESC);

-- User settings table
CREATE TABLE IF NOT EXISTS audit_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  enabled INTEGER DEFAULT 0 CHECK (enabled IN (0, 1)),
  retention_days INTEGER DEFAULT 30,
  user_identifier TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT OR IGNORE INTO audit_settings (id, enabled, retention_days) VALUES (1, 0, 30);

-- Record this migration
INSERT OR IGNORE INTO schema_migrations (version) VALUES (1);
