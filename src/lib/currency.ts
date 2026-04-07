import type { Locale, Currency } from './types';
import { RTL_LOCALES } from './constants';

/**
 * Default exchange rates relative to DZD (Algerian Dinar).
 * Used as fallback when no admin-configured rates are available.
 */
const DEFAULT_EXCHANGE_RATES: Record<Currency, number> = {
  DZD: 1,
  USD: 0.0074,
  EUR: 0.0068,
};

/**
 * Current exchange rates — can be overridden via setExchangeRates().
 * Initialized with defaults, updated from admin settings at runtime.
 */
let currentRates: Record<Currency, number> = { ...DEFAULT_EXCHANGE_RATES };

/**
 * Update exchange rates at runtime (called after fetching from admin settings).
 */
export function setExchangeRates(rates: Record<Currency, number>) {
  currentRates = { ...DEFAULT_EXCHANGE_RATES, ...rates };
}

/**
 * Get the current exchange rates (for display or external use).
 */
export function getExchangeRates(): Record<Currency, number> {
  return { ...currentRates };
}

/**
 * Currency display symbols by currency code
 */
const CURRENCY_SYMBOLS: Record<Currency, Record<Locale, string>> = {
  DZD: { en: 'DA', fr: 'DA', ar: 'د.ج' },
  USD: { en: '$', fr: '$', ar: '$' },
  EUR: { en: '€', fr: '€', ar: '€' },
};

/**
 * Currency names by currency code
 */
const CURRENCY_NAMES: Record<Currency, Record<Locale, string>> = {
  DZD: { en: 'DZD', fr: 'DZD', ar: 'د.ج' },
  USD: { en: 'USD', fr: 'USD', ar: 'دولار' },
  EUR: { en: 'EUR', fr: 'EUR', ar: 'يورو' },
};

/**
 * Convert an amount from one currency to another.
 * Base currency is DZD.
 */
export function convertPrice(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  // Convert to DZD first, then to target
  const amountInDZD = amount / currentRates[fromCurrency];
  return amountInDZD * currentRates[toCurrency];
}

/**
 * Format a price amount with appropriate locale formatting and currency symbol.
 */
export function formatPrice(
  amount: number,
  currency: Currency,
  locale: Locale
): string {
  const isRTL = RTL_LOCALES.includes(locale);

  // Format the number according to locale conventions
  let formattedNumber: string;

  if (locale === 'ar') {
    // Arabic: use Arabic-Indic numerals if locale is ar
    formattedNumber = new Intl.NumberFormat('ar-DZ', {
      minimumFractionDigits: currency === 'DZD' ? 0 : 2,
      maximumFractionDigits: currency === 'DZD' ? 0 : 2,
    }).format(amount);
  } else if (locale === 'fr') {
    formattedNumber = new Intl.NumberFormat('fr-DZ', {
      minimumFractionDigits: currency === 'DZD' ? 0 : 2,
      maximumFractionDigits: currency === 'DZD' ? 0 : 2,
    }).format(amount);
  } else {
    formattedNumber = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: currency === 'DZD' ? 0 : 2,
      maximumFractionDigits: currency === 'DZD' ? 0 : 2,
    }).format(amount);
  }

  const symbol = CURRENCY_SYMBOLS[currency]?.[locale] ?? currency;

  // RTL languages show amount then symbol
  if (isRTL) {
    return `${formattedNumber} ${symbol}`;
  }

  // For DZD in French/English, symbol comes after (e.g. 150,000 DA)
  if (currency === 'DZD') {
    return `${formattedNumber} ${symbol}`;
  }

  // For USD/EUR, symbol comes before (e.g. $1,500.00)
  return `${symbol}${formattedNumber}`;
}

/**
 * Get the display symbol for a currency in a given locale
 */
export function getCurrencySymbol(
  currency: Currency,
  locale: Locale
): string {
  return CURRENCY_SYMBOLS[currency]?.[locale] ?? currency;
}

/**
 * Get the display name for a currency in a given locale
 */
export function getCurrencyName(
  currency: Currency,
  locale: Locale
): string {
  return CURRENCY_NAMES[currency]?.[locale] ?? currency;
}
