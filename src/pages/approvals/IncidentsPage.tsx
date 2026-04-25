import { useMemo, useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useIncidentsQuery,
  useRejectIncidentMutation,
  useResolveIncidentMutation,
} from '../../api/incidents.api';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/data-table';
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

  const columns = useMemo<ColumnDef<Incident>[]>(
    () => [
      {
        accessorKey: 'employeeId',
        header: 'Empleado',
        enableGlobalFilter: true,
        cell: ({ row }) => (
          <span className="font-medium" title={row.original.employeeId}>
            {row.original.employeeId.slice(0, 8)}…
          </span>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Tipo',
        enableGlobalFilter: true,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.type}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        // Sort por status string; mostramos label.
        cell: ({ row }) => <Badge>{STATUS_LABEL[row.original.status]}</Badge>,
      },
      {
        id: 'period',
        header: 'Período',
        accessorFn: (i) =>
          i.startDate ? `${i.startDate}${i.endDate ? ` → ${i.endDate}` : ''}` : '',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.startDate
              ? `${row.original.startDate}${row.original.endDate ? ` → ${row.original.endDate}` : ''}`
              : '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const i = row.original;
          return (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                title="Rechazar"
                data-testid={`reject-${i.id}`}
                disabled={isClosed(i.status) || actingOn === i.id}
                onClick={() => handleReject(i)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Resolver"
                data-testid={`resolve-${i.id}`}
                disabled={isClosed(i.status) || actingOn === i.id}
                onClick={() => handleResolve(i)}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
        meta: { headerClassName: 'w-32', cellClassName: 'text-right' },
      },
    ],
    // actingOn debe re-disparar el render del disabled. rejectMut/resolveMut
    // son estables.
    [actingOn],
  );

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

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(i) => i.id}
        pageSize={10}
        pageSizeOptions={[5, 10, 15, 20]}
        searchPlaceholder="Buscar por empleado o tipo…"
        isLoading={list.isLoading}
        errorMessage={list.isError ? 'Error cargando incidentes.' : undefined}
        emptyMessage="No hay incidentes."
      />
    </div>
  );
};
