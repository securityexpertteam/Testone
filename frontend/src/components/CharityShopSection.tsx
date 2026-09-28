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
    <section id="shop-goods" className="py-16 sm:py-24 bg-[#fafaf8] border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading & Context */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-3">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
            Diwali Welfare Special
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-serif">
            Diwali Crackers Family Pack
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600">
            Every item purchased here directly supports rural artisans while 100% of the net profit goes 
            straight into purchasing life-saving medicines and rural school books.
          </p>
        </div>

        {/* Mandatory Tax Clarification Callout Box */}
        <div className="max-w-4xl mx-auto mb-12 bg-amber-50/90 border border-amber-300 rounded-2xl p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <ShieldAlert className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <span>Important Tax Exemption Clarification</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded-full uppercase">
                  No 80G on Purchases
                </span>
              </h4>
              <p className="text-xs sm:text-sm text-amber-900/80 mt-1 leading-relaxed">
                As per Indian Income Tax regulations, <strong>commercial product purchases (including Diwali Crackers) are NOT eligible for Section 80G tax exemption certificates</strong>. 
                However, 100% of the net profits generated from these goods directly fund our mobile medical clinics and school kits.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenDonate}
            className="shrink-0 hidden md:inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-50 px-3 py-2 rounded-xl transition shadow-2xs cursor-pointer"
          >
            <span>Need 80G Tax Exemption?</span>
            <span className="underline">Donate Direct</span>
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredProducts.map((product) => {
            const isAdded = addedProductId === product.id;
            const isDiwali = product.category === 'diwali-crackers';
            const hasRaffle = Boolean(product.raffle?.enabled);
            const ticketPrice = product.raffle?.ticketPrice || 0;

            return (
              <div 
                key={product.id}
                className={`bg-white rounded-3xl border shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between group ${
                  isDiwali ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200/90'
                }`}
              >
                <div>
                  {/* Image Container with Badges */}
                  <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />

                    {/* Badge: Profit to Cause */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-amber-950 bg-amber-300 shadow-xs">
                        <Sparkles className="w-3.5 h-3.5 fill-amber-700 text-amber-800" />
                        ₹{product.profitToCause} Profit to {product.causeSupported === 'education' ? 'Schools' : 'Clinics'}
                      </span>
                    </div>

                    {/* Badge: No 80G Warning */}
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-700 bg-white/95 backdrop-blur-md shadow-2xs border border-slate-200">
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
                  <div className="p-5 sm:p-6">
                    <h3 className="text-lg font-bold text-slate-900 font-serif leading-snug group-hover:text-amber-700 transition-colors">
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
                      <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-300">
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
                            <select aria-label="Raffle ticket quantity" value={raffleTicketCount} onChange={(event) => setRaffleTicketCount(Number(event.target.value))} className="mt-2 rounded border border-amber-300 bg-white px-2 py-1">
                              {[1, 2, 5, 10].map(count => <option key={count} value={count}>{count} ticket{count === 1 ? '' : 's'}</option>)}
                            </select>
                          </div>
                        </label>
                      </div>
                    )}

                    {/* Price and Profit Margin breakdown */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-end justify-between gap-2">
                      <div>
                        <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-slate-900 font-mono">
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
                <div className="p-5 sm:p-6 pt-0 space-y-2">
                  <button
                    onClick={() => handleAdd(product)}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-150 cursor-pointer shadow-xs ${
                      isAdded 
                        ? 'bg-emerald-600 text-white' 
                        : isDiwali
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black'
                        : 'bg-amber-400 hover:bg-amber-500 text-slate-950'
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
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs transition cursor-pointer"
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
