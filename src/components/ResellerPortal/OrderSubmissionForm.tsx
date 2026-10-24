import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ServiceItem, Order } from '../../types';
import { formatBDT } from '../../utils/formatters';
import { soundEffects } from '../../utils/audio';
import { persistentStore, onStoreUpdate } from '../../utils/persistentStore';
import { InstantGatewayModal } from './InstantGatewayModal';
import {
  Zap,
  ShoppingBag,
  CreditCard,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Tag,
  KeyRound,
  DollarSign,
  Smartphone
} from 'lucide-react';

interface OrderSubmissionFormProps {
  onOrderSuccess: (order: Order) => void;
}

export const OrderSubmissionForm: React.FC<OrderSubmissionFormProps> = ({ onOrderSuccess }) => {
  const { currentUser, updateUserWallet, refreshUser, setOpenDepositModal } = useAuth();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [manualQuantity, setManualQuantity] = useState('1000');
  const [paymentMethod, setPaymentMethod] = useState<'usable_wallet' | 'instant_gateway'>('usable_wallet');
  
  // Gateway modal
  const [openGatewayModal, setOpenGatewayModal] = useState(false);

  // Security OTP for high value
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [demoGeneratedOtp, setDemoGeneratedOtp] = useState('');

  // States
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  const loadServices = async () => {
    try {
      const data = await persistentStore.getServices();
      const visible = data.filter(s => !s.hidden);
      if (visible && visible.length > 0) {
        setServices(visible);
        setSelectedService(prev => {
          if (!prev) return visible[0];
          const matched = visible.find(s => s.id === prev.id);
          return matched || visible[0];
        });
      }
    } catch {}
  };

  useEffect(() => {
    loadServices();
    const unsubscribe = onStoreUpdate(e => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail || customEvent.detail.type === 'services') {
        loadServices();
      }
    });
    return unsubscribe;
  }, []);

  const handleSelectService = (srv: ServiceItem) => {
    setSelectedService(srv);
    setErrorMsg(null);
  };

  // Dynamic Rate per 1000 Calculation (Admin sets rate per 1000 in one place for each category)
  const unitName = selectedService?.unitName || 'Diamonds 💎';
  const customerRatePer1000 = selectedService?.customerRatePer1000 || 2250;
  const resellerRatePer1000 = selectedService?.resellerRatePer1000 || 2180;
  const numQuantity = parseFloat(manualQuantity) || 0;

  // Exact Deduction Formula: (quantity / 1000) * resellerRatePer1000
  // e.g. 1000 diamonds -> (1000/1000) * 2180 = 2180 BDT deducted from reseller balance
  const resellerPrice = Math.max(0, Math.round(((numQuantity / 1000) * resellerRatePer1000) * 100) / 100);
  const retailPrice = Math.max(0, Math.round(((numQuantity / 1000) * customerRatePer1000) * 100) / 100);
  const profitMargin = Math.max(0, Math.round((retailPrice - resellerPrice) * 100) / 100);

  // Dual-Balance Rule Checks
  const totalBalance = currentUser?.wallet.totalBalance || 0;
  const usableBalance = currentUser?.wallet.usableBalance || 0;
  const lockedDeposit = currentUser?.wallet.lockedSecurityDeposit || 2000;

  const isBalanceSufficient = usableBalance >= resellerPrice;
  const isBalanceLockedOrDepleted = totalBalance <= lockedDeposit || usableBalance <= 0;

  const handleInitiateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessOrder(null);

    if (!currentUser) return;
    if (!customerId.trim()) {
      setErrorMsg(`Please enter the customer's ${selectedService?.inputLabel || 'Number / Account ID'}`);
      return;
    }
    if (numQuantity <= 0) {
      setErrorMsg(`Please enter a valid top-up quantity (${unitName})`);
      return;
    }

    if (paymentMethod === 'usable_wallet') {
      if (totalBalance <= lockedDeposit) {
        soundEffects.playWarningChime();
        setErrorMsg(
          `ORDER RESTRICTED: Total balance (${formatBDT(totalBalance)}) is at or below the mandatory ৳${lockedDeposit} Security Deposit. Usable Balance is ৳0. Please add funds or pay via Instant Live Gateway.`
        );
        return;
      }
      if (!isBalanceSufficient) {
        soundEffects.playWarningChime();
        setErrorMsg(
          `Insufficient Usable Balance! Order requires ${formatBDT(resellerPrice)}, but your Usable Balance is only ${formatBDT(usableBalance)} (Mandatory ৳${lockedDeposit} deposit is locked).`
        );
        return;
      }
    }

    // High-value OTP check (orders >= ৳2,500)
    if (resellerPrice >= 2500 && !otpCode) {
      const generated = Math.floor(100000 + Math.random() * 900000).toString();
      setDemoGeneratedOtp(generated);
      setShowOtpModal(true);
      return;
    }

    if (paymentMethod === 'instant_gateway') {
      setOpenGatewayModal(true);
      return;
    }

    executeOrderPlacement();
  };

  const executeOrderPlacement = async (gatewayName?: string, gatewayTrxId?: string) => {
    if (!currentUser || !selectedService) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/orders/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          serviceId: selectedService.id,
          customerId: customerId.trim(),
          quantity: numQuantity,
          paymentMethod,
          gatewayName,
          gatewayTrxId,
        }),
      });

      let data: any = null;
      try {
        const text = await res.text();
        data = JSON.parse(text);
      } catch {
        // Non-JSON response
      }

      if (!res.ok || !data) {
        soundEffects.playWarningChime();
        setErrorMsg(data?.error || 'অর্ডার সাবমিট করতে সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট ও ব্যালেন্স চেক করুন।');
      } else {
        soundEffects.playSuccessChime();
        setSuccessOrder(data.order);
        if (data.wallet) {
          updateUserWallet(data.wallet);
        }
        await refreshUser();
        onOrderSuccess(data.order);
        setCustomerId('');
        setShowOtpModal(false);
        setOtpCode('');
      }
    } catch {
      setErrorMsg('Network error while placing order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl backdrop-blur-xl">
      
      {/* Title */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Order &amp; Top-Up Terminal (ম্যানুয়াল এমাউন্ট ও নাম্বার)
            </h3>
            <p className="text-xs text-slate-400">
              Enter customer account number and manual amount — reseller discount applied instantly
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successOrder && (
        <div className="mt-4 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-sm text-emerald-300">
                Order #{successOrder.id} Dispatched to Admin Queue!
              </p>
              <p className="text-[11px] text-emerald-300/80 mt-0.5">
                {successOrder.serviceName} • Customer: {successOrder.customerId} • Top-up: {successOrder.amountUnit} • Reseller Cost: {formatBDT(successOrder.resellerPrice)} (Profit: +{formatBDT(successOrder.profitEarned)})
              </p>
            </div>
          </div>
          <button
            onClick={() => onOrderSuccess(successOrder)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 shadow"
          >
            Print Receipt / Invoice
          </button>
        </div>
      )}

      {/* Error Message Banner */}
      {errorMsg && (
        <div className="mt-4 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-200">Order Submission Restricted</p>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
          {isBalanceLockedOrDepleted && (
            <button
              onClick={() => setOpenDepositModal(true)}
              className="px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shrink-0 self-center"
            >
              Top Up
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleInitiateOrder} className="mt-5 space-y-5">
        
        {/* Step 1: Service Category Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              ১. সার্ভিস ক্যাটাগরি সিলেক্ট করুন (Select Service)
            </label>
            <span className="text-[11px] text-cyan-400 font-medium">
              সব ক্যাটাগরির নিজস্ব ১০০০-ইউনিট রেট সেট করা আছে
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {services.map(srv => {
              const isSelected = selectedService?.id === srv.id;
              return (
                <button
                  type="button"
                  key={srv.id}
                  onClick={() => handleSelectService(srv)}
                  className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-b from-emerald-500/20 to-teal-500/10 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                      : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-2xl mb-1.5">{srv.icon}</div>
                    <div className="text-xs font-bold leading-snug truncate text-white">
                      {srv.name}
                    </div>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block">১০০০ {srv.unitName?.split(' ')[0] || 'ডায়মন্ড'}:</span>
                    <span className="text-[11px] font-bold text-emerald-400 font-mono-numbers">
                      ৳{srv.resellerRatePer1000?.toLocaleString() || 2180}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Customer Phone Number / IMO ID Field & Manual Diamond/Unit Quantity Field */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Field 1: Customer Number / ID (ম্যানুয়াল লিখার মত) */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
            <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>২. কাস্টমার নাম্বার / IMO আইডি (Customer ID) *</span>
              </span>
            </label>
            <input
              type="text"
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              placeholder={selectedService?.inputPlaceholder || '01XXXXXXXXX বা IMO আইডি'}
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              {selectedService?.description || 'সঠিক নাম্বার বা আইডি টাইপ করুন'}
            </p>
          </div>

          {/* Field 2: Diamond / Unit Quantity Field (ম্যানুয়াল পরিমাণ লিখার ফিল্ড) */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
            <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>৩. টপ-আপ পরিমাণ ({unitName}) *</span>
              </span>
              <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                {unitName}
              </span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={manualQuantity}
              onChange={e => setManualQuantity(e.target.value)}
              placeholder="যেমনঃ 1000"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-lg font-bold text-emerald-400 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
            
            {/* Quick Quantity Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[100, 250, 500, 1000, 1500, 2000, 3000, 5000].map(val => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setManualQuantity(val.toString())}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-mono border transition-colors ${
                    manualQuantity === val.toString()
                      ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  {val.toLocaleString()}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              এডমিন রেট: ১০০০ {unitName} = কাস্টমার {formatBDT(customerRatePer1000)} | রিসেলার {formatBDT(resellerRatePer1000)}
            </p>
          </div>
        </div>

        {/* Dynamic Reseller Rate Calculation Live Card */}
        {numQuantity > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/40 shadow-lg">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Dynamic Rate Calculation ({selectedService?.name})
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                প্রতি ১০০০ রেট: ৳{resellerRatePer1000.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-[11px] text-slate-400 block">টপ-আপ পরিমাণ:</span>
                <span className="text-base font-bold text-cyan-300 font-mono-numbers">
                  {numQuantity.toLocaleString()} {unitName}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">ম্যানুয়াল ইনপুট</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-[11px] text-slate-400 block">কাস্টমার প্রাইজ (Retail):</span>
                <span className="text-base font-bold text-slate-200 font-mono-numbers">
                  {formatBDT(retailPrice)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">রেট: ৳{customerRatePer1000}/1000</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50">
                <span className="text-[11px] text-emerald-300 block font-semibold">রিসেলার খরচ (অ্যাকাউন্ট থেকে কাটা হবে):</span>
                <span className="text-lg font-extrabold text-emerald-400 font-mono-numbers">
                  {formatBDT(resellerPrice)}
                </span>
                <span className="text-[10px] text-emerald-300/80 block mt-0.5">রেট: ৳{resellerRatePer1000}/1000</span>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/50">
                <span className="text-[11px] text-cyan-300 block font-semibold">আপনার নেট লাভ (Margin):</span>
                <span className="text-lg font-extrabold text-cyan-400 font-mono-numbers">
                  +{formatBDT(profitMargin)}
                </span>
                <span className="text-[10px] text-cyan-300/80 block mt-0.5">কাস্টমার - রিসেলার প্রাইজ</span>
              </div>
            </div>

            {/* Clear explanation notice */}
            <div className="mt-3 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
              <span>
                💡 <strong className="text-white">{numQuantity.toLocaleString()} {unitName}</strong> অর্ডার করলে আপনার ওয়ালেট ব্যালেন্স থেকে ঠিক <strong className="text-emerald-400 font-mono-numbers">{formatBDT(resellerPrice)}</strong> মাইনাস হবে।
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                ({numQuantity} / 1000) × {resellerRatePer1000} = ৳{resellerPrice}
              </span>
            </div>
          </div>
        )}

        {/* Step 4: Settlement Payment Method */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            ৪. পেমেন্ট মেথড নির্বাচন করুন (Payment Settlement)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Option 1: Usable Wallet Balance */}
            <button
              type="button"
              onClick={() => setPaymentMethod('usable_wallet')}
              className={`p-4 rounded-2xl border text-left transition-all relative ${
                paymentMethod === 'usable_wallet'
                  ? 'bg-emerald-950/30 border-emerald-500/70 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs text-white">
                    Usable Wallet Balance
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                  Instant • 0% Fee
                </span>
              </div>
              <div className="mt-2 text-xs">
                <span className="text-slate-400">Available to Spend: </span>
                <span className={`font-bold font-mono-numbers ${
                  isBalanceSufficient ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {formatBDT(usableBalance)}
                </span>
              </div>
              {!isBalanceSufficient && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  Insufficient Usable Balance (৳2,000 locked deposit)
                </p>
              )}
            </button>

            {/* Option 2: Instant Live Gateway */}
            <button
              type="button"
              onClick={() => setPaymentMethod('instant_gateway')}
              className={`p-4 rounded-2xl border text-left transition-all relative ${
                paymentMethod === 'instant_gateway'
                  ? 'bg-cyan-950/30 border-cyan-500/70 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-xs text-white">
                    Instant Live Payment Gateway
                  </span>
                </div>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-bold">
                  bKash / Nagad / UddoktaPay
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Direct online checkout without deducting from your account balance.
              </p>
            </button>
          </div>
        </div>

        {/* Submit Order Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting || (paymentMethod === 'usable_wallet' && (!isBalanceSufficient || isBalanceLockedOrDepleted))}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span>Processing Order...</span>
            ) : (
              <>
                <span>Confirm &amp; Place Order ({formatBDT(resellerPrice)})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          {paymentMethod === 'usable_wallet' && !isBalanceSufficient && (
            <p className="text-center text-[11px] text-slate-400 mt-2">
              To proceed, switch to <strong>Instant Live Payment Gateway</strong> or{' '}
              <button
                type="button"
                onClick={() => setOpenDepositModal(true)}
                className="text-emerald-400 hover:underline font-semibold"
              >
                Top Up Wallet Balance
              </button>
            </p>
          )}
        </div>
      </form>

      {/* Gateway Checkout Modal */}
      <InstantGatewayModal
        isOpen={openGatewayModal}
        onClose={() => setOpenGatewayModal(false)}
        payableAmount={resellerPrice}
        orderSummary={`${selectedService?.name} - ${numQuantity.toLocaleString()} ${unitName}`}
        onPaymentSuccess={(gatewayName, trxId) => {
          executeOrderPlacement(gatewayName, trxId);
        }}
      />

      {/* High-Value Security OTP Modal (for orders >= ৳2,500) */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold">High-Value Security Verification</h4>
            <p className="text-xs text-slate-400 mt-1">
              For security, transactions over ৳2,500 require one-time confirmation.
            </p>

            <div className="my-4 p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs">
              <span className="text-slate-400">Security Code: </span>
              <span className="font-mono font-bold text-amber-400 text-base">{demoGeneratedOtp}</span>
            </div>

            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={otpCode}
              onChange={e => setOtpCode(e.target.value)}
              className="w-full px-3 py-2 text-center tracking-widest text-lg font-mono rounded-xl bg-slate-800 border border-slate-700 text-white mb-4"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (otpCode === demoGeneratedOtp) {
                    setShowOtpModal(false);
                    executeOrderPlacement();
                  } else {
                    setErrorMsg('Invalid OTP code. Please use the code displayed above.');
                  }
                }}
                className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
              >
                Verify &amp; Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
