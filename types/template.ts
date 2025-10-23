/**
 * Enhanced template types with parsed theme and locale
 */

import { MandrillTemplate, MandrillTemplateInfo } from '@/lib/api/mandrill';

export interface EnhancedTemplate extends MandrillTemplate {
  theme: string;
  locale: string | null;
  flag: string;
}

export interface EnhancedTemplateInfo extends MandrillTemplateInfo {
  theme: string;
  locale: string | null;
  flag: string;
}

export type { MandrillTemplate, MandrillTemplateInfo };
