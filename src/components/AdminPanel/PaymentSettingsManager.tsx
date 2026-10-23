import React, { useState, useEffect } from 'react';
import { PaymentAccount, PaymentSettings } from '../../types';
import { soundEffects } from '../../utils/audio';
import {
  CreditCard,
  Smartphone,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Building,
  RefreshCw,
  Eye,
  Sliders,
  HelpCircle
} from 'lucide-react';

export const PaymentSettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<PaymentSettings>({
    accounts: [],
    notice: '',
    minDepositAmount: 100,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New account form modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('bKash');
  const [newNumber, setNewNumber] = useState('');
  const [newType, setNewType] = useState('Personal (Send Money)');
  const [newInstruction, setNewInstruction] = useState('টাকা পাঠিয়ে TrxID দিয়ে সাবমিট করুন');
  const [newMinDeposit, setNewMinDeposit] = useState('100');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payment-methods');
      if (res.ok) {
        const data = await res.json();
        if (data.paymentSettings) {
          setSettings(data.paymentSettings);
        }
      }
    } catch {
      setErrorMsg('পেমেন্ট সেটিংস লোড করা সম্ভব হয়নি');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleAccountChange = (id: string, field: keyof PaymentAccount, value: any) => {
    setSettings(prev => ({
      ...prev,
      accounts: prev.accounts.map(acc => {
        if (acc.id === id) {
          return { ...acc, [field]: value };
        }
        return acc;
      }),
    }));
  };

  const handleToggleAccount = (id: string) => {
    setSettings(prev => ({
      ...prev,
      accounts: prev.accounts.map(acc => {
        if (acc.id === id) {
          return { ...acc, enabled: !acc.enabled };
        }
        return acc;
      }),
    }));
  };

  const handleDeleteAccount = (id: string) => {
    if (confirm('আপনি কি নিশ্চিতভাবে এই পেমেন্ট নাম্বারটি মুছে ফেলতে চান?')) {
      setSettings(prev => ({
        ...prev,
        accounts: prev.accounts.filter(acc => acc.id !== id),
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/admin/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (res.ok) {
        soundEffects.playSuccessChime();
        setSuccessMsg(data.message || 'পেমেন্ট নাম্বার ও সেটিংস সফলভাবে সেভ হয়েছে!');
        if (data.paymentSettings) {
          setSettings(data.paymentSettings);
        }
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        throw new Error(data.error || 'সেভ করতে সমস্যা হয়েছে');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'সেটিংস সেভ করতে ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber.trim()) {
      alert('অনুগ্রহ করে পেমেন্ট নাম্বার লিখুন');
      return;
    }

    const newAcc: PaymentAccount = {
      id: `acc-${Date.now()}`,
      name: newName.trim(),
      number: newNumber.trim(),
      type: newType.trim(),
      instruction: newInstruction.trim(),
      enabled: true,
      minDeposit: parseFloat(newMinDeposit) || 100,
    };

    setSettings(prev => ({
      ...prev,
      accounts: [...prev.accounts, newAcc],
    }));

    setShowAddModal(false);
    setNewNumber('');
    setSuccessMsg('নতুন একাউন্ট যুক্ত হয়েছে! স্থায়ী করতে "সব পরিবর্তন সেভ করুন" বাটনে চাপুন।');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleTestCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getMethodBadgeStyle = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('bkash') || lower.includes('বিকাশ')) {
      return 'bg-pink-500/15 text-pink-400 border-pink-500/30';
    }
    if (lower.includes('nagad') || lower.includes('নগদ')) {
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    }
    if (lower.includes('rocket') || lower.includes('রকেট')) {
      return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    }
    if (lower.includes('upay') || lower.includes('উপায়')) {
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
    return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  পেমেন্ট নাম্বার ও ডিপোজিট সেটিংস
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LIVE CONTROLLER
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                রিসেলারদের ডিপোজিট গ্রহণ করার জন্য বিকাশ, নগদ, রকেট ও ব্যাংক একাউন্ট নাম্বার এখান থেকে পরিবর্তন করুন।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => setShowAddModal(true)}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>নতুন পেমেন্ট মেথড যোগ করুন</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/15 active:scale-98 transition-all disabled:opacity-70 cursor-pointer"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'সেভ হচ্ছে...' : 'সব পরিবর্তন সেভ করুন'}</span>
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {successMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* General Settings: Notice & Min Deposit */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2 mb-3">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>ডিপোজিট নোটিশ ও সর্বনিম্ন সীমা</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              রিসেলার ডিপোজিট নোটিশ ও নির্দেশনা (Reseller Notice Banner):
            </label>
            <textarea
              rows={2}
              value={settings.notice}
              onChange={e => setSettings(prev => ({ ...prev, notice: e.target.value }))}
              placeholder="টাকা পাঠানোর পর সঠিক TrxID দিয়ে সাবমিট করুন..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <p className="text-[11px] text-slate-500">
              এই বার্তাটি রিসেলাররা যখন ডিপোজিট মডালে প্রবেশ করবে তখন তাদের সামনে প্রদর্শিত হবে।
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              সর্বনিম্ন ডিপোজিট এমাউন্ট (৳):
            </label>
            <input
              type="number"
              value={settings.minDepositAmount}
              onChange={e => setSettings(prev => ({ ...prev, minDepositAmount: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
            />
            <p className="text-[11px] text-slate-500">
              রিসেলাররা এর চেয়ে কম এমাউন্ট সাবমিট করতে পারবে না।
            </p>
          </div>
        </div>
      </div>

      {/* Payment Accounts List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>সক্রিয় পেমেন্ট নাম্বার তালিকা ({settings.accounts.length}টি মেথড)</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            যেকোনো নাম্বারের ইনপুটে সরাসরি এডিট করে উপরের 'সেভ করুন' বাটনে চাপ দিন।
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs rounded-2xl bg-slate-900 border border-slate-800">
            পেমেন্ট নাম্বার লোড হচ্ছে...
          </div>
        ) : settings.accounts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs rounded-2xl bg-slate-900 border border-slate-800">
            কোনো পেমেন্ট মেথড কনফিগার করা নেই। উপরের 'নতুন পেমেন্ট মেথড যোগ করুন' বাটনে ক্লিক করুন।
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {settings.accounts.map((acc, index) => (
              <div
                key={acc.id || index}
                className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                  acc.enabled
                    ? 'bg-slate-900/95 border-slate-800 hover:border-slate-700 shadow-md'
                    : 'bg-slate-900/50 border-slate-850 opacity-60'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left: Identity & State Toggle */}
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase border tracking-wider ${getMethodBadgeStyle(acc.name)}`}>
                      {acc.name}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleAccount(acc.id)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        acc.enabled
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${acc.enabled ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                      <span>{acc.enabled ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Disabled)'}</span>
                    </button>
                  </div>

                  {/* Actions: Test copy & Delete */}
                  <div className="flex items-center gap-2 self-end lg:self-auto">
                    <button
                      type="button"
                      onClick={() => handleTestCopy(acc.id, acc.number)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
                      title="কপি টেস্ট করুন"
                    >
                      {copiedId === acc.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="text-[11px]">{copiedId === acc.id ? 'কপি হয়েছে' : 'কপি টেস্ট'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteAccount(acc.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 mt-4 pt-3 border-t border-slate-800/80">
                  
                  {/* Account Number / Details */}
                  <div className="lg:col-span-5 space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      পেমেন্ট নাম্বার / ব্যাংক একাউন্ট নম্বর:
                    </label>
                    <input
                      type="text"
                      value={acc.number}
                      onChange={e => handleAccountChange(acc.id, 'number', e.target.value)}
                      placeholder="e.g. 017XXXXXXXX"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  {/* Account Type */}
                  <div className="lg:col-span-3 space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      একাউন্ট টাইপ (Account Type):
                    </label>
                    <input
                      type="text"
                      value={acc.type}
                      onChange={e => handleAccountChange(acc.id, 'type', e.target.value)}
                      placeholder="Merchant / Personal / Agent"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  {/* Instructions */}
                  <div className="lg:col-span-4 space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      নির্দেশনা (Instruction for Reseller):
                    </label>
                    <input
                      type="text"
                      value={acc.instruction}
                      onChange={e => handleAccountChange(acc.id, 'instruction', e.target.value)}
                      placeholder="e.g. Payment অপশনে গিয়ে পাঠান"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Payment Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white shadow-2xl">
            <h4 className="text-base font-extrabold text-white mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>নতুন পেমেন্ট মেথড যোগ করুন</span>
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              বিকাশ, নগদ, রকেট বা ব্যাংক এর নতুন নাম্বার যুক্ত করুন
            </p>

            <form onSubmit={handleAddAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  মেথডের নাম (Method Name):
                </label>
                <select
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="bKash">bKash (বিকাশ)</option>
                  <option value="Nagad">Nagad (নগদ)</option>
                  <option value="Rocket">Rocket (রকেট)</option>
                  <option value="Upay">Upay (উপায়)</option>
                  <option value="Bank Transfer">Bank Transfer (ব্যাংক একাউন্ট)</option>
                  <option value="Cellfin">Cellfin (সেলফিন)</option>
                  <option value="Other">Other (অন্যান্য)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  পেমেন্ট নাম্বার / ব্যাংক একাউন্ট নম্বর:
                </label>
                <input
                  type="text"
                  placeholder="e.g. 017XXXXXXXX"
                  value={newNumber}
                  onChange={e => setNewNumber(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  একাউন্ট টাইপ:
                </label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Merchant (Payment)">Merchant (Payment)</option>
                  <option value="Personal (Send Money)">Personal (Send Money)</option>
                  <option value="Agent (Cash In)">Agent (Cash In)</option>
                  <option value="Bank Account">Bank Account</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  পেমেন্ট নির্দেশনা (Instruction):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Payment অপশনে গিয়ে পাঠান"
                  value={newInstruction}
                  onChange={e => setNewInstruction(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  মিনিমাম ডিপোজিট (৳):
                </label>
                <input
                  type="number"
                  value={newMinDeposit}
                  onChange={e => setNewMinDeposit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow cursor-pointer"
                >
                  যোগ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
