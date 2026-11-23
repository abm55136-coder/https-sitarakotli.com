import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { CurrencyCode } from '../types';
import {
  GLOBAL_CURRENCIES,
  convertCurrency,
  formatGlobalPrice,
} from '../utils/globalBusiness';
import {
  Coins,
  ChevronDown,
  Check,
  ArrowRightLeft,
  RefreshCw,
  Search,
} from 'lucide-react';

interface CurrencySelectorProps {
  variant?: 'compact' | 'expanded' | 'mobile';
  className?: string;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const {
    currency,
    setCurrency,
    exchangeRates,
    refreshExchangeRates,
    fxSource,
    fxUpdatedAt,
    isRefreshingFx,
    lang,
    t,
  } = useShop();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [calcAmount, setCalcAmount] = useState<string>('10000');
  const [calcFrom, setCalcFrom] = useState<CurrencyCode>('PKR');
  const [calcTo, setCalcTo] = useState<CurrencyCode>(currency === 'PKR' ? 'USD' : currency);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentCfg =
    GLOBAL_CURRENCIES.find((c) => c.code === currency) || GLOBAL_CURRENCIES[0];

  useEffect(() => {
    if (currency !== 'PKR') {
      setCalcTo(currency);
    }
  }, [currency]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const filteredCurrencies = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return GLOBAL_CURRENCIES;
    return GLOBAL_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.nameUrdu.includes(q)
    );
  }, [searchTerm]);

  const parsedCalcAmount = Number(calcAmount) || 0;
  const convertedResult = convertCurrency(parsedCalcAmount, calcFrom, calcTo, exchangeRates);
  const convertedInPKR = convertCurrency(parsedCalcAmount, calcFrom, 'PKR', exchangeRates);
  const formattedCalcOutput = formatGlobalPrice(convertedInPKR, calcTo, exchangeRates);

  const fxStatusLabel =
    fxSource === 'live-fx'
      ? 'Live Market FX'
      : fxSource === 'cached-fx'
      ? 'Cached Live FX'
      : 'Reference FX';

  if (variant === 'mobile') {
    return (
      <div className={`space-y-2.5 ${className}`}>
        <div className="flex items-center justify-between text-[11px] font-semibold text-stone-300">
          <span className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'ur' ? 'کرنسی (15 ممالک):' : 'Global Currency (15):'}</span>
          </span>
          <button
            type="button"
            onClick={() => refreshExchangeRates(true)}
            disabled={isRefreshingFx}
            className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshingFx ? 'animate-spin' : ''}`} />
            <span>{t.refreshRatesBtn}</span>
          </button>
        </div>

        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
          className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
          aria-label="Select Global Currency"
        >
          {GLOBAL_CURRENCIES.map((cfg) => (
            <option key={cfg.code} value={cfg.code}>
              {cfg.flag} {cfg.code} ({cfg.symbol}) — {cfg.name}
            </option>
          ))}
        </select>

        {/* Compact Mobile Converter */}
        <div className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold uppercase tracking-wider">
            <span>{t.converterHeading}</span>
            <span className="text-emerald-400 font-mono">{fxStatusLabel}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <input
              type="number"
              min={0}
              value={calcAmount}
              onChange={(e) => setCalcAmount(e.target.value)}
              className="bg-stone-950 border border-stone-700 rounded-lg px-2 py-1 text-xs text-stone-100 font-mono"
              aria-label="Converter amount"
            />
            <select
              value={calcFrom}
              onChange={(e) => setCalcFrom(e.target.value as CurrencyCode)}
              className="bg-stone-950 border border-stone-700 rounded-lg px-1.5 py-1 text-xs text-stone-100 font-mono"
            >
              {GLOBAL_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
            </select>
            <select
              value={calcTo}
              onChange={(e) => setCalcTo(e.target.value as CurrencyCode)}
              className="bg-stone-950 border border-stone-700 rounded-lg px-1.5 py-1 text-xs text-stone-100 font-mono"
            >
              {GLOBAL_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
            </select>
          </div>
          <p className="text-xs font-mono text-amber-300 font-bold text-right">
            = {formattedCalcOutput} ({convertedResult.toFixed(2)} {calcTo})
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        data-testid="currency-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-stone-900/80 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 text-stone-200 transition-all text-xs font-semibold cursor-pointer shadow-sm"
        title="Change Currency & Open Live Currency Converter (15 Currencies)"
        aria-label="Select Currency"
      >
        <span className="text-sm">{currentCfg.flag}</span>
        <span className="font-mono text-amber-400 font-bold">{currentCfg.code}</span>
        <span className="text-[11px] text-stone-400 font-mono hidden sm:inline">
          ({currentCfg.symbol})
        </span>
        <ChevronDown
          className={`w-3 h-3 text-stone-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          data-testid="currency-converter-popover"
          className="absolute right-0 mt-1.5 w-80 sm:w-96 rounded-2xl bg-stone-950/98 border border-amber-500/35 p-3 shadow-2xl backdrop-blur-xl z-50"
        >
          {/* Header & Refresh */}
          <div className="pb-2 border-b border-stone-800 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold flex items-center gap-1">
                <ArrowRightLeft className="w-3 h-3" />
                <span>15 Global Currencies</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono block">
                {fxStatusLabel}
                {fxUpdatedAt ? ` · ${new Date(fxUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
              </span>
            </div>

            <button
              type="button"
              data-testid="refresh-fx-btn"
              onClick={() => refreshExchangeRates(true)}
              disabled={isRefreshingFx}
              className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshingFx ? 'animate-spin' : ''}`} />
              <span>{t.refreshRatesBtn}</span>
            </button>
          </div>

          {/* Live Currency Converter Calculator */}
          <div className="my-2.5 p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-300">
              {t.converterHeading}
            </div>
            <div className="grid grid-cols-12 gap-1.5 items-center">
              <input
                type="number"
                min={0}
                value={calcAmount}
                onChange={(e) => setCalcAmount(e.target.value)}
                data-testid="fx-calc-amount"
                className="col-span-5 bg-stone-950 border border-stone-700 rounded-lg px-2 py-1 text-xs text-stone-100 font-mono focus:outline-none focus:border-amber-400"
              />
              <select
                value={calcFrom}
                onChange={(e) => setCalcFrom(e.target.value as CurrencyCode)}
                data-testid="fx-calc-from"
                className="col-span-3 bg-stone-950 border border-stone-700 rounded-lg px-1.5 py-1 text-xs text-stone-100 font-mono"
              >
                {GLOBAL_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
              <span className="col-span-1 text-center text-stone-400 text-xs">→</span>
              <select
                value={calcTo}
                onChange={(e) => setCalcTo(e.target.value as CurrencyCode)}
                data-testid="fx-calc-to"
                className="col-span-3 bg-stone-950 border border-stone-700 rounded-lg px-1.5 py-1 text-xs text-stone-100 font-mono"
              >
                {GLOBAL_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="text-stone-400 text-[11px]">Converted:</span>
              <span data-testid="fx-calc-output" className="font-mono font-bold text-amber-300">
                {formattedCalcOutput}
              </span>
            </div>
          </div>

          {/* Search box */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search USD, GBP, AED, SAR, EUR..."
              className="w-full bg-stone-900 border border-stone-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* 15 Currencies Scroll List */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
            {filteredCurrencies.map((cfg) => {
              const isSelected = currency === cfg.code;
              const rate = exchangeRates[cfg.code] ?? cfg.rateAgainstPKR;

              return (
                <button
                  key={cfg.code}
                  type="button"
                  onClick={() => {
                    setCurrency(cfg.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 border border-amber-500/40 text-amber-200'
                      : 'hover:bg-stone-900 border border-transparent text-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{cfg.flag}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-stone-100">{cfg.code}</span>
                        <span className="text-amber-400 text-[11px] font-semibold">({cfg.symbol})</span>
                      </div>
                      <p className="text-[10px] text-stone-400 truncate">
                        {lang === 'ur' ? cfg.nameUrdu : cfg.name}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-1.5 shrink-0">
                    <div className="text-[10px] font-mono text-stone-400">
                      {cfg.code === 'PKR' ? (
                        <span className="text-emerald-400">Base</span>
                      ) : (
                        <span>{`1 ${cfg.code} ≈ ${Math.round(1 / rate)} ₨`}</span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
