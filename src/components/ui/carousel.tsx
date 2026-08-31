import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  LayoutGrid,
  Columns3,
  Maximize2,
  Minimize2,
  Ticket
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type CardBoxStyle =
  | 'compact-bento'
  | 'tall-portrait'
  | 'wide-landscape'
  | 'floating-capsule'
  | 'neo-ticket';

export type SlideData = {
  step: string;
  title: string;
  phase: string;
  badge: string;
  description: string;
  src: string;
  color?: 'blue' | 'emerald' | 'amber' | string;
  button: string;
  onClick?: () => void;
  deliverables?: string[];
  link?: string;
};

export interface CarouselProps {
  slides: SlideData[];
  initialSlide?: number;
  initialCardStyle?: CardBoxStyle;
  showStyleSelector?: boolean;
  onSlideChange?: (index: number) => void;
  className?: string;
}

export const Carousel: React.FC<CarouselProps> = ({
  slides,
  initialSlide = 0,
  initialCardStyle = 'compact-bento',
  showStyleSelector = true,
  onSlideChange,
  className
}) => {
  const [activeIndex, setActiveIndex] = useState(initialSlide);
  const [cardStyle, setCardStyle] = useState<CardBoxStyle>(initialCardStyle);
  const total = slides ? slides.length : 0;

  const containerRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState<number>(300);
  const [gapWidth, setGapWidth] = useState<number>(16);
  const [visibleCount, setVisibleCount] = useState<number>(3);

  // Dynamic layout dimension calculation based on active card style
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.offsetWidth;
    const isMobile = window.innerWidth < 640;
    const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;

    if (isMobile) {
      setVisibleCount(1);
      setGapWidth(12);
      setCardWidth(width);
      return;
    }

    switch (cardStyle) {
      case 'wide-landscape': {
        if (isTablet) {
          setVisibleCount(1);
          setGapWidth(16);
          setCardWidth(width);
        } else {
          setVisibleCount(2);
          setGapWidth(20);
          setCardWidth((width - 20) / 2);
        }
        break;
      }
      case 'tall-portrait': {
        if (isTablet) {
          setVisibleCount(2);
          setGapWidth(16);
          setCardWidth((width - 16) / 2);
        } else {
          setVisibleCount(3);
          setGapWidth(18);
          setCardWidth((width - 36) / 3);
        }
        break;
      }
      case 'floating-capsule': {
        if (isTablet) {
          setVisibleCount(2);
          setGapWidth(16);
          setCardWidth((width - 16) / 2);
        } else {
          setVisibleCount(3);
          setGapWidth(18);
          setCardWidth((width - 36) / 3);
        }
        break;
      }
      case 'neo-ticket': {
        if (isTablet) {
          setVisibleCount(2);
          setGapWidth(16);
          setCardWidth((width - 16) / 2);
        } else {
          setVisibleCount(3);
          setGapWidth(16);
          setCardWidth((width - 32) / 3);
        }
        break;
      }
      case 'compact-bento':
      default: {
        if (isTablet) {
          setVisibleCount(2);
          setGapWidth(16);
          setCardWidth((width - 16) / 2);
        } else {
          setVisibleCount(3);
          setGapWidth(16);
          setCardWidth((width - 32) / 3);
        }
        break;
      }
    }
  }, [cardStyle]);

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  const maxIndex = Math.max(0, total - visibleCount);

  const handleNext = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => {
      const next = prev < maxIndex ? prev + 1 : 0;
      if (onSlideChange) onSlideChange(next);
      return next;
    });
  }, [total, maxIndex, onSlideChange]);

  const handlePrev = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => {
      const next = prev > 0 ? prev - 1 : maxIndex;
      if (onSlideChange) onSlideChange(next);
      return next;
    });
  }, [total, maxIndex, onSlideChange]);

  const handleSlideSelect = (idx: number) => {
    const clamped = Math.min(Math.max(0, idx), maxIndex);
    setActiveIndex(clamped);
    if (onSlideChange) onSlideChange(clamped);
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  if (!slides || slides.length === 0) return null;

  const slideOffset = -activeIndex * (cardWidth + gapWidth);

  const styleOptions: { id: CardBoxStyle; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'compact-bento', label: '1. Sleek Bento', desc: '300px × 220px • Snug Box', icon: <Minimize2 size={13} /> },
    { id: 'tall-portrait', label: '2. Tall Portrait', desc: '270px × 280px • Deep Vertical', icon: <Columns3 size={13} /> },
    { id: 'wide-landscape', label: '3. Wide Landscape', desc: '480px × 180px • Split Row', icon: <Maximize2 size={13} /> },
    { id: 'floating-capsule', label: '4. Soft Capsule', desc: '320px × 250px • Pill Organic', icon: <LayoutGrid size={13} /> },
    { id: 'neo-ticket', label: '5. Neo Ticket', desc: '290px × 235px • Brutalist Tech', icon: <Ticket size={13} /> }
  ];

  return (
    <div className={cn("relative w-full select-none", className)}>
      {/* 5 Card Dimension & Box Style Switcher Toolbar */}
      {showStyleSelector && (
        <div className="flex items-center justify-center mb-4 px-2 relative z-30">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-zinc-100/90 border border-zinc-200/80 shadow-2xs backdrop-blur-sm overflow-x-auto max-w-full no-scrollbar">
            {styleOptions.map((opt) => {
              const isSelected = cardStyle === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCardStyle(opt.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap",
                    isSelected
                      ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/90 font-extrabold"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-white/50"
                  )}
                >
                  <span className={cn(isSelected ? "text-blue-600" : "text-zinc-400")}>
                    {opt.icon}
                  </span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Continuous Physical Sliding Viewport */}
      <div ref={containerRef} className="overflow-hidden w-full max-w-5xl mx-auto py-1 px-1">
        <motion.div
          className="flex items-stretch transform-gpu will-change-transform"
          style={{ gap: `${gapWidth}px` }}
          animate={{ x: slideOffset }}
          transition={{
            type: 'spring',
            stiffness: 250,
            damping: 27,
            mass: 0.8
          }}
        >
          {slides.map((slide, idx) => {
            return (
              <motion.div
                key={`slide-card-${cardStyle}-${idx}`}
                style={{
                  width: `${cardWidth}px`,
                  minWidth: `${cardWidth}px`
                }}
                whileHover={{
                  y: cardStyle === 'neo-ticket' ? -5 : -4,
                  transition: { duration: 0.2, ease: 'easeOut' }
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (slide.onClick) slide.onClick();
                  handleSlideSelect(idx);
                }}
                className={cn(
                  "group relative transition-all duration-300 cursor-pointer overflow-hidden transform-gpu",
                  
                  // ═══════════════ STYLE 1: COMPACT BENTO (Snug, 300px x 220px) ═══════════════
                  cardStyle === 'compact-bento' && [
                    "flex flex-col justify-between rounded-2xl bg-white p-4 sm:p-4.5 border border-zinc-200/90 shadow-xs hover:shadow-md hover:border-zinc-300"
                  ],

                  // ═══════════════ STYLE 2: TALL PORTRAIT (Deep Vertical, 270px x 280px) ═══════════════
                  cardStyle === 'tall-portrait' && [
                    "flex flex-col justify-between rounded-3xl bg-white p-5 sm:p-6 border border-zinc-200/80 shadow-sm hover:shadow-xl hover:border-zinc-300"
                  ],

                  // ═══════════════ STYLE 3: WIDE LANDSCAPE (2-Column Split, 480px x 180px) ═══════════════
                  cardStyle === 'wide-landscape' && [
                    "flex flex-row items-stretch justify-between rounded-2xl bg-white p-3.5 sm:p-4 border border-zinc-200/90 shadow-xs hover:shadow-md hover:border-zinc-300 gap-4"
                  ],

                  // ═══════════════ STYLE 4: SOFT CAPSULE (Pill Organic, 320px x 250px) ═══════════════
                  cardStyle === 'floating-capsule' && [
                    "flex flex-col justify-between rounded-[28px] bg-white p-5 sm:p-5.5 border border-zinc-200/70 shadow-md shadow-zinc-900/4 hover:shadow-xl hover:shadow-blue-500/8 hover:border-zinc-300 text-center"
                  ],

                  // ═══════════════ STYLE 5: NEO TICKET (Brutalist Tech, 290px x 235px) ═══════════════
                  cardStyle === 'neo-ticket' && [
                    "flex flex-col justify-between rounded-xl bg-white p-4 border-2 border-[#111827] shadow-[4px_4px_0px_#111827] hover:shadow-[6px_6px_0px_#111827] hover:-translate-x-0.5 hover:-translate-y-0.5"
                  ]
                )}
              >
                {/* ═══════════════ STYLE 3 RENDER: HORIZONTAL 2-COLUMN SPLIT ═══════════════ */}
                {cardStyle === 'wide-landscape' ? (
                  <>
                    {/* Left Column: Framed Square Canvas */}
                    <div className="w-28 sm:w-32 shrink-0 rounded-xl bg-zinc-50/90 border border-zinc-100/90 flex items-center justify-center p-2.5 overflow-hidden group-hover:bg-zinc-50 transition-colors">
                      <img
                        src={slide.src}
                        alt={slide.title}
                        className="w-full h-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Right Column: Content Body */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[9.5px] font-extrabold uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-200/80">
                            {slide.badge || slide.phase}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-zinc-400">
                            {slide.step || `0${idx + 1}`}
                          </span>
                        </div>
                        <h3 className="text-sm font-black tracking-tight text-[#111827] group-hover:text-blue-600 transition-colors truncate">
                          {slide.title}
                        </h3>
                        <p className="text-[11px] text-[#4B5563] leading-relaxed line-clamp-2 mt-0.5">
                          {slide.description}
                        </p>
                      </div>

                      <div className="pt-2 mt-1 border-t border-zinc-100 flex items-center justify-between text-[11px] font-extrabold">
                        <span className="text-[#111827] group-hover:text-blue-600 transition-colors flex items-center gap-1">
                          <span>{slide.button || 'Explore'}</span>
                          <ArrowRight size={11} className="transition-transform group-hover:translate-x-1" />
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400 uppercase">{slide.phase}</span>
                      </div>
                    </div>
                  </>
                ) : cardStyle === 'floating-capsule' ? (
                  /* ═══════════════ STYLE 4 RENDER: SOFT CAPSULE ═══════════════ */
                  <>
                    {/* Top Pill Badge */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-200/80">
                        {slide.badge || slide.phase}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded-md border border-zinc-100">
                        {slide.step || `0${idx + 1}`} / 0{slides.length}
                      </span>
                    </div>

                    {/* Centered Floating Circle Artwork */}
                    <div className="w-18 h-18 mx-auto my-1.5 rounded-2xl bg-zinc-50 border border-zinc-100/90 flex items-center justify-center p-2.5 ring-4 ring-zinc-50 group-hover:ring-blue-50 transition-all shadow-2xs">
                      <img
                        src={slide.src}
                        alt={slide.title}
                        className="w-full h-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>

                    {/* Body Text */}
                    <div className="space-y-1 my-1">
                      <h3 className="text-sm font-black tracking-tight text-[#111827] group-hover:text-blue-600 transition-colors leading-snug">
                        {slide.title}
                      </h3>
                      <p className="text-[11.5px] text-[#4B5563] leading-relaxed line-clamp-2 font-normal">
                        {slide.description}
                      </p>
                    </div>

                    {/* Bottom Centered Pill Button */}
                    <div className="pt-2 mt-2 border-t border-zinc-100/80 flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-zinc-50 hover:bg-[#111827] hover:text-white border border-zinc-200/80 text-[11px] font-extrabold text-[#111827] transition-all flex items-center gap-1.5">
                        <span>{slide.button || 'View Details'}</span>
                        <ArrowRight size={11} />
                      </span>
                    </div>
                  </>
                ) : cardStyle === 'tall-portrait' ? (
                  /* ═══════════════ STYLE 2 RENDER: TALL PORTRAIT ═══════════════ */
                  <>
                    {/* Header with Step Watermark Accent */}
                    <div className="flex items-center justify-between relative z-10 mb-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                        <span>{slide.badge || slide.phase}</span>
                      </div>
                      <span className="font-mono text-xs font-black text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-lg border border-zinc-200">
                        {slide.step || `0${idx + 1}`}
                      </span>
                    </div>

                    {/* Generous Artwork Canvas */}
                    <div className="relative w-full h-28 sm:h-32 my-2 rounded-2xl bg-zinc-50/90 border border-zinc-100/90 flex items-center justify-center p-3 overflow-hidden group-hover:bg-zinc-50 transition-colors shadow-2xs">
                      <img
                        src={slide.src}
                        alt={slide.title}
                        className="w-full h-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Body */}
                    <div className="space-y-1 relative z-10 pt-1 flex-1 flex flex-col justify-start">
                      <h3 className="text-base font-black tracking-tight text-[#111827] group-hover:text-blue-600 transition-colors leading-snug">
                        {slide.title}
                      </h3>
                      <p className="text-xs text-[#4B5563] leading-relaxed font-normal">
                        {slide.description}
                      </p>
                    </div>

                    {/* Bottom CTA */}
                    <div className="pt-3 mt-3 border-t border-zinc-100/90 flex items-center justify-between text-xs font-bold relative z-10">
                      <span className="text-[#111827] group-hover:text-blue-600 transition-colors flex items-center gap-1 font-extrabold text-xs">
                        <span>{slide.button || 'Explore Milestone'}</span>
                        <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                        {slide.phase}
                      </span>
                    </div>
                  </>
                ) : cardStyle === 'neo-ticket' ? (
                  /* ═══════════════ STYLE 5 RENDER: NEO TICKET ═══════════════ */
                  <>
                    {/* Monospace Header */}
                    <div className="flex items-center justify-between relative z-10 mb-1.5 pb-1.5 border-b border-dashed border-zinc-300">
                      <span className="font-mono text-[10px] font-black uppercase tracking-wider text-[#111827]">
                        [{slide.phase} // #{slide.step || `0${idx + 1}`}]
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-[#FEF08A] text-[#111827] border border-[#111827] text-[9.5px] font-black uppercase">
                        {slide.badge}
                      </span>
                    </div>

                    {/* Artwork */}
                    <div className="relative w-full h-22 my-1 rounded-lg bg-zinc-100 border border-[#111827] flex items-center justify-center p-2 overflow-hidden">
                      <img
                        src={slide.src}
                        alt={slide.title}
                        className="w-full h-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Body */}
                    <div className="space-y-1 relative z-10 pt-1 flex-1 flex flex-col justify-start">
                      <h3 className="text-sm font-black tracking-tight text-[#111827] leading-snug">
                        {slide.title}
                      </h3>
                      <p className="text-[11.5px] text-[#374151] leading-relaxed font-medium line-clamp-2">
                        {slide.description}
                      </p>
                    </div>

                    {/* Terminal Bottom CTA */}
                    <div className="pt-2 mt-2 border-t-2 border-[#111827] flex items-center justify-between text-[11px] font-black">
                      <span className="text-[#111827] flex items-center gap-1 font-mono">
                        <span>&gt; {slide.button || 'RUN'}</span>
                        <ArrowRight size={11} />
                      </span>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">SYS_OK</span>
                    </div>
                  </>
                ) : (
                  /* ═══════════════ STYLE 1 RENDER: COMPACT BENTO (DEFAULT) ═══════════════ */
                  <>
                    {/* Header: Neutral Phase Pill + Step Counter */}
                    <div className="flex items-center justify-between relative z-10 mb-1.5">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                        <span>{slide.badge || slide.phase || 'OJT Milestone'}</span>
                      </div>
                      <span className="font-mono text-[10.5px] font-bold text-zinc-400 bg-zinc-50 border border-zinc-100 px-1.5 py-0.5 rounded-md">
                        {slide.step || `0${idx + 1}`} / 0{slides.length}
                      </span>
                    </div>

                    {/* Center Illustration Frame */}
                    <div className="relative w-full h-22 sm:h-24 my-1 rounded-xl bg-zinc-50/90 border border-zinc-100/90 flex items-center justify-center p-2 overflow-hidden group-hover:bg-zinc-50 transition-colors shadow-2xs">
                      <img
                        src={slide.src}
                        alt={slide.title}
                        className="w-full h-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Body: Title & Full Readable Description */}
                    <div className="space-y-1 relative z-10 pt-1 flex-1 flex flex-col justify-start">
                      <h3 className="text-sm sm:text-base font-black tracking-tight text-[#111827] group-hover:text-blue-600 transition-colors leading-snug">
                        {slide.title}
                      </h3>
                      <p className="text-[11.5px] sm:text-xs text-[#4B5563] leading-relaxed font-normal line-clamp-2 sm:line-clamp-none">
                        {slide.description}
                      </p>
                    </div>

                    {/* Bottom: Micro-Action CTA */}
                    <div className="pt-2 mt-2 border-t border-zinc-100/90 flex items-center justify-between text-xs font-bold relative z-10">
                      <span className="text-[#111827] group-hover:text-blue-600 transition-colors flex items-center gap-1 font-extrabold text-[11.5px]">
                        <span>{slide.button || 'Explore Milestone'}</span>
                        <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                      </span>
                      <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                        {slide.phase}
                      </span>
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Simple Clean Circle Container with < and > Arrows */}
      <div className="mt-4 sm:mt-5 flex items-center justify-center gap-2.5 relative z-30">
        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={handlePrev}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-800 hover:bg-[#111827] hover:text-white hover:border-[#111827] transition-all cursor-pointer focus:outline-none"
          title="Previous"
          aria-label="Previous"
        >
          <ChevronLeft size={18} />
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleNext}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-800 hover:bg-[#111827] hover:text-white hover:border-[#111827] transition-all cursor-pointer focus:outline-none"
          title="Next"
          aria-label="Next"
        >
          <ChevronRight size={18} />
        </motion.button>
      </div>
    </div>
  );
};

export default Carousel;
