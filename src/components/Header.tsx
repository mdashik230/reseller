import React, { useState } from 'react';
import { useAuth, isMasterAdminEmail } from '../context/AuthContext';
import { formatBDT } from '../utils/formatters';
import { soundEffects } from '../utils/audio';
import {
  ShieldCheck,
  Lock,
  Wallet,
  PlusCircle,
  Bell,
  BellOff,
  Sun,
  Moon,
  ChevronDown,
  Building,
  Smartphone,
  LogOut,
  UserCheck
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    logout,
    isDarkMode,
    setIsDarkMode,
    soundEnabled,
    setSoundEnabled,
    setOpenDepositModal,
    setOpenTransactionsModal,
    setOpenKycModal
  } = useAuth();

  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) {
      soundEffects.playSuccessChime();
    }
  };

  const isMasterAdmin = currentUser?.role === 'admin' && isMasterAdminEmail(currentUser?.email);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Domain */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="text-emerald-400 font-extrabold text-lg tracking-wider">V</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  Reseller.vaivaizone.com
                </span>
                <span className={`hidden md:inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded border ${
                  isMasterAdmin
                    ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                }`}>
                  {isMasterAdmin ? 'MASTER ADMIN PANEL 👑' : 'RESELLER PORTAL'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Digital Services &amp; Top-Up Network
              </p>
            </div>
          </div>

          {/* Center Status Tag (No view switchers) */}
          <div className="hidden lg:flex items-center">
            {isMasterAdmin ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-bold">
                <Building className="w-4 h-4 text-cyan-400" />
                <span>Master Admin Control Center</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Reseller Authorized Gateway</span>
              </div>
            )}
          </div>

          {/* Right Action Tools: Wallet Quick-View & Profile Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Reseller Wallet Pill */}
            {currentUser && currentUser.role === 'reseller' && (
              <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col text-right">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    <Wallet className="w-3 h-3 text-emerald-500" />
                    <span>Usable:</span>
                    <span className="font-bold font-mono-numbers text-emerald-600 dark:text-emerald-400 text-xs">
                      {formatBDT(currentUser.wallet.usableBalance)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                    <Lock className="w-2.5 h-2.5 text-amber-500" />
                    <span>Locked: {formatBDT(currentUser.wallet.lockedSecurityDeposit)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setOpenDepositModal(true)}
                  title="Add money to balance"
                  className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Google Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors"
              >
                {currentUser?.avatarUrl && currentUser.avatarUrl.trim() !== '' ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-full object-cover border border-slate-600"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
                    {currentUser?.name ? currentUser.name[0] : 'G'}
                  </div>
                )}
                
                <div className="text-left hidden md:block">
                  <div className="font-semibold text-xs leading-none truncate max-w-[130px]">
                    {currentUser?.name || 'Google User'}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight truncate max-w-[130px]">
                    {currentUser?.email || 'Logged in with Google'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showAccountDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Google Account Session
                    </p>
                    <p className="text-xs font-semibold text-slate-200 mt-0.5 truncate">
                      {currentUser?.email}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-slate-800 text-slate-300">
                        {currentUser?.role === 'admin' ? 'Master Admin' : `${currentUser?.tier} Reseller`}
                      </span>
                      {currentUser?.role === 'reseller' && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          currentUser.isApprovedByAdmin
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {currentUser.isApprovedByAdmin ? 'Categories Active ✅' : 'Approval Pending ⏳'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sign Out Button */}
                  <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setShowAccountDropdown(false);
                        logout();
                      }}
                      className="w-full text-left p-2.5 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 font-semibold transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out from Google</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Audio Alert Bell */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Mute Order Chimes' : 'Enable Order Chimes'}
              className={`p-2 rounded-xl border transition-colors ${
                soundEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
            >
              {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>

            {/* Dark/Light mode toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              title="Toggle Theme"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Direct Logout Button */}
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
