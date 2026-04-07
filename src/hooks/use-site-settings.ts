'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { COMPANY } from '@/lib/constants';
import type { Locale } from '@/lib/types';

interface SiteSettings {
  company_phone: string;
  company_email: string;
  company_whatsapp: string;
  company_address: string;
  company_website: string;
  company_name_fr: string;
  company_name_en: string;
  company_name_ar: string;
  company_description_fr: string;
  company_description_en: string;
  company_description_ar: string;
  social_facebook: string;
  social_linkedin: string;
  social_instagram: string;
  social_youtube: string;
  social_twitter: string;
  working_hours_fr: string;
  working_hours_en: string;
  working_hours_ar: string;
  stats_years: string;
  stats_machines: string;
  stats_clients: string;
  stats_countries: string;
  [key: string]: string;
}

// ---- Reactive cache invalidation system ----
let cachedSettings: SiteSettings | null = null;
let cacheTimestamp = 0;
let settingsVersion = 0;

const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((cb) => cb());
}

/** Force-invalidate the settings cache so ALL components re-fetch immediately */
export function invalidateSettingsCache() {
  cachedSettings = null;
  cacheTimestamp = 0;
  settingsVersion += 1;
  notifySubscribers();
}

async function fetchSettings(): Promise<SiteSettings | null> {
  try {
    const res = await fetch(`/api/settings?_v=${settingsVersion}&_t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      return data.data || null;
    }
  } catch {
    // Silently fail — fallback to constants
  }
  return null;
}

/**
 * Hook to fetch and use live site settings from the database.
 * Falls back to COMPANY constants if settings haven't been saved yet.
 *
 * Automatically re-fetches when:
 * - Component first mounts
 * - Cache is older than 5 minutes
 * - invalidateSettingsCache() is called (from admin settings save)
 */
export function useSiteSettings() {
  // Initialize from cache synchronously (no effect needed)
  const [settings, setSettings] = useState<SiteSettings | null>(cachedSettings);
  const [loaded, setLoaded] = useState(() => !!cachedSettings);
  // Track version to detect external invalidations
  const [localVersion, setLocalVersion] = useState(settingsVersion);
  // Ref to prevent double-fetching
  const fetchedVersion = useRef(settingsVersion);

  // Subscribe to cache invalidations — only calls setState in a callback from external system
  useEffect(() => {
    const callback = () => {
      // Trigger re-render with new version; the fetch effect will run after
      setLocalVersion(settingsVersion);
    };
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  }, []);

  // Fetch effect — only runs when localVersion changes (invalidation or mount)
  useEffect(() => {
    // Skip if we already fetched this version and have cached data
    if (fetchedVersion.current === settingsVersion && cachedSettings) return;

    const STALE_MS = 5 * 60 * 1000;
    // If cache is fresh, don't re-fetch
    if (cachedSettings && Date.now() - cacheTimestamp < STALE_MS && fetchedVersion.current === settingsVersion) return;

    let cancelled = false;

    (async () => {
      const data = await fetchSettings();
      if (cancelled) return;
      if (data) {
        cachedSettings = data;
        cacheTimestamp = Date.now();
      }
      fetchedVersion.current = settingsVersion;
      setSettings(cachedSettings);
      setLoaded(true);
    })();

    return () => { cancelled = true; };
  }, [localVersion]);

  // Helper: parse a JSON field (e.g. `{"en":"...","fr":"...","ar":"..."}`) into locale value
  const parseJsonLocale = useCallback((jsonStr: string | undefined, locale: Locale): string => {
    if (!jsonStr) return '';
    try {
      const obj = JSON.parse(jsonStr);
      if (typeof obj === 'object' && obj !== null) return obj[locale] || '';
    } catch { /* not JSON */ }
    return jsonStr; // return as plain string if not JSON
  }, []);

  const get = useCallback((key: string, fallback: string): string => {
    if (settings && settings[key]) return settings[key];
    return fallback;
  }, [settings]);

  const statsYears = parseInt(settings?.stats_years || '15', 10) || 15;
  const statsMachines = parseInt(settings?.stats_machines || '500', 10) || 500;
  const statsClients = parseInt(settings?.stats_clients || '200', 10) || 200;
  const statsCountries = parseInt(settings?.stats_countries || '10', 10) || 10;

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
    companyName: useCallback((locale: Locale) => {
      // Priority: separate locale key > JSON format > COMPANY constant
      const sep = locale === 'ar' ? settings?.company_name_ar
        : locale === 'en' ? settings?.company_name_en
        : settings?.company_name_fr;
      if (sep) return sep;
      const fromJson = parseJsonLocale(settings?.company_name, locale);
      if (fromJson) return fromJson;
      return locale === 'ar' ? COMPANY.nameAr : COMPANY.name;
    }, [settings, parseJsonLocale]),
    description: useCallback((locale: Locale) => {
      // Priority: separate locale key > JSON format > COMPANY constant
      const sep = locale === 'ar' ? settings?.company_description_ar
        : locale === 'en' ? settings?.company_description_en
        : settings?.company_description_fr;
      if (sep) return sep;
      const fromJson = parseJsonLocale(settings?.company_description, locale);
      if (fromJson) return fromJson;
      return locale === 'ar' ? COMPANY.description.ar
        : locale === 'en' ? COMPANY.description.en
        : COMPANY.description.fr;
    }, [settings, parseJsonLocale]),
    workingHours: useCallback((locale: Locale) => {
      // Priority: separate locale key > JSON format > COMPANY constant
      const sep = locale === 'ar' ? settings?.working_hours_ar
        : locale === 'en' ? settings?.working_hours_en
        : settings?.working_hours_fr;
      if (sep) return sep;
      const fromJson = parseJsonLocale(settings?.working_hours, locale);
      if (fromJson) return fromJson;
      return locale === 'ar' ? COMPANY.workingHours.ar
        : locale === 'en' ? COMPANY.workingHours.en
        : COMPANY.workingHours.fr;
    }, [settings, parseJsonLocale]),
    // SEO helpers
    seoTitle: useCallback((locale: Locale) => {
      const sep = locale === 'ar' ? settings?.seo_title_ar
        : locale === 'en' ? settings?.seo_title_en
        : settings?.seo_title_fr;
      if (sep) return sep;
      const fromJson = parseJsonLocale(settings?.meta_title, locale);
      if (fromJson) return fromJson;
      return COMPANY.name;
    }, [settings, parseJsonLocale]),
    seoDescription: useCallback((locale: Locale) => {
      const sep = locale === 'ar' ? settings?.seo_description_ar
        : locale === 'en' ? settings?.seo_description_en
        : settings?.seo_description_fr;
      if (sep) return sep;
      const fromJson = parseJsonLocale(settings?.meta_description, locale);
      if (fromJson) return fromJson;
      return '';
    }, [settings, parseJsonLocale]),
    seoOgImage: settings?.seo_og_image || '',
  };
}
