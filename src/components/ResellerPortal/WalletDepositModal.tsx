import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DepositRequest, PaymentAccount } from '../../types';
import { formatBDT, formatDate } from '../../utils/formatters';
import { soundEffects } from '../../utils/audio';
import { persistentStore, onStoreUpdate } from '../../utils/persistentStore';
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
  CreditCard,
  Sparkles,
  MessageCircle,
  ExternalLink,
  ArrowRight
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
  const [supportWhatsapp, setSupportWhatsapp] = useState<string>('01811223344');

  const [amount, setAmount] = useState('2000');
  const [senderNumber, setSenderNumber] = useState(currentUser?.phone || '01819283746');
  const [trxId, setTrxId] = useState(`BKS${Date.now().toString().slice(-6)}`);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submittedSuccessData, setSubmittedSuccessData] = useState<DepositRequest | null>(null);

  // User's own deposit requests history
  const [myDeposits, setMyDeposits] = useState<DepositRequest[]>([]);

  const fetchPaymentMethods = async () => {
    try {
      const data = await persistentStore.getPaymentSettings();
      if (data.accounts && Array.isArray(data.accounts) && data.accounts.length > 0) {
        setPaymentAccounts(data.accounts.filter(a => a.enabled));
        if (!data.accounts.some((a: PaymentAccount) => a.id === selectedAccountId && a.enabled)) {
          const firstEnabled = data.accounts.find(a => a.enabled) || data.accounts[0];
          setSelectedAccountId(firstEnabled.id);
        }
      }
      if (data.notice) {
        setDepositNotice(data.notice);
      }
      if (data.minDepositAmount) {
        setMinDeposit(data.minDepositAmount);
      }
      if (data.supportWhatsapp) {
        setSupportWhatsapp(data.supportWhatsapp);
      }
    } catch {
      // Use fallback accounts
    }
  };

  const fetchMyDeposits = async () => {
    if (!currentUser) return;
    try {
      const all = await persistentStore.getDeposits();
      setMyDeposits(all.filter(d => d.resellerId === currentUser.id));
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (openDepositModal) {
      setSubmittedSuccessData(null);
      fetchPaymentMethods();
      fetchMyDeposits();
    }
    const unsubscribe = onStoreUpdate(e => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail || ['payments', 'deposits', 'wallet'].includes(customEvent.detail.type)) {
        fetchPaymentMethods();
        fetchMyDeposits();
      }
    });
    return unsubscribe;
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
      const created = await persistentStore.submitDeposit({
        resellerId: currentUser.id,
        resellerName: currentUser.name,
        resellerEmail: currentUser.email,
        amount: numAmount,
        method: (selectedAccount?.name || 'bkash').toLowerCase() as any,
        senderNumber: senderNumber.trim(),
        trxId: trxId.trim(),
        note: `Deposit of ৳${numAmount} via ${selectedAccount?.name} (${selectedAccount?.number}) by ${currentUser.name}`,
      });

      soundEffects.playSuccessChime();
      setSubmittedSuccessData(created);
      await fetchMyDeposits();
      await refreshUser();
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
          onClick={() => {
            setSubmittedSuccessData(null);
            setOpenDepositModal(false);
          }}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submittedSuccessData ? (
          <div className="py-2 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Badge & Title */}
            <div className="text-center space-y-2">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/30 animate-pulse">
                  <CheckCircle className="w-9 h-9" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <h4 className="text-xl font-bold text-white">
                  ডিপোজিট রিকোয়েস্ট সফলভাবে জমা হয়েছে! 🎉
                </h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                  আপনার জমাটি রিসিভ করা হয়েছে। মাস্টার এডমিন স্টেটমেন্টের সাথে TrxID মিলিয়ে খুব দ্রুত ওয়ালেটে ব্যালেন্স অ্যাড করে দেবেন।
                </p>
              </div>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <span className="text-xs text-slate-400">ডিপোজিট পরিমাণ</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {formatBDT(submittedSuccessData.amount)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-0.5">পেমেন্ট মাধ্যম</span>
                  <span className="font-bold text-white flex items-center gap-1.5 uppercase">
                    <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                    {submittedSuccessData.method}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-0.5">সেন্ডার নম্বর</span>
                  <span className="font-mono font-bold text-slate-200 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                    {submittedSuccessData.senderNumber}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-0.5">ট্রানজেকশন আইডি (TrxID)</span>
                    <span className="font-mono font-bold text-emerald-300 text-sm">
                      {submittedSuccessData.trxId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(submittedSuccessData.trxId);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'কপি হয়েছে' : 'কপি TrxID'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-amber-300">
                  <Clock className="w-3.5 h-3.5" />
                  স্ট্যাটাস: পেন্ডিং রিভিউ (৫-১৫ মিনিট)
                </span>
                <span>{new Date(submittedSuccessData.createdAt).toLocaleTimeString('bn-BD')}</span>
              </div>
            </div>

            {/* Reassurance Notice */}
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-200/90 flex items-start gap-2.5 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                সতর্কতা: সিকিউরিটির স্বার্থে অটো-অ্যাড বন্ধ রাখা হয়েছে। এডমিন ভেরিফাই করে কনফার্ম করলেই স্বয়ংক্রিয়ভাবে নোটিফিকেশন পাবেন ও ওয়ালেটে টাকা যোগ হবে।
              </span>
            </div>

            {/* Quick Action Buttons */}
            <div className="space-y-2 pt-1">
              <a
                href={`https://wa.me/${supportWhatsapp.replace(/[^0-9]/g, '').startsWith('88') ? supportWhatsapp.replace(/[^0-9]/g, '') : '88' + supportWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`আসসালামু আলাইকুম, আমি VaiVaiZone Reseller Portal এ একটি ডিপোজিট রিকোয়েস্ট করেছি।\n\n📌 TrxID: ${submittedSuccessData.trxId}\n💰 পরিমাণ: ${submittedSuccessData.amount} টাকা\n💳 মাধ্যম: ${submittedSuccessData.method.toUpperCase()}\n📱 সেন্ডার: ${submittedSuccessData.senderNumber}\n\nঅনুগ্রহ করে চেক করে ওয়ালেটে ব্যালেন্স এপ্রুভ করুন। ধন্যবাদ!`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.01]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>এডমিনকে দ্রুত এপ্রুভালের জন্য WhatsApp-এ জানান (Notify WhatsApp)</span>
                <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-70" />
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedSuccessData(null);
                    setSuccess(null);
                    setTrxId(`${selectedAccount?.name.slice(0, 3).toUpperCase() || 'TRX'}${Date.now().toString().slice(-6)}`);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors"
                >
                  আরেকটি ডিপোজিট করুন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedSuccessData(null);
                    setSuccess(null);
                    setOpenDepositModal(false);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>ড্যাশবোর্ডে ফিরুন</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>

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
        </>
      )}

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
