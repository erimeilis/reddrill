/**
 * Tree building utilities for template hierarchical navigation
 * Supports two modes: Theme→Label→Locale and Label→Theme→Locale
 */

import { MandrillTemplate } from '@/lib/api/mandrill';
import { parseTemplateName } from './template-parser';

export type TreeViewMode = 'theme-label-locale' | 'label-theme-locale';
export type TreeNodeType = 'theme' | 'label' | 'locale';

export interface TreeNode {
  type: TreeNodeType;
  id: string;
  displayName: string;
  children?: TreeNode[];
  templateSlug?: string; // Only for locale leaf nodes
  expanded?: boolean;
  count?: number;
  locale?: string; // Original locale code for flag display
  missingLocales?: string[]; // For theme/label nodes: locales that don't have translations
}

/**
 * Check if template name ends with "default"
 */
function isDefaultTemplate(name: string): boolean {
  return name.toLowerCase().endsWith('default');
}

/**
 * Build tree structure - Mode 1: Theme → Label → Locale
 * @param selectedLocales - List of locales to show (including missing ones)
 */
export function buildTreeByTheme(
  templates: MandrillTemplate[],
  selectedLocales?: string[]
): TreeNode[] {
  const tree: Map<string, TreeNode> = new Map();

  templates.forEach(template => {
    const { theme, locale } = parseTemplateName(template.name);

    // Get or create theme node
    if (!tree.has(theme)) {
      tree.set(theme, {
        type: 'theme',
        id: theme,
        displayName: theme,
        children: [],
        expanded: false,
        count: 0,
      });
    }
    const themeNode = tree.get(theme)!;
    themeNode.count!++;

    // If template has no labels, add it directly as a locale node under theme
    const labelsToProcess = template.labels.length > 0 ? template.labels : ['(no label)'];

    // Process each label
    labelsToProcess.forEach(label => {
      // Get or create label node under theme
      let labelNode = themeNode.children?.find(
        n => n.type === 'label' && n.id === `${theme}_${label}`
      );

      if (!labelNode) {
        labelNode = {
          type: 'label',
          id: `${theme}_${label}`,
          displayName: label,
          children: [],
          expanded: false,
          count: 0,
        };
        themeNode.children!.push(labelNode);
      }
      labelNode.count!++;

      // Add locale node (or "default" if no locale)
      const localeDisplay = locale || 'default';
      labelNode.children!.push({
        type: 'locale',
        id: `${theme}_${label}_${localeDisplay}`,
        displayName: localeDisplay,
        templateSlug: template.slug,
        locale: localeDisplay, // Store original locale for flag display
      });
    });
  });

  // Calculate missing locales for each label node if selectedLocales is provided
  if (selectedLocales && selectedLocales.length > 0) {
    tree.forEach(themeNode => {
      themeNode.children?.forEach(labelNode => {
        if (labelNode.type === 'label') {
          // Get existing locales for this label
          const existingLocales = new Set(
            labelNode.children?.map(n => n.locale || n.displayName) || []
          );

          // Calculate missing locales
          const missing = selectedLocales.filter(locale => !existingLocales.has(locale));
          if (missing.length > 0) {
            labelNode.missingLocales = missing;
          }
        }
      });
    });
  }

  // Sort BEFORE flattening: themes with labels first, then default, then others
  const sortedThemes = Array.from(tree.values()).sort((a, b) => {
    const aIsDefault = isDefaultTemplate(a.displayName);
    const bIsDefault = isDefaultTemplate(b.displayName);
    const aHasLabels = a.children && a.children.length > 0 && a.children[0].type === 'label';
    const bHasLabels = b.children && b.children.length > 0 && b.children[0].type === 'label';

    // Themes with labels go first
    if (aHasLabels && !bHasLabels) return -1;
    if (!aHasLabels && bHasLabels) return 1;

    // Default templates last
    if (aIsDefault && !bIsDefault) return 1;
    if (!aIsDefault && bIsDefault) return -1;

    return a.displayName.localeCompare(b.displayName);
  });

  // Then flatten single-child hierarchies
  return sortedThemes.map(themeNode => {
    // If theme has only one label with only one locale, flatten it
    if (themeNode.children?.length === 1) {
      const labelNode = themeNode.children[0];
      if (labelNode.children?.length === 1) {
        const localeNode = labelNode.children[0];
        // Return flattened locale node directly (preserve type: 'locale' and original locale)
        return {
          ...localeNode,
          type: 'locale' as const,
          displayName: `${themeNode.displayName} (${labelNode.displayName})`,
          locale: localeNode.locale || localeNode.displayName, // Preserve original locale
        };
      }
    }
    return themeNode;
  });
}

/**
 * Build tree structure - Mode 2: Label → Theme → Locale
 * @param selectedLocales - List of locales to show (including missing ones)
 */
export function buildTreeByLabel(
  templates: MandrillTemplate[],
  selectedLocales?: string[]
): TreeNode[] {
  const tree: Map<string, TreeNode> = new Map();

  templates.forEach(template => {
    const { theme, locale } = parseTemplateName(template.name);

    // If template has no labels, add it directly under a special label
    const labelsToProcess = template.labels.length > 0 ? template.labels : ['(no label)'];

    // Process each label
    labelsToProcess.forEach(label => {
      // Get or create label node
      if (!tree.has(label)) {
        tree.set(label, {
          type: 'label',
          id: label,
          displayName: label,
          children: [],
          expanded: false,
          count: 0,
        });
      }
      const labelNode = tree.get(label)!;
      labelNode.count!++;

      // Get or create theme node under label
      let themeNode = labelNode.children?.find(
        n => n.type === 'theme' && n.id === `${label}_${theme}`
      );

      if (!themeNode) {
        themeNode = {
          type: 'theme',
          id: `${label}_${theme}`,
          displayName: theme,
          children: [],
          expanded: false,
          count: 0,
        };
        labelNode.children!.push(themeNode);
      }
      themeNode.count!++;

      // Add locale node (or "default" if no locale)
      const localeDisplay = locale || 'default';
      themeNode.children!.push({
        type: 'locale',
        id: `${label}_${theme}_${localeDisplay}`,
        displayName: localeDisplay,
        templateSlug: template.slug,
        locale: localeDisplay, // Store original locale for flag display
      });
    });
  });

  // Calculate missing locales for each theme node if selectedLocales is provided
  if (selectedLocales && selectedLocales.length > 0) {
    tree.forEach(labelNode => {
      labelNode.children?.forEach(themeNode => {
        if (themeNode.type === 'theme') {
          // Get existing locales for this theme
          const existingLocales = new Set(
            themeNode.children?.map(n => n.locale || n.displayName) || []
          );

          // Calculate missing locales
          const missing = selectedLocales.filter(locale => !existingLocales.has(locale));
          if (missing.length > 0) {
            themeNode.missingLocales = missing;
          }
        }
      });
    });
  }

  // Sort BEFORE flattening: labels with themes first, then default, then unlabeled
  const sortedLabels = Array.from(tree.values()).sort((a, b) => {
    const aIsDefault = isDefaultTemplate(a.displayName);
    const bIsDefault = isDefaultTemplate(b.displayName);
    const aIsNoLabel = a.displayName === '(no label)';
    const bIsNoLabel = b.displayName === '(no label)';
    const aHasThemes = a.children && a.children.length > 0 && a.children[0].type === 'theme';
    const bHasThemes = b.children && b.children.length > 0 && b.children[0].type === 'theme';

    // Unlabeled templates last
    if (aIsNoLabel && !bIsNoLabel) return 1;
    if (!aIsNoLabel && bIsNoLabel) return -1;

    // Labels with themes go first (among labeled templates)
    if (!aIsNoLabel && !bIsNoLabel) {
      if (aHasThemes && !bHasThemes) return -1;
      if (!aHasThemes && bHasThemes) return 1;
    }

    // Default templates after labeled with themes, before unlabeled
    if (aIsDefault && !bIsDefault) return 1;
    if (!aIsDefault && bIsDefault) return -1;

    return a.displayName.localeCompare(b.displayName);
  });

  // Then flatten single-child hierarchies
  return sortedLabels.map(labelNode => {
    // If label has only one theme with only one locale, flatten it
    if (labelNode.children?.length === 1) {
      const themeNode = labelNode.children[0];
      if (themeNode.children?.length === 1) {
        const localeNode = themeNode.children[0];
        // Return flattened locale node directly (preserve type: 'locale' and original locale)
        return {
          ...localeNode,
          type: 'locale' as const,
          displayName: `${themeNode.displayName} (${labelNode.displayName})`,
          locale: localeNode.locale || localeNode.displayName, // Preserve original locale
        };
      }
    }
    return labelNode;
  });
}

/**
 * Build template tree with specified mode
 * @param selectedLocales - List of locales to show (including missing ones)
 */
export function buildTemplateTree(
  templates: MandrillTemplate[],
  mode: TreeViewMode,
  selectedLocales?: string[]
): TreeNode[] {
  return mode === 'theme-label-locale'
    ? buildTreeByTheme(templates, selectedLocales)
    : buildTreeByLabel(templates, selectedLocales);
}

/**
 * Toggle node expansion state
 */
export function toggleNodeExpansion(
  nodes: TreeNode[],
  nodeId: string
): TreeNode[] {
  return nodes.map(node => {
    if (node.id === nodeId) {
      return { ...node, expanded: !node.expanded };
    }
    if (node.children) {
      return {
        ...node,
        children: toggleNodeExpansion(node.children, nodeId),
      };
    }
    return node;
  });
}

/**
 * Expand all nodes
 */
export function expandAllNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes.map(node => ({
    ...node,
    expanded: true,
    children: node.children ? expandAllNodes(node.children) : node.children,
  }));
}

/**
 * Collapse all nodes
 */
export function collapseAllNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes.map(node => ({
    ...node,
    expanded: false,
    children: node.children ? collapseAllNodes(node.children) : node.children,
  }));
}
