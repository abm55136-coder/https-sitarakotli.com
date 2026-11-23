import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartTotals,
  calculateInvoiceTotals,
  calculateKhataBalance,
  calculateProfitReport,
  filterProducts,
  formatPKR,
  formatPriceByCurrency,
  generateInvoiceNumber,
  generateSingleProductWhatsAppUrl,
  generateWhatsAppOrderUrl,
  sanitizePhoneForWhatsApp,
  validateOrderCustomer,
  findOrderByQuery,
  getOrderTimeline,
  validateNewsletterEmail,
  isEmailAlreadySubscribed,
  getFabricCareGuide,
  resolveFabricMaterialKey,
  SIMULATED_EXCHANGE_RATES,
} from './logic';
import {
  CartItem,
  CloudInvoice,
  FilterState,
  KhataAccount,
  NewsletterSubscriber,
  Order,
  Product,
  PurchaseRecord,
  Supplier,
} from '../types';

const mockProductA: Product = {
  id: 'p1',
  sku: 'SCH-M-01',
  title: 'Pure Chinese Boski Silk',
  titleUrdu: 'خالص چینی بوسکی ریشم',
  gender: 'men',
  category: 'boski',
  categoryLabel: 'Pure Boski',
  price: 5500,
  costPrice: 3800,
  originalPrice: 6500,
  discountPercent: 15,
  image: 'https://example.com/boski.jpg',
  fabricType: 'Pure Silk Boski (8-Pound)',
  fabricTypeUrdu: 'خالص ریشمی بوسکی',
  cutMeters: '4.5 Meters (Full Suit)',
  season: 'All-Season',
  weaveQuality: '100% Pure Mulberry Silk',
  isUnstitched: true,
  colors: [{ name: 'Cream Ivory', hex: '#FFFFF0' }],
  stockQuantity: 12,
  isFeatured: true,
  isNewArrival: true,
  description: 'Authentic 8-pound royal Chinese Boski suit.',
  descriptionUrdu: 'اصلی 8 پاؤنڈ شاہی چینی بوسکی سوٹ۔',
  rating: 4.9,
  reviewCount: 38,
};

const mockProductB: Product = {
  id: 'p2',
  sku: 'SCH-W-02',
  title: 'Chiffon Embroidered 3-Piece',
  titleUrdu: 'شفون کڑھائی تھری پیس',
  gender: 'women',
  category: 'chiffon',
  categoryLabel: 'Luxury Chiffon',
  price: 4200,
  costPrice: 3000,
  image: 'https://example.com/chiffon.jpg',
  fabricType: 'Pure Crinkle Chiffon',
  fabricTypeUrdu: 'پیور کرینکل شفون',
  cutMeters: '3-Piece',
  season: 'Festive',
  weaveQuality: 'Hand Embroidered Zari & Sequins',
  isUnstitched: true,
  colors: [{ name: 'Emerald', hex: '#005522' }],
  stockQuantity: 5,
  isFeatured: false,
  isNewArrival: false,
  description: 'Festive wedding wear with embroidered dupatta.',
  descriptionUrdu: 'شادی بیاہ کے لیے نفیس کڑھائی والا سوٹ۔',
  rating: 4.8,
  reviewCount: 19,
};

test('formatPKR formats currency correctly', () => {
  assert.equal(formatPKR(5500), 'Rs. 5,500');
  assert.equal(formatPKR(0), 'Rs. 0');
});

test('formatPriceByCurrency converts and formats between PKR, USD, and GBP', () => {
  assert.equal(formatPriceByCurrency(8500, 'PKR'), 'Rs. 8,500');
  assert.equal(formatPriceByCurrency(8500, 'USD', SIMULATED_EXCHANGE_RATES), '$30.60');
  assert.equal(formatPriceByCurrency(8500, 'GBP', SIMULATED_EXCHANGE_RATES), '£23.80');
  assert.equal(formatPriceByCurrency(0, 'USD'), '$0.00');
  assert.equal(formatPriceByCurrency(0, 'GBP'), '£0.00');
});

test('calculateCartTotals calculates subtotal, discounts and shipping', () => {
  const items: CartItem[] = [{ product: mockProductA, quantity: 1 }];
  const res1 = calculateCartTotals(items, undefined, 'Kotli');
  assert.equal(res1.subtotal, 5500);
  assert.equal(res1.shippingFee, 0);
  assert.equal(res1.discount, 0);
  assert.equal(res1.total, 5500);

  const res2 = calculateCartTotals(items, 'SITARA15');
  assert.equal(res2.discount, Math.round(5500 * 0.15));
  assert.equal(res2.total, 5500 - 825);
  assert.equal(res2.appliedPromo?.code, 'SITARA15');

  const cheapItem: CartItem = { product: { ...mockProductA, price: 1500 }, quantity: 1 };
  const res3 = calculateCartTotals([cheapItem], undefined, 'Kotli Azad Kashmir');
  assert.equal(res3.shippingFee, 100);
  assert.equal(res3.total, 1600);
});

test('sanitizePhoneForWhatsApp transforms Pakistani numbers to international format', () => {
  assert.equal(sanitizePhoneForWhatsApp('03425984394'), '923425984394');
  assert.equal(sanitizePhoneForWhatsApp('+92 342 5984394'), '923425984394');
  assert.equal(sanitizePhoneForWhatsApp('923425984394'), '923425984394');
});

test('generateSingleProductWhatsAppUrl includes SKU, price and shop number', () => {
  const url = generateSingleProductWhatsAppUrl(mockProductA, 2, 'Cream Ivory', '03425984394');
  assert.ok(url.includes('923425984394'));
  assert.ok(url.includes('SCH-M-01'));
  assert.ok(url.includes('Pure%20Chinese%20Boski%20Silk'));
  assert.ok(url.includes('Khudadad%20Market'));
});

test('generateWhatsAppOrderUrl includes full order receipt and total', () => {
  const order: Order = {
    id: 'ord-123',
    orderNumber: 'SCH-2026-101',
    date: '2026-11-03',
    customer: {
      fullName: 'Muhammad Rizwan',
      phone: '03425984394',
      whatsapp: '03425984394',
      address: 'Near Degree College, Main Road',
      city: 'Kotli',
      provinceOrState: 'Azad Kashmir',
    },
    items: [{ product: mockProductA, quantity: 1 }],
    subtotal: 5500,
    discount: 500,
    shippingFee: 0,
    total: 5000,
    paymentMethod: 'cod',
    status: 'pending',
  };

  const url = generateWhatsAppOrderUrl(order, '03425984394');
  assert.ok(url.includes('SCH-2026-101'));
  assert.ok(url.includes('Muhammad%20Rizwan'));
  assert.ok(url.includes('5%2C000'));
});

test('filterProducts correctly filters by gender, category, and search query', () => {
  const products = [mockProductA, mockProductB];
  const baseFilter: FilterState = {
    searchQuery: '',
    gender: 'all',
    category: 'all',
    season: 'all',
    minPrice: 0,
    maxPrice: 50000,
    onlyInStock: false,
    onlyNewArrivals: false,
    onlyOffers: false,
    sortBy: 'featured',
  };

  assert.equal(filterProducts(products, { ...baseFilter, gender: 'men' }).length, 1);
  assert.equal(filterProducts(products, { ...baseFilter, searchQuery: 'chiffon' }).length, 1);
  assert.equal(filterProducts(products, { ...baseFilter, searchQuery: 'بوسکی' }).length, 1);
});

test('validateOrderCustomer validates required fields', () => {
  const invalid = validateOrderCustomer({ fullName: 'A' });
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.fullName);
  assert.ok(invalid.errors.phone);

  const valid = validateOrderCustomer({
    fullName: 'Zubair Ahmed',
    phone: '03425984394',
    address: 'Bazaar Road, Sector B3',
    city: 'Kotli',
  });
  assert.equal(valid.isValid, true);
  assert.equal(Object.keys(valid.errors).length, 0);
});

test('findOrderByQuery locates order by full ID, lowercase, partial number, or without prefix', () => {
  const sampleOrder: Order = {
    id: 'ord-8941',
    orderNumber: 'SCH-2026-8941',
    date: '2026-11-03',
    customer: {
      fullName: 'Chaudhry Bilal',
      phone: '03425984394',
      whatsapp: '03425984394',
      address: 'Main Bazaar',
      city: 'Kotli',
      provinceOrState: 'Azad Kashmir',
    },
    items: [],
    subtotal: 8500,
    discount: 1275,
    shippingFee: 0,
    total: 7225,
    paymentMethod: 'cod',
    status: 'shipped',
  };

  const list = [sampleOrder];
  assert.equal(findOrderByQuery(list, 'SCH-2026-8941')?.id, 'ord-8941');
  assert.equal(findOrderByQuery(list, ' #sch-2026-8941 ')?.id, 'ord-8941');
  assert.equal(findOrderByQuery(list, '8941')?.id, 'ord-8941');
  assert.equal(findOrderByQuery(list, 'SCH-9999-0000'), undefined);
});

test('getOrderTimeline provides 4 stages with correct completed/current states', () => {
  const baseOrder: Order = {
    id: 'ord-1',
    orderNumber: 'SCH-2026-1001',
    date: '2026-11-03',
    customer: {
      fullName: 'Sardar Naveed',
      phone: '03425984394',
      whatsapp: '03425984394',
      address: 'Sector B2',
      city: 'Kotli',
      provinceOrState: 'Azad Kashmir',
    },
    items: [],
    subtotal: 5000,
    discount: 0,
    shippingFee: 0,
    total: 5000,
    paymentMethod: 'cod',
    status: 'shipped',
  };

  const timeline = getOrderTimeline(baseOrder);
  assert.equal(timeline.isCancelled, false);
  assert.equal(timeline.steps.length, 4);
  assert.equal(timeline.steps[0].state, 'completed');
  assert.equal(timeline.steps[1].state, 'completed');
  assert.equal(timeline.steps[2].state, 'current');
  assert.equal(timeline.steps[3].state, 'upcoming');

  const cancelledOrder: Order = { ...baseOrder, status: 'cancelled' };
  const cancelTimeline = getOrderTimeline(cancelledOrder);
  assert.equal(cancelTimeline.isCancelled, true);
  assert.equal(cancelTimeline.activeStepIndex, -1);
});

test('validateNewsletterEmail validates empty, malformed, and valid emails', () => {
  assert.equal(validateNewsletterEmail('   ').errorCode, 'empty');
  assert.equal(validateNewsletterEmail('invalid-email.com').errorCode, 'invalid');
  assert.equal(validateNewsletterEmail('user@domain').errorCode, 'invalid');

  const validRes = validateNewsletterEmail('  Customer@SitaraKotli.COM  ');
  assert.equal(validRes.isValid, true);
  assert.equal(validRes.normalizedEmail, 'customer@sitarakotli.com');
});

test('isEmailAlreadySubscribed detects case-insensitive duplicate emails', () => {
  const existing: NewsletterSubscriber[] = [
    {
      id: 'sub-1',
      email: 'vip@sitarakotli.com',
      subscribedAt: '2026-11-14T10:00:00Z',
      promoCode: 'LUXURY10',
    },
  ];
  assert.equal(isEmailAlreadySubscribed(existing, 'VIP@sitarakotli.com '), true);
  assert.equal(isEmailAlreadySubscribed(existing, 'new@sitarakotli.com'), false);
  assert.equal(isEmailAlreadySubscribed(existing, ''), false);
});

test('calculateKhataBalance computes net receivables across opening, debit (Udhar), and credit (Wasooli)', () => {
  const balance = calculateKhataBalance(5000, [
    { type: 'debit', amount: 8500 },
    { type: 'credit', amount: 3000 },
    { type: 'debit', amount: 1500 },
  ]);
  assert.equal(balance, 12000);
});

test('calculateInvoiceTotals calculates cash, partial, and Khata credit invoice states accurately', () => {
  const items = [
    {
      productId: 'p1',
      sku: 'SCH-M-01',
      title: 'Pure Chinese Boski Silk',
      quantity: 2,
      unitPrice: 5500,
      unitCost: 3800,
      lineTotal: 11000,
    },
  ];

  const paidRes = calculateInvoiceTotals(items, 1000, 0, undefined, 'cash');
  assert.equal(paidRes.subtotal, 11000);
  assert.equal(paidRes.total, 10000);
  assert.equal(paidRes.paidAmount, 10000);
  assert.equal(paidRes.dueAmount, 0);
  assert.equal(paidRes.status, 'paid');

  const khataRes = calculateInvoiceTotals(items, 0, 0, 0, 'khata_credit');
  assert.equal(khataRes.total, 11000);
  assert.equal(khataRes.dueAmount, 11000);
  assert.equal(khataRes.status, 'khata');

  const partialRes = calculateInvoiceTotals(items, 0, 0, 4000, 'cash');
  assert.equal(partialRes.paidAmount, 4000);
  assert.equal(partialRes.dueAmount, 7000);
  assert.equal(partialRes.status, 'partial');

  assert.ok(generateInvoiceNumber().startsWith('INV-SCH-'));
});

test('calculateProfitReport aggregates daily, monthly, and yearly sales, COGS profit, and Khata balances', () => {
  const orders: Order[] = [
    {
      id: 'o1',
      orderNumber: 'SCH-1',
      date: '2026-11-14',
      customer: {
        fullName: 'Ali',
        phone: '03425984394',
        whatsapp: '03425984394',
        address: 'Kotli',
        city: 'Kotli',
        provinceOrState: 'AJK',
      },
      items: [{ product: mockProductA, quantity: 1 }],
      subtotal: 5500,
      discount: 0,
      shippingFee: 0,
      total: 5500,
      paymentMethod: 'cod',
      status: 'delivered',
    },
    {
      id: 'o2',
      orderNumber: 'SCH-2',
      date: '2026-11-02',
      customer: {
        fullName: 'Usman',
        phone: '03425984394',
        whatsapp: '03425984394',
        address: 'Mirpur',
        city: 'Mirpur',
        provinceOrState: 'AJK',
      },
      items: [{ product: mockProductB, quantity: 1 }],
      subtotal: 4200,
      discount: 0,
      shippingFee: 0,
      total: 4200,
      paymentMethod: 'cod',
      status: 'cancelled',
    },
  ];

  const invoices: CloudInvoice[] = [
    {
      id: 'inv1',
      invoiceNumber: 'INV-SCH-2026-1001',
      date: '2026-11-14',
      customerName: 'HajiTariq',
      items: [
        {
          productId: 'p2',
          sku: 'SCH-W-02',
          title: 'Chiffon Embroidered 3-Piece',
          quantity: 2,
          unitPrice: 4200,
          unitCost: 3000,
          lineTotal: 8400,
        },
      ],
      subtotal: 8400,
      discount: 0,
      taxAmount: 0,
      total: 8400,
      paidAmount: 8400,
      dueAmount: 0,
      paymentType: 'cash',
      status: 'paid',
    },
  ];

  const purchases: PurchaseRecord[] = [
    {
      id: 'pur1',
      supplierId: 'sup1',
      supplierName: 'Faisalabad Mills',
      billNumber: 'FM-900',
      date: '2026-11-14',
      items: [{ productTitle: 'Boski Thaan', quantity: 10, unitCost: 3500, lineTotal: 35000 }],
      totalAmount: 35000,
      paidAmount: 20000,
      balanceDue: 15000,
    },
  ];

  const khataAccounts: KhataAccount[] = [
    {
      id: 'k1',
      customerName: 'Raja Tariq',
      phone: '03421112233',
      openingBalance: 0,
      currentBalance: 6500,
      lastActivityDate: '2026-11-14',
    },
  ];

  const suppliers: Supplier[] = [
    {
      id: 'sup1',
      name: 'Haji Yaqoob',
      companyName: 'Faisalabad Mills',
      phone: '03001234567',
      totalPurchased: 35000,
      balancePayable: 15000,
    },
  ];

  const daily = calculateProfitReport(
    orders,
    invoices,
    [mockProductA, mockProductB],
    purchases,
    khataAccounts,
    suppliers,
    'daily',
    '2026-11-14'
  );
  assert.equal(daily.salesCount, 2);
  assert.equal(daily.grossRevenue, 5500 + 8400);
  assert.equal(daily.estimatedCOGS, 3800 + 6000);
  assert.equal(daily.grossProfit, 13900 - 9800);
  assert.equal(daily.purchaseSpend, 35000);
  assert.equal(daily.khataReceivablesTotal, 6500);
  assert.equal(daily.supplierPayablesTotal, 15000);
  assert.equal(daily.topProducts[0].title, 'Chiffon Embroidered 3-Piece');
});

test('getFabricCareGuide returns material-specific washing, drying, ironing, storage, and avoid rules', () => {
  const boskiGuide = getFabricCareGuide({
    ...mockProductA,
    careInstructions: 'Dry clean recommended before Eid.',
  });
  assert.equal(boskiGuide.materialKey, 'boski');
  assert.match(boskiGuide.washEn, /mild silk detergent/i);
  assert.match(boskiGuide.ironEn, /Silk setting/i);
  assert.equal(boskiGuide.customNote, 'Dry clean recommended before Eid.');

  const chiffonGuide = getFabricCareGuide(mockProductB);
  assert.equal(chiffonGuide.materialKey, 'chiffon');
  assert.match(chiffonGuide.washEn, /Dry clean only/i);
  assert.match(chiffonGuide.avoidEn, /sequins|zari/i);

  const lawnGuide = getFabricCareGuide({
    category: 'lawn',
    fabricType: 'Swiss Voile Lawn',
    weaveQuality: 'Combed Cotton',
  });
  assert.equal(lawnGuide.materialKey, 'lawn');
  assert.match(lawnGuide.washEn, /Pre-soak unstitched fabric/i);

  // Keyword inference when category is generic ('all')
  assert.equal(
    resolveFabricMaterialKey({
      category: 'all',
      fabricType: 'Kashmiri Pashmina Shawl',
      weaveQuality: 'Merino Wool',
    }),
    'wool-shawl'
  );
  assert.equal(
    resolveFabricMaterialKey({
      category: 'all',
      fabricType: 'Bridal Micro Velvet',
      weaveQuality: '9000 Velvet',
    }),
    'velvet'
  );
  assert.equal(
    resolveFabricMaterialKey({
      category: 'all',
      fabricType: 'Unlisted Specialty Weave',
      weaveQuality: 'Custom Loom',
    }),
    'general'
  );
});



