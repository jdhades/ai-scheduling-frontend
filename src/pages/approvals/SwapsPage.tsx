import { Loader2, Check, X } from 'lucide-react';
import {
  useShiftSwapRequestsQuery,
  useApproveShiftSwapRequestMutation,
  useRejectShiftSwapRequestMutation,
} from '../../api/shift-swap-requests.api';
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

export const SwapsPage = () => {
  const list = useShiftSwapRequestsQuery();
  const approveMut = useApproveShiftSwapRequestMutation();
  const rejectMut = useRejectShiftSwapRequestMutation();
  const rows = list.data ?? [];

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-foreground">Shift swap requests</h1>
        <p className="text-sm text-muted-foreground">
          {list.isLoading
            ? 'Cargando…'
            : `${rows.length} pedido${rows.length === 1 ? '' : 's'}`}
        </p>
      </header>

      {list.isError && (
        <div className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
          Error cargando swaps.
        </div>
      )}

      <div className="rounded-lg border border-white/5 bg-surface-low">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pide</TableHead>
              <TableHead>A</TableHead>
              <TableHead>Assignment</TableHead>
              <TableHead>Estado</TableHead>
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
                  No hay swap requests.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell title={r.requesterId}>{r.requesterId.slice(0, 8)}…</TableCell>
                <TableCell title={r.targetId}>{r.targetId.slice(0, 8)}…</TableCell>
                <TableCell className="text-muted-foreground" title={r.assignmentId ?? ''}>
                  {r.assignmentId ? `${r.assignmentId.slice(0, 8)}…` : '—'}
                </TableCell>
                <TableCell>
                  <Badge>{r.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Aprobar"
                      data-testid={`approve-${r.id}`}
                      disabled={r.status !== 'pending' || approveMut.isPending}
                      onClick={() => approveMut.mutate(r.id)}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Rechazar"
                      data-testid={`reject-${r.id}`}
                      disabled={r.status !== 'pending' || rejectMut.isPending}
                      onClick={() => rejectMut.mutate(r.id)}
                    >
                      <X className="w-3.5 h-3.5" />
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
