# 📊 Database Schema Audit - Multi-Tenant Readiness

> **Purpose:** Document schema changes needed for multi-tenant SaaS
> **Status:** Audit complete, changes PENDING until app stable

---

## 🗄️ Tables Classification

### ✅ READY (has deleted_at)
| Table | deleted_at | tenant_id needed |
|-------|------------|------------------|
| `users` | ✅ | ✅ YES |
| `machines` | ✅ | ✅ YES |
| `tickets` | ✅ | ✅ YES |

### ⚠️ NEEDS deleted_at (data tables with user content)
| Table | tenant_id needed | Priority |
|-------|------------------|----------|
| `chat_conversations` | ✅ YES | HIGH |
| `chat_messages` | ✅ YES | HIGH |
| `chat_participants` | ✅ YES | HIGH |
| `chat_action_cards` | ✅ YES | MEDIUM |
| `chat_guests` | ✅ YES | MEDIUM |
| `ticket_comments` | ✅ YES | HIGH |
| `ticket_timeline` | ✅ YES | HIGH |
| `media` | ✅ YES | HIGH |
| `messages` | ✅ YES | HIGH |
| `planning_events` | ✅ YES | MEDIUM |
| `planner_notes` | ✅ YES | MEDIUM |
| `planning_categories` | ✅ YES | LOW |
| `user_preferences` | ✅ YES | LOW |

### ⏭️ NO deleted_at NEEDED (logs/system tables)
| Table | Reason |
|-------|--------|
| `push_subscriptions` | Auto-cleaned on unsubscribe |
| `push_logs` | Audit log, never deleted |
| `webhook_notifications` | Audit log, never deleted |
| `audit_logs` | Audit log, never deleted |
| `pending_notifications` | Queue, auto-cleaned |
| `system_settings` | Will be replaced by `tenants.settings` |

---

## 🔄 Migration Strategy

### Phase 1: Add deleted_at (SAFE - no breaking changes)
```sql
-- Run these BEFORE multi-tenant migration
ALTER TABLE chat_conversations ADD COLUMN deleted_at TEXT;
ALTER TABLE chat_messages ADD COLUMN deleted_at TEXT;
ALTER TABLE chat_participants ADD COLUMN deleted_at TEXT;
ALTER TABLE chat_action_cards ADD COLUMN deleted_at TEXT;
ALTER TABLE chat_guests ADD COLUMN deleted_at TEXT;
ALTER TABLE ticket_comments ADD COLUMN deleted_at TEXT;
ALTER TABLE ticket_timeline ADD COLUMN deleted_at TEXT;
ALTER TABLE media ADD COLUMN deleted_at TEXT;
ALTER TABLE messages ADD COLUMN deleted_at TEXT;
ALTER TABLE planning_events ADD COLUMN deleted_at TEXT;
ALTER TABLE planner_notes ADD COLUMN deleted_at TEXT;
ALTER TABLE planning_categories ADD COLUMN deleted_at TEXT;
ALTER TABLE user_preferences ADD COLUMN deleted_at TEXT;
```

### Phase 2: Add tenant_id (BREAKING - requires code changes)
```sql
-- Run AFTER multi-tenant middleware is ready
ALTER TABLE users ADD COLUMN tenant_id TEXT REFERENCES tenants(id);
ALTER TABLE machines ADD COLUMN tenant_id TEXT REFERENCES tenants(id);
ALTER TABLE tickets ADD COLUMN tenant_id TEXT REFERENCES tenants(id);
-- ... (all tables)

-- Migrate existing data to default tenant
UPDATE users SET tenant_id = 'default-tenant' WHERE tenant_id IS NULL;
-- ... (all tables)

-- Create indexes
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_machines_tenant ON machines(tenant_id);
CREATE INDEX idx_tickets_tenant ON tickets(tenant_id);
-- ... (all tables)
```

---

## 📋 Pre-Migration Checklist

- [ ] App stable 2+ weeks in production
- [ ] All critical bugs fixed
- [ ] Full database backup
- [ ] Multi-tenant middleware ready
- [ ] All queries updated to filter by tenant_id
- [ ] Tests for data isolation

---

## 📅 Last Updated
2024-12-23 - Initial audit
