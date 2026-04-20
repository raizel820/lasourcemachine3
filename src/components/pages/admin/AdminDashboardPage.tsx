'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import {
  Factory,
  GitBranch,
  Newspaper,
  MessageSquare,
  Briefcase,
  Plus,
  ArrowRight,
  Users,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface StatsData {
  machines: number;
  productionLines: number;
  news: number;
  leads: number;
  projects: number;
}

interface LeadItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  status: string;
  createdAt: string;
  machine?: { name: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  contacted: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  qualified: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  closed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export function AdminDashboardPage() {
  const router = useRouter();
  const { adminToken } = useAppStore();
  const [stats, setStats] = useState<StatsData>({
    machines: 0,
    productionLines: 0,
    news: 0,
    leads: 0,
    projects: 0,
  });
  const [recentLeads, setRecentLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const headers: HeadersInit = {};
        if (adminToken) {
          headers['Authorization'] = `Bearer ${adminToken}`;
        }

        const [
          machinesRes,
          productionLinesRes,
          newsRes,
          leadsRes,
          projectsRes,
        ] = await Promise.allSettled([
          fetch('/api/machines').then((r) => r.json()),
          fetch('/api/production-lines').then((r) => r.json()),
          fetch('/api/news').then((r) => r.json()),
          fetch('/api/leads?limit=5', { headers }).then((r) => r.json()),
          fetch('/api/projects').then((r) => r.json()),
        ]);

        const machinesData = machinesRes.status === 'fulfilled' ? machinesRes.value : null;
        const productionLinesData = productionLinesRes.status === 'fulfilled' ? productionLinesRes.value : null;
        const newsData = newsRes.status === 'fulfilled' ? newsRes.value : null;
        const leadsData = leadsRes.status === 'fulfilled' ? leadsRes.value : null;
        const projectsData = projectsRes.status === 'fulfilled' ? projectsRes.value : null;

        setStats({
          machines: machinesData?.pagination?.total ?? machinesData?.data?.length ?? 0,
          productionLines: productionLinesData?.pagination?.total ?? productionLinesData?.data?.length ?? 0,
          news: newsData?.pagination?.total ?? newsData?.data?.length ?? 0,
          leads: leadsData?.pagination?.total ?? leadsData?.data?.length ?? 0,
          projects: projectsData?.pagination?.total ?? projectsData?.data?.length ?? 0,
        });

        if (leadsData?.data) {
          setRecentLeads(leadsData.data.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [adminToken]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Machines',
      value: stats.machines,
      icon: Factory,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950',
      href: '/eurl/lasource/machines',
    },
    {
      title: 'Production Lines',
      value: stats.productionLines,
      icon: GitBranch,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950',
      href: '/eurl/lasource/production-lines',
    },
    {
      title: 'News Posts',
      value: stats.news,
      icon: Newspaper,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950',
      href: '/eurl/lasource/news',
    },
    {
      title: 'Total Projects',
      value: stats.projects,
      icon: Briefcase,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950',
      href: '/eurl/lasource/projects',
    },
    {
      title: 'Leads (New)',
      value: stats.leads,
      icon: MessageSquare,
      color: 'text-rose-600',
      bg: 'bg-rose-50 dark:bg-rose-950',
      href: '/eurl/lasource/leads',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Overview of your website content and activity.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => router.push(card.href)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {card.title}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {card.value}
                  </p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Leads */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Recent Leads</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Latest inquiries and contact submissions
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/eurl/lasource/leads')}
              className="text-xs"
            >
              View All
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <MessageSquare className="h-8 w-8 mb-2" />
                <p className="text-sm">No leads yet</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Subject</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Machine</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="text-xs font-medium">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{lead.name}</p>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px]">{lead.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs hidden sm:table-cell max-w-[150px] truncate">
                          {lead.subject || '—'}
                        </TableCell>
                        <TableCell className="text-xs hidden md:table-cell">
                          {lead.machine?.name || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${STATUS_COLORS[lead.status] || ''}`}
                          >
                            {lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 hidden sm:table-cell">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Common tasks to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Add New Machine', href: '/eurl/lasource/machines', icon: Factory },
              { label: 'Create News Post', href: '/eurl/lasource/news', icon: Newspaper },
              { label: 'Add Project', href: '/eurl/lasource/projects', icon: Briefcase },
              { label: 'View All Leads', href: '/eurl/lasource/leads', icon: Users },
              { label: 'Manage Services', href: '/eurl/lasource/services', icon: GitBranch },
              { label: 'Site Settings', href: '/eurl/lasource/settings', icon: MessageSquare },
            ].map((action) => (
              <Button
                key={action.label}
                variant="ghost"
                className="w-full justify-start gap-3 text-sm h-10"
                onClick={() => router.push(action.href)}
              >
                <action.icon className="h-4 w-4 text-blue-600" />
                {action.label}
                <Plus className="ml-auto h-3.5 w-3.5 text-slate-400" />
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
