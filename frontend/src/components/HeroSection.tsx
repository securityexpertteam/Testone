import React from 'react';
import { ArrowDown, ArrowRight, BookOpen, Heart, ShieldCheck, ShoppingBag, Stethoscope } from 'lucide-react';

interface HeroSectionProps {
  onOpenDonate: () => void;
  onOpenShop: () => void;
  onOpenTaxPortal: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenDonate, onOpenShop, onOpenTaxPortal }) => (
  <section id="hero" className="relative isolate overflow-hidden bg-[#f2f9f6]">
    <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-30 [background-image:radial-gradient(rgba(23,83,70,0.16)_0.7px,transparent_0.7px)] [background-size:18px_18px]" />

    <div className="mx-auto grid w-full max-w-none items-center gap-8 px-[32px] py-10 sm:py-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-10 lg:py-16 xl:gap-12">
      <div className="relative z-10 max-w-2xl">
        <button
          type="button"
          onClick={onOpenTaxPortal}
          className="inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-900/10 bg-white/65 px-3.5 py-2 text-[11px] font-semibold tracking-wide text-emerald-950 shadow-sm backdrop-blur transition hover:border-emerald-800/25 hover:bg-white sm:text-xs"
        >
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-800" />
          <span>Section 8 · 12A · 80G registered</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-emerald-800" />
        </button>

        <h1 className="mt-6 max-w-[690px] text-[2.75rem] font-medium leading-[0.99] tracking-[-0.045em] text-[#163e37] sm:text-6xl lg:text-[4.35rem] xl:text-[4.8rem]">
          Healthcare and education, <span className="font-serif italic font-normal text-emerald-800">reached where roads end.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-[#4e6963] sm:text-lg sm:leading-8">
          We bring mobile clinics and learning support to remote villages, making essential care and opportunity easier to reach.
        </p>

        <div className="mt-7 flex flex-col gap-3 min-[420px]:flex-row">
          <button
            type="button"
            onClick={onOpenDonate}
            className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full border border-emerald-900/15 bg-white/65 px-6 py-3 text-sm font-semibold text-[#174c40] shadow-sm backdrop-blur transition hover:border-emerald-800/30 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-800/20"
          >
            <Heart className="h-4 w-4 fill-amber-300 text-amber-300" />
            Give directly
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onOpenShop}
            className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full border border-emerald-900/15 bg-white/65 px-6 py-3 text-sm font-semibold text-[#174c40] shadow-sm backdrop-blur transition hover:border-emerald-800/30 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-800/15"
          >
            <ShoppingBag className="h-4 w-4" />
            Explore the shop
          </button>
        </div>
        <p className="mt-4 text-xs leading-5 text-[#668078]">Direct donations may qualify for 80G benefits. Shop purchases do not.</p>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-emerald-950/10 pt-5 text-xs font-medium text-[#49675f] sm:text-sm">
          <span className="inline-flex items-center gap-2"><Stethoscope className="h-4 w-4 text-emerald-800" />Remote-village healthcare</span>
          <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4 text-emerald-800" />Girls’ education</span>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[560px] lg:ml-auto">
        <div aria-hidden="true" className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-white/80 via-emerald-100/50 to-amber-100/65 blur-2xl" />
        <div className="relative rounded-[2rem] border border-white/80 bg-white/45 p-2.5 shadow-[0_28px_70px_rgba(29,74,66,0.18)] backdrop-blur-md sm:rounded-[2.4rem] sm:p-3">
          <div className="relative aspect-[1.08/1] overflow-hidden rounded-[1.55rem] bg-[#dfece5] sm:aspect-[1.04/1] sm:rounded-[1.95rem]">
            <img
              src="/village-care.jpg"
              alt="A mobile doctor checking a child in a remote village"
              className="h-full w-full object-cover object-[47%_center]"
              fetchPriority="high"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#102f29]/55 via-transparent to-[#102f29]/5" />
            <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/75 px-3 py-2 text-[11px] font-semibold text-[#174c40] shadow-md backdrop-blur-lg sm:left-5 sm:top-5 sm:text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />Care beyond the last mile
            </div>
            <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 sm:inset-x-5 sm:bottom-5">
              <div className="rounded-2xl border border-white/40 bg-white/80 px-4 py-3 shadow-lg backdrop-blur-xl sm:px-5 sm:py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-800">Two core causes</p>
                <p className="mt-1 font-serif text-lg leading-tight text-[#173d36] sm:text-xl">Care. Learning. Opportunity.</p>
              </div>
              <div className="hidden rounded-full border border-white/40 bg-[#174c40]/90 p-3 text-white shadow-lg backdrop-blur sm:flex">
                <ArrowDown className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
