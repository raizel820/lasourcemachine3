'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Factory, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import { getTranslations } from '@/lib/i18n';
import { getLocalizedValue, truncateText, getEntityCoverImage } from '@/lib/helpers';
import type { ProductionLine } from '@/lib/types';

export function ProductionLinesPage() {
  const { locale, isRTL, setCurrentPage, setCurrentSlug } = useAppStore();
  const t = getTranslations(locale);
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch('/api/production-lines?limit=100');
        if (res.ok) {
          const data = await res.json();
          setLines(data.data || data.productionLines || []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleViewDetail = (line: ProductionLine) => {
    setCurrentSlug(line.slug);
    setCurrentPage('production-line-detail');
  };

  const getMachineCount = (line: ProductionLine) => {
    try { return JSON.parse(line.machines).length; } catch { return 0; }
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">{t.nav.productionLines}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {locale === 'ar'
              ? 'خطوط إنتاج متكاملة وجاهزة للعمل لمختلف القطاعات الصناعية'
              : locale === 'fr'
                ? 'Lignes de production complètes et prêtes à l\'emploi pour divers secteurs industriels'
                : 'Complete turnkey production lines for various industrial sectors'}
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          ) : lines.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {lines.map((line) => (
                <Card key={line.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => handleViewDetail(line)}>
                  <div className="relative overflow-hidden rounded-t-xl">
                    {(() => {
                      const coverImg = getEntityCoverImage(line);
                      return coverImg ? (
                        <img src={coverImg} alt={getLocalizedValue(line.name, locale)} className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="h-52 w-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <Factory className="h-12 w-12 text-primary/30" />
                        </div>
                      );
                    })()}
                    {line.isFeatured && (
                      <Badge className="absolute top-3 start-3 bg-primary text-primary-foreground">{t.common.featured}</Badge>
                    )}
                  </div>
                  <CardContent className="pt-4 px-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {getMachineCount(line)} {locale === 'ar' ? 'آلات' : locale === 'fr' ? 'machines' : 'machines'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {line.status}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
                      {getLocalizedValue(line.name, locale)}
                    </h3>
                    {line.shortDescription && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {truncateText(getLocalizedValue(line.shortDescription, locale), 100)}
                      </p>
                    )}
                    <Button size="sm" variant="outline" className="cursor-pointer">
                      <Eye className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2 rtl:rotate-180" />
                      {locale === 'ar' ? 'عرض التفاصيل' : locale === 'fr' ? 'Voir Détails' : 'View Details'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Factory className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">{locale === 'ar' ? 'لا توجد خطوط إنتاج حالياً' : locale === 'fr' ? 'Aucune ligne de production disponible' : 'No production lines available'}</p>
              <p className="text-sm mt-1">{locale === 'ar' ? 'ترقبوا المزيد قريباً' : locale === 'fr' ? 'Revenez bientôt' : 'Check back soon'}</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
