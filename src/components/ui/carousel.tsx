import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SlideData {
  title: string;
  step?: string;
  phase?: 'Pre-OJT' | 'In-OJT' | 'Finals' | 'Partnership' | 'Milestone';
  badge?: string;
  description: string;
  deliverables?: string[];
  src: string;
  color?: string;
  link?: string;
  button?: string;
  onClick?: () => void;
}

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
  const [cardWidth, setCardWidth] = useState<number>(300);
  const [gapWidth, setGapWidth] = useState<number>(16);
  const [visibleCount, setVisibleCount] = useState<number>(3);

  // Responsive layout measurement
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.offsetWidth;
    if (window.innerWidth < 640) {
      setVisibleCount(1);
      setGapWidth(12);
      setCardWidth(width);
    } else if (window.innerWidth < 1024) {
      setVisibleCount(2);
      setGapWidth(16);
      setCardWidth((width - 16) / 2);
    } else {
      setVisibleCount(3);
      setGapWidth(16);
      setCardWidth((width - 32) / 3);
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
                key={`slide-card-${idx}`}
                style={{
                  width: `${cardWidth}px`,
                  minWidth: `${cardWidth}px`
                }}
                whileHover={{
                  y: -4,
                  transition: { duration: 0.2, ease: 'easeOut' }
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (slide.onClick) slide.onClick();
                  handleSlideSelect(idx);
                }}
                className={cn(
                  "group relative flex flex-col justify-between rounded-2xl bg-white p-4 sm:p-4.5 transition-all duration-300 cursor-pointer overflow-hidden border border-zinc-200/90 transform-gpu shadow-xs hover:shadow-md hover:border-zinc-300 opacity-100"
                )}
              >
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
