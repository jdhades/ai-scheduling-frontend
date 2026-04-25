import { useState } from 'react';
import { Loader2, X, CheckCircle2 } from 'lucide-react';
import {
  useIncidentsQuery,
  useRejectIncidentMutation,
  useResolveIncidentMutation,
} from '../../api/incidents.api';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/Badge';
import type { Incident, IncidentStatus } from '../../types/approvals';

const STATUS_LABEL: Record<IncidentStatus, string> = {
  reported: 'Reportado',
  document_received: 'Doc recibido',
  pending_ocr: 'OCR pendiente',
  processing_ocr: 'OCR en curso',
  pending_validation: 'Validación pendiente',
  validated: 'Validado',
  rejected: 'Rechazado',
  repair_in_progress: 'Reparación en curso',
  replacement_pending: 'Reemplazo pendiente',
  replacement_assigned: 'Reemplazo asignado',
  resolved: 'Resuelto',
};

const isClosed = (s: IncidentStatus) => s === 'rejected' || s === 'resolved';

export const IncidentsPage = () => {
  const list = useIncidentsQuery();
  const rejectMut = useRejectIncidentMutation();
  const resolveMut = useResolveIncidentMutation();
  const [actingOn, setActingOn] = useState<string | null>(null);

  const rows = list.data ?? [];

  const handleReject = (i: Incident) => {
    const reason = window.prompt(`Razón del rechazo para incident ${i.id}:`);
    if (!reason || !reason.trim()) return;
    setActingOn(i.id);
    rejectMut.mutate(
      { id: i.id, reason: reason.trim() },
      { onSettled: () => setActingOn(null) },
    );
  };

  const handleResolve = (i: Incident) => {
    const details = window.prompt(`Detalle de la resolución para incident ${i.id}:`);
    if (!details || !details.trim()) return;
    setActingOn(i.id);
    resolveMut.mutate(
      { id: i.id, details: details.trim() },
      { onSettled: () => setActingOn(null) },
    );
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-foreground">Incidents</h1>
        <p className="text-sm text-muted-foreground">
          {list.isLoading
            ? 'Cargando…'
            : `${rows.length} incidente${rows.length === 1 ? '' : 's'}`}
        </p>
      </header>

      {list.isError && (
        <div className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
          Error cargando incidentes.
        </div>
      )}

      <div className="rounded-lg border border-white/5 bg-surface-low">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empleado</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Período</TableHead>
              <TableHead className="w-32 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Cargando…
                </TableCell>
              </TableRow>
            )}
            {!list.isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No hay incidentes.
                </TableCell>
              </TableRow>
            )}
            {rows.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium" title={i.employeeId}>
                  {i.employeeId.slice(0, 8)}…
                </TableCell>
                <TableCell className="text-muted-foreground">{i.type}</TableCell>
                <TableCell>
                  <Badge>{STATUS_LABEL[i.status]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {i.startDate
                    ? `${i.startDate}${i.endDate ? ` → ${i.endDate}` : ''}`
                    : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Rechazar"
                      data-testid={`reject-${i.id}`}
                      disabled={isClosed(i.status) || actingOn === i.id}
                      onClick={() => handleReject(i)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Resolver"
                      data-testid={`resolve-${i.id}`}
                      disabled={isClosed(i.status) || actingOn === i.id}
                      onClick={() => handleResolve(i)}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
