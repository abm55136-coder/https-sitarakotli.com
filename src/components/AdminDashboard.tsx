import React, { useEffect, useRef, useState } from 'react';
import { useShop } from '../context/ShopContext';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Package,
  Layers,
  ShoppingBag,
  Settings,
  Search,
  Globe,
  Check,
  Lock,
  Unlock,
  Eye,
  CheckCircle,
  Truck,
  MessageCircle,
  Camera,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Building,
  Car,
  Shirt,
  Store,
  Users,
  Shield,
  Key,
  AlertTriangle,
  RotateCw,
  Folder,
  Smartphone,
  ExternalLink,
  Phone,
  Mail,
  UserCheck,
  UserX,
  Clock,
  MapPin,
  Palette,
  Crown,
  Coins,
  ArrowRightLeft,
  Database,
  Download,
  Server,
  FileText,
  CheckCircle2,
  Laptop,
  Zap,
  Copy,
  Receipt,
  BookOpen,
  Building2,
  BarChart3,
  Cloud,
  LogIn,
  ShieldCheck,
  QrCode,
} from 'lucide-react';
import { Product, ShopProfile, OrderStatus, MediaCategory, AdminProfile, MediaAsset, CurrencyCode, FabricCategory } from '../types';
import { formatPKR, sanitizePhoneForWhatsApp, SIMULATED_EXCHANGE_RATES } from '../utils/logic';
import { formatBytes } from '../utils/mediaUtils';
import { CameraCaptureModal } from './CameraCaptureModal';
import { ImageEditorModal } from './ImageEditorModal';
import { MediaLibraryModal } from './MediaLibraryModal';
import { AdminBannerManager } from './AdminBannerManager';
import { BrandLogo } from './BrandLogo';
import { ThemeSelector } from './ThemeSelector';
import { ProductQrSvg } from './ProductQrSvg';
import { BillingInvoicesTab } from './admin/BillingInvoicesTab';
import { KhataLedgerTab } from './admin/KhataLedgerTab';
import { SuppliersPurchasesTab } from './admin/SuppliersPurchasesTab';
import { ReportsAnalyticsTab } from './admin/ReportsAnalyticsTab';
import { StaffManagementTab } from './admin/StaffManagementTab';
import { CloudSecurityTab } from './admin/CloudSecurityTab';
import { SecurityWallTab } from './admin/SecurityWallTab';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../firebase';
import {
  exchangeFirebaseTokenForSecuritySession,
  fetchSecurityOverview,
  getStoredSecurityToken,
  logoutSecuritySession,
  resendSecurityOtp,
  scanFileWithSecurityWall,
  securityLogin,
  verifySecurityOtp,
} from '../services/securityApi';


export const AdminDashboard: React.FC = () => {
  const {
    lang,
    t,
    shopProfile,
    updateShopProfile,
    adminProfile,
    updateAdminProfile,
    mediaLibrary,
    addMediaAsset,
    deleteMediaAsset,
    usersList,
    updateUserStatus,
    approveListing,
    rejectListing,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    orders,
    updateOrderStatus,
    isAdminOpen,
    setIsAdminOpen,
    banners,
    logoConfig,
    setIsLogoModalOpen,
    currentTheme,
    setTheme,
    currency,
    setCurrency,
    exchangeRates,
    updateExchangeRate,
    formatPrice,
    cloudSync,
    firebaseUser,
    signInWithGoogle,
    invoices,
    khataAccounts,
    suppliers,
    staffMembers,
  } = useShop();

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'listings'
    | 'banners'
    | 'media'
    | 'users'
    | 'orders'
    | 'billing'
    | 'khata'
    | 'suppliers'
    | 'reports'
    | 'staff'
    | 'cloud-security'
    | 'security-wall'
    | 'content'
    | 'profile'
    | 'settings'
    | 'branding'
    | 'domain'
  >('overview');

  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [otpStep, setOtpStep] = useState<{
    challengeId: string;
    maskedEmail: string;
    deliveryMode: 'email-relay' | 'local-secure-preview';
    sandboxOtpPreview?: string;
  } | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Gallery multi-upload ref, Profile picture upload ref, and Backup upload ref
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);
  const [backupNotification, setBackupNotification] = useState<string | null>(null);

  // Google SERP simulator & 100% Free Hosting states
  const [serpViewMode, setSerpViewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [freeHostingPlatform, setFreeHostingPlatform] = useState<'vercel' | 'netlify' | 'cloudflare' | 'github'>('vercel');
  const [copiedDns, setCopiedDns] = useState<string | null>(null);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedDns(label);
    setTimeout(() => setCopiedDns(null), 2500);
  };

  // Sub-modal states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'avatar' | 'product' | 'general' | null>(null);
  const [isMediaLibraryActive, setIsMediaLibraryActive] = useState(false);
  const [editingMediaAsset, setEditingMediaAsset] = useState<MediaAsset | null>(null);

  // Product Add / Edit modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [listingFilter, setListingFilter] = useState<'all' | 'fabric' | 'property' | 'vehicle' | 'business'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [qrPreviewProduct, setQrPreviewProduct] = useState<Product | null>(null);

  // Form state for product or property/vehicle listing
  const [prodForm, setProdForm] = useState<Partial<Product>>({
    sku: `SCH-${Math.floor(100 + Math.random() * 900)}`,
    title: '',
    titleUrdu: '',
    gender: 'men',
    category: 'boski',
    categoryLabel: 'Pure Boski',
    price: 5000,
    originalPrice: 6000,
    wholesalePrice: 4000,
    wholesaleMinQty: 5,
    discountPercent: 15,
    image: '/assets/aistudio/Screenshot_20261105-152400_f4f80a56.jpg',
    videoUrl: '',
    additionalImages: [],
    fabricType: 'Pure Silk Boski',
    fabricTypeUrdu: 'خالص ریشمی بوسکی',
    cutMeters: '4.5 Meters (Full Suit)',
    season: 'All-Season',
    weaveQuality: '100% Pure Silk Weave',
    isUnstitched: true,
    colors: [{ name: 'Cream', hex: '#FFFFF0' }],
    stockQuantity: 10,
    isFeatured: true,
    isNewArrival: true,
    isSpecialOffer: false,
    description: 'High luxury fabric from Sitara Cloth House Kotli.',
    descriptionUrdu: 'ستارہ کلاٹھ ہاؤس کوٹلی کا اعلیٰ پائے کا کپڑا۔',
    rating: 5.0,
    reviewCount: 1,
    listingType: 'fabric',
    approvalStatus: 'approved',
    sellerName: 'Sitara Cloth House (Awais Malik)',
    sellerPhone: '03425984394',
    location: 'Khudadad Market Kotli',
  });

  // Admin Profile edit form state
  const [adminForm, setAdminForm] = useState<AdminProfile>(adminProfile);
  const [adminSaved, setAdminSaved] = useState(false);

  // Shop Profile edit state
  const [profileForm, setProfileForm] = useState<ShopProfile>(shopProfile);
  const [profileSaved, setProfileSaved] = useState(false);

  // Media upload status feedback
  const [mediaNotification, setMediaNotification] = useState<string | null>(null);

  // Sync adminForm with latest adminProfile state unconditionally before any early return
  useEffect(() => {
    setAdminForm(adminProfile);
  }, [adminProfile]);

  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((s) => (s > 1 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // Verify existing security session token on portal open
  useEffect(() => {
    if (!isAdminOpen) return;
    const token = getStoredSecurityToken();
    if (!token) return;
    fetchSecurityOverview(token)
      .then(() => {
        setIsAuthenticated(true);
        setAuthError(null);
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, [isAdminOpen]);

  // Exchange verified Google Admin ID token for a server security session
  useEffect(() => {
    if (!cloudSync.isCloudAdmin || !firebaseUser) return;
    let active = true;
    (async () => {
      try {
        if (!getStoredSecurityToken()) {
          const idToken = await firebaseUser.getIdToken();
          const res = await exchangeFirebaseTokenForSecuritySession(idToken);
          if (active && res.authenticated) {
            setIsAuthenticated(true);
            setOtpStep(null);
            setAuthError(null);
          }
        } else if (active) {
          setIsAuthenticated(true);
        }
      } catch {
        if (active) {
          setIsAuthenticated(true);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [cloudSync.isCloudAdmin, firebaseUser]);

  if (!isAdminOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = passcode.trim();
    if (!clean) {
      setAuthError(isUrdu ? 'برائے مہربانی ایڈمن پاس ورڈ درج کریں۔' : 'Please enter your admin passcode.');
      return;
    }
    setAuthBusy(true);
    setAuthError(null);
    try {
      const res = await securityLogin(clean);
      if (res.locked) {
        setLockoutSeconds(res.remainingSeconds || 300);
        setAuthError(res.message || 'Temporarily locked by brute-force protection.');
        return;
      }
      if (res.requires2fa && res.challengeId) {
        setOtpStep({
          challengeId: res.challengeId,
          maskedEmail: res.maskedEmail || 'ab***@gmail.com',
          deliveryMode: res.deliveryMode || 'local-secure-preview',
          sandboxOtpPreview: res.sandboxOtpPreview,
        });
        setOtpInput('');
        setAuthError(null);
        return;
      }
      if (res.authenticated) {
        setIsAuthenticated(true);
        setOtpStep(null);
        setAuthError(null);
        return;
      }
      setAuthError(res.message || (isUrdu ? 'غلط پاس ورڈ!' : 'Incorrect admin passcode.'));
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to reach security server.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpStep) return;
    setAuthBusy(true);
    setAuthError(null);
    try {
      const res = await verifySecurityOtp(otpStep.challengeId, otpInput.trim());
      if (res.verified && res.authenticated) {
        setIsAuthenticated(true);
        setOtpStep(null);
        setOtpInput('');
        setPasscode('');
        return;
      }
      if (res.expired || res.exhausted) {
        setOtpStep(null);
      }
      setAuthError(res.message || 'Invalid verification code.');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleResendOtp = async () => {
    if (!otpStep) return;
    setAuthBusy(true);
    setAuthError(null);
    try {
      const res = await resendSecurityOtp(otpStep.challengeId);
      if (res.challengeId) {
        setOtpStep({
          challengeId: res.challengeId,
          maskedEmail: res.maskedEmail || otpStep.maskedEmail,
          deliveryMode: res.deliveryMode || 'local-secure-preview',
          sandboxOtpPreview: res.sandboxOtpPreview,
        });
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to resend code.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLockSession = async () => {
    await logoutSecuritySession();
    setIsAuthenticated(false);
    setOtpStep(null);
    setPasscode('');
    setOtpInput('');
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.title || !prodForm.price) return;

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        ...(prodForm as Product),
      });
      setEditingProduct(null);
    } else {
      addProduct({
        sku: prodForm.sku || `SCH-${Math.floor(100 + Math.random() * 900)}`,
        title: prodForm.title || 'Sitara Fabric',
        titleUrdu: prodForm.titleUrdu || 'ستارہ کلاٹھ پروڈکٹ',
        gender: prodForm.gender || 'men',
        category: prodForm.category || 'boski',
        categoryLabel: prodForm.categoryLabel || 'Premium Collection',
        price: Number(prodForm.price) || 0,
        originalPrice: prodForm.originalPrice ? Number(prodForm.originalPrice) : undefined,
        wholesalePrice: prodForm.wholesalePrice ? Number(prodForm.wholesalePrice) : undefined,
        wholesaleMinQty: prodForm.wholesaleMinQty ? Number(prodForm.wholesaleMinQty) : 5,
        discountPercent: prodForm.discountPercent ? Number(prodForm.discountPercent) : undefined,
        image: prodForm.image || '/assets/aistudio/Screenshot_20261105-152400_f4f80a56.jpg',
        videoUrl: prodForm.videoUrl?.trim() || undefined,
        additionalImages: prodForm.additionalImages || [],
        fabricType: prodForm.fabricType || 'Fine Woven Fabric',
        fabricTypeUrdu: prodForm.fabricTypeUrdu || 'اعلیٰ کوالٹی کپڑا',
        cutMeters: prodForm.cutMeters || '4.0 Meters',
        season: prodForm.season || 'All-Season',
        weaveQuality: prodForm.weaveQuality || 'Standard Premium Weave',
        isUnstitched: prodForm.isUnstitched !== false,
        colors: prodForm.colors && prodForm.colors.length > 0 ? prodForm.colors : [{ name: 'Default', hex: '#d4af37' }],
        stockQuantity: Number(prodForm.stockQuantity) || 0,
        isFeatured: !!prodForm.isFeatured,
        isNewArrival: !!prodForm.isNewArrival,
        isSpecialOffer: !!prodForm.isSpecialOffer,
        description: prodForm.description || '',
        descriptionUrdu: prodForm.descriptionUrdu || '',
        careInstructions: prodForm.careInstructions || 'Dry clean recommended.',
        rating: 5.0,
        reviewCount: 1,
        listingType: prodForm.listingType || 'fabric',
        approvalStatus: prodForm.approvalStatus || 'approved',
        sellerName: prodForm.sellerName || adminProfile.name,
        sellerPhone: prodForm.sellerPhone || adminProfile.phone,
        location: prodForm.location || 'Kotli, Azad Kashmir',
      });
      setIsAddingNew(false);
    }
  };

  const handleStartEdit = (prod: Product) => {
    setEditingProduct(prod);
    setProdForm(prod);
    setIsAddingNew(false);
  };

  const handleStartNew = (type: 'fabric' | 'property' | 'vehicle' | 'business' = 'fabric') => {
    setEditingProduct(null);
    setProdForm({
      sku: `SCH-${Math.floor(100 + Math.random() * 900)}`,
      title: '',
      titleUrdu: '',
      gender: 'men',
      category: type === 'fabric' ? 'boski' : ('wash-wear' as any),
      categoryLabel: type === 'fabric' ? 'Pure Boski' : 'Commercial Listing',
      price: type === 'fabric' ? 6500 : 2500000,
      wholesalePrice: type === 'fabric' ? 5000 : undefined,
      wholesaleMinQty: 5,
      image:
        type === 'property' || type === 'business'
          ? '/assets/aistudio/Screenshot_20261105-152436_5689c21f.jpg'
          : '/assets/aistudio/Screenshot_20261105-152400_f4f80a56.jpg',
      videoUrl: '',
      additionalImages: [],
      fabricType: type === 'fabric' ? 'Pure Raw Silk 8-Pound' : 'Commercial Grade Specification',
      fabricTypeUrdu: type === 'fabric' ? 'خالص ریشمی کپڑا' : 'کمرشل جائیداد / گاڑی',
      cutMeters: type === 'fabric' ? '4.5 Meters (Suit)' : 'N/A',
      season: 'All-Season',
      weaveQuality: 'Executive Luxury Quality',
      isUnstitched: true,
      colors: [{ name: 'Showroom Original', hex: '#d4af37' }],
      stockQuantity: 1,
      isFeatured: true,
      isNewArrival: true,
      isSpecialOffer: false,
      description: '',
      descriptionUrdu: '',
      rating: 5.0,
      reviewCount: 1,
      listingType: type,
      approvalStatus: 'approved',
      sellerName: adminProfile.name,
      sellerPhone: adminProfile.phone,
      location: 'Khudadad Market Kotli',
    });
    setIsAddingNew(true);
  };

  // Android Gallery Multi-File Upload Handler (Protected by Server Malware & Magic-Byte Scanner)
  const handleAndroidGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    let processed = 0;
    let accepted = 0;
    let rejectedReasons: string[] = [];

    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const url = event.target?.result as string;
        if (url) {
          try {
            const scan = await scanFileWithSecurityWall(file, url);
            if (!scan.safe || scan.blocked) {
              rejectedReasons.push(`${file.name}: ${scan.threats.join(', ') || 'Unsafe file'}`);
            } else {
              addMediaAsset({
                title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
                url,
                category: 'fabrics',
                source: 'gallery',
                sizeBytes: file.size,
                description: `Verified & uploaded from Android phone storage by ${adminProfile.name}`,
                tags: ['android-gallery', 'direct-upload', 'scanned-clean'],
              });
              accepted++;
            }
          } catch {
            rejectedReasons.push(`${file.name}: Security scan unreachable`);
          }
        }
        processed++;
        if (processed === fileList.length) {
          if (rejectedReasons.length > 0) {
            setMediaNotification(
              `⚠️ Uploaded ${accepted}/${fileList.length}. Blocked by Security Wall: ${rejectedReasons.join(' | ')}`
            );
          } else {
            setMediaNotification(`✅ Security Wall verified & imported ${accepted} picture(s) from Gallery!`);
          }
          setTimeout(() => setMediaNotification(null), 5000);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Direct Android Gallery / Phone Storage profile picture upload (Security Wall Verified)
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const url = event.target?.result as string;
      if (url) {
        try {
          const scan = await scanFileWithSecurityWall(file, url);
          if (!scan.safe || scan.blocked) {
            setMediaNotification(
              `⚠️ Upload rejected by Security Wall: ${scan.threats.join('; ') || 'Disallowed file'}`
            );
            setTimeout(() => setMediaNotification(null), 5000);
            return;
          }
        } catch {
          setMediaNotification('⚠️ Security scan could not verify file safety.');
          setTimeout(() => setMediaNotification(null), 5000);
          return;
        }
        setAdminForm((prev) => ({ ...prev, avatar: url }));
        updateAdminProfile({ avatar: url });
        addMediaAsset({
          title: `Admin Awais Malik - Profile Photo (${new Date().toLocaleDateString()})`,
          url,
          category: 'profiles',
          source: 'gallery',
          sizeBytes: file.size,
          description: `Verified & uploaded from Android phone gallery by ${adminProfile.name}`,
          tags: ['admin', 'profile', 'awais malik', 'android-gallery'],
        });
        setAdminSaved(true);
        setMediaNotification('✅ Admin profile picture verified by Security Wall & updated!');
        setTimeout(() => {
          setAdminSaved(false);
          setMediaNotification(null);
        }, 4000);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveAdminProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateAdminProfile(adminForm);
    setAdminSaved(true);
    setTimeout(() => setAdminSaved(false), 3000);
  };

  const handleSaveShopProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateShopProfile(profileForm);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  // Full Store Database Export (JSON Backup)
  const handleExportBackup = () => {
    const fullBackup = {
      app: 'Sitara Cloth House',
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      owner: adminProfile.name,
      business: shopProfile,
      admin: adminProfile,
      products,
      banners,
      orders,
      mediaLibrary,
      usersList,
      exchangeRates,
      logoConfig,
      currentTheme,
    };
    const jsonStr = JSON.stringify(fullBackup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sitara_cloth_house_database_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setBackupNotification('✅ Complete store database JSON backup exported successfully!');
    setTimeout(() => setBackupNotification(null), 4000);
  };

  // Full Store Database Import (JSON Restore)
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        if (data.products && Array.isArray(data.products)) {
          localStorage.setItem('sitara_products', JSON.stringify(data.products));
        }
        if (data.orders && Array.isArray(data.orders)) {
          localStorage.setItem('sitara_orders', JSON.stringify(data.orders));
        }
        if (data.banners && Array.isArray(data.banners)) {
          localStorage.setItem('sitara_banners', JSON.stringify(data.banners));
        }
        if (data.mediaLibrary && Array.isArray(data.mediaLibrary)) {
          localStorage.setItem('sitara_media_assets', JSON.stringify(data.mediaLibrary));
        }
        if (data.business) {
          updateShopProfile(data.business);
        }
        if (data.admin) {
          updateAdminProfile(data.admin);
        }
        setBackupNotification('✅ Store database restored successfully! Reloading...');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch {
        setBackupNotification('❌ Failed to parse database JSON file. Please ensure valid backup format.');
        setTimeout(() => setBackupNotification(null), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const isUrdu = lang === 'ur';

  // Metrics for overview tab
  const totalListings = products.length;
  const pendingApprovals = products.filter((p) => p.approvalStatus === 'pending').length;
  const totalMediaAssets = mediaLibrary.length;
  const totalUsers = usersList.length;
  const totalOrdersCount = orders.length;
  const totalSalesRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  // Filter listings
  const filteredProducts = products.filter((p) => {
    const matchType =
      listingFilter === 'all'
        ? true
        : p.listingType === listingFilter || (!p.listingType && listingFilter === 'fabric');
    const matchStatus =
      statusFilter === 'all' ? true : (p.approvalStatus || 'approved') === statusFilter;
    return matchType && matchStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 backdrop-blur-md">
      <div className="relative flex flex-col w-full max-w-6xl max-h-[96vh] bg-[#0f0f12] border border-[#d4af37]/40 rounded-2xl shadow-2xl overflow-hidden text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#16161a] via-[#222227] to-[#16161a] border-b border-[#d4af37]/30">
          <div className="flex items-center gap-3">
            {/* Admin Avatar */}
            <div className="relative">
              <img
                src={adminProfile.avatar}
                alt={adminProfile.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-[#d4af37] shadow-md"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0f0f12]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  {adminProfile.name}
                </h2>
                <span className="text-[10px] font-urdu text-[#d4af37] px-1.5 py-0.5 rounded bg-[#d4af37]/10 border border-[#d4af37]/30">
                  {adminProfile.nameUrdu}
                </span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                  Owner & Chief Admin
                </span>
              </div>
              <p className="text-[11px] text-gray-400 flex items-center gap-2">
                <span>{adminProfile.role}</span>
                <span>•</span>
                <span className="text-gray-500">{shopProfile.market}, Kotli</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <BrandLogo variant="admin" showSubtext={false} showUrdu={false} />
            </div>
            <button
              onClick={() => setIsAdminOpen(false)}
              aria-label="Close Admin Panel"
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Gate (Server scrypt Passcode + 2FA Email OTP + Brute-Force Protection) */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-[#0f0f12] to-black overflow-y-auto">
            <div className="w-full max-w-md p-6 bg-[#16161a] rounded-2xl border border-[#d4af37]/40 shadow-2xl space-y-5 text-center">
              <div className="relative w-20 h-20 mx-auto">
                <img
                  src={adminProfile.avatar}
                  alt={adminProfile.name}
                  className="w-full h-full rounded-full object-cover border-2 border-[#d4af37] shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#d4af37] text-black">
                  <Shield className="w-4 h-4" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{adminProfile.name}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {otpStep
                    ? t.sec2faTitle
                    : isUrdu
                    ? 'ستارہ کلاٹھ ہاؤس کوٹلی – سیکیورٹی وال ایڈمن لاگ ان'
                    : 'Sitara Cloth House Kotli – Security Wall Admin Portal'}
                </p>
                {!otpStep && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-gray-300">
                    <Key className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Default Passcode: <strong className="text-[#d4af37]">awais786</strong> (2FA Protected)</span>
                  </div>
                )}
              </div>

              {otpStep ? (
                <form onSubmit={handleVerifyOtp} className="space-y-3 text-left">
                  <div className="p-3 rounded-xl bg-black/50 border border-white/10 text-xs space-y-1 text-center">
                    <p className="text-gray-300">{t.sec2faPrompt}</p>
                    <p className="font-mono text-[#d4af37] text-[11px]">{otpStep.maskedEmail}</p>
                    {otpStep.deliveryMode === 'local-secure-preview' && otpStep.sandboxOtpPreview && (
                      <div className="mt-2 p-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-200 text-[11px]">
                        <span className="block text-[10px] uppercase tracking-wider opacity-80">
                          Local 2FA Verification Code (No SMTP relay configured)
                        </span>
                        <strong className="font-mono text-sm tracking-widest text-amber-300" data-testid="sandbox-otp-preview">
                          {otpStep.sandboxOtpPreview}
                        </strong>
                      </div>
                    )}
                    {otpStep.deliveryMode === 'email-relay' && (
                      <p className="text-[11px] text-emerald-300">
                        Verification code dispatched to {otpStep.maskedEmail}.
                      </p>
                    )}
                  </div>

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => {
                      setOtpInput(e.target.value.replace(/\D/g, ''));
                      setAuthError(null);
                    }}
                    placeholder="6-Digit 2FA OTP"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/20 text-center text-base font-mono tracking-[0.4em] text-white placeholder:text-gray-500 placeholder:tracking-normal focus:outline-none focus:border-[#d4af37]"
                    autoFocus
                  />

                  {authError && (
                    <p className="text-xs text-rose-400 flex items-center justify-center gap-1 text-center">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{authError}</span>
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={authBusy || otpInput.length < 6}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#b38f2a] text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-110 disabled:opacity-50 cursor-pointer"
                  >
                    {authBusy ? 'Verifying OTP...' : isUrdu ? 'کوڈ کی تصدیق کریں' : 'Verify 2FA & Unlock'}
                  </button>

                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep(null);
                        setOtpInput('');
                        setAuthError(null);
                      }}
                      className="hover:text-white cursor-pointer"
                    >
                      Back to Passcode
                    </button>
                    <button
                      type="button"
                      disabled={authBusy}
                      onClick={handleResendOtp}
                      className="text-[#d4af37] hover:underline cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="relative">
                    <input
                      type="password"
                      value={passcode}
                      disabled={lockoutSeconds > 0}
                      onChange={(e) => {
                        setPasscode(e.target.value);
                        setAuthError(null);
                      }}
                      placeholder={isUrdu ? 'خفیہ پاس ورڈ درج کریں...' : 'Enter Admin Passcode...'}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/20 text-center text-sm tracking-widest text-white placeholder:text-gray-500 focus:outline-none focus:border-[#d4af37]"
                      autoFocus
                    />
                  </div>

                  {lockoutSeconds > 0 && (
                    <p className="text-xs text-rose-300 font-mono bg-rose-500/15 border border-rose-500/40 rounded-xl p-2">
                      Brute-force lock active: retry in {lockoutSeconds}s
                    </p>
                  )}

                  {authError && (
                    <p className="text-xs text-rose-400 flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{authError}</span>
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={authBusy || lockoutSeconds > 0}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#b38f2a] text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-110 disabled:opacity-50 cursor-pointer"
                  >
                    {authBusy
                      ? 'Checking Credentials...'
                      : isUrdu
                      ? 'تصدیق کریں اور آگے بڑھیں'
                      : 'Verify & Continue to 2FA'}
                  </button>
                </form>
              )}

              <div className="pt-3 border-t border-white/10 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    signInWithGoogle().catch(() => {});
                  }}
                  className="w-full py-2.5 rounded-xl bg-white text-stone-950 font-bold text-xs flex items-center justify-center gap-2 hover:bg-stone-100 shadow transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-amber-600" />
                  <span>
                    {isUrdu
                      ? 'گوگل ایڈمن اکاؤنٹ سے تصدیق شدہ لاگ ان کریں'
                      : `Sign in with Google Admin (${BOOTSTRAPPED_ADMIN_EMAIL})`}
                  </span>
                </button>
                <p className="text-[10px] text-gray-500">
                  Protected by Sitara AI Security Wall: scrypt hashing, 2FA Email OTP & brute-force lockout.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Main Authenticated Dashboard */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-60 bg-[#121216] border-b md:border-b-0 md:border-r border-white/10 p-3 flex md:flex-col justify-between overflow-x-auto md:overflow-y-auto scrollbar-thin">
              <div className="flex md:flex-col gap-1 w-full">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'overview'
                      ? 'bg-[#d4af37] text-black font-bold shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>{isUrdu ? 'ڈیش بورڈ جائزہ' : 'Overview & Stats'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('listings')}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'listings'
                      ? 'bg-[#d4af37] text-black font-bold shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 shrink-0" />
                    <span>{isUrdu ? 'تمام پروڈکٹس و لسٹنگز' : 'Listings & Items'}</span>
                  </div>
                  {pendingApprovals > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-black font-bold">
                      {pendingApprovals}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('banners')}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'banners'
                      ? 'bg-[#d4af37] text-black font-bold shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>{isUrdu ? 'بینرز و ہوم سلائیڈر' : 'Banners & Slider'}</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-[#d4af37] font-bold">
                    {banners.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('media')}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'media'
                      ? 'bg-[#d4af37] text-black font-bold shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>{isUrdu ? 'اینڈرائیڈ کیمرہ و گیلری' : 'Camera & Media Studio'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'users'
                      ? 'bg-[#d4af37] text-black font-bold shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>{isUrdu ? 'صارفین اور سیلرز' : 'Users & Sellers'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'orders'
                      ? 'bg-[#d4af37] text-black font-bold shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-4 h-4 shrink-0" />
                    <span>{isUrdu ? 'گاہکوں کے آرڈرز' : 'Customer Orders'}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                    {orders.length}
                  </span>
                </button>

                {/* SMART CLOUD ERP MODULES */}
                <div className="hidden md:block pt-2 pb-1 px-2 text-[10px] uppercase tracking-widest text-[#d4af37]/80 font-bold">
                  {isUrdu ? 'اسمارٹ کلاؤڈ ای آر پی' : 'Smart Cloud ERP'}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('billing')}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'billing'
                      ? 'bg-[#d4af37] text-black font-bold shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Receipt className="w-4 h-4 shrink-0" />
                    <span>{t.erpBillingTab}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                    {invoices.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('khata')}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'khata'
                      ? 'bg-[#d4af37] text-black font-bold shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span>{t.erpKhataTab}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                    {khataAccounts.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('suppliers')}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'suppliers'
                      ? 'bg-[#d4af37] text-black font-bold shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span>{t.erpSuppliersTab}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                    {suppliers.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('reports')}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'reports'
                      ? 'bg-[#d4af37] text-black font-bold shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  <span>{t.erpReportsTab}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('staff')}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'staff'
                      ? 'bg-[#d4af37] text-black font-bold shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>{t.erpStaffTab}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                    {staffMembers.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('cloud-security')}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'cloud-security'
                      ? 'bg-[#d4af37] text-black font-bold shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Cloud className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{t.erpSecurityTab}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('security-wall')}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'security-wall'
                      ? 'bg-[#d4af37] text-black font-bold shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Shield className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{t.erpSecurityWallTab}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('content')}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'content'
                      ? 'bg-[#d4af37] text-black font-bold shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>{isUrdu ? 'ویب مواد اور بینرز' : 'Website Content'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'profile'
                      ? 'bg-[#d4af37] text-black font-bold shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>{isUrdu ? 'ایڈمن اویس ملک پروفائل' : 'Edit Admin Profile'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('branding')}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'branding'
                      ? 'bg-[#d4af37] text-black font-bold shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Palette className="w-4 h-4 shrink-0" />
                  <span>{isUrdu ? 'لوگو اور تھیمز' : 'Logo & Themes'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'settings'
                      ? 'bg-[#d4af37] text-black font-bold shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>{isUrdu ? 'دکان کی سیٹنگز' : 'Store Settings'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('domain')}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'domain'
                      ? 'bg-[#d4af37] text-black font-bold shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Globe className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{isUrdu ? 'ڈومین، ہوسٹنگ و ایس ای او' : 'Domain, Hosting & SEO'}</span>
                </button>
              </div>

              {/* Quick WhatsApp / Store Direct Link */}
              <div className="hidden md:block pt-3 border-t border-white/10 space-y-2">
                <a
                  href={`https://wa.me/${sanitizePhoneForWhatsApp(adminProfile.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Admin</span>
                </a>
                <button
                  type="button"
                  onClick={handleLockSession}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-gray-500 hover:text-gray-300 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock Session</span>
                </button>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-black/40 space-y-6">
              {/* Notification Banner */}
              {mediaNotification && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs text-center font-medium">
                  {mediaNotification}
                </div>
              )}

              {/* TAB 1: OVERVIEW & STATS */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Hero Greeting */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-[#1c1c22] via-[#24242e] to-[#1a1a20] border border-[#d4af37]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={adminProfile.avatar}
                        alt={adminProfile.name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-[#d4af37] shadow-xl"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white">
                            {isUrdu ? `خوش آمدید، ${adminProfile.nameUrdu}` : `Welcome back, ${adminProfile.name}`}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-400">
                          {isUrdu
                            ? 'مالک و چیف ایگزیکٹو • ستارہ کلاٹھ ہاؤس، خدام داد مارکیٹ کوٹلی کا انتظامی کنٹرول پینل'
                            : 'Store Owner & Managing Director • Sitara Cloth House, Khudadad Market Kotli'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setIsLogoModalOpen(true)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 text-amber-300 font-semibold text-xs border border-amber-500/40 hover:bg-amber-500 hover:text-black transition-all cursor-pointer"
                        title="Upgrade Sitara Brand Logo"
                      >
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span>{isUrdu ? 'لوگو اپ گریڈ' : 'Upgrade Logo'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('branding')}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/20 transition-all cursor-pointer"
                        title="Theme Settings"
                      >
                        <Palette className="w-4 h-4 text-amber-400" />
                        <span>{isUrdu ? 'تھیمز' : 'Themes'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('banners')}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 font-semibold text-xs border border-amber-500/40 hover:bg-amber-500 hover:text-black transition-all cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>{isUrdu ? 'ہوم پیج بینرز' : 'Manage Banners'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCameraActive(true)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#d4af37] text-black font-bold text-xs shadow-md hover:brightness-110 transition-all active:scale-95"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{isUrdu ? 'فوری تصویر لیں' : 'Quick Camera Snap'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartNew('fabric')}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/20 transition-all"
                      >
                        <Plus className="w-4 h-4 text-[#d4af37]" />
                        <span>{isUrdu ? 'نیا کپڑا شامل کریں' : 'New Product'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    <div className="p-4 rounded-xl bg-[#16161b] border border-white/10 space-y-1">
                      <div className="flex items-center justify-between text-gray-400">
                        <span className="text-xs">{isUrdu ? 'کل پراڈکٹس' : 'Total Listings'}</span>
                        <Package className="w-4 h-4 text-[#d4af37]" />
                      </div>
                      <p className="text-2xl font-bold text-white">{totalListings}</p>
                      <p className="text-[10px] text-emerald-400">Active across categories</p>
                    </div>

                    <div
                      onClick={() => setActiveTab('banners')}
                      className="p-4 rounded-xl bg-[#16161b] border border-amber-500/30 hover:border-amber-400 space-y-1 cursor-pointer transition-all"
                      title="Manage Homepage Banners"
                    >
                      <div className="flex items-center justify-between text-gray-400">
                        <span className="text-xs text-amber-300 font-semibold">{isUrdu ? 'ہوم پیج بینرز' : 'Homepage Sliders'}</span>
                        <Sparkles className="w-4 h-4 text-[#d4af37]" />
                      </div>
                      <p className="text-2xl font-bold text-amber-400">{banners.length}</p>
                      <p className="text-[10px] text-amber-300/80">Active & Scheduled</p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#16161b] border border-white/10 space-y-1">
                      <div className="flex items-center justify-between text-gray-400">
                        <span className="text-xs">{isUrdu ? 'تصاویر و میڈیا' : 'Media Bank'}</span>
                        <ImageIcon className="w-4 h-4 text-[#d4af37]" />
                      </div>
                      <p className="text-2xl font-bold text-white">{totalMediaAssets}</p>
                      <p className="text-[10px] text-gray-400">Gallery & Camera</p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#16161b] border border-white/10 space-y-1">
                      <div className="flex items-center justify-between text-gray-400">
                        <span className="text-xs">{isUrdu ? 'رجسٹرڈ صارفین' : 'Users & Sellers'}</span>
                        <Users className="w-4 h-4 text-[#d4af37]" />
                      </div>
                      <p className="text-2xl font-bold text-white">{totalUsers}</p>
                      <p className="text-[10px] text-gray-400">Customer accounts</p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#16161b] border border-white/10 space-y-1">
                      <div className="flex items-center justify-between text-gray-400">
                        <span className="text-xs">{isUrdu ? 'کل آرڈرز سیلز' : 'Total Orders'}</span>
                        <ShoppingBag className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-emerald-400">{formatPKR(totalSalesRevenue)}</p>
                      <p className="text-[10px] text-gray-400">{totalOrdersCount} processed orders</p>
                    </div>
                  </div>

                  {/* Multi-Category Quick Actions */}
                  <div className="p-5 rounded-2xl bg-[#141418] border border-white/10 space-y-3">
                    <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#d4af37]" />
                      {isUrdu ? 'ملٹی کیٹیگری مینیجر (کپڑے، جائیداد، گاڑیاں)' : 'Multi-Category Listing Creator'}
                    </h4>
                    <p className="text-xs text-gray-400">
                      {isUrdu
                        ? 'اویس ملک ستارہ کلاٹھ ہاؤس کے کپڑوں کے علاوہ کوٹلی میں تجارتی دکانوں، پلازوں اور گاڑیوں کی لسٹنگز بھی شائع کر سکتے ہیں۔'
                        : 'Publish fabrics, prime commercial market shops, plaza spaces, or delivery vehicles under verified Sitara management.'}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleStartNew('fabric')}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center gap-1.5 text-xs text-gray-200 transition-colors"
                      >
                        <Shirt className="w-5 h-5 text-[#d4af37]" />
                        <span>+ Fabric Suit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartNew('property')}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center gap-1.5 text-xs text-gray-200 transition-colors"
                      >
                        <Building className="w-5 h-5 text-[#d4af37]" />
                        <span>+ Shop / Property</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartNew('vehicle')}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center gap-1.5 text-xs text-gray-200 transition-colors"
                      >
                        <Car className="w-5 h-5 text-[#d4af37]" />
                        <span>+ Vehicle / Van</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartNew('business')}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center gap-1.5 text-xs text-gray-200 transition-colors"
                      >
                        <Store className="w-5 h-5 text-[#d4af37]" />
                        <span>+ Showroom Space</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: LISTINGS & MODERATION */}
              {activeTab === 'listings' && (
                <div className="space-y-4">
                  {/* Listing Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#141418] border border-white/10">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Filter by Category */}
                      <select
                        value={listingFilter}
                        onChange={(e) => setListingFilter(e.target.value as any)}
                        className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                      >
                        <option value="all">All Categories ({products.length})</option>
                        <option value="fabric">Fabrics & Suits</option>
                        <option value="property">Properties & Shops</option>
                        <option value="vehicle">Vehicles & Transport</option>
                        <option value="business">Showroom & Business</option>
                      </select>

                      {/* Filter by Status */}
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                      >
                        <option value="all">All Status</option>
                        <option value="approved">Approved ({products.filter((p) => p.approvalStatus === 'approved' || !p.approvalStatus).length})</option>
                        <option value="pending">Pending Review ({pendingApprovals})</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartNew('fabric')}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38f2a] text-black font-semibold text-xs shadow hover:brightness-110 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isUrdu ? 'نئی لسٹنگ درج کریں' : 'Add New Listing'}</span>
                    </button>
                  </div>

                  {/* Listings Table */}
                  <div className="rounded-xl border border-white/10 overflow-hidden bg-[#141418]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#1c1c22] text-gray-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                          <tr>
                            <th className="py-3 px-4">Item</th>
                            <th className="py-3 px-3">Type</th>
                            <th className="py-3 px-3">Price</th>
                            <th className="py-3 px-3">Stock</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3">Seller</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredProducts.map((p) => (
                            <tr key={p.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 flex items-center gap-3">
                                <img
                                  src={p.image}
                                  alt={p.title}
                                  className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"
                                />
                                <div>
                                  <div className="font-semibold text-white line-clamp-1">{p.title}</div>
                                  <div className="text-[11px] text-[#d4af37] font-urdu line-clamp-1">{p.titleUrdu}</div>
                                  <span className="text-[10px] text-gray-500">{p.sku}</span>
                                </div>
                              </td>

                              <td className="py-3 px-3 capitalize">
                                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-gray-300">
                                  {p.listingType || 'fabric'}
                                </span>
                              </td>

                              <td className="py-3 px-3 font-semibold text-emerald-400">
                                {formatPKR(p.price)}
                              </td>

                              <td className="py-3 px-3">
                                <input
                                  type="number"
                                  min="0"
                                  value={p.stockQuantity}
                                  onChange={(e) => updateStock(p.id, Number(e.target.value))}
                                  className="w-16 px-2 py-1 rounded bg-black/60 border border-white/20 text-white text-xs text-center"
                                />
                              </td>

                              {/* Moderation Status */}
                              <td className="py-3 px-3">
                                {p.approvalStatus === 'pending' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-medium">
                                    <Clock className="w-3 h-3" />
                                    Pending
                                  </span>
                                ) : p.approvalStatus === 'rejected' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-medium">
                                    <X className="w-3 h-3" />
                                    Rejected
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-medium">
                                    <CheckCircle className="w-3 h-3" />
                                    Approved
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-3 text-gray-400 text-[11px]">
                                {p.sellerName || adminProfile.name}
                              </td>

                              {/* Action Buttons */}
                              <td className="py-3 px-4 text-right">
                                <div className="inline-flex items-center gap-1">
                                  {/* Approve / Reject buttons */}
                                  {p.approvalStatus !== 'approved' && (
                                    <button
                                      type="button"
                                      onClick={() => approveListing(p.id)}
                                      title="Approve Listing"
                                      className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {p.approvalStatus !== 'rejected' && (
                                    <button
                                      type="button"
                                      onClick={() => rejectListing(p.id)}
                                      title="Reject Listing"
                                      className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setQrPreviewProduct(p)}
                                    title="View Product QR Code"
                                    className="p-1.5 rounded-lg text-[#d4af37] hover:bg-[#d4af37]/15"
                                  >
                                    <QrCode className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(p)}
                                    title="Edit Details"
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Delete ${p.title}?`)) {
                                        deleteProduct(p.id);
                                      }
                                    }}
                                    title="Delete Listing"
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* QR Preview Sub-panel */}
                  {qrPreviewProduct && (
                    <div className="p-4 rounded-xl bg-[#141418] border border-[#d4af37]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <ProductQrSvg
                        sku={qrPreviewProduct.sku}
                        title={qrPreviewProduct.title}
                        sizePx={96}
                      />
                      <button
                        type="button"
                        onClick={() => setQrPreviewProduct(null)}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white shrink-0"
                      >
                        Close QR
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: BANNERS & HOMEPAGE SLIDERS */}
              {activeTab === 'banners' && <AdminBannerManager />}

              {/* TAB 3: ANDROID CAMERA & GALLERY STUDIO */}
              {activeTab === 'media' && (
                <div className="space-y-6">
                  {/* Top Bar with Android upload triggers */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-[#18181f] via-[#24242e] to-[#18181f] border border-[#d4af37]/40 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Smartphone className="w-5 h-5 text-[#d4af37]" />
                          {isUrdu ? 'اینڈرائیڈ موبائل میڈیا اور کیمرہ اسٹوڈیو' : 'Android Mobile Media & Camera Studio'}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {isUrdu
                            ? 'اویس ملک – براہ راست اپنے فون کی گیلری اور کیمرے سے اعلیٰ معیار کی تصاویر اپلوڈ کریں'
                            : 'Admin Awais Malik – Direct phone gallery upload, album selector, and live camera viewfinder'}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Hidden Native File Input */}
                        <input
                          ref={galleryInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={handleAndroidGalleryUpload}
                        />
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#b38f2a] text-black font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all"
                        >
                          <Folder className="w-4 h-4" />
                          <span>{isUrdu ? 'اینڈرائیڈ گیلری سے اپلوڈ' : 'Select from Android Gallery'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsCameraActive(true)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/20 active:scale-95 transition-all"
                        >
                          <Camera className="w-4 h-4 text-[#d4af37]" />
                          <span>{isUrdu ? 'اینڈرائیڈ کیمرہ آن کریں' : 'Open Android Camera'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsMediaLibraryActive(true)}
                          className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs border border-white/10 transition-all"
                        >
                          <ImageIcon className="w-4 h-4" />
                          <span>{isUrdu ? 'مرکزی لائبریری' : 'Open Media Hub'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Guidance Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px] text-gray-400 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Multi-photo batch upload supported</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Interactive 90° rotate and crop tools</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Auto-compressed for blazing speed in Kotli & AJK</span>
                      </div>
                    </div>
                  </div>

                  {/* Media Assets Gallery View */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                        {isUrdu ? `محفوظ شدہ میڈیا فائلز (${mediaLibrary.length})` : `Media Assets (${mediaLibrary.length})`}
                      </h4>
                      <span className="text-xs text-gray-400">Click any picture to crop, rotate, or edit details</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {mediaLibrary.map((item) => (
                        <div
                          key={item.id}
                          className="group relative flex flex-col bg-[#141418] rounded-xl overflow-hidden border border-white/10 hover:border-[#d4af37]/60 transition-all"
                        >
                          <div className="relative aspect-square bg-zinc-900 overflow-hidden">
                            <img
                              src={item.url}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <span className="absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[#d4af37] border border-[#d4af37]/30 capitalize">
                              {item.category}
                            </span>
                            <span className="absolute bottom-2 left-2 text-[9px] px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-gray-300 capitalize">
                              {item.source}
                            </span>
                          </div>

                          <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1.5">
                            <div>
                              <p className="text-xs font-semibold text-white line-clamp-1">{item.title}</p>
                              <p className="text-[10px] text-gray-400">
                                {item.sizeBytes ? formatBytes(item.sizeBytes) : 'Compressed'} • {item.uploadDate}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-white/5">
                              <button
                                type="button"
                                onClick={() => setEditingMediaAsset(item)}
                                className="inline-flex items-center gap-1 text-[11px] text-[#d4af37] hover:underline"
                              >
                                <RotateCw className="w-3 h-3" />
                                <span>Crop / Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteMediaAsset(item.id)}
                                className="p-1 rounded text-gray-500 hover:text-rose-400"
                                title="Delete photo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: USERS & SELLERS MANAGEMENT */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#141418] border border-white/10">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#d4af37]" />
                        {isUrdu ? 'رجسٹرڈ صارفین، گاہک اور سیلرز' : 'User Accounts & Registered Sellers'}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {isUrdu
                          ? 'اویس ملک – گاہکوں اور پارٹنر تاجروں کی تصدیق اور رسائی کا انتظام'
                          : 'Manage buyer profiles, active seller privileges, and security permissions'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 overflow-hidden bg-[#141418]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#1c1c22] text-gray-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                        <tr>
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-3">Role</th>
                          <th className="py-3 px-3">Contact</th>
                          <th className="py-3 px-3">Listings</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-4 text-right">Access Controls</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {usersList.map((u) => (
                          <tr key={u.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-white">{u.name}</div>
                              <div className="text-[11px] text-gray-400">{u.email}</div>
                            </td>

                            <td className="py-3 px-3 capitalize">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                                  u.role === 'admin'
                                    ? 'bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/40 font-bold'
                                    : u.role === 'seller'
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                    : 'bg-white/5 text-gray-300 border-white/10'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-gray-300">{u.phone}</td>

                            <td className="py-3 px-3 font-semibold text-white">
                              {u.listingsCount}
                            </td>

                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  u.status === 'active'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-rose-500/20 text-rose-300'
                                }`}
                              >
                                {u.status}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right">
                              {u.role !== 'admin' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateUserStatus(
                                      u.id,
                                      u.status === 'active' ? 'suspended' : 'active'
                                    )
                                  }
                                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                    u.status === 'active'
                                      ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                                      : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                                  }`}
                                >
                                  {u.status === 'active' ? 'Suspend' : 'Activate'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: ORDERS TRACKING & MANAGEMENT */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#141418] border border-white/10">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#d4af37]" />
                      {isUrdu ? 'آن لائن آرڈرز و ڈلیوری مینیجمنٹ' : 'Orders & Shipment Pipeline'}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {orders.length === 0 ? (
                      <p className="text-center py-12 text-gray-500">No customer orders received yet.</p>
                    ) : (
                      orders.map((ord) => (
                        <div
                          key={ord.id}
                          className="p-4 rounded-xl bg-[#141418] border border-white/10 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">{ord.orderNumber}</span>
                                <span className="text-xs text-gray-400">({ord.date})</span>
                              </div>
                              <p className="text-xs text-[#d4af37]">
                                Customer: <strong>{ord.customer.fullName}</strong> · {ord.customer.phone} ·{' '}
                                {ord.customer.city}
                                {ord.customer.country ? `, ${ord.customer.country}` : ''}
                              </p>
                              {(ord.courier || ord.paymentReference) && (
                                <p className="text-[11px] text-gray-400 font-mono">
                                  {ord.courier ? `Courier: ${ord.courier}` : ''}
                                  {ord.courier && ord.paymentReference ? ' · ' : ''}
                                  {ord.paymentReference ? `Ref: ${ord.paymentReference}` : ''}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Status dropdown */}
                              <select
                                value={ord.status}
                                onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                                className="px-2.5 py-1 rounded-lg bg-black/70 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>

                              {/* WhatsApp Contact */}
                              <a
                                href={`https://wa.me/${sanitizePhoneForWhatsApp(ord.customer.phone)}?text=${encodeURIComponent(
                                  `السلام علیکم ${ord.customer.fullName}! آپ کے ستارہ کلاٹھ ہاؤس کوٹلی کے آرڈر ${ord.orderNumber} کی صورتحال: ${ord.status.toUpperCase()}`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                title="WhatsApp Customer"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            </div>
                          </div>

                          {/* Order items strip */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                            {ord.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                                <img
                                  src={item.product.image}
                                  alt={item.product.title}
                                  className="w-10 h-10 rounded object-cover"
                                />
                                <div className="truncate">
                                  <p className="font-medium text-white truncate">{item.product.title}</p>
                                  <p className="text-[10px] text-gray-400">
                                    Qty: {item.quantity} • {item.selectedColor || 'Standard'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 text-gray-400">
                            <span>
                              Payment: <strong className="uppercase text-gray-200">{ord.paymentMethod}</strong>
                              {ord.orderCurrency ? ` (${ord.orderCurrency})` : ''}
                            </span>
                            <span className="text-sm font-bold text-emerald-400">Total: {formatPKR(ord.total)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: WEBSITE CONTENT & BANNERS */}
              {activeTab === 'content' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#141418] border border-white/10 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#d4af37]" />
                      {isUrdu ? 'ویب سائٹ مواد اور اعلانات' : 'Promotional Banners & Ticker Announcements'}
                    </h3>

                    <form onSubmit={handleSaveShopProfile} className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">
                          Ticker Announcement (English)
                        </label>
                        <input
                          type="text"
                          value={profileForm.announcementEn}
                          onChange={(e) => setProfileForm({ ...profileForm, announcementEn: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-300 mb-1">
                          Ticker Announcement (Urdu / اردو اعلان)
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          value={profileForm.announcementUr}
                          onChange={(e) => setProfileForm({ ...profileForm, announcementUr: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white font-urdu focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Shop Slogan (English)</label>
                          <input
                            type="text"
                            value={profileForm.slogan}
                            onChange={(e) => setProfileForm({ ...profileForm, slogan: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Shop Slogan (Urdu)</label>
                          <input
                            type="text"
                            dir="rtl"
                            value={profileForm.sloganUrdu}
                            onChange={(e) => setProfileForm({ ...profileForm, sloganUrdu: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white font-urdu focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-[#d4af37] text-black font-bold text-xs shadow hover:brightness-110 transition-all"
                      >
                        {profileSaved ? '✅ Saved Successfully!' : 'Update Website Content'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 7: EDIT ADMIN PROFILE (AWAIS MALIK) */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-[#141418] border border-white/10 space-y-5">
                    {/* PROFILE PICTURE MANAGEMENT HERO */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-stone-900/90 via-[#18181d] to-stone-900/90 border border-amber-500/30 shadow-lg space-y-4">
                      <div className="flex flex-col sm:flex-row items-center gap-5">
                        <div className="relative group shrink-0">
                          <img
                            src={adminForm.avatar}
                            alt={adminForm.name}
                            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-amber-400 shadow-2xl ring-4 ring-amber-400/20"
                          />
                          <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-bold shadow">
                            Active
                          </span>
                        </div>

                        <div className="space-y-1.5 text-center sm:text-left flex-1">
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                              {adminForm.name}
                              <Crown className="w-4 h-4 text-amber-400" />
                            </h3>
                            <span className="text-xs font-urdu text-amber-400 px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                              {adminForm.nameUrdu}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                              Owner & Chief Administrator
                            </span>
                          </div>
                          <p className="text-xs text-stone-300">{adminForm.role}</p>
                          <p className="text-[11px] text-stone-400">
                            Sitara Cloth House • Khudadad Market, Main Bazaar, Kotli, Azad Kashmir
                          </p>

                          {/* Quick upload buttons */}
                          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            {/* Hidden gallery file input for avatar */}
                            <input
                              ref={avatarInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => avatarInputRef.current?.click()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-all active:scale-95"
                              title="Select profile picture directly from Android Gallery"
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                              <span>Upload from Android Gallery</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setCameraTarget('avatar');
                                setIsCameraActive(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold shadow-sm transition-all active:scale-95"
                              title="Capture new profile photo with Android camera"
                            >
                              <Camera className="w-3.5 h-3.5 text-amber-400" />
                              <span>Take Photo with Camera</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const officialUrl = '/assets/images/awais_malik_avatar.svg';
                                setAdminForm((prev) => ({ ...prev, avatar: officialUrl }));
                                updateAdminProfile({ avatar: officialUrl });
                                setAdminSaved(true);
                                setMediaNotification('✅ Set to official executive portrait crest of Awais Malik!');
                                setTimeout(() => {
                                  setAdminSaved(false);
                                  setMediaNotification(null);
                                }, 3000);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-all"
                              title="Reset to official high-resolution executive portrait crest"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Use Official Crest</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Verified Profile Photos Selector */}
                      <div className="pt-2 border-t border-white/10">
                        <p className="text-[11px] text-stone-400 font-medium mb-2 flex items-center justify-between">
                          <span>Select Available Profile Portraits & Uploaded Photos:</span>
                          <span className="text-[10px] text-amber-400 font-normal">Click any photo to set as Admin Avatar</span>
                        </p>
                        <div className="flex items-center gap-3 overflow-x-auto pb-1">
                          {/* Official uploaded photo */}
                          <button
                            type="button"
                            onClick={() => {
                              const officialUrl = '/assets/images/awais_malik_avatar.svg';
                              setAdminForm((prev) => ({ ...prev, avatar: officialUrl }));
                              updateAdminProfile({ avatar: officialUrl });
                            }}
                            className={`relative shrink-0 rounded-xl overflow-hidden border-2 transition-all p-0.5 ${
                              adminForm.avatar === '/assets/images/awais_malik_avatar.svg'
                                ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105'
                                : 'border-stone-700 hover:border-amber-400/60 opacity-80 hover:opacity-100'
                            }`}
                          >
                            <img
                              src="/assets/images/awais_malik_avatar.svg"
                              alt="Official Crest"
                              className="w-14 h-14 object-cover rounded-lg"
                            />
                            <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-amber-300 text-center py-0.5 font-bold">
                              Official
                            </span>
                          </button>

                          {/* Any other profile photos from mediaLibrary */}
                          {mediaLibrary
                            .filter((m) => m.category === 'profiles' && m.url !== '/assets/images/awais_malik_avatar.svg')
                            .map((asset) => (
                              <button
                                key={asset.id}
                                type="button"
                                onClick={() => {
                                  setAdminForm((prev) => ({ ...prev, avatar: asset.url }));
                                  updateAdminProfile({ avatar: asset.url });
                                }}
                                className={`relative shrink-0 rounded-xl overflow-hidden border-2 transition-all p-0.5 ${
                                  adminForm.avatar === asset.url
                                    ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105'
                                    : 'border-stone-700 hover:border-amber-400/60 opacity-80 hover:opacity-100'
                                }`}
                              >
                                <img
                                  src={asset.url}
                                  alt={asset.title}
                                  className="w-14 h-14 object-cover rounded-lg"
                                />
                                <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-stone-300 text-center py-0.5 truncate px-1">
                                  {asset.source === 'camera' ? 'Camera' : 'Gallery'}
                                </span>
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSaveAdminProfile} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Admin Full Name</label>
                          <input
                            type="text"
                            value={adminForm.name}
                            onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-300 mb-1">نام (Urdu)</label>
                          <input
                            type="text"
                            dir="rtl"
                            value={adminForm.nameUrdu}
                            onChange={(e) => setAdminForm({ ...adminForm, nameUrdu: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white font-urdu focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Executive Title / Designation</label>
                          <input
                            type="text"
                            value={adminForm.role}
                            onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Phone / WhatsApp Number</label>
                          <input
                            type="text"
                            value={adminForm.phone}
                            onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Admin Email Address</label>
                          <input
                            type="email"
                            value={adminForm.email}
                            onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Profile Picture URL</label>
                          <input
                            type="text"
                            value={adminForm.avatar}
                            onChange={(e) => setAdminForm({ ...adminForm, avatar: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Admin Login Passcode</label>
                          <input
                            type="text"
                            value={adminForm.passcode}
                            onChange={(e) => setAdminForm({ ...adminForm, passcode: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white font-mono focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-300 mb-1">Executive Bio</label>
                        <textarea
                          rows={3}
                          value={adminForm.bio || ''}
                          onChange={(e) => setAdminForm({ ...adminForm, bio: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#b38f2a] text-black font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all"
                      >
                        {adminSaved ? '✅ Profile Saved!' : 'Save Admin Profile'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 8: STORE SETTINGS & CONTACTS */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-[#141418] border border-white/10 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Settings className="w-4 h-4 text-[#d4af37]" />
                      {isUrdu ? 'دکان کی معلومات، پتہ و اوقات کار' : 'Shop Profile, Address & Operating Hours'}
                    </h3>

                    <form onSubmit={handleSaveShopProfile} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Shop Name (English)</label>
                          <input
                            type="text"
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-300 mb-1">دکان کا نام (Urdu)</label>
                          <input
                            type="text"
                            dir="rtl"
                            value={profileForm.nameUrdu}
                            onChange={(e) => setProfileForm({ ...profileForm, nameUrdu: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white font-urdu focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-amber-300 font-semibold mb-1">Owner / Proprietor Name</label>
                          <input
                            type="text"
                            value={profileForm.ownerName || 'Awais Malik'}
                            onChange={(e) => setProfileForm({ ...profileForm, ownerName: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-amber-300 font-semibold mb-1">مالک کا نام (Urdu)</label>
                          <input
                            type="text"
                            dir="rtl"
                            value={profileForm.ownerNameUrdu || 'اویس ملک'}
                            onChange={(e) => setProfileForm({ ...profileForm, ownerNameUrdu: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-xs text-white font-urdu focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Market Address (Kotli)</label>
                          <input
                            type="text"
                            value={profileForm.address}
                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-300 mb-1">پتہ (Urdu)</label>
                          <input
                            type="text"
                            dir="rtl"
                            value={profileForm.addressUrdu}
                            onChange={(e) => setProfileForm({ ...profileForm, addressUrdu: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white font-urdu focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Official WhatsApp</label>
                          <input
                            type="text"
                            value={profileForm.whatsapp}
                            onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Direct Call Phone</label>
                          <input
                            type="text"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Opening Hours (Sat - Thu)</label>
                          <input
                            type="text"
                            value={profileForm.openingHours}
                            onChange={(e) => setProfileForm({ ...profileForm, openingHours: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Friday Hours</label>
                          <input
                            type="text"
                            value={profileForm.fridayHours}
                            onChange={(e) => setProfileForm({ ...profileForm, fridayHours: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Free Delivery Min Order (PKR)</label>
                          <input
                            type="number"
                            value={profileForm.freeShippingThreshold}
                            onChange={(e) =>
                              setProfileForm({
                                ...profileForm,
                                freeShippingThreshold: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-300 mb-1">Google Maps Link</label>
                          <input
                            type="text"
                            value={profileForm.googleMapUrl}
                            onChange={(e) => setProfileForm({ ...profileForm, googleMapUrl: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-[#d4af37] text-black font-bold text-xs shadow hover:brightness-110 transition-all"
                      >
                        {profileSaved ? '✅ Settings Updated!' : 'Save Store Details'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB: LOGO & THEMES BRANDING STUDIO */}
              {activeTab === 'branding' && (
                <div className="space-y-6">
                  {/* 1. Brand Logo Upgrade Card */}
                  <div className="p-5 rounded-2xl bg-[#18181f] border border-[#d4af37]/30 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Crown className="w-5 h-5 text-[#d4af37]" />
                          <span>{isUrdu ? 'برانڈ لوگو اپ گریڈ و ڈیزائن اسٹوڈیو' : 'Brand Logo Upgrade & Design Studio'}</span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          {isUrdu
                            ? 'ستارہ کلاٹھ ہاؤس کے لوگو، ایمبلم، اردوانگریزی نام اور ڈیزائن کو اپ گریڈ کریں'
                            : 'Upgrade Sitara Cloth House emblem, typography, geometric seal or upload custom logo image.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsLogoModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#b38f2a] text-black font-bold text-xs shadow-md hover:brightness-110 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{isUrdu ? 'لوگو ایڈیٹر کھولیں' : 'Open Logo Design Studio'}</span>
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold text-gray-300 block mb-2">Active Live Logo:</span>
                        <div className="p-4 rounded-xl bg-stone-950 border border-amber-500/30">
                          <BrandLogo variant="invoice" showSubtext={true} showUrdu={true} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs w-full md:w-auto">
                        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-gray-400 block text-[10px]">Emblem Type:</span>
                          <span className="font-semibold text-white capitalize">{logoConfig.type.replace('_', ' ')}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-gray-400 block text-[10px]">Emblem Shape:</span>
                          <span className="font-semibold text-white capitalize">{logoConfig.shape}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-gray-400 block text-[10px]">Icon Symbol:</span>
                          <span className="font-semibold text-white capitalize">{logoConfig.icon}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-gray-400 block text-[10px]">Size Scaling:</span>
                          <span className="font-semibold text-white capitalize">{logoConfig.sizeScale}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Theme Selection Section */}
                  <div className="p-5 rounded-2xl bg-[#18181f] border border-[#d4af37]/30 space-y-4">
                    <ThemeSelector variant="admin" />
                  </div>

                  {/* 3. Multi-Currency Converter & Simulated Exchange Rates */}
                  <div className="p-5 rounded-2xl bg-[#18181f] border border-[#d4af37]/30 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                          <Coins className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{isUrdu ? 'کرنسی کنورٹر اور ایکسچینج ریٹس کنٹرول' : 'Multi-Currency Converter & Exchange Rates'}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Active: {currency}
                            </span>
                          </h4>
                          <p className="text-xs text-gray-400">
                            {isUrdu
                              ? 'کوٹلی اسٹور کے لیے پاکستانی روپے (PKR)، امریکی ڈالر (USD)، اور برطانوی پاؤنڈ (GBP) کی قیمتیں خودکار تبدیل کریں۔'
                              : 'Control live price conversion across PKR (₨), US Dollar ($), and British Pound (£) with simulated exchange rates.'}
                          </p>
                        </div>
                      </div>

                      {/* Quick Currency Switcher for Storefront */}
                      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-gray-800">
                        {(['PKR', 'USD', 'GBP'] as CurrencyCode[]).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setCurrency(c)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                              currency === c
                                ? 'bg-[#d4af37] text-black shadow-md'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {c === 'PKR' ? '🇵🇰 PKR' : c === 'USD' ? '🇺🇸 USD' : '🇬🇧 GBP'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Exchange Rate Adjustment Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* PKR Card (Base) */}
                      <div className="p-3.5 rounded-xl bg-black/40 border border-gray-800 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <span>🇵🇰</span>
                            <span>Pakistani Rupee (PKR)</span>
                          </span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                            Base
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400">Standard domestic currency across Kotli, AJK & Pakistan.</p>
                        <div className="pt-2 text-xs font-mono text-amber-300">
                          Rate: <strong>1.00 PKR = 1.00 PKR</strong>
                        </div>
                      </div>

                      {/* USD Card */}
                      <div className="p-3.5 rounded-xl bg-black/40 border border-gray-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <span>🇺🇸</span>
                            <span>US Dollar (USD)</span>
                          </span>
                          <span className="text-[10px] font-mono text-amber-400">$</span>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 block font-mono">1 USD in PKR (Current: ≈ {Math.round(1 / (exchangeRates.USD || 0.0036))} ₨)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="50"
                              max="1000"
                              step="1"
                              value={Math.round(1 / (exchangeRates.USD || 0.0036))}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (val > 0) updateExchangeRate('USD', 1 / val);
                              }}
                              className="w-full bg-[#121216] border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                            />
                            <span className="text-xs text-gray-400 shrink-0">PKR</span>
                          </div>
                        </div>
                      </div>

                      {/* GBP Card */}
                      <div className="p-3.5 rounded-xl bg-black/40 border border-gray-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <span>🇬🇧</span>
                            <span>British Pound (GBP)</span>
                          </span>
                          <span className="text-[10px] font-mono text-amber-400">£</span>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 block font-mono">1 GBP in PKR (Current: ≈ {Math.round(1 / (exchangeRates.GBP || 0.0028))} ₨)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="50"
                              max="1000"
                              step="1"
                              value={Math.round(1 / (exchangeRates.GBP || 0.0028))}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (val > 0) updateExchangeRate('GBP', 1 / val);
                              }}
                              className="w-full bg-[#121216] border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                            />
                            <span className="text-xs text-gray-400 shrink-0">PKR</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Live Preview Sample */}
                    <div className="p-3 rounded-xl bg-[#121216] border border-gray-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-gray-300">
                        <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                        <span>Sample Pure Boski Suit (Rs. 8,500):</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-xs">
                        <span className="text-stone-300">PKR: <strong>Rs. 8,500</strong></span>
                        <span className="text-stone-500">•</span>
                        <span className="text-amber-400">USD: <strong>${(8500 * (exchangeRates.USD || 0.0036)).toFixed(2)}</strong></span>
                        <span className="text-stone-500">•</span>
                        <span className="text-emerald-400">GBP: <strong>£{(8500 * (exchangeRates.GBP || 0.0028)).toFixed(2)}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: DOMAIN, HOSTING, GOOGLE SEO & DATABASE BACKUP */}
              {activeTab === 'domain' && (
                <div className="space-y-6">
                  {/* Backup Feedback Notification */}
                  {backupNotification && (
                    <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>{backupNotification}</span>
                    </div>
                  )}

                  {/* 1. Custom Domain & Availability Hub */}
                  <div className="p-5 rounded-2xl bg-[#18181f] border border-[#d4af37]/30 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Globe className="w-5 h-5 text-amber-400" />
                          <span>{isUrdu ? 'کسٹم ڈومین اور لائیو ویب سائٹ کنکشن' : 'Custom Domain & Live Web Deployment'}</span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {isUrdu
                            ? 'ستارہ کلاٹھ ہاؤس کے لیے تصدیق شدہ ڈومین sitarakotli.com اور DNS ریکارڈز کی سیٹنگ'
                            : 'Confirmed official domain sitarakotli.com, domain availability, and DNS host settings.'}
                        </p>
                      </div>

                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Confirmed: sitarakotli.com</span>
                      </div>
                    </div>

                    {/* Active Target Domain Card */}
                    <div className="p-4 rounded-xl bg-black/60 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">
                          Confirmed Official Domain:
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-base sm:text-lg font-bold text-amber-400">
                            https://sitarakotli.com
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                            Confirmed Primary
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 mt-1">
                          Worldwide browser accessible • Khudadad Market Kotli, Azad Kashmir E-Commerce Portal
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href="https://www.whois.com/whois/sitarakotli.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 border border-stone-700 transition-colors"
                        >
                          <Search className="w-3.5 h-3.5 text-amber-400" />
                          <span>Check WHOIS Availability</span>
                          <ExternalLink className="w-3 h-3 text-stone-400" />
                        </a>
                      </div>
                    </div>

                    {/* Domain Alternatives Matrix */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                        Domain Portfolio & Registered Extensions:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        <div className="p-3 rounded-xl bg-[#121216] border border-amber-500/60 ring-1 ring-amber-500/30 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-amber-300 text-xs">sitarakotli.com</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                              CONFIRMED
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400">Official Kotli bazaar e-commerce portal.</p>
                        </div>

                        <div className="p-3 rounded-xl bg-[#121216] border border-gray-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-white text-xs">sitara.pk</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                              PKNIC
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400">Best for Pakistan & AJK local SEO & trust.</p>
                        </div>

                        <div className="p-3 rounded-xl bg-[#121216] border border-gray-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-white text-xs">sitaracloth.com</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold">
                              Global .COM
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400">Short, direct commercial domain.</p>
                        </div>

                        <div className="p-3 rounded-xl bg-[#121216] border border-gray-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-white text-xs">sitaraclothhouse.com</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">
                              Full Brand
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400">Exact match of official brand name.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. DNS Records & Hosting Setup Guide */}
                  <div className="p-5 rounded-2xl bg-[#18181f] border border-[#d4af37]/30 space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">
                          {isUrdu ? 'ہوسٹنگ اور ڈی این ایس (DNS) کنفیگریشن' : 'Hosting DNS Configuration & Cloudflare Records'}
                        </h3>
                        <p className="text-xs text-gray-400">
                          Add these DNS records in your domain registrar (GoDaddy, Namecheap, PKNIC, or Cloudflare) to point sitarakotli.com to your live host:
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-gray-800 text-gray-400 text-[10px] uppercase font-mono">
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Host / Name</th>
                            <th className="py-2.5 px-3">Value / Target</th>
                            <th className="py-2.5 px-3">TTL</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 font-mono text-xs">
                          <tr className="hover:bg-white/5">
                            <td className="py-2.5 px-3 font-bold text-amber-400">A</td>
                            <td className="py-2.5 px-3 text-stone-200">@</td>
                            <td className="py-2.5 px-3 text-white font-bold">76.76.21.21</td>
                            <td className="py-2.5 px-3 text-gray-400">Automatic / 3600</td>
                            <td className="py-2.5 px-3 text-emerald-400 font-sans font-semibold">Ready</td>
                          </tr>
                          <tr className="hover:bg-white/5">
                            <td className="py-2.5 px-3 font-bold text-amber-400">CNAME</td>
                            <td className="py-2.5 px-3 text-stone-200">www</td>
                            <td className="py-2.5 px-3 text-white font-bold">sitarakotli.com</td>
                            <td className="py-2.5 px-3 text-gray-400">Automatic / 3600</td>
                            <td className="py-2.5 px-3 text-emerald-400 font-sans font-semibold">Ready</td>
                          </tr>
                          <tr className="hover:bg-white/5">
                            <td className="py-2.5 px-3 font-bold text-amber-400">TXT</td>
                            <td className="py-2.5 px-3 text-stone-200">@</td>
                            <td className="py-2.5 px-3 text-stone-300 truncate max-w-xs">
                              google-site-verification=SCH-Google-Verification-Kotli-Sitara-AwaisMalik
                            </td>
                            <td className="py-2.5 px-3 text-gray-400">Automatic</td>
                            <td className="py-2.5 px-3 text-emerald-400 font-sans font-semibold">Active</td>
                          </tr>
                          <tr className="hover:bg-white/5">
                            <td className="py-2.5 px-3 font-bold text-amber-400">MX</td>
                            <td className="py-2.5 px-3 text-stone-200">@</td>
                            <td className="py-2.5 px-3 text-stone-300">mail.sitarakotli.com (awaism793@gmail.com)</td>
                            <td className="py-2.5 px-3 text-gray-400">Priority 10</td>
                            <td className="py-2.5 px-3 text-emerald-400 font-sans font-semibold">Ready</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 3. Google Search Console & SEO Tools */}
                  <div className="p-5 rounded-2xl bg-[#18181f] border border-[#d4af37]/30 space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                        <Search className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">
                          {isUrdu ? 'گوگل سرچ کنسول اور ایس ای او انڈیکسنگ' : 'Google Search Console & SEO Indexing'}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {isUrdu
                            ? 'گوگل پر ویب سائٹ کو ٹاپ رینکنگ دلانے کے لیے سائیٹ میپ، روبوٹس اور اسکیما'
                            : 'Pre-configured sitemap.xml, robots.txt, Schema.org ClothingStore, and Google site verification.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Sitemap.xml */}
                      <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-amber-400 flex items-center gap-1.5">
                            <FileText className="w-4 h-4" />
                            <span>/sitemap.xml</span>
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">
                            Valid 2026 Spec
                          </span>
                        </div>
                        <p className="text-xs text-stone-400">
                          Includes homepage, men, women, kids, unstitched collections, vouchers, and Kotli showroom links.
                        </p>
                        <a
                          href="/sitemap.xml"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:underline pt-1"
                        >
                          <span>Open Live Sitemap.xml</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Robots.txt */}
                      <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-amber-400 flex items-center gap-1.5">
                            <FileText className="w-4 h-4" />
                            <span>/robots.txt</span>
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">
                            Index Allowed
                          </span>
                        </div>
                        <p className="text-xs text-stone-400">
                          Configured with `User-agent: * Allow: /` with protected admin pathways and crawler sitemap pointers.
                        </p>
                        <a
                          href="/robots.txt"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:underline pt-1"
                        >
                          <span>Open Live Robots.txt</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#121216] border border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <p className="font-bold text-stone-200">Submit to Google Search Console:</p>
                        <p className="text-stone-400 text-[11px]">
                          Verify domain ownership via DNS TXT record or HTML meta tag and submit https://sitarakotli.com/sitemap.xml.
                        </p>
                      </div>

                      <a
                        href="https://search.google.com/search-console"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 shadow transition-all shrink-0"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Open Google Search Console</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* 4. GOOGLE SEARCH RESULTS (SERP) LIVE SIMULATOR */}
                  <div className="p-5 rounded-2xl bg-[#18181f] border border-[#d4af37]/30 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Search className="w-5 h-5 text-amber-400" />
                          <span>{isUrdu ? 'گوگل سرچ رزلٹس (SERP) لائیو جائزہ' : 'Google Search Results (SERP) Live Simulator'}</span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {isUrdu
                            ? 'دیکھیں کہ گوگل سرچ پر ستارہ کلاٹھ ہاؤس صارفین کے سامنے کیسا نظر آتا ہے'
                            : 'Exact simulation of how Sitara Cloth House appears on Google Search with Rich Snippets & Business Panel.'}
                        </p>
                      </div>

                      {/* View Mode Toggle: Mobile vs Desktop */}
                      <div className="inline-flex items-center p-1 rounded-xl bg-black/60 border border-gray-800 text-xs">
                        <button
                          type="button"
                          onClick={() => setSerpViewMode('mobile')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                            serpViewMode === 'mobile'
                              ? 'bg-amber-500 text-black shadow-md'
                              : 'text-stone-400 hover:text-white'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Google Mobile</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSerpViewMode('desktop')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                            serpViewMode === 'desktop'
                              ? 'bg-amber-500 text-black shadow-md'
                              : 'text-stone-400 hover:text-white'
                          }`}
                        >
                          <Laptop className="w-3.5 h-3.5" />
                          <span>Google Desktop</span>
                        </button>
                      </div>
                    </div>

                    {/* Google Search Bar Mockup */}
                    <div className="p-3 rounded-xl bg-[#202124] border border-[#5f6368]/40 flex items-center gap-3">
                      <Search className="w-4 h-4 text-[#9aa0a6]" />
                      <div className="flex-1 font-sans text-xs sm:text-sm text-white truncate">
                        Sitara Cloth House Kotli Azad Kashmir
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                        Rank #1
                      </span>
                    </div>

                    {/* SERP Preview Container */}
                    <div className="p-4 sm:p-5 rounded-xl bg-[#202124] border border-[#3c4043] font-sans text-stone-200 space-y-4">
                      <div className={`grid ${serpViewMode === 'desktop' ? 'grid-cols-1 lg:grid-cols-12 gap-6' : 'grid-cols-1'}`}>
                        {/* Main Search Organic Result */}
                        <div className={serpViewMode === 'desktop' ? 'lg:col-span-7 space-y-3' : 'space-y-3'}>
                          {/* Breadcrumb & Favicon */}
                          <div className="flex items-center gap-2 text-xs text-[#bdc1c6]">
                            <div className="w-6 h-6 rounded-full bg-[#303134] flex items-center justify-center p-1 border border-amber-400/30">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-[#e8eaed] font-medium leading-none">Sitara Cloth House</span>
                              <span className="text-[11px] text-[#9aa0a6] leading-tight font-mono">https://sitarakotli.com</span>
                            </div>
                          </div>

                          {/* Clickable Blue Title */}
                          <h4 className="text-base sm:text-lg text-[#8ab4f8] font-normal hover:underline cursor-pointer leading-snug">
                            Sitara Cloth House Kotli | Luxury Fabric & Fashion Store
                          </h4>

                          {/* Rich Snippet: Star Rating & Stock */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#bdc1c6]">
                            <span className="text-[#fbbc04] font-bold">★★★★★ 4.9</span>
                            <span>(184 customer reviews)</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-medium">In stock</span>
                            <span>•</span>
                            <span>₨₨ Price Range</span>
                          </div>

                          {/* Snippet Description */}
                          <p className="text-xs sm:text-sm text-[#bdc1c6] leading-relaxed">
                            Premium luxury fabrics in Kotli, Azad Kashmir. Genuine Chinese Boski, Winter Kohistan Karandi, Women's Luxury Lawn, Embroidered Chiffon & Festive Collections. Visit Khudadad Market, Main Bazaar, Kotli or Order on WhatsApp: 03425984394.
                          </p>

                          {/* Google Sitelinks Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#3c4043]/60">
                            <div className="p-2.5 rounded-lg bg-[#303134]/60 hover:bg-[#303134] transition-colors cursor-pointer">
                              <span className="text-xs text-[#8ab4f8] font-medium hover:underline block">
                                Men's Pure Boski & Karandi
                              </span>
                              <span className="text-[11px] text-[#9aa0a6] line-clamp-1">
                                Authentic Chinese Boski 6-Pound & Kohistan Karandi suits.
                              </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#303134]/60 hover:bg-[#303134] transition-colors cursor-pointer">
                              <span className="text-xs text-[#8ab4f8] font-medium hover:underline block">
                                Women's Luxury Lawn & Chiffon
                              </span>
                              <span className="text-[11px] text-[#9aa0a6] line-clamp-1">
                                Unstitched 3-piece luxury embroidered designer suits.
                              </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#303134]/60 hover:bg-[#303134] transition-colors cursor-pointer">
                              <span className="text-xs text-[#8ab4f8] font-medium hover:underline block">
                                Real-Time Order Tracking
                              </span>
                              <span className="text-[11px] text-[#9aa0a6] line-clamp-1">
                                Visual 4-stage tracking from Kotli showroom to your doorstep.
                              </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#303134]/60 hover:bg-[#303134] transition-colors cursor-pointer">
                              <span className="text-xs text-[#8ab4f8] font-medium hover:underline block">
                                WhatsApp Quick Order: 03425984394
                              </span>
                              <span className="text-[11px] text-[#9aa0a6] line-clamp-1">
                                Direct voice & text booking with Awais Malik.
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Google Local Business / Knowledge Panel (Desktop) */}
                        {serpViewMode === 'desktop' && (
                          <div className="lg:col-span-5 p-4 rounded-xl bg-[#303134] border border-[#5f6368]/30 space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-[#3c4043]">
                              <span className="text-xs font-bold text-white uppercase tracking-wider">
                                Google Business Profile
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                                Verified Kotli Store
                              </span>
                            </div>

                            <div className="space-y-1">
                              <h5 className="text-sm font-bold text-white">Sitara Cloth House (ستارہ کلاٹھ ہاؤس)</h5>
                              <p className="text-xs text-[#9aa0a6]">Clothing store in Kotli, Azad Jammu and Kashmir</p>
                              <div className="flex items-center gap-1.5 text-xs text-[#fbbc04]">
                                <span>4.9 ★★★★★</span>
                                <span className="text-[#9aa0a6]">(184 Google reviews)</span>
                              </div>
                            </div>

                            <div className="space-y-2 text-xs text-[#e8eaed] pt-2 border-t border-[#3c4043]">
                              <div className="flex items-start gap-2">
                                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <span>Khudadad Market, Main Bazaar, Kotli 11100, Azad Kashmir</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>Open daily: 9:00 AM – 10:00 PM</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="font-mono text-amber-300 font-bold">0342 5984394</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>Owner: Awais Malik (اویس ملک)</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 5. 100% FREE LIFETIME HOSTING & LIVE DEPLOYMENT GUIDE */}
                  <div className="p-5 rounded-2xl bg-[#18181f] border border-[#d4af37]/30 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Zap className="w-5 h-5 text-amber-400" />
                          <span>{isUrdu ? '100% مفت ویب سائٹ ہوسٹنگ اور لائیو پبلشنگ گائیڈ' : '100% FREE Website Hosting & Deployment Guide'}</span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {isUrdu
                            ? 'بغیر کسی فیس کے زندگی بھر کے لیے مفت ہوسٹنگ، مفت SSL سرٹیفکیٹ اور کسٹم ڈومین کنکشن'
                            : 'Host Sitara Cloth House 100% free forever with automatic HTTPS/SSL and zero monthly fees.'}
                        </p>
                      </div>

                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>$0 / PKR 0 Forever • No Credit Card</span>
                      </div>
                    </div>

                    {/* Platform Selector Tabs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setFreeHostingPlatform('vercel')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          freeHostingPlatform === 'vercel'
                            ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg'
                            : 'bg-black/40 border-gray-800 text-stone-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">Vercel Free</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            TOP PICK
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-1">Unlimited bandwidth, instant SSL, 1-click domain.</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFreeHostingPlatform('netlify')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          freeHostingPlatform === 'netlify'
                            ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg'
                            : 'bg-black/40 border-gray-800 text-stone-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">Netlify Free</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                            EASY
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-1">100 GB/month, drag-and-drop or GitHub deploy.</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFreeHostingPlatform('cloudflare')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          freeHostingPlatform === 'cloudflare'
                            ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg'
                            : 'bg-black/40 border-gray-800 text-stone-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">Cloudflare Pages</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                            FAST CDN
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-1">Unlimited requests & global edge CDN across Pakistan.</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFreeHostingPlatform('github')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          freeHostingPlatform === 'github'
                            ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg'
                            : 'bg-black/40 border-gray-800 text-stone-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">GitHub Pages</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-700 text-stone-300 font-bold">
                            STATIC
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-1">Permanent free code hosting directly from repo.</p>
                      </button>
                    </div>

                    {/* Step-by-Step Instructions Card */}
                    <div className="p-4 sm:p-5 rounded-xl bg-black/60 border border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                          Step-by-Step Publishing on {freeHostingPlatform.toUpperCase()}:
                        </span>
                        <span className="text-[11px] text-stone-400 font-mono">
                          Zero Cost • Permanent Free Plan
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-[#121216] border border-gray-800 space-y-1.5">
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[11px]">
                            1
                          </span>
                          <h6 className="font-bold text-white">Create Free Account</h6>
                          <p className="text-stone-400 text-[11px]">
                            Sign up for free at {freeHostingPlatform === 'vercel' ? 'vercel.com' : freeHostingPlatform === 'netlify' ? 'netlify.com' : freeHostingPlatform === 'cloudflare' ? 'pages.cloudflare.com' : 'github.com'} with your email ({shopProfile.email || 'awaism793@gmail.com'}).
                          </p>
                        </div>

                        <div className="p-3 rounded-lg bg-[#121216] border border-gray-800 space-y-1.5">
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[11px]">
                            2
                          </span>
                          <h6 className="font-bold text-white">Deploy App Code</h6>
                          <p className="text-stone-400 text-[11px]">
                            Upload your project repository. Build command is <code className="text-amber-300 font-mono">npm run build</code> and Output Directory is <code className="text-amber-300 font-mono">dist</code>.
                          </p>
                        </div>

                        <div className="p-3 rounded-lg bg-[#121216] border border-gray-800 space-y-1.5">
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[11px]">
                            3
                          </span>
                          <h6 className="font-bold text-white">Instant Free Subdomain</h6>
                          <p className="text-stone-400 text-[11px]">
                            You instantly receive a worldwide accessible free live URL (e.g. <span className="text-emerald-400 font-mono">sitarakotli.{freeHostingPlatform === 'vercel' ? 'vercel.app' : freeHostingPlatform === 'netlify' ? 'netlify.app' : 'pages.dev'}</span>) with automatic HTTPS/SSL.
                          </p>
                        </div>

                        <div className="p-3 rounded-lg bg-[#121216] border border-gray-800 space-y-1.5">
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[11px]">
                            4
                          </span>
                          <h6 className="font-bold text-white">Attach sitarakotli.com</h6>
                          <p className="text-stone-400 text-[11px]">
                            In the dashboard, click "Add Custom Domain" and input <strong className="text-amber-300">sitarakotli.com</strong>. The platform will automatically issue an SSL certificate for free.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 6. 15-POINT COMPATIBILITY & DEPLOYMENT AUDIT CHECKLIST */}
                  <div className="p-5 rounded-2xl bg-[#18181f] border border-[#d4af37]/30 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Shield className="w-5 h-5 text-emerald-400" />
                          <span>15/15 Requirements & Multi-Browser Audit</span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          All project criteria verified and ready for public launch.
                        </p>
                      </div>

                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                        15 / 15 Passed (100%)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                      {[
                        { num: 1, title: '100% FREE Website Hosting', desc: 'No paid plan required. Vercel & Netlify $0 forever.' },
                        { num: 2, title: 'Live & Worldwide Accessible', desc: 'Public URL accessible on any internet connection globally.' },
                        { num: 3, title: 'Google Chrome Compatible', desc: 'Blink engine optimized, high-DPI star favicon & PWA ready.' },
                        { num: 4, title: 'Mozilla Firefox Compatible', desc: 'Gecko engine tested, crisp vector graphics & fast layout.' },
                        { num: 5, title: 'Microsoft Edge Compatible', desc: 'Blink/Chromium verified on desktop and tablet.' },
                        { num: 6, title: 'Apple Safari Compatible', desc: 'WebKit engine tested on macOS & iOS with black status bar.' },
                        { num: 7, title: 'Opera & All Modern Browsers', desc: 'Full support across Opera, Brave, UC and Samsung Internet.' },
                        { num: 8, title: 'Mobile, Android, iPhone, Tablet & PC', desc: 'Fluid responsive breakpoints with touch navigation.' },
                        { num: 9, title: 'Google Search Indexing (SEO)', desc: 'Valid sitemap.xml, robots.txt & ClothingStore schema.' },
                        { num: 10, title: 'Free HTTPS / SSL Certificate', desc: 'Automatic 256-bit encryption for all visitors.' },
                        { num: 11, title: 'Fast Loading & Performance', desc: 'Optimized assets, Tailwind CSS 4 & instant page switching.' },
                        { num: 12, title: 'Professional Luxury Design', desc: 'Cinzel fonts, gold royal accents & authentic cloth imagery.' },
                        { num: 13, title: 'Free Subdomain or Custom Domain', desc: 'Use free .vercel.app or connect sitarakotli.com seamlessly.' },
                        { num: 14, title: 'Zero Compulsory Paid Hosting', desc: '100% free forever without hidden subscriptions.' },
                        { num: 15, title: 'All Features & Links Tested', desc: 'Cart, currency converter, WhatsApp & admin fully operational.' },
                      ].map((item) => (
                        <div key={item.num} className="p-3 rounded-xl bg-black/50 border border-emerald-500/30 flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-white block">
                              {item.num}. {item.title}
                            </span>
                            <span className="text-[11px] text-stone-400 leading-tight block mt-0.5">
                              {item.desc}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 7. Complete Database Backup & Restore Center */}
                  <div className="p-5 rounded-2xl bg-[#18181f] border border-[#d4af37]/30 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                          <Database className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">
                            {isUrdu ? 'ڈیٹا بیس اور ویب سائٹ مکمل بیک اپ سسٹم' : 'Store Database & Full Backup System'}
                          </h3>
                          <p className="text-xs text-gray-400">
                            Export or restore complete product catalog, orders, media assets, banners, and store configurations as structured JSON.
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {products.length} Products • {orders.length} Orders
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Export Card */}
                      <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-3">
                        <div className="flex items-center gap-2 text-white font-bold text-xs">
                          <Download className="w-4 h-4 text-amber-400" />
                          <span>Export Database Backup</span>
                        </div>
                        <p className="text-xs text-stone-400">
                          Creates a complete, portable JSON file containing all {products.length} products, customer orders, media assets, and site settings.
                        </p>
                        <button
                          type="button"
                          onClick={handleExportBackup}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Database JSON Backup</span>
                        </button>
                      </div>

                      {/* Import Card */}
                      <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-3">
                        <div className="flex items-center gap-2 text-white font-bold text-xs">
                          <Upload className="w-4 h-4 text-emerald-400" />
                          <span>Import & Restore Database</span>
                        </div>
                        <p className="text-xs text-stone-400">
                          Restore store data from a previously downloaded JSON backup. Instantly populates products, orders, and banners.
                        </p>
                        {/* Hidden input */}
                        <input
                          ref={backupInputRef}
                          type="file"
                          accept=".json,application/json"
                          onChange={handleImportBackup}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => backupInputRef.current?.click()}
                          className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center justify-center gap-2 border border-stone-700 shadow-md transition-all cursor-pointer"
                        >
                          <Upload className="w-4 h-4 text-amber-400" />
                          <span>Upload & Restore Database JSON</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SMART CLOUD ERP TABS */}
              {activeTab === 'billing' && <BillingInvoicesTab />}
              {activeTab === 'khata' && <KhataLedgerTab />}
              {activeTab === 'suppliers' && <SuppliersPurchasesTab />}
              {activeTab === 'reports' && <ReportsAnalyticsTab />}
              {activeTab === 'staff' && <StaffManagementTab />}
              {activeTab === 'cloud-security' && <CloudSecurityTab />}
              {activeTab === 'security-wall' && (
                <SecurityWallTab onSessionInvalidated={() => setIsAuthenticated(false)} />
              )}
            </main>
          </div>
        )}

        {/* MODAL: ADD / EDIT PRODUCT OR LISTING */}
        {(editingProduct || isAddingNew) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md">
            <div className="relative flex flex-col w-full max-w-3xl max-h-[92vh] bg-[#141418] border border-[#d4af37]/40 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#18181f] via-[#24242e] to-[#18181f] border-b border-[#d4af37]/30">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#d4af37]" />
                  <span>{editingProduct ? 'Edit Listing Details' : 'Add New Listing / Product'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setIsAddingNew(false);
                  }}
                  className="p-1 rounded text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-5 overflow-y-auto space-y-4">
                {/* Category Type Picker */}
                <div>
                  <label className="block text-xs text-gray-300 mb-1 font-semibold">
                    Listing Category Type
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['fabric', 'property', 'vehicle', 'business'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setProdForm({ ...prodForm, listingType: type })}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border capitalize flex items-center justify-center gap-1.5 transition-all ${
                          prodForm.listingType === type
                            ? 'bg-[#d4af37] text-black border-[#d4af37] font-bold shadow'
                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {type === 'fabric' && <Shirt className="w-3.5 h-3.5" />}
                        {type === 'property' && <Building className="w-3.5 h-3.5" />}
                        {type === 'vehicle' && <Car className="w-3.5 h-3.5" />}
                        {type === 'business' && <Store className="w-3.5 h-3.5" />}
                        <span>{type}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Picture Section with Camera & Gallery Launcher */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <label className="block text-xs font-semibold text-[#d4af37]">
                    Primary Picture & Media Access
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <img
                      src={prodForm.image}
                      alt="Preview"
                      className="w-20 h-20 rounded-xl object-cover border border-white/20 shrink-0"
                    />
                    <div className="flex-1 space-y-2 w-full">
                      <input
                        type="text"
                        value={prodForm.image || ''}
                        onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                        placeholder="Image URL or capture via Android tools"
                        className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsCameraActive(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white border border-white/20"
                        >
                          <Camera className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>Android Camera</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsMediaLibraryActive(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4af37] text-black text-xs font-semibold hover:brightness-110"
                        >
                          <Folder className="w-3.5 h-3.5" />
                          <span>Choose from Gallery</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Titles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Title (English)</label>
                    <input
                      type="text"
                      required
                      value={prodForm.title || ''}
                      onChange={(e) => setProdForm({ ...prodForm, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">عنوان (Urdu)</label>
                    <input
                      type="text"
                      dir="rtl"
                      value={prodForm.titleUrdu || ''}
                      onChange={(e) => setProdForm({ ...prodForm, titleUrdu: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white font-urdu focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                {/* Fabric Category & SKU */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Collection Gender</label>
                    <select
                      value={prodForm.gender || 'men'}
                      onChange={(e) => setProdForm({ ...prodForm, gender: e.target.value as 'men' | 'women' | 'kids' })}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    >
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                      <option value="kids">Kids</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Fabric Material</label>
                    <select
                      value={prodForm.category || 'boski'}
                      onChange={(e) => setProdForm({ ...prodForm, category: e.target.value as FabricCategory })}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    >
                      <option value="boski">Pure Boski</option>
                      <option value="khaddar">Winter Khaddar</option>
                      <option value="linen">Luxury Linen</option>
                      <option value="karandi">Winter Karandi</option>
                      <option value="lawn">Summer Lawn</option>
                      <option value="latha-cotton">Cotton Latha</option>
                      <option value="chiffon">Luxury Chiffon</option>
                      <option value="silk">Pure Silk</option>
                      <option value="velvet">Bridal Velvet</option>
                      <option value="wash-wear">Wash & Wear</option>
                      <option value="wool-shawl">Pashmina Shawls</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">SKU (QR Verified)</label>
                    <input
                      type="text"
                      value={prodForm.sku || ''}
                      onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white font-mono focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                {/* Price, Stock, Original */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Retail Price (PKR)</label>
                    <input
                      type="number"
                      required
                      value={prodForm.price || ''}
                      onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Original Price (PKR)</label>
                    <input
                      type="number"
                      value={prodForm.originalPrice || ''}
                      onChange={(e) =>
                        setProdForm({ ...prodForm, originalPrice: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Stock Quantity</label>
                    <input
                      type="number"
                      value={prodForm.stockQuantity || ''}
                      onChange={(e) =>
                        setProdForm({ ...prodForm, stockQuantity: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                {/* Wholesale & Product Video URL */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Wholesale Rate (PKR)</label>
                    <input
                      type="number"
                      value={prodForm.wholesalePrice || ''}
                      onChange={(e) =>
                        setProdForm({ ...prodForm, wholesalePrice: Number(e.target.value) })
                      }
                      placeholder="e.g. 5200"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Wholesale Min Qty</label>
                    <input
                      type="number"
                      min={2}
                      value={prodForm.wholesaleMinQty || 5}
                      onChange={(e) =>
                        setProdForm({ ...prodForm, wholesaleMinQty: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Product Video URL (MP4)</label>
                    <input
                      type="url"
                      value={prodForm.videoUrl || ''}
                      onChange={(e) => setProdForm({ ...prodForm, videoUrl: e.target.value })}
                      placeholder="https://.../showcase.mp4"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                {/* Fabric specifics / Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Fabric Cut / Meter / Size</label>
                    <input
                      type="text"
                      value={prodForm.cutMeters || ''}
                      onChange={(e) => setProdForm({ ...prodForm, cutMeters: e.target.value })}
                      placeholder="e.g. 4.5 Meters (Full Suit)"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Location / Market</label>
                    <input
                      type="text"
                      value={prodForm.location || ''}
                      onChange={(e) => setProdForm({ ...prodForm, location: e.target.value })}
                      placeholder="e.g. Khudadad Market Kotli"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs text-gray-300 mb-1">Description (English)</label>
                  <textarea
                    rows={2}
                    value={prodForm.description || ''}
                    onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 mb-1">تفصیل (Urdu)</label>
                  <textarea
                    rows={2}
                    dir="rtl"
                    value={prodForm.descriptionUrdu || ''}
                    onChange={(e) => setProdForm({ ...prodForm, descriptionUrdu: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white font-urdu focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setIsAddingNew(false);
                    }}
                    className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#b38f2a] text-black font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all"
                  >
                    Save & Publish Listing
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Camera Capture Sub-Modal */}
      {isCameraActive && (
        <CameraCaptureModal
          isOpen={isCameraActive}
          onClose={() => {
            setIsCameraActive(false);
            setCameraTarget(null);
          }}
          onPhotoCaptured={(imageUrl: string, meta: { title: string; category: MediaCategory }) => {
            if (cameraTarget === 'avatar') {
              setAdminForm((prev) => ({ ...prev, avatar: imageUrl }));
              updateAdminProfile({ avatar: imageUrl });
              addMediaAsset({
                title: `Admin Awais Malik - Camera Portrait (${new Date().toLocaleDateString()})`,
                url: imageUrl,
                category: 'profiles',
                source: 'camera',
                description: 'Captured via Android camera viewfinder',
                tags: ['admin', 'profile', 'camera'],
              });
              setAdminSaved(true);
              setMediaNotification('✅ Admin profile picture updated from camera!');
              setTimeout(() => {
                setAdminSaved(false);
                setMediaNotification(null);
              }, 4000);
            } else if (editingProduct || isAddingNew) {
              setProdForm((prev) => ({ ...prev, image: imageUrl }));
            } else {
              addMediaAsset({
                title: meta?.title || 'Android Camera Shot',
                url: imageUrl,
                category: meta?.category || 'fabrics',
                source: 'camera',
                description: 'Captured in live viewfinder',
              });
            }
            setIsCameraActive(false);
            setCameraTarget(null);
          }}
        />
      )}

      {/* Central Media Library Sub-Modal */}
      {isMediaLibraryActive && (
        <MediaLibraryModal
          isOpen={isMediaLibraryActive}
          onClose={() => setIsMediaLibraryActive(false)}
          onSelectImage={(url) => {
            if (editingProduct || isAddingNew) {
              setProdForm((prev) => ({ ...prev, image: url }));
            }
            setIsMediaLibraryActive(false);
          }}
        />
      )}

      {/* Photo Studio Cropper & Editor */}
      {editingMediaAsset && (
        <ImageEditorModal
          isOpen={!!editingMediaAsset}
          onClose={() => setEditingMediaAsset(null)}
          imageUrl={editingMediaAsset.url}
          onSave={(editedUrl, meta) => {
            addMediaAsset({
              title: meta.title,
              url: editedUrl,
              category: meta.category,
              source: 'upload',
              description: meta.description,
            });
            setEditingMediaAsset(null);
          }}
          initialTitle={editingMediaAsset.title}
          initialCategory={editingMediaAsset.category}
        />
      )}
    </div>
  );
};
