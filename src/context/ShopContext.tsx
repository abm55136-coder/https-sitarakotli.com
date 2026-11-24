import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  ActivityLog,
  AdminProfile,
  BannerItem,
  BannerSliderSettings,
  BuyingMode,
  CartItem,
  CloudBackupRecord,
  CloudInvoice,
  CloudSyncState,
  CurrencyCode,
  CurrencyConfig,
  CustomerUser,
  FilterState,
  InvoiceItem,
  KhataAccount,
  KhataTransaction,
  Language,
  LogoConfig,
  MediaAsset,
  NewsletterSubscriber,
  Order,
  OrderCustomer,
  OrderStatus,
  Product,
  PurchaseItem,
  PurchaseRecord,
  Review,
  ShopProfile,
  StaffMember,
  Supplier,
  ThemeId,
  UserAccount,
} from '../types';
import {
  CURRENCY_CONFIGS,
  DEFAULT_EXCHANGE_RATES,
  INITIAL_ADMIN_PROFILE,
  INITIAL_BANNERS,
  INITIAL_BANNER_SLIDER_SETTINGS,
  INITIAL_LOGO_CONFIG,
  INITIAL_MEDIA_ASSETS,
  INITIAL_PRODUCTS,
  INITIAL_REVIEWS,
  INITIAL_SHOP_PROFILE,
  INITIAL_USERS_LIST,
} from '../data/initialData';
import { resolveTranslations, TranslationDictionary, translations } from '../i18n/translations';
import {
  calculateCartTotals,
  calculateInvoiceTotals,
  calculateKhataBalance,
  formatPriceByCurrency,
  generateInvoiceNumber,
  isEmailAlreadySubscribed,
  validateNewsletterEmail,
} from '../utils/logic';
import {
  calculateInternationalShipping,
  calculateProductUnitPrice,
  detectVisitorGeoLocale,
  getCountryByCode,
  getLanguageOption,
  isLanguageRtl,
  SUPPORTED_LANGUAGES,
  VisitorGeoDetection,
} from '../utils/globalBusiness';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  googleProvider,
  isFirebaseConfigured,
  testFirestoreConnection,
} from '../firebase';
import {
  deleteBannerFromCloud,
  deleteProductFromCloud,
  pushFullCatalogSeedToCloud,
  subscribePublicCollection,
  subscribeStorefrontConfig,
  syncActivityLogToCloud,
  syncBannerToCloud,
  syncCloudBackupSnapshot,
  syncInvoiceToCloud,
  syncKhataAccountToCloud,
  syncKhataTransactionAtomicToCloud,
  syncNewsletterToCloud,
  syncOrderToCloud,
  syncProductToCloud,
  syncPurchaseAtomicToCloud,
  syncReviewToCloud,
  syncStaffMemberToCloud,
  syncStorefrontConfigToCloud,
  syncSupplierToCloud,
} from '../services/cloudSync';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface CreateInvoiceInput {
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  items: InvoiceItem[];
  discount: number;
  taxRatePercent: number;
  paidAmount?: number;
  paymentType: CloudInvoice['paymentType'];
  salesmanName?: string;
  salesmanUid?: string;
  notes?: string;
}

interface ShopContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationDictionary;
  aiTranslating: boolean;
  detectedGeo: VisitorGeoDetection;
  selectedCountry: string;
  setSelectedCountry: (countryCode: string) => void;
  visitorTimezone: string;
  setVisitorTimezone: (tz: string) => void;
  buyingMode: BuyingMode;
  setBuyingMode: (mode: BuyingMode) => void;
  getEffectiveUnitPrice: (product: Product, quantity?: number) => {
    unitPrice: number;
    isWholesaleApplied: boolean;
    savingsPerUnit: number;
  };
  products: Product[];
  shopProfile: ShopProfile;
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
  reviews: Review[];
  user: CustomerUser | null;
  firebaseUser: FirebaseUser | null;
  cloudSync: CloudSyncState;
  signInWithGoogle: () => Promise<FirebaseUser | null>;
  signOutCloud: () => Promise<void>;
  syncCatalogToCloudNow: () => Promise<void>;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;

  // Admin Awais Malik & Store Management
  adminProfile: AdminProfile;
  updateAdminProfile: (updated: Partial<AdminProfile>) => void;
  mediaLibrary: MediaAsset[];
  addMediaAsset: (asset: Omit<MediaAsset, 'id' | 'uploadDate'> & { id?: string; uploadDate?: string }) => void;
  deleteMediaAsset: (id: string) => void;
  usersList: UserAccount[];
  updateUserStatus: (id: string, status: 'active' | 'suspended') => void;
  addUserAccount: (user: Omit<UserAccount, 'id' | 'joinedDate'>) => void;
  approveListing: (productId: string) => void;
  rejectListing: (productId: string) => void;

  // Banner & Slider System
  banners: BannerItem[];
  sliderSettings: BannerSliderSettings;
  addBanner: (banner: Omit<BannerItem, 'id'> & { id?: string }) => void;
  updateBanner: (banner: BannerItem) => void;
  deleteBanner: (id: string) => void;
  reorderBanners: (banners: BannerItem[]) => void;
  updateSliderSettings: (settings: Partial<BannerSliderSettings>) => void;

  // Logo & Theme Customization
  logoConfig: LogoConfig;
  updateLogoConfig: (updated: Partial<LogoConfig>) => void;
  isLogoModalOpen: boolean;
  setIsLogoModalOpen: (open: boolean) => void;
  currentTheme: ThemeId;
  setTheme: (themeId: ThemeId) => void;

  // Currency Converter System
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  exchangeRates: Record<CurrencyCode, number>;
  updateExchangeRate: (code: CurrencyCode, rate: number) => void;
  refreshExchangeRates: (force?: boolean) => Promise<void>;
  fxSource: 'live-fx' | 'cached-fx' | 'reference-fallback';
  fxUpdatedAt: string | null;
  isRefreshingFx: boolean;
  formatPrice: (amountInPKR: number) => string;
  currencyConfig: CurrencyConfig;

  // Modals & Active Selection
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isAuthOpen: boolean;
  setIsAuthOpen: (open: boolean) => void;
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  isReviewModalOpen: boolean;
  setIsReviewModalOpen: (open: boolean) => void;
  isMediaLibraryOpen: boolean;
  setIsMediaLibraryOpen: (open: boolean) => void;
  isCameraModalOpen: boolean;
  setIsCameraModalOpen: (open: boolean) => void;

  // Actions
  addToCart: (product: Product, quantity?: number, selectedColor?: string, selectedSize?: string, customNotes?: string) => void;
  removeFromCart: (productId: string, selectedColor?: string, selectedSize?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedColor?: string, selectedSize?: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  placeOrder: (
    customer: OrderCustomer,
    paymentMethod: Order['paymentMethod'],
    promoCode?: string,
    paymentMeta?: { paymentReference?: string; paymentStatus?: Order['paymentStatus']; courier?: string }
  ) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;

  // Admin Operations
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  updateStock: (productId: string, newStock: number) => void;
  updateShopProfile: (profile: ShopProfile) => void;
  addReview: (review: Omit<Review, 'id' | 'date'>) => void;

  // User Auth
  loginUser: (
    name: string,
    email: string,
    phone: string,
    role?: 'customer' | 'admin',
    extra?: Partial<Pick<CustomerUser, 'country' | 'countryCode' | 'timezone' | 'preferredLanguage' | 'preferredCurrency' | 'city' | 'address'>>
  ) => void;
  logoutUser: () => void;

  // Newsletter
  newsletterSubscribers: NewsletterSubscriber[];
  subscribeNewsletter: (email: string) => { success: boolean; reason?: 'empty' | 'invalid' | 'duplicate'; subscriber?: NewsletterSubscriber };

  // Smart Cloud ERP (POS Invoices, Khata, Suppliers/Purchases, Staff, Activity Logs, Backups)
  invoices: CloudInvoice[];
  createCloudInvoice: (input: CreateInvoiceInput) => CloudInvoice;
  khataAccounts: KhataAccount[];
  khataTransactions: KhataTransaction[];
  addKhataAccount: (data: Omit<KhataAccount, 'id' | 'currentBalance' | 'lastActivityDate'>) => KhataAccount;
  recordKhataTransaction: (
    accountId: string,
    type: 'debit' | 'credit',
    amount: number,
    description: string,
    referenceInvoice?: string
  ) => void;
  suppliers: Supplier[];
  purchases: PurchaseRecord[];
  addSupplier: (data: Omit<Supplier, 'id' | 'totalPurchased' | 'balancePayable'> & { balancePayable?: number }) => Supplier;
  recordPurchase: (
    supplierId: string,
    billNumber: string,
    items: PurchaseItem[],
    paidAmount: number,
    notes?: string
  ) => PurchaseRecord | null;
  staffMembers: StaffMember[];
  addStaffMember: (data: Omit<StaffMember, 'id' | 'totalSalesAmount' | 'joinedDate'>) => StaffMember;
  updateStaffMember: (staff: StaffMember) => void;
  activityLogs: ActivityLog[];
  logActivity: (action: string, module: string, details: string, severity?: ActivityLog['severity']) => void;
  cloudBackups: CloudBackupRecord[];
  createCloudBackupSnapshot: (title?: string) => Promise<CloudBackupRecord>;
  restoreFromCloudBackup: (backup: CloudBackupRecord) => Promise<void>;
}


const defaultFilterState: FilterState = {
  searchQuery: '',
  gender: 'all',
  category: 'all',
  season: 'all',
  minPrice: 0,
  maxPrice: 30000,
  onlyInStock: false,
  onlyNewArrivals: false,
  onlyOffers: false,
  sortBy: 'featured',
};

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 0. Firebase Auth & Online Status
  const isOnline = useOnlineStatus();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [serverReachable, setServerReachable] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [hasPendingWrites, setHasPendingWrites] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  // 1. Global Geo/Timezone Auto-Detection & Multi-Language State
  const [detectedGeo] = useState<VisitorGeoDetection>(() => detectVisitorGeoLocale());

  const [selectedCountry, setSelectedCountryState] = useState<string>(() => {
    try {
      return localStorage.getItem('sitara_country') || detectVisitorGeoLocale().countryCode || 'PK';
    } catch {
      return 'PK';
    }
  });

  const setSelectedCountry = (countryCode: string) => {
    setSelectedCountryState(countryCode);
    try {
      localStorage.setItem('sitara_country', countryCode);
    } catch {
      // ignore
    }
  };

  const [visitorTimezone, setVisitorTimezoneState] = useState<string>(() => {
    try {
      return localStorage.getItem('sitara_timezone') || detectVisitorGeoLocale().timezone || 'Asia/Karachi';
    } catch {
      return 'Asia/Karachi';
    }
  });

  const setVisitorTimezone = (tz: string) => {
    setVisitorTimezoneState(tz);
    try {
      localStorage.setItem('sitara_timezone', tz);
    } catch {
      // ignore
    }
  };

  const [buyingMode, setBuyingModeState] = useState<BuyingMode>(() => {
    try {
      const saved = localStorage.getItem('sitara_buying_mode');
      return saved === 'wholesale' ? 'wholesale' : 'retail';
    } catch {
      return 'retail';
    }
  });

  const setBuyingMode = (mode: BuyingMode) => {
    setBuyingModeState(mode);
    try {
      localStorage.setItem('sitara_buying_mode', mode);
    } catch {
      // ignore
    }
  };

  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('sitara_lang') as Language | null;
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        return saved;
      }
      return detectVisitorGeoLocale().recommendedLanguage || 'en';
    } catch {
      return 'en';
    }
  });

  const [aiTranslationCache, setAiTranslationCache] = useState<Record<string, Record<string, string>>>(() => {
    try {
      const saved = localStorage.getItem('sitara_ai_translations');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [aiTranslating, setAiTranslating] = useState(false);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('sitara_lang', newLang);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.dir = isLanguageRtl(lang) ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Trigger on-demand AI translation for extra languages if not yet cached
  useEffect(() => {
    if (lang === 'en' || lang === 'ur') return;
    if (aiTranslationCache[lang] && Object.keys(aiTranslationCache[lang]).length >= 8) return;
    let cancelled = false;
    const keysToTranslate: Record<string, string> = {
      productsSubtitle: translations.en.productsSubtitle,
      catHeading: translations.en.catHeading,
      catSubheading: translations.en.catSubheading,
      catMenTitle: translations.en.catMenTitle,
      catWomenTitle: translations.en.catWomenTitle,
      catKidsTitle: translations.en.catKidsTitle,
      heroSubtitle: translations.en.heroSubtitle,
      fabricCareTitle: translations.en.fabricCareTitle,
      orderTrackingTitle: translations.en.orderTrackingTitle,
      newsletterTitle: translations.en.newsletterTitle,
      reviewsTitle: translations.en.reviewsTitle,
      locationTitle: translations.en.locationTitle,
    };
    const langMeta = getLanguageOption(lang);
    setAiTranslating(true);
    fetch('/api/ai/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texts: keysToTranslate,
        targetLang: lang,
        targetLangName: langMeta.name,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { translations?: Record<string, string> } | null) => {
        if (!cancelled && data?.translations && Object.keys(data.translations).length > 0) {
          setAiTranslationCache((prev) => {
            const next = { ...prev, [lang]: { ...(prev[lang] || {}), ...data.translations } };
            try {
              localStorage.setItem('sitara_ai_translations', JSON.stringify(next));
            } catch {
              // ignore
            }
            return next;
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAiTranslating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = resolveTranslations(lang, aiTranslationCache[lang]);

  // 2. Shop Profile
  const [shopProfile, setShopProfile] = useState<ShopProfile>(() => {
    try {
      const saved = localStorage.getItem('sitara_shop_profile');
      return saved ? JSON.parse(saved) : INITIAL_SHOP_PROFILE;
    } catch {
      return INITIAL_SHOP_PROFILE;
    }
  });

  const isCloudAdmin = Boolean(
    firebaseUser &&
      firebaseUser.emailVerified &&
      firebaseUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
  );

  const cloudSync: CloudSyncState = {
    isOnline,
    firebaseReady: isFirebaseConfigured,
    serverReachable,
    isSyncing,
    hasPendingWrites,
    isCloudAdmin,
    lastSyncedAt,
    lastError,
  };

  const updateShopProfile = (newProfile: ShopProfile) => {
    setShopProfile(newProfile);
    try {
      localStorage.setItem('sitara_shop_profile', JSON.stringify(newProfile));
    } catch {
      // ignore
    }
    if (isCloudAdmin) {
      syncStorefrontConfigToCloud(newProfile).catch((e) => setLastError(String(e?.message || e)));
    }
  };

  // 3. Products (merge missing global SKUs like Khaddar/Linen & updated local assets seamlessly)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('sitara_products');
      if (!saved) return INITIAL_PRODUCTS;
      const parsed: Product[] = JSON.parse(saved);
      const initialById = new Map(INITIAL_PRODUCTS.map((p) => [p.id, p]));
      const merged = parsed.map((p) => {
        const ref = initialById.get(p.id);
        if (!ref) return p;
        return {
          ...ref,
          ...p,
          image: p.image && !p.image.includes('images.unsplash.com') ? p.image : ref.image,
          wholesalePrice: p.wholesalePrice ?? ref.wholesalePrice,
          wholesaleMinQty: p.wholesaleMinQty ?? ref.wholesaleMinQty,
        };
      });
      const existingIds = new Set(merged.map((p) => p.id));
      for (const initProd of INITIAL_PRODUCTS) {
        if (!existingIds.has(initProd.id)) {
          merged.push(initProd);
        }
      }
      return merged;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const saveProducts = (updated: Product[]) => {
    setProducts(updated);
    try {
      localStorage.setItem('sitara_products', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const getEffectiveUnitPrice = useCallback(
    (product: Product, quantity = 1) => calculateProductUnitPrice(product, quantity, buyingMode),
    [buyingMode]
  );

  // 4. Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('sitara_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sitara_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // 5. Wishlist
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sitara_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sitara_wishlist', JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist]);

  // 6. Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('sitara_orders');
      if (saved) return JSON.parse(saved);
      // default mock initial order for demonstration
      return [
        {
          id: 'ord-init-01',
          orderNumber: 'SCH-2026-8941',
          date: '2026-11-02',
          customer: {
            fullName: 'Chaudhry Tanveer Ahmed',
            phone: '03425984394',
            whatsapp: '03425984394',
            address: 'Sector F/1, Main Road',
            city: 'Kotli',
            provinceOrState: 'Azad Kashmir',
            notes: 'Please pack in luxury gift box.',
          },
          items: [{ product: INITIAL_PRODUCTS[0], quantity: 1, selectedColor: 'Natural Silk Cream' }],
          subtotal: 8500,
          discount: 1275,
          shippingFee: 0,
          total: 7225,
          promoCodeApplied: 'SITARA15',
          paymentMethod: 'cod',
          status: 'confirmed',
        },
      ];
    } catch {
      return [];
    }
  });

  const saveOrders = (updated: Order[]) => {
    setOrders(updated);
    try {
      localStorage.setItem('sitara_orders', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // 7. Reviews
  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      const saved = localStorage.getItem('sitara_reviews');
      return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
    } catch {
      return INITIAL_REVIEWS;
    }
  });

  const addReview = (reviewData: Omit<Review, 'id' | 'date'>) => {
    const newRev: Review = {
      ...reviewData,
      userId: firebaseUser?.uid || user?.id,
      id: `rev-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    const updated = [newRev, ...reviews];
    setReviews(updated);
    try {
      localStorage.setItem('sitara_reviews', JSON.stringify(updated));
    } catch {
      // ignore
    }
    if (firebaseUser?.uid) {
      syncReviewToCloud(newRev, firebaseUser.uid).catch(() => {});
    }
  };

  // 8. User state
  const [user, setUser] = useState<CustomerUser | null>(() => {
    try {
      const saved = localStorage.getItem('sitara_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const loginUser = (
    name: string,
    email: string,
    phone: string,
    role: 'customer' | 'admin' = 'customer',
    extra?: Partial<Pick<CustomerUser, 'country' | 'countryCode' | 'timezone' | 'preferredLanguage' | 'preferredCurrency' | 'city' | 'address'>>
  ) => {
    const newUser: CustomerUser = {
      id: `usr-${Date.now()}`,
      name,
      email,
      phone,
      role,
      country: extra?.country || getCountryByCode(selectedCountry).name,
      countryCode: extra?.countryCode || selectedCountry,
      timezone: extra?.timezone || visitorTimezone,
      preferredLanguage: extra?.preferredLanguage || lang,
      preferredCurrency: extra?.preferredCurrency || currency,
      city: extra?.city,
      address: extra?.address,
    };
    setUser(newUser);
    try {
      localStorage.setItem('sitara_user', JSON.stringify(newUser));
    } catch {
      // ignore
    }
  };

  const logoutUser = () => {
    setUser(null);
    try {
      localStorage.removeItem('sitara_user');
    } catch {
      // ignore
    }
  };

  // 9. Filters state
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);
  const resetFilters = () => setFilters(defaultFilterState);

  // 10. Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  // Logo Customization State
  const [logoConfig, setLogoConfig] = useState<LogoConfig>(() => {
    try {
      const saved = localStorage.getItem('sitara_logo_config');
      return saved ? JSON.parse(saved) : INITIAL_LOGO_CONFIG;
    } catch {
      return INITIAL_LOGO_CONFIG;
    }
  });

  const updateLogoConfig = (updated: Partial<LogoConfig>) => {
    setLogoConfig((prev) => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem('sitara_logo_config', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Theme Customization State
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem('sitara_theme') as ThemeId;
      return saved || 'midnight-gold';
    } catch {
      return 'midnight-gold';
    }
  });

  const setTheme = (themeId: ThemeId) => {
    setCurrentTheme(themeId);
    try {
      localStorage.setItem('sitara_theme', themeId);
    } catch {
      // ignore
    }
  };

  // Sync theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (currentTheme === 'ivory-champagne') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [currentTheme]);

  // Global Currency Converter State (15+ International Currencies + Live FX)
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem('sitara_currency') as CurrencyCode | null;
      if (saved && saved in CURRENCY_CONFIGS) return saved;
      return detectVisitorGeoLocale().recommendedCurrency || 'PKR';
    } catch {
      return 'PKR';
    }
  });

  const [exchangeRates, setExchangeRates] = useState<Record<CurrencyCode, number>>(() => {
    try {
      const saved = localStorage.getItem('sitara_exchange_rates');
      const parsed = saved ? JSON.parse(saved) : {};
      return { ...DEFAULT_EXCHANGE_RATES, ...parsed };
    } catch {
      return DEFAULT_EXCHANGE_RATES;
    }
  });
  const [fxSource, setFxSource] = useState<'live-fx' | 'cached-fx' | 'reference-fallback'>('reference-fallback');
  const [fxUpdatedAt, setFxUpdatedAt] = useState<string | null>(null);
  const [isRefreshingFx, setIsRefreshingFx] = useState(false);

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      localStorage.setItem('sitara_currency', c);
    } catch {
      // ignore
    }
  };

  const updateExchangeRate = (code: CurrencyCode, rate: number) => {
    setExchangeRates((prev) => {
      const next = { ...prev, [code]: rate };
      try {
        localStorage.setItem('sitara_exchange_rates', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const refreshExchangeRates = useCallback(async (force = false) => {
    setIsRefreshingFx(true);
    try {
      const res = await fetch(`/api/global/exchange-rates${force ? '?refresh=1' : ''}`);
      if (res.ok) {
        const data = (await res.json()) as {
          rates?: Record<CurrencyCode, number>;
          source?: 'live-fx' | 'cached-fx' | 'reference-fallback';
          updatedAt?: string;
        };
        if (data?.rates) {
          setExchangeRates((prev) => {
            const next = { ...DEFAULT_EXCHANGE_RATES, ...prev, ...data.rates };
            try {
              localStorage.setItem('sitara_exchange_rates', JSON.stringify(next));
            } catch {
              // ignore
            }
            return next;
          });
        }
        if (data?.source) setFxSource(data.source);
        if (data?.updatedAt) setFxUpdatedAt(data.updatedAt);
      }
    } catch {
      // retain existing reference rates offline
    } finally {
      setIsRefreshingFx(false);
    }
  }, []);

  useEffect(() => {
    refreshExchangeRates(false);
  }, [refreshExchangeRates]);

  // Open product automatically when accessed via QR link (?sku=SCH-...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const skuParam = params.get('sku')?.trim();
      if (skuParam) {
        const matched = products.find((p) => p.sku.toLowerCase() === skuParam.toLowerCase());
        if (matched) {
          setSelectedProduct(matched);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const formatPrice = (amountInPKR: number): string => {
    return formatPriceByCurrency(amountInPKR, currency, exchangeRates);
  };

  const currencyConfig = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.PKR;

  // 11. Admin Profile (Awais Malik)
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(() => {
    try {
      const saved = localStorage.getItem('sitara_admin_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Automatically migrate to official executive crest if using deleted asset, unsplash, or empty
        if (!parsed.avatar || parsed.avatar.includes('55bfd624') || parsed.avatar.includes('images.unsplash.com/photo-1507003211169-0a1dd7228f2d')) {
          parsed.avatar = '/assets/images/awais_malik_avatar.svg';
          parsed.email = 'awaism793@gmail.com';
          localStorage.setItem('sitara_admin_profile', JSON.stringify(parsed));
        }
        return parsed;
      }
      return INITIAL_ADMIN_PROFILE;
    } catch {
      return INITIAL_ADMIN_PROFILE;
    }
  });

  const updateAdminProfile = (updated: Partial<AdminProfile>) => {
    setAdminProfile((prev) => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem('sitara_admin_profile', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // 12. Media Library Management
  const [mediaLibrary, setMediaLibrary] = useState<MediaAsset[]>(() => {
    try {
      const saved = localStorage.getItem('sitara_media_library');
      return saved ? JSON.parse(saved) : INITIAL_MEDIA_ASSETS;
    } catch {
      return INITIAL_MEDIA_ASSETS;
    }
  });

  const addMediaAsset = (asset: Omit<MediaAsset, 'id' | 'uploadDate'> & { id?: string; uploadDate?: string }) => {
    const newAsset: MediaAsset = {
      ...asset,
      id: asset.id || `media-${Date.now()}`,
      uploadDate: asset.uploadDate || new Date().toISOString().split('T')[0],
    };
    setMediaLibrary((prev) => {
      const next = [newAsset, ...prev];
      try {
        localStorage.setItem('sitara_media_library', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const deleteMediaAsset = (id: string) => {
    setMediaLibrary((prev) => {
      const next = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem('sitara_media_library', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // 13. Users and Sellers Management
  const [usersList, setUsersList] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('sitara_users_list');
      return saved ? JSON.parse(saved) : INITIAL_USERS_LIST;
    } catch {
      return INITIAL_USERS_LIST;
    }
  });

  const updateUserStatus = (id: string, status: 'active' | 'suspended') => {
    setUsersList((prev) => {
      const next = prev.map((u) => (u.id === id ? { ...u, status } : u));
      try {
        localStorage.setItem('sitara_users_list', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const addUserAccount = (userData: Omit<UserAccount, 'id' | 'joinedDate'>) => {
    const newUser: UserAccount = {
      ...userData,
      id: `usr-${Date.now()}`,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    setUsersList((prev) => {
      const next = [newUser, ...prev];
      try {
        localStorage.setItem('sitara_users_list', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const approveListing = (productId: string) => {
    const updated = products.map((p) =>
      p.id === productId ? { ...p, approvalStatus: 'approved' as const } : p
    );
    saveProducts(updated);
  };

  const rejectListing = (productId: string) => {
    const updated = products.map((p) =>
      p.id === productId ? { ...p, approvalStatus: 'rejected' as const } : p
    );
    saveProducts(updated);
  };

  // 14. Banner & Slider System
  const [banners, setBanners] = useState<BannerItem[]>(() => {
    try {
      const saved = localStorage.getItem('sitara_banners');
      return saved ? JSON.parse(saved) : INITIAL_BANNERS;
    } catch {
      return INITIAL_BANNERS;
    }
  });

  const [sliderSettings, setSliderSettings] = useState<BannerSliderSettings>(() => {
    try {
      const saved = localStorage.getItem('sitara_slider_settings');
      return saved ? JSON.parse(saved) : INITIAL_BANNER_SLIDER_SETTINGS;
    } catch {
      return INITIAL_BANNER_SLIDER_SETTINGS;
    }
  });

  const saveBanners = (updated: BannerItem[]) => {
    setBanners(updated);
    try {
      localStorage.setItem('sitara_banners', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const addBanner = (bannerData: Omit<BannerItem, 'id'> & { id?: string }) => {
    const newBanner: BannerItem = {
      ...bannerData,
      id: bannerData.id || `banner-${Date.now()}`,
      order: bannerData.order ?? banners.length + 1,
    };
    saveBanners([...banners, newBanner]);
    if (isCloudAdmin) {
      syncBannerToCloud(newBanner).catch((e) => setLastError(String(e?.message || e)));
    }
  };

  const updateBanner = (updatedBanner: BannerItem) => {
    const updated = banners.map((b) => (b.id === updatedBanner.id ? updatedBanner : b));
    saveBanners(updated);
    if (isCloudAdmin) {
      syncBannerToCloud(updatedBanner).catch((e) => setLastError(String(e?.message || e)));
    }
  };

  const deleteBanner = (id: string) => {
    const updated = banners.filter((b) => b.id !== id);
    saveBanners(updated);
    if (isCloudAdmin) {
      deleteBannerFromCloud(id).catch((e) => setLastError(String(e?.message || e)));
    }
  };

  const reorderBanners = (reordered: BannerItem[]) => {
    saveBanners(reordered);
  };

  const updateSliderSettings = (newSettings: Partial<BannerSliderSettings>) => {
    setSliderSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('sitara_slider_settings', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Actions
  const addToCart = (
    product: Product,
    quantity = 1,
    selectedColor?: string,
    selectedSize?: string,
    customNotes?: string
  ) => {
    const color = selectedColor || (product.colors && product.colors.length > 0 ? product.colors[0].name : undefined);
    const size = selectedSize || (product.availableSizes && product.availableSizes.length > 0 ? product.availableSizes[0] : undefined);

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedColor === color &&
          item.selectedSize === size
      );

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].quantity += quantity;
        return copy;
      }
      return [...prev, { product, quantity, selectedColor: color, selectedSize: size, customNotes }];
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, selectedColor?: string, selectedSize?: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.selectedColor === selectedColor &&
            item.selectedSize === selectedSize
          )
      )
    );
  };

  const updateQuantity = (
    productId: string,
    quantity: number,
    selectedColor?: string,
    selectedSize?: string
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedColor, selectedSize);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (
          item.product.id === productId &&
          item.selectedColor === selectedColor &&
          item.selectedSize === selectedSize
        ) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const placeOrder = (
    customer: OrderCustomer,
    paymentMethod: Order['paymentMethod'],
    promoCode?: string,
    paymentMeta?: { paymentReference?: string; paymentStatus?: Order['paymentStatus']; courier?: string }
  ): Order => {
    const pricedCart = cart.map((item) => {
      const { unitPrice } = calculateProductUnitPrice(item.product, item.quantity, buyingMode);
      return {
        ...item,
        product: { ...item.product, price: unitPrice },
      };
    });
    const subtotalOnly = pricedCart.reduce((s, it) => s + it.product.price * it.quantity, 0);
    const shippingQuote = calculateInternationalShipping(
      subtotalOnly,
      customer.countryCode || selectedCountry || 'PK',
      customer.city,
      shopProfile.freeShippingThreshold,
      buyingMode
    );
    const totals = calculateCartTotals(pricedCart, promoCode, customer.city, shopProfile.freeShippingThreshold);
    const finalShipping = shippingQuote.shippingFeePKR;
    const finalTotal = Math.max(0, totals.subtotal - totals.discount + finalShipping);
    const orderNumber = `SCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      date: new Date().toISOString().split('T')[0],
      customerUid: firebaseUser?.uid || user?.id,
      customer: {
        ...customer,
        country: customer.country || getCountryByCode(customer.countryCode || selectedCountry).name,
        countryCode: customer.countryCode || selectedCountry,
        timezone: customer.timezone || visitorTimezone,
      },
      items: pricedCart,
      subtotal: totals.subtotal,
      discount: totals.discount,
      shippingFee: finalShipping,
      total: finalTotal,
      orderCurrency: currency,
      exchangeRate: exchangeRates[currency] || 1,
      promoCodeApplied: totals.appliedPromo?.code,
      paymentMethod,
      paymentStatus: paymentMeta?.paymentStatus || (paymentMethod === 'cod' ? 'cod_due' : 'authorized'),
      paymentReference: paymentMeta?.paymentReference,
      courier: paymentMeta?.courier || shippingQuote.courierName,
      buyingMode,
      status: 'pending',
    };

    const updatedOrders = [newOrder, ...orders];
    saveOrders(updatedOrders);

    // Decrement product inventory
    const updatedProducts = products.map((prod) => {
      const cartItem = cart.find((c) => c.product.id === prod.id);
      if (cartItem) {
        return {
          ...prod,
          stockQuantity: Math.max(0, prod.stockQuantity - cartItem.quantity),
        };
      }
      return prod;
    });
    saveProducts(updatedProducts);

    if (firebaseUser?.uid) {
      syncOrderToCloud(newOrder, firebaseUser.uid, true).catch((e) => setLastError(String(e?.message || e)));
    }

    clearCart();
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const target = orders.find((o) => o.id === orderId);
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status } : o));
    saveOrders(updated);
    if (isCloudAdmin && target) {
      syncOrderToCloud({ ...target, status }, target.customerUid || firebaseUser?.uid || 'guest', false).catch((e) =>
        setLastError(String(e?.message || e))
      );
      logActivity('Update Order Status', 'orders', `${target.orderNumber} -> ${status}`, 'info');
    }
  };

  // Admin Actions
  const addProduct = (newProdData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...newProdData,
      id: `prod-${Date.now()}`,
    };
    saveProducts([newProd, ...products]);
    if (isCloudAdmin) {
      syncProductToCloud(newProd).catch((e) => setLastError(String(e?.message || e)));
      logActivity('Add Product', 'catalog', `${newProd.title} (SKU: ${newProd.sku})`, 'info');
    }
  };

  const updateProduct = (updatedProd: Product) => {
    const updated = products.map((p) => (p.id === updatedProd.id ? updatedProd : p));
    saveProducts(updated);
    if (isCloudAdmin) {
      syncProductToCloud(updatedProd).catch((e) => setLastError(String(e?.message || e)));
      logActivity('Update Product', 'catalog', `${updatedProd.title} (Rs. ${updatedProd.price})`, 'info');
    }
  };

  const deleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    const updated = products.filter((p) => p.id !== productId);
    saveProducts(updated);
    if (isCloudAdmin) {
      deleteProductFromCloud(productId).catch((e) => setLastError(String(e?.message || e)));
      logActivity('Delete Product', 'catalog', target?.title || productId, 'warning');
    }
  };

  const updateStock = (productId: string, newStock: number) => {
    const clamped = Math.max(0, newStock);
    const updated = products.map((p) =>
      p.id === productId ? { ...p, stockQuantity: clamped } : p
    );
    saveProducts(updated);
    const prod = updated.find((p) => p.id === productId);
    if (isCloudAdmin && prod) {
      syncProductToCloud(prod).catch((e) => setLastError(String(e?.message || e)));
    }
  };

  // Newsletter Subscribers
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<NewsletterSubscriber[]>(() => {
    try {
      const saved = localStorage.getItem('sitara_newsletter_subscribers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const subscribeNewsletter = (rawEmail: string) => {
    const validation = validateNewsletterEmail(rawEmail);
    if (!validation.isValid) {
      return { success: false, reason: validation.errorCode };
    }

    if (isEmailAlreadySubscribed(newsletterSubscribers, validation.normalizedEmail)) {
      return { success: false, reason: 'duplicate' as const };
    }

    const subscriber: NewsletterSubscriber = {
      id: `sub-${Date.now()}`,
      email: validation.normalizedEmail,
      subscribedAt: new Date().toISOString(),
      promoCode: 'LUXURY10',
    };

    const updated = [subscriber, ...newsletterSubscribers];
    setNewsletterSubscribers(updated);
    try {
      localStorage.setItem('sitara_newsletter_subscribers', JSON.stringify(updated));
    } catch {
      // ignore
    }

    syncNewsletterToCloud(subscriber).catch(() => {
      // Offline cache or unauth fallback preserved locally
    });

    return { success: true, subscriber };
  };

  // --- SMART CLOUD ERP STATES & ACTIONS ---

  const [invoices, setInvoices] = useState<CloudInvoice[]>(() => {
    try {
      const saved = localStorage.getItem('sitara_invoices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [khataAccounts, setKhataAccounts] = useState<KhataAccount[]>(() => {
    try {
      const saved = localStorage.getItem('sitara_khata_accounts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [khataTransactions, setKhataTransactions] = useState<KhataTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('sitara_khata_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem('sitara_suppliers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => {
    try {
      const saved = localStorage.getItem('sitara_purchases');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => {
    try {
      const saved = localStorage.getItem('sitara_staff_members');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem('sitara_activity_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cloudBackups, setCloudBackups] = useState<CloudBackupRecord[]>(() => {
    try {
      const saved = localStorage.getItem('sitara_cloud_backups');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const persistLocal = (key: string, data: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // ignore storage quota errors
    }
  };

  const logActivity = useCallback(
    (action: string, module: string, details: string, severity: ActivityLog['severity'] = 'info') => {
      const entry: ActivityLog = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        actorUid: firebaseUser?.uid || 'local-admin',
        actorEmail: firebaseUser?.email || adminProfile.email,
        actorName: firebaseUser?.displayName || adminProfile.name,
        action,
        module,
        details,
        severity,
        timestamp: new Date().toISOString(),
      };
      setActivityLogs((prev) => {
        const next = [entry, ...prev].slice(0, 200);
        persistLocal('sitara_activity_logs', next);
        return next;
      });
      if (firebaseUser && firebaseUser.emailVerified && firebaseUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
        syncActivityLogToCloud(entry).catch(() => {});
      }
    },
    [firebaseUser, adminProfile.email, adminProfile.name]
  );

  const addKhataAccount = (data: Omit<KhataAccount, 'id' | 'currentBalance' | 'lastActivityDate'>): KhataAccount => {
    const today = new Date().toISOString().split('T')[0];
    const opening = Number(data.openingBalance) || 0;
    const account: KhataAccount = {
      ...data,
      id: `khata-${Date.now()}`,
      openingBalance: opening,
      currentBalance: opening,
      lastActivityDate: today,
    };
    const next = [account, ...khataAccounts];
    setKhataAccounts(next);
    persistLocal('sitara_khata_accounts', next);
    if (isCloudAdmin) {
      syncKhataAccountToCloud(account).catch((e) => setLastError(String(e?.message || e)));
    }
    logActivity('Create Khata Account', 'khata', `${account.customerName} (Opening Rs. ${opening})`, 'info');
    return account;
  };

  const recordKhataTransaction = (
    accountId: string,
    type: 'debit' | 'credit',
    amount: number,
    description: string,
    referenceInvoice?: string
  ) => {
    const cleanAmount = Math.max(1, Math.round(Number(amount) || 0));
    const targetAccount = khataAccounts.find((a) => a.id === accountId);
    if (!targetAccount) return;

    const tx: KhataTransaction = {
      id: `ktx-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      accountId,
      customerName: targetAccount.customerName,
      type,
      amount: cleanAmount,
      description: description || (type === 'debit' ? 'Goods on Credit (Udhar)' : 'Cash Received (Wasooli)'),
      referenceInvoice,
      recordedBy: firebaseUser?.displayName || adminProfile.name,
      date: new Date().toISOString().split('T')[0],
    };

    const updatedTransactions = [tx, ...khataTransactions];
    const accountTxs = updatedTransactions.filter((tItem) => tItem.accountId === accountId);
    const updatedBalance = calculateKhataBalance(targetAccount.openingBalance, accountTxs);
    const updatedAccount: KhataAccount = {
      ...targetAccount,
      currentBalance: updatedBalance,
      lastActivityDate: tx.date,
    };

    const updatedAccounts = khataAccounts.map((a) => (a.id === accountId ? updatedAccount : a));
    setKhataTransactions(updatedTransactions);
    setKhataAccounts(updatedAccounts);
    persistLocal('sitara_khata_transactions', updatedTransactions);
    persistLocal('sitara_khata_accounts', updatedAccounts);

    if (isCloudAdmin) {
      syncKhataTransactionAtomicToCloud(updatedAccount, tx).catch((e) => setLastError(String(e?.message || e)));
    }
    logActivity(
      type === 'debit' ? 'Khata Debit (Udhar)' : 'Khata Credit (Wasooli)',
      'khata',
      `${targetAccount.customerName}: Rs. ${cleanAmount} -> Balance Rs. ${updatedBalance}`,
      'info'
    );
  };

  const createCloudInvoice = (input: CreateInvoiceInput): CloudInvoice => {
    const totals = calculateInvoiceTotals(
      input.items,
      input.discount,
      input.taxRatePercent,
      input.paidAmount,
      input.paymentType
    );

    const newInvoice: CloudInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: generateInvoiceNumber('INV-SCH'),
      date: new Date().toISOString().split('T')[0],
      customerId: input.customerId,
      customerName: input.customerName || 'Walk-in Customer',
      customerPhone: input.customerPhone,
      items: input.items,
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxAmount: totals.taxAmount,
      total: totals.total,
      paidAmount: totals.paidAmount,
      dueAmount: totals.dueAmount,
      paymentType: input.paymentType,
      salesmanName: input.salesmanName || adminProfile.name,
      salesmanUid: input.salesmanUid,
      notes: input.notes,
      status: totals.status,
    };

    const nextInvoices = [newInvoice, ...invoices];
    setInvoices(nextInvoices);
    persistLocal('sitara_invoices', nextInvoices);

    // Decrement product inventory for invoiced SKUs
    const updatedProducts = products.map((prod) => {
      const soldQty = input.items
        .filter((it) => it.productId === prod.id)
        .reduce((s, it) => s + it.quantity, 0);
      if (soldQty > 0) {
        const nextProd = { ...prod, stockQuantity: Math.max(0, prod.stockQuantity - soldQty) };
        if (isCloudAdmin) {
          syncProductToCloud(nextProd).catch(() => {});
        }
        return nextProd;
      }
      return prod;
    });
    saveProducts(updatedProducts);

    // Update linked salesman totalSalesAmount if matched
    if (input.salesmanUid || input.salesmanName) {
      const nextStaff = staffMembers.map((stf) => {
        if (
          (input.salesmanUid && (stf.id === input.salesmanUid || stf.uid === input.salesmanUid)) ||
          (input.salesmanName && stf.name.toLowerCase() === input.salesmanName.toLowerCase())
        ) {
          const updatedStaff = { ...stf, totalSalesAmount: stf.totalSalesAmount + newInvoice.total };
          if (isCloudAdmin) {
            syncStaffMemberToCloud(updatedStaff).catch(() => {});
          }
          return updatedStaff;
        }
        return stf;
      });
      setStaffMembers(nextStaff);
      persistLocal('sitara_staff_members', nextStaff);
    }

    // Post due balance to linked Customer Khata if unpaid balance remains
    if (newInvoice.dueAmount > 0 && input.customerId) {
      recordKhataTransaction(
        input.customerId,
        'debit',
        newInvoice.dueAmount,
        `POS Invoice ${newInvoice.invoiceNumber}`,
        newInvoice.invoiceNumber
      );
    }

    if (isCloudAdmin) {
      syncInvoiceToCloud(newInvoice).catch((e) => setLastError(String(e?.message || e)));
    }
    logActivity(
      'Create POS Invoice',
      'billing',
      `${newInvoice.invoiceNumber} (${newInvoice.customerName}) - Rs. ${newInvoice.total}`,
      'info'
    );
    return newInvoice;
  };

  const addSupplier = (
    data: Omit<Supplier, 'id' | 'totalPurchased' | 'balancePayable'> & { balancePayable?: number }
  ): Supplier => {
    const sup: Supplier = {
      ...data,
      id: `sup-${Date.now()}`,
      totalPurchased: 0,
      balancePayable: Number(data.balancePayable) || 0,
    };
    const next = [sup, ...suppliers];
    setSuppliers(next);
    persistLocal('sitara_suppliers', next);
    if (isCloudAdmin) {
      syncSupplierToCloud(sup).catch((e) => setLastError(String(e?.message || e)));
    }
    logActivity('Add Supplier', 'suppliers', `${sup.companyName} (${sup.name})`, 'info');
    return sup;
  };

  const recordPurchase = (
    supplierId: string,
    billNumber: string,
    items: PurchaseItem[],
    paidAmount: number,
    notes?: string
  ): PurchaseRecord | null => {
    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup || items.length === 0) return null;

    const totalAmount = items.reduce((s, it) => s + (Number(it.lineTotal) || it.quantity * it.unitCost), 0);
    const cleanPaid = Math.min(totalAmount, Math.max(0, Math.round(Number(paidAmount) || 0)));
    const balanceDue = Math.max(0, totalAmount - cleanPaid);

    const purchase: PurchaseRecord = {
      id: `pur-${Date.now()}`,
      supplierId,
      supplierName: sup.companyName || sup.name,
      billNumber: billNumber.trim() || `BILL-${Date.now().toString().slice(-5)}`,
      date: new Date().toISOString().split('T')[0],
      items,
      totalAmount,
      paidAmount: cleanPaid,
      balanceDue,
      notes,
    };

    const updatedSupplier: Supplier = {
      ...sup,
      totalPurchased: sup.totalPurchased + totalAmount,
      balancePayable: sup.balancePayable + balanceDue,
    };

    const nextPurchases = [purchase, ...purchases];
    const nextSuppliers = suppliers.map((s) => (s.id === supplierId ? updatedSupplier : s));
    setPurchases(nextPurchases);
    setSuppliers(nextSuppliers);
    persistLocal('sitara_purchases', nextPurchases);
    persistLocal('sitara_suppliers', nextSuppliers);

    // Increment catalog stock for linked productIds
    const updatedProducts = products.map((prod) => {
      const matchedItems = items.filter((it) => it.productId && it.productId === prod.id);
      if (matchedItems.length > 0) {
        const addedUnits = matchedItems.reduce((s, it) => s + it.quantity, 0);
        const lastCost = matchedItems[matchedItems.length - 1].unitCost;
        const nextProd: Product = {
          ...prod,
          stockQuantity: prod.stockQuantity + addedUnits,
          costPrice: lastCost > 0 ? lastCost : prod.costPrice,
        };
        if (isCloudAdmin) {
          syncProductToCloud(nextProd).catch(() => {});
        }
        return nextProd;
      }
      return prod;
    });
    saveProducts(updatedProducts);

    if (isCloudAdmin) {
      syncPurchaseAtomicToCloud(updatedSupplier, purchase).catch((e) => setLastError(String(e?.message || e)));
    }
    logActivity(
      'Record Wholesale Purchase',
      'suppliers',
      `Bill #${purchase.billNumber} from ${sup.companyName} - Rs. ${totalAmount}`,
      'info'
    );
    return purchase;
  };

  const addStaffMember = (data: Omit<StaffMember, 'id' | 'totalSalesAmount' | 'joinedDate'>): StaffMember => {
    const member: StaffMember = {
      ...data,
      id: `stf-${Date.now()}`,
      totalSalesAmount: 0,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    const next = [member, ...staffMembers];
    setStaffMembers(next);
    persistLocal('sitara_staff_members', next);
    if (isCloudAdmin) {
      syncStaffMemberToCloud(member).catch((e) => setLastError(String(e?.message || e)));
    }
    logActivity('Add Staff Member', 'staff', `${member.name} (${member.role})`, 'security');
    return member;
  };

  const updateStaffMember = (updatedStaff: StaffMember) => {
    const next = staffMembers.map((s) => (s.id === updatedStaff.id ? updatedStaff : s));
    setStaffMembers(next);
    persistLocal('sitara_staff_members', next);
    if (isCloudAdmin) {
      syncStaffMemberToCloud(updatedStaff).catch((e) => setLastError(String(e?.message || e)));
    }
    logActivity('Update Staff Member', 'staff', `${updatedStaff.name} -> ${updatedStaff.role} (${updatedStaff.status})`, 'security');
  };

  const createCloudBackupSnapshot = async (title?: string): Promise<CloudBackupRecord> => {
    const sanitizeUrlForCloud = (url: string) =>
      url.startsWith('data:') ? '/assets/images/awais_malik_avatar.svg' : url;

    const compactProducts = products.map((p) => ({
      ...p,
      image: sanitizeUrlForCloud(p.image),
      additionalImages: (p.additionalImages || []).map(sanitizeUrlForCloud),
    }));

    const compactBanners = banners.map((b) => ({
      ...b,
      imageUrl: sanitizeUrlForCloud(b.imageUrl),
      mobileImageUrl: b.mobileImageUrl ? sanitizeUrlForCloud(b.mobileImageUrl) : undefined,
    }));

    const fullSnapshot: CloudBackupRecord = {
      id: `bkp-${Date.now()}`,
      title: title?.trim() || `Sitara Cloud Snapshot (${new Date().toLocaleDateString()})`,
      createdByUid: firebaseUser?.uid || 'local-admin',
      createdByName: firebaseUser?.displayName || adminProfile.name,
      version: '3.0.0-cloud',
      createdAt: new Date().toISOString(),
      summaryCounts: {
        products: products.length,
        orders: orders.length,
        invoices: invoices.length,
        khataAccounts: khataAccounts.length,
        suppliers: suppliers.length,
        staff: staffMembers.length,
      },
      snapshotData: {
        products: compactProducts,
        banners: compactBanners,
        shopProfile,
        orders,
        invoices,
        khataAccounts,
        khataTransactions,
        suppliers,
        purchases,
        staffMembers,
      },
    };

    const nextBackups = [fullSnapshot, ...cloudBackups].slice(0, 20);
    setCloudBackups(nextBackups);
    persistLocal('sitara_cloud_backups', nextBackups);

    if (isCloudAdmin) {
      setIsSyncing(true);
      try {
        await syncCloudBackupSnapshot(fullSnapshot);
        setLastSyncedAt(new Date().toISOString());
      } catch (e) {
        setLastError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsSyncing(false);
      }
    }

    logActivity('Create Cloud Snapshot Backup', 'security', fullSnapshot.title, 'security');
    return fullSnapshot;
  };

  const restoreFromCloudBackup = async (backup: CloudBackupRecord): Promise<void> => {
    const snap = backup.snapshotData;
    if (snap.products?.length) saveProducts(snap.products);
    if (snap.banners?.length) saveBanners(snap.banners);
    if (snap.shopProfile) updateShopProfile(snap.shopProfile);
    if (snap.orders) saveOrders(snap.orders);
    if (snap.invoices) {
      setInvoices(snap.invoices);
      persistLocal('sitara_invoices', snap.invoices);
    }
    if (snap.khataAccounts) {
      setKhataAccounts(snap.khataAccounts);
      persistLocal('sitara_khata_accounts', snap.khataAccounts);
    }
    if (snap.khataTransactions) {
      setKhataTransactions(snap.khataTransactions);
      persistLocal('sitara_khata_transactions', snap.khataTransactions);
    }
    if (snap.suppliers) {
      setSuppliers(snap.suppliers);
      persistLocal('sitara_suppliers', snap.suppliers);
    }
    if (snap.purchases) {
      setPurchases(snap.purchases);
      persistLocal('sitara_purchases', snap.purchases);
    }
    if (snap.staffMembers) {
      setStaffMembers(snap.staffMembers);
      persistLocal('sitara_staff_members', snap.staffMembers);
    }

    if (isCloudAdmin && snap.products) {
      await pushFullCatalogSeedToCloud(
        snap.products,
        snap.banners || banners,
        snap.shopProfile || shopProfile
      );
    }
    logActivity('Restore Cloud Backup', 'security', `Restored snapshot: ${backup.title}`, 'security');
  };

  const signInWithGoogle = async (): Promise<FirebaseUser | null> => {
    if (!auth || !isFirebaseConfigured) {
      setLastError('Firebase Web API key is not configured in environment variables (VITE_FIREBASE_API_KEY).');
      return null;
    }
    try {
      setLastError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const signedUser = result.user;
      if (signedUser) {
        const isAdminEmail =
          signedUser.emailVerified &&
          signedUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
        setUser({
          id: signedUser.uid,
          uid: signedUser.uid,
          name: signedUser.displayName || 'Sitara Patron',
          email: signedUser.email || '',
          phone: user?.phone || '03425984394',
          photoURL: signedUser.photoURL || undefined,
          emailVerified: signedUser.emailVerified,
          role: isAdminEmail ? 'admin' : 'customer',
        });
      }
      return signedUser;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setLastError(msg);
      return null;
    }
  };

  const signOutCloud = async (): Promise<void> => {
    if (auth) {
      await signOut(auth);
    }
    setFirebaseUser(null);
    logoutUser();
  };

  const syncCatalogToCloudNow = async (): Promise<void> => {
    if (!isCloudAdmin) {
      throw new Error(`Sign in with verified Google Admin (${BOOTSTRAPPED_ADMIN_EMAIL}) to synchronize to cloud.`);
    }
    setIsSyncing(true);
    setLastError(null);
    try {
      await pushFullCatalogSeedToCloud(products, banners, shopProfile, {
        logoConfig,
        exchangeRates,
        currentTheme,
      });
      for (const inv of invoices.slice(0, 50)) {
        await syncInvoiceToCloud(inv);
      }
      for (const acc of khataAccounts.slice(0, 50)) {
        await syncKhataAccountToCloud(acc);
      }
      for (const sup of suppliers.slice(0, 50)) {
        await syncSupplierToCloud(sup);
      }
      for (const stf of staffMembers.slice(0, 50)) {
        await syncStaffMemberToCloud(stf);
      }
      setLastSyncedAt(new Date().toISOString());
      logActivity('Full Cloud Sync', 'cloud', `Synced ${products.length} products, ${invoices.length} invoices, ${khataAccounts.length} khata accounts`, 'info');
    } catch (error) {
      setLastError(error instanceof Error ? error.message : String(error));
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  // --- FIREBASE AUTH & REAL-TIME FIRESTORE SUBSCRIPTIONS ---

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
      setServerReachable(false);
      return;
    }
    let active = true;
    testFirestoreConnection().then((ok) => {
      if (active) setServerReachable(ok);
    });

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      if (!active) return;
      setFirebaseUser(fbUser);
      if (fbUser) {
        const isAdminEmail =
          fbUser.emailVerified &&
          fbUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
        setUser((prev) => ({
          id: fbUser.uid,
          uid: fbUser.uid,
          name: fbUser.displayName || prev?.name || 'Sitara Patron',
          email: fbUser.email || prev?.email || '',
          phone: prev?.phone || '03425984394',
          photoURL: fbUser.photoURL || undefined,
          emailVerified: fbUser.emailVerified,
          role: isAdminEmail ? 'admin' : 'customer',
        }));
      }
    });

    const unsubProducts = subscribePublicCollection<Product>('products', (items, meta) => {
      if (!active) return;
      setHasPendingWrites(meta.hasPendingWrites);
      setLastSyncedAt(new Date().toISOString());
      if (items.length > 0) {
        saveProducts(items);
      }
    });

    const unsubBanners = subscribePublicCollection<BannerItem>('banners', (items) => {
      if (!active || items.length === 0) return;
      saveBanners(items.sort((a, b) => (a.order || 0) - (b.order || 0)));
    });

    const unsubReviews = subscribePublicCollection<Review>('reviews', (items) => {
      if (!active || items.length === 0) return;
      setReviews(items);
      persistLocal('sitara_reviews', items);
    });

    const unsubConfig = subscribeStorefrontConfig((cfg) => {
      if (!active) return;
      if (cfg.name) {
        setShopProfile((prev) => {
          const merged = { ...prev, ...cfg };
          persistLocal('sitara_shop_profile', merged);
          return merged;
        });
      }
    });

    return () => {
      active = false;
      unsubAuth();
      unsubProducts();
      unsubBanners();
      unsubReviews();
      unsubConfig();
    };
  }, []);

  // Private ERP real-time subscriptions (only when verified Cloud Admin, or customer own orders)
  useEffect(() => {
    const unsubs: Unsubscribe[] = [];

    if (isCloudAdmin) {
      unsubs.push(
        subscribePublicCollection<Order>('orders', (items, meta) => {
          setHasPendingWrites(meta.hasPendingWrites);
          if (items.length > 0) saveOrders(items);
        }),
        subscribePublicCollection<CloudInvoice>('invoices', (items) => {
          if (items.length > 0) {
            setInvoices(items);
            persistLocal('sitara_invoices', items);
          }
        }),
        subscribePublicCollection<KhataAccount>('khataAccounts', (items) => {
          if (items.length > 0) {
            setKhataAccounts(items);
            persistLocal('sitara_khata_accounts', items);
          }
        }),
        subscribePublicCollection<KhataTransaction>('khataTransactions', (items) => {
          if (items.length > 0) {
            setKhataTransactions(items);
            persistLocal('sitara_khata_transactions', items);
          }
        }),
        subscribePublicCollection<Supplier>('suppliers', (items) => {
          if (items.length > 0) {
            setSuppliers(items);
            persistLocal('sitara_suppliers', items);
          }
        }),
        subscribePublicCollection<PurchaseRecord>('purchases', (items) => {
          if (items.length > 0) {
            setPurchases(items);
            persistLocal('sitara_purchases', items);
          }
        }),
        subscribePublicCollection<StaffMember>('staff', (items) => {
          if (items.length > 0) {
            setStaffMembers(items);
            persistLocal('sitara_staff_members', items);
          }
        }),
        subscribePublicCollection<ActivityLog>('activityLogs', (items) => {
          if (items.length > 0) {
            setActivityLogs(items);
            persistLocal('sitara_activity_logs', items);
          }
        }),
        subscribePublicCollection<CloudBackupRecord>('backups', (items) => {
          if (items.length > 0) {
            setCloudBackups(items);
            persistLocal('sitara_cloud_backups', items);
          }
        }),
        subscribePublicCollection<NewsletterSubscriber>('newsletter', (items) => {
          if (items.length > 0) {
            setNewsletterSubscribers(items);
            persistLocal('sitara_newsletter_subscribers', items);
          }
        })
      );
    } else if (firebaseUser?.uid && db) {
      // Customer-scoped query matching firestore.rules `allow list: if resource.data.customerUid == request.auth.uid`
      const qOrders = query(collection(db, 'orders'), where('customerUid', '==', firebaseUser.uid));
      unsubs.push(
        onSnapshot(
          qOrders,
          (snap) => {
            const custOrders = snap.docs.map((d) => ({ ...(d.data() as object), id: d.id }) as Order);
            if (custOrders.length > 0) {
              setOrders((prev) => {
                const map = new Map(prev.map((o) => [o.id, o]));
                custOrders.forEach((o) => map.set(o.id, o));
                return Array.from(map.values());
              });
            }
          },
          () => {}
        )
      );
    }

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [isCloudAdmin, firebaseUser?.uid]);

  return (
    <ShopContext.Provider
      value={{
        lang,
        setLang,
        t,
        aiTranslating,
        detectedGeo,
        selectedCountry,
        setSelectedCountry,
        visitorTimezone,
        setVisitorTimezone,
        buyingMode,
        setBuyingMode,
        getEffectiveUnitPrice,
        products,
        shopProfile,
        cart,
        wishlist,
        orders,
        reviews,
        user,
        firebaseUser,
        cloudSync,
        signInWithGoogle,
        signOutCloud,
        syncCatalogToCloudNow,
        filters,
        setFilters,
        resetFilters,
        selectedProduct,
        setSelectedProduct,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isAuthOpen,
        setIsAuthOpen,
        isAdminOpen,
        setIsAdminOpen,
        isReviewModalOpen,
        setIsReviewModalOpen,
        isMediaLibraryOpen,
        setIsMediaLibraryOpen,
        isCameraModalOpen,
        setIsCameraModalOpen,
        adminProfile,
        updateAdminProfile,
        mediaLibrary,
        addMediaAsset,
        deleteMediaAsset,
        usersList,
        updateUserStatus,
        addUserAccount,
        approveListing,
        rejectListing,
        banners,
        sliderSettings,
        addBanner,
        updateBanner,
        deleteBanner,
        reorderBanners,
        updateSliderSettings,
        logoConfig,
        updateLogoConfig,
        isLogoModalOpen,
        setIsLogoModalOpen,
        currentTheme,
        setTheme,
        currency,
        setCurrency,
        exchangeRates,
        updateExchangeRate,
        refreshExchangeRates,
        fxSource,
        fxUpdatedAt,
        isRefreshingFx,
        formatPrice,
        currencyConfig,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        placeOrder,
        updateOrderStatus,
        addProduct,
        updateProduct,
        deleteProduct,
        updateStock,
        updateShopProfile,
        addReview,
        loginUser,
        logoutUser,
        newsletterSubscribers,
        subscribeNewsletter,
        invoices,
        createCloudInvoice,
        khataAccounts,
        khataTransactions,
        addKhataAccount,
        recordKhataTransaction,
        suppliers,
        purchases,
        addSupplier,
        recordPurchase,
        staffMembers,
        addStaffMember,
        updateStaffMember,
        activityLogs,
        logActivity,
        cloudBackups,
        createCloudBackupSnapshot,
        restoreFromCloudBackup,
      }}
    >
      <div dir={isLanguageRtl(lang) ? 'rtl' : 'ltr'} className={lang === 'ur' || lang === 'pa' ? 'font-urdu' : ''}>
        {children}
      </div>
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
