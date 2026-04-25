import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { Placeholder } from './pages/Placeholder';
import { EmployeesPage } from './pages/workforce/EmployeesPage';
import { MembershipsPage } from './pages/workforce/MembershipsPage';
import { SkillsPage } from './pages/workforce/SkillsPage';
import { EmployeeDetailPage } from './pages/workforce/EmployeeDetailPage';
import { TemplatesPage } from './pages/scheduling/TemplatesPage';
import { SchedulePage } from './pages/scheduling/SchedulePage';
import { GeneratePage } from './pages/scheduling/GeneratePage';
import { RulesPage } from './pages/rules/RulesPage';
import { IncidentsPage } from './pages/approvals/IncidentsPage';
import { SwapsPage } from './pages/approvals/SwapsPage';
import { AbsencesPage } from './pages/approvals/AbsencesPage';
import { DayOffsPage } from './pages/approvals/DayOffsPage';

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
            element: <EmployeeDetailPage />,
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
            element: <TemplatesPage />,
          },
          {
            path: 'grid',
            element: <SchedulePage />,
          },
          {
            path: 'generate',
            element: <GeneratePage />,
          },
        ],
      },

      // Rules --------------------------------------------------------------
      { path: 'rules', element: <RulesPage /> },

      // Approvals ----------------------------------------------------------
      {
        path: 'approvals',
        children: [
          { index: true, element: <Navigate to="incidents" replace /> },
          { path: 'incidents', element: <IncidentsPage /> },
          { path: 'swaps', element: <SwapsPage /> },
          { path: 'absences', element: <AbsencesPage /> },
          { path: 'day-offs', element: <DayOffsPage /> },
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
