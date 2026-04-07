'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Factory, Check, ExternalLink, FileDown, Settings2, Gauge, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { RequestQuoteModal } from '@/components/shared/RequestQuoteModal';
import { useAppStore } from '@/lib/store';
import { getTranslations } from '@/lib/i18n';
import { getLocalizedValue, getLocalizedArray, getEntityGallery } from '@/lib/helpers';
import { formatPrice, convertPrice } from '@/lib/currency';
type AnyRecord = any;

import type { Machine } from '@/lib/types';

export function MachineDetailPage() {
  const { locale, currency, isRTL, currentSlug, setCurrentPage } = useAppStore();
  const t = getTranslations(locale);
  const [machine, setMachine] = useState<AnyRecord>(null);
  const [relatedMachines, setRelatedMachines] = useState<AnyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quoteOpen, setQuoteOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setSelectedImage(0);
      try {
        const res = await fetch(`/api/machines?slug=${currentSlug}`);
        if (res.ok) {
          const data = await res.json();
          const m = data.data || data.machines?.[0] || null;
          setMachine(m);
        }
        const allRes = await fetch('/api/machines?limit=100');
        if (allRes.ok) {
          const allData = await allRes.json();
          const all = allData.data || allData.machines || [];
          const current = all.find((m: AnyRecord) => m.slug === currentSlug);
          if (current) {
            setRelatedMachines(
              all.filter((m: AnyRecord) => m.categoryId === current.categoryId && m.id !== current.id).slice(0, 4)
            );
            if (!machine) setMachine(current);
          }
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
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-60 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="py-20 text-center">
        <Factory className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
        <p className="text-lg text-muted-foreground">{t.common.noData}</p>
        <Button variant="outline" className="mt-4 cursor-pointer" onClick={() => setCurrentPage('machines')}>
          {isRTL ? <ArrowRight className="mr-2 h-4 w-4" /> : <ArrowLeft className="mr-2 h-4 w-4" />}
          {t.machines.viewAll}
        </Button>
      </div>
    );
  }

  const images: string[] = getEntityGallery(machine);
  const specs: Array<{ key: string; value: string }> = (() => {
    try {
      const raw = machine.specs || machine.specifications;
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      // Handle nested locale format: {en: [{key, value}], fr: [...], ar: [...]}
      if (parsed[locale] && Array.isArray(parsed[locale])) {
        return parsed[locale].map((s: AnyRecord) => ({ key: s.key, value: s.value }));
      }
      // Handle flat format: [{key, value}]
      if (Array.isArray(parsed)) {
        return parsed.map((s: AnyRecord) => ({ key: s.key, value: s.value }));
      }
      return [];
    } catch { return []; }
  })();
  const features = machine.features ? getLocalizedArray(machine.features, locale) : [];
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  // Build quick info items from machine fields
  const quickInfo: Array<{ icon: React.ReactNode; label: string; value: string }> = [];
  if (machine.machineType) {
    quickInfo.push({
      icon: <Settings2 className="h-4 w-4 text-primary" />,
      label: t.machines.machineType,
      value: machine.machineType,
    });
  }
  if (machine.capacity) {
    quickInfo.push({
      icon: <Gauge className="h-4 w-4 text-primary" />,
      label: t.machines.capacity,
      value: machine.capacity,
    });
  }
  if (machine.category) {
    quickInfo.push({
      icon: <Tag className="h-4 w-4 text-primary" />,
      label: t.machines.category,
      value: getLocalizedValue(machine.category.name, locale),
    });
  }

  return (
    <>
      <div className="py-8">
        <div className="container mx-auto px-4">
          {/* Back button */}
          <Button variant="ghost" onClick={() => setCurrentPage('machines')} className="mb-6 cursor-pointer">
            <BackArrow className="mr-2 h-4 w-4" />
            {t.common.back}
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-xl bg-muted aspect-[4/3]">
                {images.length > 0 && images[selectedImage] ? (
                  <img
                    src={images[selectedImage]}
                    alt={getLocalizedValue(machine.name, locale)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Factory className="h-20 w-20 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors cursor-pointer ${
                        selectedImage === i ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              {/* Category Badge */}
              {machine.category && (
                <Badge variant="secondary" className="mb-3">
                  {getLocalizedValue(machine.category.name, locale)}
                </Badge>
              )}
              <h1 className="text-3xl font-bold tracking-tight mb-3">
                {getLocalizedValue(machine.name, locale)}
              </h1>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(convertPrice(machine.basePrice || machine.price || 0, machine.currency || 'DZD', currency), currency, locale)}
                </span>
                <Badge variant={machine.status === 'available' || machine.status === 'published' ? 'default' : machine.status === 'sold' ? 'destructive' : 'secondary'}>
                  {machine.status}
                </Badge>
              </div>

              {/* Quick Info: Machine Type, Capacity, Category */}
              {quickInfo.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  {quickInfo.map((info, i) => (
                    <Card key={i} className="border-primary/10 bg-primary/5">
                      <CardContent className="flex items-center gap-3 p-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0">
                          {info.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground truncate">{info.label}</p>
                          <p className="text-sm font-semibold truncate">{info.value}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Separator className="my-6" />

              {/* Description */}
              <div>
                <h2 className="font-semibold text-lg mb-3">
                  {locale === 'ar' ? 'الوصف' : locale === 'fr' ? 'Description' : 'Description'}
                </h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {getLocalizedValue(machine.description, locale)}
                </p>
              </div>

              {/* Features */}
              {features.length > 0 && (
                <div className="mt-6">
                  <h2 className="font-semibold text-lg mb-3">
                    {locale === 'ar' ? 'المميزات' : locale === 'fr' ? 'Caractéristiques' : 'Features'}
                  </h2>
                  <ul className="space-y-2">
                    {features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{typeof f === 'string' ? f : String(f)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Specifications */}
              <div className="mt-6">
                <h2 className="font-semibold text-lg mb-3">{t.machines.specs}</h2>
                {specs.length > 0 ? (
                  <Card>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {specs.map((spec, i) => (
                          <div key={i} className="flex justify-between px-4 py-3">
                            <span className="text-sm font-medium">{getLocalizedValue(spec.key, locale)}</span>
                            <span className="text-sm text-muted-foreground">{spec.value}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-sm text-muted-foreground">{t.machines.noSpecs}</p>
                )}
              </div>

              {/* PDF Catalog Download */}
              {machine.pdfUrl && (
                <div className="mt-6">
                  <a
                    href={machine.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors text-sm font-medium cursor-pointer"
                  >
                    <FileDown className="h-5 w-5" />
                    <span>{t.machines.downloadCatalog}</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-50" />
                  </a>
                </div>
              )}

              {/* CTA */}
              <div className="flex gap-4 mt-8">
                <Button size="lg" className="flex-1 cursor-pointer" onClick={() => setQuoteOpen(true)}>
                  {t.machines.requestQuote}
                </Button>
                <Button size="lg" variant="outline" className="cursor-pointer" onClick={() => setCurrentPage('contact')}>
                  {t.contact.submit}
                </Button>
              </div>
            </div>
          </div>

          {/* Related Machines */}
          {relatedMachines.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-6">{t.machines.relatedMachines}</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {relatedMachines.map((rm: AnyRecord) => {
                  const rmPrice = rm.basePrice || rm.price || 0;
                  const rmCurrency = rm.currency || 'DZD';
                  const rmImg = getEntityGallery(rm)[0];
                  return (
                    <Card key={rm.id} className="group overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setCurrentSlug(rm.slug); window.scrollTo(0, 0); }}>
                      <div className="h-40 overflow-hidden bg-muted">
                        {rmImg ? (
                          <img src={rmImg} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center"><Factory className="h-10 w-10 text-muted-foreground/30" /></div>
                        )}
                      </div>
                      <CardContent className="pt-3 px-4">
                        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                          {getLocalizedValue(rm.name, locale)}
                        </h3>
                        <span className="text-sm font-bold text-primary">
                          {formatPrice(convertPrice(rmPrice, rmCurrency, currency), currency, locale)}
                        </span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <RequestQuoteModal
        isOpen={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        machineName={getLocalizedValue(machine.name, locale)}
        machineId={machine.id}
      />
    </>
  );
}
