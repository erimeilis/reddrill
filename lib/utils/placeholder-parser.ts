/**
 * Placeholder Parser Utilities
 *
 * Detects, parses, and validates Mandrill placeholders in template content.
 * Supports multiple formats: Mailchimp (*|VAR|*), Handlebars ({{var}}),
 * Global vars (*|GLOBAL:VAR|*), and conditionals (*|IF:VAR|*).
 */

export type PlaceholderFormat =
  | 'mailchimp'      // *|VAR|*
  | 'handlebars'     // {{var}}
  | 'global'         // *|GLOBAL:VAR|*
  | 'conditional';   // *|IF:VAR|*, *|ELSE:|*, etc.

export interface ParsedPlaceholder {
  raw: string;           // Full text: "*|FNAME|*"
  name: string;          // Variable name: "FNAME"
  format: PlaceholderFormat;
  startIndex: number;
  endIndex: number;
}

export interface TemplatePlaceholder {
  name: string;           // e.g., "FNAME", "email"
  format: PlaceholderFormat;
  locations: {
    field: 'code' | 'text' | 'subject' | 'from_name' | 'from_email' |
            'publish_code' | 'publish_text' | 'publish_subject' | 'publish_from_name' | 'publish_from_email';
    count: number;
    examples: string[];    // Actual placeholder instances
  }[];
  description?: string;    // Optional description of what this variable means
}

export interface PlaceholderValidation {
  isValid: boolean;
  warnings: string[];
  missing: string[];       // Placeholders in original but not in translated
  added: string[];         // Placeholders in translated but not in original
  corrupted: string[];     // Placeholders with invalid syntax
}

/**
 * Standard Mandrill placeholder descriptions
 */
export const STANDARD_PLACEHOLDERS: Record<string, string> = {
  'FNAME': 'Recipient first name',
  'LNAME': 'Recipient last name',
  'EMAIL': 'Recipient email address',
  'COMPANY': 'Recipient company name',
  'PHONE': 'Recipient phone number',
  'ADDRESS': 'Recipient street address',
  'CITY': 'Recipient city',
  'STATE': 'Recipient state/province',
  'ZIP': 'Recipient postal code',
  'COUNTRY': 'Recipient country',
  'UNSUBSCRIBE': 'Unsubscribe URL',
  'LIST_UNSUBSCRIBE': 'List unsubscribe header',
  'SUBJECT': 'Email subject line',
  'MC_PREVIEW_TEXT': 'Preview text for inbox',
  'CURRENT_YEAR': 'Current year',
};

/**
 * Regular expressions for different placeholder formats
 */
const PLACEHOLDER_PATTERNS = {
  // Mailchimp format: *|VARIABLE|* (supports uppercase and lowercase)
  mailchimp: /\*\|([A-Za-z_][A-Za-z0-9_]*)\|\*/g,

  // Handlebars format: {{variable}}
  handlebars: /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g,

  // Global vars: *|GLOBAL:VARIABLE|* (supports uppercase and lowercase)
  global: /\*\|GLOBAL:([A-Za-z_][A-Za-z0-9_]*)\|\*/gi,

  // Conditionals: *|IF:VAR|*, *|ELSEIF:VAR|*, *|ELSE:|*, *|END:IF|* (supports uppercase and lowercase)
  conditional: /\*\|(IF|ELSEIF|ELSE|END:IF):?([A-Za-z_][A-Za-z0-9_]*)?\|\*/gi,
};

/**
 * Parse placeholders from text content
 */
export function parsePlaceholders(text: string): ParsedPlaceholder[] {
  if (!text) return [];

  const placeholders: ParsedPlaceholder[] = [];

  // Parse Mailchimp format
  const mailchimpMatches = text.matchAll(PLACEHOLDER_PATTERNS.mailchimp);
  for (const match of mailchimpMatches) {
    if (match.index !== undefined) {
      placeholders.push({
        raw: match[0],
        name: match[1],
        format: 'mailchimp',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  // Parse Handlebars format
  const handlebarsMatches = text.matchAll(PLACEHOLDER_PATTERNS.handlebars);
  for (const match of handlebarsMatches) {
    if (match.index !== undefined) {
      placeholders.push({
        raw: match[0],
        name: match[1],
        format: 'handlebars',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  // Parse Global format
  const globalMatches = text.matchAll(PLACEHOLDER_PATTERNS.global);
  for (const match of globalMatches) {
    if (match.index !== undefined) {
      placeholders.push({
        raw: match[0],
        name: match[1],
        format: 'global',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  // Parse Conditionals
  const conditionalMatches = text.matchAll(PLACEHOLDER_PATTERNS.conditional);
  for (const match of conditionalMatches) {
    if (match.index !== undefined) {
      // Use the conditional type (IF, ELSE, etc.) as the name if no variable is provided
      const name = match[2] || match[1];
      placeholders.push({
        raw: match[0],
        name: name,
        format: 'conditional',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  // Sort by position in text
  return placeholders.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Extract unique placeholders from template content
 */
export function extractUniquePlaceholders(
  template: {
    code?: string;
    text?: string;
    subject?: string;
    from_name?: string;
    from_email?: string;
    publish_code?: string;
    publish_text?: string;
    publish_subject?: string;
    publish_from_name?: string;
    publish_from_email?: string;
  }
): TemplatePlaceholder[] {
  const placeholderMap = new Map<string, TemplatePlaceholder>();

  // Define fields to scan
  const fields = [
    { key: 'code' as const, value: template.code },
    { key: 'text' as const, value: template.text },
    { key: 'subject' as const, value: template.subject },
    { key: 'from_name' as const, value: template.from_name },
    { key: 'from_email' as const, value: template.from_email },
    { key: 'publish_code' as const, value: template.publish_code },
    { key: 'publish_text' as const, value: template.publish_text },
    { key: 'publish_subject' as const, value: template.publish_subject },
    { key: 'publish_from_name' as const, value: template.publish_from_name },
    { key: 'publish_from_email' as const, value: template.publish_from_email },
  ];

  // Scan each field
  for (const field of fields) {
    if (!field.value) continue;

    const parsed = parsePlaceholders(field.value);

    for (const placeholder of parsed) {
      const key = `${placeholder.format}:${placeholder.name}`;

      if (!placeholderMap.has(key)) {
        placeholderMap.set(key, {
          name: placeholder.name,
          format: placeholder.format,
          locations: [],
          description: STANDARD_PLACEHOLDERS[placeholder.name],
        });
      }

      const templatePlaceholder = placeholderMap.get(key)!;

      // Find or create location entry
      let location = templatePlaceholder.locations.find(loc => loc.field === field.key);
      if (!location) {
        location = {
          field: field.key,
          count: 0,
          examples: [],
        };
        templatePlaceholder.locations.push(location);
      }

      location.count++;

      // Add example if not already present and under limit
      if (location.examples.length < 3 && !location.examples.includes(placeholder.raw)) {
        location.examples.push(placeholder.raw);
      }
    }
  }

  // Convert map to array and sort
  return Array.from(placeholderMap.values()).sort((a, b) => {
    // Sort by format first, then by name
    if (a.format !== b.format) {
      const formatOrder = ['mailchimp', 'handlebars', 'global', 'conditional'];
      return formatOrder.indexOf(a.format) - formatOrder.indexOf(b.format);
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Validate placeholders in translated text against original
 */
export function validatePlaceholders(
  original: string,
  translated: string
): PlaceholderValidation {
  const originalPlaceholders = parsePlaceholders(original);
  const translatedPlaceholders = parsePlaceholders(translated);

  // Create sets of unique placeholder strings
  const originalSet = new Set(originalPlaceholders.map(p => p.raw));
  const translatedSet = new Set(translatedPlaceholders.map(p => p.raw));

  // Find missing placeholders
  const missing: string[] = [];
  for (const placeholder of originalSet) {
    if (!translatedSet.has(placeholder)) {
      missing.push(placeholder);
    }
  }

  // Find added placeholders
  const added: string[] = [];
  for (const placeholder of translatedSet) {
    if (!originalSet.has(placeholder)) {
      added.push(placeholder);
    }
  }

  // Check for corrupted placeholders (invalid syntax)
  const corrupted: string[] = [];

  // Simple corruption check: look for partial placeholder patterns
  const corruptionPatterns = [
    /\*\|[^|]*$/,           // Unclosed *|
    /\{\{[^}]*$/,           // Unclosed {{
    /\*\|[^|]*\|(?!\*)/,    // *|VAR| without final *
  ];

  for (const pattern of corruptionPatterns) {
    const matches = translated.match(pattern);
    if (matches) {
      corrupted.push(...matches);
    }
  }

  // Generate warnings
  const warnings: string[] = [];

  if (missing.length > 0) {
    warnings.push(`Missing ${missing.length} placeholder(s): ${missing.join(', ')}`);
  }

  if (added.length > 0) {
    warnings.push(`Added ${added.length} unexpected placeholder(s): ${added.join(', ')}`);
  }

  if (corrupted.length > 0) {
    warnings.push(`Found ${corrupted.length} corrupted placeholder(s): ${corrupted.join(', ')}`);
  }

  return {
    isValid: missing.length === 0 && added.length === 0 && corrupted.length === 0,
    warnings,
    missing,
    added,
    corrupted,
  };
}

/**
 * Replace placeholders with protection tokens for translation
 * Preserves surrounding whitespace to prevent translation services from removing spaces
 */
export function protectPlaceholders(text: string): {
  protectedText: string;
  tokenMap: Map<string, string>;
} {
  const placeholders = parsePlaceholders(text);
  const tokenMap = new Map<string, string>();
  let protectedText = text;

  // Replace in reverse order to maintain correct indices
  const reversedPlaceholders = [...placeholders].reverse();

  for (const [index, placeholder] of reversedPlaceholders.entries()) {
    const token = `__PH_${placeholders.length - 1 - index}__`;

    // Capture surrounding whitespace for storage only
    let prefix = '';
    let suffix = '';

    // Check for leading space
    if (placeholder.startIndex > 0 && /\s/.test(text[placeholder.startIndex - 1])) {
      prefix = text[placeholder.startIndex - 1];
    }

    // Check for trailing space
    if (placeholder.endIndex < text.length && /\s/.test(text[placeholder.endIndex])) {
      suffix = text[placeholder.endIndex];
    }

    // Store placeholder with surrounding spaces
    tokenMap.set(token, prefix + placeholder.raw + suffix);

    // Replace ONLY the placeholder (keep spaces in text for translation)
    protectedText =
      protectedText.substring(0, placeholder.startIndex) +
      token +
      protectedText.substring(placeholder.endIndex);
  }

  return { protectedText, tokenMap };
}

/**
 * Restore placeholders from protection tokens after translation
 * Handles spacing intelligently to avoid double spaces
 */
export function restorePlaceholders(
  text: string,
  tokenMap: Map<string, string>
): string {
  let restored = text;

  for (const [token, original] of tokenMap.entries()) {
    // Check if original has leading/trailing spaces
    const hasLeadingSpace = original.startsWith(' ');
    const hasTrailingSpace = original.endsWith(' ');

    // Escape special regex characters in token
    const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Create regex that matches token with optional surrounding spaces
    // If original has spaces, we want to consume spaces around the token to avoid doubling
    const pattern = new RegExp(
      `${hasLeadingSpace ? '\\s*' : ''}${escapedToken}${hasTrailingSpace ? '\\s*' : ''}`,
      'g'
    );

    restored = restored.replace(pattern, original);
  }

  return restored;
}

/**
 * Substitute placeholder values in template content
 */
export function substitutePlaceholders(
  content: string,
  mergeVars: Record<string, string>,
  globalVars?: Record<string, string>
): string {
  let result = content;

  // Handle Mailchimp format *|VAR|*
  for (const [name, value] of Object.entries(mergeVars)) {
    result = result.replaceAll(`*|${name}|*`, value);
    result = result.replaceAll(`*|${name.toUpperCase()}|*`, value);
  }

  // Handle Handlebars format {{var}}
  for (const [name, value] of Object.entries(mergeVars)) {
    result = result.replaceAll(`{{${name}}}`, value);
  }

  // Handle global vars *|GLOBAL:VAR|*
  if (globalVars) {
    for (const [name, value] of Object.entries(globalVars)) {
      result = result.replaceAll(`*|GLOBAL:${name}|*`, value);
      result = result.replaceAll(`*|GLOBAL:${name.toUpperCase()}|*`, value);
    }
  }

  // Handle basic conditionals (simple implementation)
  // *|IF:VAR|* content *|END:IF|*
  // TODO: Implement full conditional logic if needed
  // For now, just remove conditional markers if variable exists
  const conditionalPattern = /\*\|IF:([A-Z_][A-Z0-9_]*)\|\*([\s\S]*?)\*\|END:IF\|\*/g;
  result = result.replace(conditionalPattern, (match, varName, content) => {
    const value = mergeVars[varName] || mergeVars[varName.toLowerCase()];
    return value ? content : '';
  });

  return result;
}

/**
 * Count total placeholders in template
 */
export function countPlaceholders(template: {
  code?: string;
  text?: string;
  subject?: string;
  from_name?: string;
  from_email?: string;
  publish_code?: string;
  publish_text?: string;
  publish_subject?: string;
  publish_from_name?: string;
  publish_from_email?: string;
}): number {
  const unique = extractUniquePlaceholders(template);
  return unique.length;
}
