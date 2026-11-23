import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { StaffRole } from '../../types';
import { formatPKR } from '../../utils/logic';
import { UserPlus, Users, Shield, Award } from 'lucide-react';

export const StaffManagementTab: React.FC = () => {
  const { lang, staffMembers, addStaffMember, updateStaffMember } = useShop();
  const isUrdu = lang === 'ur';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('salesman');
  const [commissionPercent, setCommissionPercent] = useState<number>(2);
  const [monthlyTarget, setMonthlyTarget] = useState<number>(250000);

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    addStaffMember({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      role,
      commissionPercent: Math.max(0, Number(commissionPercent) || 0),
      monthlyTarget: Math.max(0, Number(monthlyTarget) || 0),
      status: 'active',
    });
    setName('');
    setPhone('');
    setEmail('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#16161a] border border-[#d4af37]/30">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#d4af37]" />
            <span>{isUrdu ? 'سیلز مین اور اسٹاف مینجمنٹ' : 'Salesmen, Roles & Commission Targets'}</span>
          </h3>
          <p className="text-xs text-gray-400">
            {isUrdu
              ? 'اپنے ملازمین، مینیجرز اور سیلز مین کے اختیارات اور کمیشن کنٹرول کریں۔'
              : 'Manage staff roles (Admin, Manager, Salesman), track monthly targets, and link POS invoices.'}
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs">
          <span className="text-gray-400">Active Team: </span>
          <strong className="text-[#d4af37] font-mono">
            {staffMembers.filter((s) => s.status === 'active').length}
          </strong>
        </div>
      </div>

      {/* Add Staff Form */}
      <form
        onSubmit={handleAddStaff}
        className="p-4 rounded-2xl bg-[#16161a] border border-white/10 space-y-3 text-xs"
      >
        <h4 className="font-bold uppercase tracking-wider text-[#d4af37]">
          {isUrdu ? 'نیا اسٹاف ممبر شامل کریں' : 'Register New Staff Member / Salesman'}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name *"
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
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Google Email (for Cloud RBAC)"
            className="px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as StaffRole)}
            className="px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white"
          >
            <option value="salesman">Salesman</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          <input
            type="number"
            min={0}
            max={25}
            step={0.5}
            value={commissionPercent}
            onChange={(e) => setCommissionPercent(Number(e.target.value) || 0)}
            placeholder="Commission %"
            className="px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono"
          />
          <input
            type="number"
            min={0}
            value={monthlyTarget}
            onChange={(e) => setMonthlyTarget(Number(e.target.value) || 0)}
            placeholder="Monthly Target PKR"
            className="px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono"
          />
          <button
            type="submit"
            className="py-2 rounded-xl bg-[#d4af37] text-black font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff</span>
          </button>
        </div>
      </form>

      {/* Staff List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {staffMembers.length === 0 ? (
          <div className="col-span-full p-8 rounded-2xl bg-[#16161a] border border-white/10 text-center text-xs text-gray-500">
            No additional salesmen registered yet. Add your showroom salesmen above to track commissions & POS bills.
          </div>
        ) : (
          staffMembers.map((stf) => {
            const pct = stf.monthlyTarget > 0 ? Math.min(100, Math.round((stf.totalSalesAmount / stf.monthlyTarget) * 100)) : 0;
            const commissionEarned = Math.round((stf.totalSalesAmount * stf.commissionPercent) / 100);
            return (
              <div
                key={stf.id}
                className="p-4 rounded-2xl bg-[#16161a] border border-white/10 space-y-3 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>{stf.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] uppercase bg-amber-500/20 text-[#d4af37] font-mono">
                        {stf.role}
                      </span>
                    </h4>
                    <p className="text-gray-400 font-mono">{stf.phone}</p>
                    {stf.email && <p className="text-[11px] text-gray-500">{stf.email}</p>}
                  </div>
                  <select
                    value={stf.status}
                    onChange={(e) =>
                      updateStaffMember({
                        ...stf,
                        status: e.target.value as 'active' | 'on_leave' | 'inactive',
                      })
                    }
                    className="px-2 py-1 rounded-lg bg-black/60 border border-white/15 text-[11px] text-white"
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center bg-black/40 p-2 rounded-xl border border-white/5">
                  <div>
                    <span className="block text-[10px] text-gray-400">Sales</span>
                    <strong className="font-mono text-white">{formatPKR(stf.totalSalesAmount)}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400">Target</span>
                    <strong className="font-mono text-gray-300">{formatPKR(stf.monthlyTarget)}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400">Comm ({stf.commissionPercent}%)</span>
                    <strong className="font-mono text-emerald-400">{formatPKR(commissionEarned)}</strong>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3 text-[#d4af37]" />
                      Monthly Target Progress
                    </span>
                    <span className="font-mono">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-stone-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#d4af37] to-emerald-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] text-gray-400 flex items-center gap-2">
        <Shield className="w-4 h-4 text-[#d4af37] shrink-0" />
        <span>
          Cloud RBAC protection ensures only verified Admin sessions can create or update staff permissions and payouts.
        </span>
      </div>
    </div>
  );
};
