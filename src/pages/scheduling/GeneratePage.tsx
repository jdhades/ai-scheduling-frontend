import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Wand2,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Loader2,
  XCircle,
  Ban,
  Clock,
} from 'lucide-react';
import { isAxiosError } from 'axios';
import {
  useGenerateHybridForWeekMutation,
  useJobQuery,
  useCancelJobMutation,
  useActiveScheduleJobQuery,
  isTerminalJobState,
  type GenerateScheduleResult,
  type JobStateDTO,
} from '../../api/schedule.api';
import { useBranchesQuery, useDepartmentsQuery } from '../../api/scope-targets.api';
import { useShiftTemplatesQuery } from '../../api/shift-templates.api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card } from '../../components/ui/Card';

/** Calcula el lunes de la semana actual (UTC, ISO YYYY-MM-DD). */
const upcomingMondayISO = (): string => {
  const d = new Date();
  const dow = d.getUTCDay();
  const daysUntilMonday = dow === 0 ? 1 : dow === 1 ? 0 : 8 - dow;
  d.setUTCDate(d.getUTCDate() + daysUntilMonday);
  return d.toISOString().slice(0, 10);
};

/**
 * GeneratePage — dispara una generación híbrida con flow jerárquico
 * branch → department → template (alineado con el flow conversacional
 * de WhatsApp). Niveles con 1 sola opción se ocultan (smart-skip).
 *
 * Phase 14 — pasa `departmentId`/`shiftTemplateId` al backend para que
 * el delete previo a la regeneración respete los OTROS departamentos /
 * templates de la misma semana.
 */
export const GeneratePage = () => {
  const { t } = useTranslation();
  // Persistencia en URL params: al volver a la página después de
  // navegar, los selectores no se resetean. Las claves son cortas
  // (`b`/`d`/`t`) para que la URL no quede ruidosa.
  const [searchParams, setSearchParams] = useSearchParams();
  const [weekStart, setWeekStart] = useState<string>(upcomingMondayISO());
  const [branchId, setBranchId] = useState<string>(
    () => searchParams.get('b') ?? '',
  );
  const [departmentId, setDepartmentId] = useState<string>(
    () => searchParams.get('d') ?? '',
  );
  const [templateId, setTemplateId] = useState<string>(
    () => searchParams.get('t') ?? '',
  );

  // Sync selectores → URL. `replace: true` evita llenar el history
  // con cada cambio (back button no hace zigzag).
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const setOrDel = (key: string, value: string) => {
      if (value) next.set(key, value);
      else next.delete(key);
    };
    setOrDel('b', branchId);
    setOrDel('d', departmentId);
    setOrDel('t', templateId);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [branchId, departmentId, templateId, searchParams, setSearchParams]);

  const generate = useGenerateHybridForWeekMutation();
  const branchesQ = useBranchesQuery();
  const departmentsQ = useDepartmentsQuery();
  const templatesQ = useShiftTemplatesQuery();

  // Tracking de un job en vuelo. Dos fuentes:
  //   1. La mutation devuelve kind='async' con el jobId — feedback
  //      inmediato al disparar.
  //   2. /jobs/active (polling 3s) — sobrevive a navegaciones; al volver
  //      a la página, si hay un job corriendo lo recoge automáticamente.
  // Una vez que tenemos un jobId, useJobQuery hace polling fino (2s) y
  // sigue observando aún después de que el job sale del set "in-flight"
  // (para mostrar el panel terminal completed/failed/cancelled).
  const activeJobsQ = useActiveScheduleJobQuery();
  const backendActiveJobId = activeJobsQ.data?.[0]?.id ?? null;

  const [trackedJobId, setTrackedJobId] = useState<string | null>(null);
  const jobQ = useJobQuery(trackedJobId);
  const cancelJob = useCancelJobMutation();
  const queryClient = useQueryClient();

  // Recoger un job activo del backend al montar / al volver a la página.
  useEffect(() => {
    if (backendActiveJobId && backendActiveJobId !== trackedJobId) {
      setTrackedJobId(backendActiveJobId);
    }
  }, [backendActiveJobId, trackedJobId]);

  // Inmediato: si la mutation devolvió un jobId async, trackear.
  useEffect(() => {
    if (generate.data?.kind === 'async') {
      setTrackedJobId(generate.data.jobId);
    }
  }, [generate.data]);

  // Cuando el polling ve el job en `completed`, invalidamos la grilla
  // — el weekStart vive en el payload del job, no en el estado de la
  // página. Se ejecuta una sola vez por transición a 'completed' (la
  // dep es state, que solo cambia al transicionar).
  const jobState = jobQ.data?.state;
  const jobWeekStart = jobQ.data?.payload.weekStart;
  useEffect(() => {
    if (jobState === 'completed' && jobWeekStart) {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({
        queryKey: ['schedules', jobWeekStart],
      });
    }
  }, [jobState, jobWeekStart, queryClient]);

  // Cuando el job termina (completed/failed/cancelled), liberamos el
  // botón "Generar" para que el manager pueda volver a disparar.
  const isJobInFlight = !!trackedJobId && !isTerminalJobState(jobQ.data?.state);

  const branches = branchesQ.data ?? [];
  const allDepartments = departmentsQ.data ?? [];
  const allTemplates = templatesQ.data ?? [];

  // Smart-skip: si solo hay 1 sucursal, no la mostramos como dropdown.
  const showBranchSelector = branches.length > 1;

  // Filter de departments: hoy `Department.branchId` no viene en el type
  // del hook (ScopeTarget); usamos todos. Cuando se enriquezca el endpoint
  // con branch_id, este filter se vuelve `d.branchId === branchId`.
  const departments = allDepartments;
  const showDepartmentSelector = departments.length > 1;
  const effectiveDepartmentId =
    showDepartmentSelector ? departmentId : (departments[0]?.id ?? '');

  // Templates filtrados por departamento elegido.
  const templates = useMemo(
    () =>
      effectiveDepartmentId
        ? allTemplates.filter((t) => t.departmentId === effectiveDepartmentId)
        : allTemplates,
    [allTemplates, effectiveDepartmentId],
  );

  const canSubmit =
    !!weekStart &&
    !generate.isPending &&
    !isJobInFlight &&
    (!showBranchSelector || branchId !== '') &&
    (!showDepartmentSelector || departmentId !== '');

  const onSubmit = () => {
    setTrackedJobId(null); // limpia panel de job anterior
    generate.mutate({
      weekStart,
      departmentId: effectiveDepartmentId || undefined,
      shiftTemplateId: templateId || undefined,
    });
  };

  // Resultado sync — solo cuando el backend está en path Fase 0.
  const syncResult: GenerateScheduleResult | null =
    generate.data?.kind === 'sync' ? generate.data.result : null;

  // Detect 409 (generation_in_progress) del mutation error.
  const conflictPayload = useMemo(() => {
    const err = generate.error;
    if (!err || !isAxiosError(err)) return null;
    if (err.response?.status !== 409) return null;
    const body = err.response.data as
      | { error?: string; weekStart?: string; since?: string }
      | undefined;
    if (body?.error !== 'generation_in_progress') return null;
    return body;
  }, [generate.error]);

  return (
    <div className="space-y-4 max-w-2xl">
      <header>
        <h1 className="text-xl font-bold text-foreground">
          {t('scheduling:generatePage.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('scheduling:generatePage.subtitle')}
        </p>
      </header>

      <Card className="p-4 space-y-3">
        <div className="space-y-1">
          <Label htmlFor="g-week">
            {t('scheduling:generatePage.weekLabel')}
          </Label>
          <Input
            id="g-week"
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            data-testid="g-week-input"
            disabled={generate.isPending}
          />
          <p className="text-xs text-muted-foreground">
            {t('scheduling:generatePage.weekHint')}
          </p>
        </div>

        {showBranchSelector && (
          <div className="space-y-1">
            <Label htmlFor="g-branch">
              {t('scheduling:generatePage.branchLabel')}
            </Label>
            <select
              id="g-branch"
              data-testid="g-branch-select"
              value={branchId}
              onChange={(e) => {
                setBranchId(e.target.value);
                setDepartmentId('');
                setTemplateId('');
              }}
              disabled={generate.isPending}
              className="flex h-9 w-full rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
            >
              <option value="">
                {t('scheduling:generatePage.branchPick')}
              </option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {showDepartmentSelector && (
          <div className="space-y-1">
            <Label htmlFor="g-dept">
              {t('scheduling:generatePage.departmentLabel')}
            </Label>
            <select
              id="g-dept"
              data-testid="g-dept-select"
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setTemplateId('');
              }}
              disabled={generate.isPending}
              className="flex h-9 w-full rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
            >
              <option value="">
                {t('scheduling:generatePage.departmentPick')}
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="g-template">
            {t('scheduling:generatePage.templateLabel')}
          </Label>
          <select
            id="g-template"
            data-testid="g-template-select"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            disabled={generate.isPending || templates.length === 0}
            className="flex h-9 w-full rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
          >
            <option value="">
              {t('scheduling:generatePage.templateAll')}
            </option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            {t('scheduling:generatePage.templateHint')}
          </p>
        </div>

        <Button
          onClick={onSubmit}
          disabled={!canSubmit}
          data-testid="g-submit"
        >
          {generate.isPending || isJobInFlight ? (
            t('scheduling:generatePage.generating')
          ) : (
            <>
              <Wand2 className="w-4 h-4" />{' '}
              {t('scheduling:generatePage.generate')}
            </>
          )}
        </Button>
      </Card>

      {/* 409 — ya hay una generación en curso para esta semana. */}
      {conflictPayload && (
        <Card className="p-4 border-yellow-500/40 bg-yellow-500/10">
          <div className="flex items-center gap-2 text-sm text-yellow-200">
            <Clock className="w-4 h-4" />
            {t('scheduling:generatePage.conflictInProgress', {
              weekStart: conflictPayload.weekStart ?? weekStart,
            })}
          </div>
        </Card>
      )}

      {/* Otros errores (no 409). */}
      {generate.isError && !conflictPayload && (
        <Card className="p-4 border-error/40 bg-error/10">
          <div className="flex items-center gap-2 text-sm text-error">
            <AlertTriangle className="w-4 h-4" />
            {t('scheduling:generatePage.errorPrefix', {
              message: (generate.error as Error).message,
            })}
          </div>
        </Card>
      )}

      {/* Async path: panel de progreso con polling al job. */}
      {trackedJobId && jobQ.data && (
        <JobProgressCard
          job={jobQ.data}
          onCancel={() => cancelJob.mutate(trackedJobId)}
          cancelDisabled={cancelJob.isPending}
        />
      )}

      {syncResult && (
        <Card className="p-4 space-y-3" data-testid="g-result">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <CheckCircle2 className="w-4 h-4 text-secondary" />
            {t('scheduling:generatePage.result.completed', {
              weekStart: generate.data?.weekStart ?? '',
            })}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Stat
              label={t('scheduling:generatePage.result.stats.assignments')}
              value={syncResult.assignmentsCount}
            />
            <Stat
              label={t('scheduling:generatePage.result.stats.underfilled')}
              value={syncResult.unfilledShiftsCount}
            />
            <Stat
              label={t('scheduling:generatePage.result.stats.llmAccepted')}
              value={syncResult.llmAccepted}
            />
          </div>

          <p className="text-sm text-foreground/80 whitespace-pre-line">
            {syncResult.explanation}
          </p>

          {syncResult.llmUsage && syncResult.llmUsage.calls > 0 && (
            <div className="rounded-md border border-white/10 bg-surface-low/60 p-3 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="uppercase tracking-widest">
                  {t('scheduling:generatePage.result.llmCostTitle')}
                </span>
              </div>
              <div className="mt-1 grid grid-cols-4 gap-2 font-mono text-foreground">
                <span>
                  {t('scheduling:generatePage.result.llmCalls', {
                    count: syncResult.llmUsage.calls,
                  })}
                </span>
                <span>
                  {t('scheduling:generatePage.result.llmPrompt', {
                    tokens: syncResult.llmUsage.prompt.toLocaleString(),
                  })}
                </span>
                <span>
                  {t('scheduling:generatePage.result.llmCompletion', {
                    tokens: syncResult.llmUsage.completion.toLocaleString(),
                  })}
                </span>
                <span className="font-semibold">
                  {t('scheduling:generatePage.result.llmTotal', {
                    tokens: syncResult.llmUsage.total.toLocaleString(),
                  })}
                </span>
              </div>
            </div>
          )}

          {syncResult.warnings.length > 0 && (
            <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-yellow-300/80">
                {t('scheduling:generatePage.result.warningsTitle')}
              </div>
              <ul className="text-sm text-yellow-200 list-disc pl-5">
                {syncResult.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-md border border-white/5 bg-surface-low/60 p-3">
    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
      {label}
    </div>
    <div className="text-2xl font-bold text-foreground">{value}</div>
  </div>
);

interface JobProgressCardProps {
  job: JobStateDTO;
  onCancel: () => void;
  cancelDisabled: boolean;
}

/**
 * JobProgressCard — render del estado del job durante el path async.
 * Polling lo maneja `useJobQuery`; este componente solo dibuja.
 *
 * - created/retry → queued, cancel disponible
 * - active → corriendo (spinner). Cancel avanzado va a Fase 3.
 * - completed → éxito (la grilla ya se invalidó vía useJobQuery)
 * - failed → fallo terminal, sugerir reintentar manualmente
 * - cancelled → cancelado por el usuario
 */
const JobProgressCard = ({ job, onCancel, cancelDisabled }: JobProgressCardProps) => {
  const { t } = useTranslation();
  const { state, payload, retryCount, retryLimit } = job;

  if (state === 'completed') {
    return (
      <Card className="p-4 border-secondary/40 bg-secondary/10" data-testid="g-job-completed">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <CheckCircle2 className="w-4 h-4 text-secondary" />
          {t('scheduling:generatePage.async.completed', {
            weekStart: payload.weekStart,
          })}
        </div>
      </Card>
    );
  }

  if (state === 'failed') {
    return (
      <Card className="p-4 border-error/40 bg-error/10" data-testid="g-job-failed">
        <div className="flex items-center gap-2 text-sm text-error">
          <XCircle className="w-4 h-4" />
          {t('scheduling:generatePage.async.failed', {
            weekStart: payload.weekStart,
            attempts: retryCount + 1,
            max: retryLimit + 1,
          })}
        </div>
      </Card>
    );
  }

  if (state === 'cancelled') {
    return (
      <Card className="p-4 border-yellow-500/30 bg-yellow-500/10" data-testid="g-job-cancelled">
        <div className="flex items-center gap-2 text-sm text-yellow-200">
          <Ban className="w-4 h-4" />
          {t('scheduling:generatePage.async.cancelled', {
            weekStart: payload.weekStart,
          })}
        </div>
      </Card>
    );
  }

  // pending (created/retry) o active
  const isActive = state === 'active';
  const messageKey = isActive
    ? 'scheduling:generatePage.async.active'
    : 'scheduling:generatePage.async.queued';

  return (
    <Card className="p-4 border-blue-400/30 bg-blue-500/5" data-testid="g-job-pending">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-blue-300" />
          <span>
            {t(messageKey, { weekStart: payload.weekStart })}
          </span>
        </div>
        {/* Fase 3 — cancel disponible también en active. El backend
            propaga AbortSignal al LLM; puede tardar unos segundos en
            efectivizarse según dónde esté el worker en el pipeline. */}
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={cancelDisabled}
          data-testid="g-job-cancel"
        >
          {t('scheduling:generatePage.async.cancel')}
        </Button>
      </div>
    </Card>
  );
};
