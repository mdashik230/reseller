export function formatBDT(amount: number): string {
  if (isNaN(amount)) return '৳0';
  return `৳${amount.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(isoString: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export function getKycBadge(status: string) {
  switch (status) {
    case 'verified':
      return {
        label: 'Verified Reseller',
        icon: '✅',
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        cardBg: 'from-emerald-950/40 to-slate-900 border-emerald-500/30',
      };
    case 'pending':
      return {
        label: 'Pending Verification',
        icon: '⏳',
        badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        cardBg: 'from-amber-950/40 to-slate-900 border-amber-500/30',
      };
    case 'rejected':
      return {
        label: 'KYC Rejected',
        icon: '❌',
        badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        cardBg: 'from-rose-950/40 to-slate-900 border-rose-500/30',
      };
    default:
      return {
        label: 'KYC Required',
        icon: '⚠️',
        badgeClass: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
        cardBg: 'from-slate-900 to-slate-950 border-slate-800',
      };
  }
}

export function getOrderStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return {
        label: 'Completed',
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-400',
      };
    case 'processing':
      return {
        label: 'Processing',
        badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        dot: 'bg-blue-400 animate-pulse',
      };
    case 'cancelled':
      return {
        label: 'Cancelled (Refunded)',
        badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        dot: 'bg-rose-400',
      };
    case 'pending':
    default:
      return {
        label: 'Pending Dispatch',
        badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-400 animate-ping',
      };
  }
}
