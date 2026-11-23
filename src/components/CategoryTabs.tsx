import React from 'react';
import { useShop } from '../context/ShopContext';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { FabricCategory, GenderCategory } from '../types';

import khaddarWinterImg from '../assets/images/khaddar_winter_men_1794817841379.jpg';
import silkChiffonImg from '../assets/images/silk_chiffon_editorial_1794817841980.jpg';
import linenLuxuryImg from '../assets/images/linen_luxury_women_1794817842009.jpg';

export const CategoryTabs: React.FC = () => {
  const { lang, t, setFilters } = useShop();

  const categories = [
    {
      title: lang === 'ur' ? 'مردانہ شاہی بوسکی و کھدر' : "Men's Royal Fabrics",
      subtitle: lang === 'ur' ? 'اصلی 8 پاؤنڈ چینی بوسکی، کھدر، کرنڈی و مصری لٹھا' : 'Pure 8-Pound Chinese Boski, Winter Khaddar, Karandi & Cotton',
      image: khaddarWinterImg,
      gender: 'men' as GenderCategory,
      category: 'khaddar' as FabricCategory,
      tag: lang === 'ur' ? 'سب سے زیادہ مقبول' : 'Bestseller in Kotli',
    },
    {
      title: lang === 'ur' ? 'خواتین کے عروسی و فینسی سوٹس' : "Women's Luxury Chiffon, Silk & Linen",
      subtitle: lang === 'ur' ? 'زری کڑھائی شفون، پیور سلک، ونٹر لینن و سمر لان' : 'Hand-embroidered Chiffon, Pure Silk, Luxury Linen & Swiss Lawn',
      image: silkChiffonImg,
      gender: 'women' as GenderCategory,
      category: 'chiffon' as FabricCategory,
      tag: lang === 'ur' ? 'شادی بیاہ کلیکشن' : 'Festive & Wedding',
    },
    {
      title: lang === 'ur' ? 'بچوں کے روایتی کرتے و لینن' : "Children's Festive Wear",
      subtitle: lang === 'ur' ? 'بچوں کے کرتا شلوار، واسکٹ سیٹ اور کڑھائی والے فراک' : 'Boys Kurta Shalwar, Waistcoat Sets & Girls Embroidered Suits',
      image: linenLuxuryImg,
      gender: 'kids' as GenderCategory,
      category: 'wash-wear' as FabricCategory,
      tag: lang === 'ur' ? 'عید و تقریبات' : 'Eid & Celebrations',
    },
  ];

  const handleSelect = (gender: GenderCategory, category?: FabricCategory) => {
    setFilters((prev) => ({
      ...prev,
      gender,
      category: category || 'all',
      searchQuery: '',
    }));
    const el = document.getElementById('catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-12 bg-stone-950">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'ur' ? 'شاہانہ ورائٹی' : 'SIGNATURE PILLARS'}</span>
          </div>
          <h2 className="font-serif-luxury text-2xl sm:text-4xl font-bold text-stone-100">
            {t.catHeading}
          </h2>
          <p className="text-stone-400 text-sm mt-2">{t.catSubheading}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              onClick={() => handleSelect(cat.gender, cat.category)}
              className="group relative rounded-2xl overflow-hidden cursor-pointer border border-stone-800 hover:border-amber-500/50 transition-all duration-300 shadow-xl bg-stone-900"
            >
              <div className="relative h-72 sm:h-80 overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent" />

                <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-stone-950/80 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-bold">
                  {cat.tag}
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-stone-100">
                  <h3 className="font-serif-luxury text-xl font-bold text-amber-100 group-hover:text-amber-300 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-stone-300 mt-1 line-clamp-2">{cat.subtitle}</p>

                  <div className="mt-3 flex items-center justify-between text-xs font-bold text-amber-400">
                    <span className="group-hover:underline">{t.shopNow}</span>
                    <div className="w-7 h-7 rounded-full bg-amber-500/20 group-hover:bg-amber-500 text-amber-300 group-hover:text-stone-950 flex items-center justify-center transition-all">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
