import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Tag, Sparkles, Check, Gift, Truck } from 'lucide-react';

export const PromoOffers: React.FC = () => {
  const { lang, t } = useShop();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const offers = [
    {
      code: 'SITARA15',
      title: lang === 'ur' ? 'کوٹلی خوش آمدید ڈسکاؤنٹ' : 'Kotli Welcome Discount',
      discount: '15% OFF',
      minSpend: 'Rs. 3,000',
      description: lang === 'ur' ? 'تمام ان سلے اور فینسی سوٹس پر 15 فیصد فوری رعایت' : '15% instant savings on unstitched and festive suits.',
      highlight: true,
    },
    {
      code: 'EID20',
      title: lang === 'ur' ? 'شادی و تہوار اسپیشل آفر' : 'Wedding & Festive Special',
      discount: '20% OFF',
      minSpend: 'Rs. 6,000',
      description: lang === 'ur' ? 'بوسکی، کرنڈی اور برائیڈل ویلوٹ کلیکشن پر شاندار بچت' : 'Exclusive 20% OFF on Boski, Karandi & Bridal Velvet.',
      highlight: false,
    },
    {
      code: 'KOTLIFREE',
      title: lang === 'ur' ? 'مفت ہوم ڈلیوری سہولت' : 'Free Home Delivery',
      discount: 'FREE SHIP',
      minSpend: 'Rs. 4,500',
      description: lang === 'ur' ? 'آزاد کشمیر اور پورے پاکستان میں مفت کیش آن ڈلیوری' : 'Free Cash on Delivery across Kotli, AJK and all Pakistan.',
      highlight: false,
    },
  ];

  return (
    <section id="offers" className="py-10 bg-stone-900/60 border-y border-amber-900/20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'ur' ? 'خصوصی بچت و ڈسکاؤنٹس' : 'PROMOTIONAL VOUCHERS'}</span>
            </div>
            <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-stone-100">
              {t.offerTitle}
            </h2>
            <p className="text-stone-400 text-sm mt-1 max-w-xl">
              {t.offerSubtitle}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {offers.map((offer) => (
            <div
              key={offer.code}
              className={`relative rounded-2xl p-5 border transition-all ${
                offer.highlight
                  ? 'bg-gradient-to-br from-amber-950/40 via-stone-900 to-stone-950 border-amber-500/50 shadow-lg shadow-amber-500/10'
                  : 'bg-stone-950/80 border-stone-800 hover:border-amber-900/40'
              }`}
            >
              {offer.highlight && (
                <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Most Popular</span>
                </div>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <span className="text-2xl sm:text-3xl font-black font-serif-luxury gold-gradient-text">
                    {offer.discount}
                  </span>
                  <p className="text-xs text-stone-400 mt-0.5">Min. Order: {offer.minSpend}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-900 border border-amber-900/40 text-amber-400">
                  {offer.code === 'KOTLIFREE' ? <Truck className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
                </div>
              </div>

              <div className="mt-3">
                <h3 className="font-bold text-stone-200 text-sm">{offer.title}</h3>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">{offer.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between">
                <div className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-stone-900 border border-amber-500/30 text-amber-300">
                  {offer.code}
                </div>
                <button
                  onClick={() => handleCopy(offer.code)}
                  className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center gap-1 transition-all"
                >
                  {copiedCode === offer.code ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">{t.codeCopied}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t.copyCode}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
