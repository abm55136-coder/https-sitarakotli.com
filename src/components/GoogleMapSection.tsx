import React from 'react';
import { useShop } from '../context/ShopContext';
import { MapPin, Navigation, Clock, Phone, MessageCircle, Sparkles, ExternalLink } from 'lucide-react';
import { sanitizePhoneForWhatsApp } from '../utils/logic';

export const GoogleMapSection: React.FC = () => {
  const { lang, t, shopProfile } = useShop();

  const waNumber = sanitizePhoneForWhatsApp(shopProfile.whatsapp || '03425984394');
  const googleMapsDirectionsUrl = 'https://www.google.com/maps/dir/?api=1&destination=Khudadad+Market+Main+Bazaar+Kotli+Azad+Kashmir';

  return (
    <section id="location" className="py-14 bg-stone-950 border-t border-amber-900/30">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'ur' ? 'دکان کا پتہ اور لوکیشن' : 'PHYSICAL SHOWROOM'}</span>
          </div>
          <h2 className="font-serif-luxury text-2xl sm:text-4xl font-bold text-stone-100">
            {t.locationTitle}
          </h2>
          <p className="text-stone-400 text-sm mt-1">{t.locationSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Showroom Details Column */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6 bg-stone-900/80 rounded-3xl p-6 sm:p-8 border border-amber-500/30 shadow-xl">
            <div className="space-y-5">
              {/* Address Highlight */}
              <div className="space-y-1.5">
                <span className="text-xs uppercase tracking-wider text-amber-400 font-bold">
                  {t.shopAddressLabel}
                </span>
                <h3 className="font-serif-luxury text-lg sm:text-xl font-bold text-stone-100 leading-snug">
                  {lang === 'ur' ? shopProfile.addressUrdu : shopProfile.address}
                </h3>
                <p className="text-xs text-amber-200/90 font-medium">
                  {shopProfile.market}, {shopProfile.city}, {shopProfile.region}, {shopProfile.country}
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-xs text-stone-300">
                  <span className="text-amber-400 font-semibold">{lang === 'ur' ? 'مالک / پروپرائیٹر:' : 'Proprietor & Owner:'}</span>
                  <span className="font-bold text-stone-100">{shopProfile.ownerName || 'Awais Malik'}</span>
                  <span className="text-amber-300/80">({shopProfile.ownerNameUrdu || 'اویس ملک'})</span>
                </div>
              </div>

              {/* Opening Hours Card */}
              <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>{t.openingHoursLabel}</span>
                </div>
                <div className="space-y-1 text-xs text-stone-300">
                  <p className="flex justify-between">
                    <span className="text-stone-400">Sat – Thu:</span>
                    <span className="font-semibold">{shopProfile.openingHours}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-stone-400">Friday:</span>
                    <span className="font-semibold text-amber-400">{shopProfile.fridayHours}</span>
                  </p>
                </div>
              </div>

              {/* Direct Phone & WhatsApp */}
              <div className="space-y-2 text-xs text-stone-300">
                <span className="text-stone-400 block font-semibold">{t.phoneLabel}</span>
                <div className="flex items-center gap-3">
                  <a
                    href={`tel:${shopProfile.phone}`}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-stone-950 border border-stone-700 hover:border-amber-400 text-stone-100 flex items-center justify-center gap-2 font-mono text-xs transition-all"
                  >
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>{shopProfile.phone}</span>
                  </a>
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 flex items-center justify-center gap-2 text-xs font-semibold transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Google Maps Directions Button */}
            <div className="pt-4 border-t border-stone-800">
              <a
                href={googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 font-bold text-xs sm:text-sm tracking-wide hover:brightness-110 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Navigation className="w-4 h-4" />
                <span>{t.getDirectionsBtn}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Interactive Google Map Embed */}
          <div className="lg:col-span-7 rounded-3xl overflow-hidden border border-stone-800 shadow-2xl relative min-h-[350px] lg:min-h-full bg-stone-900">
            {/* Embedded Google Map pointing to Kotli Azad Kashmir Main Bazaar */}
            <iframe
              title="Sitara Cloth House Kotli Map Location"
              src="https://maps.google.com/maps?q=Khudadad%20Market%20Main%20Bazaar%20Kotli%20Azad%20Kashmir&t=&z=15&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full min-h-[360px] lg:min-h-full border-0 filter grayscale-20 contrast-110"
              loading="lazy"
              allowFullScreen
            />

            {/* Custom Floating Pin Badge */}
            <div className="absolute top-4 left-4 z-10 p-3 rounded-2xl bg-stone-950/90 backdrop-blur-md border border-amber-500/40 shadow-xl max-w-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                <span className="font-serif-luxury font-bold text-xs text-amber-200">
                  Sitara Cloth House (ستارہ کلاٹھ ہاؤس)
                </span>
              </div>
              <p className="text-[11px] text-stone-300 mt-1">
                Khudadad Market, Main Bazaar, Kotli, AJK.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
