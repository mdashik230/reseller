import React, { useState, useEffect } from 'react';
import { ServiceItem } from '../../types';
import { formatBDT } from '../../utils/formatters';
import { soundEffects } from '../../utils/audio';
import { persistentStore, onStoreUpdate } from '../../utils/persistentStore';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Tag,
  Save,
  HelpCircle,
  Zap,
  ArrowRight
} from 'lucide-react';

export const CategoryServiceManager: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingBatch, setSavingBatch] = useState(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string | null>(null);

  // Editable rates state for the master table
  const [rateEdits, setRateEdits] = useState<Record<string, {
    customerRate: number;
    resellerRate: number;
    unitName: string;
  }>>({});

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // Form states for Create/Edit Modal
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'imo' | 'bigo' | 'tiktok' | 'games' | 'recharge' | 'giftcards' | 'other'>('imo');
  const [icon, setIcon] = useState('💎');
  const [description, setDescription] = useState('');
  const [inputType, setInputType] = useState<'phone' | 'imo_id' | 'player_id' | 'email'>('imo_id');
  const [inputLabel, setInputLabel] = useState('IMO ID Number');
  const [inputPlaceholder, setInputPlaceholder] = useState('e.g. 8801712345678');
  const [unitName, setUnitName] = useState('Diamonds 💎');
  const [customerRatePer1000, setCustomerRatePer1000] = useState('2250');
  const [resellerRatePer1000, setResellerRatePer1000] = useState('2180');
  const [minQuantity, setMinQuantity] = useState('50');

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await persistentStore.getServices();
      setServices(data);
      const initialEdits: Record<string, { customerRate: number; resellerRate: number; unitName: string }> = {};
      data.forEach((s: ServiceItem) => {
        initialEdits[s.id] = {
          customerRate: s.customerRatePer1000 || 2250,
          resellerRate: s.resellerRatePer1000 || 2180,
          unitName: s.unitName || 'Diamonds 💎',
        };
      });
      setRateEdits(initialEdits);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    const unsubscribe = onStoreUpdate(e => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail || customEvent.detail.type === 'services') {
        fetchServices();
      }
    });
    return unsubscribe;
  }, []);

  const handleRateChange = (serviceId: string, field: 'customerRate' | 'resellerRate' | 'unitName', value: any) => {
    setRateEdits(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [field]: field === 'unitName' ? value : parseFloat(value) || 0,
      },
    }));
  };

  const handleSaveAllRates = async () => {
    setSavingBatch(true);
    setBatchSuccessMsg(null);

    const ratesPayload = Object.entries(rateEdits).map(([id, val]) => ({
      id,
      customerRatePer1000: val.customerRate,
      resellerRatePer1000: val.resellerRate,
      unitName: val.unitName,
    }));

    try {
      await persistentStore.updateRatesBatch(ratesPayload);
      soundEffects.playSuccessChime();
      setBatchSuccessMsg('সকল ক্যাটাগরির ১০০০-ইউনিটের রেট সফলভাবে সেভ হয়েছে! সমস্ত ভেরিফাইড রিসেলারদের একাউন্টে এই নতুন রেট সাথে সাথে কার্যকর হয়ে গেছে।');
      await fetchServices();
      setTimeout(() => setBatchSuccessMsg(null), 6000);
    } catch {
      soundEffects.playWarningChime();
    } finally {
      setSavingBatch(false);
    }
  };

  const openCreateModal = () => {
    setEditingService(null);
    setName('');
    setCategory('imo');
    setIcon('💎');
    setDescription('Instant diamond top-up');
    setInputType('imo_id');
    setInputLabel('IMO ID Number');
    setInputPlaceholder('e.g. 8801712345678');
    setUnitName('Diamonds 💎');
    setCustomerRatePer1000('2250');
    setResellerRatePer1000('2180');
    setMinQuantity('50');
    setModalMode('create');
  };

  const openEditModal = (srv: ServiceItem) => {
    setEditingService(srv);
    setName(srv.name);
    setCategory(srv.category);
    setIcon(srv.icon);
    setDescription(srv.description);
    setInputType(srv.inputType);
    setInputLabel(srv.inputLabel);
    setInputPlaceholder(srv.inputPlaceholder);
    setUnitName(srv.unitName || 'Diamonds 💎');
    setCustomerRatePer1000(srv.customerRatePer1000?.toString() || '2250');
    setResellerRatePer1000(srv.resellerRatePer1000?.toString() || '2180');
    setMinQuantity(srv.minQuantity?.toString() || '50');
    setModalMode('edit');
  };

  const handleToggleHide = async (srv: ServiceItem) => {
    try {
      const updated = services.map(s => s.id === srv.id ? { ...s, hidden: !s.hidden } : s);
      await persistentStore.saveServices(updated);
      soundEffects.playSuccessChime();
      await fetchServices();

      fetch(`/api/admin/services/${srv.id}/visibility`, { method: 'PATCH' }).catch(() => {});
    } catch {
      soundEffects.playWarningChime();
    }
  };

  const handleDelete = async (srv: ServiceItem) => {
    if (!window.confirm(`Are you sure you want to delete category "${srv.name}"?`)) return;

    try {
      const updated = services.filter(s => s.id !== srv.id);
      await persistentStore.saveServices(updated);
      soundEffects.playSuccessChime();
      await fetchServices();

      fetch(`/api/admin/services/${srv.id}`, { method: 'DELETE' }).catch(() => {});
    } catch {
      soundEffects.playWarningChime();
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: Partial<ServiceItem> = {
      name,
      category,
      icon,
      description,
      inputType,
      inputLabel,
      inputPlaceholder,
      unitName,
      customerRatePer1000: parseFloat(customerRatePer1000) || 2250,
      resellerRatePer1000: parseFloat(resellerRatePer1000) || 2180,
      minQuantity: parseInt(minQuantity) || 50,
    };

    try {
      if (modalMode === 'create') {
        const newSrv: ServiceItem = {
          id: `srv-${Date.now()}`,
          name: payload.name!,
          category: payload.category as any,
          icon: payload.icon || '💎',
          description: payload.description || '',
          inputType: payload.inputType as any,
          inputLabel: payload.inputLabel || 'Recipient ID',
          inputPlaceholder: payload.inputPlaceholder || '',
          unitName: payload.unitName || 'Units',
          customerRatePer1000: payload.customerRatePer1000 || 2250,
          resellerRatePer1000: payload.resellerRatePer1000 || 2180,
          minQuantity: payload.minQuantity || 50,
          hidden: false,
        };
        const updated = [...services, newSrv];
        await persistentStore.saveServices(updated);
        soundEffects.playSuccessChime();
        await fetchServices();
        setModalMode(null);

        fetch('/api/admin/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {});
      } else if (modalMode === 'edit' && editingService) {
        const updated = services.map(s => s.id === editingService.id ? { ...s, ...payload } : s);
        await persistentStore.saveServices(updated);
        soundEffects.playSuccessChime();
        await fetchServices();
        setModalMode(null);

        fetch(`/api/admin/services/${editingService.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {});
      }
    } catch {
      soundEffects.playWarningChime();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. MASTER RATE CONTROLLER TABLE (এক জায়গায় ইনপুট দিলে সব ভেরিফাইড রিসেলারের জন্য কার্যকর) */}
      <div className="rounded-3xl bg-slate-900 border border-emerald-500/30 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 blur-3xl pointer-events-none rounded-full" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Tag className="w-5 h-5" />
              </span>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                প্রতি ১,০০০ ইউনিটের রেট নির্ধারণ কন্ট্রোল (Master Pricing Controller)
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              এখানে যেকোনো ক্যাটাগরির ১০০০-এর রেট ইনপুট দিলে <strong>সকল ভেরিফাইড রিসেলারের জন্য একদামে</strong> ব্যালেন্স মাইনাস হবে।
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSaveAllRates}
              disabled={savingBatch}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingBatch ? 'আপডেট হচ্ছে...' : 'Save & Apply All Rates'}</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {batchSuccessMsg && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="font-semibold">{batchSuccessMsg}</p>
          </div>
        )}

        {/* Master Rates Quick Edit Table */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-3 px-3 font-semibold">ক্যাটাগরি</th>
                <th className="py-3 px-3 font-semibold">টপ-আপ ইউনিট</th>
                <th className="py-3 px-3 font-semibold">কাস্টমার প্রাইজ (প্রতি ১০০০)</th>
                <th className="py-3 px-3 font-semibold">রিসেলার প্রাইজ (প্রতি ১০০০) *</th>
                <th className="py-3 px-3 font-semibold text-center">রিসেলার লাভ</th>
                <th className="py-3 px-3 font-semibold text-right">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {services.map(srv => {
                const edit = rateEdits[srv.id] || {
                  customerRate: srv.customerRatePer1000 || 2250,
                  resellerRate: srv.resellerRatePer1000 || 2180,
                  unitName: srv.unitName || 'Diamonds 💎',
                };
                const profit = Math.max(0, edit.customerRate - edit.resellerRate);

                return (
                  <tr key={srv.id} className="hover:bg-slate-800/30 transition-colors">
                    
                    {/* Category Name */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{srv.icon}</span>
                        <div>
                          <div className="font-bold text-white text-xs">{srv.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono capitalize">{srv.category}</div>
                        </div>
                      </div>
                    </td>

                    {/* Unit Name Input (e.g. Diamonds 💎, Beans 🫘, Coins 🪙) */}
                    <td className="py-3.5 px-3">
                      <input
                        type="text"
                        value={edit.unitName}
                        onChange={e => handleRateChange(srv.id, 'unitName', e.target.value)}
                        placeholder="Diamonds 💎"
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-cyan-300 font-semibold w-28 focus:outline-none focus:border-cyan-500"
                      />
                    </td>

                    {/* Customer Price per 1000 */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-mono">৳</span>
                        <input
                          type="number"
                          step="1"
                          value={edit.customerRate}
                          onChange={e => handleRateChange(srv.id, 'customerRate', e.target.value)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono-numbers font-bold w-24 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">কাস্টমার ইনভয়েস রেট</span>
                    </td>

                    {/* Reseller Price per 1000 (Deducted from verified reseller wallet) */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-500 font-mono font-bold">৳</span>
                        <input
                          type="number"
                          step="1"
                          value={edit.resellerRate}
                          onChange={e => handleRateChange(srv.id, 'resellerRate', e.target.value)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-xs text-emerald-400 font-mono-numbers font-extrabold w-24 focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                      <span className="text-[10px] text-emerald-300/80 block mt-0.5">রিসেলার অ্যাকাউন্ট থেকে - হবে</span>
                    </td>

                    {/* Reseller Direct Profit */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-mono-numbers font-bold text-cyan-400 text-xs px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 inline-block">
                        +{formatBDT(profit)}
                      </span>
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        srv.hidden
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {srv.hidden ? 'Hidden' : 'Live'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* User Prompt Example Note */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
          <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p>
            <strong>প্রাইসিং নিয়ম:</strong> যেমন ১,০০০ IMO ডায়মন্ডের কাস্টমার প্রাইজ <strong>২২৫০/-</strong> ও রিসেলার প্রাইজ <strong>২১৮০/-</strong> সেট করলে, কোনো ভেরিফাইড রিসেলার ১০০০ ডায়মন্ড অর্ডার করলে তার ওয়ালেট থেকে ঠিক <strong>২১৮০/-</strong> টাকা মাইনাস হবে। ৫০০ অর্ডার করলে আনুপাতিক <strong>১০৯০/-</strong> মাইনাস হবে।
          </p>
        </div>
      </div>

      {/* 2. CATEGORY CRUD CARDS & ADD NEW BUTTON */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>সকল সার্ভিস ক্যাটাগরি তালিকা (Category Manager)</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            নতুন ক্যাটাগরি যোগ করুন, নাম ও আইকন এডিট করুন, অথবা রিসেলারদের থেকে সাময়িক হাইড/আনহাইড করুন
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন ক্যাটাগরি যোগ করুন</span>
        </button>
      </div>

      {/* Services List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(srv => {
          const isHidden = srv.hidden;
          return (
            <div
              key={srv.id}
              className={`p-5 rounded-3xl border flex flex-col justify-between transition-all ${
                isHidden
                  ? 'bg-slate-900/40 border-slate-800/80 opacity-70'
                  : 'bg-slate-900 border-slate-800 shadow-xl'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 rounded-2xl bg-slate-800/80 border border-slate-700">
                      {srv.icon}
                    </span>
                    <div>
                      <h5 className="text-base font-extrabold text-white">
                        {srv.name}
                      </h5>
                      <span className="text-[10px] text-cyan-400 uppercase font-mono font-bold">
                        {srv.unitName || 'Diamonds 💎'} • {srv.inputType}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isHidden
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {isHidden ? 'Hidden (হাইড)' : 'Active (লাইভ)'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                  {srv.description}
                </p>

                {/* Rate Card Preview Box */}
                <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-xs space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 pb-1.5 border-b border-slate-700/60">
                    <span>১,০০০ {srv.unitName?.split(' ')[0] || 'ইউনিট'} রেট</span>
                    <span className="text-cyan-400">{srv.unitName || 'Diamonds 💎'}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">কাস্টমার প্রাইজ:</span>
                    <span className="font-mono-numbers font-bold text-slate-200">
                      {formatBDT(srv.customerRatePer1000 || 2250)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-400 font-semibold">রিসেলার খরচ (মাইনাস):</span>
                    <span className="font-mono-numbers font-extrabold text-emerald-400">
                      {formatBDT(srv.resellerRatePer1000 || 2180)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-700/40">
                    <span className="text-cyan-300 font-semibold">রিসেলার প্রফিট মার্জিন:</span>
                    <span className="font-mono-numbers font-bold text-cyan-400">
                      +{formatBDT((srv.customerRatePer1000 || 2250) - (srv.resellerRatePer1000 || 2180))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Edit, Hide/Unhide, Delete */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800">
                <button
                  onClick={() => handleToggleHide(srv)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    isHidden
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title={isHidden ? 'Make visible to resellers' : 'Hide from resellers'}
                >
                  {isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{isHidden ? 'Unhide' : 'Hide'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(srv)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                    title="Edit Category & Pricing"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(srv)}
                    className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-colors"
                    title="Remove Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl my-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-white">
            
            <button
              onClick={() => setModalMode(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h4 className="text-base font-bold text-white mb-1">
              {modalMode === 'create' ? 'নতুন সার্ভিস ক্যাটাগরি যোগ করুন' : `ক্যাটাগরি এডিট: ${editingService?.name}`}
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              ক্যাটাগরির নাম, টপ-আপ ইউনিট ও প্রতি ১০০০ ইউনিটের কাস্টমার ও রিসেলার রেট নির্ধারণ করুন
            </p>

            <form onSubmit={handleSaveForm} className="space-y-4">
              
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমনঃ IMO Diamonds Top-Up বা Free Fire Diamonds"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Icon / Emoji</label>
                  <input
                    type="text"
                    value={icon}
                    onChange={e => setIcon(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-center text-lg"
                  />
                </div>
              </div>

              {/* Unit Name and Pricing per 1000 */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />
                  <span>প্রতি ১,০০০ ইউনিটের রেট নির্ধারণ (Customer & Reseller Rates)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">টপ-আপ ইউনিট নাম *</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমনঃ Diamonds 💎"
                      value={unitName}
                      onChange={e => setUnitName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-cyan-300 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">১০০০ কাস্টমার প্রাইজ (৳) *</label>
                    <input
                      type="number"
                      required
                      step="1"
                      placeholder="2250"
                      value={customerRatePer1000}
                      onChange={e => setCustomerRatePer1000(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-emerald-300 mb-1">১০০০ রিসেলার প্রাইজ (৳) *</label>
                    <input
                      type="number"
                      required
                      step="1"
                      placeholder="2180"
                      value={resellerRatePer1000}
                      onChange={e => setResellerRatePer1000(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/50 text-xs text-emerald-400 font-mono font-extrabold"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  💡 রিসেলার ১০০০ অর্ডার করলে তার একাউন্ট থেকে ৳{resellerRatePer1000} মাইনাস হবে এবং কাস্টমার ইনভয়েস হবে ৳{customerRatePer1000}।
                </p>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Short description for resellers"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Input Field Label</label>
                  <input
                    type="text"
                    value={inputLabel}
                    onChange={e => setInputLabel(e.target.value)}
                    placeholder="e.g. IMO ID / Number"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Input Placeholder</label>
                  <input
                    type="text"
                    value={inputPlaceholder}
                    onChange={e => setInputPlaceholder(e.target.value)}
                    placeholder="e.g. 8801712345678"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow"
                >
                  {modalMode === 'create' ? 'Create Category' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
