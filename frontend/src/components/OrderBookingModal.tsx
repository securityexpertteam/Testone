import React, { useState, useEffect } from 'react';
import { 
  CartItem, 
  WelfareProduct, 
  OrderBooking, 
  RaffleTransactionRecord,
  CustomerDetails,
  DeliveryAddressDetails,
  OrderItemDetail,
  OptionalPromotion,
  PaymentDetails,
  OrderMetadata,
  ConsentVerification,
  RaffleItemConfiguration
} from '../types';
import { HYDERABAD_COMMUNITIES, HYDERABAD_NODAL_POINTS } from '../data/hyderabadLocations';
import { API_BASE_URL } from '../utils/api';
import { getReferralId } from '../utils/referral';
import { 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Smartphone, 
  Sparkles, 
  Lock, 
  AlertCircle,
  Copy,
  RefreshCw,
  QrCode,
  Check,
  Building,
  MapPin,
  Ticket
} from 'lucide-react';

interface OrderBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  standaloneTicketsCount: number;
  raffleCampaignId: string | null;
  raffleCampaign: RaffleItemConfiguration | undefined;
  onOrderSuccess: (order: OrderBooking, tickets: RaffleTransactionRecord[]) => void;
}

export const OrderBookingModal: React.FC<OrderBookingModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  standaloneTicketsCount,
  raffleCampaignId,
  raffleCampaign,
  onOrderSuccess
}) => {
  // Customer Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [customerToken, setCustomerToken] = useState('');
  const [developmentOtp, setDevelopmentOtp] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [whatsAppNumber, setWhatsAppNumber] = useState('');
  const [sameAsMobile, setSameAsMobile] = useState(true);
  const [alternateMobileNumber, setAlternateMobileNumber] = useState('');

  // Delivery Address
  const [houseFlatNumber, setHouseFlatNumber] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [areaLocality, setAreaLocality] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState(HYDERABAD_COMMUNITIES[0].name);
  const [customCommunity, setCustomCommunity] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [state, setState] = useState('Telangana');
  const [country] = useState('India');
  const [pincode, setPincode] = useState(HYDERABAD_COMMUNITIES[0].pincode);
  const [nearbyNodalPoint, setNearbyNodalPoint] = useState(HYDERABAD_COMMUNITIES[0].defaultNodalPoint);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Promotion / Raffle tickets
  const [includePromotion, setIncludePromotion] = useState(Boolean(raffleCampaign?.enabled) || standaloneTicketsCount > 0);
  const defaultTickets = standaloneTicketsCount > 0 ? standaloneTicketsCount : 1;
  const [ticketCount, setTicketCount] = useState(defaultTickets);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'QR_CODE' | 'CARDS_NETBANKING' | 'CASH_ON_DELIVERY'>('UPI');
  const [upiProvider, setUpiProvider] = useState('Google Pay / PhonePe');

  // Consent & CAPTCHA
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [acceptPrivacy, setAcceptPrivacy] = useState(true);
  const [acknowledgeDonation, setAcknowledgeDonation] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState(true);
  
  // Anti-bot CAPTCHA
  const [captchaNum1, setCaptchaNum1] = useState(7);
  const [captchaNum2, setCaptchaNum2] = useState(5);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState(false);

  // Checkout State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSubmitError, setOrderSubmitError] = useState('');
  const [completedOrder, setCompletedOrder] = useState<OrderBooking | null>(null);
  const [createdTickets, setCreatedTickets] = useState<RaffleTransactionRecord[]>([]);
  const [copiedTicket, setCopiedTicket] = useState<string | null>(null);

  // Auto-fill community details on select
  const handleCommunityChange = (name: string) => {
    setSelectedCommunity(name);
    const found = HYDERABAD_COMMUNITIES.find(c => c.name === name);
    if (found) {
      setPincode(found.pincode);
      setNearbyNodalPoint(found.defaultNodalPoint);
      setAreaLocality(found.area);
    }
  };

  const refreshCaptcha = () => {
    setCaptchaNum1(Math.floor(2 + Math.random() * 8));
    setCaptchaNum2(Math.floor(1 + Math.random() * 9));
    setCaptchaInput('');
    setCaptchaError(false);
  };

  useEffect(() => {
    if (sameAsMobile) {
      setWhatsAppNumber(mobileNumber);
    }
  }, [sameAsMobile, mobileNumber]);

  useEffect(() => {
    if (isOpen) {
      refreshCaptcha();
      setCompletedOrder(null);
      setIncludePromotion(Boolean(raffleCampaign?.enabled) || standaloneTicketsCount > 0);
      setTicketCount(standaloneTicketsCount > 0 ? standaloneTicketsCount : 1);
    }
  }, [isOpen, raffleCampaign, standaloneTicketsCount]);

  if (!isOpen) return null;

  // Calculation of finances & items
  const raffleTicketPrice = raffleCampaign?.enabled ? raffleCampaign.ticketPrice : 0;
  const orderDetailsList: OrderItemDetail[] = cartItems.map(item => {
    const unitPrice = item.product.discountPrice && item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price;
    const qty = item.quantity;
    const donationAmt = item.product.profitToCause * qty;
    const donationPct = Math.round((item.product.profitToCause / item.product.price) * 100);
    return {
      productId: item.product.id,
      productName: item.product.name,
      productImage: item.product.image,
      quantity: qty,
      unitPrice: unitPrice,
      discount: Math.max(0, Number(item.product.originalPrice || item.product.price) - unitPrice),
      donationPercentage: donationPct,
      donationAmount: donationAmt,
      donationCause: item.product.causeSupported === 'medical' ? 'Remote Mobile Medical Clinics' : 'Rural Classroom STEM Kits',
      impactStatement: item.product.impactNote
    };
  });

  // If no cart items but user was doing standalone raffle purchase
  if (orderDetailsList.length === 0 && standaloneTicketsCount > 0) {
    orderDetailsList.push({
      productId: 'raffle-standalone-entry',
      productName: `${raffleCampaign?.itemName || 'Raffle'} Entry Ticket`,
      productImage: raffleCampaign?.itemImage || '',
      quantity: standaloneTicketsCount,
      unitPrice: raffleTicketPrice,
      discount: 0,
      donationPercentage: 100,
      donationAmount: raffleTicketPrice * standaloneTicketsCount,
      donationCause: 'Village Child Healthcare & Remote School Kits',
      impactStatement: '100% of ticket proceeds fund medicines and learning kits for remote hamlets.'
    });
  }

  const itemsSubtotal = cartItems.reduce((acc, item) => acc + (item.product.discountPrice && item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price) * item.quantity, 0);
  const promotionEntryFee = includePromotion ? ticketCount * raffleTicketPrice : 0;
  const grandTotal = (cartItems.length === 0 ? 0 : itemsSubtotal) + promotionEntryFee;

  const handleRequestOtp = async () => {
    const loginId = email.trim().toLowerCase();
    setIsRequestingOtp(true);
    setAuthMessage('');
    setDevelopmentOtp('');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/user/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginId })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to send OTP');
      setVerifiedEmail('');
      setCustomerToken('');
      setDevelopmentOtp(result.developmentOtp || '');
      setAuthMessage(result.message || 'OTP sent. It is valid for 10 minutes.');
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Unable to send OTP');
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    const loginId = email.trim().toLowerCase();
    setIsVerifyingOtp(true);
    setAuthMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/user/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginId, otp })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'OTP verification failed');
      setCustomerToken(result.token);
      setVerifiedEmail(loginId);
      setAuthMessage(`Verified as ${loginId}`);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'OTP verification failed');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerToken || verifiedEmail !== email.trim().toLowerCase()) {
      setAuthMessage('Verify this email login ID with its OTP before checkout.');
      return;
    }

    // Verify Captcha
    if (parseInt(captchaInput.trim(), 10) !== captchaNum1 + captchaNum2) {
      setCaptchaError(true);
      return;
    }
    setCaptchaError(false);

    setOrderSubmitError('');
    setIsSubmitting(true);

    const now = new Date();
    const orderTimestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    const orderRandom = Math.floor(100000 + Math.random() * 900000);
    const orderId = `APW-HYD-2026-${orderRandom}`;
    const txnRandom = Math.floor(100000000 + Math.random() * 900000000);
    const transactionId = `CHECKOUT-${Date.now()}-${txnRandom}`;

    const finalCommunity = selectedCommunity.includes('Other') && customCommunity.trim() 
      ? customCommunity.trim() 
      : selectedCommunity;

    const fullOrder: OrderBooking = {
      refid: getReferralId(),
      customerDetails: {
        fullName,
        email,
        mobileNumber,
        whatsAppNumber: sameAsMobile ? mobileNumber : whatsAppNumber,
        alternateMobileNumber: alternateMobileNumber || undefined
      },
      deliveryAddress: {
        houseFlatNumber,
        streetAddress,
        areaLocality: areaLocality || 'Hyderabad Urban',
        communityApartment: finalCommunity,
        city,
        state,
        country,
        pincode,
        nearbyNodalPoint,
        deliveryInstructions: deliveryInstructions || undefined
      },
      orderDetails: orderDetailsList,
      optionalPromotion: {
        hasBonusEntry: includePromotion && ticketCount > 0,
        promotionTitle: raffleCampaign?.itemName || 'Raffle Entry',
        promotionEntryFee: raffleTicketPrice,
        ticketCount: includePromotion ? ticketCount : 0,
        promotionSelectionStatus: includePromotion && ticketCount > 0 ? 'SELECTED' : 'NOT_SELECTED',
        raffleCampaignId: raffleCampaignId || raffleCampaign?.campaignId
      },
      payment: {
        paymentMethod,
        paymentProvider: paymentMethod === 'CASH_ON_DELIVERY' ? 'Pay on Delivery (Cash/UPI QR at Doorstep)' : upiProvider,
        transactionId,
        paymentStatus: paymentMethod === 'CASH_ON_DELIVERY' ? 'PAY_ON_DELIVERY_CONFIRMED' : 'PENDING',
        paymentAmount: grandTotal,
        currency: 'INR',
        paymentTimestamp: orderTimestamp
      },
      orderMetadata: {
        orderId,
        orderStatus: 'CONFIRMED',
        orderDate: orderTimestamp,
        estimatedDeliveryDate: 'Within 24-48 Hours (Express Hyderabad Hub)',
        sellerId: 'SEL-HYD-RURAL-ARTISANS-09',
        couponCode: 'NONE',
        platformFee: 0,
        shippingFee: 0,
        taxGst: 0,
        subtotal: itemsSubtotal,
        totalAmount: grandTotal,
        finalPayableAmount: grandTotal
      },
      consentAndVerification: {
        acceptTermsAndConditions: acceptTerms,
        acceptPrivacyPolicy: acceptPrivacy,
        donationAcknowledgementConsent: acknowledgeDonation,
        marketingCommunicationConsent: marketingConsent,
        captchaVerified: true
      },
      linkedRaffleTickets: []
    };

    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify(fullOrder)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Order could not be placed');
      const savedOrder = result.order as OrderBooking;
      const savedTickets = result.generatedTickets as RaffleTransactionRecord[];
      setCompletedOrder(savedOrder);
      setCreatedTickets(savedTickets);
      setIsSubmitting(false);
      onOrderSuccess(savedOrder, savedTickets);
    } catch (error) {
      setIsSubmitting(false);
      setOrderSubmitError(error instanceof Error ? error.message : 'Order could not be placed. Please try again.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTicket(text);
    setTimeout(() => setCopiedTicket(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-4 max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0a331f] to-[#0e4429] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif tracking-tight">
                {completedOrder ? 'Order & Raffle Ticket Booking Confirmed' : 'Hyderabad Order Booking & Express Delivery Form'}
              </h2>
              <p className="text-xs text-emerald-200">
                Direct from Certified Green Artisans • Nodal Hub Express Dispatch
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-[#fafaf8]">
          
          {!completedOrder ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Notice / Guidance */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Hyderabad Delivery Hub:</strong> We provide express door-step dispatch across all gated communities and key IT corridor nodal hubs. 
                  Raffle entries are validated against the seller&apos;s active MongoDB campaign and recorded with the verified buyer and order.
                </div>
              </div>

              {/* 1. Customer Details */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">1</span>
                  <h3 className="text-sm font-bold text-slate-900 font-serif">Customer Details</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Subhash Konduru"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. subhash@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setVerifiedEmail('');
                        setCustomerToken('');
                        setDevelopmentOtp('');
                        setAuthMessage('');
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button type="button" onClick={handleRequestOtp} disabled={isRequestingOtp || !email.trim()} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                        {isRequestingOtp ? 'Sending...' : 'Send login OTP'}
                      </button>
                      <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} placeholder="6-digit OTP" aria-label="Email login OTP" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono" />
                      <button type="button" onClick={handleVerifyOtp} disabled={isVerifyingOtp || otp.length !== 6 || !email.trim()} className="rounded-lg border border-emerald-700 px-3 py-2 text-xs font-semibold text-emerald-800 disabled:opacity-50">
                        {isVerifyingOtp ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                    {developmentOtp && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900" role="status">Development OTP: <strong className="font-mono">{developmentOtp}</strong> <span className="text-amber-700">(local testing only)</span></p>}
                    {authMessage && <p className={`mt-1 text-[11px] ${customerToken || developmentOtp || authMessage.startsWith('OTP sent') ? 'text-emerald-700' : 'text-rose-700'}`} role="status">{authMessage}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mobile Number (10 digits) *</label>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      placeholder="e.g. 9876543210"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">WhatsApp Number *</label>
                      <label className="flex items-center gap-1 text-[11px] text-emerald-800 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={sameAsMobile}
                          onChange={(e) => setSameAsMobile(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Same as Mobile</span>
                      </label>
                    </div>
                    <input
                      type="tel"
                      required
                      disabled={sameAsMobile}
                      placeholder="e.g. 9876543210"
                      value={sameAsMobile ? mobileNumber : whatsAppNumber}
                      onChange={(e) => setWhatsAppNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white disabled:bg-slate-100 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Alternate Mobile Number <span className="font-normal text-slate-400">(Optional for delivery agent contact)</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9440123456"
                      value={alternateMobileNumber}
                      onChange={(e) => setAlternateMobileNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Delivery Address in Hyderabad */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">2</span>
                    <h3 className="text-sm font-bold text-slate-900 font-serif">Delivery Address (Hyderabad Metro)</h3>
                  </div>
                  <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                    Express Doorstep Delivery
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Community / Apartment Dropdown *
                    </label>
                    <select
                      value={selectedCommunity}
                      onChange={(e) => handleCommunityChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white font-medium"
                    >
                      {HYDERABAD_COMMUNITIES.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} ({c.area})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCommunity.includes('Other') ? (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Specify Gated Community / Villa Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rainbow Vistas Block B, Moosapet"
                        value={customCommunity}
                        onChange={(e) => setCustomCommunity(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nearby Nodal Hub (Express Pickup/Dispatch Point) *</label>
                      <select
                        value={nearbyNodalPoint}
                        onChange={(e) => setNearbyNodalPoint(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white font-medium"
                      >
                        {HYDERABAD_NODAL_POINTS.map((np) => (
                          <option key={np.id} value={np.name}>
                            {np.name} ({np.zone} Zone)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">House / Flat / Tower / Villa Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tower 3, Flat 1402"
                      value={houseFlatNumber}
                      onChange={(e) => setHouseFlatNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Street Address / Internal Lane *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ISB Road / Gachibowli Main Rd"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Area / Locality *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HITEC City, Gachibowli, Kondapur"
                      value={areaLocality}
                      onChange={(e) => setAreaLocality(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        readOnly
                        value={city}
                        className="w-full px-2 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">State</label>
                      <input
                        type="text"
                        readOnly
                        value={state}
                        className="w-full px-2 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Pincode *</label>
                      <input
                        type="text"
                        required
                        pattern="[0-9]{6}"
                        placeholder="500081"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full px-2 py-2 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Delivery Instructions for Security Gate / Courier Agent <span className="font-normal text-slate-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Leave with MyGate entry code, call on reaching clubhouse"
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-emerald-600 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Order Details Summary */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">3</span>
                  <h3 className="text-sm font-bold text-slate-900 font-serif">Order Details</h3>
                </div>

                <div className="space-y-3">
                  {orderDetailsList.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                      <img src={item.productImage} alt={item.productName} className="w-14 h-14 rounded-lg object-cover bg-white shrink-0 border" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-900 truncate pr-2">{item.productName}</h4>
                          <span className="font-bold text-slate-900 font-mono">₹{item.unitPrice * item.quantity}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                          <span>Qty: {item.quantity}</span>
                          <span>•</span>
                          <span>Unit: ₹{item.unitPrice}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">{item.donationPercentage}% profit (₹{item.donationAmount}) to {item.donationCause}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {raffleCampaign?.enabled && <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border-2 border-amber-400 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={raffleCampaign.itemImage} alt={raffleCampaign.itemName} className="h-12 w-12 rounded-lg object-cover" />
                    <div>
                      <h4 className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
                        <span>{raffleCampaign.itemName} Raffle Ticket</span>
                        <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded font-black">
                          ₹{raffleTicketPrice.toLocaleString('en-IN')} / ticket
                        </span>
                      </h4>
                      <p className="text-xs text-amber-900/80">
                        Prize value ₹{raffleCampaign.itemPrice.toLocaleString('en-IN')} • Draw date: {raffleCampaign.drawDate}
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-amber-950">
                    <input
                      type="checkbox"
                      checked={includePromotion}
                      onChange={(e) => setIncludePromotion(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>{includePromotion ? 'Enrolled' : 'Opt Out'}</span>
                  </label>
                </div>

                {includePromotion && (
                  <div className="pt-2 border-t border-amber-300/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-950 font-semibold">Number of Raffle Tickets:</span>
                      <div className="flex items-center border border-amber-400 bg-white rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                          className="w-6 h-6 flex items-center justify-center font-bold text-slate-700 hover:bg-amber-100 rounded"
                        >
                          -
                        </button>
                        <span className="px-2 font-mono font-bold text-amber-950">{ticketCount}</span>
                        <button
                          type="button"
                          onClick={() => setTicketCount(Math.min(100, ticketCount + 1))}
                          className="w-6 h-6 flex items-center justify-center font-bold text-slate-700 hover:bg-amber-100 rounded"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="font-mono text-sm font-bold text-amber-950">
                      +₹{promotionEntryFee.toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              </div>}

              {/* 5. Payment Selection */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">4</span>
                  <h3 className="text-sm font-bold text-slate-900 font-serif">Payment Method</h3>
                </div>
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                  Online payment is not connected yet. UPI, QR, and card orders are recorded as pending; coordinate payment with the seller. Pay on Delivery is payable when delivered.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <label className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition ${paymentMethod === 'UPI' ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900">UPI Payment</span>
                      <input type="radio" name="paymentMethod" checked={paymentMethod === 'UPI'} onChange={() => setPaymentMethod('UPI')} className="text-emerald-600" />
                    </div>
                    <span className="text-[11px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM (arrange with seller)</span>
                  </label>

                  <label className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition ${paymentMethod === 'QR_CODE' ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900">Scan QR Code</span>
                      <input type="radio" name="paymentMethod" checked={paymentMethod === 'QR_CODE'} onChange={() => setPaymentMethod('QR_CODE')} className="text-emerald-600" />
                    </div>
                    <span className="text-[11px] text-slate-500">Arrange QR payment with the seller</span>
                  </label>

                  <label className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition ${paymentMethod === 'CARDS_NETBANKING' ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900">Cards / Netbanking</span>
                      <input type="radio" name="paymentMethod" checked={paymentMethod === 'CARDS_NETBANKING'} onChange={() => setPaymentMethod('CARDS_NETBANKING')} className="text-emerald-600" />
                    </div>
                    <span className="text-[11px] text-slate-500">Payment must be confirmed with the seller</span>
                  </label>

                  <label className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition ${paymentMethod === 'CASH_ON_DELIVERY' ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900">Pay on Delivery</span>
                      <input type="radio" name="paymentMethod" checked={paymentMethod === 'CASH_ON_DELIVERY'} onChange={() => setPaymentMethod('CASH_ON_DELIVERY')} className="text-amber-600" />
                    </div>
                    <span className="text-[11px] text-slate-500">Cash or UPI at Doorstep</span>
                  </label>
                </div>
              </div>

              {/* 6. Order Financial Breakdown & Metadata */}
              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Goods Subtotal:</span>
                  <span className="font-mono">₹{itemsSubtotal}</span>
                </div>
                {includePromotion && ticketCount > 0 && (
                  <div className="flex justify-between text-amber-900 font-semibold">
                    <span>{raffleCampaign?.itemName || 'Raffle'} ({ticketCount} ticket{ticketCount > 1 ? 's' : ''}):</span>
                    <span className="font-mono">+₹{promotionEntryFee}</span>
                  </div>
                )}
                <div className="flex justify-between text-emerald-800 font-medium">
                  <span>Express Nodal Hub Shipping:</span>
                  <span className="font-mono font-bold text-emerald-700">FREE (₹0)</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Platform Fee & Statutory GST:</span>
                  <span className="font-mono">₹0 (Welfare Exempt)</span>
                </div>
                <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline font-bold text-base text-slate-900">
                  <span>Final Payable Total:</span>
                  <span className="font-mono text-xl text-emerald-800">₹{grandTotal}</span>
                </div>
              </div>

              {/* 7. Consent and Anti-bot Verification */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 text-xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <h3 className="font-bold text-slate-900">Consent, Governance & Verification</h3>
                </div>

                <div className="space-y-2 text-slate-600">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600"
                    />
                    <span>I accept the <strong>Terms & Conditions</strong> and delivery guidelines of Akshaya Patra Welfare.</span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={acceptPrivacy}
                      onChange={(e) => setAcceptPrivacy(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600"
                    />
                    <span>I accept the <strong>Privacy Policy</strong> for order tracking and lucky draw transparency verification.</span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={acknowledgeDonation}
                      onChange={(e) => setAcknowledgeDonation(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600"
                    />
                    <span>I understand that shop goods purchases are <strong>not eligible for Section 80G tax certificates</strong>, and 100% of profits support remote village clinics & schools.</span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={(e) => setMarketingConsent(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600"
                    />
                    <span>Send dispatch updates, live draw link, and tracking receipts on WhatsApp.</span>
                  </label>
                </div>

                {/* Anti-bot Visual Verification CAPTCHA */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
                  <span className="font-semibold text-slate-700">Security Math Verification:</span>
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-800">
                    <span>{captchaNum1} + {captchaNum2} = ?</span>
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                      title="New puzzle"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="number"
                    required
                    placeholder="Enter sum"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    className="w-24 px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono text-center focus:outline-emerald-600"
                  />

                  {captchaError && (
                    <span className="text-rose-600 text-xs font-semibold">Incorrect answer, please try again.</span>
                  )}
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                {orderSubmitError && (
                  <div className="mb-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm text-rose-800" role="alert" aria-live="assertive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-semibold">We couldn’t record your order.</p>
                      <p className="mt-0.5 text-xs">{orderSubmitError}</p>
                      <p className="mt-1 text-xs">We couldn’t confirm whether it was saved. If this followed a delay, contact us before retrying to avoid a duplicate order.</p>
                    </div>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || !customerToken || verifiedEmail !== email.trim().toLowerCase()}
                  className="w-full py-4 px-6 rounded-2xl bg-[#0e4429] hover:bg-[#072a19] text-white font-bold text-sm sm:text-base shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Recording Order & Generating Verified Raffle Tickets...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 text-amber-400" />
                      <span>Confirm Order & Register Raffle Entry (₹{grandTotal})</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          ) : (
            /* Order Success & Linked Raffle Tickets Ledger Confirmation */
            <div className="space-y-6 text-center py-4">
              
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 font-serif">
                  Order Successfully Booked & Linked!
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  Thank you, <strong>{completedOrder.customerDetails.fullName}</strong>. Your express order has been routed to the <strong>{completedOrder.deliveryAddress.nearbyNodalPoint}</strong>.
                </p>
                <p className="mt-2 text-xs font-medium text-amber-800">
                  {completedOrder.payment.paymentStatus === 'PENDING'
                    ? 'Your order is recorded, but online payment is not processed by this checkout yet. Please confirm payment with the seller before dispatch.'
                    : 'Payment is due when your order is delivered.'}
                </p>
              </div>

              {/* Order Metadata Box */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 text-left text-xs grid grid-cols-1 sm:grid-cols-2 gap-3 shadow-2xs">
                <div>
                  <span className="text-slate-400 block">Order Reference ID:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{completedOrder.orderMetadata.orderId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Checkout Reference:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{completedOrder.payment.transactionId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Community & Address:</span>
                  <span className="text-slate-800 font-medium">
                    {completedOrder.deliveryAddress.houseFlatNumber}, {completedOrder.deliveryAddress.communityApartment}, {completedOrder.deliveryAddress.city} - {completedOrder.deliveryAddress.pincode}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Estimated Delivery:</span>
                  <span className="text-emerald-800 font-semibold">{completedOrder.orderMetadata.estimatedDeliveryDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Method & Status:</span>
                  <span className="text-slate-800 font-medium">{completedOrder.payment.paymentMethod} • <span className={completedOrder.payment.paymentStatus === 'PENDING' ? 'font-bold text-amber-700' : 'font-bold text-emerald-700'}>{completedOrder.payment.paymentStatus}</span></span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Amount:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">₹{completedOrder.orderMetadata.finalPayableAmount}</span>
                </div>
              </div>

              {/* Linked Raffle Tickets Card */}
              {createdTickets.length > 0 && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-amber-500/15 border-2 border-amber-400 text-left space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-amber-700" />
                      <h4 className="text-sm font-extrabold text-amber-950 uppercase tracking-tight">
                        Your Linked Lucky Draw Tickets ({createdTickets.length} Entry{createdTickets.length > 1 ? 'ies' : ''})
                      </h4>
                    </div>
                    <span className="text-[10px] bg-rose-600 text-white font-bold px-2.5 py-0.5 rounded-full uppercase">
                      Diwali Bumper
                    </span>
                  </div>

                  <p className="text-xs text-amber-950/80">
                    These tickets are permanently locked and linked to your Mobile (<strong className="font-mono">{completedOrder.customerDetails.mobileNumber}</strong>) and Order (<strong className="font-mono">{completedOrder.orderMetadata.orderId}</strong>) in the master raffle audit ledger.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {createdTickets.map((t) => (
                      <div key={t.ticketNumber} className="bg-white p-3 rounded-xl border border-amber-300 flex items-center justify-between shadow-2xs">
                        <div>
                          <div className="font-mono font-bold text-amber-900 text-sm">{t.ticketNumber}</div>
                          <div className="text-[10px] text-slate-500">Prize: {t.raffleItemName || t.prize}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(t.ticketNumber)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedTicket === t.ticketNumber ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] text-amber-900 pt-1 flex items-center justify-between">
                    <span>Official Draw Date: <strong>{createdTickets[0].drawDate}</strong></span>
                    <span>Status: <strong className="text-emerald-700 font-bold">Active & Verified in Ledger</strong></span>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow cursor-pointer"
                >
                  Return to Store & Close
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
