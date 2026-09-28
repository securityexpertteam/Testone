export interface RaffleCampaignConfig {
  campaignId: string;
  enabled: boolean;
  itemName: string;
  itemPrice: number;
  itemImage: string;
  ticketPrice: number;
  drawDate: string;
}

export interface CatalogProduct {
  id: string;
  sellerId: string;
  name: string;
  category: string;
  description: string;
  image: string;
  images: string[];
  price: number;
  costPrice: number;
  discountPrice?: number;
  stockQuantity: number;
  inStock: boolean;
  sku: string;
  barcode: string;
  donationPercentage: number;
  profitToCause: number;
  causeSupported: 'education' | 'medical';
  impactNote: string;
  status: 'Draft' | 'Active' | 'Out of stock' | 'Archived';
  shippingAvailability: string;
  weight: string;
  dimensions: string;
  rating: number;
  reviewsCount: number;
  taxExempt: false;
  itemsIncluded?: string[];
  isDiwaliSpecial?: boolean;
  raffle?: RaffleCampaignConfig;
  createdAt: string;
  updatedAt?: Date;
}

export interface RaffleTicketDocument {
  ticketNumber: string;
  campaignId: string;
  orderId: string;
  buyerId: string;
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
  ticketPrice: number;
  raffleItemName: string;
  raffleItemPrice: number;
  raffleItemImage: string;
  drawDate: string;
  bookingTimestamp: string;
  status: 'ACTIVE_VALID' | 'WINNER_SELECTED' | 'AUDITED' | 'CANCELLED';
  source: string;
}

export const DEFAULT_CATALOG_PRODUCT: CatalogProduct = {
  id: 'prod-diwali-crackers-family-pack',
  sellerId: 'SLR-HYD-8821',
  name: 'Diwali Crackers Mega Family Pack (35+ Green Fireworks Assortment)',
  category: 'diwali-crackers',
  description: 'CSIR-NEERI certified eco-friendly green crackers assortment box packed with 35+ family items.',
  image: 'https://images.unsplash.com/photo-1508717272800-9fff97da7e8f?auto=format&fit=crop&w=800&q=80',
  images: ['https://images.unsplash.com/photo-1508717272800-9fff97da7e8f?auto=format&fit=crop&w=800&q=80'],
  price: 2000,
  costPrice: 1150,
  stockQuantity: 120,
  inStock: true,
  sku: 'DIWALI-GREEN-FAMILY-2026',
  barcode: '8906012480999',
  donationPercentage: 42.5,
  profitToCause: 850,
  causeSupported: 'education',
  impactNote: '₹850 net profit supports village schooling and mobile medical clinics.',
  status: 'Active',
  shippingAvailability: 'Hyderabad Metro Only',
  weight: '35+ item family box',
  dimensions: '40 x 30 x 20 cm',
  rating: 5,
  reviewsCount: 0,
  taxExempt: false,
  isDiwaliSpecial: true,
  itemsIncluded: [
    '10 Boxes Sparklers (15cm Gold & Electric)',
    '5 Pcs Deluxe Color Flower Pots (Anar)',
    '10 Pcs Ground Deluxe Spinning Chakkars',
    '5 Pcs Whistling Sky Rockets',
    '2 Pcs 12-Shot Aerial Display Musical Cakes',
    '2 Boxes Roll Caps & Kid-Safe Magic Serpent Eggs',
    '1 Box Night Glitter Fountains'
  ],
  raffle: {
    campaignId: 'diwali-2026-iphone-draw',
    enabled: true,
    itemName: 'Apple iPhone 16 (128GB)',
    itemPrice: 79900,
    itemImage: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
    ticketPrice: 399,
    drawDate: 'Diwali Night - 2026'
  },
  createdAt: '2026-09-28'
};