'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { COMPANY } from '@/lib/constants';
import { setExchangeRates } from '@/lib/currency';
import type { Locale, Currency } from '@/lib/types';

interface SiteSettings {
  [key: string]: string;
}

// ---- Simple, reliable cache ----
// Module-level cache shared by all hook instances in the same JS context.
let cachedData: SiteSettings | null = null;
let cacheETag = ''; // track fetch freshness
let versionCounter = 0; // bumped on invalidation
const subscribers = new Set<() => void>();

/** Push exchange rates from settings data into the currency module */
function syncRates(data: SiteSettings) {
  const usd = parseFloat(data.exchange_rate_usd);
  const eur = parseFloat(data.exchange_rate_eur);
  if (usd > 0 || eur > 0) {
    setExchangeRates({
      DZD: 1,
      USD: usd > 0 ? usd : 0.0074,
      EUR: eur > 0 ? eur : 0.0068,
    });
  }
}

function notifyAll() {
  versionCounter += 1;
  cachedData = null;
  cacheETag = '';
  subscribers.forEach((cb) => cb());
}

/** Call this after saving settings in the admin panel */
export function invalidateSettingsCache() {
  notifyAll();
}

/** Fetch settings from the API (cache-busted) */
async function fetchFromAPI(): Promise<SiteSettings | null> {
  try {
    const res = await fetch(`/api/settings?_nocache=${Date.now()}`);
    if (res.ok) {
      const json = await res.json();
      return json.data || null;
    }
  } catch { /* silent */ }
  return null;
}

/** Parse a JSON locale field like '{"en":"...","fr":"...","ar":"..."}' */
function parseJsonLocale(jsonStr: string | undefined, locale: string): string {
  if (!jsonStr) return '';
  try {
    const obj = JSON.parse(jsonStr);
    if (typeof obj === 'object' && obj !== null) return obj[locale] || '';
  } catch { /* not JSON */ }
  return jsonStr;
}

/**
 * Hook to fetch and use live site settings from the database.
 * - Always fetches on mount
 * - Re-fetches when `invalidateSettingsCache()` is called
 * - Re-fetches when browser tab becomes visible ( catches cross-tab updates )
 * - Falls back to COMPANY constants for missing values
 */
export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(cachedData);
  const [loaded, setLoaded] = useState(() => !!cachedData);
  const localVer = useRef(versionCounter);

  // Re-fetch whenever version changes (from invalidation)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      // If cache is fresh from a recent fetch, use it synchronously
      if (cachedData && localVer.current === versionCounter) {
        syncRates(cachedData);
        setSettings(cachedData);
        setLoaded(true);
        return;
      }

      const data = await fetchFromAPI();
      if (cancelled) return;
      if (data) {
        cachedData = data;
        localVer.current = versionCounter;
        // Sync exchange rates into currency module
        syncRates(data);
      }
      setSettings(cachedData);
      setLoaded(true);
    }

    load();
    return () => { cancelled = true; };
  }, [versionCounter]); // re-run when version bumps

  // Subscribe to invalidation events
  useEffect(() => {
    const cb = () => {
      // Force re-render which triggers the fetch effect above
      // We do this by bumping a dummy state
      setSettings((prev) => prev); // trigger re-render
    };
    subscribers.add(cb);
    return () => { subscribers.delete(cb); };
  }, []);

  // Re-fetch when tab becomes visible (catches cross-tab admin saves)
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') {
        fetchFromAPI().then((data) => {
          if (data) {
            cachedData = data;
            localVer.current = versionCounter;
            syncRates(data);
            setSettings(data);
          }
        });
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // ---- Convenience accessors ----

  const get = useCallback((key: string, fallback: string): string => {
    if (settings && settings[key]) return settings[key];
    return fallback;
  }, [settings]);

  const statsYears = parseInt(settings?.stats_years || '', 10) || 15;
  const statsMachines = parseInt(settings?.stats_machines || '', 10) || 500;
  const statsClients = parseInt(settings?.stats_clients || '', 10) || 200;
  const statsCountries = parseInt(settings?.stats_countries || '', 10) || 10;

  const companyName = useCallback((locale: Locale) => {
    // Priority: separate locale key > JSON field > COMPANY constant
    const sep = locale === 'ar' ? settings?.company_name_ar
      : locale === 'en' ? settings?.company_name_en
      : settings?.company_name_fr;
    if (sep) return sep;
    const fromJson = parseJsonLocale(settings?.company_name, locale);
    if (fromJson) return fromJson;
    return locale === 'ar' ? COMPANY.nameAr : COMPANY.name;
  }, [settings]);

  const description = useCallback((locale: Locale) => {
    const sep = locale === 'ar' ? settings?.company_description_ar
      : locale === 'en' ? settings?.company_description_en
      : settings?.company_description_fr;
    if (sep) return sep;
    const fromJson = parseJsonLocale(settings?.company_description, locale);
    if (fromJson) return fromJson;
    return locale === 'ar' ? COMPANY.description.ar
      : locale === 'en' ? COMPANY.description.en
      : COMPANY.description.fr;
  }, [settings]);

  const workingHours = useCallback((locale: Locale) => {
    const sep = locale === 'ar' ? settings?.working_hours_ar
      : locale === 'en' ? settings?.working_hours_en
      : settings?.working_hours_fr;
    if (sep) return sep;
    const fromJson = parseJsonLocale(settings?.working_hours, locale);
    if (fromJson) return fromJson;
    return locale === 'ar' ? COMPANY.workingHours.ar
      : locale === 'en' ? COMPANY.workingHours.en
      : COMPANY.workingHours.fr;
  }, [settings]);

  const seoTitle = useCallback((locale: Locale) => {
    const sep = locale === 'ar' ? settings?.seo_title_ar
      : locale === 'en' ? settings?.seo_title_en
      : settings?.seo_title_fr;
    if (sep) return sep;
    const fromJson = parseJsonLocale(settings?.meta_title, locale);
    if (fromJson) return fromJson;
    return COMPANY.name;
  }, [settings]);

  const seoDescription = useCallback((locale: Locale) => {
    const sep = locale === 'ar' ? settings?.seo_description_ar
      : locale === 'en' ? settings?.seo_description_en
      : settings?.seo_description_fr;
    if (sep) return sep;
    const fromJson = parseJsonLocale(settings?.meta_description, locale);
    if (fromJson) return fromJson;
    return '';
  }, [settings]);

  return {
    settings: settings || {},
    loaded,
    get,
    stats: { years: statsYears, machines: statsMachines, clients: statsClients, countries: statsCountries },
    phone: settings?.company_phone || settings?.contact_phone || COMPANY.phone,
    email: settings?.company_email || settings?.contact_email || COMPANY.email,
    whatsapp: settings?.company_whatsapp || settings?.contact_whatsapp || COMPANY.whatsapp,
    address: settings?.company_address || settings?.contact_address || COMPANY.address,
    website: settings?.company_website || COMPANY.website,
    facebook: settings?.social_facebook || COMPANY.facebook,
    linkedin: settings?.social_linkedin || COMPANY.linkedin,
    instagram: settings?.social_instagram || '',
    youtube: settings?.social_youtube || '',
    twitter: settings?.social_twitter || '',
    companyName,
    description,
    workingHours,
    seoTitle,
    seoDescription,
    seoOgImage: settings?.seo_og_image || '',
    companyLogo: settings?.company_logo || '/logo.svg',
    companyFavicon: settings?.company_favicon || '/favicon.ico',
  };
}
