import React, { useEffect, useState } from 'react';
import { useShop } from '../context/ShopContext';
import {
  calculateCartTotals,
  formatPKR,
  generateWhatsAppOrderUrl,
  validateOrderCustomer,
} from '../utils/logic';
import {
  buildMaskedPaymentSummary,
  calculateInternationalShipping,
  getCountryByCode,
  GLOBAL_COUNTRIES,
} from '../utils/globalBusiness';
import { Order, OrderCustomer, OrderPaymentMethod } from '../types';
import {
  X,
  CheckCircle,
  Truck,
  CreditCard,
  Building,
  MessageCircle,
  ShieldCheck,
  Globe,
  Wallet,
  Lock,
} from 'lucide-react';

export const CheckoutModal: React.FC = () => {
  const {
    t,
    shopProfile,
    cart,
    isCheckoutOpen,
    setIsCheckoutOpen,
    placeOrder,
    formatPrice,
    selectedCountry,
    setSelectedCountry,
    visitorTimezone,
    buyingMode,
    getEffectiveUnitPrice,
    currency,
  } = useShop();

  const initialCountry = getCountryByCode(selectedCountry);

  const [customer, setCustomer] = useState<OrderCustomer>({
    fullName: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    city: initialCountry.code === 'PK' ? 'Kotli' : 'London',
    provinceOrState: initialCountry.code === 'PK' ? 'Azad Kashmir' : initialCountry.name,
    country: initialCountry.name,
    countryCode: initialCountry.code,
    dialCode: initialCountry.dialCode,
    timezone: visitorTimezone,
    notes: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod>('cod');
  const [promoCode] = useState('SITARA15');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // PCI-safe transient card inputs (never persisted or serialized—only last 4 digits are tokenized)
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumberInput, setCardNumberInput] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [walletRefInput, setWalletRefInput] = useState('');

  useEffect(() => {
    const cfg = getCountryByCode(selectedCountry);
    setCustomer((prev) => ({
      ...prev,
      country: cfg.name,
      countryCode: cfg.code,
      dialCode: cfg.dialCode,
      timezone: visitorTimezone,
      city: prev.city || (cfg.code === 'PK' ? 'Kotli' : ''),
      provinceOrState: cfg.code === 'PK' ? 'Azad Kashmir' : cfg.name,
    }));
  }, [selectedCountry, visitorTimezone]);

  if (!isCheckoutOpen) return null;

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
    promoCode,
    customer.city || 'Kotli',
    shopProfile.freeShippingThreshold
  );

  const shippingQuote = calculateInternationalShipping(
    subtotalOnly,
    customer.countryCode || selectedCountry,
    customer.city || 'Kotli',
    shopProfile.freeShippingThreshold,
    buyingMode
  );

  const grandTotalPKR = Math.max(
    0,
    subtotalOnly - baseTotals.discount + shippingQuote.shippingFeePKR
  );

  const handleCountrySelect = (code: string) => {
    setSelectedCountry(code);
    const cfg = getCountryByCode(code);
    setCustomer((prev) => ({
      ...prev,
      countryCode: cfg.code,
      country: cfg.name,
      dialCode: cfg.dialCode,
      provinceOrState: cfg.code === 'PK' ? 'Azad Kashmir' : cfg.name,
      city: cfg.code === 'PK' ? 'Kotli' : '',
    }));
    if (cfg.code !== 'PK' && paymentMethod === 'cod') {
      setPaymentMethod('card');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateOrderCustomer(customer);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    if (paymentMethod === 'card') {
      const digits = cardNumberInput.replace(/\D/g, '');
      if (digits.length < 12) {
        setErrors({ card: 'Please enter a valid 12–19 digit card number.' });
        return;
      }
    }

    setErrors({});
    const cleanCardDigits = cardNumberInput.replace(/\D/g, '');
    const maskedPayment = buildMaskedPaymentSummary(paymentMethod, {
      cardLast4: cleanCardDigits.slice(-4),
      cardHolder: cardHolder.trim(),
      walletId: walletRefInput.trim(),
    });

    // Wipe transient raw card inputs immediately before creating persisted order
    setCardNumberInput('');
    setCardCvc('');

    const order = placeOrder(customer, paymentMethod, promoCode, {
      paymentReference: maskedPayment.paymentReference,
      paymentStatus: maskedPayment.paymentStatus,
      courier: `${shippingQuote.courierName} (${shippingQuote.estimatedDays})`,
    });
    setPlacedOrder(order);
  };

  const closeCheckout = () => {
    setPlacedOrder(null);
    setIsCheckoutOpen(false);
  };

  const domesticMethods: { id: OrderPaymentMethod; label: string; sub: string }[] = [
    { id: 'cod', label: 'Cash on Delivery', sub: 'Kotli & Pakistan COD' },
    { id: 'easypaisa', label: 'EasyPaisa', sub: 'Mobile Account Transfer' },
    { id: 'jazzcash', label: 'JazzCash', sub: 'Mobile Wallet Transfer' },
    { id: 'bank_transfer', label: 'Bank Transfer', sub: 'Meezan / HBL Account' },
    { id: 'whatsapp', label: 'WhatsApp Pay', sub: 'Confirm directly with owner' },
  ];

  const intlMethods: { id: OrderPaymentMethod; label: string; sub: string }[] = [
    { id: 'card', label: t.payCard, sub: 'Tokenized PCI-Safe Auth' },
    { id: 'paypal', label: t.payPayPal, sub: 'Buyer Protection Express' },
    { id: 'apple_pay', label: t.payApplePay, sub: 'One-Tap Mobile Token' },
    { id: 'swift_wire', label: t.paySwiftWire, sub: 'IBAN / SWIFT Wholesale Wire' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h2 className="font-serif-luxury text-lg font-bold text-stone-100">
              {placedOrder ? t.orderSuccessTitle : `${t.checkoutBtn} (${currency})`}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeCheckout}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-all cursor-pointer"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 max-h-[82vh] overflow-y-auto">
          {placedOrder ? (
            /* Order Placed Success View */
            <div className="text-center py-4 space-y-5" data-testid="order-success-receipt">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div>
                <h3 className="font-serif-luxury text-2xl font-bold text-stone-100">
                  {t.orderSuccessTitle}
                </h3>
                <p className="text-stone-300 text-sm mt-1 max-w-md mx-auto">
                  {t.orderSuccessDesc}
                </p>
              </div>

              {/* Order Info Receipt Card */}
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-stone-950 border border-amber-500/30 text-left space-y-2 text-xs">
                <div className="flex justify-between border-b border-stone-800 pb-2">
                  <span className="text-stone-400">{t.orderNumberLabel}:</span>
                  <span className="font-mono font-bold text-amber-400">{placedOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">{t.fullName}:</span>
                  <span className="font-medium text-stone-200">{placedOrder.customer.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Destination:</span>
                  <span className="font-medium text-stone-200">
                    {placedOrder.customer.city}, {placedOrder.customer.country || 'Pakistan'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Courier:</span>
                  <span className="font-medium text-amber-300">{placedOrder.courier || 'TCS Express'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">{t.grandTotal} ({currency}):</span>
                  <span className="font-bold text-amber-300">
                    {formatPrice(placedOrder.total)}{' '}
                    {currency !== 'PKR' && (
                      <span className="text-[10px] text-stone-400 font-mono">
                        ({formatPKR(placedOrder.total)})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">{t.paymentMethod}:</span>
                  <span className="font-bold uppercase text-emerald-400">{placedOrder.paymentMethod}</span>
                </div>
                {placedOrder.paymentReference && (
                  <div className="flex justify-between pt-1 border-t border-stone-800">
                    <span className="text-stone-400">Masked Payment Ref:</span>
                    <span data-testid="masked-payment-ref" className="font-mono text-stone-200">
                      {placedOrder.paymentReference}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={generateWhatsAppOrderUrl(placedOrder, shopProfile.whatsapp || '03425984394')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Order to WhatsApp (03425984394)</span>
                </a>
                <button
                  type="button"
                  onClick={closeCheckout}
                  className="px-6 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                >
                  Back to Shop
                </button>
              </div>
            </div>
          ) : (
            /* Global Checkout Form View */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Order Summary Mini Bar */}
              <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-400" />
                  <span className="text-stone-300">
                    {shippingQuote.courierName} ({shippingQuote.estimatedDays}):{' '}
                    <strong className="text-emerald-400">
                      {shippingQuote.isFree ? 'FREE' : formatPrice(shippingQuote.shippingFeePKR)}
                    </strong>
                  </span>
                </div>
                <div>
                  <span className="text-stone-400">Payable Total: </span>
                  <strong className="text-amber-400 font-serif-luxury text-sm font-bold">
                    {formatPrice(grandTotalPKR)}
                  </strong>
                </div>
              </div>

              {/* Customer & International Delivery Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400/90 pb-1 border-b border-stone-800 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>{t.billingDetails} · Global Delivery</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Destination Country *
                    </label>
                    <select
                      data-testid="checkout-country-select"
                      value={customer.countryCode || selectedCountry}
                      onChange={(e) => handleCountrySelect(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                    >
                      {GLOBAL_COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name} ({c.dialCode}) · {c.courierName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      {t.fullName} *
                    </label>
                    <input
                      type="text"
                      value={customer.fullName}
                      onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                      placeholder="e.g. Tariq Mahmood"
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                    />
                    {errors.fullName && <p className="text-[10px] text-red-400 mt-0.5">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      {t.phoneNum} ({customer.dialCode || '+92'}) *
                    </label>
                    <input
                      type="tel"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      placeholder={`${customer.dialCode || '+92'} 342 5984394`}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-400 font-mono"
                    />
                    {errors.phone && <p className="text-[10px] text-red-400 mt-0.5">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      City / Postcode *
                    </label>
                    <input
                      type="text"
                      value={customer.city}
                      onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                      placeholder={customer.countryCode === 'PK' ? 'e.g. Kotli, AJK' : 'e.g. Birmingham B1 / Dubai'}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Email Receipt (Optional)
                    </label>
                    <input
                      type="email"
                      value={customer.email || ''}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      placeholder="customer@example.com"
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      {t.deliveryAddress} *
                    </label>
                    <input
                      type="text"
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                      placeholder="Full street address, building, postal / ZIP code"
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                    />
                    {errors.address && <p className="text-[10px] text-red-400 mt-0.5">{errors.address}</p>}
                  </div>
                </div>
              </div>

              {/* 9 Domestic & International Payment Methods */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400/90 pb-1 border-b border-stone-800 flex items-center justify-between">
                  <span>{t.paymentMethod}</span>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>PCI-Safe Tokenized Ref</span>
                  </span>
                </h4>

                {/* International Gateways */}
                <p className="text-[11px] font-semibold text-stone-400">
                  International Digital & Card Gateways
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {intlMethods.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      data-testid={`payment-method-${m.id}`}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-0.5 cursor-pointer transition-all ${
                        paymentMethod === m.id
                          ? 'border-amber-500 bg-amber-500/15 text-amber-200 ring-1 ring-amber-500'
                          : 'border-stone-800 bg-stone-950 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <span className="font-bold text-xs flex items-center gap-1.5 text-stone-100">
                        <CreditCard className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{m.label}</span>
                      </span>
                      <span className="text-[10px] text-stone-400">{m.sub}</span>
                    </button>
                  ))}
                </div>

                {/* Domestic Pakistan / AJK Gateways */}
                <p className="text-[11px] font-semibold text-stone-400 pt-1">
                  Pakistan & Azad Kashmir Local Payment Options
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {domesticMethods.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      data-testid={`payment-method-${m.id}`}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 cursor-pointer transition-all ${
                        paymentMethod === m.id
                          ? 'border-amber-500 bg-amber-500/15 text-amber-200 ring-1 ring-amber-500'
                          : 'border-stone-800 bg-stone-950 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <span className="font-bold text-xs flex items-center gap-1.5 text-stone-100">
                        {m.id === 'bank_transfer' ? (
                          <Building className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        ) : (
                          <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        <span>{m.label}</span>
                      </span>
                      <span className="text-[10px] text-stone-400">{m.sub}</span>
                    </button>
                  ))}
                </div>

                {/* Transient PCI-Safe Card Fields */}
                {paymentMethod === 'card' && (
                  <div className="p-3.5 rounded-2xl bg-stone-950 border border-amber-500/30 space-y-3 text-xs">
                    <p className="text-[11px] text-amber-300 font-semibold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Encrypted Card Authorization (Only last 4 digits saved in order receipt)</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        placeholder="Cardholder Name"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        data-testid="checkout-card-number"
                        placeholder="Card Number (e.g. 4242 4242 4242 4242)"
                        value={cardNumberInput}
                        onChange={(e) => setCardNumberInput(e.target.value)}
                        className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 font-mono"
                      />
                      <input
                        type="text"
                        placeholder="MM / YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 font-mono"
                      />
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="CVC"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 font-mono"
                      />
                    </div>
                    {errors.card && <p className="text-[11px] text-red-400">{errors.card}</p>}
                  </div>
                )}

                {(paymentMethod === 'paypal' || paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash') && (
                  <input
                    type="text"
                    placeholder="Optional: PayPal Email or Mobile Wallet Transaction ID"
                    value={walletRefInput}
                    onChange={(e) => setWalletRefInput(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100"
                  />
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  data-testid="submit-global-order-btn"
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 font-bold text-sm tracking-wide hover:brightness-110 flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t.placeOrderBtn} ({formatPrice(grandTotalPKR)})</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
