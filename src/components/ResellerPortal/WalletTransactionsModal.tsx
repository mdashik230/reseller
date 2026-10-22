import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { WalletTransaction } from '../../types';
import { formatBDT, formatDate } from '../../utils/formatters';
import {
  X,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Sliders,
  Wallet
} from 'lucide-react';

export const WalletTransactionsModal: React.FC = () => {
  const { openTransactionsModal, setOpenTransactionsModal, currentUser } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (openTransactionsModal && currentUser) {
      setLoading(true);
      fetch(`/api/wallet/transactions?userId=${currentUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.transactions) {
            setTransactions(data.transactions);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [openTransactionsModal, currentUser]);

  if (!openTransactionsModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-white">
        
        <button
          onClick={() => setOpenTransactionsModal(false)}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Wallet Balance Ledger &amp; Audit Trail
            </h3>
            <p className="text-xs text-slate-400">
              Complete transactional history of credits, deductions, and refunds
            </p>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-slate-800">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Loading ledger...
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No transactions recorded for this account yet.
            </div>
          ) : (
            transactions.map(tx => {
              const isCredit = tx.type === 'deposit' || tx.type === 'refund' || (tx.type === 'admin_adjustment' && tx.amount > 0);
              return (
                <div key={tx.id} className="py-3.5 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isCredit
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}>
                      {tx.type === 'deposit' && <ArrowDownLeft className="w-4 h-4" />}
                      {tx.type === 'order_deduction' && <ArrowUpRight className="w-4 h-4" />}
                      {tx.type === 'refund' && <RotateCcw className="w-4 h-4" />}
                      {tx.type === 'admin_adjustment' && <Sliders className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">
                        {tx.note}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Trx: {tx.trxId || 'N/A'} • {formatDate(tx.timestamp)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`font-bold font-mono-numbers text-sm ${
                      isCredit ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isCredit ? '+' : '-'}{formatBDT(Math.abs(tx.amount))}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono-numbers">
                      Balance: {formatBDT(tx.newBalance)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
