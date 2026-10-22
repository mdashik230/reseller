import React, { useState, useEffect } from 'react';
import { DepositRequest } from '../../types';
import { formatBDT, formatDate } from '../../utils/formatters';
import { soundEffects } from '../../utils/audio';
import {
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  Smartphone
} from 'lucide-react';

export const DepositApprovalManager: React.FC = () => {
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [loading, setLoading] = useState(false);
  const [rejectingDeposit, setRejectingDeposit] = useState<DepositRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('Transaction ID not found in official statement.');
  const [copiedTrx, setCopiedTrx] = useState<string | null>(null);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/deposits');
      if (res.ok) {
        const data = await res.json();
        if (data.deposits) {
          setDeposits(data.deposits);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
    const interval = setInterval(fetchDeposits, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleReview = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const res = await fetch(`/api/admin/deposits/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason: reason }),
      });
      if (res.ok) {
        soundEffects.playSuccessChime();
        await fetchDeposits();
        setRejectingDeposit(null);
      }
    } catch {
      soundEffects.playWarningChime();
    }
  };

  const handleCopyTrx = (trx: string) => {
    navigator.clipboard.writeText(trx);
    setCopiedTrx(trx);
    setTimeout(() => setCopiedTrx(null), 2000);
  };

  const filtered = deposits.filter(d => {
    const matchesSearch =
      d.resellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.senderNumber.includes(searchQuery) ||
      d.trxId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = deposits.filter(d => d.status === 'pending').length;

  return (
    <div className="space-y-4">
      
      {/* Top Header & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            {pendingCount > 0 && (
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block animate-ping absolute -top-0.5 -right-0.5" />
            )}
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Manual Deposit Approval Queue (অপেক্ষমান ডিপোজিট)</span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950">
                  {pendingCount} PENDING
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-400">
              No automatic credits — verify Transaction ID with bKash/Nagad before approving
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search TrxID, phone..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-colors ${
                  statusFilter === status
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Deposits List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
            No deposit requests found in this view.
          </div>
        ) : (
          filtered.map(dep => {
            const isPending = dep.status === 'pending';
            const isApproved = dep.status === 'approved';
            const isRejected = dep.status === 'rejected';

            return (
              <div
                key={dep.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isPending
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : isApproved
                    ? 'bg-slate-900/80 border-slate-800'
                    : 'bg-rose-950/15 border-rose-500/30'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left Info */}
                  <div className="flex items-start gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xs uppercase shrink-0 border ${
                      dep.method === 'bkash'
                        ? 'bg-pink-950/40 border-pink-500/40 text-pink-400'
                        : dep.method === 'nagad'
                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-400'
                        : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-400'
                    }`}>
                      {dep.method}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-base text-white font-mono-numbers">
                          {formatBDT(dep.amount)}
                        </span>
                        <span className="text-xs font-bold text-slate-300">
                          from {dep.resellerName}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPending
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : isApproved
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {isPending ? 'Pending Verification ⏳' : isApproved ? 'Approved & Credited ✅' : 'Rejected ❌'}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                        <span className="flex items-center gap-1">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          Sender Mobile: <strong className="font-mono text-white">{dep.senderNumber}</strong>
                        </span>

                        <span className="flex items-center gap-1.5">
                          TrxID: <strong className="font-mono text-cyan-400 bg-slate-800 px-1.5 py-0.5 rounded">{dep.trxId}</strong>
                          <button
                            onClick={() => handleCopyTrx(dep.trxId)}
                            className="text-slate-400 hover:text-white p-0.5"
                            title="Copy TrxID"
                          >
                            {copiedTrx === dep.trxId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </span>

                        <span className="text-slate-500 text-[11px]">
                          {formatDate(dep.createdAt)}
                        </span>
                      </div>

                      {dep.rejectionReason && (
                        <div className="mt-1.5 text-[11px] text-rose-400 italic">
                          Rejection Reason: {dep.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    {isPending && (
                      <>
                        <button
                          onClick={() => setRejectingDeposit(dep)}
                          className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>

                        <button
                          onClick={() => handleReview(dep.id, 'approve')}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve &amp; Credit Balance</span>
                        </button>
                      </>
                    )}

                    {isApproved && (
                      <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Credited on {formatDate(dep.reviewedAt || '')}</span>
                      </span>
                    )}

                    {isRejected && (
                      <button
                        onClick={() => handleReview(dep.id, 'approve')}
                        className="text-xs text-slate-400 hover:text-white underline"
                      >
                        Re-Approve Deposit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject Modal */}
      {rejectingDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500/40 p-6 text-white shadow-2xl">
            <h4 className="text-base font-bold text-rose-400 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              <span>Reject Deposit Request</span>
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Rejecting {formatBDT(rejectingDeposit.amount)} request from {rejectingDeposit.resellerName} (Trx: {rejectingDeposit.trxId}).
            </p>

            <div className="my-4">
              <label className="block text-xs text-slate-400 mb-1">
                Reason for Rejection
              </label>
              <input
                type="text"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingDeposit(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReview(rejectingDeposit.id, 'reject', rejectReason)}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
