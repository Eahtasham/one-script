'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, type UserOrganization } from '@/stores/auth-store';
import type { Organization } from '@/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrganizationSwitcherProps {
    organizations: UserOrganization[];
    activeOrganization: Organization;
}

/**
 * Organization switcher dropdown for the sidebar.
 * Handles organization switching with:
 * - Visual indicator for current organization
 * - Role badges for each organization
 * - Cookie persistence for server-side preference
 * - Zustand store update for client-side state
 */
export function OrganizationSwitcher({
    organizations,
    activeOrganization
}: OrganizationSwitcherProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const switchOrganization = useAuthStore((state) => state.switchOrganization);
    const activeMembership = useAuthStore((state) => state.activeMembership);

    const handleSwitch = async (orgId: string) => {
        if (orgId === activeOrganization.id) return;

        // Update Zustand store immediately for UI responsiveness
        switchOrganization(orgId);

        // Set cookie for server-side preference
        document.cookie = `active-org-id=${orgId}; path=/; max-age=${60 * 60 * 24 * 365}`; // 1 year

        // Refresh the page to reload data for new organization
        startTransition(() => {
            router.refresh();
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className={cn(
                    "flex items-center gap-2 rounded-lg bg-sidebar-accent/50 p-2 text-sidebar-foreground w-full",
                    "hover:bg-sidebar-accent transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-sidebar",
                    isPending && "opacity-70 pointer-events-none"
                )}
                disabled={isPending}
            >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shrink-0">
                    <Building2 className="h-4 w-4" />
                </div>
                <div className="flex flex-col text-sm text-left flex-1 min-w-0">
                    <span className="font-medium truncate">{activeOrganization.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                        {activeMembership?.role || 'member'}
                    </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[240px]">
                <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {organizations.map((org) => {
                    const isActive = org.organization.id === activeOrganization.id;
                    return (
                        <DropdownMenuItem
                            key={org.organization.id}
                            onClick={() => handleSwitch(org.organization.id)}
                            className={cn(
                                "flex items-center justify-between cursor-pointer",
                                isActive && "bg-accent"
                            )}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600/20 text-indigo-600 shrink-0">
                                    <Building2 className="h-3 w-3" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium truncate">
                                        {org.organization.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground capitalize">
                                        {org.membership.role}
                                    </span>
                                </div>
                            </div>
                            {isActive && (
                                <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                            )}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
