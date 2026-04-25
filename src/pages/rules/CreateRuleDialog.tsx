import { useState, type FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import type {
  CreateSemanticRulePayload,
  RulePriority,
  RuleType,
} from '../../types/semantic-rule';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (p: CreateSemanticRulePayload) => Promise<unknown>;
  submitting?: boolean;
}

export const CreateRuleDialog = ({
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: Props) => {
  const [ruleText, setRuleText] = useState('');
  const [priorityLevel, setPriorityLevel] = useState<RulePriority>(3);
  const [ruleType, setRuleType] = useState<RuleType>('preference');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setRuleText('');
    setPriorityLevel(3);
    setRuleType('preference');
    setError(null);
  };

  const handle = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (ruleText.trim().length < 10) {
      setError('La regla debe tener al menos 10 caracteres.');
      return;
    }
    try {
      await onSubmit({ ruleText: ruleText.trim(), priorityLevel, ruleType });
      reset();
    } catch (err) {
      setError((err as Error).message ?? 'Error al crear regla.');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva regla semántica</DialogTitle>
          <DialogDescription>
            Escribí la regla en lenguaje natural. El backend genera embedding
            + intenta extraer estructura con IA.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handle} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="r-text">Texto</Label>
            <Textarea
              id="r-text"
              rows={3}
              value={ruleText}
              onChange={(e) => setRuleText(e.target.value)}
              placeholder="ej. Pablo no trabaja los lunes"
              data-testid="r-text-input"
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">{ruleText.trim().length} / mín 10</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="r-priority">Prioridad</Label>
              <select
                id="r-priority"
                data-testid="r-priority-select"
                value={priorityLevel}
                onChange={(e) =>
                  setPriorityLevel(Number(e.target.value) as RulePriority)
                }
                disabled={submitting}
                className="flex h-9 w-full rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
              >
                <option value={1}>1 — Legal</option>
                <option value={2}>2 — Hard</option>
                <option value={3}>3 — Soft (preferencia)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="r-type">Tipo</Label>
              <select
                id="r-type"
                data-testid="r-type-select"
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value as RuleType)}
                disabled={submitting}
                className="flex h-9 w-full rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
              >
                <option value="restriction">restriction</option>
                <option value="preference">preference</option>
                <option value="requirement">requirement</option>
              </select>
            </div>
          </div>
          {error && (
            <p className="text-sm text-error" data-testid="r-form-error">
              {error}
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} data-testid="r-submit">
              {submitting ? 'Guardando…' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
