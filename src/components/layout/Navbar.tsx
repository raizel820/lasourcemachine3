'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Menu, X, ChevronDown, Phone, Mail, Factory } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { CurrencySwitcher } from '@/components/shared/CurrencySwitcher';
import { useAppStore } from '@/lib/store';
import { getTranslations } from '@/lib/i18n';
import { COMPANY } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/types';
import { useSiteSettings } from '@/hooks/use-site-settings';

/** Map nav keys to page identifiers used in the store */
const NAV_LINKS = [
  { key: 'home', page: 'home' },
  { key: 'machines', page: 'machines' },
  { key: 'productionLines', page: 'production-lines' },
  { key: 'services', page: 'services' },
  { key: 'projects', page: 'projects' },
  { key: 'news', page: 'news' },
  { key: 'faq', page: 'faq' },
  { key: 'about', page: 'about' },
  { key: 'contact', page: 'contact' },
] as const;

/** Links shown in the "More" dropdown on desktop (overflow nav) */
const MORE_LINK_KEYS = ['faq', 'about', 'contact'] as const;

export function Navbar() {
  const { locale, isRTL, currentPage, setCurrentPage } = useAppStore();
  const t = getTranslations(locale);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const primaryLinks = useMemo(
    () => NAV_LINKS.filter((l) => !(MORE_LINK_KEYS as readonly string[]).includes(l.key)),
    []
  );
  const moreLinks = useMemo(
    () => NAV_LINKS.filter((l) => (MORE_LINK_KEYS as readonly string[]).includes(l.key)),
    []
  );

  const isActiveLink = (page: string) => currentPage === page;

  const handleNavigate = useCallback((page: string) => {
    setCurrentPage(page);
    setMobileOpen(false);
  }, [setCurrentPage]);

  const site = useSiteSettings();
  const companyName = site.companyName(locale);

  return (
    <>
      {/* Top bar - contact info */}
      <div className="hidden lg:block border-b bg-muted/50 text-xs text-muted-foreground">
        <div className="container mx-auto flex items-center justify-between px-4 h-9">
          <div className="flex items-center gap-4">
            <a
              href={`tel:${site.phone}`}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <Phone className="h-3 w-3" />
              <span>{site.phone}</span>
            </a>
            <a
              href={`mailto:${site.email}`}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <Mail className="h-3 w-3" />
              <span>{site.email}</span>
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span>{site.workingHours(locale)}</span>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <header
        className={cn(
          'sticky top-0 z-40 w-full transition-all duration-300',
          scrolled
            ? 'bg-background/95 backdrop-blur-md shadow-sm border-b'
            : 'bg-background border-b'
        )}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <button
            onClick={() => handleNavigate('home')}
            className="flex items-center gap-2 shrink-0 cursor-pointer"
          >
            {site.companyLogo && !site.companyLogo.includes('placeholder') ? (
              <img
                src={site.companyLogo}
                alt={companyName}
                className="h-10 w-10 rounded-full object-contain bg-primary p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground', site.companyLogo && !site.companyLogo.includes('placeholder') && 'hidden')}>
              <Factory className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold leading-tight tracking-tight">
                {companyName}
              </span>
              <p className="text-[10px] text-muted-foreground leading-none hidden md:block">
                {COMPANY.tagline[locale]}
              </p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1" dir={isRTL ? 'rtl' : 'ltr'}>
            {primaryLinks.map((link) => {
              const active = isActiveLink(link.page);
              return (
                <button
                  key={link.key}
                  onClick={() => handleNavigate(link.page)}
                  className={cn(
                    'relative px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer',
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  {t.nav[link.key as keyof typeof t.nav]}
                  {active && (
                    <span className="absolute bottom-0 inset-x-3 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              );
            })}

            {/* More dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer',
                    moreLinks.some((l) => isActiveLink(l.page))
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <span>
                    {locale === 'ar' ? 'المزيد' : locale === 'fr' ? 'Plus' : 'More'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {moreLinks.map((link) => {
                  const active = isActiveLink(link.page);
                  return (
                    <DropdownMenuItem
                      key={link.key}
                      onClick={() => handleNavigate(link.page)}
                      className={cn('cursor-pointer', active && 'bg-accent')}
                    >
                      {t.nav[link.key as keyof typeof t.nav]}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <CurrencySwitcher />
            <ThemeToggle />

            {/* CTA Button - desktop */}
            <Button
              size="sm"
              className="hidden lg:inline-flex ml-2 cursor-pointer"
              onClick={() => handleNavigate('contact')}
            >
              {t.machines.requestQuote}
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 cursor-pointer"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Sheet Menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side={isRTL ? 'right' : 'left'}
          className="w-[300px] sm:w-[360px] overflow-y-auto"
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              {site.companyLogo && !site.companyLogo.includes('placeholder') ? (
                <img
                  src={site.companyLogo}
                  alt={companyName}
                  className="h-9 w-9 rounded-full object-contain p-0.5"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground', site.companyLogo && !site.companyLogo.includes('placeholder') && 'hidden')}>
                <Factory className="h-4 w-4" />
              </div>
              <span>{companyName}</span>
            </SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col gap-1" dir={isRTL ? 'rtl' : 'ltr'}>
            {NAV_LINKS.map((link) => {
              const active = isActiveLink(link.page);
              return (
                <SheetClose asChild key={link.key}>
                  <button
                    onClick={() => handleNavigate(link.page)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors w-full text-left cursor-pointer',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    {t.nav[link.key as keyof typeof t.nav]}
                    {active && <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">{locale === 'ar' ? 'الحالي' : 'Active'}</Badge>}
                  </button>
                </SheetClose>
              );
            })}
          </nav>

          <div className="mt-8 pt-6 border-t">
            <SheetClose asChild>
              <Button className="w-full cursor-pointer" onClick={() => handleNavigate('contact')}>
                {t.machines.requestQuote}
              </Button>
            </SheetClose>
          </div>

          {/* Contact info in mobile */}
          <div className="mt-6 space-y-3 text-sm text-muted-foreground">
            <a
              href={`tel:${site.phone}`}
              className="flex items-center gap-2 hover:text-foreground transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span>{site.phone}</span>
            </a>
            <a
              href={`mailto:${site.email}`}
              className="flex items-center gap-2 hover:text-foreground transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span>{site.email}</span>
            </a>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
