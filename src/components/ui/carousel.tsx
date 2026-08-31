import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

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
  onSlideChange?: (index: number) => void;
  className?: string;
}

export const Carousel: React.FC<CarouselProps> = ({
  slides,
  initialSlide = 0,
  onSlideChange,
  className
}) => {
  const [activeIndex, setActiveIndex] = useState(initialSlide);
  const total = slides ? slides.length : 0;

  const containerRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState<number>(280);
  const [gapWidth, setGapWidth] = useState<number>(18);
  const [visibleCount, setVisibleCount] = useState<number>(3);

  // Dynamic layout dimension calculation for Tall Portrait format
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.offsetWidth;
    const isMobile = window.innerWidth < 640;
    const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;

    if (isMobile) {
      setVisibleCount(1);
      setGapWidth(12);
      setCardWidth(width);
    } else if (isTablet) {
      setVisibleCount(2);
      setGapWidth(16);
      setCardWidth((width - 16) / 2);
    } else {
      setVisibleCount(3);
      setGapWidth(18);
      setCardWidth((width - 36) / 3);
    }
  }, []);

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

  return (
    <div className={cn("relative w-full select-none", className)}>
      {/* Continuous Physical Sliding Viewport */}
      <div ref={containerRef} className="overflow-hidden w-full max-w-5xl mx-auto py-2 px-1">
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
                key={`slide-card-tall-${idx}`}
                style={{
                  width: `${cardWidth}px`,
                  minWidth: `${cardWidth}px`
                }}
                whileHover={{
                  y: -5,
                  transition: { duration: 0.2, ease: 'easeOut' }
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (slide.onClick) slide.onClick();
                  handleSlideSelect(idx);
                }}
                className={cn(
                  "group relative flex flex-col justify-between rounded-3xl bg-white p-5 sm:p-6 border border-zinc-200/90 shadow-sm hover:shadow-xl hover:border-zinc-300 transition-all duration-300 cursor-pointer overflow-hidden transform-gpu"
                )}
              >
                {/* Header: Phase Badge + Step Indicator Pill */}
                <div className="flex items-center justify-between relative z-10 mb-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                    <span>{slide.badge || slide.phase}</span>
                  </div>
                  <span className="font-mono text-xs font-black text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-lg border border-zinc-200">
                    {slide.step || `0${idx + 1}`}
                  </span>
                </div>

                {/* Generous Artwork Canvas Stage */}
                <div className="relative w-full h-28 sm:h-32 my-2 rounded-2xl bg-zinc-50/90 border border-zinc-100/90 flex items-center justify-center p-3 overflow-hidden group-hover:bg-zinc-50 transition-colors shadow-2xs">
                  <img
                    src={slide.src}
                    alt={slide.title}
                    className="w-full h-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Body Content */}
                <div className="space-y-1 relative z-10 pt-1 flex-1 flex flex-col justify-start">
                  <h3 className="text-base font-black tracking-tight text-[#111827] group-hover:text-blue-600 transition-colors leading-snug">
                    {slide.title}
                  </h3>
                  <p className="text-xs text-[#4B5563] leading-relaxed font-normal">
                    {slide.description}
                  </p>
                </div>

                {/* Bottom CTA Action Row */}
                <div className="pt-3 mt-3 border-t border-zinc-100/90 flex items-center justify-between text-xs font-bold relative z-10">
                  <span className="text-[#111827] group-hover:text-blue-600 transition-colors flex items-center gap-1 font-extrabold text-xs">
                    <span>{slide.button || 'Explore Milestone'}</span>
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                    {slide.phase}
                  </span>
                </div>
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
