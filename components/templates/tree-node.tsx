'use client';

import { useRef, useEffect } from 'react';
import { IconFolder, IconTag, IconChevronRight, IconChevronDown, IconLanguage, IconEye, IconTrash, IconCopy } from '@tabler/icons-react';
import { TreeNode as TreeNodeType } from '@/lib/utils/template-tree';
import { getLocaleFlag } from '@/lib/constants/locales';

interface TreeNodeProps {
  node: TreeNodeType;
  depth: number;
  onToggle: (nodeId: string) => void;
  onLocaleClick: (slug: string) => void;
  onTranslate?: (slug: string) => void;
  onPreview?: (slug: string) => void;
  onDelete?: (slug: string) => void;
  onClone?: (slug: string) => void;
  selectedSlug: string | null;
  onClearSelection: () => void;
}

// Helper function to check if a node or its descendants contain the selected slug
function nodeContainsSlug(node: TreeNodeType, slug: string): boolean {
  if (node.templateSlug === slug) return true;
  if (!node.children) return false;
  return node.children.some(child => nodeContainsSlug(child, slug));
}

export function TreeNode({ node, depth, onToggle, onLocaleClick, onTranslate, onPreview, onDelete, onClone, selectedSlug, onClearSelection }: TreeNodeProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const hasChildren = node.children && node.children.length > 0;
  const isLocale = node.type === 'locale';

  // Icon based on node type (no icon for locale - flag is enough)
  const NodeIcon = node.type === 'theme' ? IconFolder : IconTag;

  // Flag for locale nodes (use preserved locale field, not displayName)
  const flag = isLocale ? getLocaleFlag(node.locale || node.displayName) : null;

  // Check if this node is the selected template
  const isSelected = node.templateSlug && selectedSlug === node.templateSlug;

  // Scroll into view when this node becomes selected
  useEffect(() => {
    if (isSelected && nodeRef.current) {
      nodeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [isSelected]);

  const handleClick = () => {
    // If node has a template (clickable leaf), navigate to it
    if (node.templateSlug) {
      onLocaleClick(node.templateSlug);
    }
    // If node has children (expandable folder), toggle it
    else if (hasChildren) {
      // Before collapsing, check if selected item is in this subtree
      if (node.expanded && selectedSlug && nodeContainsSlug(node, selectedSlug)) {
        onClearSelection();
      }
      onToggle(node.id);
    }
    // Otherwise, do nothing (shouldn't happen, but safe fallback)
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Before collapsing, check if selected item is in this subtree
    if (node.expanded && selectedSlug && nodeContainsSlug(node, selectedSlug)) {
      onClearSelection();
    }
    onToggle(node.id);
  };

  // Determine if node is clickable
  const isClickable = !!node.templateSlug || hasChildren;

  return (
    <div>
      <div
        ref={nodeRef}
        className={`group flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors ${
          isSelected
            ? 'bg-primary/10 border border-primary/30 hover:bg-primary/15'
            : isClickable
              ? 'hover:bg-secondary/50 cursor-pointer'
              : 'cursor-default opacity-60'
        }`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={handleClick}
      >
        {/* Expand/collapse chevron */}
        {hasChildren && (
          <button
            onClick={handleToggleClick}
            className="p-0 hover:bg-secondary rounded"
          >
            {node.expanded ? (
              <IconChevronDown size={16} className="text-muted-foreground" />
            ) : (
              <IconChevronRight size={16} className="text-muted-foreground" />
            )}
          </button>
        )}

        {/* Spacer for nodes without children */}
        {!hasChildren && <div className="w-4" />}

        {/* Node icon (only for theme/label WITH children - folders only) */}
        {!isLocale && hasChildren && <NodeIcon size={16} className="text-muted-foreground flex-shrink-0" />}

        {/* Flag for locale nodes */}
        {flag && <span className="text-lg">{flag}</span>}

        {/* Node name */}
        <span className="text-sm font-medium flex-1">{node.displayName}</span>

        {/* Count badge with better contrast */}
        {node.count !== undefined && node.count > 0 && (
          <span className="text-xs font-medium text-primary bg-primary/15 border border-primary/25 px-2 py-0.5 rounded-full">
            {node.count}
          </span>
        )}

        {/* Action buttons for locale nodes (templates) */}
        {isLocale && node.templateSlug && (
          <div className="flex gap-1">
            {onPreview && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(node.templateSlug!);
                }}
                className="p-1 hover:bg-secondary rounded transition-colors"
                title="Preview template"
              >
                <IconEye size={16} className="text-muted-foreground hover:text-foreground" />
              </button>
            )}
            {onTranslate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTranslate(node.templateSlug!);
                }}
                className="p-1 hover:bg-secondary rounded transition-colors"
                title="Translate template"
              >
                <IconLanguage size={16} className="text-muted-foreground hover:text-foreground" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(node.templateSlug!);
                }}
                className="p-1 hover:bg-secondary rounded transition-colors"
                title="Delete template"
              >
                <IconTrash size={16} className="text-muted-foreground hover:text-destructive" />
              </button>
            )}
            {onClone && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClone(node.templateSlug!);
                }}
                className="p-1 hover:bg-secondary rounded transition-colors"
                title="Clone template"
              >
                <IconCopy size={16} className="text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Render children if expanded */}
      {node.expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onToggle={onToggle}
              onLocaleClick={onLocaleClick}
              onTranslate={onTranslate}
              onPreview={onPreview}
              onDelete={onDelete}
              onClone={onClone}
              selectedSlug={selectedSlug}
              onClearSelection={onClearSelection}
            />
          ))}
        </div>
      )}
    </div>
  );
}
