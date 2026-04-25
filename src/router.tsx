import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { Placeholder } from './pages/Placeholder';
import { EmployeesPage } from './pages/workforce/EmployeesPage';
import { MembershipsPage } from './pages/workforce/MembershipsPage';
import { SkillsPage } from './pages/workforce/SkillsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },

      // Workforce ----------------------------------------------------------
      {
        path: 'workforce',
        children: [
          { index: true, element: <Navigate to="employees" replace /> },
          {
            path: 'employees',
            element: <EmployeesPage />,
          },
          {
            path: 'employees/:id',
            element: <Placeholder title="Detalle de empleado" />,
          },
          {
            path: 'memberships',
            element: <MembershipsPage />,
          },
          {
            path: 'skills',
            element: <SkillsPage />,
          },
        ],
      },

      // Scheduling ---------------------------------------------------------
      {
        path: 'scheduling',
        children: [
          { index: true, element: <Navigate to="grid" replace /> },
          {
            path: 'templates',
            element: (
              <Placeholder
                title="Shift Templates"
                description="Definiciones recurrentes de turno. CRUD."
              />
            ),
          },
          {
            path: 'grid',
            element: (
              <Placeholder
                title="Horario semanal"
                description="ScheduleGrid existente — pendiente de mover acá."
              />
            ),
          },
          {
            path: 'generate',
            element: (
              <Placeholder
                title="Generar horario"
                description="Trigger manual de POST /schedules/generate/hybrid."
              />
            ),
          },
        ],
      },

      // Rules --------------------------------------------------------------
      {
        path: 'rules',
        element: (
          <Placeholder
            title="Reglas semánticas"
            description="Lista, crear (texto natural), editar metadata, editar texto (regenera embedding)."
          />
        ),
      },

      // Approvals ----------------------------------------------------------
      {
        path: 'approvals',
        children: [
          { index: true, element: <Navigate to="incidents" replace /> },
          {
            path: 'incidents',
            element: (
              <Placeholder
                title="Incidents"
                description="Bandeja de entrada de incidentes. Reject / resolve."
              />
            ),
          },
          {
            path: 'swaps',
            element: (
              <Placeholder
                title="Shift swap requests"
                description="Pedidos de intercambio. Approve / reject."
              />
            ),
          },
          {
            path: 'absences',
            element: (
              <Placeholder
                title="Reportes de ausencia"
                description="Histórico inmutable."
              />
            ),
          },
          {
            path: 'day-offs',
            element: (
              <Placeholder
                title="Solicitudes de día libre"
                description="Approve / reject."
              />
            ),
          },
        ],
      },

      // Insights -----------------------------------------------------------
      {
        path: 'insights',
        children: [
          { index: true, element: <Navigate to="fairness" replace /> },
          {
            path: 'fairness',
            element: (
              <Placeholder
                title="Fairness por empleado"
                description="Indicadores acumulados de carga."
              />
            ),
          },
          {
            path: 'coverage',
            element: <Placeholder title="Coverage Heatmap" />,
          },
          {
            path: 'demand',
            element: <Placeholder title="Demand Heatmap" />,
          },
        ],
      },

      // Catch-all
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
