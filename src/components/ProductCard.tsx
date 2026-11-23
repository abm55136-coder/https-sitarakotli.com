import React, { useState } from 'react';
import { Product } from '../types';
import { useShop } from '../context/ShopContext';
import { generateSingleProductWhatsAppUrl } from '../utils/logic';
import { getWholesaleMinQty } from '../utils/globalBusiness';
import { Heart, ShoppingBag, MessageCircle, Sparkles, Scissors, Eye, QrCode, Film } from 'lucide-react';
import globalAtelierImg from '../assets/images/global_atelier_dispatch_1794817843306.jpg';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    lang,
    t,
    shopProfile,
    wishlist,
    toggleWishlist,
    addToCart,
    setSelectedProduct,
    formatPrice,
    buyingMode,
    getEffectiveUnitPrice,
  } = useShop();

  const [imgFailed, setImgFailed] = useState(false);

  const isFav = wishlist.includes(product.id);
  const minWholesaleQty = getWholesaleMinQty(product);
  const activeQty = buyingMode === 'wholesale' ? minWholesaleQty : 1;
  const pricing = getEffectiveUnitPrice(product, activeQty);

  const waUrl = generateSingleProductWhatsAppUrl(
    product,
    activeQty,
    product.colors && product.colors.length > 0 ? product.colors[0].name : undefined,
    shopProfile.whatsapp || '03425984394'
  );

  return (
    <div
      data-testid={`product-card-${product.sku}`}
      className="group relative rounded-2xl bg-stone-900/90 border border-stone-800 hover:border-amber-500/50 transition-all duration-300 flex flex-col overflow-hidden shadow-lg hover:shadow-amber-500/10"
    >
      {/* Top Image Container */}
      <div
        className="relative aspect-[4/5] overflow-hidden bg-stone-950 cursor-pointer"
        onClick={() => setSelectedProduct(product)}
      >
        <img
          src={imgFailed ? globalAtelierImg : product.image}
          alt={product.title}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Single-Edge Status Indicators */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.discountPercent && product.discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-600/90 text-white font-black text-[10px] tracking-wider uppercase shadow">
              -{product.discountPercent}% OFF
            </span>
          )}
          {product.isNewArrival && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 font-bold text-[10px] tracking-wider uppercase flex items-center gap-1 shadow">
              <Sparkles className="w-2.5 h-2.5" />
              <span>{lang === 'ur' ? 'نئی آمد' : 'New'}</span>
            </span>
          )}
          {product.isSpecialOffer && !product.isNewArrival && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-600/90 text-white font-bold text-[10px] tracking-wider uppercase shadow">
              {lang === 'ur' ? 'خاص پیشکش' : 'Special'}
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all z-10 cursor-pointer ${
            isFav
              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : 'bg-stone-950/60 text-stone-300 hover:text-red-400 border border-stone-700/60'
          }`}
          aria-label={isFav ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {/* Quick View & QR Overlay on Hover */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProduct(product);
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-stone-950/90 hover:bg-stone-900 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg backdrop-blur-sm cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t.viewDetails}</span>
          </button>
        </div>

        {/* Stock Status Overlay */}
        {product.stockQuantity <= 0 ? (
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center">
            <span className="px-3 py-1 rounded bg-stone-800 text-stone-400 text-xs font-bold uppercase tracking-wider border border-stone-700">
              {t.outOfStock}
            </span>
          </div>
        ) : product.stockQuantity <= 4 ? (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-amber-950/90 border border-amber-500/50 text-amber-300 text-[10px] font-semibold">
            {t.lowStock} ({product.stockQuantity})
          </span>
        ) : null}
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Category, SKU & QR/Video Indicator */}
          <div className="flex items-center justify-between text-[11px] text-amber-400/80 font-medium pb-1">
            <span className="uppercase tracking-wider">{product.categoryLabel}</span>
            <span className="font-mono text-stone-500 flex items-center gap-1.5">
              {product.videoUrl && (
                <span title="Video Showcase Available" className="inline-flex">
                  <Film className="w-3 h-3 text-amber-400" />
                </span>
              )}
              <span title="QR Verified SKU" className="inline-flex">
                <QrCode className="w-3 h-3 text-stone-500" />
              </span>
              <span>{product.sku}</span>
            </span>
          </div>

          {/* Title */}
          <h3
            onClick={() => setSelectedProduct(product)}
            className="font-serif-luxury font-bold text-sm sm:text-base text-stone-100 group-hover:text-amber-300 transition-colors cursor-pointer line-clamp-1"
          >
            {lang === 'ur' ? product.titleUrdu : product.title}
          </h3>

          {/* Fabric Specifications Snippet */}
          <div className="mt-1.5 flex items-center gap-2 text-xs text-stone-400">
            <Scissors className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{product.cutMeters}</span>
            <span className="text-stone-600">·</span>
            <span className="truncate">{product.season}</span>
          </div>
        </div>

        {/* Pricing & Ratings */}
        <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-serif-luxury font-extrabold text-base sm:text-lg gold-gradient-text">
                {formatPrice(pricing.unitPrice)}
              </span>
              {pricing.isWholesaleApplied ? (
                <span className="text-xs text-stone-500 line-through">
                  {formatPrice(product.price)}
                </span>
              ) : (
                product.originalPrice &&
                product.originalPrice > product.price && (
                  <span className="text-xs text-stone-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )
              )}
            </div>
            <p className="text-[10px] text-stone-400 truncate">
              {buyingMode === 'wholesale'
                ? `${t.wholesaleMode} · ${t.wholesaleMinOrder} ${minWholesaleQty}`
                : product.weaveQuality.split(',')[0]}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs text-amber-400 font-bold">★ {product.rating}</span>
            <span className="text-[10px] text-stone-500 ml-1">({product.reviewCount})</span>
          </div>
        </div>

        {/* Action Buttons: Add to Cart + WhatsApp Direct Order */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => addToCart(product, activeQty)}
            disabled={product.stockQuantity <= 0}
            className="w-full py-2 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{buyingMode === 'wholesale' ? `${t.addToCart} (${activeQty})` : t.addToCart}</span>
          </button>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-sm"
            title="Direct Order on WhatsApp to 03425984394"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ur' ? 'واٹس ایپ' : 'WhatsApp'}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
