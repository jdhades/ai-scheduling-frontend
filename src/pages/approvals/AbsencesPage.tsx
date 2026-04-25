import { Loader2 } from 'lucide-react';
import { useAbsenceReportsQuery } from '../../api/absence-reports.api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/Badge';

/**
 * AbsencesPage — listado read-only. Los reportes son inmutables;
 * sin acciones. Para crear uno nuevo se hace via WhatsApp o
 * via POST /absence-reports desde una pantalla aparte (futura).
 */
export const AbsencesPage = () => {
  const list = useAbsenceReportsQuery();
  const rows = list.data ?? [];

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-foreground">Reportes de ausencia</h1>
        <p className="text-sm text-muted-foreground">
          {list.isLoading
            ? 'Cargando…'
            : `${rows.length} reporte${rows.length === 1 ? '' : 's'}`}
        </p>
      </header>

      {list.isError && (
        <div className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
          Error cargando ausencias.
        </div>
      )}

      <div className="rounded-lg border border-white/5 bg-surface-low">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empleado</TableHead>
              <TableHead>Assignment</TableHead>
              <TableHead>Razón</TableHead>
              <TableHead>Urgente</TableHead>
              <TableHead>Reportado</TableHead>
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
                  No hay ausencias reportadas.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell title={r.employeeId}>{r.employeeId.slice(0, 8)}…</TableCell>
                <TableCell className="text-muted-foreground" title={r.assignmentId ?? ''}>
                  {r.assignmentId ? `${r.assignmentId.slice(0, 8)}…` : '—'}
                </TableCell>
                <TableCell className="max-w-md truncate" title={r.reason}>
                  {r.reason}
                </TableCell>
                <TableCell>
                  {r.isUrgent ? <Badge>urgente</Badge> : <span className="text-muted-foreground">no</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(r.reportedAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
