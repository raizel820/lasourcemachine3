'use client';

import { useState, useEffect, useRef } from 'react';
import { Wrench, Ship, Settings, GraduationCap, ClipboardList, ArrowRight, Factory, Users, Globe, Clock, ChevronLeft, ChevronRight, HeadphonesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { RequestQuoteModal } from '@/components/shared/RequestQuoteModal';
import { ServiceRequestModal } from '@/components/shared/ServiceRequestModal';
import { useAppStore } from '@/lib/store';
import { getTranslations } from '@/lib/i18n';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { getLocalizedValue, getLocalizedArray, formatDate, truncateText, getEntityCoverImage } from '@/lib/helpers';
import { formatPrice, convertPrice } from '@/lib/currency';
import type { Machine, Category, Service, NewsPost, Partner } from '@/lib/types';

type AnyRecord = any;

// Service icons mapping
const SERVICE_ICONS: Record<string, React.ElementType> = {
  'wrench': Wrench,
  'ship': Ship,
  'settings': Settings,
  'graduation': GraduationCap,
  'clipboard': ClipboardList,
};

const DEFAULT_SERVICE_ICONS = [Wrench, Ship, Settings, GraduationCap, ClipboardList];

function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          tick();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

function StatCounter({ value, suffix, label, locale }: { value: number; suffix: string; label: string; locale: string }) {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl lg:text-5xl font-bold text-white">
        {count}
        {suffix && <span className="text-primary text-3xl lg:text-4xl">+</span>}
      </div>
      <p className="mt-2 text-sm text-blue-200">{label}</p>
    </div>
  );
}

export function HomePage() {
  const { locale, currency, setCurrentPage, setCurrentSlug } = useAppStore();
  const t = getTranslations(locale);
  const site = useSiteSettings();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteMachine, setQuoteMachine] = useState<{ name: string; id: string } | null>(null);
  const [serviceRequestOpen, setServiceRequestOpen] = useState(false);

  // Data states
  const [machines, setMachines] = useState<AnyRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<AnyRecord[]>([]);
  const [partners, setPartners] = useState<AnyRecord[]>([]);
  const [news, setNews] = useState<AnyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const endpoints = [
          { url: '/api/machines?limit=6&featured=true', setter: (d: any) => setMachines(d.data || d.machines || []) },
          { url: '/api/categories', setter: (d: any) => setCategories(d.data || d.categories || []) },
          { url: '/api/services?limit=5', setter: (d: any) => setServices(d.data || d.services || []) },
          { url: '/api/partners', setter: (d: any) => setPartners(d.data || d.partners || []) },
          { url: '/api/news?limit=3&status=published', setter: (d: any) => setNews(d.data || d.news || []) },
        ];
        await Promise.all(
          endpoints.map(async (ep) => {
            try {
              const res = await fetch(ep.url);
              if (res.ok) {
                const data = await res.json();
                ep.setter(data);
              }
            } catch { /* API not ready yet - use empty data */ }
          })
        );
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getMachineName = (m: AnyRecord) => getLocalizedValue(m.name, locale);
  const getMachinePrice = (m: AnyRecord) => (m.basePrice || m.price || 0);
  const getMachineCurrency = (m: AnyRecord) => (m.currency || 'DZD');
  const isMachineFeatured = (m: AnyRecord) => (m.featured || m.isFeatured || false);
  const getMachineShortDesc = (m: AnyRecord) => (m.shortDesc || m.shortDescription || '');
  const getMachineStatus = (m: AnyRecord) => (m.status || 'available');

  const handleRequestQuote = (machine: AnyRecord) => {
    setQuoteMachine({
      name: getMachineName(machine),
      id: machine.id,
    });
    setQuoteOpen(true);
  };

  const handleViewMachine = (machine: AnyRecord) => {
    setCurrentSlug(machine.slug);
    setCurrentPage('machine-detail');
  };

  const categoryName = (cat: Category | undefined) =>
    cat ? getLocalizedValue(cat.name, locale) : '';

  const stats = [
    { value: site.stats.years, label: t.stats.yearsExperience },
    { value: site.stats.machines, label: t.stats.machinesSold },
    { value: site.stats.clients, label: t.stats.clients },
    { value: site.stats.countries, label: t.stats.countries },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="container mx-auto px-4 text-center relative">
          <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/30 text-primary bg-primary/5">
            {locale === 'ar' ? '📍 الجزائر' : locale === 'fr' ? '📍 Algérie' : '📍 Algeria'}
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl max-w-4xl mx-auto">
            {site.companyName(locale as any)}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {site.description(locale as any)}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              onClick={() => setCurrentPage('machines')}
              className="cursor-pointer"
            >
              {t.hero.cta}
              <ArrowRight className="ml-2 h-4 w-4 rtl:rotate-180 rtl:ml-0 rtl:mr-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setQuoteOpen(true)}
              className="cursor-pointer"
            >
              {t.machines.requestQuote}
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
            {stats.map((stat, i) => (
              <StatCounter key={`${i}-${stat.value}`} {...stat} locale={locale} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Machines Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <SectionHeader
            title={t.machines.title}
            subtitle={t.machines.subtitle}
          />
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          ) : machines.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {machines.slice(0, 6).map((machine) => (
                <Card key={machine.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => handleViewMachine(machine)}>
                  <div className="relative overflow-hidden rounded-t-xl">
                    {(() => {
                      const coverImg = getEntityCoverImage(machine);
                      return coverImg ? (
                        <img src={coverImg} alt={getLocalizedValue(machine.name, locale)} className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="h-52 w-full bg-muted flex items-center justify-center"><Factory className="h-12 w-12 text-muted-foreground" /></div>
                      );
                    })()}
                    {isMachineFeatured(machine) && (
                      <Badge className="absolute top-3 start-3 bg-primary text-primary-foreground">
                        {t.common.featured}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="pt-4 px-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {categoryName(machine.category)}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg leading-tight mb-1 group-hover:text-primary transition-colors">
                      {getLocalizedValue(machine.name, locale)}
                    </h3>
                    {getMachineShortDesc(machine) && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {truncateText(getLocalizedValue(getMachineShortDesc(machine), locale), 80)}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(
                          convertPrice(getMachinePrice(machine), getMachineCurrency(machine), currency),
                          currency,
                          locale
                        )}
                      </span>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRequestQuote(machine);
                        }}
                        className="cursor-pointer"
                      >
                        {t.machines.requestQuote}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Factory className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>{locale === 'ar' ? 'لا توجد آلات حالياً' : locale === 'fr' ? 'Aucune machine disponible' : 'No machines available'}</p>
            </div>
          )}
          <div className="mt-10 text-center">
            <Button variant="outline" size="lg" onClick={() => setCurrentPage('machines')} className="cursor-pointer">
              {t.machines.viewAll}
              <ArrowRight className="ml-2 h-4 w-4 rtl:rotate-180 rtl:ml-0 rtl:mr-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <SectionHeader
            title={t.services.title}
            subtitle={t.services.subtitle}
          />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))
            ) : services.length > 0 ? (
              services.slice(0, 5).map((service, i) => {
                const IconComponent = DEFAULT_SERVICE_ICONS[i % DEFAULT_SERVICE_ICONS.length];
                return (
                  <Card key={service.id} className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="pt-8 px-5 flex flex-col items-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                        <IconComponent className="h-7 w-7" />
                      </div>
                      <h3 className="font-semibold text-base mb-2">
                        {getLocalizedValue(service.title || service.name, locale)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {truncateText(getLocalizedValue(service.shortDescription || service.shortDesc || service.description, locale), 100)}
                      </p>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground col-span-full">
                <Wrench className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>{locale === 'ar' ? 'لا توجد خدمات حالياً' : locale === 'fr' ? 'Aucun service disponible' : 'No services available'}</p>
              </div>
            )}
          </div>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="outline" size="lg" onClick={() => setCurrentPage('services')} className="cursor-pointer">
              {t.services.title}
              <ArrowRight className="ml-2 h-4 w-4 rtl:rotate-180 rtl:ml-0 rtl:mr-2" />
            </Button>
            <Button size="lg" onClick={() => setServiceRequestOpen(true)} className="cursor-pointer">
              <HeadphonesIcon className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
              {t.services.requestService}
            </Button>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <SectionHeader
            title={locale === 'ar' ? 'شركاؤنا' : locale === 'fr' ? 'Nos Partenaires' : 'Our Partners'}
            subtitle={locale === 'ar' ? 'نحن نعمل مع أفضل العلامات التجارية العالمية' : locale === 'fr' ? 'Nous travaillons avec les meilleures marques mondiales' : 'We work with the best global brands'}
          />
          <div className="relative overflow-hidden">
            <div className="flex gap-8 animate-scroll">
              {partners.length > 0 ? (
                partners.map((partner) => (
                  <div key={partner.id} className="flex-shrink-0 flex items-center justify-center h-20 w-40 rounded-xl border bg-card p-4 hover:shadow-md transition-shadow">
                    {partner.logo ? (
                      <img src={partner.logo} alt={partner.name} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">{partner.name}</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-muted-foreground text-sm">{locale === 'ar' ? 'لا يوجد شركاء حالياً' : locale === 'fr' ? 'Aucun partenaire' : 'No partners yet'}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 py-16 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">{t.cta.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">{t.cta.subtitle}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={() => setQuoteOpen(true)} className="cursor-pointer">
              {t.cta.button}
            </Button>
            <Button size="lg" variant="outline" onClick={() => setCurrentPage('contact')} className="cursor-pointer border-white text-white hover:bg-white/10">
              {t.contact.submit}
            </Button>
          </div>
        </div>
      </section>

      {/* Latest News Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <SectionHeader
            title={t.news.title}
            subtitle={t.news.subtitle}
          />
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          ) : news.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {news.slice(0, 3).map((post) => (
                <Card key={post.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => { setCurrentSlug(post.slug); setCurrentPage('news-detail'); }}>
                  <div className="relative overflow-hidden rounded-t-xl">
                    {post.coverImage ? (
                      <img src={post.coverImage} alt={getLocalizedValue(post.title, locale)} className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="h-48 w-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <ClipboardList className="h-10 w-10 text-primary/30" />
                      </div>
                    )}
                  </div>
                  <CardContent className="pt-4 px-5">
                    {post.publishedAt && (
                      <p className="text-xs text-muted-foreground mb-2">{formatDate(post.publishedAt, locale)}</p>
                    )}
                    <h3 className="font-semibold text-base leading-tight mb-2 group-hover:text-primary transition-colors">
                      {getLocalizedValue(post.title, locale)}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground">
                        {truncateText(getLocalizedValue(post.excerpt, locale), 120)}
                      </p>
                    )}
                    <div className="mt-3">
                      <span className="text-sm font-medium text-primary group-hover:underline">
                        {t.news.readMore} →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>{locale === 'ar' ? 'لا توجد أخبار حالياً' : locale === 'fr' ? 'Aucune actualité' : 'No news available'}</p>
            </div>
          )}
          <div className="mt-10 text-center">
            <Button variant="outline" size="lg" onClick={() => setCurrentPage('news')} className="cursor-pointer">
              {locale === 'ar' ? 'جميع الأخبار' : locale === 'fr' ? 'Toutes les Actualités' : 'All News'}
              <ArrowRight className="ml-2 h-4 w-4 rtl:rotate-180 rtl:ml-0 rtl:mr-2" />
            </Button>
          </div>
        </div>
      </section>

      <RequestQuoteModal
        isOpen={quoteOpen}
        onClose={() => { setQuoteOpen(false); setQuoteMachine(null); }}
        machineName={quoteMachine?.name}
        machineId={quoteMachine?.id}
      />

      <ServiceRequestModal
        isOpen={serviceRequestOpen}
        onClose={() => setServiceRequestOpen(false)}
      />
    </>
  );
}
