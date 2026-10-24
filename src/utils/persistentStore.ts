import {
  ServiceItem,
  PaymentSettings,
  PaymentAccount,
  DepositRequest,
  Order,
  User,
  TelegramConfig
} from '../types';

const STORE_EVENT = 'vaivai_store_updated';

export const dispatchStoreEvent = (type: string) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: { type } }));
  }
};

export const onStoreUpdate = (callback: (e: Event) => void) => {
  if (typeof window !== 'undefined') {
    window.addEventListener(STORE_EVENT, callback);
    return () => window.removeEventListener(STORE_EVENT, callback);
  }
  return () => {};
};

// Default Services Seed
export const defaultServices: ServiceItem[] = [
  {
    id: 'srv-imo-diamonds',
    name: 'IMO Diamonds Top-Up (আইমো ডায়মন্ড)',
    category: 'imo',
    icon: '💎',
    description: 'Direct instant diamond recharge to recipient IMO ID number. Fast 1-second auto processing.',
    inputType: 'imo_id',
    inputLabel: 'IMO ID / Phone Number',
    inputPlaceholder: 'e.g. 8801712345678',
    unitName: 'Diamonds 💎',
    customerRatePer1000: 2250,
    resellerRatePer1000: 2180,
    minQuantity: 50,
    hidden: false,
  },
  {
    id: 'srv-bigo-diamonds',
    name: 'Bigo Live Diamonds (বিগো ডায়মন্ড)',
    category: 'bigo',
    icon: '🫘',
    description: 'Instant official Bigo Live diamonds recharge via Bigo User ID number.',
    inputType: 'player_id',
    inputLabel: 'Bigo User ID',
    inputPlaceholder: 'e.g. 987654321',
    unitName: 'Diamonds 💎',
    customerRatePer1000: 2450,
    resellerRatePer1000: 2360,
    minQuantity: 100,
    hidden: false,
  },
  {
    id: 'srv-tiktok-coins',
    name: 'TikTok Live Coins (টিকটক কয়েন)',
    category: 'tiktok',
    icon: '🪙',
    description: 'Recharge TikTok live gifting coins directly to TikTok Username.',
    inputType: 'player_id',
    inputLabel: 'TikTok Username (@username)',
    inputPlaceholder: 'e.g. @vaivai_official',
    unitName: 'Coins 🪙',
    customerRatePer1000: 2100,
    resellerRatePer1000: 2020,
    minQuantity: 100,
    hidden: false,
  },
  {
    id: 'srv-freefire-diamonds',
    name: 'Free Fire Diamonds (ফ্রি ফায়ার)',
    category: 'games',
    icon: '🔥',
    description: 'Direct in-game diamond top-up via Free Fire Player ID (UID).',
    inputType: 'player_id',
    inputLabel: 'Free Fire Player UID',
    inputPlaceholder: 'e.g. 1294857291',
    unitName: 'Diamonds 💎',
    customerRatePer1000: 1950,
    resellerRatePer1000: 1880,
    minQuantity: 100,
    hidden: false,
  },
  {
    id: 'srv-pubg-uc',
    name: 'PUBG Mobile UC (পাবজি ইউসি)',
    category: 'games',
    icon: '⚡',
    description: 'Global PUBG Mobile Unknown Cash (UC) instant delivery via Character ID.',
    inputType: 'player_id',
    inputLabel: 'PUBG Character ID',
    inputPlaceholder: 'e.g. 5182947291',
    unitName: 'UC ⚡',
    customerRatePer1000: 1850,
    resellerRatePer1000: 1780,
    minQuantity: 60,
    hidden: false,
  },
];

// Default Payment Settings Seed
export const defaultPaymentSettings: PaymentSettings = {
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
      number: '01988776655',
      type: 'Personal (Send Money)',
      instruction: 'উপায় একাউন্টে সেন্ড মানি করে TrxID দিয়ে রিকোয়েস্ট করুন।',
      enabled: true,
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
  notice: 'টাকা পাঠানোর পর অবশ্যই সঠিক TrxID এবং সেন্ডার নাম্বার দিয়ে ডিপোজিট রিকোয়েস্ট সাবমিট করুন। এডমিন ম্যানুয়ালি ভেরিফাই করে ৫-১৫ মিনিটের মধ্যে ওয়ালেটে ব্যালেন্স যোগ করবেন।',
  minDepositAmount: 100,
  supportWhatsapp: '01811223344',
  supportNotice: '২৪/৭ অফিসিয়াল হোয়াটসঅ্যাপ সাপোর্ট লাইভ আছে। যেকোনো প্রয়োজনে চ্যাট করুন।',
};

// ----------------- SERVICES MANAGEMENT ----------------- //

export const persistentStore = {
  // Services
  getServices: async (): Promise<ServiceItem[]> => {
    let localData: ServiceItem[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('vaivai_services');
        if (raw) localData = JSON.parse(raw);
      } catch {}
    }
    if (localData && localData.length > 0) {
      // Try background sync
      fetch('/api/services?all=true')
        .then(res => res.json())
        .then(data => {
          if (data && data.services && Array.isArray(data.services) && data.services.length > 0) {
            localStorage.setItem('vaivai_services', JSON.stringify(data.services));
          }
        })
        .catch(() => {});
      return localData;
    }

    try {
      const res = await fetch('/api/services?all=true');
      const data = await res.json();
      if (data && data.services && Array.isArray(data.services)) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('vaivai_services', JSON.stringify(data.services));
        }
        return data.services;
      }
    } catch {}

    if (typeof window !== 'undefined') {
      localStorage.setItem('vaivai_services', JSON.stringify(defaultServices));
    }
    return defaultServices;
  },

  saveServices: async (newServices: ServiceItem[]): Promise<boolean> => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vaivai_services', JSON.stringify(newServices));
      dispatchStoreEvent('services');
    }
    try {
      await fetch('/api/admin/services/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: newServices }),
      });
    } catch {}
    return true;
  },

  updateRatesBatch: async (
    rates: Array<{ id: string; customerRatePer1000: number; resellerRatePer1000: number; unitName: string }>
  ): Promise<boolean> => {
    let list: ServiceItem[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('vaivai_services');
        if (raw) list = JSON.parse(raw);
      } catch {}
    }
    if (!list || list.length === 0) list = [...defaultServices];

    for (const r of rates) {
      const item = list.find(s => s.id === r.id);
      if (item) {
        item.customerRatePer1000 = r.customerRatePer1000;
        item.resellerRatePer1000 = r.resellerRatePer1000;
        item.unitName = r.unitName;
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('vaivai_services', JSON.stringify(list));
      dispatchStoreEvent('services');
    }

    try {
      await fetch('/api/admin/services/batch-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates }),
      });
    } catch {}

    return true;
  },

  // Payment Settings
  getPaymentSettings: async (): Promise<PaymentSettings> => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('vaivai_payment_settings');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.accounts) && parsed.accounts.length > 0) {
            return {
              ...defaultPaymentSettings,
              ...parsed,
              supportWhatsapp: parsed.supportWhatsapp || defaultPaymentSettings.supportWhatsapp,
              supportNotice: parsed.supportNotice || defaultPaymentSettings.supportNotice,
            };
          }
        }
      } catch {}
    }

    try {
      const res = await fetch('/api/payment-methods');
      const data = await res.json();
      if (data && data.accounts) {
        const settings: PaymentSettings = {
          accounts: data.accounts,
          notice: data.notice || defaultPaymentSettings.notice,
          minDepositAmount: data.minDepositAmount || 100,
          supportWhatsapp: data.supportWhatsapp || defaultPaymentSettings.supportWhatsapp,
          supportNotice: data.supportNotice || defaultPaymentSettings.supportNotice,
          updatedAt: data.updatedAt,
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('vaivai_payment_settings', JSON.stringify(settings));
        }
        return settings;
      }
    } catch {}

    if (typeof window !== 'undefined') {
      localStorage.setItem('vaivai_payment_settings', JSON.stringify(defaultPaymentSettings));
    }
    return defaultPaymentSettings;
  },

  savePaymentSettings: async (settings: PaymentSettings): Promise<boolean> => {
    const updated = { ...settings, updatedAt: new Date().toISOString() };
    if (typeof window !== 'undefined') {
      localStorage.setItem('vaivai_payment_settings', JSON.stringify(updated));
      dispatchStoreEvent('payments');
    }
    try {
      await fetch('/api/admin/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {}
    return true;
  },

  // KYC Submissions & Reviews
  submitKyc: async (
    userId: string,
    data: { phone: string; gmail: string; imoId: string; screenshotUrl: string }
  ): Promise<{ success: boolean; message: string }> => {
    const submittedAt = new Date().toISOString();
    const kycRecord = {
      status: 'pending' as const,
      phone: data.phone,
      gmail: data.gmail,
      imoId: data.imoId,
      screenshotUrl: data.screenshotUrl,
      submittedAt,
    };

    // Update in localStorage
    if (typeof window !== 'undefined') {
      try {
        // 1. Update current logged in user session if matching
        const rawUser = localStorage.getItem('vaivai_reseller_user_v2');
        if (rawUser) {
          const user = JSON.parse(rawUser);
          if (user.id === userId) {
            user.kyc = kycRecord;
            user.phone = data.phone;
            localStorage.setItem('vaivai_reseller_user_v2', JSON.stringify(user));
          }
        }

        // 2. Add/update in local KYC queue
        let kycQueue: any[] = [];
        const rawKyc = localStorage.getItem('vaivai_kyc_submissions');
        if (rawKyc) kycQueue = JSON.parse(rawKyc);

        const existingIdx = kycQueue.findIndex(k => k.userId === userId);
        const queueItem = {
          userId,
          name: data.gmail.split('@')[0],
          email: data.gmail,
          phone: data.phone,
          tier: 'General',
          kyc: kycRecord,
          wallet: { totalBalance: 0, lockedSecurityDeposit: 2000, usableBalance: 0 },
        };

        if (existingIdx >= 0) {
          kycQueue[existingIdx] = { ...kycQueue[existingIdx], ...queueItem };
        } else {
          kycQueue.unshift(queueItem);
        }
        localStorage.setItem('vaivai_kyc_submissions', JSON.stringify(kycQueue));

        // 3. Update in local resellers list
        let resellers: User[] = [];
        const rawResellers = localStorage.getItem('vaivai_local_resellers');
        if (rawResellers) resellers = JSON.parse(rawResellers);
        const rIndex = resellers.findIndex(r => r.id === userId);
        if (rIndex >= 0) {
          resellers[rIndex].kyc = kycRecord;
          resellers[rIndex].phone = data.phone;
          localStorage.setItem('vaivai_local_resellers', JSON.stringify(resellers));
        }

        dispatchStoreEvent('kyc');
      } catch (err) {
        console.error('Error saving local KYC:', err);
      }
    }

    // Try API call asynchronously
    try {
      await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...data }),
      });
    } catch {}

    return {
      success: true,
      message: 'KYC সাবমিট সফল হয়েছে! মাস্টার এডমিন যাচাই করে দ্রুত এপ্রুভ করবেন।',
    };
  },

  getKycList: async (): Promise<any[]> => {
    let localList: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('vaivai_kyc_submissions');
        if (raw) localList = JSON.parse(raw);
      } catch {}
    }

    try {
      const res = await fetch('/api/admin/kyc/list');
      const data = await res.json();
      if (data && Array.isArray(data.kycList) && data.kycList.length > 0) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('vaivai_kyc_submissions', JSON.stringify(data.kycList));
        }
        return data.kycList;
      }
    } catch {}

    return localList;
  },

  reviewKyc: async (userId: string, action: 'approve' | 'reject', reason?: string): Promise<boolean> => {
    const reviewedAt = new Date().toISOString();
    const newStatus = action === 'approve' ? 'verified' : 'rejected';

    if (typeof window !== 'undefined') {
      try {
        // Update local KYC submissions
        let kycQueue: any[] = [];
        const rawKyc = localStorage.getItem('vaivai_kyc_submissions');
        if (rawKyc) kycQueue = JSON.parse(rawKyc);
        const item = kycQueue.find(k => k.userId === userId);
        if (item) {
          item.kyc.status = newStatus;
          item.kyc.reviewedAt = reviewedAt;
          if (reason) item.kyc.rejectionReason = reason;
          localStorage.setItem('vaivai_kyc_submissions', JSON.stringify(kycQueue));
        }

        // Update current user if matches
        const rawUser = localStorage.getItem('vaivai_reseller_user_v2');
        if (rawUser) {
          const u = JSON.parse(rawUser);
          if (u.id === userId) {
            u.kyc.status = newStatus;
            u.kyc.reviewedAt = reviewedAt;
            if (reason) u.kyc.rejectionReason = reason;
            if (action === 'approve') {
              u.isApprovedByAdmin = true;
            }
            localStorage.setItem('vaivai_reseller_user_v2', JSON.stringify(u));
          }
        }

        // Update local resellers list
        let resellers: User[] = [];
        const rawResellers = localStorage.getItem('vaivai_local_resellers');
        if (rawResellers) resellers = JSON.parse(rawResellers);
        const r = resellers.find(u => u.id === userId);
        if (r) {
          r.kyc.status = newStatus;
          r.kyc.reviewedAt = reviewedAt;
          if (reason) r.kyc.rejectionReason = reason;
          if (action === 'approve') {
            r.isApprovedByAdmin = true;
          }
          localStorage.setItem('vaivai_local_resellers', JSON.stringify(resellers));
        }

        dispatchStoreEvent('kyc');
      } catch (err) {
        console.error('Error updating review locally:', err);
      }
    }

    try {
      await fetch(`/api/admin/kyc/${userId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
    } catch {}

    return true;
  },

  // Deposit Requests
  getDeposits: async (): Promise<DepositRequest[]> => {
    let localDeps: DepositRequest[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('vaivai_deposit_requests');
        if (raw) localDeps = JSON.parse(raw);
      } catch {}
    }

    try {
      const res = await fetch('/api/admin/deposits');
      const data = await res.json();
      if (data && Array.isArray(data.deposits)) {
        // Merge server and local deposits by id and trxId so no requests are lost
        const mergedMap = new Map<string, DepositRequest>();
        // Add server records first
        data.deposits.forEach((d: DepositRequest) => mergedMap.set(d.id, d));

        // Add any local deposits not yet on server
        localDeps.forEach((d: DepositRequest) => {
          if (!mergedMap.has(d.id)) {
            const existsByTrx = Array.from(mergedMap.values()).some(
              x => x.trxId.toUpperCase() === d.trxId.toUpperCase()
            );
            if (!existsByTrx) {
              mergedMap.set(d.id, d);
              // Push unsaved local deposit to server in background
              fetch('/api/wallet/deposit-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: d.id,
                  userId: d.resellerId,
                  resellerId: d.resellerId,
                  resellerName: d.resellerName,
                  resellerEmail: d.resellerEmail,
                  amount: d.amount,
                  method: d.method,
                  senderNumber: d.senderNumber,
                  trxId: d.trxId,
                  note: d.note,
                  createdAt: d.createdAt,
                }),
              }).catch(() => {});
            }
          }
        });

        const combined = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        if (typeof window !== 'undefined') {
          localStorage.setItem('vaivai_deposit_requests', JSON.stringify(combined));
        }
        return combined;
      }
    } catch {}

    return localDeps;
  },

  submitDeposit: async (deposit: Omit<DepositRequest, 'id' | 'createdAt' | 'status'>): Promise<DepositRequest> => {
    const newReq: DepositRequest = {
      id: `dep-${Date.now()}`,
      ...deposit,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      try {
        let deps: DepositRequest[] = [];
        const raw = localStorage.getItem('vaivai_deposit_requests');
        if (raw) deps = JSON.parse(raw);
        // Avoid duplicate by trxId
        const existingIdx = deps.findIndex(d => d.trxId.toUpperCase() === newReq.trxId.toUpperCase());
        if (existingIdx >= 0) {
          deps[existingIdx] = newReq;
        } else {
          deps.unshift(newReq);
        }
        localStorage.setItem('vaivai_deposit_requests', JSON.stringify(deps));
        dispatchStoreEvent('deposits');
      } catch {}
    }

    try {
      const res = await fetch('/api/wallet/deposit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newReq.id,
          userId: deposit.resellerId,
          resellerId: deposit.resellerId,
          resellerName: deposit.resellerName,
          resellerEmail: deposit.resellerEmail,
          amount: deposit.amount,
          method: deposit.method,
          senderNumber: deposit.senderNumber,
          trxId: deposit.trxId,
          note: deposit.note,
          createdAt: newReq.createdAt,
        }),
      });
      const data = await res.json();
      if (data && data.depositRequest) {
        if (typeof window !== 'undefined') {
          try {
            let deps: DepositRequest[] = [];
            const raw = localStorage.getItem('vaivai_deposit_requests');
            if (raw) deps = JSON.parse(raw);
            const idx = deps.findIndex(d => d.id === newReq.id || d.trxId.toUpperCase() === newReq.trxId.toUpperCase());
            if (idx >= 0) {
              deps[idx] = data.depositRequest;
            } else {
              deps.unshift(data.depositRequest);
            }
            localStorage.setItem('vaivai_deposit_requests', JSON.stringify(deps));
            dispatchStoreEvent('deposits');
          } catch {}
        }
        return data.depositRequest;
      }
    } catch (err) {
      console.warn('Network deposit submission warning:', err);
    }

    return newReq;
  },

  reviewDeposit: async (id: string, action: 'approve' | 'reject', reason?: string): Promise<boolean> => {
    if (typeof window !== 'undefined') {
      try {
        let deps: DepositRequest[] = [];
        const raw = localStorage.getItem('vaivai_deposit_requests');
        if (raw) deps = JSON.parse(raw);
        const dep = deps.find(d => d.id === id);
        if (dep) {
          dep.status = action === 'approve' ? 'approved' : 'rejected';
          dep.reviewedAt = new Date().toISOString();
          if (reason) dep.rejectionReason = reason;
          localStorage.setItem('vaivai_deposit_requests', JSON.stringify(deps));

          // If approved, credit reseller's wallet
          if (action === 'approve') {
            const rawUser = localStorage.getItem('vaivai_reseller_user_v2');
            if (rawUser) {
              const u = JSON.parse(rawUser);
              if (u.id === dep.resellerId) {
                u.wallet.totalBalance += dep.amount;
                u.wallet.usableBalance = Math.max(0, u.wallet.totalBalance - 2000);
                if (u.wallet.totalBalance >= 2000) {
                  u.depositApproved = true;
                }
                localStorage.setItem('vaivai_reseller_user_v2', JSON.stringify(u));
              }
            }

            let resellers: User[] = [];
            const rawResellers = localStorage.getItem('vaivai_local_resellers');
            if (rawResellers) resellers = JSON.parse(rawResellers);
            const r = resellers.find(u => u.id === dep.resellerId);
            if (r) {
              r.wallet.totalBalance += dep.amount;
              r.wallet.usableBalance = Math.max(0, r.wallet.totalBalance - 2000);
              if (r.wallet.totalBalance >= 2000) {
                r.depositApproved = true;
              }
              localStorage.setItem('vaivai_local_resellers', JSON.stringify(resellers));
            }
          }

          dispatchStoreEvent('deposits');
          dispatchStoreEvent('wallet');
        }
      } catch (err) {
        console.error('Error reviewing deposit locally:', err);
      }
    }

    try {
      await fetch(`/api/admin/deposits/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason: reason }),
      });
    } catch {}

    return true;
  },

  // Telegram Settings
  getTelegramConfig: async (): Promise<TelegramConfig> => {
    const defaultConfig: TelegramConfig = {
      botToken: '',
      chatId: '',
      enabled: true,
      alertOnRegistration: true,
      alertOnKyc: true,
      alertOnOrder: true,
      alertOnDeposit: true,
    };

    try {
      const res = await fetch('/api/admin/telegram/config');
      const data = await res.json();
      if (data && data.config) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('vaivai_telegram_config', JSON.stringify(data.config));
        }
        return { ...defaultConfig, ...data.config };
      }
    } catch {}

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('vaivai_telegram_config');
        if (raw) return { ...defaultConfig, ...JSON.parse(raw) };
      } catch {}
    }

    return defaultConfig;
  },

  saveTelegramConfig: async (config: TelegramConfig): Promise<boolean> => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vaivai_telegram_config', JSON.stringify(config));
      dispatchStoreEvent('telegram');
    }
    try {
      await fetch('/api/admin/telegram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
    } catch {}
    return true;
  },

  dispatchTelegramDirect: async (
    event: 'deposit' | 'new_order' | 'kyc_submitted' | 'registration' | 'test',
    messageHtml: string
  ): Promise<boolean> => {
    try {
      const cfg = await persistentStore.getTelegramConfig();
      if (!cfg.enabled || !cfg.botToken || !cfg.chatId) return false;
      if (event === 'deposit' && cfg.alertOnDeposit === false) return false;
      if (event === 'new_order' && cfg.alertOnOrder === false) return false;
      if (event === 'kyc_submitted' && cfg.alertOnKyc === false) return false;
      if (event === 'registration' && cfg.alertOnRegistration === false) return false;

      const cleanToken = cfg.botToken.trim().replace(/^bot/i, '');
      const cleanChat = cfg.chatId.trim();
      if (!cleanToken || !cleanChat) return false;

      const res = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cleanChat,
          text: messageHtml,
          parse_mode: 'HTML',
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        // Fallback plain text
        await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: cleanChat,
            text: messageHtml.replace(/<[^>]*>?/gm, ''),
          }),
        });
      }
      return true;
    } catch {
      return false;
    }
  },
};
