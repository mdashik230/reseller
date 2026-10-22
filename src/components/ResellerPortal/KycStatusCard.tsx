import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { getKycBadge, formatDate } from '../../utils/formatters';
import {
  ShieldCheck,
  Clock,
  XCircle,
  AlertCircle,
  FileText,
  Upload,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export const KycStatusCard: React.FC = () => {
  const { currentUser, setOpenKycModal } = useAuth();

  if (!currentUser) return null;

  const kyc = currentUser.kyc;
  const badge = getKycBadge(kyc.status);

  return (
    <div className={`relative overflow-hidden rounded-3xl p-5 border bg-gradient-to-r ${badge.cardBg} backdrop-blur-xl transition-all`}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Left Status Info */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 bg-white/5 border border-white/10">
            {badge.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-white">
                KYC Verification Status
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.badgeClass}`}>
                {badge.label}
              </span>
            </div>

            {kyc.status === 'verified' && (
              <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span><strong>Registered IMO ID:</strong> {kyc.imoId || 'N/A'}</span>
                <span><strong>Gmail:</strong> {kyc.gmail}</span>
                <span><strong>Verified on:</strong> {formatDate(kyc.reviewedAt || kyc.submittedAt || '')}</span>
              </div>
            )}

            {kyc.status === 'pending' && (
              <div className="text-xs text-amber-200/90 mt-1 space-y-0.5">
                <p>
                  Documents submitted on {formatDate(kyc.submittedAt || '')}. Under manual review by Master Admin.
                </p>
                <p className="text-[11px] text-amber-300/75">
                  IMO ID: <strong>{kyc.imoId}</strong> | Gmail: <strong>{kyc.gmail}</strong>
                </p>
              </div>
            )}

            {kyc.status === 'rejected' && (
              <div className="text-xs text-rose-300 mt-1 space-y-0.5">
                <p className="font-semibold text-rose-200">
                  Rejection Reason: {kyc.rejectionReason || 'Submitted details did not match official criteria.'}
                </p>
                <p className="text-[11px] text-rose-300/80">
                  Please review your IMO profile screenshot and re-submit.
                </p>
              </div>
            )}

            {kyc.status === 'not_submitted' && (
              <p className="text-xs text-slate-400 mt-1">
                To unlock maximum daily top-up limits and VIP tier benefits, complete your one-time IMO identity verification.
              </p>
            )}
          </div>
        </div>

        {/* Right CTA Button */}
        <div className="shrink-0 flex items-center gap-2">
          {kyc.status === 'verified' ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Full Tier Verified</span>
            </div>
          ) : (
            <button
              onClick={() => setOpenKycModal(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                kyc.status === 'rejected'
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                  : kyc.status === 'pending'
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{kyc.status === 'rejected' ? 'Resubmit Verification' : kyc.status === 'pending' ? 'Update Documents' : 'Submit KYC Details'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
