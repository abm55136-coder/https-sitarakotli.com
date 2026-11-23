import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { calculateCartTotals, sanitizePhoneForWhatsApp } from '../utils/logic';
import { calculateInternationalShipping } from '../utils/globalBusiness';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  MessageCircle,
  Tag,
  Check,
  Truck,
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    lang,
    t,
    shopProfile,
    cart,
    isCartOpen,
    setIsCartOpen,
    setIsCheckoutOpen,
    updateQuantity,
    removeFromCart,
    formatPrice,
    selectedCountry,
    buyingMode,
    getEffectiveUnitPrice,
  } = useShop();

  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | undefined>('SITARA15');
  const [promoError, setPromoError] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const subtotalOnly = cart.reduce((sum, item) => {
    const { unitPrice } = getEffectiveUnitPrice(item.product, item.quantity);
    return sum + unitPrice * item.quantity;
  }, 0);

  const effectiveCart = cart.map((item) => {
    const { unitPrice } = getEffectiveUnitPrice(item.product, item.quantity);
    return {
      ...item,
      product: { ...item.product, price: unitPrice },
    };
  });

  const baseTotals = calculateCartTotals(
    effectiveCart,
    appliedPromo,
    'Kotli',
    shopProfile.freeShippingThreshold
  );

  const intlShipping = calculateInternationalShipping(
    subtotalOnly,
    selectedCountry,
    'Kotli',
    shopProfile.freeShippingThreshold,
    buyingMode
  );

  const totalWithGlobalShipping = Math.max(
    0,
    subtotalOnly - baseTotals.discount + intlShipping.shippingFeePKR
  );

  const handleApplyPromo = () => {
    if (!promoInput.trim()) return;
    const testResult = calculateCartTotals(
      effectiveCart,
      promoInput.trim(),
      'Kotli',
      shopProfile.freeShippingThreshold
    );
    if (testResult.appliedPromo) {
      setAppliedPromo(testResult.appliedPromo.code);
      setPromoError(null);
    } else {
      setPromoError(testResult.error || 'Invalid code');
    }
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const waNumber = sanitizePhoneForWhatsApp(shopProfile.whatsapp || '03425984394');
  const cartSummaryForWa = cart
    .map((item, idx) => {
      const { unitPrice } = getEffectiveUnitPrice(item.product, item.quantity);
      return `${idx + 1}. *${item.product.title}* (${item.product.sku}) - Qty: ${item.quantity} ${
        item.selectedColor ? `[Color: ${item.selectedColor}]` : ''
      } = Rs. ${(item.quantity * unitPrice).toLocaleString()}`;
    })
    .join('\n');

  const waCartUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    `*SITARA CLOTH HOUSE - GLOBAL CART INQUIRY*\n` +
      `----------------------------------------\n` +
      `*Items in Cart (${buyingMode.toUpperCase()}):*\n` +
      `${cartSummaryForWa}\n` +
      `----------------------------------------\n` +
      `*Subtotal:* Rs. ${subtotalOnly.toLocaleString()}\n` +
      `${
        baseTotals.discount > 0
          ? `*Promo Discount (${baseTotals.appliedPromo?.code}):* -Rs. ${baseTotals.discount.toLocaleString()}\n`
          : ''
      }*Courier (${intlShipping.courierName} · ${intlShipping.zoneLabel}):* ${
        intlShipping.isFree ? 'FREE' : `Rs. ${intlShipping.shippingFeePKR.toLocaleString()}`
      }\n` +
      `*Estimated Total:* Rs. ${totalWithGlobalShipping.toLocaleString()}\n` +
      `----------------------------------------\n` +
      `Khudadad Market, Main Bazaar, Kotli, Azad Kashmir.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-stone-900 border-l border-amber-900/40 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="font-serif-luxury text-lg font-bold text-stone-100">
                {t.cartTitle}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-all cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <ShoppingBag className="w-12 h-12 text-stone-700 mx-auto" />
                <p className="text-stone-400 text-sm">{t.cartEmpty}</p>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 px-5 py-2 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500 hover:text-stone-950 transition-all cursor-pointer"
                >
                  {t.cartBrowseBtn}
                </button>
              </div>
            ) : (
              cart.map((item, index) => {
                const { unitPrice, isWholesaleApplied } = getEffectiveUnitPrice(
                  item.product,
                  item.quantity
                );
                return (
                  <div
                    key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}-${index}`}
                    className="flex gap-3 p-3 rounded-2xl bg-stone-950/70 border border-stone-800"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      className="w-20 h-20 object-cover rounded-xl border border-stone-800 shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-serif-luxury font-bold text-xs sm:text-sm text-stone-200 line-clamp-1">
                            {lang === 'ur' ? item.product.titleUrdu : item.product.title}
                          </h4>
                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(item.product.id, item.selectedColor, item.selectedSize)
                            }
                            className="text-stone-500 hover:text-red-400 p-1 cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-amber-400/80">
                          {item.selectedColor ? `Color: ${item.selectedColor} · ` : ''}
                          {item.product.cutMeters}
                        </p>
                        {isWholesaleApplied && (
                          <p className="text-[10px] text-emerald-400 font-semibold">
                            Wholesale Rate ({formatPrice(unitPrice)} / pc)
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="font-serif-luxury font-bold text-sm text-amber-300">
                          {formatPrice(unitPrice * item.quantity)}
                        </span>

                        {/* Stepper */}
                        <div className="flex items-center rounded-lg bg-stone-900 border border-stone-800">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.quantity - 1,
                                item.selectedColor,
                                item.selectedSize
                              )
                            }
                            className="p-1 hover:text-amber-400 text-stone-400 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-stone-200">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.quantity + 1,
                                item.selectedColor,
                                item.selectedSize
                              )
                            }
                            className="p-1 hover:text-amber-400 text-stone-400 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Calculations */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 bg-stone-950 border-t border-stone-800 space-y-4">
              {/* Promo code */}
              <div className="space-y-1">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder={appliedPromo || t.couponPlaceholder}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 uppercase font-mono"
                    />
                    <Tag className="w-3.5 h-3.5 text-stone-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500 hover:text-stone-950 transition-all cursor-pointer"
                  >
                    {t.applyCoupon}
                  </button>
                </div>
                {appliedPromo && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Code <strong>{appliedPromo}</strong> active (-
                    {baseTotals.discount > 0 ? formatPrice(baseTotals.discount) : 'applied'})
                  </p>
                )}
                {promoError && <p className="text-[11px] text-red-400">{promoError}</p>}
              </div>

              {/* Totals */}
              <div className="space-y-1.5 text-xs text-stone-300 pt-2 border-t border-stone-800/80">
                <div className="flex justify-between">
                  <span>{t.subtotal}:</span>
                  <span className="font-medium">{formatPrice(subtotalOnly)}</span>
                </div>
                {baseTotals.discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>{t.discount}:</span>
                    <span>-{formatPrice(baseTotals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center gap-2">
                  <span className="flex items-center gap-1 truncate">
                    <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{intlShipping.courierName}:</span>
                  </span>
                  <span className={intlShipping.isFree ? 'text-emerald-400 font-bold shrink-0' : 'shrink-0'}>
                    {intlShipping.isFree ? t.shippingFree : formatPrice(intlShipping.shippingFeePKR)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-stone-100 pt-2 border-t border-stone-800">
                  <span className="font-serif-luxury">{t.grandTotal}:</span>
                  <span className="gold-gradient-text font-serif-luxury text-lg">
                    {formatPrice(totalWithGlobalShipping)}
                  </span>
                </div>
              </div>

              {/* Dual CTAs */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 font-bold text-xs sm:text-sm tracking-wide hover:brightness-110 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <span>{t.checkoutBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href={waCartUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-900/40 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>{t.checkoutWhatsAppBtn}</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
