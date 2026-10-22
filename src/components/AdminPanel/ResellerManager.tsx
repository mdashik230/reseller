import React, { useState, useEffect } from 'react';
import { User, ResellerTier } from '../../types';
import { formatBDT, formatDate } from '../../utils/formatters';
import { soundEffects } from '../../utils/audio';
import {
  Users,
  Sliders,
  Award,
  Wallet,
  Shield,
  Plus,
  Minus,
  Search,
  CheckCircle,
  AlertTriangle,
  Lock,
  Unlock,
  UserX,
  UserCheck
} from 'lucide-react';

export const ResellerManager: React.FC = () => {
  const [resellers, setResellers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Balance adjustment modal
  const [adjustingUser, setAdjustingUser] = useState<any | null>(null);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustAmount, setAdjustAmount] = useState('1000');
  const [adjustReason, setAdjustReason] = useState('Manual balance top-up by Master Admin');
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Tier adjustment modal
  const [tierUser, setTierUser] = useState<any | null>(null);
  const [newTier, setNewTier] = useState<ResellerTier>('VIP');
  const [newDiscount, setNewDiscount] = useState('12');

  const fetchResellers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/resellers');
      if (res.ok) {
        const data = await res.json();
        if (data.resellers) {
          setResellers(data.resellers);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResellers();
  }, []);

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUser) return;
    setAdjustLoading(true);

    try {
      const res = await fetch(`/api/admin/resellers/${adjustingUser.id}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: adjustType,
          amount: parseFloat(adjustAmount),
          reason: adjustReason,
        }),
      });

      if (res.ok) {
        soundEffects.playSuccessChime();
        await fetchResellers();
        setAdjustingUser(null);
      }
    } catch {
      soundEffects.playWarningChime();
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleUpdateTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierUser) return;

    try {
      const res = await fetch(`/api/admin/resellers/${tierUser.id}/tier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: newTier,
          discountPercent: parseFloat(newDiscount),
        }),
      });

      if (res.ok) {
        soundEffects.playSuccessChime();
        await fetchResellers();
        setTierUser(null);
      }
    } catch {
      soundEffects.playWarningChime();
    }
  };

  const handleToggleActivation = async (user: any) => {
    const nextApproved = !user.isApprovedByAdmin;
    try {
      const res = await fetch(`/api/admin/resellers/${user.id}/activation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: nextApproved }),
      });
      if (res.ok) {
        soundEffects.playSuccessChime();
        await fetchResellers();
      }
    } catch {
      soundEffects.playWarningChime();
    }
  };

  const handleToggleStatus = async (user: any) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/resellers/${user.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        soundEffects.playSuccessChime();
        await fetchResellers();
      }
    } catch {
      soundEffects.playWarningChime();
    }
  };

  const filtered = resellers.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      
      {/* Top Search & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Reseller Directory &amp; Category Access Controls</span>
          </h4>
          <p className="text-xs text-slate-400">
            Audit dual balances, 1-click approve KYC &amp; categories access, and adjust discount tiers
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search resellers..."
            className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-52"
          />
        </div>
      </div>

      {/* Reseller Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
              <th className="py-3 px-4 font-semibold">Reseller Name</th>
              <th className="py-3 px-3 font-semibold">KYC Status</th>
              <th className="py-3 px-3 font-semibold text-center">Category Access</th>
              <th className="py-3 px-3 font-semibold">Tier &amp; Discount</th>
              <th className="py-3 px-3 font-semibold text-right">Total Balance</th>
              <th className="py-3 px-3 font-semibold text-right">Usable Balance</th>
              <th className="py-3 px-3 font-semibold text-center">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filtered.map(reseller => {
              const isLockedOrLow = reseller.wallet?.usableBalance <= 0 || reseller.wallet?.totalBalance <= 2000;
              const isApproved = reseller.isApprovedByAdmin;

              return (
                <tr key={reseller.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white">{reseller.name}</div>
                    <div className="text-[11px] text-slate-400">{reseller.email}</div>
                    <div className="text-[10px] text-slate-500">{reseller.phone}</div>
                  </td>

                  <td className="py-3.5 px-3">
                    {reseller.kyc?.status === 'verified' ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                        ✅ Verified ({reseller.kyc.imoId || 'IMO'})
                      </span>
                    ) : reseller.kyc?.status === 'pending' ? (
                      <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                        ⏳ Pending Review
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                        ❌ KYC Rejected
                      </span>
                    )}
                  </td>

                  {/* Categories Approval Column */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => handleToggleActivation(reseller)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                        isApproved
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                      }`}
                      title={isApproved ? 'Click to Lock categories' : 'Click to Approve & Unlock categories'}
                    >
                      {isApproved ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-amber-400" />}
                      <span>{isApproved ? 'Unlocked (Approved)' : 'Locked (Click to Approve)'}</span>
                    </button>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        {reseller.tier}
                      </span>
                      <span className="text-cyan-400 font-bold text-[11px]">
                        {reseller.discountPercent}% OFF
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <span className="font-bold font-mono-numbers text-white">
                      {formatBDT(reseller.wallet?.totalBalance || 0)}
                    </span>
                    <div className="text-[10px] text-amber-400/80">
                      (৳2,000 Locked)
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <span className={`font-extrabold font-mono-numbers ${
                      isLockedOrLow ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {formatBDT(reseller.wallet?.usableBalance || 0)}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      reseller.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}>
                      {reseller.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setAdjustingUser(reseller);
                          setAdjustAmount('1000');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[11px] font-semibold transition-colors"
                        title="Adjust balance (credit or debit)"
                      >
                        Adjust ৳
                      </button>

                      <button
                        onClick={() => {
                          setTierUser(reseller);
                          setNewTier(reseller.tier);
                          setNewDiscount(reseller.discountPercent.toString());
                        }}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-[11px] font-semibold transition-colors"
                        title="Change discount rate & tier"
                      >
                        Tier
                      </button>

                      <button
                        onClick={() => handleToggleStatus(reseller)}
                        className={`p-1 rounded-lg transition-colors ${
                          reseller.status === 'active'
                            ? 'text-slate-400 hover:text-rose-400'
                            : 'text-rose-400 hover:text-emerald-400'
                        }`}
                        title={reseller.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                      >
                        {reseller.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Balance Adjustment Modal */}
      {adjustingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white shadow-2xl">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              <span>Adjust Balance for {adjustingUser.name}</span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Current Total: {formatBDT(adjustingUser.wallet?.totalBalance)} (Usable: {formatBDT(adjustingUser.wallet?.usableBalance)})
            </p>

            <form onSubmit={handleAdjustBalance} className="my-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('credit')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                    adjustType === 'credit'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Credit (+ Balance)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdjustType('debit')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                    adjustType === 'debit'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                  <span>Debit (- Balance)</span>
                </button>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Adjustment Amount (BDT ৳)
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Audit Reason / Log
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow"
                >
                  {adjustLoading ? 'Applying...' : 'Apply Balance Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tier & Discount Editor Modal */}
      {tierUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white shadow-2xl">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-cyan-400" />
              <span>Set Tier &amp; Discount for {tierUser.name}</span>
            </h4>

            <form onSubmit={handleUpdateTier} className="my-4 space-y-3.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Reseller Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['General', 'Silver', 'VIP'] as ResellerTier[]).map(t => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => {
                        setNewTier(t);
                        if (t === 'General') setNewDiscount('5');
                        if (t === 'Silver') setNewDiscount('9');
                        if (t === 'VIP') setNewDiscount('14');
                      }}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        newTier === t
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Reseller Discount Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  value={newDiscount}
                  onChange={e => setNewDiscount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTierUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow"
                >
                  Save Tier Rates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
