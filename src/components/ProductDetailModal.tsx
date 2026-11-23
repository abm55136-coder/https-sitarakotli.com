import React, { useEffect, useState } from 'react';
import { useShop } from '../context/ShopContext';
import { generateSingleProductWhatsAppUrl, getFabricCareGuide } from '../utils/logic';
import {
  getWholesaleMinQty,
  smartSearchAndRecommend,
} from '../utils/globalBusiness';
import { ProductQrSvg } from './ProductQrSvg';
import {
  X,
  ShoppingBag,
  MessageCircle,
  ShieldCheck,
  Truck,
  Sparkles,
  Layers,
  Droplets,
  Wind,
  Flame,
  Archive,
  AlertTriangle,
  Film,
  Image as ImageIcon,
  Briefcase,
} from 'lucide-react';
import globalAtelierImg from '../assets/images/global_atelier_dispatch_1794817843306.jpg';

export const ProductDetailModal: React.FC = () => {
  const {
    lang,
    t,
    shopProfile,
    products,
    selectedProduct,
    setSelectedProduct,
    addToCart,
    formatPrice,
    buyingMode,
    getEffectiveUnitPrice,
  } = useShop();

  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    selectedProduct?.colors?.[0]?.name
  );
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    selectedProduct?.availableSizes?.[0]
  );
  const [customNotes, setCustomNotes] = useState('');
  const [mediaView, setMediaView] = useState<'photo' | 'video'>('photo');
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    if (!selectedProduct) return;
    const minWh = getWholesaleMinQty(selectedProduct);
    setQuantity(buyingMode === 'wholesale' ? minWh : 1);
    setSelectedColor(selectedProduct.colors?.[0]?.name);
    setSelectedSize(selectedProduct.availableSizes?.[0]);
    setCustomNotes('');
    setMediaView('photo');
    setImgFailed(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProduct(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProduct, buyingMode, setSelectedProduct]);

  if (!selectedProduct) return null;

  const careGuide = getFabricCareGuide(selectedProduct);
  const minWholesaleQty = getWholesaleMinQty(selectedProduct);
  const pricing = getEffectiveUnitPrice(selectedProduct, quantity);
  const relatedProducts = smartSearchAndRecommend(products, selectedProduct, 3);

  const waUrl = generateSingleProductWhatsAppUrl(
    selectedProduct,
    quantity,
    selectedColor,
    shopProfile.whatsapp || '03425984394'
  );

  const handleAddToCart = () => {
    addToCart(selectedProduct, quantity, selectedColor, selectedSize, customNotes);
    setSelectedProduct(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) setSelectedProduct(null);
      }}
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-2.5 sm:p-4 bg-stone-950/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl bg-stone-900 border border-amber-500/40 rounded-2xl sm:rounded-3xl shadow-2xl overflow-y-auto md:overflow-hidden max-h-[92vh] md:max-h-none my-auto animate-in fade-in duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setSelectedProduct(null)}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2.5 rounded-full bg-stone-950/90 text-stone-300 hover:text-amber-400 hover:bg-stone-950 border border-stone-700 transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* Product Media Column */}
          <div className="md:col-span-5 relative bg-stone-950 flex flex-col justify-between p-3 sm:p-4 gap-3">
            {/* Photo / Video Showcase Toggle */}
            <div className="flex items-center justify-between gap-2 z-10">
              <div className="inline-flex rounded-xl bg-stone-900 p-1 border border-stone-800 text-[11px]">
                <button
                  type="button"
                  data-testid="modal-media-photo-btn"
                  onClick={() => setMediaView('photo')}
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 cursor-pointer ${
                    mediaView === 'photo'
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>{t.photoViewLabel}</span>
                </button>
                <button
                  type="button"
                  data-testid="modal-media-video-btn"
                  onClick={() => setMediaView('video')}
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 cursor-pointer ${
                    mediaView === 'video'
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Film className="w-3 h-3" />
                  <span>{t.videoShowcaseLabel}</span>
                </button>
              </div>

              {selectedProduct.discountPercent && selectedProduct.discountPercent > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-extrabold text-[10px] uppercase shadow">
                  -{selectedProduct.discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Active Media Viewport */}
            <div className="relative flex-1 min-h-[220px] sm:min-h-[280px] flex items-center justify-center rounded-2xl overflow-hidden border border-amber-900/30 bg-stone-900">
              {mediaView === 'video' ? (
                selectedProduct.videoUrl ? (
                  <video
                    controls
                    playsInline
                    poster={selectedProduct.image}
                    src={selectedProduct.videoUrl}
                    className="w-full h-full max-h-[420px] object-cover rounded-2xl"
                  />
                ) : (
                  <div
                    data-testid="studio-video-showcase"
                    className="relative w-full h-64 sm:h-80 overflow-hidden bg-stone-950"
                  >
                    <img
                      src={imgFailed ? globalAtelierImg : selectedProduct.image}
                      alt={`${selectedProduct.title} weave showcase`}
                      className="w-full h-full object-cover scale-110 transition-transform duration-[4000ms] ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent" />
                    <div className="absolute bottom-3 inset-x-3 space-y-1 text-left">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-400">
                        <Film className="w-3.5 h-3.5" />
                        <span>Studio Textile Drape Preview</span>
                      </div>
                      <p className="text-xs font-bold text-stone-100">
                        {selectedProduct.fabricType}
                      </p>
                      <p className="text-[11px] text-stone-300">
                        {selectedProduct.weaveQuality} · {selectedProduct.cutMeters}
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <img
                  src={imgFailed ? globalAtelierImg : selectedProduct.image}
                  alt={selectedProduct.title}
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover max-h-[440px]"
                />
              )}
            </div>

            {/* Product QR Verification & Quick Share */}
            <ProductQrSvg
              sku={selectedProduct.sku}
              title={selectedProduct.title}
              sizePx={88}
            />
          </div>

          {/* Product Info & Actions Column */}
          <div className="md:col-span-7 p-4 sm:p-8 space-y-5 flex flex-col justify-between md:max-h-[85vh] md:overflow-y-auto">
            <div>
              {/* Category, SKU & Season */}
              <div className="flex flex-wrap items-center justify-between text-xs text-amber-400/90 font-medium pb-2 border-b border-stone-800">
                <span className="uppercase tracking-widest">{selectedProduct.categoryLabel}</span>
                <span className="font-mono text-stone-400">SKU: {selectedProduct.sku}</span>
              </div>

              {/* Title */}
              <h2
                id="product-modal-title"
                className="font-serif-luxury text-xl sm:text-2xl font-bold text-stone-100 mt-3 leading-snug"
              >
                {lang === 'ur' ? selectedProduct.titleUrdu : selectedProduct.title}
              </h2>

              {/* Pricing (Retail + Wholesale Trade Tier) */}
              <div className="mt-3 space-y-1.5">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="font-serif-luxury text-2xl sm:text-3xl font-extrabold gold-gradient-text">
                    {formatPrice(pricing.unitPrice)}
                  </span>
                  {pricing.isWholesaleApplied ? (
                    <span className="text-sm text-stone-500 line-through">
                      {formatPrice(selectedProduct.price)}
                    </span>
                  ) : (
                    selectedProduct.originalPrice &&
                    selectedProduct.originalPrice > selectedProduct.price && (
                      <span className="text-sm text-stone-500 line-through">
                        {formatPrice(selectedProduct.originalPrice)}
                      </span>
                    )
                  )}
                  <span className="text-xs text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                    {t.inStock} ({selectedProduct.stockQuantity})
                  </span>
                </div>

                {/* Wholesale Rate Callout */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-300">
                  <Briefcase className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    {t.wholesalePriceLabel}:{' '}
                    <strong className="text-amber-300">
                      {formatPrice(getEffectiveUnitPrice(selectedProduct, minWholesaleQty).unitPrice)}
                    </strong>{' '}
                    ({t.wholesaleMinOrder} {minWholesaleQty}+ suits)
                  </span>
                  {pricing.isWholesaleApplied && (
                    <span className="text-emerald-400 font-semibold">
                      · Wholesale Applied (Save {formatPrice(pricing.savingsPerUnit)}/pc)
                    </span>
                  )}
                </div>
              </div>

              {/* Fabric Specifications Highlight Card */}
              <div className="mt-4 p-4 rounded-xl bg-stone-950/80 border border-amber-900/30 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-300 font-semibold uppercase tracking-wider text-[11px]">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.specifications}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-stone-300 pt-1">
                  <div>
                    <span className="text-stone-500 block text-[10px]">{t.cutLength}:</span>
                    <span className="font-medium">{selectedProduct.cutMeters}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[10px]">{t.season}:</span>
                    <span className="font-medium">{selectedProduct.season}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-stone-500 block text-[10px]">{t.weaveQuality}:</span>
                    <span className="font-medium text-stone-200">{selectedProduct.weaveQuality}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="mt-3 text-stone-300 text-xs sm:text-sm leading-relaxed">
                {lang === 'ur' ? selectedProduct.descriptionUrdu : selectedProduct.description}
              </p>

              {/* Dynamic Fabric Care Guide */}
              <section
                aria-labelledby="fabric-care-heading"
                data-testid="fabric-care-guide"
                data-material-key={careGuide.materialKey}
                className="mt-4 p-4 rounded-2xl bg-stone-950/90 border border-amber-500/25 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-800/90">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <h3
                        id="fabric-care-heading"
                        className="text-xs font-bold uppercase tracking-wider text-amber-300"
                      >
                        {t.fabricCareTitle}
                      </h3>
                      <p className="text-[11px] text-stone-400">
                        {lang === 'ur' ? careGuide.materialTitleUr : careGuide.materialTitleEn}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-semibold tracking-wide">
                    {lang === 'ur' ? careGuide.badgeUr : careGuide.badgeEn}
                  </span>
                </div>

                <p className="text-[11px] sm:text-xs text-stone-300 leading-relaxed">
                  {lang === 'ur' ? careGuide.summaryUr : careGuide.summaryEn}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-sky-300 font-semibold text-[11px]">
                      <Droplets className="w-3.5 h-3.5 shrink-0" />
                      <span>{t.careWash}</span>
                    </div>
                    <p className="text-[11px] text-stone-300 leading-relaxed">
                      {lang === 'ur' ? careGuide.washUr : careGuide.washEn}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-semibold text-[11px]">
                      <Wind className="w-3.5 h-3.5 shrink-0" />
                      <span>{t.careDry}</span>
                    </div>
                    <p className="text-[11px] text-stone-300 leading-relaxed">
                      {lang === 'ur' ? careGuide.dryUr : careGuide.dryEn}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-[11px]">
                      <Flame className="w-3.5 h-3.5 shrink-0" />
                      <span>{t.careIron}</span>
                    </div>
                    <p className="text-[11px] text-stone-300 leading-relaxed">
                      {lang === 'ur' ? careGuide.ironUr : careGuide.ironEn}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-violet-300 font-semibold text-[11px]">
                      <Archive className="w-3.5 h-3.5 shrink-0" />
                      <span>{t.careStorage}</span>
                    </div>
                    <p className="text-[11px] text-stone-300 leading-relaxed">
                      {lang === 'ur' ? careGuide.storageUr : careGuide.storageEn}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-950/35 border border-rose-500/25 text-[11px] text-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-rose-300">{t.careAvoid}: </span>
                    <span>{lang === 'ur' ? careGuide.avoidUr : careGuide.avoidEn}</span>
                  </div>
                </div>

                {careGuide.customNote && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-950/25 border border-amber-500/20 text-[11px] text-amber-100">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-300">{t.careShowroomNote}: </span>
                      <span>{careGuide.customNote}</span>
                    </div>
                  </div>
                )}
              </section>

              {/* Color Options */}
              {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-stone-300 mb-2">
                    {t.colorOptions}: <span className="text-amber-400 font-normal">{selectedColor}</span>
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedProduct.colors.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setSelectedColor(c.name)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all cursor-pointer ${
                          selectedColor === c.name
                            ? 'border-amber-400 bg-amber-500/20 text-amber-200 ring-1 ring-amber-400'
                            : 'border-stone-700 bg-stone-950 text-stone-400 hover:border-stone-500'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-stone-600 inline-block"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Options */}
              {selectedProduct.availableSizes && selectedProduct.availableSizes.length > 0 && (
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-stone-300 mb-2">
                    {t.sizeOptions}
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedProduct.availableSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          selectedSize === size
                            ? 'border-amber-400 bg-amber-500/20 text-amber-200 ring-1 ring-amber-400'
                            : 'border-stone-700 bg-stone-950 text-stone-400 hover:border-stone-500'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Stepper + Quick Wholesale Button */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-stone-300">Quantity:</span>
                <div className="flex items-center rounded-xl bg-stone-950 border border-stone-700">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-1 text-stone-400 hover:text-stone-100 font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-bold text-amber-300">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(selectedProduct.stockQuantity, q + 1))}
                    className="px-3 py-1 text-stone-400 hover:text-stone-100 font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {selectedProduct.stockQuantity >= minWholesaleQty && quantity < minWholesaleQty && (
                  <button
                    type="button"
                    onClick={() => setQuantity(minWholesaleQty)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold cursor-pointer hover:bg-amber-500/25"
                  >
                    Unlock Wholesale ({minWholesaleQty} pcs)
                  </button>
                )}
              </div>

              {/* Smart Recommendations · Pair With */}
              {relatedProducts.length > 0 && (
                <div className="mt-5 pt-4 border-t border-stone-800/80 space-y-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    {t.recommendedPairTitle}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {relatedProducts.map((rel) => (
                      <button
                        key={rel.id}
                        type="button"
                        onClick={() => setSelectedProduct(rel)}
                        className="flex items-center gap-2 p-2 rounded-xl bg-stone-950 border border-stone-800 hover:border-amber-500/50 text-left transition-all cursor-pointer"
                      >
                        <img
                          src={rel.image}
                          alt={rel.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-stone-200 truncate">{rel.title}</p>
                          <p className="text-[10px] text-amber-400 font-bold">{formatPrice(rel.price)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-stone-800/80 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={selectedProduct.stockQuantity <= 0}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 font-bold text-sm tracking-wide hover:brightness-110 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {t.addToCart} ({formatPrice(pricing.unitPrice * quantity)})
                  </span>
                </button>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{t.directWhatsAppBuy}</span>
                </a>
              </div>

              {/* Guarantees */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-400 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.authenticGuarantee}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Worldwide Dispatch from Kotli</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
