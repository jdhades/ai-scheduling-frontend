import { useState } from 'react';
import { Wand2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  useGenerateHybridForWeekMutation,
  type GenerateScheduleResult,
} from '../../api/schedule.api';
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
 * GeneratePage — dispara una generación híbrida para una semana específica
 * y muestra el resumen del resultado: total de asignaciones, underfilled,
 * warnings, explanation generada por el handler.
 *
 * El flujo real corre en el backend (LLM-autoritativo + verify + fallback
 * determinístico). Esta página solo es el trigger + visualización.
 */
export const GeneratePage = () => {
  const [weekStart, setWeekStart] = useState<string>(upcomingMondayISO());
  const generate = useGenerateHybridForWeekMutation();

  const result: GenerateScheduleResult | null =
    generate.data?.result ?? null;

  return (
    <div className="space-y-4 max-w-2xl">
      <header>
        <h1 className="text-xl font-bold text-foreground">Generar horario</h1>
        <p className="text-sm text-muted-foreground">
          Dispara la generación LLM-autoritativa para una semana puntual.
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

        <Button
          onClick={() => generate.mutate({ weekStart })}
          disabled={!weekStart || generate.isPending}
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
