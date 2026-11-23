import React, { useMemo, useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { formatPKR, sanitizePhoneForWhatsApp } from '../../utils/logic';
import {
  BookOpen,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  MessageCircle,
  Search,
  Wallet,
} from 'lucide-react';

export const KhataLedgerTab: React.FC = () => {
  const {
    lang,
    khataAccounts,
    khataTransactions,
    addKhataAccount,
    recordKhataTransaction,
    shopProfile,
  } = useShop();

  const isUrdu = lang === 'ur';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  const [txType, setTxType] = useState<'debit' | 'credit'>('credit');
  const [txAmount, setTxAmount] = useState<string>('');
  const [txDescription, setTxDescription] = useState<string>('');

  const totalReceivables = useMemo(
    () => khataAccounts.reduce((sum, a) => sum + Math.max(0, a.currentBalance), 0),
    [khataAccounts]
  );

  const filteredAccounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return khataAccounts;
    return khataAccounts.filter(
      (a) =>
        a.customerName.toLowerCase().includes(q) ||
        a.phone.toLowerCase().includes(q) ||
        (a.address || '').toLowerCase().includes(q)
    );
  }, [khataAccounts, searchQuery]);

  const activeAccount =
    khataAccounts.find((a) => a.id === selectedAccountId) || filteredAccounts[0] || null;

  const activeTransactions = useMemo(() => {
    if (!activeAccount) return khataTransactions.slice(0, 20);
    return khataTransactions.filter((tx) => tx.accountId === activeAccount.id);
  }, [khataTransactions, activeAccount]);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newPhone.trim()) return;
    const created = addKhataAccount({
      customerName: newCustomerName.trim(),
      phone: newPhone.trim(),
      address: newAddress.trim() || 'Kotli, Azad Kashmir',
      openingBalance: Math.max(0, Number(openingBalance) || 0),
    });
    setSelectedAccountId(created.id);
    setNewCustomerName('');
    setNewPhone('');
    setNewAddress('');
    setOpeningBalance(0);
  };

  const handleRecordTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount) return;
    const amt = Math.max(1, Number(txAmount) || 0);
    if (!amt) return;
    recordKhataTransaction(
      activeAccount.id,
      txType,
      amt,
      txDescription.trim() || (txType === 'debit' ? 'Suit / Cloth on Udhar' : 'Cash Wasooli')
    );
    setTxAmount('');
    setTxDescription('');
  };

  return (
    <div className="space-y-6">
      {/* KPI Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#16161a] border border-[#d4af37]/30 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-400">
              {isUrdu ? 'کل وصول طلب کھاتہ' : 'Total Khata Receivables'}
            </p>
            <p className="text-xl font-bold font-mono text-amber-400 mt-1">
              {formatPKR(totalReceivables)}
            </p>
          </div>
          <Wallet className="w-8 h-8 text-[#d4af37]/60" />
        </div>

        <div className="p-4 rounded-2xl bg-[#16161a] border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-400">
              {isUrdu ? 'کھاتہ گاہک' : 'Active Khata Accounts'}
            </p>
            <p className="text-xl font-bold font-mono text-white mt-1">{khataAccounts.length}</p>
          </div>
          <BookOpen className="w-8 h-8 text-sky-400/60" />
        </div>

        <div className="p-4 rounded-2xl bg-[#16161a] border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-400">
              {isUrdu ? 'کل اندراجات' : 'Ledger Entries'}
            </p>
            <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {khataTransactions.length}
            </p>
          </div>
          <ArrowDownLeft className="w-8 h-8 text-emerald-400/60" />
        </div>
      </div>

      {/* Add New Khata Customer Form */}
      <form
        onSubmit={handleCreateAccount}
        className="p-4 rounded-2xl bg-[#16161a] border border-white/10 space-y-3"
      >
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
          {isUrdu ? 'نیا کسٹمر کھاتہ کھولیں' : 'Open New Customer Khata Account'}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <input
            type="text"
            required
            value={newCustomerName}
            onChange={(e) => setNewCustomerName(e.target.value)}
            placeholder={isUrdu ? 'گاہک کا نام *' : 'Customer Name *'}
            className="px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white"
          />
          <input
            type="tel"
            required
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder={isUrdu ? 'واٹس ایپ / فون *' : 'Phone / WhatsApp *'}
            className="px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono"
          />
          <input
            type="text"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder={isUrdu ? 'علاقہ / پتہ' : 'Market / Village (Kotli)'}
            className="px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white"
          />
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              value={openingBalance || ''}
              onChange={(e) => setOpeningBalance(Number(e.target.value) || 0)}
              placeholder="Opening PKR"
              className="w-28 px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono"
            />
            <button
              type="submit"
              className="flex-1 px-3 py-2 rounded-xl bg-[#d4af37] text-black font-bold hover:brightness-110 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'کھولیں' : 'Add'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Split View: Customer Directory & Active Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 p-4 rounded-2xl bg-[#16161a] border border-white/10 space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isUrdu ? 'نام یا نمبر سے کھاتہ تلاش کریں...' : 'Search Khata customer...'}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white"
            />
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filteredAccounts.length === 0 ? (
              <p className="text-xs text-gray-500 py-8 text-center">
                No Khata accounts yet. Add your first customer above.
              </p>
            ) : (
              filteredAccounts.map((acc) => {
                const isSelected = activeAccount?.id === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#d4af37]/15 border-[#d4af37]'
                        : 'bg-black/40 border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{acc.customerName}</p>
                      <p className="text-[11px] text-gray-400 font-mono">{acc.phone}</p>
                      <p className="text-[10px] text-gray-500">{acc.address}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-xs font-bold font-mono ${
                          acc.currentBalance > 0 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {formatPKR(acc.currentBalance)}
                      </p>
                      <p className="text-[10px] text-gray-500">{acc.lastActivityDate}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Active Customer Ledger & Debit/Credit Controls */}
        <div className="lg:col-span-7 p-4 rounded-2xl bg-[#16161a] border border-[#d4af37]/30 space-y-4">
          {!activeAccount ? (
            <div className="py-12 text-center text-xs text-gray-400">
              Select or create a customer Khata account to record Udhar (Debit) or Cash Wasooli (Credit).
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <h4 className="text-sm font-bold text-white">{activeAccount.customerName}</h4>
                  <p className="text-xs text-gray-400 font-mono">
                    {activeAccount.phone} · Opening: {formatPKR(activeAccount.openingBalance)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/15 text-right">
                    <span className="block text-[10px] text-gray-400">Running Balance</span>
                    <strong className="text-sm font-mono text-amber-400">
                      {formatPKR(activeAccount.currentBalance)}
                    </strong>
                  </div>

                  <a
                    href={`https://wa.me/${sanitizePhoneForWhatsApp(activeAccount.phone)}?text=${encodeURIComponent(
                      `Assalam-o-Alaikum ${activeAccount.customerName} sb,\nSitara Cloth House (${shopProfile.market} Kotli) Khata Reminder:\nYour current balance is *Rs. ${activeAccount.currentBalance.toLocaleString()}*.\nThank you for your patronage!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Reminder</span>
                  </a>
                </div>
              </div>

              {/* Record Debit / Credit Entry */}
              <form onSubmit={handleRecordTx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                <div className="sm:col-span-3 flex rounded-xl bg-black/60 p-1 border border-white/15">
                  <button
                    type="button"
                    onClick={() => setTxType('credit')}
                    className={`flex-1 py-1.5 rounded-lg font-bold cursor-pointer ${
                      txType === 'credit' ? 'bg-emerald-500 text-black' : 'text-gray-400'
                    }`}
                  >
                    Wasooli (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('debit')}
                    className={`flex-1 py-1.5 rounded-lg font-bold cursor-pointer ${
                      txType === 'debit' ? 'bg-amber-500 text-black' : 'text-gray-400'
                    }`}
                  >
                    Udhar (-)
                  </button>
                </div>

                <input
                  type="number"
                  required
                  min={1}
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="Amount (PKR)"
                  className="sm:col-span-3 px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono"
                />

                <input
                  type="text"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder={isUrdu ? 'تفصیل (مثلاً بوسکی سوٹ / نقد وصولی)' : 'Description / Note'}
                  className="sm:col-span-4 px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white"
                />

                <button
                  type="submit"
                  className="sm:col-span-2 py-2 rounded-xl bg-[#d4af37] text-black font-bold hover:brightness-110 cursor-pointer"
                >
                  Save
                </button>
              </form>

              {/* Transaction History */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {activeTransactions.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">
                    No transactions recorded yet for this account.
                  </p>
                ) : (
                  activeTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        {tx.type === 'debit' ? (
                          <ArrowUpRight className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <div>
                          <p className="text-white font-medium">{tx.description}</p>
                          <p className="text-[10px] text-gray-400">
                            {tx.date} {tx.referenceInvoice ? `· ${tx.referenceInvoice}` : ''}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-mono font-bold ${
                          tx.type === 'debit' ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {tx.type === 'debit' ? `+${formatPKR(tx.amount)} Udhar` : `-${formatPKR(tx.amount)} Paid`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
