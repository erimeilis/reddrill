# Audit Trail System - Deployment Guide

## Overview

The audit trail system tracks all template operations (create, update, delete, import) with full state snapshots for disaster recovery.

## Database Setup

### Local Development

```bash
# Apply migrations to local SQLite database
npx prisma migrate dev

# Or push schema directly (development only)
npx prisma db push
```

### Production (Cloudflare D1)

```bash
# Create D1 database
wrangler d1 create reddrill-audit

# Update wrangler.toml with the database ID from the output

# Apply migrations to D1
wrangler d1 migrations apply reddrill-audit --local # Test locally first
wrangler d1 migrations apply reddrill-audit # Apply to production
```

## Configuration

### 1. Enable Audit Trail

Access the Settings dialog in the application:
- Navigate to Settings → Audit Trail tab
- Toggle "Audit Trail Status" to Enabled
- Configure retention period (default: 30 days)
- Optionally set a user identifier

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

To enable audit logging for template operations, use the audited client wrapper:

```typescript
import { getPrismaClient } from '@/lib/db/audit-db';
import { createAuditedClient } from '@/lib/api/mandrill-audited';
import mandrillClient from '@/lib/api/mandrill';

// Create audited wrapper
const prisma = getPrismaClient();
const auditedClient = createAuditedClient(
  mandrillClient,
  prisma,
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

// Add to your worker
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const prisma = initializePrisma(env.DB);
    const settings = await getSettings(prisma);

    if (settings && settings.retention_days !== -1) {
      await cleanupOldLogs(prisma, settings.retention_days);
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

1. Check if audit is enabled: Settings → Audit Trail → Status
2. Verify Prisma Client is initialized with D1 binding
3. Check browser console for errors
4. Verify database migration was applied: `wrangler d1 execute reddrill-audit --command "SELECT * FROM audit_settings"`

### Migration Issues

```bash
# List migrations status
wrangler d1 migrations list reddrill-audit

# Force apply migration
wrangler d1 execute reddrill-audit --file=./prisma/migrations/20250126000000_initial_audit_schema/migration.sql
```

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
