import React from 'react';
import { Order } from '../../types';
import { formatBDT, formatDate, getOrderStatusBadge } from '../../utils/formatters';
import { X, Printer, CheckCircle, ShieldCheck, Download, Tag } from 'lucide-react';

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const statusBadge = getOrderStatusBadge(order.status);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 text-white">
        
        {/* Modal Controls (Hidden in print) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Digital Service Receipt Slip
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono">
              #{order.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTENT CONTAINER */}
        <div id="printable-invoice" className="bg-slate-950 sm:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-800/80">
          
          {/* Slip Header */}
          <div className="flex justify-between items-start border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-sm">
                  V
                </div>
                <span className="font-extrabold text-lg text-emerald-400 tracking-tight">
                  Reseller.vaivaizone.com
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Official Digital Top-Up &amp; Recharge Receipt
              </p>
              <p className="text-[10px] text-slate-500">
                Support: help@vaivaizone.com | Dhaka, Bangladesh
              </p>
            </div>

            <div className="text-right">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadge.badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                {statusBadge.label}
              </span>
              <div className="text-xs text-slate-400 font-mono mt-1.5">
                SLIP: #{order.id}
              </div>
              <div className="text-[10px] text-slate-500">
                {formatDate(order.createdAt)}
              </div>
            </div>
          </div>

          {/* Party Details */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-800 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Billed To Reseller
              </span>
              <p className="font-bold text-slate-200 mt-0.5">{order.resellerName}</p>
              <p className="text-slate-400 text-[11px]">{order.resellerEmail}</p>
              <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                Tier Discount: {order.discountPercent}% Applied
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Recipient Customer ID
              </span>
              <p className="font-mono font-bold text-cyan-400 mt-0.5 text-sm">
                {order.customerId}
              </p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Service: {order.serviceName}
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="pb-2 font-semibold">Service Description</th>
                  <th className="pb-2 font-semibold text-center">Package / Qty</th>
                  <th className="pb-2 font-semibold text-right">Retail Rate</th>
                  <th className="pb-2 font-semibold text-right">Reseller Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                <tr>
                  <td className="py-3 text-slate-200">
                    <div className="font-bold">{order.serviceName}</div>
                    <div className="text-[10px] text-slate-400">
                      Destination: {order.customerId}
                    </div>
                  </td>
                  <td className="py-3 text-center text-slate-300 font-mono font-bold">
                    {order.amountUnit || order.packageTitle || 'Direct Top-up'}
                  </td>
                  <td className="py-3 text-right text-slate-400 font-mono-numbers line-through">
                    {formatBDT(order.retailPrice)}
                  </td>
                  <td className="py-3 text-right text-emerald-400 font-bold font-mono-numbers">
                    {formatBDT(order.resellerPrice)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Summary */}
          <div className="border-t border-slate-800 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Gross Retail Value:</span>
              <span className="font-mono-numbers">{formatBDT(order.retailPrice)}</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Reseller Tier Discount ({order.discountPercent}%):</span>
              <span className="font-mono-numbers">-{formatBDT(order.retailPrice - order.resellerPrice)}</span>
            </div>
            <div className="flex justify-between text-cyan-400 font-semibold">
              <span>Reseller Direct Profit Margin:</span>
              <span className="font-mono-numbers">+{formatBDT(order.profitEarned)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm font-bold">
              <span className="text-white">Total Amount Charged:</span>
              <span className="text-base font-extrabold text-emerald-400 font-mono-numbers">
                {formatBDT(order.resellerPrice)}
              </span>
            </div>
          </div>

          {/* Payment & Operator Dispatch Metadata */}
          <div className="mt-4 p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Settlement Method:</span>
              <span className="text-slate-200 font-semibold capitalize">
                {order.paymentMethod === 'usable_wallet' ? 'Usable Wallet Balance (Paid)' : `Instant Live Gateway (${order.gatewayName || 'bKash'})`}
              </span>
            </div>
            {order.gatewayTrxId && (
              <div className="flex justify-between">
                <span className="text-slate-400">Gateway Trx ID:</span>
                <span className="text-cyan-400 font-mono">{order.gatewayTrxId}</span>
              </div>
            )}
            {order.operatorTrxId && (
              <div className="flex justify-between">
                <span className="text-slate-400">Operator Server Trx:</span>
                <span className="text-emerald-400 font-mono">{order.operatorTrxId}</span>
              </div>
            )}
            {order.operatorNote && (
              <div className="flex justify-between pt-1 border-t border-slate-800/60">
                <span className="text-slate-400">Operator Dispatch Note:</span>
                <span className="text-slate-300 italic">{order.operatorNote}</span>
              </div>
            )}
          </div>

          {/* Footer stamp */}
          <div className="mt-6 pt-3 border-t border-dashed border-slate-800 text-center text-[10px] text-slate-500">
            <p className="flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              Electronically verified by Reseller.vaivaizone.com Automated Dispatch System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
