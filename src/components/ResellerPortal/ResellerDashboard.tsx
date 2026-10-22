import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DualBalanceCard } from './DualBalanceCard';
import { KycStatusCard } from './KycStatusCard';
import { OrderSubmissionForm } from './OrderSubmissionForm';
import { OrderHistoryTable } from './OrderHistoryTable';
import { InvoiceModal } from './InvoiceModal';
import { KycVerificationModal } from './KycVerificationModal';
import { WalletDepositModal } from './WalletDepositModal';
import { WalletTransactionsModal } from './WalletTransactionsModal';
import { ResellerActivationGate } from './ResellerActivationGate';
import { Order } from '../../types';

export const ResellerDashboard: React.FC = () => {
  const { currentUser, refreshUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  const loadOrders = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/orders?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.orders) {
          setOrders(data.orders);
        }
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => {
      loadOrders();
      refreshUser();
    }, 6000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const handleOrderSuccess = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
    setSelectedInvoiceOrder(newOrder);
  };

  if (!currentUser) return null;

  // Gate check: Only show service categories and recharge order submission once Admin approves KYC & ৳2,000 Security Deposit
  const isCategoriesUnlocked = currentUser.isApprovedByAdmin && currentUser.kyc?.status === 'verified';

  if (!isCategoriesUnlocked) {
    return (
      <div className="py-4">
        <ResellerActivationGate />
        
        {/* Modals needed for KYC and Deposit */}
        <KycVerificationModal />
        <WalletDepositModal />
        <WalletTransactionsModal />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* 1. KYC Verification Card Banner */}
      <KycStatusCard />

      {/* 2. Dual-Balance Wallet Logic Engine Card */}
      <DualBalanceCard />

      {/* 3. Order & Recharge Submission Form (Unlocked Categories) */}
      <OrderSubmissionForm onOrderSuccess={handleOrderSuccess} />

      {/* 4. Order History Table & Invoice Slips */}
      <OrderHistoryTable
        orders={orders}
        onSelectOrder={order => setSelectedInvoiceOrder(order)}
        onRefresh={loadOrders}
      />

      {/* Modals */}
      <InvoiceModal
        order={selectedInvoiceOrder}
        onClose={() => setSelectedInvoiceOrder(null)}
      />

      <KycVerificationModal />
      <WalletDepositModal />
      <WalletTransactionsModal />
    </div>
  );
};
