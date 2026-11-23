import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import {
  ShoppingBag,
  Heart,
  Phone,
  Search,
  Menu,
  X,
  ShieldCheck,
  User,
  Sparkles,
  MapPin,
  MessageCircle,
  Crown,
  Edit,
  Globe,
} from 'lucide-react';
import { sanitizePhoneForWhatsApp } from '../utils/logic';
import { SUPPORTED_LANGUAGES } from '../utils/globalBusiness';
import { Language } from '../types';
import { BrandLogo } from './BrandLogo';
import { ThemeSelector } from './ThemeSelector';
import { CurrencySelector } from './CurrencySelector';
import { CloudSyncBadge } from './CloudSyncStatusBar';
import { PWAInstallButton } from './PWAInstallButton';

export const Navbar: React.FC = () => {
  const {
    lang,
    setLang,
    t,
    shopProfile,
    cart,
    wishlist,
    filters,
    setFilters,
    setIsCartOpen,
    setIsAdminOpen,
    setIsAuthOpen,
    setIsLogoModalOpen,
    user,
    adminProfile,
  } = useShop();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const waNumber = sanitizePhoneForWhatsApp(shopProfile.whatsapp || '03425984394');

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGenderFilter = (gender: 'all' | 'men' | 'women' | 'kids') => {
    setFilters((prev) => ({ ...prev, gender }));
    scrollToSection('catalog');
  };

  const avatarSrc = avatarFailed ? '/assets/images/awais_malik_avatar.svg' : adminProfile.avatar;

  return (
    <header className="sticky top-0 z-40 bg-stone-950/95 backdrop-blur-md border-b border-amber-900/30 overflow-x-clip">
      {/* 1. Top Announcement & Utility Bar */}
      <div className="bg-gradient-to-r from-stone-950 via-amber-950/60 to-stone-950 border-b border-amber-900/20 py-1 px-3 sm:px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap md:flex-nowrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-amber-200/90 font-medium tracking-wide min-w-0 md:max-w-[340px] lg:max-w-[440px]">
            <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              {lang === 'ur' ? shopProfile.announcementUr : shopProfile.announcementEn}
            </span>
          </div>

          <div className="flex flex-wrap md:flex-nowrap items-center gap-x-2 gap-y-1 sm:gap-2.5 text-stone-300 shrink-0">
            <div className="hidden sm:block">
              <CloudSyncBadge />
            </div>
            <div className="hidden xl:block">
              <PWAInstallButton compact />
            </div>
            <div className="hidden 2xl:flex items-center gap-1.5 text-amber-300 font-medium text-[11px] whitespace-nowrap">
              <Crown className="w-3 h-3 text-amber-400" />
              <span>{lang === 'ur' ? `مالک: ${shopProfile.ownerNameUrdu || 'اویس ملک'}` : `${shopProfile.ownerName || 'Awais Malik'}`}</span>
            </div>
            <span className="hidden 2xl:inline text-stone-700">|</span>
            <a
              href={`tel:${shopProfile.phone}`}
              className="hidden lg:flex items-center gap-1 hover:text-amber-400 transition-colors whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>{shopProfile.phone}</span>
            </a>
            <span className="hidden 2xl:inline text-stone-700">|</span>
            <div className="hidden 2xl:flex items-center gap-1 text-stone-400 whitespace-nowrap">
              <MapPin className="w-3.5 h-3.5 text-amber-500/80" />
              <span>Khudadad Market, Kotli</span>
            </div>
            <span className="hidden sm:inline text-stone-700">|</span>
            <CurrencySelector variant="compact" />
            <span className="hidden sm:inline text-stone-700">|</span>
            <div className="hidden sm:block">
              <ThemeSelector variant="compact" />
            </div>
            <span className="hidden sm:inline text-stone-700">|</span>
            {/* 10-Language Quick Selector */}
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Language)}
              aria-label="Select Language"
              className="px-2 py-0.5 rounded bg-stone-900 border border-amber-500/30 text-amber-300 text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer shrink-0"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.code.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Main Luxury Header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo & Upgrade Option */}
          <div className="relative group flex items-center gap-2 min-w-0">
            <BrandLogo
              variant="header"
              showSubtext={true}
              showUrdu={true}
              onClick={() => scrollToSection('hero')}
            />
            <button
              onClick={() => setIsLogoModalOpen(true)}
              className="hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-stone-900/90 border border-amber-500/50 text-amber-400 hover:bg-amber-500/20 shadow-md text-[11px] font-semibold items-center gap-1 shrink-0"
              title="Upgrade or Edit Brand Logo (Awais Malik)"
              aria-label="Upgrade or Edit Brand Logo"
            >
              <Edit className="w-3 h-3 text-amber-400" />
              <span>Edit Logo</span>
            </button>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                placeholder={t.searchPlaceholder}
                className="w-full bg-stone-900/90 text-stone-100 placeholder-stone-500 text-xs sm:text-sm rounded-full pl-10 pr-4 py-2 border border-amber-900/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
              />
              <Search className="w-4 h-4 text-amber-400/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {filters.searchQuery && (
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            <button
              onClick={() => setShowSearchInput(!showSearchInput)}
              className="lg:hidden p-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 hover:text-amber-400"
              aria-label="Toggle search"
            >
              <Search className="w-4 h-4" />
            </button>

            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent('Hello Sitara Cloth House, I am visiting your global website and have an inquiry about your fabrics.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/80 text-xs font-medium transition-all shadow-sm"
              title="Chat with Sitara Cloth House"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
              <span className="font-semibold">{t.quickWhatsApp}</span>
            </a>

            <button
              onClick={() => {
                setFilters((prev) => ({ ...prev, onlyOffers: false }));
                scrollToSection('catalog');
              }}
              className="relative p-2 rounded-full bg-stone-900/90 border border-amber-900/30 text-stone-300 hover:text-amber-400 hover:border-amber-500/40 transition-all"
              title="Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300/80" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-stone-950 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-stone-950 font-bold text-xs sm:text-sm hover:brightness-110 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">{lang === 'ur' ? 'شاپنگ بیگ' : 'Cart'}</span>
              <span className="bg-stone-950 text-amber-400 text-xs font-extrabold px-1.5 py-0.2 rounded-full">
                {totalCartCount}
              </span>
            </button>

            <button
              onClick={() => setIsAdminOpen(true)}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-stone-900 border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 hover:border-amber-400 transition-all shadow-sm cursor-pointer"
              title="Admin Awais Malik Dashboard"
              aria-label="Admin Awais Malik Dashboard"
            >
              <img
                src={avatarSrc}
                alt={adminProfile.name}
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
                className="w-5 h-5 rounded-full object-cover border border-amber-400 shrink-0"
              />
              <span className="hidden xl:inline text-xs font-semibold">Awais Malik</span>
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            </button>

            <button
              onClick={() => setIsAuthOpen(true)}
              className="p-2 rounded-full bg-stone-900 border border-stone-800 text-stone-300 hover:text-amber-400 transition-all cursor-pointer"
              title={user ? user.name : 'Customer Login'}
              aria-label="Customer Login"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 hover:text-amber-400"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Expandable */}
        {showSearchInput && (
          <div className="mt-2.5 lg:hidden">
            <div className="relative w-full">
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                placeholder={t.searchPlaceholder}
                className="w-full bg-stone-900 text-stone-100 placeholder-stone-500 text-sm rounded-full pl-10 pr-4 py-2 border border-amber-900/60 focus:outline-none focus:border-amber-400"
              />
              <Search className="w-4 h-4 text-amber-400/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        )}
      </div>

      {/* 3. Luxury Navigation Bar */}
      <nav className="hidden md:block bg-stone-900/70 border-t border-amber-900/20 text-xs sm:text-sm font-medium tracking-wide">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 lg:gap-5 py-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => scrollToSection('hero')}
              className="whitespace-nowrap text-stone-300 hover:text-amber-400 transition-colors uppercase tracking-wider text-xs font-semibold cursor-pointer"
            >
              {t.navHome}
            </button>
            <button
              onClick={() => handleGenderFilter('all')}
              className="whitespace-nowrap text-stone-300 hover:text-amber-400 transition-colors uppercase tracking-wider text-xs font-semibold cursor-pointer"
            >
              {t.navCollections}
            </button>
            <button
              onClick={() => handleGenderFilter('men')}
              className="whitespace-nowrap text-amber-300/90 hover:text-amber-400 transition-colors uppercase tracking-wider text-xs font-semibold cursor-pointer"
            >
              {t.navMen}
            </button>
            <button
              onClick={() => handleGenderFilter('women')}
              className="whitespace-nowrap text-amber-300/90 hover:text-amber-400 transition-colors uppercase tracking-wider text-xs font-semibold cursor-pointer"
            >
              {t.navWomen}
            </button>
            <button
              onClick={() => handleGenderFilter('kids')}
              className="whitespace-nowrap text-amber-300/90 hover:text-amber-400 transition-colors uppercase tracking-wider text-xs font-semibold cursor-pointer"
            >
              {t.navKids}
            </button>
            <button
              onClick={() => scrollToSection('offers')}
              className="whitespace-nowrap text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-wider text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {t.navOffers}
            </button>
            <button
              onClick={() => scrollToSection('reviews')}
              className="whitespace-nowrap text-stone-300 hover:text-amber-400 transition-colors uppercase tracking-wider text-xs font-semibold cursor-pointer"
            >
              {t.navReviews}
            </button>
            <button
              onClick={() => scrollToSection('location')}
              className="whitespace-nowrap text-stone-300 hover:text-amber-400 transition-colors uppercase tracking-wider text-xs font-semibold cursor-pointer"
            >
              {t.navLocation}
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="whitespace-nowrap text-stone-300 hover:text-amber-400 transition-colors uppercase tracking-wider text-xs font-semibold cursor-pointer"
            >
              {t.navContact}
            </button>
          </div>

          <div className="hidden 2xl:flex items-center gap-2 text-stone-400 text-xs shrink-0 whitespace-nowrap">
            <span className="font-serif-luxury italic text-amber-400/90">
              {t.brandTagline}
            </span>
          </div>
        </div>
      </nav>

      {/* 4. Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-stone-950/98 border-t border-amber-900/40 px-4 py-5 space-y-3 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-stone-800">
            <button
              onClick={() => {
                handleGenderFilter('men');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-lg bg-stone-900 text-amber-300 font-semibold text-xs border border-amber-900/30 text-center"
            >
              {t.navMen}
            </button>
            <button
              onClick={() => {
                handleGenderFilter('women');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-lg bg-stone-900 text-amber-300 font-semibold text-xs border border-amber-900/30 text-center"
            >
              {t.navWomen}
            </button>
            <button
              onClick={() => {
                handleGenderFilter('kids');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-lg bg-stone-900 text-amber-300 font-semibold text-xs border border-amber-900/30 text-center"
            >
              {t.navKids}
            </button>
            <button
              onClick={() => {
                scrollToSection('offers');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-lg bg-amber-950/40 text-amber-400 font-semibold text-xs border border-amber-500/40 text-center"
            >
              {t.navOffers}
            </button>
          </div>

          <div className="flex flex-col space-y-2 text-sm">
            <button
              onClick={() => scrollToSection('catalog')}
              className="text-left py-1.5 text-stone-300 hover:text-amber-400"
            >
              {t.productsTitle}
            </button>
            <button
              onClick={() => scrollToSection('reviews')}
              className="text-left py-1.5 text-stone-300 hover:text-amber-400"
            >
              {t.navReviews}
            </button>
            <button
              onClick={() => scrollToSection('location')}
              className="text-left py-1.5 text-stone-300 hover:text-amber-400"
            >
              {t.navLocation} (Khudadad Market Kotli)
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-left py-1.5 text-stone-300 hover:text-amber-400"
            >
              {t.navContact}
            </button>
            <button
              onClick={() => {
                setIsAdminOpen(true);
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 font-semibold flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <img
                  src={avatarSrc}
                  alt={adminProfile.name}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarFailed(true)}
                  className="w-5 h-5 rounded-full object-cover border border-amber-400"
                />
                <span>Admin Awais Malik (اویس ملک)</span>
              </div>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </button>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setIsLogoModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-1.5 px-3 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 hover:text-amber-300 text-xs font-medium flex items-center justify-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5 text-amber-400" />
                <span>Upgrade Logo</span>
              </button>
              <div className="flex-1">
                <ThemeSelector variant="compact" className="w-full" />
              </div>
            </div>

            {/* Global Currency & Converter */}
            <div className="pt-2">
              <CurrencySelector variant="mobile" />
            </div>
          </div>

          <div className="pt-3 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2">
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-emerald-400 text-xs font-semibold"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp: 03425984394</span>
            </a>
            <div className="flex items-center gap-2">
              <PWAInstallButton compact />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                aria-label="Mobile Language Selector"
                className="px-2.5 py-1 rounded bg-stone-900 border border-amber-500/30 text-amber-300 text-xs font-bold"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.nativeName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
