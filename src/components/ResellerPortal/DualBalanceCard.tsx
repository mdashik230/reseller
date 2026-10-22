import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatBDT } from '../../utils/formatters';
import {
  Wallet,
  Lock,
  Zap,
  PlusCircle,
  History,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Info
} from 'lucide-react';

export const DualBalanceCard: React.FC = () => {
  const { currentUser, setOpenDepositModal, setOpenTransactionsModal } = useAuth();

  if (!currentUser) return null;

  const total = currentUser.wallet.totalBalance;
  const locked = currentUser.wallet.lockedSecurityDeposit; // ৳2,000
  const usable = currentUser.wallet.usableBalance;

  // Percentage of usable balance out of total
  const usablePercent = total > 0 ? Math.min(100, Math.round((usable / total) * 100)) : 0;
  const isLockedOrLow = usable <= 0 || total <= locked;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 p-6 shadow-xl backdrop-blur-xl">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* Top Header & Reseller Tier */}
      <div className="relative flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Dual-Balance Wallet Engine
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {currentUser.tier} Tier ({currentUser.discountPercent}% OFF)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              ACID-compliant balance deduction with mandatory security deposit protection
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpenTransactionsModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-all hover:border-slate-600"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>Ledger History</span>
          </button>
          <button
            onClick={() => setOpenDepositModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Funds</span>
          </button>
        </div>
      </div>

      {/* The 3 Core Financial Metric Blocks */}
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
        
        {/* Metric 1: Total Balance */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Account Balance</span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono-numbers tracking-tight">
              {formatBDT(total)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Gross wallet holdings
            </p>
          </div>
        </div>

        {/* Metric 2: Locked Security Deposit (৳2,000) */}
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400 text-xs font-medium">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Locked Security Deposit
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
              Mandatory
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono-numbers tracking-tight">
              {formatBDT(locked)}
            </div>
            <p className="text-[11px] text-amber-300/80 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              Locked safety reserve against chargebacks
            </p>
          </div>
        </div>

        {/* Metric 3: Usable Balance */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
          isLockedOrLow
            ? 'bg-rose-950/20 border-rose-500/40'
            : 'bg-emerald-950/25 border-emerald-500/40'
        }`}>
          <div className="flex items-center justify-between text-xs font-medium">
            <span className={isLockedOrLow ? 'text-rose-400 flex items-center gap-1' : 'text-emerald-400 flex items-center gap-1'}>
              <Zap className="w-3.5 h-3.5" />
              Usable Balance for Orders
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              isLockedOrLow ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {isLockedOrLow ? 'Restricted' : 'Active'}
            </span>
          </div>
          <div className="mt-2">
            <div className={`text-2xl sm:text-3xl font-extrabold font-mono-numbers tracking-tight ${
              isLockedOrLow ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {formatBDT(usable)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Formula: (Total {formatBDT(total)} - ৳2,000 Locked)
            </p>
          </div>
        </div>
      </div>

      {/* Visual Balance Ratio Bar */}
      <div className="mt-5 pt-4 border-t border-slate-800/60">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            Usable Capital Share ({usablePercent}%)
          </span>
          <span className="text-slate-400 text-[11px] font-mono-numbers">
            {formatBDT(usable)} usable / {formatBDT(total)} total
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
          <div
            className="h-full bg-amber-500"
            style={{ width: `${Math.min(100, (locked / Math.max(total, locked)) * 100)}%` }}
            title="Mandatory Locked Security Deposit"
          />
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400"
            style={{ width: `${usablePercent}%` }}
            title="Usable Balance Available for Top-ups"
          />
        </div>
      </div>

      {/* Alert Banner if locked / depleted */}
      {isLockedOrLow && (
        <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-200">
              Orders Automatically Restricted — Usable Balance Depleted
            </p>
            <p className="text-[11px] text-rose-300/90 mt-0.5">
              The system requires maintaining at least ৳2,000 as a Locked Security Deposit. To place new orders, please top up at least ৳500 or choose Instant Live Gateway payment at checkout.
            </p>
          </div>
          <button
            onClick={() => setOpenDepositModal(true)}
            className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shrink-0 self-center"
          >
            Deposit Now
          </button>
        </div>
      )}
    </div>
  );
};
