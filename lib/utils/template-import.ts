import { MandrillTemplate } from '@/lib/api/mandrill';
import type { TemplateExportData } from './template-export';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ImportValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  data?: TemplateExportData;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate a single template
 */
function validateTemplate(template: any, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `templates[${index}]`;

  // Required fields
  if (!template.name || typeof template.name !== 'string') {
    errors.push({
      field: `${prefix}.name`,
      message: 'Template name is required and must be a string',
      severity: 'error',
    });
  }

  if (!template.subject || typeof template.subject !== 'string') {
    errors.push({
      field: `${prefix}.subject`,
      message: 'Template subject is required',
      severity: 'error',
    });
  }

  // Email validation
  if (template.from_email && !isValidEmail(template.from_email)) {
    errors.push({
      field: `${prefix}.from_email`,
      message: `Invalid email format: ${template.from_email}`,
      severity: 'error',
    });
  }

  // Labels must be array
  if (template.labels && !Array.isArray(template.labels)) {
    errors.push({
      field: `${prefix}.labels`,
      message: 'Labels must be an array',
      severity: 'error',
    });
  }

  return errors;
}

/**
 * Validate import data structure and contents
 */
export function validateImportData(jsonData: unknown): ImportValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Basic type check
  if (typeof jsonData !== 'object' || jsonData === null) {
    return {
      valid: false,
      errors: [{ field: 'root', message: 'Invalid JSON format', severity: 'error' }],
      warnings: [],
    };
  }

  const data = jsonData as any;

  // Version check
  if (!data.version) {
    warnings.push({
      field: 'version',
      message: 'No version specified, assuming 1.0',
      severity: 'warning',
    });
  } else if (data.version !== '1.0') {
    errors.push({
      field: 'version',
      message: `Unsupported version: ${data.version}. Expected 1.0`,
      severity: 'error',
    });
  }

  // Templates array check
  if (!Array.isArray(data.templates)) {
    errors.push({
      field: 'templates',
      message: 'Templates must be an array',
      severity: 'error',
    });
  } else {
    // Validate each template
    data.templates.forEach((template: any, index: number) => {
      const templateErrors = validateTemplate(template, index);
      errors.push(...templateErrors);
    });

    if (data.templates.length === 0) {
      warnings.push({
        field: 'templates',
        message: 'No templates to import',
        severity: 'warning',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    data: errors.length === 0 ? (data as TemplateExportData) : undefined,
  };
}

/**
 * Import templates by deleting all existing and creating new ones
 */
export async function importTemplates(
  data: TemplateExportData,
  mandrillClient: any
): Promise<{ success: boolean; imported: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;

  try {
    // Step 1: Delete all existing templates
    const existingTemplates = await mandrillClient.templates.list();

    for (const template of existingTemplates) {
      try {
        await mandrillClient.templates.delete({ name: template.name });
      } catch (error) {
        errors.push(`Failed to delete template "${template.name}": ${error}`);
      }
    }

    // Step 2: Create templates from import
    for (const template of data.templates) {
      try {
        await mandrillClient.templates.add({
          name: template.name,
          code: template.code,
          subject: template.subject,
          from_email: template.from_email,
          from_name: template.from_name,
          text: template.text,
          labels: template.labels,
        });
        imported++;
      } catch (error) {
        errors.push(`Failed to create template "${template.name}": ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      imported,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      imported,
      errors: [`Import operation failed: ${error}`],
    };
  }
}
