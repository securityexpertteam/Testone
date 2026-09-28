import { WelfareProduct } from '../types';

export const WELFARE_PRODUCTS: WelfareProduct[] = [
  {
    id: 'prod-diwali-crackers-family-pack',
    name: 'Diwali Crackers Mega Family Pack (35+ Green Fireworks Assortment)',
    category: 'diwali-crackers',
    price: 2000,
    costPrice: 1150,
    profitToCause: 850,
    causeSupported: 'education',
    image: 'https://images.unsplash.com/photo-1508717272800-9fff97da7e8f?auto=format&fit=crop&w=800&q=80',
    description: 'Celebrate Diwali while bringing light to remote villages! 100% CSIR-NEERI certified eco-friendly green crackers assortment box packed with 35+ dazzling family items. Low-smoke and kid-friendly.',
    impactNote: '₹850 net profit directly buys complete school supplies & doctor medicines for 4 village children.',
    inStock: true,
    rating: 5.0,
    reviewsCount: 489,
    taxExempt: false,
    isDiwaliSpecial: true,
    optionalIphoneRaffleEligible: true,
    itemsIncluded: [
      '10 Boxes Sparklers (15cm Gold & Electric)',
      '5 Pcs Deluxe Color Flower Pots (Anar)',
      '10 Pcs Ground Deluxe Spinning Chakkars',
      '5 Pcs Whistling Sky Rockets',
      '2 Pcs 12-Shot Aerial Display Musical Cakes',
      '2 Boxes Roll Caps & Kid-Safe Magic Serpent Eggs',
      '1 Box Night Glitter Fountains'
    ]
  }
];
