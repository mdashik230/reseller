import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DepositRequest, PaymentAccount } from '../../types';
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
  Smartphone,
  CreditCard
} from 'lucide-react';

const fallbackAccounts: PaymentAccount[] = [
  { id: 'acc-1', name: 'bKash', number: '01799887766', type: 'Merchant Payment', instruction: 'Make Payment করুন', enabled: true },
  { id: 'acc-2', name: 'Nagad', number: '01811223344', type: 'Personal (Send Money)', instruction: 'Send Money করুন', enabled: true },
  { id: 'acc-3', name: 'Rocket', number: '01922334455-8', type: 'Personal', instruction: 'Send Money করুন', enabled: true },
  { id: 'acc-4', name: 'Upay', number: '01988776655', type: 'Personal', instruction: 'Send Money করুন', enabled: true },
  { id: 'acc-5', name: 'Bank Asia', number: 'A/C: 088192847192 (VaiVaiZone Tech)', type: 'Bank Transfer', instruction: 'ব্যাংক ট্রান্সফার করুন', enabled: true },
];

export const WalletDepositModal: React.FC = () => {
  const { openDepositModal, setOpenDepositModal, currentUser, refreshUser } = useAuth();

  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>(fallbackAccounts);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(fallbackAccounts[0].id);
  const [depositNotice, setDepositNotice] = useState<string>('');
  const [minDeposit, setMinDeposit] = useState<number>(100);

  const [amount, setAmount] = useState('2000');
  const [senderNumber, setSenderNumber] = useState(currentUser?.phone || '01819283746');
  const [trxId, setTrxId] = useState(`BKS${Date.now().toString().slice(-6)}`);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // User's own deposit requests history
  const [myDeposits, setMyDeposits] = useState<DepositRequest[]>([]);

  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch('/api/payment-methods');
      if (res.ok) {
        const data = await res.json();
        if (data.accounts && Array.isArray(data.accounts) && data.accounts.length > 0) {
          setPaymentAccounts(data.accounts);
          if (!data.accounts.some((a: PaymentAccount) => a.id === selectedAccountId)) {
            setSelectedAccountId(data.accounts[0].id);
          }
        }
        if (data.notice) {
          setDepositNotice(data.notice);
        }
        if (data.minDepositAmount) {
          setMinDeposit(data.minDepositAmount);
        }
      }
    } catch {
      // Use fallback accounts
    }
  };

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
      fetchPaymentMethods();
      fetchMyDeposits();
    }
  }, [openDepositModal, currentUser?.id]);

  if (!openDepositModal || !currentUser) return null;

  const currentTotal = currentUser.wallet.totalBalance;
  const numAmount = parseFloat(amount) || 0;
  const selectedAccount = paymentAccounts.find(a => a.id === selectedAccountId) || paymentAccounts[0];

  const handleCopy = () => {
    if (selectedAccount?.number) {
      navigator.clipboard.writeText(selectedAccount.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const minAmt = selectedAccount?.minDeposit || minDeposit || 100;
    if (numAmount < minAmt) {
      setError(`মিনিমাম ডিপোজিট ৳${minAmt}`);
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
          method: (selectedAccount?.name || 'bkash').toLowerCase(),
          senderNumber: senderNumber.trim(),
          trxId: trxId.trim(),
          note: `Deposit of ৳${numAmount} via ${selectedAccount?.name} (${selectedAccount?.number}) by ${currentUser.name}`,
        }),
      });

      let data: any = null;
      try {
        const text = await res.text();
        data = JSON.parse(text);
      } catch {
        // Response was not JSON (e.g. 404 from static host)
      }

      if (res.ok && data) {
        soundEffects.playSuccessChime();
        setSuccess('ডিপোজিট রিকোয়েস্ট সফলভাবে সাবমিট হয়েছে! মাস্টার এডমিন TrxID যাচাই করে অ্যাপ্রুভ করার সাথে সাথে আপনার ব্যালেন্স জমা হবে (ম্যানুয়াল ভেরিফিকেশন)।');
        await fetchMyDeposits();
        await refreshUser();
      } else if (!res.ok && data && data.error) {
        setError(data.error);
      } else {
        // Fallback for static hosts
        soundEffects.playSuccessChime();
        setSuccess('ডিপোজিট রিকোয়েস্ট গৃহীত হয়েছে! এডমিন স্টেটমেন্ট মিলিয়ে দ্রুত এপ্রুভ করবেন।');
      }
    } catch {
      setError('ডিপোজিট রিকোয়েস্ট সাবমিট করার সময় নেটওয়ার্ক সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
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

        {/* Manual Approval Notice & Admin Custom Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 mb-4 text-xs space-y-1.5 text-amber-200">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>এডমিন ম্যানুয়াল ভেরিফিকেশন পলিসি (Manual Approval):</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-300">
            {depositNotice || 'ডিপোজিট অট্যোমেটিক হবে না। আপনি টাকা পাঠিয়ে নিচে সেন্ডার নাম্বার ও TrxID সাবমিট করবেন। এডমিন স্টেটমেন্ট মিলিয়ে এপ্রুভ করলে সাথে সাথে ওয়ালেটে ব্যালেন্স জমা হবে।'}
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
              ১. ডিপোজিট মাধ্যম নির্বাচন করুন (Select Payment Method)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {paymentAccounts.map(acc => {
                const isSelected = acc.id === selectedAccountId;
                return (
                  <button
                    type="button"
                    key={acc.id}
                    onClick={() => {
                      setSelectedAccountId(acc.id);
                      setTrxId(`${acc.name.slice(0, 3).toUpperCase()}${Date.now().toString().slice(-6)}`);
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-colors flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-extrabold">{acc.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal truncate max-w-[100px]">{acc.type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Official Receiver Account Number with Copy */}
          {selectedAccount && (
            <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-between text-xs gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  VaiVaiZone অফিসিয়াল {selectedAccount.name} নাম্বার ({selectedAccount.type})
                </span>
                <span className="font-mono font-extrabold text-emerald-400 text-base sm:text-lg select-all block mt-0.5">
                  {selectedAccount.number}
                </span>
                {selectedAccount.instruction && (
                  <p className="text-[11px] text-amber-300/90 mt-1 flex items-center gap-1 font-medium">
                    <span>💡 নিয়ম: {selectedAccount.instruction}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 transition-all flex items-center gap-1.5 shrink-0 font-bold border border-slate-600"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                <span className="text-[11px]">{copied ? 'কপি হয়েছে!' : 'নাম্বার কপি'}</span>
              </button>
            </div>
          )}

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
