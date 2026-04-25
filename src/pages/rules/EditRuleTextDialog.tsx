import { useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle } from 'lucide-react';
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
  SemanticRuleListItem,
  UpdateSemanticRuleTextPayload,
} from '../../types/semantic-rule';

interface Props {
  rule: SemanticRuleListItem | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: UpdateSemanticRuleTextPayload) => Promise<unknown>;
  submitting?: boolean;
}

/**
 * EditRuleTextDialog — operación CARA. El backend regenera embedding +
 * structure (cada uno = 1 LLM call). Mostramos warning explícito y un
 * confirm checkbox para que el manager sea consciente del costo.
 */
export const EditRuleTextDialog = ({
  rule,
  onOpenChange,
  onSubmit,
  submitting,
}: Props) => {
  const [ruleText, setRuleText] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rule) {
      setRuleText(rule.ruleText);
      setConfirmed(false);
      setError(null);
    }
  }, [rule]);

  const open = rule !== null;

  const handle = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (ruleText.trim().length < 10) {
      setError('La regla debe tener al menos 10 caracteres.');
      return;
    }
    if (rule && ruleText.trim() === rule.ruleText.trim()) {
      setError('El texto es idéntico al actual.');
      return;
    }
    try {
      await onSubmit({ ruleText: ruleText.trim() });
    } catch (err) {
      setError((err as Error).message ?? 'Error al actualizar texto.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar texto de la regla</DialogTitle>
          <DialogDescription>
            Operación CARA: el backend regenera el embedding y vuelve a
            extraer la estructura con IA (≈ 2 llamadas LLM).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handle} className="space-y-3">
          <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 flex items-start gap-2 text-xs text-yellow-200">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Este cambio invalida el vector y la estructura actuales. La
              regla puede dejar de aplicarse a horarios que ya estaban
              alineados con el texto previo.
            </span>
          </div>
          <div className="space-y-1">
            <Label htmlFor="rt-text">Nuevo texto</Label>
            <Textarea
              id="rt-text"
              rows={4}
              value={ruleText}
              onChange={(e) => setRuleText(e.target.value)}
              data-testid="rt-text-input"
              disabled={submitting}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="rt-confirm"
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              data-testid="rt-confirm-cb"
              disabled={submitting}
              className="rounded border-white/20"
            />
            <Label htmlFor="rt-confirm" className="!text-sm !normal-case !tracking-normal">
              Entiendo que se va a re-procesar con IA.
            </Label>
          </div>
          {error && (
            <p className="text-sm text-error" data-testid="rt-form-error">
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
            <Button
              type="submit"
              disabled={!confirmed || submitting}
              data-testid="rt-submit"
            >
              {submitting ? 'Re-procesando…' : 'Reemplazar texto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
