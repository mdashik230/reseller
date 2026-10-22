import React, { useState } from 'react';
import { Order } from '../../types';
import { formatBDT, formatDate, getOrderStatusBadge } from '../../utils/formatters';
import {
  Search,
  Filter,
  FileText,
  Clock,
  ArrowUpDown,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface OrderHistoryTableProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onRefresh: () => void;
}

export const OrderHistoryTable: React.FC<OrderHistoryTableProps> = ({
  orders,
  onSelectOrder,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.packageTitle ? o.packageTitle.toLowerCase().includes(searchQuery.toLowerCase()) : false);

    const matchesStatus =
      selectedStatus === 'all' ? true : o.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl p-6 backdrop-blur-xl">
      
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Order History &amp; Invoicing Ledger
          </h3>
          <p className="text-xs text-slate-400">
            Real-time status tracking, profit breakdown, and printable digital receipt slips
          </p>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by ID, customer..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44 sm:w-56"
            />
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            {['all', 'pending', 'processing', 'completed', 'cancelled'].map(status => {
              const isActive = selectedStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-colors ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="mt-4 overflow-x-auto">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No orders found matching your search criteria.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-3 px-3 font-semibold">Date &amp; Slip ID</th>
                <th className="py-3 px-3 font-semibold">Service &amp; Package</th>
                <th className="py-3 px-3 font-semibold">Customer ID</th>
                <th className="py-3 px-3 font-semibold text-right">Reseller Cost</th>
                <th className="py-3 px-3 font-semibold text-right">Profit</th>
                <th className="py-3 px-3 font-semibold">Payment</th>
                <th className="py-3 px-3 font-semibold text-center">Status</th>
                <th className="py-3 px-3 font-semibold text-right">Invoice Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredOrders.map(order => {
                const statusBadge = getOrderStatusBadge(order.status);
                return (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-white font-mono">
                        #{order.id}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-200">
                        {order.serviceName}
                      </div>
                      <div className="text-[11px] text-cyan-300 font-semibold font-mono">
                        {order.amountUnit || order.packageTitle || `${formatBDT(order.retailPrice)} Top-up`}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20 text-[11px]">
                        {order.customerId}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="font-bold text-emerald-400 font-mono-numbers">
                        {formatBDT(order.resellerPrice)}
                      </div>
                      <div className="text-[10px] text-slate-500 line-through font-mono-numbers">
                        {formatBDT(order.retailPrice)}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <span className="font-mono-numbers font-bold text-cyan-400 text-[11px]">
                        +{formatBDT(order.profitEarned)}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-[11px] capitalize">
                      {order.paymentMethod === 'usable_wallet' ? (
                        <span className="text-emerald-400">Wallet</span>
                      ) : (
                        <span className="text-cyan-400">Gateway</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                        {statusBadge.label}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => onSelectOrder(order)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700 transition-colors"
                      >
                        <FileText className="w-3 h-3 text-emerald-400" />
                        <span>Slip</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
