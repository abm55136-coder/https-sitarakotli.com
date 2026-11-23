export type Language = 'en' | 'ur' | 'ar' | 'hi' | 'pa' | 'fr' | 'es' | 'de' | 'tr' | 'zh';

export type BuyingMode = 'retail' | 'wholesale';

export type GenderCategory = 'all' | 'men' | 'women' | 'kids';

export type FabricCategory = 
  | 'all'
  | 'boski'
  | 'karandi'
  | 'khaddar'
  | 'linen'
  | 'latha-cotton'
  | 'wash-wear'
  | 'chiffon'
  | 'lawn'
  | 'organza'
  | 'velvet'
  | 'silk'
  | 'wool-shawl';

export type Season = 'Summer' | 'Winter' | 'All-Season' | 'Festive';

export interface Product {
  id: string;
  sku: string;
  title: string;
  titleUrdu: string;
  gender: 'men' | 'women' | 'kids';
  category: FabricCategory;
  categoryLabel: string;
  price: number;
  costPrice?: number;
  originalPrice?: number;
  wholesalePrice?: number;
  wholesaleMinQty?: number;
  discountPercent?: number;
  image: string;
  additionalImages?: string[];
  videoUrl?: string;
  fabricType: string;
  fabricTypeUrdu: string;
  cutMeters: string; // e.g. "4.5 Meters (Suit)", "3-Piece (Shirt 3m, Dupatta 2.5m, Trouser 2.5m)"
  season: Season;
  weaveQuality: string; // e.g. "100% Pure Mulberry Silk 8-Pound", "Premium Mercerized Giza Cotton"
  isUnstitched: boolean;
  availableSizes?: string[]; // for stitched / kids
  colors: { name: string; hex: string }[];
  stockQuantity: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isSpecialOffer?: boolean;
  description: string;
  descriptionUrdu: string;
  careInstructions?: string;
  rating: number;
  reviewCount: number;
  listingType?: 'fabric' | 'property' | 'vehicle' | 'business';
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  sellerName?: string;
  sellerPhone?: string;
  location?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  customNotes?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export type OrderPaymentMethod =
  | 'cod'
  | 'easypaisa'
  | 'jazzcash'
  | 'bank_transfer'
  | 'whatsapp'
  | 'card'
  | 'paypal'
  | 'apple_pay'
  | 'swift_wire';

export interface OrderCustomer {
  fullName: string;
  phone: string;
  whatsapp: string;
  email?: string;
  address: string;
  city: string;
  provinceOrState: string;
  country?: string;
  countryCode?: string;
  dialCode?: string;
  timezone?: string;
  postalCode?: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  customerUid?: string;
  salesmanUid?: string;
  customer: OrderCustomer;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  orderCurrency?: CurrencyCode;
  exchangeRate?: number;
  promoCodeApplied?: string;
  paymentMethod: OrderPaymentMethod;
  paymentStatus?: 'pending' | 'authorized' | 'paid' | 'cod_due';
  paymentReference?: string;
  courier?: string;
  buyingMode?: BuyingMode;
  status: OrderStatus;
  whatsappNotificationSent?: boolean;
}

export interface Review {
  id: string;
  userId?: string;
  author: string;
  authorLocation: string; // e.g. "Main Bazaar Kotli", "Mirpur AJK", "Birmingham UK"
  rating: number;
  date: string;
  comment: string;
  commentUrdu?: string;
  verifiedPurchase: boolean;
  productTitle?: string;
}

export interface ShopProfile {
  name: string;
  nameUrdu: string;
  slogan: string;
  sloganUrdu: string;
  address: string;
  addressUrdu: string;
  market: string;
  city: string;
  region: string;
  country: string;
  phone: string;
  whatsapp: string;
  email: string;
  announcementEn: string;
  announcementUr: string;
  openingHours: string;
  fridayHours: string;
  googleMapUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  freeShippingThreshold: number;
  ownerName: string;
  ownerNameUrdu: string;
}

export interface CustomerUser {
  id: string;
  uid?: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
  countryCode?: string;
  timezone?: string;
  preferredLanguage?: Language;
  preferredCurrency?: CurrencyCode;
  photoURL?: string;
  emailVerified?: boolean;
  role: 'customer' | 'admin' | 'manager' | 'salesman';
}

export interface FilterState {
  searchQuery: string;
  gender: GenderCategory;
  category: FabricCategory;
  season: 'all' | Season;
  minPrice: number;
  maxPrice: number;
  onlyInStock: boolean;
  onlyNewArrivals: boolean;
  onlyOffers: boolean;
  sortBy: 'featured' | 'price-low' | 'price-high' | 'rating' | 'newest';
}

export interface AdminProfile {
  name: string;
  nameUrdu: string;
  role: string;
  email: string;
  phone: string;
  avatar: string;
  passcode: string;
  lastLogin?: string;
  bio?: string;
  coverImage?: string;
}

export type MediaCategory = 'fabrics' | 'property' | 'vehicles' | 'business' | 'banners' | 'profiles';

export interface MediaAsset {
  id: string;
  title: string;
  url: string;
  category: MediaCategory;
  source: 'gallery' | 'camera' | 'upload' | 'sample';
  sizeBytes?: number;
  width?: number;
  height?: number;
  uploadDate: string;
  description?: string;
  tags?: string[];
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'seller' | 'admin';
  status: 'active' | 'suspended';
  joinedDate: string;
  listingsCount: number;
}

export type BannerCollection = 'all' | 'men' | 'women' | 'kids' | 'unstitched';
export type BannerBadgeType = 'sale' | 'new' | 'discount' | 'luxury' | 'festive';
export type BannerActionType = 'shop' | 'category' | 'product' | 'contact' | 'whatsapp';

export interface BannerItem {
  id: string;
  title: string;
  titleUrdu: string;
  subtitle: string;
  subtitleUrdu: string;
  description?: string;
  descriptionUrdu?: string;
  badgeText?: string;
  badgeUrdu?: string;
  badgeType: BannerBadgeType;
  imageUrl: string;
  mobileImageUrl?: string;
  categoryTarget: BannerCollection;
  fabricCategory?: FabricCategory;
  linkedProductId?: string;
  primaryButtonText: string;
  primaryButtonTextUrdu?: string;
  primaryButtonAction: BannerActionType;
  secondaryButtonText?: string;
  secondaryButtonTextUrdu?: string;
  secondaryButtonAction?: 'whatsapp' | 'contact' | 'reviews' | 'location';
  discountPercent?: number;
  startDate?: string;
  expiryDate?: string;
  isActive: boolean;
  order: number;
  textAlignment?: 'left' | 'center' | 'right';
  overlayDarkness?: number;
}

export interface BannerSliderSettings {
  autoPlay: boolean;
  slideInterval: number;
  pauseOnHover: boolean;
  transitionEffect: 'slide' | 'fade';
  showArrows: boolean;
  showIndicators: boolean;
  showCollectionFilterTabs: boolean;
}

// --- LOGO CONFIGURATION & UPGRADE TYPES ---
export type LogoShape = 'crest' | 'round' | 'shield' | 'diamond' | 'minimal';
export type LogoIconType = 'sparkles' | 'crown' | 'star' | 'diamond' | 'scissors' | 'feather' | 'custom_image';

export interface LogoConfig {
  type: 'icon_emblem' | 'custom_image';
  icon: LogoIconType;
  shape: LogoShape;
  imageUrl?: string;
  primaryText: string; // e.g. "SITARA"
  secondaryText: string; // e.g. "CLOTH HOUSE"
  urduText: string; // e.g. "ستارہ کلاٹھ ہاؤس"
  subtext: string; // e.g. "KOTLI • AZAD KASHMIR"
  accentColor: string; // hex color for logo emblem border/accent
  badgeText?: string; // e.g. "EST. 1998" or "KOTLI"
  showUrdu: boolean;
  sizeScale: 'compact' | 'standard' | 'prominent';
}

// --- THEME TYPES ---
export type ThemeId =
  | 'midnight-gold'
  | 'emerald-gold'
  | 'ruby-rosegold'
  | 'sapphire-platinum'
  | 'ivory-champagne'
  | 'amethyst-purple';

export interface ThemePreset {
  id: ThemeId;
  name: string;
  nameUrdu: string;
  description: string;
  badge: string;
  primaryHex: string;
  accentHex: string;
  bgHex: string;
  surfaceHex: string;
  textHex: string;
  borderHex: string;
  previewColors: [string, string, string];
  isDark: boolean;
}

// --- CURRENCY TYPES ---
export type CurrencyCode =
  | 'PKR'
  | 'USD'
  | 'GBP'
  | 'EUR'
  | 'AED'
  | 'SAR'
  | 'CAD'
  | 'AUD'
  | 'QAR'
  | 'KWD'
  | 'INR'
  | 'CNY'
  | 'TRY'
  | 'CHF'
  | 'MYR';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  nameUrdu: string;
  flag: string;
  rateAgainstPKR: number; // multiplier from PKR base, e.g. PKR: 1, USD: 0.0036, GBP: 0.0028
  unitRatioText: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
  promoCode: string;
}

// --- SMART CLOUD ERP TYPES (KHATA, POS BILLING, SUPPLIERS, PURCHASES, STAFF, BACKUPS, AUDIT) ---

export type StaffRole = 'admin' | 'manager' | 'salesman';

export interface StaffMember {
  id: string;
  uid?: string;
  name: string;
  nameUrdu?: string;
  phone: string;
  email?: string;
  role: StaffRole;
  commissionPercent: number;
  monthlyTarget: number;
  totalSalesAmount: number;
  status: 'active' | 'on_leave' | 'inactive';
  joinedDate: string;
  notes?: string;
}

export interface KhataAccount {
  id: string;
  customerName: string;
  customerNameUrdu?: string;
  phone: string;
  address?: string;
  openingBalance: number;
  currentBalance: number;
  creditLimit?: number;
  lastActivityDate: string;
  notes?: string;
}

export interface KhataTransaction {
  id: string;
  accountId: string;
  customerName: string;
  type: 'debit' | 'credit'; // debit = Udhar / invoice due, credit = cash payment received (Wasooli)
  amount: number;
  description: string;
  referenceInvoice?: string;
  recordedBy?: string;
  date: string;
}

export interface Supplier {
  id: string;
  name: string;
  companyName: string;
  city?: string;
  phone: string;
  category?: string;
  totalPurchased: number;
  balancePayable: number;
  notes?: string;
}

export interface PurchaseItem {
  productId?: string;
  productTitle: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface PurchaseRecord {
  id: string;
  supplierId: string;
  supplierName: string;
  billNumber: string;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  notes?: string;
}

export interface InvoiceItem {
  productId: string;
  sku: string;
  title: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  lineTotal: number;
}

export interface CloudInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentType: 'cash' | 'easypaisa' | 'jazzcash' | 'bank_transfer' | 'khata_credit';
  salesmanName?: string;
  salesmanUid?: string;
  notes?: string;
  status: 'paid' | 'partial' | 'khata';
}

export interface ActivityLog {
  id: string;
  actorUid: string;
  actorEmail?: string;
  actorName: string;
  action: string;
  module: string;
  details: string;
  severity: 'info' | 'warning' | 'security';
  timestamp: string;
}

export interface CloudBackupRecord {
  id: string;
  title: string;
  createdByUid: string;
  createdByName?: string;
  version: string;
  createdAt: string;
  summaryCounts: {
    products: number;
    orders: number;
    invoices: number;
    khataAccounts: number;
    suppliers: number;
    staff: number;
  };
  snapshotData: {
    products: Product[];
    banners: BannerItem[];
    shopProfile: ShopProfile;
    orders: Order[];
    invoices: CloudInvoice[];
    khataAccounts: KhataAccount[];
    khataTransactions: KhataTransaction[];
    suppliers: Supplier[];
    purchases: PurchaseRecord[];
    staffMembers: StaffMember[];
  };
}

export type ReportPeriod = 'daily' | 'monthly' | 'yearly';

export interface ProfitReportSummary {
  period: ReportPeriod;
  referenceDate: string;
  salesCount: number;
  grossRevenue: number;
  estimatedCOGS: number;
  grossProfit: number;
  profitMarginPercent: number;
  purchaseSpend: number;
  khataReceivablesTotal: number;
  supplierPayablesTotal: number;
  topProducts: { title: string; unitsSold: number; revenue: number }[];
}

export interface CloudSyncState {
  isOnline: boolean;
  firebaseReady: boolean;
  serverReachable: boolean;
  isSyncing: boolean;
  hasPendingWrites: boolean;
  isCloudAdmin: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
}

export type {
  ThreatType,
  ThreatSeverity,
  SecurityAction,
  SecurityWallConfig,
  SecurityEvent,
  BlockedIpEntry,
  ActiveSecuritySession,
  ThreatInspectionResult,
  UploadScanResult,
  AiSecurityAnalysisResult,
} from '../utils/securityCore';

