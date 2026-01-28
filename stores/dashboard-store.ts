import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface DashboardState {
    // State
    sidebarCollapsed: boolean;
    activeNavItem: string | null;

    // Actions
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setActiveNavItem: (item: string | null) => void;
}

export const useDashboardStore = create<DashboardState>()(
    devtools(
        persist(
            (set) => ({
                // Initial state
                sidebarCollapsed: false,
                activeNavItem: null,

                // Actions
                toggleSidebar: () => set(
                    (state) => ({ sidebarCollapsed: !state.sidebarCollapsed }),
                    false,
                    'dashboard/toggleSidebar'
                ),
                setSidebarCollapsed: (sidebarCollapsed) => set(
                    { sidebarCollapsed },
                    false,
                    'dashboard/setSidebarCollapsed'
                ),
                setActiveNavItem: (activeNavItem) => set(
                    { activeNavItem },
                    false,
                    'dashboard/setActiveNavItem'
                ),
            }),
            {
                name: 'dashboard-preferences',
                partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
            }
        ),
        { name: 'dashboard-store' }
    )
);

// Selector hooks
export const useSidebarCollapsed = () => useDashboardStore((state) => state.sidebarCollapsed);
export const useActiveNavItem = () => useDashboardStore((state) => state.activeNavItem);
