/**
 * Template Diff Utilities
 * Generates diffs and change summaries for audit logs
 */

import type {
  MandrillTemplate,
} from '../api/mandrill';
import type {
  AuditTemplateState,
  AuditChange,
  TemplateDiff,
} from '../types/audit';

/**
 * Convert Mandrill template to audit state format
 */
export function templateToAuditState(template: MandrillTemplate): AuditTemplateState {
  return {
    slug: template.slug,
    name: template.name,
    labels: template.labels || [],
    code: template.code || '',
    subject: template.subject || '',
    from_email: template.from_email || '',
    from_name: template.from_name || '',
    text: template.text || '',
    publish_name: template.publish_name || '',
    publish_code: template.publish_code || '',
    publish_subject: template.publish_subject || '',
    publish_from_email: template.publish_from_email || '',
    publish_from_name: template.publish_from_name || '',
    publish_text: template.publish_text || '',
    published_at: template.published_at || null,
    created_at: template.created_at,
    updated_at: template.updated_at,
    draft_updated_at: template.draft_updated_at,
  };
}

/**
 * Generate diff between two template states
 */
export function generateDiff(
  before: MandrillTemplate,
  after: MandrillTemplate
): TemplateDiff {
  const beforeState = templateToAuditState(before);
  const afterState = templateToAuditState(after);

  const changes = generateChangesSummary(beforeState, afterState);

  const summary = changes.length === 0
    ? 'No changes'
    : `Changed: ${changes.map(c => c.field).join(', ')}`;

  return {
    changes,
    has_changes: changes.length > 0,
    summary,
  };
}

/**
 * Generate changes summary array
 */
export function generateChangesSummary(
  before: AuditTemplateState,
  after: AuditTemplateState
): AuditChange[] {
  const changes: AuditChange[] = [];

  // Compare all fields
  const fields: (keyof AuditTemplateState)[] = [
    'name',
    'code',
    'subject',
    'from_email',
    'from_name',
    'text',
    'publish_code',
    'publish_subject',
    'publish_from_email',
    'publish_from_name',
    'publish_text',
  ];

  for (const field of fields) {
    const oldValue = before[field];
    const newValue = after[field];

    if (oldValue !== newValue) {
      changes.push({
        field,
        oldValue,
        newValue,
        changeType: 'modified',
      });
    }
  }

  // Compare labels array
  const oldLabels = before.labels.sort().join(',');
  const newLabels = after.labels.sort().join(',');

  if (oldLabels !== newLabels) {
    changes.push({
      field: 'labels',
      oldValue: before.labels,
      newValue: after.labels,
      changeType: 'modified',
    });
  }

  return changes;
}

/**
 * Build search text from template for audit logs
 */
export function buildSearchText(template: MandrillTemplate | AuditTemplateState): string {
  const parts: string[] = [
    template.name,
    template.slug || '',
  ];

  if ('labels' in template && Array.isArray(template.labels)) {
    parts.push(...template.labels);
  }

  return parts.filter(Boolean).join(' ').toLowerCase();
}

/**
 * Format change for display
 */
export function formatChange(change: AuditChange): string {
  const { field, oldValue, newValue, changeType } = change;

  if (changeType === 'added') {
    return `Added ${field}: ${JSON.stringify(newValue)}`;
  }

  if (changeType === 'removed') {
    return `Removed ${field}: ${JSON.stringify(oldValue)}`;
  }

  // Modified
  const oldStr = typeof oldValue === 'string' && oldValue.length > 100
    ? oldValue.substring(0, 100) + '...'
    : JSON.stringify(oldValue);

  const newStr = typeof newValue === 'string' && newValue.length > 100
    ? newValue.substring(0, 100) + '...'
    : JSON.stringify(newValue);

  return `Changed ${field}: ${oldStr} → ${newStr}`;
}
