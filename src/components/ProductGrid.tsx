import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { filterProducts } from '../utils/logic';
import { smartSearchAndRecommend } from '../utils/globalBusiness';
import { ProductCard } from './ProductCard';
import {
  SlidersHorizontal,
  Sparkles,
  RotateCcw,
  Check,
  Heart,
  Store,
  Briefcase,
  Wand2,
} from 'lucide-react';
import { FabricCategory, GenderCategory, Product, Season } from '../types';

export const ProductGrid: React.FC = () => {
  const {
    lang,
    t,
    products,
    filters,
    setFilters,
    resetFilters,
    wishlist,
    buyingMode,
    setBuyingMode,
    setSelectedProduct,
    formatPrice,
  } = useShop();

  const [showOnlyWishlist, setShowOnlyWishlist] = useState(false);
  const [aiSearchReason, setAiSearchReason] = useState<string | null>(null);
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [aiMatchedIds, setAiMatchedIds] = useState<string[]>([]);

  const baseFiltered = filterProducts(products, filters);
  const filtered = showOnlyWishlist
    ? baseFiltered.filter((p) => wishlist.includes(p.id))
    : baseFiltered;

  const fabricsList: { key: FabricCategory; label: string }[] = [
    { key: 'all', label: t.filterAllFabrics },
    { key: 'boski', label: t.filterBoski },
    { key: 'karandi', label: t.filterKarandi },
    { key: 'khaddar', label: t.filterKhaddar },
    { key: 'linen', label: t.filterLinen },
    { key: 'lawn', label: t.filterLawn },
    { key: 'latha-cotton', label: lang === 'ur' ? 'کاٹن لٹھا' : 'Cotton Latha' },
    { key: 'chiffon', label: t.filterChiffon },
    { key: 'silk', label: t.filterSilk },
    { key: 'velvet', label: t.filterVelvet },
    { key: 'wash-wear', label: t.filterWashWear },
    { key: 'wool-shawl', label: t.filterShawl },
  ];

  const hasSearchQuery = filters.searchQuery.trim().length >= 2;
  const instantAiPicks: Product[] = hasSearchQuery
    ? aiMatchedIds.length > 0
      ? products.filter((p) => aiMatchedIds.includes(p.id)).slice(0, 4)
      : smartSearchAndRecommend(products, filters.searchQuery, 4)
    : [];

  const handleAskAiSmartSearch = async () => {
    const query = filters.searchQuery.trim();
    if (!query) return;
    setAiSearchLoading(true);
    setAiSearchReason(null);
    try {
      const res = await fetch('/api/ai/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          lang,
          products: products.slice(0, 24).map((p) => ({
            id: p.id,
            title: p.title,
            category: p.category,
            gender: p.gender,
            season: p.season,
            price: p.price,
          })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.recommendedIds) && data.recommendedIds.length > 0) {
          setAiMatchedIds(data.recommendedIds);
        }
        if (data.reasoning) {
          setAiSearchReason(String(data.reasoning));
        }
      }
    } catch {
      const localMatches = smartSearchAndRecommend(products, query, 4);
      setAiMatchedIds(localMatches.map((p) => p.id));
    } finally {
      setAiSearchLoading(false);
    }
  };

  return (
    <section id="catalog" className="py-14 bg-stone-950 scroll-mt-40">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-mono uppercase tracking-[0.2em] font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'ur' ? 'عالمی فیبرک کیٹلاگ' : 'EXQUISITE GLOBAL TEXTILES'}</span>
          </div>
          <h2 className="font-serif-luxury text-2xl sm:text-4xl font-bold text-stone-100">
            {t.productsTitle}
          </h2>
          <p className="text-stone-400 text-sm mt-1">{t.productsSubtitle}</p>
        </div>

        {/* 1. Gender Collection Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6 scroll-mt-40">
          {(['all', 'men', 'women', 'kids'] as GenderCategory[]).map((gender) => {
            const isActive = filters.gender === gender;
            const labels: Record<GenderCategory, string> = {
              all: t.filterAll,
              men: t.filterMen,
              women: t.filterWomen,
              kids: t.filterKids,
            };

            return (
              <button
                key={gender}
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, gender }))}
                className={`px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 shadow-md shadow-amber-500/20'
                    : 'bg-stone-900 border border-stone-800 text-stone-300 hover:text-amber-300 hover:border-amber-900/40'
                }`}
              >
                {labels[gender]}
              </button>
            );
          })}
        </div>

        {/* 2. Fabric Category Filter Strip */}
        <div className="flex items-center sm:flex-wrap sm:justify-center gap-2 overflow-x-auto sm:overflow-visible pb-3 mb-6 scrollbar-none scroll-mt-40">
          {fabricsList.map((item) => (
            <button
              key={item.key}
              type="button"
              data-testid={`fabric-filter-${item.key}`}
              onClick={() => setFilters((prev) => ({ ...prev, category: item.key }))}
              className={`scroll-mt-40 shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                filters.category === item.key
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'bg-stone-900/80 text-stone-400 border border-stone-800/80 hover:text-stone-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* 3. Controls & Filter Bar */}
        <div className="bg-stone-900/60 rounded-2xl border border-stone-800 p-4 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Retail / Wholesale Trade Toggle */}
              <div className="inline-flex rounded-xl bg-stone-950 p-1 border border-stone-700/80 text-xs">
                <button
                  type="button"
                  onClick={() => setBuyingMode('retail')}
                  className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    buyingMode === 'retail'
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>{t.retailMode}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBuyingMode('wholesale')}
                  className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    buyingMode === 'wholesale'
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{t.wholesaleMode}</span>
                </button>
              </div>

              {/* Season Filter */}
              <select
                value={filters.season}
                onChange={(e) => setFilters((prev) => ({ ...prev, season: e.target.value as 'all' | Season }))}
                className="bg-stone-950 border border-stone-700/80 rounded-xl px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
              >
                <option value="all">{lang === 'ur' ? 'تمام موسم' : 'All Seasons'}</option>
                <option value="Summer">{lang === 'ur' ? 'موسم گرما (Summer)' : 'Summer'}</option>
                <option value="Winter">{lang === 'ur' ? 'موسم سرما (Winter)' : 'Winter'}</option>
                <option value="Festive">{lang === 'ur' ? 'شادی و تہوار (Festive)' : 'Festive & Wedding'}</option>
                <option value="All-Season">{lang === 'ur' ? 'سدا بہار (All Season)' : 'All Season'}</option>
              </select>

              {/* In-Stock Toggle */}
              <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300 bg-stone-950 border border-stone-700/80 rounded-xl px-3 py-1.5 hover:border-amber-500/40">
                <input
                  type="checkbox"
                  checked={filters.onlyInStock}
                  onChange={(e) => setFilters((prev) => ({ ...prev, onlyInStock: e.target.checked }))}
                  className="rounded bg-stone-900 border-stone-700 text-amber-500 focus:ring-0"
                />
                <span>{t.filterInStockOnly}</span>
              </label>

              {/* New Arrivals Quick Toggle */}
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, onlyNewArrivals: !prev.onlyNewArrivals }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  filters.onlyNewArrivals
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-stone-950 border border-stone-700/80 text-stone-300'
                }`}
              >
                {filters.onlyNewArrivals && <Check className="w-3 h-3" />}
                <span>{t.filterNewArrivals}</span>
              </button>

              {/* Special Offers Toggle */}
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, onlyOffers: !prev.onlyOffers }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  filters.onlyOffers
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-stone-950 border border-stone-700/80 text-stone-300'
                }`}
              >
                {filters.onlyOffers && <Check className="w-3 h-3" />}
                <span>{t.filterSpecialOffers}</span>
              </button>

              {/* Wishlist Favorites Toggle */}
              <button
                type="button"
                onClick={() => setShowOnlyWishlist((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showOnlyWishlist
                    ? 'bg-red-500/20 text-red-300 border border-red-500/60 font-bold'
                    : 'bg-stone-950 border border-stone-700/80 text-stone-300 hover:text-red-400'
                }`}
                title="View your saved fabrics"
              >
                <Heart className={`w-3.5 h-3.5 ${showOnlyWishlist || wishlist.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                <span>{lang === 'ur' ? 'پسندیدہ کپڑے' : 'Wishlist'}</span>
                {wishlist.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-bold">
                    {wishlist.length}
                  </span>
                )}
              </button>
            </div>

            {/* Sort & Reset */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-stone-400">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.sortBy}:</span>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))}
                  className="bg-stone-950 border border-stone-700/80 rounded-xl px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="featured">{t.sortFeatured}</option>
                  <option value="newest">{t.sortNewest}</option>
                  <option value="price-low">{t.sortPriceLow}</option>
                  <option value="price-high">{t.sortPriceHigh}</option>
                  <option value="rating">{t.sortRating}</option>
                </select>
              </div>

              {(filters.gender !== 'all' ||
                filters.category !== 'all' ||
                filters.season !== 'all' ||
                filters.searchQuery !== '' ||
                filters.onlyInStock ||
                filters.onlyNewArrivals ||
                filters.onlyOffers) && (
                <button
                  type="button"
                  onClick={() => {
                    resetFilters();
                    setAiMatchedIds([]);
                    setAiSearchReason(null);
                  }}
                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs flex items-center gap-1 cursor-pointer"
                  title={t.resetFilters}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.resetFilters}</span>
                </button>
              )}
            </div>
          </div>

          {/* Results Count & Active Mode Info */}
          <div className="mt-3 pt-3 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-400">
            <span>
              Showing <strong className="text-amber-400 font-bold">{filtered.length}</strong> luxury fabrics
              {filters.searchQuery && ` matching "${filters.searchQuery}"`}
              {buyingMode === 'wholesale' && ' · Wholesale Trade Pricing Active'}
            </span>
            <span className="text-stone-500 font-mono text-[11px]">
              Khudadad Market Kotli · Worldwide Dispatch
            </span>
          </div>

          {/* Smart AI Search Assistant Strip when query active */}
          {hasSearchQuery && instantAiPicks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-stone-800/80 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Smart Fabric Matches for "{filters.searchQuery}"</span>
                </div>
                <button
                  type="button"
                  onClick={handleAskAiSmartSearch}
                  disabled={aiSearchLoading}
                  className="px-3 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Sparkles className={`w-3 h-3 ${aiSearchLoading ? 'animate-spin' : ''}`} />
                  <span>{aiSearchLoading ? 'Analyzing Catalogue...' : 'Ask AI Stylist Match'}</span>
                </button>
              </div>
              {aiSearchReason && (
                <p className="text-[11px] text-emerald-300 leading-relaxed">{aiSearchReason}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {instantAiPicks.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedProduct(item)}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-stone-950/90 border border-stone-800 hover:border-amber-500/50 text-left transition-all cursor-pointer"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-stone-100 truncate">{item.title}</p>
                      <p className="text-[11px] text-amber-400 font-bold">{formatPrice(item.price)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Products Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[520px] content-start">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-stone-900/40 rounded-2xl border border-stone-800 space-y-3">
            {showOnlyWishlist ? (
              <>
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 mx-auto flex items-center justify-center">
                  <Heart className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-stone-300 text-base font-serif-luxury font-bold">
                  {lang === 'ur' ? 'آپ نے ابھی تک کوئی فیبرک محفوظ نہیں کیا' : 'Your Wishlist is Empty'}
                </p>
                <p className="text-stone-400 text-xs max-w-sm mx-auto">
                  {lang === 'ur'
                    ? 'کسی بھی کپڑے پر دل کے نشان پر کلک کریں تاکہ وہ آپ کی پسندیدہ لسٹ میں شامل ہو جائے۔'
                    : 'Tap the heart icon on any fabric card to save it for easy viewing and ordering.'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowOnlyWishlist(false)}
                  className="mt-2 px-5 py-2 rounded-full bg-amber-500 text-stone-950 font-bold text-xs hover:brightness-110 transition-all cursor-pointer"
                >
                  {lang === 'ur' ? 'تمام کپڑے دیکھیں' : 'Browse All Fabrics'}
                </button>
              </>
            ) : (
              <>
                <p className="text-stone-300 text-base">{t.noProductsFound}</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-2 px-5 py-2 rounded-full bg-amber-500 text-stone-950 font-bold text-xs hover:brightness-110 transition-all cursor-pointer"
                >
                  {t.resetFilters}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
