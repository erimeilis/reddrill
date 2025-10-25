'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconSearch, IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { MandrillTemplate } from '@/lib/api/mandrill';
import { TreeNode } from './tree-node';
import {
  buildTemplateTree,
  toggleNodeExpansion,
  expandAllNodes,
  collapseAllNodes,
  type TreeViewMode,
  type TreeNode as TreeNodeType,
} from '@/lib/utils/template-tree';
import { useSettingsStore } from '@/lib/store/useSettingsStore';

// Helper to check if a node or its descendants contain the given slug
function nodeContainsSlug(node: TreeNodeType, slug: string): boolean {
  if (node.templateSlug === slug) return true;
  if (!node.children) return false;
  return node.children.some(child => nodeContainsSlug(child, slug));
}

// Helper to expand all ancestors of a node with the given slug (pure function)
function expandAncestorsOfSlug(nodes: TreeNodeType[], targetSlug: string | null): TreeNodeType[] {
  if (!targetSlug) return nodes;

  return nodes.map(node => {
    // Check if this node or any descendant contains the target slug
    const containsTarget = nodeContainsSlug(node, targetSlug);

    if (!containsTarget) {
      return node;
    }

    // If it contains the target, expand this node and recurse to children
    return {
      ...node,
      expanded: true,
      children: node.children ? expandAncestorsOfSlug(node.children, targetSlug) : node.children,
    };
  });
}

interface TemplateTreeViewProps {
  templates: MandrillTemplate[];
  treeMode: TreeViewMode;
  onTreeModeChange: (mode: TreeViewMode) => void;
  onLocaleClick: (slug: string) => void;
  onTranslate?: (slug: string) => void;
  onPreview?: (slug: string) => void;
  onDelete?: (slug: string) => void;
  onClone?: (slug: string) => void;
  selectedSlug: string | null;
  onClearSelection: () => void;
  loading?: boolean;
}

export function TemplateTreeView({
  templates,
  treeMode,
  onTreeModeChange,
  onLocaleClick,
  onTranslate,
  onPreview,
  onDelete,
  onClone,
  selectedSlug,
  onClearSelection,
  loading = false,
}: TemplateTreeViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Get persisted tree expansions from Zustand store
  const { treeExpansions, setTreeExpansions } = useSettingsStore();

  // Convert Record to Map for internal use
  const userExpansions = useMemo(() => new Map(Object.entries(treeExpansions)), [treeExpansions]);

  // Step 1: Build base tree structure (memoized)
  const baseTree = useMemo(() => {
    return buildTemplateTree(templates, treeMode);
  }, [templates, treeMode]); // Rebuild when templates or mode changes

  // Step 2: Apply automatic expansion for selected slug (pure derived state)
  const treeWithSelection = useMemo(() => {
    return expandAncestorsOfSlug(baseTree, selectedSlug);
  }, [baseTree, selectedSlug]);

  // Step 3: Apply user-controlled expansions (merged with auto-expansion)
  const treeWithUserExpansions = useMemo(() => {
    const applyUserExpansions = (nodes: TreeNodeType[]): TreeNodeType[] => {
      return nodes.map(node => {
        // User expansion overrides default, but auto-expansion from selection takes precedence
        const userExpanded = userExpansions.get(node.id);
        const finalExpanded = userExpanded !== undefined ? userExpanded : node.expanded;

        return {
          ...node,
          expanded: finalExpanded,
          children: node.children ? applyUserExpansions(node.children) : node.children,
        };
      });
    };

    return applyUserExpansions(treeWithSelection);
  }, [treeWithSelection, userExpansions]);

  // Step 4: Apply search filter (auto-expands matching nodes)
  const filteredNodes = useMemo(() => {
    if (!searchTerm) return treeWithUserExpansions;

    const filterNodes = (nodes: TreeNodeType[]): TreeNodeType[] => {
      const result: TreeNodeType[] = [];

      for (const node of nodes) {
        const matchesSearch = node.displayName.toLowerCase().includes(searchTerm.toLowerCase());
        const filteredChildren = node.children ? filterNodes(node.children) : [];

        // Include node if it matches or has matching children
        if (matchesSearch || filteredChildren.length > 0) {
          result.push({
            ...node,
            children: filteredChildren.length > 0 ? filteredChildren : node.children,
            expanded: true, // Auto-expand when searching
          });
        }
      }

      return result;
    };

    return filterNodes(treeWithUserExpansions);
  }, [treeWithUserExpansions, searchTerm]);

  // User actions
  const handleToggle = (nodeId: string) => {
    // Find the node to get its current expanded state
    const findNode = (nodes: TreeNodeType[], id: string): TreeNodeType | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findNode(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const node = findNode(filteredNodes, nodeId);
    if (!node) return;

    // Update Zustand store
    const newExpansions = { ...treeExpansions };
    newExpansions[nodeId] = !node.expanded;
    setTreeExpansions(newExpansions);
  };

  const handleExpandAll = () => {
    // Build map of all node IDs set to expanded
    const allExpanded: Record<string, boolean> = {};
    const collectAllNodes = (nodes: TreeNodeType[]): void => {
      nodes.forEach(node => {
        allExpanded[node.id] = true;
        if (node.children) collectAllNodes(node.children);
      });
    };
    collectAllNodes(baseTree);
    setTreeExpansions(allExpanded);
  };

  const handleCollapseAll = () => {
    // Clear user expansions (will collapse everything except selected path)
    setTreeExpansions({});
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Tree mode toggle */}
        <div className="flex gap-px bg-secondary/50 rounded-lg p-px">
          <Button
            variant={treeMode === 'theme-label-locale' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onTreeModeChange('theme-label-locale')}
            className="text-xs"
          >
            Theme First
          </Button>
          <Button
            variant={treeMode === 'label-theme-locale' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onTreeModeChange('label-theme-locale')}
            className="text-xs"
          >
            Label First
          </Button>
        </div>

        {/* Expand/Collapse controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExpandAll}
            className="text-xs"
          >
            <IconChevronDown size={14} className="mr-1" />
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCollapseAll}
            className="text-xs"
          >
            <IconChevronRight size={14} className="mr-1" />
            Collapse All
          </Button>
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search tree..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 h-8"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
            <IconSearch size={16} />
          </div>
        </div>
      </div>

      {/* Tree */}
      <div className="border rounded-lg p-2 bg-card min-h-[400px] max-h-[600px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
                <div className="h-4 bg-muted rounded animate-pulse" style={{ width: `${120 + (i % 3) * 40}px` }}></div>
              </div>
            ))}
          </div>
        ) : filteredNodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            {searchTerm ? 'No matching templates found' : 'No templates available'}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredNodes.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                onToggle={handleToggle}
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
    </div>
  );
}
