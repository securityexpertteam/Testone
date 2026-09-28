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
    <section id="causes" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
              <Heart className="w-3.5 h-3.5 fill-emerald-700 text-emerald-700" />
              Core Welfare Causes
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-serif">
              Education & Medical Support for Remote Villages
            </h2>
            <p className="mt-3 text-slate-600 text-base leading-relaxed">
              Every direct contribution directly powers mobile clinic fuel, certified doctor honorariums, prescription medicines, 
              classroom benches, and student learning supplies. All direct donations receive instant 80G tax exemption certificates.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl shrink-0 self-start md:self-auto border border-slate-200">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Causes ({CHARITY_CAUSES.length})
            </button>
            <button
              onClick={() => setFilter('medical')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                filter === 'medical'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Medical Aid</span>
            </button>
            <button
              onClick={() => setFilter('education')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                filter === 'education'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Village Education</span>
            </button>
          </div>
        </div>

        {/* Cause Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredCauses.map((cause) => {
            const progress = Math.min(100, Math.round((cause.raisedAmount / cause.targetAmount) * 100));

            return (
              <div 
                key={cause.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Image Container with Badges */}
                  <div className="relative h-60 w-full overflow-hidden bg-slate-100">
                    <img 
                      src={cause.image} 
                      alt={cause.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                    
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
                  <div className="p-6">
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

                    <h3 className="text-xl font-bold text-slate-900 font-serif leading-snug group-hover:text-emerald-800 transition-colors">
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
                <div className="p-6 pt-0">
                  <button
                    onClick={() => onSelectCauseForDonation(cause)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0e4429] hover:bg-[#072a19] text-white font-bold text-sm shadow cursor-pointer transition group/btn"
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
