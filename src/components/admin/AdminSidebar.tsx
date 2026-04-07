'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import {
  LayoutDashboard,
  Factory,
  GitBranch,
  Tag,
  Newspaper,
  Briefcase,
  Wrench,
  Handshake,
  Image,
  MessageSquare,
  Settings,
  ArrowLeft,
  LogOut,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { COMPANY } from '@/lib/constants';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/eurl/lasource/dashboard' },
  { id: 'machines', label: 'Machines', icon: Factory, href: '/eurl/lasource/machines' },
  { id: 'categories', label: 'Categories', icon: Tag, href: '/eurl/lasource/categories' },
  { id: 'production-lines', label: 'Production Lines', icon: GitBranch, href: '/eurl/lasource/production-lines' },
  { id: 'news', label: 'News', icon: Newspaper, href: '/eurl/lasource/news' },
  { id: 'projects', label: 'Projects', icon: Briefcase, href: '/eurl/lasource/projects' },
  { id: 'services', label: 'Services', icon: Wrench, href: '/eurl/lasource/services' },
  { id: 'partners', label: 'Partners', icon: Handshake, href: '/eurl/lasource/partners' },
  { id: 'gallery', label: 'Gallery', icon: Image, href: '/eurl/lasource/gallery' },
  { id: 'leads', label: 'Leads', icon: MessageSquare, href: '/eurl/lasource/leads' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/eurl/lasource/settings' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setAdminAuth } = useAppStore();

  const handleLogout = () => {
    setAdminAuth(false, null);
    router.push('/');
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-sidebar-accent/50"
              asChild
            >
              <Link href="/eurl/lasource/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Factory className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-sm">{COMPANY.name}</span>
                  <span className="text-xs text-muted-foreground">Admin Panel</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    asChild
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Back to Website"
              asChild
            >
              <Link href="/">
                <ArrowLeft className="size-4" />
                <span>Back to Website</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              onClick={handleLogout}
              className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              <LogOut className="size-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
