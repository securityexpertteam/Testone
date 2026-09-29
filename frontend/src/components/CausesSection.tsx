import React, { useState } from 'react';
import { CharityCause } from '../types';
import { CHARITY_CAUSES } from '../data/causes';
import { 
  Heart, 
  ShieldCheck, 
  Stethoscope, 
  BookOpen, 
  Users, 
  Target, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';

interface CausesSectionProps {
  onSelectCauseForDonation: (cause: CharityCause) => void;
}

export const CausesSection: React.FC<CausesSectionProps> = ({
  onSelectCauseForDonation
}) => {
  const [filter, setFilter] = useState<'all' | 'medical' | 'education'>('all');

  const filteredCauses = CHARITY_CAUSES.filter((c) => {
    if (filter === 'all') return true;
    return c.category === filter;
  });

  return (
    <section id="causes" className="scroll-mt-20 bg-[#f2f9f6] py-16 sm:py-20">
      <div className="mx-auto w-full max-w-none px-[32px]">
        
        {/* Section Header */}
        <div className="mb-10 flex flex-col justify-between gap-6 md:mb-12 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/65 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-900 shadow-sm backdrop-blur">
              <Heart className="h-3.5 w-3.5 fill-emerald-700 text-emerald-700" />
              Two pillars · one shared future
            </div>
            <h2 className="text-4xl font-medium leading-tight tracking-tight text-[#173f38] sm:text-5xl">
              Where your support goes
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#58736c] sm:text-base">
              Healthcare and education are at the heart of our work in remote villages. Choose a cause to see how direct support can help.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex max-w-full flex-wrap items-center gap-1 rounded-full border border-white/80 bg-white/55 p-1.5 shadow-sm backdrop-blur-xl self-start md:self-auto">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-full px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({CHARITY_CAUSES.length})
            </button>
            <button
              onClick={() => setFilter('medical')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                filter === 'medical'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Health</span>
            </button>
            <button
              onClick={() => setFilter('education')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                filter === 'education'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Education</span>
            </button>
          </div>
        </div>

        {/* Cause Cards Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {filteredCauses.map((cause) => {
            const progress = Math.min(100, Math.round((cause.raisedAmount / cause.targetAmount) * 100));

            return (
              <div 
                key={cause.id}
                className="group flex flex-col justify-between overflow-hidden rounded-[1.9rem] border border-white/80 bg-white/55 p-2.5 shadow-[0_18px_48px_-32px_rgba(23,63,56,0.34)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/80 hover:shadow-[0_24px_60px_-30px_rgba(23,63,56,0.3)]"
              >
                <div>
                  {/* Image Container with Badges */}
                  <div className="relative h-52 w-full overflow-hidden rounded-[1.5rem] bg-emerald-100 sm:h-60">
                    <img 
                      src={cause.image} 
                      alt={cause.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#123e35]/65 via-transparent to-[#123e35]/10" />
                    
                    {/* Top badges */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-slate-900/80 backdrop-blur-md border border-white/20">
                        {cause.tag}
                      </span>
                    </div>

                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-emerald-950 bg-emerald-300/95 backdrop-blur-md shadow-xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-900" />
                        80G Tax Exempt
                      </span>
                    </div>

                    {/* Impact Metric callout banner inside image */}
                    <div className="absolute bottom-3 left-4 right-4">
                      <div className="bg-white/95 backdrop-blur-md rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 flex items-center justify-between shadow-xs">
                        <span className="truncate">{cause.impactMetric}</span>
                        <span className="text-emerald-700 font-bold shrink-0 ml-2">Verified Impact</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="px-4 pb-4 pt-5 sm:px-5">
                    <div className="flex items-center gap-2 mb-2">
                      {cause.category === 'medical' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <Stethoscope className="w-3 h-3 text-emerald-600" />
                          Remote Healthcare
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <BookOpen className="w-3 h-3 text-amber-600" />
                          Rural Education
                        </span>
                      )}
                      <span className="text-xs text-slate-500 font-medium">
                        {cause.monthlyGoal}
                      </span>
                    </div>

                    <h3 className="text-2xl font-medium leading-tight text-[#173f38] transition-colors group-hover:text-emerald-800">
                      {cause.title}
                    </h3>
                    <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                      {cause.shortDesc}
                    </p>

                    {/* Key Benefits List */}
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Where Your Direct Donation Goes:
                      </p>
                      {cause.benefits.slice(0, 3).map((benefit, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {/* Progress Bar & Stats */}
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <div className="flex justify-between items-baseline mb-1.5 text-xs font-semibold">
                        <span className="text-emerald-700 font-bold text-sm">
                          ₹{cause.raisedAmount.toLocaleString('en-IN')} raised
                        </span>
                        <span className="text-slate-500">
                          Goal: ₹{cause.targetAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-full transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-2 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          {cause.donorsCount} compassionate donors
                        </span>
                        <span className="font-bold text-slate-700">{progress}% funded</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Card Action Button */}
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                  <button
                    onClick={() => onSelectCauseForDonation(cause)}
                    className="group/btn flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#174c40] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-950/10 transition hover:bg-[#103d33] hover:shadow-lg cursor-pointer"
                  >
                    <Heart className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>Support This Cause (80G Tax-Exempt)</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
