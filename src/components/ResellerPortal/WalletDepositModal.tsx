import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DepositRequest } from '../../types';
import { formatBDT, formatDate } from '../../utils/formatters';
import { soundEffects } from '../../utils/audio';
import {
  X,
  PlusCircle,
  Lock,
  Zap,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Clock,
  Smartphone
} from 'lucide-react';

export const WalletDepositModal: React.FC = () => {
  const { openDepositModal, setOpenDepositModal, currentUser, refreshUser } = useAuth();

  const [method, setMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'bank'>('bkash');
  const [amount, setAmount] = useState('2000');
  const [senderNumber, setSenderNumber] = useState(currentUser?.phone || '01819283746');
  const [trxId, setTrxId] = useState(`BKS${Date.now().toString().slice(-6)}`);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // User's own deposit requests history
  const [myDeposits, setMyDeposits] = useState<DepositRequest[]>([]);

  const fetchMyDeposits = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/wallet/deposit-requests?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.deposits) setMyDeposits(data.deposits);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (openDepositModal) {
      fetchMyDeposits();
    }
  }, [openDepositModal, currentUser?.id]);

  if (!openDepositModal || !currentUser) return null;

  const currentTotal = currentUser.wallet.totalBalance;
  const numAmount = parseFloat(amount) || 0;

  const paymentNumbers = {
    bkash: '01799887766 (bKash Merchant Payment)',
    nagad: '01811223344 (Nagad Personal Send Money)',
    rocket: '01922334455-8 (Rocket Personal)',
    bank: 'Bank Asia A/C: 088192847192 (VaiVaiZone Tech)',
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentNumbers[method]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (numAmount < 100) {
      setError('মিনিমাম ডিপোজিট ১০০৳');
      return;
    }
    if (!senderNumber.trim() || !trxId.trim()) {
      setError('অনুগ্রহ করে সেন্ডার নাম্বার এবং TrxID পূরণ করুন');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/wallet/deposit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          amount: numAmount,
          method,
          senderNumber: senderNumber.trim(),
          trxId: trxId.trim(),
          note: `Deposit of ৳${numAmount} via ${method.toUpperCase()} by ${currentUser.name}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit deposit request');
      } else {
        soundEffects.playSuccessChime();
        setSuccess('ডিপোজিট রিকোয়েস্ট সফলভাবে সাবমিট হয়েছে! মাস্টার এডমিন TrxID যাচাই করে অ্যাপ্রুভ করার সাথে সাথে আপনার ব্যালেন্স জমা হবে (ম্যানুয়াল ভেরিফিকেশন)।');
        await fetchMyDeposits();
        await refreshUser();
      }
    } catch {
      setError('Network error submitting deposit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 text-white">
        
        <button
          onClick={() => setOpenDepositModal(false)}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              অ্যাড মানি / সিকিউরিটি ডিপোজিট রিকোয়েস্ট
            </h3>
            <p className="text-xs text-slate-400">
              Submit TrxID — Master Admin reviews &amp; approves before balance credit (No Auto-Credit)
            </p>
          </div>
        </div>

        {/* Manual Approval Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 mb-4 text-xs space-y-1.5 text-amber-200">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>এডমিন ম্যানুয়াল ভেরিফিকেশন পলিসি (Manual Approval):</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-300">
            ডিপোজিট অট্যোমেটিক হবে না। আপনি টাকা পাঠিয়ে নিচে <strong>সেন্ডার নাম্বার</strong> ও <strong>TrxID</strong> সাবমিট করবেন। এডমিন স্টেটমেন্ট মিলিয়ে এপ্রুভ করলে সাথে সাথে ওয়ালেটে ব্যালেন্স জমা হবে।
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              ১. ডিপোজিট মাধ্যম নির্বাচন করুন (Select Method)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'bkash', name: 'bKash' },
                { id: 'nagad', name: 'Nagad' },
                { id: 'rocket', name: 'Rocket' },
                { id: 'bank', name: 'Bank' },
              ].map(m => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => {
                    setMethod(m.id as any);
                    setTrxId(`${m.name.slice(0, 3).toUpperCase()}${Date.now().toString().slice(-6)}`);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    method === m.id
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Official Receiver Account Number with Copy */}
          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                VaiVaiZone অফিসিয়াল পেমেন্ট নাম্বার
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {paymentNumbers[method]}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Amount input & Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              ২. জমার পরিমাণ (Deposit Amount ৳) *
            </label>
            <input
              type="number"
              min="100"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-base font-bold text-white font-mono focus:outline-none focus:border-emerald-500"
            />
            <div className="flex gap-2 mt-2">
              {['1000', '2000', '3000', '5000', '10000'].map(val => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setAmount(val)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700"
                >
                  ৳{val}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                ৩. যে নাম্বার থেকে টাকা পাঠিয়েছেন (Sender Mobile) *
              </label>
              <input
                type="text"
                value={senderNumber}
                onChange={e => setSenderNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                ৪. ট্রানজেকশন আইডি (TrxID) *
              </label>
              <input
                type="text"
                value={trxId}
                onChange={e => setTrxId(e.target.value)}
                placeholder="যেমনঃ BKS92984812A"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-emerald-400 font-mono font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-98 transition-all disabled:opacity-60"
          >
            {loading ? 'Submitting Request...' : `Submit Deposit Request (${formatBDT(numAmount)})`}
          </button>
        </form>

        {/* Reseller's Recent Deposit Requests Status */}
        {myDeposits.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              আপনার সাম্প্রতিক ডিপোজিট স্ট্যাটাস (Your Deposit Requests)
            </h5>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {myDeposits.map(d => (
                <div key={d.id} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span>{formatBDT(d.amount)}</span>
                      <span className="uppercase text-[10px] text-cyan-400">({d.method})</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Trx: {d.trxId} • Sender: {d.senderNumber}
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    d.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : d.status === 'pending'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {d.status === 'approved' ? 'Approved ✅' : d.status === 'pending' ? 'Pending Admin Review ⏳' : 'Rejected ❌'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
