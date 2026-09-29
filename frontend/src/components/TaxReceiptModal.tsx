import React, { useRef } from 'react';
import { DonationRecord } from '../types';
import { displayValue, organization } from '../config/organization';
import { 
  X, 
  Printer, 
  Download, 
  ShieldCheck, 
  CheckCircle, 
  Building2, 
  Calendar, 
  QrCode,
  Heart
} from 'lucide-react';

const SAMPLE_RECEIPT: DonationRecord = {
  id: 'sample-preview-only',
  donorName: 'Sample Donor',
  email: 'sample@example.invalid',
  phone: '+91 XXXXX XXXXX',
  panNumber: 'ABCDE••••F',
  address: 'Sample City',
  amount: 1000,
  causeId: 'sample-cause',
  causeTitle: 'Sample charitable contribution',
  date: 'DD MMM YYYY',
  receiptNumber: 'SAMPLE-80G-000000',
  urn80G: 'SAMPLE-URN-NOT-VALID',
  financialYear: 'YYYY–YY',
  status: 'COMPLETED',
};

interface TaxReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: DonationRecord[];
  activeRecordId?: string | null;
  onSelectRecord: (id: string) => void;
  onOpenDonate: () => void;
}

export const TaxReceiptModal: React.FC<TaxReceiptModalProps> = ({
  isOpen,
  onClose,
  records,
  activeRecordId,
  onSelectRecord,
  onOpenDonate
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const currentRecord = records.find((r) => r.id === activeRecordId) || records[0];
  const isSample = !currentRecord;
  const displayRecord = currentRecord || SAMPLE_RECEIPT;

  const handlePrint = () => {
    if (isSample) return;
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8 border border-slate-200">
        
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                My 80G Tax Exemption Certificates
              </h3>
              <p className="text-xs text-slate-400">
                {isSample ? 'Example only · no donor or internal account data' : 'Your Form 10BE donation receipts'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSample ? (
              <span className="rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200">Sample Preview</span>
            ) : (
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab strip if user has multiple donation receipts */}
        {records.length > 1 && (
          <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 border-b border-slate-200 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-600 shrink-0">Your Receipts:</span>
            {records.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelectRecord(r.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                  currentRecord?.id === r.id
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {r.receiptNumber} (₹{r.amount.toLocaleString('en-IN')})
              </button>
            ))}
          </div>
        )}

        {/* Official 80G Certificate Document Canvas */}
        <div className="p-4 sm:p-8 max-h-[75vh] overflow-y-auto bg-slate-50/50">
          {displayRecord ? (
            <div 
              ref={printRef}
              className="bg-white p-6 sm:p-10 rounded-2xl border-2 border-emerald-800/80 shadow-md relative overflow-hidden text-slate-900"
            >
              {/* Watermark in background */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
                <span className="text-8xl font-black rotate-[-25deg] text-emerald-950 uppercase tracking-widest font-serif">
                  {isSample ? 'SAMPLE · NOT VALID' : 'SECTION 80G'}
                </span>
              </div>

              {/* Certificate Header */}
              <div className="text-center pb-6 border-b-2 border-slate-200 relative">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  {isSample ? 'Illustrative receipt layout · not a tax certificate' : 'Form 10BE / Section 80G Statutory Donation Receipt'}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-slate-900 tracking-tight">
                  {organization.legalName || 'Organization Name'}
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  (A Section 8 Non-Profit Company Licensed under Companies Act, 2013)
                </p>
                <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono">
                  <span>CIN: {isSample ? 'SAMPLE-CIN-XXXXXX' : displayValue(organization.cin)}</span>
                  <span>•</span>
                  <span>Income Tax 80G URN: {isSample ? 'SAMPLE-URN-NOT-VALID' : displayValue(organization.urn80G)}</span>
                  <span>•</span>
                  <span>12A URN: {isSample ? 'SAMPLE-URN-NOT-VALID' : displayValue(organization.urn12A)}</span>
                </div>
              </div>

              {/* Receipt Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-200 text-xs bg-slate-50/80 -mx-6 sm:-mx-10 px-6 sm:px-10">
                <div>
                  <span className="text-slate-400 block font-medium">Receipt Number:</span>
                  <span className="font-mono font-bold text-slate-900">{displayRecord.receiptNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Date of Donation:</span>
                  <span className="font-bold text-slate-900">{displayRecord.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Financial Year:</span>
                  <span className="font-bold text-slate-900">{displayRecord.financialYear}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Form 10BE Filing Ref:</span>
                  <span className="font-mono font-bold text-emerald-700">{isSample ? 'SAMPLE-10BE-XXXXXX' : displayValue(organization.orderNumber80G, 'Generated with Form 10BE')}</span>
                </div>
              </div>

              {/* Donor Details Box */}
              <div className="py-5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold mb-0.5">
                      Donor Name (as per PAN):
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      {displayRecord.donorName}
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      {displayRecord.email} | {displayRecord.phone}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold mb-0.5">
                      Permanent Account Number (PAN):
                    </span>
                    <span className="text-base font-mono font-extrabold text-slate-900">
                      {displayRecord.panNumber}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      PAN Verified for Direct Tax Filing
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <span className="text-[11px] text-emerald-800 uppercase tracking-wider font-semibold block">
                        Purpose of Charitable Contribution:
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {displayRecord.causeTitle}
                      </span>
                      <span className="text-xs text-slate-600 block mt-0.5">
                        Enabling free doctor visits, medicines, and educational supplies for remote villages.
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs text-slate-500 block">Total Amount Donated:</span>
                      <span className="text-2xl font-black text-emerald-800 font-mono">
                        ₹{displayRecord.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statutory Legal Declaration */}
              <div className="py-4 border-t border-slate-200 text-xs text-slate-600 leading-relaxed space-y-2">
                <p>
                  {isSample ? <><strong>Sample notice:</strong> This is a visual example only. It is not an issued receipt, does not verify a donation, and must not be used for tax filing.</> : <><strong>Statutory Tax Deduction Note:</strong> This direct contribution is exempt under Section 80G(5)(vi) of the Income Tax Act, 1961 vide Order No. {displayValue(organization.orderNumber80G, organization.urn80G)}. The donor is eligible for {displayValue(organization.deductionPercent, '50')}% deduction of the amount donated from their taxable total income.</>}
                </p>
                <p className="text-[11px] text-slate-500">
                  Note: In compliance with Rule 18AB of the Income Tax Rules, 1962, this contribution is reported in the annual Statement of Donations (Form 10BD) to the Director of Income Tax (Exemption).
                </p>
              </div>

              {/* Signatures & Seal */}
              <div className="pt-6 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                
                {/* QR Code Verification Stamp */}
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-lg p-1.5 flex items-center justify-center shrink-0 ${isSample ? 'bg-slate-200 text-slate-500' : 'bg-slate-900 text-white'}`}>
                    <QrCode className="w-11 h-11" />
                  </div>
                  <div className="text-[11px] text-slate-500">
                    <span className="font-bold text-slate-800 block">{isSample ? 'Sample graphic only' : 'Digitally Signed & Validated'}</span>
                    <span>{isSample ? 'No verification code in this preview' : 'Scan to verify 80G certificate on national portal'}</span>
                  </div>
                </div>

                {/* Authorized Signatory */}
                <div className="text-center sm:text-right">
                  <div className="inline-block text-center border-b border-slate-400 pb-1 mb-1 px-4">
                    <span className="font-serif italic font-bold text-emerald-900 text-sm">
                      {isSample ? 'Sample Signatory' : displayValue(organization.authorizedSignatory, 'Authorized Signatory')}
                    </span>
                  </div>
                  <span className="block text-xs font-bold text-slate-900">Authorized Signatory</span>
                  <span className="block text-[10px] text-slate-500">{organization.legalName || 'Organization Name'}</span>
                </div>

              </div>

            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-slate-800 font-serif">No 80G Receipts Found Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                Make a direct donation to remote village medical or education causes to instantly receive your Section 80G tax certificate.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenDonate();
                }}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow"
              >
                Donate Direct & Get 80G Certificate
              </button>
            </div>
          )}
        </div>

        {/* Modal Bottom CTA */}
        <div className="bg-white p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Need this tax receipt mailed to your accountant?
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Done
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenDonate();
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0e4429] text-white hover:bg-[#072a19] transition cursor-pointer flex items-center gap-1.5"
            >
              <Heart className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Make Another 80G Donation</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
