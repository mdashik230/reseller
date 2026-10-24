import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  User,
  WalletTransaction,
  DepositRequest,
  ServiceItem,
  Order,
  TelegramConfig,
  TelegramLog,
  PaymentAccount,
  PaymentSettings
} from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Telegram Bot state
let telegramConfig: TelegramConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  chatId: process.env.TELEGRAM_CHAT_ID || '',
  enabled: true,
  alertOnRegistration: true,
  alertOnKyc: true,
  alertOnOrder: true,
  alertOnDeposit: true,
};

let telegramLogs: TelegramLog[] = [
  {
    id: 'tg-init-1',
    event: 'system' as any,
    message: '🚀 Reseller.vaivaizone.com Bot Service Initialized and Ready for Webhooks.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    success: true,
    simulated: true,
  }
];

async function dispatchTelegramAlert(event: TelegramLog['event'], message: string) {
  const logItem: TelegramLog = {
    id: `tg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    event,
    message,
    timestamp: new Date().toISOString(),
    success: true,
    simulated: true,
  };

  const cleanBotToken = (telegramConfig.botToken || '').trim().replace(/^bot/i, '');
  const cleanChatId = (telegramConfig.chatId || '').trim();

  // Check event-specific triggers
  let isTriggerEnabled = telegramConfig.enabled !== false;
  if (event === 'registration' && telegramConfig.alertOnRegistration === false) isTriggerEnabled = false;
  if (event === 'kyc_submitted' && telegramConfig.alertOnKyc === false) isTriggerEnabled = false;
  if (event === 'new_order' && telegramConfig.alertOnOrder === false) isTriggerEnabled = false;
  if (event === 'deposit' && telegramConfig.alertOnDeposit === false) isTriggerEnabled = false;

  if (isTriggerEnabled && cleanBotToken && cleanChatId) {
    try {
      const url = `https://api.telegram.org/bot${cleanBotToken}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cleanChatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        logItem.simulated = false;
        logItem.success = true;
      } else {
        // Fallback: retry with stripped plain text in case HTML parse_mode failed on special characters
        const plainText = message.replace(/<[^>]*>?/gm, '');
        const retryRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: cleanChatId,
            text: plainText,
          }),
        });
        const retryData = await retryRes.json();
        if (retryData.ok) {
          logItem.simulated = false;
          logItem.success = true;
        } else {
          logItem.success = false;
          logItem.message += ` (Telegram API error: ${data.description || retryData.description || 'Unknown'})`;
        }
      }
    } catch (err: any) {
      logItem.success = false;
      logItem.message += ` (Network error: ${err.message})`;
    }
  }

  telegramLogs.unshift(logItem);
  if (telegramLogs.length > 100) telegramLogs.pop();
  return logItem;
}

// Initial Database Seeds & Persistent Storage Setup
const LOCKED_DEPOSIT = 2000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'server-db.json');

export const MASTER_ADMIN_EMAIL = 'loverblack2022@gmail.com';

export const isMasterAdminEmail = (email?: string): boolean => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return normalized === 'loverblack2022@gmail.com' || normalized === 'loverblack2022@gmail';
};

const initialMasterAdmin: User = {
  id: 'usr-admin-1',
  name: 'Master Admin (loverblack2022)',
  email: MASTER_ADMIN_EMAIL,
  phone: '+8801700000001',
  role: 'admin',
  tier: 'VIP',
  discountPercent: 14,
  wallet: {
    totalBalance: 50000,
    lockedSecurityDeposit: LOCKED_DEPOSIT,
    usableBalance: 48000,
  },
  kyc: {
    status: 'verified',
    phone: '+8801700000001',
    gmail: MASTER_ADMIN_EMAIL,
    imoId: 'IMO-VAI-ADMIN',
    screenshotUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    submittedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    reviewedAt: new Date(Date.now() - 86400000 * 29).toISOString(),
  },
  depositApproved: true,
  isApprovedByAdmin: true,
  status: 'active',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
};

let users: User[] = [initialMasterAdmin];

// Manual Deposit Requests Queue (Real requests submitted by resellers)
let depositRequests: DepositRequest[] = [];

// Real Wallet Transactions
let transactions: WalletTransaction[] = [];

let services: ServiceItem[] = [
  {
    id: 'srv-imo',
    name: 'IMO Diamonds Top-Up',
    category: 'imo',
    icon: '💎',
    description: 'Instant official IMO ID Diamond transfer. Global & BD regional servers.',
    inputType: 'imo_id',
    inputLabel: 'IMO ID / Registered Phone Number',
    inputPlaceholder: 'e.g. 8801712345678 or @imoid_user',
    unitName: 'Diamonds 💎',
    customerRatePer1000: 2250, // ৳2,250 per 1,000 Diamonds
    resellerRatePer1000: 2180, // ৳2,180 per 1,000 Diamonds (deducted from reseller wallet)
    minQuantity: 50,
    hidden: false,
  },
  {
    id: 'srv-games-ff',
    name: 'Free Fire Diamonds',
    category: 'games',
    icon: '🔥',
    description: 'Instant Garena Player UID top-up for Free Fire Diamonds.',
    inputType: 'player_id',
    inputLabel: 'Free Fire Player UID',
    inputPlaceholder: 'e.g. 1928471928',
    unitName: 'Diamonds 💎',
    customerRatePer1000: 850, // ৳850 per 1,000 Diamonds
    resellerRatePer1000: 800, // ৳800 per 1,000 Diamonds
    minQuantity: 25,
    hidden: false,
  },
  {
    id: 'srv-bigo',
    name: 'Bigo Live Beans',
    category: 'bigo',
    icon: '🌟',
    description: 'Direct Bigo ID recharge. Fast delivery for hosts and gifters.',
    inputType: 'imo_id',
    inputLabel: 'Bigo ID Number',
    inputPlaceholder: 'e.g. bigo_19827461',
    unitName: 'Beans 🫘',
    customerRatePer1000: 2100, // ৳2,100 per 1,000 Beans
    resellerRatePer1000: 2020, // ৳2,020 per 1,000 Beans
    minQuantity: 50,
    hidden: false,
  },
  {
    id: 'srv-tiktok',
    name: 'TikTok Coins Top-Up',
    category: 'tiktok',
    icon: '🎵',
    description: 'Instant TikTok Live gifts & coins delivery via TikTok Username.',
    inputType: 'player_id',
    inputLabel: 'TikTok Username (@)',
    inputPlaceholder: 'e.g. @vaivaizone_official',
    unitName: 'Coins 🪙',
    customerRatePer1000: 1400, // ৳1,400 per 1,000 Coins
    resellerRatePer1000: 1320, // ৳1,320 per 1,000 Coins
    minQuantity: 70,
    hidden: false,
  },
  {
    id: 'srv-recharge',
    name: 'All BD Mobile Recharge',
    category: 'recharge',
    icon: '📱',
    description: 'Instant Flexiload for GP, Banglalink, Robi, Airtel, Teletalk.',
    inputType: 'phone',
    inputLabel: 'Recipient Mobile Number (01XXXXXXXXX)',
    inputPlaceholder: '01XXXXXXXXX',
    unitName: 'BDT ৳',
    customerRatePer1000: 1000,
    resellerRatePer1000: 970, // 3% margin
    minQuantity: 20,
    hidden: false,
  },
  {
    id: 'srv-games-pubg',
    name: 'PUBG Mobile Unknown Cash (UC)',
    category: 'games',
    icon: '⚡',
    description: 'Instant PUBG Mobile UC top-up via Character ID & Name.',
    inputType: 'player_id',
    inputLabel: 'PUBG Character ID (UID)',
    inputPlaceholder: 'e.g. 5192847192',
    unitName: 'UC ⚡',
    customerRatePer1000: 1650, // ৳1,650 per 1,000 UC
    resellerRatePer1000: 1580, // ৳1,580 per 1,000 UC
    minQuantity: 60,
    hidden: false,
  },
];

let orders: Order[] = [];

// Default Payment Accounts and Deposit Notice
const defaultPaymentSettings: PaymentSettings = {
  minDepositAmount: 100,
  notice: 'টাকা পাঠানোর পর অবশ্যই সঠিক TrxID এবং সেন্ডার নাম্বার দিয়ে ডিপোজিট রিকোয়েস্ট সাবমিট করুন। এডমিন ভেরিফাই করে ৫-১৫ মিনিটের মধ্যে ব্যালেন্স যোগ করে দিবে।',
  supportWhatsapp: '01811223344',
  supportNotice: '২৪/৭ অফিসিয়াল হোয়াটসঅ্যাপ সাপোর্ট লাইভ আছে। যেকোনো প্রয়োজনে চ্যাট করুন।',
  accounts: [
    {
      id: 'bkash',
      name: 'bKash',
      number: '01799887766',
      type: 'Merchant (Payment)',
      instruction: 'বিকাশ অ্যাপ থেকে "Payment" অপশনে গিয়ে উক্ত নাম্বারে টাকা পাঠান।',
      enabled: true,
      minDeposit: 100,
    },
    {
      id: 'nagad',
      name: 'Nagad',
      number: '01811223344',
      type: 'Personal (Send Money)',
      instruction: 'নগদ অ্যাপ বা *167# ডায়াল করে "Send Money" করুন।',
      enabled: true,
      minDeposit: 100,
    },
    {
      id: 'rocket',
      name: 'Rocket',
      number: '01922334455-8',
      type: 'Personal (Send Money)',
      instruction: 'রকেট একাউন্টে ১২ ডিজিটের নাম্বারে সেন্ড মানি করুন।',
      enabled: true,
      minDeposit: 100,
    },
    {
      id: 'upay',
      name: 'Upay',
      number: '01711002233',
      type: 'Personal / Merchant',
      instruction: 'উপায় অ্যাপ থেকে সরাসরি সেন্ড মানি বা পেমেন্ট করুন।',
      enabled: false,
      minDeposit: 100,
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      number: 'Bank Asia A/C: 088192847192 (VaiVaiZone Tech)',
      type: 'Online / Branch Deposit',
      instruction: 'ব্যাংক ডিপোজিট স্লিপ বা অনলাইন ট্রান্সফার রেফারেন্স দিন।',
      enabled: true,
      minDeposit: 500,
    },
  ],
};

let paymentSettings: PaymentSettings = defaultPaymentSettings;

// Helper: update user wallet state
function recalculateWallet(user: User) {
  user.wallet.lockedSecurityDeposit = LOCKED_DEPOSIT;
  user.wallet.usableBalance = Math.max(0, user.wallet.totalBalance - LOCKED_DEPOSIT);
}

// ----------------- PERSISTENT STORAGE ENGINE ----------------- //
function saveDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const payload = {
      users,
      services,
      depositRequests,
      transactions,
      orders,
      telegramConfig,
      telegramLogs,
      paymentSettings,
      savedAt: new Date().toISOString(),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database to disk:', err);
  }
}

function loadDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.users) && parsed.users.length > 0) {
        users = parsed.users;
      }
      if (Array.isArray(parsed.services) && parsed.services.length > 0) {
        services = parsed.services;
      }
      if (Array.isArray(parsed.depositRequests)) {
        depositRequests = parsed.depositRequests;
      }
      if (Array.isArray(parsed.transactions)) {
        transactions = parsed.transactions;
      }
      if (Array.isArray(parsed.orders)) {
        orders = parsed.orders;
      }
      if (parsed.telegramConfig) {
        telegramConfig = { ...telegramConfig, ...parsed.telegramConfig };
      }
      if (Array.isArray(parsed.telegramLogs)) {
        telegramLogs = parsed.telegramLogs;
      }
      if (parsed.paymentSettings && Array.isArray(parsed.paymentSettings.accounts) && parsed.paymentSettings.accounts.length > 0) {
        paymentSettings = parsed.paymentSettings;
      }
      console.log('✅ Persistent Database loaded from disk.');
    } else {
      saveDatabase();
    }
  } catch (err) {
    console.error('Error loading database from disk:', err);
  }

  // Guarantee master admin is always present and active
  let admin = users.find(u => isMasterAdminEmail(u.email));
  if (!admin) {
    users.unshift(initialMasterAdmin);
    saveDatabase();
  } else {
    admin.role = 'admin';
    admin.depositApproved = true;
    admin.isApprovedByAdmin = true;
  }
}

// Load persisted state from disk on startup
loadDatabase();
users.forEach(recalculateWallet);

// ----------------- API ROUTES ----------------- //

// 1. Google Auth Route
app.post('/api/auth/google-login', (req, res) => {
  const { email, name, avatarUrl, rolePreference } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Google account email is required' });
  }

  let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  const isMasterAdmin = isMasterAdminEmail(email);

  // STRICT SECURITY: Only loverblack2022@gmail.com can obtain or hold the admin role
  if (isMasterAdmin) {
    if (!user) {
      user = {
        id: `usr-admin-${Date.now()}`,
        name: name || 'Master Admin (loverblack2022)',
        email: MASTER_ADMIN_EMAIL,
        phone: '+8801700000001',
        role: 'admin',
        tier: 'VIP',
        discountPercent: 14,
        wallet: { totalBalance: 50000, lockedSecurityDeposit: LOCKED_DEPOSIT, usableBalance: 48000 },
        kyc: { status: 'verified', phone: '+8801700000001', gmail: MASTER_ADMIN_EMAIL, imoId: 'IMO-VAI-ADMIN', screenshotUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80' },
        depositApproved: true,
        isApprovedByAdmin: true,
        status: 'active',
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        createdAt: new Date().toISOString(),
      };
      users.push(user);
    } else {
      user.role = 'admin';
      user.depositApproved = true;
      user.isApprovedByAdmin = true;
    }
  } else {
    // If user previously existed but is NOT master admin, ensure role is reseller
    if (user && user.role === 'admin') {
      user.role = 'reseller';
    }
    if (!user) {
      // Brand new reseller registering via Google
      user = {
        id: `usr-reseller-${Date.now()}`,
        name: name || email.split('@')[0],
        email,
        phone: '',
        role: 'reseller',
        tier: 'General',
        discountPercent: 5,
      wallet: {
        totalBalance: 0,
        lockedSecurityDeposit: LOCKED_DEPOSIT,
        usableBalance: 0,
      },
      kyc: {
        status: 'not_submitted',
        phone: '',
        gmail: email,
        imoId: '',
        screenshotUrl: '',
      },
      depositApproved: false,
      isApprovedByAdmin: false,
      status: 'active',
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      createdAt: new Date().toISOString(),
    };
    users.push(user);

    // Dispatch Telegram Alert
    dispatchTelegramAlert(
      'registration',
      `<b>🆕 New Google Reseller Registered!</b>\n` +
      `👤 <b>Name:</b> ${user.name}\n` +
      `📧 <b>Google Email:</b> ${user.email}\n` +
      `🔒 <b>Approval Gate:</b> Waiting for KYC & ৳2,000 Deposit Review\n` +
      `🌐 <i>Reseller.vaivaizone.com</i>`
    );
  }
}

  recalculateWallet(user);
  saveDatabase();
  return res.json({
    token: `token-${user.id}-${Date.now()}`,
    user,
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const userId = req.headers['x-user-id'] as string;
  
  let user: User | undefined;
  if (userId) {
    user = users.find(u => u.id === userId);
  } else if (authHeader) {
    const matched = authHeader.match(/token-(usr-[a-z0-9-]+)/);
    if (matched) {
      user = users.find(u => u.id === matched[1]);
    }
  }

  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Strict role check
  if (!isMasterAdminEmail(user.email)) {
    user.role = 'reseller';
  }

  recalculateWallet(user);
  return res.json({ user });
});

// 2. KYC Submission
app.post('/api/kyc/submit', (req, res) => {
  const { userId, phone, gmail, imoId, screenshotUrl } = req.body;
  if (!phone || !gmail || !imoId || !screenshotUrl) {
    return res.status(400).json({ error: 'Please provide Phone, Valid Gmail, IMO ID Number, and IMO Profile Screenshot.' });
  }

  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.kyc = {
    status: 'pending',
    phone,
    gmail,
    imoId,
    screenshotUrl,
    submittedAt: new Date().toISOString(),
    rejectionReason: undefined,
  };
  user.phone = phone;

  // Dispatch Telegram Alert to Admin
  dispatchTelegramAlert(
    'kyc_submitted',
    `<b>📄 KYC Verification Submitted!</b>\n` +
    `👤 <b>Reseller:</b> ${user.name}\n` +
    `📞 <b>Phone:</b> ${phone}\n` +
    `📧 <b>Gmail:</b> ${gmail}\n` +
    `💬 <b>IMO ID:</b> ${imoId}\n` +
    `🖼️ <b>Screenshot:</b> Uploaded (Review in Admin Panel)\n` +
    `⏳ <i>Action Required: Approve or Reject</i>`
  );

  saveDatabase();

  return res.json({
    success: true,
    message: 'KYC documents submitted successfully. Verification pending Admin approval.',
    kyc: user.kyc,
  });
});

// 3. Services Management (No Packages for Resellers — Manual Amount)
app.get('/api/services', (req, res) => {
  const showAll = req.query.all === 'true';
  if (showAll) {
    return res.json({ services });
  }
  return res.json({ services: services.filter(s => !s.hidden) });
});

app.post('/api/admin/services', (req, res) => {
  const {
    name,
    category,
    icon,
    description,
    inputType,
    inputLabel,
    inputPlaceholder,
    unitName,
    customerRatePer1000,
    resellerRatePer1000,
    minQuantity,
  } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: 'Category Name and type are required' });
  }

  const newService: ServiceItem = {
    id: `srv-${Date.now()}`,
    name,
    category: category || 'other',
    icon: icon || '💎',
    description: description || 'Digital top-up service category',
    inputType: inputType || 'imo_id',
    inputLabel: inputLabel || 'Recipient Account / Phone',
    inputPlaceholder: inputPlaceholder || 'Enter recipient ID',
    unitName: unitName || 'Diamonds 💎',
    customerRatePer1000: parseFloat(customerRatePer1000) || 2250,
    resellerRatePer1000: parseFloat(resellerRatePer1000) || 2180,
    minQuantity: parseInt(minQuantity) || 50,
    hidden: false,
    createdAt: new Date().toISOString(),
  };

  services.push(newService);
  saveDatabase();
  return res.json({ success: true, service: newService, services });
});

app.put('/api/admin/services/:id', (req, res) => {
  const { id } = req.params;
  const {
    name,
    category,
    icon,
    description,
    inputType,
    inputLabel,
    inputPlaceholder,
    unitName,
    customerRatePer1000,
    resellerRatePer1000,
    minQuantity,
  } = req.body;

  const service = services.find(s => s.id === id);
  if (!service) return res.status(404).json({ error: 'Service not found' });

  if (name) service.name = name;
  if (category) service.category = category;
  if (icon) service.icon = icon;
  if (description !== undefined) service.description = description;
  if (inputType) service.inputType = inputType;
  if (inputLabel) service.inputLabel = inputLabel;
  if (inputPlaceholder) service.inputPlaceholder = inputPlaceholder;
  if (unitName !== undefined) service.unitName = unitName;
  if (customerRatePer1000 !== undefined) service.customerRatePer1000 = parseFloat(customerRatePer1000);
  if (resellerRatePer1000 !== undefined) service.resellerRatePer1000 = parseFloat(resellerRatePer1000);
  if (minQuantity !== undefined) service.minQuantity = parseInt(minQuantity);

  saveDatabase();
  return res.json({ success: true, service, services });
});

// Admin Batch Rate Updates (Set 1000-unit rate in one place for all resellers)
app.post('/api/admin/services/batch-rates', (req, res) => {
  const { rates } = req.body; // Array of { id, customerRatePer1000, resellerRatePer1000, unitName }
  if (!Array.isArray(rates)) {
    return res.status(400).json({ error: 'Invalid rates array' });
  }

  for (const item of rates) {
    const srv = services.find(s => s.id === item.id);
    if (srv) {
      if (item.customerRatePer1000 !== undefined) srv.customerRatePer1000 = parseFloat(item.customerRatePer1000);
      if (item.resellerRatePer1000 !== undefined) srv.resellerRatePer1000 = parseFloat(item.resellerRatePer1000);
      if (item.unitName) srv.unitName = item.unitName;
      if (item.minQuantity) srv.minQuantity = parseInt(item.minQuantity);
    }
  }

  saveDatabase();
  return res.json({
    success: true,
    message: 'Rates per 1,000 units updated! Now applied to all verified resellers.',
    services,
  });
});

app.patch('/api/admin/services/:id/visibility', (req, res) => {
  const { id } = req.params;
  const service = services.find(s => s.id === id);
  if (!service) return res.status(404).json({ error: 'Service not found' });

  service.hidden = !service.hidden;
  saveDatabase();
  return res.json({ success: true, service, services });
});

app.delete('/api/admin/services/:id', (req, res) => {
  const { id } = req.params;
  const index = services.findIndex(s => s.id === id);
  if (index === -1) return res.status(404).json({ error: 'Service not found' });

  services.splice(index, 1);
  saveDatabase();
  return res.json({ success: true, message: 'Category removed successfully', services });
});

// 4. MANUAL DEPOSIT SUBMISSION & ADMIN APPROVAL (NOT AUTOMATIC)
app.post('/api/wallet/deposit-request', (req, res) => {
  const targetUserId = req.body.userId || req.body.resellerId;
  const rawSenderNumber = req.body.senderNumber;
  const rawTrxId = req.body.trxId;
  const rawAmount = req.body.amount;
  const numAmount = parseFloat(rawAmount);

  if (isNaN(numAmount) || numAmount <= 0 || !rawSenderNumber || !rawTrxId) {
    return res.status(400).json({ error: 'Please provide valid Amount, Sender Number, and Transaction ID (TrxID).' });
  }

  const resellerEmail = (req.body.resellerEmail || req.body.email || '').trim();
  const resellerName = (req.body.resellerName || req.body.name || (resellerEmail ? resellerEmail.split('@')[0] : 'Reseller')).trim();

  let user = users.find(u => (targetUserId && u.id === targetUserId) || (resellerEmail && u.email.toLowerCase() === resellerEmail.toLowerCase()));
  if (!user) {
    user = {
      id: targetUserId || `usr-reseller-${Date.now()}`,
      name: resellerName,
      email: resellerEmail || `reseller-${Date.now()}@vaivaizone.com`,
      phone: String(rawSenderNumber).trim(),
      role: 'reseller',
      tier: 'General',
      discountPercent: 5,
      wallet: {
        totalBalance: 0,
        lockedSecurityDeposit: LOCKED_DEPOSIT,
        usableBalance: 0,
      },
      kyc: {
        status: 'pending',
        phone: String(rawSenderNumber).trim(),
        gmail: resellerEmail,
        imoId: '',
        screenshotUrl: '',
      },
      depositApproved: false,
      isApprovedByAdmin: true,
      status: 'active',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(resellerName)}`,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
  }

  const cleanTrxId = String(rawTrxId).trim().toUpperCase();
  const cleanSenderNumber = String(rawSenderNumber).trim();
  const cleanMethod = (req.body.method || 'bkash').toLowerCase();

  const newDepositReq: DepositRequest = {
    id: req.body.id || `dep-${Date.now()}`,
    resellerId: user.id,
    resellerName: resellerName || user.name,
    resellerEmail: resellerEmail || user.email,
    amount: numAmount,
    method: cleanMethod as any,
    senderNumber: cleanSenderNumber,
    trxId: cleanTrxId,
    note: req.body.note || `Manual deposit of ৳${numAmount.toLocaleString()} via ${cleanMethod.toUpperCase()} by ${user.name}`,
    status: 'pending', // NOT AUTOMATIC! Awaiting Admin Approval
    createdAt: req.body.createdAt || new Date().toISOString(),
  };

  // Check if same TrxID already pending
  const existingIdx = depositRequests.findIndex(d => d.trxId.toUpperCase() === cleanTrxId);
  if (existingIdx >= 0) {
    depositRequests[existingIdx] = newDepositReq;
  } else {
    depositRequests.unshift(newDepositReq);
  }

  saveDatabase();
  console.log(`[DEPOSIT QUEUE] Saved deposit request: ${newDepositReq.id} - ${newDepositReq.amount} BDT - Trx: ${cleanTrxId} (Total in queue: ${depositRequests.length})`);

  // Dispatch Telegram Alert to Admin
  dispatchTelegramAlert(
    'deposit',
    `<b>💰 NEW DEPOSIT REQUEST (APPROVAL REQUIRED)!</b>\n` +
    `👤 <b>Reseller:</b> ${user.name}\n` +
    `💵 <b>Amount:</b> ৳${numAmount.toLocaleString()}\n` +
    `💳 <b>Method:</b> ${cleanMethod.toUpperCase()}\n` +
    `📱 <b>Sender Number:</b> <code>${cleanSenderNumber}</code>\n` +
    `🔖 <b>TrxID:</b> <code>${cleanTrxId}</code>\n` +
    `⏳ <i>Status: Awaiting Master Admin Verification & Approval</i>`
  );

  return res.json({
    success: true,
    message: 'Deposit request submitted successfully! Your balance will be credited after Master Admin verifies your TrxID.',
    depositRequest: newDepositReq,
    deposits: depositRequests,
  });
});

app.get('/api/wallet/deposit-requests', (req, res) => {
  const userId = req.query.userId as string;
  if (userId) {
    return res.json({ deposits: depositRequests.filter(d => d.resellerId === userId) });
  }
  return res.json({ deposits: depositRequests });
});

// Admin Review Deposit (Approve / Reject)
app.get('/api/admin/deposits', (req, res) => {
  return res.json({ deposits: depositRequests });
});

app.post('/api/admin/deposits/:id/review', (req, res) => {
  const { id } = req.params;
  const { action, rejectionReason } = req.body; // 'approve' | 'reject'

  const deposit = depositRequests.find(d => d.id === id);
  if (!deposit) return res.status(404).json({ error: 'Deposit request not found' });

  if (action === 'approve') {
    deposit.status = 'approved';
    deposit.reviewedAt = new Date().toISOString();

    const user = users.find(u => u.id === deposit.resellerId);
    if (user) {
      const prevBal = user.wallet.totalBalance;
      user.wallet.totalBalance += deposit.amount;
      if (user.wallet.totalBalance >= LOCKED_DEPOSIT) {
        user.depositApproved = true;
      }
      recalculateWallet(user);

      const tx: WalletTransaction = {
        id: `tx-${Date.now()}`,
        resellerId: user.id,
        resellerName: user.name,
        type: 'deposit',
        amount: deposit.amount,
        previousBalance: prevBal,
        newBalance: user.wallet.totalBalance,
        method: deposit.method,
        trxId: deposit.trxId,
        note: `Approved deposit via ${deposit.method.toUpperCase()} (Trx: ${deposit.trxId})`,
        timestamp: new Date().toISOString(),
      };
      transactions.unshift(tx);

      dispatchTelegramAlert(
        'deposit',
        `<b>✅ DEPOSIT APPROVED & CREDITED!</b>\n` +
        `👤 <b>Reseller:</b> ${user.name}\n` +
        `💵 <b>Amount Credited:</b> ৳${deposit.amount.toLocaleString()}\n` +
        `📊 <b>New Total:</b> ৳${user.wallet.totalBalance.toLocaleString()} (Usable: ৳${user.wallet.usableBalance.toLocaleString()})`
      );
    }
  } else if (action === 'reject') {
    deposit.status = 'rejected';
    deposit.reviewedAt = new Date().toISOString();
    deposit.rejectionReason = rejectionReason || 'Transaction ID not found in official statement.';

    dispatchTelegramAlert(
      'deposit',
      `<b>❌ DEPOSIT REQUEST REJECTED</b>\n` +
      `👤 <b>Reseller:</b> ${deposit.resellerName}\n` +
      `🔖 <b>TrxID:</b> ${deposit.trxId}\n` +
      `⚠️ <b>Reason:</b> ${deposit.rejectionReason}`
    );
  }

  saveDatabase();
  return res.json({ success: true, deposit });
});

app.get('/api/wallet/transactions', (req, res) => {
  const userId = req.query.userId as string;
  if (userId) {
    const list = transactions.filter(t => t.resellerId === userId);
    return res.json({ transactions: list });
  }
  return res.json({ transactions });
});

// ----------------- PAYMENT METHODS & NUMBERS CONFIGURATION ----------------- //

// Public route for Resellers to get active payment numbers, deposit notice, and support Whatsapp
app.get('/api/payment-methods', (req, res) => {
  const enabledAccounts = paymentSettings.accounts.filter(a => a.enabled);
  return res.json({
    accounts: enabledAccounts,
    notice: paymentSettings.notice,
    minDepositAmount: paymentSettings.minDepositAmount,
    supportWhatsapp: paymentSettings.supportWhatsapp || '01811223344',
    supportNotice: paymentSettings.supportNotice || '২৪/৭ অফিসিয়াল হোয়াটসঅ্যাপ সাপোর্ট লাইভ আছে।',
    updatedAt: paymentSettings.updatedAt,
  });
});

// Admin route to get all payment accounts and settings
app.get('/api/admin/payment-methods', (req, res) => {
  return res.json({ paymentSettings });
});

// Admin route to update payment accounts, deposit notice, and support Whatsapp
app.post('/api/admin/payment-methods', (req, res) => {
  const { accounts, notice, minDepositAmount, supportWhatsapp, supportNotice } = req.body;
  if (Array.isArray(accounts)) {
    paymentSettings.accounts = accounts;
  }
  if (notice !== undefined) {
    paymentSettings.notice = notice;
  }
  if (minDepositAmount !== undefined) {
    paymentSettings.minDepositAmount = parseFloat(minDepositAmount) || 100;
  }
  if (supportWhatsapp !== undefined) {
    paymentSettings.supportWhatsapp = supportWhatsapp;
  }
  if (supportNotice !== undefined) {
    paymentSettings.supportNotice = supportNotice;
  }
  paymentSettings.updatedAt = new Date().toISOString();
  saveDatabase();

  dispatchTelegramAlert(
    'test',
    `<b>⚙️ PAYMENT METHODS UPDATED!</b>\n` +
    `💳 <b>Active Accounts:</b> ${paymentSettings.accounts.filter(a => a.enabled).map(a => `${a.name}: ${a.number}`).join(', ')}\n` +
    `🕒 <i>Updated by Master Admin</i>`
  );

  return res.json({
    success: true,
    message: 'পেমেন্ট নাম্বার ও সেটিংস সফলভাবে সেভ হয়েছে!',
    paymentSettings,
  });
});

// 5. Orders: Top-up Diamonds / Quantity with Rate per 1000 Calculation
app.post('/api/orders/place', (req, res) => {
  const {
    userId,
    serviceId,
    customerId,
    quantity: rawQuantity,
    amount: rawAmount,
    paymentMethod,
    gatewayName,
    gatewayTrxId,
  } = req.body;

  const quantity = parseFloat(rawQuantity !== undefined ? rawQuantity : rawAmount);
  if (!userId || !serviceId || !customerId || isNaN(quantity) || quantity <= 0) {
    return res.status(400).json({ error: 'Please enter a valid Customer Phone / IMO ID and Top-up Quantity.' });
  }

  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Reseller account not found' });
  }

  // Approval gate check: KYC + Deposit Approved
  if (!user.isApprovedByAdmin && user.role !== 'admin') {
    return res.status(403).json({
      error: 'Categories and Order placement are locked! Admin must review and approve your KYC & ৳2,000 Security Deposit first.',
    });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Your reseller account has been suspended by Admin.' });
  }

  const service = services.find(s => s.id === serviceId);
  if (!service || service.hidden) {
    return res.status(404).json({ error: 'Selected service category is currently unavailable or hidden by Admin' });
  }

  const unitName = service.unitName || 'Diamonds 💎';
  const customerRatePer1000 = service.customerRatePer1000 || 2250;
  const resellerRatePer1000 = service.resellerRatePer1000 || 2180;

  // Rate per 1000 Exact Calculation:
  // e.g. 1,000 diamonds -> (1000/1000) * 2180 = 2180 BDT deducted from reseller's balance
  // e.g. 1,000 diamonds -> (1000/1000) * 2250 = 2250 BDT customer price
  const resellerPrice = Math.round(((quantity / 1000) * resellerRatePer1000) * 100) / 100;
  const retailPrice = Math.round(((quantity / 1000) * customerRatePer1000) * 100) / 100;
  const profitEarned = Math.round((retailPrice - resellerPrice) * 100) / 100;

  // DUAL-BALANCE WALLET ENFORCEMENT
  recalculateWallet(user);

  if (paymentMethod === 'usable_wallet') {
    if (user.wallet.totalBalance <= LOCKED_DEPOSIT) {
      return res.status(400).json({
        error: `Order Blocked: Total balance (৳${user.wallet.totalBalance.toLocaleString()}) is locked by the mandatory ৳2,000 Security Deposit. Usable Balance is ৳0. Please add funds.`,
        usableBalance: user.wallet.usableBalance,
        requiredAmount: resellerPrice,
      });
    }

    if (user.wallet.usableBalance < resellerPrice) {
      const shortage = resellerPrice - user.wallet.usableBalance;
      return res.status(400).json({
        error: `Insufficient Usable Balance! Order requires ৳${resellerPrice.toLocaleString()}, but your Usable Balance is only ৳${user.wallet.usableBalance.toLocaleString()} (Mandatory ৳2,000 Security Deposit is locked). Shortage: ৳${shortage.toFixed(2)}.`,
        usableBalance: user.wallet.usableBalance,
        requiredAmount: resellerPrice,
      });
    }

    // Atomic Balance Deduction
    const prevBalance = user.wallet.totalBalance;
    user.wallet.totalBalance -= resellerPrice;
    recalculateWallet(user);

    const tx: WalletTransaction = {
      id: `tx-ord-${Date.now()}`,
      resellerId: user.id,
      resellerName: user.name,
      type: 'order_deduction',
      amount: resellerPrice,
      previousBalance: prevBalance,
      newBalance: user.wallet.totalBalance,
      method: 'wallet',
      trxId: `ORD-${Date.now().toString().slice(-5)}`,
      note: `Payment for ${service.name} (${quantity.toLocaleString()} ${unitName}) for ${customerId}`,
      timestamp: new Date().toISOString(),
    };
    transactions.unshift(tx);
  }

  // Create Order
  const orderId = `ORD-${Date.now().toString().slice(-5)}`;
  const newOrder: Order = {
    id: orderId,
    resellerId: user.id,
    resellerName: user.name,
    resellerEmail: user.email,
    serviceId: service.id,
    serviceName: service.name,
    unitName,
    quantity,
    customerRatePer1000,
    resellerRatePer1000,
    amountUnit: `${quantity.toLocaleString()} ${unitName}`,
    customerId: customerId.trim(),
    retailPrice,
    discountPercent: Math.round(((retailPrice - resellerPrice) / (retailPrice || 1)) * 100),
    resellerPrice,
    profitEarned,
    paymentMethod,
    gatewayName: paymentMethod === 'instant_gateway' ? (gatewayName || 'bKash Live') : undefined,
    gatewayTrxId: paymentMethod === 'instant_gateway' ? (gatewayTrxId || `GW-${Date.now().toString().slice(-6)}`) : undefined,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  orders.unshift(newOrder);
  saveDatabase();

  // Dispatch Telegram Alert to Admin
  dispatchTelegramAlert(
    'new_order',
    `<b>🚨 NEW TOP-UP ORDER DISPATCHED! #${orderId}</b>\n` +
    `👤 <b>Reseller:</b> ${user.name} (${user.tier} Tier)\n` +
    `💎 <b>Quantity:</b> ${quantity.toLocaleString()} ${unitName} (${service.name})\n` +
    `🎯 <b>Customer ID:</b> <code>${customerId}</code>\n` +
    `💵 <b>Reseller Price:</b> ৳${resellerPrice.toLocaleString()} (Rate: ৳${resellerRatePer1000}/1000)\n` +
    `💰 <b>Customer Price:</b> ৳${retailPrice.toLocaleString()} (Rate: ৳${customerRatePer1000}/1000)\n` +
    `✨ <b>Reseller Profit:</b> +৳${profitEarned.toLocaleString()}\n` +
    `💳 <b>Payment:</b> ${paymentMethod === 'usable_wallet' ? 'Usable Wallet Balance (Paid)' : `Instant Gateway (${gatewayName || 'bKash'})`}\n` +
    `⚡ <i>Status: Pending Dispatch in Admin Queue</i>`
  );

  return res.json({
    success: true,
    message: 'Order placed successfully and sent to the dispatch queue!',
    order: newOrder,
    wallet: user.wallet,
  });
});

app.get('/api/orders', (req, res) => {
  const userId = req.query.userId as string;
  if (userId) {
    const list = orders.filter(o => o.resellerId === userId);
    return res.json({ orders: list });
  }
  return res.json({ orders });
});

app.get('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  return res.json({ order });
});

// ----------------- ADMIN CONTROLLERS ----------------- //

app.get('/api/admin/overview', (req, res) => {
  const totalResellers = users.filter(u => u.role === 'reseller').length;
  const verifiedResellers = users.filter(u => u.role === 'reseller' && u.kyc.status === 'verified').length;
  const pendingKycCount = users.filter(u => u.role === 'reseller' && (u.kyc.status === 'pending' || !u.isApprovedByAdmin)).length;
  const pendingDepositsCount = depositRequests.filter(d => d.status === 'pending').length;
  
  const totalVolume = orders.reduce((acc, o) => acc + (o.status !== 'cancelled' ? o.resellerPrice : 0), 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;

  const totalHeldBalance = users
    .filter(u => u.role === 'reseller')
    .reduce((acc, u) => acc + u.wallet.totalBalance, 0);

  const totalLockedDeposit = totalResellers * LOCKED_DEPOSIT;

  return res.json({
    totalResellers,
    verifiedResellers,
    pendingKycCount,
    pendingDepositsCount,
    totalVolume,
    totalOrders,
    pendingOrders,
    completedOrders,
    totalHeldBalance,
    totalLockedDeposit,
    servicesCount: services.length,
    activeServicesCount: services.filter(s => !s.hidden).length,
  });
});

// KYC manager: list and review
app.get('/api/admin/kyc/list', (req, res) => {
  const kycList = users
    .filter(u => u.role === 'reseller')
    .map(u => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      tier: u.tier,
      kyc: u.kyc,
      wallet: u.wallet,
      depositApproved: u.depositApproved,
      isApprovedByAdmin: u.isApprovedByAdmin,
      createdAt: u.createdAt,
    }));
  return res.json({ kycList });
});

app.post('/api/admin/kyc/:userId/review', (req, res) => {
  const { userId } = req.params;
  const { action, reason } = req.body;

  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (action === 'approve') {
    user.kyc.status = 'verified';
    user.kyc.reviewedAt = new Date().toISOString();
    user.kyc.rejectionReason = undefined;
    user.isApprovedByAdmin = true;
    user.depositApproved = true;

    dispatchTelegramAlert(
      'kyc_submitted',
      `<b>✅ RESELLER KYC & ACTIVATION APPROVED!</b>\n` +
      `👤 <b>Reseller:</b> ${user.name}\n` +
      `📧 <b>Gmail:</b> ${user.kyc.gmail || user.email}\n` +
      `💬 <b>IMO ID:</b> ${user.kyc.imoId || 'Verified'}\n` +
      `🔓 <b>Categories Unlocked:</b> Reseller can now place orders!`
    );
  } else if (action === 'reject') {
    user.kyc.status = 'rejected';
    user.kyc.reviewedAt = new Date().toISOString();
    user.kyc.rejectionReason = reason || 'Documentation could not be verified.';
    user.isApprovedByAdmin = false;

    dispatchTelegramAlert(
      'kyc_submitted',
      `<b>❌ KYC REJECTED</b>\n` +
      `👤 <b>Reseller:</b> ${user.name}\n` +
      `⚠️ <b>Reason:</b> ${user.kyc.rejectionReason}`
    );
  } else {
    return res.status(400).json({ error: 'Invalid action' });
  }

  saveDatabase();
  return res.json({ success: true, user });
});

// Resellers directory & manual adjustments
app.get('/api/admin/resellers', (req, res) => {
  const resellers = users
    .filter(u => u.role === 'reseller')
    .map(u => {
      recalculateWallet(u);
      const userOrders = orders.filter(o => o.resellerId === u.id);
      const totalSpent = userOrders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.resellerPrice, 0);
      return {
        ...u,
        totalOrdersCount: userOrders.length,
        totalSpent,
      };
    });
  return res.json({ resellers });
});

app.post('/api/admin/resellers/:userId/balance', (req, res) => {
  const { userId } = req.params;
  const { type, amount, reason } = req.body;
  const numAmount = parseFloat(amount);

  if (!userId || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Valid amount required' });
  }

  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'Reseller not found' });

  const prevBalance = user.wallet.totalBalance;
  if (type === 'debit') {
    if (user.wallet.totalBalance < numAmount) {
      return res.status(400).json({ error: 'Cannot debit more than total balance' });
    }
    user.wallet.totalBalance -= numAmount;
  } else {
    user.wallet.totalBalance += numAmount;
  }
  recalculateWallet(user);

  const tx: WalletTransaction = {
    id: `tx-adj-${Date.now()}`,
    resellerId: user.id,
    resellerName: user.name,
    type: 'admin_adjustment',
    amount: type === 'credit' ? numAmount : -numAmount,
    previousBalance: prevBalance,
    newBalance: user.wallet.totalBalance,
    method: 'manual',
    note: `Admin Adjustment (${type.toUpperCase()}): ${reason || 'Manual balance correction by Master Admin'}`,
    timestamp: new Date().toISOString(),
  };
  transactions.unshift(tx);

  saveDatabase();
  return res.json({ success: true, user, transaction: tx });
});

app.post('/api/admin/resellers/:userId/activation', (req, res) => {
  const { userId } = req.params;
  const { isApproved } = req.body;

  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'Reseller not found' });

  user.isApprovedByAdmin = !!isApproved;
  if (isApproved) {
    user.kyc.status = 'verified';
    user.depositApproved = true;
  }
  saveDatabase();
  return res.json({ success: true, user });
});

app.post('/api/admin/resellers/:userId/tier', (req, res) => {
  const { userId } = req.params;
  const { tier, discountPercent } = req.body;

  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'Reseller not found' });

  if (tier) user.tier = tier;
  if (discountPercent !== undefined) user.discountPercent = parseFloat(discountPercent);

  saveDatabase();
  return res.json({ success: true, user });
});

app.post('/api/admin/resellers/:userId/status', (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'Reseller not found' });

  user.status = status;
  saveDatabase();
  return res.json({ success: true, user });
});

app.get('/api/admin/orders', (req, res) => {
  return res.json({ orders });
});

app.post('/api/admin/orders/:orderId/status', (req, res) => {
  const { orderId } = req.params;
  const { status, operatorNote, operatorTrxId } = req.body;

  const order = orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const prevStatus = order.status;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  if (operatorNote) order.operatorNote = operatorNote;
  if (operatorTrxId) order.operatorTrxId = operatorTrxId;

  // AUTOMATIC INSTANT REFUND ON CANCEL
  if (status === 'cancelled' && prevStatus !== 'cancelled') {
    const user = users.find(u => u.id === order.resellerId);
    if (user && order.paymentMethod === 'usable_wallet') {
      const prevBal = user.wallet.totalBalance;
      user.wallet.totalBalance += order.resellerPrice;
      recalculateWallet(user);

      const refundTx: WalletTransaction = {
        id: `tx-ref-${Date.now()}`,
        resellerId: user.id,
        resellerName: user.name,
        type: 'refund',
        amount: order.resellerPrice,
        previousBalance: prevBal,
        newBalance: user.wallet.totalBalance,
        method: 'wallet',
        trxId: `REF-${order.id}`,
        note: `Automatic refund for Cancelled Order #${order.id} (${order.serviceName} - ${order.amountUnit})`,
        timestamp: new Date().toISOString(),
      };
      transactions.unshift(refundTx);

      dispatchTelegramAlert(
        'new_order',
        `<b>↩️ ORDER CANCELLED & REFUNDED!</b>\n` +
        `🔖 <b>Order ID:</b> #${order.id}\n` +
        `👤 <b>Reseller:</b> ${user.name}\n` +
        `💰 <b>Refunded Amount:</b> ৳${order.resellerPrice.toLocaleString()} instantly credited to Usable Balance\n` +
        `📝 <b>Reason:</b> ${operatorNote || 'Order cancelled by Admin'}`
      );
    }
  } else if (status === 'completed') {
    dispatchTelegramAlert(
      'new_order',
      `<b>✅ ORDER COMPLETED & DISPATCHED!</b>\n` +
      `🔖 <b>Order ID:</b> #${order.id}\n` +
      `👤 <b>Customer ID:</b> <code>${order.customerId}</code>\n` +
      `📦 <b>Service:</b> ${order.serviceName} - ${order.amountUnit}\n` +
      `🔑 <b>Operator Trx:</b> ${operatorTrxId || 'Dispatched via Direct API'}`
    );
  }

  saveDatabase();
  return res.json({ success: true, order });
});

// Telegram Settings & Test
app.get('/api/admin/telegram/config', (req, res) => {
  return res.json({ config: telegramConfig });
});

app.post('/api/admin/telegram/config', (req, res) => {
  const { botToken, chatId, enabled, alertOnRegistration, alertOnKyc, alertOnOrder, alertOnDeposit } = req.body;
  const cleanBotToken = botToken !== undefined ? String(botToken).trim().replace(/^bot/i, '') : telegramConfig.botToken;
  const cleanChatId = chatId !== undefined ? String(chatId).trim() : telegramConfig.chatId;

  telegramConfig = {
    botToken: cleanBotToken,
    chatId: cleanChatId,
    enabled: enabled !== undefined ? enabled : telegramConfig.enabled,
    alertOnRegistration: alertOnRegistration !== undefined ? alertOnRegistration : telegramConfig.alertOnRegistration,
    alertOnKyc: alertOnKyc !== undefined ? alertOnKyc : telegramConfig.alertOnKyc,
    alertOnOrder: alertOnOrder !== undefined ? alertOnOrder : telegramConfig.alertOnOrder,
    alertOnDeposit: alertOnDeposit !== undefined ? alertOnDeposit : telegramConfig.alertOnDeposit,
  };
  saveDatabase();
  console.log(`[TELEGRAM CONFIG] Updated config: Token Present: ${!!cleanBotToken}, ChatId: ${cleanChatId}`);
  return res.json({ success: true, config: telegramConfig });
});

app.post('/api/admin/telegram/test', async (req, res) => {
  const cleanBotToken = (telegramConfig.botToken || '').trim().replace(/^bot/i, '');
  const cleanChatId = (telegramConfig.chatId || '').trim();

  if (!cleanBotToken || !cleanChatId) {
    return res.status(400).json({
      success: false,
      error: 'Bot Token এবং Chat ID বসানো হয়নি! অনুগ্রহ করে Bot Token এবং Chat ID দিয়ে "Save Webhook Settings" বাটনে চাপ দিন।',
    });
  }

  const log = await dispatchTelegramAlert(
    'test',
    `<b>🔔 TEST ALERT from Reseller.vaivaizone.com</b>\n` +
    `⚡ Connection verified: Telegram Bot Webhook is online!\n` +
    `🕒 Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })} (BST)`
  );

  if (!log.success) {
    return res.status(400).json({
      success: false,
      error: `টেলিগ্রামে মেসেজ পাঠানো যায়নি। কারণ: ${log.message}`,
      log,
    });
  }

  return res.json({
    success: true,
    message: 'টেলিগ্রামে টেস্ট নোটিফিকেশন সফলভাবে পৌঁছেছে! আপনার টেলিগ্রাম চেক করুন।',
    log,
  });
});

app.get('/api/admin/telegram/logs', (req, res) => {
  return res.json({ logs: telegramLogs });
});

// Setup Vite middleware or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Reseller.vaivaizone.com Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
