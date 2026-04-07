'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, Factory, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { RequestQuoteModal } from '@/components/shared/RequestQuoteModal';
import { useAppStore } from '@/lib/store';
import { getTranslations } from '@/lib/i18n';
import { getLocalizedValue, truncateText, getEntityCoverImage } from '@/lib/helpers';
import { formatPrice, convertPrice } from '@/lib/currency';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
type AnyRecord = any;

export function MachinesPage() {
  const { locale, currency, setCurrentPage, setCurrentSlug, currentPageNumber, setCurrentPageNumber, currentCategoryFilter, setCurrentCategoryFilter } = useAppStore();
  const t = getTranslations(locale);
  const [machines, setMachines] = useState<AnyRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteMachine, setQuoteMachine] = useState<{ name: string; id: string } | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [machinesRes, catsRes] = await Promise.all([
          fetch(`/api/machines?limit=100`).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/categories').then(r => r.ok ? r.json() : null).catch(() => null),
        ]);
        if (machinesRes) {
          const data = machinesRes.data || machinesRes.machines || [];
          setMachines(data);
          setTotalPages(Math.ceil(data.length / DEFAULT_PAGE_SIZE));
        }
        if (catsRes) {
          setCategories(catsRes.data || catsRes.categories || []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredMachines = useMemo(() => {
    let result = machines;
    if (currentCategoryFilter) {
      result = result.filter((m: AnyRecord) => m.categoryId === currentCategoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((m: AnyRecord) =>
        getLocalizedValue(m.name, locale).toLowerCase().includes(q) ||
        getLocalizedValue(m.description, locale).toLowerCase().includes(q) ||
        ((m.shortDescription || m.shortDesc) && getLocalizedValue(m.shortDescription || m.shortDesc, locale).toLowerCase().includes(q))
      );
    }
    return result;
  }, [machines, searchQuery, locale, currentCategoryFilter]);

  const paginatedMachines = useMemo(() => {
    const start = (currentPageNumber - 1) * DEFAULT_PAGE_SIZE;
    return filteredMachines.slice(start, start + DEFAULT_PAGE_SIZE);
  }, [filteredMachines, currentPageNumber]);

  const handleRequestQuote = (machine: AnyRecord) => {
    setQuoteMachine({
      name: getLocalizedValue(machine.name, locale),
      id: machine.id,
    });
    setQuoteOpen(true);
  };

  const handleViewMachine = (machine: AnyRecord) => {
    setCurrentSlug(machine.slug);
    setCurrentPage('machine-detail');
  };

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? getLocalizedValue(cat.name, locale) : '';
  };

  return (
    <>
      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">{t.machines.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{t.machines.subtitle}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Filter Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-8 p-4 rounded-xl bg-muted/30 border">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.common.search}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPageNumber(1); }}
                className="ps-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge
                variant={!currentCategoryFilter ? 'default' : 'outline'}
                className="cursor-pointer px-3 py-1.5"
                onClick={() => setCurrentCategoryFilter('')}
              >
                {t.common.all}
              </Badge>
              {categories.map(cat => (
                <Badge
                  key={cat.id}
                  variant={currentCategoryFilter === cat.id ? 'default' : 'outline'}
                  className="cursor-pointer px-3 py-1.5"
                  onClick={() => setCurrentCategoryFilter(cat.id)}
                >
                  {getLocalizedValue(cat.name, locale)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground mb-6">
            {filteredMachines.length} {locale === 'ar' ? 'آلة' : locale === 'fr' ? 'machines' : 'machines'}
          </p>

          {/* Machine Grid */}
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          ) : paginatedMachines.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedMachines.map((machine) => (
                <Card key={machine.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => handleViewMachine(machine)}>
                  <div className="relative overflow-hidden rounded-t-xl">
                    {(() => {
                      const coverImg = getEntityCoverImage(machine);
                      return coverImg ? (
                        <img src={coverImg} alt={getLocalizedValue(machine.name, locale)} className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="h-48 w-full bg-muted flex items-center justify-center"><Factory className="h-12 w-12 text-muted-foreground" /></div>
                      );
                    })()}
                    {(machine.featured || machine.isFeatured) && (
                      <Badge className="absolute top-3 start-3 bg-primary text-primary-foreground">
                        {t.common.featured}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="pt-4 px-5">
                    <Badge variant="secondary" className="text-xs mb-2">
                      {getCategoryName(machine.categoryId)}
                    </Badge>
                    <h3 className="font-semibold text-base leading-tight mb-1 group-hover:text-primary transition-colors">
                      {getLocalizedValue(machine.name, locale)}
                    </h3>
                    {(machine.shortDescription || machine.shortDesc) && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {truncateText(getLocalizedValue(machine.shortDescription || machine.shortDesc, locale), 80)}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(convertPrice(machine.basePrice || machine.price || 0, machine.currency || 'DZD', currency), currency, locale)}
                      </span>
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleRequestQuote(machine); }}
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
            <div className="text-center py-20">
              <Factory className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-lg text-muted-foreground">{t.common.noData}</p>
            </div>
          )}

          {/* Pagination */}
          {filteredMachines.length > DEFAULT_PAGE_SIZE && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPageNumber <= 1}
                onClick={() => setCurrentPageNumber(currentPageNumber - 1)}
                className="cursor-pointer"
              >
                {t.common.previous}
              </Button>
              {Array.from({ length: Math.ceil(filteredMachines.length / DEFAULT_PAGE_SIZE) }).map((_, i) => (
                <Button
                  key={i}
                  variant={currentPageNumber === i + 1 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPageNumber(i + 1)}
                  className="w-9 cursor-pointer"
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPageNumber >= Math.ceil(filteredMachines.length / DEFAULT_PAGE_SIZE)}
                onClick={() => setCurrentPageNumber(currentPageNumber + 1)}
                className="cursor-pointer"
              >
                {t.common.next}
              </Button>
            </div>
          )}
        </div>
      </section>

      <RequestQuoteModal
        isOpen={quoteOpen}
        onClose={() => { setQuoteOpen(false); setQuoteMachine(null); }}
        machineName={quoteMachine?.name}
        machineId={quoteMachine?.id}
      />
    </>
  );
}
