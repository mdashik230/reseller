import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatBDT } from '../../utils/formatters';
import {
  ShieldCheck,
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  PlusCircle,
  ExternalLink,
  HelpCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export const ResellerActivationGate: React.FC = () => {
  const { currentUser, setOpenKycModal, setOpenDepositModal, refreshUser } = useAuth();
  const [checking, setChecking] = useState(false);

  if (!currentUser) return null;

  const isKycSubmitted = currentUser.kyc.status === 'pending' || currentUser.kyc.status === 'verified';
  const isKycVerified = currentUser.kyc.status === 'verified';
  const isKycRejected = currentUser.kyc.status === 'rejected';

  const totalBalance = currentUser.wallet.totalBalance;
  const isDepositPaid = totalBalance >= 2000 || currentUser.depositApproved;
  const isFullyApproved = currentUser.isApprovedByAdmin;

  const handleRefresh = async () => {
    setChecking(true);
    await refreshUser();
    setTimeout(() => setChecking(false), 500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Top Welcome & Activation Status Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">
                  Reseller Account Activation Pending
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Verification Required
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Welcome, <strong className="text-white">{currentUser.name}</strong> ({currentUser.email})
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={checking}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>Check Approval Status</span>
          </button>
        </div>

        {/* Bengali Instruction Banner */}
        <div className="mt-6 p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed">
          <p className="font-bold text-amber-300 text-sm mb-1 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>টপ-আপ ও রিচার্জ ক্যাটাগরি আনলক করার নিয়মাবলী:</span>
          </p>
          <p>
            আমাদের প্ল্যাটফর্মে ডিজিটাল সার্ভিস ক্যাটাগরি (IMO Diamonds, Bigo Beans, Free Fire, TikTok, Flexiload) দেখতে ও অর্ডার প্লেস করতে হলে:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-slate-300">
            <li><strong>ধাপ ১:</strong> আপনার IMO প্রোফাইল স্ক্রিনশট ও আইডি দিয়ে KYC সাবমিট করুন।</li>
            <li><strong>ধাপ ২:</strong> রিসেলার সিকিউরিটি ডিপোজিট হিসেবে মিনিমাম <strong>৳২,০০০</strong> টাকা ওয়ালেটে ডিপোজিট করুন।</li>
            <li><strong>ধাপ ৩:</strong> এডমিন আপনার ডকুমেন্টস ও ডিপোজিট চেক করে <strong>অ্যাপ্রুভ</strong> করলেই সব ক্যাটাগরি স্বয়ংক্রিয়ভাবে চালু হয়ে যাবে।</li>
          </ul>
        </div>
      </div>

      {/* The 3 Steps Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Step 1: KYC */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between transition-all ${
          isKycVerified
            ? 'bg-emerald-950/20 border-emerald-500/40'
            : isKycSubmitted
            ? 'bg-amber-950/20 border-amber-500/40'
            : isKycRejected
            ? 'bg-rose-950/20 border-rose-500/40'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="font-bold text-slate-400 uppercase tracking-wider">
                Step 1: KYC Documents
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isKycVerified
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : isKycSubmitted
                  ? 'bg-amber-500/20 text-amber-400'
                  : isKycRejected
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {isKycVerified ? 'Verified ✅' : isKycSubmitted ? 'Pending ⏳' : isKycRejected ? 'Rejected ❌' : 'Incomplete'}
              </span>
            </div>

            <h4 className="text-base font-bold text-white mb-1">
              IMO Identity Proof
            </h4>
            <p className="text-xs text-slate-400">
              Submit registered phone, Gmail, IMO ID, and uncropped profile screenshot.
            </p>

            {isKycSubmitted && !isKycVerified && (
              <div className="mt-3 p-2 rounded-xl bg-amber-500/10 text-[11px] text-amber-300">
                Documents under manual review by Admin
              </div>
            )}

            {isKycRejected && (
              <div className="mt-3 p-2 rounded-xl bg-rose-500/10 text-[11px] text-rose-300">
                Reason: {currentUser.kyc.rejectionReason}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800">
            {isKycVerified ? (
              <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>KYC Approved</span>
              </div>
            ) : (
              <button
                onClick={() => setOpenKycModal(true)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 shadow"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isKycRejected ? 'Resubmit KYC' : isKycSubmitted ? 'Update KYC' : 'Submit KYC Details'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Step 2: Minimum ৳2,000 Deposit */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between transition-all ${
          isDepositPaid
            ? 'bg-emerald-950/20 border-emerald-500/40'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="font-bold text-slate-400 uppercase tracking-wider">
                Step 2: Security Deposit
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isDepositPaid
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-800 text-amber-400'
              }`}>
                {isDepositPaid ? 'Deposited ✅' : 'Required ৳2,000'}
              </span>
            </div>

            <h4 className="text-base font-bold text-white mb-1">
              Minimum ৳2,000 Balance
            </h4>
            <p className="text-xs text-slate-400">
              Mandatory refundable security deposit held in your account.
            </p>

            <div className="mt-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex justify-between items-center text-xs">
              <span className="text-slate-400">Current Balance:</span>
              <span className={`font-bold font-mono ${isDepositPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                {formatBDT(totalBalance)} / ৳2,000
              </span>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800">
            {isDepositPaid ? (
              <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Deposit Completed</span>
              </div>
            ) : (
              <button
                onClick={() => setOpenDepositModal(true)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Deposit Minimum ৳2,000</span>
              </button>
            )}
          </div>
        </div>

        {/* Step 3: Admin Approval */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between transition-all ${
          isFullyApproved
            ? 'bg-emerald-950/20 border-emerald-500/40'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="font-bold text-slate-400 uppercase tracking-wider">
                Step 3: Admin Review
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isFullyApproved
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-800 text-amber-400'
              }`}>
                {isFullyApproved ? 'Approved ✅' : 'Waiting Admin'}
              </span>
            </div>

            <h4 className="text-base font-bold text-white mb-1">
              Final Authorization
            </h4>
            <p className="text-xs text-slate-400">
              Master Admin reviews your proof and approves category access.
            </p>

            <div className="mt-3 p-2 rounded-xl bg-slate-800/60 text-[11px] text-slate-300">
              {isFullyApproved
                ? 'Your account is active. Categories unlocked!'
                : isKycSubmitted && isDepositPaid
                ? 'Your submission is queued for fast-track Admin approval.'
                : 'Please complete Step 1 & Step 2 above first.'}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Auto-unlock upon Admin verification</span>
            </span>
          </div>
        </div>
      </div>

      {/* Locked Categories Preview (shows locked lock icons) */}
      <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Lock className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Locked Digital Top-Up Categories (Unlocked After Admin Approval)
            </span>
          </div>
          <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            🔒 Locked
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 opacity-50 pointer-events-none select-none filter blur-[0.5px]">
          {[
            { name: 'IMO Diamonds', icon: '💎' },
            { name: 'Bigo Live Beans', icon: '🌟' },
            { name: 'TikTok Coins', icon: '🎵' },
            { name: 'BD Mobile Recharge', icon: '📱' },
            { name: 'Free Fire & PUBG', icon: '🔥' },
            { name: 'Google Play Gift Cards', icon: '💳' },
          ].map((cat, i) => (
            <div key={i} className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-center">
              <div className="text-2xl mb-1">{cat.icon}</div>
              <div className="text-xs font-bold text-slate-200">{cat.name}</div>
              <div className="text-[10px] text-amber-400 mt-1 flex items-center justify-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                <span>Locked</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
