/**
 * Locale to flag emoji conversion utilities
 * Uses Unicode Regional Indicator Symbols for flag generation
 */

/**
 * Special locale mappings for non-standard cases
 * Only include exceptions where locale code != country code
 */
const LOCALE_OVERRIDES: Record<string, string> = {
  'en': 'gb',     // English -> UK flag
  'ru': '🏴‍☠️',      // Russian -> Pirate flag
  'kk': 'kz',     // Kazakh -> Kazakhstan
  'nb': 'no',     // Norwegian Bokmål -> Norway
  'nn': 'no',     // Norwegian Nynorsk -> Norway
  'he': 'il',     // Hebrew -> Israel
  'hi': 'in',     // Hindi -> India
  'zh': 'cn',     // Chinese -> China
  'ja': 'jp',     // Japanese -> Japan
  'ko': 'kr',     // Korean -> South Korea
  'uk': 'ua',     // Ukrainian -> Ukraine
  'cs': 'cz',     // Czech -> Czech Republic
  'da': 'dk',     // Danish -> Denmark
  'el': 'gr',     // Greek -> Greece
  'ar': 'sa',     // Arabic -> Saudi Arabia (most common)
  'fa': 'ir',     // Persian -> Iran
  'vi': 'vn',     // Vietnamese -> Vietnam
  'sl': 'si',     // Slovenian -> Slovenia
  'et': 'ee',     // Estonian -> Estonia
  'lv': 'lv',     // Latvian -> Latvia (matches, but for completeness)
  'lt': 'lt',     // Lithuanian -> Lithuania (matches, but for completeness)
  'ca': 'es',     // Catalan -> Spain (or could use Catalonia flag)
  'eu': 'es',     // Basque -> Spain
  'gl': 'es',     // Galician -> Spain
  'sq': 'al',     // Albanian -> Albania
  'hy': 'am',     // Armenian -> Armenia
  'ka': 'ge',     // Georgian -> Georgia
  'sv': 'se',     // Swedish -> Sweden
  'be': 'by',     // Belarusian -> Belarus
};

/**
 * Convert ISO2 locale code to flag emoji using Unicode formula
 *
 * Formula: Regional Indicator Symbol = 0x1F1E6 + (char code - 65)
 * 'A' (65) → 🇦 (U+1F1E6)
 * 'B' (66) → 🇧 (U+1F1E7)
 * etc.
 *
 * @param locale - ISO2 locale code (e.g., 'en', 'es', 'fr')
 * @returns Flag emoji or globe emoji for invalid/missing locale
 */
export function getLocaleFlag(locale: string | null): string {
  // Special case: "default" locale - no flag needed
  if (locale === 'default') {
    return '';
  }

  if (!locale || locale.length !== 2) {
    return '✕'; // X mark for invalid/missing locale
  }

  // Check for special overrides
  const override = LOCALE_OVERRIDES[locale.toLowerCase()];
  if (override) {
    // If override is already an emoji (length > 2), return it directly
    if (override.length > 2) return override;
    // Otherwise treat as country code
    locale = override;
  }

  const countryCode = locale.toUpperCase();

  // Convert to regional indicator symbols
  return countryCode
    .split('')
    .map(char => {
      const code = char.charCodeAt(0);
      // Validate A-Z range
      if (code < 65 || code > 90) return '';
      return String.fromCodePoint(0x1F1E6 + code - 65);
    })
    .join('');
}

/**
 * Get display name for locale (for future use)
 * @param locale - ISO2 locale code
 * @returns Human-readable locale name
 */
export function getLocaleName(locale: string): string {
  const names: Record<string, string> = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'tr': 'Turkish',
    'pl': 'Polish',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'da': 'Danish',
    'fi': 'Finnish',
    'no': 'Norwegian',
  };

  return names[locale.toLowerCase()] || locale.toUpperCase();
}
