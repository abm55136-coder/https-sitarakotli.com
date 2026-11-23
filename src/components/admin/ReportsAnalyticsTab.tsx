import React, { useMemo, useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { ReportPeriod } from '../../types';
import { calculateProfitReport, formatPKR } from '../../utils/logic';
import { BarChart3, Sparkles, TrendingUp, Package, Loader2 } from 'lucide-react';

export const ReportsAnalyticsTab: React.FC = () => {
  const { lang, orders, invoices, products, purchases, khataAccounts, suppliers } = useShop();
  const isUrdu = lang === 'ur';

  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [referenceDate, setReferenceDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [copyProductId, setCopyProductId] = useState<string>(products[0]?.id || '');
  const [generatedCopy, setGeneratedCopy] = useState<string | null>(null);
  const [copyLoading, setCopyLoading] = useState<boolean>(false);

  const summary = useMemo(
    () =>
      calculateProfitReport(
        orders,
        invoices,
        products,
        purchases,
        khataAccounts,
        suppliers,
        period,
        referenceDate
      ),
    [orders, invoices, products, purchases, khataAccounts, suppliers, period, referenceDate]
  );

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stockQuantity <= 5).slice(0, 8),
    [products]
  );

  const handleGenerateInsights = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch('/api/ai/business-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'insights',
          lang,
          businessSnapshot: {
            period,
            referenceDate,
            summary,
            lowStockCount: lowStockProducts.length,
            lowStockSkus: lowStockProducts.map((p) => ({
              title: p.title,
              stock: p.stockQuantity,
              price: p.price,
            })),
            totalCatalogCount: products.length,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAiError(data?.message || 'AI Advisor request could not complete.');
      } else {
        setAiAnalysis(data.analysis);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Network error calling AI service');
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateCopy = async () => {
    const prod = products.find((p) => p.id === copyProductId);
    if (!prod) return;
    setCopyLoading(true);
    setAiError(null);
    try {
      const response = await fetch('/api/ai/business-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'product-copy',
          lang,
          promptContext: {
            title: prod.title,
            titleUrdu: prod.titleUrdu,
            fabricType: prod.fabricType,
            price: prod.price,
            cutMeters: prod.cutMeters,
            season: prod.season,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAiError(data?.message || 'AI Copy request failed.');
      } else {
        setGeneratedCopy(data.analysis);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Network error calling AI service');
    } finally {
      setCopyLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Period Switcher Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#16161a] border border-[#d4af37]/30">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#d4af37]" />
            <span>{isUrdu ? 'منافع و نقصان رپورٹس اور اے آئی ایڈوائزر' : 'Profit Reports & AI Business Advisor'}</span>
          </h3>
          <p className="text-xs text-gray-400">
            {isUrdu
              ? 'روزانہ، ماہانہ اور سالانہ سیلز، لاگت اور خالص منافع کا مکمل جائزہ۔'
              : 'Real-time Daily, Monthly & Yearly Gross Revenue, COGS Profit Margin, and AI Strategy.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-black/60 p-1 border border-white/15 text-xs">
            {(['daily', 'monthly', 'yearly'] as ReportPeriod[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg capitalize font-semibold cursor-pointer ${
                  period === p ? 'bg-[#d4af37] text-black font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={referenceDate}
            onChange={(e) => setReferenceDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white font-mono"
          />
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#16161a] border border-white/10">
          <p className="text-[11px] text-gray-400 uppercase">Gross Revenue ({summary.salesCount} bills)</p>
          <p className="text-lg font-bold font-mono text-white mt-1">{formatPKR(summary.grossRevenue)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#16161a] border border-white/10">
          <p className="text-[11px] text-gray-400 uppercase">Estimated COGS</p>
          <p className="text-lg font-bold font-mono text-amber-300 mt-1">{formatPKR(summary.estimatedCOGS)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#16161a] border border-emerald-500/30">
          <p className="text-[11px] text-gray-400 uppercase">Gross Profit ({summary.profitMarginPercent}%)</p>
          <p className="text-lg font-bold font-mono text-emerald-400 mt-1">{formatPKR(summary.grossProfit)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#16161a] border border-white/10">
          <p className="text-[11px] text-gray-400 uppercase">Purchase Spend</p>
          <p className="text-lg font-bold font-mono text-sky-300 mt-1">{formatPKR(summary.purchaseSpend)}</p>
        </div>
      </div>

      {/* Top Selling Fabrics & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-4 rounded-2xl bg-[#16161a] border border-white/10 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>{isUrdu ? 'زیادہ فروخت ہونے والے ملبوسات' : 'Top Performing Fabrics'}</span>
          </h4>
          {summary.topProducts.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">
              No sales in this {period} window yet. Adjust period/date or create a POS invoice.
            </p>
          ) : (
            <div className="space-y-2">
              {summary.topProducts.map((tp) => (
                <div
                  key={tp.title}
                  className="p-2.5 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-white truncate pr-2">{tp.title}</span>
                  <div className="text-right shrink-0 font-mono">
                    <span className="text-[#d4af37] font-bold">{formatPKR(tp.revenue)}</span>
                    <span className="text-[10px] text-gray-400 ml-2">({tp.unitsSold} pcs)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-[#16161a] border border-white/10 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Package className="w-4 h-4" />
            <span>{isUrdu ? 'کم اسٹاک انتباہ (5 یا کم)' : 'Low Stock Restock Alerts (<= 5)'}</span>
          </h4>
          {lowStockProducts.length === 0 ? (
            <p className="text-xs text-emerald-400 py-6 text-center">
              All catalog fabrics are healthy in stock!
            </p>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-xl bg-black/50 border border-amber-500/20 flex items-center justify-between text-xs"
                >
                  <span className="text-white truncate pr-2">{p.title}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold shrink-0">
                    {p.stockQuantity} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Business Insights & Product Copy Assistant */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#191622] to-[#121216] border border-[#d4af37]/40 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              <span>{isUrdu ? 'اسمارٹ اے آئی بزنس ایڈوائزر' : 'Sitara AI Financial & Merchandising Advisor'}</span>
            </h4>
            <p className="text-xs text-gray-400">
              {isUrdu
                ? 'سرور سائیڈ محفوظ AI آپ کی سیلز، کھاتہ اور اسٹاک کا تجزیہ کرتا ہے۔'
                : 'Server-side AI analyzes live sales, profit margins, Khata receivables, and stock levels.'}
            </p>
          </div>
          <button
            type="button"
            disabled={aiLoading}
            onClick={handleGenerateInsights}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-amber-500 text-black font-bold text-xs flex items-center gap-2 hover:brightness-110 disabled:opacity-60 cursor-pointer"
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isUrdu ? 'مکمل بزنس تجزیہ حاصل کریں' : 'Analyze Live Store Performance'}</span>
          </button>
        </div>

        {aiError && (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs">
            {aiError}
          </div>
        )}

        {aiAnalysis && (
          <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs text-stone-200 whitespace-pre-wrap leading-relaxed">
            {aiAnalysis}
          </div>
        )}

        {/* Quick AI Bilingual Fabric Copy */}
        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
          <select
            value={copyProductId}
            onChange={(e) => setCopyProductId(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({formatPKR(p.price)})
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={copyLoading}
            onClick={handleGenerateCopy}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#d4af37] font-bold border border-[#d4af37]/30 flex items-center gap-1.5 cursor-pointer"
          >
            {copyLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Generate Bilingual WhatsApp Ad Copy</span>
          </button>
        </div>

        {generatedCopy && (
          <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-xs text-stone-200 whitespace-pre-wrap">
            {generatedCopy}
          </div>
        )}
      </div>
    </div>
  );
};
