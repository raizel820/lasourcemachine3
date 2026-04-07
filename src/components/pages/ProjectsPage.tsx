'use client';

import { useState, useEffect } from 'react';
import { MapPin, ArrowRight, Briefcase, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import { getTranslations } from '@/lib/i18n';
import { getLocalizedValue, truncateText, getEntityCoverImage } from '@/lib/helpers';
import type { Project } from '@/lib/types';

export function ProjectsPage() {
  const { locale, setCurrentPage, setCurrentSlug } = useAppStore();
  const t = getTranslations(locale);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch('/api/projects?limit=100');
        if (res.ok) {
          const data = await res.json();
          setProjects(data.data || data.projects || []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredProjects = projects.filter((project) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = getLocalizedValue(project.title, locale).toLowerCase();
    const client = (project.client || '').toLowerCase();
    const location = (project.location || '').toLowerCase();
    return title.includes(q) || client.includes(q) || location.includes(q);
  });

  const handleViewDetail = (project: Project) => {
    setCurrentSlug(project.slug);
    setCurrentPage('project-detail');
  };

  return (
    <>
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">{t.projects.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{t.projects.subtitle}</p>
        </div>
      </section>

      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4">
          {/* Search Bar */}
          <div className="mb-8 p-4 rounded-xl bg-muted/30 border">
            <div className="relative max-w-sm">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.common.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => handleViewDetail(project)}>
                  <div className="relative overflow-hidden rounded-t-xl">
                    {(() => {
                      const coverImg = getEntityCoverImage(project);
                      return coverImg ? (
                        <img src={coverImg} alt={getLocalizedValue(project.title, locale)} className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="h-52 w-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <Briefcase className="h-12 w-12 text-primary/30" />
                        </div>
                      );
                    })()}
                    <Badge className={`absolute top-3 start-3 ${project.status === 'completed' ? 'bg-green-600' : project.status === 'in_progress' ? 'bg-yellow-600' : 'bg-blue-600'} text-white`}>
                      {project.status === 'completed' ? (locale === 'ar' ? 'مكتمل' : locale === 'fr' ? 'Terminé' : 'Completed') : project.status === 'in_progress' ? (locale === 'ar' ? 'قيد التنفيذ' : locale === 'fr' ? 'En Cours' : 'In Progress') : (locale === 'ar' ? 'تخطيط' : locale === 'fr' ? 'Planifié' : 'Planning')}
                    </Badge>
                  </div>
                  <CardContent className="pt-4 px-5">
                    <h3 className="font-semibold text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
                      {getLocalizedValue(project.title, locale)}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                      {project.client && (
                        <span>{project.client}</span>
                      )}
                      {project.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {getLocalizedValue(project.location, locale)}
                        </span>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {truncateText(getLocalizedValue(project.description, locale), 100)}
                      </p>
                    )}
                    <Button size="sm" variant="outline" className="cursor-pointer">
                      {locale === 'ar' ? 'عرض التفاصيل' : locale === 'fr' ? 'Voir Détails' : 'View Details'}
                      <ArrowRight className="ml-1 h-3 w-3 rtl:rotate-180 rtl:ml-0 rtl:mr-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">{locale === 'ar' ? 'لا توجد مشاريع حالياً' : locale === 'fr' ? 'Aucun projet disponible' : 'No projects available'}</p>
              <p className="text-sm mt-1">{locale === 'ar' ? 'ترقبوا المزيد قريباً' : locale === 'fr' ? 'Revenez bientôt' : 'Check back soon'}</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
