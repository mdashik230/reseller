import React, { useState, useEffect } from 'react';
import { TelegramConfig, TelegramLog } from '../../types';
import { formatDate } from '../../utils/formatters';
import { soundEffects } from '../../utils/audio';
import { persistentStore } from '../../utils/persistentStore';
import {
  Send,
  Bot,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Settings,
  Activity,
  Sparkles,
  Zap,
  Radio,
  HelpCircle,
  ExternalLink,
  Check,
  Copy,
  RefreshCw,
  Info
} from 'lucide-react';

export const TelegramIntegrationManager: React.FC = () => {
  const [config, setConfig] = useState<TelegramConfig>({
    botToken: '',
    chatId: '',
    enabled: true,
    alertOnRegistration: true,
    alertOnKyc: true,
    alertOnOrder: true,
    alertOnDeposit: true,
  });
  const [logs, setLogs] = useState<TelegramLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const fetchConfigAndLogs = async () => {
    try {
      const cfg = await persistentStore.getTelegramConfig();
      setConfig(cfg);
      const resLogs = await fetch('/api/admin/telegram/logs');
      if (resLogs.ok) {
        const data = await resLogs.json();
        if (data.logs) setLogs(data.logs);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchConfigAndLogs();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const cleanToken = config.botToken.trim().replace(/^bot/i, '');
    const cleanChat = config.chatId.trim();

    const sanitized: TelegramConfig = {
      ...config,
      botToken: cleanToken,
      chatId: cleanChat,
    };

    try {
      await persistentStore.saveTelegramConfig(sanitized);
      setConfig(sanitized);
      soundEffects.playSuccessChime();
      setSuccessMessage('টেলিগ্রাম বট কনফিগারেশন সফলভাবে সেভ হয়েছে!');
      setTimeout(() => setSuccessMessage(null), 5000);
      await fetchConfigAndLogs();
    } catch {
      soundEffects.playWarningChime();
      setErrorMessage('সেটিংস সেভ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    setTesting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/telegram/test', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        soundEffects.playSuccessChime();
        setSuccessMessage(data.message || 'টেস্ট নোটিফিকেশন সফলভাবে টেলিগ্রামে পাঠানো হয়েছে! টেলিগ্রাম অ্যাপ চেক করুন।');
      } else {
        soundEffects.playWarningChime();
        setErrorMessage(data.error || 'টেলিগ্রামে টেস্ট নোটিশ পাঠানো যায়নি। Bot Token ও Chat ID ঠিক আছে কিনা যাচাই করুন।');
      }
      await fetchConfigAndLogs();
    } catch (err: any) {
      soundEffects.playWarningChime();
      setErrorMessage(`সার্ভারের সাথে যোগাযোগে সমস্যা: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConfigAndLogs();
    setRefreshing(false);
  };

  const isConfigured = Boolean(config.botToken.trim() && config.chatId.trim());

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-cyan-950/40 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl shrink-0 border border-blue-500/30">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-extrabold text-white">
                Telegram Bot Instant Webhook Engine
              </h4>
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                isConfigured
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                <Radio className={`w-3 h-3 ${isConfigured ? 'animate-pulse text-emerald-400' : 'text-amber-400'}`} />
                {isConfigured ? 'Live Telegram Connected' : 'Setup Required (Inactive)'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              অ্যাড-মানি ডিপোজিট, নতুন অর্ডার, KYC সাবমিশন ও রেজিস্ট্রেশনের লাইভ নোটিফিকেশন সরাসরি টেলিগ্রাম বটের মাধ্যমে আপনার মোবাইলে পৌঁছে দেওয়া হয়।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showGuide ? 'গাইড লুকান' : 'সেটআপ গাইড'}</span>
          </button>

          <button
            type="button"
            disabled={testing}
            onClick={handleSendTest}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{testing ? 'Sending Ping...' : 'Send Live Test Ping'}</span>
          </button>
        </div>
      </div>

      {/* Connection Notice Card */}
      {!isConfigured ? (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="font-bold text-amber-300 text-sm">
              টেলিগ্রাম বট এ নোটিশ না আসার কারণ:
            </h5>
            <p className="text-slate-300 text-xs leading-relaxed">
              বট টোকেন (Bot Token) এবং অ্যাডমিন চ্যাট আইডি (Chat ID) এখনো কনফিগার করা হয়নি। নিচে আপনার টেলিগ্রাম বটের তথ্য বসিয়ে <strong>&ldquo;Save Telegram Webhook Settings&rdquo;</strong> বাটনে চাপ দিন। এরপর <strong>&ldquo;Send Live Test Ping&rdquo;</strong> বাটনে চাপ দিলে সরাসরি আপনার টেলিগ্রামে নোটিশ চলে যাবে।
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>টেলিগ্রাম বট সফলভাবে যুক্ত আছে! নোটিশ পাঠানো সক্রিয়।</span>
          </div>
          <span className="text-[11px] font-mono text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700">
            Chat ID: <strong className="text-emerald-400">{config.chatId}</strong>
          </span>
        </div>
      )}

      {/* Success / Error Messages */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Step by Step Setup Guide (Expandable) */}
      {showGuide && (
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-cyan-500/30 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Info className="w-4 h-4" />
            <span>সহজে ৩ মিনিটে টেলিগ্রাম বট সেটআপ করার নিয়ম:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">১</span>
                টেলিগ্রাম বট তৈরি ও টোকেন গ্রহণ:
              </span>
              <p className="text-[11px] leading-relaxed text-slate-300">
                টেলিগ্রাম অ্যাপ খুলে <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline font-semibold">@BotFather</a> সার্চ করুন। এরপর <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-300 font-mono">/newbot</code> লিখে পাঠিয়ে আপনার বটের নাম ও ইউজারনেম দিন।
              </p>
              <p className="text-[11px] text-slate-300">
                BotFather আপনাকে একটি <strong>HTTP API Token</strong> দেবে (যেমন: <code className="text-emerald-400 font-mono">7123456789:AAH...</code>)। সেটি কপি করে নিচে <strong>Telegram Bot Token</strong> ঘরে বসান।
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">২</span>
                আপনার Chat ID সংগ্রহ করা:
              </span>
              <p className="text-[11px] leading-relaxed text-slate-300">
                টেলিগ্রামে <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline font-semibold">@userinfobot</a> অথবা <a href="https://t.me/GetMyChatID_Bot" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline font-semibold">@GetMyChatID_Bot</a> এ গিয়ে <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-300 font-mono">/start</code> চাপুন।
              </p>
              <p className="text-[11px] text-slate-300">
                সেখান থেকে প্রাপ্ত <strong>Id</strong> নম্বরটি (যেমন: <code className="text-emerald-400 font-mono">987654321</code>) কপি করে নিচে <strong>Admin Chat ID</strong> ঘরে বসান।
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2 md:col-span-2 text-amber-200">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                ৩. সবচেয়ে গুরুত্বপূর্ণ ধাপ (Bot Start করা):
              </span>
              <p className="text-[11px] leading-relaxed text-slate-300">
                আপনার তৈরি করা বটের লিংকে (যেমন: <code className="text-cyan-400 font-mono">t.me/your_bot_username</code>) ঢুকে <strong>অবশ্যই একবার /start বাটনে চাপ দিতে হবে</strong>। টেলিগ্রামের প্রাইভেসি পলিসি অনুযায়ী আপনি নিজে বট চালু না করলে কোনো বট আপনাকে মেসেজ পাঠাতে পারে না।
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Configuration Form */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h5 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>Webhook Credentials &amp; Triggers</span>
            </h5>
            <span className="text-[10px] text-slate-400 font-mono">
              Auto-Broadcast Engine
            </span>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Telegram Bot Token (from @BotFather) *
              </label>
              <input
                type="text"
                placeholder="যেমন: 7123456789:AAHxxxxx_xxxxxxxxxxxxxxx"
                value={config.botToken}
                onChange={e => setConfig({ ...config, botToken: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                BotFather যে টোকেন দিয়েছে তা হুবহু পেস্ট করুন।
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Chat ID or Channel ID *
              </label>
              <input
                type="text"
                placeholder="যেমন: 987654321 অথবা চ্যানেলের জন্য -100123456789"
                value={config.chatId}
                onChange={e => setConfig({ ...config, chatId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                @userinfobot থেকে প্রাপ্ত আপনার ব্যক্তিগত টেলিগ্রাম আইডি নম্বর।
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Automated Notification Triggers (স্বয়ংক্রিয় অ্যালার্টসমূহ)
              </span>

              {[
                { key: 'alertOnDeposit', label: '💰 Wallet Deposits & Security Balance (নতুন ডিপোজিট সাবমিশন)' },
                { key: 'alertOnOrder', label: '🚨 New Incoming Orders (নতুন টপ-আপ অর্ডার ও গ্রাহক আইডি)' },
                { key: 'alertOnKyc', label: '📄 KYC Documents Submitted (কেওয়াইসি সাবমিশন ও ভেরিফিকেশন)' },
                { key: 'alertOnRegistration', label: '🆕 New Reseller Account Registrations (নতুন রিসেলার রেজিস্ট্রেশন)' },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={(config as any)[item.key]}
                    onChange={e => setConfig({ ...config, [item.key]: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-extrabold text-xs shadow-md transition-all active:scale-98 disabled:opacity-60"
              >
                {saving ? 'সংরক্ষণ করা হচ্ছে...' : 'Save Telegram Webhook Settings (সেটিংস সংরক্ষণ করুন)'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Live Activity Log Stream */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <h5 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Live Broadcast Log Stream (সাম্প্রতিক টেলিগ্রাম লগ)</span>
              </h5>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                title="লগ রিফ্রেশ করুন"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  এখনো কোনো টেলিগ্রাম অ্যালার্ট রেকর্ড করা হয়নি।
                </div>
              ) : (
                logs.map(log => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-2xl border text-xs space-y-1 ${
                      log.success
                        ? 'bg-slate-800/60 border-slate-700/60'
                        : 'bg-rose-950/20 border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className={`font-mono font-bold uppercase ${
                        log.event === 'deposit'
                          ? 'text-amber-400'
                          : log.event === 'new_order'
                          ? 'text-cyan-400'
                          : log.event === 'kyc_submitted'
                          ? 'text-indigo-400'
                          : 'text-emerald-400'
                      }`}>
                        [{log.event}]
                      </span>
                      <span>{formatDate(log.timestamp)}</span>
                    </div>

                    <div
                      className="text-slate-200 text-xs font-mono whitespace-pre-line leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: log.message }}
                    />

                    <div className="text-[10px] pt-1 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          log.simulated
                            ? 'bg-amber-400'
                            : log.success
                            ? 'bg-emerald-400'
                            : 'bg-rose-400'
                        }`} />
                        <span className={log.simulated ? 'text-amber-300' : log.success ? 'text-emerald-400' : 'text-rose-400'}>
                          {log.simulated
                            ? 'ইন-অ্যাপ লগ (বট ক্রেডেনশিয়াল ছাড়া)'
                            : log.success
                            ? 'টেলিগ্রাম বটের মাধ্যমে সফলভাবে পাঠানো হয়েছে'
                            : 'টেলিগ্রাম ডেলিভারি ব্যর্থ'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>VaiVaiZone Official Bot Engine</span>
            <span className="text-cyan-400 font-mono text-[10px]">Real-time Dispatch</span>
          </div>
        </div>
      </div>
    </div>
  );
};
