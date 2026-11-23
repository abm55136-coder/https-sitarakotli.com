import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { Order, OrderStatus } from '../types';
import {
  Search,
  Package,
  Clock,
  Scissors,
  Truck,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  User,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { findOrderByQuery, getOrderTimeline, sanitizePhoneForWhatsApp } from '../utils/logic';

interface OrderTrackerProps {
  initialOrderId?: string;
  onClose?: () => void;
  compactMode?: boolean;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({
  initialOrderId,
  onClose,
  compactMode = false,
}) => {
  const { lang, t, orders, shopProfile, formatPrice } = useShop();

  const [searchQuery, setSearchQuery] = useState(initialOrderId || '');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (initialOrderId && initialOrderId.trim().length > 0) {
      setSearchQuery(initialOrderId);
      const matched = findOrderByQuery(orders, initialOrderId);
      setSearchedOrder(matched || null);
      setHasSearched(true);
    }
  }, [initialOrderId, orders]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    const matched = findOrderByQuery(orders, searchQuery);
    setSearchedOrder(matched || null);
    setHasSearched(true);
  };

  const handleSelectSample = (orderNum: string) => {
    setSearchQuery(orderNum);
    const matched = findOrderByQuery(orders, orderNum);
    setSearchedOrder(matched || null);
    setHasSearched(true);
  };

  const handleLiveRefresh = () => {
    if (!searchQuery.trim() && !searchedOrder) return;
    setIsRefreshing(true);
    setTimeout(() => {
      const q = searchedOrder ? searchedOrder.orderNumber : searchQuery;
      const matched = findOrderByQuery(orders, q);
      setSearchedOrder(matched || null);
      setIsRefreshing(false);
    }, 450);
  };

  const timeline = searchedOrder ? getOrderTimeline(searchedOrder) : null;
  const waNumber = sanitizePhoneForWhatsApp(shopProfile.whatsapp || '03425984394');

  const getStatusProgress = (status?: OrderStatus): { percent: number; colorClass: string; label: string } => {
    switch (status) {
      case 'cancelled':
        return { percent: 100, colorClass: 'bg-red-500', label: lang === 'ur' ? 'منسوخ شدہ' : 'Cancelled' };
      case 'delivered':
        return { percent: 100, colorClass: 'bg-emerald-500', label: lang === 'ur' ? 'کامیابی سے پہنچ گیا' : 'Delivered' };
      case 'shipped':
        return { percent: 75, colorClass: 'bg-blue-500', label: lang === 'ur' ? 'راستے میں ہے (75%)' : 'In Transit (75%)' };
      case 'processing':
      case 'confirmed':
        return { percent: 50, colorClass: 'bg-amber-500', label: lang === 'ur' ? 'پیکنگ و تیاری جاری (50%)' : 'Processing (50%)' };
      case 'pending':
      default:
        return { percent: 25, colorClass: 'bg-amber-400', label: lang === 'ur' ? 'آرڈر موصول ہو گیا (25%)' : 'Order Placed (25%)' };
    }
  };

  const getStepIcon = (key: string, state: string) => {
    switch (key) {
      case 'pending':
        return <Clock className={`w-5 h-5 ${state === 'completed' || state === 'current' ? 'text-amber-400' : 'text-stone-500'}`} />;
      case 'processing':
        return <Scissors className={`w-5 h-5 ${state === 'completed' || state === 'current' ? 'text-amber-400' : 'text-stone-500'}`} />;
      case 'shipped':
        return <Truck className={`w-5 h-5 ${state === 'completed' || state === 'current' ? 'text-amber-400' : 'text-stone-500'}`} />;
      case 'delivered':
        return <CheckCircle2 className={`w-5 h-5 ${state === 'completed' ? 'text-emerald-400' : 'text-stone-500'}`} />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
            {lang === 'ur' ? 'کامیابی سے پہنچ گیا' : 'Delivered'}
          </span>
        );
      case 'shipped':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-950/80 border border-blue-500/40 text-blue-300">
            {lang === 'ur' ? 'روانہ کر دیا گیا' : 'Shipped / In Transit'}
          </span>
        );
      case 'processing':
      case 'confirmed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 border border-amber-500/40 text-amber-300">
            {lang === 'ur' ? 'پیکنگ و تیاری جاری' : 'Processing & Packaging'}
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-950/80 border border-red-500/40 text-red-300">
            {lang === 'ur' ? 'منسوخ شدہ' : 'Cancelled'}
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-800 border border-amber-500/30 text-amber-300">
            {lang === 'ur' ? 'زیرِ التواء / موصول شدہ' : 'Pending / Order Placed'}
          </span>
        );
    }
  };

  return (
    <div className={`space-y-5 ${compactMode ? 'p-1' : 'p-4 sm:p-6 bg-stone-900/90 border border-amber-500/30 rounded-3xl shadow-2xl'}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-luxury text-base sm:text-lg font-bold text-stone-100 flex items-center gap-2">
              <span>{t.orderTrackingTitle}</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-xs text-stone-400 line-clamp-1">{t.orderTrackingSubtitle}</p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close tracking"
          >
            ✕
          </button>
        )}
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.orderIdInputPlaceholder}
              className="w-full bg-stone-950 border border-stone-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400 font-mono tracking-wider transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 text-xs cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 sm:px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 font-bold text-xs sm:text-sm hover:brightness-110 shadow-md shadow-amber-500/20 transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            <span>{t.trackOrderBtn}</span>
          </button>
        </div>

        {orders.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-stone-400">
            <span>{lang === 'ur' ? 'حالیہ آرڈرز:' : 'Recent Orders:'}</span>
            {orders.slice(0, 3).map((ord) => (
              <button
                key={ord.id}
                type="button"
                onClick={() => handleSelectSample(ord.orderNumber)}
                className={`px-2 py-0.5 rounded-lg border font-mono transition-colors cursor-pointer ${
                  searchQuery.toUpperCase().includes(ord.orderNumber.toUpperCase())
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                    : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-amber-500/40 hover:text-amber-400'
                }`}
              >
                {ord.orderNumber}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* RESULTS DISPLAY */}
      {searchedOrder && timeline ? (
        <div className="space-y-5 rounded-2xl bg-stone-950/80 border border-amber-900/40 p-4 sm:p-5">
          {/* Order Header Summary Card */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-800/80">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-base sm:text-lg font-bold text-amber-400">
                  {searchedOrder.orderNumber}
                </span>
                {getStatusBadge(searchedOrder.status)}
              </div>
              <p className="text-xs text-stone-400 mt-1 flex flex-wrap items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                <span>{searchedOrder.date}</span>
                <span>·</span>
                <User className="w-3.5 h-3.5 text-stone-500" />
                <span className="text-stone-200 font-semibold">{searchedOrder.customer.fullName}</span>
                <span>·</span>
                <MapPin className="w-3.5 h-3.5 text-stone-500" />
                <span>
                  {searchedOrder.customer.city}
                  {searchedOrder.customer.country ? `, ${searchedOrder.customer.country}` : ''}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleLiveRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500/40 text-stone-300 hover:text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Refresh Live Order Status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : 'text-stone-400'}`} />
                <span className="hidden sm:inline">{isRefreshing ? 'Checking...' : 'Refresh Status'}</span>
              </button>

              <div className="text-right">
                <span className="block text-[11px] text-stone-400 uppercase font-mono tracking-wider">
                  Total ({searchedOrder.orderCurrency || 'PKR'})
                </span>
                <span className="font-serif-luxury text-lg sm:text-xl font-bold text-amber-300">
                  {formatPrice(searchedOrder.total)}
                </span>
              </div>
            </div>
          </div>

          {/* VISUAL PROGRESS TRACKER */}
          {!timeline.isCancelled && (
            <div className="p-4 rounded-2xl bg-stone-900/80 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-200">
                  {lang === 'ur' ? 'لائیو اسٹیٹس پروگریس' : 'Live Shipment Progress'}
                </span>
                <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                  {getStatusProgress(searchedOrder.status).label}
                </span>
              </div>

              <div className="relative w-full h-2.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                <div
                  className={`h-full transition-all duration-700 ease-out rounded-full ${getStatusProgress(searchedOrder.status).colorClass}`}
                  style={{ width: `${getStatusProgress(searchedOrder.status).percent}%` }}
                />
              </div>

              <div className="grid grid-cols-4 text-[10px] sm:text-xs text-stone-400 pt-1 text-center font-medium">
                <div className={searchedOrder.status ? 'text-amber-300 font-bold' : ''}>1. Placed</div>
                <div className={['processing', 'confirmed', 'shipped', 'delivered'].includes(searchedOrder.status) ? 'text-amber-300 font-bold' : ''}>
                  2. Processing
                </div>
                <div className={['shipped', 'delivered'].includes(searchedOrder.status) ? 'text-blue-300 font-bold' : ''}>
                  3. In Transit
                </div>
                <div className={searchedOrder.status === 'delivered' ? 'text-emerald-400 font-bold' : ''}>
                  4. Delivered
                </div>
              </div>

              {/* Dynamic Global Courier & Reference Details */}
              <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-400">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Courier:{' '}
                    <strong className="text-stone-200">
                      {searchedOrder.courier || 'Kotli Express / TCS Logistics'}
                    </strong>
                  </span>
                </div>
                {searchedOrder.paymentReference && (
                  <div className="font-mono text-amber-400/90">
                    Ref: {searchedOrder.paymentReference}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cancelled Notice */}
          {timeline.isCancelled && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-200">
                  {lang === 'ur' ? 'یہ آرڈر منسوخ کر دیا گیا ہے' : 'This order has been cancelled'}
                </p>
                <p className="text-stone-300 mt-0.5">
                  {lang === 'ur'
                    ? 'مزید معلومات یا دوبارہ آرڈر کرنے کے لیے ہمارے کوٹلی شو روم سے واٹس ایپ پر رابطہ کریں۔'
                    : 'If this was an error or you need assistance, please contact Sitara Cloth House on WhatsApp.'}
                </p>
              </div>
            </div>
          )}

          {/* STATUS TIMELINE */}
          <div>
            <h4 className="font-bold text-stone-200 uppercase tracking-wider text-[11px] mb-4 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.trackingTimelineTitle}</span>
            </h4>

            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-[15px] sm:before:left-[19px] before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-800">
              {timeline.steps.map((step) => {
                const isCompleted = step.state === 'completed';
                const isCurrent = step.state === 'current';

                return (
                  <div key={step.key} className="relative group">
                    <div
                      className={`absolute -left-[24px] sm:-left-[28px] top-0.5 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-emerald-950 border-2 border-emerald-400 text-emerald-400 shadow-md shadow-emerald-500/20'
                          : isCurrent
                          ? 'bg-amber-950 border-2 border-amber-400 text-amber-300 shadow-lg shadow-amber-400/30'
                          : 'bg-stone-900 border border-stone-700 text-stone-500'
                      }`}
                    >
                      {getStepIcon(step.key, step.state)}
                    </div>

                    <div
                      className={`p-3 sm:p-4 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-gradient-to-r from-amber-950/40 via-stone-900 to-stone-900 border-amber-500/40'
                          : isCompleted
                          ? 'bg-stone-900/60 border-stone-800'
                          : 'bg-stone-900/30 border-stone-800/40 opacity-60'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                        <span
                          className={`font-bold text-xs sm:text-sm ${
                            isCurrent
                              ? 'text-amber-300'
                              : isCompleted
                              ? 'text-stone-100'
                              : 'text-stone-400'
                          }`}
                        >
                          {lang === 'ur' ? step.titleUrdu : step.title}
                        </span>

                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                            isCompleted
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                              : isCurrent
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30 font-bold'
                              : 'bg-stone-800 text-stone-500'
                          }`}
                        >
                          {isCompleted
                            ? lang === 'ur' ? 'مکمل' : 'Completed'
                            : isCurrent
                            ? lang === 'ur' ? 'جاری ہے' : 'In Progress'
                            : lang === 'ur' ? 'اگلا مرحلہ' : 'Pending'}
                        </span>
                      </div>

                      <p className="text-xs text-stone-400 leading-relaxed">
                        {lang === 'ur' ? step.descriptionUrdu : step.description}
                      </p>

                      {step.estimatedTime && (
                        <div className="mt-2 text-[11px] text-stone-500 font-mono flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-amber-500/60" />
                          <span>{step.estimatedTime}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Toggle Full Order Items */}
          <div className="pt-2 border-t border-stone-800/80">
            <button
              type="button"
              onClick={() => setShowItemDetails(!showItemDetails)}
              className="w-full py-2 px-3 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500/40 text-stone-300 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                <span>
                  {t.viewOrderDetails} ({searchedOrder.items.length} {lang === 'ur' ? 'کپڑے' : 'items'})
                </span>
              </span>
              {showItemDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showItemDetails && (
              <div className="mt-3 p-3.5 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-stone-300 pb-2 border-b border-stone-800">
                  <div>
                    <span className="text-stone-400 block font-mono uppercase text-[10px]">
                      Delivery Destination
                    </span>
                    <p className="font-semibold text-stone-200">
                      {searchedOrder.customer.address}, {searchedOrder.customer.city}
                    </p>
                    <p className="text-stone-400">
                      {searchedOrder.customer.country || searchedOrder.customer.provinceOrState}
                    </p>
                    <p className="font-mono text-amber-400/90">{searchedOrder.customer.phone}</p>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-stone-400 block font-mono uppercase text-[10px]">
                      Payment & Courier
                    </span>
                    <p className="uppercase font-bold text-emerald-400">
                      {searchedOrder.paymentMethod}{' '}
                      {searchedOrder.paymentStatus ? `(${searchedOrder.paymentStatus})` : ''}
                    </p>
                    <p className="text-stone-400">
                      Shipping: {searchedOrder.shippingFee === 0 ? 'FREE Delivery' : formatPrice(searchedOrder.shippingFee)}
                    </p>
                    {searchedOrder.paymentReference && (
                      <p className="text-stone-300 font-mono">{searchedOrder.paymentReference}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {searchedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-stone-950 border border-stone-800/80 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.product.image}
                          alt={item.product.title}
                          className="w-10 h-10 object-cover rounded-lg border border-amber-900/30 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-stone-100 text-xs line-clamp-1">
                            {lang === 'ur' ? item.product.titleUrdu : item.product.title}
                          </p>
                          <p className="text-[10px] text-stone-400 font-mono">
                            {item.product.sku} · {item.product.cutMeters}
                            {item.selectedColor ? ` · ${item.selectedColor}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-amber-300">{formatPrice(item.product.price * item.quantity)}</p>
                        <p className="text-[10px] text-stone-400">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                `Assalam-o-Alaikum Sitara Cloth House, I am inquiring about my Order #${searchedOrder.orderNumber} for ${searchedOrder.customer.fullName}. Could you please share delivery update?`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[200px] py-2.5 px-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'ur' ? 'واٹس ایپ پر ڈلیوری تصدیق کریں' : 'Confirm on WhatsApp'}</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setSearchedOrder(null);
                setSearchQuery('');
                setHasSearched(false);
              }}
              className="py-2.5 px-4 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              {t.trackAnotherOrder}
            </button>
          </div>
        </div>
      ) : hasSearched ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-stone-950/80 border border-amber-900/30 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-serif-luxury font-bold text-stone-200 text-sm sm:text-base">
              {lang === 'ur' ? 'کوئی آرڈر نہیں ملا' : 'Order Not Found'}
            </h4>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">{t.orderNotFoundMsg}</p>
          </div>

          <div className="pt-2">
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                `Assalam-o-Alaikum Sitara Cloth House Kotli, I could not find my order with ID "${searchQuery}". Please check your showroom records.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-semibold hover:bg-emerald-900 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'ur' ? 'دکان دار سے رابطہ کریں' : 'Contact Sitara Shop on WhatsApp'}</span>
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export const OrderTracking = OrderTracker;
