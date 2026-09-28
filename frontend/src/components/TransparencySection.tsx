import React from 'react';
import { 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  Download, 
  ExternalLink, 
  Lock, 
  Award,
  Building2,
  PieChart
} from 'lucide-react';

export const TransparencySection: React.FC = () => {
  const registrations = [
    {
      title: 'Company Registration (MCA)',
      regNo: 'CIN: U85300KA2021NPL148920',
      authority: 'Ministry of Corporate Affairs, Govt. of India',
      status: 'Active Section 8 Non-Profit'
    },
    {
      title: 'Income Tax 12A Exemption',
      regNo: 'URN: AACTA1234BF20214',
      authority: 'Income Tax Department of India',
      status: 'Perpetual Recognition'
    },
    {
      title: 'Section 80G Tax Exemption',
      regNo: 'URN: AACTA1234BF20214_01',
      authority: 'Income Tax Department (Form 10BE Compliance)',
      status: '50% Donor Tax Deduction'
    },
    {
      title: 'NITI Aayog NGO Darpan',
      regNo: 'DARPAN ID: KA/2021/0289145',
      authority: 'NITI Aayog, Govt. of India',
      status: 'Verified National Portal'
    },
    {
      title: 'CSR-1 Registration',
      regNo: 'Reg No: CSR00028491',
      authority: 'Ministry of Corporate Affairs',
      status: 'Eligible for Corporate CSR Funds'
    },
    {
      title: 'Bank Accounts & Auditing',
      regNo: 'Dedicated Escrow Welfare Account',
      authority: 'Audited Annually by Independent Statutory CAs',
      status: 'Unqualified Audit Opinions'
    }
  ];

  return (
    <section id="transparency" className="py-16 sm:py-24 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            Statutory & Legal Compliance
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-serif">
            Section 8 Non-Profit Transparency
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600">
            Akshaya Patra Welfare is incorporated as a non-profit company under Section 8 of the Companies Act, 2013. 
            By constitutional mandate, no profits or dividends may ever be paid to directors; every surplus Rupee 
            is legally bounded to village medical aid and grassroots education.
          </p>
        </div>

        {/* Legal Credentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {registrations.map((item, idx) => (
            <div 
              key={idx}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {item.status}
                </span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="text-base font-bold text-slate-900 font-serif">
                {item.title}
              </h4>
              <p className="mt-1 font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded inline-block">
                {item.regNo}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {item.authority}
              </p>
            </div>
          ))}
        </div>

        {/* Fund Allocation & Statutory Audit Showcase */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Allocation Breakdown */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 font-serif">
                  Where Every Rupee Goes
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Audited financial statements for FY 2024–25 reflect strict non-profit capital discipline.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-800">Direct Medical Camps, Medicines & Classroom Supplies</span>
                    <span className="text-emerald-700">88%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-[88%] h-full bg-emerald-600 rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-800">Cold-Chain Storage & Remote Village Van Logistics</span>
                    <span className="text-blue-700">7%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-[7%] h-full bg-blue-500 rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-800">Statutory Audit, Form 10BE Filing & Compliance</span>
                    <span className="text-amber-700">5%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-[5%] h-full bg-amber-500 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/70 text-xs text-emerald-950 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-emerald-900 font-semibold mb-0.5">Zero Private Dividend Mandate</strong>
                  Section 8 non-profits are legally prohibited from paying profits or remuneration in excess of statutory limits to promoters or directors. 100% of welfare shop surplus is tied to charitable aims.
                </div>
              </div>
            </div>

            {/* Statutory Reports Download Box */}
            <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900 font-serif mb-2">
                  Public Compliance Documents
                </h4>
                <p className="text-xs text-slate-600 mb-4">
                  Openly downloadable audited reports and statutory certifications.
                </p>

                <div className="space-y-2.5">
                  {[
                    { name: 'Audited Financial Statements (FY 2024-25)', size: '2.4 MB PDF' },
                    { name: 'Income Tax 80G & 12A Final Approval Order', size: '1.1 MB PDF' },
                    { name: 'MCA Section 8 License & Certificate of Incorporation', size: '1.8 MB PDF' },
                    { name: 'Form 10BD & 10BE Annual Donation Filing Proof', size: '940 KB PDF' },
                  ].map((doc, i) => (
                    <div 
                      key={i}
                      className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 transition flex items-center justify-between group cursor-pointer"
                      onClick={() => alert(`Simulated download for: ${doc.name}`)}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-medium text-slate-900 truncate group-hover:text-emerald-700">
                            {doc.name}
                          </p>
                          <span className="text-[10px] text-slate-400">{doc.size}</span>
                        </div>
                      </div>
                      <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200 text-center">
                <span className="text-[11px] text-slate-500">
                  Verified by Registrar of Companies (ROC), Bangalore, Karnataka.
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
