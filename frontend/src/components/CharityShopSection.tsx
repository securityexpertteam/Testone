import React, { useState } from 'react';
import { WelfareProduct } from '../types';
import { 
  ShoppingBag, 
  Sparkles, 
  Heart, 
  Check, 
  MessageCircle, 
  Plus, 
  ShieldAlert,
  Smartphone,
  Flame
} from 'lucide-react';

interface CharityShopSectionProps {
  products: WelfareProduct[];
  onAddToCart: (product: WelfareProduct, includeIphoneTicket?: boolean, iphoneTicketCount?: number) => void;
  onOpenWhatsApp: (product?: WelfareProduct) => void;
  onOpenDonate: () => void;
}

export const CharityShopSection: React.FC<CharityShopSectionProps> = ({
  products,
  onAddToCart,
  onOpenWhatsApp,
  onOpenDonate
}) => {
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [crackerIphoneAddon, setCrackerIphoneAddon] = useState<boolean>(true);
  const [raffleTicketCount, setRaffleTicketCount] = useState(1);

  const filteredProducts = products;

  const handleAdd = (product: WelfareProduct) => {
    const withRaffle = Boolean(product.raffle?.enabled && crackerIphoneAddon);
    onAddToCart(product, withRaffle, withRaffle ? raffleTicketCount : 0);
    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId(null);
    }, 1500);
  };

  return (
    <section id="shop-goods" className="scroll-mt-20 border-t border-emerald-950/5 bg-[#f2f9f6] py-16 sm:py-20">
      <div className="mx-auto w-full max-w-none px-[32px]">
        
        {/* Section Heading & Context */}
        <div className="mx-auto mb-9 max-w-3xl text-center sm:mb-12">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-900/10 bg-white/65 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-900 shadow-sm backdrop-blur">
            <ShoppingBag className="h-3.5 w-3.5 text-amber-700" />
            Welfare goods shop
          </div>
          <h2 className="text-4xl font-medium leading-tight tracking-tight text-[#173f38] sm:text-5xl">
            Shop goods that give back
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#58736c] sm:text-base">
            Explore the live catalogue and choose useful goods that support the work in remote villages.
          </p>
        </div>

        {/* Mandatory Tax Clarification Callout Box */}
        <div className="mx-auto mb-9 flex max-w-4xl flex-col items-start justify-between gap-4 rounded-[1.5rem] border border-amber-900/10 bg-white/55 p-4 shadow-sm backdrop-blur-xl sm:mb-10 sm:flex-row sm:items-center sm:p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 sm:mt-0">
              <ShieldAlert className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h4 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#4b3b1d]">
                <span>Important Tax Exemption Clarification</span>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                  No 80G on Purchases
                </span>
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-[#6c5a36] sm:text-sm">
                As per Indian Income Tax regulations, <strong>commercial product purchases (including Diwali Crackers) are NOT eligible for Section 80G tax exemption certificates</strong>. 
                However, 100% of the net profits generated from these goods directly fund our mobile medical clinics and school kits.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenDonate}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-900/15 bg-white/70 px-4 py-2.5 text-xs font-semibold text-emerald-900 shadow-sm transition hover:bg-white cursor-pointer"
          >
            <span>Need 80G Tax Exemption?</span>
            <span className="underline">Donate Direct</span>
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),520px))] justify-center gap-5 sm:gap-6">
          {filteredProducts.map((product) => {
            const isAdded = addedProductId === product.id;
            const isDiwali = product.category === 'diwali-crackers';
            const hasRaffle = Boolean(product.raffle?.enabled);
            const ticketPrice = product.raffle?.ticketPrice || 0;

            return (
              <div 
                key={product.id}
                className={`flex flex-col justify-between overflow-hidden rounded-[1.8rem] border bg-white/70 p-2 shadow-[0_14px_40px_-30px_rgba(23,63,56,0.3)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/90 hover:shadow-[0_22px_54px_-30px_rgba(23,63,56,0.27)] ${
                  isDiwali ? 'border-amber-300/80' : 'border-white/80'
                }`}
              >
                <div>
                  {/* Image Container with Badges */}
                  <div className="relative h-48 w-full overflow-hidden rounded-[1.35rem] bg-emerald-50 sm:h-56">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />

                    {/* Badge: Profit to Cause */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/60 bg-amber-300/95 px-2.5 py-1 text-[10px] font-bold text-amber-950 shadow-sm sm:text-xs">
                        <Sparkles className="w-3.5 h-3.5 fill-amber-700 text-amber-800" />
                        ₹{product.profitToCause} Profit to {product.causeSupported === 'education' ? 'Schools' : 'Clinics'}
                      </span>
                    </div>

                    {/* Badge: No 80G Warning */}
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-[9px] font-semibold text-slate-700 shadow-sm backdrop-blur-md sm:text-[10px]">
                        No 80G Tax Credit
                      </span>
                    </div>

                    {isDiwali && (
                      <div className="absolute bottom-2 left-3 right-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-slate-950 bg-amber-400 px-2.5 py-0.5 rounded-lg shadow">
                          <Flame className="w-3 h-3 text-red-600" />
                          Diwali Bumper Special • 35+ Green Fireworks
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="px-3 pb-3 pt-4 sm:px-4 sm:pb-4">
                    <h3 className="text-xl font-medium leading-tight text-[#173f38] transition-colors group-hover:text-emerald-800 sm:text-2xl">
                      {product.name}
                    </h3>
                    {product.description?.trim() && product.description.trim().toLowerCase() !== product.name.trim().toLowerCase() && (
                      <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">{product.description}</p>
                    )}

                    {/* Direct Impact Callout */}
                    {product.impactNote?.trim() && (
                      <div className="mt-4 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-xs text-emerald-900 flex items-start gap-2">
                        <Heart className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="font-medium">{product.impactNote}</span>
                      </div>
                    )}

                    {/* If Diwali item, show optional iPhone toggle */}
                    {hasRaffle && (
                      <div className="mt-4 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-orange-50/60 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={crackerIphoneAddon}
                            onChange={(e) => setCrackerIphoneAddon(e.target.checked)}
                            className="w-4 h-4 rounded mt-0.5 accent-amber-600 cursor-pointer"
                          />
                          <div className="text-xs">
                            <span className="font-extrabold text-amber-950 flex items-center gap-1">
                              <Smartphone className="w-3.5 h-3.5 text-amber-800" />
                              Add {product.raffle?.itemName} raffle ticket (+₹{ticketPrice.toLocaleString('en-IN')})
                            </span>
                            <span className="text-[11px] text-amber-900/80 block mt-0.5">
                              Prize value ₹{product.raffle?.itemPrice.toLocaleString('en-IN')}; draw date: {product.raffle?.drawDate}.
                            </span>
                            <select aria-label="Raffle ticket quantity" value={raffleTicketCount} onChange={(event) => setRaffleTicketCount(Number(event.target.value))} className="mt-2 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-950 shadow-sm outline-none focus:ring-2 focus:ring-amber-300">
                              {[1, 2, 5, 10].map(count => <option key={count} value={count}>{count} ticket{count === 1 ? '' : 's'}</option>)}
                            </select>
                          </div>
                        </label>
                      </div>
                    )}

                    {/* Price and Profit Margin breakdown */}
                    <div className="mt-4 flex items-end justify-between gap-2 border-t border-emerald-950/5 pt-3">
                      <div>
                        <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-[#173f38]">
                          ₹{(product.price + (hasRaffle && crackerIphoneAddon ? raffleTicketCount * ticketPrice : 0)).toLocaleString('en-IN')}
                        </span>
                        {Number(product.originalPrice) > product.price && <span className="text-xs text-slate-400 line-through">₹{product.originalPrice?.toLocaleString('en-IN')}</span>}
                        </div>
                        <span className="text-xs text-slate-500 ml-1.5">
                          Product ₹{product.price.toLocaleString('en-IN')}{hasRaffle && crackerIphoneAddon ? ` + ${raffleTicketCount} raffle ticket${raffleTicketCount === 1 ? '' : 's'} ₹${(raffleTicketCount * ticketPrice).toLocaleString('en-IN')}` : ' · taxes included'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 block">Charity Net Profit:</span>
                        <span className="text-xs font-bold text-emerald-700">₹{product.profitToCause}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions: Add to Cart and WhatsApp Order */}
                <div className="space-y-2 px-3 pb-3 sm:px-4 sm:pb-4">
                  <button
                    onClick={() => handleAdd(product)}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 cursor-pointer shadow-sm ${
                      isAdded 
                        ? 'bg-emerald-600 text-white' 
                        : isDiwali
                        ? 'bg-[#174c40] text-white hover:bg-[#103d33]'
                        : 'bg-[#174c40] text-white hover:bg-[#103d33]'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>
                          {hasRaffle && crackerIphoneAddon ? `Add product + ${raffleTicketCount} raffle ticket${raffleTicketCount === 1 ? '' : 's'}` : 'Add to Cart'}
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onOpenWhatsApp(product)}
                    className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full border border-emerald-900/10 bg-white/70 px-3 py-2 text-xs font-semibold text-[#315c53] transition hover:border-emerald-800/20 hover:bg-white cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Order / Inquire on WhatsApp</span>
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
