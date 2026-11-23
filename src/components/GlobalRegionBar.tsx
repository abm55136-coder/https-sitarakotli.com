import React, { useEffect, useState } from 'react';
import { Globe2, Clock, Store, Briefcase, Sparkles, Languages } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import {
  formatDualWorldClock,
  getCountryByCode,
  GLOBAL_COUNTRIES,
  SUPPORTED_LANGUAGES,
} from '../utils/globalBusiness';
import { Language } from '../types';
import globalAtelierImg from '../assets/images/global_atelier_dispatch_1794817843306.jpg';

export const GlobalRegionBar: React.FC = () => {
  const {
    lang,
    setLang,
    t,
    aiTranslating,
    selectedCountry,
    setSelectedCountry,
    visitorTimezone,
    buyingMode,
    setBuyingMode,
    currency,
  } = useShop();

  const [nowDate, setNowDate] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNowDate(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const countryCfg = getCountryByCode(selectedCountry);
  const clocks = formatDualWorldClock(visitorTimezone, nowDate);

  return (
    <section
      aria-label="Global Region, Language, Currency and Trade Bar"
      className="bg-stone-950 border-y border-amber-900/30 py-3 px-3 sm:px-4 overflow-x-hidden"
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Left: Editorial Global Vision + Dual World Clock */}
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5 shrink-0">
            <img
              src={globalAtelierImg}
              alt="Sitara Cloth House Global Dispatch"
              className="w-11 h-8 rounded-lg object-cover border border-amber-500/40 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.16em] text-amber-400 font-bold">
                <Globe2 className="w-3 h-3 shrink-0" />
                <span className="truncate">{t.globalVisionTag}</span>
              </div>
              <p className="text-[11px] text-stone-300 truncate">
                {countryCfg.flag} {countryCfg.name} · {countryCfg.courierName} · {countryCfg.estimatedDays}
              </p>
            </div>
          </div>

          <span className="hidden sm:inline text-stone-700">|</span>

          {/* Dual World Clock */}
          <div
            data-testid="dual-world-clock"
            className="flex items-center gap-2 text-[11px] text-stone-300 font-mono"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Local ({clocks.visitorTzShort}): <strong className="text-stone-100">{clocks.visitorTime}</strong>
            </span>
            <span className="text-stone-600">·</span>
            <span>
              Kotli PKT: <strong className="text-amber-300">{clocks.kotliTime}</strong>
            </span>
          </div>
        </div>

        {/* Right: Country Selector, 10-Language Selector, and Retail/Wholesale Mode */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Country Picker */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="global-country-select" className="sr-only">
              Delivery Country
            </label>
            <select
              id="global-country-select"
              data-testid="global-country-select"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-stone-900 border border-stone-800 hover:border-amber-500/40 rounded-lg px-2.5 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-amber-400 max-w-[190px] sm:max-w-[220px] cursor-pointer"
            >
              {GLOBAL_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.defaultCurrency})
                </option>
              ))}
            </select>
          </div>

          {/* 10-Language Selector */}
          <div className="flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-amber-400 shrink-0 hidden sm:block" />
            <label htmlFor="global-language-select" className="sr-only">
              Website Language
            </label>
            <select
              id="global-language-select"
              data-testid="global-language-select"
              value={lang}
              onChange={(e) => setLang(e.target.value as Language)}
              className="bg-stone-900 border border-stone-800 hover:border-amber-500/40 rounded-lg px-2.5 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.nativeName} ({l.code.toUpperCase()})
                </option>
              ))}
            </select>
            {aiTranslating && (
              <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-spin" />
              </span>
            )}
          </div>

          {/* Retail vs Wholesale Mode Switch */}
          <div
            role="group"
            aria-label="Buying Mode"
            className="inline-flex rounded-lg bg-stone-900 p-0.5 border border-stone-800 text-[11px]"
          >
            <button
              type="button"
              data-testid="mode-retail-btn"
              onClick={() => setBuyingMode('retail')}
              className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                buyingMode === 'retail'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Store className="w-3 h-3" />
              <span>{t.retailMode}</span>
            </button>
            <button
              type="button"
              data-testid="mode-wholesale-btn"
              onClick={() => setBuyingMode('wholesale')}
              className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                buyingMode === 'wholesale'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Briefcase className="w-3 h-3" />
              <span>{t.wholesaleMode}</span>
            </button>
          </div>

          <span className="hidden xl:inline text-[10px] font-mono text-stone-500">
            Active FX: {currency}
          </span>
        </div>
      </div>
    </section>
  );
};
