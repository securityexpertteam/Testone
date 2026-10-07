import React from 'react';
import { ArrowRight, CheckCircle2, Heart, Mail, MapPin, Phone, ShieldCheck, Store, X } from 'lucide-react';

interface SellerCollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const collaborationEmail = 'welfare@akshayapatrawelfare.org';
const collaborationPhone = '+919876543210';
const emailSubject = encodeURIComponent('Seller and artisan collaboration enquiry');
const emailBody = encodeURIComponent(
  'Namaste Akshaya Patra Welfare team,\n\nI would like to explore a seller / artisan collaboration.\n\nOrganisation or collective:\nContact person:\nLocation:\nProducts or craft:\nRegistration details (if applicable):\nPreferred contact method:\n'
);

export const SellerCollaborationModal: React.FC<SellerCollaborationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="seller-collaboration-title"
        className="relative my-auto w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-[#073b2a] via-[#0b5a3e] to-[#11704c] px-6 pb-7 pt-7 text-white sm:px-8">
          <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full border-[26px] border-white/5" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-100">
                <Heart className="h-3.5 w-3.5" /> Grow good together
              </span>
              <h2 id="seller-collaboration-title" className="mt-4 max-w-lg text-2xl font-bold leading-tight sm:text-3xl">
                Bring your craft to a cause that reaches further.
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-emerald-50/85">
                We welcome responsible artisan groups, cooperatives, and mission-aligned producers who want their work to support communities.
              </p>
            </div>
            <button onClick={onClose} aria-label="Close collaboration information" className="rounded-xl p-2 text-emerald-100 transition hover:bg-white/10 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-300 text-emerald-950">
              <Store className="h-5 w-5" />
            </div>
            <p className="text-xs leading-relaxed text-white/90">
              <strong className="text-white">Every partnership is reviewed by our team.</strong> Seller accounts are provisioned only after identity, organisation, and product checks. Self-service registration is not available.
            </p>
          </div>
        </div>

        <div className="space-y-5 px-6 py-6 sm:px-8">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Start a conversation</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">Tell us about your collective, where you work, and what you make. Our collaboration desk will guide the next steps.</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <a
              href={`mailto:${collaborationEmail}?subject=${emailSubject}&body=${emailBody}`}
              className="group flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 transition hover:border-emerald-400 hover:bg-emerald-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white"><Mail className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">Email the team</span>
                <span className="mt-0.5 block truncate text-xs font-semibold text-slate-800">{collaborationEmail}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-emerald-700 transition group-hover:translate-x-0.5" />
            </a>
            <a
              href={`https://wa.me/${collaborationPhone}?text=${encodeURIComponent('Namaste, I would like to discuss an artisan / seller collaboration with Akshaya Patra Welfare.')}`}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white"><Phone className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Call or WhatsApp</span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-800">+91 98765 43210</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-emerald-700 transition group-hover:translate-x-0.5" />
            </a>
          </div>

          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
            <div className="flex gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <div>
                <p className="text-xs font-bold text-slate-800">A considered onboarding process</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Our team reviews eligibility and product details before issuing secure portal access.</p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <div>
                <p className="text-xs font-bold text-slate-800">Share these details</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Collective name, representative, location, product range, and registration information.</p>
              </div>
            </div>
          </div>

          <p className="text-center text-[10px] leading-relaxed text-slate-400">
            Contact details are provided as listed by the organisation. Never share passwords, OTPs, or payment credentials by email or WhatsApp.
          </p>
        </div>
      </section>
    </div>
  );
};
