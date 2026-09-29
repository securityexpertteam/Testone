import React, { useState } from 'react';
import { CharityCause, DonationRecord } from '../types';
import { CHARITY_CAUSES } from '../data/causes';
import { organization } from '../config/organization';
import { 
  X, 
  Heart, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle, 
  Lock, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCause?: CharityCause | null;
  onDonationComplete: (record: DonationRecord) => void;
}

export const DonateModal: React.FC<DonateModalProps> = ({
  isOpen,
  onClose,
  selectedCause,
  onDonationComplete
}) => {
  const [causeId, setCauseId] = useState<string>(selectedCause?.id || CHARITY_CAUSES[0].id);
  const [amount, setAmount] = useState<number>(2500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [panNumber, setPanNumber] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const currentCause = CHARITY_CAUSES.find((c) => c.id === causeId) || CHARITY_CAUSES[0];
  const finalAmount = customAmount ? Number(customAmount) : amount;
  const taxDeduction = Math.round(finalAmount * 0.5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName.trim() || !email.trim() || !phone.trim() || !panNumber.trim()) {
      setErrorMsg('Please enter all required donor details including PAN for the 80G tax certificate.');
      return;
    }

    if (finalAmount < 100) {
      setErrorMsg('Minimum direct donation amount is ₹100.');
      return;
    }

    // Validate PAN format (5 letters, 4 digits, 1 letter)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
    if (!panRegex.test(panNumber.trim())) {
      setErrorMsg('Please enter a valid 10-character PAN number (e.g., ABCDE1234F).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    setTimeout(() => {
      const now = new Date();
      const receiptNo = `APW-80G-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      
      const record: DonationRecord = {
        id: `don-${Date.now()}`,
        donorName: donorName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        panNumber: panNumber.trim().toUpperCase(),
        address: address.trim() || 'Resident of India',
        amount: finalAmount,
        causeId: currentCause.id,
        causeTitle: currentCause.title,
        date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        receiptNumber: receiptNo,
        urn80G: organization.urn80G,
        financialYear: '2024-2025',
        status: 'COMPLETED'
      };

      setIsSubmitting(false);
      onDonationComplete(record);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8 border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-[#0e4429] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-amber-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-serif">
                Direct Donation & 80G Tax Exemption
              </h3>
              <p className="text-xs text-emerald-200">
                100% of your funds empower remote village healthcare & education.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legal Tax Exemption Guarantee Banner */}
        <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Eligible for 50% Tax Deduction under Section 80G</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
            URN: {organization.urn80G}
          </span>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Select Cause */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Charity Cause:
            </label>
            <select
              value={causeId}
              onChange={(e) => setCauseId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 focus:outline-emerald-600 cursor-pointer"
            >
              {CHARITY_CAUSES.map((cause) => (
                <option key={cause.id} value={cause.id}>
                  {cause.title} ({cause.category === 'medical' ? 'Healthcare' : 'Education'})
                </option>
              ))}
            </select>
          </div>

          {/* Preset Amounts */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Choose Contribution Amount (INR):
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {[500, 1200, 2500, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setAmount(val);
                    setCustomAmount('');
                  }}
                  className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition border cursor-pointer ${
                    finalAmount === val && !customAmount
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ₹{val.toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <input
                type="number"
                placeholder="Or enter custom amount (e.g. 10000)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-emerald-600"
              />
            </div>
          </div>

          {/* 80G Benefit Summary Box */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-900 block">
                Section 80G Exemption on this Donation:
              </span>
              <span className="text-[11px] text-amber-800/80">
                50% of ₹{finalAmount.toLocaleString('en-IN')} is tax-exempt
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-emerald-800 font-mono">
                ₹{taxDeduction.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-500 block">Deductible Income</span>
            </div>
          </div>

          {/* Donor Information for 80G Certificate */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span>Donor Details (Required for 80G Receipt & Form 10BE)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Full Name (as per PAN) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  PAN Number (10 characters) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 text-sm font-mono uppercase rounded-xl border border-slate-300 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="ramesh@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Postal Address (Optional for tax receipt)
              </label>
              <input
                type="text"
                placeholder="House/Street, City, State, PIN"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-emerald-600"
              />
            </div>
          </div>

          {/* Payment & 80G Issuance Action */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-[#0e4429] hover:bg-[#072a19] text-white font-bold text-base transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4 text-emerald-300" />
              <span>
                {isSubmitting 
                  ? 'Generating Section 80G Certificate...' 
                  : `Donate ₹${finalAmount.toLocaleString('en-IN')} & Issue Instant 80G Receipt`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-center text-[11px] text-slate-500 mt-2.5">
              🔒 256-bit encrypted simulated gateway. Your 80G Tax Exemption Certificate is generated instantly upon submission.
            </p>
          </div>

        </form>

      </div>
    </div>
  );
};
