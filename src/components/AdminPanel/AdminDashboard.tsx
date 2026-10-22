import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatBDT } from '../../utils/formatters';
import { OrderDispatchManager } from './OrderDispatchManager';
import { KycVerificationManager } from './KycVerificationManager';
import { DepositApprovalManager } from './DepositApprovalManager';
import { ResellerManager } from './ResellerManager';
import { CategoryServiceManager } from './CategoryServiceManager';
import { TelegramIntegrationManager } from './TelegramIntegrationManager';
import {
  TrendingUp,
  Users,
  ShieldCheck,
  Clock,
  Layers,
  Lock,
  Bot,
  Building,
  Wallet
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'dispatch' | 'kyc' | 'deposits' | 'categories' | 'resellers' | 'telegram'>('dispatch');
  const [stats, setStats] = useState({
    totalResellers: 0,
    verifiedResellers: 0,
    pendingKycCount: 0,
    pendingDepositsCount: 0,
    totalVolume: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalHeldBalance: 0,
    totalLockedDeposit: 0,
    servicesCount: 0,
    activeServicesCount: 0,
  });

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/overview');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Admin Welcome & Master Control Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Master Admin Control Center
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  ROOT OWNER
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manual deposit approvals, KYC verification, and dynamic category management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs text-slate-400">Owner Session:</span>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-slate-800 px-2.5 py-1 rounded-xl border border-emerald-500/30">
              loverblack2022@gmail.com
            </span>
          </div>
        </div>

        {/* 4 Overview Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-800/80">
          
          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Gross Network Volume</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white font-mono-numbers mt-1.5">
              {formatBDT(stats.totalVolume)}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">
              {stats.completedOrders} orders fulfilled
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Orders in Queue</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-cyan-400 font-mono-numbers mt-1.5">
              {stats.pendingOrders} Pending
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {stats.totalOrders} total recorded orders
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Pending Deposits</span>
              <Wallet className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono-numbers mt-1.5">
              {stats.pendingDepositsCount} Review Needed
            </div>
            <div className="text-[10px] text-amber-300 mt-0.5">
              Requires Manual Verification
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Pending KYC Submissions</span>
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white font-mono-numbers mt-1.5">
              {stats.pendingKycCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {stats.verifiedResellers} verified accounts
            </div>
          </div>
        </div>
      </div>

      {/* Admin Section Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
        {[
          { id: 'dispatch', label: 'Order Dispatch Queue', count: stats.pendingOrders, icon: Clock },
          { id: 'deposits', label: 'Deposit Requests (ম্যানুয়াল ভেরিফিকেশন)', count: stats.pendingDepositsCount, icon: Wallet },
          { id: 'kyc', label: 'KYC & Activation Approvals', count: stats.pendingKycCount, icon: ShieldCheck },
          { id: 'categories', label: '১০০০ রেট ও ক্যাটাগরি ম্যানেজার', icon: Layers },
          { id: 'resellers', label: 'Resellers & Balance', icon: Users },
          { id: 'telegram', label: 'Telegram Webhooks', icon: Bot },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-slate-950 text-cyan-300' : 'bg-amber-500 text-slate-950'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'dispatch' && <OrderDispatchManager />}
      {activeTab === 'deposits' && <DepositApprovalManager />}
      {activeTab === 'kyc' && <KycVerificationManager />}
      {activeTab === 'categories' && <CategoryServiceManager />}
      {activeTab === 'resellers' && <ResellerManager />}
      {activeTab === 'telegram' && <TelegramIntegrationManager />}
    </div>
  );
};
