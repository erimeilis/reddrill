'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  IconChevronDown,
  IconDeviceFloppy,
  IconTrash,
  IconCircleCheck,
  IconAlertCircle,
} from '@tabler/icons-react';
import {
  saveScenario,
  updateScenario,
  deleteScenario,
  getScenariosByTemplate,
  type TestScenario,
} from '@/lib/db/test-scenarios-db';
import type { TestData } from './test-data-form';

interface TestScenarioSelectorProps {
  templateSlug: string;
  currentData: TestData;
  onLoadScenario: (data: TestData) => void;
}

export function TestScenarioSelector({
  templateSlug,
  currentData,
  onLoadScenario,
}: TestScenarioSelectorProps) {
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    loadScenarios();
  }, [templateSlug]);

  const loadScenarios = async () => {
    try {
      const data = await getScenariosByTemplate(templateSlug);
      setScenarios(data.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch (err) {
      console.error('Error loading scenarios:', err);
    }
  };

  const handleSaveNew = async () => {
    if (!scenarioName.trim()) {
      setError('Please enter a scenario name');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await saveScenario({
        templateSlug,
        name: scenarioName.trim(),
        description: scenarioDescription.trim() || undefined,
        mergeVars: currentData.mergeVars,
        globalVars: currentData.globalVars,
      });

      setSuccess(true);
      await loadScenarios();

      setTimeout(() => {
        setSaveDialogOpen(false);
        setTimeout(() => {
          setSuccess(false);
          setScenarioName('');
          setScenarioDescription('');
        }, 300);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save scenario');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (scenario: TestScenario) => {
    try {
      await updateScenario({
        ...scenario,
        mergeVars: currentData.mergeVars,
        globalVars: currentData.globalVars,
      });
      await loadScenarios();
    } catch (err) {
      console.error('Error updating scenario:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteScenario(id);
      await loadScenarios();
      if (selectedScenario?.id === id) {
        setSelectedScenario(null);
      }
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting scenario:', err);
      setError('Failed to delete scenario');
    }
  };

  const handleLoadScenario = (scenario: TestScenario) => {
    setSelectedScenario(scenario);
    onLoadScenario({
      mergeVars: scenario.mergeVars,
      globalVars: scenario.globalVars,
    });
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            {selectedScenario ? selectedScenario.name : 'Load Scenario'}
            <IconChevronDown size={16} stroke={1.5} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {scenarios.length === 0 ? (
            <div className="px-2 py-3 text-sm text-muted-foreground text-center">
              No saved scenarios
            </div>
          ) : (
            scenarios.map((scenario) => (
              <DropdownMenuItem
                key={scenario.id}
                className="flex items-center justify-between gap-2"
                onClick={() => handleLoadScenario(scenario)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{scenario.name}</div>
                  {scenario.description && (
                    <div className="text-xs text-muted-foreground truncate">
                      {scenario.description}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {selectedScenario?.id === scenario.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdate(scenario);
                      }}
                      title="Update with current data"
                    >
                      <IconDeviceFloppy size={14} stroke={1.5} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(scenario.id || null);
                    }}
                    title="Delete scenario"
                  >
                    <IconTrash size={14} stroke={1.5} />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setSaveDialogOpen(true)}>
            <IconDeviceFloppy size={16} stroke={1.5} className="mr-2" />
            Save as New Scenario
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Test Scenario</DialogTitle>
            <DialogDescription>
              Save the current test data for easy reuse
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <IconCircleCheck className="h-4 w-4 text-green-600 dark:text-green-400" stroke={1.5} />
              <AlertDescription className="text-green-700 dark:text-green-300">
                Scenario saved successfully!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="scenario-name">Scenario Name *</Label>
                <Input
                  id="scenario-name"
                  placeholder="e.g., Welcome Email Test"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  disabled={saving}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveNew()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scenario-description">Description (optional)</Label>
                <Input
                  id="scenario-description"
                  placeholder="e.g., Test data for new user welcome flow"
                  value={scenarioDescription}
                  onChange={(e) => setScenarioDescription(e.target.value)}
                  disabled={saving}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <IconAlertCircle className="h-4 w-4" stroke={1.5} />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
              disabled={saving}
            >
              {success ? 'Close' : 'Cancel'}
            </Button>
            {!success && (
              <Button
                onClick={handleSaveNew}
                disabled={saving || !scenarioName.trim()}
              >
                <IconDeviceFloppy className="mr-2 h-4 w-4" stroke={1.5} />
                Save Scenario
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Test Scenario</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this scenario? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              <IconTrash className="mr-2 h-4 w-4" stroke={1.5} />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
