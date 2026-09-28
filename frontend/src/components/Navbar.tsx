import React, { useState } from 'react';
import { 
  Heart, 
  ShoppingBag, 
  FileText, 
  MessageCircle, 
  Menu, 
  X, 
  CheckCircle2, 
  ShieldCheck,
} from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  taxReceiptCount: number;
  onOpenCart: () => void;
  onOpenDonate: () => void;
  onOpenWhatsApp: () => void;
  onOpenTaxPortal: () => void;
  onNavigate: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  taxReceiptCount,
  onOpenCart,
  onOpenDonate,
  onOpenWhatsApp,
  onOpenTaxPortal,
  onNavigate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    onNavigate(sectionId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2">
          
          {/* Logo & Brand Identity */}
          <div 
            onClick={() => handleNavClick('hero')} 
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer shrink group select-none min-w-0"
          >
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 p-0.5 shadow-sm ring-1 ring-emerald-600/30 group-hover:scale-105 transition-transform flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-[10px] bg-[#0c3c26] flex items-center justify-center overflow-hidden">
                <svg viewBox="0 0 40 40" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="20" cy="14" rx="10" ry="3.5" fill="#fcd34d" stroke="#f59e0b" strokeWidth="1.2" />
                  <path d="M10 14 C10 26, 30 26, 30 14" fill="#fbbf24" stroke="#d97706" strokeWidth="1.2" />
                  <path d="M14 24 C14 29, 26 29, 26 24" fill="#d97706" />
                  <path d="M20 7 C21 10, 24 11, 24 13 C24 13, 20 13, 20 13 C20 13, 16 13, 16 13 C16 11, 19 10, 20 7Z" fill="#34d399" />
                  <circle cx="20" cy="8" r="1.5" fill="#fef08a" />
                </svg>
              </div>
            </div>

            <div className="flex flex-col min-w-0 truncate">
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 font-serif leading-none">
                  Akshaya Patra
                </span>
                <span className="text-base sm:text-lg font-black tracking-tight text-amber-600 font-serif leading-none">
                  Welfare
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-tight truncate hidden sm:block mt-0.5">
                Section 8 Non-Profit • Remote Villages
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links - Clean and focused */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-xs xl:text-sm font-medium text-slate-700 shrink-0">
            <button
              onClick={() => handleNavClick('vision-mission')}
              className="hover:text-emerald-700 transition py-1 cursor-pointer font-medium"
            >
              Vision & Mission
            </button>

            <button
              onClick={() => handleNavClick('causes')}
              className="hover:text-emerald-700 transition py-1 cursor-pointer font-medium"
            >
              Causes
            </button>

            <button
              onClick={() => handleNavClick('shop-goods')}
              className="hover:text-emerald-700 transition py-1 cursor-pointer font-medium"
            >
              Shop Goods
            </button>

            <button
              onClick={() => handleNavClick('how-pledges-work')}
              className="hover:text-emerald-700 transition py-1 cursor-pointer font-medium"
            >
              How Pledges Work
            </button>
          </nav>

          {/* Action CTAs: Compact and strictly bounded to prevent viewport overflow */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* WhatsApp Button */}
            <button
              onClick={onOpenWhatsApp}
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-xs transition cursor-pointer"
              title="Order on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs transition cursor-pointer relative"
              title="View Cart"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-amber-600 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>

            {/* My 80G Tax Receipt Button */}
            <button
              onClick={onOpenTaxPortal}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold text-xs transition cursor-pointer"
              title="80G Tax Receipt"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline">My 80G</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1 rounded border border-emerald-300">
                {taxReceiptCount}
              </span>
            </button>

            {/* Donate Direct Primary Button */}
            <button
              onClick={onOpenDonate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#0e4429] hover:bg-[#08301d] text-white font-bold text-xs sm:text-sm shadow transition cursor-pointer shrink-0"
              title="Donate Direct (80G Tax Exemption)"
            >
              <Heart className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse shrink-0" />
              <span>Donate</span>
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="flex flex-col space-y-2 font-medium text-slate-700">
            <button
              onClick={() => handleNavClick('vision-mission')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              Vision & Mission
            </button>

            <button
              onClick={() => handleNavClick('causes')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-100 flex items-center justify-between"
            >
              <span>Charity Causes (Education & Medical)</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">80G Eligible</span>
            </button>

            <button
              onClick={() => handleNavClick('shop-goods')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-100 flex items-center justify-between"
            >
              <span>Shop Goods</span>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">100% Profits to Aid</span>
            </button>

            <button
              onClick={() => handleNavClick('how-pledges-work')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              How Pledges Work
            </button>

            <button
              onClick={() => handleNavClick('transparency')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              Section 8 Transparency & Filings
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <button
              onClick={() => {
                onOpenDonate();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0e4429] text-white font-bold shadow"
            >
              <Heart className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>Donate Direct (80G Tax-Exempt)</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onOpenTaxPortal();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold text-xs"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>My 80G ({taxReceiptCount})</span>
              </button>

              <button
                onClick={() => {
                  onOpenWhatsApp();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold text-xs"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Order</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </header>
  );
};
