'use client';

import { useState, useEffect } from 'react';
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
  [key: string]: string;
}

// Global settings cache (outside React to persist across mounts)
let cachedSettings: SiteSettings | null = null;
let fetchPromise: Promise<SiteSettings | null> | null = null;
let cacheTimestamp = 0;

async function fetchSettings(): Promise<SiteSettings | null> {
  try {
    // Add cache-busting to avoid stale data
    const res = await fetch(`/api/settings?_t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      return data.data || null;
    }
  } catch {
    // Silently fail — fallback to constants
  }
  return null;
}

/** Force-invalidate the settings cache (called after admin saves) */
export function invalidateSettingsCache() {
  cachedSettings = null;
  cacheTimestamp = 0;
  fetchPromise = null;
}

/**
 * Hook to fetch and use live site settings from the database.
 * Falls back to COMPANY constants if settings haven't been saved yet.
 */
export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(() => {
    // Initialize from cache synchronously
    if (cachedSettings) return cachedSettings;
    return null;
  });
  const [loaded, setLoaded] = useState(() => !!cachedSettings);

  useEffect(() => {
    // Refresh if cache is stale (> 5 minutes old)
    const STALE_MS = 5 * 60 * 1000;
    if (cachedSettings && Date.now() - cacheTimestamp < STALE_MS) return;

    // Clear stale cache
    if (Date.now() - cacheTimestamp >= STALE_MS) {
      cachedSettings = null;
      fetchPromise = null;
    }

    if (cachedSettings) {
      // Already initialized from cache in useState
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetchSettings();
    }

    fetchPromise.then((data) => {
      if (data) {
        cachedSettings = data;
        cacheTimestamp = Date.now();
        setSettings(data);
      }
      setLoaded(true);
      fetchPromise = null;
    });
  }, []);

  // Helper to get a value with fallback to COMPANY constants
  const get = (key: string, fallback: string): string => {
    if (settings && settings[key]) return settings[key];
    return fallback;
  };

  return {
    settings: settings || {},
    loaded,
    get,

    // Convenience accessors with fallbacks to COMPANY constants
    phone: settings?.company_phone || COMPANY.phone,
    email: settings?.company_email || COMPANY.email,
    whatsapp: settings?.company_whatsapp || COMPANY.whatsapp,
    address: settings?.company_address || COMPANY.address,
    website: settings?.company_website || COMPANY.website,
    facebook: settings?.social_facebook || COMPANY.facebook,
    linkedin: settings?.social_linkedin || COMPANY.linkedin,

    companyName: (locale: Locale) => {
      if (locale === 'ar') return settings?.company_name_ar || COMPANY.nameAr;
      if (locale === 'en') return settings?.company_name_en || COMPANY.name;
      return settings?.company_name_fr || COMPANY.name;
    },

    description: (locale: Locale) => {
      if (locale === 'ar') return settings?.company_description_ar || COMPANY.description.ar;
      if (locale === 'en') return settings?.company_description_en || COMPANY.description.en;
      return settings?.company_description_fr || COMPANY.description.fr;
    },

    workingHours: (locale: Locale) => {
      if (locale === 'ar') return settings?.working_hours_ar || COMPANY.workingHours.ar;
      if (locale === 'en') return settings?.working_hours_en || COMPANY.workingHours.en;
      return settings?.working_hours_fr || COMPANY.workingHours.fr;
    },
  };
}
