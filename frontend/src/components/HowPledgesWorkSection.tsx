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
    <section id="how-pledges-work" className="scroll-mt-20 border-t border-emerald-950/5 bg-[#f2f9f6] py-16 sm:py-20">
      <div className="mx-auto w-full max-w-none px-[32px]">
        
        <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/65 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-900 shadow-sm backdrop-blur">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            A clearer way to give
          </div>
          <h2 className="text-4xl font-medium leading-tight tracking-tight text-[#173f38] sm:text-5xl">
            The difference matters
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#58736c] sm:text-base">
            Direct donations and shop purchases support the mission in different ways. Here is what to expect from each.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div 
                key={idx}
                className="group flex flex-col justify-between rounded-[1.6rem] border border-white/80 bg-white/55 p-5 shadow-[0_18px_48px_-32px_rgba(23,63,56,0.34)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/80 hover:shadow-[0_24px_60px_-30px_rgba(23,63,56,0.25)] sm:p-6"
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

                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-900/10 bg-white/80 text-slate-900 shadow-sm transition-transform group-hover:scale-105">
                    <Icon className="w-6 h-6 text-emerald-700" />
                  </div>

                  <h3 className="text-xl font-medium leading-snug text-[#173f38]">
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
          <div className="mx-auto mt-10 flex max-w-4xl flex-col items-center justify-between gap-5 rounded-[1.8rem] border border-white/15 bg-[#174c40] p-6 text-white shadow-[0_20px_50px_rgba(23,76,64,0.18)] sm:mt-12 sm:flex-row sm:p-8">
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
