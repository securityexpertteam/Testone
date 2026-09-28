export interface CharityCause {
  id: string;
  title: string;
  category: 'medical' | 'education' | 'critical-aid';
  shortDesc: string;
  fullDesc: string;
  targetAmount: number;
  raisedAmount: number;
  donorsCount: number;
  image: string;
  tag: string;
  impactMetric: string;
  monthlyGoal: string;
  taxExempt: true; // Direct donations are ALWAYS 80G tax-exempt
  benefits: string[];
}

export interface WelfareProduct {
  id: string;
  sellerId?: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountPrice?: number;
  costPrice: number;
  profitToCause: number;
  causeSupported: 'education' | 'medical';
  image: string;
  description: string;
  impactNote: string;
  inStock: boolean;
  rating: number;
  reviewsCount: number;
  taxExempt: false; // Item purchases are NEVER tax-exempt
  isDiwaliSpecial?: boolean;
  itemsIncluded?: string[];
  optionalIphoneRaffleEligible?: boolean;
  raffle?: RaffleItemConfiguration;
}

export interface RaffleItemConfiguration {
  campaignId: string;
  enabled: boolean;
  itemName: string;
  itemPrice: number;
  itemImage: string;
  ticketPrice: number;
  drawDate: string;
}

export interface CartItem {
  product: WelfareProduct;
  quantity: number;
  includeIphoneTicket?: boolean; // Optional ₹39 iPhone entry ticket
  iphoneTicketCount?: number;
}

export interface CustomerDetails {
  fullName: string;
  email: string;
  mobileNumber: string;
  whatsAppNumber: string;
  alternateMobileNumber?: string;
}

export interface DeliveryAddressDetails {
  houseFlatNumber: string;
  streetAddress: string;
  areaLocality: string;
  communityApartment: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  nearbyNodalPoint: string;
  deliveryInstructions?: string;
}

export interface OrderItemDetail {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  donationPercentage: number;
  donationAmount: number;
  donationCause: string;
  impactStatement: string;
}

export interface OptionalPromotion {
  hasBonusEntry: boolean;
  promotionEntryFee: number;
  ticketCount: number;
  promotionSelectionStatus: 'SELECTED' | 'NOT_SELECTED';
  promotionTitle: string;
  raffleCampaignId?: string;
}

export interface PaymentDetails {
  paymentMethod: 'UPI' | 'QR_CODE' | 'CARDS_NETBANKING' | 'CASH_ON_DELIVERY';
  paymentProvider: string;
  transactionId: string;
  paymentStatus: 'PAID' | 'PAY_ON_DELIVERY_CONFIRMED' | 'SUCCESS';
  paymentAmount: number;
  currency: string;
  paymentTimestamp: string;
}

export interface OrderMetadata {
  orderId: string;
  orderStatus: 'CONFIRMED' | 'PROCESSING' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  orderDate: string;
  estimatedDeliveryDate: string;
  sellerId: string;
  couponCode: string;
  platformFee: number;
  shippingFee: number;
  taxGst: number;
  subtotal: number;
  totalAmount: number;
  finalPayableAmount: number;
}

export interface ConsentVerification {
  acceptTermsAndConditions: boolean;
  acceptPrivacyPolicy: boolean;
  donationAcknowledgementConsent: boolean;
  marketingCommunicationConsent: boolean;
  captchaVerified: boolean;
}

export interface RaffleTransactionRecord {
  ticketNumber: string;
  campaignId?: string;
  buyerId?: string;
  orderId: string;
  transactionId: string;
  customerName: string;
  email: string;
  mobileNumber: string;
  whatsAppNumber: string;
  alternateMobileNumber?: string;
  communityApartment: string;
  nearbyNodalPoint: string;
  pincode: string;
  price: number;
  prize: string;
  raffleItemName?: string;
  raffleItemImage?: string;
  raffleItemPrice?: number;
  ticketPrice?: number;
  drawDate: string; // Diwali Night 2026
  bookingTimestamp: string;
  status: 'ACTIVE_VALID' | 'WINNER_SELECTED' | 'AUDITED' | 'CANCELLED';
  source: 'DIWALI_PACK_COMBO' | 'STANDALONE_RAFFLE_PURCHASE' | 'CART_CHECKOUT';
}

export interface OrderBooking {
  customerDetails: CustomerDetails;
  deliveryAddress: DeliveryAddressDetails;
  orderDetails: OrderItemDetail[];
  optionalPromotion: OptionalPromotion;
  payment: PaymentDetails;
  orderMetadata: OrderMetadata;
  consentAndVerification: ConsentVerification;
  linkedRaffleTickets: string[];
}


export interface DonationRecord {
  id: string;
  donorName: string;
  email: string;
  phone: string;
  panNumber: string;
  address: string;
  amount: number;
  causeId: string;
  causeTitle: string;
  date: string;
  receiptNumber: string;
  urn80G: string;
  financialYear: string;
  status: 'COMPLETED';
  raffleTickets?: string[];
}
