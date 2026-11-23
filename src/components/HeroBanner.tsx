import React from 'react';
import { useShop } from '../context/ShopContext';
import { Sparkles, MessageCircle, ArrowRight, ShieldCheck, Truck, Award, MapPin } from 'lucide-react';
import { sanitizePhoneForWhatsApp } from '../utils/logic';
import khaddarWinterImg from '../assets/images/khaddar_winter_men_1794817841379.jpg';
import silkChiffonImg from '../assets/images/silk_chiffon_editorial_1794817841980.jpg';

export const HeroBanner: React.FC = () => {
  const { lang, t, shopProfile, setFilters } = useShop();

  const waNumber = sanitizePhoneForWhatsApp(shopProfile.whatsapp || '03425984394');

  const scrollToCatalog = () => {
    const el = document.getElementById('catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToLocation = () => {
    const el = document.getElementById('location');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div id="hero" className="relative overflow-hidden bg-stone-950 border-b border-amber-900/30">
      {/* Background Gradient & Subtle Grid Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/30 via-stone-950/80 to-stone-950 pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-15 bg-cover bg-center pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url(${khaddarWinterImg})`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 py-12 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Main Hero Copy */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Crest & Origin Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.heroBadge}</span>
              <span className="hidden sm:inline text-amber-600">•</span>
              <span className="hidden sm:inline text-amber-300/90 font-bold tracking-normal">{lang === 'ur' ? 'مالک: اویس ملک' : 'OWNER: AWAIS MALIK'}</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif-luxury text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-100 leading-tight">
              <span>{t.heroTitlePrefix}</span>{' '}
              <span className="gold-gradient-text block sm:inline">
                {t.heroTitleHighlight}
              </span>
            </h1>

            {/* Subtitle with address and fabric variety */}
            <p className="text-stone-300 text-sm sm:text-base lg:text-lg max-w-2xl leading-relaxed mx-auto lg:mx-0 font-light">
              {t.heroSubtitle}
            </p>

            {/* Slogan Banner */}
            <div className="py-2 px-4 rounded-xl bg-stone-900/80 border border-amber-900/40 inline-flex items-center gap-2 text-xs sm:text-sm text-amber-200/90 font-serif-luxury italic">
              <Award className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{lang === 'ur' ? shopProfile.sloganUrdu : shopProfile.slogan}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <button
                onClick={scrollToCatalog}
                className="px-6 py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 font-bold text-sm tracking-wide hover:brightness-110 shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>{t.exploreBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent('Assalam-o-Alaikum Sitara Cloth House, I want to inquire about your luxury fabrics in Kotli showroom.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-full bg-emerald-900/30 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/50 font-bold text-sm tracking-wide flex items-center gap-2 transition-all shadow-sm"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>{t.directWhatsAppBtn}</span>
              </a>

              <button
                onClick={scrollToLocation}
                className="px-5 py-3.5 rounded-full bg-stone-900/80 border border-stone-800 text-stone-300 hover:text-amber-300 hover:border-amber-700/50 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>{t.visitShopBtn}</span>
              </button>
            </div>

            {/* Trust Badges Strip */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-stone-800/80 text-left">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-stone-200">100% Pure</p>
                  <p className="text-[10px] text-stone-400">Boski & Karandi</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-stone-200">Cash on Delivery</p>
                  <p className="text-[10px] text-stone-400">All Pakistan & AJK</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-stone-200">Kotli Landmark</p>
                  <p className="text-[10px] text-stone-400">Main Bazaar</p>
                </div>
              </div>
            </div>
          </div>

          {/* Luxury Visual Showcase Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm sm:max-w-md">
              {/* Outer Glow & Border */}
              <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-amber-500/30 via-yellow-600/20 to-amber-900/40 blur-lg opacity-70" />

              <div className="relative rounded-2xl overflow-hidden bg-stone-900 border border-amber-500/40 shadow-2xl">
                {/* Visual Header */}
                <div className="relative h-72 sm:h-80 overflow-hidden">
                  <img
                    src={silkChiffonImg}
                    alt="Sitara Cloth House Luxury Fabric Collection"
                    className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

                  {/* Corner Badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-stone-950/80 backdrop-blur-md border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>8-Pound Pure Boski</span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-stone-100">
                    <p className="text-xs font-serif-luxury text-amber-400 tracking-wider uppercase">
                      Signature Unstitched Fabric
                    </p>
                    <h3 className="font-serif-luxury text-lg sm:text-xl font-bold">
                      Royal Chinese Silk & Kashmiri Karandi
                    </h3>
                  </div>
                </div>

                {/* Card Details & Quick Filter Triggers */}
                <div className="p-4 bg-stone-950/90 space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-400 pb-2 border-b border-stone-800">
                    <span>📍 Khudadad Market, Kotli</span>
                    <span className="text-emerald-400 font-medium">● Showroom Open Today</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <button
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, gender: 'men' }));
                        scrollToCatalog();
                      }}
                      className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 text-stone-200 transition-all"
                    >
                      <p className="font-bold text-amber-300">Men</p>
                      <p className="text-[10px] text-stone-400">Boski & Karandi</p>
                    </button>
                    <button
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, gender: 'women' }));
                        scrollToCatalog();
                      }}
                      className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 text-stone-200 transition-all"
                    >
                      <p className="font-bold text-amber-300">Women</p>
                      <p className="text-[10px] text-stone-400">Lawn & Chiffon</p>
                    </button>
                    <button
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, gender: 'kids' }));
                        scrollToCatalog();
                      }}
                      className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 text-stone-200 transition-all"
                    >
                      <p className="font-bold text-amber-300">Kids</p>
                      <p className="text-[10px] text-stone-400">Festive Sets</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
