import {
  CartItem,
  CloudInvoice,
  CurrencyCode,
  FilterState,
  InvoiceItem,
  KhataAccount,
  KhataTransaction,
  NewsletterSubscriber,
  Order,
  OrderCustomer,
  Product,
  ProfitReportSummary,
  PurchaseRecord,
  ReportPeriod,
  Supplier,
} from '../types';

export const PROMO_CODES: Record<string, { discountPercent: number; minSpend: number; description: string }> = {
  SITARA15: {
    discountPercent: 15,
    minSpend: 3000,
    description: '15% OFF Kotli Welcome Discount',
  },
  EID20: {
    discountPercent: 20,
    minSpend: 6000,
    description: '20% Special Festive Offer',
  },
  LUXURY10: {
    discountPercent: 10,
    minSpend: 2500,
    description: '10% Sitara Club Discount',
  },
};

import {
  formatGlobalPrice,
  REFERENCE_EXCHANGE_RATES,
} from './globalBusiness';

export const SIMULATED_EXCHANGE_RATES: Record<CurrencyCode, number> = {
  ...REFERENCE_EXCHANGE_RATES,
};

export function formatPKR(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString('en-PK')}`;
}

export function formatPriceByCurrency(
  amountInPKR: number,
  currency: CurrencyCode = 'PKR',
  exchangeRates: Record<CurrencyCode, number> = SIMULATED_EXCHANGE_RATES
): string {
  return formatGlobalPrice(amountInPKR, currency, exchangeRates);
}

export interface CartTotalsResult {
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  appliedPromo?: { code: string; discountPercent: number };
  error?: string;
}

export function calculateCartTotals(
  items: CartItem[],
  promoCode?: string,
  city?: string,
  freeShippingThreshold = 4500
): CartTotalsResult {
  const subtotal = items.reduce((acc, item) => {
    return acc + item.product.price * item.quantity;
  }, 0);

  let discount = 0;
  let appliedPromo: { code: string; discountPercent: number } | undefined;
  let error: string | undefined;

  if (promoCode && promoCode.trim().length > 0) {
    const cleanCode = promoCode.trim().toUpperCase();
    const rule = PROMO_CODES[cleanCode];
    if (rule) {
      if (subtotal >= rule.minSpend) {
        discount = Math.round((subtotal * rule.discountPercent) / 100);
        appliedPromo = { code: cleanCode, discountPercent: rule.discountPercent };
      } else {
        error = `Promo code requires minimum spend of Rs. ${rule.minSpend}`;
      }
    } else {
      error = 'Invalid coupon code';
    }
  }

  // Shipping calculation: Free within Kotli or across Pakistan over threshold
  let shippingFee = 250;
  if (subtotal === 0) {
    shippingFee = 0;
  } else if (subtotal >= freeShippingThreshold) {
    shippingFee = 0;
  } else if (city && city.toLowerCase().includes('kotli')) {
    shippingFee = 100; // Local Kotli special delivery
  }

  const total = Math.max(0, subtotal - discount + shippingFee);

  return {
    subtotal,
    discount,
    shippingFee,
    total,
    appliedPromo,
    error,
  };
}

export function filterProducts(products: Product[], filters: FilterState): Product[] {
  return products.filter((p) => {
    // Search query matches title, Urdu title, SKU, fabric, gender, season, or description (single or multi-token smart match)
    if (filters.searchQuery.trim().length > 0) {
      const q = filters.searchQuery.toLowerCase().trim();
      const haystack = `${p.title} ${p.titleUrdu} ${p.sku} ${p.fabricType} ${p.categoryLabel} ${p.category} ${p.gender} ${p.season} ${p.weaveQuality} ${p.description}`.toLowerCase();
      const directMatch = haystack.includes(q) || p.titleUrdu.includes(q);
      if (!directMatch) {
        const tokens = q.split(/\s+/).filter((t) => t.length >= 2);
        const tokenMatch = tokens.length > 0 && tokens.every((tok) => haystack.includes(tok));
        if (!tokenMatch) return false;
      }
    }

    // Gender
    if (filters.gender !== 'all' && p.gender !== filters.gender) {
      return false;
    }

    // Category
    if (filters.category !== 'all' && p.category !== filters.category) {
      return false;
    }

    // Season
    if (filters.season !== 'all' && p.season !== filters.season) {
      return false;
    }

    // Price
    if (p.price < filters.minPrice || p.price > filters.maxPrice) {
      return false;
    }

    // Availability
    if (filters.onlyInStock && p.stockQuantity <= 0) {
      return false;
    }

    // Flags
    if (filters.onlyNewArrivals && !p.isNewArrival) {
      return false;
    }

    if (filters.onlyOffers && !p.isSpecialOffer && !(p.discountPercent && p.discountPercent > 0)) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'newest':
        return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
      case 'featured':
      default:
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    }
  });
}

export function sanitizePhoneForWhatsApp(phone: string): string {
  // Replace non-digits
  let cleaned = phone.replace(/\D/g, '');
  // If starts with 0 (e.g. 03425984394) convert to 923425984394
  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.slice(1);
  } else if (!cleaned.startsWith('92')) {
    cleaned = '92' + cleaned;
  }
  return cleaned;
}

export function generateSingleProductWhatsAppUrl(
  product: Product,
  quantity = 1,
  selectedColor?: string,
  shopPhone = '03425984394'
): string {
  const targetNumber = sanitizePhoneForWhatsApp(shopPhone);
  const text = 
`*🌟 SITARA CLOTH HOUSE - INQUIRY / DIRECT ORDER 🌟*
----------------------------------------
*Product:* ${product.title} (${product.titleUrdu})
*SKU:* ${product.sku}
*Fabric:* ${product.fabricType} (${product.cutMeters})
*Quality:* ${product.weaveQuality}
*Price:* Rs. ${product.price.toLocaleString()} ${product.originalPrice ? `(Original: Rs. ${product.originalPrice.toLocaleString()})` : ''}
*Quantity:* ${quantity}
${selectedColor ? `*Color/Variant:* ${selectedColor}\n` : ''}----------------------------------------
*Shop Location:* Khudadad Market, Main Bazaar, Kotli, AJK.
Please confirm availability and booking!`;

  return `https://wa.me/${targetNumber}?text=${encodeURIComponent(text)}`;
}

export function generateWhatsAppOrderUrl(order: Order, shopPhone = '03425984394'): string {
  const targetNumber = sanitizePhoneForWhatsApp(shopPhone);
  const itemLines = order.items
    .map(
      (item, idx) =>
        `${idx + 1}. *${item.product.title}* (SKU: ${item.product.sku}) - Qty: ${item.quantity} x Rs. ${item.product.price.toLocaleString()} = Rs. ${(item.quantity * item.product.price).toLocaleString()}`
    )
    .join('\n');

  const text = 
`*🌟 SITARA CLOTH HOUSE - NEW ORDER #${order.orderNumber} 🌟*
----------------------------------------
*Customer Name:* ${order.customer.fullName}
*Phone:* ${order.customer.phone}
*WhatsApp:* ${order.customer.whatsapp || order.customer.phone}
*Delivery Address:* ${order.customer.address}, ${order.customer.city}, ${order.customer.provinceOrState}
${order.customer.notes ? `*Special Note:* ${order.customer.notes}\n` : ''}----------------------------------------
*ITEMS ORDERED:*
${itemLines}
----------------------------------------
*Subtotal:* Rs. ${order.subtotal.toLocaleString()}
${order.discount > 0 ? `*Discount (${order.promoCodeApplied || 'Special'}):* -Rs. ${order.discount.toLocaleString()}\n` : ''}*Delivery Fee:* ${order.shippingFee === 0 ? 'FREE' : `Rs. ${order.shippingFee.toLocaleString()}`}
*GRAND TOTAL:* Rs. ${order.total.toLocaleString()}
*Payment Method:* ${order.paymentMethod.toUpperCase()}
*Date:* ${order.date}
----------------------------------------
Khudadad Market, Main Bazaar, Kotli, Azad Kashmir.`;

  return `https://wa.me/${targetNumber}?text=${encodeURIComponent(text)}`;
}

export function validateOrderCustomer(customer: Partial<OrderCustomer>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!customer.fullName || customer.fullName.trim().length < 3) {
    errors.fullName = 'Full Name is required (minimum 3 characters)';
  }

  if (!customer.phone || customer.phone.replace(/\D/g, '').length < 10) {
    errors.phone = 'Valid phone number is required (e.g., 03425984394)';
  }

  if (!customer.address || customer.address.trim().length < 6) {
    errors.address = 'Complete delivery address is required';
  }

  if (!customer.city || customer.city.trim().length < 2) {
    errors.city = 'City name is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface TimelineStep {
  key: 'pending' | 'processing' | 'shipped' | 'delivered';
  title: string;
  titleUrdu: string;
  description: string;
  descriptionUrdu: string;
  state: 'completed' | 'current' | 'upcoming';
  estimatedTime?: string;
}

export function findOrderByQuery(orders: Order[], query: string): Order | undefined {
  if (!query || !query.trim()) return undefined;
  const clean = query.trim().toUpperCase().replace(/[\s#]/g, '');

  return orders.find((o) => {
    const oNum = o.orderNumber.toUpperCase().replace(/[\s#]/g, '');
    const oId = o.id.toUpperCase();
    if (oNum === clean || oId === clean) return true;
    if (clean.length >= 4 && oNum.endsWith(clean)) return true;
    if (oNum.includes(clean)) return true;
    return false;
  });
}

export function getOrderTimeline(order: Order): {
  isCancelled: boolean;
  activeStepIndex: number;
  steps: TimelineStep[];
} {
  const isCancelled = order.status === 'cancelled';

  let currentIdx = 0;
  if (order.status === 'processing' || order.status === 'confirmed') {
    currentIdx = 1;
  } else if (order.status === 'shipped') {
    currentIdx = 2;
  } else if (order.status === 'delivered') {
    currentIdx = 3;
  }

  const baseSteps: Omit<TimelineStep, 'state'>[] = [
    {
      key: 'pending',
      title: 'Order Placed & Queued',
      titleUrdu: 'آرڈر موصول اور محفوظ',
      description: 'Your order was received at our Kotli showroom and registered in the system.',
      descriptionUrdu: 'آپ کا آرڈر خدام داد مارکیٹ کوٹلی شو روم میں موصول اور رجسٹر ہو چکا ہے۔',
      estimatedTime: order.date,
    },
    {
      key: 'processing',
      title: 'Fabric Processing & Quality Check',
      titleUrdu: 'کپڑے کی جانچ، کٹائی اور پیکنگ',
      description: 'Pure fabric measured, precision cut from roll, inspected for quality, and packaged in luxury box.',
      descriptionUrdu: 'تھان سے کپڑے کی پیمائش، نفاست سے کٹائی اور لگژری ستارہ گفٹ باکس میں پیکنگ۔',
      estimatedTime: 'Within 24 Hours',
    },
    {
      key: 'shipped',
      title: 'Dispatched / In Transit',
      titleUrdu: 'روانہ کر دیا گیا (ان ٹرانزٹ)',
      description: `Dispatched with courier tracking for delivery to ${order.customer.city || 'your address'}.`,
      descriptionUrdu: `${order.customer.city || 'آپ کے پتے'} کے لیے کوریئر کے ذریعے روانہ۔`,
      estimatedTime: '1-3 Business Days',
    },
    {
      key: 'delivered',
      title: 'Delivered to Doorstep',
      titleUrdu: 'کامیابی سے پہنچا دیا گیا',
      description: 'Package delivered safely. Enjoy your exquisite Sitara fabric!',
      descriptionUrdu: 'کپڑا باحفاظت آپ کی دہلیز پر پہنچا دیا گیا ہے۔ مبارک ہو!',
      estimatedTime: 'Delivered',
    },
  ];

  const steps: TimelineStep[] = baseSteps.map((step, idx) => {
    let state: TimelineStep['state'] = 'upcoming';
    if (isCancelled) {
      state = 'upcoming';
    } else if (idx < currentIdx) {
      state = 'completed';
    } else if (idx === currentIdx) {
      state = currentIdx === 3 ? 'completed' : 'current';
    }
    return {
      ...step,
      state,
    };
  });

  return {
    isCancelled,
    activeStepIndex: isCancelled ? -1 : currentIdx,
    steps,
  };
}

export interface NewsletterValidationResult {
  isValid: boolean;
  normalizedEmail: string;
  errorCode?: 'empty' | 'invalid';
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateNewsletterEmail(rawEmail: string): NewsletterValidationResult {
  const normalizedEmail = (rawEmail ?? '').trim().toLowerCase();

  if (!normalizedEmail) {
    return {
      isValid: false,
      normalizedEmail: '',
      errorCode: 'empty',
    };
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return {
      isValid: false,
      normalizedEmail,
      errorCode: 'invalid',
    };
  }

  return {
    isValid: true,
    normalizedEmail,
  };
}

export function isEmailAlreadySubscribed(
  subscribers: NewsletterSubscriber[],
  rawEmail: string
): boolean {
  const normalized = (rawEmail ?? '').trim().toLowerCase();
  if (!normalized) return false;
  return subscribers.some((s) => s.email.trim().toLowerCase() === normalized);
}

// --- SMART CLOUD ERP PURE BUSINESS LOGIC ---

export function calculateKhataBalance(
  openingBalance: number,
  transactions: Pick<KhataTransaction, 'type' | 'amount'>[]
): number {
  const delta = transactions.reduce((sum, tx) => {
    const amt = Math.max(0, Number(tx.amount) || 0);
    return tx.type === 'debit' ? sum + amt : sum - amt;
  }, 0);
  return Math.round((Number(openingBalance) || 0) + delta);
}

export function generateInvoiceNumber(prefix = 'INV-SCH'): string {
  const year = new Date().getFullYear();
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${suffix}`;
}

export function calculateInvoiceTotals(
  items: InvoiceItem[],
  discountInput = 0,
  taxRatePercent = 0,
  paidAmountInput?: number,
  paymentType: CloudInvoice['paymentType'] = 'cash'
): {
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  status: CloudInvoice['status'];
} {
  const subtotal = items.reduce((sum, it) => sum + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0), 0);
  const discount = Math.min(subtotal, Math.max(0, Number(discountInput) || 0));
  const taxableBase = Math.max(0, subtotal - discount);
  const taxAmount = Math.round((taxableBase * Math.max(0, Number(taxRatePercent) || 0)) / 100);
  const total = Math.round(taxableBase + taxAmount);

  let paidAmount =
    paidAmountInput !== undefined
      ? Math.min(total, Math.max(0, Math.round(Number(paidAmountInput) || 0)))
      : paymentType === 'khata_credit'
      ? 0
      : total;

  if (paymentType === 'khata_credit' && paidAmountInput === undefined) {
    paidAmount = 0;
  }

  const dueAmount = Math.max(0, total - paidAmount);
  const status: CloudInvoice['status'] =
    dueAmount === 0 ? 'paid' : paidAmount === 0 ? 'khata' : 'partial';

  return {
    subtotal,
    discount,
    taxAmount,
    total,
    paidAmount,
    dueAmount,
    status,
  };
}

function matchesReportPeriod(dateStr: string, period: ReportPeriod, referenceDateIso: string): boolean {
  const d = (dateStr || '').slice(0, 10);
  const ref = (referenceDateIso || '').slice(0, 10);
  if (!d || !ref) return false;
  if (period === 'daily') return d === ref;
  if (period === 'monthly') return d.slice(0, 7) === ref.slice(0, 7);
  return d.slice(0, 4) === ref.slice(0, 4);
}

export function calculateProfitReport(
  orders: Order[],
  invoices: CloudInvoice[],
  products: Product[],
  purchases: PurchaseRecord[],
  khataAccounts: KhataAccount[],
  suppliers: Supplier[],
  period: ReportPeriod,
  referenceDateIso: string
): ProfitReportSummary {
  const productCostMap = new Map<string, number>();
  products.forEach((p) => {
    const cost = p.costPrice !== undefined ? Number(p.costPrice) : Math.round(Number(p.price) * 0.72);
    productCostMap.set(p.id, cost);
  });

  const periodOrders = orders.filter(
    (o) => o.status !== 'cancelled' && matchesReportPeriod(o.date, period, referenceDateIso)
  );
  const periodInvoices = invoices.filter((inv) =>
    matchesReportPeriod(inv.date, period, referenceDateIso)
  );
  const periodPurchases = purchases.filter((pur) =>
    matchesReportPeriod(pur.date, period, referenceDateIso)
  );

  let grossRevenue = 0;
  let estimatedCOGS = 0;
  const topMap = new Map<string, { title: string; unitsSold: number; revenue: number }>();

  for (const ord of periodOrders) {
    grossRevenue += Number(ord.total) || 0;
    for (const item of ord.items) {
      const qty = Number(item.quantity) || 0;
      const unitCost = productCostMap.get(item.product.id) ?? Math.round((Number(item.product.price) || 0) * 0.72);
      estimatedCOGS += unitCost * qty;
      const prev = topMap.get(item.product.title) || { title: item.product.title, unitsSold: 0, revenue: 0 };
      prev.unitsSold += qty;
      prev.revenue += (Number(item.product.price) || 0) * qty;
      topMap.set(item.product.title, prev);
    }
  }

  for (const inv of periodInvoices) {
    grossRevenue += Number(inv.total) || 0;
    for (const item of inv.items) {
      const qty = Number(item.quantity) || 0;
      const unitCost =
        Number(item.unitCost) > 0
          ? Number(item.unitCost)
          : productCostMap.get(item.productId) ?? Math.round((Number(item.unitPrice) || 0) * 0.72);
      estimatedCOGS += unitCost * qty;
      const prev = topMap.get(item.title) || { title: item.title, unitsSold: 0, revenue: 0 };
      prev.unitsSold += qty;
      prev.revenue += Number(item.lineTotal) || 0;
      topMap.set(item.title, prev);
    }
  }

  const grossProfit = Math.round(grossRevenue - estimatedCOGS);
  const profitMarginPercent =
    grossRevenue > 0 ? Math.round((grossProfit / grossRevenue) * 1000) / 10 : 0;

  const purchaseSpend = periodPurchases.reduce((s, p) => s + (Number(p.totalAmount) || 0), 0);
  const khataReceivablesTotal = khataAccounts.reduce(
    (s, k) => s + Math.max(0, Number(k.currentBalance) || 0),
    0
  );
  const supplierPayablesTotal = suppliers.reduce(
    (s, sup) => s + Math.max(0, Number(sup.balancePayable) || 0),
    0
  );

  const topProducts = Array.from(topMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    period,
    referenceDate: referenceDateIso.slice(0, 10),
    salesCount: periodOrders.length + periodInvoices.length,
    grossRevenue: Math.round(grossRevenue),
    estimatedCOGS: Math.round(estimatedCOGS),
    grossProfit,
    profitMarginPercent,
    purchaseSpend: Math.round(purchaseSpend),
    khataReceivablesTotal: Math.round(khataReceivablesTotal),
    supplierPayablesTotal: Math.round(supplierPayablesTotal),
    topProducts,
  };
}

export type FabricCareMaterialKey =
  | 'boski'
  | 'chiffon'
  | 'lawn'
  | 'karandi'
  | 'khaddar'
  | 'linen'
  | 'latha-cotton'
  | 'wash-wear'
  | 'organza'
  | 'velvet'
  | 'silk'
  | 'wool-shawl'
  | 'general';

export interface FabricCareGuide {
  materialKey: FabricCareMaterialKey;
  materialTitleEn: string;
  materialTitleUr: string;
  badgeEn: string;
  badgeUr: string;
  summaryEn: string;
  summaryUr: string;
  washEn: string;
  washUr: string;
  dryEn: string;
  dryUr: string;
  ironEn: string;
  ironUr: string;
  storageEn: string;
  storageUr: string;
  avoidEn: string;
  avoidUr: string;
  customNote?: string;
}

const FABRIC_CARE_PROFILES: Record<FabricCareMaterialKey, Omit<FabricCareGuide, 'materialKey' | 'customNote'>> = {
  boski: {
    materialTitleEn: 'Pure Mulberry Silk Boski',
    materialTitleUr: 'خالص ملبری ریشم بوسکی',
    badgeEn: 'Delicate Silk Care',
    badgeUr: 'نازک ریشم کی دیکھ بھال',
    summaryEn: 'Pure spun silk fibres retain their natural ivory sheen and soft drape for decades when treated gently.',
    summaryUr: 'خالص کتے ہوئے ریشم کے دھاگے نرمی سے دیکھ بھال کرنے پر برسوں تک اپنی قدرتی چمک اور شاندار فال برقرار رکھتے ہیں۔',
    washEn: 'Dry clean preferred. For home care, gently hand-wash in cool/lukewarm water with mild silk detergent—never scrub or twist.',
    washUr: 'ڈرائی کلین بہترین ہے۔ گھر پر دھونے کے لیے ٹھنڈے یا ہلکے نیم گرم پانی میں نرم سلک ڈٹرجنٹ استعمال کریں—رگڑیں یا نچوڑیں ہرگز نہیں۔',
    dryEn: 'Press water out in a clean towel and air-dry flat in cool shade; direct sunlight dulls natural silk lustre.',
    dryUr: 'پانی نچوڑنے کے بجائے صاف تولیے میں ہلکا سا دبائیں اور سائے میں ہموار بچھا کر خشک کریں؛ تیز دھوپ ریشم کی چمک ماند کر دیتی ہے۔',
    ironEn: 'Iron inside-out at low Silk setting while slightly damp, or place a thin cotton pressing cloth on top.',
    ironUr: 'ہلکی نمی میں الٹی طرف سے کم درجے (Silk سیٹنگ) پر استری کریں، یا اوپر باریک ململ کا کپڑا رکھ لیں۔',
    storageEn: 'Wrap in breathable unbleached muslin (malmal) cloth away from moisture and perfume sprays.',
    storageUr: 'نمی اور پرفیوم کے اسپرے سے بچا کر سانس لینے والے سادہ ململ کے کپڑے میں لپیٹ کر محفوظ رکھیں۔',
    avoidEn: 'Avoid bleach, harsh detergents, tumble drying, wringing, or direct hot iron contact.',
    avoidUr: 'بلیچ، تیز سرف، ڈرائر مشین، کپڑا مروڑنے اور تیز گرم استری سے مکمل پرہیز کریں۔',
  },
  chiffon: {
    materialTitleEn: 'Pure & Embroidered Chiffon',
    materialTitleUr: 'پیور اور کڑھائی دار شفون',
    badgeEn: 'Couture Zari & Sheer Care',
    badgeUr: 'کڑھائی اور شفون کی حفاظت',
    summaryEn: 'Fine twisted crinkle yarns and delicate zari, resham, or sequin work require snag-free maintenance.',
    summaryUr: 'باریک کرینکل دھاگے اور نفیس زری، ریشم یا ستارہ کڑھائی کو دھاگہ کھنچنے سے بچانا ضروری ہوتا ہے۔',
    washEn: 'Dry clean only for embroidered, zari, or mirror-work suits. Plain chiffon may be gently soaked in cold water.',
    washUr: 'کڑھائی، زری یا شیشے کے کام والے سوٹ صرف ڈرائی کلین کرائیں۔ سادہ شفون کو ٹھنڈے پانی میں ہلکا بھگو کر دھویا جا سکتا ہے۔',
    dryEn: 'Lay flat on a clean white sheet in shade. Never hang wet heavily embroidered shirts as weight stretches seams.',
    dryUr: 'سائے میں صاف سفید چادر پر بچھا کر سکھائیں۔ بھاری کڑھائی والی گیلی قمیض کو ہینگر پر نہ لٹکائیں ورنہ کپڑا لٹک سکتا ہے۔',
    ironEn: 'Use low-temperature steam only from the reverse side, keeping the soleplate clear of sequins and tilla.',
    ironUr: 'الٹی طرف سے ہلکی بھاپ (Steam) سے استری کریں اور استری کو ستاروں، موتیوں اور تلے کے کام سے دور رکھیں۔',
    storageEn: 'Fold carefully with tissue or butter paper between embroidered panels inside a garment bag.',
    storageUr: 'کڑھائی والے حصوں کے درمیان ٹشو یا بٹر پیپر رکھ کر تہہ لگائیں اور کپڑے کے گارمنٹ بیگ میں محفوظ کریں۔',
    avoidEn: 'Avoid machine agitation, abrasive brushes, safety pins, or spraying hairspray/itr directly on zari.',
    avoidUr: 'واشنگ مشین، سخت برش، سیفٹی پن اور زری پر براہِ راست عطر یا ہیئر اسپرے کے استعمال سے گریز کریں۔',
  },
  lawn: {
    materialTitleEn: 'Luxury Swiss & Giza Lawn',
    materialTitleUr: 'لگژری سوئس و گیزا لان',
    badgeEn: 'Breathable Summer Cotton',
    badgeUr: 'گرمیوں کی نفيس لان',
    summaryEn: 'High-thread-count combed lawn stays crisp, vibrant, and airy when washed cool before stitching and after wear.',
    summaryUr: 'اعلیٰ کوالٹی کی لان سلائی سے پہلے اور استعمال کے بعد ٹھنڈے پانی سے دھونے پر تروتازہ، نرم اور چمکدار رہتی ہے۔',
    washEn: 'Pre-soak unstitched fabric in plain cold water for 20 minutes before tailoring; wash dark prints separately in cold water.',
    washUr: 'سلائی سے پہلے ان سلا کپڑا 20 منٹ سادہ ٹھنڈے پانی میں بھگو دیں؛ گہرے پرنٹس کو علیحدہ ٹھنڈے پانی اور نرم صابن سے دھوئیں۔',
    dryEn: 'Line-dry inside-out in shade to keep digital and Swiss voile colours vivid.',
    dryUr: 'رنگوں کی تازگی برقرار رکھنے کے لیے کپڑا الٹا کر کے سائے میں سکھائیں۔',
    ironEn: 'Iron at medium-high Cotton setting while lightly misted; use lower heat on attached chiffon/organza dupattas.',
    ironUr: 'ہلکی نمی کے ساتھ درمیانی تیز (Cotton) سیٹنگ پر استری کریں؛ ساتھ موجود شفون یا آرگنزا دوپٹے پر ہلکی استری چلائیں۔',
    storageEn: 'Keep neatly folded in a cool, dry wardrobe away from damp walls.',
    storageUr: 'نمی سے پاک ٹھنڈی اور خشک الماری میں تہہ لگا کر رکھیں۔',
    avoidEn: 'Avoid hot water soaking, chlorine bleach, or prolonged harsh afternoon sun drying.',
    avoidUr: 'گرم پانی میں بھگونے، کلورین بلیچ اور دوپہر کی تیز دھوپ میں سکھانے سے پرہیز کریں۔',
  },
  karandi: {
    materialTitleEn: 'Handloom Winter Karandi',
    materialTitleUr: 'ہینڈلوم ونٹر کرنڈی',
    badgeEn: 'Textured Winter Weave',
    badgeUr: 'سردیوں کی کھڈی بافت',
    summaryEn: 'Double-ply slubbed Karandi weave gives rich winter warmth and character when protected from shrinkage.',
    summaryUr: 'ڈبل تار کھڈی کرنڈی سردیوں میں قدرتی گرمائش دیتی ہے، اور درست دیکھ بھال سے سکڑنے یا رواں آنے سے محفوظ رہتی ہے۔',
    washEn: 'Dry clean or gentle cold hand-wash using liquid wool/cotton detergent without vigorous rubbing.',
    washUr: 'ڈرائی کلین یا نرم لیکوڈ ڈٹرجنٹ کے ساتھ ٹھنڈے پانی میں ہلکے ہاتھ سے دھوئیں۔',
    dryEn: 'Reshape while damp and dry flat or on a wide padded hanger in shade.',
    dryUr: 'ہلکا گیلا ہونے پر ہاتھ سے ہموار کریں اور چوڑے ہینگر یا چادر پر سائے میں خشک کریں۔',
    ironEn: 'Steam iron on medium heat along the grain of the weave; avoid flattening the slub texture excessively.',
    ironUr: 'درمیانی آنچ پر بھاپ والی استری بافت کے رخ کے مطابق چلائیں تاکہ کرنڈی کی قدرتی بناوٹ برقرار رہے۔',
    storageEn: 'Store folded in a dry cotton cover during summer months.',
    storageUr: 'گرمیوں کے موسم میں سوتی کپڑے کے غلاف میں تہہ کر کے محفوظ جگہ رکھیں۔',
    avoidEn: 'Avoid hot water, tumble dryers, and harsh spinning cycles that can shrink handloom yarns.',
    avoidUr: 'گرم پانی، ڈرائر اور تیز اسپن سائیکل سے بچیں ورنہ ہینڈلوم دھاگہ سکڑ سکتا ہے۔',
  },
  khaddar: {
    materialTitleEn: 'Handloom Winter Khaddar',
    materialTitleUr: 'ہینڈلوم ونٹر کھدر',
    badgeEn: 'Artisanal Slub Warmth',
    badgeUr: 'سردیوں کی کھڈی کھدر',
    summaryEn: 'Hand-spun winter Khaddar offers cosy breathability and rich drape—pre-soaking before stitching prevents post-tailoring shrinkage.',
    summaryUr: 'سردیوں کا اصل کھدر گرم اور آرام دہ ہوتا ہے—سلائی سے پہلے پانی میں بھگو لینے سے بعد میں سکڑنے کا خدشہ ختم ہو جاتا ہے۔',
    washEn: 'Pre-soak in cool plain water before tailoring. Wash dark winter shades separately by hand with gentle liquid wash.',
    washUr: 'سلائی سے پہلے ٹھنڈے سادہ پانی میں بھگوئیں۔ گہرے رنگوں کو علیحدہ ٹھنڈے پانی اور نرم صابن سے ہاتھ سے دھوئیں۔',
    dryEn: 'Squeeze lightly without twisting and dry flat or on wide hangers in cool shade.',
    dryUr: 'بغیر نچوڑے ہلکا دبا کر پانی نکالیں اور سائے میں چوڑے ہینگر پر سکھائیں۔',
    ironEn: 'Mist lightly and press with medium-hot steam iron on the reverse side to preserve woven texture.',
    ironUr: 'ہلکی نمی کے ساتھ الٹی طرف سے درمیانی گرم بھاپ والی استری کریں تاکہ کھدر کی قدرتی بناوٹ قائم رہے۔',
    storageEn: 'Keep folded in dry cotton cloth away from humidity during summer.',
    storageUr: 'گرمیوں میں نمی سے محفوظ خشک جگہ سوتی کپڑے میں تہہ کر کے رکھیں۔',
    avoidEn: 'Avoid chlorine bleach, hot water soaking, harsh wringing, and wire brush scrubbing.',
    avoidUr: 'بلیچ، گرم پانی، کپڑا سخت مروڑنے اور برش رگڑنے سے مکمل اجتناب کریں۔',
  },
  linen: {
    materialTitleEn: 'Pure & Embroidered Linen',
    materialTitleUr: 'خالص اور کڑھائی دار لیلن',
    badgeEn: 'Natural Bast Fibre Care',
    badgeUr: 'قدرتی لیلن کی حفاظت',
    summaryEn: 'Crisp yet supple winter and festive Linen grows softer with every gentle wash while holding sharp drape.',
    summaryUr: 'نفیس لیلن ہر دھلائی کے ساتھ مزید نرم اور خوبصورت فال دیتی ہے جب اسے کم درجہ حرارت پر دھویا جائے۔',
    washEn: 'For heavy embroidery dry clean first wear; plain linen may be hand-washed or delicate-washed in lukewarm/cool water.',
    washUr: 'بھاری کڑھائی والا لیلن پہلے ڈرائی کلین کرائیں؛ سادہ لیلن کو ٹھنڈے یا ہلکے نیم گرم پانی میں نرم ڈٹرجنٹ سے دھوئیں۔',
    dryEn: 'Remove promptly while slightly damp and smooth flat or hang in shade to prevent deep creasing.',
    dryUr: 'ہلکا نم ہونے پر نکال کر ہاتھ سے ہموار کریں اور سائے میں لٹکا کر خشک کریں تاکہ گہری شکنیں نہ پڑیں۔',
    ironEn: 'Iron slightly damp at medium Linen/Cotton heat from the reverse side using steam.',
    ironUr: 'ہلکی نمی کی حالت میں الٹی طرف سے بھاپ کے ساتھ درمیانی آنچ پر استری کریں۔',
    storageEn: 'Hang on wooden hangers or roll around tissue sleeves to avoid sharp fold lines.',
    storageUr: 'لکڑی کے ہینگر پر لٹکائیں یا تہوں کے درمیان ٹشو رکھ کر محفوظ کریں۔',
    avoidEn: 'Avoid high-heat tumble drying and over-drying in fierce midday sun.',
    avoidUr: 'زیادہ گرم ڈرائر اور دوپہر کی تیز دھوپ میں زیادہ دیر خشک کرنے سے پرہیز کریں۔',
  },
  'latha-cotton': {
    materialTitleEn: 'Egyptian Giza Cotton Latha',
    materialTitleUr: 'مصری گیزا کاٹن لٹھا',
    badgeEn: 'Crisp Formal Cotton',
    badgeUr: 'نفيس فارمل کاٹن',
    summaryEn: 'Mercerized long-staple white and ivory cotton preserves its regal stiffness and cool finish effortlessly.',
    summaryUr: 'مرسرائزڈ لمبی تار والا سفید اور کریم لٹھا اپنی شاہانہ اکڑ اور ٹھنڈا پن آسانی سے برقرار رکھتا ہے۔',
    washEn: 'Gentle machine or hand-wash in cool/lukewarm water with mild optical-free detergent; wash whites separately.',
    washUr: 'سفید کپڑوں کو علیحدہ ٹھنڈے یا نیم گرم پانی میں ہلکے ڈٹرجنٹ سے ہاتھ یا نرم مشین سائیکل پر دھوئیں۔',
    dryEn: 'Shake out creases and hang immediately in airy shade; sunlight helps brighten pure white only briefly.',
    dryUr: 'دھونے کے فوراً بعد جھٹک کر سائے دار ہوا دار جگہ لٹکائیں؛ سفید رنگ کو تیز دھوپ میں زیادہ دیر نہ چھوڑیں۔',
    ironEn: 'Use optional light starch (maiya) if desired, then press with a high-heat steam cotton iron while slightly damp.',
    ironUr: 'پسند کے مطابق ہلکا سا کلف (مایہ) لگا کر ہلکی نمی میں تیز بھاپ والی کاٹن استری سے چمک دار پریس کریں۔',
    storageEn: 'Hang finished suits on wide wooden hangers inside breathable covers to prevent yellowing.',
    storageUr: 'سلائی شدہ سوٹ چوڑے لکڑی کے ہینگر پر سوتی غلاف میں لٹکائیں تاکہ زردی نہ آئے۔',
    avoidEn: 'Avoid chlorine bleach which weakens mercerized Giza fibres and yellows white cotton over time.',
    avoidUr: 'کلورین بلیچ کے استعمال سے بچیں کیونکہ یہ گیزا کاٹن کے ریشے کمزور کر کے کپڑے کو پیلا کر دیتا ہے۔',
  },
  'wash-wear': {
    materialTitleEn: 'Tropical Wash & Wear',
    materialTitleUr: 'ٹراپیکل واش اینڈ ویئر',
    badgeEn: 'Easy-Care Tailored Blend',
    badgeUr: 'آسان دیکھ بھال بلینڈ',
    summaryEn: 'Wrinkle-resistant micro-poly viscose is engineered for daily elegance with minimal pressing.',
    summaryUr: 'رنکل فری مائیکرو پولی وسکوز روزمرہ پہننے کے لیے بنایا گیا ہے جو کم استری میں بھی تروتازہ رہتا ہے۔',
    washEn: 'Machine wash cold on gentle cycle or hand-wash with regular mild liquid detergent.',
    washUr: 'ٹھنڈے پانی میں نرم مشین سائیکل یا سادہ لیکوڈ ڈٹرجنٹ سے ہاتھ سے دھوئیں۔',
    dryEn: 'Hang directly on a hanger to drip-dry in shade—creases fall out naturally.',
    dryUr: 'نچوڑے بغیر سیدھا ہینگر پر لٹکا کر سائے میں خشک کریں—شکنیں خود بخود ختم ہو جائیں گی۔',
    ironEn: 'Quick touch-up on low Synthetic/Poly setting if needed; avoid high heat to prevent fabric shine.',
    ironUr: 'ضرورت پڑنے پر کم درجے (Synthetic سیٹنگ) پر ہلکی استری کریں؛ تیز گرم استری سے کپڑے پر چمک کا نشان پڑ سکتا ہے۔',
    storageEn: 'Hang on smooth hangers for instant ready-to-wear convenience.',
    storageUr: 'فوری استعمال کے لیے ہموار ہینگر پر لٹکا کر الماری میں رکھیں۔',
    avoidEn: 'Avoid high dryer heat, hot iron plates, and heavy starch.',
    avoidUr: 'زیادہ حرارت والے ڈرائر، تیز گرم استری اور کلف لگانے سے پرہیز کریں۔',
  },
  organza: {
    materialTitleEn: 'Silk Organza & Tissue',
    materialTitleUr: 'سلک آرگنزا اور ٹشو',
    badgeEn: 'Structured Sheer Care',
    badgeUr: 'نازک جالی دار دیکھ بھال',
    summaryEn: 'Crisp, translucent organza holds dramatic silhouettes when kept free of creases and snagging.',
    summaryUr: 'نفیس شفاف آرگنزا شکنوں اور الجھن سے بچا کر رکھنے پر اپنی شاندار ساخت برقرار رکھتا ہے۔',
    washEn: 'Professional dry clean recommended. Never scrub or wring wet organza.',
    washUr: 'پیشہ ورانہ ڈرائی کلین بہترین ہے۔ گیلی آرگنزا کو ہرگز رگڑیں یا مروڑیں نہیں۔',
    dryEn: 'Air-dry flat on a clean towel away from direct sun and heat.',
    dryUr: 'تیز دھوپ اور حرارت سے دور صاف تولیے پر بچھا کر ہوا میں سکھائیں۔',
    ironEn: 'Steam lightly from a short distance or press at lowest Silk setting under a damp muslin barrier cloth.',
    ironUr: 'تھوڑے فاصلے سے ہلکی بھاپ دیں یا اوپر گیلا ململ کا کپڑا رکھ کر سب سے کم حرارت پر استری کریں۔',
    storageEn: 'Store rolled or gently hung inside a soft cloth bag to avoid sharp fold lines.',
    storageUr: 'تیز تہوں کے نشان سے بچنے کے لیے رول کر کے یا نرم کپڑے کے بیگ میں لٹکا کر رکھیں۔',
    avoidEn: 'Avoid sharp jewellery snags, hot steam contact, and folding tightly under heavy garments.',
    avoidUr: 'نوکدار زیورات سے الجھنے، تیز بھاپ اور بھاری کپڑوں کے نیچے دبا کر تہہ کرنے سے بچائیں۔',
  },
  velvet: {
    materialTitleEn: 'Bridal Micro Velvet',
    materialTitleUr: 'برائیڈل مائیکرو ویلوٹ',
    badgeEn: 'Plush Pile Protection',
    badgeUr: 'مخمل کی خصوصی حفاظت',
    summaryEn: 'Rich velvet pile reflects deep jewel tones only when never crushed under a flat iron.',
    summaryUr: 'مخمل کی خوبصورت چمک تب ہی قائم رہتی ہے جب اس کے رواں کو سیدھی استری سے نہ دبایا جائے۔',
    washEn: 'Dry clean only—water and agitation flatten plush velvet fibres and loosen embroidery.',
    washUr: 'صرف ڈرائی کلین کرائیں—پانی اور رگڑ مخمل کے رواں کو بٹھا دیتے ہیں اور کڑھائی متاثر کرتے ہیں۔',
    dryEn: 'Air out briefly in cool indoor shade after wearing before placing back in wardrobe.',
    dryUr: 'پہننے کے بعد الماری میں رکھنے سے پہلے کمرے کی ٹھنڈی ہوا میں کچھ دیر رکھیں۔',
    ironEn: 'Never press directly on the pile! Use a vertical garment steamer from the reverse side only.',
    ironUr: 'مخمل پر براہِ راست استری ہرگز نہ چلائیں! صرف الٹی طرف سے ورٹیکل اسٹیمر سے بھاپ دیں۔',
    storageEn: 'Hang on padded hangers or fold pile-to-pile wrapped in soft cotton without heavy weight on top.',
    storageUr: 'گدی دار ہینگر پر لٹکائیں یا مخمل کی تہہ کو نرم سوتی کپڑے میں لپیٹ کر اوپر وزن رکھے بغیر محفوظ کریں۔',
    avoidEn: 'Avoid flat ironing, home machine washing, folding under heavy winter clothes, or plastic airtight bags.',
    avoidUr: 'سیدھی استری، گھر میں دھلائی، بھاری کپڑوں تلے دبانے اور پلاسٹک کے بند لفافوں سے مکمل پرہیز کریں۔',
  },
  silk: {
    materialTitleEn: 'Pure Raw & Bridal Silk',
    materialTitleUr: 'خالص را اور برائیڈل سلک',
    badgeEn: 'Luxury Silk Maintenance',
    badgeUr: 'ریشم کی لگژری نگہداشت',
    summaryEn: 'Pure silk combines luminous sheen with fluid grace when shielded from perspiration, heat, and harsh chemicals.',
    summaryUr: 'خالص سلک کو پسینے، تیز حرارت اور سخت کیمیکلز سے بچایا جائے تو اس کی چمک اور نفاست قائم رہتی ہے۔',
    washEn: 'Dry clean recommended. If plain silk, gentle cold water rinse with pH-neutral silk wash.',
    washUr: 'ڈرائی کلین بہتر ہے۔ سادہ سلک کو ٹھنڈے پانی میں پی ایچ نیوٹرل سلک واش سے نرمی سے کھنگالیں۔',
    dryEn: 'Roll gently in a towel to blot moisture and dry flat in shade.',
    dryUr: 'تولیے میں ہلکا سا لپیٹ کر نمی جذب کریں اور سائے میں ہموار بچھا کر سکھائیں۔',
    ironEn: 'Iron on the reverse side at Silk temperature while lightly damp; never spray water droplets onto dry silk.',
    ironUr: 'ہلکی نمی میں الٹی طرف سے سلک درجہ حرارت پر استری کریں؛ خشک سلک پر براہِ راست پانی کے قطرے نہ چھڑکیں۔',
    storageEn: 'Store in breathable fabric garment covers away from direct light.',
    storageUr: 'تیز روشنی سے دور سانس لینے والے سوتی گارمنٹ کور میں محفوظ کریں۔',
    avoidEn: 'Avoid water spots, perfume directly on silk, wringing, and bright sunlight.',
    avoidUr: 'پانی کے دھبوں، کپڑے پر براہِ راست پرفیوم، مروڑنے اور تیز دھوپ سے بچائیں۔',
  },
  'wool-shawl': {
    materialTitleEn: 'Kashmiri Pashmina & Wool Shawl',
    materialTitleUr: 'کشمیری پشمینہ اور اونی شال',
    badgeEn: 'Heritage Wool & Cashmere Care',
    badgeUr: 'پشمینہ اور اون کی حفاظت',
    summaryEn: 'Ultra-fine Kashmiri wool and pashmina fibres stay featherlight, warm, and pill-free with gentle seasonal care.',
    summaryUr: 'کشمیری پشمینہ اور خالص اون کے باریک ریشے نرم موسمی دیکھ بھال سے ہلکے، گرم اور بر سے پاک رہتے ہیں۔',
    washEn: 'Strictly dry clean only, especially shawls with handwoven zari or sozni borders.',
    washUr: 'صرف اور صرف ڈرائی کلین کرائیں، خاص طور پر زری یا سوزنی کڑھائی والے بارڈر والی شالیں۔',
    dryEn: 'After wear, air flat indoors to release natural moisture before folding.',
    dryUr: 'استعمال کے بعد تہہ کرنے سے پہلے کمرے میں ہموار بچھا کر ہوا لگوا لیں۔',
    ironEn: 'Light steam press on Wool setting through a damp cotton cloth—never drag a hot iron across border work.',
    ironUr: 'اوپر ہلکا گیلا سوتی کپڑا رکھ کر وول سیٹنگ پر ہلکی بھاپ سے استری کریں—بارڈر پر گرم استری نہ گھسیٹیں۔',
    storageEn: 'Store folded inside breathable muslin with natural cedarwood blocks or dried neem/lavender leaves.',
    storageUr: 'ململ کے کپڑے میں تہہ کر کے قدرتی دیودار کی لکڑی یا نیم/لیونڈر کے خشک پتوں کے ساتھ محفوظ رکھیں۔',
    avoidEn: 'Avoid hot water, machine washing, hanging on thin wire hangers, and naphthalene mothballs directly touching wool.',
    avoidUr: 'گرم پانی، واشنگ مشین، پتلے تار والے ہینگر اور اون سے براہِ راست فینائل کی گولیاں ٹکرانے سے بچائیں۔',
  },
  general: {
    materialTitleEn: 'Heritage Luxury Textile',
    materialTitleUr: 'اعلیٰ معیار کا لگژری کپڑا',
    badgeEn: 'Sitara Fabric Care',
    badgeUr: 'ستارہ فیبرک کیئر',
    summaryEn: 'Follow gentle textile care to preserve weave integrity, drape, and rich colour depth.',
    summaryUr: 'کپڑے کی بافت، رنگ اور پائیداری برقرار رکھنے کے لیے نرم اور محتاط دیکھ بھال اپنائیں۔',
    washEn: 'Dry clean or gentle cold hand-wash with mild detergent; always test dark shades separately first.',
    washUr: 'ڈرائی کلین یا نرم ڈٹرجنٹ کے ساتھ ٹھنڈے پانی میں ہلکے ہاتھ سے دھوئیں؛ گہرے رنگ ہمیشہ علیحدہ دھوئیں۔',
    dryEn: 'Dry inside-out in shade to protect weave fibres and vibrancy.',
    dryUr: 'ریشوں اور رنگ کی حفاظت کے لیے کپڑا الٹا کر کے سائے میں خشک کریں۔',
    ironEn: 'Iron on the reverse side at low-to-medium heat appropriate for the weave.',
    ironUr: 'بافت کے مطابق کم یا درمیانی حرارت پر الٹی طرف سے استری کریں۔',
    storageEn: 'Store cleanly folded in a dry, well-ventilated wardrobe.',
    storageUr: 'خشک اور ہوا دار الماری میں صاف تہہ لگا کر محفوظ رکھیں۔',
    avoidEn: 'Avoid bleach, harsh wringing, and tumble drying.',
    avoidUr: 'بلیچ، سخت مروڑنے اور ڈرائر مشین کے استعمال سے پرہیز کریں۔',
  },
};

export function resolveFabricMaterialKey(
  product: Pick<Product, 'category' | 'fabricType' | 'weaveQuality'>
): FabricCareMaterialKey {
  const cat = (product.category || '').toLowerCase() as FabricCareMaterialKey;
  if (cat && cat !== ('all' as string) && cat in FABRIC_CARE_PROFILES) {
    return cat;
  }

  const text = `${product.fabricType || ''} ${product.weaveQuality || ''}`.toLowerCase();
  if (text.includes('boski')) return 'boski';
  if (text.includes('chiffon')) return 'chiffon';
  if (text.includes('khaddar') || text.includes('khaddi')) return 'khaddar';
  if (text.includes('linen')) return 'linen';
  if (text.includes('lawn') || text.includes('voile')) return 'lawn';
  if (text.includes('karandi')) return 'karandi';
  if (text.includes('latha') || text.includes('giza') || text.includes('cotton')) return 'latha-cotton';
  if (text.includes('wash') || text.includes('viscose') || text.includes('tropical')) return 'wash-wear';
  if (text.includes('organza') || text.includes('tissue')) return 'organza';
  if (text.includes('velvet')) return 'velvet';
  if (text.includes('pashmina') || text.includes('shawl') || text.includes('wool') || text.includes('cashmere')) {
    return 'wool-shawl';
  }
  if (text.includes('silk')) return 'silk';
  return 'general';
}

export function getFabricCareGuide(
  product: Pick<Product, 'category' | 'fabricType' | 'weaveQuality' | 'careInstructions'>
): FabricCareGuide {
  const materialKey = resolveFabricMaterialKey(product);
  const profile = FABRIC_CARE_PROFILES[materialKey];
  const customNote = product.careInstructions?.trim() || undefined;

  return {
    materialKey,
    ...profile,
    customNote,
  };
}




