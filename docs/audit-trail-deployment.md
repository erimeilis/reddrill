# Audit Trail System - Deployment Guide

## Overview

The audit trail system tracks all template operations (create, update, delete, import) with full state snapshots for disaster recovery. Built with **Drizzle ORM** and **Cloudflare D1** for edge-optimized performance.

## Database Setup

### Local Development

The application supports local D1 development using Wrangler:

```bash
# Create local D1 database
npx wrangler d1 create reddrill-audit

# Update wrangler.toml with the database ID from the output

# Generate migrations from schema
npx drizzle-kit generate

# Apply migrations locally
npx wrangler d1 migrations apply reddrill-audit --local
```

### Production (Cloudflare D1)

```bash
# Apply migrations to production D1
npx wrangler d1 migrations apply reddrill-audit --remote

# Or use the deploy script which includes migration
npm run deploy
```

**Note**: D1 is only available when running via `wrangler pages dev` or in production. Standard `npm run dev` (Next.js dev server) will show audit as disabled.

## Configuration

### 1. Enable Audit Trail

Access the Audit Settings page in the application:
- Navigate to `/audit` page
- Toggle "Audit Trail Status" to Enabled
- Configure retention period (default: 30 days)
- Optionally set a user identifier
- Beautiful inline UI with no browser alerts!

### 2. Retention Policy

Choose retention period based on your needs:
- **7-30 days**: For active development/testing
- **60-90 days**: For production monitoring
- **Forever**: For complete audit history (⚠️ storage implications)

### 3. User Identifier

Optionally track who made changes:
- Email address: `admin@example.com`
- User ID: `user-123`
- System name: `CI/CD Pipeline`

## API Endpoints

### Settings Management

```bash
# Get current settings
GET /api/audit/settings

# Update settings
PUT /api/audit/settings
{
  "enabled": 1,
  "retention_days": 30,
  "user_identifier": "admin@example.com"
}

# Check if audit is enabled
HEAD /api/audit/settings/status
```

### Querying Logs

```bash
# Get audit logs with filtering
GET /api/audit/logs?operation_type=update&limit=50&offset=0

# Search logs
POST /api/audit/logs/search
{
  "query": "template-name",
  "filter": {
    "operation_type": "update",
    "status": "success"
  }
}

# Get specific log
GET /api/audit/logs/:id

# Get statistics
GET /api/audit/stats
```

### Maintenance

```bash
# Clean up old logs (based on retention policy)
POST /api/audit/cleanup

# Clear ALL logs (⚠️ DANGEROUS)
POST /api/audit/cleanup
{
  "clear_all": true
}
```

## Integration with Mandrill Client

Audit logging is automatically integrated via the audited client wrapper:

```typescript
import { getDb } from '@/lib/db/client';
import { createAuditedClient } from '@/lib/api/mandrill-audited';
import mandrillClient from '@/lib/api/mandrill';

// Create audited wrapper with Drizzle
const db = await getDb();
const auditedClient = createAuditedClient(
  mandrillClient,
  db,
  'user@example.com' // optional user identifier
);

// All operations are automatically logged
const template = await auditedClient.addTemplate(
  'my-template',
  '<html>...</html>',
  'Subject',
  'from@example.com',
  'From Name'
);
// → Audit log created with operation_type='create'

const updated = await auditedClient.updateTemplate(
  'my-template',
  '<html>New content</html>'
);
// → Audit log created with operation_type='update', before/after states

await auditedClient.deleteTemplate('my-template');
// → Audit log created with operation_type='delete', state_before captured
```

**Architecture**:
- `lib/db/client.ts` - Drizzle D1 client initialization
- `lib/db/schema.ts` - Drizzle schema definitions
- `lib/db/audit-db.ts` - Audit database operations (Drizzle)
- `lib/api/mandrill-audited.ts` - Audited Mandrill wrapper

## Storage Considerations

### Estimation

Average log size: **3.5 KB per operation**

Expected storage usage:
- 100 operations: ~350 KB
- 1,000 operations: ~3.5 MB
- 10,000 operations: ~35 MB
- 100,000 operations: ~350 MB

### D1 Limits

Cloudflare D1 free tier:
- Storage: 5 GB
- Reads: 5 million per day
- Writes: 100,000 per day

### Recommendations

1. **Development**: 30-day retention
2. **Production (low volume)**: 90-day retention
3. **Production (high volume)**: 30-day retention + periodic exports
4. **Compliance requirements**: Forever retention + regular backups

## Automated Cleanup

Set up automated cleanup with Cloudflare Workers Cron:

```typescript
// Add to wrangler.toml
[triggers]
crons = ["0 2 * * *"] # Run at 2 AM daily

// Add scheduled handler
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './lib/db/schema';
import { getSettings, cleanupOldLogs } from './lib/db/audit-db';

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const db = drizzle(env.DB, { schema });
    const settings = await getSettings(db);

    if (settings && settings.retentionDays !== -1) {
      await cleanupOldLogs(db, settings.retentionDays);
    }
  },
};
```

## Monitoring

### Key Metrics

- Total logs: `/api/audit/stats`
- Storage size: `/api/audit/stats` (estimated)
- Oldest entry: `/api/audit/stats`
- Logs by operation type: `/api/audit/stats`

### Health Checks

```bash
# Check if audit is enabled
curl -I https://your-app.workers.dev/api/audit/settings/status

# Get recent logs count
curl https://your-app.workers.dev/api/audit/logs?limit=1

# Get statistics
curl https://your-app.workers.dev/api/audit/stats
```

## Troubleshooting

### Audit Not Logging

1. Check if audit is enabled: Navigate to `/audit` page → Check Status toggle
2. Verify Drizzle client is initialized with D1 binding
3. Check browser console for errors
4. Verify database migration was applied: `wrangler d1 execute reddrill-audit --command "SELECT * FROM audit_settings"`
5. **Local Development**: Must use `wrangler pages dev` (not `npm run dev`) to access D1

### Migration Issues

```bash
# List migrations status
npx wrangler d1 migrations list reddrill-audit

# Apply migrations
npx wrangler d1 migrations apply reddrill-audit --local    # For local
npx wrangler d1 migrations apply reddrill-audit --remote   # For production

# Verify schema
npx wrangler d1 execute reddrill-audit --command "SELECT name FROM sqlite_master WHERE type='table'"
```

### UI Improvements

All browser alerts and confirms have been replaced with beautiful inline UI:
- **Error messages**: Inline Alert components with dismiss buttons
- **Success messages**: Auto-dismissing notifications (3 seconds)
- **Confirmations**: Proper modal dialogs with validation
- **Delete operations**: Type-to-confirm pattern for safety

### Performance Issues

If queries are slow:

```sql
-- Check index usage
EXPLAIN QUERY PLAN SELECT * FROM audit_logs WHERE operation_type = 'update';

-- Manually rebuild indexes if needed
REINDEX audit_logs;
```

## Security Considerations

1. **User Identifiers**: Don't store sensitive PII in user_identifier
2. **Error Details**: Error messages may contain sensitive data - audit logs are internal only
3. **Access Control**: Audit logs should only be accessible to administrators
4. **Retention Compliance**: Follow your organization's data retention policies
5. **Backup Strategy**: Export and backup audit logs before clearing

## Export and Backup

```bash
# Export all logs to JSON
curl https://your-app.workers.dev/api/audit/logs?limit=10000 > audit-backup.json

# Export specific time range
curl "https://your-app.workers.dev/api/audit/logs?date_from=2025-01-01&date_to=2025-01-31" > audit-january.json

# Export D1 database (Cloudflare CLI)
wrangler d1 execute reddrill-audit --command "SELECT * FROM audit_logs" --json > full-backup.json
```

## Disaster Recovery

To restore a template from audit log:

1. Go to Audit Logs page
2. Find the deletion/update log
3. Click "Details"
4. Review the "Before" state
5. Click "Restore Template" (copies state_before to create new template)

## Future Enhancements

- [ ] Automated restore API endpoint
- [ ] Bulk export functionality
- [ ] Advanced diff viewer
- [ ] Email notifications for critical operations
- [ ] Integration with external audit systems
- [ ] Compliance report generation
