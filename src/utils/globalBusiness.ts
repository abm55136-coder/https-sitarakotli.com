import {
  BuyingMode,
  CurrencyCode,
  CurrencyConfig,
  Language,
  OrderPaymentMethod,
  Product,
} from '../types';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  isRtl: boolean;
  speechLocale: string;
}

export interface CountryConfig {
  code: string;
  name: string;
  nameUrdu: string;
  dialCode: string;
  flag: string;
  defaultCurrency: CurrencyCode;
  defaultLanguage: Language;
  primaryTimezone: string;
  shippingZone: 'local_kotli' | 'domestic_pk' | 'gulf_me' | 'uk_europe' | 'north_america' | 'asia_pacific' | 'rest_of_world';
  baseShippingPKR: number;
  courierName: string;
  estimatedDays: string;
}

export interface VisitorGeoDetection {
  countryCode: string;
  countryName: string;
  dialCode: string;
  timezone: string;
  recommendedCurrency: CurrencyCode;
  recommendedLanguage: Language;
  detectionSource: 'timezone-and-locale' | 'timezone' | 'locale' | 'default';
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', isRtl: false, speechLocale: 'en-US' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', isRtl: true, speechLocale: 'ur-PK' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', isRtl: true, speechLocale: 'ar-SA' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', isRtl: false, speechLocale: 'hi-IN' },
  { code: 'pa', name: 'Punjabi', nativeName: 'پنجابی', flag: '🇵🇰', isRtl: true, speechLocale: 'pa-Arab-PK' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', isRtl: false, speechLocale: 'fr-FR' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', isRtl: false, speechLocale: 'es-ES' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', isRtl: false, speechLocale: 'de-DE' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', isRtl: false, speechLocale: 'tr-TR' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', isRtl: false, speechLocale: 'zh-CN' },
];

export const GLOBAL_CURRENCIES: CurrencyConfig[] = [
  { code: 'PKR', symbol: 'Rs.', name: 'Pakistani Rupee', nameUrdu: 'پاکستانی روپیہ', flag: '🇵🇰', rateAgainstPKR: 1, unitRatioText: 'Base Currency' },
  { code: 'USD', symbol: '$', name: 'US Dollar', nameUrdu: 'امریکی ڈالر', flag: '🇺🇸', rateAgainstPKR: 0.0036, unitRatioText: '1 USD ≈ 278 PKR' },
  { code: 'GBP', symbol: '£', name: 'British Pound', nameUrdu: 'برطانوی پاؤنڈ', flag: '🇬🇧', rateAgainstPKR: 0.0028, unitRatioText: '1 GBP ≈ 357 PKR' },
  { code: 'EUR', symbol: '€', name: 'Euro', nameUrdu: 'یورو', flag: '🇪🇺', rateAgainstPKR: 0.0033, unitRatioText: '1 EUR ≈ 303 PKR' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', nameUrdu: 'اماراتی درہم', flag: '🇦🇪', rateAgainstPKR: 0.0132, unitRatioText: '1 AED ≈ 76 PKR' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', nameUrdu: 'سعودی ریال', flag: '🇸🇦', rateAgainstPKR: 0.0135, unitRatioText: '1 SAR ≈ 74 PKR' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', nameUrdu: 'کینیڈین ڈالر', flag: '🇨🇦', rateAgainstPKR: 0.0050, unitRatioText: '1 CAD ≈ 200 PKR' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', nameUrdu: 'آسٹریلوی ڈالر', flag: '🇦🇺', rateAgainstPKR: 0.0055, unitRatioText: '1 AUD ≈ 182 PKR' },
  { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal', nameUrdu: 'قطری ریال', flag: '🇶🇦', rateAgainstPKR: 0.0131, unitRatioText: '1 QAR ≈ 76 PKR' },
  { code: 'KWD', symbol: 'KWD', name: 'Kuwaiti Dinar', nameUrdu: 'کویتی دینار', flag: '🇰🇼', rateAgainstPKR: 0.0011, unitRatioText: '1 KWD ≈ 905 PKR' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', nameUrdu: 'بھارتی روپیہ', flag: '🇮🇳', rateAgainstPKR: 0.30, unitRatioText: '1 INR ≈ 3.3 PKR' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', nameUrdu: 'چینی یوآن', flag: '🇨🇳', rateAgainstPKR: 0.026, unitRatioText: '1 CNY ≈ 38.5 PKR' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', nameUrdu: 'ترک لیرا', flag: '🇹🇷', rateAgainstPKR: 0.123, unitRatioText: '1 TRY ≈ 8.1 PKR' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', nameUrdu: 'سوئس فرانک', flag: '🇨🇭', rateAgainstPKR: 0.0032, unitRatioText: '1 CHF ≈ 312 PKR' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', nameUrdu: 'ملائیشین رنگٹ', flag: '🇲🇾', rateAgainstPKR: 0.016, unitRatioText: '1 MYR ≈ 62.5 PKR' },
];

export const REFERENCE_EXCHANGE_RATES: Record<CurrencyCode, number> = GLOBAL_CURRENCIES.reduce(
  (acc, cur) => {
    acc[cur.code] = cur.rateAgainstPKR;
    return acc;
  },
  {} as Record<CurrencyCode, number>
);

export const GLOBAL_COUNTRIES: CountryConfig[] = [
  { code: 'PK', name: 'Pakistan & Azad Kashmir', nameUrdu: 'پاکستان اور آزاد کشمیر', dialCode: '+92', flag: '🇵🇰', defaultCurrency: 'PKR', defaultLanguage: 'en', primaryTimezone: 'Asia/Karachi', shippingZone: 'domestic_pk', baseShippingPKR: 250, courierName: 'TCS / Leopards Express', estimatedDays: '1–3 Days' },
  { code: 'GB', name: 'United Kingdom', nameUrdu: 'برطانیہ', dialCode: '+44', flag: '🇬🇧', defaultCurrency: 'GBP', defaultLanguage: 'en', primaryTimezone: 'Europe/London', shippingZone: 'uk_europe', baseShippingPKR: 4800, courierName: 'DHL Express International', estimatedDays: '4–6 Days' },
  { code: 'US', name: 'United States', nameUrdu: 'امریکہ', dialCode: '+1', flag: '🇺🇸', defaultCurrency: 'USD', defaultLanguage: 'en', primaryTimezone: 'America/New_York', shippingZone: 'north_america', baseShippingPKR: 5400, courierName: 'DHL Express / FedEx Priority', estimatedDays: '5–7 Days' },
  { code: 'AE', name: 'United Arab Emirates', nameUrdu: 'متحدہ عرب امارات', dialCode: '+971', flag: '🇦🇪', defaultCurrency: 'AED', defaultLanguage: 'ar', primaryTimezone: 'Asia/Dubai', shippingZone: 'gulf_me', baseShippingPKR: 3200, courierName: 'Aramex / DHL Gulf', estimatedDays: '3–4 Days' },
  { code: 'SA', name: 'Saudi Arabia', nameUrdu: 'سعودی عرب', dialCode: '+966', flag: '🇸🇦', defaultCurrency: 'SAR', defaultLanguage: 'ar', primaryTimezone: 'Asia/Riyadh', shippingZone: 'gulf_me', baseShippingPKR: 3400, courierName: 'DHL Express / SMSA', estimatedDays: '3–5 Days' },
  { code: 'CA', name: 'Canada', nameUrdu: 'کینیڈا', dialCode: '+1', flag: '🇨🇦', defaultCurrency: 'CAD', defaultLanguage: 'en', primaryTimezone: 'America/Toronto', shippingZone: 'north_america', baseShippingPKR: 5400, courierName: 'DHL Express International', estimatedDays: '5–7 Days' },
  { code: 'AU', name: 'Australia', nameUrdu: 'آسٹریلیا', dialCode: '+61', flag: '🇦🇺', defaultCurrency: 'AUD', defaultLanguage: 'en', primaryTimezone: 'Australia/Sydney', shippingZone: 'asia_pacific', baseShippingPKR: 5600, courierName: 'DHL Express International', estimatedDays: '5–8 Days' },
  { code: 'DE', name: 'Germany', nameUrdu: 'جرمنی', dialCode: '+49', flag: '🇩🇪', defaultCurrency: 'EUR', defaultLanguage: 'de', primaryTimezone: 'Europe/Berlin', shippingZone: 'uk_europe', baseShippingPKR: 5000, courierName: 'DHL Express Europe', estimatedDays: '4–7 Days' },
  { code: 'FR', name: 'France', nameUrdu: 'فرانس', dialCode: '+33', flag: '🇫🇷', defaultCurrency: 'EUR', defaultLanguage: 'fr', primaryTimezone: 'Europe/Paris', shippingZone: 'uk_europe', baseShippingPKR: 5000, courierName: 'DHL Express Europe', estimatedDays: '4–7 Days' },
  { code: 'ES', name: 'Spain', nameUrdu: 'اسپین', dialCode: '+34', flag: '🇪🇸', defaultCurrency: 'EUR', defaultLanguage: 'es', primaryTimezone: 'Europe/Madrid', shippingZone: 'uk_europe', baseShippingPKR: 5100, courierName: 'DHL Express Europe', estimatedDays: '5–7 Days' },
  { code: 'TR', name: 'Turkey', nameUrdu: 'ترکیہ', dialCode: '+90', flag: '🇹🇷', defaultCurrency: 'TRY', defaultLanguage: 'tr', primaryTimezone: 'Europe/Istanbul', shippingZone: 'uk_europe', baseShippingPKR: 3900, courierName: 'Turkish Cargo / DHL', estimatedDays: '4–6 Days' },
  { code: 'QA', name: 'Qatar', nameUrdu: 'قطر', dialCode: '+974', flag: '🇶🇦', defaultCurrency: 'QAR', defaultLanguage: 'ar', primaryTimezone: 'Asia/Qatar', shippingZone: 'gulf_me', baseShippingPKR: 3300, courierName: 'DHL Express Gulf', estimatedDays: '3–5 Days' },
  { code: 'KW', name: 'Kuwait', nameUrdu: 'کویت', dialCode: '+965', flag: '🇰🇼', defaultCurrency: 'KWD', defaultLanguage: 'ar', primaryTimezone: 'Asia/Kuwait', shippingZone: 'gulf_me', baseShippingPKR: 3400, courierName: 'DHL Express Gulf', estimatedDays: '3–5 Days' },
  { code: 'IN', name: 'India', nameUrdu: 'بھارت', dialCode: '+91', flag: '🇮🇳', defaultCurrency: 'INR', defaultLanguage: 'hi', primaryTimezone: 'Asia/Kolkata', shippingZone: 'asia_pacific', baseShippingPKR: 3600, courierName: 'DHL Express South Asia', estimatedDays: '5–8 Days' },
  { code: 'CN', name: 'China', nameUrdu: 'چین', dialCode: '+86', flag: '🇨🇳', defaultCurrency: 'CNY', defaultLanguage: 'zh', primaryTimezone: 'Asia/Shanghai', shippingZone: 'asia_pacific', baseShippingPKR: 4200, courierName: 'FedEx Priority Asia', estimatedDays: '5–7 Days' },
  { code: 'MY', name: 'Malaysia', nameUrdu: 'ملائیشیا', dialCode: '+60', flag: '🇲🇾', defaultCurrency: 'MYR', defaultLanguage: 'en', primaryTimezone: 'Asia/Kuala_Lumpur', shippingZone: 'asia_pacific', baseShippingPKR: 3800, courierName: 'DHL Express Asia', estimatedDays: '4–6 Days' },
  { code: 'CH', name: 'Switzerland', nameUrdu: 'سوئٹزرلینڈ', dialCode: '+41', flag: '🇨🇭', defaultCurrency: 'CHF', defaultLanguage: 'de', primaryTimezone: 'Europe/Zurich', shippingZone: 'uk_europe', baseShippingPKR: 5200, courierName: 'DHL Express Europe', estimatedDays: '5–7 Days' },
  { code: 'INTL', name: 'Other Country (Worldwide)', nameUrdu: 'دیگر تمام ممالک (عالمی ڈلیوری)', dialCode: '+', flag: '🌍', defaultCurrency: 'USD', defaultLanguage: 'en', primaryTimezone: 'UTC', shippingZone: 'rest_of_world', baseShippingPKR: 5800, courierName: 'DHL Express Worldwide', estimatedDays: '5–9 Days' },
];

const TIMEZONE_TO_COUNTRY_PREFIX: Array<{ prefix: string; countryCode: string }> = [
  { prefix: 'Asia/Karachi', countryCode: 'PK' },
  { prefix: 'Europe/London', countryCode: 'GB' },
  { prefix: 'Asia/Dubai', countryCode: 'AE' },
  { prefix: 'Asia/Riyadh', countryCode: 'SA' },
  { prefix: 'Asia/Qatar', countryCode: 'QA' },
  { prefix: 'Asia/Kuwait', countryCode: 'KW' },
  { prefix: 'Asia/Kolkata', countryCode: 'IN' },
  { prefix: 'Asia/Calcutta', countryCode: 'IN' },
  { prefix: 'Asia/Shanghai', countryCode: 'CN' },
  { prefix: 'Asia/Kuala_Lumpur', countryCode: 'MY' },
  { prefix: 'Europe/Berlin', countryCode: 'DE' },
  { prefix: 'Europe/Paris', countryCode: 'FR' },
  { prefix: 'Europe/Madrid', countryCode: 'ES' },
  { prefix: 'Europe/Istanbul', countryCode: 'TR' },
  { prefix: 'Europe/Zurich', countryCode: 'CH' },
  { prefix: 'Australia/', countryCode: 'AU' },
  { prefix: 'America/Toronto', countryCode: 'CA' },
  { prefix: 'America/Vancouver', countryCode: 'CA' },
  { prefix: 'America/Montreal', countryCode: 'CA' },
  { prefix: 'America/', countryCode: 'US' },
  { prefix: 'Europe/', countryCode: 'GB' },
];

export function getCountryByCode(code?: string): CountryConfig {
  const upper = (code || '').toUpperCase();
  return GLOBAL_COUNTRIES.find((c) => c.code === upper) || GLOBAL_COUNTRIES[0];
}

export function isLanguageRtl(lang: Language): boolean {
  return SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.isRtl ?? false;
}

export function getLanguageOption(lang: Language): LanguageOption {
  return SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];
}

export function detectVisitorGeoLocale(
  timeZoneInput?: string,
  browserLanguages?: readonly string[]
): VisitorGeoDetection {
  const tz =
    (timeZoneInput && timeZoneInput.trim()) ||
    (typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Karachi'
      : 'Asia/Karachi');

  const langs =
    browserLanguages && browserLanguages.length > 0
      ? browserLanguages
      : typeof navigator !== 'undefined'
      ? navigator.languages || [navigator.language || 'en-US']
      : ['en-US'];

  let countryCode = '';
  let fromTz = false;
  for (const mapping of TIMEZONE_TO_COUNTRY_PREFIX) {
    if (tz.startsWith(mapping.prefix)) {
      countryCode = mapping.countryCode;
      fromTz = true;
      break;
    }
  }

  let matchedLang: Language = 'en';
  let fromLocale = false;
  for (const rawLang of langs) {
    const clean = rawLang.toLowerCase();
    const base = clean.split('-')[0] as Language;
    if (SUPPORTED_LANGUAGES.some((l) => l.code === base)) {
      matchedLang = base;
      fromLocale = true;
      break;
    }
  }

  if (!countryCode) {
    const firstLang = (langs[0] || '').toUpperCase();
    const parts = firstLang.split('-');
    if (parts.length > 1 && GLOBAL_COUNTRIES.some((c) => c.code === parts[1])) {
      countryCode = parts[1];
    } else {
      countryCode = 'PK';
    }
  }

  const country = getCountryByCode(countryCode);
  return {
    countryCode: country.code,
    countryName: country.name,
    dialCode: country.dialCode,
    timezone: tz,
    recommendedCurrency: country.defaultCurrency,
    recommendedLanguage: fromLocale ? matchedLang : country.defaultLanguage,
    detectionSource:
      fromTz && fromLocale
        ? 'timezone-and-locale'
        : fromTz
        ? 'timezone'
        : fromLocale
        ? 'locale'
        : 'default',
  };
}

export function formatDualWorldClock(visitorTimezone: string, nowDate = new Date()): {
  visitorTime: string;
  kotliTime: string;
  visitorTzShort: string;
} {
  const fmtOpts: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };
  let visitorTime = '';
  let visitorTzShort = visitorTimezone;
  try {
    visitorTime = new Intl.DateTimeFormat('en-US', {
      ...fmtOpts,
      timeZone: visitorTimezone || 'Asia/Karachi',
    }).format(nowDate);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short',
      timeZone: visitorTimezone || 'Asia/Karachi',
    }).formatToParts(nowDate);
    visitorTzShort = parts.find((p) => p.type === 'timeZoneName')?.value || visitorTimezone;
  } catch {
    visitorTime = new Intl.DateTimeFormat('en-US', {
      ...fmtOpts,
      timeZone: 'Asia/Karachi',
    }).format(nowDate);
    visitorTzShort = 'PKT';
  }

  const kotliTime = new Intl.DateTimeFormat('en-US', {
    ...fmtOpts,
    timeZone: 'Asia/Karachi',
  }).format(nowDate);

  return { visitorTime, kotliTime, visitorTzShort };
}

export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  rates: Record<CurrencyCode, number> = REFERENCE_EXCHANGE_RATES
): number {
  const safeAmount = Number(amount);
  if (!Number.isFinite(safeAmount)) return 0;
  if (fromCurrency === toCurrency) return safeAmount;

  const fromRate = rates[fromCurrency] || REFERENCE_EXCHANGE_RATES[fromCurrency] || 1;
  const toRate = rates[toCurrency] || REFERENCE_EXCHANGE_RATES[toCurrency] || 1;
  const amountInPKR = safeAmount / fromRate;
  return amountInPKR * toRate;
}

export function formatGlobalPrice(
  amountInPKR: number,
  currency: CurrencyCode = 'PKR',
  rates: Record<CurrencyCode, number> = REFERENCE_EXCHANGE_RATES
): string {
  const safePKR = Number(amountInPKR);
  const cfg = GLOBAL_CURRENCIES.find((c) => c.code === currency) || GLOBAL_CURRENCIES[0];
  if (!Number.isFinite(safePKR)) {
    return currency === 'PKR' || currency === 'INR' ? `${cfg.symbol} 0` : `${cfg.symbol}0.00`;
  }

  const rate = rates[currency] ?? cfg.rateAgainstPKR ?? 1;
  const converted = safePKR * rate;

  if (currency === 'PKR') {
    return `Rs. ${Math.round(converted).toLocaleString('en-PK')}`;
  }
  if (currency === 'INR' || currency === 'JPY' as string) {
    return `${cfg.symbol}${Math.round(converted).toLocaleString('en-US')}`;
  }
  if (currency === 'KWD') {
    return `${cfg.symbol} ${converted.toLocaleString('en-US', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    })}`;
  }
  if (currency === 'AED' || currency === 'SAR' || currency === 'QAR' || currency === 'CHF' || currency === 'MYR') {
    return `${cfg.symbol} ${converted.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `${cfg.symbol}${converted.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getEffectiveWholesalePrice(product: Product): number {
  if (typeof product.wholesalePrice === 'number' && product.wholesalePrice > 0) {
    return product.wholesalePrice;
  }
  // Standard Sitara trade wholesale discount (~22% off retail)
  return Math.round(product.price * 0.78);
}

export function getWholesaleMinQty(product: Product): number {
  return typeof product.wholesaleMinQty === 'number' && product.wholesaleMinQty >= 2
    ? product.wholesaleMinQty
    : 5;
}

export function calculateProductUnitPrice(
  product: Product,
  quantity = 1,
  buyingMode: BuyingMode = 'retail'
): { unitPrice: number; isWholesaleApplied: boolean; savingsPerUnit: number } {
  const minQty = getWholesaleMinQty(product);
  const wholesalePrice = getEffectiveWholesalePrice(product);
  const qualifiesWholesale = buyingMode === 'wholesale' || quantity >= minQty;

  if (qualifiesWholesale && wholesalePrice < product.price) {
    return {
      unitPrice: wholesalePrice,
      isWholesaleApplied: true,
      savingsPerUnit: product.price - wholesalePrice,
    };
  }
  return {
    unitPrice: product.price,
    isWholesaleApplied: false,
    savingsPerUnit: 0,
  };
}

export interface InternationalShippingQuote {
  shippingFeePKR: number;
  courierName: string;
  estimatedDays: string;
  isFree: boolean;
  freeThresholdPKR: number;
  zoneLabel: string;
}

export function calculateInternationalShipping(
  subtotalPKR: number,
  countryCode = 'PK',
  city = '',
  domesticFreeThresholdPKR = 4500,
  buyingMode: BuyingMode = 'retail'
): InternationalShippingQuote {
  const country = getCountryByCode(countryCode);
  const isPK = country.code === 'PK';
  const intlFreeThreshold = buyingMode === 'wholesale' ? 65000 : 45000;
  const threshold = isPK ? domesticFreeThresholdPKR : intlFreeThreshold;

  if (subtotalPKR <= 0) {
    return {
      shippingFeePKR: 0,
      courierName: country.courierName,
      estimatedDays: country.estimatedDays,
      isFree: true,
      freeThresholdPKR: threshold,
      zoneLabel: country.name,
    };
  }

  if (subtotalPKR >= threshold) {
    return {
      shippingFeePKR: 0,
      courierName: isPK && city.toLowerCase().includes('kotli') ? 'Kotli Same-Day Rider' : country.courierName,
      estimatedDays: isPK && city.toLowerCase().includes('kotli') ? 'Same Day (2–4 hrs)' : country.estimatedDays,
      isFree: true,
      freeThresholdPKR: threshold,
      zoneLabel: country.name,
    };
  }

  if (isPK) {
    const isKotli = city.toLowerCase().includes('kotli');
    return {
      shippingFeePKR: isKotli ? 100 : 250,
      courierName: isKotli ? 'Kotli Same-Day Rider' : country.courierName,
      estimatedDays: isKotli ? 'Same Day (2–4 hrs)' : '1–3 Days',
      isFree: false,
      freeThresholdPKR: domesticFreeThresholdPKR,
      zoneLabel: country.name,
    };
  }

  return {
    shippingFeePKR: country.baseShippingPKR,
    courierName: country.courierName,
    estimatedDays: country.estimatedDays,
    isFree: false,
    freeThresholdPKR: intlFreeThreshold,
    zoneLabel: country.name,
  };
}

export function smartSearchAndRecommend(
  products: Product[],
  queryOrReference: string | Product,
  limit = 4
): Product[] {
  if (!products.length) return [];

  if (typeof queryOrReference !== 'string') {
    const ref = queryOrReference;
    return products
      .filter((p) => p.id !== ref.id && p.stockQuantity > 0)
      .map((p) => {
        let score = 0;
        if (p.category === ref.category) score += 4;
        if (p.gender === ref.gender) score += 3;
        if (p.season === ref.season) score += 3;
        if (p.isFeatured) score += 1;
        // Price proximity boost
        const diffRatio = Math.abs(p.price - ref.price) / Math.max(ref.price, 1);
        if (diffRatio <= 0.35) score += 2;
        return { p, score };
      })
      .sort((a, b) => b.score - a.score || b.p.rating - a.p.rating)
      .slice(0, limit)
      .map((entry) => entry.p);
  }

  const raw = queryOrReference.trim().toLowerCase();
  if (!raw) {
    return products.filter((p) => p.isFeatured || p.isNewArrival).slice(0, limit);
  }

  const tokens = raw
    .replace(/ladies|womens|women's/g, 'women')
    .replace(/gents|mens|men's/g, 'men')
    .replace(/children|child|boy|girl/g, 'kids')
    .replace(/marriage|shadi|wedding|party/g, 'festive')
    .split(/\s+/)
    .filter((t) => t.length >= 2);

  const scored = products.map((p) => {
    const haystack = [
      p.sku,
      p.title,
      p.titleUrdu,
      p.gender,
      p.category,
      p.categoryLabel,
      p.fabricType,
      p.season,
      p.weaveQuality,
      p.description,
    ]
      .join(' ')
      .toLowerCase();

    let score = 0;
    if (haystack.includes(raw)) score += 10;
    for (const tok of tokens) {
      if (haystack.includes(tok)) score += 3;
    }
    if (p.stockQuantity > 0) score += 1;
    return { p, score };
  });

  const matched = scored.filter((s) => s.score > 1).sort((a, b) => b.score - a.score);
  if (matched.length > 0) {
    return matched.slice(0, limit).map((s) => s.p);
  }
  return products.filter((p) => p.isFeatured).slice(0, limit);
}

/**
 * Tokenizes & masks card/gateway metadata — NEVER stores raw PAN or CVV numbers.
 */
export function buildMaskedPaymentSummary(
  paymentMethod: OrderPaymentMethod,
  details?: { cardLast4?: string; cardHolder?: string; walletId?: string }
): {
  paymentStatus: 'pending' | 'authorized' | 'paid' | 'cod_due';
  paymentReference: string;
} {
  const randCode = Math.floor(100000 + Math.random() * 900000);
  if (paymentMethod === 'cod') {
    return { paymentStatus: 'cod_due', paymentReference: `COD-${randCode}` };
  }
  if (paymentMethod === 'card') {
    const cleanDigits = (details?.cardLast4 || '').replace(/\D/g, '');
    const last4 = cleanDigits.slice(-4) || '4242';
    return {
      paymentStatus: 'authorized',
      paymentReference: `CARD •••• ${last4} (AUTH-${randCode})`,
    };
  }
  if (paymentMethod === 'paypal') {
    return {
      paymentStatus: 'authorized',
      paymentReference: `PP-${randCode}${details?.walletId ? ` (${details.walletId.slice(0, 24)})` : ''}`,
    };
  }
  if (paymentMethod === 'apple_pay') {
    return {
      paymentStatus: 'authorized',
      paymentReference: `APAY-TOK-${randCode}`,
    };
  }
  if (paymentMethod === 'swift_wire') {
    return {
      paymentStatus: 'pending',
      paymentReference: `SWIFT-SCH-${randCode}`,
    };
  }
  return {
    paymentStatus: 'pending',
    paymentReference: `${paymentMethod.toUpperCase()}-${randCode}`,
  };
}
