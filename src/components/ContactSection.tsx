import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
  CheckCircle,
  Share2,
  Crown,
  UserCheck,
} from 'lucide-react';
import { sanitizePhoneForWhatsApp } from '../utils/logic';

export const ContactSection: React.FC = () => {
  const { lang, t, shopProfile, adminProfile } = useShop();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const waNumber = sanitizePhoneForWhatsApp(shopProfile.whatsapp || '03425984394');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    // Build WhatsApp direct message link
    const text = 
`*🌟 SITARA CLOTH HOUSE - WEBSITE INQUIRY 🌟*
----------------------------------------
*Name:* ${name}
*Phone:* ${phone || 'Not provided'}
*Message / Fabric Request:* ${message}
----------------------------------------
Sent from Sitara Cloth House Online Portal.`;

    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');

    setSubmitted(true);
    setTimeout(() => {
      setName('');
      setPhone('');
      setMessage('');
      setSubmitted(false);
    }, 4000);
  };

  return (
    <section id="contact" className="py-14 bg-stone-900/60 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'ur' ? 'ہمیشہ آپ کے ساتھ' : 'CLIENT CONCIERGE'}</span>
          </div>
          <h2 className="font-serif-luxury text-2xl sm:text-4xl font-bold text-stone-100">
            {t.contactTitle}
          </h2>
          <p className="text-stone-400 text-sm mt-1">{t.contactSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Business Info Column */}
          <div className="lg:col-span-5 space-y-6 bg-stone-950 p-6 sm:p-8 rounded-3xl border border-stone-800">
            <div className="space-y-4">
              <h3 className="font-serif-luxury text-xl font-bold text-amber-300">
                {lang === 'ur' ? 'ستارہ کلاٹھ ہاؤس کوٹلی' : 'Sitara Cloth House - Kotli'}
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
                {lang === 'ur'
                  ? 'خدام داد مارکیٹ مین بازار کوٹلی میں واقع۔ خالص بوسکی، کرنڈی، شفون، اور فیملی ملبوسات کے لیے تشریف لائیں یا گھر بیٹھے واٹس ایپ پر آرڈر کریں۔'
                  : 'Located in Khudadad Market, Main Bazaar, Kotli, Azad Kashmir. Visit our prime showroom or order genuine luxury fabrics with doorstep delivery.'}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {/* Store Owner & Proprietor with Official Portrait */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-stone-900/90 to-amber-950/20 border border-amber-500/40 shadow-md">
                <div className="relative shrink-0">
                  <img
                    src={adminProfile.avatar}
                    alt={shopProfile.ownerName || 'Awais Malik'}
                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-amber-400 shadow-xl ring-2 ring-amber-400/20"
                  />
                  <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-500 text-black shadow-md">
                    <Crown className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xs flex-1">
                  <span className="text-amber-400 block font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span>{lang === 'ur' ? 'مالک و چیف ایگزیکٹو' : 'Store Owner & Admin'}</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30">
                      Verified
                    </span>
                  </span>
                  <span className="text-stone-100 font-bold text-sm sm:text-base block">
                    {shopProfile.ownerName || 'Awais Malik'}
                    <span className="text-amber-300/90 font-normal ml-2 font-urdu">({shopProfile.ownerNameUrdu || 'اویس ملک'})</span>
                  </span>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {lang === 'ur'
                      ? 'پروپرائیٹر و چیف ایگزیکٹو • ستارہ کلاٹھ ہاؤس کوٹلی'
                      : 'Proprietor & Chief Executive • Sitara Cloth House Kotli'}
                  </p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-900/80 border border-stone-800">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="text-stone-400 block font-semibold">{t.shopAddressLabel}</span>
                  <span className="text-stone-200">
                    {lang === 'ur' ? shopProfile.addressUrdu : shopProfile.address}, {shopProfile.city}, {shopProfile.region}, {shopProfile.country}
                  </span>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-900/80 border border-stone-800">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="text-stone-400 block font-semibold">{t.callUs}</span>
                  <a href={`tel:${shopProfile.phone}`} className="text-amber-300 font-mono font-bold hover:underline">
                    {shopProfile.phone}
                  </a>
                </div>
              </div>

              {/* WhatsApp Direct */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-900/80 border border-emerald-900/40">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="text-stone-400 block font-semibold">WhatsApp Direct Order & Inquiry</span>
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 font-mono font-bold hover:underline"
                  >
                    +92 342 5984394 (Click to Chat)
                  </a>
                </div>
              </div>
            </div>

            {/* Social Media Integration */}
            <div className="pt-4 border-t border-stone-800 space-y-2">
              <span className="text-xs font-semibold text-stone-400 block">Follow Us on Social Media:</span>
              <div className="flex items-center gap-3">
                <a
                  href={shopProfile.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-blue-950/60 border border-blue-600/30 text-blue-300 hover:bg-blue-900/60 text-xs font-bold transition-all flex items-center gap-2"
                >
                  <span>Facebook</span>
                </a>
                <a
                  href={shopProfile.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-pink-950/60 border border-pink-600/30 text-pink-300 hover:bg-pink-900/60 text-xs font-bold transition-all flex items-center gap-2"
                >
                  <span>Instagram</span>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Inquiry Form */}
          <div className="lg:col-span-7 bg-stone-950 p-6 sm:p-8 rounded-3xl border border-stone-800 shadow-xl">
            <h3 className="font-serif-luxury text-xl font-bold text-stone-100 mb-2">
              {lang === 'ur' ? 'آن لائن پیغام یا پوچھ گچھ بھیجیں' : 'Send Direct Message to Shopkeeper'}
            </h3>
            <p className="text-stone-400 text-xs mb-6">
              {lang === 'ur'
                ? 'کسی بھی کپڑے کی دستیابی، ریٹ یا شادی کی بکنگ کے بارے میں لکھیں۔ یہ پیغام فوری ہمارے واٹس ایپ پر موصول ہو جائے گا۔'
                : 'Need custom suit cuts, bridal fabric consultation or bulk orders? Send a message directly to our WhatsApp concierge.'}
            </p>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-stone-100 text-sm">Message Sent!</h4>
                <p className="text-xs text-stone-300">
                  Opening WhatsApp to chat with Sitara Cloth House team (03425984394).
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      {t.fullName} *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Khurram Shahzad"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      {t.phoneNum}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 03425984394"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Your Message / Desired Fabric *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t.messagePlaceholder}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 font-bold text-xs sm:text-sm tracking-wide hover:brightness-110 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{t.sendMessage}</span>
                  </button>

                  <a
                    href={`https://wa.me/${waNumber}?text=${encodeURIComponent('Assalam-o-Alaikum Sitara Cloth House, I want to chat with you directly regarding fabrics.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{t.sendWhatsAppDirect}</span>
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
