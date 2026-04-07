'use client';

import { useState, useEffect } from 'react';
import { Wrench, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { useAppStore } from '@/lib/store';
import { getTranslations } from '@/lib/i18n';
import { getLocalizedValue, getLocalizedArray, getEntityCoverImage } from '@/lib/helpers';
import type { Service } from '@/lib/types';

export function ServicesPage() {
  const { locale, setCurrentPage } = useAppStore();
  const t = getTranslations(locale);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch('/api/services?limit=20');
        if (res.ok) {
          const data = await res.json();
          setServices(data.data || data.services || []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">{t.services.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{t.services.subtitle}</p>
        </div>
      </section>

      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">{locale === 'ar' ? 'لا توجد خدمات حالياً' : locale === 'fr' ? 'Aucun service disponible' : 'No services available'}</p>
              <p className="text-sm mt-1">{locale === 'ar' ? 'ترقبوا المزيد قريباً' : locale === 'fr' ? 'Revenez bientôt' : 'Check back soon'}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {services.map((service, i) => {
                const Icon = Wrench;
                const isReversed = i % 2 !== 0;
                const name = getLocalizedValue(service.title || service.name, locale);
                const desc = getLocalizedValue(service.description, locale);
                const features = getLocalizedArray(service.features || '', locale);
                const serviceImg = getEntityCoverImage(service);

                return (
                  <Card key={service.id} className="overflow-hidden">
                    <div className={`grid grid-cols-1 lg:grid-cols-2 ${isReversed ? 'lg:grid-flow-dense' : ''}`}>
                      {/* Icon / Visual */}
                      <div className={`flex items-center justify-center p-8 lg:p-12 ${isReversed ? 'lg:col-start-2' : ''} bg-gradient-to-br from-primary/5 to-primary/10`}>
                        {serviceImg ? (
                          <img src={serviceImg} alt={name} className="w-full h-full object-contain rounded-xl" style={{ maxHeight: '280px' }} />
                        ) : (
                          <div className="text-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
                              <Icon className="h-10 w-10" />
                            </div>
                            <Badge variant="secondary" className="mb-2">
                              {String(i + 1).padStart(2, '0')}
                            </Badge>
                          </div>
                        )}
                      </div>
                      {/* Content */}
                      <div className="p-8 lg:p-12 flex flex-col justify-center">
                        <h3 className="text-2xl font-bold mb-3">{name}</h3>
                        <p className="text-muted-foreground leading-relaxed mb-6">{desc}</p>
                        {features.length > 0 && (
                          <ul className="space-y-2">
                            {features.map((f, fi) => (
                              <li key={fi} className="flex items-center gap-2 text-sm">
                                <Check className="h-4 w-4 text-primary shrink-0" />
                                <span>{typeof f === 'string' ? f : String(f)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 text-center bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-10 lg:p-16">
            <h2 className="text-2xl font-bold text-white mb-3">{t.cta.title}</h2>
            <p className="text-blue-100 mb-6 max-w-xl mx-auto">{t.cta.subtitle}</p>
            <Button size="lg" variant="secondary" onClick={() => setCurrentPage('contact')} className="cursor-pointer">
              {t.cta.button}
              <ArrowRight className="ml-2 h-4 w-4 rtl:rotate-180 rtl:ml-0 rtl:mr-2" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
