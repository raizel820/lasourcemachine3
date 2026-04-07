'use client';

import { Phone, Mail, MapPin, Clock, ArrowRight, Factory } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { getTranslations } from '@/lib/i18n';
import { COMPANY } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useSiteSettings } from '@/hooks/use-site-settings';

/** Navigation links for the footer */
const FOOTER_LINKS = [
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

export function Footer() {
  const { locale, isRTL, setCurrentPage } = useAppStore();
  const t = getTranslations(locale);
  const site = useSiteSettings();

  const companyName = site.companyName(locale);
  const currentYear = new Date().getFullYear();

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300">
      {/* Main footer content */}
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Column 1: Company Info */}
          <div className="space-y-4">
            <button
              onClick={() => handleNavigate('home')}
              className="flex items-center gap-2 group cursor-pointer"
            >
              {site.companyLogo && !site.companyLogo.includes('placeholder') ? (
                <img
                  src={site.companyLogo}
                  alt={companyName}
                  className="h-10 w-10 rounded-full object-contain transition-transform group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105 border-0', site.companyLogo && !site.companyLogo.includes('placeholder') && 'hidden')}>
                <Factory className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-white">
                {companyName}
              </span>
            </button>
            <p className="text-sm leading-relaxed text-slate-400">
              {t.footer.description}
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={site.facebook || COMPANY.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-colors hover:bg-primary hover:text-primary-foreground"
                aria-label="Facebook"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href={`https://wa.me/${site.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-colors hover:bg-[#25D366] hover:text-white"
                aria-label="WhatsApp"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
              <a
                href={site.linkedin || COMPANY.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-colors hover:bg-[#0077B5] hover:text-white"
                aria-label="LinkedIn"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              {t.footer.quickLinks}
            </h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.map((link) => (
                <li key={link.key}>
                  <button
                    onClick={() => handleNavigate(link.page)}
                    className="group flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white w-full text-left cursor-pointer"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 rtl:rotate-180 rtl:-translate-x-1 rtl:group-hover:translate-x-0" />
                    <span>
                      {t.nav[link.key as keyof typeof t.nav]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              {t.footer.contactUs}
            </h3>
            <ul className="space-y-4">
              <li>
                <a
                  href={`tel:${site.phone}`}
                  className="flex items-start gap-3 text-sm text-slate-400 transition-colors hover:text-white"
                >
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium text-slate-300">{site.phone}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {locale === 'ar' ? 'هاتف' : locale === 'fr' ? 'Téléphone' : 'Phone'}
                    </p>
                  </div>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="flex items-start gap-3 text-sm text-slate-400 transition-colors hover:text-white"
                >
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium text-slate-300">{site.email}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Email</p>
                  </div>
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-400">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-slate-300">{site.address}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {locale === 'ar' ? 'العنوان' : locale === 'fr' ? 'Adresse' : 'Address'}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-400">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-slate-300">{site.workingHours(locale)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {locale === 'ar' ? 'ساعات العمل' : locale === 'fr' ? 'Heures de travail' : 'Working Hours'}
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 4: About / Working Hours */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              {t.footer.followUs}
            </h3>
            <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-4 space-y-3">
              <p className="text-sm text-slate-400 leading-relaxed">
                {site.description(locale)}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-slate-300">{site.workingHours(locale)}</span>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => handleNavigate('contact')}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
                >
                  {t.contact.submit}
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-4 sm:flex-row">
          <p className="text-xs text-slate-500">
            &copy; {currentYear} {companyName}. {t.footer.rights}
          </p>
          <div className="flex items-center gap-4">
            <p className="text-xs text-slate-600">
              {locale === 'ar'
                ? 'صُمم بـ ❤️ في الجزائر'
                : locale === 'fr'
                  ? 'Conçu avec ❤️ en Algérie'
                  : 'Made with ❤️ in Algeria'}
            </p>
            <a
              href="/eurl/lasource"
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Admin
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
