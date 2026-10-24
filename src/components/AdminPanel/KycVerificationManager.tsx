import React, { useState, useEffect } from 'react';
import { formatDate, getKycBadge } from '../../utils/formatters';
import { soundEffects } from '../../utils/audio';
import { persistentStore, onStoreUpdate } from '../../utils/persistentStore';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  FileImage,
  AlertTriangle,
  ExternalLink,
  X,
  Smartphone,
  Mail,
  UserCheck
} from 'lucide-react';

interface KycItem {
  userId: string;
  name: string;
  email: string;
  phone: string;
  tier: string;
  kyc: {
    status: string;
    phone: string;
    gmail: string;
    imoId: string;
    screenshotUrl: string;
    submittedAt?: string;
    reviewedAt?: string;
    rejectionReason?: string;
  };
  wallet: {
    totalBalance: number;
    lockedSecurityDeposit: number;
    usableBalance: number;
  };
}

export const KycVerificationManager: React.FC = () => {
  const [kycList, setKycList] = useState<KycItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Reject dialog
  const [rejectingUser, setRejectingUser] = useState<KycItem | null>(null);
  const [rejectReason, setRejectReason] = useState('Screenshot does not clearly show IMO ID number. Please re-upload uncropped screenshot.');

  const fetchKycList = async () => {
    setLoading(true);
    try {
      const list = await persistentStore.getKycList();
      setKycList(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycList();
    const unsubscribe = onStoreUpdate(e => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail || customEvent.detail.type === 'kyc') {
        fetchKycList();
      }
    });
    return unsubscribe;
  }, []);

  const handleReview = async (userId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      await persistentStore.reviewKyc(userId, action, reason);
      soundEffects.playSuccessChime();
      await fetchKycList();
      setRejectingUser(null);
    } catch {
      soundEffects.playWarningChime();
    }
  };

  const pendingSubmissions = kycList.filter(k => k.kyc.status === 'pending');
  const otherSubmissions = kycList.filter(k => k.kyc.status !== 'pending');

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>KYC Document Verification Manager</span>
          </h4>
          <p className="text-xs text-slate-400">
            Review uploaded IMO profile screenshots, phone numbers, and official Gmail credentials
          </p>
        </div>
        <button
          onClick={fetchKycList}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
        >
          Refresh Submissions
        </button>
      </div>

      {/* 1. Pending Queue (Priority) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Pending Admin Review ({pendingSubmissions.length})
          </h5>
        </div>

        {pendingSubmissions.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-xs text-slate-500">
            No pending KYC submissions in queue. All documents verified!
          </div>
        ) : (
          pendingSubmissions.map(item => (
            <div
              key={item.userId}
              className="p-5 rounded-3xl bg-slate-900 border border-amber-500/30 shadow-xl"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                
                {/* Screenshot thumbnail */}
                <div className="flex items-start gap-4">
                  <div
                    onClick={() => item.kyc.screenshotUrl?.trim() ? setPreviewImage(item.kyc.screenshotUrl) : null}
                    className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-500/40 cursor-pointer group shadow-md shrink-0 bg-slate-800"
                  >
                    {item.kyc.screenshotUrl && item.kyc.screenshotUrl.trim() !== '' ? (
                      <img
                        src={item.kyc.screenshotUrl}
                        alt="IMO Screenshot"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <FileImage className="w-8 h-8 text-slate-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h6 className="text-base font-extrabold text-white">
                        {item.name}
                      </h6>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                        Pending Verification
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 mt-2 text-xs text-slate-300">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">IMO ID / Number</span>
                        <strong className="font-mono text-cyan-400">{item.kyc.imoId}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Valid Gmail</span>
                        <strong className="text-slate-200">{item.kyc.gmail}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Contact Phone</span>
                        <strong className="text-slate-200">{item.kyc.phone}</strong>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2">
                      Submitted on {formatDate(item.kyc.submittedAt || '')}
                    </p>
                  </div>
                </div>

                {/* 1-Click Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => setPreviewImage(item.kyc.screenshotUrl)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="View Full Resolution Screenshot"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setRejectingUser(item)}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => handleReview(item.userId, 'approve')}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve &amp; Verify</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 2. Processed History */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Verification History &amp; Records ({otherSubmissions.length})
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {otherSubmissions.map(item => {
            const isVerified = item.kyc.status === 'verified';
            return (
              <div
                key={item.userId}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => item.kyc.screenshotUrl?.trim() ? setPreviewImage(item.kyc.screenshotUrl) : null}
                    className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 cursor-pointer shrink-0 border border-slate-700 flex items-center justify-center"
                  >
                    {item.kyc.screenshotUrl && item.kyc.screenshotUrl.trim() !== '' ? (
                      <img
                        src={item.kyc.screenshotUrl}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileImage className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{item.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                        isVerified
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {isVerified ? '✅ Verified' : '❌ Rejected'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      IMO: <span className="font-mono text-cyan-400">{item.kyc.imoId}</span> • {item.kyc.gmail}
                    </div>
                    {item.kyc.rejectionReason && (
                      <div className="text-[10px] text-rose-400 italic mt-0.5">
                        Reason: {item.kyc.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => {
                      if (isVerified) {
                        handleReview(item.userId, 'reject', 'Revoked verification status.');
                      } else {
                        handleReview(item.userId, 'approve');
                      }
                    }}
                    className="text-[11px] text-slate-400 hover:text-white underline"
                  >
                    {isVerified ? 'Revoke' : 'Re-Approve'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* High-Resolution Screenshot Inspector Modal */}
      {previewImage && previewImage.trim() !== '' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl p-4 overflow-hidden flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-sm font-bold text-white mb-2 self-start">
              IMO Profile Screenshot Inspection
            </h4>
            <div className="max-h-[75vh] overflow-auto rounded-xl">
              <img
                src={previewImage}
                alt="Full Proof"
                className="max-w-full max-h-[70vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Dialog */}
      {rejectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500/40 p-6 text-white shadow-2xl">
            <h4 className="text-base font-bold text-rose-400 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              <span>Reject KYC Submission</span>
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Please enter the specific reason so <strong>{rejectingUser.name}</strong> can fix and resubmit.
            </p>

            <div className="my-4">
              <label className="block text-xs text-slate-400 mb-1">
                Rejection Note
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReview(rejectingUser.userId, 'reject', rejectReason)}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
