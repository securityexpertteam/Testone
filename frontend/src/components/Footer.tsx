import React from 'react';
import { displayValue, organization } from '../config/organization';
import { 
  Heart, 
  ShieldCheck, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  AlertCircle,
  Store
} from 'lucide-react';

interface FooterProps {
  onOpenDonate: () => void;
  onOpenTaxPortal: () => void;
  onOpenSellerPortal: () => void;
  onNavigate: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenDonate,
  onOpenTaxPortal,
  onOpenSellerPortal,
  onNavigate
}) => {
  return (
    <footer className="border-t border-emerald-950/10 bg-[#f2f9f6] py-16 text-slate-700 sm:py-20">
      <div className="mx-auto w-full max-w-none px-[32px]">
        
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-emerald-200">
          
          {/* Brand & Purpose */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 border border-emerald-600 flex items-center justify-center text-amber-300 font-serif font-extrabold text-xl shadow-xs">
                AP
              </div>
              <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-serif text-emerald-950 tracking-tight">{organization.legalName || 'Akshaya Patra Welfare Foundation'}</span>
              </div>
            </div>

            <p className="max-w-md text-xs leading-relaxed text-[#526b64] sm:text-sm">
              A registered Section 8 Non-Profit company dedicated to bridging severe healthcare and educational disparities in isolated rural hamlets across India. We deploy mobile medical clinics, provide free medicines, sponsor rural girl-child schooling, and deliver classroom STEM packs.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-900/10 bg-white/70 px-3 py-1 text-xs font-semibold text-emerald-900">
                <ShieldCheck className="w-3.5 h-3.5" />
                Section 8 Licensed
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-900/10 bg-white/70 px-3 py-1 text-xs font-semibold text-amber-900">
                12A & 80G Certified
              </span>
            </div>

          </div>

          {/* Core Causes Navigation */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-950 mb-4 font-serif">
              Village Causes
            </h4>
            <ul className="space-y-2.5 text-xs text-[#526b64]">
              <li>
                <button onClick={() => onNavigate('causes')} className="hover:text-emerald-800 transition cursor-pointer text-left">
                  Remote Mobile Medical Camps
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('causes')} className="hover:text-emerald-800 transition cursor-pointer text-left">
                  Rural Classroom STEM Kits
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('causes')} className="hover:text-emerald-800 transition cursor-pointer text-left">
                  Girl-Child Commute & Scholarships
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('causes')} className="hover:text-emerald-800 transition cursor-pointer text-left">
                  Emergency Pediatric Nutrition
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shop-goods')} className="hover:text-amber-700 transition cursor-pointer text-left font-semibold text-slate-600">
                  Shop Welfare Goods (100% Aid)
                </button>
              </li>
            </ul>
          </div>

          {/* Statutory Filings & Tax Transparency */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-950 mb-4 font-serif">
              Compliance & Audit
            </h4>
            <ul className="space-y-2.5 text-xs text-[#526b64]">
              <li>
                <button onClick={onOpenTaxPortal} className="hover:text-emerald-800 transition cursor-pointer text-left flex items-center gap-1">
                  <FileText className="w-3 h-3 text-emerald-400" />
                  <span>My 80G Tax Certificates</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('tax-rules')} className="hover:text-emerald-800 transition cursor-pointer text-left">
                  80G Exemption Guidelines
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('transparency')} className="hover:text-emerald-800 transition cursor-pointer text-left">
                  Section 8 Statutory Audits
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how-pledges-work')} className="hover:text-emerald-800 transition cursor-pointer text-left">
                  How Pledges Work
                </button>
              </li>
              <li className="pt-2 border-t border-emerald-200">
                <button
                  onClick={onOpenSellerPortal}
                  className="text-emerald-700 hover:text-emerald-900 transition cursor-pointer text-left flex items-center gap-1.5 font-bold"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Seller & Artisan Collaborations</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Field Office */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-950 mb-4 font-serif">
              Welfare Desk
            </h4>
            <div className="space-y-3 text-xs text-[#526b64]">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Akshaya Patra Welfare Foundation, Bangalore Rural & Regional Field Units, Karnataka, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>welfare@akshayapatrawelfare.org</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>+91 98765 43210 (Toll-Free Aid Desk)</span>
              </div>
            </div>

            <div className="mt-4 pt-3">
              <button
                onClick={onOpenDonate}
                className="w-full py-2.5 px-3 rounded-xl bg-[#0e4429] hover:bg-[#072a19] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Heart className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Donate Direct (80G Eligible)</span>
              </button>
            </div>
          </div>

        </div>

        {/* Mandatory Statutory Note on Tax Exemption & Purchases */}
        <div className="my-8 p-4 rounded-2xl bg-white/70 border border-emerald-200 text-xs text-slate-600 leading-relaxed">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
                <strong className="text-emerald-950 block mb-0.5">
                Statutory Notice regarding Section 80G Tax Exemption vs. Goods Purchase:
              </strong>
              <span>
                As stipulated under Section 80G of the Indian Income Tax Act (1961), tax exemption deductions apply exclusively to direct, unrequited philanthropic donations. 
                Purchases of welfare shop goods are considered commercial transactions for consideration and are therefore <strong>NOT eligible for Section 80G tax certificates</strong>. 
                However, 100% of the net profit margins realized from all welfare goods are legally and contractually directed toward financing rural medical clinics, diagnostic kits, and village school materials.
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 pt-4 border-t border-emerald-200">
          <div>
            © {new Date().getFullYear()} {organization.legalName || 'Akshaya Patra Welfare Foundation'}. All rights reserved. CIN: {displayValue(organization.cin)}.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Income Tax 80G URN: {displayValue(organization.urn80G)}</span>
            <span>•</span>
            <span>NITI Aayog NGO Darpan: {displayValue(organization.darpanId)}</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
