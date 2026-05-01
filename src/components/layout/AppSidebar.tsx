import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

type NavItem = { to: string; labelKey: string; icon: typeof Zap };
type NavGroup = { id: string; labelKey: string; icon: typeof Zap; items: NavItem[] };

const groups: NavGroup[] = [
  {
    id: 'general',
    labelKey: 'nav:groups.general',
    icon: LayoutDashboard,
    items: [{ to: '/', labelKey: 'nav:items.dashboard', icon: LayoutDashboard }],
  },
  {
    id: 'workforce',
    labelKey: 'nav:groups.workforce',
    icon: Users,
    items: [
      { to: '/workforce/employees', labelKey: 'nav:items.employees', icon: User },
      { to: '/workforce/memberships', labelKey: 'nav:items.memberships', icon: Link2 },
      { to: '/workforce/skills', labelKey: 'nav:items.skills', icon: Award },
    ],
  },
  {
    id: 'scheduling',
    labelKey: 'nav:groups.scheduling',
    icon: Calendar,
    items: [
      { to: '/scheduling/templates', labelKey: 'nav:items.templates', icon: Layers },
      { to: '/scheduling/grid', labelKey: 'nav:items.schedule', icon: Grid3x3 },
      { to: '/scheduling/generate', labelKey: 'nav:items.generate', icon: Wand2 },
    ],
  },
  {
    id: 'policies',
    labelKey: 'nav:groups.policies',
    icon: ScrollText,
    items: [
      { to: '/rules', labelKey: 'nav:items.rules', icon: ScrollText },
      { to: '/policies', labelKey: 'nav:items.policies', icon: Shield },
    ],
  },
  {
    id: 'approvals',
    labelKey: 'nav:groups.approvals',
    icon: ClipboardCheck,
    items: [
      { to: '/approvals/incidents', labelKey: 'nav:items.incidents', icon: AlertCircle },
      { to: '/approvals/swaps', labelKey: 'nav:items.swaps', icon: ArrowLeftRight },
      { to: '/approvals/absences', labelKey: 'nav:items.absences', icon: UserX },
      { to: '/approvals/day-offs', labelKey: 'nav:items.dayOffs', icon: CalendarOff },
    ],
  },
  {
    id: 'insights',
    labelKey: 'nav:groups.insights',
    icon: BarChart3,
    items: [
      { to: '/insights/fairness', labelKey: 'nav:items.fairness', icon: Scale },
      { to: '/insights/coverage', labelKey: 'nav:items.coverage', icon: Map },
      { to: '/insights/demand', labelKey: 'nav:items.demand', icon: TrendingUp },
    ],
  },
];

export const AppSidebar = () => {
  const { t } = useTranslation();
  const { sidebarCollapsed, toggleSidebar } = useDashboardStore();
  const { pathname } = useLocation();

  // Grupo abierto por defecto: el que contiene la ruta activa.
  const initialOpen = groups
    .filter((g) => g.items.some((i) => pathname.startsWith(i.to) && i.to !== '/'))
    .map((g) => g.id);
  const [openGroups, setOpenGroups] = useState<string[]>(
    initialOpen.length > 0 ? initialOpen : ['workforce'],
  );

  const toggleGroup = (id: string) =>
    setOpenGroups((curr) =>
      curr.includes(id) ? curr.filter((l) => l !== id) : [...curr, id],
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
        aria-label={
          sidebarCollapsed
            ? t('nav:actions.expand')
            : t('nav:actions.collapse')
        }
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
            <h1 className="text-sm font-bold text-white">
              {t('nav:brand.title')}
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              {t('nav:brand.subtitle')}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-6">
        {groups.map((g) => {
          const isOpen = openGroups.includes(g.id);
          // Modo colapsado: mostramos solo iconos (todo aplanado, sin grupos).
          if (sidebarCollapsed) {
            return (
              <div key={g.id} className="space-y-1 mb-2">
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
                    title={t(item.labelKey)}
                  >
                    <item.icon className="w-4 h-4" />
                  </NavLink>
                ))}
              </div>
            );
          }
          return (
            <div key={g.id} className="mb-1">
              <button
                onClick={() => toggleGroup(g.id)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-colors"
              >
                <span className="flex items-center gap-2">
                  <g.icon className="w-3.5 h-3.5" />
                  {t(g.labelKey)}
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
                      <span className="truncate">{t(item.labelKey)}</span>
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
