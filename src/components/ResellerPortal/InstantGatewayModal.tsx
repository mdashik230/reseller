import React, { useState } from 'react';
import { formatBDT } from '../../utils/formatters';
import { X, CheckCircle, Smartphone, ShieldCheck, ArrowRight } from 'lucide-react';

interface InstantGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  payableAmount: number;
  orderSummary: string;
  onPaymentSuccess: (gatewayName: string, trxId: string) => void;
}

export const InstantGatewayModal: React.FC<InstantGatewayModalProps> = ({
  isOpen,
  onClose,
  payableAmount,
  orderSummary,
  onPaymentSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'bkash' | 'nagad' | 'uddoktapay'>('bkash');
  const [senderNumber, setSenderNumber] = useState('01819283746');
  const [trxId, setTrxId] = useState(`TRX${Date.now().toString().slice(-6)}`);
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSimulatePayment = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onPaymentSuccess(
        selectedMethod === 'bkash' ? 'bKash Live Gateway' : selectedMethod === 'nagad' ? 'Nagad Live Gateway' : 'UddoktaPay BD',
        trxId
      );
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-white">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Instant Live Payment Gateway
            </h3>
            <p className="text-xs text-slate-400">
              Direct checkout (bypass wallet balance)
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 mb-4">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Item:</span>
            <span className="font-semibold text-slate-200">{orderSummary}</span>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700 text-sm">
            <span className="font-bold text-slate-300">Amount to Pay:</span>
            <span className="text-lg font-extrabold text-emerald-400 font-mono-numbers">
              {formatBDT(payableAmount)}
            </span>
          </div>
        </div>

        {/* Method selector */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <button
            type="button"
            onClick={() => setSelectedMethod('bkash')}
            className={`p-3 rounded-2xl border text-center transition-all ${
              selectedMethod === 'bkash'
                ? 'bg-pink-950/40 border-pink-500 text-pink-400 font-bold'
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}
          >
            <div className="text-sm font-extrabold">bKash</div>
            <div className="text-[10px] opacity-80">Instant Live</div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod('nagad')}
            className={`p-3 rounded-2xl border text-center transition-all ${
              selectedMethod === 'nagad'
                ? 'bg-amber-950/40 border-amber-500 text-amber-400 font-bold'
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}
          >
            <div className="text-sm font-extrabold">Nagad</div>
            <div className="text-[10px] opacity-80">Instant Live</div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod('uddoktapay')}
            className={`p-3 rounded-2xl border text-center transition-all ${
              selectedMethod === 'uddoktapay'
                ? 'bg-cyan-950/40 border-cyan-500 text-cyan-400 font-bold'
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}
          >
            <div className="text-sm font-extrabold">UddoktaPay</div>
            <div className="text-[10px] opacity-80">Multi-Channel</div>
          </button>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Sender Mobile Number
            </label>
            <input
              type="text"
              value={senderNumber}
              onChange={e => setSenderNumber(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Gateway Transaction ID (Auto-Generated)
            </label>
            <input
              type="text"
              value={trxId}
              onChange={e => setTrxId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-400"
            />
          </div>
        </div>

        <button
          type="button"
          disabled={processing}
          onClick={handleSimulatePayment}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          {processing ? (
            <span>Authorizing Payment...</span>
          ) : (
            <>
              <span>Confirm &amp; Place Order ({formatBDT(payableAmount)})</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
