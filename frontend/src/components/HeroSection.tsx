import React from 'react';
import { 
  Heart, 
  ShoppingBag, 
  ShieldCheck, 
  Stethoscope, 
  BookOpen, 
  MapPin, 
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface HeroSectionProps {
  onOpenDonate: () => void;
  onOpenShop: () => void;
  onOpenTaxPortal: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenDonate,
  onOpenShop,
  onOpenTaxPortal
}) => {
  return (
    <section id="hero" className="relative isolate overflow-hidden pt-5 pb-12 sm:pt-7 sm:pb-14 lg:pt-10 lg:pb-20 bg-gradient-to-b from-white via-[#f7f9f7] to-[#eef4f0]">
      {/* Background subtle geometry */}
      <div className="absolute top-0 right-0 -z-10 w-96 h-96 rounded-full bg-emerald-100/60 blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 -z-10 w-80 h-80 rounded-full bg-amber-100/60 blur-3xl pointer-events-none transform -translate-x-1/3 translate-y-1/3" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section 8 Governance & Mission Badge */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/85 text-emerald-900 border border-emerald-200 text-[11px] sm:text-xs font-semibold shadow-sm">
            <span className="relative flex h-2 w-2 rounded-full bg-emerald-500">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
            </span>
            <span>Govt. Recognized Section 8 Non-Profit (Reg. U85300KA2021NPL)</span>
          </div>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/85 text-amber-900 border border-amber-200 text-[11px] sm:text-xs font-semibold shadow-sm">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>12A & 80G Tax Exemption Certified</span>
          </div>
        </div>

        {/* Main Title & Subtitle */}
        <div className="text-center max-w-5xl mx-auto">
          <h1 className="text-[2rem] sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.08] font-serif text-balance">
            Enabling <span className="text-emerald-800">Quality Education</span> & <br className="hidden sm:block" /><span className="text-amber-600">Vital Healthcare</span> for Remote Villages
          </h1>
          
          <p className="mt-4 sm:mt-5 text-[15px] sm:text-lg text-slate-600 leading-7 font-normal max-w-3xl mx-auto text-pretty">
            We work in remote hamlets where hospitals and well-equipped schools are out of reach. Weekly mobile clinics, free medicines, rural girls’ education, and classroom STEM kits bring practical support closer to families.
          </p>
        </div>

        {/* Primary Action Dual CTAs with Clear Legal Distinctions */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-3xl mx-auto">
          
          {/* Action 1: Direct Donation (80G Tax Exemption) */}
          <div className="flex-1 bg-white/95 p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                80G Tax Exemption
              </span>
              <span className="text-xs text-slate-500 font-medium">Save 50% on Tax</span>
            </div>
            <button
              onClick={onOpenDonate}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#0e4429] hover:bg-[#072a19] text-white font-bold text-sm sm:text-base transition cursor-pointer shadow"
            >
              <Heart className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span>Donate Directly</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-500 leading-snug">
              Instant digital 80G certificate with PAN & Form 10BE filing reference.
            </p>
          </div>

          {/* Action 2: Shop Welfare Goods (100% Profits to Aid, No Tax Exemption) */}
          <div className="flex-1 bg-white/95 p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
                100% Profits Fund Aid
              </span>
              <span className="text-[11px] text-rose-600 font-semibold">No 80G on items</span>
            </div>
            <button
              onClick={onOpenShop}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm sm:text-base transition cursor-pointer shadow-xs"
            >
              <ShoppingBag className="w-5 h-5 text-slate-950" />
              <span>Shop Welfare Goods</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-500 leading-snug">
              Purchase artisan crafts & health kits. Net proceeds directly fund village aid.
            </p>
          </div>

        </div>

        {/* Real Impact Metrics Counter Strip */}
        <div className="mt-9 sm:mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 max-w-5xl mx-auto">
          
          <div className="bg-white/90 backdrop-blur rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">48+</div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium">Remote Villages</div>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 leading-tight">Weekly mobile clinics & educational aid reaching unmapped forest hamlets.</p>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">35,400+</div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium">Free Medical Visits</div>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 leading-tight">Doctor consultations, chronic diabetes care, and free doorstep medicines.</p>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">18,500+</div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium">Students Enrolled</div>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 leading-tight">School supplies, STEM kits, girl-child bicycle commutes & solar study lights.</p>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">100%</div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium">Audited Integrity</div>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 leading-tight">Strict Section 8 transparent books, zero private dividend leakage.</p>
          </div>

        </div>

        {/* Dedicated Vision & Mission Core Statements */}
        <div id="vision-mission" className="mt-12 sm:mt-16 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vision */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-200 shadow-sm relative overflow-hidden group hover:border-emerald-400 transition">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Our Guiding Light</span>
                <h3 className="text-xl font-bold font-serif text-slate-900">Our Vision</h3>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              An India where geographical remoteness is never a barrier to quality school education or lifesaving medical care. We envision empowered rural hamlets where every child finishes high school equipped with modern knowledge, and every elder receives dignified, free doorstep healthcare.
            </p>
          </div>

          {/* Mission */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-amber-200 shadow-sm relative overflow-hidden group hover:border-amber-400 transition">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Our Ground Commitment</span>
                <h3 className="text-xl font-bold font-serif text-slate-900">Our Mission</h3>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              To operate continuous weekly mobile doctor clinics across remote village clusters, eradicate classroom supply shortages, sponsor girl-child bicycle commutes, and create a sustainable zero-leakage welfare bridge where 100% of philanthropic contributions and welfare shop margins directly fund grassroots impact.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
