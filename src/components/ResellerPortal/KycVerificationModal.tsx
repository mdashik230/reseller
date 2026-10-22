import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { soundEffects } from '../../utils/audio';
import {
  X,
  Upload,
  ShieldCheck,
  CheckCircle,
  FileImage,
  AlertCircle,
  Camera,
  Sparkles
} from 'lucide-react';

export const KycVerificationModal: React.FC = () => {
  const { currentUser, openKycModal, setOpenKycModal, refreshUser } = useAuth();

  const [phone, setPhone] = useState(currentUser?.kyc.phone || currentUser?.phone || '');
  const [gmail, setGmail] = useState(currentUser?.kyc.gmail || currentUser?.email || '');
  const [imoId, setImoId] = useState(currentUser?.kyc.imoId || '');
  const [screenshotUrl, setScreenshotUrl] = useState(currentUser?.kyc.screenshotUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!openKycModal || !currentUser) return null;

  const sampleScreenshots = [
    {
      label: 'IMO Profile #1 (Verified ID)',
      url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
    },
    {
      label: 'IMO Profile #2 (Official Badge)',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setError('Image file must be under 8MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setScreenshotUrl(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!phone.trim() || !gmail.trim() || !imoId.trim() || !screenshotUrl) {
      setError('Please provide your Phone, Valid Gmail, IMO ID, and upload an IMO Profile Screenshot.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          phone,
          gmail,
          imoId,
          screenshotUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit KYC verification');
      } else {
        soundEffects.playSuccessChime();
        setSuccessMsg(data.message || 'KYC submitted successfully!');
        await refreshUser();
        setTimeout(() => {
          setOpenKycModal(false);
        }, 1600);
      }
    } catch {
      setError('Network connection error while submitting KYC');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 text-white">
        
        {/* Close Button */}
        <button
          onClick={() => setOpenKycModal(false)}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white">
              Reseller KYC Verification
            </h3>
            <p className="text-xs text-slate-400">
              Submit required identity details to obtain the Verified Reseller Badge (✅)
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Reseller Phone Number *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+8801XXXXXXXXX"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Valid Gmail */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Valid Gmail Account *
              </label>
              <input
                type="email"
                value={gmail}
                onChange={e => setGmail(e.target.value)}
                placeholder="reseller@gmail.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* IMO ID Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              IMO ID Number / Username *
            </label>
            <input
              type="text"
              value={imoId}
              onChange={e => setImoId(e.target.value)}
              placeholder="e.g. 8801819283746 or @imouser_bangladesh"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Must match the exact profile shown in your uploaded screenshot.
            </p>
          </div>

          {/* IMO Profile Screenshot Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Upload IMO Profile Screenshot *
            </label>

            {screenshotUrl && screenshotUrl.trim() !== '' ? (
              <div className="relative rounded-2xl border border-slate-700 bg-slate-800/60 p-3 flex items-center gap-4">
                <img
                  src={screenshotUrl}
                  alt="IMO Profile Proof"
                  className="w-20 h-20 object-cover rounded-xl border border-slate-600 shadow"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Screenshot Loaded
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    Ready for Master Admin verification review
                  </p>
                  <button
                    type="button"
                    onClick={() => setScreenshotUrl('')}
                    className="text-[11px] text-rose-400 hover:text-rose-300 underline mt-1"
                  >
                    Remove &amp; Re-upload
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-4 text-center transition-colors">
                <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-300">
                  Drop your screenshot here, or browse image
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  PNG, JPG or WEBP (Max 8MB)
                </p>
                <label className="mt-3 inline-block px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold cursor-pointer border border-slate-600 text-emerald-400">
                  Select File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Quick Demo Sample Selector */}
            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Or pick a preset screenshot for instant testing:
              </span>
              {sampleScreenshots.map((item, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setScreenshotUrl(item.url)}
                  className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  Preset {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-98 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>{loading ? 'Submitting to Master Admin...' : 'Submit Documents for Verification'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
