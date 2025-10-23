/**
 * Template name parsing utilities
 * Extracts theme and locale from template names
 */

export interface ParsedTemplate {
  theme: string;
  locale: string | null;
}

/**
 * Parse template name into theme and locale components
 * Supports patterns: theme_locale, theme-locale, theme.locale
 *
 * @param name - Template name to parse
 * @returns Object with theme and locale (locale is null if not found)
 */
export function parseTemplateName(name: string): ParsedTemplate {
  // Try different separators: _, -, .
  const patterns = [
    /^(.+)_([a-z]{2})$/i,  // theme_locale
    /^(.+)-([a-z]{2})$/i,  // theme-locale
    /^(.+)\.([a-z]{2})$/i, // theme.locale
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      return {
        theme: match[1],
        locale: match[2].toLowerCase(),
      };
    }
  }

  // No locale found
  return {
    theme: name,
    locale: null,
  };
}

/**
 * Get theme from template name
 * @param name - Template name
 * @returns Theme (name without locale)
 */
export function getTemplateTheme(name: string): string {
  return parseTemplateName(name).theme;
}

/**
 * Get locale from template name
 * @param name - Template name
 * @returns Locale code or null if not found
 */
export function getTemplateLocale(name: string): string | null {
  return parseTemplateName(name).locale;
}
