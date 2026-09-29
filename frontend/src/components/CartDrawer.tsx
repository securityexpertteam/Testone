import React, { useState } from 'react';
import { CartItem, WelfareProduct } from '../types';
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  Sparkles, 
  ShieldAlert, 
  MessageCircle, 
  Lock, 
  ArrowRight,
  Heart,
  CheckCircle2
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  iphoneTicketsCount: number;
  raffleTicketPrice: number;
  raffleItemName: string;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onUpdateIphoneTickets: (count: number) => void;
  onOpenWhatsApp: (itemsSummary?: string) => void;
  onOpenDonate: () => void;
  onProceedToBooking: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  iphoneTicketsCount,
  raffleTicketPrice,
  raffleItemName,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onUpdateIphoneTickets,
  onOpenWhatsApp,
  onOpenDonate,
  onProceedToBooking
}) => {
  const [extraDonation, setExtraDonation] = useState<number>(0);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  if (!isOpen) return null;

  const itemsTotal = cartItems.reduce((acc, item) => acc + (item.product.discountPrice && item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price) * item.quantity, 0);
  const iphoneTotal = iphoneTicketsCount * raffleTicketPrice;
  const totalProfit = cartItems.reduce((acc, item) => acc + item.product.profitToCause * item.quantity, 0) + iphoneTotal;
  const grandTotal = itemsTotal + iphoneTotal + extraDonation;

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onProceedToBooking();
  };

  const handleWhatsAppCheckout = () => {
    const summary = cartItems.map(i => `${i.product.name} (Qty: ${i.quantity}) - ₹${i.product.price * i.quantity}`).join('\n');
    const raffleSummary = iphoneTicketsCount > 0 ? `\n• ${raffleItemName}: ${iphoneTicketsCount} ticket(s) - ₹${iphoneTotal}` : '';
    const fullMsg = `Hello Akshaya Patra Welfare,\nI would like to order the following goods:\n${summary}${raffleSummary}\nTotal: ₹${grandTotal}\n${extraDonation > 0 ? `Extra Direct Donation: ₹${extraDonation}\n` : ''}Net Profit to Villages: ₹${totalProfit}\nPlease confirm shipping and ticket confirmation.`;
    onOpenWhatsApp(fullMsg);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Welfare Goods Cart
                </h3>
                <p className="text-xs text-slate-500">
                  {cartItems.reduce((sum, i) => sum + i.quantity, 0)} item(s) selected
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mandatory Tax Alert Box in Cart */}
          <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <strong className="font-semibold">Notice:</strong> Product purchases are <strong>NOT eligible for 80G tax exemptions</strong>. 100% of profit margins (₹{totalProfit}) directly fund village clinics & schools.
            </div>
          </div>

          {/* Main Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {checkoutStep === 'cart' && (
              <>
                {cartItems.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h4 className="text-base font-bold text-slate-700 font-serif">Your Cart is Empty</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-6">
                      Explore our handwoven shawls, raw forest honey, or direct student care packs to support remote villages.
                    </p>
                    <button
                      onClick={onClose}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-xs"
                    >
                      Browse Welfare Goods
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div 
                        key={item.product.id}
                        className="flex gap-3.5 p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs"
                      >
                        <img 
                          src={item.product.image} 
                          alt={item.product.name}
                          className="w-18 h-18 rounded-xl object-cover bg-slate-100 shrink-0" 
                        />
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-bold text-slate-900 truncate pr-2">
                                {item.product.name}
                              </h4>
                              <button
                                onClick={() => onRemoveItem(item.product.id)}
                                className="text-slate-400 hover:text-rose-600 transition p-0.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
                              ₹{item.product.profitToCause * item.quantity} profit to {item.product.causeSupported}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                            <span className="text-sm font-extrabold text-slate-900 font-mono">
                              ₹{(item.product.discountPrice && item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price) * item.quantity}
                            </span>

                            <span className="text-xs font-bold text-slate-600">One physical item per order</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Optional iPhone Lucky Draw Ticket Add-on */}
                    <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-400/50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="text-xl">📱</span>
                          <div>
                            <h5 className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                              <span>{raffleItemName} Raffle Ticket</span>
                              <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-black">
                                ₹{raffleTicketPrice.toLocaleString('en-IN')} / ticket
                              </span>
                            </h5>
                            <p className="text-[11px] text-amber-900/80 mt-0.5 leading-snug">
                              Purchase a ticket for the raffle prize configured for this product.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 border border-amber-400 bg-white rounded-lg p-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onUpdateIphoneTickets(Math.max(0, iphoneTicketsCount - 1))}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-700 hover:bg-amber-50 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-amber-950 px-1 font-mono">
                            {iphoneTicketsCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateIphoneTickets(iphoneTicketsCount + 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-700 hover:bg-amber-50 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {iphoneTicketsCount > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-amber-300/60 flex items-center justify-between text-xs text-amber-950 font-semibold">
                          <span>{iphoneTicketsCount} Raffle Ticket(s) Added:</span>
                          <span className="font-mono text-sm font-bold text-amber-900">+₹{iphoneTotal}</span>
                        </div>
                      )}
                    </div>

                    {/* Optional Direct 80G Tax-Exempt Donation Add-on */}
                    <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <div className="flex items-start gap-2.5">
                        <Heart className="w-4 h-4 fill-emerald-600 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-xs font-bold text-emerald-950">
                            Add a Direct Tax-Exempt Donation?
                          </h5>
                          <p className="text-[11px] text-emerald-800/80 mt-0.5 leading-snug">
                            This direct amount is <strong>eligible for Section 80G tax deduction</strong> and will be added to your receipt.
                          </p>

                          <div className="flex gap-2 mt-2.5">
                            {[0, 100, 250, 500].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setExtraDonation(val)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border cursor-pointer ${
                                  extraDonation === val
                                    ? 'bg-emerald-800 text-white border-emerald-800'
                                    : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                                }`}
                              >
                                {val === 0 ? 'None' : `+₹${val}`}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {checkoutStep === 'checkout' && (
              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900 font-serif">Delivery & Contact Details</h4>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('cart')}
                    className="text-xs text-slate-500 hover:underline"
                  >
                    Back to Cart
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ananya Sharma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">WhatsApp / Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Shipping Address (PIN required) *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="House/Flat No., Apartment, Street, City, State, PIN code"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-600"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Goods Subtotal:</span>
                    <span>₹{itemsTotal}</span>
                  </div>
                  {iphoneTicketsCount > 0 && (
                    <div className="flex justify-between text-amber-900 font-semibold">
                      <span>{raffleItemName} Raffle ({iphoneTicketsCount} ticket{iphoneTicketsCount > 1 ? 's' : ''}):</span>
                      <span>+₹{iphoneTotal}</span>
                    </div>
                  )}
                  {extraDonation > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Direct 80G Donation:</span>
                      <span>+₹{extraDonation}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                    <span>Payable Total:</span>
                    <span className="font-mono">₹{grandTotal}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm shadow cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-4 h-4" />
                  <span>Confirm Order (Pay on Delivery / UPI)</span>
                </button>
              </form>
            )}

            {checkoutStep === 'success' && (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 font-serif">Order Received with Gratitude!</h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                  Thank you, <strong>{customerName}</strong>! Your order will be dispatched within 48 hours. 
                  ₹<strong>{totalProfit}</strong> in net proceeds has been credited to our remote village healthcare and education fund.
                </p>

                {iphoneTicketsCount > 0 && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-amber-500/15 border-2 border-amber-400 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase text-amber-950 flex items-center gap-1">
                        <span>{raffleItemName} Raffle Entries</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 mb-2">
                      Official ticket numbers are issued by the Mongo-backed checkout after order confirmation.
                    </p>
                  </div>
                )}

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left space-y-1.5">
                  <p className="text-slate-500">Order Reference: <strong className="text-slate-900 font-mono">Issued by the checkout service</strong></p>
                  <p className="text-slate-500">Shipping to: <span className="text-slate-800">{deliveryAddress}</span></p>
                  <p className="text-amber-800 text-[11px] font-medium pt-1">
                    * Confirmation and dispatch tracking will be shared on {customerPhone}.
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => {
                      onClearCart();
                      onUpdateIphoneTickets(0);
                      setCheckoutStep('cart');
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
                  >
                    Close & Return to Home
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cart Bottom Summary & CTAs */}
          {(cartItems.length > 0 || iphoneTicketsCount > 0) && checkoutStep === 'cart' && (
            <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
              {/* Financial & Social Impact Summary */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Goods Subtotal (No 80G):</span>
                  <span className="font-mono font-medium">₹{itemsTotal}</span>
                </div>
                {iphoneTicketsCount > 0 && (
                  <div className="flex justify-between text-amber-900 font-medium">
                    <span>{raffleItemName} Raffle ({iphoneTicketsCount} ticket{iphoneTicketsCount > 1 ? 's' : ''}):</span>
                    <span className="font-mono font-bold">₹{iphoneTotal}</span>
                  </div>
                )}
                {extraDonation > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Direct 80G Donation:</span>
                    <span className="font-mono">₹{extraDonation}</span>
                  </div>
                )}
                <div className="flex justify-between text-emerald-800 bg-emerald-100/60 p-2 rounded-lg font-bold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Net Profit Directly to Aid:
                  </span>
                  <span className="font-mono">₹{totalProfit + extraDonation}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span className="font-mono">₹{grandTotal}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={onProceedToBooking}
                  className="w-full py-3.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm shadow cursor-pointer transition flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Proceed to Delivery & Payment</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <button
                  onClick={handleWhatsAppCheckout}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Complete Order on WhatsApp</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
