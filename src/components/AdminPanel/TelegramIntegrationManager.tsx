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
  Info,
  Search,
  CheckCheck
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
  const [verifyingToken, setVerifyingToken] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedBotInfo, setVerifiedBotInfo] = useState<{ name: string; username: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const fetchConfigAndLogs = async () => {
    try {
      const cfg = await persistentStore.getTelegramConfig();
      setConfig(cfg);
      const resLogs = await fetch('/api/admin/telegram/logs');
      if (resLogs.ok) {
        const text = await resLogs.text();
        if (text) {
          const data = JSON.parse(text);
          if (data && data.logs) setLogs(data.logs);
        }
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchConfigAndLogs();
  }, []);

  const handleVerifyToken = async () => {
    const cleanToken = config.botToken.trim().replace(/^bot/i, '');
    if (!cleanToken) {
      setErrorMessage('প্রথমে Telegram Bot Token টি পেস্ট করুন!');
      return;
    }
    setVerifyingToken(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setVerifiedBotInfo(null);

    try {
      const res = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
      const data = await res.json();
      if (data.ok) {
        soundEffects.playSuccessChime();
        setVerifiedBotInfo({
          name: data.result?.first_name || 'Bot',
          username: data.result?.username || '',
        });
        setSuccessMessage(`✅ টোকেন ১০০% সঠিক! বট নাম: "${data.result?.first_name}" (@${data.result?.username})`);
      } else {
        soundEffects.playWarningChime();
        if (data.error_code === 401) {
          setErrorMessage('❌ টোকেন ভুল (401 Unauthorized)! আপনার দেওয়া Bot Token টি কাজ করছে না। অনুগ্রহ করে টেলিগ্রাম @BotFather থেকে সম্পূর্ণ টোকেনটি নতুন করে কপি করে বসান।');
        } else {
          setErrorMessage(`❌ Telegram Error: ${data.description || 'Token Invalid'}`);
        }
      }
    } catch (err: any) {
      soundEffects.playWarningChime();
      setErrorMessage(`টেলিগ্রাম এপিআই যাচাই করতে সমস্যা: ${err.message}`);
    } finally {
      setVerifyingToken(false);
    }
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

    const cleanToken = config.botToken.trim().replace(/^bot/i, '');
    const cleanChat = config.chatId.trim();

    if (!cleanToken || !cleanChat) {
      setErrorMessage('Bot Token এবং Chat ID উভয়ই বক্সে লিখে "Save Telegram Webhook Settings" করুন!');
      setTesting(false);
      return;
    }

    try {
      // Step 1: Verify token with official Telegram getMe endpoint directly
      const getMeRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
      const getMeData = await getMeRes.json();
      if (!getMeData.ok) {
        soundEffects.playWarningChime();
        if (getMeData.error_code === 401) {
          setErrorMessage('❌ আপনার দেওয়া Bot Token টি ভুল বা ইনভ্যালিড (401 Unauthorized)! অনুগ্রহ করে @BotFather চ্যাট থেকে সম্পূর্ণ ও সঠিক Token কপি করে পেস্ট করুন।');
        } else {
          setErrorMessage(`❌ Telegram API Error: ${getMeData.description || 'Invalid Bot Token'}`);
        }
        setTesting(false);
        return;
      }

      const botUsername = getMeData.result?.username || 'VaiVaiZone_Bot';
      setVerifiedBotInfo({
        name: getMeData.result?.first_name || 'Bot',
        username: botUsername,
      });

      // Step 2: Send test ping directly to target Telegram chat / group
      const testMsg = `<b>🔔 LIVE TEST PING from Reseller.vaivaizone.com</b>\n\n🤖 <b>Bot Name:</b> @${botUsername}\n💬 <b>Target Chat ID:</b> <code>${cleanChat}</code>\n✅ Telegram Webhook Connection Live & Verified!\n🕒 Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })} (BST)`;

      const sendRes = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cleanChat,
          text: testMsg,
          parse_mode: 'HTML',
        }),
      });

      const sendData = await sendRes.json();
      if (sendData.ok) {
        soundEffects.playSuccessChime();
        setSuccessMessage(`✅ সফল হয়েছে! @${botUsername} বট থেকে আপনার চ্যাট/গ্রুপে টেস্ট নোটিফিকেশন পৌঁছে গেছে! আপনার টেলিগ্রাম চেক করুন।`);

        // Add local log entry
        const newLog: TelegramLog = {
          id: `tg-client-${Date.now()}`,
          event: 'test',
          message: testMsg,
          timestamp: new Date().toISOString(),
          success: true,
          simulated: false,
        };
        setLogs(prev => [newLog, ...prev]);
      } else {
        soundEffects.playWarningChime();
        if (sendData.description?.includes('chat not found')) {
          setErrorMessage(`⚠️ চ্যাট পাওয়া যায়নি (Chat not found)! আপনি যে গ্রুপে (${cleanChat}) মেসেজ পেতে চান, টেলিগ্রামে গিয়ে সেই গ্রুপে @${botUsername} বটটিকে Add করতে হবে। আর যদি আপনার পার্সোনাল আইডিতে নোটিশ চান, তবে টেলিগ্রামে @${botUsername} এ গিয়ে নিচে /start চাপুন।`);
        } else if (sendData.description?.includes('bot is not a member')) {
          setErrorMessage(`⚠️ বটটি আপনার গ্রুপে মেম্বার নেই! টেলিগ্রামে আপনার ঐ গ্রুপে গিয়ে @${botUsername} বটটিকে যোগ করুন এবং মেসেজ দেওয়ার অনুমতি দিন।`);
        } else if (sendData.description?.includes('bot was blocked')) {
          setErrorMessage(`⚠️ বটটি টেলিগ্রামে ব্লক করা আছে! দয়া করে @${botUsername} আনব্লক করে নিচে /start চাপুন।`);
        } else {
          setErrorMessage(`⚠️ Telegram Error: ${sendData.description}`);
        }
      }

      // Also notify backend gracefully
      fetch('/api/admin/telegram/test', { method: 'POST' }).catch(() => {});
    } catch (err: any) {
      soundEffects.playWarningChime();
      setErrorMessage(`টেলিগ্রামে মেসেজ পাঠাতে সমস্যা: ${err.message}`);
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
                {isConfigured ? 'Live Telegram Configured' : 'Setup Required'}
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
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{testing ? 'Sending Ping...' : 'Send Live Test Ping'}</span>
          </button>
        </div>
      </div>

      {/* Success / Error Messages */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in leading-relaxed shadow-lg">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
          <div className="font-semibold">{successMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in leading-relaxed shadow-lg">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="font-semibold">{errorMessage}</div>
        </div>
      )}

      {/* Expandable Setup Guide */}
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
                টেলিগ্রামে <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline font-semibold">@BotFather</a> এ যান। এরপর <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-300 font-mono">/newbot</code> লিখে পাঠিয়ে আপনার বটের নাম ও ইউজারনেম দিন।
              </p>
              <p className="text-[11px] text-slate-300">
                BotFather আপনাকে একটি <strong>HTTP API Token</strong> দেবে। সেটি কপি করে নিচে <strong>Telegram Bot Token</strong> ঘরে বসিয়ে পাশে <strong>&ldquo;যাচাই করুন&rdquo;</strong> বাটনে চাপ দিন।
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
                সেখান থেকে প্রাপ্ত <strong>Id</strong> নম্বরটি কপি করে নিচে <strong>Admin Chat ID</strong> ঘরে বসান।
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2 md:col-span-2 text-amber-200">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                ৩. সবচেয়ে গুরুত্বপূর্ণ ধাপ (Bot Start করা বা গ্রুপে Add করা):
              </span>
              <p className="text-[11px] leading-relaxed text-slate-300">
                • <strong>পার্সোনাল আইডিতে নোটিশ চাইলে:</strong> টেলিগ্রামে আপনার তৈরি করা বটের লিংকে গিয়ে অবশ্যই নিচে <strong>/start</strong> বাটনে চাপ দিন।<br />
                • <strong>গ্রুপ বা চ্যানেলে (-100...) নোটিশ চাইলে:</strong> আপনার বটটিকে অবশ্যই ঐ গ্রুপে <strong>Member বা Admin হিসেবে Add করতে হবে</strong>, না হলে টেলিগ্রাম মেসেজ ডেলিভারি ব্লক করে দেবে।
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
            {verifiedBotInfo && (
              <span className="text-[11px] text-emerald-400 font-mono font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                <CheckCheck className="w-3.5 h-3.5" />
                @{verifiedBotInfo.username}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Telegram Bot Token (from @BotFather) *
                </label>
                <button
                  type="button"
                  disabled={verifyingToken || !config.botToken.trim()}
                  onClick={handleVerifyToken}
                  className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                  title="টোকেনটি সঠিক কিনা সরাসরি টেলিগ্রামের সাথে চেক করুন"
                >
                  <Search className={`w-3 h-3 ${verifyingToken ? 'animate-spin' : ''}`} />
                  <span>{verifyingToken ? 'যাচাই হচ্ছে...' : 'টোকেন যাচাই করুন (Verify)'}</span>
                </button>
              </div>

              <input
                type="text"
                placeholder="যেমন: 7123456789:AAHxxxxx_xxxxxxxxxxxxxxx"
                value={config.botToken}
                onChange={e => {
                  setConfig({ ...config, botToken: e.target.value });
                  setVerifiedBotInfo(null);
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                BotFather যে Token দিয়েছে তা হুবহু পেস্ট করুন।
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Chat ID or Group/Channel ID *
              </label>
              <input
                type="text"
                placeholder="যেমন: 987654321 অথবা গ্রুপের জন্য -1003834732727"
                value={config.chatId}
                onChange={e => setConfig({ ...config, chatId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                গ্রুপ/চ্যানেল আইডি হলে বটটিকে অবশ্যই ঐ গ্রুপে অ্যাড করে মেসেজ দেওয়ার পারমিশন দিন।
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
                <div className="py-12 text-center text-xs text-slate-500">
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
                            ? 'ইন-অ্যাপ লগ (সরাসরি বট ছাড়া)'
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
            <span className="text-cyan-400 font-mono text-[10px]">Direct CORS Webhook</span>
          </div>
        </div>
      </div>
    </div>
  );
};
