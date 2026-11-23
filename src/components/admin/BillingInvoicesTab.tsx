import React, { useMemo, useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { CloudInvoice, InvoiceItem } from '../../types';
import { calculateInvoiceTotals, formatPKR } from '../../utils/logic';
import {
  FileText,
  Plus,
  Printer,
  Trash2,
  CheckCircle2,
  Receipt,
  Search,
  UserCheck,
  X,
} from 'lucide-react';

export const BillingInvoicesTab: React.FC = () => {
  const {
    lang,
    products,
    khataAccounts,
    staffMembers,
    invoices,
    createCloudInvoice,
    shopProfile,
    adminProfile,
  } = useShop();

  const isUrdu = lang === 'ur';

  const [selectedKhataId, setSelectedKhataId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [salesmanName, setSalesmanName] = useState<string>(adminProfile.name);
  const [paymentType, setPaymentType] = useState<CloudInvoice['paymentType']>('cash');
  const [discount, setDiscount] = useState<number>(0);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(0);
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');
  const [billItems, setBillItems] = useState<InvoiceItem[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<CloudInvoice | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products.slice(0, 12);
    return products
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.fabricType.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [products, productSearch]);

  const handleKhataSelect = (id: string) => {
    setSelectedKhataId(id);
    if (!id) return;
    const acc = khataAccounts.find((k) => k.id === id);
    if (acc) {
      setCustomerName(acc.customerName);
      setCustomerPhone(acc.phone);
    }
  };

  const handleAddProductToBill = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    setBillItems((prev) => {
      const idx = prev.findIndex((it) => it.productId === prod.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          quantity: copy[idx].quantity + 1,
          lineTotal: (copy[idx].quantity + 1) * copy[idx].unitPrice,
        };
        return copy;
      }
      const unitCost =
        prod.costPrice !== undefined ? Number(prod.costPrice) : Math.round(prod.price * 0.72);
      return [
        ...prev,
        {
          productId: prod.id,
          sku: prod.sku,
          title: prod.title,
          quantity: 1,
          unitPrice: prod.price,
          unitCost,
          lineTotal: prod.price,
        },
      ];
    });
  };

  const updateItemQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      setBillItems((prev) => prev.filter((it) => it.productId !== productId));
      return;
    }
    setBillItems((prev) =>
      prev.map((it) =>
        it.productId === productId
          ? { ...it, quantity: qty, lineTotal: qty * it.unitPrice }
          : it
      )
    );
  };

  const liveTotals = useMemo(() => {
    const parsedPaid =
      paidAmountInput.trim() === '' ? undefined : Math.max(0, Number(paidAmountInput) || 0);
    return calculateInvoiceTotals(
      billItems,
      discount,
      taxRatePercent,
      parsedPaid,
      paymentType
    );
  }, [billItems, discount, taxRatePercent, paidAmountInput, paymentType]);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (billItems.length === 0) return;

    const parsedPaid =
      paidAmountInput.trim() === '' ? undefined : Math.max(0, Number(paidAmountInput) || 0);
    const matchedStaff = staffMembers.find((s) => s.name === salesmanName);

    const created = createCloudInvoice({
      customerId: selectedKhataId || undefined,
      customerName: customerName.trim() || 'Walk-in Showroom Customer',
      customerPhone: customerPhone.trim() || undefined,
      items: billItems,
      discount,
      taxRatePercent,
      paidAmount: parsedPaid,
      paymentType,
      salesmanName,
      salesmanUid: matchedStaff?.id,
      notes: notes.trim() || undefined,
    });

    setSelectedInvoice(created);
    setBillItems([]);
    setDiscount(0);
    setTaxRatePercent(0);
    setPaidAmountInput('');
    setNotes('');
    setStatusMessage(
      isUrdu
        ? `بل ${created.invoiceNumber} کامیابی سے محفوظ اور کلاؤڈ پر سنک ہو گیا!`
        : `Invoice ${created.invoiceNumber} created & synced! Stock updated.`
    );
    setTimeout(() => setStatusMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#16161a] border border-[#d4af37]/30">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#d4af37]" />
            <span>{isUrdu ? 'کلاؤڈ پوائنٹ آف سیل (POS) اور انوائس بلنگ' : 'Cloud POS Billing & Smart Invoices'}</span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {isUrdu
              ? 'فوری بل بنائیں، اسٹاک خودکار کم کریں، ادھار کھاتہ اپڈیٹ کریں اور پرنٹ کریں۔'
              : 'Create instant showroom bills, auto-decrement stock, link customer Khata balances, and print receipts.'}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/10">
            <span className="text-gray-400">Total Invoices: </span>
            <strong className="text-[#d4af37] font-mono">{invoices.length}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/10">
            <span className="text-gray-400">POS Sales: </span>
            <strong className="text-emerald-400 font-mono">
              {formatPKR(invoices.reduce((s, i) => s + i.total, 0))}
            </strong>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* POS Builder Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Product Quick Picker */}
        <div className="lg:col-span-5 p-4 rounded-2xl bg-[#16161a] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
              {isUrdu ? '1. کپڑے / آئٹمز منتخب کریں' : '1. Add Fabrics to Bill'}
            </h4>
            <span className="text-[11px] text-gray-400">{products.length} SKUs</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder={isUrdu ? 'نام یا SKU سے تلاش کریں...' : 'Search by fabric title or SKU...'}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filteredProducts.map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => handleAddProductToBill(prod.id)}
                className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black/50 hover:bg-white/10 border border-white/10 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={prod.image}
                    alt={prod.title}
                    className="w-9 h-9 rounded-lg object-cover border border-white/15 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{prod.title}</p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      {prod.sku} · Stock: {prod.stockQuantity}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 flex items-center gap-2">
                  <span className="text-xs font-bold text-[#d4af37]">{formatPKR(prod.price)}</span>
                  <span className="p-1 rounded-lg bg-[#d4af37]/20 text-[#d4af37]">
                    <Plus className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Invoice Form & Live Totals */}
        <form
          onSubmit={handleCreateInvoice}
          className="lg:col-span-7 p-4 rounded-2xl bg-[#16161a] border border-[#d4af37]/30 space-y-4"
        >
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
            {isUrdu ? '2. گاہک اور بل کی تفصیلات' : '2. Customer & Payment Details'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">
                {isUrdu ? 'کھاتہ اکاؤنٹ لنک کریں (اختیاری)' : 'Link Khata Account (Optional)'}
              </label>
              <select
                value={selectedKhataId}
                onChange={(e) => handleKhataSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-[#d4af37]"
              >
                <option value="">-- Walk-in / New Customer --</option>
                {khataAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.customerName} ({acc.phone}) — Bal: {formatPKR(acc.currentBalance)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-1">
                {isUrdu ? 'سیلز مین' : 'Salesman / Cashier'}
              </label>
              <select
                value={salesmanName}
                onChange={(e) => setSalesmanName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-[#d4af37]"
              >
                <option value={adminProfile.name}>{adminProfile.name} (Owner)</option>
                {staffMembers.map((stf) => (
                  <option key={stf.id} value={stf.name}>
                    {stf.name} ({stf.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-1">
                {isUrdu ? 'گاہک کا نام *' : 'Customer Name *'}
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Haji Tariq Mahmood"
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">
                {isUrdu ? 'فون نمبر' : 'Customer Phone'}
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="03425984394"
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          {/* Selected Bill Items */}
          <div className="rounded-xl bg-black/50 border border-white/10 p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold">
              <span>{isUrdu ? 'منتخب ملبوسات' : 'Bill Line Items'}</span>
              <span>{billItems.length} item(s)</span>
            </div>

            {billItems.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">
                {isUrdu
                  ? 'بائیں جانب سے کوئی کپڑا منتخب کر کے بل میں شامل کریں۔'
                  : 'Click any fabric on the left to add it to this POS invoice.'}
              </p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {billItems.map((it) => (
                  <div
                    key={it.productId}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/5 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white truncate">{it.title}</p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {formatPKR(it.unitPrice)} × {it.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(it.productId, it.quantity - 1)}
                        className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 text-white font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-mono">{it.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(it.productId, it.quantity + 1)}
                        className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 text-white font-bold cursor-pointer"
                      >
                        +
                      </button>
                      <span className="w-20 text-right font-bold text-[#d4af37]">
                        {formatPKR(it.lineTotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(it.productId, 0)}
                        className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discount, Tax, Payment Method, Amount Paid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">Discount (PKR)</label>
              <input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Tax %</label>
              <input
                type="number"
                min={0}
                max={30}
                value={taxRatePercent}
                onChange={(e) => setTaxRatePercent(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Payment Type</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as CloudInvoice['paymentType'])}
                className="w-full px-2.5 py-2 rounded-xl bg-black/60 border border-white/15 text-white"
              >
                <option value="cash">Cash</option>
                <option value="easypaisa">EasyPaisa</option>
                <option value="jazzcash">JazzCash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="khata_credit">Khata Credit (Udhar)</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Cash Paid Now</label>
              <input
                type="number"
                min={0}
                value={paidAmountInput}
                onChange={(e) => setPaidAmountInput(e.target.value)}
                placeholder={paymentType === 'khata_credit' ? '0' : String(liveTotals.total)}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono"
              />
            </div>
          </div>

          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={isUrdu ? 'بل نوٹس (کپڑے کی پیمائش / کٹائی نوٹ)...' : 'Invoice notes (e.g. tailoring / box gift wrap)...'}
            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white"
          />

          {/* Totals Summary & Submit */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
            <div className="space-y-0.5 text-xs">
              <div className="text-gray-400">
                Subtotal: <span className="text-white font-mono">{formatPKR(liveTotals.subtotal)}</span>
                {liveTotals.discount > 0 && (
                  <span className="text-emerald-400 ml-2">(-{formatPKR(liveTotals.discount)})</span>
                )}
              </div>
              <div className="text-sm font-bold text-[#d4af37]">
                Grand Total: <span className="font-mono">{formatPKR(liveTotals.total)}</span>
                {liveTotals.dueAmount > 0 && (
                  <span className="text-xs text-amber-400 ml-2 font-normal">
                    (Due to Khata: {formatPKR(liveTotals.dueAmount)})
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={billItems.length === 0 || !customerName.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#b38f2a] text-black font-bold text-xs shadow-lg hover:brightness-110 disabled:opacity-40 cursor-pointer flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>{isUrdu ? 'انوائس محفوظ اور پرنٹ کریں' : 'Generate & Sync Cloud Invoice'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Invoice History Table */}
      <div className="p-4 rounded-2xl bg-[#16161a] border border-white/10 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">
          {isUrdu ? 'حالیہ کلاؤڈ انوائسز' : 'Recent Cloud Invoices'}
        </h4>

        {invoices.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center">
            No POS invoices generated yet. Create your first cloud invoice above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-gray-400">
                  <th className="py-2 px-2">Invoice #</th>
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Customer</th>
                  <th className="py-2 px-2">Items</th>
                  <th className="py-2 px-2">Total</th>
                  <th className="py-2 px-2">Paid / Due</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/5">
                    <td className="py-2.5 px-2 font-mono font-bold text-[#d4af37]">{inv.invoiceNumber}</td>
                    <td className="py-2.5 px-2 text-gray-400">{inv.date}</td>
                    <td className="py-2.5 px-2 font-medium text-white">
                      {inv.customerName}
                      {inv.customerPhone && (
                        <span className="block text-[10px] text-gray-400 font-mono">{inv.customerPhone}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-gray-300">{inv.items.length}</td>
                    <td className="py-2.5 px-2 font-bold text-white font-mono">{formatPKR(inv.total)}</td>
                    <td className="py-2.5 px-2 font-mono">
                      <span className="text-emerald-400">{formatPKR(inv.paidAmount)}</span>
                      {inv.dueAmount > 0 && (
                        <span className="block text-[10px] text-amber-400">Due: {formatPKR(inv.dueAmount)}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inv.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : inv.status === 'partial'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#d4af37] hover:text-black text-[11px] font-semibold cursor-pointer transition-colors"
                      >
                        <Printer className="w-3 h-3" />
                        <span>View / Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Invoice Receipt Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white text-stone-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-lg font-bold tracking-wide text-stone-950">{shopProfile.name}</h3>
                <p className="text-xs text-stone-600">
                  {shopProfile.address}, {shopProfile.city}, {shopProfile.region}
                </p>
                <p className="text-xs text-stone-600 font-mono">Phone / WhatsApp: {shopProfile.phone}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 print:hidden cursor-pointer"
                aria-label="Close invoice receipt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between text-xs bg-stone-50 p-3 rounded-xl border border-stone-200">
              <div>
                <p className="font-bold text-stone-900">Customer: {selectedInvoice.customerName}</p>
                {selectedInvoice.customerPhone && (
                  <p className="font-mono text-stone-600">{selectedInvoice.customerPhone}</p>
                )}
                <p className="text-stone-500 flex items-center gap-1 mt-1">
                  <UserCheck className="w-3 h-3" />
                  Cashier: {selectedInvoice.salesmanName || adminProfile.name}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-stone-900">{selectedInvoice.invoiceNumber}</p>
                <p className="text-stone-600">{selectedInvoice.date}</p>
                <p className="uppercase text-[10px] font-bold text-amber-700 mt-1">
                  {selectedInvoice.paymentType.replace('_', ' ')}
                </p>
              </div>
            </div>

            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-300 text-stone-600">
                  <th className="py-1.5 text-left">Item</th>
                  <th className="py-1.5 text-center">Qty</th>
                  <th className="py-1.5 text-right">Rate</th>
                  <th className="py-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {selectedInvoice.items.map((item) => (
                  <tr key={item.productId}>
                    <td className="py-1.5 font-medium">{item.title}</td>
                    <td className="py-1.5 text-center font-mono">{item.quantity}</td>
                    <td className="py-1.5 text-right font-mono">{formatPKR(item.unitPrice)}</td>
                    <td className="py-1.5 text-right font-mono font-bold">{formatPKR(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-stone-300 pt-2 space-y-1 text-xs text-right">
              <div className="flex justify-between">
                <span className="text-stone-600">Subtotal:</span>
                <span className="font-mono">{formatPKR(selectedInvoice.subtotal)}</span>
              </div>
              {selectedInvoice.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-mono">-{formatPKR(selectedInvoice.discount)}</span>
                </div>
              )}
              {selectedInvoice.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-stone-600">Tax:</span>
                  <span className="font-mono">{formatPKR(selectedInvoice.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-stone-200">
                <span>Grand Total:</span>
                <span className="font-mono">{formatPKR(selectedInvoice.total)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Paid:</span>
                <span className="font-mono">{formatPKR(selectedInvoice.paidAmount)}</span>
              </div>
              {selectedInvoice.dueAmount > 0 && (
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>Balance Due (Khata):</span>
                  <span className="font-mono">{formatPKR(selectedInvoice.dueAmount)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-stone-950 text-amber-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
