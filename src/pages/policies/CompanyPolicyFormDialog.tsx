import { useState, type FormEvent } from 'react';
import { useTranslation, Trans } from 'react-i18next';
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
  const { t } = useTranslation();
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

  const targetsForScope = (type: PolicyScopeType): ScopeTarget[] => {
    if (type === 'branch') return branches;
    if (type === 'department') return departments;
    if (type === 'employee') return employees;
    return [];
  };

  const submitWithText = async (
    textToSubmit: string,
    opts: { skipSuggestions?: boolean } = {},
  ) => {
    setError(null);
    if (textToSubmit.trim().length < 10) {
      setError(t('policies:dialog.errors.minLength'));
      return;
    }
    if (scopeType !== 'company' && !scopeId) {
      const key =
        scopeType === 'branch'
          ? 'policies:dialog.errors.scopeMissingBranch'
          : scopeType === 'department'
            ? 'policies:dialog.errors.scopeMissingDepartment'
            : 'policies:dialog.errors.scopeMissingEmployee';
      setError(t(key));
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

  /** "Save without rephrasing": preserves the manager's original text. */
  const keepOriginal = async () => {
    setStage({ kind: 'form' });
    await submitWithText(text, { skipSuggestions: true });
  };

  const scopeFieldLabel =
    scopeType === 'branch'
      ? t('policies:dialog.fields.scopeBranch')
      : scopeType === 'department'
        ? t('policies:dialog.fields.scopeDepartment')
        : t('policies:dialog.fields.scopeEmployee');

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
              ? t('policies:dialog.titleSuggestions')
              : stage.kind === 'created-info'
                ? t('policies:dialog.titleCreated')
                : t('policies:dialog.titleNew')}
          </DialogTitle>
          <DialogDescription>
            {stage.kind === 'suggestions'
              ? t('policies:dialog.descriptionSuggestions')
              : stage.kind === 'created-info'
                ? t('policies:dialog.descriptionCreated')
                : t('policies:dialog.descriptionNew')}
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
                {t('policies:dialog.actions.back')}
              </Button>
              <Button
                type="button"
                onClick={keepOriginal}
                disabled={submitting}
                data-testid="suggestions-keep-original"
                title={t('policies:dialog.actions.keepOriginalTooltip')}
              >
                {t('policies:dialog.actions.keepOriginal')}
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
                return (
                  <div className="rounded-md border border-secondary/40 bg-secondary/10 p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        className="mt-0.5 h-4 w-4 shrink-0 text-secondary"
                        aria-hidden="true"
                      />
                      <p className="text-foreground">
                        <Trans
                          i18nKey="policies:dialog.createdInfo.llmOnly"
                          components={{ strong: <span className="font-medium" /> }}
                        />
                      </p>
                    </div>
                  </div>
                );
              }
              if (p.interpreterId === 'llm_runtime') {
                return (
                  <div className="rounded-md border border-secondary/40 bg-secondary/10 p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Bot
                        className="mt-0.5 h-4 w-4 shrink-0 text-secondary"
                        aria-hidden="true"
                      />
                      <p className="text-foreground">
                        <Trans
                          i18nKey="policies:dialog.createdInfo.llmRuntime"
                          components={{ strong: <span className="font-medium" /> }}
                        />
                      </p>
                    </div>
                  </div>
                );
              }
              return (
                <div className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Sparkles
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <p className="text-foreground">
                      <Trans
                        i18nKey="policies:dialog.createdInfo.deterministic"
                        values={{ interpreterId: p.interpreterId }}
                        components={{
                          strong: <span className="font-medium" />,
                          code: <span className="font-mono text-xs" />,
                        }}
                      />
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
                {t('policies:dialog.actions.understood')}
              </Button>
            </DialogFooter>
          </div>
        )}

        {stage.kind === 'form' && (
          <form onSubmit={handleSubmit} className="relative space-y-3">
            <div className="space-y-1">
              <Label htmlFor="cp-text">{t('policies:dialog.fields.text')}</Label>
              <Textarea
                id="cp-text"
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('policies:dialog.fields.textPlaceholder')}
                data-testid="policy-text-input"
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                {t('policies:dialog.fields.textCounter', {
                  count: text.trim().length,
                })}
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="cp-severity">
                {t('policies:dialog.fields.severity')}
              </Label>
              <select
                id="cp-severity"
                data-testid="policy-severity-select"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as PolicySeverity)}
                disabled={submitting}
                className="flex h-9 w-full rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
              >
                <option value="hard">
                  {t('policies:dialog.fields.severityHard')}
                </option>
                <option value="soft">
                  {t('policies:dialog.fields.severitySoft')}
                </option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="cp-scope-type">
                  {t('policies:dialog.fields.scopeType')}
                </Label>
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
                  <option value="company">
                    {t('policies:dialog.fields.scopeCompany')}
                  </option>
                  <option value="branch">
                    {t('policies:dialog.fields.scopeBranch')}
                  </option>
                  <option value="department">
                    {t('policies:dialog.fields.scopeDepartment')}
                  </option>
                  <option value="employee">
                    {t('policies:dialog.fields.scopeEmployee')}
                  </option>
                </select>
              </div>
              {scopeType !== 'company' && (
                <div className="space-y-1">
                  <Label htmlFor="cp-scope-id">{scopeFieldLabel}</Label>
                  <select
                    id="cp-scope-id"
                    data-testid="policy-scope-id-select"
                    value={scopeId}
                    onChange={(e) => setScopeId(e.target.value)}
                    disabled={submitting}
                    className="flex h-9 w-full rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
                  >
                    <option value="">
                      {t('policies:dialog.fields.scopePick')}
                    </option>
                    {targetsForScope(scopeType).map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.name}
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
                {t('policies:dialog.actions.cancel')}
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
                    {t('policies:dialog.actions.submitting')}
                  </>
                ) : (
                  t('policies:dialog.actions.submit')
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
const SubmittingOverlay = () => {
  const { t } = useTranslation();
  return (
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
        <span>{t('policies:dialog.loadingOverlay')}</span>
      </div>
    </div>
  );
};
