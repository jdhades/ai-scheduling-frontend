import { useState, type FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, Copy, Sparkles } from 'lucide-react';
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
  CreateSemanticRulePayload,
  CreateSemanticRuleResult,
  RulePriority,
  RuleType,
  SemanticRuleSuggestion,
} from '../../types/semantic-rule';
import { describeApiError } from '../../lib/api-error';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Resuelve con el resultado del create. El dialog interpreta el resultado
   * para decidir si cierra (todo OK) o queda abierto mostrando el feedback
   * de IA (duplicado / sin estructura / sin embedding).
   */
  onSubmit: (p: CreateSemanticRulePayload) => Promise<CreateSemanticRuleResult>;
  submitting?: boolean;
}

/**
 * Dialog de creación de regla semántica. La IA hace 3 cosas al crear:
 *   1. Embedding (vector pgvector — para búsqueda semántica).
 *   2. Detección de duplicados (distancia coseno < 0.12).
 *   3. Extracción de estructura (intent + parámetros — el scheduler la usa).
 *
 * Tras el submit, el dialog muestra el outcome al manager:
 *   - Duplicado: la regla NO se persiste; se referencia la existente.
 *   - Estructura faltante: la regla se guarda pero el scheduler la ignora.
 *   - Embedding faltante: la regla se guarda pero no es buscable semántica.
 *   - OK total: cierra silencioso.
 */
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
  const [result, setResult] = useState<CreateSemanticRuleResult | null>(null);
  const [suggestions, setSuggestions] = useState<
    SemanticRuleSuggestion[] | null
  >(null);

  const reset = () => {
    setRuleText('');
    setPriorityLevel(3);
    setRuleType('preference');
    setError(null);
    setResult(null);
    setSuggestions(null);
  };

  const submitWithText = async (textToSubmit: string) => {
    setError(null);
    setSuggestions(null);
    if (textToSubmit.trim().length < 10) {
      setError('La regla debe tener al menos 10 caracteres.');
      return;
    }
    try {
      const r = await onSubmit({
        ruleText: textToSubmit.trim(),
        priorityLevel,
        ruleType,
      });
      // 1. Suggestion-loop: el LLM marcó complex y propuso alternativas.
      //    NO se persistió. Mostramos el picker.
      if (r.suggestions && r.suggestions.length > 0) {
        setSuggestions(r.suggestions);
        return;
      }
      // 2. Resultado con warnings o duplicado → panel de resultado.
      if (r.isDuplicate || !r.embeddingGenerated || !r.structureExtracted) {
        setResult(r);
        return;
      }
      // 3. OK total → cerrar.
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(describeApiError(err));
    }
  };

  const handle = async (e: FormEvent) => {
    e.preventDefault();
    await submitWithText(ruleText);
  };

  const pickSuggestion = async (s: SemanticRuleSuggestion) => {
    setRuleText(s.suggestedText);
    await submitWithText(s.suggestedText);
  };

  const showSuggestions = suggestions !== null;
  const showResult = result !== null;
  const isDup = result?.isDuplicate === true;
  const noEmb = result !== null && !result.embeddingGenerated;
  const noStruct = result !== null && !result.structureExtracted;

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
            {showSuggestions
              ? 'Sugerencias de reformulación'
              : showResult
                ? 'Resultado de la creación'
                : 'Nueva regla semántica'}
          </DialogTitle>
          <DialogDescription>
            {showSuggestions
              ? 'El sistema no pudo aplicar tu regla tal cual (texto ambiguo o sin sujeto). La IA propuso estas alternativas. Elegí una para crearla, o volvé al texto libre.'
              : showResult
                ? 'La IA procesó la regla. Revisá el resultado antes de cerrar.'
                : 'Escribí la regla en lenguaje natural. La IA genera embedding, busca duplicados y extrae estructura para el scheduler.'}
          </DialogDescription>
        </DialogHeader>

        {showSuggestions ? (
          <div className="space-y-3" data-testid="r-suggestions-panel">
            {suggestions!.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => pickSuggestion(s)}
                disabled={submitting}
                data-testid={`r-suggestion-${i}`}
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
                    {s.previewIntent && (
                      <div className="pt-1">
                        <Badge>intent: {s.previewIntent}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSuggestions(null)}
                disabled={submitting}
                data-testid="r-suggestions-back"
              >
                Volver al texto libre
              </Button>
            </DialogFooter>
          </div>
        ) : showResult ? (
          <div className="space-y-3" data-testid="r-result-panel">
            {isDup ? (
              <div className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm">
                <div className="flex items-start gap-2 text-primary">
                  <Copy className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">
                      Regla duplicada — no se creó
                    </p>
                    <p className="text-muted-foreground">
                      La IA detectó una regla ya existente semánticamente
                      equivalente (distancia coseno &lt; 0.12). Si querés
                      modificarla, abrí la existente y editala.
                    </p>
                    {result?.duplicateOfId && (
                      <p
                        className="font-mono text-xs text-muted-foreground"
                        data-testid="r-duplicate-of-id"
                      >
                        ID existente: {result.duplicateOfId}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
                <div className="flex items-start gap-2 text-primary">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p className="text-foreground">Regla guardada.</p>
                </div>
              </div>
            )}

            {noStruct && !isDup && (
              <div className="rounded-md border border-error/40 bg-error/10 p-3 text-sm text-error">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p>
                    <span className="font-medium">Sin estructura.</span> El LLM
                    no pudo parsear la regla a un formato aplicable. El
                    scheduler la <strong>ignora</strong> hasta que la
                    reformules con un texto más claro.
                  </p>
                </div>
              </div>
            )}

            {noEmb && !isDup && (
              <div className="rounded-md border border-secondary/40 bg-secondary/10 p-3 text-sm">
                <div className="flex items-start gap-2 text-secondary">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p className="text-foreground">
                    <span className="font-medium">Sin embedding.</span> La
                    regla no es buscable semánticamente. Editá el texto para
                    reintentar la generación.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
                data-testid="r-result-close"
              >
                Cerrar
              </Button>
            </DialogFooter>
          </div>
        ) : (
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
        )}
      </DialogContent>
    </Dialog>
  );
};
