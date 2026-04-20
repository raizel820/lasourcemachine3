'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Shield } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

const PATH_TITLES: Record<string, string> = {
  '/eurl/lasource/dashboard': 'Dashboard',
  '/eurl/lasource/machines': 'Machines',
  '/eurl/lasource/production-lines': 'Production Lines',
  '/eurl/lasource/news': 'News',
  '/eurl/lasource/projects': 'Projects',
  '/eurl/lasource/services': 'Services',
  '/eurl/lasource/partners': 'Partners',
  '/eurl/lasource/leads': 'Leads',
  '/eurl/lasource/settings': 'Settings',
};

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageTitle = PATH_TITLES[pathname] || 'Admin';

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink
                  href="/eurl/lasource/dashboard"
                  asChild
                >
                  <Link href="/eurl/lasource/dashboard" className="flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-blue-600" />
                    Admin
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold">
              A
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:inline">Admin</span>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 overflow-auto bg-muted/40 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
