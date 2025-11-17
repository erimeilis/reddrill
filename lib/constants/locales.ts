/**
 * Locale to flag emoji conversion utilities
 * Uses Unicode Regional Indicator Symbols for flag generation
 */

/**
 * Supported locale interface
 */
export interface SupportedLocale {
  code: string;
  name: string;
  nativeName?: string;
}

/**
 * Comprehensive list of supported locales
 * Organized by popularity and region
 */
export const SUPPORTED_LOCALES: SupportedLocale[] = [
  // Major European Languages
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },

  // Nordic Languages
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },

  // Eastern European
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių' },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская' },

  // Asian Languages
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'tl', name: 'Tagalog', nativeName: 'Tagalog' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },

  // Middle Eastern & South Asian
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },

  // Other European
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
];

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
