import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMaskedPaymentSummary,
  calculateInternationalShipping,
  calculateProductUnitPrice,
  convertCurrency,
  detectVisitorGeoLocale,
  formatDualWorldClock,
  formatGlobalPrice,
  REFERENCE_EXCHANGE_RATES,
  smartSearchAndRecommend,
} from './globalBusiness';
import { getFabricCareGuide } from './logic';
import { Product } from '../types';

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'p1',
    sku: 'SCH-M-KHADDAR-01',
    title: 'Kamalia Handloom Winter Khaddar',
    titleUrdu: 'کمالیہ کھدر',
    gender: 'men',
    category: 'khaddar',
    categoryLabel: 'Winter Khaddar',
    price: 5200,
    wholesalePrice: 4100,
    wholesaleMinQty: 5,
    image: '',
    fabricType: 'Handloom Winter Khaddar',
    fabricTypeUrdu: 'کھدر',
    cutMeters: '4.5m',
    season: 'Winter',
    weaveQuality: '100% Pure Khaddar',
    isUnstitched: true,
    colors: [{ name: 'Camel', hex: '#c19a6b' }],
    stockQuantity: 20,
    isFeatured: true,
    description: 'Warm winter gents suit',
    descriptionUrdu: 'سردیوں کا سوٹ',
    rating: 4.9,
    reviewCount: 15,
  },
  {
    id: 'p2',
    sku: 'SCH-W-LINEN-01',
    title: 'Emerald Embroidered Winter Linen',
    titleUrdu: 'کڑھائی دار لیلن',
    gender: 'women',
    category: 'linen',
    categoryLabel: 'Luxury Linen',
    price: 6800,
    wholesalePrice: 5300,
    wholesaleMinQty: 4,
    image: '',
    fabricType: 'Embroidered Luxury Linen',
    fabricTypeUrdu: 'لیلن',
    cutMeters: '3-Piece',
    season: 'Winter',
    weaveQuality: 'Heavy Slub Linen',
    isUnstitched: true,
    colors: [{ name: 'Emerald', hex: '#065f46' }],
    stockQuantity: 12,
    isFeatured: true,
    description: 'Ladies embroidered winter shawl linen suit',
    descriptionUrdu: 'خواتین لیلن سوٹ',
    rating: 5.0,
    reviewCount: 24,
  },
];

test('detectVisitorGeoLocale infers UK/GBP and UAE/AED/Arabic from timezones', () => {
  const uk = detectVisitorGeoLocale('Europe/London', ['en-GB']);
  assert.equal(uk.countryCode, 'GB');
  assert.equal(uk.recommendedCurrency, 'GBP');
  assert.equal(uk.dialCode, '+44');

  const uae = detectVisitorGeoLocale('Asia/Dubai', ['ar-AE']);
  assert.equal(uae.countryCode, 'AE');
  assert.equal(uae.recommendedCurrency, 'AED');
  assert.equal(uae.recommendedLanguage, 'ar');

  const pk = detectVisitorGeoLocale('Asia/Karachi', ['ur-PK']);
  assert.equal(pk.countryCode, 'PK');
  assert.equal(pk.recommendedCurrency, 'PKR');
  assert.equal(pk.recommendedLanguage, 'ur');
});

test('convertCurrency & formatGlobalPrice convert accurately across international currencies', () => {
  const usd = convertCurrency(10000, 'PKR', 'USD', REFERENCE_EXCHANGE_RATES);
  assert.equal(usd, 36);
  const backToPkr = convertCurrency(36, 'USD', 'PKR', REFERENCE_EXCHANGE_RATES);
  assert.equal(Math.round(backToPkr), 10000);

  assert.equal(formatGlobalPrice(10000, 'AED').startsWith('AED '), true);
  assert.equal(formatGlobalPrice(10000, 'EUR').startsWith('€'), true);
});

test('calculateProductUnitPrice applies wholesale pricing on wholesale mode or MOQ', () => {
  const retailSingle = calculateProductUnitPrice(SAMPLE_PRODUCTS[0], 1, 'retail');
  assert.equal(retailSingle.unitPrice, 5200);
  assert.equal(retailSingle.isWholesaleApplied, false);

  const retailMoq = calculateProductUnitPrice(SAMPLE_PRODUCTS[0], 5, 'retail');
  assert.equal(retailMoq.unitPrice, 4100);
  assert.equal(retailMoq.isWholesaleApplied, true);

  const wholesaleSingle = calculateProductUnitPrice(SAMPLE_PRODUCTS[0], 1, 'wholesale');
  assert.equal(wholesaleSingle.unitPrice, 4100);
  assert.equal(wholesaleSingle.isWholesaleApplied, true);
});

test('calculateInternationalShipping quotes local Kotli, UK DHL, and free thresholds', () => {
  const kotli = calculateInternationalShipping(2000, 'PK', 'Kotli', 4500, 'retail');
  assert.equal(kotli.shippingFeePKR, 100);
  assert.equal(kotli.courierName.includes('Kotli'), true);

  const ukPaid = calculateInternationalShipping(15000, 'GB', 'Birmingham', 4500, 'retail');
  assert.equal(ukPaid.shippingFeePKR, 4800);
  assert.equal(ukPaid.courierName.includes('DHL'), true);

  const ukFree = calculateInternationalShipping(50000, 'GB', 'London', 4500, 'retail');
  assert.equal(ukFree.shippingFeePKR, 0);
  assert.equal(ukFree.isFree, true);
});

test('smartSearchAndRecommend matches natural language queries and related products', () => {
  const hits = smartSearchAndRecommend(SAMPLE_PRODUCTS, 'gents winter khaddar', 2);
  assert.equal(hits[0].sku, 'SCH-M-KHADDAR-01');

  const related = smartSearchAndRecommend(SAMPLE_PRODUCTS, SAMPLE_PRODUCTS[0], 2);
  assert.equal(related[0].sku, 'SCH-W-LINEN-01');
});

test('getFabricCareGuide supports khaddar and linen material profiles', () => {
  const khaddarCare = getFabricCareGuide(SAMPLE_PRODUCTS[0]);
  assert.equal(khaddarCare.materialKey, 'khaddar');
  assert.equal(khaddarCare.materialTitleEn.includes('Khaddar'), true);

  const linenCare = getFabricCareGuide(SAMPLE_PRODUCTS[1]);
  assert.equal(linenCare.materialKey, 'linen');
  assert.equal(linenCare.materialTitleEn.includes('Linen'), true);
});

test('buildMaskedPaymentSummary never exposes raw card numbers and formats dual clock cleanly', () => {
  const masked = buildMaskedPaymentSummary('card', { cardLast4: '4532018899114242' });
  assert.equal(masked.paymentStatus, 'authorized');
  assert.equal(masked.paymentReference.includes('4242'), true);
  assert.equal(masked.paymentReference.includes('45320188'), false);

  const clock = formatDualWorldClock('Europe/London', new Date('2026-01-15T12:00:00Z'));
  assert.equal(clock.visitorTime.length > 0, true);
  assert.equal(clock.kotliTime.length > 0, true);
});
