import React, { useState } from 'react';
import { 
  Heart, 
  ShoppingBag, 
  FileText, 
  Menu, 
  X,
} from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  taxReceiptCount: number;
  onOpenCart: () => void;
  onOpenDonate: () => void;
  onOpenTaxPortal: () => void;
  onNavigate: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  taxReceiptCount,
  onOpenCart,
  onOpenDonate,
  onOpenTaxPortal,
  onNavigate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    onNavigate(sectionId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 relative border-b border-emerald-950/10 bg-white/90 shadow-[0_6px_24px_-20px_rgba(15,23,42,0.35)] backdrop-blur-xl">
      <div className="h-[2px] w-full bg-gradient-to-r from-emerald-900 via-amber-400 to-emerald-900" />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 xl:px-10">
        <div className="flex items-center justify-between h-[66px] sm:h-[74px] gap-3 sm:gap-5">
          
          {/* Logo & Brand Identity */}
          <div 
            onClick={() => handleNavClick('hero')} 
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink group select-none min-w-0"
          >
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] bg-gradient-to-br from-amber-300 via-emerald-700 to-emerald-950 p-[2px] shadow-md shadow-emerald-950/15 ring-1 ring-emerald-950/10 group-hover:shadow-lg transition-shadow flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-[12px] bg-[#0c3c26] flex items-center justify-center overflow-hidden">
                <svg viewBox="0 0 40 40" className="w-6 h-6 sm:w-7 sm:h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                <span className="text-[17px] sm:text-xl font-black tracking-tight text-slate-950 font-serif leading-none">
                  Akshaya Patra
                </span>
                <span className="text-[17px] sm:text-xl font-black tracking-tight text-amber-600 font-serif leading-none">
                  Welfare
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-tight truncate hidden sm:block mt-1">
                Section 8 Non-Profit • Remote Villages
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links - Clean and focused */}
          <nav className="hidden lg:flex items-center gap-0.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1 text-xs xl:text-[13px] font-semibold text-slate-600 shrink-0">
            <button
              onClick={() => handleNavClick('vision-mission')}
              className="hover:text-emerald-900 hover:bg-white hover:shadow-sm transition-all px-3 py-2 rounded-xl cursor-pointer"
            >
              Vision & Mission
            </button>

            <button
              onClick={() => handleNavClick('causes')}
              className="hover:text-emerald-900 hover:bg-white hover:shadow-sm transition-all px-3 py-2 rounded-xl cursor-pointer"
            >
              Causes
            </button>

            <button
              onClick={() => handleNavClick('shop-goods')}
              className="hover:text-emerald-900 hover:bg-white hover:shadow-sm transition-all px-3 py-2 rounded-xl cursor-pointer"
            >
              Shop Goods
            </button>

            <button
              onClick={() => handleNavClick('how-pledges-work')}
              className="hover:text-emerald-900 hover:bg-white hover:shadow-sm transition-all px-3 py-2 rounded-xl cursor-pointer"
            >
              How Pledges Work
            </button>
          </nav>

          {/* Action CTAs: Compact and strictly bounded to prevent viewport overflow */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-amber-50 text-amber-950 border border-amber-300/90 font-bold text-xs transition-all hover:shadow-sm cursor-pointer relative"
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
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white hover:bg-emerald-50/60 text-slate-700 border border-slate-200 font-semibold text-xs transition-all hover:border-emerald-200 cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 hover:from-emerald-700 hover:to-emerald-900 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/15 transition-all hover:shadow-lg cursor-pointer shrink-0"
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

            <div className="grid grid-cols-1 gap-2">
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

            </div>

          </div>
        </div>
      )}
    </header>
  );
};
