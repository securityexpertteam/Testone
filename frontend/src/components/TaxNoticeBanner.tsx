import React from 'react';
import { ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

interface TaxNoticeBannerProps {
  onOpenDonate: () => void;
  onOpenTaxPortal: () => void;
}

export const TaxNoticeBanner: React.FC<TaxNoticeBannerProps> = ({
  onOpenDonate,
  onOpenTaxPortal
}) => {
  return (
    <div className="bg-amber-950 text-amber-100 text-xs sm:text-sm border-b border-amber-800/60 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-center md:text-left">
          <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider shrink-0 border border-amber-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Tax Rule Clarification
          </span>
          <p className="text-amber-100/90 leading-tight">
            <strong className="text-white font-medium">Shop Goods:</strong> No 80G tax exemption on item purchases (100% net profit directly funds village clinics & schools).
            <span className="mx-1.5 opacity-60">|</span>
            <strong className="text-emerald-300 font-medium">Direct Donations:</strong> 100% eligible for Section 80G Tax Exemption Certificate.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenTaxPortal}
            className="inline-flex items-center gap-1 text-amber-300 hover:text-white underline text-xs transition font-medium cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Verify 80G Rules
          </button>
          <button
            onClick={onOpenDonate}
            className="inline-flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs px-2.5 py-1 rounded transition shadow-sm cursor-pointer"
          >
            Claim 80G Deduction
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
