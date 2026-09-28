import React, { useState, useEffect } from 'react';
import { CharityCause, WelfareProduct, CartItem, DonationRecord, OrderBooking, RaffleTransactionRecord } from './types';
import { CHARITY_CAUSES } from './data/causes';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { DiwaliDhamakaSection } from './components/DiwaliDhamakaSection';
import { TaxExplainerSection } from './components/TaxExplainerSection';
import { CausesSection } from './components/CausesSection';
import { CharityShopSection } from './components/CharityShopSection';
import { HowPledgesWorkSection } from './components/HowPledgesWorkSection';
import { TransparencySection } from './components/TransparencySection';
import { DonateModal } from './components/DonateModal';
import { TaxReceiptModal } from './components/TaxReceiptModal';
import { CartDrawer } from './components/CartDrawer';
import { WhatsAppOrderModal } from './components/WhatsAppOrderModal';
import { OrderBookingModal } from './components/OrderBookingModal';
import { RaffleAuditModal } from './components/RaffleAuditModal';
import { SellerPortalModal } from './components/SellerPortalModal';
import { Footer } from './components/Footer';
import { API_BASE_URL } from './utils/api';

// Default initial verified 80G receipt for "My 80G (1)" as seen in the header badge
const INITIAL_TAX_RECEIPTS: DonationRecord[] = [
  {
    id: 'don-initial-sample',
    donorName: 'Subhash Konduru',
    email: 'securityexpert2011@gmail.com',
    phone: '+91 98765 43210',
    panNumber: 'ABCDE1234F',
    address: 'Bangalore, Karnataka, India',
    amount: 5000,
    causeId: 'cause-mobile-clinic',
    causeTitle: 'Remote Village Mobile Medical Camps & Lifesaving Medicines',
    date: '24 Sep 2026',
    receiptNumber: 'APW-80G-2026-784192',
    urn80G: 'AACTA1234BF20214_01',
    financialYear: '2026-2027',
    status: 'COMPLETED'
  }
];

export default function App() {
  // Navigation & Modals State
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [selectedCauseForDonate, setSelectedCauseForDonate] = useState<CharityCause | null>(null);
  
  const [isTaxPortalOpen, setIsTaxPortalOpen] = useState(false);
  const [taxReceipts, setTaxReceipts] = useState<DonationRecord[]>(() => {
    const saved = localStorage.getItem('apw_tax_receipts');
    return saved ? JSON.parse(saved) : INITIAL_TAX_RECEIPTS;
  });
  const [activeReceiptId, setActiveReceiptId] = useState<string | null>(INITIAL_TAX_RECEIPTS[0].id);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<WelfareProduct[]>([]);
  const [catalogLoadError, setCatalogLoadError] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartId] = useState(() => {
    const saved = localStorage.getItem('apw_cart_id');
    if (saved) return saved;
    const created = crypto.randomUUID();
    localStorage.setItem('apw_cart_id', created);
    return created;
  });
  const [cartHydrated, setCartHydrated] = useState(false);

  const [iphoneTicketsCount, setIphoneTicketsCount] = useState<number>(0);
  const [raffleCampaignId, setRaffleCampaignId] = useState<string | null>(null);

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppProduct, setWhatsAppProduct] = useState<WelfareProduct | null>(null);
  const [whatsAppCustomMsg, setWhatsAppCustomMsg] = useState<string | undefined>(undefined);

  const [isOrderBookingOpen, setIsOrderBookingOpen] = useState(false);
  const [isRaffleAuditOpen, setIsRaffleAuditOpen] = useState(false);
  const [isSellerPortalOpen, setIsSellerPortalOpen] = useState(false);

  // Success toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('apw_tax_receipts', JSON.stringify(taxReceipts));
  }, [taxReceipts]);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/products`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || 'Product catalog is unavailable');
        if (active) setCatalogProducts((result.products || []).map((product: WelfareProduct & { discountPrice?: number; originalPrice?: number }) => ({
          ...product,
          originalPrice: product.originalPrice ?? product.price,
          // Keep public product/cart prices aligned with the discounted amount;
          // checkout still verifies the current price against MongoDB.
          price: Number(product.discountPrice) > 0 ? Number(product.discountPrice) : product.price
        })));
      })
      .catch((error) => {
        if (active) setCatalogLoadError(error instanceof Error ? error.message : 'Product catalog is unavailable');
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/carts/${cartId}`)
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        if (data.success && data.cart) {
          setCartItems(data.cart.items || []);
          setIphoneTicketsCount(data.cart.iphoneTicketsCount || 0);
          setRaffleCampaignId(data.cart.raffleCampaignId || null);
        }
      })
      .catch((error) => console.error('Could not load cloud cart', error))
      .finally(() => {
        if (active) setCartHydrated(true);
      });
    return () => { active = false; };
  }, [cartId]);

  useEffect(() => {
    if (!cartHydrated) return;
    const timer = window.setTimeout(() => {
      fetch(`${API_BASE_URL}/carts/${cartId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartItems, iphoneTicketsCount, raffleCampaignId })
      }).catch((error) => console.error('Could not sync cloud cart', error));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [cartHydrated, cartId, cartItems, iphoneTicketsCount, raffleCampaignId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Cart operations
  const handleAddToCart = (
    product: WelfareProduct, 
    includeIphoneTicket = false, 
    ticketCount = 0
  ) => {
    if (cartItems.some(item => item.product.id !== product.id)) {
      showToast('Checkout supports one physical product per order. Remove the current item first.');
      return;
    }
    setCartItems([{ product, quantity: 1, includeIphoneTicket, iphoneTicketCount: ticketCount }]);
    if (includeIphoneTicket && product.raffle?.enabled) setRaffleCampaignId(product.raffle.campaignId);
    else if (!includeIphoneTicket) setRaffleCampaignId(null);

    if (includeIphoneTicket && ticketCount > 0) {
      setIphoneTicketsCount((prev) => prev + ticketCount);
      showToast(`Added "${product.name}" + ${ticketCount} iPhone Raffle Ticket(s) to cart!`);
    } else {
      showToast(`Added "${product.name}" to cart (100% net profits fund village aid)!`);
    }
  };

  const handleAddStandaloneRaffleTicket = (count: number, campaignId: string) => {
    setIphoneTicketsCount((prev) => prev + count);
    setRaffleCampaignId(campaignId);
    setIsCartOpen(true);
    showToast(`Added ${count} Diwali iPhone 16 Raffle Ticket(s) (₹${count * 399}) to Cart!`);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: 1 } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
    setIphoneTicketsCount(0);
    setRaffleCampaignId(null);
  };

  // Direct Donation Completion
  const handleDonationComplete = (record: DonationRecord) => {
    setTaxReceipts((prev) => [record, ...prev]);
    setActiveReceiptId(record.id);
    setIsTaxPortalOpen(true);
    showToast(`Donation of ₹${record.amount.toLocaleString('en-IN')} successful! Your 80G Certificate is ready.`);
  };

  // Navigation smoothly scrolls to anchor
  const handleNavigate = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleProceedToBooking = () => {
    setIsCartOpen(false);
    setIsOrderBookingOpen(true);
  };

  const handleOrderSuccess = (order: OrderBooking, tickets: RaffleTransactionRecord[]) => {
    handleClearCart();
    setIphoneTicketsCount(0);
    showToast(`Order ${order.orderMetadata.orderId} recorded! ${tickets.length} raffle ticket(s) registered in ledger.`);
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0) + iphoneTicketsCount;

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf8] text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Main Header / Navigation (Clean, no 80G rules, no Seller Login) */}
      <Navbar
        cartCount={totalCartCount}
        taxReceiptCount={taxReceipts.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenDonate={() => {
          setSelectedCauseForDonate(null);
          setIsDonateOpen(true);
        }}
        onOpenWhatsApp={() => {
          setWhatsAppProduct(null);
          setWhatsAppCustomMsg(undefined);
          setIsWhatsAppModalOpen(true);
        }}
        onOpenTaxPortal={() => setIsTaxPortalOpen(true)}
        onNavigate={handleNavigate}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        
        {/* Hero Section */}
        <HeroSection 
          onOpenDonate={() => {
            setSelectedCauseForDonate(null);
            setIsDonateOpen(true);
          }}
          onOpenShop={() => handleNavigate('diwali-special')}
          onOpenTaxPortal={() => setIsTaxPortalOpen(true)}
        />

        {/* DIWALI CRACKERS MEGA FAMILY PACK (₹2,000) & iPHONE LUCKY DRAW (₹399) SECTION */}
        <DiwaliDhamakaSection 
          onAddToCart={handleAddToCart}
          onOpenWhatsApp={(msg) => {
            setWhatsAppProduct(null);
            setWhatsAppCustomMsg(msg);
            setIsWhatsAppModalOpen(true);
          }}
          onOpenDonate={() => {
            setSelectedCauseForDonate(null);
            setIsDonateOpen(true);
          }}
          product={catalogProducts.find(product => product.isDiwaliSpecial) || null}
          onAddStandaloneRaffleTicket={handleAddStandaloneRaffleTicket}
          onOpenRaffleAudit={() => setIsRaffleAuditOpen(true)}
        />

        {/* Side-by-Side Tax Exemption & Contribution Clarification with Interactive Calculator */}
        <TaxExplainerSection 
          onOpenDonate={() => {
            setSelectedCauseForDonate(null);
            setIsDonateOpen(true);
          }}
          onOpenShop={() => handleNavigate('shop-goods')}
          onOpenTaxPortal={() => setIsTaxPortalOpen(true)}
        />

        {/* Charity Causes (Education & Medical Support in Remote Villages) */}
        <CausesSection 
          onSelectCauseForDonation={(cause) => {
            setSelectedCauseForDonate(cause);
            setIsDonateOpen(true);
          }}
        />

        {/* Welfare Goods Charity Shop (No 80G on items, 100% Profits to Aid) */}
        <CharityShopSection 
          products={catalogProducts}
          onAddToCart={handleAddToCart}
          onOpenWhatsApp={(product) => {
            setWhatsAppProduct(product || null);
            setWhatsAppCustomMsg(undefined);
            setIsWhatsAppModalOpen(true);
          }}
          onOpenDonate={() => {
            setSelectedCauseForDonate(null);
            setIsDonateOpen(true);
          }}
        />

        {/* How Pledges Work */}
        <HowPledgesWorkSection 
          onOpenDonate={() => {
            setSelectedCauseForDonate(null);
            setIsDonateOpen(true);
          }}
          onOpenTaxPortal={() => setIsTaxPortalOpen(true)}
        />

        {/* Section 8 Transparency & Statutory Governance */}
        <TransparencySection />

      </main>

      {/* Footer with welfare information and compliance links */}
      <Footer 
        onOpenDonate={() => {
          setSelectedCauseForDonate(null);
          setIsDonateOpen(true);
        }}
        onOpenTaxPortal={() => setIsTaxPortalOpen(true)}
        onOpenSellerPortal={() => setIsSellerPortalOpen(true)}
        onNavigate={handleNavigate}
      />

      {/* Modals & Drawers */}

      {/* Full Hyderabad Delivery Order Booking Modal with all fields & linked raffle ticket generation */}
      <OrderBookingModal
        isOpen={isOrderBookingOpen}
        onClose={() => setIsOrderBookingOpen(false)}
        cartItems={cartItems}
        standaloneTicketsCount={iphoneTicketsCount}
        raffleCampaignId={raffleCampaignId}
        raffleCampaign={catalogProducts.find(product => product.raffle?.campaignId === raffleCampaignId)?.raffle || cartItems[0]?.product.raffle}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Master Raffle Ledger & Winner Audit Modal */}
      <RaffleAuditModal 
        isOpen={isRaffleAuditOpen}
        onClose={() => setIsRaffleAuditOpen(false)}
      />

      <SellerPortalModal
        isOpen={isSellerPortalOpen}
        onClose={() => setIsSellerPortalOpen(false)}
      />

      {/* Direct Donation Modal with 80G Certificate Generation */}
      <DonateModal 
        isOpen={isDonateOpen}
        onClose={() => setIsDonateOpen(false)}
        selectedCause={selectedCauseForDonate}
        onDonationComplete={handleDonationComplete}
      />

      {/* "My 80G" Tax Certificate Portal & Viewer */}
      <TaxReceiptModal 
        isOpen={isTaxPortalOpen}
        onClose={() => setIsTaxPortalOpen(false)}
        records={taxReceipts}
        activeRecordId={activeReceiptId}
        onSelectRecord={(id) => setActiveReceiptId(id)}
        onOpenDonate={() => {
          setSelectedCauseForDonate(null);
          setIsDonateOpen(true);
        }}
      />

      {/* Welfare Goods Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        iphoneTicketsCount={iphoneTicketsCount}
        raffleItemName={catalogProducts.find(product => product.raffle?.campaignId === raffleCampaignId)?.raffle?.itemName || cartItems[0]?.product.raffle?.itemName || 'Raffle'}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onUpdateIphoneTickets={(cnt) => setIphoneTicketsCount(cnt)}
        raffleTicketPrice={catalogProducts.find(product => product.raffle?.campaignId === raffleCampaignId)?.raffle?.ticketPrice || cartItems[0]?.product.raffle?.ticketPrice || 0}
        onProceedToBooking={handleProceedToBooking}
        onOpenWhatsApp={(summary) => {
          setWhatsAppProduct(null);
          setWhatsAppCustomMsg(summary);
          setIsWhatsAppModalOpen(true);
        }}
        onOpenDonate={() => {
          setIsCartOpen(false);
          setSelectedCauseForDonate(null);
          setIsDonateOpen(true);
        }}
      />

      {/* WhatsApp Ordering & Inquiries Modal */}
      <WhatsAppOrderModal 
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        selectedProduct={whatsAppProduct}
        products={catalogProducts}
        customMessage={whatsAppCustomMsg}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-slate-700 max-w-sm flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
