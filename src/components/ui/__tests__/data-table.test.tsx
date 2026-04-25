import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../data-table';

interface Row {
  id: string;
  name: string;
  role: string;
  experienceMonths: number;
}

const data: Row[] = [
  { id: 'a', name: 'Ana López', role: 'enfermera', experienceMonths: 24 },
  { id: 'b', name: 'Bruno Pérez', role: 'mozo', experienceMonths: 6 },
  { id: 'c', name: 'Carla Díaz', role: 'enfermera', experienceMonths: 12 },
];

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Nombre', enableGlobalFilter: true },
  { accessorKey: 'role', header: 'Rol' },
  {
    accessorKey: 'experienceMonths',
    header: 'Experiencia',
    enableGlobalFilter: false,
  },
];

const renderTable = (props: Partial<React.ComponentProps<typeof DataTable<Row>>> = {}) =>
  render(
    <DataTable
      data={data}
      columns={columns}
      getRowId={(r) => r.id}
      {...props}
    />,
  );

describe('DataTable', () => {
  it('renderiza una fila por dato con id estable en el data-testid', () => {
    renderTable();
    expect(screen.getByTestId('datatable-row-a')).toBeInTheDocument();
    expect(screen.getByTestId('datatable-row-b')).toBeInTheDocument();
    expect(screen.getByTestId('datatable-row-c')).toBeInTheDocument();
  });

  it('filtra filas con el search global (case-insensitive, sin tocar columnas opt-out)', async () => {
    const user = userEvent.setup();
    renderTable({ searchPlaceholder: 'Buscar…' });

    await user.type(screen.getByTestId('datatable-search'), 'ana');

    expect(screen.getByTestId('datatable-row-a')).toBeInTheDocument();
    expect(screen.queryByTestId('datatable-row-b')).not.toBeInTheDocument();
    expect(screen.queryByTestId('datatable-row-c')).not.toBeInTheDocument();
  });

  it('ordena al hacer click en el header (toggle asc → desc)', async () => {
    const user = userEvent.setup();
    renderTable();

    const header = screen.getByTestId('datatable-sort-name');
    await user.click(header);

    let rows = screen.getAllByTestId(/^datatable-row-/);
    expect(within(rows[0]).getByText('Ana López')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Carla Díaz')).toBeInTheDocument();

    await user.click(header);
    rows = screen.getAllByTestId(/^datatable-row-/);
    expect(within(rows[0]).getByText('Carla Díaz')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Ana López')).toBeInTheDocument();
  });

  it('renderiza el slot toolbar', () => {
    renderTable({ toolbar: <button data-testid="custom-filter">Rol</button> });
    expect(screen.getByTestId('custom-filter')).toBeInTheDocument();
  });

  it('pagina cuando se setea pageSize y navega con prev/next', async () => {
    const user = userEvent.setup();
    const many: Row[] = Array.from({ length: 25 }, (_, i) => ({
      id: `r${i}`,
      name: `Empleado ${i.toString().padStart(2, '0')}`,
      role: 'employee',
      experienceMonths: i,
    }));

    render(
      <DataTable
        data={many}
        columns={columns}
        getRowId={(r) => r.id}
        pageSize={10}
      />,
    );

    expect(screen.getAllByTestId(/^datatable-row-/)).toHaveLength(10);
    expect(screen.getByTestId('datatable-page-info')).toHaveTextContent('Página 1 de 3');
    expect(screen.getByTestId('datatable-page-summary')).toHaveTextContent(
      'Mostrando 10 de 25',
    );
    expect(screen.getByTestId('datatable-prev')).toBeDisabled();

    await user.click(screen.getByTestId('datatable-next'));
    expect(screen.getByTestId('datatable-page-info')).toHaveTextContent('Página 2 de 3');
    expect(screen.getByTestId('datatable-row-r10')).toBeInTheDocument();
    expect(screen.queryByTestId('datatable-row-r0')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('datatable-next'));
    expect(screen.getByTestId('datatable-page-info')).toHaveTextContent('Página 3 de 3');
    expect(screen.getAllByTestId(/^datatable-row-/)).toHaveLength(5);
    expect(screen.getByTestId('datatable-next')).toBeDisabled();
  });

  it('cambiar el page size re-pagina las filas', async () => {
    const user = userEvent.setup();
    const many: Row[] = Array.from({ length: 12 }, (_, i) => ({
      id: `r${i}`,
      name: `E ${i}`,
      role: 'employee',
      experienceMonths: i,
    }));

    render(
      <DataTable
        data={many}
        columns={columns}
        getRowId={(r) => r.id}
        pageSize={5}
        pageSizeOptions={[5, 10, 15]}
      />,
    );

    expect(screen.getAllByTestId(/^datatable-row-/)).toHaveLength(5);
    expect(screen.getByTestId('datatable-page-info')).toHaveTextContent('Página 1 de 3');

    await user.selectOptions(screen.getByTestId('datatable-page-size'), '10');

    expect(screen.getAllByTestId(/^datatable-row-/)).toHaveLength(10);
    expect(screen.getByTestId('datatable-page-info')).toHaveTextContent('Página 1 de 2');
  });

  it('sin pageSizeOptions, no renderiza el selector', () => {
    render(
      <DataTable
        data={[data[0]]}
        columns={columns}
        getRowId={(r) => r.id}
        pageSize={10}
      />,
    );
    expect(screen.queryByTestId('datatable-page-size')).not.toBeInTheDocument();
  });

  it('sin pageSize no renderiza el footer de paginación', () => {
    renderTable();
    expect(screen.queryByTestId('datatable-page-info')).not.toBeInTheDocument();
    expect(screen.queryByTestId('datatable-prev')).not.toBeInTheDocument();
  });

  it('muestra estado loading / empty / error', () => {
    const { rerender } = render(
      <DataTable data={[]} columns={columns} isLoading getRowId={(r) => r.id} />,
    );
    expect(screen.getByText(/Cargando/)).toBeInTheDocument();

    rerender(
      <DataTable
        data={[]}
        columns={columns}
        emptyMessage="No hay empleados todavía."
        getRowId={(r) => r.id}
      />,
    );
    expect(screen.getByText('No hay empleados todavía.')).toBeInTheDocument();

    rerender(
      <DataTable
        data={[]}
        columns={columns}
        errorMessage="Error cargando."
        getRowId={(r) => r.id}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Error cargando.');
  });
});
