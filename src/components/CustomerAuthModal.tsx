import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import {
  X,
  LogIn,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Sparkles,
  MessageCircle,
  Copy,
  Check,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Globe,
} from 'lucide-react';
import { sanitizePhoneForWhatsApp } from '../utils/logic';
import {
  getCountryByCode,
  GLOBAL_COUNTRIES,
  GLOBAL_CURRENCIES,
  SUPPORTED_LANGUAGES,
} from '../utils/globalBusiness';
import { CurrencyCode, Language } from '../types';
import { OrderTracker } from './OrderTracker';

export const CustomerAuthModal: React.FC = () => {
  const {
    lang,
    setLang,
    currency,
    setCurrency,
    selectedCountry,
    setSelectedCountry,
    visitorTimezone,
    t,
    user,
    firebaseUser,
    signInWithGoogle,
    signOutCloud,
    cloudSync,
    loginUser,
    logoutUser,
    isAuthOpen,
    setIsAuthOpen,
    orders,
    setIsAdminOpen,
    formatPrice,
    addToCart,
    setIsCartOpen,
    shopProfile,
  } = useShop();

  const [mode, setMode] = useState<'login' | 'register' | 'track'>('login');
  const [profileTab, setProfileTab] = useState<'orders' | 'track'>('orders');
  const [trackingOrderId, setTrackingOrderId] = useState<string>('');
  const [orderFilter, setOrderFilter] = useState<'all' | 'active' | 'delivered'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regCountryCode, setRegCountryCode] = useState(selectedCountry || 'PK');
  const [regCity, setRegCity] = useState('');
  const [regLang, setRegLang] = useState<Language>(lang);
  const [regCurrency, setRegCurrency] = useState<CurrencyCode>(currency);

  if (!isAuthOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'register' && !name.trim()) return;
    if (!email.trim() && !phone.trim()) return;

    const countryCfg = getCountryByCode(regCountryCode);
    setSelectedCountry(countryCfg.code);
    setLang(regLang);
    setCurrency(regCurrency);

    loginUser(
      name.trim() || 'Valued Global Patron',
      email.trim() || 'customer@sitarakotli.com',
      phone.trim() || '03425984394',
      'customer',
      {
        country: countryCfg.name,
        countryCode: countryCfg.code,
        timezone: visitorTimezone || countryCfg.primaryTimezone,
        preferredLanguage: regLang,
        preferredCurrency: regCurrency,
        city: regCity.trim() || (countryCfg.code === 'PK' ? 'Kotli' : ''),
      }
    );
  };

  const handleDemoLogin = () => {
    const countryCfg = getCountryByCode(selectedCountry);
    loginUser('Chaudhry Tanveer Ahmed', 'tanveer.ahmed@yahoo.com', '03425984394', 'customer', {
      country: countryCfg.name,
      countryCode: countryCfg.code,
      timezone: visitorTimezone,
      preferredLanguage: lang,
      preferredCurrency: currency,
    });
  };

  const handleTrackSpecificOrder = (orderNumber: string) => {
    setTrackingOrderId(orderNumber);
    setProfileTab('track');
  };

  const handleCopyOrderId = (orderNumber: string) => {
    navigator.clipboard?.writeText(orderNumber);
    setCopiedOrderId(orderNumber);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const handleReorder = (orderItems: typeof orders[0]['items']) => {
    orderItems.forEach((item) => {
      addToCart(item.product, item.quantity, item.selectedColor);
    });
    setIsAuthOpen(false);
    setIsCartOpen(true);
  };

  const userOrders = user
    ? orders.filter(
        (o) =>
          o.customer.phone === user.phone ||
          o.customer.fullName.toLowerCase().includes(user.name.toLowerCase()) ||
          user.name.toLowerCase().includes(o.customer.fullName.toLowerCase())
      )
    : [];

  const filteredOrders = userOrders.filter((ord) => {
    if (orderFilter === 'active') {
      return ord.status === 'confirmed' || ord.status === 'processing' || ord.status === 'shipped';
    }
    if (orderFilter === 'delivered') {
      return ord.status === 'delivered';
    }
    return true;
  });

  const waNumber = sanitizePhoneForWhatsApp(shopProfile.whatsapp || '03425984394');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl my-8">
        <button
          type="button"
          onClick={() => setIsAuthOpen(false)}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-full transition-colors cursor-pointer"
          aria-label="Close user modal"
        >
          <X className="w-5 h-5" />
        </button>

        {user ? (
          /* Logged In Customer Profile */
          <div className="space-y-5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-800">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-2xl object-cover border border-amber-500/40"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-lg font-bold font-serif-luxury">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-serif-luxury text-base sm:text-lg font-bold text-stone-100 flex flex-wrap items-center gap-2">
                    <span>{user.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      Sitara Global Club
                    </span>
                    {firebaseUser && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        Cloud Verified
                      </span>
                    )}
                  </h3>
                  <p className="text-stone-400 font-mono">
                    {user.phone} · {user.email}
                  </p>
                  <p className="text-amber-400/90 text-[11px] flex items-center gap-1.5 mt-0.5">
                    <Globe className="w-3 h-3" />
                    <span>
                      {user.country || getCountryByCode(selectedCountry).name} ·{' '}
                      {(user.preferredLanguage || lang).toUpperCase()} · {user.preferredCurrency || currency}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProfileTab('track')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-stone-950 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Track Order Status by ID"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{lang === 'ur' ? 'آرڈر ٹریک کریں' : 'Track Order'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (firebaseUser) {
                      signOutCloud().catch(() => logoutUser());
                    } else {
                      logoutUser();
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  {lang === 'ur' ? 'لاگ آؤٹ' : 'Log Out'}
                </button>
              </div>
            </div>

            {/* Profile Navigation Tabs */}
            <div className="flex rounded-xl bg-stone-950 p-1 border border-stone-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setProfileTab('orders')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  profileTab === 'orders'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{lang === 'ur' ? `آرڈرز ہسٹری (${userOrders.length})` : `Order History (${userOrders.length})`}</span>
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('track')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  profileTab === 'track'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{t.orderTrackingTitle}</span>
              </button>
            </div>

            {profileTab === 'orders' ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-stone-200 uppercase tracking-wider text-[11px]">
                      {lang === 'ur' ? 'آپ کے پچھلے آرڈرز اور اسٹیٹس' : 'Your Previous Orders & Live Status'}
                    </h4>
                    <p className="text-[11px] text-stone-400">
                      Worldwide & local orders placed with Sitara Cloth House Kotli
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
                    <button
                      type="button"
                      onClick={() => setOrderFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        orderFilter === 'all'
                          ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      All ({userOrders.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderFilter('active')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        orderFilter === 'active'
                          ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderFilter('delivered')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        orderFilter === 'delivered'
                          ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      Delivered
                    </button>
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-stone-950/70 border border-stone-800 text-center space-y-3">
                    <ShoppingBag className="w-10 h-10 text-stone-600 mx-auto" />
                    <p className="text-stone-300 font-semibold text-sm">
                      No orders found in this view.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsAuthOpen(false)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Start Shopping Now</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {filteredOrders.map((ord) => {
                      const isExpanded = expandedOrderId === ord.id;
                      return (
                        <div
                          key={ord.id}
                          className="rounded-2xl bg-stone-950 border border-stone-800/90 hover:border-amber-500/40 transition-all overflow-hidden shadow-sm"
                        >
                          <div className="p-4 flex flex-wrap justify-between items-center gap-3 bg-gradient-to-r from-stone-950 via-stone-900/60 to-stone-950">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-amber-400 font-bold text-sm sm:text-base">
                                  {ord.orderNumber}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyOrderId(ord.orderNumber)}
                                  className="text-stone-400 hover:text-amber-300 transition-colors p-1"
                                  title="Copy Order ID"
                                >
                                  {copiedOrderId === ord.orderNumber ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold border bg-amber-950/80 text-amber-300 border-amber-500/40">
                                  {ord.status}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-amber-400/80" />
                                  <span>{ord.date}</span>
                                </span>
                                <span>·</span>
                                <span>{ord.items.length} items</span>
                                <span>·</span>
                                <span className="font-bold text-stone-200">{formatPrice(ord.total)}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleTrackSpecificOrder(ord.orderNumber)}
                                className="px-3 py-1.5 rounded-xl bg-amber-500 text-stone-950 hover:brightness-110 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>Live Track</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                                className="p-1.5 rounded-xl bg-stone-800 text-stone-300 hover:text-white transition-colors cursor-pointer"
                                aria-label="Toggle Order Details"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-4 space-y-3 bg-stone-900/40 text-xs border-t border-stone-800">
                              <div className="space-y-1 bg-stone-950 p-2.5 rounded-xl border border-stone-800 text-[11px]">
                                <p className="text-stone-400 font-bold flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-amber-400" />
                                  <span>
                                    {ord.customer.address}, {ord.customer.city},{' '}
                                    {ord.customer.country || ord.customer.provinceOrState}
                                  </span>
                                </p>
                                {ord.paymentReference && (
                                  <p className="font-mono text-emerald-400">Ref: {ord.paymentReference}</p>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                <a
                                  href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                                    `Assalam-o-Alaikum Awais Malik, inquiry about Order ${ord.orderNumber}`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 text-xs font-semibold transition-all"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>WhatsApp Support</span>
                                </a>

                                <button
                                  type="button"
                                  onClick={() => handleReorder(ord.items)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-stone-950 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Re-order</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-1">
                <OrderTracker
                  initialOrderId={trackingOrderId || (userOrders.length > 0 ? userOrders[0].orderNumber : undefined)}
                  compactMode={true}
                />
              </div>
            )}
          </div>
        ) : (
          /* International Guest / Registration Tabs */
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <h3 className="font-serif-luxury text-xl font-bold text-stone-100">
                {mode === 'login'
                  ? 'Global Customer Sign In'
                  : mode === 'register'
                  ? 'International Customer Registration'
                  : t.orderTrackingTitle}
              </h3>
              <p className="text-stone-400 text-xs">
                {mode === 'track'
                  ? t.orderTrackingSubtitle
                  : 'Sitara Cloth House Worldwide Club · Kotli Showroom & Global Dispatch'}
              </p>
            </div>

            <div className="flex rounded-xl bg-stone-950 p-1 border border-stone-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'login' ? 'bg-amber-500 text-stone-950 font-bold shadow' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'register' ? 'bg-amber-500 text-stone-950 font-bold shadow' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                International Register
              </button>
              <button
                type="button"
                onClick={() => setMode('track')}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'track' ? 'bg-amber-500 text-stone-950 font-bold shadow' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Track Order
              </button>
            </div>

            {mode === 'track' ? (
              <OrderTracker compactMode={true} />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                {mode === 'register' && (
                  <>
                    <div>
                      <label className="block text-stone-300 font-semibold mb-1">Full Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Raja Kamran / Sarah Ahmed"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-stone-300 font-semibold mb-1">Country *</label>
                        <select
                          value={regCountryCode}
                          onChange={(e) => setRegCountryCode(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-400"
                        >
                          {GLOBAL_COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.flag} {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-stone-300 font-semibold mb-1">City</label>
                        <input
                          type="text"
                          placeholder="e.g. London / Dubai / Kotli"
                          value={regCity}
                          onChange={(e) => setRegCity(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-stone-300 font-semibold mb-1">Preferred Language</label>
                        <select
                          value={regLang}
                          onChange={(e) => setRegLang(e.target.value as Language)}
                          className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-400"
                        >
                          {SUPPORTED_LANGUAGES.map((l) => (
                            <option key={l.code} value={l.code}>
                              {l.flag} {l.nativeName} ({l.name})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-stone-300 font-semibold mb-1">Preferred Currency</label>
                        <select
                          value={regCurrency}
                          onChange={(e) => setRegCurrency(e.target.value as CurrencyCode)}
                          className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 focus:outline-none focus:border-amber-400"
                        >
                          {GLOBAL_CURRENCIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.flag} {c.code} ({c.symbol})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">
                    Phone Number ({getCountryByCode(regCountryCode).dialCode} / WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +44 7700 900077 or 03425984394"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. customer@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  {mode === 'login' ? 'Sign In to View Order History' : 'Create Global Customer Account'}
                </button>

                <div className="pt-2 space-y-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      signInWithGoogle().catch(() => {});
                    }}
                    className="w-full py-2.5 rounded-xl bg-white text-stone-900 hover:bg-stone-100 text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-amber-600" />
                    <span>{t.cloudSignInGoogle} (Global Cloud Sync)</span>
                  </button>

                  {cloudSync.lastError && (
                    <p className="text-[11px] text-rose-400">{cloudSync.lastError}</p>
                  )}

                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    className="w-full py-2 rounded-xl bg-stone-950 border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick Customer Login (Chaudhry Tanveer Ahmed)</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-stone-800 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAuthOpen(false);
                      setIsAdminOpen(true);
                    }}
                    className="text-stone-400 hover:text-amber-400 text-xs flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Store Owner or Admin? Sign in as <strong className="text-amber-300">Awais Malik</strong></span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
