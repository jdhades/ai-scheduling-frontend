import * as React from 'react';
import {
  type ColumnDef,
  type RowData,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
} from 'lucide-react';
import { Button } from './button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { Input } from './input';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
  }
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  /** Si llega, renderiza un input global de búsqueda sobre las columnas. */
  searchPlaceholder?: string;
  /** Slot para filtros específicos de la página (selects, chips, etc.). */
  toolbar?: React.ReactNode;
  /** Extrae el id estable de cada fila (se usa en data-testid de la fila). */
  getRowId?: (row: T) => string;
  /** Si llega, activa paginación cliente con ese tamaño de página inicial. */
  pageSize?: number;
  /** Si llega, renderiza un select para que el usuario cambie el page size. */
  pageSizeOptions?: number[];
  isLoading?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder,
  toolbar,
  getRowId,
  pageSize,
  pageSizeOptions,
  isLoading,
  errorMessage,
  emptyMessage = 'No hay datos.',
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    ...(pageSize
      ? {
          getPaginationRowModel: getPaginationRowModel(),
          initialState: { pagination: { pageIndex: 0, pageSize } },
        }
      : {}),
  });

  const rows = table.getRowModel().rows;
  const visibleColumnCount = table.getVisibleLeafColumns().length;
  const paginated = pageSize !== undefined;
  const totalRows = table.getPrePaginationRowModel().rows.length;

  return (
    <div className="space-y-3">
      {(searchPlaceholder || toolbar) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchPlaceholder && (
            <div className="relative max-w-xs flex-1">
              <Search
                className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-8"
                data-testid="datatable-search"
                aria-label={searchPlaceholder}
              />
            </div>
          )}
          {toolbar}
        </div>
      )}

      {errorMessage && (
        <div
          className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      <div className="rounded-lg border border-white/5 bg-surface-low overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const headerClassName = header.column.columnDef.meta?.headerClassName;
                  return (
                    <TableHead key={header.id} className={headerClassName}>
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                          data-testid={`datatable-sort-${header.column.id}`}
                          aria-label={`Ordenar por ${String(header.column.id)}`}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === 'asc' ? (
                            <ArrowUp className="h-3 w-3" aria-hidden="true" />
                          ) : sorted === 'desc' ? (
                            <ArrowDown className="h-3 w-3" aria-hidden="true" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-50" aria-hidden="true" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  className="py-8 text-center text-muted-foreground"
                >
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden="true" /> Cargando…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  className="py-8 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              rows.map((row) => (
                <TableRow key={row.id} data-testid={`datatable-row-${row.id}`}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.columnDef.meta?.cellClassName}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {paginated && totalRows > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            {pageSizeOptions && pageSizeOptions.length > 0 && (
              <label className="flex items-center gap-2">
                <span>Filas:</span>
                <select
                  data-testid="datatable-page-size"
                  aria-label="Filas por página"
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => table.setPageSize(Number(e.target.value))}
                  className="flex h-8 rounded-md border border-white/10 bg-surface-low px-2 text-sm text-foreground"
                >
                  {pageSizeOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <span data-testid="datatable-page-summary">
              {rows.length === totalRows
                ? `${totalRows} resultado${totalRows === 1 ? '' : 's'}`
                : `Mostrando ${rows.length} de ${totalRows}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              data-testid="datatable-prev"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <span data-testid="datatable-page-info">
              Página {table.getState().pagination.pageIndex + 1} de{' '}
              {Math.max(1, table.getPageCount())}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              data-testid="datatable-next"
              aria-label="Página siguiente"
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
