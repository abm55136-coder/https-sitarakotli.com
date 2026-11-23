import React, { useMemo, useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { PurchaseItem } from '../../types';
import { formatPKR } from '../../utils/logic';
import { Building2, Plus, PackagePlus, CheckCircle2, Truck } from 'lucide-react';

export const SuppliersPurchasesTab: React.FC = () => {
  const { lang, suppliers, purchases, products, addSupplier, recordPurchase } = useShop();
  const isUrdu = lang === 'ur';

  const [supName, setSupName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [city, setCity] = useState('Lahore');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('Mill Fabrics / Boski & Karandi');

  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [linkedProductId, setLinkedProductId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [qty, setQty] = useState<number>(10);
  const [unitCost, setUnitCost] = useState<number>(3500);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const totalPayables = useMemo(
    () => suppliers.reduce((s, sup) => s + Math.max(0, sup.balancePayable), 0),
    [suppliers]
  );

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim() || !companyName.trim() || !phone.trim()) return;
    const created = addSupplier({
      name: supName.trim(),
      companyName: companyName.trim(),
      city: city.trim() || 'Lahore',
      phone: phone.trim(),
      category: category.trim(),
    });
    setSelectedSupplierId(created.id);
    setSupName('');
    setCompanyName('');
    setPhone('');
  };

  const handleRecordPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSupId = selectedSupplierId || suppliers[0]?.id;
    if (!targetSupId || qty <= 0 || unitCost <= 0) return;

    const matchedProd = products.find((p) => p.id === linkedProductId);
    const title = matchedProd ? matchedProd.title : customTitle.trim() || 'Wholesale Fabric Lot';

    const item: PurchaseItem = {
      productId: matchedProd?.id,
      productTitle: title,
      quantity: qty,
      unitCost,
      lineTotal: qty * unitCost,
    };

    const pur = recordPurchase(targetSupId, billNumber, [item], paidAmount, notes.trim() || undefined);
    if (pur) {
      setBillNumber('');
      setCustomTitle('');
      setNotes('');
      setPaidAmount(0);
      setSavedMsg(
        isUrdu
          ? `خریداری بل #${pur.billNumber} محفوظ! اسٹاک خودکار شامل کر دیا گیا۔`
          : `Purchase Bill #${pur.billNumber} saved! Catalog stock & supplier payable updated.`
      );
      setTimeout(() => setSavedMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#16161a] border border-[#d4af37]/30 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-400">
              {isUrdu ? 'کل سپلائر واجب الادا' : 'Total Supplier Payables'}
            </p>
            <p className="text-xl font-bold font-mono text-rose-400 mt-1">{formatPKR(totalPayables)}</p>
          </div>
          <Building2 className="w-8 h-8 text-rose-400/60" />
        </div>
        <div className="p-4 rounded-2xl bg-[#16161a] border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-400">
              {isUrdu ? 'سپلائرز / ملز' : 'Registered Wholesale Suppliers'}
            </p>
            <p className="text-xl font-bold font-mono text-white mt-1">{suppliers.length}</p>
          </div>
          <Truck className="w-8 h-8 text-[#d4af37]/60" />
        </div>
        <div className="p-4 rounded-2xl bg-[#16161a] border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-400">
              {isUrdu ? 'کل خریداری بل' : 'Recorded Purchase Bills'}
            </p>
            <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{purchases.length}</p>
          </div>
          <PackagePlus className="w-8 h-8 text-emerald-400/60" />
        </div>
      </div>

      {savedMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Register Wholesale Supplier */}
        <form
          onSubmit={handleAddSupplier}
          className="lg:col-span-5 p-4 rounded-2xl bg-[#16161a] border border-white/10 space-y-3 text-xs"
        >
          <h4 className="font-bold uppercase tracking-wider text-[#d4af37]">
            {isUrdu ? 'نیا سپلائر / ہول سیل ڈیلر' : 'Add Textile Mill / Supplier'}
          </h4>
          <input
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Mill / Company (e.g. Faisalabad Cotton Mills) *"
            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              required
              value={supName}
              onChange={(e) => setSupName(e.target.value)}
              placeholder="Contact Person *"
              className="px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white"
            />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone *"
              className="px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City (Lahore / Karachi)"
              className="px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white"
            />
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Fabric Specialty"
              className="px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#d4af37] text-black font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isUrdu ? 'سپلائر محفوظ کریں' : 'Save Wholesale Supplier'}</span>
          </button>

          {/* Suppliers List */}
          <div className="pt-3 border-t border-white/10 space-y-2 max-h-56 overflow-y-auto">
            {suppliers.map((s) => (
              <div
                key={s.id}
                className="p-2.5 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-white">{s.companyName}</p>
                  <p className="text-[10px] text-gray-400">
                    {s.name} · {s.city} · {s.phone}
                  </p>
                </div>
                <div className="text-right font-mono">
                  <p className="text-rose-400 font-bold">Pay: {formatPKR(s.balancePayable)}</p>
                  <p className="text-[10px] text-gray-400">Total: {formatPKR(s.totalPurchased)}</p>
                </div>
              </div>
            ))}
          </div>
        </form>

        {/* Right: Record Purchase Bill & Auto Stock-In */}
        <div className="lg:col-span-7 space-y-5">
          <form
            onSubmit={handleRecordPurchase}
            className="p-4 rounded-2xl bg-[#16161a] border border-[#d4af37]/30 space-y-3 text-xs"
          >
            <h4 className="font-bold uppercase tracking-wider text-[#d4af37]">
              {isUrdu ? 'خریداری بل درج کریں (اسٹاک ان)' : 'Record Wholesale Purchase (Auto Stock-In)'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                required
                value={selectedSupplierId || suppliers[0]?.id || ''}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white"
              >
                <option value="">-- Select Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.companyName} ({s.city})
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                placeholder="Supplier Bill # (e.g. LHR-409)"
                className="px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={linkedProductId}
                onChange={(e) => setLinkedProductId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white"
              >
                <option value="">-- Link to Catalog Product (Auto-Restock) --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (Curr Stock: {p.stockQuantity})
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                disabled={Boolean(linkedProductId)}
                placeholder="Or custom fabric bundle description"
                className="px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-400 mb-1">Quantity (Suits)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Unit Cost (PKR)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={unitCost}
                  onChange={(e) => setUnitCost(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Paid Cash (PKR)</label>
                <input
                  type="number"
                  min={0}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
              <div className="text-xs">
                Total Bill: <strong className="text-[#d4af37] font-mono">{formatPKR(qty * unitCost)}</strong>
              </div>
              <button
                type="submit"
                disabled={suppliers.length === 0}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold hover:brightness-110 disabled:opacity-40 cursor-pointer"
              >
                Save Purchase & Restock
              </button>
            </div>
          </form>

          {/* Recent Purchases */}
          <div className="p-4 rounded-2xl bg-[#16161a] border border-white/10 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">
              {isUrdu ? 'حالیہ خریداریاں' : 'Recent Purchase Ledger'}
            </h4>
            {purchases.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No purchase bills recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {purchases.map((pur) => (
                  <div
                    key={pur.id}
                    className="p-2.5 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">
                        {pur.supplierName} · <span className="text-[#d4af37] font-mono">#{pur.billNumber}</span>
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {pur.date} · {pur.items.map((i) => `${i.productTitle} (×${i.quantity})`).join(', ')}
                      </p>
                    </div>
                    <div className="text-right font-mono">
                      <p className="font-bold text-white">{formatPKR(pur.totalAmount)}</p>
                      {pur.balanceDue > 0 && (
                        <p className="text-[10px] text-rose-400">Payable: {formatPKR(pur.balanceDue)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
