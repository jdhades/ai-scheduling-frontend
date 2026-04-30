import { useMemo, useState } from 'react';
import { Wand2, AlertTriangle, CheckCircle2, Cpu } from 'lucide-react';
import {
  useGenerateHybridForWeekMutation,
  type GenerateScheduleResult,
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
  const [weekStart, setWeekStart] = useState<string>(upcomingMondayISO());
  const [branchId, setBranchId] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>(''); // '' = todos

  const generate = useGenerateHybridForWeekMutation();
  const branchesQ = useBranchesQuery();
  const departmentsQ = useDepartmentsQuery();
  const templatesQ = useShiftTemplatesQuery();

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
    (!showBranchSelector || branchId !== '') &&
    (!showDepartmentSelector || departmentId !== '');

  const onSubmit = () => {
    generate.mutate({
      weekStart,
      departmentId: effectiveDepartmentId || undefined,
      shiftTemplateId: templateId || undefined,
    });
  };

  const result: GenerateScheduleResult | null =
    generate.data?.result ?? null;

  return (
    <div className="space-y-4 max-w-2xl">
      <header>
        <h1 className="text-xl font-bold text-foreground">Generar horario</h1>
        <p className="text-sm text-muted-foreground">
          Dispara la generación LLM-autoritativa para una semana puntual.
          Si elegís departamento o turno, solo se regeneran sus asignaciones —
          el resto de la semana queda intacto.
        </p>
      </header>

      <Card className="p-4 space-y-3">
        <div className="space-y-1">
          <Label htmlFor="g-week">Semana (lunes)</Label>
          <Input
            id="g-week"
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            data-testid="g-week-input"
            disabled={generate.isPending}
          />
          <p className="text-xs text-muted-foreground">
            El backend resuelve cualquier fecha al lunes de su semana ISO.
          </p>
        </div>

        {showBranchSelector && (
          <div className="space-y-1">
            <Label htmlFor="g-branch">Sucursal</Label>
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
              <option value="">Elegí…</option>
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
            <Label htmlFor="g-dept">Departamento</Label>
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
              <option value="">Elegí…</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="g-template">Turno (opcional)</Label>
          <select
            id="g-template"
            data-testid="g-template-select"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            disabled={generate.isPending || templates.length === 0}
            className="flex h-9 w-full rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
          >
            <option value="">Todos los turnos</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Dejá "Todos" para regenerar el departamento entero.
          </p>
        </div>

        <Button
          onClick={onSubmit}
          disabled={!canSubmit}
          data-testid="g-submit"
        >
          {generate.isPending ? (
            'Generando…'
          ) : (
            <>
              <Wand2 className="w-4 h-4" /> Generar
            </>
          )}
        </Button>
      </Card>

      {generate.isError && (
        <Card className="p-4 border-error/40 bg-error/10">
          <div className="flex items-center gap-2 text-sm text-error">
            <AlertTriangle className="w-4 h-4" />
            Error: {(generate.error as Error).message}
          </div>
        </Card>
      )}

      {result && (
        <Card className="p-4 space-y-3" data-testid="g-result">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <CheckCircle2 className="w-4 h-4 text-secondary" />
            Generación completada para la semana del {generate.data?.weekStart}.
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Stat label="Asignaciones" value={result.assignmentsCount} />
            <Stat label="Underfilled" value={result.unfilledShiftsCount} />
            <Stat label="LLM aceptado" value={result.llmAccepted} />
          </div>

          <p className="text-sm text-foreground/80 whitespace-pre-line">
            {result.explanation}
          </p>

          {result.llmUsage && result.llmUsage.calls > 0 && (
            <div className="rounded-md border border-white/10 bg-surface-low/60 p-3 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="uppercase tracking-widest">Costo LLM</span>
              </div>
              <div className="mt-1 grid grid-cols-4 gap-2 font-mono text-foreground">
                <span>
                  {result.llmUsage.calls} call{result.llmUsage.calls === 1 ? '' : 's'}
                </span>
                <span>prompt {result.llmUsage.prompt.toLocaleString('es-AR')}</span>
                <span>
                  completion{' '}
                  {result.llmUsage.completion.toLocaleString('es-AR')}
                </span>
                <span className="font-semibold">
                  total {result.llmUsage.total.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          )}

          {result.warnings.length > 0 && (
            <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-yellow-300/80">
                Warnings
              </div>
              <ul className="text-sm text-yellow-200 list-disc pl-5">
                {result.warnings.map((w, i) => (
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
