import React from 'react';
import { useShop } from '../context/ShopContext';
import { Sparkles, MapPin, Phone, Mail, MessageCircle, Heart, ShieldCheck, Globe } from 'lucide-react';
import { sanitizePhoneForWhatsApp } from '../utils/logic';

import { BrandLogo } from './BrandLogo';

export const Footer: React.FC = () => {
  const { lang, t, shopProfile, setFilters, setIsAdminOpen, setIsLogoModalOpen } = useShop();

  const waNumber = sanitizePhoneForWhatsApp(shopProfile.whatsapp || '03425984394');

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-stone-950 text-stone-300 border-t border-amber-900/30">
      {/* Upper Footer */}
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <BrandLogo variant="footer" showSubtext={true} showUrdu={true} onClick={() => scrollTo('hero')} />
              <button
                onClick={() => setIsLogoModalOpen(true)}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
              >
                Upgrade Logo
              </button>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
              {t.footerAbout}
            </p>

            {/* Owner & Proprietor Tag */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>{lang === 'ur' ? `مالک و چیف ایگزیکٹو: ${shopProfile.ownerNameUrdu || 'اویس ملک'}` : `Owner & Chief Executive: ${shopProfile.ownerName || 'Awais Malik'}`}</span>
            </div>

            <div className="p-3 rounded-xl bg-stone-900/80 border border-amber-900/30 text-xs text-amber-200/90 font-serif-luxury italic">
              {lang === 'ur' ? shopProfile.sloganUrdu : shopProfile.slogan}
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="lg:col-span-2 space-y-3 text-xs">
            <h4 className="font-serif-luxury font-bold text-sm text-stone-100 uppercase tracking-wider">
              {t.quickLinks}
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li>
                <button onClick={() => scrollTo('hero')} className="hover:text-amber-300 transition-colors">
                  {t.navHome}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, gender: 'men' }));
                    scrollTo('catalog');
                  }}
                  className="hover:text-amber-300 transition-colors"
                >
                  {t.navMen}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, gender: 'women' }));
                    scrollTo('catalog');
                  }}
                  className="hover:text-amber-300 transition-colors"
                >
                  {t.navWomen}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, gender: 'kids' }));
                    scrollTo('catalog');
                  }}
                  className="hover:text-amber-300 transition-colors"
                >
                  {t.navKids}
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('offers')} className="hover:text-amber-300 transition-colors">
                  {t.navOffers}
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('reviews')} className="hover:text-amber-300 transition-colors">
                  {t.navReviews}
                </button>
              </li>
            </ul>
          </div>

          {/* Fabrics Variety Column */}
          <div className="lg:col-span-2 space-y-3 text-xs">
            <h4 className="font-serif-luxury font-bold text-sm text-stone-100 uppercase tracking-wider">
              Fabrics
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li>Pure Chinese Boski</li>
              <li>Winter Kohistan Karandi</li>
              <li>Egyptian Giza Cotton</li>
              <li>Embroidered Chiffon</li>
              <li>Bridal Micro Velvet</li>
              <li>Pashmina Kashmiri Shawls</li>
            </ul>
          </div>

          {/* Store Address & Direct Line */}
          <div className="lg:col-span-3 space-y-3 text-xs">
            <h4 className="font-serif-luxury font-bold text-sm text-stone-100 uppercase tracking-wider">
              Kotli Showroom
            </h4>
            <div className="space-y-2 text-stone-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  {shopProfile.address}, {shopProfile.city}, {shopProfile.region}, {shopProfile.country}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <a href={`tel:${shopProfile.phone}`} className="font-mono text-amber-300 font-bold hover:underline">
                  {shopProfile.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <a
                  href={`https://wa.me/${waNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline font-mono"
                >
                  WhatsApp: 03425984394
                </a>
              </div>
            </div>

            <div className="pt-2 space-y-1.5">
              <button
                onClick={() => setIsAdminOpen(true)}
                className="text-[11px] text-amber-500/80 hover:text-amber-300 flex items-center gap-1.5 transition-colors font-medium"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin & Owner Portal (Awais Malik)</span>
              </button>
              <button
                onClick={() => setIsAdminOpen(true)}
                className="text-[11px] text-emerald-400/90 hover:text-emerald-300 flex items-center gap-1.5 transition-colors font-medium"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>🌐 Free Live Website & Google Indexing</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-stone-800/80 py-6 px-4 bg-stone-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <p>
            © {new Date().getFullYear()} Sitara Cloth House • Owned & Managed by <strong className="text-amber-300/90 font-semibold">{shopProfile.ownerName || 'Awais Malik'}</strong> ({shopProfile.ownerNameUrdu || 'اویس ملک'}).
          </p>
          <div className="flex items-center gap-4 text-stone-400">
            <span>Khudadad Market, Main Bazaar, Kotli, Azad Kashmir</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
