import React, { useState } from 'react';
import { WelfareProduct } from '../types';
import { 
  Sparkles, 
  Flame, 
  Smartphone, 
  ShieldAlert, 
  Check, 
  Plus, 
  ShoppingBag, 
  Gift, 
  Ticket, 
  CheckCircle2, 
  Info,
  Clock,
  ArrowRight,
  Heart
} from 'lucide-react';

interface DiwaliDhamakaSectionProps {
  product: WelfareProduct | null;
  onAddToCart: (product: WelfareProduct, includeIphoneTicket?: boolean, iphoneTicketCount?: number) => void;
  onOpenWhatsApp: (customMsg?: string) => void;
  onOpenDonate: () => void;
  onAddStandaloneRaffleTicket: (count: number, campaignId: string) => void;
  onOpenRaffleAudit?: () => void;
}

export const DiwaliDhamakaSection: React.FC<DiwaliDhamakaSectionProps> = ({
  product,
  onAddToCart,
  onOpenWhatsApp,
  onOpenDonate,
  onAddStandaloneRaffleTicket,
  onOpenRaffleAudit
}) => {
  const crackerProduct = product;
  const raffle = crackerProduct?.raffle;
  const ticketPrice = raffle?.enabled ? raffle.ticketPrice : 0;
  
  const [includeIphoneTicket, setIncludeIphoneTicket] = useState(true);
  const [ticketCount, setTicketCount] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [standaloneTicketCount, setStandaloneTicketCount] = useState(1);
  const [ticketAnimation, setTicketAnimation] = useState(false);

  if (!crackerProduct) return null;

  const totalPrice = crackerProduct.price + (includeIphoneTicket && raffle?.enabled ? ticketCount * ticketPrice : 0);

  const handleAddPackToCart = () => {
    onAddToCart(crackerProduct, includeIphoneTicket && Boolean(raffle?.enabled), includeIphoneTicket && raffle?.enabled ? ticketCount : 0);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const handleBuyStandaloneTicket = () => {
    if (!raffle?.enabled) return;
    onAddStandaloneRaffleTicket(standaloneTicketCount, raffle.campaignId);
    setTicketAnimation(true);
    setTimeout(() => setTicketAnimation(false), 2000);
  };

  return (
    <section id="diwali-special" className="relative py-14 sm:py-20 bg-gradient-to-b from-[#0a331f] via-[#08291c] to-[#041a13] text-white overflow-hidden border-y-2 border-amber-500/40">
      {/* Decorative festive lanterns & sparkles backdrop */}
      <div className="absolute top-0 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Festive Header Banner */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 shadow-lg">
            <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>Diwali Welfare Special • Bring Light to Remote Villages</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-serif text-white leading-tight">
            {crackerProduct.name} <span className="text-amber-400 font-mono">₹{crackerProduct.price.toLocaleString('en-IN')}</span>
          </h2>
          
          <p className="mt-3 text-sm sm:text-base text-amber-100/80 max-w-2xl mx-auto">
            {crackerProduct.description} Net welfare contribution: <strong className="text-amber-300">₹{crackerProduct.profitToCause.toLocaleString('en-IN')}</strong> per item.
          </p>

          {raffle?.enabled && <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md animate-pulse">
            <Smartphone className="w-4 h-4" />
            <span>Optional ₹{ticketPrice.toLocaleString('en-IN')} entry to win {raffle.itemName}</span>
          </div>}
        </div>

        {/* Product & Raffle Dual Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: The Diwali Crackers Family Pack Card (₹2,000) */}
          <div className="lg:col-span-7 bg-white/5 backdrop-blur-md rounded-3xl border border-amber-500/30 p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
              Bestseller • 35+ Items
            </div>

            <div>
              <div className="flex flex-col sm:flex-row gap-6 mb-6">
                <div className="relative w-full sm:w-52 h-52 rounded-2xl overflow-hidden bg-slate-900 shrink-0 border border-amber-500/30 shadow-md">
                  <img 
                    src={crackerProduct.image} 
                    alt={crackerProduct.name}
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 text-center text-[10px] font-bold text-amber-300 bg-black/70 backdrop-blur-xs py-1 rounded-lg">
                    Green Low-Emission Certified
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold font-serif text-white">
                    {crackerProduct.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-amber-400 font-mono">₹{crackerProduct.price.toLocaleString('en-IN')}</span>
                    {crackerProduct.originalPrice && crackerProduct.originalPrice > crackerProduct.price && <span className="text-xs text-slate-400 line-through">MRP ₹{crackerProduct.originalPrice.toLocaleString('en-IN')}</span>}
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-emerald-950/70 border border-emerald-600/50 text-xs text-emerald-200 flex items-start gap-2">
                    <Heart className="w-4 h-4 fill-emerald-400 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-semibold">Welfare contribution: ₹{crackerProduct.profitToCause.toLocaleString('en-IN')}</strong>
                      {crackerProduct.impactNote}
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-amber-200/70 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Item purchase has <strong>no 80G tax deduction</strong>; profits fund village aid.</span>
                  </div>
                </div>
              </div>

              {/* Items included in the ₹2000 pack */}
              <div className="bg-slate-900/60 rounded-2xl p-4 border border-amber-500/20 mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>What's Inside The Mega 35+ Items Family Box:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
                  {crackerProduct.itemsIncluded?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional iPhone Ticket Add-On Checkbox */}
              {raffle?.enabled && <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-amber-500/15 border-2 border-amber-400/50 mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeIphoneTicket}
                    onChange={(e) => setIncludeIphoneTicket(e.target.checked)}
                    className="w-5 h-5 rounded mt-0.5 accent-amber-500 text-slate-950 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="text-sm font-extrabold text-amber-300 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-white" />
                        Add {raffle.itemName} raffle ticket (+₹{ticketPrice.toLocaleString('en-IN')})
                      </span>
                      <span className="text-xs font-bold text-white bg-rose-600 px-2 py-0.5 rounded-full uppercase">
                        Diwali Grand Prize
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-snug">
                      Enter the draw to win <strong>{raffle.itemName}</strong> (declared value ₹{raffle.itemPrice.toLocaleString('en-IN')}). {crackerProduct.impactNote}
                    </p>

                    {includeIphoneTicket && (
                      <div className="mt-3 pt-2.5 border-t border-amber-500/30 flex items-center justify-between text-xs">
                        <span className="text-slate-300">Number of iPhone Tickets:</span>
                        <div className="flex items-center gap-2">
                          {[1, 2, 5].map((cnt) => (
                            <button
                              key={cnt}
                              type="button"
                              onClick={() => setTicketCount(cnt)}
                              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                                ticketCount === cnt
                                  ? 'bg-amber-400 text-slate-950 font-black'
                                  : 'bg-white/10 text-white hover:bg-white/20'
                              }`}
                            >
                              {cnt} {cnt === 1 ? 'ticket' : 'tickets'} (+₹{(cnt * ticketPrice).toLocaleString('en-IN')})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              </div>}
            </div>

            {/* Cart Button with calculated combined total */}
            <div>
              <div className="flex justify-between items-baseline mb-2 text-xs">
                <span className="text-slate-400">Total payable for Cracker Pack + Tickets:</span>
                <span className="text-2xl font-black text-amber-300 font-mono">
                  ₹{totalPrice.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleAddPackToCart}
                  className={`py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
                    addedAnimation
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950'
                  }`}
                >
                  {addedAnimation ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Pack Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      <span>Add to Cart (₹{totalPrice})</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onOpenWhatsApp(`I would like to order ${crackerProduct.name} (₹${crackerProduct.price})${includeIphoneTicket && raffle?.enabled ? ` + ${ticketCount} raffle tickets for ${raffle.itemName} (₹${ticketCount * ticketPrice})` : ''}. Total: ₹${totalPrice}. Please confirm payment and dispatch.`)}
                  className="py-3.5 px-4 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Order Directly on WhatsApp</span>
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Dedicated iPhone Lucky Draw Ticket Card (₹399 Standalone or Multi) with Real iPhone Photo */}
          {raffle?.enabled && <div className="lg:col-span-5 bg-gradient-to-br from-amber-900/40 via-purple-950/50 to-slate-900/90 backdrop-blur-md rounded-3xl border-2 border-amber-400/60 p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative">
            <div className="absolute -top-3.5 left-6 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-lg flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Diwali Bumper Charity Raffle
            </div>

            <div>
              {/* Prize Showcase Graphic with Real iPhone Photo */}
              <div className="relative mb-5 pt-2 rounded-2xl overflow-hidden border border-amber-400/40 bg-black/60 shadow-lg group">
                <div className="relative h-48 w-full overflow-hidden">
                  <img 
                    src={raffle.itemImage}
                    alt={raffle.itemName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-amber-400" />
                    <span>Real Prize Asset</span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-amber-300 block">
                        Official Diwali Lucky Draw
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-white font-serif tracking-tight drop-shadow">
                        {raffle.itemName}
                      </h3>
                      <span className="text-xs text-rose-300 font-semibold drop-shadow">
                        Brand New Factory Sealed Box
                      </span>
                    </div>

                    <div className="bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg shadow font-mono">
                      ₹{ticketPrice.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Price & Rules */}
              <div className="bg-black/40 rounded-2xl p-4 border border-amber-500/30 mb-5">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs text-slate-300 font-medium">Entry Ticket Price:</span>
                  <div className="text-right">
                    <span className="text-3xl font-black text-amber-300 font-mono">₹{ticketPrice.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-400 block">per raffle entry</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300 pt-3 border-t border-slate-700/60">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Each ticket supports the seller&apos;s listed welfare contribution.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Official digital ticket number issued instantly with verification code.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Live public draw on Diwali Night (Streamed transparently on website).</span>
                  </div>
                </div>
              </div>

              {/* Select Number of Standalone Tickets */}
              <div className="mb-5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Select Number of Lucky Draw Tickets:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setStandaloneTicketCount(num)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        standaloneTicketCount === num
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                      }`}
                    >
                      {num} {num === 1 ? 'Entry' : 'Entries'}
                      <span className="block text-[10px] opacity-80">₹{(num * ticketPrice).toLocaleString('en-IN')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sample Ticket Preview */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/40 text-xs text-amber-200/90 font-mono flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-400/80 block uppercase">Sample Entry Ticket:</span>
                  <span className="font-bold text-white text-sm">Issued uniquely after checkout</span>
                </div>
                <Ticket className="w-6 h-6 text-amber-400" />
              </div>
            </div>

            {/* Standalone Ticket Buy Button */}
            <div className="mt-6 pt-4 border-t border-slate-700/60">
              <button
                onClick={handleBuyStandaloneTicket}
                className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm transition-all duration-200 cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
                  ticketAnimation
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white'
                }`}
              >
                {ticketAnimation ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>{standaloneTicketCount} Ticket(s) Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <Ticket className="w-5 h-5" />
                    <span>Get {standaloneTicketCount} raffle ticket(s) for ₹{(standaloneTicketCount * ticketPrice).toLocaleString('en-IN')}</span>
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-slate-400 mt-2">
                Prize: {raffle.itemName} • Draw: {raffle.drawDate}
              </p>

              {onOpenRaffleAudit && (
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={onOpenRaffleAudit}
                    className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-white underline decoration-amber-400/60 font-medium cursor-pointer"
                  >
                    <span>🎟️ View Registered Lucky Draw Ledger & Winner Audit</span>
                  </button>
                </div>
              )}
            </div>

          </div>}

        </div>

      </div>
    </section>
  );
};
