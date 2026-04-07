'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Briefcase, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import { getTranslations } from '@/lib/i18n';
import { getLocalizedValue, formatDate, getEntityCoverImage, getEntityGallery } from '@/lib/helpers';
import type { Project } from '@/lib/types';

export function ProjectDetailPage() {
  const { locale, isRTL, currentSlug, setCurrentPage, setCurrentSlug } = useAppStore();
  const t = getTranslations(locale);
  const [project, setProject] = useState<Project | null>(null);
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects?slug=${currentSlug}`);
        if (res.ok) {
          const data = await res.json();
          const p = data.data || data.projects?.[0] || null;
          setProject(p);
        }
        const allRes = await fetch('/api/projects?limit=100');
        if (allRes.ok) {
          const allData = await allRes.json();
          const all = allData.data || allData.projects || [];
          if (!project) setProject(all.find((p: Project) => p.slug === currentSlug) || null);
          setRelatedProjects(all.filter((p: Project) => p.slug !== currentSlug).slice(0, 3));
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentSlug]);

  if (loading) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-40 mb-8" />
          <Skeleton className="h-96 rounded-xl mb-8" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-20 text-center">
        <Briefcase className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
        <p className="text-lg text-muted-foreground">{t.common.noData}</p>
        <Button variant="outline" className="mt-4 cursor-pointer" onClick={() => setCurrentPage('projects')}>
          {isRTL ? <ArrowRight className="mr-2 h-4 w-4" /> : <ArrowLeft className="mr-2 h-4 w-4" />}
          {t.common.back}
        </Button>
      </div>
    );
  }

  const images: string[] = getEntityGallery(project);
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <Button variant="ghost" onClick={() => setCurrentPage('projects')} className="mb-6 cursor-pointer">
          <BackArrow className="mr-2 h-4 w-4" />
          {t.common.back}
        </Button>

        {/* Cover Image */}
        <div className="rounded-xl overflow-hidden bg-muted mb-8">
          {(() => {
            const coverImg = getEntityCoverImage(project);
            return coverImg ? (
              <img src={coverImg} alt={getLocalizedValue(project.title, locale)} className="w-full h-64 sm:h-96 object-cover" />
            ) : (
              <div className="w-full h-64 sm:h-96 flex items-center justify-center">
                <Briefcase className="h-20 w-20 text-muted-foreground/30" />
              </div>
            );
          })()}
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge className={project.status === 'completed' ? 'bg-green-600' : project.status === 'in_progress' ? 'bg-yellow-600' : 'bg-blue-600'}>
              {project.status}
            </Badge>
            {project.clientName && <Badge variant="outline">{project.clientName}</Badge>}
            {project.location && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {getLocalizedValue(project.location, locale)}
              </span>
            )}
            {(project.startDate || project.completionDate) && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {project.completionDate ? formatDate(project.completionDate, locale) : project.startDate ? formatDate(project.startDate, locale) : ''}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-6">
            {getLocalizedValue(project.title, locale)}
          </h1>

          <div className="prose max-w-none text-muted-foreground leading-relaxed whitespace-pre-line mb-8">
            {getLocalizedValue(project.description, locale)}
          </div>

          {/* Image Gallery */}
          {images.length > 1 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">
                {locale === 'ar' ? 'معرض الصور' : locale === 'fr' ? 'Galerie de Photos' : 'Photo Gallery'}
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {images.map((img, i) => (
                  <div key={i} className="rounded-lg overflow-hidden">
                    <img src={img} alt="" className="w-full h-40 object-cover hover:scale-105 transition-transform" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Projects */}
          {relatedProjects.length > 0 && (
            <div className="mt-12">
              <Separator className="mb-8" />
              <h2 className="text-2xl font-bold mb-6">
                {locale === 'ar' ? 'مشاريع ذات صلة' : locale === 'fr' ? 'Projets Associés' : 'Related Projects'}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {relatedProjects.map((p) => (
                  <Card key={p.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setCurrentSlug(p.slug); window.scrollTo(0, 0); }}>
                    <div className="h-32 bg-muted">
                      {(() => {
                        const pImg = getEntityCoverImage(p);
                        return pImg ? <img src={pImg} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center"><Briefcase className="h-8 w-8 text-muted-foreground/30" /></div>;
                      })()}
                    </div>
                    <CardContent className="pt-3 px-4">
                      <h3 className="font-semibold text-sm">{getLocalizedValue(p.title, locale)}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
