/**
 * HTML Normalizer for GrapeJS Editor
 * Wraps raw text nodes in <p> tags to make them editable in GrapeJS
 */

/**
 * Normalizes HTML content by wrapping raw text nodes in block elements
 * This ensures GrapeJS can make all text editable via double-click
 *
 * @param html - Raw HTML string that may contain raw text nodes
 * @returns Normalized HTML with all text wrapped in block elements
 */
export function normalizeHtmlForEditor(html: string): string {
  if (!html || !html.trim()) {
    return html;
  }

  // Create a temporary DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Function to process a node and its children
  function processNode(node: Node): void {
    // Only process element nodes
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as Element;
    const children = Array.from(element.childNodes);

    // Track text nodes and inline elements that need wrapping
    let textBuffer: Node[] = [];

    // Helper to wrap accumulated text nodes
    function wrapTextBuffer() {
      if (textBuffer.length === 0) return;

      // Create a paragraph wrapper
      const p = doc.createElement('p');
      p.setAttribute('style', 'box-sizing: border-box; margin: 0;');

      // Move all buffered nodes into the paragraph
      textBuffer.forEach(textNode => {
        p.appendChild(textNode.cloneNode(true));
      });

      // Replace the first text node with the paragraph
      const firstNode = textBuffer[0];
      if (firstNode.parentNode) {
        firstNode.parentNode.insertBefore(p, firstNode);

        // Remove all buffered nodes
        textBuffer.forEach(node => {
          if (node.parentNode) {
            node.parentNode.removeChild(node);
          }
        });
      }

      textBuffer = [];
    }

    // Process each child
    children.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        // Check if text node has meaningful content (not just whitespace)
        const text = child.textContent || '';
        if (text.trim().length > 0) {
          textBuffer.push(child);
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const childElement = child as Element;
        const tagName = childElement.tagName.toLowerCase();

        // Inline elements (strong, em, span, br, etc.) - add to buffer
        const inlineElements = ['strong', 'em', 'b', 'i', 'u', 'span', 'a', 'br', 'img'];

        if (inlineElements.includes(tagName)) {
          textBuffer.push(child);
        } else {
          // Block element - wrap any accumulated text first
          wrapTextBuffer();

          // Recursively process this block element
          processNode(child);
        }
      }
    });

    // Wrap any remaining text nodes
    wrapTextBuffer();
  }

  // Process the body element
  const body = doc.body;
  if (body) {
    processNode(body);
  }

  // Return the normalized HTML
  return body ? body.innerHTML : html;
}
