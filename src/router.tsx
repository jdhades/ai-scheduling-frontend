import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/workforce/EmployeesPage';
import { MembershipsPage } from './pages/workforce/MembershipsPage';
import { SkillsPage } from './pages/workforce/SkillsPage';
import { EmployeeDetailPage } from './pages/workforce/EmployeeDetailPage';
import { DepartmentsPage } from './pages/workforce/DepartmentsPage';
import { TemplatesPage } from './pages/scheduling/TemplatesPage';
import { SchedulePage } from './pages/scheduling/SchedulePage';
import { GeneratePage } from './pages/scheduling/GeneratePage';
import { RulesPage } from './pages/rules/RulesPage';
import { CompanyPoliciesPage } from './pages/policies/CompanyPoliciesPage';
import { IncidentsPage } from './pages/approvals/IncidentsPage';
import { SwapsPage } from './pages/approvals/SwapsPage';
import { AbsencesPage } from './pages/approvals/AbsencesPage';
import { DayOffsPage } from './pages/approvals/DayOffsPage';
import { FairnessPage } from './pages/insights/FairnessPage';
import { CoveragePage } from './pages/insights/CoveragePage';
import { DemandPage } from './pages/insights/DemandPage';

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
          {
            path: 'departments',
            element: <DepartmentsPage />,
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

      // Policies -----------------------------------------------------------
      { path: 'policies', element: <CompanyPoliciesPage /> },

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
          { path: 'fairness', element: <FairnessPage /> },
          { path: 'coverage', element: <CoveragePage /> },
          { path: 'demand', element: <DemandPage /> },
        ],
      },

      // Catch-all
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
