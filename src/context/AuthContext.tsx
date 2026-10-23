import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, WalletState } from '../types';
import { soundEffects } from '../utils/audio';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const LOCKED_DEPOSIT = 2000;
export const MASTER_ADMIN_EMAIL = 'loverblack2022@gmail.com';

export const isMasterAdminEmail = (email?: string): boolean => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return normalized === 'loverblack2022@gmail.com' || normalized === 'loverblack2022@gmail';
};

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  activeModule: 'reseller' | 'admin';
  setActiveModule: (module: 'reseller' | 'admin') => void;
  loginWithGoogle: (email: string, name?: string, avatarUrl?: string, rolePreference?: string) => Promise<User>;
  logout: () => void;
  switchUser: (user: User) => void;
  updateUserWallet: (wallet: WalletState) => void;
  refreshUser: () => Promise<void>;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  openKycModal: boolean;
  setOpenKycModal: (val: boolean) => void;
  openDepositModal: boolean;
  setOpenDepositModal: (val: boolean) => void;
  openTransactionsModal: boolean;
  setOpenTransactionsModal: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('vaivai_reseller_user_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.id) return parsed;
        }
      } catch {
        // Fallback
      }
    }
    return null; // Start unauthenticated to show Login Page
  });

  const [activeModule, setActiveModule] = useState<'reseller' | 'admin'>(() => {
    return currentUser?.role === 'admin' ? 'admin' : 'reseller';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals state
  const [openKycModal, setOpenKycModal] = useState<boolean>(false);
  const [openDepositModal, setOpenDepositModal] = useState<boolean>(false);
  const [openTransactionsModal, setOpenTransactionsModal] = useState<boolean>(false);

  useEffect(() => {
    soundEffects.enabled = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Save current user to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (currentUser) {
          localStorage.setItem('vaivai_reseller_user_v2', JSON.stringify(currentUser));
        } else {
          localStorage.removeItem('vaivai_reseller_user_v2');
        }
      } catch {
        // Ignore
      }
    }
  }, [currentUser]);

  // Login with Google Account with high resilience (works on Express, Vercel static, and offline)
  const loginWithGoogle = async (email: string, name?: string, avatarUrl?: string, rolePreference?: string): Promise<User> => {
    const cleanEmail = email.trim().toLowerCase();
    const isMasterAdmin = isMasterAdminEmail(cleanEmail);

    let authUser: User | null = null;

    try {
      const res = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, name, avatarUrl, rolePreference }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.user) {
          authUser = data.user;
        }
      }
    } catch (apiErr) {
      console.warn('API server unreachable, fallback to client session:', apiErr);
    }

    // Client-side fallback if backend API is not available (e.g. Vercel static deployment or offline)
    if (!authUser) {
      if (isMasterAdmin) {
        authUser = {
          id: 'usr-admin-master',
          name: name || 'Master Admin (loverblack2022)',
          email: MASTER_ADMIN_EMAIL,
          phone: '+8801700000001',
          role: 'admin',
          tier: 'VIP',
          discountPercent: 14,
          wallet: { totalBalance: 50000, lockedSecurityDeposit: LOCKED_DEPOSIT, usableBalance: 48000 },
          kyc: {
            status: 'verified',
            phone: '+8801700000001',
            gmail: MASTER_ADMIN_EMAIL,
            imoId: 'IMO-VAI-ADMIN',
            screenshotUrl: ''
          },
          depositApproved: true,
          isApprovedByAdmin: true,
          status: 'active',
          avatarUrl: avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
          createdAt: new Date().toISOString()
        };
      } else {
        // Normal reseller user with persistence in localStorage
        let storedResellers: User[] = [];
        try {
          const raw = localStorage.getItem('vaivai_local_resellers');
          if (raw) storedResellers = JSON.parse(raw);
        } catch {
          storedResellers = [];
        }

        let existing = storedResellers.find(u => u.email.toLowerCase() === cleanEmail);
        if (existing) {
          authUser = existing;
        } else {
          authUser = {
            id: `usr-reseller-${Date.now()}`,
            name: name || cleanEmail.split('@')[0],
            email: cleanEmail,
            phone: '',
            role: 'reseller',
            tier: 'General',
            discountPercent: 5,
            wallet: { totalBalance: 0, lockedSecurityDeposit: LOCKED_DEPOSIT, usableBalance: 0 },
            kyc: { status: 'not_submitted', phone: '', gmail: cleanEmail, imoId: '', screenshotUrl: '' },
            depositApproved: false,
            isApprovedByAdmin: false,
            status: 'active',
            avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
            createdAt: new Date().toISOString()
          };
          storedResellers.push(authUser);
          try {
            localStorage.setItem('vaivai_local_resellers', JSON.stringify(storedResellers));
          } catch {
            // Ignore
          }
        }
      }
    }

    // Enforce role guarantees strictly
    if (isMasterAdmin) {
      authUser.role = 'admin';
      authUser.depositApproved = true;
      authUser.isApprovedByAdmin = true;
    } else {
      authUser.role = 'reseller';
    }

    soundEffects.playSuccessChime();
    setCurrentUser(authUser);
    if (authUser.role === 'admin') {
      setActiveModule('admin');
    } else {
      setActiveModule('reseller');
    }
    return authUser;
  };

  const logout = () => {
    setCurrentUser(null);
    signOut(auth).catch(() => {});
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('vaivai_reseller_user_v2');
      } catch {
        // Ignore
      }
    }
  };

  // Fetch / refresh user profile from backend
  const refreshUser = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'x-user-id': currentUser.id },
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.user) {
          const isMasterAdmin = isMasterAdminEmail(data.user.email);
          const verifiedUser = {
            ...data.user,
            role: isMasterAdmin ? 'admin' : 'reseller',
          };
          setCurrentUser(verifiedUser);
        }
      }
    } catch {
      // Gracefully silent on transient network disconnections
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) {
      refreshUser();
    }
  }, [currentUser?.id, refreshUser]);

  const switchUser = (user: User) => {
    const isMasterAdmin = isMasterAdminEmail(user.email);
    const effectiveUser: User = {
      ...user,
      role: isMasterAdmin ? 'admin' : 'reseller',
    };
    setCurrentUser(effectiveUser);
    if (isMasterAdmin) {
      setActiveModule('admin');
    } else {
      setActiveModule('reseller');
    }
  };

  const updateUserWallet = (wallet: WalletState) => {
    if (!currentUser) return;
    setCurrentUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        wallet,
      };
    });
  };

  const handleSetActiveModule = (mod: 'reseller' | 'admin') => {
    if (mod === 'admin' && !isMasterAdminEmail(currentUser?.email)) {
      setActiveModule('reseller');
      return;
    }
    setActiveModule(mod);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        activeModule,
        setActiveModule: handleSetActiveModule,
        loginWithGoogle,
        logout,
        switchUser,
        updateUserWallet,
        refreshUser,
        isDarkMode,
        setIsDarkMode,
        soundEnabled,
        setSoundEnabled,
        openKycModal,
        setOpenKycModal,
        openDepositModal,
        setOpenDepositModal,
        openTransactionsModal,
        setOpenTransactionsModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
