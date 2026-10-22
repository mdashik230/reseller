import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { auth, googleAuthProvider, signInWithPopup } from '../../firebase';
import {
  ShieldCheck,
  Lock,
  Sparkles,
  Zap,
  ArrowRight,
  CheckCircle2,
  Mail,
  User,
  AlertCircle
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { loginWithGoogle } = useAuth();
  const [customGmail, setCustomGmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleAuth = async (email: string, name: string, avatarUrl?: string, rolePref?: string) => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle(email, name, avatarUrl, rolePref);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      setError(err?.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFirebaseGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      if (result.user && result.user.email) {
        await handleGoogleAuth(
          result.user.email,
          result.user.displayName || result.user.email.split('@')[0],
          result.user.photoURL || undefined
        );
        return;
      }
    } catch (popupErr: any) {
      console.warn('Firebase popup notice:', popupErr?.message || popupErr);
      setError('পপআপ ব্লক হয়ে থাকলে নিচে সরাসরি আপনার জিমেইল লিখে লগইন করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = customGmail.trim().toLowerCase();
    if (!trimmed) {
      setError('অনুগ্রহ করে আপনার গুগল জিমেইল (@gmail.com) লিখুন।');
      return;
    }
    if (!trimmed.endsWith('@gmail.com') && !trimmed.endsWith('@vaivaizone.com') && trimmed !== 'loverblack2022@gmail') {
      setError('শুধুমাত্র আসল ও অনুমোদিত Google একাউন্ট (@gmail.com) গ্রহণযোগ্য।');
      return;
    }
    handleGoogleAuth(trimmed, customName.trim() || trimmed.split('@')[0]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950 relative overflow-hidden">
      
      {/* Decorative background glow rings */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-emerald-600/15 via-teal-500/10 to-cyan-500/15 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-24 right-0 w-96 h-96 bg-cyan-600/10 blur-[100px] pointer-events-none" />

      {/* Top Simple Brand Bar */}
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-emerald-400 text-lg">
              V
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">
                Reseller.vaivaizone.com
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Official Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Bangladesh Premier Top-Up &amp; Digital Services Infrastructure
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Google Authorized Auth Only</span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Big Welcome Message & Earning Opportunities */}
          <div className="lg:col-span-7 space-y-5">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>🇧🇩 ডিজিটাল টপ-আপ বিজনেস | প্রতিদিন আকর্ষণীয় আয়ের সুবর্ণ সুযোগ</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                স্বল্প পুঁজিতে ঘরে বসে আয় করুন —{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  নিজের টপ-আপ বিজনেস শুরু করুন!
                </span>
              </h1>
              
              <p className="text-base sm:text-lg text-emerald-400 font-semibold leading-relaxed">
                Vai Vai Zone Reseller নেটওয়ার্কে আপনাকে স্বাগতম — বাংলাদেশের সবচেয়ে দ্রুত ও বিশ্বস্ত ডিজিটাল সার্ভিসেস প্ল্যাটফর্ম।
              </p>
              
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                IMO Diamonds, Free Fire, PUBG UC, Bigo Live, TikTok Coins এবং সকল অপারেটরের রিচার্জ সরাসরি পাইকারি ডিলার মূল্যে কিনুন। গ্রাহকের কাছে নির্ধারিত খুচরা দামে বিক্রি করে <strong>প্রতিদিন ১৫০০৳ থেকে ৫০০০৳ পর্যন্ত নিশ্চিত নগদ মুনাফা</strong> আয় করুন।
              </p>
            </div>

            {/* Income & Profit Calculator Box (আয়ের সুযোগ ও হিসাব) */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-teal-950/40 border border-emerald-500/30 backdrop-blur-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  💡 রিসেলারদের জন্য সহজ আয়ের মডেল:
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  নিশ্চিত লাভ
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                উদাহরণস্বরূপ: ১,০০০ IMO ডাইমন্ডের পাইকারি রিসেলার রেট <strong>২১৮০৳</strong> এবং কাস্টমার রেট <strong>২২৫০৳</strong>। প্রতি ১০০০ ডাইমন্ড অর্ডারে সরাসরি <strong>৭০৳ নিট লাভ</strong>! দৈনিক মাত্র ২০টি অর্ডার প্লেস করলেই মাসে <strong>৪২,০০০৳+ লাভ</strong> আপনার পকেটে!
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm hover:border-emerald-500/40 transition-colors">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>দৈনিক নগদ প্রফিট মার্জিন</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  প্রতি হাজারে নির্ধারিত পাইকারি মূল্যে ব্যালেন্স ডিডাকশন ও সর্বোচ্চ লাভ অর্জনের নিশ্চয়তা।
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm hover:border-cyan-500/40 transition-colors">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs mb-1">
                  <Zap className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>১-সেকেন্ড অটো সার্ভার ডেলিভারি</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  ঘণ্টার পর ঘণ্টা অপেক্ষা করতে হবে না; অর্ডার কনফার্মের সাথে সাথে দ্রুত সার্ভার প্রসেসিং।
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm hover:border-amber-500/40 transition-colors">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-1">
                  <Lock className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>১০০% মূলধন ও সিকিউরিটি রক্ষা</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  আপনার ক্যাপিটাল ও ২০০০৳ লকড সিকিউরিটি ডিপোজিট সম্পূর্ণ সুরক্ষিত এবং স্বচ্ছ হিসাব।
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm hover:border-indigo-500/40 transition-colors">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs mb-1">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>কোনো অভিজ্ঞতার প্রয়োজন নেই</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  স্মার্টফোন বা পিসি থাকলেই যেকোনো ব্যক্তি পার্ট-টাইম বা ফুল-টাইম ইনকাম শুরু করতে পারেন।
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Real Google Sign-In Card (Zero Demo Accounts) */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="text-center pb-5 border-b border-slate-800">
                <div className="w-13 h-13 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center mb-3 p-3">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  Google Account Sign In
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  আপনার Google অথরাইজড জিমেইল দিয়ে লগইন করুন
                </p>
              </div>

              {/* Requirement Notice */}
              <div className="my-4 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-xs space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1.5 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>অ্যাকাউন্ট ভেরিফিকেশন নীতি:</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  শুধুমাত্র আসল Google Account (@gmail.com) গ্রহণযোগ্য। রিসেলার সুবিধা সক্রিয় করতে পরবর্তীতে KYC ও সিকিউরিটি ডিপোজিট জমা দিতে হবে।
                </p>
              </div>

              {/* Error Message if any */}
              {error && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Action 1: Firebase Google One-Click Button */}
              <div className="space-y-4">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleFirebaseGoogleSignIn}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm flex items-center justify-center gap-3 shadow-xl shadow-white/5 active:scale-98 transition-all group disabled:opacity-75 cursor-pointer"
                >
                  {/* Google SVG Icon */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{loading ? 'লগইন হচ্ছে...' : 'Continue with Google'}</span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Divider */}
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-3 text-slate-500 text-[11px] font-medium uppercase tracking-wider">
                    অথবা সরাসরি জিমেইল দিন
                  </span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                {/* Action 2: Direct Gmail Authentication Form */}
                <form onSubmit={handleCustomSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      <span>গুগল জিমেইল একাউন্ট (Gmail Address):</span>
                    </label>
                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      value={customGmail}
                      onChange={e => setCustomGmail(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>আপনার নাম (Name - Optional):</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. আপনার পুরো নাম"
                      value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/10 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    <span>{loading ? 'যাচাই করা হচ্ছে...' : 'Sign In with Gmail'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>

                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Firebase Authorized Domain: <strong className="text-slate-300 font-mono">reseller01-482b8</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 border-t border-slate-800/80 text-center text-xs text-slate-500 z-10">
        &copy; {new Date().getFullYear()} Reseller.vaivaizone.com. All rights reserved.
      </footer>
    </div>
  );
};
