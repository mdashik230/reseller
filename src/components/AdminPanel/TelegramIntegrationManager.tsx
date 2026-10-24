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
  Settings,
  Activity,
  Sparkles,
  Zap,
  Radio
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
  const [message, setMessage] = useState<string | null>(null);

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

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await persistentStore.saveTelegramConfig(config);
      soundEffects.playSuccessChime();
      setMessage('Telegram Bot configuration saved successfully!');
      setTimeout(() => setMessage(null), 4000);
    } catch {
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/telegram/test', {
        method: 'POST',
      });
      if (res.ok) {
        soundEffects.playSuccessChime();
        setMessage('Test alert broadcasted to Telegram!');
        await fetchConfigAndLogs();
      }
    } catch {
      setMessage('Failed to send test alert.');
    } finally {
      setTesting(false);
    }
  };

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
              <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                <Radio className="w-3 h-3 animate-pulse text-cyan-400" />
                Live Broadcast Active
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Instant alerts sent to owner&apos;s Telegram for Registrations, KYC uploads, New Orders, and Deposits.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={testing}
          onClick={handleSendTest}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{testing ? 'Sending Ping...' : 'Send Live Test Ping'}</span>
        </button>
      </div>

      {message && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Configuration Form */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <h5 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-cyan-400" />
            <span>Webhook Credentials &amp; Triggers</span>
          </h5>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Telegram Bot Token (from @BotFather)
              </label>
              <input
                type="text"
                placeholder="123456789:AAHxxxxx_xxxxxxxxxxxxxxx"
                value={config.botToken}
                onChange={e => setConfig({ ...config, botToken: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                Leave empty to run in simulated mode, or enter your token for real Telegram delivery.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Chat ID or Channel ID
              </label>
              <input
                type="text"
                placeholder="e.g. 987654321 or -100123456789"
                value={config.chatId}
                onChange={e => setConfig({ ...config, chatId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Automated Notification Triggers
              </span>

              {[
                { key: 'alertOnOrder', label: '🚨 New Incoming Orders (Includes customer & item details)' },
                { key: 'alertOnKyc', label: '📄 KYC Documents Submitted & Verification Review' },
                { key: 'alertOnDeposit', label: '💰 Wallet Deposits & Security Balance Credits' },
                { key: 'alertOnRegistration', label: '🆕 New Reseller Account Registrations' },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
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
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-98"
              >
                {saving ? 'Saving...' : 'Save Telegram Webhook Settings'}
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
                <span>Live Broadcast Log Stream</span>
              </h5>
              <span className="text-[11px] text-slate-400 font-mono">
                {logs.length} Events Logged
              </span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {logs.map(log => (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono text-cyan-400 font-bold uppercase">
                      [{log.event}]
                    </span>
                    <span>{formatDate(log.timestamp)}</span>
                  </div>
                  <div
                    className="text-slate-200 text-xs font-mono whitespace-pre-line leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: log.message }}
                  />
                  <div className="text-[10px] text-slate-500 pt-1 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${log.simulated ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
                    <span>{log.simulated ? 'Delivered via In-App Bot Stream (Simulated)' : 'Sent via Official Telegram Bot API'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center">
            VaiVaiZone Bot Gateway handles automatic rate limiting and retry dispatching.
          </div>
        </div>
      </div>
    </div>
  );
};
