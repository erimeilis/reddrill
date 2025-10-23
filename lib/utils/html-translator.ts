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
  let translatableText = '';

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
  placeholderRegex.lastIndex = 0; // Reset regex
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
      const textContent = html.substring(currentIndex, part.index).trim();
      if (textContent) {
        segments.push({
          type: 'text',
          content: textContent,
          original: textContent
        });
        translatableText += textContent + '\n';
      }
    }

    // Add the tag or placeholder
    segments.push({
      type: part.type as 'tag' | 'placeholder',
      content: part.content,
      original: part.content
    });

    currentIndex = part.index + part.content.length;
  }

  // Get remaining text after last part
  if (currentIndex < html.length) {
    const textContent = html.substring(currentIndex).trim();
    if (textContent) {
      segments.push({
        type: 'text',
        content: textContent,
        original: textContent
      });
      translatableText += textContent + '\n';
    }
  }

  return {
    segments,
    translatableText: translatableText.trim()
  };
}

/**
 * Reconstruct HTML from segments with translated text
 */
export function reconstructHTML(
  segments: TextSegment[],
  translatedText: string
): string {
  const translatedLines = translatedText.split('\n').map(line => line.trim()).filter(Boolean);
  let lineIndex = 0;
  let result = '';

  for (const segment of segments) {
    if (segment.type === 'text') {
      // Use translated text for text segments
      result += translatedLines[lineIndex] || segment.original;
      lineIndex++;
    } else {
      // Preserve tags and placeholders as-is
      result += segment.original;
    }
  }

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
