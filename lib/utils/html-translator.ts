/**
 * HTML Translation Utilities
 * Uses proper DOM parsing to maintain HTML structure during translation
 * Translates each text node individually to avoid marker overhead and truncation issues
 */

import { parse, HTMLElement, TextNode, Node } from 'node-html-parser';

interface TextNodeInfo {
  node: TextNode;
  originalText: string;
}

/**
 * Extract translatable text from HTML while preserving complete DOM structure
 * Returns the parsed DOM and array of individual text nodes to translate
 * No markers - each text node is translated separately for maximum compatibility
 */
export function extractTranslatableText(html: string): {
  root: HTMLElement;
  textNodes: TextNodeInfo[];
} {
  // Parse HTML into DOM tree
  const root = parse(html, {
    comment: false,
    blockTextElements: {
      script: false,
      noscript: false,
      style: false,
      pre: false,
    }
  });

  const textNodes: TextNodeInfo[] = [];

  /**
   * Recursively walk DOM tree and collect text nodes
   */
  function walkNode(node: Node) {
    if (node.nodeType === 3) {
      // Text node
      const textNode = node as TextNode;
      const text = textNode.text;

      // Skip empty or whitespace-only text nodes
      if (!text || !text.trim()) {
        return;
      }

      // Store text node info (no markers needed)
      textNodes.push({
        node: textNode,
        originalText: text
      });
    } else if (node.nodeType === 1) {
      // Element node - recurse into children
      const element = node as HTMLElement;

      // Skip script and style elements
      const tagName = element.tagName?.toLowerCase();
      if (tagName === 'script' || tagName === 'style') {
        return;
      }

      // Process child nodes
      for (const child of element.childNodes) {
        walkNode(child);
      }
    }
  }

  // Walk the entire DOM tree
  walkNode(root);

  return {
    root,
    textNodes
  };
}

/**
 * Reconstruct HTML by putting translated text back into the DOM tree
 * Simply updates each text node with its translated content
 */
export function reconstructHTML(
  root: HTMLElement,
  textNodes: TextNodeInfo[],
  translatedTexts: string[]
): string {
  // Update each text node with its corresponding translated text
  for (let i = 0; i < textNodes.length; i++) {
    const info = textNodes[i];
    const translated = translatedTexts[i];

    if (translated !== undefined) {
      info.node.textContent = translated;
    } else {
      // Fallback: keep original if translation missing
      console.warn(`No translation for text node ${i}`, {
        originalText: info.originalText.substring(0, 50)
      });
      info.node.textContent = info.originalText;
    }
  }

  // Serialize the modified DOM back to HTML
  return root.toString();
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
  const { textNodes } = extractTranslatableText(html);
  return textNodes.reduce((sum, node) => sum + node.originalText.length, 0);
}
