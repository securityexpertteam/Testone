import React from 'react';
import { 
  HeartHandshake, 
  FileCheck2, 
  Stethoscope, 
  BarChart3, 
  ShieldCheck, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface HowPledgesWorkSectionProps {
  onOpenDonate: () => void;
  onOpenTaxPortal: () => void;
}

export const HowPledgesWorkSection: React.FC<HowPledgesWorkSectionProps> = ({
  onOpenDonate,
  onOpenTaxPortal
}) => {
  const steps = [
    {
      number: '01',
      title: 'Pledge Direct Aid or Shop Goods',
      description: 'Choose to donate directly to medical & education causes for 80G tax benefits, or purchase welfare goods where 100% of profit margins fund village relief.',
      icon: HeartHandshake,
      badge: 'Transparent Routing',
      color: 'bg-emerald-100 text-emerald-800'
    },
    {
      number: '02',
      title: 'Instant 80G Certificate Issued',
      description: 'Direct donors immediately receive an official Section 80G tax receipt with PAN number, 10BE acknowledgment, and digital non-profit seal.',
      icon: FileCheck2,
      badge: 'Tax Exemption',
      color: 'bg-amber-100 text-amber-900'
    },
    {
      number: '03',
      title: 'Ground Execution in Remote Hamlets',
      description: 'Our mobile medical dispensary vans visit 14 remote clusters weekly to conduct doctor consultations and distribute medicines, while school kits reach underprivileged classrooms.',
      icon: Stethoscope,
      badge: 'Weekly Field Deployments',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      number: '04',
      title: 'Audited Impact & Field Proof',
      description: 'All expenditures are audited under Section 8 MCA standards. Donors receive transparent quarterly reports with patient counts and student progress logs.',
      icon: BarChart3,
      badge: '100% Verified',
      color: 'bg-purple-100 text-purple-800'
    }
  ];

  return (
    <section id="how-pledges-work" className="py-16 sm:py-24 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            Zero-Leakage Model
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-serif">
            How Pledges & Welfare Support Work
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600">
            A transparent four-step cycle ensuring every single Rupee contributed directly transforms 
            healthcare access and educational opportunities in remote Indian villages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div 
                key={idx}
                className="bg-slate-50/80 rounded-3xl p-6 sm:p-7 border border-slate-200/80 hover:border-emerald-300 hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-3xl font-extrabold text-slate-300 group-hover:text-emerald-600 font-mono transition-colors">
                      {step.number}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${step.color}`}>
                      {step.badge}
                    </span>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-900 mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-emerald-700" />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 font-serif leading-snug">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center text-xs font-semibold text-emerald-700 group-hover:translate-x-1 transition-transform">
                  <span>Learn more</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Banner with pledge CTA */}
        <div className="mt-14 max-w-4xl mx-auto bg-gradient-to-r from-emerald-900 to-[#0e4429] rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
          <div>
            <span className="inline-block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
              Start Your Village Sponsorship
            </span>
            <h3 className="text-xl sm:text-2xl font-bold font-serif">
              Become a Monthly Village Care Patron
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-lg">
              Support a mobile medical camp or sponsor rural classroom learning supplies every month with automated 80G tax certificates.
            </p>
          </div>

          <button
            onClick={onOpenDonate}
            className="shrink-0 px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition shadow-md cursor-pointer"
          >
            Pledge Direct Support
          </button>
        </div>

      </div>
    </section>
  );
};
