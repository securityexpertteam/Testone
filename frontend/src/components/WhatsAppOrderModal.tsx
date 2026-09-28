import React, { useState, useEffect } from 'react';
import { WelfareProduct } from '../types';
import { HYDERABAD_COMMUNITIES, HYDERABAD_NODAL_POINTS } from '../data/hyderabadLocations';
import { 
  X, 
  MessageCircle, 
  Send, 
  CheckCircle2, 
  ShoppingBag, 
  Copy, 
  ExternalLink,
  Phone,
  MapPin,
  Sparkles,
  Building2,
  Heart,
  Truck,
  ShieldCheck,
  Check
} from 'lucide-react';

interface WhatsAppOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: WelfareProduct[];
  selectedProduct?: WelfareProduct | null;
  customMessage?: string;
}

export const WhatsAppOrderModal: React.FC<WhatsAppOrderModalProps> = ({
  isOpen,
  onClose,
  products,
  selectedProduct,
  customMessage,
}) => {
  // Inquiry Mode
  const [inquiryType, setInquiryType] = useState<'item' | 'bulk' | 'direct-donate'>('item');

  // Product & Order Selection
  const [selectedProdId, setSelectedProdId] = useState<string>(selectedProduct?.id || '');
  const [quantity] = useState<number>(1);
  const [includeLuckyDraw, setIncludeLuckyDraw] = useState<boolean>(true);
  const [luckyDrawTicketCount, setLuckyDrawTicketCount] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_DELIVERY' | 'UPI'>('CASH_ON_DELIVERY');

  // Customer Details
  const [fullName, setFullName] = useState<string>('');
  const [whatsAppNumber, setWhatsAppNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [alternatePhone, setAlternatePhone] = useState<string>('');

  // Delivery Address (Hyderabad Gated Communities & Nodal Points)
  const [houseFlatNumber, setHouseFlatNumber] = useState<string>('');
  const [streetAddress, setStreetAddress] = useState<string>('');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>(HYDERABAD_COMMUNITIES[0].id);
  const [areaLocality, setAreaLocality] = useState<string>(HYDERABAD_COMMUNITIES[0].area);
  const [pincode, setPincode] = useState<string>(HYDERABAD_COMMUNITIES[0].pincode);
  const [nearbyNodalPoint, setNearbyNodalPoint] = useState<string>(HYDERABAD_COMMUNITIES[0].defaultNodalPoint);
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>('');

  // Bulk / Direct Donation specific fields
  const [orgName, setOrgName] = useState<string>('');
  const [sponsorshipType, setSponsorshipType] = useState<string>('50 Student Learning Kits (₹22,500)');
  const [panNumber, setPanNumber] = useState<string>('');
  const [donationAmount, setDonationAmount] = useState<number>(5000);
  const [donationCause, setDonationCause] = useState<string>('Mid-Day Child Nutrition');

  // UI state
  const [copied, setCopied] = useState<boolean>(false);
  const [submittedOrder, setSubmittedOrder] = useState<{ finalMsg: string } | null>(null);

  // Sync selectedProduct if passed
  useEffect(() => {
    if (selectedProduct) {
      setSelectedProdId(selectedProduct.id);
    } else if (!selectedProdId && products.length > 0) {
      setSelectedProdId(products[0].id);
    }
  }, [selectedProduct, products, selectedProdId]);

  useEffect(() => {
    setIncludeLuckyDraw(Boolean(products.find(product => product.id === selectedProdId)?.raffle?.enabled));
  }, [selectedProdId, products]);

  if (!isOpen) return null;

  // Find active product
  const currentProduct = products.find((p) => p.id === selectedProdId);

  // Community selection auto-updates area, nodal hub & pincode
  const handleCommunityChange = (communityId: string) => {
    setSelectedCommunityId(communityId);
    const comm = HYDERABAD_COMMUNITIES.find(c => c.id === communityId);
    if (comm) {
      setAreaLocality(comm.area);
      setPincode(comm.pincode);
      setNearbyNodalPoint(comm.defaultNodalPoint);
    }
  };

  // Financial calculations
  const productSubtotal = (currentProduct?.price || 0) * quantity;
  const raffleTicketPrice = currentProduct?.raffle?.enabled ? currentProduct.raffle.ticketPrice : 0;
  const promotionFee = includeLuckyDraw ? (luckyDrawTicketCount * raffleTicketPrice) : 0;
  const grandTotal = productSubtotal + promotionFee;
  const profitDonationAmount = ((currentProduct?.profitToCause || 0) * quantity) + promotionFee;
  const estimatedMealsSupported = Math.max(2, Math.floor(profitDonationAmount / 25));

  // Build formatted WhatsApp message
  const buildWhatsAppMessage = () => {
    if (customMessage) return customMessage;

    if (inquiryType === 'item') {
      if (!currentProduct) return 'The product catalog is unavailable. Please try again after the backend reconnects.';
      return `*NAMASTE AKSHAYA PATRA WELFARE DESK* 🙏
*Request Type:* WhatsApp product inquiry (not a confirmed order)

*CUSTOMER DETAILS:*
• Name: ${fullName.trim() || '[My Full Name]'}
• WhatsApp: ${whatsAppNumber.trim() || '[WhatsApp Number]'}
• Email: ${email.trim() || '[Email ID]'}
${alternatePhone.trim() ? `• Alt Mobile: ${alternatePhone.trim()}\n` : ''}
*DELIVERY ADDRESS (HYDERABAD METRO):*
• House/Flat: ${houseFlatNumber.trim() || '[Flat / Villa No]'}
• Street/Tower: ${streetAddress.trim() || '[Tower / Block]'}
• Community: ${HYDERABAD_COMMUNITIES.find(c => c.id === selectedCommunityId)?.name || 'Hyderabad Community'}
• Area: ${areaLocality}, Hyderabad - ${pincode}
• Nearby Nodal Hub: ${nearbyNodalPoint}
${deliveryInstructions.trim() ? `• Delivery Note: ${deliveryInstructions.trim()}\n` : ''}
*ORDER ITEMS & SOCIAL IMPACT:*
• Item: ${currentProduct.name}
• Quantity: ${quantity} unit(s) @ ₹${currentProduct.price}
• Product Subtotal: ₹${productSubtotal}
${includeLuckyDraw && currentProduct?.raffle?.enabled ? `• Raffle request: ${luckyDrawTicketCount} ticket(s) for ${currentProduct.raffle.itemName} (+₹${promotionFee})\n• Official ticket numbers are issued only after secure checkout confirmation.\n` : ''}
*TOTAL PAYABLE:* ₹${grandTotal}
*PAYMENT METHOD:* ${paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash / UPI on Delivery (Doorstep)' : 'Instant UPI Transfer'}

*100% NON-PROFIT WELFARE PLEDGE:*
₹${profitDonationAmount} from this order sponsors ~${estimatedMealsSupported} hot midday meals for rural children (CSIR & Sec 8 Non-Profit Reg. U85300KA2021NPL).

Please confirm order dispatch and delivery ETA. Thank you!`;
    }

    if (inquiryType === 'bulk') {
      return `*NAMASTE AKSHAYA PATRA WELFARE DESK* 🙏
*SUBJECT: BULK SPONSORSHIP ENQUIRY*

• Contact Person: ${fullName || '[My Name]'}
• Organization / Society: ${orgName || '[Organization Name]'}
• WhatsApp: ${whatsAppNumber || '[WhatsApp Number]'}
• Email: ${email || '[Email]'}
• Sponsorship Package: ${sponsorshipType}
• Delivery / Distribution Region: ${areaLocality || 'Hyderabad / Telangana Rural'}
${panNumber ? `• PAN for 80G Receipt: ${panNumber.toUpperCase()}\n` : ''}
${deliveryInstructions ? `• Custom Requirements: ${deliveryInstructions}\n` : ''}
Please share official Section 8 proposal and 80G tax exemption certificates.`;
    }

    // Direct 80G Bank Wire
    return `*NAMASTE AKSHAYA PATRA WELFARE DESK* 🙏
*SUBJECT: DIRECT 80G DONATION / BANK WIRE ASSISTANCE*

• Donor Name: ${fullName || '[Donor Full Name]'}
• WhatsApp Number: ${whatsAppNumber || '[Mobile Number]'}
• Email: ${email || '[Email ID]'}
• PAN Number (for Form 10BE): ${panNumber.toUpperCase() || '[PAN Number]'}
• Intended Donation Amount: ₹${donationAmount.toLocaleString('en-IN')}
• Selected Cause: ${donationCause}

Kindly share official Section 8 Trust Bank Details (State Bank of India / HDFC) & UPI ID so I can complete the transfer and receive my instant 80G Tax Exemption Receipt.`;
  };

  const previewMessage = buildWhatsAppMessage();
  const officialDeskNumber = '919849028410'; // Official Hyderabad coordinator WhatsApp desk

  const handleCopy = () => {
    navigator.clipboard.writeText(submittedOrder ? submittedOrder.finalMsg : previewMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProcessAndSend = () => {
    // Basic validation
    if (!fullName.trim()) {
      alert('Please enter your Full Name.');
      return;
    }
    if (!whatsAppNumber.trim()) {
      alert('Please enter your WhatsApp Number.');
      return;
    }
    if (inquiryType === 'item' && (!houseFlatNumber.trim() || !streetAddress.trim())) {
      alert('Please enter your House/Flat number and Street address.');
      return;
    }

    if (inquiryType === 'item') {
      const inquiryMessage = buildWhatsAppMessage();
      setSubmittedOrder({ finalMsg: inquiryMessage });
      const waUrl = `https://api.whatsapp.com/send?phone=${officialDeskNumber}&text=${encodeURIComponent(inquiryMessage)}`;
      window.open(waUrl, '_blank');
    } else {
      // Bulk or Direct Donation
      const customMsg = buildWhatsAppMessage();
      const waUrl = `https://api.whatsapp.com/send?phone=${officialDeskNumber}&text=${encodeURIComponent(customMsg)}`;
      window.open(waUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#fafaf8] rounded-3xl shadow-2xl overflow-hidden my-auto border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* ======================================================== */}
        {/* HEADER: Clean Non-Profit Branding & WhatsApp Identity     */}
        {/* ======================================================== */}
        <div className="bg-[#0e4429] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#25D366] text-slate-950 flex items-center justify-center shrink-0 shadow-inner">
              <MessageCircle className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-serif">WhatsApp Order & Welfare Desk</h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-800 text-emerald-200 border border-emerald-700">
                  Instant Support
                </span>
              </div>
              <p className="text-xs text-emerald-200 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3 h-3 text-amber-300" />
                <span>Helpline: <strong className="text-white font-mono">+91 98490 28410</strong> (Hyderabad Coordinator Desk)</span>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* BODY: Order Form with Hyderabad Fields & Live Preview     */}
        {/* ======================================================== */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* WhatsApp inquiry confirmation */}
          {submittedOrder ? (
            <div className="p-6 bg-white rounded-2xl border border-emerald-200 text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900 font-serif">WhatsApp Inquiry Prepared</h4>
                <p className="text-xs text-slate-600 mt-1">
                  This is not a confirmed order and no raffle tickets have been issued. Complete authenticated checkout to record an order and receive official MongoDB ticket numbers.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <a
                  href={`https://api.whatsapp.com/send?phone=${officialDeskNumber}&text=${encodeURIComponent(submittedOrder.finalMsg)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Re-Open WhatsApp Conversation</span>
                </a>
                <button
                  onClick={() => {
                    setSubmittedOrder(null);
                    onClose();
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Close Desk
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Desk Mode Selector Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/70 rounded-2xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setInquiryType('item')}
                  className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    inquiryType === 'item' ? 'bg-white text-slate-950 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Order Goods</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInquiryType('bulk')}
                  className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    inquiryType === 'bulk' ? 'bg-white text-slate-950 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Bulk Kits</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInquiryType('direct-donate')}
                  className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    inquiryType === 'direct-donate' ? 'bg-white text-slate-950 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>80G Bank Wire</span>
                </button>
              </div>

              {/* ---------------------------------------------------- */}
              {/* SECTION A: PRODUCT & QUANTITY (FOR GOODS ORDER)      */}
              {/* ---------------------------------------------------- */}
              {inquiryType === 'item' && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
                      <span>1. Select Welfare Goods</span>
                    </span>
                    <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      100% Profits to Aid
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Select Product:</label>
                    <select
                      value={selectedProdId}
                      onChange={(e) => setSelectedProdId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-emerald-600"
                    >
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} (₹{prod.price}) - {prod.impactNote.split('.')[0]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Single physical item and subtotal */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <img 
                        src={currentProduct?.image || ''} 
                        alt={currentProduct?.name || 'Selected product'} 
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0" 
                      />
                      <div>
                        <p className="font-bold text-slate-900 text-xs line-clamp-1">{currentProduct?.name}</p>
                        <p className="text-[11px] text-slate-500">Unit Price: ₹{currentProduct?.price}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700">1 item per checkout</span>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500">Subtotal</p>
                        <p className="text-xs font-bold font-mono text-slate-900">₹{productSubtotal}</p>
                      </div>
                    </div>
                  </div>

                  {currentProduct?.raffle?.enabled && <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeLuckyDraw}
                          onChange={(e) => setIncludeLuckyDraw(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Include {currentProduct.raffle.itemName} raffle entry</span>
                        </span>
                      </label>
                      <span className="text-[11px] font-bold text-amber-900 font-mono">₹{currentProduct.raffle.ticketPrice.toLocaleString('en-IN')} / ticket</span>
                    </div>

                    {includeLuckyDraw && (
                      <div className="pl-6 flex items-center justify-between pt-1 border-t border-amber-200/60 text-xs">
                        <span className="text-amber-800 text-[11px]">Number of Registered Tickets:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setLuckyDrawTicketCount(Math.max(1, luckyDrawTicketCount - 1))}
                            className="w-6 h-6 rounded bg-white border border-amber-300 text-amber-900 font-bold flex items-center justify-center text-xs"
                          >
                            -
                          </button>
                          <span className="font-bold font-mono text-amber-950 text-xs w-4 text-center">{luckyDrawTicketCount}</span>
                          <button
                            type="button"
                            onClick={() => setLuckyDrawTicketCount(luckyDrawTicketCount + 1)}
                            className="w-6 h-6 rounded bg-white border border-amber-300 text-amber-900 font-bold flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                          <span className="font-mono font-bold text-amber-900 ml-1 text-xs">(+₹{promotionFee})</span>
                        </div>
                      </div>
                    )}
                  </div>}
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* SECTION B: CUSTOMER CONTACT DETAILS                  */}
              {/* ---------------------------------------------------- */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>2. Customer Details</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Chandra Varma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Mobile Number *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-semibold text-slate-500">+91</span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="98490 12345"
                        value={whatsAppNumber}
                        onChange={(e) => setWhatsAppNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-11 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-600 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="ramesh.varma@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Alternate Mobile Number</label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="94401 23456 (Optional)"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-600 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* SECTION C: HYDERABAD DELIVERY ADDRESS (FOR GOODS)    */}
              {/* ---------------------------------------------------- */}
              {inquiryType === 'item' && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    <span>3. Hyderabad Delivery Address & Nodal Hub</span>
                  </span>

                  {/* Community Dropdown (Major Hyderabad Communities) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hyderabad Gated Community / Apartment *
                    </label>
                    <select
                      value={selectedCommunityId}
                      onChange={(e) => handleCommunityChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-emerald-600"
                    >
                      {HYDERABAD_COMMUNITIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.area} (Pincode: {c.pincode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Flat / Villa / House No. *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tower 3, Flat 1204"
                        value={houseFlatNumber}
                        onChange={(e) => setHouseFlatNumber(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address / Block *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Block C, Phase 2"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-600"
                      />
                    </div>
                  </div>

                  {/* Nearby Nodal Hub Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nearest Hyderabad Logistics Nodal Hub *
                    </label>
                    <select
                      value={nearbyNodalPoint}
                      onChange={(e) => setNearbyNodalPoint(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-emerald-600"
                    >
                      {HYDERABAD_NODAL_POINTS.map((np) => (
                        <option key={np.id} value={np.name}>
                          {np.name} ({np.hubCode} - {np.zone} Zone)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Special Delivery Instructions</label>
                    <input
                      type="text"
                      placeholder="e.g. Leave with society security desk / Call before delivery"
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-600"
                    />
                  </div>

                  {/* Payment Mode Selector */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Payment Preference:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          paymentMethod === 'CASH_ON_DELIVERY'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Pay on Delivery (Doorstep Cash/UPI)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('UPI')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          paymentMethod === 'UPI'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Instant UPI QR (Direct Transfer)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* SECTION D: BULK / 80G SPECIFIC FORM FIELDS          */}
              {/* ---------------------------------------------------- */}
              {inquiryType === 'bulk' && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Bulk Community / Corporate Sponsorship</span>
                  </span>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Company / RWA Society Name</label>
                    <input
                      type="text"
                      placeholder="e.g. My Home Bhooja Residents Welfare Association"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sponsorship Package Requirement</label>
                    <select
                      value={sponsorshipType}
                      onChange={(e) => setSponsorshipType(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="50 Student Learning Kits (₹22,500)">50 Student Learning Kits (₹22,500)</option>
                      <option value="100 Student Learning Kits (₹45,000)">100 Student Learning Kits (₹45,000)</option>
                      <option value="25 Rural Medical Aid Boxes (₹30,000)">25 Rural Medical Aid Boxes (₹30,000)</option>
                      <option value="Custom Quantity for Telangana Villages">Custom Quantity for Telangana Villages</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Entity PAN (For 80G Certificate)</label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="AAAAA1111A"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono"
                    />
                  </div>
                </div>
              )}

              {inquiryType === 'direct-donate' && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Direct 80G Tax Exemption Donation</span>
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Donation Amount (₹) *</label>
                      <input
                        type="number"
                        min="500"
                        step="500"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Select Cause</label>
                      <select
                        value={donationCause}
                        onChange={(e) => setDonationCause(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                      >
                        <option value="Mid-Day Child Nutrition">Mid-Day Child Nutrition</option>
                        <option value="Remote Village Healthcare">Remote Village Healthcare</option>
                        <option value="Rural Girl Child Education">Rural Girl Child Education</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Donor PAN Number (Mandatory for Form 10BE) *</label>
                    <input
                      type="text"
                      maxLength={10}
                      required
                      placeholder="ABCDE1234F"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono"
                    />
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Official Trust Bank Account:</span>
                    </p>
                    <p className="font-mono text-[11px] text-emerald-900">
                      • A/C Name: Akshaya Patra Welfare Foundation<br/>
                      • Bank: State Bank of India (SBI) • A/C No: 40982103847<br/>
                      • IFSC: SBIN0001248 • Section 8 Reg: U85300KA2021NPL
                    </p>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* SECTION E: FORMATTED WHATSAPP MESSAGE PREVIEW        */}
              {/* ---------------------------------------------------- */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Live Formatted WhatsApp Message Preview:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
                  </button>
                </div>

                <pre className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/90 text-[11px] sm:text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed shadow-inner">
                  {previewMessage}
                </pre>
              </div>

              {/* ---------------------------------------------------- */}
              {/* SECTION F: ACTION CTA & SUBMISSION                   */}
              {/* ---------------------------------------------------- */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleProcessAndSend}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4 fill-slate-950" />
                  <span>
                    {inquiryType === 'item' ? 'Register Order & Open WhatsApp Desk' : 'Send Enquiry via WhatsApp Desk'}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </button>

                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                  <span>Official Desk: +91 98490 28410</span>
                  <span className="text-emerald-700 font-semibold">100% Verified Section 8 Non-Profit</span>
                </div>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
