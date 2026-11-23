import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { BannerCollection, BannerItem } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Sparkles,
  ShoppingBag,
  MessageCircle,
  ArrowRight,
  Phone,
  ShieldCheck,
  Award,
  Truck,
  Tag,
  Clock,
  Settings,
  Crown,
  ExternalLink,
} from 'lucide-react';
import { sanitizePhoneForWhatsApp } from '../utils/logic';

export const LuxuryBannerSlider: React.FC = () => {
  const {
    lang,
    t,
    banners,
    sliderSettings,
    products,
    setSelectedProduct,
    setFilters,
    shopProfile,
    setIsAdminOpen,
  } = useShop();

  // Active collection filter tab for slider
  const [selectedCollection, setSelectedCollection] = useState<BannerCollection>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [progressKey, setProgressKey] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const waNumber = sanitizePhoneForWhatsApp(shopProfile.whatsapp || '03425984394');

  // Filter banners based on active status, scheduling, and collection filter
  const todayStr = new Date().toISOString().split('T')[0];

  const activeBanners = useMemo(() => {
    // 1. Filter by active & schedule
    const validBanners = banners.filter((b) => {
      if (!b.isActive) return false;
      if (b.startDate && b.startDate > todayStr) return false;
      if (b.expiryDate && b.expiryDate < todayStr) return false;
      return true;
    });

    // 2. Filter by selected category tab if not 'all'
    if (selectedCollection === 'all') {
      return validBanners.length > 0 ? validBanners : banners;
    }

    const filtered = validBanners.filter(
      (b) => b.categoryTarget === selectedCollection || b.categoryTarget === 'all'
    );
    return filtered.length > 0 ? filtered : validBanners;
  }, [banners, selectedCollection, todayStr]);

  // Reset index if out of range
  useEffect(() => {
    if (currentIndex >= activeBanners.length) {
      setCurrentIndex(0);
    }
  }, [activeBanners.length, currentIndex]);

  // Slideshow timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (sliderSettings.autoPlay && !isPaused && activeBanners.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
        setProgressKey((prev) => prev + 1);
      }, sliderSettings.slideInterval || 5000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sliderSettings.autoPlay, sliderSettings.slideInterval, isPaused, activeBanners.length, currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    setProgressKey((prev) => prev + 1);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
    setProgressKey((prev) => prev + 1);
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext(); // Swiped left -> next slide
      } else {
        handlePrev(); // Swiped right -> prev slide
      }
    }
    setTouchStartX(null);
  };

  // Button Action Handler
  const handleBannerAction = (action: BannerItem['primaryButtonAction'], banner: BannerItem) => {
    if (action === 'product' && banner.linkedProductId) {
      const prod = products.find((p) => p.id === banner.linkedProductId);
      if (prod) {
        setSelectedProduct(prod);
        return;
      }
    }

    if (action === 'category' || action === 'shop') {
      if (banner.categoryTarget === 'men') {
        setFilters((prev) => ({ ...prev, gender: 'men', category: banner.fabricCategory || 'all' }));
      } else if (banner.categoryTarget === 'women') {
        setFilters((prev) => ({ ...prev, gender: 'women', category: banner.fabricCategory || 'all' }));
      } else if (banner.categoryTarget === 'kids') {
        setFilters((prev) => ({ ...prev, gender: 'kids' }));
      } else if (banner.categoryTarget === 'unstitched') {
        setFilters((prev) => ({ ...prev, category: banner.fabricCategory || 'all' }));
      }

      const catalogEl = document.getElementById('catalog');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (action === 'contact') {
      const contactEl = document.getElementById('contact');
      if (contactEl) {
        contactEl.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (action === 'whatsapp') {
      const text = `Assalam-o-Alaikum Sitara Cloth House Kotli! I am interested in: "${banner.title}" from your website banner. Please share fabric details and delivery availability.`;
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank');
      return;
    }
  };

  const handleSecondaryAction = (action: BannerItem['secondaryButtonAction'], banner: BannerItem) => {
    if (!action) return;

    if (action === 'whatsapp') {
      const text = `Assalam-o-Alaikum Sitara Cloth House! Inquiring about ${banner.title} (Kotli Main Bazaar showroom).`;
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank');
      return;
    }

    if (action === 'contact') {
      const contactEl = document.getElementById('contact');
      if (contactEl) contactEl.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (action === 'location') {
      const locEl = document.getElementById('location');
      if (locEl) locEl.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (action === 'reviews') {
      const revEl = document.getElementById('reviews');
      if (revEl) revEl.scrollIntoView({ behavior: 'smooth' });
      return;
    }
  };

  const currentBanner = activeBanners[currentIndex] || banners[0];

  return (
    <div
      id="hero"
      className="relative overflow-hidden bg-stone-950 border-b border-amber-900/30 select-none"
      onMouseEnter={() => sliderSettings.pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => sliderSettings.pauseOnHover && setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. Category Quick-Filter Navigation Bar (Above/Within Banner) */}
      {sliderSettings.showCollectionFilterTabs && (
        <div className="bg-stone-950/90 border-b border-stone-800/80 px-4 py-2 z-20 relative">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto scrollbar-none text-xs">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider hidden sm:inline mr-1">
                {lang === 'ur' ? 'کلیکشنز:' : 'Collections:'}
              </span>
              {[
                { id: 'all', label: 'All Collections', labelUrdu: 'تمام کلیکشنز' },
                { id: 'men', label: "Men's Regal Boski", labelUrdu: 'مردانہ بوسکی و کرنڈی' },
                { id: 'women', label: "Women's Couture", labelUrdu: 'زنانه شفون و لان' },
                { id: 'kids', label: "Kids' Festive", labelUrdu: 'بچوں کے ملبوسات' },
                { id: 'unstitched', label: 'Unstitched Fabrics', labelUrdu: 'ان اسٹچڈ تھان' },
              ].map((tab) => {
                const isActive = selectedCollection === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSelectedCollection(tab.id as BannerCollection);
                      setCurrentIndex(0);
                      setProgressKey((prev) => prev + 1);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20 font-bold'
                        : 'text-stone-300 hover:text-amber-300 hover:bg-stone-900 bg-stone-900/50 border border-stone-800'
                    }`}
                  >
                    {lang === 'ur' ? tab.labelUrdu : tab.label}
                  </button>
                );
              })}
            </div>

            {/* Quick Admin Shortcut & Slide Counter */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono text-stone-400">
                <span className="text-amber-400 font-bold">{currentIndex + 1}</span> / {activeBanners.length}
              </span>
              <button
                onClick={() => setIsAdminOpen(true)}
                className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 border border-amber-500/30 text-amber-300 text-[11px] hover:bg-amber-500/10 transition-colors"
                title="Manage Banners in Admin Dashboard"
              >
                <Settings className="w-3 h-3 text-amber-400" />
                <span>{lang === 'ur' ? 'بینرز مینیجر' : 'Manage Banners'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Full-Width Hero Slider Stage */}
      <div className="relative w-full h-[540px] sm:h-[600px] lg:h-[680px]">
        {activeBanners.map((banner, idx) => {
          const isCurrent = idx === currentIndex;
          const overlayOpacity = banner.overlayDarkness ?? 0.55;

          return (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isCurrent ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Background Picture with Zoom/Ken-Burns Effect on active */}
              <div
                className={`absolute inset-0 bg-cover bg-center transition-transform duration-7000 ease-out ${
                  isCurrent ? 'scale-105' : 'scale-100'
                }`}
                style={{
                  backgroundImage: `url('${banner.imageUrl}')`,
                }}
              />

              {/* Luxury Gradient Dark Overlays */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/80 to-transparent"
                style={{ opacity: overlayOpacity }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950/60 pointer-events-none" />

              {/* Slide Content Box */}
              <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 pb-10 sm:pb-0 flex items-center">
                <div
                  className={`max-w-2xl sm:max-w-3xl space-y-4 sm:space-y-6 text-left transition-all duration-700 ${
                    banner.textAlignment === 'center'
                      ? 'mx-auto text-center'
                      : banner.textAlignment === 'right'
                      ? 'ml-auto text-right'
                      : ''
                  } ${isCurrent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                >
                  {/* Badge & Owner Origin Tag */}
                  <div className="flex flex-wrap items-center gap-2">
                    {banner.badgeText && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          banner.badgeType === 'sale'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : banner.badgeType === 'luxury'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                            : banner.badgeType === 'festive'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{lang === 'ur' ? banner.badgeUrdu || banner.badgeText : banner.badgeText}</span>
                      </span>
                    )}

                    <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/80 border border-amber-900/40 text-amber-200/90 text-xs font-semibold">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>{lang === 'ur' ? 'مالک: اویس ملک • کوٹلی' : 'Owner: Awais Malik • Kotli'}</span>
                    </span>
                  </div>

                  {/* Main Headline */}
                  <h1 className="font-serif-luxury text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
                    {lang === 'ur' ? banner.titleUrdu || banner.title : banner.title}
                  </h1>

                  {/* Subtitle */}
                  <p className="text-amber-300/90 text-sm sm:text-lg lg:text-xl font-medium tracking-wide">
                    {lang === 'ur' ? banner.subtitleUrdu || banner.subtitle : banner.subtitle}
                  </p>

                  {/* Rich Description */}
                  {(banner.description || banner.descriptionUrdu) && (
                    <p className="text-stone-300 text-xs sm:text-sm lg:text-base leading-relaxed line-clamp-3 sm:line-clamp-none max-w-2xl font-light">
                      {lang === 'ur'
                        ? banner.descriptionUrdu || banner.description
                        : banner.description}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
                    {/* Primary Button */}
                    <button
                      onClick={() => handleBannerAction(banner.primaryButtonAction, banner)}
                      className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 font-bold text-xs sm:text-sm tracking-wider uppercase hover:brightness-110 shadow-xl shadow-amber-500/25 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>
                        {lang === 'ur'
                          ? banner.primaryButtonTextUrdu || banner.primaryButtonText
                          : banner.primaryButtonText}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {/* Secondary WhatsApp Button */}
                    {banner.secondaryButtonText && (
                      <button
                        onClick={() => handleSecondaryAction(banner.secondaryButtonAction, banner)}
                        className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80 font-bold text-xs sm:text-sm tracking-wide flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-400" />
                        <span>
                          {lang === 'ur'
                            ? banner.secondaryButtonTextUrdu || banner.secondaryButtonText
                            : banner.secondaryButtonText}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Special Offer Code Tag */}
                  {banner.discountPercent && (
                    <div className="inline-flex items-center gap-2 pt-1 text-xs text-amber-200/90 font-medium">
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {lang === 'ur'
                          ? `خصوصی رعایت ${banner.discountPercent}٪ • کوڈ: SITARA15`
                          : `Special Discount ${banner.discountPercent}% OFF • Promo Code: SITARA15`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* 3. Luxury Navigation Arrows (Desktop/Tablet) */}
        {sliderSettings.showArrows && activeBanners.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="hidden sm:flex absolute left-6 top-1/2 -translate-y-1/2 z-20 w-13 h-13 rounded-full bg-stone-950/70 border border-amber-500/40 hover:border-amber-400 hover:bg-amber-500 hover:text-stone-950 text-amber-300 items-center justify-center transition-all shadow-xl backdrop-blur-sm cursor-pointer active:scale-90"
              aria-label="Previous Slide"
              title="Previous Banner"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="hidden sm:flex absolute right-6 top-1/2 -translate-y-1/2 z-20 w-13 h-13 rounded-full bg-stone-950/70 border border-amber-500/40 hover:border-amber-400 hover:bg-amber-500 hover:text-stone-950 text-amber-300 items-center justify-center transition-all shadow-xl backdrop-blur-sm cursor-pointer active:scale-90"
              aria-label="Next Slide"
              title="Next Banner"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* 4. Bottom Controls: Indicators, Mobile Arrows, Play/Pause, Progress Bar */}
        <div className="absolute bottom-5 sm:bottom-8 left-0 right-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Progress / Dot Indicators */}
          {sliderSettings.showIndicators && (
            <div className="flex items-center gap-2">
              {activeBanners.map((b, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setProgressKey((prev) => prev + 1);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'w-8 sm:w-10 bg-amber-400 shadow-sm shadow-amber-400/50'
                        : 'w-2 sm:w-2.5 bg-stone-600/70 hover:bg-stone-400'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                );
              })}
            </div>
          )}

          {/* Mobile Prev/Next + Autoplay Pause / Play Toggle */}
          <div className="flex items-center gap-2">
            {sliderSettings.showArrows && activeBanners.length > 1 && (
              <div className="flex sm:hidden items-center gap-1.5">
                <button
                  onClick={handlePrev}
                  className="w-8 h-8 rounded-full bg-stone-950/80 border border-amber-500/40 text-amber-300 flex items-center justify-center active:scale-90 transition-all"
                  aria-label="Previous Slide"
                  title="Previous Banner"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="w-8 h-8 rounded-full bg-stone-950/80 border border-amber-500/40 text-amber-300 flex items-center justify-center active:scale-90 transition-all"
                  aria-label="Next Slide"
                  title="Next Banner"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-2.5 py-1.5 rounded-full bg-stone-950/70 border border-stone-800 text-stone-300 hover:text-amber-400 text-xs flex items-center gap-1.5 backdrop-blur-sm transition-all"
              title={isPaused ? 'Resume Automatic Slideshow' : 'Pause Slideshow'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-amber-400" /> : <Pause className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline font-mono text-[10px]">
                {isPaused ? 'Paused' : `${(sliderSettings.slideInterval || 5000) / 1000}s`}
              </span>
            </button>
          </div>
        </div>

        {/* 5. Animated Countdown Progress Line (Top or Bottom of slide) */}
        {!isPaused && sliderSettings.autoPlay && activeBanners.length > 1 && (
          <div
            key={progressKey}
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600 z-30 opacity-80 transition-all"
            style={{
              animation: `slideProgress ${sliderSettings.slideInterval || 5000}ms linear forwards`,
            }}
          />
        )}
      </div>

      {/* 6. High-Trust Store Feature Bar below slider */}
      <div className="bg-stone-900/90 border-t border-stone-800 py-3.5 px-4 text-xs text-stone-300">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-stone-100">{lang === 'ur' ? '100% اصلی بوسکی و کرنڈی' : '100% Genuine Fabrics'}</p>
              <p className="text-[11px] text-stone-400">{lang === 'ur' ? 'اصلی چینی ریشم 8 پاؤنڈ' : 'Authentic 8-Pound Silk'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-stone-100">{lang === 'ur' ? 'کیش آن ڈلیوری' : 'Cash on Delivery'}</p>
              <p className="text-[11px] text-stone-400">{lang === 'ur' ? 'کوٹلی، کشمیر اور پاکستان' : 'Kotli & All Pakistan'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-stone-100">{lang === 'ur' ? 'خدام داد مارکیٹ مین بازار' : 'Physical Landmark Store'}</p>
              <p className="text-[11px] text-stone-400">{lang === 'ur' ? 'کوٹلی آزاد کشمیر' : 'Main Bazaar Kotli'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-stone-100">{lang === 'ur' ? 'اویس ملک (مالک)' : 'Prop. Awais Malik'}</p>
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                <MessageCircle className="w-3 h-3" />
                <span>03425984394</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
