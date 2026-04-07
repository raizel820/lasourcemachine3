'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Factory } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { RequestQuoteModal } from '@/components/shared/RequestQuoteModal';
import { useAppStore } from '@/lib/store';
import { getTranslations } from '@/lib/i18n';
import { getLocalizedValue, getEntityCoverImage, getEntityGallery } from '@/lib/helpers';
import type { ProductionLine } from '@/lib/types';

export function ProductionLineDetailPage() {
  const { locale, isRTL, currentSlug, setCurrentPage, setCurrentSlug } = useAppStore();
  const t = getTranslations(locale);
  const [line, setLine] = useState<ProductionLine | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteOpen, setQuoteOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/production-lines?slug=${currentSlug}`);
        if (res.ok) {
          const data = await res.json();
          const arr = Array.isArray(data.data) ? data.data : (data.productionLines || []);
          const l = arr.length > 0 ? arr[0] : null;
          setLine(l);
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <Skeleton className="h-96 rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!line) {
    return (
      <div className="py-20 text-center">
        <Factory className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
        <p className="text-lg text-muted-foreground">{t.common.noData}</p>
        <Button variant="outline" className="mt-4 cursor-pointer" onClick={() => setCurrentPage('production-lines')}>
          {isRTL ? <ArrowRight className="mr-2 h-4 w-4" /> : <ArrowLeft className="mr-2 h-4 w-4" />}
          {t.common.back}
        </Button>
      </div>
    );
  }

  const images: string[] = getEntityGallery(line);
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <>
      <div className="py-8">
        <div className="container mx-auto px-4">
          <Button variant="ghost" onClick={() => setCurrentPage('production-lines')} className="mb-6 cursor-pointer">
            <BackArrow className="mr-2 h-4 w-4" />
            {t.common.back}
          </Button>

          {/* Cover */}
          <div className="rounded-xl overflow-hidden bg-muted mb-8">
            {(() => {
              const coverImg = getEntityCoverImage(line);
              return coverImg ? (
                <img src={coverImg} alt={getLocalizedValue(line.name, locale)} className="w-full h-64 sm:h-96 object-cover" />
              ) : (
                <div className="w-full h-64 sm:h-96 flex items-center justify-center">
                  <Factory className="h-20 w-20 text-muted-foreground/30" />
                </div>
              );
            })()}
          </div>

          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight mb-4">
              {getLocalizedValue(line.name, locale)}
            </h1>
            <Badge variant="outline" className="mb-6">{line.status}</Badge>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line mb-8">
              {getLocalizedValue(line.description, locale)}
            </p>

            {/* Included Machines */}
            {line.machines && line.machines.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">
                  {locale === 'ar' ? 'الآلات المشمولة' : locale === 'fr' ? 'Machines Incluses' : 'Included Machines'}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {line.machines.map((mpl) => {
                    const m = mpl.machine;
                    return (
                      <Card key={m.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setCurrentSlug(m.slug); setCurrentPage('machine-detail'); }}>
                        <div className="h-32 bg-muted">
                          {(() => {
                            const mImg = getEntityCoverImage(m);
                            return mImg ? <img src={mImg} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center"><Factory className="h-8 w-8 text-muted-foreground/30" /></div>;
                          })()}
                        </div>
                        <CardContent className="pt-3 px-4">
                          <h3 className="font-semibold text-sm">{getLocalizedValue(m.name, locale)}</h3>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            <Separator className="my-8" />

            <div className="text-center">
              <Button size="lg" className="cursor-pointer" onClick={() => setQuoteOpen(true)}>
                {t.machines.requestQuote}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <RequestQuoteModal
        isOpen={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        machineName={getLocalizedValue(line.name, locale)}
      />
    </>
  );
}
