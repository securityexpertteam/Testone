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
  paymentStatus: 'PAID' | 'PAY_ON_DELIVERY_CONFIRMED' | 'SUCCESS' | 'PENDING';
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
  drawDate: string;
  bookingTimestamp: string;
  status: 'ACTIVE_VALID' | 'WINNER_SELECTED' | 'AUDITED' | 'CANCELLED';
  source: 'DIWALI_PACK_COMBO' | 'STANDALONE_RAFFLE_PURCHASE' | 'CART_CHECKOUT';
  ticketPrice?: number;
  raffleItemName?: string;
  raffleItemPrice?: number;
  raffleItemImage?: string;
}

export interface OrderBooking {
  refid?: string;
  customerDetails: CustomerDetails;
  deliveryAddress: DeliveryAddressDetails;
  orderDetails: OrderItemDetail[];
  optionalPromotion: OptionalPromotion;
  payment: PaymentDetails;
  orderMetadata: OrderMetadata;
  consentAndVerification: ConsentVerification;
  linkedRaffleTickets: string[];
}
