import React, { useState } from 'react';
import { organization } from '../config/organization';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Calculator, 
  Heart, 
  ShoppingBag, 
  HelpCircle,
  FileCheck,
  ArrowRight
} from 'lucide-react';

interface TaxExplainerSectionProps {
  onOpenDonate: () => void;
  onOpenShop: () => void;
  onOpenTaxPortal: () => void;
}

export const TaxExplainerSection: React.FC<TaxExplainerSectionProps> = ({
  onOpenDonate,
  onOpenShop,
  onOpenTaxPortal,
}) => {
  const [calcAmount, setCalcAmount] = useState<number>(3000);
  const [taxBracket, setTaxBracket] = useState<number>(30); // 30% tax bracket

  const deductionPercent = Number(organization.deductionPercent) || 50;
  const deductionAmount = Math.round(calcAmount * deductionPercent / 100);
  const taxSaved = Math.round(deductionAmount * (taxBracket / 100));
  const effectiveCost = calcAmount - taxSaved;

  return (
    <section id="tax-rules" className="scroll-mt-20 border-y border-emerald-950/5 bg-[#f2f9f6] py-16 sm:py-20">
      <div className="mx-auto w-full max-w-none px-[32px]">
        
        {/* Section Header */}
        <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/65 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-900 shadow-sm backdrop-blur">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Transparent Tax Guidance
          </div>
          <h2 className="text-4xl font-medium leading-tight tracking-tight text-[#173f38] sm:text-5xl">
            Understanding Donations vs. Welfare Goods
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#58736c] sm:text-base">
            In compliance with the Indian Income Tax Act (1961) and Section 8 non-profit regulations, 
            here is how tax exemptions and charity funding work for our education and medical missions.
          </p>
        </div>

        {/* Side-by-Side Clarity Cards */}
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-2">
          
          {/* Direct Donations Card */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-[1.8rem] border border-white/80 bg-white/60 p-6 shadow-[0_18px_48px_-32px_rgba(23,63,56,0.34)] backdrop-blur-xl sm:p-8">
            <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-bl-xl flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Eligible for 80G Tax Exemption
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-5">
                <Heart className="w-6 h-6 fill-emerald-600 text-emerald-600" />
              </div>

              <h3 className="text-2xl font-bold text-slate-900 font-serif">
                Direct Philanthropic Donation
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Direct contributions given freely to fund medical relief camps, doctor visits, hospital medicines, and village school materials.
              </p>

              <div className="mt-6 space-y-3.5 border-t border-slate-100 pt-5">
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    <strong className="text-slate-900">{deductionPercent}% Deduction:</strong> Eligible under Section 80G of the Income Tax Act.
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    <strong className="text-slate-900">Instant Official Receipt:</strong> Download digital 80G certificate with unique Form 10BE filing reference.
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    <strong className="text-slate-900">PAN Card Linking:</strong> Automatically linked for pre-filled ITR filing.
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    <strong className="text-slate-900">100% Impact:</strong> Deployed directly to patient diagnostics and student schooling.
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100">
              <button
                onClick={onOpenDonate}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0e4429] hover:bg-[#072a19] text-white font-bold text-sm shadow cursor-pointer transition"
              >
                <span>Make 80G Direct Donation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Shop Goods Card */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-[1.8rem] border border-white/80 bg-white/60 p-6 shadow-[0_18px_48px_-32px_rgba(23,63,56,0.34)] backdrop-blur-xl sm:p-8">
            <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-bl-xl flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              No 80G Exemption on Goods
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mb-5">
                <ShoppingBag className="w-6 h-6 text-amber-700" />
              </div>

              <h3 className="text-2xl font-bold text-slate-900 font-serif">
                Purchasing Welfare Goods
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Purchasing handcrafted khadi shawls, tribal forest honey, earthenware, student care packs, or family emergency health kits.
              </p>

              <div className="mt-6 space-y-3.5 border-t border-slate-100 pt-5">
                <div className="flex items-start gap-2.5">
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    <strong className="text-slate-900">No Tax Deduction:</strong> By Indian tax law, commercial purchase of goods is NOT eligible for Section 80G deduction.
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    <strong className="text-slate-900">100% Profits Fund Aid:</strong> All net sales profits are transferred directly into village medical and school programs.
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    <strong className="text-slate-900">Empowers Rural Artisans:</strong> Direct sustainable income for women weavers, potters, and honey harvesters.
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    <strong className="text-slate-900">Dual Support:</strong> You receive pristine authentic goods while creating grassroots social impact.
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100">
              <button
                onClick={onOpenShop}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-xs cursor-pointer transition"
              >
                <span>Shop Welfare Goods (Proceeds Fund Aid)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Interactive 80G Tax Exemption Calculator */}
        <div className="mt-14 max-w-4xl mx-auto bg-gradient-to-br from-emerald-900 via-[#0e4429] to-emerald-950 rounded-3xl p-6 sm:p-9 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-700/60 pb-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-amber-300 flex items-center justify-center">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold font-serif text-white">
                  Interactive 80G Tax Exemption Calculator
                </h3>
                <p className="text-xs sm:text-sm text-emerald-200">
                  Calculate your personal tax savings on direct donations under Section 80G.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenTaxPortal}
              className="text-xs bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 font-semibold px-3 py-1.5 rounded-lg border border-emerald-600 transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Verify Registration URN</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Input Sliders */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="flex justify-between items-center text-sm font-semibold mb-2">
                  <span className="text-emerald-100">Donation Amount:</span>
                  <span className="text-2xl font-extrabold text-amber-300 font-mono">₹{calcAmount.toLocaleString('en-IN')}</span>
                </div>
                <input 
                  type="range"
                  min="500"
                  max="50000"
                  step="500"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Number(e.target.value))}
                  className="w-full h-2.5 bg-emerald-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[11px] text-emerald-300/80 mt-1">
                  <span>₹500</span>
                  <span>₹10,000</span>
                  <span>₹25,000</span>
                  <span>₹50,000</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-emerald-100 mb-2">
                  Select Your Income Tax Slab (Old Tax Regime):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '5% Bracket', value: 5 },
                    { label: '20% Bracket', value: 20 },
                    { label: '30% Bracket', value: 30 },
                  ].map((bracket) => (
                    <button
                      key={bracket.value}
                      type="button"
                      onClick={() => setTaxBracket(bracket.value)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        taxBracket === bracket.value
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                          : 'bg-emerald-800/60 text-emerald-200 border-emerald-700 hover:bg-emerald-800'
                      }`}
                    >
                      {bracket.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-950/60 rounded-xl p-3 border border-emerald-800 text-xs text-emerald-200/90 leading-relaxed">
                💡 <strong>How it works:</strong> Under Section 80G, {deductionPercent}% of your donation (₹{deductionAmount.toLocaleString('en-IN')}) is deducted from your taxable gross income, resulting in an immediate tax saving of ₹{taxSaved.toLocaleString('en-IN')}.
              </div>
            </div>

            {/* Calculated Results Box */}
            <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-emerald-500/30 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-200">{deductionPercent}% Deduction u/s 80G:</span>
                  <span className="font-bold text-white font-mono">₹{deductionAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-200">Income Tax Saved:</span>
                  <span className="font-extrabold text-amber-300 text-lg font-mono">₹{taxSaved.toLocaleString('en-IN')}</span>
                </div>

                <div className="pt-3 border-t border-emerald-700/60 flex justify-between items-center">
                  <span className="text-sm font-semibold text-white">Your Effective Out-of-Pocket:</span>
                  <span className="font-extrabold text-2xl text-emerald-300 font-mono">₹{effectiveCost.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={onOpenDonate}
                  className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-slate-950" />
                  <span>Donate ₹{calcAmount.toLocaleString('en-IN')} & Claim 80G</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
