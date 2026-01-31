'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions/actions';
import type { Organization, OrganizationMember } from '@/db/schema';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Home,
    Book,
    Inbox,
    Play,
    Settings,
    Users,
    LogOut,
    Building2
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/custom/theme-toggle';

interface DashboardUser {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
}

interface DashboardLayoutClientProps {
    children: React.ReactNode;
    user: DashboardUser;
    organization: Organization;
    membership: OrganizationMember;
}

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: Book },
    { name: 'Conversations', href: '/dashboard/inbox', icon: Inbox },
    { name: 'Playground', href: '/dashboard/playground', icon: Play },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayoutClient({
    children,
    user,
    organization,
    membership,
}: DashboardLayoutClientProps) {
    const pathname = usePathname();
    const isAdmin = membership.role === 'admin';

    // Helper to get initials
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-sidebar">
                <Sidebar>
                    <SidebarHeader>
                        <div className="flex items-center justify-between px-2 py-2">
                            <div className="flex items-center gap-2">
                                <Image src="/assets/logo.svg" alt="OneScript Logo" width={140} height={38} priority />
                            </div>
                            <ThemeToggle />
                        </div>
                        <Separator className="bg-sidebar-border" />
                        <div className="px-2 py-2">
                            <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/50 p-2 text-sidebar-foreground">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                                    <Building2 className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col text-sm">
                                    <span className="font-medium">{organization.name}</span>
                                    <span className="text-xs text-muted-foreground capitalize">{membership.role}</span>
                                </div>
                            </div>
                        </div>
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupLabel>Menu</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {navigation.map((item) => {
                                        const isActive = pathname === item.href ||
                                            (item.href !== '/dashboard' && pathname.startsWith(item.href));

                                        return (
                                            <SidebarMenuItem key={item.name}>
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={isActive}
                                                    tooltip={item.name}
                                                >
                                                    <Link href={item.href}>
                                                        <item.icon className="h-4 w-4" />
                                                        <span>{item.name}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                    {isAdmin && (
                                        <SidebarMenuItem>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={pathname.startsWith('/dashboard/team')}
                                                tooltip="Team"
                                            >
                                                <Link href="/dashboard/team">
                                                    <Users className="h-4 w-4" />
                                                    <span>Team</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>
                    <SidebarFooter>
                        <div className="p-2">
                            <form action={logout}>
                                <SidebarMenuButton type="submit" variant="outline" className="w-full justify-center gap-2">
                                    <LogOut className="h-4 w-4" />
                                    <span>Sign Out</span>
                                </SidebarMenuButton>
                            </form>
                        </div>
                        <Separator className="bg-sidebar-border" />
                        <div className="flex items-center gap-3 p-4">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user.image || ''} />
                                <AvatarFallback>{getInitials(user.name || user.email)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col text-sm">
                                <span className="font-medium text-sidebar-foreground">
                                    {user.name || user.email.split('@')[0]}
                                </span>
                                <span className="text-xs text-muted-foreground truncate w-32">
                                    {user.email}
                                </span>
                            </div>
                        </div>
                    </SidebarFooter>
                </Sidebar>
                <main className="flex-1 overflow-auto bg-background">
                    <div className="flex items-center p-4 md:hidden">
                        <SidebarTrigger />
                    </div>
                    {children}
                </main>
            </div>
        </SidebarProvider>
    );
}
