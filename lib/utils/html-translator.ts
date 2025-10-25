/**
 * HTML Translation Utilities
 * Extracts text from HTML while preserving tags and Mandrill placeholders (*|...|*)
 */

interface TextSegment {
  type: 'text' | 'tag' | 'placeholder';
  content: string;
  original: string;
}

/**
 * Extract translatable text from HTML
 * Preserves HTML tags and Mandrill placeholders
 */
export function extractTranslatableText(html: string): {
  segments: TextSegment[];
  translatableText: string;
} {
  const segments: TextSegment[] = [];
  const translatableParts: string[] = [];

  // Regular expressions
  const tagRegex = /<[^>]+>/g;
  const placeholderRegex = /\*\|[^|]+\|\*/g;

  const parts: Array<{ type: string; content: string; index: number }> = [];

  // Find all tags
  let tagMatch;
  while ((tagMatch = tagRegex.exec(html)) !== null) {
    parts.push({
      type: 'tag',
      content: tagMatch[0],
      index: tagMatch.index
    });
  }

  // Find all placeholders
  let placeholderMatch;
  placeholderRegex.lastIndex = 0;
  while ((placeholderMatch = placeholderRegex.exec(html)) !== null) {
    parts.push({
      type: 'placeholder',
      content: placeholderMatch[0],
      index: placeholderMatch.index
    });
  }

  // Sort by index
  parts.sort((a, b) => a.index - b.index);

  // Extract text between tags and placeholders
  let currentIndex = 0;
  for (const part of parts) {
    // Extract text before this part
    if (part.index > currentIndex) {
      const textContent = html.substring(currentIndex, part.index);
      // Only trim if adjacent to tag, not placeholder
      const shouldTrim = part.type === 'tag';
      const finalContent = shouldTrim ? textContent.trim() : textContent;

      if (finalContent) {
        segments.push({
          type: 'text',
          content: finalContent,
          original: finalContent
        });
        translatableParts.push(finalContent);
      }
    }

    // Add the segment
    segments.push({
      type: part.type as 'tag' | 'placeholder',
      content: part.content,
      original: part.content
    });

    // Include placeholders in translatable text (not tags)
    if (part.type === 'placeholder') {
      translatableParts.push(part.content);
    }

    currentIndex = part.index + part.content.length;
  }

  // Get remaining text after last part
  if (currentIndex < html.length) {
    const textContent = html.substring(currentIndex);
    const finalContent = textContent.trimEnd();

    if (finalContent) {
      segments.push({
        type: 'text',
        content: finalContent,
        original: finalContent
      });
      translatableParts.push(finalContent);
    }
  }

  return {
    segments,
    translatableText: translatableParts.join('')
  };
}

/**
 * Reconstruct HTML from segments with translated text
 */
export function reconstructHTML(
  segments: TextSegment[],
  translatedText: string
): string {
  let result = '';
  let textRemaining = translatedText;

  for (const segment of segments) {
    if (segment.type === 'tag') {
      // Add tags as-is
      result += segment.original;
    } else if (segment.type === 'placeholder') {
      // Find placeholder in remaining text
      const pos = textRemaining.indexOf(segment.original);
      if (pos >= 0) {
        // Add any translated text before the placeholder
        result += textRemaining.substring(0, pos);
        // Add the placeholder itself
        result += segment.original;
        // Continue after the placeholder
        textRemaining = textRemaining.substring(pos + segment.original.length);
      }
    }
    // Text segments are implicitly handled when we add text before placeholders
  }

  // Add any remaining translated text
  result += textRemaining;

  return result;
}

/**
 * Simple text extraction (fallback for non-HTML content)
 */
export function extractPlainText(html: string): string {
  // Remove HTML tags but keep placeholders
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags
    .replace(/<[^>]+>/g, '') // Remove all other HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Count translatable characters (for API cost estimation)
 */
export function countTranslatableChars(html: string): number {
  const { translatableText } = extractTranslatableText(html);
  return translatableText.length;
}
