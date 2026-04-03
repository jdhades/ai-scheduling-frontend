import { create } from 'zustand'

interface DashboardUIState {
  sidebarCollapsed: boolean;
  activeView: 'command_center' | 'timeline' | 'fleet' | 'analytics' | 'logs';
  
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveView: (view: DashboardUIState['activeView']) => void;
}

export const useDashboardStore = create<DashboardUIState>((set) => ({
  sidebarCollapsed: false,
  activeView: 'command_center',

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setActiveView: (activeView) => set({ activeView }),
}))
