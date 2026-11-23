import React, { useState, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import {
  BannerActionType,
  BannerBadgeType,
  BannerCollection,
  BannerItem,
  FabricCategory,
  MediaCategory,
} from '../types';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  Camera,
  Smartphone,
  FolderOpen,
  Crop,
  Check,
  X,
  Clock,
  Calendar,
  Sliders,
  Play,
  Pause,
  ShoppingBag,
  MessageCircle,
  ExternalLink,
  Tag,
  AlertCircle,
  Layers,
  Crown,
} from 'lucide-react';
import { CameraCaptureModal } from './CameraCaptureModal';
import { MediaLibraryModal } from './MediaLibraryModal';
import { ImageEditorModal } from './ImageEditorModal';

export const AdminBannerManager: React.FC = () => {
  const {
    lang,
    banners,
    sliderSettings,
    products,
    addBanner,
    updateBanner,
    deleteBanner,
    reorderBanners,
    updateSliderSettings,
    adminProfile,
  } = useShop();

  const isUrdu = lang === 'ur';

  // Modal & form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Sub-modals for image selection
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMediaLibraryActive, setIsMediaLibraryActive] = useState(false);
  const [isEditorActive, setIsEditorActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form state
  const defaultBanner: Omit<BannerItem, 'id'> = {
    title: '',
    titleUrdu: '',
    subtitle: '',
    subtitleUrdu: '',
    description: '',
    descriptionUrdu: '',
    badgeText: 'NEW ARRIVAL',
    badgeUrdu: 'نئی آمد 2026',
    badgeType: 'luxury',
    imageUrl: '/assets/aistudio/Screenshot_20261105-152400_f4f80a56.jpg',
    categoryTarget: 'all',
    fabricCategory: 'boski',
    primaryButtonText: 'SHOP NOW',
    primaryButtonTextUrdu: 'ابھی خریدیں',
    primaryButtonAction: 'shop',
    secondaryButtonText: 'ORDER VIA WHATSAPP',
    secondaryButtonTextUrdu: 'واٹس ایپ آرڈر',
    secondaryButtonAction: 'whatsapp',
    discountPercent: 15,
    startDate: '',
    expiryDate: '',
    isActive: true,
    order: banners.length + 1,
    textAlignment: 'left',
    overlayDarkness: 0.55,
  };

  const [formData, setFormData] = useState<Omit<BannerItem, 'id'> & { id?: string }>(defaultBanner);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setFormData({
      ...defaultBanner,
      order: banners.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner: BannerItem) => {
    setEditingBanner(banner);
    setFormData(banner);
    setIsModalOpen(true);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.imageUrl.trim()) {
      alert('Please provide a banner title and image URL');
      return;
    }

    if (editingBanner) {
      updateBanner({
        ...formData,
        id: editingBanner.id,
      } as BannerItem);
      showNotification('✅ Banner successfully updated!');
    } else {
      addBanner(formData);
      showNotification('✅ New homepage banner created!');
    }
    setIsModalOpen(false);
  };

  const handleDeleteBanner = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete banner "${title}"?`)) {
      deleteBanner(id);
      showNotification('🗑️ Banner deleted');
    }
  };

  const handleToggleActive = (banner: BannerItem) => {
    updateBanner({
      ...banner,
      isActive: !banner.isActive,
    });
    showNotification(`Banner ${banner.isActive ? 'deactivated' : 'activated'}`);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const copy = [...banners];
    const temp = copy[index];
    copy[index] = copy[index - 1];
    copy[index - 1] = temp;
    // Update order numbers
    copy.forEach((b, i) => {
      b.order = i + 1;
    });
    reorderBanners(copy);
  };

  const handleMoveDown = (index: number) => {
    if (index === banners.length - 1) return;
    const copy = [...banners];
    const temp = copy[index];
    copy[index] = copy[index + 1];
    copy[index + 1] = temp;
    copy.forEach((b, i) => {
      b.order = i + 1;
    });
    reorderBanners(copy);
  };

  // Android Gallery File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (url) {
        setFormData((prev) => ({ ...prev, imageUrl: url }));
        showNotification('📸 Picture imported from Android Gallery!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Schedule status helper
  const todayStr = new Date().toISOString().split('T')[0];
  const getScheduleStatus = (b: BannerItem) => {
    if (!b.isActive) return { label: 'Inactive / Hidden', color: 'bg-stone-800 text-stone-400 border-stone-700' };
    if (b.startDate && b.startDate > todayStr) {
      return { label: `Scheduled: ${b.startDate}`, color: 'bg-blue-950 text-blue-300 border-blue-500/40' };
    }
    if (b.expiryDate && b.expiryDate < todayStr) {
      return { label: `Expired: ${b.expiryDate}`, color: 'bg-red-950 text-red-300 border-red-500/40' };
    }
    if (b.expiryDate) {
      return { label: `Live until ${b.expiryDate}`, color: 'bg-emerald-950 text-emerald-300 border-emerald-500/40' };
    }
    return { label: 'Live on Homepage', color: 'bg-emerald-950 text-emerald-300 border-emerald-500/40' };
  };

  const activeCount = banners.filter((b) => b.isActive).length;

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-stone-900 border border-amber-500 text-amber-300 text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#141418] border border-white/10 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              <span>{isUrdu ? 'ہوم پیج بینرز و لگژری سلائیڈر سسٹم' : 'Homepage Banners & Luxury Sliders'}</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40 font-bold">
              {activeCount} {isUrdu ? 'فعال' : 'Active'} / {banners.length} {isUrdu ? 'کل' : 'Total'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {isUrdu
              ? 'مردانہ، زنانه اور بچوں کے لیے خودکار سلائیڈر بینرز بنائیں، تبدیل کریں اور شیڈول کریں'
              : 'Create, schedule, crop and manage multi-slider banners for Men, Women & Kids collections.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isSettingsOpen
                ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                : 'bg-black/40 text-gray-300 border-white/10 hover:border-[#d4af37]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>{isUrdu ? 'سلائیڈر سیٹنگز' : 'Slider Settings'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-amber-400 to-[#b8860b] text-black font-bold text-xs shadow-lg shadow-[#d4af37]/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isUrdu ? 'نیا بینر شامل کریں' : 'Add New Banner'}</span>
          </button>
        </div>
      </div>

      {/* 2. Slider Speed & Behavior Settings (Collapsible) */}
      {isSettingsOpen && (
        <div className="p-4 sm:p-5 rounded-2xl bg-black/70 border border-[#d4af37]/30 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#d4af37]" />
              <span>{isUrdu ? 'خودکار سلائیڈ شو سیٹنگز و رفتار' : 'Automatic Slideshow Speed & Settings'}</span>
            </h4>
            <span className="text-[11px] text-gray-400">Controls live homepage banner animation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Speed selection */}
            <div className="space-y-1.5">
              <label className="text-gray-300 block font-medium">Slideshow Timing (Seconds)</label>
              <div className="flex items-center gap-1 bg-[#141418] p-1 rounded-xl border border-white/10">
                {[3000, 5000, 7000, 10000].map((ms) => (
                  <button
                    key={ms}
                    type="button"
                    onClick={() => updateSliderSettings({ slideInterval: ms })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      sliderSettings.slideInterval === ms
                        ? 'bg-[#d4af37] text-black shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {ms / 1000}s
                  </button>
                ))}
              </div>
            </div>

            {/* Autoplay Toggle */}
            <div className="space-y-1.5">
              <label className="text-gray-300 block font-medium">Auto Slideshow</label>
              <button
                type="button"
                onClick={() => updateSliderSettings({ autoPlay: !sliderSettings.autoPlay })}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  sliderSettings.autoPlay
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                    : 'bg-stone-900 border-stone-700 text-stone-400'
                }`}
              >
                {sliderSettings.autoPlay ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{sliderSettings.autoPlay ? 'Auto-Play Active' : 'Manual Navigation Only'}</span>
              </button>
            </div>

            {/* Pause on Hover */}
            <div className="space-y-1.5">
              <label className="text-gray-300 block font-medium">Pause on User Hover</label>
              <button
                type="button"
                onClick={() => updateSliderSettings({ pauseOnHover: !sliderSettings.pauseOnHover })}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  sliderSettings.pauseOnHover
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                    : 'bg-stone-900 border-stone-700 text-stone-400'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{sliderSettings.pauseOnHover ? 'Enabled (Smooth)' : 'Disabled'}</span>
              </button>
            </div>

            {/* Collection Filter Tabs atop banner */}
            <div className="space-y-1.5">
              <label className="text-gray-300 block font-medium">Collection Filter Tabs</label>
              <button
                type="button"
                onClick={() =>
                  updateSliderSettings({ showCollectionFilterTabs: !sliderSettings.showCollectionFilterTabs })
                }
                className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  sliderSettings.showCollectionFilterTabs
                    ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                    : 'bg-stone-900 border-stone-700 text-stone-400'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{sliderSettings.showCollectionFilterTabs ? 'Tabs Visible' : 'Tabs Hidden'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Banner Items List */}
      <div className="space-y-3">
        {banners.map((banner, index) => {
          const schedule = getScheduleStatus(banner);

          return (
            <div
              key={banner.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                banner.isActive
                  ? 'bg-[#121216] border-white/10 hover:border-[#d4af37]/40'
                  : 'bg-[#0d0d10] border-white/5 opacity-60'
              }`}
            >
              {/* Left: Thumbnail & Reorder controls */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex flex-col gap-1 text-gray-500">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-white/10 hover:text-white disabled:opacity-20 cursor-pointer"
                    title="Move slide up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[10px] text-center text-amber-400 font-bold">{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === banners.length - 1}
                    className="p-1 rounded hover:bg-white/10 hover:text-white disabled:opacity-20 cursor-pointer"
                    title="Move slide down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="relative w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden border border-white/20 shrink-0 bg-black">
                  <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                  {banner.discountPercent && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-rose-600 text-[9px] font-bold text-white">
                      {banner.discountPercent}% OFF
                    </span>
                  )}
                </div>

                {/* Banner Titles & Metadata */}
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {banner.badgeText || 'PROMO'}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10">
                      {banner.categoryTarget.toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${schedule.color}`}>
                      {schedule.label}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-tight">
                    {banner.title}
                    {banner.titleUrdu && (
                      <span className="text-xs font-urdu text-[#d4af37] font-normal ml-2">
                        ({banner.titleUrdu})
                      </span>
                    )}
                  </h4>

                  <p className="text-xs text-gray-400 line-clamp-1">{banner.subtitle}</p>

                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span>
                      Button: <strong className="text-white">{banner.primaryButtonText}</strong> ({banner.primaryButtonAction})
                    </span>
                    {banner.secondaryButtonText && (
                      <span>
                        • 2nd: <strong className="text-emerald-400">{banner.secondaryButtonText}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Action Buttons & Toggle */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0 border-white/10">
                <button
                  type="button"
                  onClick={() => handleToggleActive(banner)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    banner.isActive
                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900'
                      : 'bg-stone-900 text-stone-400 border border-stone-700 hover:text-white'
                  }`}
                >
                  {banner.isActive ? 'Active' : 'Hidden'}
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(banner)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10 transition-colors"
                  title="Edit Banner"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteBanner(banner.id, banner.title)}
                  className="p-2 rounded-xl bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-500/20 transition-colors"
                  title="Delete Banner"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Large Add / Edit Banner Modal with WYSIWYG Live Preview */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-[#111115] border border-[#d4af37]/40 rounded-3xl p-5 sm:p-7 shadow-2xl my-8 text-white max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#d4af37] to-amber-700 flex items-center justify-center text-black font-bold">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingBanner ? 'Edit Banner & Slider Details' : 'Create New Luxury Homepage Banner'}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    SITARA CLOTH HOUSE • Admin Awais Malik Portal
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form & Live Preview Body (Scrollable) */}
            <form onSubmit={handleSaveBanner} className="flex-1 overflow-y-auto pr-1 py-4 space-y-6">
              {/* Live WYSIWYG Banner Viewport Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    Live Desktop / Mobile Banner Preview
                  </span>
                  <span>Shows instant visual styling</span>
                </div>

                <div className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden border border-[#d4af37]/40 shadow-xl bg-black">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${formData.imageUrl}')` }}
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/80 to-transparent"
                    style={{ opacity: formData.overlayDarkness ?? 0.55 }}
                  />

                  <div className="relative h-full p-4 sm:p-6 flex flex-col justify-center max-w-xl space-y-2 text-left">
                    {formData.badgeText && (
                      <span className="inline-block self-start px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 uppercase">
                        {formData.badgeText}
                      </span>
                    )}
                    <h2 className="font-serif-luxury text-lg sm:text-2xl font-bold text-white leading-tight">
                      {formData.title || 'Your Banner Title Goes Here'}
                    </h2>
                    <p className="text-amber-300 text-xs sm:text-sm font-medium">
                      {formData.subtitle || 'Your Luxury Subtitle & Fabric Tagline'}
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black text-xs font-bold shadow-md">
                        {formData.primaryButtonText || 'SHOP NOW'}
                      </span>
                      {formData.secondaryButtonText && (
                        <span className="px-3 py-1.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-xs font-semibold">
                          {formData.secondaryButtonText}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Source Selection Options */}
              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-3">
                <label className="block text-xs font-bold text-white flex items-center justify-between">
                  <span>📸 Banner Image Selection (Android Gallery & Camera) *</span>
                  <span className="text-[11px] text-amber-400 font-normal">Choose source below</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  {/* Option 1: Android Phone Gallery */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 rounded-xl bg-stone-900 border border-amber-500/30 hover:border-amber-400 text-stone-200 hover:text-amber-300 flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer shadow-sm"
                  >
                    <Smartphone className="w-5 h-5 text-amber-400" />
                    <span className="font-semibold text-[11px]">Android Gallery</span>
                  </button>

                  {/* Option 2: Android Camera Live Viewfinder */}
                  <button
                    type="button"
                    onClick={() => setIsCameraActive(true)}
                    className="p-3 rounded-xl bg-stone-900 border border-amber-500/30 hover:border-amber-400 text-stone-200 hover:text-amber-300 flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer shadow-sm"
                  >
                    <Camera className="w-5 h-5 text-emerald-400" />
                    <span className="font-semibold text-[11px]">Live Camera</span>
                  </button>

                  {/* Option 3: Media Library */}
                  <button
                    type="button"
                    onClick={() => setIsMediaLibraryActive(true)}
                    className="p-3 rounded-xl bg-stone-900 border border-amber-500/30 hover:border-amber-400 text-stone-200 hover:text-amber-300 flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer shadow-sm"
                  >
                    <FolderOpen className="w-5 h-5 text-blue-400" />
                    <span className="font-semibold text-[11px]">Media Library</span>
                  </button>

                  {/* Option 4: Photo Editor & Cropper */}
                  <button
                    type="button"
                    onClick={() => setIsEditorActive(true)}
                    className="p-3 rounded-xl bg-stone-900 border border-amber-500/30 hover:border-amber-400 text-stone-200 hover:text-amber-300 flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer shadow-sm"
                  >
                    <Crop className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold text-[11px]">Crop & Edit</span>
                  </button>
                </div>

                {/* Hidden File Input for Android Gallery */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Direct Image URL input */}
                <div>
                  <input
                    type="text"
                    required
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://... Image URL"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37] font-mono"
                  />
                </div>
              </div>

              {/* Title & Subtitle Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Banner Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Pure Royal Chinese Boski Silk"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    عنوان (Urdu Title)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={formData.titleUrdu}
                    onChange={(e) => setFormData({ ...formData, titleUrdu: e.target.value })}
                    placeholder="مثال: خالص شاہی چینی بوسکی ریشم"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white font-urdu focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Subtitle (English)
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="e.g. Kotli's Signature 8-Pound Silk Collection"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    ذیلی عنوان (Urdu Subtitle)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={formData.subtitleUrdu}
                    onChange={(e) => setFormData({ ...formData, subtitleUrdu: e.target.value })}
                    placeholder="مثال: کوٹلی کی خصوصی 8 پاؤنڈ ریشمی ورائٹی"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white font-urdu focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              {/* Badge & Target Collection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Badge Text (e.g. 15% OFF / NEW)
                  </label>
                  <input
                    type="text"
                    value={formData.badgeText || ''}
                    onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                    placeholder="e.g. ROYAL BOSKI • 19% OFF"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Badge Style
                  </label>
                  <select
                    value={formData.badgeType}
                    onChange={(e) => setFormData({ ...formData, badgeType: e.target.value as BannerBadgeType })}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="luxury">Luxury Gold</option>
                    <option value="sale">Hot Sale (Red)</option>
                    <option value="new">New Arrival (Green)</option>
                    <option value="festive">Festive / Bridal (Purple)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Target Collection
                  </label>
                  <select
                    value={formData.categoryTarget}
                    onChange={(e) => setFormData({ ...formData, categoryTarget: e.target.value as BannerCollection })}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="all">All Collections</option>
                    <option value="men">Men's Collection</option>
                    <option value="women">Women's Collection</option>
                    <option value="kids">Kids' Collection</option>
                    <option value="unstitched">Unstitched Fabrics</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons Setup */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Clickable Action Buttons & Catalog Connection</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Primary Button Text</label>
                    <input
                      type="text"
                      value={formData.primaryButtonText}
                      onChange={(e) => setFormData({ ...formData, primaryButtonText: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Button Action</label>
                    <select
                      value={formData.primaryButtonAction}
                      onChange={(e) => setFormData({ ...formData, primaryButtonAction: e.target.value as BannerActionType })}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    >
                      <option value="shop">Filter Catalog & Shop</option>
                      <option value="category">Category Collection</option>
                      <option value="product">Open Specific Product Detail</option>
                      <option value="contact">Scroll to Contact Us</option>
                      <option value="whatsapp">Direct WhatsApp Chat</option>
                    </select>
                  </div>

                  {formData.primaryButtonAction === 'product' && (
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Link to Product</label>
                      <select
                        value={formData.linkedProductId || ''}
                        onChange={(e) => setFormData({ ...formData, linkedProductId: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                      >
                        <option value="">-- Select Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Secondary Button Text (Optional)</label>
                    <input
                      type="text"
                      value={formData.secondaryButtonText || ''}
                      onChange={(e) => setFormData({ ...formData, secondaryButtonText: e.target.value })}
                      placeholder="e.g. ORDER VIA WHATSAPP"
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-300 mb-1">Secondary Action</label>
                    <select
                      value={formData.secondaryButtonAction || 'whatsapp'}
                      onChange={(e) => setFormData({ ...formData, secondaryButtonAction: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    >
                      <option value="whatsapp">Direct WhatsApp: 03425984394</option>
                      <option value="contact">Contact Section</option>
                      <option value="location">Showroom Location / Google Map</option>
                      <option value="reviews">Customer Reviews</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Schedule Dates & Visual Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Start Schedule Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate || ''}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Special Discount %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={formData.discountPercent ?? 0}
                    onChange={(e) => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-200">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded bg-stone-900 border-stone-700 focus:ring-amber-400"
                  />
                  <span>Active & Visible in Slideshow</span>
                </label>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-amber-400 to-[#b8860b] text-black font-bold text-xs shadow-lg shadow-[#d4af37]/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  {editingBanner ? 'Save Changes' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-modal: Live Android Camera */}
      {isCameraActive && (
        <CameraCaptureModal
          isOpen={isCameraActive}
          onClose={() => setIsCameraActive(false)}
          onPhotoCaptured={(imageUrl) => {
            setFormData((prev) => ({ ...prev, imageUrl }));
            setIsCameraActive(false);
            showNotification('📸 Picture captured from Android Camera!');
          }}
          defaultCategory="banners"
        />
      )}

      {/* Sub-modal: Media Library Selection */}
      {isMediaLibraryActive && (
        <MediaLibraryModal
          isOpen={isMediaLibraryActive}
          onClose={() => setIsMediaLibraryActive(false)}
          onSelectImage={(url) => {
            setFormData((prev) => ({ ...prev, imageUrl: url }));
            setIsMediaLibraryActive(false);
            showNotification('🖼️ Image selected from Media Library');
          }}
        />
      )}

      {/* Sub-modal: Photo Cropper & Studio */}
      {isEditorActive && (
        <ImageEditorModal
          isOpen={isEditorActive}
          onClose={() => setIsEditorActive(false)}
          imageUrl={formData.imageUrl}
          onSave={(editedUrl) => {
            setFormData((prev) => ({ ...prev, imageUrl: editedUrl }));
            setIsEditorActive(false);
            showNotification('✂️ Picture cropped and saved!');
          }}
          initialTitle="Banner Image Crop"
          initialCategory="banners"
        />
      )}
    </div>
  );
};
