import { useState, type FormEvent } from 'react';
import { AlertTriangle, Bot, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
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
  CompanyPolicy,
  CreateCompanyPolicyPayload,
  CreateCompanyPolicyResult,
  PolicyScopeType,
  PolicySeverity,
  RephraseSuggestion,
} from '../../types/company-policy';
import { describeApiError } from '../../lib/api-error';

export interface ScopeTarget {
  id: string;
  name: string;
}

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
  /** Phase 14.1 — listas precargadas para resolver scope.id. */
  branches?: ScopeTarget[];
  departments?: ScopeTarget[];
  employees?: ScopeTarget[];
}

type Stage =
  | { kind: 'form' }
  | { kind: 'suggestions'; suggestions: RephraseSuggestion[] }
  | { kind: 'created-info'; policy: CompanyPolicy };

/**
 * Dialog de creación de CompanyPolicy con suggestion-loop. Tres ramas
 * post-submit:
 *
 *   - 'created' (cualquier modo)    → panel `created-info` con el tipo
 *                                      de enforcement (determinístico /
 *                                      LLM-runtime / LLM-only). El manager
 *                                      cierra cuando entiende.
 *   - 'needs_clarification'         → 2-3 sugerencias verificadas; el
 *                                      manager elige una y re-submitea.
 */
export const CompanyPolicyFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  submitting,
  branches = [],
  departments = [],
  employees = [],
}: Props) => {
  const [text, setText] = useState('');
  const [severity, setSeverity] = useState<PolicySeverity>('hard');
  const [scopeType, setScopeType] = useState<PolicyScopeType>('company');
  const [scopeId, setScopeId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>({ kind: 'form' });

  const reset = () => {
    setText('');
    setSeverity('hard');
    setScopeType('company');
    setScopeId('');
    setError(null);
    setStage({ kind: 'form' });
  };

  const targetsForScope = (t: PolicyScopeType): ScopeTarget[] => {
    if (t === 'branch') return branches;
    if (t === 'department') return departments;
    if (t === 'employee') return employees;
    return [];
  };

  const submitWithText = async (
    textToSubmit: string,
    opts: { skipSuggestions?: boolean } = {},
  ) => {
    setError(null);
    if (textToSubmit.trim().length < 10) {
      setError('El texto debe tener al menos 10 caracteres.');
      return;
    }
    if (scopeType !== 'company' && !scopeId) {
      setError(`Seleccioná el ${scopeType === 'branch' ? 'sucursal' : scopeType === 'department' ? 'departamento' : 'empleado'} al que aplica.`);
      return;
    }
    try {
      const result = await onSubmit({
        text: textToSubmit.trim(),
        severity,
        scope: {
          type: scopeType,
          id: scopeType === 'company' ? null : scopeId,
        },
        ...(opts.skipSuggestions ? { skipSuggestions: true } : {}),
      });
      if (result.status === 'needs_clarification') {
        setStage({ kind: 'suggestions', suggestions: result.suggestions });
        return;
      }
      // status === 'created' — siempre mostramos el tipo de enforcement
      // que quedó (determinístico / LLM-runtime / LLM-only) para que el
      // manager sepa qué garantía tiene su policy.
      setStage({ kind: 'created-info', policy: result.policy });
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

  /** "Guardar sin reformular": preserva el texto original del manager. */
  const keepOriginal = async () => {
    setStage({ kind: 'form' });
    await submitWithText(text, { skipSuggestions: true });
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
              : stage.kind === 'created-info'
                ? 'Política creada'
                : 'Nueva política'}
          </DialogTitle>
          <DialogDescription>
            {stage.kind === 'suggestions'
              ? 'El sistema no encontró un patrón aplicable a tu texto. La IA propuso estas alternativas (cada una verificada). Elegí una para crearla, o cerrá y reformulá libre.'
              : stage.kind === 'created-info'
                ? 'La política quedó guardada. Te indicamos abajo cómo se va a aplicar al generar horarios.'
                : 'Política aplicable a toda la empresa, una sucursal, un departamento o un empleado puntual. Para reglas de caso particular en lenguaje natural, usá Reglas semánticas.'}
          </DialogDescription>
        </DialogHeader>

        {stage.kind === 'suggestions' && (
          <div className="relative space-y-3" data-testid="policy-suggestions">
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
                  </div>
                </div>
              </button>
            ))}
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStage({ kind: 'form' })}
                disabled={submitting}
                data-testid="suggestions-back"
              >
                Volver al texto libre
              </Button>
              <Button
                type="button"
                onClick={keepOriginal}
                disabled={submitting}
                data-testid="suggestions-keep-original"
                title="Guarda tu redacción tal cual; el sistema la enforza vía LLM en cada generación."
              >
                Guardar mi texto original
              </Button>
            </DialogFooter>
            {submitting && <SubmittingOverlay />}
          </div>
        )}

        {stage.kind === 'created-info' && (
          <div className="space-y-3" data-testid="policy-created-info">
            {(() => {
              const p = stage.policy;
              if (!p.hasInterpreter) {
                // LLM-only puro: solo viaja al prompt como contexto.
                return (
                  <div className="rounded-md border border-secondary/40 bg-secondary/10 p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        className="mt-0.5 h-4 w-4 shrink-0 text-secondary"
                        aria-hidden="true"
                      />
                      <p className="text-foreground">
                        Guardada como{' '}
                        <span className="font-medium">LLM-only</span>. El
                        solver no la aplica deterministicamente; solo la
                        incluye como contexto al LLM al generar el horario.
                        Sin garantía dura.
                      </p>
                    </div>
                  </div>
                );
              }
              if (p.interpreterId === 'llm_runtime') {
                // Catch-all: el LLM la evalúa en cada propuesta del solver.
                return (
                  <div className="rounded-md border border-secondary/40 bg-secondary/10 p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Bot
                        className="mt-0.5 h-4 w-4 shrink-0 text-secondary"
                        aria-hidden="true"
                      />
                      <p className="text-foreground">
                        Aplicación{' '}
                        <span className="font-medium">LLM-runtime</span>: el
                        solver invoca al LLM en cada evaluación para chequear
                        esta policy. Garantía probabilística — en cada intento
                        del verify-loop el LLM decide si hay violación. Tiene
                        costo extra en tokens.
                      </p>
                    </div>
                  </div>
                );
              }
              // Determinística (interpreter estructurado).
              return (
                <div className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Sparkles
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <p className="text-foreground">
                      Aplicación{' '}
                      <span className="font-medium">determinística</span> con
                      el interpreter{' '}
                      <span className="font-mono text-xs">
                        {p.interpreterId}
                      </span>
                      . El solver chequea matemáticamente cada propuesta
                      contra los parámetros extraídos.
                    </p>
                  </div>
                </div>
              );
            })()}
            <DialogFooter>
              <Button
                type="button"
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
                data-testid="created-info-close"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Entendido
              </Button>
            </DialogFooter>
          </div>
        )}

        {stage.kind === 'form' && (
          <form onSubmit={handleSubmit} className="relative space-y-3">
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

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="cp-scope-type">Aplica a</Label>
                <select
                  id="cp-scope-type"
                  data-testid="policy-scope-type-select"
                  value={scopeType}
                  onChange={(e) => {
                    setScopeType(e.target.value as PolicyScopeType);
                    setScopeId('');
                  }}
                  disabled={submitting}
                  className="flex h-9 w-full rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
                >
                  <option value="company">Toda la empresa</option>
                  <option value="branch">Sucursal</option>
                  <option value="department">Departamento</option>
                  <option value="employee">Empleado</option>
                </select>
              </div>
              {scopeType !== 'company' && (
                <div className="space-y-1">
                  <Label htmlFor="cp-scope-id">
                    {scopeType === 'branch'
                      ? 'Sucursal'
                      : scopeType === 'department'
                        ? 'Departamento'
                        : 'Empleado'}
                  </Label>
                  <select
                    id="cp-scope-id"
                    data-testid="policy-scope-id-select"
                    value={scopeId}
                    onChange={(e) => setScopeId(e.target.value)}
                    disabled={submitting}
                    className="flex h-9 w-full rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
                  >
                    <option value="">Elegí…</option>
                    {targetsForScope(scopeType).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
                {submitting ? (
                  <>
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Analizando con IA…
                  </>
                ) : (
                  'Crear'
                )}
              </Button>
            </DialogFooter>
            {submitting && <SubmittingOverlay />}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

/**
 * Overlay con spinner que cubre el stage activo mientras la IA procesa
 * la creación (clasificación + match + posible rephrase + traducción).
 * En el peor caso son varios LLM-calls — sin feedback visual el manager
 * cree que la app se colgó.
 */
const SubmittingOverlay = () => (
  <div
    className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/80 backdrop-blur-sm"
    data-testid="policy-submitting-overlay"
    role="status"
    aria-live="polite"
  >
    <div className="flex items-center gap-2 text-sm text-foreground">
      <Loader2
        className="h-4 w-4 animate-spin text-primary"
        aria-hidden="true"
      />
      <span>La IA está analizando tu texto…</span>
    </div>
  </div>
);
