import React from 'react';
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
    <footer className="bg-[#edf5ef] text-slate-700 pt-16 pb-12 border-t border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-emerald-200">
          
          {/* Brand & Purpose */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 border border-emerald-600 flex items-center justify-center text-amber-300 font-serif font-extrabold text-xl shadow-xs">
                AP
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-serif text-emerald-950 tracking-tight">Akshaya Patra</span>
                <span className="text-xl font-bold font-serif text-amber-500 tracking-tight">Welfare</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
              A registered Section 8 Non-Profit company dedicated to bridging severe healthcare and educational disparities in isolated rural hamlets across India. We deploy mobile medical clinics, provide free medicines, sponsor rural girl-child schooling, and deliver classroom STEM packs.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                Section 8 Licensed
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950 text-amber-400 border border-amber-800">
                12A & 80G Certified
              </span>
            </div>

          </div>

          {/* Core Causes Navigation */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-950 mb-4 font-serif">
              Village Causes
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigate('causes')} className="hover:text-emerald-400 transition cursor-pointer text-left">
                  Remote Mobile Medical Camps
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('causes')} className="hover:text-emerald-400 transition cursor-pointer text-left">
                  Rural Classroom STEM Kits
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('causes')} className="hover:text-emerald-400 transition cursor-pointer text-left">
                  Girl-Child Commute & Scholarships
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('causes')} className="hover:text-emerald-400 transition cursor-pointer text-left">
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
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button onClick={onOpenTaxPortal} className="hover:text-emerald-400 transition cursor-pointer text-left flex items-center gap-1">
                  <FileText className="w-3 h-3 text-emerald-400" />
                  <span>My 80G Tax Certificates</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('tax-rules')} className="hover:text-emerald-400 transition cursor-pointer text-left">
                  80G Exemption Guidelines
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('transparency')} className="hover:text-emerald-400 transition cursor-pointer text-left">
                  Section 8 Statutory Audits
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how-pledges-work')} className="hover:text-emerald-400 transition cursor-pointer text-left">
                  How Pledges Work
                </button>
              </li>
              <li className="pt-2 border-t border-emerald-200">
                <button
                  onClick={onOpenSellerPortal}
                  className="text-emerald-700 hover:text-emerald-900 transition cursor-pointer text-left flex items-center gap-1.5 font-bold"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Seller Login & Portal</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Field Office */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-950 mb-4 font-serif">
              Welfare Desk
            </h4>
            <div className="space-y-3 text-xs text-slate-400">
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
            © {new Date().getFullYear()} Akshaya Patra Welfare Foundation. All rights reserved. CIN: U85300KA2021NPL148920.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Income Tax 80G URN: AACTA1234BF20214_01</span>
            <span>•</span>
            <span>NITI Aayog NGO Darpan: KA/2021/0289145</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
