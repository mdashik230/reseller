export type UserRole = 'admin' | 'reseller';

export type KycStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected';

export type ResellerTier = 'General' | 'Silver' | 'VIP';

export interface KycData {
  status: KycStatus;
  phone: string;
  gmail: string;
  imoId: string;
  screenshotUrl: string;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface WalletState {
  totalBalance: number;
  lockedSecurityDeposit: number; // constant 2000 BDT
  usableBalance: number; // Math.max(0, totalBalance - 2000)
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  tier: ResellerTier;
  discountPercent: number; // e.g. 5% for General, 9% for Silver, 14% for VIP
  wallet: WalletState;
  kyc: KycData;
  depositApproved: boolean; // whether minimum 2000 BDT security deposit has been paid & verified
  isApprovedByAdmin: boolean; // admin unlocked categories access
  status: 'active' | 'suspended';
  avatarUrl?: string;
  createdAt: string;
}

export type TransactionType = 'deposit' | 'order_deduction' | 'refund' | 'admin_adjustment';

export interface WalletTransaction {
  id: string;
  resellerId: string;
  resellerName: string;
  type: TransactionType;
  amount: number;
  previousBalance: number;
  newBalance: number;
  method?: 'bkash' | 'nagad' | 'rocket' | 'bank' | 'wallet' | 'manual';
  trxId?: string;
  note: string;
  timestamp: string;
}

export type DepositRequestStatus = 'pending' | 'approved' | 'rejected';

export interface DepositRequest {
  id: string;
  resellerId: string;
  resellerName: string;
  resellerEmail: string;
  amount: number;
  method: 'bkash' | 'nagad' | 'rocket' | 'bank';
  senderNumber: string;
  trxId: string;
  note?: string;
  status: DepositRequestStatus;
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface ServicePackage {
  id: string;
  title: string;
  amountUnit: string;
  retailPrice: number;
  popular?: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: 'imo' | 'bigo' | 'tiktok' | 'games' | 'recharge' | 'giftcards' | 'other';
  icon: string;
  description: string;
  inputType: 'phone' | 'imo_id' | 'player_id' | 'email';
  inputLabel: string;
  inputPlaceholder: string;
  unitName: string; // e.g. 'Diamonds 💎', 'Beans 🫘', 'Coins 🪙', 'UC ⚡'
  customerRatePer1000: number; // e.g. 2250 (৳ per 1000 units)
  resellerRatePer1000: number; // e.g. 2180 (৳ per 1000 units deducted from reseller balance)
  minQuantity?: number;
  packages?: ServicePackage[];
  hidden?: boolean; // Admin can hide/unhide
  createdAt?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  resellerId: string;
  resellerName: string;
  resellerEmail: string;
  serviceId: string;
  serviceName: string;
  unitName?: string; // e.g. 'Diamonds 💎'
  quantity?: number; // e.g. 1000 Diamonds
  customerRatePer1000?: number; // e.g. 2250
  resellerRatePer1000?: number; // e.g. 2180
  packageId?: string;
  packageTitle?: string;
  amountUnit: string;
  customerId: string; // Recipient Phone Number or IMO ID
  retailPrice: number; // e.g. 2250
  discountPercent?: number;
  resellerPrice: number; // e.g. 2180 (deducted from usable balance)
  profitEarned: number; // e.g. 70
  paymentMethod: 'usable_wallet' | 'instant_gateway';
  gatewayName?: string;
  gatewayTrxId?: string;
  status: OrderStatus;
  operatorNote?: string;
  operatorTrxId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  alertOnRegistration: boolean;
  alertOnKyc: boolean;
  alertOnOrder: boolean;
  alertOnDeposit: boolean;
}

export interface TelegramLog {
  id: string;
  event: 'registration' | 'kyc_submitted' | 'new_order' | 'deposit' | 'test';
  message: string;
  timestamp: string;
  success: boolean;
  simulated: boolean;
}

export interface PaymentAccount {
  id: string;
  name: string;
  number: string;
  type: string; // 'Merchant' | 'Personal' | 'Agent' | string
  instruction: string;
  enabled: boolean;
  minDeposit?: number;
}

export interface PaymentSettings {
  accounts: PaymentAccount[];
  notice: string;
  minDepositAmount: number;
  supportWhatsapp?: string;
  supportNotice?: string;
  updatedAt?: string;
}

