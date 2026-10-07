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
import { SellerCollaborationModal } from './components/SellerCollaborationModal';
import { AdminPortal } from './components/AdminPortal';
import { Footer } from './components/Footer';
import { API_BASE_URL } from './utils/api';
import { getReferralId } from './utils/referral';

function PublicApp() {
  useEffect(() => {
    getReferralId();
  }, []);

  // Navigation & Modals State
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [selectedCauseForDonate, setSelectedCauseForDonate] = useState<CharityCause | null>(null);
  
  const [isTaxPortalOpen, setIsTaxPortalOpen] = useState(false);
  const [taxReceipts, setTaxReceipts] = useState<DonationRecord[]>(() => {
    const saved = localStorage.getItem('apw_tax_receipts');
    if (!saved) return [];
    try {
      const parsed: unknown = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.filter((record): record is DonationRecord => record && typeof record === 'object' && record.id !== 'don-initial-sample')
        : [];
    } catch {
      return [];
    }
  });
  const [activeReceiptId, setActiveReceiptId] = useState<string | null>(null);

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
  const [isSellerCollaborationOpen, setIsSellerCollaborationOpen] = useState(false);

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
    <div className="min-h-screen flex flex-col bg-[#f2f9f6] text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Main Header / Navigation (Clean, no 80G rules, no Seller Login) */}
      <Navbar
        cartCount={totalCartCount}
        taxReceiptCount={taxReceipts.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenDonate={() => {
          setSelectedCauseForDonate(null);
          setIsDonateOpen(true);
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
          onOpenShop={() => handleNavigate('shop-goods')}
          onOpenTaxPortal={() => setIsTaxPortalOpen(true)}
        />

        {/* The two causes are the primary path after the landing section. */}
        <CausesSection 
          onSelectCauseForDonation={(cause) => {
            setSelectedCauseForDonate(cause);
            setIsDonateOpen(true);
          }}
        />

        {/* DIWALI CRACKERS MEGA FAMILY PACK (₹2,000) & iPHONE LUCKY DRAW (₹399) SECTION */}
        {/* Side-by-Side Tax Exemption & Contribution Clarification with Interactive Calculator */}
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

        <TaxExplainerSection 
          onOpenDonate={() => {
            setSelectedCauseForDonate(null);
            setIsDonateOpen(true);
          }}
          onOpenShop={() => handleNavigate('shop-goods')}
          onOpenTaxPortal={() => setIsTaxPortalOpen(true)}
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
        onOpenSellerPortal={() => setIsSellerCollaborationOpen(true)}
        onNavigate={handleNavigate}
      />

      <div className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] sm:right-6 sm:bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] z-40 group">
        <span className="pointer-events-none absolute right-[4.25rem] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          Order on WhatsApp
        </span>
        <button
          type="button"
          aria-label="Order on WhatsApp"
          title="Order on WhatsApp"
          onClick={() => {
            setWhatsAppProduct(null);
            setWhatsAppCustomMsg(undefined);
            setIsWhatsAppModalOpen(true);
          }}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-white/70 bg-[#25D366] text-white shadow-lg shadow-emerald-950/20 transition-colors hover:bg-[#1fbd5b] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
        >
          <svg viewBox="0 0 32 32" aria-hidden="true" className="h-7 w-7 fill-current">
            <path d="M16.02 3C8.85 3 3.01 8.84 3.01 16.01c0 2.29.6 4.44 1.64 6.31L3 29l6.86-1.6a12.94 12.94 0 0 0 6.16 1.56h.01c7.17 0 13.01-5.84 13.01-13.01S23.19 3 16.02 3Zm0 23.75h-.01a10.8 10.8 0 0 1-5.5-1.5l-.4-.24-4.07.95 1.09-3.97-.26-.41a10.73 10.73 0 0 1-1.65-5.57c0-5.96 4.85-10.81 10.81-10.81a10.74 10.74 0 0 1 10.81 10.81c0 5.96-4.85 10.81-10.82 10.81Zm5.93-8.1c-.32-.16-1.92-.95-2.21-1.05-.3-.11-.52-.16-.73.16-.22.32-.84 1.05-1.03 1.27-.19.22-.38.24-.7.08-.33-.16-1.37-.5-2.61-1.61-.96-.86-1.61-1.92-1.8-2.24-.19-.32-.02-.5.14-.66.15-.15.33-.38.49-.57.16-.19.22-.33.32-.54.11-.22.05-.41-.02-.57-.08-.16-.73-1.76-1-2.41-.26-.63-.53-.55-.73-.56l-.62-.01c-.22 0-.57.08-.87.41-.3.32-1.13 1.11-1.13 2.7s1.16 3.14 1.32 3.35c.16.22 2.28 3.49 5.53 4.89.77.33 1.38.53 1.85.68.77.25 1.48.21 2.04.13.62-.1 1.92-.79 2.19-1.54.27-.76.27-1.41.19-1.54-.08-.14-.3-.22-.62-.38Z" />
          </svg>
        </button>
      </div>

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

      <SellerCollaborationModal
        isOpen={isSellerCollaborationOpen}
        onClose={() => setIsSellerCollaborationOpen(false)}
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

export default function App() {
  return window.location.pathname.replace(/\/+$/, '') === '/godadmin'
    ? <AdminPortal />
    : <PublicApp />;
}
