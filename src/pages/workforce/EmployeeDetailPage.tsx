import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useEmployeeQuery } from '../../api/employees.api';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/Card';
import { WorkingTimePolicyCard } from './WorkingTimePolicyCard';

/**
 * EmployeeDetailPage — vista de un empleado puntual.
 *
 * Por ahora muestra: identidad básica + WorkingTimePolicyCard.
 * En iteraciones siguientes se sumará: edición inline (PATCH),
 * memberships del empleado, fairness history, calendar.
 */
export const EmployeeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useEmployeeQuery(id);

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/workforce/employees">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
        </Button>
      </div>

      {isLoading && (
        <Card className="p-4">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Cargando…
        </Card>
      )}

      {isError && (
        <Card className="p-4 border-error/40 bg-error/10 text-sm text-error">
          Empleado no encontrado o sin acceso.
        </Card>
      )}

      {data && (
        <>
          <Card className="p-4 space-y-1">
            <h1 className="text-xl font-bold text-foreground" data-testid="employee-name">
              {data.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {data.role}
              {data.phone && ` · ${data.phone}`}
            </p>
            {data.experienceMonths !== undefined && (
              <p className="text-xs text-muted-foreground">
                {data.experienceMonths} meses de experiencia
              </p>
            )}
          </Card>

          <WorkingTimePolicyCard employeeId={data.id} />
        </>
      )}
    </div>
  );
};
