import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import {
  ActivityLog,
  BannerItem,
  CloudBackupRecord,
  CloudInvoice,
  CurrencyCode,
  KhataAccount,
  KhataTransaction,
  LogoConfig,
  NewsletterSubscriber,
  Order,
  Product,
  PurchaseRecord,
  Review,
  ShopProfile,
  StaffMember,
  Supplier,
  ThemeId,
} from '../types';

export function sanitizeDocId(raw: string, fallbackPrefix = 'doc'): string {
  const cleaned = (raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_\-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
  return cleaned || `${fallbackPrefix}-${Date.now()}`;
}

function truncateStr(val: unknown, maxLen: number): string {
  const str = typeof val === 'string' ? val : String(val ?? '');
  return str.slice(0, maxLen);
}

// --- Blueprint-strict payload sanitizers (Zero shadow fields, bounded strings/arrays, no PII on public products) ---

export function buildFirestoreProductPayload(product: Product) {
  return {
    id: sanitizeDocId(product.id, 'prod'),
    sku: truncateStr(product.sku || 'SCH-001', 40),
    title: truncateStr(product.title || 'Luxury Fabric', 160),
    titleUrdu: truncateStr(product.titleUrdu || '', 160),
    gender: product.gender,
    category: truncateStr(product.category || 'boski', 40),
    categoryLabel: truncateStr(product.categoryLabel || 'Luxury Collection', 80),
    price: Number(product.price) || 0,
    costPrice: Number(product.costPrice ?? Math.round((Number(product.price) || 0) * 0.72)),
    originalPrice: Number(product.originalPrice ?? product.price ?? 0),
    wholesalePrice: Number(product.wholesalePrice ?? Math.round((Number(product.price) || 0) * 0.8)),
    wholesaleMinQty: Math.max(1, Number(product.wholesaleMinQty ?? 5)),
    discountPercent: Number(product.discountPercent ?? 0),
    image: truncateStr(product.image || '/assets/images/awais_malik_avatar.svg', 2000),
    additionalImages: (product.additionalImages || []).slice(0, 10).map((u) => truncateStr(u, 1000)),
    videoUrl: truncateStr(product.videoUrl || '', 2000),
    fabricType: truncateStr(product.fabricType || 'Fine Fabric', 120),
    fabricTypeUrdu: truncateStr(product.fabricTypeUrdu || '', 120),
    cutMeters: truncateStr(product.cutMeters || '4.5 Meters', 80),
    season: product.season || 'All-Season',
    weaveQuality: truncateStr(product.weaveQuality || 'Premium Weave', 160),
    isUnstitched: Boolean(product.isUnstitched),
    availableSizes: (product.availableSizes || []).slice(0, 20).map((s) => truncateStr(s, 40)),
    colors: (product.colors || []).slice(0, 20).map((c) => ({
      name: truncateStr(c.name, 40),
      hex: truncateStr(c.hex, 20),
    })),
    stockQuantity: Math.max(0, Number(product.stockQuantity) || 0),
    isFeatured: Boolean(product.isFeatured),
    isNewArrival: Boolean(product.isNewArrival),
    isSpecialOffer: Boolean(product.isSpecialOffer),
    description: truncateStr(product.description || '', 2000),
    descriptionUrdu: truncateStr(product.descriptionUrdu || '', 2000),
    careInstructions: truncateStr(product.careInstructions || '', 300),
    rating: Number(product.rating) || 5,
    reviewCount: Number(product.reviewCount) || 1,
    listingType: product.listingType || 'fabric',
    approvalStatus: product.approvalStatus || 'approved',
    location: truncateStr(product.location || 'Khudadad Market Kotli', 120),
    updatedAt: serverTimestamp(),
  };
}

export function buildFirestoreBannerPayload(banner: BannerItem) {
  return {
    id: sanitizeDocId(banner.id, 'banner'),
    title: truncateStr(banner.title || 'Sitara Collection', 160),
    titleUrdu: truncateStr(banner.titleUrdu || '', 160),
    subtitle: truncateStr(banner.subtitle || '', 240),
    subtitleUrdu: truncateStr(banner.subtitleUrdu || '', 240),
    description: truncateStr(banner.description || '', 500),
    descriptionUrdu: truncateStr(banner.descriptionUrdu || '', 500),
    badgeText: truncateStr(banner.badgeText || '', 60),
    badgeUrdu: truncateStr(banner.badgeUrdu || '', 60),
    badgeType: banner.badgeType || 'luxury',
    imageUrl: truncateStr(banner.imageUrl || '/favicon.svg', 2000),
    mobileImageUrl: truncateStr(banner.mobileImageUrl || banner.imageUrl || '/favicon.svg', 2000),
    categoryTarget: banner.categoryTarget || 'all',
    fabricCategory: banner.fabricCategory || 'all',
    linkedProductId: truncateStr(banner.linkedProductId || '', 128),
    primaryButtonText: truncateStr(banner.primaryButtonText || 'Shop Now', 60),
    primaryButtonTextUrdu: truncateStr(banner.primaryButtonTextUrdu || 'ابھی خریدیں', 60),
    primaryButtonAction: banner.primaryButtonAction || 'shop',
    secondaryButtonText: truncateStr(banner.secondaryButtonText || '', 60),
    secondaryButtonTextUrdu: truncateStr(banner.secondaryButtonTextUrdu || '', 60),
    secondaryButtonAction: banner.secondaryButtonAction || 'whatsapp',
    discountPercent: Number(banner.discountPercent ?? 0),
    startDate: truncateStr(banner.startDate || '', 30),
    expiryDate: truncateStr(banner.expiryDate || '', 30),
    isActive: Boolean(banner.isActive),
    order: Math.max(0, Number(banner.order) || 0),
    textAlignment: banner.textAlignment || 'left',
    overlayDarkness: Number(banner.overlayDarkness ?? 60),
    updatedAt: serverTimestamp(),
  };
}

// --- Real-Time Listeners ---

export function subscribePublicCollection<T>(
  collectionName: string,
  onData: (items: T[], meta: { fromCache: boolean; hasPendingWrites: boolean }) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  if (!db) return () => {};
  const ref = collection(db, collectionName);
  return onSnapshot(
    ref,
    { includeMetadataChanges: true },
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ ...(d.data() as object), id: d.id }) as T);
      onData(items, {
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
      });
    },
    (error) => {
      console.warn(`[CloudSync] Snapshot listener on ${collectionName}:`, error.message);
      if (onError) onError(error);
    }
  );
}

export function subscribeStorefrontConfig(
  onData: (data: Partial<ShopProfile> & {
    logoConfig?: LogoConfig;
    exchangeRates?: Record<CurrencyCode, number>;
    currentTheme?: ThemeId;
  }) => void
): Unsubscribe {
  if (!db) return () => {};
  const ref = doc(db, 'config', 'storefront');
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as Record<string, unknown>);
      }
    },
    (error) => {
      console.warn('[CloudSync] Config listener notice:', error.message);
    }
  );
}

// --- Admin / ERP Write Helpers ---

export async function syncProductToCloud(product: Product): Promise<void> {
  if (!db) return;
  const id = sanitizeDocId(product.id, 'prod');
  const path = `products/${id}`;
  try {
    await setDoc(doc(db, 'products', id), buildFirestoreProductPayload({ ...product, id }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProductFromCloud(productId: string): Promise<void> {
  if (!db) return;
  const id = sanitizeDocId(productId, 'prod');
  const path = `products/${id}`;
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncBannerToCloud(banner: BannerItem): Promise<void> {
  if (!db) return;
  const id = sanitizeDocId(banner.id, 'banner');
  const path = `banners/${id}`;
  try {
    await setDoc(doc(db, 'banners', id), buildFirestoreBannerPayload({ ...banner, id }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBannerFromCloud(bannerId: string): Promise<void> {
  if (!db) return;
  const id = sanitizeDocId(bannerId, 'banner');
  const path = `banners/${id}`;
  try {
    await deleteDoc(doc(db, 'banners', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncStorefrontConfigToCloud(
  shopProfile: ShopProfile,
  extra?: {
    logoConfig?: LogoConfig;
    exchangeRates?: Record<CurrencyCode, number>;
    currentTheme?: ThemeId;
  }
): Promise<void> {
  if (!db) return;
  const path = 'config/storefront';
  try {
    await setDoc(doc(db, 'config', 'storefront'), {
      name: truncateStr(shopProfile.name, 120),
      nameUrdu: truncateStr(shopProfile.nameUrdu, 120),
      slogan: truncateStr(shopProfile.slogan, 200),
      sloganUrdu: truncateStr(shopProfile.sloganUrdu, 200),
      address: truncateStr(shopProfile.address, 240),
      addressUrdu: truncateStr(shopProfile.addressUrdu, 240),
      market: truncateStr(shopProfile.market, 120),
      city: truncateStr(shopProfile.city, 80),
      region: truncateStr(shopProfile.region, 80),
      country: truncateStr(shopProfile.country, 80),
      phone: truncateStr(shopProfile.phone, 40),
      whatsapp: truncateStr(shopProfile.whatsapp, 40),
      email: truncateStr(shopProfile.email, 160),
      announcementEn: truncateStr(shopProfile.announcementEn, 300),
      announcementUr: truncateStr(shopProfile.announcementUr, 300),
      openingHours: truncateStr(shopProfile.openingHours, 120),
      fridayHours: truncateStr(shopProfile.fridayHours, 120),
      googleMapUrl: truncateStr(shopProfile.googleMapUrl, 500),
      facebookUrl: truncateStr(shopProfile.facebookUrl, 300),
      instagramUrl: truncateStr(shopProfile.instagramUrl, 300),
      freeShippingThreshold: Number(shopProfile.freeShippingThreshold) || 4500,
      ownerName: truncateStr(shopProfile.ownerName, 100),
      ownerNameUrdu: truncateStr(shopProfile.ownerNameUrdu, 100),
      ...(extra?.logoConfig ? { logoConfig: extra.logoConfig } : {}),
      ...(extra?.exchangeRates ? { exchangeRates: extra.exchangeRates } : {}),
      ...(extra?.currentTheme ? { currentTheme: extra.currentTheme } : {}),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncOrderToCloud(order: Order, customerUid: string, isNew: boolean): Promise<void> {
  if (!db) return;
  const id = sanitizeDocId(order.id, 'ord');
  const path = `orders/${id}`;
  try {
    await setDoc(doc(db, 'orders', id), {
      id,
      orderNumber: truncateStr(order.orderNumber, 40),
      date: truncateStr(order.date, 30),
      customerUid: sanitizeDocId(customerUid, 'usr'),
      ...(order.salesmanUid ? { salesmanUid: sanitizeDocId(order.salesmanUid, 'stf') } : {}),
      customer: {
        fullName: truncateStr(order.customer.fullName, 120),
        phone: truncateStr(order.customer.phone, 30),
        whatsapp: truncateStr(order.customer.whatsapp || order.customer.phone, 30),
        email: truncateStr(order.customer.email || '', 160),
        address: truncateStr(order.customer.address, 300),
        city: truncateStr(order.customer.city, 80),
        provinceOrState: truncateStr(order.customer.provinceOrState || 'Azad Kashmir', 80),
        country: truncateStr(order.customer.country || 'Pakistan', 80),
        countryCode: truncateStr(order.customer.countryCode || 'PK', 10),
        dialCode: truncateStr(order.customer.dialCode || '+92', 12),
        timezone: truncateStr(order.customer.timezone || 'Asia/Karachi', 80),
        postalCode: truncateStr(order.customer.postalCode || '', 30),
      },
      items: order.items.slice(0, 50).map((it) => ({
        productId: sanitizeDocId(it.product.id, 'prod'),
        title: truncateStr(it.product.title, 160),
        sku: truncateStr(it.product.sku, 40),
        price: Number(it.product.price) || 0,
        quantity: Math.max(1, Number(it.quantity) || 1),
        selectedColor: truncateStr(it.selectedColor || '', 40),
      })),
      subtotal: Number(order.subtotal) || 0,
      discount: Number(order.discount) || 0,
      shippingFee: Number(order.shippingFee) || 0,
      total: Number(order.total) || 0,
      orderCurrency: truncateStr(order.orderCurrency || 'PKR', 10),
      exchangeRate: Number(order.exchangeRate) > 0 ? Number(order.exchangeRate) : 1,
      promoCodeApplied: truncateStr(order.promoCodeApplied || '', 40),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus || (order.paymentMethod === 'cod' ? 'cod_due' : 'pending'),
      paymentReference: truncateStr(order.paymentReference || '', 120),
      courier: truncateStr(order.courier || '', 120),
      buyingMode: order.buyingMode === 'wholesale' ? 'wholesale' : 'retail',
      status: order.status,
      whatsappNotificationSent: Boolean(order.whatsappNotificationSent),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: !isNew });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncReviewToCloud(review: Review, userId: string): Promise<void> {
  if (!db) return;
  const id = sanitizeDocId(review.id, 'rev');
  const path = `reviews/${id}`;
  try {
    await setDoc(doc(db, 'reviews', id), {
      id,
      userId: sanitizeDocId(userId, 'usr'),
      author: truncateStr(review.author, 80),
      authorLocation: truncateStr(review.authorLocation, 100),
      rating: Math.min(5, Math.max(1, Number(review.rating) || 5)),
      date: truncateStr(review.date, 30),
      comment: truncateStr(review.comment, 1000),
      commentUrdu: truncateStr(review.commentUrdu || '', 1000),
      verifiedPurchase: Boolean(review.verifiedPurchase),
      productTitle: truncateStr(review.productTitle || '', 160),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function syncNewsletterToCloud(sub: NewsletterSubscriber): Promise<void> {
  if (!db) return;
  const id = sanitizeDocId(sub.id, 'sub');
  const path = `newsletter/${id}`;
  try {
    await setDoc(doc(db, 'newsletter', id), {
      id,
      email: truncateStr(sub.email.trim().toLowerCase(), 160),
      promoCode: 'LUXURY10',
      subscribedAt: truncateStr(sub.subscribedAt, 40),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function syncInvoiceToCloud(invoice: CloudInvoice): Promise<void> {
  if (!db) return;
  const id = sanitizeDocId(invoice.id, 'inv');
  const path = `invoices/${id}`;
  try {
    await setDoc(doc(db, 'invoices', id), {
      id,
      invoiceNumber: truncateStr(invoice.invoiceNumber, 40),
      date: truncateStr(invoice.date, 30),
      ...(invoice.customerId ? { customerId: sanitizeDocId(invoice.customerId, 'khata') } : {}),
      customerName: truncateStr(invoice.customerName, 120),
      customerPhone: truncateStr(invoice.customerPhone || '', 30),
      items: invoice.items.slice(0, 50),
      subtotal: Number(invoice.subtotal) || 0,
      discount: Number(invoice.discount) || 0,
      taxAmount: Number(invoice.taxAmount) || 0,
      total: Number(invoice.total) || 0,
      paidAmount: Number(invoice.paidAmount) || 0,
      dueAmount: Number(invoice.dueAmount) || 0,
      paymentType: invoice.paymentType,
      salesmanName: truncateStr(invoice.salesmanName || 'Awais Malik', 100),
      salesmanUid: truncateStr(invoice.salesmanUid || auth?.currentUser?.uid || 'admin', 128),
      notes: truncateStr(invoice.notes || '', 400),
      status: invoice.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncKhataAccountToCloud(account: KhataAccount): Promise<void> {
  if (!db) return;
  const id = sanitizeDocId(account.id, 'khata');
  const path = `khataAccounts/${id}`;
  try {
    await setDoc(doc(db, 'khataAccounts', id), {
      id,
      customerName: truncateStr(account.customerName, 120),
      customerNameUrdu: truncateStr(account.customerNameUrdu || '', 120),
      phone: truncateStr(account.phone, 30),
      address: truncateStr(account.address || '', 240),
      openingBalance: Number(account.openingBalance) || 0,
      currentBalance: Number(account.currentBalance) || 0,
      creditLimit: Number(account.creditLimit ?? 100000),
      lastActivityDate: truncateStr(account.lastActivityDate, 30),
      notes: truncateStr(account.notes || '', 500),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncKhataTransactionAtomicToCloud(
  account: KhataAccount,
  tx: KhataTransaction
): Promise<void> {
  if (!db) return;
  const accId = sanitizeDocId(account.id, 'khata');
  const txId = sanitizeDocId(tx.id, 'ktx');
  const path = `khataTransactions/${txId}`;
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'khataAccounts', accId), {
      id: accId,
      customerName: truncateStr(account.customerName, 120),
      customerNameUrdu: truncateStr(account.customerNameUrdu || '', 120),
      phone: truncateStr(account.phone, 30),
      address: truncateStr(account.address || '', 240),
      openingBalance: Number(account.openingBalance) || 0,
      currentBalance: Number(account.currentBalance) || 0,
      creditLimit: Number(account.creditLimit ?? 100000),
      lastActivityDate: truncateStr(account.lastActivityDate, 30),
      notes: truncateStr(account.notes || '', 500),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'khataTransactions', txId), {
      id: txId,
      accountId: accId,
      customerName: truncateStr(tx.customerName, 120),
      type: tx.type,
      amount: Math.max(1, Number(tx.amount) || 0),
      description: truncateStr(tx.description, 300),
      referenceInvoice: truncateStr(tx.referenceInvoice || '', 60),
      recordedBy: truncateStr(tx.recordedBy || 'Awais Malik', 100),
      date: truncateStr(tx.date, 30),
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncSupplierToCloud(supplier: Supplier): Promise<void> {
  if (!db) return;
  const id = sanitizeDocId(supplier.id, 'sup');
  const path = `suppliers/${id}`;
  try {
    await setDoc(doc(db, 'suppliers', id), {
      id,
      name: truncateStr(supplier.name, 120),
      companyName: truncateStr(supplier.companyName, 140),
      city: truncateStr(supplier.city || 'Lahore', 80),
      phone: truncateStr(supplier.phone, 30),
      category: truncateStr(supplier.category || 'Wholesale Fabrics', 80),
      totalPurchased: Math.max(0, Number(supplier.totalPurchased) || 0),
      balancePayable: Number(supplier.balancePayable) || 0,
      notes: truncateStr(supplier.notes || '', 500),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncPurchaseAtomicToCloud(
  supplier: Supplier,
  purchase: PurchaseRecord
): Promise<void> {
  if (!db) return;
  const supId = sanitizeDocId(supplier.id, 'sup');
  const purId = sanitizeDocId(purchase.id, 'pur');
  const path = `purchases/${purId}`;
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'suppliers', supId), {
      id: supId,
      name: truncateStr(supplier.name, 120),
      companyName: truncateStr(supplier.companyName, 140),
      city: truncateStr(supplier.city || 'Lahore', 80),
      phone: truncateStr(supplier.phone, 30),
      category: truncateStr(supplier.category || 'Wholesale Fabrics', 80),
      totalPurchased: Math.max(0, Number(supplier.totalPurchased) || 0),
      balancePayable: Number(supplier.balancePayable) || 0,
      notes: truncateStr(supplier.notes || '', 500),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'purchases', purId), {
      id: purId,
      supplierId: supId,
      supplierName: truncateStr(purchase.supplierName, 120),
      billNumber: truncateStr(purchase.billNumber, 60),
      date: truncateStr(purchase.date, 30),
      items: purchase.items.slice(0, 50),
      totalAmount: Math.max(0, Number(purchase.totalAmount) || 0),
      paidAmount: Math.max(0, Number(purchase.paidAmount) || 0),
      balanceDue: Number(purchase.balanceDue) || 0,
      notes: truncateStr(purchase.notes || '', 500),
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncStaffMemberToCloud(staff: StaffMember): Promise<void> {
  if (!db) return;
  const id = sanitizeDocId(staff.id, 'stf');
  const path = `staff/${id}`;
  try {
    await setDoc(doc(db, 'staff', id), {
      id,
      uid: sanitizeDocId(staff.uid || id, 'stf'),
      name: truncateStr(staff.name, 100),
      nameUrdu: truncateStr(staff.nameUrdu || '', 100),
      phone: truncateStr(staff.phone, 30),
      email: truncateStr(staff.email || '', 160),
      role: staff.role,
      commissionPercent: Number(staff.commissionPercent) || 0,
      monthlyTarget: Number(staff.monthlyTarget) || 0,
      totalSalesAmount: Number(staff.totalSalesAmount) || 0,
      status: staff.status,
      joinedDate: truncateStr(staff.joinedDate, 30),
      notes: truncateStr(staff.notes || '', 400),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncActivityLogToCloud(log: ActivityLog): Promise<void> {
  if (!db || !auth) return;
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const id = sanitizeDocId(log.id, 'log');
  const path = `activityLogs/${id}`;
  try {
    await setDoc(doc(db, 'activityLogs', id), {
      id,
      actorUid: sanitizeDocId(uid, 'usr'),
      actorEmail: truncateStr(auth.currentUser?.email || log.actorEmail || '', 160),
      actorName: truncateStr(log.actorName || auth.currentUser?.displayName || 'Admin', 100),
      action: truncateStr(log.action, 80),
      module: truncateStr(log.module, 60),
      details: truncateStr(log.details, 400),
      severity: log.severity || 'info',
      timestamp: truncateStr(log.timestamp, 40),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function syncCloudBackupSnapshot(backup: CloudBackupRecord): Promise<void> {
  if (!db || !auth) return;
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const id = sanitizeDocId(backup.id, 'bkp');
  const path = `backups/${id}`;
  try {
    await setDoc(doc(db, 'backups', id), {
      id,
      title: truncateStr(backup.title, 120),
      createdByUid: sanitizeDocId(uid, 'usr'),
      createdByName: truncateStr(backup.createdByName || 'Awais Malik', 100),
      version: truncateStr(backup.version, 30),
      summaryCounts: backup.summaryCounts,
      snapshotData: backup.snapshotData,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function pushFullCatalogSeedToCloud(
  products: Product[],
  banners: BannerItem[],
  shopProfile: ShopProfile,
  extra?: {
    logoConfig?: LogoConfig;
    exchangeRates?: Record<CurrencyCode, number>;
    currentTheme?: ThemeId;
  }
): Promise<void> {
  if (!db) return;
  const batch = writeBatch(db);
  for (const product of products.slice(0, 150)) {
    const id = sanitizeDocId(product.id, 'prod');
    batch.set(doc(db, 'products', id), buildFirestoreProductPayload({ ...product, id }));
  }
  for (const banner of banners.slice(0, 50)) {
    const id = sanitizeDocId(banner.id, 'banner');
    batch.set(doc(db, 'banners', id), buildFirestoreBannerPayload({ ...banner, id }));
  }
  await batch.commit();
  await syncStorefrontConfigToCloud(shopProfile, extra);
}

// --- Security Wall Firestore Cloud Sync (Admin-Only Zero Trust) ---

export async function syncSecurityConfigToCloud(config: {
  firewallEnabled: boolean;
  emergencyMode: boolean;
  require2faEmailOtp: boolean;
  ddosProtectionEnabled: boolean;
  rateLimitRpm: number;
  authRateLimitPerMin: number;
  bruteForceMaxAttempts: number;
  bruteForceLockMinutes: number;
  maxUploadSizeMb: number;
  autoBlockAfterThreats: number;
  suspiciousLoginAlerts: boolean;
}): Promise<void> {
  if (!db || !auth) return;
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const path = 'securityConfig/wall';
  try {
    await setDoc(doc(db, 'securityConfig', 'wall'), {
      id: 'wall',
      firewallEnabled: Boolean(config.firewallEnabled),
      emergencyMode: Boolean(config.emergencyMode),
      require2faEmailOtp: Boolean(config.require2faEmailOtp),
      ddosProtectionEnabled: Boolean(config.ddosProtectionEnabled),
      rateLimitRpm: Math.min(1000, Math.max(10, Number(config.rateLimitRpm) || 90)),
      authRateLimitPerMin: Math.min(60, Math.max(3, Number(config.authRateLimitPerMin) || 12)),
      bruteForceMaxAttempts: Math.min(20, Math.max(3, Number(config.bruteForceMaxAttempts) || 5)),
      bruteForceLockMinutes: Math.min(120, Math.max(1, Number(config.bruteForceLockMinutes) || 5)),
      maxUploadSizeMb: Math.min(25, Math.max(1, Number(config.maxUploadSizeMb) || 5)),
      autoBlockAfterThreats: Math.min(50, Math.max(2, Number(config.autoBlockAfterThreats) || 5)),
      suspiciousLoginAlerts: Boolean(config.suspiciousLoginAlerts),
      updatedByUid: sanitizeDocId(uid, 'adm'),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncSecurityLogToCloud(evt: {
  id: string;
  ip: string;
  method: string;
  path: string;
  threatType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'blocked' | 'flagged' | 'locked' | 'allowed';
  details: string;
  userAgent?: string;
  timestamp: string;
}): Promise<void> {
  if (!db || !auth) return;
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const id = sanitizeDocId(evt.id, 'sec');
  const path = `securityLogs/${id}`;
  try {
    await setDoc(doc(db, 'securityLogs', id), {
      id,
      actorUid: sanitizeDocId(uid, 'adm'),
      ip: truncateStr(evt.ip || 'unknown', 64),
      method: truncateStr(evt.method || 'GET', 12),
      path: truncateStr(evt.path || '/', 200),
      threatType: truncateStr(evt.threatType || 'policy_change', 60),
      severity: evt.severity,
      action: evt.action,
      details: truncateStr(evt.details || 'Security event', 400),
      ...(evt.userAgent ? { userAgent: truncateStr(evt.userAgent, 160) } : {}),
      timestamp: truncateStr(evt.timestamp || new Date().toISOString(), 40),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function syncBlockedIpToCloud(entry: {
  ip: string;
  reason: string;
  blockedBy: string;
  blockedAt: string;
  threatCount: number;
  autoBlocked: boolean;
}): Promise<void> {
  if (!db || !auth) return;
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const id = sanitizeDocId(`ip-${entry.ip}`, 'ip');
  const path = `securityBlockedIps/${id}`;
  try {
    await setDoc(doc(db, 'securityBlockedIps', id), {
      id,
      ip: truncateStr(entry.ip, 64),
      reason: truncateStr(entry.reason || 'Manual block', 200),
      blockedBy: truncateStr(entry.blockedBy || 'Awais Malik', 100),
      blockedAt: truncateStr(entry.blockedAt || new Date().toISOString(), 40),
      threatCount: Math.max(0, Number(entry.threatCount) || 0),
      autoBlocked: Boolean(entry.autoBlocked),
      createdByUid: sanitizeDocId(uid, 'adm'),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBlockedIpFromCloud(ip: string): Promise<void> {
  if (!db || !auth) return;
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const id = sanitizeDocId(`ip-${ip}`, 'ip');
  const path = `securityBlockedIps/${id}`;
  try {
    await deleteDoc(doc(db, 'securityBlockedIps', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncSecuritySessionToCloud(session: {
  sessionId: string;
  actorEmail: string;
  ip: string;
  authMethod: 'passcode+otp' | 'passcode' | 'google+otp' | 'google';
  twoFactorVerified: boolean;
  revoked: boolean;
}): Promise<void> {
  if (!db || !auth) return;
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const id = sanitizeDocId(session.sessionId, 'sess');
  const path = `securitySessions/${id}`;
  try {
    await setDoc(doc(db, 'securitySessions', id), {
      id,
      sessionId: id,
      actorUid: sanitizeDocId(uid, 'adm'),
      actorEmail: truncateStr(session.actorEmail || '', 160),
      ip: truncateStr(session.ip || 'unknown', 64),
      authMethod: session.authMethod,
      twoFactorVerified: Boolean(session.twoFactorVerified),
      revoked: Boolean(session.revoked),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

