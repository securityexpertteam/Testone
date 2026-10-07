import React, { useState, useEffect } from 'react';
import { RaffleTransactionRecord } from '../types';
import { API_BASE_URL } from '../utils/api';
import { 
  X, 
  Search, 
  Ticket, 
  Trophy, 
  ShieldCheck, 
  Building, 
  Smartphone, 
  ExternalLink, 
  Calendar, 
  Sparkles,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';

interface RaffleAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RaffleCampaignSummary {
  campaignId: string;
  itemName: string;
  drawDate: string;
  status: string;
  draw: { drawnAt?: string; winner?: { customerName?: string; ticketNumber?: string } } | null;
}

export const RaffleAuditModal: React.FC<RaffleAuditModalProps> = ({
  isOpen,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState<RaffleTransactionRecord[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<RaffleTransactionRecord[]>([]);
  const [copiedTicket, setCopiedTicket] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tracker' | 'ledger' | 'winner-draw'>('tracker');
  const [simulatedWinner, setSimulatedWinner] = useState<{ customerName?: string; ticketNumber?: string } | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [campaigns, setCampaigns] = useState<RaffleCampaignSummary[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const loadTickets = async () => {
    const [ticketResponse, campaignResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/raffle/tickets`),
      fetch(`${API_BASE_URL}/raffle/campaigns`)
    ]);
    const [ticketResult, campaignResult] = await Promise.all([ticketResponse.json(), campaignResponse.json()]);
    if (!ticketResponse.ok || !ticketResult.success) throw new Error(ticketResult.message || 'Raffle ledger unavailable');
    if (!campaignResponse.ok || !campaignResult.success) throw new Error(campaignResult.message || 'Raffle campaigns unavailable');
    const all: RaffleTransactionRecord[] = ticketResult.tickets || [];
    const loadedCampaigns: RaffleCampaignSummary[] = campaignResult.campaigns || [];
    setCampaigns(loadedCampaigns);
    setTickets(all);
    setFilteredTickets(all);
    const nextCampaignId = loadedCampaigns.some(campaign => campaign.campaignId === selectedCampaignId)
      ? selectedCampaignId
      : loadedCampaigns[0]?.campaignId || '';
    setSelectedCampaignId(nextCampaignId);
    setSimulatedWinner(loadedCampaigns.find(campaign => campaign.campaignId === nextCampaignId)?.draw?.winner || null);
  };

  useEffect(() => {
    if (isOpen) void loadTickets().catch(error => setErrorMessage(error instanceof Error ? error.message : 'Raffle ledger unavailable'));
  }, [isOpen]);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    const campaignTickets = selectedCampaignId ? tickets.filter(ticket => ticket.campaignId === selectedCampaignId) : tickets;
    setFilteredTickets(query ? campaignTickets.filter(ticket => [
      ticket.ticketNumber, ticket.customerName, ticket.email, ticket.mobileNumber,
      ticket.whatsAppNumber, ticket.orderId, ticket.communityApartment
    ].some(value => value?.toLowerCase().includes(query))) : campaignTickets);
  }, [searchQuery, selectedCampaignId, tickets]);

  useEffect(() => {
    setSimulatedWinner(campaigns.find(campaign => campaign.campaignId === selectedCampaignId)?.draw?.winner || null);
  }, [campaigns, selectedCampaignId]);

  const activeCampaignTicketCount = tickets.filter(ticket => ticket.campaignId === selectedCampaignId && ticket.status === 'ACTIVE_VALID').length;
  const prizeName = campaigns.find(campaign => campaign.campaignId === selectedCampaignId)?.itemName || 'Raffle prize';

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTicket(text);
    setTimeout(() => setCopiedTicket(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-4 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-amber-950 via-[#1e0d02] to-slate-950 text-white flex items-center justify-between shrink-0 border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-serif tracking-tight">
                  Raffle Master Ledger & Winner Audit
                </h2>
                <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full">
                  100% Transparent
                </span>
              </div>
              <p className="text-xs text-amber-200/80">
                Official Section 8 Audit Registry • Verified & Traceable Entries
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-3 text-xs">
          <label htmlFor="raffle-campaign" className="font-semibold text-slate-700">Campaign</label>
          <select id="raffle-campaign" value={selectedCampaignId} onChange={(event) => { setSelectedCampaignId(event.target.value); setSimulatedWinner(null); }} className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2">
            {campaigns.map(campaign => <option key={campaign.campaignId} value={campaign.campaignId}>{campaign.itemName} • {campaign.drawDate}</option>)}
          </select>
          {activeCampaignTicketCount > 0 && <span className="text-slate-500">{activeCampaignTicketCount} active entries</span>}
        </div>
        {errorMessage && <p className="border-b border-rose-200 bg-rose-50 px-5 py-2 text-xs text-rose-800" role="alert">{errorMessage}</p>}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-4 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('tracker')}
            className={`pb-3 px-2 border-b-2 cursor-pointer transition flex items-center gap-1.5 ${activeTab === 'tracker' ? 'border-amber-600 text-amber-900 font-extrabold' : 'border-transparent hover:text-slate-900'}`}
          >
            <Search className="w-4 h-4" />
            <span>Search & Track Ticket</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-3 px-2 border-b-2 cursor-pointer transition flex items-center gap-1.5 ${activeTab === 'ledger' ? 'border-amber-600 text-amber-900 font-extrabold' : 'border-transparent hover:text-slate-900'}`}
          >
            <Ticket className="w-4 h-4" />
            <span>Live Audit Ledger ({activeCampaignTicketCount} active)</span>
          </button>

          <button
            onClick={() => setActiveTab('winner-draw')}
            className={`pb-3 px-2 border-b-2 cursor-pointer transition flex items-center gap-1.5 ${activeTab === 'winner-draw' ? 'border-amber-600 text-amber-900 font-extrabold' : 'border-transparent hover:text-slate-900'}`}
          >
            <Trophy className="w-4 h-4 text-amber-600" />
            <span>Winner results</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-[#fafaf8]">
          
          {/* TAB 1: Search & Track */}
          {activeTab === 'tracker' && (
            <div className="space-y-5">
              
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Search by Mobile Number, WhatsApp, Ticket Number (TK-...), Order ID, or Community:
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. 9849012345 or TK-DIWALI-2026 or My Home Bhooja"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-amber-600 bg-white"
                  />
                </div>
              </div>

              {/* Results */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Found {filteredTickets.length} matched entry(ies)</span>
                  <span className="text-emerald-700 font-medium">All entries backed by bank & order logs</span>
                </div>

                {filteredTickets.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-2xl border border-slate-200">
                    <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-600 font-medium">No raffle tickets found matching "{searchQuery}"</p>
                    <p className="text-[11px] text-slate-400 mt-1">Make sure you entered your registered 10-digit mobile number or exact ticket ID.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredTickets.map((t) => (
                      <div key={t.ticketNumber} className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-2xs relative flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] text-amber-800 uppercase tracking-wider font-extrabold block">
                              Official Raffle Entry
                            </span>
                            <span className="font-mono text-base font-extrabold text-amber-950">
                              {t.ticketNumber}
                            </span>
                          </div>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded-full">
                            {t.status}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-slate-600">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Buyer Name:</span>
                            <span className="font-semibold text-slate-800">{t.customerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Mobile / WhatsApp:</span>
                            <span className="font-mono font-medium text-slate-800">{t.mobileNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Community / Hub:</span>
                            <span className="font-medium text-slate-800 truncate max-w-[180px]">{t.communityApartment}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Order ID:</span>
                            <span className="font-mono text-slate-700">{t.orderId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Prize Asset:</span>
                            <span className="font-semibold text-amber-900">{t.raffleItemName || prizeName}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-mono">{t.bookingTimestamp}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(t.ticketNumber)}
                            className="text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            {copiedTicket === t.ticketNumber ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy ID</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: Live Audit Ledger */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Section 8 Statutory Non-Profit Audit Ledger:</strong> Every lucky draw ticket generated through our platform is permanently indexed with the donor's contact details, transaction hash, and Hyderabad community. 
                  This public audit sheet ensures zero duplication and provably fair selection on Diwali Night.
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Ticket Number</th>
                      <th className="py-3 px-4">Donor Name</th>
                      <th className="py-3 px-4">Community & Area</th>
                      <th className="py-3 px-4">Order Ref</th>
                      <th className="py-3 px-4">Txn Ref</th>
                      <th className="py-3 px-4">Draw Date</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tickets.map((t) => (
                      <tr key={t.ticketNumber} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-mono font-bold text-amber-900 whitespace-nowrap">{t.ticketNumber}</td>
                        <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">{t.customerName}</td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{t.communityApartment}</td>
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{t.orderId}</td>
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{t.transactionId}</td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{t.drawDate}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Public winner result */}
          {activeTab === 'winner-draw' && (
            <div className="space-y-6 text-center py-4">
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-xl font-bold font-serif text-slate-900">
                  Official campaign result
                </h3>
                <p className="text-xs text-slate-600">
                  Each valid purchased ticket is a separate entry. Buyers with multiple tickets have proportionally higher odds.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/15 via-rose-500/15 to-amber-500/15 border-2 border-amber-400 max-w-lg mx-auto shadow-md">
                <div className="text-xs uppercase font-extrabold text-amber-900 tracking-wider mb-2">
                  {prizeName} Draw Candidate
                </div>

                {simulatedWinner ? (
                  <div className="space-y-3">
                    <div className="font-mono text-2xl font-black text-amber-950 bg-white py-3 px-4 rounded-xl border border-amber-300 shadow-inner">
                      {simulatedWinner.ticketNumber}
                    </div>
                    <div className="text-xs text-slate-700 space-y-1">
                      <p>Winner: <strong>{simulatedWinner.customerName}</strong></p>
                      <p className="text-[10px] text-slate-500">Draw date: {campaigns.find(campaign => campaign.campaignId === selectedCampaignId)?.draw?.drawnAt || campaigns.find(campaign => campaign.campaignId === selectedCampaignId)?.drawDate}</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-slate-500 text-xs">
                    This campaign has not been drawn yet. The public result will appear here after the administrator completes the official draw.
                  </div>
                )}

              </div>

              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                Winner name and winning ticket are public. Personal contact and order information are kept private.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
