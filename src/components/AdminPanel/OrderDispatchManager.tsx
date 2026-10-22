import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { formatBDT, formatDate, getOrderStatusBadge } from '../../utils/formatters';
import { soundEffects } from '../../utils/audio';
import {
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
  Bell,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export const OrderDispatchManager: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Complete Order Modal state
  const [completingOrder, setCompletingOrder] = useState<Order | null>(null);
  const [operatorTrxId, setOperatorTrxId] = useState('');
  const [operatorNote, setOperatorNote] = useState('');

  // Cancel Order Modal state
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('Invalid customer account number on provider server');

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        const data = await res.json();
        if (data.orders) {
          // Check if new pending order arrived
          if (orders.length > 0 && data.orders.length > orders.length) {
            soundEffects.playOrderAlert();
          }
          setOrders(data.orders);
        }
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [orders.length]);

  const handleUpdateStatus = async (
    orderId: string,
    status: 'processing' | 'completed' | 'cancelled',
    extraNotes?: string,
    trxId?: string
  ) => {
    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          operatorNote: extraNotes,
          operatorTrxId: trxId,
        }),
      });

      if (res.ok) {
        soundEffects.playSuccessChime();
        await fetchOrders();
        setCompletingOrder(null);
        setCancellingOrder(null);
      }
    } catch {
      soundEffects.playWarningChime();
    } finally {
      setActionLoading(null);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.resellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.serviceName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' ? true : o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Top Bar with Live Count & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block animate-ping absolute -top-0.5 -right-0.5" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Real-Time Order Dispatch Queue</span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950">
                  {pendingCount} PENDING
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-400">
              Sound alerts trigger automatically on incoming orders. Automatic instant refunds on cancellation.
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
              placeholder="Search orders..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            {['all', 'pending', 'processing', 'completed', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-colors ${
                  statusFilter === status
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
            No orders found in this view.
          </div>
        ) : (
          filteredOrders.map(order => {
            const badge = getOrderStatusBadge(order.status);
            const isPending = order.status === 'pending';
            const isProcessing = order.status === 'processing';
            const isCompleted = order.status === 'completed';
            const isCancelled = order.status === 'cancelled';

            return (
              <div
                key={order.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isPending
                    ? 'bg-amber-950/15 border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : isProcessing
                    ? 'bg-blue-950/15 border-blue-500/40'
                    : 'bg-slate-900/70 border-slate-800'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left Info */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold font-mono text-cyan-400 text-xs shrink-0">
                      #{order.id.slice(-4)}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-white">
                          {order.serviceName}
                        </span>
                        <span className="text-xs text-cyan-300 font-semibold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 font-mono">
                          {order.amountUnit || order.packageTitle || `${formatBDT(order.retailPrice)} Top-up`}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                        <span>
                          Target Customer: <strong className="font-mono text-cyan-400 bg-slate-800 px-1.5 py-0.5 rounded">{order.customerId}</strong>
                        </span>
                        <span>
                          Reseller: <strong className="text-white">{order.resellerName}</strong>
                        </span>
                        <span>
                          Cost: <strong className="font-mono-numbers text-emerald-400">{formatBDT(order.resellerPrice)}</strong> (Retail: {formatBDT(order.retailPrice)})
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>

                      {order.operatorNote && (
                        <div className="mt-1.5 text-[11px] text-slate-400 italic">
                          Dispatch Note: {order.operatorNote}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    {isPending && (
                      <button
                        disabled={actionLoading === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'processing')}
                        className="px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Process</span>
                      </button>
                    )}

                    {(isPending || isProcessing) && (
                      <button
                        onClick={() => {
                          setCompletingOrder(order);
                          setOperatorTrxId(`SRV-${Date.now().toString().slice(-6)}`);
                          setOperatorNote(`Dispatched via official server API for ${order.customerId}`);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete</span>
                      </button>
                    )}

                    {(isPending || isProcessing) && (
                      <button
                        onClick={() => setCancellingOrder(order)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 font-semibold text-xs flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Cancel &amp; Refund</span>
                      </button>
                    )}

                    {isCompleted && (
                      <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Delivered</span>
                      </span>
                    )}

                    {isCancelled && (
                      <span className="text-rose-400 text-xs font-semibold flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Refunded to Wallet</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Complete Order Dialog */}
      {completingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white shadow-2xl">
            <h4 className="text-base font-bold text-emerald-400">
              Confirm Order Completion
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Mark Order #{completingOrder.id} as dispatched for customer {completingOrder.customerId}
            </p>

            <div className="my-4 space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Operator Server Trx ID
                </label>
                <input
                  type="text"
                  value={operatorTrxId}
                  onChange={e => setOperatorTrxId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Dispatch Confirmation Notes
                </label>
                <input
                  type="text"
                  value={operatorNote}
                  onChange={e => setOperatorNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompletingOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(completingOrder.id, 'completed', operatorNote, operatorTrxId)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow"
              >
                Mark as Completed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order with Auto-Refund Dialog */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500/40 p-6 text-white shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 mb-2">
              <ShieldAlert className="w-5 h-5" />
              <h4 className="text-base font-bold">
                Cancel Order &amp; Auto-Refund
              </h4>
            </div>
            <p className="text-xs text-slate-300">
              Cancelling Order #{cancellingOrder.id} will <strong>automatically refund {formatBDT(cancellingOrder.resellerPrice)}</strong> instantly back to {cancellingOrder.resellerName}&apos;s usable balance.
            </p>

            <div className="my-4">
              <label className="block text-xs text-slate-400 mb-1">
                Reason for Cancellation
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(cancellingOrder.id, 'cancelled', cancelReason)}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow"
              >
                Confirm Cancellation &amp; Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
