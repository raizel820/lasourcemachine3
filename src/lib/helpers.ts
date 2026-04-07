import type { Locale } from './types';
import { cn } from './utils';

// Re-export cn for convenience
export { cn };

/**
 * Extract a localized value from a JSON string that is a TranslatableString.
 * Falls back to French, then English, then Arabic, then the raw string.
 */
export function getLocalizedValue(
  jsonString: string,
  locale: Locale
): string {
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed === 'string') return parsed;
    if (typeof parsed === 'object' && parsed !== null) {
      // Return the requested locale
      if (parsed[locale] && typeof parsed[locale] === 'string') {
        return parsed[locale];
      }
      // Fallback chain: fr -> en -> ar
      const fallbacks: Locale[] = ['fr', 'en', 'ar'];
      for (const fb of fallbacks) {
        if (parsed[fb] && typeof parsed[fb] === 'string') {
          return parsed[fb];
        }
      }
      // Return the first string value found
      const values = Object.values(parsed);
      const firstString = values.find((v) => typeof v === 'string');
      if (firstString) return firstString;
    }
    return jsonString;
  } catch {
    return jsonString;
  }
}

/**
 * Parse a JSON array of translatable items and return the localized version.
 * Each item should be a TranslatableString (Record<Locale, string>).
 */
export function getLocalizedArray<T = string>(
  jsonString: string,
  locale: Locale
): T[] {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        return (
          item[locale] ||
          item['fr'] ||
          item['en'] ||
          item['ar'] ||
          Object.values(item)[0] ||
          item
        );
      }
      return item;
    }) as T[];
  } catch {
    return [];
  }
}

/**
 * Generate a URL-friendly slug from text.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Format a date according to the given locale.
 */
export function formatDate(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const localeMap: Record<Locale, string> = {
    fr: 'fr-DZ',
    en: 'en-US',
    ar: 'ar-DZ',
  };

  try {
    return new Intl.DateTimeFormat(localeMap[locale], {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

/**
 * Truncate text to a maximum length, adding ellipsis if truncated.
 */
export function truncateText(
  text: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (!text || text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength).trimEnd();
  // Avoid cutting in the middle of a word
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace) + suffix;
  }
  return truncated + suffix;
}

/**
 * Get the primary cover/thumbnail image for an entity.
 * Priority: coverImage > images[0] from gallery > null
 */
export function getEntityCoverImage(entity: Record<string, any>): string | null {
  // Prefer dedicated coverImage field
  if (entity.coverImage) return entity.coverImage;
  // Fall back to service image field
  if (entity.image) return entity.image;
  // Fall back to first image in gallery JSON array
  if (entity.images) {
    try {
      const imgs = JSON.parse(entity.images);
      if (Array.isArray(imgs) && imgs.length > 0 && typeof imgs[0] === 'string') {
        return imgs[0];
      }
    } catch { /* not valid JSON */ }
  }
  return null;
}

/**
 * Get all images for an entity (gallery), prepending coverImage if distinct.
 * Returns an array of image URL strings.
 */
export function getEntityGallery(entity: Record<string, any>): string[] {
  const images: string[] = [];
  const cover = entity.coverImage || entity.image;
  if (cover) {
    images.push(cover);
  }
  if (entity.images) {
    try {
      const imgs = JSON.parse(entity.images);
      if (Array.isArray(imgs)) {
        for (const img of imgs) {
          if (typeof img === 'string' && img !== cover) {
            images.push(img);
          }
        }
      }
    } catch { /* not valid JSON */ }
  }
  return images;
}

/**
 * Build a Google Maps embed URL from coordinates.
 */
export function getGoogleMapsEmbedUrl(
  lat: number,
  lng: number,
  zoom: number = 15
): string {
  return `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d500!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sdz!4v1&zoom=${zoom}`;
}

/**
 * Build a Google Maps directions URL.
 */
export function getGoogleMapsDirectionsUrl(
  lat: number,
  lng: number,
  address?: string
): string {
  if (address) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
