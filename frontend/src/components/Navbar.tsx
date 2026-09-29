import React, { useState } from 'react';
import { 
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

  const navItemClass = 'rounded-full border border-transparent px-3.5 py-2 text-[#376d62] transition-all duration-300 hover:border-white/70 hover:bg-white/35 hover:text-[#063f34] hover:shadow-[0_3px_14px_rgba(20,94,77,0.12)] hover:backdrop-blur-md cursor-pointer';

  return (
    <header className="sticky top-0 z-40 bg-[linear-gradient(90deg,#b9dfe0_0%,#d5eeea_10%,#eef8f5_28%,#eef8f5_100%)]">
      <div className="mx-auto w-full max-w-none px-[32px] py-2.5 sm:py-[18px]">
        <div className="-ml-2.5 grid min-h-[58px] grid-cols-[auto_auto] items-center justify-between gap-3 rounded-[18px] border border-white/85 bg-white/80 px-0 shadow-[0_8px_30px_rgba(16,73,63,0.08)] backdrop-blur-xl sm:min-h-[76px] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-5">
          
          {/* Logo & Brand Identity */}
          <div 
            onClick={() => handleNavClick('hero')} 
            className="ml-2.5 flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink group select-none min-w-0"
          >
            <img src="/logo-mark.png" alt="" className="h-[58px] w-[54px] shrink-0 rounded-xl object-contain sm:h-[64px] sm:w-[60px]" />

            <div className="flex flex-col min-w-0 truncate">
              <div className="flex flex-col gap-1">
                <span className="text-[17px] sm:text-[20px] font-medium tracking-tight text-[#173e37] font-serif leading-none">
                  Akshaya Patra
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.25em] text-[#60958a] leading-none">WELFARE</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links - Clean and focused */}
          <nav className="hidden lg:flex -translate-x-6 items-center justify-center gap-4 xl:gap-6 text-[15px] xl:text-base font-medium tracking-wide">
            <button
              onClick={() => handleNavClick('causes')}
              className={navItemClass}
            >
              Causes
            </button>

            <button
              onClick={() => handleNavClick('shop-goods')}
              className={navItemClass}
            >
              Welfare Shop
            </button>

            <button
              onClick={() => handleNavClick('how-pledges-work')}
              className={navItemClass}
            >
              Pledge
            </button>

            <button
              onClick={() => handleNavClick('transparency')}
              className={navItemClass}
            >
              Transparency
            </button>
          </nav>

          {/* Action CTAs: Compact and strictly bounded to prevent viewport overflow */}
          <div className="flex -translate-x-[20px] items-center justify-end gap-2 sm:gap-3 shrink-0 sm:min-w-0 lg:justify-self-end">
            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-[#9b6b1c] transition hover:bg-white/70 sm:h-10 sm:w-10 cursor-pointer"
              title="View Cart"
              aria-label={`View cart${cartCount ? `, ${cartCount} items` : ''}`}
            >
              <ShoppingBag className="h-[17px] w-[17px] shrink-0" />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#d89928] px-1 text-[9px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* My 80G Tax Receipt Button */}
            <button
              onClick={onOpenTaxPortal}
              className="relative hidden h-9 w-9 items-center justify-center rounded-full text-[#3f746a] transition hover:bg-white/70 sm:inline-flex sm:h-10 sm:w-10 cursor-pointer"
              title="80G Tax Receipt"
              aria-label={`My 80G tax receipts, ${taxReceiptCount}`}
            >
              <FileText className="h-[16px] w-[16px] shrink-0" />
              <span className="absolute right-0 top-0 text-[9px] font-bold text-[#0b5947]">
                {taxReceiptCount}
              </span>
            </button>

            {/* Donate Direct Primary Button */}
            <button
              onClick={onOpenDonate}
              className="relative isolate ml-1 inline-flex items-center justify-center rounded-full bg-[#064b3b] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_5px_18px_rgba(6,75,59,0.22)] transition hover:bg-[#043d31] sm:min-w-[88px] sm:px-5 cursor-pointer shrink-0"
              title="Donate Direct (80G Tax Exemption)"
            >
              <span aria-hidden="true" className="absolute -inset-[2px] -z-10 rounded-full border border-emerald-300/90 shadow-[0_0_8px_rgba(52,211,153,0.7),0_0_16px_rgba(16,185,129,0.38)] animate-pulse" />
              <span>Donate</span>
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-full p-2 text-[#376d62] transition hover:bg-white/70 lg:hidden cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="mx-3 mb-3 rounded-2xl border border-white/80 bg-[#f5fbf9]/95 px-4 pt-3 pb-5 shadow-lg backdrop-blur-xl sm:mx-[4.5%] lg:hidden">
          <div className="flex flex-col space-y-2 font-medium text-slate-700">
            <button
              onClick={() => handleNavClick('causes')}
              className="text-left px-3 py-2 rounded-xl flex items-center justify-between transition-all hover:bg-white/50"
            >
              <span>Causes</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">80G Eligible</span>
            </button>

            <button
              onClick={() => handleNavClick('shop-goods')}
              className="text-left px-3 py-2 rounded-xl flex items-center justify-between transition-all hover:bg-white/50"
            >
              <span>Welfare Shop</span>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">100% Profits to Aid</span>
            </button>

            <button
              onClick={() => handleNavClick('how-pledges-work')}
              className="text-left px-3 py-2 rounded-xl transition-all hover:bg-white/50"
            >
              Pledge
            </button>

            <button
              onClick={() => handleNavClick('transparency')}
              className="text-left px-3 py-2 rounded-xl transition-all hover:bg-white/50"
            >
              Transparency
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <button
              onClick={() => {
                onOpenDonate();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#064b3b] text-white font-semibold shadow-sm"
            >
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
