import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ScrollText,
  ClipboardCheck,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  Link2,
  Award,
  Layers,
  Grid3x3,
  Wand2,
  AlertCircle,
  ArrowLeftRight,
  UserX,
  CalendarOff,
  Scale,
  Map,
  TrendingUp,
  Zap,
  Shield,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDashboardStore } from '../../store/dashboardStore';

type NavItem = { to: string; label: string; icon: typeof Zap };
type NavGroup = { label: string; icon: typeof Zap; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: 'General',
    icon: LayoutDashboard,
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Workforce',
    icon: Users,
    items: [
      { to: '/workforce/employees', label: 'Empleados', icon: User },
      { to: '/workforce/memberships', label: 'Memberships', icon: Link2 },
      { to: '/workforce/skills', label: 'Skills', icon: Award },
    ],
  },
  {
    label: 'Scheduling',
    icon: Calendar,
    items: [
      { to: '/scheduling/templates', label: 'Templates', icon: Layers },
      { to: '/scheduling/grid', label: 'Horario', icon: Grid3x3 },
      { to: '/scheduling/generate', label: 'Generar', icon: Wand2 },
    ],
  },
  {
    label: 'Rules',
    icon: ScrollText,
    items: [
      { to: '/rules', label: 'Reglas semánticas', icon: ScrollText },
      { to: '/policies', label: 'Políticas', icon: Shield },
    ],
  },
  {
    label: 'Approvals',
    icon: ClipboardCheck,
    items: [
      { to: '/approvals/incidents', label: 'Incidents', icon: AlertCircle },
      { to: '/approvals/swaps', label: 'Swap requests', icon: ArrowLeftRight },
      { to: '/approvals/absences', label: 'Ausencias', icon: UserX },
      { to: '/approvals/day-offs', label: 'Días libres', icon: CalendarOff },
    ],
  },
  {
    label: 'Insights',
    icon: BarChart3,
    items: [
      { to: '/insights/fairness', label: 'Fairness', icon: Scale },
      { to: '/insights/coverage', label: 'Coverage', icon: Map },
      { to: '/insights/demand', label: 'Demand', icon: TrendingUp },
    ],
  },
];

export const AppSidebar = () => {
  const { sidebarCollapsed, toggleSidebar } = useDashboardStore();
  const { pathname } = useLocation();

  // Grupo abierto por defecto: el que contiene la ruta activa.
  const initialOpen = groups
    .filter((g) => g.items.some((i) => pathname.startsWith(i.to) && i.to !== '/'))
    .map((g) => g.label);
  const [openGroups, setOpenGroups] = useState<string[]>(
    initialOpen.length > 0 ? initialOpen : ['Workforce'],
  );

  const toggleGroup = (label: string) =>
    setOpenGroups((curr) =>
      curr.includes(label) ? curr.filter((l) => l !== label) : [...curr, label],
    );

  return (
    <aside
      className={cn(
        'h-screen bg-surface-low border-r border-white/5 flex flex-col transition-all duration-300 relative shrink-0',
        sidebarCollapsed ? 'w-16' : 'w-60',
      )}
    >
      <button
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        className="absolute -right-3 top-20 w-6 h-6 bg-surface-highest border border-white/10 rounded-full flex items-center justify-center text-muted-foreground hover:text-white transition-colors z-50 shadow-xl"
      >
        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={cn('flex items-center gap-3 px-4 py-5', sidebarCollapsed && 'justify-center')}>
        <div className="w-9 h-9 bg-primary/15 rounded-lg flex items-center justify-center shrink-0">
          <Zap className="text-primary w-5 h-5 fill-primary/20" />
        </div>
        {!sidebarCollapsed && (
          <div className="leading-tight">
            <h1 className="text-sm font-bold text-white">AI Scheduling</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Manager
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-6">
        {groups.map((g) => {
          const isOpen = openGroups.includes(g.label);
          // Modo colapsado: mostramos solo iconos (todo aplanado, sin grupos).
          if (sidebarCollapsed) {
            return (
              <div key={g.label} className="space-y-1 mb-2">
                {g.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-center w-12 h-10 mx-auto rounded-md transition-colors',
                        isActive
                          ? 'bg-primary/20 text-primary'
                          : 'text-muted-foreground hover:bg-white/5 hover:text-white',
                      )
                    }
                    title={item.label}
                  >
                    <item.icon className="w-4 h-4" />
                  </NavLink>
                ))}
              </div>
            );
          }
          return (
            <div key={g.label} className="mb-1">
              <button
                onClick={() => toggleGroup(g.label)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-colors"
              >
                <span className="flex items-center gap-2">
                  <g.icon className="w-3.5 h-3.5" />
                  {g.label}
                </span>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 transition-transform',
                    isOpen && 'rotate-180',
                  )}
                />
              </button>
              {isOpen && (
                <div className="mt-1 ml-2 pl-2 border-l border-white/5 space-y-0.5">
                  {g.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground/80 hover:bg-white/5 hover:text-white',
                        )
                      }
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};
