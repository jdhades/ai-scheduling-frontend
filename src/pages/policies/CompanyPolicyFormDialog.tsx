import { useState, type FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
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
import { Badge } from '../../components/ui/Badge';
import type {
  CreateCompanyPolicyPayload,
  CreateCompanyPolicyResult,
  PolicySeverity,
  RephraseSuggestion,
} from '../../types/company-policy';
import { describeApiError } from '../../lib/api-error';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Resuelve con el resultado del POST. El dialog interpreta el
   * discriminator y decide si cerrar (created con interpreter) o quedarse
   * abierto mostrando feedback (LLM-only / suggestions).
   */
  onSubmit: (
    payload: CreateCompanyPolicyPayload,
  ) => Promise<CreateCompanyPolicyResult>;
  submitting?: boolean;
}

type Stage =
  | { kind: 'form' }
  | { kind: 'suggestions'; suggestions: RephraseSuggestion[] }
  | { kind: 'llm-only-warning' };

/**
 * Dialog de creación de CompanyPolicy con suggestion-loop. Tres ramas
 * post-submit:
 *
 *   - 'created' + hasInterpreter   → cierra silencioso.
 *   - 'created' sin interpreter    → panel "se guardó como LLM-only".
 *   - 'needs_clarification'        → 2-3 sugerencias verificadas; el
 *                                    manager elige una y re-submitea.
 */
export const CompanyPolicyFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: Props) => {
  const [text, setText] = useState('');
  const [severity, setSeverity] = useState<PolicySeverity>('hard');
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>({ kind: 'form' });

  const reset = () => {
    setText('');
    setSeverity('hard');
    setError(null);
    setStage({ kind: 'form' });
  };

  const submitWithText = async (textToSubmit: string) => {
    setError(null);
    if (textToSubmit.trim().length < 10) {
      setError('El texto debe tener al menos 10 caracteres.');
      return;
    }
    try {
      const result = await onSubmit({
        text: textToSubmit.trim(),
        severity,
      });
      if (result.status === 'needs_clarification') {
        setStage({ kind: 'suggestions', suggestions: result.suggestions });
        return;
      }
      // status === 'created'
      if (result.policy.hasInterpreter) {
        // Camino feliz total → cerramos.
        reset();
        onOpenChange(false);
        return;
      }
      // Sin interpreter → guardado pero LLM-only. Avisamos al manager.
      setStage({ kind: 'llm-only-warning' });
    } catch (err) {
      setError(describeApiError(err));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await submitWithText(text);
  };

  const pickSuggestion = async (suggestion: RephraseSuggestion) => {
    setText(suggestion.suggestedText);
    setStage({ kind: 'form' });
    await submitWithText(suggestion.suggestedText);
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
          <DialogTitle>
            {stage.kind === 'suggestions'
              ? 'Sugerencias de reformulación'
              : stage.kind === 'llm-only-warning'
                ? 'Política guardada como LLM-only'
                : 'Nueva política'}
          </DialogTitle>
          <DialogDescription>
            {stage.kind === 'suggestions'
              ? 'El sistema no encontró un patrón aplicable a tu texto. La IA propuso estas alternativas (cada una verificada). Elegí una para crearla, o cerrá y reformulá libre.'
              : stage.kind === 'llm-only-warning'
                ? 'La política se guardó pero el solver no la puede aplicar deterministicamente — solo la considera al pasarla al LLM en la fase de generación.'
                : 'Política tenant-wide. Aplica a todos los empleados (ej. "11h descanso entre turnos consecutivos"). Para reglas de caso particular, usá Reglas semánticas.'}
          </DialogDescription>
        </DialogHeader>

        {stage.kind === 'suggestions' && (
          <div className="space-y-3" data-testid="policy-suggestions">
            {stage.suggestions.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => pickSuggestion(s)}
                disabled={submitting}
                data-testid={`suggestion-${i}`}
                className="w-full rounded-md border border-white/10 bg-surface-low p-3 text-left transition-colors hover:border-primary/40 hover:bg-surface-container disabled:opacity-50"
              >
                <div className="flex items-start gap-2">
                  <Sparkles
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">
                      {s.suggestedText}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.explanation}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Badge>{s.matchedInterpreterId}</Badge>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {JSON.stringify(s.matchedParams)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStage({ kind: 'form' })}
                disabled={submitting}
                data-testid="suggestions-back"
              >
                Volver al texto libre
              </Button>
            </DialogFooter>
          </div>
        )}

        {stage.kind === 'llm-only-warning' && (
          <div className="space-y-3">
            <div className="rounded-md border border-secondary/40 bg-secondary/10 p-3 text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0 text-secondary"
                  aria-hidden="true"
                />
                <p className="text-foreground">
                  La política se guardó como{' '}
                  <span className="font-medium">LLM-only</span>. El scheduler
                  determinístico no la aplica; solo la incluye como contexto
                  al LLM en la fase de generación. Si querés que el solver la
                  aplique directo, editala con un texto que matchee uno de los
                  patrones del sistema.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
                data-testid="llm-only-close"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Entendido
              </Button>
            </DialogFooter>
          </div>
        )}

        {stage.kind === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="cp-text">Texto</Label>
              <Textarea
                id="cp-text"
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="ej. Cada empleado descansa al menos 2 días por semana, sin contar feriados."
                data-testid="policy-text-input"
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                {text.trim().length} / mín 10
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="cp-severity">Severidad</Label>
              <select
                id="cp-severity"
                data-testid="policy-severity-select"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as PolicySeverity)}
                disabled={submitting}
                className="flex h-9 w-full rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
              >
                <option value="hard">
                  hard — el solver no puede violarla
                </option>
                <option value="soft">
                  soft — preferencia, puede ceder
                </option>
              </select>
            </div>
            {error && (
              <p
                className="text-sm text-error"
                data-testid="policy-form-error"
              >
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
                disabled={submitting}
                data-testid="policy-submit"
              >
                {submitting ? 'Guardando…' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
