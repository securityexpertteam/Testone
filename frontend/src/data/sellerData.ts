export interface SellerProductItem {
  id: string;
  name: string;
  category: string;
  price: number;
  discountPrice?: number;
  sku: string;
  barcode: string;
  stockQuantity: number;
  weight: string;
  dimensions: string;
  status: 'Draft' | 'Active' | 'Out of stock' | 'Archived';
  donationPercentage: number;
  donationCause: string;
  impactStatement: string;
  images: string[];
  videoUrl?: string;
  shippingAvailability: string;
  description: string;
  raffle?: {
    campaignId: string;
    enabled: boolean;
    itemName: string;
    itemPrice: number;
    itemImage: string;
    ticketPrice: number;
    drawDate: string;
  };
}

export interface SellerOrderItem {
  orderId: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  community: string;
  nearbyNodalPoint: string;
  pincode: string;
  orderDate: string;
  status: 'Pending' | 'Confirmed' | 'Packed' | 'Ready for Pickup' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded';
  totalAmount: number;
  donationTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  pickupReadyAt?: string;
  courierPartner?: string;
  trackingNumber?: string;
  linkedRaffleTickets: string[];
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    donationAmount: number;
    donationCause?: string;
  }[];
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  previousQuantity: number;
  updatedQuantity: number;
  changeAmount: number;
  reason: string;
  timestamp: string;
}
