import React from 'react';
import { AuthProvider, useAuth, isMasterAdminEmail } from './context/AuthContext';
import { Header } from './components/Header';
import { ResellerDashboard } from './components/ResellerPortal/ResellerDashboard';
import { AdminDashboard } from './components/AdminPanel/AdminDashboard';
import { LoginPage } from './components/Auth/LoginPage';
import { WhatsAppSupportButton } from './components/WhatsAppSupportButton';
import {
  ShieldCheck,
  Lock,
  Cpu
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuth();

  // If user is not authenticated with Google, show the dedicated Login Page
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <WhatsAppSupportButton />
      </>
    );
  }

  const isMasterAdmin = currentUser?.role === 'admin' && isMasterAdminEmail(currentUser?.email);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Top Application Header */}
      <Header />

      {/* Main View Area: Strict segregation between Reseller and Master Admin */}
      <main className="flex-1 pb-16">
        {isMasterAdmin ? <AdminDashboard /> : <ResellerDashboard />}
      </main>

      {/* Floating 24/7 WhatsApp Support Button */}
      <WhatsAppSupportButton />

      {/* Professional Fintech Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 text-slate-400 py-8 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-emerald-400 text-xs">
                  V
                </div>
              </div>
              <div>
                <span className="font-extrabold text-white text-sm">
                  Reseller.vaivaizone.com
                </span>
                <p className="text-[11px] text-slate-500">
                  Enterprise Top-Up &amp; Digital Services Infrastructure
                </p>
              </div>
            </div>

            {/* Security Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>৳2,000 Locked Security Deposit Protected</span>
              </span>

              <span className="flex items-center gap-1.5 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>KYC Verification Protocol</span>
              </span>

              <span className="flex items-center gap-1.5 text-slate-400">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>ACID Atomic Balance Deduction</span>
              </span>
            </div>

            <div className="text-center md:text-right text-[11px] text-slate-500">
              <p>&copy; {new Date().getFullYear()} VaiVaiZone Network Ltd. All rights reserved.</p>
              <p className="text-[10px] text-slate-600 mt-0.5">
                Subdomain: Reseller.vaivaizone.com | Dhaka, Bangladesh
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
